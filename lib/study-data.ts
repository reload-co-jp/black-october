import { getOrganization, getSources, incidents } from "./data"
import { classify, StudyRow } from "./study"

/** Every incident as a study row, newest disclosure first. */
export const studyRows: StudyRow[] = incidents.map((i) => {
  const org = getOrganization(i.organizationId)
  return {
    slug: i.slug,
    title: i.title,
    summary: i.summary,
    organization: org.name,
    organizationSlug: org.slug,
    industry: i.industry,
    incidentDate: i.incidentDate,
    discoveredAt: i.discoveredAt,
    disclosedAt: i.disclosedAt,
    severity: i.severity,
    categories: i.categories,
    affectedUsers: i.impact.affectedUsers,
    leaked: i.impact.leakedData.map((d) => d.item),
    causeStatus: i.cause.status,
    cause: i.cause.description,
    factors: i.cause.factors,
    measures: i.response.measures,
    lessons: i.lessons,
    themes: classify(i),
    sources: getSources(i.sourceIds).map((s) => ({
      title: s.title,
      url: s.url,
      publisher: s.publisher,
      primary: s.reliability === "primary",
    })),
  }
})
