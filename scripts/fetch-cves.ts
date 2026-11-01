// Refreshes data/vulnerabilities.json from NVD.
// NVD-owned facts are overwritten; curated text is only filled when empty.
// Usage: node scripts/fetch-cves.ts [CVE-ID ...]   (NVD_API_KEY raises the rate limit)
//        node scripts/fetch-cves.ts --kev [days]  adds CVEs CISA added to KEV in the last N days (default 14)
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { fromNvd, mergeNvd } from "../lib/nvd.ts"
import { COLLECTIONS, validateDb } from "../lib/validation.ts"

const url = (c: string) => new URL(`../data/${c}.json`, import.meta.url)
const all = Object.fromEntries(COLLECTIONS.map((c) => [c, JSON.parse(readFileSync(url(c), "utf8"))]))
const rows: Record<string, unknown>[] = all.vulnerabilities
const args = process.argv.slice(2)
let only = args.map((s) => s.toUpperCase())

if (args[0] === "--kev") {
  type Kev = { cveID: string; vulnerabilityName: string; dateAdded: string; shortDescription: string; requiredAction: string }
  const since = new Date(Date.now() - (Number(args[1]) || 14) * 864e5).toISOString().slice(0, 10)
  const res = await fetch("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json")
  if (!res.ok) throw new Error(`KEV feed HTTP ${res.status}`)
  const known = new Set(rows.map((r) => r.cveId))
  const added = ((await res.json()).vulnerabilities as Kev[]).filter((k) => k.dateAdded >= since && !known.has(k.cveID))
  // KEV's own text seeds the row; the NVD pass below fills in the rest.
  for (const k of added)
    rows.push({
      id: `vuln-${k.cveID.toLowerCase()}`, cveId: k.cveID, title: k.vulnerabilityName, description: k.shortDescription,
      cvssScore: null, cvssVector: null, cweId: null, affectedProducts: [], fixedVersions: [], publishedAt: null,
      modifiedAt: null, kevStatus: true, exploitation: `CISA KEV登録（${k.dateAdded}）`, mitigation: [k.requiredAction],
      incidentIds: [], sourceIds: all.sources.some((s: { id: string }) => s.id === "src-cisa-kev") ? ["src-cisa-kev"] : [],
    })
  console.log(`${added.length} new KEV CVE(s) since ${since}`)
  only = added.map((k) => k.cveID)
  if (!only.length) process.exit(0)
}
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
