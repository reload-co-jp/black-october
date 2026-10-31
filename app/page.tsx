import Link from "next/link"
import { FC } from "react"
import { IncidentCard } from "@/components/incident-card"
import { Bars, Card, color, Grid, mono, Muted, Section } from "@/components/ui"
import { db, getTechnique, incidents, toCard } from "@/lib/data"
import { PERIOD } from "@/lib/site"
import { computeStats } from "@/lib/statistics"

// Techniques highlighted on the top page, in this order.
const HOME_TECHNIQUES = [
  "credential-theft",
  "vulnerability-exploitation",
  "sql-injection",
  "remote-code-execution",
  "phishing",
  "ransomware",
  "misconfiguration",
  "supply-chain",
]

const Stat: FC<{ label: string; value: number; href: string }> = ({
  label,
  value,
  href,
}) => (
  <Link href={href} style={{ color: "inherit" }}>
    <Card>
      <p style={{ color: color.muted, fontSize: ".8rem" }}>{label}</p>
      <p style={{ ...mono, color: color.text, fontSize: "2rem" }}>{value}</p>
    </Card>
  </Link>
)

const Page: FC = () => {
  const s = computeStats(db, PERIOD.from, PERIOD.to)
  const featured = incidents.filter((i) => i.featured)
  const techniqueCounts = new Map(s.byTechnique.map((t) => [t.key, t.count]))
  return (
    <>
      <section
        style={{
          borderBottom: `1px solid ${color.border}`,
          padding: "3rem 0 2.5rem",
        }}
      >
        <p style={{ color: color.accent, fontWeight: 600 }}>
          2026 CYBERSECURITY INCIDENT ARCHIVE
        </p>
        <h1
          style={{
            fontSize: "clamp(2.2rem, 9vw, 4.5rem)",
            fontWeight: 600,
            lineHeight: 1.1,
            margin: ".5rem 0 1rem",
          }}
        >
          BLACK OCTOBER <span style={{ color: color.accent }}>2026</span>
        </h1>
        <p style={{ fontSize: "1.05rem" }}>
          2026年10月のサイバーインシデントを記録するアーカイブ
        </p>
        <p style={{ ...mono, color: color.muted, fontSize: ".85rem" }}>
          対象期間：2026/10/01〜2026/10/31
        </p>
        <p style={{ color: color.muted, marginTop: "1rem", maxWidth: "40rem" }}>
          何が起きたのか。何が原因だったのか。どのような対応が行われたのか。
          一次情報に基づき、経緯・原因・影響・対応・教訓までを整理します。
        </p>
      </section>

      <Section title="Statistics">
        <Grid min="10rem">
          <Stat label="インシデント" value={s.incidents} href="/incidents/" />
          <Stat label="脆弱性" value={s.vulnerabilities} href="/vulnerabilities/" />
          <Stat
            label="情報漏洩"
            value={s.dataBreach}
            href="/incidents/?category=data-breach"
          />
          <Stat
            label="不正アクセス"
            value={s.unauthorizedAccess}
            href="/incidents/?category=unauthorized-access"
          />
          <Stat
            label="ランサムウェア"
            value={s.ransomware}
            href="/incidents/?category=ransomware"
          />
        </Grid>
      </Section>

      {featured.length > 0 && (
        <Section title="Featured">
          <Grid min="20rem">
            {featured.map((i) => (
              <IncidentCard key={i.id} incident={toCard(i)} />
            ))}
          </Grid>
        </Section>
      )}

      <Section title="Latest Incidents">
        <Grid min="20rem">
          {incidents.slice(0, 6).map((i) => (
            <IncidentCard key={i.id} incident={toCard(i)} />
          ))}
        </Grid>
        <p style={{ marginTop: "1rem" }}>
          <Link href="/incidents/">すべてのインシデントを見る →</Link>
        </p>
      </Section>

      <Section title="By Technique">
        <Bars
          data={HOME_TECHNIQUES.map((slug) => ({
            key: slug,
            count: techniqueCounts.get(slug) ?? 0,
          }))}
          format={(slug) => (
            <Link href={`/techniques/${slug}/`}>
              {getTechnique(slug)?.nameJa ?? slug}
            </Link>
          )}
        />
        <Muted>
          確認済みの攻撃手法のみ計上しています。原因未公表の事案は含まれません。
        </Muted>
      </Section>
    </>
  )
}

export default Page
