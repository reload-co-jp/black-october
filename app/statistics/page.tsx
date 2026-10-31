import { Metadata } from "next"
import Link from "next/link"
import { Bars, Breadcrumbs, color, DailyColumns, Grid, Muted, PageTitle, Section } from "@/components/ui"
import { db, getTechnique } from "@/lib/data"
import { CATEGORY, label, SEVERITY, SEVERITY_COLOR, SEVERITY_ORDER } from "@/lib/labels"
import { PERIOD } from "@/lib/site"
import { computeStats } from "@/lib/statistics"

export const metadata: Metadata = {
  title: "統計",
  description: "2026年10月のサイバーセキュリティインシデントを、発生日・公表日・カテゴリ・業種・深刻度・攻撃手法別に集計。",
  alternates: { canonical: "/statistics/" },
}

const bySeverityOrder = (xs: { key: string; count: number }[]) =>
  [...xs].sort((a, b) => SEVERITY_ORDER.indexOf(a.key) - SEVERITY_ORDER.indexOf(b.key))

const Page = () => {
  const s = computeStats(db, PERIOD.from, PERIOD.to)
  const sev = (k: string) => SEVERITY_COLOR[k] ?? color.muted
  return (
    <>
      <Breadcrumbs items={[{ name: "STATISTICS", href: "/statistics/" }]} />
      <PageTitle kicker="STATISTICS">統計</PageTitle>
      <Muted>
        登録済み {s.incidents} 件のインシデントと {s.vulnerabilities} 件の脆弱性を集計しています。続報は同一インシデントに統合しているため重複計上はありません。
        発生日が公表されていない事案は日別発生数に含まれません。
      </Muted>
      <Grid min="24rem" gap="0 2rem">
        <Section title="日別インシデント発生数"><DailyColumns data={s.byOccurredDay} /></Section>
        <Section title="日別公表件数"><DailyColumns data={s.byDisclosedDay} /></Section>
        <Section title="カテゴリ別件数">
          <Bars data={s.byCategory} format={(k) => <Link href={`/incidents/?category=${k}`}>{label(CATEGORY, k)}</Link>} />
        </Section>
        <Section title="国内・海外"><Bars data={s.byRegion} /></Section>
        <Section title="業種別件数"><Bars data={s.byIndustry} /></Section>
        <Section title="深刻度別件数">
          <Bars data={bySeverityOrder(s.bySeverity)} format={(k) => label(SEVERITY, k)} barColor={sev} />
        </Section>
        <Section title="攻撃手法別件数（確認済みのみ）">
          <Bars data={s.byTechnique} format={(k) => <Link href={`/techniques/${k}/`}>{getTechnique(k)?.nameJa ?? k}</Link>} />
        </Section>
        <Section title="脆弱性の深刻度分布（CVSS）">
          <Bars data={bySeverityOrder(s.byVulnSeverity)} format={(k) => label(SEVERITY, k)} barColor={sev} />
        </Section>
      </Grid>
    </>
  )
}
export default Page
