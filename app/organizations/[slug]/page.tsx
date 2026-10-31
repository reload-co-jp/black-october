import { Metadata } from "next"
import { notFound } from "next/navigation"
import { IncidentCard } from "@/components/incident-card"
import { Breadcrumbs, countryLabel, Facts, Grid, JsonLd, PageTitle, Section } from "@/components/ui"
import { db, incidents, toCard } from "@/lib/data"

type Props = { params: Promise<{ slug: string }> }

export const generateStaticParams = () => db.organizations.map((o) => ({ slug: o.slug }))
export const dynamicParams = false

const find = async (params: Props["params"]) => {
  const { slug } = await params
  return db.organizations.find((o) => o.slug === slug) ?? notFound()
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const o = await find(params)
  return {
    title: `${o.name}のセキュリティインシデント`,
    description: `${o.name}に関連するサイバーセキュリティインシデントの記録。`,
    alternates: { canonical: `/organizations/${o.slug}/` },
  }
}

const Page = async ({ params }: Props) => {
  const o = await find(params)
  const own = incidents.filter((i) => i.organizationId === o.id)
  return (
    <>
      <Breadcrumbs items={[{ name: "INCIDENTS", href: "/incidents/" }, { name: o.name, href: `/organizations/${o.slug}/` }]} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: o.name, url: o.website || undefined }} />
      <PageTitle kicker="ORGANIZATION">{o.name}</PageTitle>
      <Facts
        items={[
          ["国・地域", countryLabel(o.country)],
          ["業種", o.industry],
          ["Webサイト", o.website ? <a key="w" href={o.website} rel="noopener noreferrer">{o.website}</a> : "—"],
          ["登録インシデント", `${own.length}件`],
        ]}
      />
      <Section title="インシデント">
        <Grid min="18rem">{own.map((i) => <IncidentCard key={i.id} incident={toCard(i)} />)}</Grid>
      </Section>
    </>
  )
}
export default Page
