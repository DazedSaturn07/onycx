import { loadDashboardManifest, loadPublishedJson } from "./dashboard-data";
import type { DashboardManifest } from "./dashboard-data";

export const operationDashboards = {
  civicpulse: {
    title: "CivicPulse",
    eyebrow: "Service operations / demand, resolution and cohort backlog",
    summary:
      "Investigate all 348,180 requests created in January 2025, with exact filtered resolution percentiles, agency comparisons and source-quality context.",
    source: "NYC 311 · January 2025 intake · snapshot 25 October 2026",
    section: "analytics",
    tabs: [
      "Operations overview",
      "Agency performance",
      "Complaint patterns",
      "Geographic demand",
      "Request investigation",
      "Method & quality",
    ],
  },
  freightflow: {
    title: "FreightFlow",
    eyebrow: "Supply chain analytics / freight flow and lane investigation",
    summary:
      "Explore the full FAF5.7.1 snapshot by trade, transport mode and commodity. Compare the 2024 estimate with source forecast scenarios and investigate eligible lanes.",
    source: "BTS / FHWA · FAF5.7.1 · 2024 estimate and 2030/2050 forecasts",
    section: "supply-chain",
    tabs: [
      "Freight overview",
      "Lane explorer",
      "Mode & commodity",
      "Source candidates",
      "Growth scenarios",
      "Method & quality",
    ],
  },
} as const;
export type OperationsSlug = keyof typeof operationDashboards;
export interface Attribution {
  title: string;
  url: string;
  terms: string;
  changes: string;
}
export interface CivicOverview {
  version: number;
  project: "civicpulse";
  names: Record<string, string[]>;
  flags: string[];
  parts: string[];
  baseline: Record<string, number>;
  snapshot: string;
  period: string;
  report_pages: string[];
  attribution: Attribution;
}
export type CivicRow = [
  day: number,
  agency: number,
  borough: number,
  complaint: number,
  channel: number,
  zip: number,
  status: number,
  closed: number,
  durationSeconds: number | null,
  dueEligible: number,
  dueMet: number,
  benchmarkMet: number,
  qualityMask: number,
  ageSeconds: number | null,
];
export interface CivicData extends CivicOverview {
  rows: CivicRow[];
}
export const civicDimensions = {
  created_day: 0,
  agency: 1,
  borough: 2,
  complaint_type: 3,
  channel: 4,
  incident_zip: 5,
  status: 6,
} as const;
export type CivicFilters = Record<keyof typeof civicDimensions, string>;
export const allCivicFilters: CivicFilters = {
  created_day: "All",
  agency: "All",
  borough: "All",
  complaint_type: "All",
  channel: "All",
  incident_zip: "All",
  status: "All",
};
export interface CivicSummary {
  requests: number;
  closed: number;
  backlog: number;
  valid_duration: number;
  median_hours: number | null;
  p90_hours: number | null;
  due_eligible: number;
  due_met: number;
  benchmark_met: number;
  quality_issues: number;
}
export const ratio = (n: number, d: number): number | null =>
  d ? n / d : null;
const quantile = (sorted: number[], q: number): number | null => {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * q,
    a = Math.floor(i);
  return (sorted[a] + (sorted[Math.ceil(i)] - sorted[a]) * (i - a)) / 3600;
};
export function civicSummary(rows: CivicRow[]): CivicSummary {
  const durations: number[] = [];
  const result: CivicSummary = {
    requests: rows.length,
    closed: 0,
    backlog: 0,
    valid_duration: 0,
    median_hours: null,
    p90_hours: null,
    due_eligible: 0,
    due_met: 0,
    benchmark_met: 0,
    quality_issues: 0,
  };
  for (const r of rows) {
    result.closed += r[7];
    result.backlog += 1 - r[7];
    result.due_eligible += r[9];
    result.due_met += r[10];
    result.benchmark_met += r[11];
    result.quality_issues += Number(r[12] > 0);
    if (r[8] !== null) durations.push(r[8]);
  }
  durations.sort((a, b) => a - b);
  result.valid_duration = durations.length;
  result.median_hours = quantile(durations, 0.5);
  result.p90_hours = quantile(durations, 0.9);
  return result;
}
export function deriveCivic(data: CivicData, filters: CivicFilters) {
  const predicates = (
    Object.entries(civicDimensions) as [keyof CivicFilters, number][]
  )
    .filter(([key]) => filters[key] !== "All")
    .map(([key, index]) => [index, data.names[key].indexOf(filters[key])]);
  const rows = data.rows.filter((r) =>
    predicates.every(([index, value]) => r[index] === value),
  );
  return { rows, summary: civicSummary(rows) };
}
export function civicGroups(
  rows: CivicRow[],
  dimension: keyof CivicFilters,
  names: CivicOverview["names"],
  detailed = false,
) {
  const groups = new Map<number, CivicRow[]>(),
    index = civicDimensions[dimension];
  for (const row of rows) {
    const group = groups.get(row[index]) ?? [];
    group.push(row);
    groups.set(row[index], group);
  }
  return [...groups].map(([code, group]) => ({
    label: names[dimension][code],
    code,
    summary: detailed
      ? civicSummary(group)
      : {
          requests: group.length,
          closed: group.reduce((n, r) => n + r[7], 0),
          backlog: group.reduce((n, r) => n + 1 - r[7], 0),
          due_eligible: group.reduce((n, r) => n + r[9], 0),
          due_met: group.reduce((n, r) => n + r[10], 0),
          quality_issues: group.reduce((n, r) => n + Number(r[12] > 0), 0),
        },
  }));
}

