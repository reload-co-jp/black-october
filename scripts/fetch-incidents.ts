// Crawls security news RSS for unauthorized-access / data-breach reports, drafts each one
// as an incident with Claude, and queues it in data/candidates.json for review in /admin.
// Usage: node scripts/fetch-incidents.ts [max items]
// Claude runs through the `claude` CLI, so it uses the Claude Code login (OAuth), not an API key.
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { z } from "zod"
import { ENUMS } from "../lib/validation.ts"

const FEEDS = [
  "https://www.security-next.com/feed",
  "https://rss.itmedia.co.jp/rss/2.0/news_security.xml",
  "https://scan.netsecurity.ne.jp/rss/index.rdf",
]
// Cheap title filter so only likely incidents reach Claude.
const KEYWORDS = /不正アクセス|不正ログイン|情報漏え?い|漏洩|流出|ランサム|サイバー攻撃|個人情報|侵害|乗っ取/

const SYSTEM = `あなたは日本のセキュリティインシデントデータベースの編集者。
渡されたニュース記事から、日本の組織が被害を受けた不正アクセス・情報漏洩などの個別インシデントを抽出する。
- 脆弱性情報・統計・注意喚起・海外組織の事件・まとめ記事は relevant=false。
- 記事に書かれた事実だけを使う。不明な値は null、空文字、空配列、または unknown / unconfirmed / under_investigation にする。
- 日付は YYYY-MM-DD。文章は日本語。slug は英小文字・数字・ハイフンのみ。
- 「既知のインシデント」に同じ事件（続報・別媒体の記事を含む）があれば sameAs にその id を入れる。なければ null。`

const str = z.string()
const date = str.nullable().describe("YYYY-MM-DD")
const Draft = z.object({
  relevant: z.boolean(),
  sameAs: str.nullable().describe("既知のインシデントの id。同じ事件でなければ null"),
  organization: z.object({
    name: str,
    slug: str.describe("組織名の英語表記 (例: idc-frontier)"),
    industry: str,
    website: z.union([z.literal(""), z.url({ protocol: /^https?$/ })]).describe("公式サイトURL。不明なら空文字"),
  }),
  publisher: str.describe("記事の媒体名"),
  publishedAt: date,
  incident: z.object({
    title: str,
    slug: str.describe("組織と事象 (例: idcf-cloud-ransomware)"),
    summary: str.describe("1〜2文"),
    summaryDetails: str,
    service: str.nullable(),
    incidentDate: date,
    discoveredAt: date,
    disclosedAt: str.describe("YYYY-MM-DD。不明なら記事の公開日"),
    categories: z.array(z.enum(ENUMS.category)),
    severity: z.enum(ENUMS.severity),
    status: z.enum(ENUMS.status),
    verificationStatus: z.enum(ENUMS.verificationStatus),
    cause: z.object({ status: z.enum(ENUMS.causeStatus), description: str, factors: z.array(str) }),
    impact: z.object({
      status: z.enum(ENUMS.verificationStatus),
      affectedUsers: z.number().int().nullable(),
      leakedData: z.array(z.object({ item: str, confidence: z.enum(ENUMS.confidence) })),
      systems: z.array(str),
      serviceOutage: z.boolean().nullable(),
      financialLoss: str.nullable(),
      description: str,
    }),
    response: z.object({ description: str, measures: z.array(str) }),
    lessons: z.array(str),
  }),
})

const file = (f: string) => new URL(`../data/${f}.json`, import.meta.url)
const read = (f: string) => JSON.parse(readFileSync(file(f), "utf8"))
type Row = Record<string, unknown>
type Candidate = { id: string; url: string; updateOf: string | null; organization: Row | null; sources: Row[]; incident: Row }
const store: { seen: string[]; items: Candidate[] } = existsSync(file("candidates"))
  ? read("candidates")
  : { seen: [], items: [] }
const organizations: { id: string; name: string }[] = read("organizations")
const incidents: { id: string; title: string; updatedAt: string }[] = read("incidents")
const seen = new Set([...store.seen, ...read("sources").map((s: { url: string }) => s.url)])
const save = () => writeFileSync(file("candidates"), JSON.stringify({ ...store, seen: [...seen] }, null, 2) + "\n")

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " }
const text = (s = "") =>
  s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<(script|style|nav|header|footer)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&([a-z]+|#\d+);/gi, (m, e) => ENTITIES[e] ?? " ")
    .replace(/\s+/g, " ")
    .trim()
const tag = (xml: string, name: string) => text(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1])
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const today = new Date().toISOString().slice(0, 10)
const get = (url: string): Promise<Response> =>
  fetch(url, { headers: { "user-agent": "Mozilla/5.0 (black-october crawler)" } }).catch(async () => {
    // One retry: news sites drop connections now and then.
    await new Promise((r) => setTimeout(r, 3000))
    return fetch(url, { headers: { "user-agent": "Mozilla/5.0 (black-october crawler)" } })
  })

