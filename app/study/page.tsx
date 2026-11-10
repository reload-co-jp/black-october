import { Metadata } from "next"
import Link from "next/link"
import { StudyBoard } from "@/components/study-board"
import {
  Breadcrumbs,
  Card,
  color,
  Grid,
  JsonLd,
  Mono,
  Muted,
  PageTitle,
  Section,
} from "@/components/ui"
import {
  getOrganization,
  getSources,
  getTechnique,
  incidents,
} from "@/lib/data"
import { OG_BASE, SITE_NAME, SITE_URL } from "@/lib/site"
import { classify, hasKnownCause, StudyRow, THEMES } from "@/lib/study"

const PATH = "/study/"
const TITLE = "セキュリティ事故・不正アクセス事例から学ぶ勉強ボード"
const DESCRIPTION =
  "何が起きた？ なぜ防げなかった？ 自分ならどうする？ 国内のセキュリティ事故・不正アクセス・情報漏えいの事例を、原因・攻撃テーマ別に一覧しながら学べる開発者向けの勉強ページ。一次情報へのリンクと、自分のサービスに置き換える問い付き。"

// The meetup this board was built for. Kept after the date as a record.
const EVENT = {
  name: "セキュリティ事故・不正アクセスから学ぶ会【秋葉原】",
  url: "https://fffff.connpass.com/event/411460/",
  when: "2026年11月11日(水) 19:00〜21:00",
  where: "FFFFF Cafe（東京都千代田区・秋葉原）",
}

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    ...OG_BASE,
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: PATH,
  },
}

const STEPS: [string, string, string][] = [
  [
    "何が起きた？",
    "公表された事実を確認する",
    "いつ・どの組織の・どのシステムで・何がどれだけ影響を受けたか。発生日・発覚日・公表日の差にも注目する。",
  ],
  [
    "なぜ防げなかった？",
    "侵入経路と見逃した理由を追う",
    "入口になった弱点は何か。侵入後に被害が広がった理由、気づくまでに時間がかかった理由は何か。未公表なら仮説として扱う。",
  ],
  [
    "自分ならどうする？",
    "自分の開発・運用に置き換える",
    "同じ構成・同じ運用が自分のサービスにないか。明日確認できることを1つ決める。",
  ],
]

