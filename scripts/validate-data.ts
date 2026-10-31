import { readFileSync } from "node:fs"
import { COLLECTIONS, validateDb } from "../lib/validation.ts"

const raw = Object.fromEntries(
  COLLECTIONS.map((c) => [
    c,
    JSON.parse(readFileSync(new URL(`../data/${c}.json`, import.meta.url), "utf8")),
  ])
) as Parameters<typeof validateDb>[0]

const errors = validateDb(raw)
if (errors.length) {
  console.error(errors.join("\n"))
  process.exit(1)
}
console.log(`OK: ${COLLECTIONS.map((c) => `${c}=${(raw[c] as unknown[]).length}`).join(" ")}`)
