import Link from "next/link"
import { FC } from "react"
import { Card, CategoryTags, color, DateText, Row, SeverityBadge, StatusText } from "./ui"

export type IncidentCardData = {
  slug: string
  title: string
  summary: string
  organization: string
  incidentDate: string | null
  disclosedAt: string
  categories: string[]
  severity: string
  status: string
}

export const IncidentCard: FC<{ incident: IncidentCardData }> = ({ incident: i }) => (
  <Card style={{ display: "grid", gap: ".6rem" }}>
    <Row style={{ fontSize: ".8rem" }}>
      <SeverityBadge value={i.severity} />
      <DateText label="公表" value={i.disclosedAt} />
      <DateText label="発生" value={i.incidentDate} />
    </Row>
    <h3 style={{ fontSize: "1.05rem", lineHeight: 1.45 }}>
      <Link href={`/incidents/${i.slug}/`}>{i.title}</Link>
    </h3>
    <Row style={{ color: color.muted, fontSize: ".85rem" }}>
      <span>{i.organization}</span>
      <span>・</span>
      <span>
        対応状況: <StatusText value={i.status} />
      </span>
    </Row>
    <p style={{ fontSize: ".9rem", color: color.muted }}>{i.summary}</p>
    <Row>
      <CategoryTags values={i.categories} />
    </Row>
  </Card>
)
