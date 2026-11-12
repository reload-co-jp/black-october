import Link from "next/link"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { IncidentCard } from "@/components/incident-card"
import { SourceList } from "@/components/source-list"
import {
  Breadcrumbs,
  CategoryTags,
  color,
  countryLabel,
  DateText,
  Facts,
  Sidebar,
  WithSidebar,
  Grid,
  JsonLd,
  List,
  Mono,
  Muted,
  PageTitle,
  Row,
  Section,
  SeverityBadge,
  StatusText,
  Tag,
  VerificationBadge,
} from "@/components/ui"
import {
  getOrganization,
  getSources,
  getTechnique,
  incidents,
  incidentSourceIds,
  possibleVulnerabilitiesForIncident,
  relatedIncidents,
  toCard,
  vulnerabilitiesForIncident,
} from "@/lib/data"
import { OG_BASE, SITE_NAME, SITE_URL } from "@/lib/site"

type Props = { params: Promise<{ slug: string }> }

export const generateStaticParams = () => incidents.map((i) => ({ slug: i.slug }))
export const dynamicParams = false

const find = async (params: Props["params"]) => {
  const { slug } = await params
  return incidents.find((i) => i.slug === slug) ?? notFound()
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const i = await find(params)
  const path = `/incidents/${i.slug}/`
  return {
    title: i.title,
    description: i.summary,
    alternates: { canonical: path },
    openGraph: {
      ...OG_BASE,
      type: "article",
      title: i.title,
      description: i.summary,
      url: path,
      publishedTime: i.publishedAt,
      modifiedTime: i.updatedAt,
    },
  }
}

