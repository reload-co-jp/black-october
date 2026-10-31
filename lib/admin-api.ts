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
