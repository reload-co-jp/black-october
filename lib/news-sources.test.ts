import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { feeds, matchesKeywords, newsSourcesSchema } from "./news-sources"

const config = newsSourcesSchema.parse(
  JSON.parse(
    readFileSync(path.join(process.cwd(), "data/news-sources.json"), "utf8")
  )
)

describe("news-sources", () => {
  it("data/news-sources.json matches the schema", () => {
    expect(config.sources.length).toBeGreaterThan(0)
  })

  it("expands paged feeds and skips JSON APIs", () => {
    const urls = feeds(config, "fetch-incidents").map((f) => f.url)
    expect(urls).toContain("https://cybersecurity-jp.com/feed?paged=1")
    expect(urls).toContain("https://cybersecurity-jp.com/feed?paged=20")
    expect(urls.some((u) => u.includes("{"))).toBe(false)
    expect(urls.some((u) => u.includes("nvd.nist.gov"))).toBe(false)
  })

  it("rejects pages without a {page} placeholder", () => {
    const bad = structuredClone(config)
    bad.sources[0].pages = { from: 1, to: 2 }
    expect(newsSourcesSchema.safeParse(bad).success).toBe(false)
  })

  it("filters titles by keyword", () => {
    expect(
      matchesKeywords(config, "通販サイトに不正アクセス、カード情報が流出")
    ).toBe(true)
    expect(matchesKeywords(config, "新製品を発表")).toBe(false)
  })
})
