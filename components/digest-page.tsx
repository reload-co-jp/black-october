import { Metadata } from "next"
import { FC } from "react"
import { buildDigest, inPeriod, Period, periodsOf } from "@/lib/digest"
import { OG_BASE, SITE_NAME, SITE_URL } from "@/lib/site"
import { studyRows } from "@/lib/study-data"
import { DigestView } from "./digest-view"
import { Breadcrumbs, JsonLd, PageTitle } from "./ui"

export const periods = periodsOf(studyRows)

const listOf = (p: Period) =>
  p.kind === "month" ? periods.months : periods.weeks

export const findPeriod = (kind: Period["kind"], key: string) =>
  (kind === "month" ? periods.months : periods.weeks).find((p) => p.key === key)

const titleOf = (p: Period) =>
  `${p.label}のセキュリティ事故・不正アクセス ダイジェスト`

export const digestMetadata = (p: Period): Metadata => {
  const rows = inPeriod(studyRows, p)
  const d = buildDigest(rows)
  const description = `${p.label}に公表された国内のセキュリティ事故・不正アクセス・情報漏えい${d.total}件の要点。テーマ別の件数、原因と教訓が公表された事例、影響規模が大きい事例、続報待ちの事例を開発者向けにまとめています。`
  return {
    title: titleOf(p),
    description,
    alternates: { canonical: p.path },
    openGraph: {
      ...OG_BASE,
      type: "article",
      title: titleOf(p),
      description,
      url: p.path,
    },
  }
}

/** Whole digest page body for one period; `heading` overrides the h1. */
export const DigestPage: FC<{ period: Period; heading?: string }> = ({
  period: p,
  heading,
}) => {
  const rows = inPeriod(studyRows, p)
  const list = listOf(p)
  const at = list.findIndex((x) => x.key === p.key)
  const related =
    p.kind === "week"
      ? periods.months.filter(
          (m) => m.key === p.from.slice(0, 7) || m.key === p.to.slice(0, 7)
        )
      : periods.weeks.filter((w) => w.key.startsWith(p.key)).reverse()
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "STUDY", href: "/study/" },
          { name: "DIGEST", href: "/study/digest/" },
          ...(heading ? [] : [{ name: p.label, href: p.path }]),
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: titleOf(p),
          url: new URL(p.path, SITE_URL).toString(),
          inLanguage: "ja",
          isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
          temporalCoverage: `${p.from}/${p.to}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: rows.length,
            itemListElement: rows.slice(0, 50).map((r, n) => ({
              "@type": "ListItem",
              position: n + 1,
              name: r.title,
              url: new URL(`/incidents/${r.slug}/`, SITE_URL).toString(),
            })),
          },
        }}
      />
      <PageTitle
        kicker={`DIGEST / ${p.kind === "month" ? "MONTHLY" : "WEEKLY"}`}
      >
        {heading ?? titleOf(p)}
      </PageTitle>
      <DigestView
        period={p}
        digest={buildDigest(rows)}
        prev={list[at + 1]}
        next={at > 0 ? list[at - 1] : undefined}
        related={related}
      />
    </>
  )
}