const Page = async ({ params }: Props) => {
  const i = await find(params)
  const org = getOrganization(i.organizationId)
  const sources = getSources(incidentSourceIds(i))
  const sourceNo = new Map(sources.map((s, n) => [s.id, n + 1]))
  const vulns = vulnerabilitiesForIncident(i)
  const possibleVulns = possibleVulnerabilitiesForIncident(i)
  const related = relatedIncidents(i)
  const cite = (ids: string[]) =>
    ids.map((id) => (
      <a key={id} href={`#src-${id}`} style={{ fontSize: ".75rem", marginLeft: ".2rem" }}>
        [{sourceNo.get(id)}]
      </a>
    ))

  return (
    <article>
      <Breadcrumbs
        items={[
          { name: "INCIDENTS", href: "/incidents/" },
          { name: i.title, href: `/incidents/${i.slug}/` },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: i.title,
          description: i.summary,
          datePublished: i.publishedAt,
          dateModified: i.updatedAt,
          inLanguage: "ja",
          mainEntityOfPage: new URL(`/incidents/${i.slug}/`, SITE_URL).toString(),
          publisher: { "@type": "Organization", name: SITE_NAME },
          about: { "@type": "Organization", name: org.name },
          citation: sources.map((s) => s.url),
        }}
      />
      <PageTitle kicker={`INCIDENT / ${i.disclosedAt}`}>{i.title}</PageTitle>
      <Row style={{ marginBottom: "1rem" }}>
        <SeverityBadge value={i.severity} />
        <VerificationBadge value={i.verificationStatus} />
        <CategoryTags values={i.categories} />
      </Row>
      <p style={{ fontSize: "1.05rem" }}>{i.summary}</p>
      <WithSidebar
        aside={
          <Sidebar
              items={[
                ["対象組織", <Link key="o" href={`/organizations/${org.slug}/`}>{org.name}</Link>],
                ["対象サービス", i.service ?? "不明"],
                ["発生日", <DateText key="d" value={i.incidentDate} />],
                ["発覚日", <DateText key="d" value={i.discoveredAt} />],
                ["公表日", <DateText key="d" value={i.disclosedAt} />],
                ["最終更新日", <DateText key="d" value={i.updatedAt} />],
                ["国・地域", countryLabel(i.country)],
                ["業種", i.industry],
                ["対応状況", <StatusText key="s" value={i.status} />],
                ["情報の確認状況", <VerificationBadge key="v" value={i.verificationStatus} />],
              ]}
          />
        }
      >


      <Section title="概要">
        <p>{i.summaryDetails || i.summary}</p>
      </Section>

      <Section title="経緯">
        {i.timeline.length ? (
          <ol style={{ borderLeft: `2px solid ${color.accent}`, listStyle: "none", paddingLeft: "1rem" }}>
            {i.timeline.map((t, n) => (
              <li key={n} style={{ marginBottom: "1rem" }}>
                <Mono style={{ color: color.accent, fontSize: ".8rem" }}>{t.date}</Mono>
                <p style={{ fontWeight: 600 }}>
                  {t.title}
                  {cite(t.sourceIds)}
                </p>
                {t.description && <p style={{ color: color.muted }}>{t.description}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <Muted>経緯情報は未登録です。</Muted>
        )}
      </Section>

      <Section title="原因">
        <Row style={{ marginBottom: ".5rem" }}>
          <VerificationBadge value={i.cause.status} />
          {i.cause.factors.map((f) => (
            <Tag key={f}>{f}</Tag>
          ))}
        </Row>
        {i.cause.description ? <p>{i.cause.description}</p> : <p>調査中（原因は公表されていません）</p>}
      </Section>

      <Section title="攻撃手法">
        {i.attackMethods.length ? (
          <List
            items={i.attackMethods.map((slug) => {
              const t = getTechnique(slug)!
              return (
                <>
                  <Link href={`/techniques/${slug}/`}>{t.nameJa}</Link>{" "}
                  <span style={{ color: color.muted }}>({t.name})</span>{" "}
                  {t.mitreAttackIds.map((m) => (
                    <Tag key={m} href={`https://attack.mitre.org/techniques/${m.replace(".", "/")}/`}>
                      {m}
                    </Tag>
                  ))}
                </>
              )
            })}
          />
        ) : (
          <Muted>公表情報で確認できる攻撃手法はありません（推測による割り当ては行っていません）。</Muted>
        )}
      </Section>

      <Section title="影響範囲">
        <Row style={{ marginBottom: ".75rem" }}>
          <VerificationBadge value={i.impact.status} />
        </Row>
        <Facts
          items={[
            ["影響を受けたユーザー数", i.impact.affectedUsers == null ? "不明" : <Mono key="u">{i.impact.affectedUsers.toLocaleString()}</Mono>],
            ["サービス停止", i.impact.serviceOutage == null ? "不明" : i.impact.serviceOutage ? "あり" : "なし"],
            ["金銭的被害", i.impact.financialLoss ?? "不明"],
            ["対象システム", i.impact.systems.join("、") || "不明"],
          ]}
        />
        <h3 style={{ fontSize: ".95rem", margin: "1rem 0 .5rem" }}>漏洩した情報</h3>
        <List
          empty="漏洩情報の公表はありません。"
          items={i.impact.leakedData.map((d) => (
            <Row key={d.item}>
              <VerificationBadge value={d.confidence} />
              <span>{d.item}</span>
            </Row>
          ))}
        />
        {i.impact.description && <p style={{ marginTop: ".75rem" }}>{i.impact.description}</p>}
      </Section>

      <Section title="対応">
        {i.response.description && <p style={{ marginBottom: ".75rem" }}>{i.response.description}</p>}
        <List items={i.response.measures} />
      </Section>

      {i.technicalNotes && (
        <Section title="技術的解説">
          <p>{i.technicalNotes}</p>
          {i.attackMethods.length > 0 && (
            <p style={{ color: color.muted, fontSize: ".85rem", marginTop: ".5rem" }}>
              用語解説:{" "}
              {i.attackMethods.map((slug) => (
                <Link key={slug} href={`/techniques/${slug}/`} style={{ marginRight: ".6rem" }}>
                  {getTechnique(slug)!.nameJa}
                </Link>
              ))}
            </p>
          )}
        </Section>
      )}

      <Section title="教訓・対策">
        <List items={i.lessons} empty="未登録" />
      </Section>

      <Section title="参考資料">
        <SourceList sources={sources} />
      </Section>

      <Section title="関連情報">
        <h3 style={{ fontSize: ".95rem", marginBottom: ".5rem" }}>関連するCVE</h3>
        <List
          empty="関連付けられたCVEはありません。"
          items={vulns.map((v) => (
            <>
              <Link href={`/vulnerabilities/${v.cveId}/`}>
                <Mono>{v.cveId}</Mono>
              </Link>{" "}
              {v.title}
            </>
          ))}
        />
        {possibleVulns.length > 0 && (
          <>
            <h3 style={{ fontSize: ".95rem", margin: "1rem 0 .5rem" }}>
              関連の可能性があるCVE
            </h3>
            <Muted>
              悪用が確認されたものではありません。関連を示唆する根拠とあわせて掲載しています。
            </Muted>
            <List
              items={possibleVulns.map(({ vulnerability: v, note }) => (
                <>
                  <Link href={`/vulnerabilities/${v.cveId}/`}>
                    <Mono>{v.cveId}</Mono>
                  </Link>{" "}
                  {v.title}
                  <br />
                  <span style={{ fontSize: ".85rem" }}>根拠: {note}</span>
                </>
              ))}
            />
          </>
        )}
        <h3 style={{ fontSize: ".95rem", margin: "1rem 0 .5rem" }}>関連組織</h3>
        <p>
          <Link href={`/organizations/${org.slug}/`}>{org.name}</Link>
        </p>
        <h3 style={{ fontSize: ".95rem", margin: "1rem 0 .5rem" }}>関連するインシデント</h3>
        {related.length ? (
          <Grid min="18rem">
            {related.map((r) => (
              <IncidentCard key={r.id} incident={toCard(r)} />
            ))}
          </Grid>
        ) : (
          <Muted>関連付けられたインシデントはありません。</Muted>
        )}
      </Section>
      </WithSidebar>
    </article>
  )
}
export default Page