const Page = () => {
  const rows: StudyRow[] = incidents.map((i) => {
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
  const known = rows.filter(hasKnownCause).length
  const url = new URL(PATH, SITE_URL).toString()

  return (
    <>
      <Breadcrumbs items={[{ name: "STUDY", href: PATH }]} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: TITLE,
          description: DESCRIPTION,
          url,
          inLanguage: "ja",
          isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
          about: THEMES.map((t) => ({ "@type": "Thing", name: t.name })),
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: rows.length,
            // Newest cases only: enough for discovery without bloating the page.
            itemListElement: rows.slice(0, 50).map((r, n) => ({
              "@type": "ListItem",
              position: n + 1,
              name: r.title,
              url: new URL(`/incidents/${r.slug}/`, SITE_URL).toString(),
            })),
          },
        }}
      />
      <PageTitle kicker="STUDY">事例から学ぶセキュリティ勉強ボード</PageTitle>
      <p style={{ fontSize: "1.05rem", maxWidth: "52rem" }}>
        国内で公表されたセキュリティ事故・不正アクセス・情報漏えい{" "}
        <Mono>{rows.length}</Mono>{" "}
        件を、開発者の目線で読み比べるためのページです。行を開くと「何が起きた？
        なぜ防げなかった？
        自分ならどうする？」の3つの問いで事例を並べて表示します。うち{" "}
        <Mono>{known}</Mono> 件は原因が公表されています。
      </p>

      <ol
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(16rem, 100%), 1fr))",
          listStyle: "none",
          margin: "1.25rem 0 1.5rem",
          padding: 0,
        }}
      >
        {STEPS.map(([question, action, detail], n) => (
          <li key={question}>
            <Card style={{ height: "100%" }}>
              <Mono style={{ color: color.accent, fontSize: ".75rem" }}>
                Q{n + 1}
              </Mono>
              <h2 style={{ fontSize: "1.05rem" }}>{question}</h2>
              <p
                style={{
                  fontSize: ".85rem",
                  fontWeight: 600,
                  margin: ".3rem 0",
                }}
              >
                {action}
              </p>
              <p style={{ color: color.muted, fontSize: ".85rem" }}>{detail}</p>
            </Card>
          </li>
        ))}
      </ol>

      <StudyBoard rows={rows} />

      <Section title="テーマ別の学びどころ" id="themes">
        <Muted>
          テーマは、公表された原因・概要の文面をキーワードで機械的に分類したものです（1件が複数テーマに入ることがあります）。原因が未公表の事例は、推測でテーマを割り当てていません。
        </Muted>
        <div style={{ marginTop: "1rem" }}>
          <Grid min="22rem">
            {THEMES.map((t) => {
              const count = rows.filter((r) => r.themes.includes(t.id)).length
              return (
                <Card
                  key={t.id}
                  style={{
                    display: "grid",
                    gap: ".5rem",
                    alignContent: "start",
                  }}
                >
                  <h3 id={`theme-${t.id}`} style={{ fontSize: "1rem" }}>
                    {t.name}{" "}
                    <Mono style={{ color: color.accent, fontSize: ".75rem" }}>
                      {count}件
                    </Mono>
                  </h3>
                  <p style={{ fontSize: ".85rem" }}>{t.description}</p>
                  <ul
                    style={{
                      display: "grid",
                      fontSize: ".85rem",
                      gap: ".25rem",
                      paddingLeft: "1.2rem",
                    }}
                  >
                    {t.questions.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  {t.techniques.length > 0 && (
                    <p style={{ color: color.muted, fontSize: ".8rem" }}>
                      攻撃手法の解説:{" "}
                      {t.techniques.map((slug) => (
                        <Link
                          key={slug}
                          href={`/techniques/${slug}/`}
                          style={{ marginRight: ".6rem" }}
                        >
                          {getTechnique(slug)?.nameJa ?? slug}
                        </Link>
                      ))}
                    </p>
                  )}
                </Card>
              )
            })}
          </Grid>
        </div>
      </Section>

      <Section title="勉強会での使い方" id="howto">
        <ul style={{ display: "grid", gap: ".4rem", paddingLeft: "1.2rem" }}>
          <li>
            まず新しい順に眺め、気になった事例に「☆
            気になる」を付ける（ブラウザに保存されます）。
          </li>
          <li>「★ 気になる」で絞り込み、1件ずつ開いて Q1→Q2→Q3 の順に話す。</li>
          <li>
            原因が調査中の事例は、出典の一次情報を開いて侵入経路の仮説を出し合う。
          </li>
          <li>
            事例を開いた状態のURL（<Mono>{PATH}#事例のID</Mono>
            ）はそのまま共有できます。
          </li>
          <li>
            悪用が確認された脆弱性は{" "}
            <Link href="/vulnerabilities/">Vulnerabilities</Link>、時系列は{" "}
            <Link href="/timeline/">Timeline</Link>、全体の傾向は{" "}
            <Link href="/statistics/">Statistics</Link> で確認できます。
          </li>
        </ul>
        <Card style={{ marginTop: "1rem" }}>
          <p style={{ color: color.muted, fontSize: ".75rem" }}>
            このページを使う勉強会
          </p>
          <p style={{ fontWeight: 600 }}>
            <a href={EVENT.url} target="_blank" rel="noopener noreferrer">
              {EVENT.name}
            </a>
          </p>
          <p style={{ color: color.muted, fontSize: ".85rem" }}>
            {EVENT.when} ／ {EVENT.where}
            ／専門家の講義ではなく、参加者が事例を持ち寄って攻撃の仕組みや原因を調べながら話すカジュアルな会です。
          </p>
        </Card>
      </Section>
    </>
  )
}
export default Page
