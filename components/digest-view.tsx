import Link from "next/link"
import { CSSProperties, FC, ReactNode } from "react"
import { SEVERITY, SEVERITY_COLOR, label } from "@/lib/labels"
import { Digest, firstSentence, Period } from "@/lib/digest"
import { formatPeople, getTheme, StudyRow } from "@/lib/study"
import { Bars, Card, color, Facts, Grid, Mono, Muted, Section } from "./ui"

const small: CSSProperties = { color: color.muted, fontSize: ".8rem" }

/** Title linking to the detail page, plus a jump into the study board. */
const CaseLink: FC<{ r: StudyRow; children?: ReactNode }> = ({
  r,
  children,
}) => (
  <>
    <span
      aria-hidden
      style={{ color: SEVERITY_COLOR[r.severity], marginRight: ".35rem" }}
      title={label(SEVERITY, r.severity)}
    >
      ●
    </span>
    <Link href={`/incidents/${r.slug}/`}>{r.title}</Link>
    {children}{" "}
    <Link
      href={`/study/#${r.slug}`}
      style={{ color: color.muted, fontSize: ".75rem", whiteSpace: "nowrap" }}
    >
      ボードで開く
    </Link>
  </>
)

const List: FC<{ children: ReactNode }> = ({ children }) => (
  <ul style={{ display: "grid", gap: ".5rem", listStyle: "none", padding: 0 }}>
    {children}
  </ul>
)

/** Plain-language takeaways computed from the data: no editorial guessing. */
const highlights = (d: Digest) => {
  const out: string[] = []
  const top = d.themes[0]
  if (top)
    out.push(
      `最も多かったテーマは「${top.theme.name}」（${top.rows.length}件）。`
    )
  const big = d.largest[0]
  if (big?.affectedUsers)
    out.push(
      `影響規模が最大だったのは${big.organization}（最大${formatPeople(big.affectedUsers)}人）。`
    )
  out.push(
    `${d.total}件のうち、原因が公表されたのは${d.knownCause}件。${
      d.total - d.knownCause
    }件は調査中。`
  )
  const supply = d.themes.find((t) => t.theme.id === "supply-chain")
  if (supply && supply.rows.length * 4 >= d.total)
    out.push(
      `${supply.rows.length}件（${Math.round((supply.rows.length / d.total) * 100)}%）が委託先・外部サービス経由。自社の外にあるデータの管理が焦点。`
    )
  return out
}

export const DigestView: FC<{
  period: Period
  digest: Digest
  prev?: Period
  next?: Period
  /** The other granularity ("this month" from a week, and vice versa). */
  related?: Period[]
}> = ({ period, digest: d, prev, next, related = [] }) => {
  if (!d.total) return <Muted>この期間に公表された事例はありません。</Muted>
  return (
    <>
      <Facts
        items={[
          ["公表された事例", <Mono key="t">{d.total}件</Mono>],
          ["深刻度 緊急・高", <Mono key="s">{d.severe}件</Mono>],
          ["原因が公表済み", <Mono key="k">{d.knownCause}件</Mono>],
          // Counts are not summed: many are cumulative records, and supply-chain
          // cases report the same breach once per affected client.
          [
            "影響人数が公表された事例",
            <Mono key="a">{d.affectedKnown}件</Mono>,
          ],
        ]}
      />

      <Section title="この期間のポイント">
        <ul style={{ display: "grid", gap: ".4rem", paddingLeft: "1.2rem" }}>
          {highlights(d).map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Section>

      <Section title="議論したい事例（原因・教訓が公表済み）">
        {d.lessons.length ? (
          <Grid min="22rem">
            {d.lessons.map((r) => (
              <Card
                key={r.slug}
                style={{ display: "grid", gap: ".5rem", alignContent: "start" }}
              >
                <p style={{ fontWeight: 600, lineHeight: 1.45 }}>
                  <CaseLink r={r} />
                </p>
                <p style={small}>
                  {r.disclosedAt}・{r.organization}
                  {r.affectedUsers != null &&
                    `・${formatPeople(r.affectedUsers)}人`}
                </p>
                <p style={{ fontSize: ".85rem" }}>
                  <b style={{ color: color.accent }}>なぜ</b>{" "}
                  {firstSentence(r.cause)}
                </p>
                <ul style={{ fontSize: ".85rem", paddingLeft: "1.2rem" }}>
                  {r.lessons.slice(0, 2).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </Grid>
        ) : (
          <Muted>原因と教訓がそろって公表された事例はまだありません。</Muted>
        )}
      </Section>

      <Section title="テーマ別">
        <Bars
          data={d.themes.map((t) => ({
            key: t.theme.id,
            count: t.rows.length,
          }))}
          format={(id) => (
            <Link href={`/study/#theme-${id}`}>{getTheme(id)?.name ?? id}</Link>
          )}
        />
        <div style={{ marginTop: "1.25rem" }}>
          <Grid min="22rem">
            {d.themes.map(({ theme, rows }) => (
              <div key={theme.id}>
                <h3 style={{ fontSize: ".95rem", marginBottom: ".4rem" }}>
                  {theme.name} <Mono style={small}>{rows.length}件</Mono>
                </h3>
                <List>
                  {rows.slice(0, 3).map((r) => (
                    <li key={r.slug} style={{ fontSize: ".85rem" }}>
                      <CaseLink r={r} />
                    </li>
                  ))}
                </List>
                {rows.length > 3 && (
                  <p style={small}>ほか{rows.length - 3}件</p>
                )}
              </div>
            ))}
          </Grid>
        </div>
        <p style={{ ...small, marginTop: "1rem" }}>
          テーマは公表された原因・概要の文面からキーワードで分類しています。原因未公表の事例は分類されないことがあります。
        </p>
      </Section>

      <Section title="影響規模が大きい事例">
        {d.largest.length ? (
          <List>
            {d.largest.map((r) => (
              <li key={r.slug}>
                <Mono style={{ color: color.text, marginRight: ".5rem" }}>
                  {formatPeople(r.affectedUsers ?? 0)}人
                </Mono>
                <CaseLink r={r} />
              </li>
            ))}
          </List>
        ) : (
          <Muted>影響人数が公表された事例はありません。</Muted>
        )}
      </Section>

      {d.pending.length > 0 && (
        <Section title="続報待ち（深刻度が高く原因は調査中）">
          <List>
            {d.pending.map((r) => (
              <li key={r.slug} style={{ fontSize: ".9rem" }}>
                <CaseLink r={r}>
                  <span style={small}> ・{r.disclosedAt}</span>
                </CaseLink>
              </li>
            ))}
          </List>
        </Section>
      )}

      <nav
        aria-label="期間の移動"
        style={{
          borderTop: `1px solid ${color.border}`,
          display: "flex",
          flexWrap: "wrap",
          gap: ".75rem 1.5rem",
          justifyContent: "space-between",
          marginTop: "2rem",
          paddingTop: "1rem",
        }}
      >
        <span>{prev && <Link href={prev.path}>← {prev.label}</Link>}</span>
        <span style={{ display: "flex", flexWrap: "wrap", gap: ".5rem 1rem" }}>
          {related.map((p) => (
            <Link key={p.path} href={p.path}>
              {p.label}のダイジェスト
            </Link>
          ))}
          <Link href="/study/digest/">バックナンバー</Link>
          <Link href="/study/">勉強ボード</Link>
        </span>
        <span>{next && <Link href={next.path}>{next.label} →</Link>}</span>
      </nav>
      <p style={{ ...small, marginTop: ".75rem" }}>
        対象: {period.from}〜{period.to} に公表された事例。
      </p>
    </>
  )
}
