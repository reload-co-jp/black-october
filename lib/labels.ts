export const SEVERITY: Record<string, string> = {
  critical: "緊急",
  high: "高",
  medium: "中",
  low: "低",
  unknown: "不明",
}
export const SEVERITY_ORDER = ["critical", "high", "medium", "low", "unknown"]
export const SEVERITY_COLOR: Record<string, string> = {
  critical: "#cf222e",
  high: "#bc4c00",
  medium: "#9a6700",
  low: "#0550ae",
  unknown: "#6e7781",
}

export const STATUS: Record<string, string> = {
  investigating: "調査中",
  contained: "封じ込め済み",
  recovered: "復旧済み",
  resolved: "対応完了",
  unknown: "不明",
}

export const VERIFICATION: Record<string, string> = {
  confirmed: "確認済み",
  partially_confirmed: "一部確認",
  unconfirmed: "未確認",
  under_investigation: "調査中",
  possible: "可能性あり",
  unknown: "不明",
}

export const CATEGORY: Record<string, string> = {
  vulnerability: "脆弱性",
  "unauthorized-access": "不正アクセス",
  "data-breach": "情報漏洩",
  ransomware: "ランサムウェア",
  "supply-chain": "サプライチェーン攻撃",
  malware: "マルウェア感染",
  misconfiguration: "設定不備",
  phishing: "フィッシング",
  ddos: "DDoS",
  other: "その他",
}

export const SOURCE_TYPE: Record<string, string> = {
  official: "公式発表",
  advisory: "セキュリティアドバイザリ",
  government: "公的機関",
  media: "報道",
  research: "技術レポート",
}

export const COUNTRY: Record<string, string> = {
  JP: "日本",
  US: "米国",
  GB: "英国",
  DE: "ドイツ",
  FR: "フランス",
  KR: "韓国",
  CN: "中国",
  TW: "台湾",
  AU: "オーストラリア",
  CA: "カナダ",
  XX: "国際",
}

export const label = (map: Record<string, string>, key: string) =>
  map[key] ?? key

export const cvssSeverity = (s: number | null) =>
  s == null ? "unknown" : s >= 9 ? "critical" : s >= 7 ? "high" : s >= 4 ? "medium" : "low"
