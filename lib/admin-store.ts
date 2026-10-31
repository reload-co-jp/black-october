import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { Collection, COLLECTIONS, validateDb } from "./validation"

// Server-only, imported solely from *.dev.ts routes (absent from production builds).
const DATA_DIR = path.join(process.cwd(), "data")
const BACKUP_DIR = path.join(DATA_DIR, ".backup")

type Row = { id: string } & Record<string, unknown>
type Raw = Record<Collection, Row[]>

/** Whitelist check: the only way a request value reaches a file path. */
export const asCollection = (name: string): Collection | null =>
  (COLLECTIONS as string[]).includes(name) ? (name as Collection) : null

const file = (c: Collection) => path.join(DATA_DIR, `${c}.json`)

export const readAll = async (): Promise<Raw> =>
  Object.fromEntries(
    await Promise.all(
      COLLECTIONS.map(async (c) => [c, JSON.parse(await readFile(file(c), "utf8"))])
    )
  )

// ponytail: in-process lock only; fine for a single local dev server.
let lock = Promise.resolve()

export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(errors.join("\n"))
  }
}

/**
 * Re-reads every file (so concurrent edits are not lost), applies `mutate`,
 * validates the whole dataset, backs up the old file, then writes atomically.
 */
export const update = <T>(c: Collection, mutate: (rows: Row[], all: Raw) => T) => {
  const run = lock.then(async () => {
    const all = await readAll()
    const rows = structuredClone(all[c])
    const result = mutate(rows, all)
    const errors = validateDb({ ...all, [c]: rows })
    if (errors.length) throw new ValidationError(errors)
    await mkdir(BACKUP_DIR, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, "-")
    await copyFile(file(c), path.join(BACKUP_DIR, `${c}-${stamp}.json`))
    const tmp = `${file(c)}.tmp`
    await writeFile(tmp, JSON.stringify(rows, null, 2) + "\n")
    await rename(tmp, file(c))
    return result
  })
  lock = run.then(
    () => undefined,
    () => undefined
  )
  return run
}
