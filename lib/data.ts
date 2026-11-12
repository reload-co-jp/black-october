import incidentsJson from "@/data/incidents.json"
import vulnerabilitiesJson from "@/data/vulnerabilities.json"
import techniquesJson from "@/data/techniques.json"
import organizationsJson from "@/data/organizations.json"
import sourcesJson from "@/data/sources.json"
import { Db, Incident, validateDb } from "./validation"

const raw = {
  incidents: incidentsJson,
  vulnerabilities: vulnerabilitiesJson,
  techniques: techniquesJson,
  organizations: organizationsJson,
  sources: sourcesJson,
}

// Integrity check runs whenever pages are built: broken data fails the build.
const errors = validateDb(raw)
if (errors.length)
  throw new Error(`Invalid data:\n${errors.slice(0, 30).join("\n")}`)

export const db = raw as unknown as Db

const byId = <T extends { id: string }>(rows: T[]) =>
  new Map(rows.map((r) => [r.id, r]))
const orgMap = byId(db.organizations)
const sourceMap = byId(db.sources)
const vulnMap = byId(db.vulnerabilities)
const incidentMap = byId(db.incidents)

export const incidents = [...db.incidents].sort((a, b) =>
  b.disclosedAt.localeCompare(a.disclosedAt)
)

export const getOrganization = (id: string) => orgMap.get(id)!
export const getSources = (ids: string[]) =>
  [...new Set(ids)].map((id) => sourceMap.get(id)!)
export const getVulnerabilities = (ids: string[]) =>
  ids.map((id) => vulnMap.get(id)!)
export const getIncidents = (ids: string[]) =>
  [...new Set(ids)].map((id) => incidentMap.get(id)!)
export const getTechnique = (slug: string) =>
  db.techniques.find((t) => t.slug === slug)

// Links can be declared on either side; both directions are merged here.
export const incidentsForTechnique = (slug: string) => {
  const t = getTechnique(slug)
  return incidents.filter(
    (i) => i.attackMethods.includes(slug) || t?.incidentIds.includes(i.id)
  )
}
export const incidentsForVulnerability = (id: string) => {
  const v = vulnMap.get(id)
  return incidents.filter(
    (i) => i.vulnerabilityIds.includes(id) || v?.incidentIds.includes(i.id)
  )
}
export const vulnerabilitiesForIncident = (i: Incident) =>
  db.vulnerabilities.filter(
    (v) => i.vulnerabilityIds.includes(v.id) || v.incidentIds.includes(i.id)
  )

// Unconfirmed links ("may be related"). A confirmed link always wins.
export const possibleVulnerabilitiesForIncident = (i: Incident) => {
  const confirmed = new Set(vulnerabilitiesForIncident(i).map((v) => v.id))
  return (i.possibleVulnerabilities ?? [])
    .filter((p) => !confirmed.has(p.vulnerabilityId))
    .map((p) => ({ vulnerability: vulnMap.get(p.vulnerabilityId)!, note: p.note }))
}
export const possibleIncidentsForVulnerability = (id: string) => {
  const confirmed = new Set(incidentsForVulnerability(id).map((i) => i.id))
  return incidents.flatMap((incident) =>
    (incident.possibleVulnerabilities ?? [])
      .filter((p) => p.vulnerabilityId === id && !confirmed.has(incident.id))
      .map((p) => ({ incident, note: p.note }))
  )
}
export const relatedIncidents = (i: Incident) =>
  incidents.filter(
    (o) =>
      o.id !== i.id &&
      (i.relatedIncidentIds.includes(o.id) ||
        o.relatedIncidentIds.includes(i.id) ||
        o.vulnerabilityIds.some((v) => i.vulnerabilityIds.includes(v)))
  )

/** All source ids referenced by an incident, timeline included. */
export const incidentSourceIds = (i: Incident) => [
  ...i.sourceIds,
  ...i.timeline.flatMap((t) => t.sourceIds),
]

/** "2026-10" style months that have at least one disclosed incident. */
export const archiveMonths = () =>
  [...new Set(incidents.map((i) => i.disclosedAt.slice(0, 7)))].sort().reverse()

export const toCard = (i: Incident) => ({
  ...i,
  organization: getOrganization(i.organizationId).name,
})
