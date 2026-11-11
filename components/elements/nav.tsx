"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FC } from "react"

/** GitHub-style underline tabs; the current section gets the accent underline. */
export const UnderlineNav: FC<{ items: [string, string][] }> = ({ items }) => {
  const path = usePathname()
  return (
    <nav aria-label="メインナビゲーション" style={{ overflowX: "auto" }}>
      <ul
        style={{ display: "flex", gap: ".5rem", listStyle: "none", padding: 0 }}
      >
        {items.map(([name, href]) => {
          const current = path.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                style={{
                  borderBottom: `2px solid ${current ? "#0969da" : "transparent"}`,
                  color: "#1f2328",
                  display: "block",
                  fontSize: "14px",
                  fontWeight: current ? 600 : 400,
                  padding: "8px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
