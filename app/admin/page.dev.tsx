"use client"

// Dev-only page: the .dev.tsx extension is only registered by `next dev`.
import { FC, ReactNode, useCallback, useEffect, useState } from "react"
import { color, mono } from "@/components/ui"
import { Collection, COLLECTIONS, ENUMS } from "@/lib/validation"

type Json = null | boolean | number | string | Json[] | { [k: string]: Json }
type Obj = { [k: string]: Json }
type Data = Record<Collection, Obj[]>

const today = () => new Date().toISOString().slice(0, 10)

const TEMPLATES: Record<Collection, () => Obj> = {
  incidents: () => ({
    id: "", slug: "", title: "", summary: "", organizationId: "", service: null,
    incidentDate: null, discoveredAt: null, disclosedAt: today(), updatedAt: today(),
    country: "JP", industry: "", categories: [], severity: "unknown", status: "investigating",
    verificationStatus: "unconfirmed", featured: false, summaryDetails: "",
    cause: { status: "under_investigation", description: "", factors: [] },
    attackMethods: [],
    impact: { status: "unconfirmed", affectedUsers: null, leakedData: [], systems: [], serviceOutage: null, financialLoss: null, description: "" },
    response: { description: "", measures: [] },
    technicalNotes: "", lessons: [], timeline: [], vulnerabilityIds: [], relatedIncidentIds: [],
    sourceIds: [], createdAt: today(), publishedAt: today(),
  }),
  vulnerabilities: () => ({
    id: "", cveId: "", title: "", description: "", cvssScore: null, cvssVector: null, cweId: null,
    affectedProducts: [], fixedVersions: [], publishedAt: null, modifiedAt: null, kevStatus: false,
    exploitation: null, mitigation: [], incidentIds: [], sourceIds: [],
  }),
  techniques: () => ({
    id: "", slug: "", name: "", nameJa: "", description: "", mechanism: "", conditions: [],
    causes: [], mitreAttackIds: [], mitigation: [], incidentIds: [],
  }),
  organizations: () => ({ id: "", slug: "", name: "", country: "JP", industry: "", website: "" }),
  sources: () => ({
    id: "", title: "", url: "", publisher: "", publishedAt: null, sourceType: "official",
    reliability: "primary", retrievedAt: today(),
  }),
}
// Shapes for array items, keyed by field path.
const ITEM_TEMPLATES: Record<string, () => Json> = {
  timeline: () => ({ date: today(), title: "", description: "", sourceIds: [] }),
  "impact.leakedData": () => ({ item: "", confidence: "unknown" }),
}

// Field path -> allowed values.
const ENUM_FIELDS: Record<string, readonly string[]> = {
  severity: ENUMS.severity,
  status: ENUMS.status,
  verificationStatus: ENUMS.verificationStatus,
  "cause.status": ENUMS.causeStatus,
  "impact.status": ENUMS.verificationStatus,
  "impact.leakedData.confidence": ENUMS.confidence,
  sourceType: ENUMS.sourceType,
  reliability: ENUMS.reliability,
}
const NUMBER_FIELDS = new Set(["impact.affectedUsers", "cvssScore"])
const NULLABLE_BOOL = new Set(["impact.serviceOutage"])
const LONG_TEXT = /summary|description|technicalNotes|mechanism/i
const isDate = (key: string) => /(At|Date|^date)$/.test(key)

// Drops blank lines left over from one-per-line textareas.
const clean = (v: Json): Json =>
  Array.isArray(v)
    ? v.filter((x) => x !== "").map(clean)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)]))
      : v

const labelStyle = { color: color.muted, display: "grid", fontSize: ".75rem", gap: ".2rem" }

