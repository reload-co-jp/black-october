import { describe, expect, it } from "vitest"
import { IncidentRow, parseQuery, searchIncidents, toSearchParams, EMPTY_QUERY } from "./search"
import { validateDb } from "./validation"
import incidents from "@/data/incidents.json"
import vulnerabilities from "@/data/vulnerabilities.json"
import techniques from "@/data/techniques.json"
import organizations from "@/data/organizations.json"
import sources from "@/data/sources.json"

const row = (p: Partial<IncidentRow>): IncidentRow => ({
  slug: "a", title: "A", summary: "", organization: "Org", industry: "IT", country: "JP",
  incidentDate: "2026-10-05", disclosedAt: "2026-10-10", updatedAt: "2026-10-10",
  categories: ["ransomware"], severity: "high", status: "investigating", verificationStatus: "confirmed",
  ...p,
})
const rows = [
  row({ slug: "a" }),
  row({ slug: "b", title: "漏洩", country: "US", severity: "critical", disclosedAt: "2026-10-20", incidentDate: null, categories: ["data-breach"] }),
]
const q = (p: Partial<typeof EMPTY_QUERY>) => ({ ...EMPTY_QUERY, ...p })

describe("searchIncidents", () => {
  it("filters by keyword, category, region and dates", () => {
    expect(searchIncidents(rows, q({ q: "漏洩" })).map((r) => r.slug)).toEqual(["b"])
    expect(searchIncidents(rows, q({ category: "ransomware" })).map((r) => r.slug)).toEqual(["a"])
    expect(searchIncidents(rows, q({ region: "overseas" })).map((r) => r.slug)).toEqual(["b"])
    expect(searchIncidents(rows, q({ disclosedFrom: "2026-10-15" })).map((r) => r.slug)).toEqual(["b"])
    // unknown occurrence date never matches an occurrence-date range
    expect(searchIncidents(rows, q({ occurredFrom: "2026-10-01" })).map((r) => r.slug)).toEqual(["a"])
  })
  it("sorts by severity then disclosure", () => {
    expect(searchIncidents(rows, q({ sort: "severity" }))[0].slug).toBe("b")
  })
  it("round-trips through URL params, omitting defaults", () => {
    const p = toSearchParams(q({ q: "x", region: "domestic" }))
    expect(p.toString()).toBe("q=x&region=domestic")
    expect(parseQuery(p)).toEqual(q({ q: "x", region: "domestic" }))
  })
})

describe("validateDb", () => {
  const db = { incidents, vulnerabilities, techniques, organizations, sources }
  it("accepts the committed data", () => {
    expect(validateDb(db)).toEqual([])
  })
  it("detects duplicate ids and broken references", () => {
    const bad = { ...db, organizations: [...organizations, organizations[0]], sources: sources.slice(1) }
    const errors = validateDb(bad).join("\n")
    expect(errors).toMatch(/duplicate id/)
    expect(errors).toMatch(/unknown sources reference/)
  })
})
