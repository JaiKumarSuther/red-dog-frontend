import type { NextConfig } from "next";

const replitDomain = process.env.REPLIT_DEV_DOMAIN ?? "";
const apiOrigin =
  process.env.API_ORIGIN ||
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "");

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.replit.dev",
    "*.worf.replit.dev",
    ...(replitDomain ? [replitDomain] : []),
    "localhost",
    "127.0.0.1",
  ],
  async rewrites() {
    if (!apiOrigin) return [];
    return [{ source: "/api/:path*", destination: `${apiOrigin.replace(/\/$/, "")}/api/:path*` }];
  },
};

export default nextConfig;