/** Renders a form for any JSON value, guided by the field path. */
const Field: FC<{
  path: string
  name: string
  value: Json
  onChange: (v: Json) => void
  refs: (path: string) => { value: string; label: string }[] | null
}> = ({ path, name, value, onChange, refs }) => {
  const key = path.replace(/\.\d+/g, "")
  const wrap = (el: ReactNode) => (
    <label style={labelStyle}>
      <span style={mono}>{name}</span>
      {el}
    </label>
  )
  const options = refs(key)

  if (key === "categories")
    return (
      <fieldset style={{ border: `1px solid ${color.border}`, padding: ".5rem" }}>
        <legend style={{ ...mono, fontSize: ".75rem" }}>{name}</legend>
        {ENUMS.category.map((c) => (
          <label key={c} style={{ display: "inline-flex", gap: ".25rem", marginRight: ".75rem", fontSize: ".8rem" }}>
            <input
              type="checkbox"
              checked={(value as string[]).includes(c)}
              onChange={(e) =>
                onChange(e.target.checked ? [...(value as string[]), c] : (value as string[]).filter((x) => x !== c))
              }
            />
            {c}
          </label>
        ))}
      </fieldset>
    )
  if (options && Array.isArray(value))
    return (
      <fieldset style={{ border: `1px solid ${color.border}`, maxHeight: "12rem", overflow: "auto", padding: ".5rem" }}>
        <legend style={{ ...mono, fontSize: ".75rem" }}>{name}（関連付け）</legend>
        {options.map((o) => (
          <label key={o.value} style={{ display: "flex", gap: ".4rem", fontSize: ".8rem" }}>
            <input
              type="checkbox"
              checked={(value as string[]).includes(o.value)}
              onChange={(e) =>
                onChange(e.target.checked ? [...(value as string[]), o.value] : (value as string[]).filter((x) => x !== o.value))
              }
            />
            <span style={mono}>{o.value}</span> {o.label}
          </label>
        ))}
      </fieldset>
    )
  if (options)
    return wrap(
      <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
        <option value="">--</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.value} {o.label}</option>
        ))}
      </select>
    )
  if (ENUM_FIELDS[key])
    return wrap(
      <select value={String(value)} onChange={(e) => onChange(e.target.value)}>
        {ENUM_FIELDS[key].map((o) => <option key={o}>{o}</option>)}
      </select>
    )
  if (NULLABLE_BOOL.has(key))
    return wrap(
      <select value={String(value)} onChange={(e) => onChange(e.target.value === "null" ? null : e.target.value === "true")}>
        <option value="null">不明</option>
        <option value="true">あり</option>
        <option value="false">なし</option>
      </select>
    )
  if (typeof value === "boolean")
    return (
      <label style={{ ...labelStyle, display: "flex", alignItems: "center" }}>
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span style={mono}>{name}</span>
      </label>
    )
  if (NUMBER_FIELDS.has(key))
    return wrap(
      <input type="number" step="any" value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />
    )
  if (Array.isArray(value) && (value.length === 0 ? !ITEM_TEMPLATES[key] : typeof value[0] === "string"))
    return wrap(
      <textarea
        rows={Math.max(2, value.length + 1)}
        placeholder="1行に1項目"
        value={(value as string[]).join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
      />
    )
  if (Array.isArray(value))
    return (
      <fieldset style={{ border: `1px solid ${color.border}`, display: "grid", gap: ".5rem", padding: ".5rem" }}>
        <legend style={{ ...mono, fontSize: ".75rem" }}>{name}</legend>
        {value.map((item, i) => (
          <div key={i} style={{ borderLeft: `2px solid ${color.accent}`, display: "grid", gap: ".4rem", paddingLeft: ".5rem" }}>
            <Field path={`${path}.${i}`} name={`#${i + 1}`} value={item} refs={refs} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ justifySelf: "start" }}>削除</button>
          </div>
        ))}
        <button type="button" style={{ justifySelf: "start" }} onClick={() => onChange([...value, ITEM_TEMPLATES[key]()])}>
          ＋ 追加{key === "timeline" && "（続報）"}
        </button>
      </fieldset>
    )
  if (value && typeof value === "object")
    return (
      <fieldset style={{ border: `1px solid ${color.border}`, display: "grid", gap: ".5rem", padding: ".5rem" }}>
        <legend style={{ ...mono, fontSize: ".75rem" }}>{name}</legend>
        {Object.entries(value).map(([k, v]) => (
          <Field key={k} path={`${path ? `${path}.` : ""}${k}`} name={k} value={v} refs={refs} onChange={(nv) => onChange({ ...value, [k]: nv })} />
        ))}
      </fieldset>
    )
  const str = value == null ? "" : String(value)
  // Empty string -> null for fields that start out null in the template.
  const set = (s: string) => onChange(s === "" && value === null ? null : s === "" && isDate(key) ? null : s)
  if (isDate(key)) return wrap(<input type="date" value={str} onChange={(e) => set(e.target.value)} />)
  if (LONG_TEXT.test(key)) return wrap(<textarea rows={4} value={str} onChange={(e) => set(e.target.value)} />)
  return wrap(<input type="text" value={str} onChange={(e) => set(e.target.value)} />)
}

