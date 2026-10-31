import { Metadata } from "next"
import { notFound } from "next/navigation"
import { IncidentCard } from "@/components/incident-card"
import { Breadcrumbs, Grid, PageTitle } from "@/components/ui"
import { archiveMonths, incidents, toCard } from "@/lib/data"

type Props = { params: Promise<{ year: string; month: string }> }

export const generateStaticParams = () =>
  archiveMonths().map((ym) => ({ year: ym.slice(0, 4), month: ym.slice(5, 7) }))
export const dynamicParams = false

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { year, month } = await params
  return {
    title: `${year}年${Number(month)}月のセキュリティインシデント`,
    description: `${year}年${Number(month)}月に公表されたサイバーセキュリティインシデントのアーカイブ。`,
    alternates: { canonical: `/archive/${year}/${month}/` },
  }
}

const Page = async ({ params }: Props) => {
  const { year, month } = await params
  const ym = `${year}-${month}`
  const list = incidents.filter((i) => i.disclosedAt.startsWith(ym))
  if (!list.length) notFound()
  return (
    <>
      <Breadcrumbs items={[{ name: `ARCHIVE ${year}/${month}`, href: `/archive/${year}/${month}/` }]} />
      <PageTitle kicker={`ARCHIVE / ${year}.${month}`}>{year}年{Number(month)}月のインシデント（{list.length}件）</PageTitle>
      <Grid min="20rem">{list.map((i) => <IncidentCard key={i.id} incident={toCard(i)} />)}</Grid>
    </>
  )
}
export default Page
