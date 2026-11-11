import { MetadataRoute } from "next"
import { archiveMonths, db, incidents } from "@/lib/data"
import { periodsOf } from "@/lib/digest"
import { SITE_URL } from "@/lib/site"

export const dynamic = "force-static"

const sitemap = (): MetadataRoute.Sitemap => {
  const u = (p: string, lastModified?: string) => ({
    url: new URL(p, SITE_URL).toString(),
    lastModified,
  })
  return [
    ...[
      "/",
      "/incidents/",
      "/critical/",
      "/study/",
      "/study/digest/",
      "/timeline/",
      "/vulnerabilities/",
      "/techniques/",
      "/statistics/",
      "/about/",
    ].map((p) => u(p)),
    ...incidents.map((i) => u(`/incidents/${i.slug}/`, i.updatedAt)),
    ...db.vulnerabilities.map((v) =>
      u(
        `/vulnerabilities/${v.cveId}/`,
        v.modifiedAt ?? v.publishedAt ?? undefined
      )
    ),
    ...db.techniques.map((t) => u(`/techniques/${t.slug}/`)),
    ...db.organizations.map((o) => u(`/organizations/${o.slug}/`)),
    ...(({ months, weeks }) => [...months, ...weeks].map((p) => u(p.path)))(
      periodsOf(incidents)
    ),
    ...archiveMonths().map((ym) => u(`/archive/${ym.replace("-", "/")}/`)),
  ]
}
export default sitemap
