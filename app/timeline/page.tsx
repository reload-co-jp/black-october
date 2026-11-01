import { Metadata } from "next"
import Link from "next/link"
import { ReactNode } from "react"
import { Breadcrumbs, color, Mono, Muted, PageTitle, Tag } from "@/components/ui"
import { db, incidents, incidentSourceIds } from "@/lib/data"
import { label, SOURCE_TYPE } from "@/lib/labels"
import { Incident } from "@/lib/validation"

export const metadata: Metadata = {
  title: "タイムライン",
  description: "インシデントの経緯と関連ニュース・公式発表を、日付順に一覧できるタイムライン。",
  alternates: { canonical: "/timeline/" },
}

type Entry = { date: string; kind: string; title: ReactNode; description?: string | null; incidents: Incident[] }

const incidentLink = (i: Incident) => (
  <Link key={i.id} href={`/incidents/${i.slug}/`} style={{ fontSize: ".85rem" }}>
    {i.title}
  </Link>
)

const buildEntries = (): Entry[] => {
  // Incidents without a timeline still appear once, on their disclosure date.
  const events = incidents.flatMap((i) =>
    i.timeline.length
      ? i.timeline.map((t) => ({ date: t.date, kind: "経緯", title: t.title, description: t.description, incidents: [i] }))
      : [{ date: i.disclosedAt, kind: "公表", title: i.title, description: i.summary, incidents: [i] }],
  )
  const news = db.sources
    .filter((s) => s.publishedAt)
    .map((s) => ({
      date: s.publishedAt!,
      kind: label(SOURCE_TYPE, s.sourceType),
      title: (
        <a href={s.url} target="_blank" rel="noopener noreferrer">
          {s.title}
        </a>
      ),
      description: s.publisher,
      incidents: incidents.filter((i) => incidentSourceIds(i).includes(s.id)),
    }))
  // Stable sort: on the same day, incident events stay ahead of news.
  return [...events, ...news].sort((a, b) => b.date.localeCompare(a.date))
}

const Page = () => {
  const entries = buildEntries()
  const days = Map.groupBy(entries, (e) => e.date)
  return (
    <>
      <Breadcrumbs items={[{ name: "TIMELINE", href: "/timeline/" }]} />
      <PageTitle kicker="TIMELINE">タイムライン（{entries.length}件）</PageTitle>
      {[...days].map(([date, list]) => (
        <section key={date} style={{ marginBottom: "1.5rem" }}>
          <Mono style={{ color: color.accent, fontSize: ".9rem" }}>{date}</Mono>
          <ol style={{ borderLeft: `2px solid ${color.accent}`, listStyle: "none", paddingLeft: "1rem", marginTop: ".5rem" }}>
            {list.map((e, n) => (
              <li key={n} style={{ marginBottom: "1rem" }}>
                <p style={{ fontWeight: 600 }}>
                  <Tag>{e.kind}</Tag> {e.title}
                </p>
                {e.description && <Muted>{e.description}</Muted>}
                {e.incidents.length > 0 && (
                  <p style={{ display: "flex", flexDirection: "column" }}>{e.incidents.map(incidentLink)}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  )
}
export default Page
