import { FC } from "react"
import { label, SOURCE_TYPE } from "@/lib/labels"
import { Source } from "@/lib/validation"
import { color, Muted, Row, Tag } from "./ui"

export const SourceList: FC<{ sources: Source[] }> = ({ sources }) =>
  sources.length ? (
    <ol style={{ display: "grid", gap: ".75rem", paddingLeft: "1.5rem" }}>
      {sources.map((s) => (
        <li key={s.id} id={`src-${s.id}`}>
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            {s.title}
          </a>
          <Row style={{ color: color.muted, fontSize: ".8rem" }}>
            <span>{s.publisher}</span>
            <span>公開日: {s.publishedAt ?? "不明"}</span>
            <Tag>{label(SOURCE_TYPE, s.sourceType)}</Tag>
            <Tag>{s.reliability === "primary" ? "一次情報" : "二次情報"}</Tag>
            <span>取得日: {s.retrievedAt}</span>
          </Row>
        </li>
      ))}
    </ol>
  ) : (
    <Muted>出典は未登録です。</Muted>
  )
