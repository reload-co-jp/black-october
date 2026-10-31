import { SEVERITY_ORDER } from "./labels"

/** Slim incident row shipped to the client for search. */
export type IncidentRow = {
  slug: string
  title: string
  summary: string
  organization: string
  industry: string
  country: string
  incidentDate: string | null
  disclosedAt: string
  updatedAt: string
  categories: string[]
  severity: string
  status: string
  verificationStatus: string
}

export type Query = {
  q: string
  category: string
  severity: string
  status: string
  industry: string
  organization: string
  region: "" | "domestic" | "overseas"
  disclosedFrom: string
  disclosedTo: string
  occurredFrom: string
  occurredTo: string
  sort: "disclosed" | "occurred" | "severity" | "updated"
}

export const EMPTY_QUERY: Query = {
  q: "",
  category: "",
  severity: "",
  status: "",
  industry: "",
  organization: "",
  region: "",
  disclosedFrom: "",
  disclosedTo: "",
  occurredFrom: "",
  occurredTo: "",
  sort: "disclosed",
}

export const parseQuery = (params: URLSearchParams): Query => {
  const q = { ...EMPTY_QUERY }
  for (const k of Object.keys(q) as (keyof Query)[]) {
    const v = params.get(k)
    if (v) (q as Record<string, string>)[k] = v
  }
  return q
}

/** Only non-default values, so shared URLs stay short. */
export const toSearchParams = (q: Query) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(q))
    if (v && v !== EMPTY_QUERY[k as keyof Query]) p.set(k, v)
  return p
}

const inRange = (d: string | null, from: string, to: string) =>
  (!from && !to) || (!!d && (!from || d >= from) && (!to || d <= to))

export const searchIncidents = (rows: IncidentRow[], q: Query) => {
  const words = q.q.toLowerCase().split(/\s+/).filter(Boolean)
  const hit = rows.filter((r) => {
    const text =
      `${r.title} ${r.summary} ${r.organization} ${r.industry}`.toLowerCase()
    return (
      words.every((w) => text.includes(w)) &&
      (!q.category || r.categories.includes(q.category)) &&
      (!q.severity || r.severity === q.severity) &&
      (!q.status || r.status === q.status) &&
      (!q.industry || r.industry === q.industry) &&
      (!q.organization || r.organization === q.organization) &&
      (!q.region || (q.region === "domestic") === (r.country === "JP")) &&
      inRange(r.disclosedAt, q.disclosedFrom, q.disclosedTo) &&
      inRange(r.incidentDate, q.occurredFrom, q.occurredTo)
    )
  })
  const desc = (a: string | null, b: string | null) =>
    (b ?? "").localeCompare(a ?? "")
  const sorters: Record<Query["sort"], (a: IncidentRow, b: IncidentRow) => number> = {
    disclosed: (a, b) => desc(a.disclosedAt, b.disclosedAt),
    occurred: (a, b) => desc(a.incidentDate, b.incidentDate),
    updated: (a, b) => desc(a.updatedAt, b.updatedAt),
    severity: (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
      desc(a.disclosedAt, b.disclosedAt),
  }
  return hit.sort(sorters[q.sort] ?? sorters.disclosed)
}
