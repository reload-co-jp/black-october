// Refreshes data/vulnerabilities.json from NVD.
// NVD-owned facts are overwritten; curated text is only filled when empty.
// Usage: node scripts/fetch-cves.ts [CVE-ID ...]   (NVD_API_KEY raises the rate limit)
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { fromNvd, mergeNvd } from "../lib/nvd.ts"
import { COLLECTIONS, validateDb } from "../lib/validation.ts"

const url = (c: string) => new URL(`../data/${c}.json`, import.meta.url)
const all = Object.fromEntries(COLLECTIONS.map((c) => [c, JSON.parse(readFileSync(url(c), "utf8"))]))
const rows: Record<string, unknown>[] = all.vulnerabilities
const only = process.argv.slice(2).map((s) => s.toUpperCase())
const key = process.env.NVD_API_KEY

for (const [i, row] of rows.entries()) {
  const cve = String(row.cveId)
  if (only.length && !only.includes(cve)) continue
  // NVD allows 5 requests / 30s without a key, 50 with one.
  if (i) await new Promise((r) => setTimeout(r, key ? 700 : 6500))
  const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cve}`, {
    headers: key ? { apiKey: key } : {},
  })
  const fields = res.ok ? fromNvd(await res.json()) : null
  if (!fields) {
    console.log(`skip ${cve}: ${res.ok ? "not in NVD" : `HTTP ${res.status}`}`)
    continue
  }
  const { row: merged, changed } = mergeNvd(row, fields)
  rows[i] = merged
  console.log(`${cve}: ${changed.length ? changed.join(", ") : "no change"}`)
}

const errors = validateDb(all as Parameters<typeof validateDb>[0])
if (errors.length) {
  console.error(errors.join("\n"))
  process.exit(1)
}
mkdirSync(new URL("../data/.backup/", import.meta.url), { recursive: true })
copyFileSync(url("vulnerabilities"), new URL(`../data/.backup/vulnerabilities-${Date.now()}.json`, import.meta.url))
writeFileSync(url("vulnerabilities"), JSON.stringify(rows, null, 2) + "\n")
