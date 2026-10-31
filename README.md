# BLACK OCTOBER — 2026 Cybersecurity Incident Archive

2026年10月に発生・公表されたサイバーセキュリティインシデントを、一次情報に基づいて
経緯・原因・影響・対応・教訓まで整理する静的サイト。

- Next.js 16 (App Router / Static Export) + React 19 + TypeScript
- データは `data/*.json` のみ（DBなし）。ビルド時に全ページを静的生成
- スタイルは inline style（CSS-in-JS）。Tailwind 不使用

## コマンド

| コマンド | 説明 |
| --- | --- |
| `pnpm dev` | 開発サーバー（`/admin` 管理画面が有効） |
| `pnpm build` | データ検証 → 静的サイトを `out/` に出力 |
| `pnpm validate` | JSON のスキーマ・参照整合性チェック |
| `pnpm test` / `pnpm lint` / `pnpm typecheck` | テスト / Lint / 型チェック |

## データ

| ファイル | 内容 |
| --- | --- |
| `data/incidents.json` | インシデント（続報は `timeline` に追記し、同一レコードに統合） |
| `data/vulnerabilities.json` | 脆弱性（CVE） |
| `data/techniques.json` | 攻撃手法（`slug` をインシデントの `attackMethods` から参照） |
| `data/organizations.json` | 組織 |
| `data/sources.json` | 出典（全レコードから `sourceIds` で参照） |

- スキーマは `lib/validation.ts`（Zod）。重複ID・重複slug・不正参照・日付の前後関係も検出
- 不明な値は `null` / 空配列。未公表の原因・攻撃手法は登録しない（`cause.status: under_investigation`）
- 関連付けはどちら側に書いてもよい（例: `incident.vulnerabilityIds` と `vulnerability.incidentIds` は統合して表示）
- 検証は `prebuild` と `lib/data.ts` 読み込み時の両方で実行され、不正データではビルドが失敗する

## 管理画面（開発環境専用）

`pnpm dev` → http://localhost:3000/admin/

- フォームで各 JSON を作成・編集・削除。タイムライン追加＝続報登録、ID 配列はチェックボックスで関連付け
- API: `GET/POST /api/admin/{collection}`、`GET/PUT/DELETE /api/admin/{collection}/{id}`
- 保存前に最新ファイルを読み直し、全データを検証してから書き込み（一時ファイル → rename）
- 書き込み前のファイルは `data/.backup/`（Git 管理外）に保存
- `collection` はホワイトリスト照合のみでパスに使用（パストラバーサル不可）
- 参照されているレコードの削除は検証エラーで拒否

本番除外の仕組み: 管理画面と API は `*.dev.tsx` / `*.dev.ts` で、`next.config.js` の
`pageExtensions` が開発時のみこの拡張子を登録する。本番ビルドにはルート自体が存在しない
（さらに API は `NODE_ENV !== "development"` で 404 を返す）。

## デプロイ

`main` への push で GitHub Pages にデプロイ。canonical / sitemap / OGP の URL は
リポジトリ変数 `SITE_URL`（→ `NEXT_PUBLIC_SITE_URL`）で設定する。
