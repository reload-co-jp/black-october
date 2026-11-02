# インシデント・不正アクセス報道の収集手順

BLACK OCTOBER に載せるインシデント候補を、ニュースから集めて `data/candidates.json` に積むまでの
ソースと手順をまとめたもの。`scripts/fetch-incidents.ts` はこの手順の実装だが、スクリプトを使わない
コーディングエージェント（WebFetch / curl などで直接取得するもの）も同じ手順・同じ出力形式で作業できる
ようにしている。

- 取得元の一覧（機械可読）: [`data/news-sources.json`](../data/news-sources.json)
- 取得元のスキーマ: [`lib/news-sources.ts`](../lib/news-sources.ts)（Zod。`pnpm test` で検証）
- 登録先データのスキーマ: [`lib/validation.ts`](../lib/validation.ts)
- 実装: [`scripts/fetch-incidents.ts`](../scripts/fetch-incidents.ts)（記事）、[`scripts/fetch-cves.ts`](../scripts/fetch-cves.ts)（CVE）

## 1. 取得元 (`data/news-sources.json`)

```jsonc
{
  "version": 1,
  "titleKeywords": ["不正アクセス", "情報漏えい", ...], // タイトル一次フィルタ（部分一致・いずれか）
  "sources": [
    {
      "id": "security-next",          // 英小文字・数字・ハイフン。一意
      "name": "Security NEXT",
      "url": "https://www.security-next.com/feed",
      "pages": { "from": 1, "to": 20 }, // 任意。url 内の {page} を from..to に展開
      "format": "rss2",               // rss2 | rss1 (RDF) | json
      "kind": "media",                // media | blog | aggregator | official | government | vulnerability-db
      "language": "ja",
      "sourceType": "media",          // 記事を data/sources.json に登録するときの sourceType
      "reliability": "secondary",     // 同 reliability（primary = 当事者・公的機関の一次情報）
      "usedBy": ["fetch-incidents"],  // fetch-incidents | fetch-cves
      "enabled": true,
      "notes": "..."
    }
  ]
}
```

| id                         | 種別                         | 形式                | 用途                                   |
| -------------------------- | ---------------------------- | ------------------- | -------------------------------------- |
| `security-next`            | 国内セキュリティ専門メディア | RSS 2.0             | 被害公表の速報（主力）                 |
| `itmedia-news-security`    | 国内IT メディア              | RSS 2.0             | 記事                                   |
| `scan-netsecurity`         | 国内セキュリティ専門メディア | RSS 1.0             | 記事（一部会員限定）                   |
| `piyolog`                  | ブログ                       | RSS 2.0             | 経緯整理・一次情報リンク               |
| `itmedia-enterprise`       | 国内IT メディア              | RSS 2.0             | 記事（キーワード絞り込み必須）         |
| `mynavi-techplus-security` | 国内IT メディア              | RSS 2.0             | 記事                                   |
| `internet-watch`           | 国内IT メディア              | RSS 1.0             | 記事                                   |
| `cybersecurity-jp`         | まとめサイト                 | RSS 2.0 × 20 ページ | 過去記事の遡り                         |
| `cisa-kev`                 | 米政府                       | JSON                | 悪用確認済み CVE（`fetch-cves --kev`） |
| `nvd`                      | 米政府                       | JSON API            | CVE 詳細（`{cveId}` を置換）           |

取得元を足す・止めるときは JSON だけを編集する（スクリプトの変更は不要）。追加後は `pnpm test` で
スキーマ検証を通すこと。`fetch-incidents` が解析できるのは `<item>` 要素を持つ RSS 1.0 / 2.0 のみ。
Atom フィードを足す場合はクローラー側の対応も必要。

## 2. 手順

### 2.1 フィード取得と一次フィルタ

1. `usedBy` に `fetch-incidents` を含み `enabled: true` の各ソースについて、`url`（`pages` があれば展開）を取得する。
   User-Agent は `Mozilla/5.0 (black-october crawler)`。失敗時は 3 秒待って 1 回だけ再試行。
