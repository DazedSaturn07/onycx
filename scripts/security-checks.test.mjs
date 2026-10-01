import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import ts from "typescript";
import worker from "../analytics/cloudflare/worker.mjs";
import { analyticsDataOrigin, contentSecurityPolicy } from "../src/lib/security-policy.mjs";

async function importTs(path, replacements = []) {
  let source = ts.transpileModule(await readFile(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const [from, to] of replacements) source = source.replaceAll(from, to);
  const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  return { url, module: await import(url) };
}
const analytics = await importTs("../src/lib/analytics-dashboards.ts");
const { module: data } = await importTs("../src/lib/dashboard-data.ts", [["./analytics-dashboards", analytics.url]]);
const { module: security } = await importTs("../src/lib/api-security.ts");
const origin = "https://www.onycx.dev";
const hash = "a".repeat(64);
const path = `/analytics/releases/${hash}/v2/shoplens/overview.json`;
test("CSP restricts scripts to nonces and validates the exact HTTPS data origin", () => {
  const policy = contentSecurityPolicy({ nonce: "test123", dataOrigin: "https://data.example.com" });
  const script = policy.split(";").find((directive) => directive.trim().startsWith("script-src "));
  assert.match(script, /nonce-test123/); assert.match(script, /strict-dynamic/); assert.doesNotMatch(script, /unsafe-inline|unsafe-eval/);
  assert.match(policy, /script-src-attr 'none'/);
  assert.equal(analyticsDataOrigin("https://data.example.com/"), "https://data.example.com");
  for (const value of ["http://data.example.com", "https://user:password@data.example.com", "https://data.example.com/analytics", "https://data.example.com?bad=1", "https://data.example.com#bad"]) assert.throws(() => analyticsDataOrigin(value));
});
test("Vercel production cannot build without its real R2 data origin", async () => {
  const previousEnvironment = process.env.VERCEL_ENV;
  const previousDataOrigin = process.env.NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL;
  try {
    process.env.VERCEL_ENV = "production";
    delete process.env.NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL;
    await assert.rejects(import("../next.config.mjs?missing-production-data"), /Set NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL/);
    process.env.NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL = "https://data.example.com";
    assert.ok((await import("../next.config.mjs?configured-production-data")).default);
  } finally {
    if (previousEnvironment === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previousEnvironment;
    if (previousDataOrigin === undefined) delete process.env.NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL; else process.env.NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL = previousDataOrigin;
  }
});
function environment(success = true) {
  let reads = 0;
  const object = { body: '{"real":true}', size: 13, httpEtag: '"test"' };
  return { ALLOWED_ORIGINS: origin, DATA_RATE_LIMITER: { limit: async () => ({ success }) }, DASHBOARD_DATA: { get: async () => { reads++; return object; }, head: async () => { reads++; return object; } }, reads: () => reads };
}
test("Worker serves GET/HEAD with exact CORS and immutable release caching", async () => {
  for (const method of ["GET", "HEAD"]) {
    const response = await worker.fetch(new Request(`https://data.example.com${path}`, { method, headers: { Origin: origin } }), environment());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), origin);
    assert.match(response.headers.get("cache-control"), /immutable/);
    assert.equal(await response.text(), method === "HEAD" ? "" : '{"real":true}');
  }
});
test("Worker denies foreign origins, writes, raw paths, traversal, queries before R2 reads", async () => {
  for (const [suffix, method, headers, status] of [[path, "GET", { Origin: "https://evil.example" }, 403], [path, "POST", {}, 405], ["/raw.csv", "GET", {}, 404], ["/analytics/manifest.json/../raw.csv", "GET", {}, 404], [path + "?bypass=1", "GET", {}, 404]]) {
    const env = environment();
    const response = await worker.fetch(new Request(`https://data.example.com${suffix}`, { method, headers }), env);
    assert.equal(response.status, status); assert.equal(env.reads(), 0);
  }
});
test("Worker rate limits with Retry-After and fails closed when limiter is absent", async () => {
  const env = environment(false);
  const response = await worker.fetch(new Request(`https://data.example.com${path}`), env);
  assert.equal(response.status, 429); assert.equal(response.headers.get("retry-after"), "60"); assert.equal(env.reads(), 0);
  delete env.DATA_RATE_LIMITER;
  assert.equal((await worker.fetch(new Request(`https://data.example.com${path}`), env)).status, 503);
});
test("Worker validates preflight, missing objects, conditional GET and short manifest cache", async () => {
  const env = environment();
  const preflight = await worker.fetch(new Request(`https://data.example.com${path}`, { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "GET" } }), env);
  assert.equal(preflight.status, 204); assert.equal(env.reads(), 0);
  assert.equal((await worker.fetch(new Request(`https://data.example.com${path}`, { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "PUT" } }), env)).status, 403);
  assert.equal((await worker.fetch(new Request(`https://data.example.com${path}`, { headers: { "If-None-Match": '"test"' } }), env)).status, 304);
  assert.match((await worker.fetch(new Request("https://data.example.com/analytics/manifest.json"), env)).headers.get("cache-control"), /max-age=60/);
  env.DASHBOARD_DATA.get = async () => null;
  assert.equal((await worker.fetch(new Request(`https://data.example.com${path}`), env)).status, 404);
});
test("API rejects foreign origins and limits requests without trusting spoofed IP headers", () => {
  assert.equal(security.checkPublicApiRequest(new Request("https://www.onycx.dev/api/github-contributions", { headers: { Origin: "https://evil.example" } }))?.status, 403);
  const now = Date.now();
  for (let i = 0; i < 120; i++) assert.equal(security.checkPublicApiRequest(new Request("https://www.onycx.dev/api/github-contributions", { headers: { "X-Forwarded-For": `spoof-${i}` } }), now), null);
  assert.equal(security.checkPublicApiRequest(new Request("https://www.onycx.dev/api/github-contributions"), now)?.status, 429);
  assert.equal(security.checkPublicApiRequest(new Request("https://www.onycx.dev/api/github-contributions"), now + 60_000), null);
});
test("Loader verifies content hashes and rejects corrupt JSON, missing releases and HTTP failures", async () => {
  const previousFetch = globalThis.fetch;
  const buffer = Buffer.from(JSON.stringify({ project: "shoplens", metadata: {}, metrics: [] }));
  const manifest = { data_version: "v2", built_at_utc: new Date().toISOString(), r2_release_prefix: `analytics/releases/${hash}`, files: [{ path: "v2/shoplens/overview.json", bytes: buffer.length, sha256: createHash("sha256").update(buffer).digest("hex") }] };
  try {
    globalThis.fetch = async () => new Response(buffer, { headers: { "Content-Type": "application/json" } });
    assert.equal((await data.loadDashboardAsset("https://data.example.com", manifest, "shoplens", "overview.json")).project, "shoplens");
    globalThis.fetch = async () => new Response('{"tampered":true}', { headers: { "Content-Type": "application/json" } });
    await assert.rejects(data.loadDashboardAsset("", manifest, "shoplens", "overview.json"), /does not match/);
    await assert.rejects(data.loadDashboardAsset("", manifest, "shoplens", "raw.csv"), /Unsupported/);
    await assert.rejects(data.loadDashboardAsset("", { ...manifest, files: [] }, "shoplens", "overview.json"), /missing/);
    globalThis.fetch = async () => Response.json(manifest);
    assert.equal((await data.loadDashboardManifest("")).data_version, "v2");
    globalThis.fetch = async () => Response.json({ ...manifest, r2_release_prefix: "../../secrets" });
    await assert.rejects(data.loadDashboardManifest(""), /invalid/);
    globalThis.fetch = async () => new Response("unavailable", { status: 429 });
    await assert.rejects(data.loadDashboardManifest(""), /HTTP 429/);
    globalThis.fetch = async () => new Response(new Uint8Array(256_001), { headers: { "Content-Type": "application/json" } });
    await assert.rejects(data.loadDashboardManifest(""), /size limit/);
    globalThis.fetch = async () => new Response(new Uint8Array(buffer.length + 1), { headers: { "Content-Type": "application/json" } });
    await assert.rejects(data.loadDashboardAsset("https://data.example.com", manifest, "shoplens", "overview.json"), /size limit/);
  } finally { globalThis.fetch = previousFetch; }
});
test("All 17 real aggregate assets load through Worker and pass browser integrity verification", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/dashboard-data/manifest.json", import.meta.url), "utf8"));
  const realEnv = environment();
  realEnv.DASHBOARD_DATA.get = async (key) => {
    const file = key === "analytics/manifest.json" ? "manifest.json" : key.slice(manifest.r2_release_prefix.length + 1);
    const buffer = await readFile(new URL(`../public/dashboard-data/${file}`, import.meta.url));
    return { body: buffer, size: buffer.length, httpEtag: '"real"' };
  };
  const previousFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options = {}) => worker.fetch(new Request(url, { ...options, headers: { Origin: origin } }), realEnv);
    const release = await data.loadDashboardManifest("https://data.example.com");
    assert.equal(release.files.length, 17);
    for (const file of release.files) {
      const [, project, name] = file.path.split("/");
      assert.ok(await data.loadDashboardAsset("https://data.example.com", release, project, name));
    }
  } finally { globalThis.fetch = previousFetch; }
});
