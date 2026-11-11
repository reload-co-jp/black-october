import { describe, expect, it } from "vitest"
import {
  addDays,
  buildDigest,
  firstSentence,
  inPeriod,
  monthPeriod,
  periodsOf,
  weekPeriod,
  weekStart,
} from "./digest"
import { StudyRow } from "./study"

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

describe("periods", () => {
  it("weeks start on Monday", () => {
    expect(weekStart("2026-11-11")).toBe("2026-11-09")
    expect(weekStart("2026-11-09")).toBe("2026-11-09")
    expect(weekStart("2026-11-15")).toBe("2026-11-09")
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02")
  })

  it("builds month and week ranges", () => {
    expect(monthPeriod("2026-02")).toMatchObject({
      from: "2026-02-01",
      to: "2026-02-28",
      label: "2026年2月",
      path: "/study/digest/2026-02/",
    })
    expect(weekPeriod("2026-10-26")).toMatchObject({
      to: "2026-11-01",
      label: "2026年10月26日〜11月1日の週",
      path: "/study/digest/week/2026-10-26/",
    })
  })

  it("lists only periods with incidents, newest first", () => {
    const { months, weeks } = periodsOf([
      { disclosedAt: "2026-10-30" },
      { disclosedAt: "2026-11-02" },
      { disclosedAt: "2026-11-01" },
    ])
    expect(months.map((p) => p.key)).toEqual(["2026-11", "2026-10"])
    expect(weeks.map((p) => p.key)).toEqual(["2026-11-02", "2026-10-26"])
  })

  it("filters rows inclusively", () => {
    const rows = ["2026-10-31", "2026-11-01", "2026-11-30", "2026-12-01"].map(
      (d) => row({ slug: d, disclosedAt: d })
    )
    expect(inPeriod(rows, monthPeriod("2026-11")).map((r) => r.slug)).toEqual([
      "2026-11-01",
      "2026-11-30",
    ])
  })
})

describe("firstSentence", () => {
  it("keeps the first sentence and caps its length", () => {
    expect(firstSentence("一文目。二文目。")).toBe("一文目。")
    expect(firstSentence("句点なし")).toBe("句点なし")
    expect(firstSentence("あ".repeat(100), 10)).toBe(`${"あ".repeat(9)}…`)
  })
})

describe("buildDigest", () => {
  const rows = [
    row({
      slug: "a",
      severity: "low",
      affectedUsers: 100,
      lessons: ["x"],
      themes: ["auth"],
    }),
    row({
      slug: "b",
      severity: "critical",
      causeStatus: "under_investigation",
      affectedUsers: 5000,
      themes: ["auth", "supply-chain"],
    }),
    row({
      slug: "c",
      severity: "high",
      lessons: ["y"],
      themes: ["supply-chain"],
    }),
    row({ slug: "d", severity: "high", themes: ["supply-chain"] }),
  ]
  const d = buildDigest(rows)

  it("counts", () => {
    expect(d).toMatchObject({
      total: 4,
      knownCause: 3,
      severe: 3,
      affectedKnown: 2,
    })
  })
  it("ranks themes by count and cases by severity", () => {
    expect(
      d.themes.map((t) => [t.theme.id, t.rows.map((r) => r.slug)])
    ).toEqual([
      ["supply-chain", ["b", "c", "d"]],
      ["auth", ["b", "a"]],
    ])
  })
  it("picks discussable, largest and pending cases", () => {
    expect(d.lessons.map((r) => r.slug)).toEqual(["c", "a"])
    expect(d.largest.map((r) => r.slug)).toEqual(["b", "a"])
    expect(d.pending.map((r) => r.slug)).toEqual(["b"])
  })
})
