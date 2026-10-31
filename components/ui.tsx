import Link from "next/link"
import { CSSProperties, FC, ReactNode } from "react"
import {
  CATEGORY,
  COUNTRY,
  label,
  SEVERITY,
  SEVERITY_COLOR,
  STATUS,
  VERIFICATION,
} from "@/lib/labels"
import { SITE_URL } from "@/lib/site"

export const color = {
  bg: "#0d1117",
  panel: "#161b22",
  panel2: "#21262d",
  border: "#30363d",
  text: "#e6edf3",
  muted: "#8b949e",
  accent: "#e5262b",
  accentSoft: "rgba(229, 38, 43, 0.12)",
}
export const mono: CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
}

export const Mono: FC<{ children: ReactNode; style?: CSSProperties }> = ({
  children,
  style,
}) => <span style={{ ...mono, ...style }}>{children}</span>

export const DateText: FC<{ value: string | null; label?: string }> = ({
  value,
  label,
}) => (
  <span style={{ whiteSpace: "nowrap" }}>
    {label && <span style={{ color: color.muted }}>{label} </span>}
    <Mono>{value ?? "不明"}</Mono>
  </span>
)

const pill = (fg: string, bg = "transparent"): CSSProperties => ({
  border: `1px solid ${fg}`,
  borderRadius: "2em",
  color: fg,
  background: bg,
  display: "inline-block",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: "18px",
  padding: "0 7px",
  whiteSpace: "nowrap",
})

export const SeverityBadge: FC<{ value: string }> = ({ value }) => (
  <span style={pill(SEVERITY_COLOR[value] ?? color.muted)}>
    {value.toUpperCase()} / {label(SEVERITY, value)}
  </span>
)

export const Tag: FC<{ children: ReactNode; href?: string }> = ({
  children,
  href,
}) => {
  const el = <span style={pill(color.muted)}>{children}</span>
  return href ? <Link href={href}>{el}</Link> : el
}

export const CategoryTags: FC<{ values: string[] }> = ({ values }) => (
  <>
    {values.map((c) => (
      <Tag key={c} href={`/incidents/?category=${c}`}>
        {label(CATEGORY, c)}
      </Tag>
    ))}
  </>
)

const verificationColor: Record<string, string> = {
  confirmed: "#3fb950",
  partially_confirmed: "#d29922",
  possible: "#d29922",
  unconfirmed: "#db6d28",
  under_investigation: "#db6d28",
  unknown: color.muted,
}
export const VerificationBadge: FC<{ value: string }> = ({ value }) => (
  <span style={pill(verificationColor[value] ?? color.muted)}>
    {label(VERIFICATION, value)}
  </span>
)
export const StatusText: FC<{ value: string }> = ({ value }) => (
  <span>{label(STATUS, value)}</span>
)
export const countryLabel = (c: string) =>
  `${label(COUNTRY, c)}（${c === "JP" ? "国内" : "海外"}）`

export const Row: FC<{ children: ReactNode; style?: CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      alignItems: "center",
      display: "flex",
      flexWrap: "wrap",
      gap: ".4rem .6rem",
      ...style,
    }}
  >
    {children}
  </div>
)

export const Card: FC<{ children: ReactNode; style?: CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: color.panel,
      border: `1px solid ${color.border}`,
      borderRadius: 6,
      padding: "1rem",
      ...style,
    }}
  >
    {children}
  </div>
)

