import { NextResponse } from "next/server"
import { devOnly } from "@/lib/admin-api"
import { CVE_ID, fromNvd } from "@/lib/nvd"

type Ctx = { params: Promise<{ cve: string }> }

/** Looks a CVE up in NVD and returns it as vulnerability fields. */
export const GET = async (_: Request, { params }: Ctx) => {
  const forbidden = devOnly()
  if (forbidden) return forbidden
  const cve = (await params).cve.toUpperCase()
  if (!CVE_ID.test(cve)) return NextResponse.json({ error: "Invalid CVE ID" }, { status: 400 })
  const key = process.env.NVD_API_KEY
  const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cve}`, {
    headers: key ? { apiKey: key } : {},
    cache: "no-store",
  })
  if (!res.ok) return NextResponse.json({ error: `NVD responded ${res.status}` }, { status: 502 })
  const fields = fromNvd(await res.json())
  if (!fields) return NextResponse.json({ error: `${cve} not found in NVD` }, { status: 404 })
  return NextResponse.json(fields)
}
