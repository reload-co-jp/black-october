import { NextResponse } from "next/server"
import { devOnly, fail, sameOriginWrite } from "@/lib/admin-api"
import { asCollection, readAll, update } from "@/lib/admin-store"

type Ctx = { params: Promise<{ collection: string; id: string }> }
const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 })

const resolve = async (params: Ctx["params"]) => {
  const p = await params
  return { c: asCollection(p.collection), id: p.id }
}

export const GET = async (_: Request, { params }: Ctx) => {
  const { c, id } = await resolve(params)
  if (devOnly() || !c) return devOnly() ?? notFound()
  const row = (await readAll())[c].find((r) => r.id === id)
  return row ? NextResponse.json(row) : notFound()
}

export const PUT = async (req: Request, { params }: Ctx) => {
  const { c, id } = await resolve(params)
  if (devOnly() || !c) return devOnly() ?? notFound()
  const forbidden = sameOriginWrite(req, true)
  if (forbidden) return forbidden
  try {
    const body = await req.json()
    const found = await update(c, (rows) => {
      const i = rows.findIndex((r) => r.id === id)
      if (i >= 0) rows[i] = body
      return i >= 0
    })
    return found ? NextResponse.json(body) : notFound()
  } catch (e) {
    return fail(e)
  }
}

// Deleting a row that is still referenced fails validation and is rejected.
export const DELETE = async (req: Request, { params }: Ctx) => {
  const { c, id } = await resolve(params)
  if (devOnly() || !c) return devOnly() ?? notFound()
  const forbidden = sameOriginWrite(req, false)
  if (forbidden) return forbidden
  try {
    const found = await update(c, (rows) => {
      const i = rows.findIndex((r) => r.id === id)
      if (i >= 0) rows.splice(i, 1)
      return i >= 0
    })
    return found ? new NextResponse(null, { status: 204 }) : notFound()
  } catch (e) {
    return fail(e)
  }
}
