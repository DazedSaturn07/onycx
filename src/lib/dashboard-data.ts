import { analyticsDashboards, DASHBOARD_DATA_VERSION, isJsonAsset } from "./analytics-dashboards";
import type { AnalyticsDashboardSlug, JsonAsset } from "./analytics-dashboards";

interface ManifestFile { path: string; bytes: number; sha256: string }
export interface DashboardManifest {
  data_version: string;
  built_at_utc: string;
  r2_release_prefix: string;
  files: ManifestFile[];
}

async function request(url: string, cache: RequestCache) {
  const response = await fetch(url, {
    cache, mode: "cors", credentials: "omit", redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Data request returned HTTP ${response.status}. Please retry.`);
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Data endpoint did not return JSON. Check the R2 endpoint configuration.");
  }
  return response;
}

async function boundedBytes(response: Response, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Data endpoint returned an empty body.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new Error("Data response exceeds the published size limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function loadDashboardManifest(base: string): Promise<DashboardManifest> {
  const response = await request(base ? `${base}/analytics/manifest.json` : "/dashboard-data/manifest.json", "no-cache");
  const value: unknown = JSON.parse(new TextDecoder().decode(await boundedBytes(response, 256_000)));
  if (!isJsonAsset(value) || value.data_version !== DASHBOARD_DATA_VERSION
    || typeof value.built_at_utc !== "string" || !Number.isFinite(Date.parse(value.built_at_utc))
    || typeof value.r2_release_prefix !== "string" || !/^analytics\/releases\/[a-f0-9]{64}$/.test(value.r2_release_prefix)
    || !Array.isArray(value.files) || value.files.length > 100
    || !value.files.every((file: unknown) => isJsonAsset(file)
      && typeof file.path === "string" && /^v2\/[a-z-]+\/[a-z-]+\.json$/.test(file.path)
      && typeof file.bytes === "number" && Number.isInteger(file.bytes) && file.bytes > 0 && file.bytes < 5_000_000
      && typeof file.sha256 === "string" && /^[a-f0-9]{64}$/.test(file.sha256))) {
    throw new Error("Dashboard manifest is invalid or incompatible. Publish the current release and retry.");
  }
  return value as unknown as DashboardManifest;
}

export async function loadDashboardAsset(base: string, manifest: DashboardManifest, project: AnalyticsDashboardSlug, file: string): Promise<JsonAsset> {
  const allowed = new Set<string>(["overview.json", ...analyticsDashboards[project].tabs.flatMap((tab) => [...tab.files])]);
  if (!allowed.has(file)) throw new Error("Unsupported dashboard asset.");
  const path = `${DASHBOARD_DATA_VERSION}/${project}/${file}`;
  const record = manifest.files.find((entry) => entry.path === path);
  if (!record) throw new Error(`The release is missing ${file}. Publish a complete release and retry.`);
  const url = base ? `${base}/${manifest.r2_release_prefix}/${path}` : `/dashboard-data/${path}?v=${record.sha256}`;
  const response = await request(url, base ? "force-cache" : "no-cache");
  const buffer = await boundedBytes(response, record.bytes);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (buffer.byteLength !== record.bytes || hash !== record.sha256) {
    throw new Error(`The ${file} file does not match the published release. Refresh after the upload finishes.`);
  }
  const value: unknown = JSON.parse(new TextDecoder().decode(buffer));
  if (!isJsonAsset(value) || (file === "overview.json" && (value.project !== project || !isJsonAsset(value.metadata) || !Array.isArray(value.metrics)))) {
    throw new Error(`The ${file} file has an invalid dashboard schema.`);
  }
  return value;
}
