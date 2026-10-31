import { cvssSeverity } from "./labels"
import { Db, Incident } from "./validation"

export type Count = { key: string; count: number }

const tally = (keys: string[]): Count[] => {
  const m = new Map<string, number>()
  for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1)
  return [...m].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count)
}

/** Per-day counts across a date range (inclusive), zero-filled. */
const daily = (dates: (string | null)[], from: string, to: string): Count[] => {
  const m = new Map<string, number>()
  for (const d of dates) if (d) m.set(d, (m.get(d) ?? 0) + 1)
  const out: Count[] = []
  for (let t = new Date(from); t <= new Date(to); t.setUTCDate(t.getUTCDate() + 1)) {
    const key = t.toISOString().slice(0, 10)
    out.push({ key, count: m.get(key) ?? 0 })
  }
  return out
}

// Each incident is one record (follow-ups live in its timeline), so plain
// counting over incidents never double-counts.
export const computeStats = (db: Db, from = "2026-10-01", to = "2026-10-31") => {
  const inc = db.incidents
  const has = (c: Incident["categories"][number]) => inc.filter((i) => i.categories.includes(c)).length
  return {
    incidents: inc.length,
    vulnerabilities: db.vulnerabilities.length,
    dataBreach: has("data-breach"),
    unauthorizedAccess: has("unauthorized-access"),
    ransomware: has("ransomware"),
    byOccurredDay: daily(inc.map((i) => i.incidentDate), from, to),
    byDisclosedDay: daily(inc.map((i) => i.disclosedAt), from, to),
    byCategory: tally(inc.flatMap((i) => i.categories)),
    byRegion: tally(inc.map((i) => (i.country === "JP" ? "国内" : "海外"))),
    byIndustry: tally(inc.map((i) => i.industry)),
    bySeverity: tally(inc.map((i) => i.severity)),
    byTechnique: tally(inc.flatMap((i) => i.attackMethods)),
    byVulnSeverity: tally(
      db.vulnerabilities.map((v) => cvssSeverity(v.cvssScore))
    ),
  }
}
