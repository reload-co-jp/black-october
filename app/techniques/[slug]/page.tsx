import { Metadata } from "next"
import { notFound } from "next/navigation"
import { IncidentCard } from "@/components/incident-card"
import { Breadcrumbs, Grid, JsonLd, List, Muted, PageTitle, Row, Section, Tag } from "@/components/ui"
import { db, getTechnique, incidentsForTechnique, toCard } from "@/lib/data"
import { SITE_NAME } from "@/lib/site"

type Props = { params: Promise<{ slug: string }> }

export const generateStaticParams = () => db.techniques.map((t) => ({ slug: t.slug }))
export const dynamicParams = false

const find = async (params: Props["params"]) => getTechnique((await params).slug) ?? notFound()

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const t = await find(params)
  return {
    title: `${t.nameJa}（${t.name}）とは`,
    description: t.description,
    alternates: { canonical: `/techniques/${t.slug}/` },
  }
}

const Page = async ({ params }: Props) => {
  const t = await find(params)
  const related = incidentsForTechnique(t.slug)
  return (
    <article>
      <Breadcrumbs items={[{ name: "TECHNIQUES", href: "/techniques/" }, { name: t.nameJa, href: `/techniques/${t.slug}/` }]} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "DefinedTerm", name: t.nameJa, alternateName: t.name, description: t.description, inDefinedTermSet: `${SITE_NAME} Techniques` }} />
      <PageTitle kicker={`TECHNIQUE / ${t.name}`}>{t.nameJa}</PageTitle>
      <p>{t.description}</p>
      <Section title="攻撃の仕組み"><p>{t.mechanism || "未登録"}</p></Section>
      <Section title="攻撃が成立する条件"><List items={t.conditions} empty="未登録" /></Section>
      <Section title="発生原因"><List items={t.causes} empty="未登録" /></Section>
      <Section title="対策"><List items={t.mitigation} empty="未登録" /></Section>
      <Section title="MITRE ATT&CK">
        {t.mitreAttackIds.length ? (
          <Row>
            {t.mitreAttackIds.map((m) => (
              <Tag key={m} href={`https://attack.mitre.org/techniques/${m.replace(".", "/")}/`}>{m}</Tag>
            ))}
          </Row>
        ) : (
          <Muted>対応する技法は登録されていません。</Muted>
        )}
      </Section>
      <Section title="関連インシデント">
        {related.length ? (
          <Grid min="18rem">{related.map((i) => <IncidentCard key={i.id} incident={toCard(i)} />)}</Grid>
        ) : (
          <Muted>この手法が確認された登録インシデントはまだありません。</Muted>
        )}
      </Section>
    </article>
  )
}
export default Page
