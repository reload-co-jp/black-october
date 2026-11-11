import { Metadata } from "next"
import Link from "next/link"
import { DigestPage, periods } from "@/components/digest-page"
import { Mono, Section, color } from "@/components/ui"
import { inPeriod } from "@/lib/digest"
import { OG_BASE } from "@/lib/site"
import { studyRows } from "@/lib/study-data"

const TITLE = "セキュリティ事故・不正アクセス 週次・月次ダイジェスト"
const DESCRIPTION =
  "国内で公表されたセキュリティ事故・不正アクセス・情報漏えいを週ごと・月ごとに要約。最新週の要点と、テーマ別件数・原因と教訓が公表された事例のバックナンバー。"

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/study/digest/" },
  openGraph: {
    ...OG_BASE,
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "/study/digest/",
  },
}

const Archive = ({
  title,
  list,
}: {
  title: string
  list: typeof periods.weeks
}) => (
  <Section title={title}>
    <ul
      style={{
        display: "grid",
        gap: ".35rem 1.5rem",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(16rem, 100%), 1fr))",
        paddingLeft: "1.2rem",
      }}
    >
      {list.map((p) => (
        <li key={p.key}>
          <Link href={p.path}>{p.label}</Link>{" "}
          <Mono style={{ color: color.muted, fontSize: ".75rem" }}>
            {inPeriod(studyRows, p).length}件
          </Mono>
        </li>
      ))}
    </ul>
  </Section>
)

// The index shows the newest week in full, then the back numbers.
const Page = () => (
  <>
    <DigestPage
      period={periods.weeks[0]}
      heading={`最新週のダイジェスト（${periods.weeks[0].label}）`}
    />
    <Archive title="月次ダイジェスト" list={periods.months} />
    <Archive title="週次ダイジェスト" list={periods.weeks} />
  </>
)
export default Page
