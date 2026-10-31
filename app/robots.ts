import { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export const dynamic = "force-static"

const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
  sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
})
export default robots
