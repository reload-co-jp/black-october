import { Metadata } from "next"
import { IncidentCard } from "@/components/incident-card"
import { Breadcrumbs, Grid, Muted, PageTitle, Section } from "@/components/ui"
import { incidents, toCard } from "@/lib/data"
import { SEVERITY } from "@/lib/labels"

export const metadata: Metadata = {
  title: "深刻度 CRITICAL / HIGH のインシデント",
  description:
    "深刻度が緊急（CRITICAL）・高（HIGH）と評価されたサイバーセキュリティインシデントだけを公表日の新しい順に一覧表示します。",
  alternates: { canonical: "/critical/" },
}

const LEVELS = ["critical", "high"] as const

const Page = () => {
  const groups = LEVELS.map((level) => ({
    level,
    list: incidents.filter((i) => i.severity === level),
  }))
  const total = groups.reduce((n, g) => n + g.list.length, 0)
  return (
    <>
      <Breadcrumbs items={[{ name: "CRITICAL / HIGH", href: "/critical/" }]} />
      <PageTitle kicker="CRITICAL / HIGH">
        深刻度の高いインシデント（{total}件）
      </PageTitle>
      <Muted>
        深刻度が「緊急」「高」のインシデントだけを、公表日の新しい順に並べています。
      </Muted>
      {groups.map(({ level, list }) => (
        <Section
          key={level}
          id={level}
          title={`${level.toUpperCase()} / ${SEVERITY[level]}（${list.length}件）`}
        >
          {list.length ? (
            <Grid min="20rem">
              {list.map((i) => (
                <IncidentCard key={i.id} incident={toCard(i)} />
              ))}
            </Grid>
          ) : (
            <Muted>該当するインシデントはありません。</Muted>
          )}
        </Section>
      ))}
    </>
  )
}
export default Page
