import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

// Use Next's dotenv parser; never execute the contents of environment files.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
nextEnv.loadEnvConfig(root);
const required = (key, pattern) => {
  const value = process.env[key]?.trim() ?? "";
  if (!pattern.test(value)) throw new Error(`Set a valid ${key} in the ignored .env.local before configuring the Worker.`);
  return value;
};
const config = JSON.parse(await readFile(resolve(root, "analytics/cloudflare/wrangler.example.jsonc"), "utf8"));
config.account_id = required("CLOUDFLARE_ACCOUNT_ID", /^[a-f0-9]{32}$/);
config.name = required("CLOUDFLARE_WORKER_NAME", /^[a-z][a-z0-9-]{0,62}$/);
config.r2_buckets[0].bucket_name = required("R2_BUCKET_NAME", /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/);
const origins = required("DASHBOARD_ALLOWED_ORIGINS", /^\S+$/).split(",");
for (const origin of origins) {
  const url = new URL(origin);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.origin !== origin || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) {
    throw new Error("DASHBOARD_ALLOWED_ORIGINS must contain exact HTTPS origins or HTTP localhost origins, separated by commas.");
  }
}
config.vars.ALLOWED_ORIGINS = [...new Set(origins)].join(",");
await writeFile(resolve(root, "analytics/cloudflare/wrangler.jsonc"), `${JSON.stringify(config, null, 2)}\n`, "utf8");
console.log("Configured the ignored analytics/cloudflare/wrangler.jsonc from local environment values.");
