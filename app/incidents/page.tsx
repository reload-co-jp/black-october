import { Metadata } from "next"
import { Suspense } from "react"
import { IncidentSearch } from "@/components/incident-search"
import { Breadcrumbs, PageTitle } from "@/components/ui"
import { getOrganization, incidents } from "@/lib/data"
import { IncidentRow } from "@/lib/search"

export const metadata: Metadata = {
  title: "インシデント一覧",
  description:
    "2026年10月に公表されたサイバーセキュリティインシデントの一覧。キーワード・カテゴリ・深刻度・日付で検索できます。",
  alternates: { canonical: "/incidents/" },
}

const Page = () => {
  const rows: IncidentRow[] = incidents.map((i) => {
    const org = getOrganization(i.organizationId)
    return {
      slug: i.slug,
      title: i.title,
      summary: i.summary,
      organization: org.name,
      industry: i.industry,
      country: i.country,
      incidentDate: i.incidentDate,
      disclosedAt: i.disclosedAt,
      updatedAt: i.updatedAt,
      categories: i.categories,
      severity: i.severity,
      status: i.status,
      verificationStatus: i.verificationStatus,
    }
  })
  return (
    <>
      <Breadcrumbs items={[{ name: "INCIDENTS", href: "/incidents/" }]} />
      <PageTitle kicker="INCIDENTS">インシデント一覧</PageTitle>
      {/* useSearchParams needs a Suspense boundary under static export. */}
      <Suspense>
        <IncidentSearch rows={rows} />
      </Suspense>
    </>
  )
}
export default Page
