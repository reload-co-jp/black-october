// Canonical origin for metadata, sitemap and JSON-LD. Set in CI for deploys.
// `||` not `??`: an unset GitHub Actions var arrives as "".
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bo.reload.co.jp"
export const SITE_NAME = "BLACK OCTOBER"
export const PERIOD = { from: "2026-10-01", to: "2026-10-31" }
// Pages that set their own `openGraph` replace the parent's object wholesale,
// so they spread this to keep site-wide fields.
export const OG_BASE = {
  siteName: SITE_NAME,
  locale: "ja_JP",
  images: { url: "/og.png", width: 1200, height: 630, alt: `${SITE_NAME} — 2026 Cybersecurity Incident Archive` },
}
