import { NextResponse } from "next/server"
import { ValidationError } from "./admin-store"

/** Admin endpoints answer 404 outside `next dev`, even if somehow bundled. */
export const devOnly = () =>
  process.env.NODE_ENV === "development"
    ? null
    : NextResponse.json({ error: "Not found" }, { status: 404 })

export const fail = (e: unknown) =>
  e instanceof ValidationError
    ? NextResponse.json({ error: "validation", errors: e.errors }, { status: 400 })
    : NextResponse.json({ error: String(e) }, { status: 400 })

/**
 * CSRF guard for write requests: a page on another origin open in the dev's
 * browser could otherwise POST a `text/plain` "simple request" to localhost.
 * Requiring JSON forces a CORS preflight, and Origin/Sec-Fetch-Site must be ours.
 */
export const sameOriginWrite = (req: Request, hasBody: boolean) => {
  const site = req.headers.get("sec-fetch-site")
  const origin = req.headers.get("origin")
  const host = req.headers.get("host")
  const crossOrigin =
    (site && site !== "same-origin") || (origin && new URL(origin).host !== host)
  const notJson =
    hasBody && !req.headers.get("content-type")?.startsWith("application/json")
  return crossOrigin || notJson
    ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
    : null
}
