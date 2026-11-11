import { z } from "zod"

// Plain-object enums so the admin UI can render <select>s from the same source.
export const ENUMS = {
  severity: ["critical", "high", "medium", "low", "unknown"],
  status: ["investigating", "contained", "recovered", "resolved", "unknown"],
  verificationStatus: ["confirmed", "partially_confirmed", "unconfirmed"],
  causeStatus: ["confirmed", "partially_confirmed", "under_investigation"],
  confidence: ["confirmed", "possible", "unknown"],
  category: [
    "vulnerability",
    "unauthorized-access",
    "data-breach",
    "ransomware",
    "supply-chain",
    "malware",
    "misconfiguration",
    "phishing",
    "ddos",
    "other",
  ],
  sourceType: ["official", "advisory", "government", "media", "research"],
  reliability: ["primary", "secondary"],
} as const

const date = z.iso.date()
const nullableDate = date.nullable()
const id = z.string().regex(/^[a-z0-9-]+$/, "lowercase/digits/hyphen only")
const slug = id
const httpUrl = z.url({ protocol: /^https?$/ })

const leakedItem = z.object({
  item: z.string().min(1),
  confidence: z.enum(ENUMS.confidence),
})

export const incidentSchema = z.object({
  id,
  slug,
  title: z.string().min(1),
  summary: z.string().min(1),
  organizationId: id,
  service: z.string().nullable(),
  incidentDate: nullableDate,
  discoveredAt: nullableDate,
  disclosedAt: date,
  updatedAt: date,
  country: z.string().length(2),
  industry: z.string().min(1),
  categories: z.array(z.enum(ENUMS.category)).min(1),
  severity: z.enum(ENUMS.severity),
  status: z.enum(ENUMS.status),
  verificationStatus: z.enum(ENUMS.verificationStatus),
  featured: z.boolean(),
  summaryDetails: z.string(),
  cause: z.object({
    status: z.enum(ENUMS.causeStatus),
    description: z.string(),
    factors: z.array(z.string()),
  }),
  attackMethods: z.array(slug),
  impact: z.object({
    status: z.enum(ENUMS.verificationStatus),
    affectedUsers: z.number().int().nonnegative().nullable(),
    leakedData: z.array(leakedItem),
    systems: z.array(z.string()),
    serviceOutage: z.boolean().nullable(),
    financialLoss: z.string().nullable(),
    description: z.string(),
  }),
  response: z.object({
    description: z.string(),
    measures: z.array(z.string()),
  }),
  technicalNotes: z.string(),
  lessons: z.array(z.string()),
  timeline: z.array(
    z.object({
      date,
      title: z.string().min(1),
      description: z.string(),
      sourceIds: z.array(id),
    })
  ),
  vulnerabilityIds: z.array(id),
  /**
   * CVEs that may be related but are not confirmed by the victim or a primary
   * source. Kept apart from vulnerabilityIds; `note` must state the grounds.
   */
  possibleVulnerabilities: z
    .array(z.object({ vulnerabilityId: id, note: z.string().min(1) }))
    .optional(),
  relatedIncidentIds: z.array(id),
  sourceIds: z.array(id).min(1, "at least one source is required"),
  createdAt: date,
  publishedAt: date,
})

export const vulnerabilitySchema = z.object({
  id,
  cveId: z.string().regex(/^CVE-\d{4}-\d{4,}$/),
  title: z.string().min(1),
  description: z.string(),
  cvssScore: z.number().min(0).max(10).nullable(),
  cvssVector: z.string().nullable(),
  cweId: z.string().regex(/^CWE-\d+$/).nullable(),
  affectedProducts: z.array(z.string()),
  fixedVersions: z.array(z.string()),
  publishedAt: nullableDate,
  modifiedAt: nullableDate,
  kevStatus: z.boolean(),
  exploitation: z.string().nullable(),
  mitigation: z.array(z.string()),
  incidentIds: z.array(id),
  sourceIds: z.array(id),
})

export const techniqueSchema = z.object({
  id,
  slug,
  name: z.string().min(1),
  nameJa: z.string().min(1),
  description: z.string(),
  mechanism: z.string(),
  conditions: z.array(z.string()),
  causes: z.array(z.string()),
  mitreAttackIds: z.array(z.string().regex(/^T\d{4}(\.\d{3})?$/)),
  mitigation: z.array(z.string()),
  incidentIds: z.array(id),
})

