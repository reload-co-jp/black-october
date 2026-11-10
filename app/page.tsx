import Link from "next/link"
import { FC } from "react"
import { IncidentCard } from "@/components/incident-card"
import { Bars, Card, color, Grid, mono, Muted, Section } from "@/components/ui"
import { db, getTechnique, incidents, toCard } from "@/lib/data"
import { PERIOD } from "@/lib/site"
import { computeStats } from "@/lib/statistics"
import hero from "./hero.module.css"

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
      <section className={hero.hero}>
        <span className={hero.badge}>
          <span className={hero.dot} />
          2026 CYBERSECURITY INCIDENT ARCHIVE
        </span>
        <h1 className={hero.title}>
          BLACK OCTOBER <span className={hero.accent}>2026</span>
        </h1>
        <p className={hero.lead}>
          2026年10月のサイバーインシデントを記録するアーカイブ。
          一次情報に基づき、経緯・原因・影響・対応・教訓までを整理します。
        </p>
        <div className={hero.actions}>
          <Link href="/incidents/" className={hero.primary}>
            インシデントを見る →
          </Link>
          <Link href="/study/" className={hero.secondary}>
            事例から学ぶ
          </Link>
          <Link href="/statistics/" className={hero.secondary}>
            統計
          </Link>
        </div>
        <p className={hero.period} style={mono}>
          対象期間：2026/10/01〜2026/10/31
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
