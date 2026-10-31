/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development"

const nextConfig = {
  // Static export for production. Dev runs as a normal server so the
  // admin API (route.dev.ts) can write JSON files.
  output: isDev ? undefined : "export",
  // *.dev.tsx / *.dev.ts (admin page + API) only exist in `next dev`;
  // production builds never see them.
  pageExtensions: isDev ? ["dev.tsx", "dev.ts", "tsx", "ts"] : ["tsx", "ts"],
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
