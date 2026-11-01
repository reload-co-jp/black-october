import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { devOnly, sameOriginWrite } from "@/lib/admin-api"

// Incident drafts queued by scripts/fetch-incidents.ts.
const FILE = path.join(process.cwd(), "data", "candidates.json")
type Store = { seen: string[]; items: { id: string }[] }
const read = (): Promise<Store> =>
  readFile(FILE, "utf8").then(JSON.parse, () => ({ seen: [], items: [] }))

export const GET = async () => devOnly() ?? NextResponse.json((await read()).items)

/** Drops a candidate; its URL stays in `seen` so the crawler won't queue it again. */
export const DELETE = async (req: Request) => {
  const blocked = devOnly() ?? sameOriginWrite(req, false)
  if (blocked) return blocked
  const id = new URL(req.url).searchParams.get("id")
  // ponytail: read-modify-write without a lock; a crawl finishing mid-request could lose this delete.
  const store = await read()
  await writeFile(FILE, JSON.stringify({ ...store, items: store.items.filter((c) => c.id !== id) }, null, 2) + "\n")
  return NextResponse.json({ ok: true })
}
