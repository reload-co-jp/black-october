import { SEVERITY_ORDER } from "./labels"
import { hasKnownCause, StudyRow, THEMES } from "./study"

/** Monday (UTC) of the ISO week containing `date` (YYYY-MM-DD). */
export const weekStart = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

export const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export type Period = {
  kind: "month" | "week"
  /** "2026-11" for a month, the Monday "2026-11-09" for a week. */
  key: string
  from: string
  to: string
  label: string
  path: string
}

const md = (d: string) =>
  `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`

export const monthPeriod = (key: string): Period => {
  const [y, m] = key.split("-").map(Number)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return {
    kind: "month",
    key,
    from: `${key}-01`,
    to: `${key}-${String(last).padStart(2, "0")}`,
    label: `${y}年${m}月`,
    path: `/study/digest/${key}/`,
  }
}

export const weekPeriod = (key: string): Period => {
  const to = addDays(key, 6)
  return {
    kind: "week",
    key,
    from: key,
    to,
    label: `${key.slice(0, 4)}年${md(key)}〜${md(to)}の週`,
    path: `/study/digest/week/${key}/`,
  }
}

/** Periods that have at least one disclosed incident, newest first. */
export const periodsOf = (rows: Pick<StudyRow, "disclosedAt">[]) => {
  const uniq = (xs: string[]) => [...new Set(xs)].sort().reverse()
  return {
    months: uniq(rows.map((r) => r.disclosedAt.slice(0, 7))).map(monthPeriod),
    weeks: uniq(rows.map((r) => weekStart(r.disclosedAt))).map(weekPeriod),
  }
}

export const inPeriod = (rows: StudyRow[], p: Period) =>
  rows.filter((r) => r.disclosedAt >= p.from && r.disclosedAt <= p.to)

/** First sentence, capped so one line stays one line. */
export const firstSentence = (s: string, max = 90) => {
  const t = s.trim()
  const end = t.indexOf("。")
  const one = end < 0 ? t : t.slice(0, end + 1)
  return one.length > max ? `${one.slice(0, max - 1)}…` : one
}

const bySeverity = (a: StudyRow, b: StudyRow) =>
  SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
const byAffected = (a: StudyRow, b: StudyRow) =>
  (b.affectedUsers ?? -1) - (a.affectedUsers ?? -1)
const byNewest = (a: StudyRow, b: StudyRow) =>
  b.disclosedAt.localeCompare(a.disclosedAt)

/** Everything a digest page shows, computed from the rows of one period. */
export const buildDigest = (rows: StudyRow[]) => {
  const known = rows.filter(hasKnownCause)
  const affected = rows.filter((r) => r.affectedUsers != null)
  const themes = THEMES.map((t) => ({
    theme: t,
    rows: rows
      .filter((r) => r.themes.includes(t.id))
      .sort((a, b) => bySeverity(a, b) || byAffected(a, b) || byNewest(a, b)),
  }))
    .filter((t) => t.rows.length)
    .sort((a, b) => b.rows.length - a.rows.length)
  return {
    total: rows.length,
    knownCause: known.length,
    severe: rows.filter(
      (r) => r.severity === "critical" || r.severity === "high"
    ).length,
    affectedKnown: affected.length,
    themes,
    /** Cases with a published cause and lessons: the ones worth discussing. */
    lessons: known
      .filter((r) => r.lessons.length)
      .sort((a, b) => bySeverity(a, b) || byAffected(a, b) || byNewest(a, b))
      .slice(0, 5),
    largest: [...affected]
      .sort((a, b) => byAffected(a, b) || byNewest(a, b))
      .slice(0, 5),
    /** Severe cases whose cause is still unpublished: watch for follow-ups. */
    pending: rows
      .filter(
        (r) =>
          !hasKnownCause(r) &&
          (r.severity === "critical" || r.severity === "high")
      )
      .sort((a, b) => bySeverity(a, b) || byAffected(a, b) || byNewest(a, b))
      .slice(0, 8),
  }
}
export type Digest = ReturnType<typeof buildDigest>
