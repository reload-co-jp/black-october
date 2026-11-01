// Maps an NVD CVE API 2.0 response onto vulnerability fields.
// https://nvd.nist.gov/developers/vulnerabilities

type Metric = { type?: string; cvssData: { baseScore: number; vectorString: string } }
type CpeMatch = {
  vulnerable: boolean
  criteria: string
  versionStartIncluding?: string
  versionStartExcluding?: string
  versionEndIncluding?: string
  versionEndExcluding?: string
}
type NvdCve = {
  id: string
  published?: string
  lastModified?: string
  descriptions?: { lang: string; value: string }[]
  metrics?: Record<string, Metric[] | undefined>
  weaknesses?: { description: { value: string }[] }[]
  configurations?: { nodes: { cpeMatch?: CpeMatch[] }[] }[]
  cisaExploitAdd?: string
  cisaVulnerabilityName?: string
  cisaRequiredAction?: string
}
export type NvdResponse = { vulnerabilities?: { cve: NvdCve }[] }

export const CVE_ID = /^CVE-\d{4}-\d{4,}$/

const day = (s?: string) => s?.slice(0, 10) ?? null

const product = (m: CpeMatch) => {
  // cpe:2.3:part:vendor:product:version:...
  const [, , , vendor, name, version] = m.criteria.split(":")
  const range = [
    m.versionStartIncluding && `>= ${m.versionStartIncluding}`,
    m.versionStartExcluding && `> ${m.versionStartExcluding}`,
    m.versionEndIncluding && `<= ${m.versionEndIncluding}`,
    m.versionEndExcluding && `< ${m.versionEndExcluding}`,
  ].filter(Boolean)
  const v = range.length ? range.join(", ") : version && !"*-".includes(version) ? version : ""
  return [vendor, name, v].filter(Boolean).join(" ").replaceAll("_", " ")
}

export const fromNvd = (res: NvdResponse) => {
  const cve = res.vulnerabilities?.[0]?.cve
  if (!cve) return null
  // Prefer the newest CVSS version, and NVD's own (Primary) score within it.
  const metrics = ["cvssMetricV40", "cvssMetricV31", "cvssMetricV30"]
    .map((k) => cve.metrics?.[k])
    .find((m) => m?.length)
  const metric = metrics?.find((m) => m.type === "Primary") ?? metrics?.[0]
  const matches = (cve.configurations ?? [])
    .flatMap((c) => c.nodes)
    .flatMap((n) => n.cpeMatch ?? [])
    .filter((m) => m.vulnerable)
  const description =
    cve.descriptions?.find((d) => d.lang === "en")?.value ?? cve.descriptions?.[0]?.value ?? ""
  return {
    cveId: cve.id,
    title: cve.cisaVulnerabilityName ?? cve.id,
    description,
    cvssScore: metric?.cvssData.baseScore ?? null,
    cvssVector: metric?.cvssData.vectorString ?? null,
    cweId:
      cve.weaknesses
        ?.flatMap((w) => w.description.map((d) => d.value))
        .find((v) => /^CWE-\d+$/.test(v)) ?? null,
    affectedProducts: [...new Set(matches.map(product))],
    fixedVersions: [
      ...new Set(matches.flatMap((m) => (m.versionEndExcluding ? [m.versionEndExcluding] : []))),
    ],
    publishedAt: day(cve.published),
    modifiedAt: day(cve.lastModified),
    kevStatus: Boolean(cve.cisaExploitAdd),
    exploitation: cve.cisaExploitAdd ? `CISA KEV登録（${cve.cisaExploitAdd}）` : null,
    mitigation: cve.cisaRequiredAction ? [cve.cisaRequiredAction] : [],
  }
}
