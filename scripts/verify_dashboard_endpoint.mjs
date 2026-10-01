import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const [base, origin = "https://www.onycx.dev"] = process.argv.slice(2);
if (!base || new URL(base).origin !== base || !base.startsWith("https://")) throw new Error("Usage: node scripts/verify_dashboard_endpoint.mjs https://<worker-origin> https://<site-origin>");
const get = (path, extra = {}) => fetch(`${base}/${path}`, { redirect: "error", signal: AbortSignal.timeout(15000), headers: { Origin: origin }, ...extra });
const response = await get("analytics/manifest.json");
assert.equal(response.status, 200, "Manifest HTTP status");
assert.equal(response.headers.get("access-control-allow-origin"), origin, "Manifest CORS");
const manifest = await response.json();
assert.equal(manifest.data_version, "v2");
assert.match(manifest.r2_release_prefix, /^analytics\/releases\/[a-f0-9]{64}$/);
assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0);
for (const file of manifest.files) {
  assert.match(file.path, /^v2\/(retail-iq|shoplens|customer-behaviour|sales-analysis)\/[a-z-]+\.json$/);
  const asset = await get(`${manifest.r2_release_prefix}/${file.path}`);
  assert.equal(asset.status, 200, file.path);
  assert.equal(asset.headers.get("access-control-allow-origin"), origin);
  assert.match(asset.headers.get("content-type"), /application\/json/);
  const buffer = Buffer.from(await asset.arrayBuffer());
  assert.equal(buffer.length, file.bytes, file.path);
  assert.equal(createHash("sha256").update(buffer).digest("hex"), file.sha256, file.path);
  JSON.parse(buffer.toString("utf8"));
  console.log(`Verified ${file.path}`);
}
assert.equal((await get("analytics/manifest.json", { method: "POST" })).status, 405);
assert.equal((await get("analytics/manifest.json", { headers: { Origin: "https://untrusted.example" } })).status, 403);
assert.equal((await get("raw.csv")).status, 404);
console.log(`PASS: ${manifest.files.length} remote aggregate files, release hashes, CORS and access restrictions.`);
