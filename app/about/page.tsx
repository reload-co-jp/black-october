import { Metadata } from "next"
import Link from "next/link"
import { Breadcrumbs, List, PageTitle, Section } from "@/components/ui"
import { archiveMonths } from "@/lib/data"

export const metadata: Metadata = {
  title: "About",
  description: "BLACK OCTOBERの編集方針、情報の確認状況の表記、データの更新方法について。",
  alternates: { canonical: "/about/" },
}

const Page = () => (
  <>
    <Breadcrumbs items={[{ name: "ABOUT", href: "/about/" }]} />
    <PageTitle kicker="ABOUT">BLACK OCTOBER について</PageTitle>
    <p>
      BLACK OCTOBER は、2026年10月に発生・公表されたサイバーセキュリティインシデントを記録するアーカイブです。
      ニュースのリンク集ではなく、各事象の経緯・技術的原因・影響範囲・対応・再発防止策を整理し、実際の事例を通してセキュリティを学べることを目指しています。
    </p>
    <Section title="編集方針">
      <List
        items={[
          "一次情報（当事者の公式発表、公的機関・ベンダーのアドバイザリ）を優先し、すべての記述に出典を記録します。",
          "発生日・発覚日・公表日を区別して記録します。",
          "初報と続報は同一インシデントの時系列に統合し、重複計上しません。",
          "公表されていない原因・被害・攻撃手法を推測で補完・断定しません。",
          "実際の攻撃に悪用できる侵入手順や機密情報は掲載しません。",
          "情報源の文章は全文転載せず、要約と出典リンクで紹介します。",
        ]}
      />
    </Section>
    <Section title="確認状況の表記">
      <List
        items={[
          "確認済み — 当事者または公的機関の発表で確認できる事実",
          "一部確認 — 一部は確認済みだが、範囲・件数などが調査中",
          "可能性あり — 当事者が可能性として公表している事項",
          "調査中 / 不明 — 公表されていない、または調査中の事項",
        ]}
      />
    </Section>
    <Section title="アーカイブ">
      <List items={archiveMonths().map((ym) => <Link key={ym} href={`/archive/${ym.replace("-", "/")}/`}>{ym.replace("-", "年")}月</Link>)} />
    </Section>
    <Section title="誤りの報告">
      <p>掲載内容に誤りや更新がある場合は、出典を添えてリポジトリの Issue でお知らせください。</p>
    </Section>
  </>
)
export default Page
