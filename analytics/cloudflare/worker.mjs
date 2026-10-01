// Public aggregate reads through a private R2 binding. No write or listing API.
const assets = {
  "retail-iq": ["overview", "interactions", "products", "retention", "personas", "affinity", "instacart"],
  shoplens: ["overview", "interactions", "products", "retention"],
  "sales-analysis": ["overview", "interactions", "products", "quality"],
  "customer-behaviour": ["overview", "behavior"],
};

const worker = {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const allowedOrigins = (env.ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
    const headers = new Headers({
      "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'", "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer", "Cache-Control": "no-store", Vary: "Origin",
    });
    const reply = (status, message) => new Response(request.method === "HEAD" ? null : JSON.stringify({ error: message }), { status, headers });
    if (origin && !allowedOrigins.includes(origin)) return reply(403, "Origin not allowed");
    if (origin) headers.set("Access-Control-Allow-Origin", origin);
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/analytics\/releases\/[a-f0-9]{64}\/v2\/([a-z-]+)\/([a-z-]+)\.json$/);
    const manifest = url.pathname === "/analytics/manifest.json";
    if (url.search || (!manifest && (!match || !assets[match[1]]?.includes(match[2])))) return reply(404, "Asset not found");
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      headers.set("Allow", "GET, HEAD, OPTIONS");
      return reply(405, "Read-only endpoint");
    }
    try {
      // Anonymous public readers have no authenticated user ID. NAT users share
      // this deliberately generous abuse limit. Cloudflare overwrites this header.
      const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
      const { success } = await env.DATA_RATE_LIMITER.limit({ key: `data:${ip}` });
      if (!success) { headers.set("Retry-After", "60"); return reply(429, "Too many requests. Retry in a minute."); }
      if (request.method === "OPTIONS") {
        const method = request.headers.get("Access-Control-Request-Method");
        if (!origin || !["GET", "HEAD"].includes(method) || request.headers.get("Access-Control-Request-Headers")) return reply(403, "Preflight not allowed");
        headers.set("Access-Control-Allow-Methods", "GET, HEAD");
        headers.set("Access-Control-Max-Age", "3600");
        return new Response(null, { status: 204, headers });
      }
      const key = url.pathname.slice(1);
      const object = request.method === "HEAD" ? await env.DASHBOARD_DATA.head(key) : await env.DASHBOARD_DATA.get(key);
      if (!object) return reply(404, "Asset not found");
      headers.set("ETag", object.httpEtag);
      headers.set("Access-Control-Expose-Headers", "ETag, Retry-After");
      headers.set("Cache-Control", manifest ? "public, max-age=60, must-revalidate" : "public, max-age=31536000, immutable");
      if (request.headers.get("If-None-Match")?.split(",").map((tag) => tag.trim()).some((tag) => tag === object.httpEtag || tag === "*")) return new Response(null, { status: 304, headers });
      headers.set("Content-Length", String(object.size));
      return new Response(request.method === "HEAD" ? null : object.body, { headers });
    } catch {
      console.error(JSON.stringify({ event: "dashboard_data_unavailable" }));
      return reply(503, "Data service temporarily unavailable");
    }
  },
};
export default worker;