const fetchAll = async (): Promise<Data> =>
  Object.fromEntries(
    await Promise.all(COLLECTIONS.map(async (c) => [c, await (await fetch(`/api/admin/${c}`)).json()]))
  )

const AdminPage: FC = () => {
  const [data, setData] = useState<Data | null>(null)
  const [tab, setTab] = useState<Collection>("incidents")
  const [draft, setDraft] = useState<Obj | null>(null)
  const [originalId, setOriginalId] = useState<string | null>(null)
  const [raw, setRaw] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [cveList, setCveList] = useState("")

  const load = useCallback(() => fetchAll().then(setData), [])
  useEffect(() => {
    fetchAll().then(setData)
  }, [])

  const refs = (key: string) => {
    if (!data) return null
    const pick = (c: Collection, valueKey: string, labelKey: string) =>
      data[c].map((r) => ({ value: String(r[valueKey]), label: String(r[labelKey]) }))
    if (key === "organizationId") return pick("organizations", "id", "name")
    if (key === "attackMethods") return pick("techniques", "slug", "nameJa")
    if (key === "vulnerabilityIds") return pick("vulnerabilities", "id", "cveId")
    if (key === "relatedIncidentIds" || key === "incidentIds") return pick("incidents", "id", "title")
    if (key === "sourceIds" || key === "timeline.sourceIds") return pick("sources", "id", "title")
    return null
  }

  const save = async () => {
    if (!draft) return
    const row = clean(draft) as Obj
    const res = await fetch(originalId ? `/api/admin/${tab}/${encodeURIComponent(originalId)}` : `/api/admin/${tab}`, {
      method: originalId ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(row),
    })
    const body = await res.json()
    if (!res.ok) return setMessage({ ok: false, text: (body.errors ?? [body.error]).join("\n") })
    setMessage({ ok: true, text: `保存しました: ${row.id}` })
    setDraft(row)
    setOriginalId(String(row.id))
    load()
  }
  const remove = async (id: string) => {
    if (!window.confirm(`${id} を削除しますか？`)) return
    const res = await fetch(`/api/admin/${tab}/${encodeURIComponent(id)}`, { method: "DELETE" })
    if (!res.ok) {
      const body = await res.json()
      return setMessage({ ok: false, text: (body.errors ?? [body.error]).join("\n") })
    }
    setMessage({ ok: true, text: `削除しました: ${id}` })
    setDraft(null)
    load()
  }
  // Fill CVE-derived fields from NVD; local links (id, incidents, sources) stay as they are.
  const fetchCve = async () => {
    if (!draft) return
    const cve = String(draft.cveId).trim().toUpperCase()
    setMessage({ ok: true, text: `NVDから取得中: ${cve}` })
    const res = await fetch(`/api/admin/cve/${encodeURIComponent(cve)}`)
    const body = await res.json()
    if (!res.ok) return setMessage({ ok: false, text: body.error })
    setDraft({ ...draft, ...body, id: draft.id || cve.toLowerCase() })
    setMessage({ ok: true, text: `NVDから取得しました: ${cve}（タイトル・説明は要確認）` })
  }
  // Bulk import: fetch each CVE from NVD and save it as a new vulnerability.
  const importCves = async () => {
    if (!data) return
    const known = new Set(data.vulnerabilities.map((r) => String(r.cveId)))
    const ids = [...new Set(cveList.toUpperCase().match(/CVE-\d{4}-\d{4,}/g) ?? [])]
    const log: string[] = []
    const report = (ok = true) => setMessage({ ok, text: log.join("\n") })
    for (const [n, cve] of ids.entries()) {
      if (known.has(cve)) {
        log.push(`skip ${cve}: 登録済み`)
        continue
      }
      // ponytail: fixed pacing for NVD's keyless limit (5 req / 30s); drop it when NVD_API_KEY is set
      if (n) await new Promise((r) => setTimeout(r, 6500))
      log.push(`取得中 ${cve} (${n + 1}/${ids.length})`)
      report()
      const res = await fetch(`/api/admin/cve/${cve}`)
      const fields = await res.json()
      if (!res.ok) {
        log[log.length - 1] = `NG ${cve}: ${fields.error}`
        continue
      }
      const row = { ...TEMPLATES.vulnerabilities(), ...fields, id: cve.toLowerCase() }
      const saved = await fetch("/api/admin/vulnerabilities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(row),
      })
      const body = await saved.json()
      log[log.length - 1] = saved.ok ? `OK ${cve}` : `NG ${cve}: ${(body.errors ?? [body.error]).join(", ")}`
    }
    log.push(`完了: ${ids.length}件`)
    report(!log.some((l) => l.startsWith("NG")))
    load()
  }
  const open = (row: Obj | null) => {
    setDraft(row ? structuredClone(row) : TEMPLATES[tab]())
    setOriginalId(row ? String(row.id) : null)
    setMessage(null)
  }

  if (!data) return <p>Loading…</p>
  return (
    <>
      <h1 style={{ ...mono, fontSize: "1.2rem", margin: "1rem 0" }}>ADMIN <span style={{ color: color.muted, fontSize: ".8rem" }}>（開発環境専用 / data/*.json を直接更新）</span></h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginBottom: "1rem" }}>
        {COLLECTIONS.map((c) => (
          <button key={c} type="button" onClick={() => { setTab(c); setDraft(null) }} style={{ ...mono, borderColor: c === tab ? color.accent : undefined }}>
            {c} ({data[c].length})
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(min(22rem, 100%), 1fr))", alignItems: "start" }}>
        <div>
          <button type="button" onClick={() => open(null)} style={{ marginBottom: ".5rem" }}>＋ 新規登録</button>
          {tab === "vulnerabilities" && (
            <div style={{ display: "grid", gap: ".4rem", marginBottom: ".75rem" }}>
              <textarea rows={3} placeholder="CVE-2026-12345, CVE-2026-23456 …（改行・カンマ区切り）" value={cveList} onChange={(e) => setCveList(e.target.value)} style={mono} />
              <button type="button" onClick={importCves} disabled={!/CVE-\d{4}-\d{4,}/i.test(cveList)}>NVDから一括取得して保存</button>
              {!draft && message && (
                <pre style={{ ...mono, color: message.ok ? "#3ecf8e" : "#ff5a5f", fontSize: ".75rem", whiteSpace: "pre-wrap" }}>{message.text}</pre>
              )}
            </div>
          )}
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: ".25rem" }}>
            {data[tab].map((r) => (
              <li key={String(r.id)} style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                <button type="button" onClick={() => open(r)} style={{ flex: 1, textAlign: "left", borderColor: originalId === r.id ? color.accent : undefined }}>
                  <span style={{ ...mono, color: color.muted, fontSize: ".7rem" }}>{String(r.id)}</span>
                  <br />
                  {String(r.title ?? r.nameJa ?? r.name ?? r.cveId)}
                </button>
                <button type="button" onClick={() => remove(String(r.id))} aria-label={`${r.id} を削除`}>×</button>
              </li>
            ))}
          </ul>
        </div>
        {draft && (
          <form onSubmit={(e) => { e.preventDefault(); save() }} style={{ display: "grid", gap: ".6rem" }}>
            <div style={{ display: "flex", gap: ".5rem", position: "sticky", top: 0, background: color.bg, padding: ".5rem 0", zIndex: 1 }}>
              <button type="submit" style={{ borderColor: color.accent }}>{originalId ? "更新" : "登録"}</button>
              {tab === "incidents" && (
                <button type="button" onClick={() => setDraft({ ...draft, updatedAt: today() })}>更新日を今日に</button>
              )}
              {tab === "vulnerabilities" && (
                <button type="button" onClick={fetchCve} disabled={!draft.cveId}>CVEから取得</button>
              )}
              <button type="button" onClick={() => setRaw(!raw)}>{raw ? "フォーム" : "JSON"}</button>
            </div>
            {message && (
              <pre style={{ ...mono, color: message.ok ? "#3ecf8e" : "#ff5a5f", fontSize: ".75rem", whiteSpace: "pre-wrap" }}>{message.text}</pre>
            )}
            {raw ? (
              <textarea
                rows={30}
                style={mono}
                defaultValue={JSON.stringify(draft, null, 2)}
                onBlur={(e) => {
                  try {
                    setDraft(JSON.parse(e.target.value))
                  } catch {
                    setMessage({ ok: false, text: "JSONの構文が不正です" })
                  }
                }}
              />
            ) : (
              <Field path="" name={tab} value={draft} refs={refs} onChange={(v) => setDraft(v as Obj)} />
            )}
          </form>
        )}
      </div>
    </>
  )
}
export default AdminPage
