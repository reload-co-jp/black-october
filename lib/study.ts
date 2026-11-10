import { SEVERITY_ORDER } from "./labels"
import { Incident } from "./validation"

/**
 * Study themes for the /study/ board. Cause factors in the data are free text,
 * so incidents are grouped by keyword match over what was actually published
 * (title, summary, cause, technical notes) — never by guessing a cause.
 */
export type Theme = {
  id: string
  name: string
  description: string
  /** Substring match, case-insensitive. */
  keywords: string[]
  /** Incident categories that imply the theme regardless of wording. */
  categories: Incident["categories"]
  /** Discussion starters: "what about my own service?" */
  questions: string[]
  /** Related technique slugs (data/techniques.json). */
  techniques: string[]
}

export const THEMES: Theme[] = [
  {
    id: "auth",
    name: "認証・アカウント",
    description:
      "盗まれた・推測された認証情報による不正ログイン。パスワードだけに頼る認証、使い回し、総当たりへの耐性不足が入口になる。",
    keywords: [
      "認証情報",
      "パスワード",
      "不正ログイン",
      "ログイン情報",
      "アカウント情報",
      "多要素",
      "二要素",
      "総当たり",
      "ブルートフォース",
      "リスト型",
      "なりすまし",
      "乗っ取",
      "id・パスワード",
    ],
    categories: [],
    questions: [
      "管理画面・社内ツール・クラウドのログインは多要素認証が必須になっているか？",
      "退職者・委託先・共有アカウントの棚卸しを最後にやったのはいつか？",
      "普段と違う場所・時間帯からのログインに気づける仕組みはあるか？",
    ],
    techniques: ["credential-theft", "credential-stuffing", "valid-accounts"],
  },
  {
    id: "vulnerability",
    name: "脆弱性・パッチ管理",
    description:
      "公開サーバーやミドルウェア、VPN機器、OSSの脆弱性を突かれた事例。把握していない資産と、修正適用までの時間差が狙われる。",
    keywords: [
      "脆弱性",
      "パッチ",
      "未更新",
      "アップデート",
      "ゼロデイ",
      "cve-",
      "サポート終了",
    ],
    categories: ["vulnerability"],
    questions: [
      "外部公開している資産と依存ライブラリの一覧を、いますぐ出せるか？",
      "緊急の修正が公開されてから本番に適用するまで、何日かかるか？",
      "すぐに更新できないとき、WAFや経路の遮断など代わりの手段を持っているか？",
    ],
    techniques: [
      "vulnerability-exploitation",
      "remote-code-execution",
      "zero-day-exploitation",
    ],
  },
  {
    id: "web-app",
    name: "Webアプリ・API",
    description:
      "アプリケーション自身の欠陥。入力値の検証漏れ、認可チェックの不足、APIの過剰な応答、決済ページの改ざんなど、開発者が直接作り込みうる問題。",
    keywords: [
      "sqlインジェクション",
      "インジェクション",
      "クロスサイト",
      "xss",
      "api",
      "改ざん",
      "スキミング",
      "トラバーサル",
      "webシェル",
      "アクセス制御の不備",
      "認可",
      "フォーム",
      "他ユーザー",
      "他の利用者",
      "機械的",
      "連続的",
    ],
    categories: [],
    questions: [
      "IDを書き換えるだけで他人のデータが取れるAPIは残っていないか？（認可チェックの場所）",
      "外部から読み込んでいるスクリプトや決済ページの改ざんに気づけるか？",
      "機械的な大量リクエストを制限・検知できているか？",
    ],
    techniques: [
      "sql-injection",
      "cross-site-scripting",
      "remote-code-execution",
    ],
  },
  {
    id: "supply-chain",
    name: "委託先・サプライチェーン",
    description:
      "自社ではなく委託先・利用中のSaaS・共通基盤が侵害され、預けていたデータが漏れた事例。契約と技術の両面で被害範囲を絞れるかが問われる。",
    keywords: [
      "委託",
      "saas",
      "外部サービス",
      "サプライチェーン",
      "ベンダー",
      "取引先",
      "提供元",
      "oem",
      "クラウドサービス事業者",
    ],
    categories: ["supply-chain"],
    questions: [
      "委託先・SaaSに渡しているデータの種類と件数を把握しているか？",
      "役目を終えたデータが外部サービスに残り続けていないか？",
      "委託先で事故が起きたとき、通知を受ける経路と自社側で止める手段はあるか？",
    ],
    techniques: ["supply-chain"],
  },
  {
    id: "ransomware",
    name: "ランサムウェア",
    description:
      "侵入後にデータを暗号化・窃取して脅迫する攻撃。侵入口よりも、侵入後に横に広がれたこと、バックアップごと失ったことが被害を大きくする。",
    keywords: ["ランサム", "身代金", "暗号化され"],
    categories: ["ransomware"],
    questions: [
      "バックアップは本番と別の権限・別の場所にあり、復元を実際に試したことがあるか？",
      "1台が侵害されたとき、同じネットワークのどこまで到達できるか？",
      "主要システムが1週間止まった場合の業務継続手順はあるか？",
    ],
    techniques: ["ransomware", "privilege-escalation"],
  },
  {
    id: "misconfiguration",
    name: "設定不備・公開範囲",
    description:
      "攻撃というより、設定ミスや公開範囲の誤りで情報が見える状態になっていた事例。クラウドストレージや管理機能の公開設定が典型。",
    keywords: [
      "設定不備",
      "設定ミス",
      "設定の不備",
      "設定誤り",
      "誤設定",
      "公開状態",
      "閲覧可能",
      "閲覧できる状態",
      "外部から取得可能",
      "アクセス権",
    ],
    categories: ["misconfiguration"],
    questions: [
      "クラウドストレージや管理画面の公開範囲を、定期的に機械で点検しているか？",
      "検証環境・古い環境が本番データを持ったまま放置されていないか？",
      "設定変更をレビュー・記録する仕組み（IaC、変更履歴）はあるか？",
    ],
    techniques: ["misconfiguration"],
  },
  {
    id: "phishing",
    name: "フィッシング・マルウェア",
    description:
      "偽サイトへの誘導や不正なプログラムの実行を起点に、端末や認証情報を奪われた事例。人をだます手口は技術的対策と組み合わせて防ぐ。",
    keywords: [
      "フィッシング",
      "偽サイト",
      "偽装サイト",
      "不審メール",
      "標的型",
      "マルウェア",
      "不正プログラム",
      "不正なプログラム",
      "ウイルス",
      "スティーラー",
    ],
    categories: ["phishing", "malware"],
    questions: [
      "フィッシングでパスワードを入力しても突破されない認証（パスキー等）を使えているか？",
      "開発者の端末に保存されたトークンや鍵が盗まれたら、何にアクセスできるか？",
      "不審なメールや挙動を、気軽に報告できる窓口があるか？",
    ],
    techniques: ["phishing", "credential-theft"],
  },
  {
    id: "secrets",
    name: "鍵・秘密情報・データ保管",
    description:
      "APIキーやシークレットの置き場所、パスワードの保管方式、ログに残った個人情報など、データの持ち方が被害の大きさを決めた事例。",
    keywords: [
      "シークレット",
      "apiキー",
      "アクセスキー",
      "トークン",
      "復号",
      "平文",
      "ハッシュ化",
      "可逆暗号",
      "鍵の",
      "ログファイル",
      "ログとして",
      "保管されたまま",
      "残っていた",
    ],
    categories: [],
    questions: [
      "シークレットがリポジトリ・設定ファイル・ログに平文で残っていないか？",
      "パスワードは適切なアルゴリズムでハッシュ化されているか？",
      "不要になった個人情報を消す期限と手順は決まっているか？",
    ],
    techniques: ["credential-theft"],
  },
  {
    id: "ai",
    name: "AIと開発・運用",
    description:
      "生成AIサービスへの情報入力や、AIを使った攻撃の効率化が関わる事例。AIを使う側・使われる側の両方から考える。",
    keywords: [
      "生成ai",
      "aiを用い",
      "aiを使",
      "aiサービス",
      "aiエージェント",
      "llm",
      "チャットボット",
    ],
    categories: [],
    questions: [
      "生成AIやコーディングエージェントに渡してよい情報の範囲は決まっているか？",
      "AIが書いたコードの認可・入力検証を、人が確認しているか？",
      "エージェントに与えた権限（トークン、シェル、本番アクセス）は必要最小限か？",
    ],
    techniques: [],
  },
  {
    id: "insider",
    name: "内部不正・人的ミス",
    description:
      "関係者による持ち出しや、誤送信・誤操作など人の行為に起因する事例。善意のミスも前提にした仕組みが要る。",
    keywords: [
      "内部関係者",
      "内部不正",
      "元従業員",
      "従業員による",
      "職員による",
      "誤送信",
      "誤掲載",
      "誤って",
      "紛失",
      "ルールへの違反",
    ],
    categories: [],
    questions: [
      "大量のデータ取得・持ち出しを検知できるか？",
      "一人の操作ミスが、そのまま外部公開や誤送信にならない仕組みがあるか？",
      "権限は業務に必要な範囲に絞られているか？",
    ],
    techniques: [],
  },
]

