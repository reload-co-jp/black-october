import { Metadata } from "next"
import Link from "next/link"
import { ReactNode } from "react"
import { Breadcrumbs, color, Mono, Muted, PageTitle, Tag } from "@/components/ui"
import { db, incidents, incidentSourceIds } from "@/lib/data"
import { label, SOURCE_TYPE } from "@/lib/labels"
import { Incident } from "@/lib/validation"
import styles from "./timeline.module.css"

export const metadata: Metadata = {
  title: "タイムライン",
  description: "インシデントの経緯と関連ニュース・公式発表を、日付順に一覧できるタイムライン。",
  alternates: { canonical: "/timeline/" },
}

type Entry = { date: string; kind: string; title: ReactNode; description?: string | null; incidents: Incident[] }

const KIND_COLOR: Record<string, string> = {
  経緯: "#e5262b",
  公表: "#ff7a1a",
  [SOURCE_TYPE.official]: "#e6b800",
  [SOURCE_TYPE.advisory]: "#a371f7",
  [SOURCE_TYPE.government]: "#3fb950",
  [SOURCE_TYPE.media]: "#4aa3ff",
  [SOURCE_TYPE.research]: "#39c5cf",
}

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

// Groups shown up front in a day card; the rest fold into "他N件".
const VISIBLE = 4

const groupEntry = (group: Entry[], n: number) => {
  const related = group[0].incidents
  const heading = related.length ? related[0].title : group[0].title
  return (
    <details key={n} className={styles.entry}>
      <summary style={{ fontWeight: 600 }}>
        {[...new Set(group.map((e) => e.kind))].map((k) => (
          <span key={k} title={k} aria-label={k} className={styles.dot} style={{ background: KIND_COLOR[k] }} />
        ))}{" "}
        {heading}
        {group.length > 1 && <span style={{ color: color.muted }}>（{group.length}件）</span>}
      </summary>
      {group.map((e, m) => (
        <div key={m} style={{ marginTop: ".5rem" }}>
          <p>
            <Tag color={KIND_COLOR[e.kind]}>{e.kind}</Tag> {e.title !== heading && e.title}
          </p>
          {e.description && <Muted>{e.description}</Muted>}
        </div>
      ))}
      {related.length > 0 && (
        <p style={{ display: "flex", flexDirection: "column", marginTop: ".5rem" }}>{related.map(incidentLink)}</p>
      )}
    </details>
  )
}

const Page = () => {
  const entries = buildEntries()
  const days = Map.groupBy(entries, (e) => e.date)
  return (
    <>
      <Breadcrumbs items={[{ name: "TIMELINE", href: "/timeline/" }]} />
      <PageTitle kicker="TIMELINE">タイムライン（{entries.length}件）</PageTitle>
      <ol style={{ listStyle: "none", padding: 0 }}>
        {[...days].map(([date, list]) => {
          const groups = [...Map.groupBy(list, (e, n) => e.incidents.map((i) => i.id).join() || `#${n}`).values()]
          return (
            <li key={date} className={styles.row}>
              <div className={styles.rail}>
                <div className={styles.line} />
                <div className={styles.marker} />
              </div>
              <time dateTime={date} className={styles.date}>
                <Mono>{date}</Mono>
              </time>
              <section className={styles.card}>
                <div className={styles.entries}>
                  {groups.slice(0, VISIBLE).map(groupEntry)}
                  {groups.length > VISIBLE && (
                    <>
                      <div className={styles.extra}>{groups.slice(VISIBLE).map(groupEntry)}</div>
                      <details className={styles.more}>
                        <summary>
                          <span className={styles.closed}>他{groups.length - VISIBLE}件</span>
                          <span className={styles.opened}>閉じる</span>
                        </summary>
                      </details>
                    </>
                  )}
                </div>
              </section>
            </li>
          )
        })}
      </ol>
    </>
  )
}
export default Page
