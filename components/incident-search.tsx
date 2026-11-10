"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FC, ReactNode, Suspense, useMemo } from "react"
import { CATEGORY, SEVERITY, SEVERITY_ORDER, STATUS } from "@/lib/labels"
import {
  EMPTY_QUERY,
  IncidentRow,
  parseQuery,
  Query,
  searchIncidents,
  toSearchParams,
} from "@/lib/search"
import { IncidentCard } from "./incident-card"
import { color, Grid, mono, Muted } from "./ui"

const Field: FC<{ label: string; children: ReactNode }> = ({
  label,
  children,
}) => (
  <label
    style={{
      display: "grid",
      fontSize: ".75rem",
      gap: ".2rem",
      color: color.muted,
    }}
  >
    {label}
    {children}
  </label>
)

const uniq = (xs: string[]) => [...new Set(xs)].sort()

/**
 * `useSearchParams` makes everything up to the nearest Suspense boundary
 * client-only under static export, so the fallback renders the same UI with
 * no filters: the prerendered HTML then carries the full, crawlable list.
 */
export const IncidentSearch: FC<{ rows: IncidentRow[] }> = ({ rows }) => (
  <Suspense fallback={<SearchView rows={rows} q={EMPTY_QUERY} />}>
    <SearchFromUrl rows={rows} />
  </Suspense>
)

const SearchFromUrl: FC<{ rows: IncidentRow[] }> = ({ rows }) => {
  const params = useSearchParams()
  const query = params.toString()
  const q = useMemo(() => parseQuery(new URLSearchParams(query)), [query])
  return <SearchView rows={rows} q={q} />
}

const SearchView: FC<{ rows: IncidentRow[]; q: Query }> = ({ rows, q }) => {
  const router = useRouter()
  const pathname = usePathname()
  const results = useMemo(() => searchIncidents(rows, q), [rows, q])

  // State lives in the URL so results are shareable.
  const set = (patch: Partial<Query>) => {
    const s = toSearchParams({ ...q, ...patch }).toString()
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false })
  }
  const select = (
    key: keyof Query,
    options: [string, string][],
    all = "すべて"
  ) => (
    <select value={q[key]} onChange={(e) => set({ [key]: e.target.value })}>
      <option value="">{all}</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  )
  const date = (key: keyof Query) => (
    <input
      type="date"
      value={q[key]}
      onChange={(e) => set({ [key]: e.target.value })}
    />
  )
  const pairs = (xs: string[]) => xs.map((x) => [x, x] as [string, string])

  return (
    <>
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        style={{
          background: color.panel,
          border: `1px solid ${color.border}`,
          borderRadius: 6,
          display: "grid",
          gap: ".75rem",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(11rem, 100%), 1fr))",
          marginBottom: "1.5rem",
          padding: "1rem",
        }}
      >
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="キーワード">
            <input
              type="search"
              value={q.q}
              placeholder="タイトル・組織名・概要"
              onChange={(e) => set({ q: e.target.value })}
            />
          </Field>
        </div>
        <Field label="カテゴリ">
          {select("category", Object.entries(CATEGORY))}
        </Field>
        <Field label="深刻度">
          {select(
            "severity",
            SEVERITY_ORDER.map((s) => [s, SEVERITY[s]])
          )}
        </Field>
        <Field label="対応状況">
          {select("status", Object.entries(STATUS))}
        </Field>
        <Field label="対象組織">
          {select("organization", pairs(uniq(rows.map((r) => r.organization))))}
        </Field>
        <Field label="業種">
          {select("industry", pairs(uniq(rows.map((r) => r.industry))))}
        </Field>
        <Field label="国内 / 海外">
          {select("region", [
            ["domestic", "国内"],
            ["overseas", "海外"],
          ])}
        </Field>
        <Field label="公表日（から）">{date("disclosedFrom")}</Field>
        <Field label="公表日（まで）">{date("disclosedTo")}</Field>
        <Field label="発生日（から）">{date("occurredFrom")}</Field>
        <Field label="発生日（まで）">{date("occurredTo")}</Field>
        <Field label="並び順">
          <select
            value={q.sort}
            onChange={(e) => set({ sort: e.target.value as Query["sort"] })}
          >
            <option value="disclosed">公表日が新しい順</option>
            <option value="occurred">発生日が新しい順</option>
            <option value="severity">深刻度順</option>
            <option value="updated">更新日が新しい順</option>
          </select>
        </Field>
        <div style={{ alignSelf: "end" }}>
          <button type="button" onClick={() => set(EMPTY_QUERY)}>
            条件をクリア
          </button>
        </div>
      </form>
      <p
        aria-live="polite"
        style={{
          ...mono,
          color: color.muted,
          fontSize: ".8rem",
          marginBottom: ".75rem",
        }}
      >
        {results.length} / {rows.length} 件
      </p>
      {results.length ? (
        <Grid min="20rem">
          {results.map((r) => (
            <IncidentCard key={r.slug} incident={r} />
          ))}
        </Grid>
      ) : (
        <Muted>条件に一致するインシデントはありません。</Muted>
      )}
    </>
  )
}
