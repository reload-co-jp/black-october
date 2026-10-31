import { Metadata } from "next"
import { VulnerabilityTable } from "@/components/vulnerability-table"
import { Breadcrumbs, PageTitle } from "@/components/ui"
import { db, incidentsForVulnerability } from "@/lib/data"

export const metadata: Metadata = {
  title: "脆弱性一覧",
  description: "2026年10月に公開・悪用が確認された脆弱性（CVE）の一覧。CVSS・悪用状況・関連インシデントで絞り込めます。",
  alternates: { canonical: "/vulnerabilities/" },
}

const Page = () => (
  <>
    <Breadcrumbs items={[{ name: "VULNERABILITIES", href: "/vulnerabilities/" }]} />
    <PageTitle kicker="VULNERABILITIES">脆弱性一覧</PageTitle>
    <VulnerabilityTable
      rows={db.vulnerabilities.map((v) => ({
        cveId: v.cveId,
        title: v.title,
        products: v.affectedProducts.join(" / "),
        cvssScore: v.cvssScore,
        publishedAt: v.publishedAt,
        kevStatus: v.kevStatus,
        incidents: incidentsForVulnerability(v.id).map((i) => ({ slug: i.slug, title: i.title })),
      }))}
    />
  </>
)
export default Page
