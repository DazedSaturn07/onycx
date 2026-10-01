// A bounded per-process guard supplements the host/CDN's distributed rate limit.
// No forwarded IP header is trusted, so clients cannot bypass it with spoofed IPs.
let windowStart = 0;
let requests = 0;
export function checkPublicApiRequest(request: Request, now = Date.now()): Response | null {
  const origin = request.headers.get("origin");
  const siteOrigin = "https://www.onycx.dev";
  const local = process.env.NODE_ENV !== "production" && (origin === "http://localhost:3005" || origin === "http://127.0.0.1:3005");
  if ((origin && origin !== siteOrigin && !local) || request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "Cross-origin API access is not allowed." }, { status: 403, headers: { "Cache-Control": "no-store", Vary: "Origin, Sec-Fetch-Site" } });
  }
  if (now - windowStart >= 60_000) { windowStart = now; requests = 0; }
  if (++requests > 120) return Response.json({ error: "Too many requests. Try again shortly." }, {
    status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(Math.max(1, Math.ceil((windowStart + 60_000 - now) / 1000))) },
  });
  return null;
}
