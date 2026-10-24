import { loadDashboardManifest, loadPublishedJson } from "./dashboard-data";
import type { DashboardManifest } from "./dashboard-data";
import type { StudyCube } from "./study-crossfilter";

export const studyDashboards = {
  "job-market": {
    title: "Job Market Quality",
    eyebrow: "Job market analysis / historical posting information quality",
    summary:
      "Explore pay disclosure, experience expectations, representative quality and exact text repetition in a historical LinkedIn snapshot.",
    source: "LinkedIn historical snapshot · March–April 2024",
    repo: "https://github.com/DazedSaturn07/FakeJob-Analysis",
    credit: "LinkedIn Job Postings (2023–2024), arshkon / Kaggle. Cleaned, minimized and aggregated for this analysis. Derived dashboard data: CC BY-SA 4.0.",
    sourceUrl: "https://www.kaggle.com/datasets/arshkon/linkedin-job-postings",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    trendTitle: "Posting observations by listed date",
    trendFormat: "number",
    tabs: [
      "Overview",
      "Pay & information",
      "Entry expectations",
      "Exact repetition",
      "Review evidence",
      "Method & quality",
    ],
  },
  loanflow: {
    title: "LoanFlow",
    eyebrow: "Business analysis / loan application process investigation",
    summary:
      "Investigate resolution time, incomplete-file signals, repeated work and exact process paths, then test the original pilot assumptions.",
    source: "BPI Challenge 2017 · historical lending event log",
    repo: "https://github.com/DazedSaturn07/LoanFlow",
    credit: "BPI Challenge 2017, Boudewijn van Dongen / 4TU.ResearchData. Cleaned, minimized and aggregated for this analysis.",
    sourceUrl: "https://doi.org/10.4121/uuid:5f3067df-f10b-45da-b98b-86ae4c7a310b",
    license: "4TU General Terms of Use",
    licenseUrl: "https://doi.org/10.4121/resource:terms_of_use",
    trendTitle: "Applications by starting month",
    trendFormat: "number",
    tabs: [
      "Overview",
      "Durations & signals",
      "Process paths",
      "Case investigation",
      "Pilot scenarios",
      "Method & quality",
    ],
  },
  airops: {
    title: "AirOps",
    eyebrow: "Operations analytics / airline disruption and reliability",
    summary:
      "Compare arrival reliability, carrier and route patterns, airport context, scheduled departure hours and recorded delay attribution.",
    source: "2015 US flight observations · full source population",
    repo: "https://github.com/DazedSaturn07/AirOps",
    credit: "2015 Flight Delays and Cancellations, US Department of Transportation / Kaggle. Cleaned and aggregated for this analysis.",
    sourceUrl: "https://www.kaggle.com/datasets/usdot/flight-delays",
    license: "CC0 Public Domain",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    trendTitle: "Custom on-time arrival rate by month",
    trendFormat: "percent",
    tabs: [
      "Overview",
      "Carriers & routes",
      "Airport patterns",
      "Recorded attribution",
      "Time & seasonality",
      "Route detail",
      "Method & quality",
    ],
  },
} as const;

export type StudySlug = keyof typeof studyDashboards;
export type MetricFormat =
  "number" | "percent" | "days" | "minutes" | "euro" | "score";
export interface StudyMetric {
  label: string;
  value: number | null;
  format: MetricFormat;
  note: string;
}
export interface StudyPoint {
  label: string;
  value: number | null;
  count?: number;
}
export interface StudyTable {
  columns: string[];
  rows: (string | number | null)[][];
}
export interface StudySample {
  label: string;
  type: string;
  goal: string;
  status: string;
  days: number | null;
  events: { activity: string; time: string }[];
}
export interface StudySlice {
  hero: StudyMetric;
  gauge: { label: string; value: number | null; segments: StudyPoint[] };
  metrics: StudyMetric[];
  trend: StudyPoint[];
  rankings: Record<string, StudyPoint[]>;
  facts: Record<string, number | null>;
  tables: Record<string, StudyTable>;
  samples?: StudySample[];
  trend_title?: string;
  trend_format?: MetricFormat;
}
export interface StudyData {
  version: number;
  project: StudySlug;
  prepared_at: string;
  period: string;
  filters: { key: string; label: string; values: string[] }[];
  slices: Record<string, StudySlice>;
  sources: { file: string; sha256: string }[];
  notes: string[];
  validation: string[];
  transitions?: StudyTable;
}

const numberFormat = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
});
const decimalFormat = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 2,
});
const percentFormat = new Intl.NumberFormat("en-GB", {
  style: "percent",
  maximumFractionDigits: 2,
});
const euroFormat = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export function formatStudy(
  value: number | null | undefined,
  format: MetricFormat = "number",
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (format === "percent") return percentFormat.format(value);
  if (format === "euro") return euroFormat.format(value);
  const n = (format === "number" ? numberFormat : decimalFormat).format(value);
  return n + (format === "days" ? " days" : format === "minutes" ? " min" : "");
}

const remoteBase =
  process.env.NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL?.trim().replace(/\/+$/, "") ??
  "";
let publishedRelease: Promise<DashboardManifest> | undefined;
async function publishedStudy(
  project: StudySlug,
  file: string,
  signal: AbortSignal,
) {
  publishedRelease ??= loadDashboardManifest(remoteBase).catch((error) => {
    publishedRelease = undefined;
    throw error;
  });
  try {
    return await loadPublishedJson(
      remoteBase,
      await publishedRelease,
      project,
      file,
      signal,
    );
  } catch (error) {
    publishedRelease = undefined;
    throw error;
  }
}

export async function loadStudyCube(
  project: StudySlug,
  file: "crossfilter" | "hourly",
  signal: AbortSignal,
): Promise<StudyCube> {
  const value = await publishedStudy(project, `${file}.json`, signal);
  if (
    value.project !== project ||
    value.version !== 1 ||
    !Array.isArray(value.rows) ||
    (file === "crossfilter" &&
      (!value.names || typeof value.names !== "object"))
  )
    throw new Error("The interactive study schema is invalid.");
  return value as unknown as StudyCube;
}

/** New studies share the same hash-verified R2 releases as the existing reports. */
export async function loadStudyData(
  project: StudySlug,
  signal: AbortSignal,
): Promise<StudyData> {
  const value = await publishedStudy(project, "overview.json", signal);
  const data = value as unknown as StudyData;
  if (
    data.version !== 1 ||
    data.project !== project ||
    !Array.isArray(data.filters) ||
    !Array.isArray(data.notes) ||
    !data.slices?.['["All","All"]']
  )
    throw new Error("The study schema is invalid.");
  return data;
}