2. 各 `<item>` から `<title>` と `<link>` を取り出す（CDATA・タグ・HTML エンティティを除去）。
3. 次のどれかに当たる記事は捨てる。
   - タイトルが `titleKeywords` のどれも含まない
   - URL が処理済み: `data/candidates.json` の `seen[]`、または `data/sources.json` の `url` に存在

### 2.2 本文取得と抽出

記事本文を取得し、`script` / `style` / `nav` / `header` / `footer` を除いたテキストにして、
次の方針でインシデントを 1 件抽出する（`fetch-incidents` では Claude にこれを構造化出力させている。
スキーマは同スクリプトの `Draft`）。

- 対象は **日本の組織が被害を受けた個別の不正アクセス・情報漏洩など**。
  脆弱性情報・統計・注意喚起・海外組織の事件・まとめ記事は対象外（`relevant: false`）。
- 記事に書かれた事実だけを使う。不明な値は `null` / 空文字 / 空配列、または
  `unknown` / `unconfirmed` / `under_investigation`。推測で原因・攻撃手法を埋めない。
- 日付は `YYYY-MM-DD`、文章は日本語、slug は英小文字・数字・ハイフンのみ。
  `disclosedAt` が不明なら記事の公開日。
- CVE は「その事件の原因・侵入経路として本文に書かれたもの」だけ（関連記事欄などは除く）。
- 既存インシデント（`data/incidents.json`）や未処理の候補と同じ事件（続報・別媒体の記事を含む）なら、
  その id を `sameAs` にする。

抽出が済んだら（対象外でも）その URL を `seen[]` に追加する。取得・抽出に失敗した URL は追加せず、
次回再試行させる。

### 2.3 候補の登録 (`data/candidates.json`)

`data/candidates.json` は Git 管理外のキュー。形は `{ "seen": string[], "items": Candidate[] }`。

```ts
type Candidate = {
  id: string // "cand-<base36 時刻>"
  url: string // 最初に見つけた記事
  updateOf: string | null // 既存インシデントの続報なら その incident id
  organization: Row | null // data/organizations.json に未登録なら新規行、登録済みなら null
  sources: Row[] // data/sources.json に追加する行
  vulnerabilities?: Row[] // data/vulnerabilities.json に未登録の CVE 行（NVD で補完）
  incident: Row // data/incidents.json の行（続報なら差分のみ）
}
```

`sameAs` に応じて次のどれか 1 つを行う。

| 状況                       | 処理                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------- |
| 未処理の候補と同じ事件     | その候補の `sources` に記事を追加し、`incident.sourceIds` / `vulnerabilityIds` にも追加 |
| 公開済みインシデントの続報 | `updateOf` 付き候補を作る（既にあればそこへ記事を追加）                                 |
| 新規                       | 新しい候補を作る。id は `inc-<年>-<slug>`、slug は `<slug>-<YYYY-MM>`                   |

出典行は次の形で作る。`sourceType` / `reliability` は取得元の値をそのまま使う。

```json
{
  "id": "src-<slug>-<base36 時刻>",
  "title": "<記事タイトル>",
  "url": "<記事URL>",
  "publisher": "<媒体名>",
  "publishedAt": "YYYY-MM-DD",
  "sourceType": "media",
  "reliability": "secondary",
  "retrievedAt": "<取得日>"
}
```

### 2.4 レビューと反映

候補は自動では公開しない。`pnpm dev` → `/admin/` の「自動取得の候補」から人が確認し、必要なら
一次情報（当事者の公表、`sourceType: official` / `reliability: primary`）を出典に追加してから保存する。
保存時に `lib/validation.ts` で全データが検証される。

## 3. 実行方法

```bash
pnpm fetch:incidents        # 全件
pnpm fetch:incidents 10     # 新着 10 件まで
pnpm fetch:cves --kev 14    # 直近 14 日に CISA KEV に追加された CVE
```

`fetch:incidents` は `claude` CLI（Claude Code のログイン）を使う。CLI を使えないエージェントは、
2.1〜2.3 を自分で実行し、同じ形式で `data/candidates.json` に書けば管理画面からそのままレビューできる。
`data/*.json` を直接編集した場合は `pnpm validate` を通すこと。