export const getTheme = (id: string) => THEMES.find((t) => t.id === id)

type Classifiable = Pick<
  Incident,
  "title" | "summary" | "cause" | "technicalNotes" | "categories"
>

/** Theme ids for an incident, in THEMES order. */
export const classify = (i: Classifiable): string[] => {
  const text = [
    i.title,
    i.summary,
    i.cause.description,
    ...i.cause.factors,
    i.technicalNotes,
  ]
    .join("\n")
    .toLowerCase()
  return THEMES.filter(
    (t) =>
      t.categories.some((c) => i.categories.includes(c)) ||
      t.keywords.some((k) => text.includes(k))
  ).map((t) => t.id)
}

/** Slim incident row shipped to the client for the study board. */
export type StudyRow = {
  slug: string
  title: string
  summary: string
  organization: string
  organizationSlug: string
  industry: string
  incidentDate: string | null
  discoveredAt: string | null
  disclosedAt: string
  severity: string
  categories: string[]
  affectedUsers: number | null
  leaked: string[]
  causeStatus: string
  cause: string
  factors: string[]
  measures: string[]
  lessons: string[]
  themes: string[]
  sources: { title: string; url: string; publisher: string; primary: boolean }[]
}

export type StudyQuery = {
  q: string
  theme: string
  month: string
  /** Only incidents whose cause has been published at least partially. */
  knownCause: boolean
  sort: "disclosed" | "severity" | "affected"
}

