// `data/candidates.json` に溜まった全候補をメインデータに反映し、キューをクリアする。
// 管理画面 /admin/ の保存ロジック（organizations/sources/vulnerabilities を先に作成し、
// incident を登録・更新してから candidate を削除）を一括で実行する。
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { validateDb, schemas, COLLECTIONS, type Collection } from "../lib/validation.ts"

const file = (f: string) => new URL(`../data/${f}.json`, import.meta.url)
const read = (f: string) => JSON.parse(readFileSync(file(f), "utf8"))
const today = new Date().toISOString().slice(0, 10)

const candidates = read("candidates") as { seen: string[]; items: any[] }
const db: Record<string, any[]> = {}
for (const c of COLLECTIONS) db[c] = read(c)

const addIfMissing = (c: Collection, row: any) => {
  if (!db[c].some((r: any) => r.id === row.id)) db[c].push(row)
}

let created = 0
let updated = 0

for (const cand of candidates.items) {
  // 1. 参照先行を先に作成（organization / sources / vulnerabilities）
  if (cand.organization) addIfMissing("organizations", cand.organization)
  for (const s of cand.sources) addIfMissing("sources", s)
  for (const v of (cand.vulnerabilities ?? [])) addIfMissing("vulnerabilities", v)

  const inc = cand.incident
  if (cand.updateOf) {
    // 続報：既存インシデントに出典・脆弱性をマージして更新
    const existing = db["incidents"].find((i: any) => i.id === cand.updateOf)
    if (existing) {
      existing.sourceIds = [...new Set([...(existing.sourceIds ?? []), ...(inc.sourceIds ?? [])])]
      existing.vulnerabilityIds = [...new Set([...(existing.vulnerabilityIds ?? []), ...(inc.vulnerabilityIds ?? [])])]
      existing.updatedAt = today
      updated++
    } else {
      console.warn(`updateOf 先が見つかりません: ${cand.updateOf} （スキップ）`)
    }
  } else {
    // 新規インシデント
    addIfMissing("incidents", inc)
    created++
  }
}

// candidates の items をクリア（seen は処理済みURLとして保持）
candidates.items = []
writeFileSync(file("candidates"), JSON.stringify(candidates, null, 2) + "\n")

// 各データファイルを保存
for (const c of COLLECTIONS) {
  writeFileSync(file(c), JSON.stringify(db[c], null, 2) + "\n")
}

// バリデーション
const raw: Record<string, unknown> = {}
for (const c of COLLECTIONS) raw[c] = db[c]
const errors = validateDb(raw)
if (errors.length) {
  console.error("バリデーションエラー:")
  for (const e of errors) console.error(" -", e)
  process.exit(1)
}

console.log(`完了: 新規 ${created} 件 / 更新 ${updated} 件`)
console.log(`incidents=${db.incidents.length} organizations=${db.organizations.length} sources=${db.sources.length} vulnerabilities=${db.vulnerabilities.length}`)
