import { Metadata } from "next"
import Link from "next/link"
import { Breadcrumbs, Card, color, Grid, Mono, PageTitle } from "@/components/ui"
import { db, incidentsForTechnique } from "@/lib/data"

export const metadata: Metadata = {
  title: "攻撃手法一覧",
  description: "SQLインジェクション、ランサムウェア、サプライチェーン攻撃など、インシデントで確認された攻撃手法の解説と関連事例。",
  alternates: { canonical: "/techniques/" },
}

const Page = () => (
  <>
    <Breadcrumbs items={[{ name: "TECHNIQUES", href: "/techniques/" }]} />
    <PageTitle kicker="TECHNIQUES">攻撃手法一覧</PageTitle>
    <Grid min="18rem">
      {db.techniques.map((t) => (
        <Card key={t.id} style={{ display: "grid", gap: ".4rem" }}>
          <h2 style={{ fontSize: "1rem" }}>
            <Link href={`/techniques/${t.slug}/`}>{t.nameJa}</Link>
          </h2>
          <Mono style={{ color: color.muted, fontSize: ".75rem" }}>
            {t.name}
            {t.mitreAttackIds.length > 0 && ` / ${t.mitreAttackIds.join(", ")}`}
          </Mono>
          <p style={{ fontSize: ".85rem" }}>{t.description}</p>
          <Mono style={{ color: color.accent, fontSize: ".75rem" }}>
            関連インシデント {incidentsForTechnique(t.slug).length}件
          </Mono>
        </Card>
      ))}
    </Grid>
  </>
)
export default Page
