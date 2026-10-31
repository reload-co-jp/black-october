import Link from "next/link"
import { Metadata } from "next"
import { Footer, Header, Main, Title } from "@/components/elements/layout"
import { mono } from "@/components/ui"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import "./reset.css"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} 2026 — Cybersecurity Incident Archive`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "2026年10月に発生・公表されたサイバーセキュリティインシデントを、一次情報に基づき経緯・原因・影響・対応まで整理するアーカイブ。",
  openGraph: { siteName: SITE_NAME, type: "website", locale: "ja_JP" },
  alternates: { canonical: "/" },
}

const NAV = [
  ["INCIDENTS", "/incidents/"],
  ["VULNERABILITIES", "/vulnerabilities/"],
  ["TECHNIQUES", "/techniques/"],
  ["STATISTICS", "/statistics/"],
  ["ABOUT", "/about/"],
]

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja">
      <body>
        <Header>
          <Title style={{ ...mono, letterSpacing: ".18em" }}>
            <Link href="/" style={{ color: "#e8e8ea" }}>
              <span style={{ color: "#e5262b" }}>■</span> BLACK OCTOBER
            </Link>
          </Title>
          <nav aria-label="メインナビゲーション">
            <ul
              style={{
                ...mono,
                display: "flex",
                flexWrap: "wrap",
                fontSize: ".75rem",
                gap: ".25rem 1rem",
                letterSpacing: ".08em",
                listStyle: "none",
                padding: 0,
              }}
            >
              {NAV.map(([name, href]) => (
                <li key={href}>
                  <Link href={href} style={{ color: "#c9c9ce" }}>
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Header>
        <Main>{children}</Main>
        <Footer>
          <p>
            BLACK OCTOBER — 2026 Cybersecurity Incident Archive.
            掲載内容は公開情報の要約です。詳細は各出典をご確認ください。
          </p>
        </Footer>
      </body>
    </html>
  )
}
export default RootLayout