export const Grid: FC<{ children: ReactNode; min?: string; gap?: string }> = ({
  children,
  min = "16rem",
  gap = "1rem",
}) => (
  <div
    style={{
      display: "grid",
      gap,
      gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}, 100%), 1fr))`,
    }}
  >
    {children}
  </div>
)

export const Section: FC<{
  title: string
  id?: string
  children: ReactNode
}> = ({ title, id, children }) => (
  <section id={id} style={{ margin: "2.5rem 0" }}>
    <h2
      style={{
        borderBottom: `1px solid ${color.border}`,
        color: color.text,
        fontSize: "1.25rem",
        fontWeight: 600,
        marginBottom: "1rem",
        paddingBottom: ".3em",
      }}
    >
      {title}
    </h2>
    {children}
  </section>
)

export const PageTitle: FC<{ kicker?: string; children: ReactNode }> = ({
  kicker,
  children,
}) => (
  <header style={{ margin: "1rem 0 1.5rem" }}>
    {kicker && (
      <p
        style={{
          color: color.accent,
          fontSize: ".75rem",
          fontWeight: 600,
        }}
      >
        {kicker}
      </p>
    )}
    <h1
      style={{
        fontSize: "clamp(1.4rem, 4vw, 2rem)",
        fontWeight: 600,
        lineHeight: 1.25,
      }}
    >
      {children}
    </h1>
  </header>
)

export const Muted: FC<{ children: ReactNode }> = ({ children }) => (
  <p style={{ color: color.muted }}>{children}</p>
)

/** Definition list rendered as a 2-column grid that stacks on mobile. */
export const Facts: FC<{ items: [string, ReactNode][] }> = ({ items }) => (
  <dl
    style={{
      display: "grid",
      gap: "1px",
      gridTemplateColumns: "repeat(auto-fill, minmax(min(15rem, 100%), 1fr))",
      background: color.border,
      border: `1px solid ${color.border}`,
      borderRadius: 6,
      overflow: "hidden",
    }}
  >
    {items.map(([k, v]) => (
      <div key={k} style={{ background: color.panel, padding: ".6rem .8rem" }}>
        <dt style={{ color: color.muted, fontSize: ".75rem" }}>{k}</dt>
        <dd style={{ marginTop: ".2rem" }}>{v}</dd>
      </div>
    ))}
  </dl>
)

export const List: FC<{ items: ReactNode[]; empty?: string }> = ({
  items,
  empty = "情報なし",
}) =>
  items.length ? (
    <ul style={{ display: "grid", gap: ".4rem", paddingLeft: "1.2rem" }}>
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  ) : (
    <Muted>{empty}</Muted>
  )

export type Crumb = { name: string; href: string }

export const JsonLd: FC<{ data: object }> = ({ data }) => (
  <script
    type="application/ld+json"
    // JSON-LD must be raw; "<" is escaped so data can't close the tag.
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    }}
  />
)

export const Breadcrumbs: FC<{ items: Crumb[] }> = ({ items }) => {
  const all = [{ name: "HOME", href: "/" }, ...items]
  return (
    <nav aria-label="パンくずリスト" style={{ fontSize: ".875rem" }}>
      <ol
        style={{
          color: color.muted,
          display: "flex",
          flexWrap: "wrap",
          gap: ".4rem",
          listStyle: "none",
          padding: 0,
        }}
      >
        {all.map((c, i) => (
          <li key={c.href}>
            {i > 0 && <span aria-hidden> / </span>}
            {i === all.length - 1 ? (
              <span aria-current="page">{c.name}</span>
            ) : (
              <Link href={c.href}>{c.name}</Link>
            )}
          </li>
        ))}
      </ol>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: new URL(c.href, SITE_URL).toString(),
          })),
        }}
      />
    </nav>
  )
}

/** Horizontal bar chart in plain HTML; hidden when there is nothing to show. */
export const Bars: FC<{
  data: { key: string; count: number }[]
  format?: (key: string) => ReactNode
  barColor?: (key: string) => string
}> = ({ data, format = (k) => k, barColor = () => color.accent }) => {
  const max = Math.max(...data.map((d) => d.count), 0)
  if (!max) return <Muted>集計できるデータがまだありません。</Muted>
  return (
    <div style={{ display: "grid", gap: ".35rem" }}>
      {data.map((d) => (
        <div
          key={d.key}
          style={{
            alignItems: "center",
            display: "grid",
            gap: ".6rem",
            gridTemplateColumns: "minmax(6rem, 30%) 1fr 2.5rem",
          }}
        >
          <span style={{ fontSize: ".85rem" }}>{format(d.key)}</span>
          <span
            style={{
              background: color.panel2,
              borderRadius: 6,
              height: ".5rem",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                background: barColor(d.key),
                display: "block",
                height: "100%",
                width: `${(d.count / max) * 100}%`,
              }}
            />
          </span>
          <Mono style={{ textAlign: "right" }}>{d.count}</Mono>
        </div>
      ))}
    </div>
  )
}

/** Per-day columns (e.g. 31 days of October). */
export const DailyColumns: FC<{ data: { key: string; count: number }[] }> = ({
  data,
}) => {
  const max = Math.max(...data.map((d) => d.count), 0)
  if (!max) return <Muted>集計できるデータがまだありません。</Muted>
  return (
    <figure>
      <div
        role="img"
        aria-label={data
          .filter((d) => d.count)
          .map((d) => `${d.key}: ${d.count}件`)
          .join(", ")}
        style={{
          alignItems: "end",
          borderBottom: `1px solid ${color.border}`,
          display: "flex",
          gap: 2,
          height: "8rem",
        }}
      >
        {data.map((d) => (
          <span
            key={d.key}
            title={`${d.key}: ${d.count}件`}
            style={{
              background: d.count ? color.accent : color.panel2,
              flex: 1,
              height: d.count ? `${(d.count / max) * 100}%` : 2,
            }}
          />
        ))}
      </div>
      <figcaption
        style={{
          ...mono,
          color: color.muted,
          display: "flex",
          fontSize: ".7rem",
          justifyContent: "space-between",
          marginTop: ".3rem",
        }}
      >
        <span>{data[0]?.key}</span>
        <span>最大 {max}件/日</span>
        <span>{data.at(-1)?.key}</span>
      </figcaption>
    </figure>
  )
}
