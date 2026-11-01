import { describe, expect, it } from "vitest"
import { fromNvd } from "./nvd"

describe("fromNvd", () => {
  it("maps NVD 2.0 fields, preferring the newest primary CVSS", () => {
    const v = fromNvd({
      vulnerabilities: [
        {
          cve: {
            id: "CVE-2026-0001",
            published: "2026-10-02T10:00:00.000",
            lastModified: "2026-10-05T12:00:00.000",
            descriptions: [
              { lang: "es", value: "x" },
              { lang: "en", value: "RCE in Foo" },
            ],
            metrics: {
              cvssMetricV31: [
                { type: "Secondary", cvssData: { baseScore: 7.5, vectorString: "S" } },
                { type: "Primary", cvssData: { baseScore: 9.8, vectorString: "P" } },
              ],
            },
            weaknesses: [{ description: [{ value: "NVD-CWE-Other" }, { value: "CWE-787" }] }],
            configurations: [
              {
                nodes: [
                  {
                    cpeMatch: [
                      { vulnerable: true, criteria: "cpe:2.3:a:acme:foo_server:*:*", versionEndExcluding: "2.1.0" },
                      { vulnerable: true, criteria: "cpe:2.3:a:acme:bar:1.0:*" },
                      { vulnerable: false, criteria: "cpe:2.3:o:linux:kernel:-:*" },
                    ],
                  },
                ],
              },
            ],
            cisaExploitAdd: "2026-10-03",
            cisaVulnerabilityName: "Acme Foo RCE",
            cisaRequiredAction: "Apply updates.",
          },
        },
      ],
    })
    expect(v).toEqual({
      cveId: "CVE-2026-0001",
      title: "Acme Foo RCE",
      description: "RCE in Foo",
      cvssScore: 9.8,
      cvssVector: "P",
      cweId: "CWE-787",
      affectedProducts: ["acme foo server < 2.1.0", "acme bar 1.0"],
      fixedVersions: ["2.1.0"],
      publishedAt: "2026-10-02",
      modifiedAt: "2026-10-05",
      kevStatus: true,
      exploitation: "CISA KEV登録（2026-10-03）",
      mitigation: ["Apply updates."],
    })
  })

  it("returns null when NVD has no match", () => {
    expect(fromNvd({ vulnerabilities: [] })).toBeNull()
  })
})
