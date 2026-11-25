import { networkInterfaces } from "node:os";
import { analyticsDataOrigin, contentSecurityPolicy } from "./src/lib/security-policy.mjs";

const configuredDataOrigin = analyticsDataOrigin(process.env.NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL);
if (process.env.VERCEL_ENV === "production" && !configuredDataOrigin) {
  throw new Error("Set NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL in the Vercel Production build environment before deploying.");
}

function resolveAllowedDevOrigins() {
  const configured = process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];
  if (process.env.NODE_ENV === "production") {
    return configured.length > 0 ? configured : undefined;
  }
  const lanIps = Object.values(networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === "IPv4" && !iface.internal)
    .map((iface) => iface.address);
  const origins = [...new Set([...configured, ...lanIps])];
  return origins.length > 0 ? origins : undefined;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: resolveAllowedDevOrigins(),
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    const dataOrigin = configuredDataOrigin;
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
    ];

    if (process.env.NODE_ENV === "production") {
      securityHeaders.push(
        {
          key: "Content-Security-Policy",
          value: contentSecurityPolicy({ dataOrigin }),
        },
        { key: "Strict-Transport-Security", value: "max-age=31536000" },
      );
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/resumes/:filename",
        headers: [{ key: "Content-Disposition", value: 'attachment; filename=":filename"' }],
      },
      {
        source: "/dashboard-data/v2/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/dashboard-data/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=60, stale-while-revalidate=300" }],
      },
      {
        source: "/study-data/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