export const organizationSchema = z.object({
  id,
  slug,
  name: z.string().min(1),
  country: z.string().length(2),
  industry: z.string().min(1),
  website: z.union([z.literal(""), httpUrl]),
})

export const sourceSchema = z.object({
  id,
  title: z.string().min(1),
  url: httpUrl,
  publisher: z.string().min(1),
  publishedAt: nullableDate,
  sourceType: z.enum(ENUMS.sourceType),
  reliability: z.enum(ENUMS.reliability),
  retrievedAt: date,
})

export type Incident = z.infer<typeof incidentSchema>
export type Vulnerability = z.infer<typeof vulnerabilitySchema>
export type Technique = z.infer<typeof techniqueSchema>
export type Organization = z.infer<typeof organizationSchema>
export type Source = z.infer<typeof sourceSchema>

export const schemas = {
  incidents: z.array(incidentSchema),
  vulnerabilities: z.array(vulnerabilitySchema),
  techniques: z.array(techniqueSchema),
  organizations: z.array(organizationSchema),
  sources: z.array(sourceSchema),
}
export type Collection = keyof typeof schemas
export const COLLECTIONS = Object.keys(schemas) as Collection[]

export type Db = {
  incidents: Incident[]
  vulnerabilities: Vulnerability[]
  techniques: Technique[]
  organizations: Organization[]
  sources: Source[]
}

/** Returns a list of human-readable errors; empty means valid. */
export const validateDb = (raw: Record<Collection, unknown>): string[] => {
  const errors: string[] = []
  for (const c of COLLECTIONS) {
    const r = schemas[c].safeParse(raw[c])
    if (!r.success)
      for (const i of r.error.issues)
        errors.push(`${c}[${i.path.join(".")}]: ${i.message}`)
  }
  if (errors.length) return errors
  const db = raw as unknown as Db

  const unique = (c: Collection, key: string) => {
    const seen = new Set<string>()
    for (const row of db[c] as unknown as Record<string, string>[]) {
      if (seen.has(row[key])) errors.push(`${c}: duplicate ${key} "${row[key]}"`)
      seen.add(row[key])
    }
    return seen
  }
  const ids = Object.fromEntries(
    COLLECTIONS.map((c) => [c, unique(c, "id")])
  ) as Record<Collection, Set<string>>
  unique("incidents", "slug")
  const techSlugs = unique("techniques", "slug")
  unique("organizations", "slug")
  unique("vulnerabilities", "cveId")

  const ref = (where: string, c: Collection | "techSlug", values: string[]) => {
    const set = c === "techSlug" ? techSlugs : ids[c]
    for (const v of values)
      if (!set.has(v)) errors.push(`${where}: unknown ${c} reference "${v}"`)
  }
  for (const i of db.incidents) {
    const w = `incidents[${i.id}]`
    ref(w, "organizations", [i.organizationId])
    ref(w, "techSlug", i.attackMethods)
    ref(w, "vulnerabilities", i.vulnerabilityIds)
    const possible = (i.possibleVulnerabilities ?? []).map((p) => p.vulnerabilityId)
    ref(w, "vulnerabilities", possible)
    for (const v of possible)
      if (i.vulnerabilityIds.includes(v))
        errors.push(`${w}: "${v}" is in both vulnerabilityIds and possibleVulnerabilities`)
    ref(w, "incidents", i.relatedIncidentIds)
    ref(w, "sources", [...i.sourceIds, ...i.timeline.flatMap((t) => t.sourceIds)])
    if (i.discoveredAt && i.incidentDate && i.discoveredAt < i.incidentDate)
      errors.push(`${w}: discoveredAt is before incidentDate`)
    if (i.updatedAt < i.disclosedAt)
      errors.push(`${w}: updatedAt is before disclosedAt`)
  }
  for (const v of db.vulnerabilities) {
    ref(`vulnerabilities[${v.id}]`, "incidents", v.incidentIds)
    ref(`vulnerabilities[${v.id}]`, "sources", v.sourceIds)
  }
  for (const t of db.techniques)
    ref(`techniques[${t.id}]`, "incidents", t.incidentIds)
  return errors
}
