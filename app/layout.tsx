import Link from "next/link"
import Script from "next/script"
import { Metadata } from "next"
import { Footer, Header, Main, Title } from "@/components/elements/layout"
import { UnderlineNav } from "@/components/elements/nav"
import { OG_BASE, SITE_NAME, SITE_URL } from "@/lib/site"
import "./reset.css"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} 2026 — Cybersecurity Incident Archive`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "2026年10月に発生・公表されたサイバーセキュリティインシデントを、一次情報に基づき経緯・原因・影響・対応まで整理するアーカイブ。",
  openGraph: { ...OG_BASE, type: "website" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  other: { "google-adsense-account": "ca-pub-6542845006087970" },
}

const NAV: [string, string][] = [
  ["Incidents", "/incidents/"],
  ["Study", "/study/"],
  ["Timeline", "/timeline/"],
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0XL3V4J6CP"
          strategy="afterInteractive"
        />
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6542845006087970"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-0XL3V4J6CP")`}
        </Script>
      </body>
    </html>
  )
}
export default RootLayout
