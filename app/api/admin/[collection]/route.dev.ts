import { NextResponse } from "next/server"
import { devOnly, fail } from "@/lib/admin-api"
import { asCollection, readAll, update } from "@/lib/admin-store"

type Ctx = { params: Promise<{ collection: string }> }

export const GET = async (_: Request, { params }: Ctx) => {
  const c = asCollection((await params).collection)
  if (devOnly() || !c) return devOnly() ?? NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json((await readAll())[c])
}

export const POST = async (req: Request, { params }: Ctx) => {
  const c = asCollection((await params).collection)
  if (devOnly() || !c) return devOnly() ?? NextResponse.json({ error: "Not found" }, { status: 404 })
  try {
    const body = await req.json()
    await update(c, (rows) => {
      if (rows.some((r) => r.id === body?.id)) throw new Error(`id "${body?.id}" already exists`)
      rows.push(body)
    })
    return NextResponse.json(body, { status: 201 })
  } catch (e) {
    return fail(e)
  }
}