const items = (
  await Promise.all(FEEDS.map(async (f) => [...(await (await get(f)).text()).matchAll(/<item[\s>][\s\S]*?<\/item>/g)]))
)
  .flat()
  .map(([xml]) => ({ title: tag(xml, "title"), url: tag(xml, "link") }))
  .filter((i) => i.url && !seen.has(i.url) && KEYWORDS.test(i.title))
  .slice(0, Number(process.argv[2]) || Infinity)
console.log(`${items.length} new item(s)`)

const SCHEMA = JSON.stringify(z.toJSONSchema(Draft, { target: "draft-07" }))
// Private empty cwd and no settings sources: nothing on disk (hooks, CLAUDE.md) can steer the run.
const cwd = mkdtempSync(`${tmpdir()}/fetch-incidents-`)
process.on("exit", () => rmSync(cwd, { recursive: true, force: true }))
const ask = (prompt: string) => {
  // No tools: a plain one-shot extraction.
  const out = execFileSync(
    "claude",
    ["-p", "--output-format", "json", "--model", "claude-opus-5-5", "--effort", "medium",
      "--tools", "", "--setting-sources", "", "--no-session-persistence",
      "--system-prompt", SYSTEM, "--json-schema", SCHEMA],
    { input: prompt, cwd, encoding: "utf8", maxBuffer: 16 << 20 }
  )
  const res = JSON.parse(out)
  if (res.is_error) throw new Error(res.result || res.subtype)
  return Draft.parse(res.structured_output)
}
for (const { title, url } of items) {
  try {
    const page = await get(url)
    if (!page.ok) throw new Error(`HTTP ${page.status}`)
    const known = [
      ...incidents.map((i) => `${i.id}: ${i.title}`),
      ...store.items.filter((c) => !c.updateOf).map((c) => `${c.incident.id}: ${c.incident.title}`),
    ].join("\n")
    const d = ask(`既知のインシデント:\n${known}\n\nURL: ${url}\nタイトル: ${title}\n\n本文:\n${text(await page.text())}`)
    seen.add(url)
    if (!d.relevant) {
      console.log(`skip ${title}`)
      save()
      continue
    }
    const { slug: rawSlug, ...fields } = d.incident
    const slug = slugify(rawSlug)
    const source = {
      id: `src-${slug}-${Date.now().toString(36)}`, title, url, publisher: d.publisher, publishedAt: d.publishedAt,
      sourceType: "media", reliability: "secondary", retrievedAt: today,
    }
    const addTo = (c: Candidate) => {
      c.sources.push(source)
      c.incident.sourceIds = [...(c.incident.sourceIds as string[]), source.id]
    }
    // Same incident as a queued draft: just add the article as another source.
    const draft = store.items.find((c) => !c.updateOf && c.incident.id === d.sameAs)
    if (draft) {
      addTo(draft)
      console.log(`MERGE ${title} -> ${draft.incident.id}`)
      save()
      continue
    }
    // Follow-up on a published incident: queue the source plus what's new for review.
    const existing = incidents.find((i) => i.id === d.sameAs)
    if (existing) {
      const update = store.items.find((c) => c.updateOf === existing.id)
      if (update) addTo(update)
      else
        store.items.push({
          id: `cand-${Date.now().toString(36)}`, url, updateOf: existing.id, organization: null, sources: [source],
          incident: { id: existing.id, title: existing.title, summary: fields.summary, sourceIds: [source.id] },
        })
      console.log(`UPDATE ${title} -> ${existing.id}`)
      save()
      continue
    }
    const savedOrg = organizations.find((o) => o.name === d.organization.name)
    const queuedOrg = store.items.find((c) => c.organization?.name === d.organization.name)?.organization
    const orgId = String(savedOrg?.id ?? queuedOrg?.id ?? `org-${slugify(d.organization.slug)}`)
    store.items.push({
      id: `cand-${Date.now().toString(36)}`,
      url,
      updateOf: null,
      // Rows the incident references; created on save only if missing.
      organization: savedOrg
        ? null
        : (queuedOrg ?? { ...d.organization, id: orgId, slug: slugify(d.organization.slug), country: "JP" }),
      sources: [source],
      incident: {
        id: `inc-${fields.disclosedAt.slice(0, 4)}-${slug}`,
        slug: `${slug}-${fields.disclosedAt.slice(0, 7)}`,
        ...fields,
        organizationId: orgId,
        updatedAt: fields.disclosedAt,
        country: "JP",
        industry: d.organization.industry,
        featured: false,
        attackMethods: [],
        technicalNotes: "",
        timeline: [],
        vulnerabilityIds: [],
        relatedIncidentIds: [],
        sourceIds: [source.id],
        createdAt: today,
        publishedAt: today,
      },
    })
    console.log(`OK ${title}`)
    save()
  } catch (e) {
    // Not marked as seen, so the next run retries it.
    console.log(`NG ${title}: ${e instanceof Error ? e.message : e}`)
  }
}
