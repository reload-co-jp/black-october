import { z } from "zod"
import { ENUMS } from "./validation.ts"

// Schema for data/news-sources.json: where incident / unauthorized-access news is collected from.
// See docs/news-collection.md for how the sources are used.

export const NEWS_SOURCE_FORMATS = ["rss2", "rss1", "json"] as const
export const NEWS_SOURCE_KINDS = [
  "media",
  "blog",
  "aggregator",
  "official",
  "government",
  "vulnerability-db",
] as const
export const NEWS_SOURCE_CONSUMERS = ["fetch-incidents", "fetch-cves"] as const

const newsSource = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    /** May contain `{page}` (expanded with `pages`) or other `{placeholders}` filled by the consumer. */
    url: z.string().regex(/^https:\/\//),
    pages: z
      .object({ from: z.number().int().min(1), to: z.number().int().min(1) })
      .optional(),
    format: z.enum(NEWS_SOURCE_FORMATS),
    kind: z.enum(NEWS_SOURCE_KINDS),
    language: z.string().length(2),
    /** Values written to data/sources.json when an article from this source is registered. */
    sourceType: z.enum(ENUMS.sourceType),
    reliability: z.enum(ENUMS.reliability),
    usedBy: z.array(z.enum(NEWS_SOURCE_CONSUMERS)),
    enabled: z.boolean(),
    notes: z.string().nullable(),
  })
  .refine(
    (s) => !s.pages || s.url.includes("{page}"),
    "pages requires {page} in url"
  )
  .refine(
    (s) => !s.pages || s.pages.from <= s.pages.to,
    "pages.from must be <= pages.to"
  )

export const newsSourcesSchema = z
  .object({
    $comment: z.string().optional(),
    version: z.literal(1),
    titleKeywords: z.array(z.string().min(1)).min(1),
    sources: z.array(newsSource),
  })
  .refine(
    (c) => new Set(c.sources.map((s) => s.id)).size === c.sources.length,
    "duplicate source id"
  )

export type NewsSources = z.infer<typeof newsSourcesSchema>
export type NewsSource = NewsSources["sources"][number]

/** Enabled RSS feeds for one consumer, with `{page}` templates expanded to one entry per page. */
export const feeds = (
  config: NewsSources,
  consumer: (typeof NEWS_SOURCE_CONSUMERS)[number]
) =>
  config.sources
    .filter(
      (s) => s.enabled && s.usedBy.includes(consumer) && s.format !== "json"
    )
    .flatMap((source) =>
      (source.pages
        ? Array.from(
            { length: source.pages.to - source.pages.from + 1 },
            (_, i) =>
              source.url.replace("{page}", String(source.pages!.from + i))
          )
        : [source.url]
      ).map((url) => ({ url, source }))
    )

/** True when an article title likely reports an incident (cheap pre-filter before LLM extraction). */
export const matchesKeywords = (config: NewsSources, title: string) =>
  config.titleKeywords.some((k) => title.includes(k))