export const EMPTY_STUDY_QUERY: StudyQuery = {
  q: "",
  theme: "",
  month: "",
  knownCause: false,
  sort: "disclosed",
}

export const hasKnownCause = (r: Pick<StudyRow, "causeStatus">) =>
  r.causeStatus !== "under_investigation"

export const filterStudyRows = (rows: StudyRow[], q: StudyQuery) => {
  const words = q.q.toLowerCase().split(/\s+/).filter(Boolean)
  const hit = rows.filter((r) => {
    const text = [
      r.title,
      r.summary,
      r.organization,
      r.industry,
      r.cause,
      ...r.factors,
      ...r.lessons,
    ]
      .join(" ")
      .toLowerCase()
    return (
      words.every((w) => text.includes(w)) &&
      (!q.theme || r.themes.includes(q.theme)) &&
      (!q.month || r.disclosedAt.startsWith(q.month)) &&
      (!q.knownCause || hasKnownCause(r))
    )
  })
  const newest = (a: StudyRow, b: StudyRow) =>
    b.disclosedAt.localeCompare(a.disclosedAt)
  const sorters: Record<
    StudyQuery["sort"],
    (a: StudyRow, b: StudyRow) => number
  > = {
    disclosed: newest,
    severity: (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
      newest(a, b),
    affected: (a, b) =>
      (b.affectedUsers ?? -1) - (a.affectedUsers ?? -1) || newest(a, b),
  }
  return hit.sort(sorters[q.sort] ?? newest)
}

/** 37620000 → "3,762万", 50000 → "5万", 1234 → "1,234". */
export const formatPeople = (n: number) =>
  n >= 10000
    ? `${(Math.round(n / 1000) / 10).toLocaleString("ja-JP")}万`
    : n.toLocaleString("ja-JP")
