/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS ? process.env.ALLOWED_DEV_ORIGINS.split(',') : undefined,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    let analyticsDataOrigin = "";
    const analyticsDataBaseUrl = process.env.NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL?.trim();
    if (analyticsDataBaseUrl) {
      try {
        const candidate = new URL(analyticsDataBaseUrl);
        if (candidate.protocol === "https:" || (process.env.NODE_ENV !== "production" && candidate.protocol === "http:")) {
          analyticsDataOrigin = candidate.origin;
        }
      } catch {
        analyticsDataOrigin = "";
      }
    }
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
          value: `default-src 'self'; base-uri 'self'; connect-src 'self'${analyticsDataOrigin ? ` ${analyticsDataOrigin}` : ""}; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`,
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
        source: "/dashboard-data/v2/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/dashboard-data/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=60, stale-while-revalidate=300" }],
      },
    ];
  },
};

export default nextConfig;
