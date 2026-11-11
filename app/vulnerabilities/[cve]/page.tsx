import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { IncidentCard } from "@/components/incident-card"
import { SourceList } from "@/components/source-list"
import { Breadcrumbs, Grid, JsonLd, List, Mono, Muted, PageTitle, Row, Section, SeverityBadge, Sidebar, WithSidebar } from "@/components/ui"
import { cvssSeverity } from "@/lib/labels"
import { db, getSources, incidentsForVulnerability, toCard } from "@/lib/data"
import { OG_BASE, SITE_NAME } from "@/lib/site"

type Props = { params: Promise<{ cve: string }> }

export const generateStaticParams = () => db.vulnerabilities.map((v) => ({ cve: v.cveId }))
export const dynamicParams = false

const find = async (params: Props["params"]) => {
  const { cve } = await params
  return db.vulnerabilities.find((v) => v.cveId === cve) ?? notFound()
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const v = await find(params)
  return {
    title: `${v.cveId}: ${v.title}`,
    description: v.description,
    alternates: { canonical: `/vulnerabilities/${v.cveId}/` },
    openGraph: { ...OG_BASE, type: "article", title: `${v.cveId}: ${v.title}`, description: v.description },
  }
}

const Page = async ({ params }: Props) => {
  const v = await find(params)
  const related = incidentsForVulnerability(v.id)
  return (
    <article>
      <Breadcrumbs items={[{ name: "VULNERABILITIES", href: "/vulnerabilities/" }, { name: v.cveId, href: `/vulnerabilities/${v.cveId}/` }]} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: `${v.cveId}: ${v.title}`, description: v.description, datePublished: v.publishedAt ?? undefined, publisher: { "@type": "Organization", name: SITE_NAME } }} />
      <PageTitle kicker={v.cveId}>{v.title}</PageTitle>
      <Row style={{ marginBottom: "1rem" }}>
        <SeverityBadge value={cvssSeverity(v.cvssScore)} />
        {v.kevStatus && <span style={{ color: "#cf222e", fontSize: ".85rem" }}>● 悪用確認済み（CISA KEV）</span>}
      </Row>
      <p>{v.description}</p>
      <WithSidebar
        aside={
          <Sidebar
              items={[
                ["CVE ID", <Mono key="c">{v.cveId}</Mono>],
                ["CVSSスコア", <Mono key="s">{v.cvssScore ?? "不明"}</Mono>],
                ["CVSSベクター", <Mono key="v" style={{ fontSize: ".75rem", wordBreak: "break-all" }}>{v.cvssVector ?? "不明"}</Mono>],
                ["CWE", v.cweId ? <a key="w" href={`https://cwe.mitre.org/data/definitions/${v.cweId.slice(4)}.html`}><Mono>{v.cweId}</Mono></a> : "不明"],
                ["公開日", <Mono key="p">{v.publishedAt ?? "不明"}</Mono>],
                ["更新日", <Mono key="m">{v.modifiedAt ?? "不明"}</Mono>],
                ["悪用状況", v.exploitation ?? (v.kevStatus ? "悪用確認済み" : "未確認")],
              ]}
          />
        }
      >
      <Section title="影響製品・バージョン"><List items={v.affectedProducts} /></Section>
      <Section title="修正バージョン"><List items={v.fixedVersions} empty="未公表" /></Section>
      <Section title="対応策"><List items={v.mitigation} /></Section>
      <Section title="参考資料"><SourceList sources={getSources(v.sourceIds)} /></Section>
      <Section title="関連インシデント">
        {related.length ? (
          <Grid min="18rem">{related.map((i) => <IncidentCard key={i.id} incident={toCard(i)} />)}</Grid>
        ) : (
          <Muted>この脆弱性に関連付けられた登録インシデントはありません。</Muted>
        )}
        <p style={{ marginTop: "1rem" }}><Link href="/vulnerabilities/">← 脆弱性一覧へ</Link></p>
      </Section>
      </WithSidebar>
    </article>
  )
}
export default Page