export interface FreightName {
  code: string;
  label: string;
}
export interface FreightOverview {
  version: number;
  project: "freightflow";
  names: Record<"zones" | "commodities" | "modes" | "trades", FreightName[]>;
  years: number[];
  scale: number;
  cube: number[][];
  partitions: Record<string, string[]>;
  baseline: Record<string, number>;
  report_pages: string[];
  attribution: Attribution;
}
// Lane: origin, destination, mode, trade, then [tons,value,miles] for each of 3 years, and fact count per year.
export type FreightLane = number[];
export interface FreightFilters {
  year: number;
  trade: number;
  mode: number;
  commodity: number;
}
export const allFreightFilters: FreightFilters = {
  year: 2024,
  trade: -1,
  mode: -1,
  commodity: -1,
};
export interface FreightSummary {
  tons: number;
  value: number;
  miles: number;
  records: number;
}
export function freightSummary(
  data: FreightOverview,
  filters: FreightFilters,
): FreightSummary {
  const result = { tons: 0, value: 0, miles: 0, records: 0 },
    year = data.years.indexOf(filters.year);
  for (const r of data.cube) {
    if (
      r[0] !== year ||
      (filters.trade >= 0 && r[1] !== filters.trade) ||
      (filters.mode >= 0 && r[2] !== filters.mode) ||
      (filters.commodity >= 0 && r[3] !== filters.commodity)
    )
      continue;
    result.tons += r[4];
    result.value += r[5];
    result.miles += r[6];
    result.records += r[7];
  }
  result.tons /= data.scale;
  result.value /= data.scale;
  result.miles /= data.scale;
  return result;
}
export function freightGroups(
  data: FreightOverview,
  filters: FreightFilters,
  dimension: "mode" | "commodity",
) {
  const names = data.names[dimension === "mode" ? "modes" : "commodities"];
  return names.map((n, index) => ({
    label: n.label,
    code: index,
    summary: freightSummary(data, { ...filters, [dimension]: index }),
  }));
}
export function freightLanes(
  data: FreightOverview,
  rows: FreightLane[],
  filters: FreightFilters,
) {
  const offset = 4 + data.years.indexOf(filters.year) * 3;
  return rows
    .filter(
      (r) =>
        (filters.mode < 0 || r[2] === filters.mode) &&
        (filters.trade < 0 || r[3] === filters.trade),
    )
    .map((r) => ({
      origin: data.names.zones[r[0]].label,
      destination: data.names.zones[r[1]].label,
      mode: data.names.modes[r[2]].label,
      trade: data.names.trades[r[3]].label,
      tons: r[offset] / data.scale,
      value: r[offset + 1] / data.scale,
      miles: r[offset + 2] / data.scale,
      baseline: r[4] / data.scale,
      forecast: r[10] / data.scale,
      records: r[13],
    }));
}

export async function operationsReader(
  project: OperationsSlug,
  signal: AbortSignal,
) {
  const base =
    process.env.NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL?.trim().replace(
      /\/+$/,
      "",
    ) ?? "";
  const manifest: DashboardManifest = await loadDashboardManifest(base);
  return async (file: string) => {
    const value = await loadPublishedJson(
      base,
      manifest,
      project,
      file + ".json",
      signal,
    );
    if (value.project !== project || value.version !== 1)
      throw new Error("The operations dataset schema is incompatible.");
    if (
      file !== "overview" &&
      (!Array.isArray(value.rows) ||
        !value.rows.every(
          (r) =>
            Array.isArray(r) &&
            r.every(
              (v) =>
                v === null || (typeof v === "number" && Number.isFinite(v)),
            ),
        ))
    )
      throw new Error("The analytical records are invalid.");
    return value;
  };
}
export type OperationsReader = Awaited<ReturnType<typeof operationsReader>>;
