// Canonical origin for metadata, sitemap and JSON-LD. Set in CI for deploys.
// `||` not `??`: an unset GitHub Actions var arrives as "".
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bo.reload.co.jp"
export const SITE_NAME = "BLACK OCTOBER"
export const PERIOD = { from: "2026-10-01", to: "2026-10-31" }
