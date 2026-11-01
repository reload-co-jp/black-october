import Link from "next/link"
import { Metadata } from "next"
import { Footer, Header, Main, Title } from "@/components/elements/layout"
import { UnderlineNav } from "@/components/elements/nav"
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

const NAV: [string, string][] = [
  ["Incidents", "/incidents/"],
  ["Vulnerabilities", "/vulnerabilities/"],
  ["Techniques", "/techniques/"],
  ["Statistics", "/statistics/"],
  ["About", "/about/"],
]

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja">
      <body>
        <Header>
          <Title style={{ fontWeight: 600 }}>
            <Link href="/" style={{ color: "#e6edf3" }}>
              <span style={{ color: "#e5262b" }}>■</span> BLACK OCTOBER
            </Link>
          </Title>
          <UnderlineNav items={NAV} />
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
