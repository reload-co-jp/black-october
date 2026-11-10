import { describe, expect, it } from "vitest"
import incidents from "@/data/incidents.json"
import techniques from "@/data/techniques.json"
import {
  classify,
  EMPTY_STUDY_QUERY,
  filterStudyRows,
  formatPeople,
  StudyRow,
  THEMES,
} from "./study"

const incident = (over: Partial<Parameters<typeof classify>[0]> = {}) => ({
  title: "",
  summary: "",
  technicalNotes: "",
  categories: ["unauthorized-access" as const],
  cause: {
    status: "under_investigation" as const,
    description: "",
    factors: [],
  },
  ...over,
})

const row = (over: Partial<StudyRow>): StudyRow => ({
  slug: "a",
  title: "",
  summary: "",
  organization: "",
  organizationSlug: "",
  industry: "",
  incidentDate: null,
  discoveredAt: null,
  disclosedAt: "2026-10-01",
  severity: "medium",
  categories: [],
  affectedUsers: null,
  leaked: [],
  causeStatus: "confirmed",
  cause: "",
  factors: [],
  measures: [],
  lessons: [],
  themes: [],
  sources: [],
  ...over,
})

describe("THEMES", () => {
  it("has unique ids and only references existing techniques", () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length)
    const slugs = new Set(techniques.map((t) => t.slug))
    for (const t of THEMES)
      for (const s of t.techniques) expect(slugs).toContain(s)
  })

  it("keeps keywords lowercase so matching stays case-insensitive", () => {
    for (const t of THEMES)
      for (const k of t.keywords) expect(k).toBe(k.toLowerCase())
  })

  it("every theme matches at least one real incident", () => {
    const used = new Set(
      incidents.flatMap((i) => classify(i as Parameters<typeof classify>[0]))
    )
    for (const t of THEMES) expect(used, t.id).toContain(t.id)
  })
})

describe("classify", () => {
  it("matches keywords in the published cause", () => {
    const i = incident({
      cause: {
        status: "confirmed",
        description: "",
        factors: ["会員情報取得APIの脆弱性"],
      },
    })
    expect(classify(i)).toEqual(["vulnerability", "web-app"])
  })

  it("matches by category even without keywords", () => {
    expect(classify(incident({ categories: ["ransomware"] }))).toEqual([
      "ransomware",
    ])
  })

  it("assigns nothing when the cause is unpublished", () => {
    expect(
      classify(incident({ summary: "第三者によりシステムが侵害された。" }))
    ).toEqual([])
  })
})

describe("filterStudyRows", () => {
  const rows = [
    row({
      slug: "a",
      disclosedAt: "2026-10-05",
      severity: "low",
      affectedUsers: 10,
      themes: ["auth"],
    }),
    row({
      slug: "b",
      disclosedAt: "2026-11-02",
      severity: "critical",
      causeStatus: "under_investigation",
      lessons: ["多要素認証を導入する"],
    }),
    row({
      slug: "c",
      disclosedAt: "2026-10-20",
      severity: "high",
      affectedUsers: 500,
    }),
  ]
  const slugs = (q: Partial<typeof EMPTY_STUDY_QUERY>) =>
    filterStudyRows(rows, { ...EMPTY_STUDY_QUERY, ...q }).map((r) => r.slug)

  it("sorts newest first by default", () => {
    expect(slugs({})).toEqual(["b", "c", "a"])
  })
  it("filters by theme, month and published cause", () => {
    expect(slugs({ theme: "auth" })).toEqual(["a"])
    expect(slugs({ month: "2026-10" })).toEqual(["c", "a"])
    expect(slugs({ knownCause: true })).toEqual(["c", "a"])
  })
  it("searches lessons too", () => {
    expect(slugs({ q: "多要素" })).toEqual(["b"])
  })
  it("sorts by severity and by affected users, unknown counts last", () => {
    expect(slugs({ sort: "severity" })).toEqual(["b", "c", "a"])
    expect(slugs({ sort: "affected" })).toEqual(["c", "a", "b"])
  })
})

describe("formatPeople", () => {
  it("uses 万 from ten thousand", () => {
    expect(formatPeople(1234)).toBe("1,234")
    expect(formatPeople(50000)).toBe("5万")
    expect(formatPeople(697209)).toBe("69.7万")
    expect(formatPeople(37620000)).toBe("3,762万")
  })
})
