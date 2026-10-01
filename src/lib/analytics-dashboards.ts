export const DASHBOARD_DATA_VERSION = "v2";

export const analyticsDashboards = {
  "retail-iq": {
    title: "RetailIQ",
    eyebrow: "Retail intelligence / four linked data studies",
    summary: "Read positive-line trading alongside shopper profiles, retention, basket affinity, and grocery reorder behaviour.",
    source: "Online Retail, mall customer records, and an Instacart order sample",
    tabs: [
      { id: "trading", label: "Trading", files: ["interactions.json"] },
      { id: "products", label: "Products", files: ["products.json"] },
      { id: "retention", label: "Retention", files: ["retention.json"] },
      { id: "baskets", label: "Baskets & reorders", files: ["personas.json", "affinity.json", "instacart.json"] },
      { id: "quality", label: "Data quality", files: [] },
    ],
  },
  shoplens: {
    title: "ShopLens Analytics",
    eyebrow: "Customer value / retention and repeat purchase",
    summary: "Track retained transaction value, then explore the project’s snapshot RFM, inactivity, and cohort definitions.",
    source: "UCI Online Retail II, workbook copy",
    tabs: [
      { id: "trading", label: "Trading", files: ["interactions.json"] },
      { id: "retention", label: "Retention", files: ["retention.json"] },
      { id: "products", label: "Products", files: ["products.json"] },
      { id: "quality", label: "Data quality", files: [] },
    ],
  },
  "customer-behaviour": {
    title: "Customer Shopping Behaviour",
    eyebrow: "Customer analytics / how shoppers choose",
    summary: "Compare observed purchase amounts, previous purchase patterns, subscriptions, discounts, and preferences. This source has no dated transaction field.",
    source: "Customer Shopping Behavior survey-style records",
    tabs: [
      { id: "profile", label: "Customer profile", files: [] },
      { id: "choices", label: "Shopping choices", files: ["behavior.json"] },
      { id: "quality", label: "Data quality", files: [] },
    ],
  },
  "sales-analysis": {
    title: "Retail Sales Analysis",
    eyebrow: "Sales performance / product and time patterns",
    summary: "Review the project cleaner’s retained positive lines by month, market, product, weekday, and hour.",
    source: "UCI Online Retail II, CSV copy",
    tabs: [
      { id: "performance", label: "Performance", files: ["interactions.json"] },
      { id: "products", label: "Products", files: ["products.json"] },
      { id: "quality", label: "Data quality", files: ["quality.json"] },
    ],
  },
} as const;

export type AnalyticsDashboardSlug = keyof typeof analyticsDashboards;
export type DashboardTab = (typeof analyticsDashboards)[AnalyticsDashboardSlug]["tabs"][number];

export interface JsonAsset {
  [key: string]: unknown;
}

export interface RollupRecord extends JsonAsset {
  year: string;
  country: string;
  line_count: number;
  sales_proxy: number;
  units: number;
  invoices: number;
  customers: number;
  period?: string;
  weekday_index?: number;
  hour?: number;
}

export interface CustomerMetricRecord extends JsonAsset {
  gender: string;
  category: string;
  season: string;
  records: number | null;
  purchase_amount: number | null;
  average_purchase_amount: number | null;
  average_rating: number | null;
  rating_count: number | null;
  subscribers: number | null;
  discount_records: number | null;
}

export interface DashboardOptions {
  [key: string]: string[];
}

export interface RankingDatum {
  label: string;
  value: number;
  note?: string;
}

export function isJsonAsset(value: unknown): value is JsonAsset {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assetRows<T extends JsonAsset>(asset: JsonAsset | null | undefined, key: string): T[] {
  const value = asset?.[key];
  return Array.isArray(value) ? value.filter(isJsonAsset) as T[] : [];
}

export function assetObject(asset: JsonAsset | null | undefined, key: string): JsonAsset | null {
  const value = asset?.[key];
  return isJsonAsset(value) ? value : null;
}

export function readNumber(record: JsonAsset | undefined, key: string): number {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function readNullableNumber(record: JsonAsset | undefined, key: string): number | null {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function readString(record: JsonAsset | undefined, key: string): string {
  const value = record?.[key];
  return typeof value === "string" ? value : "";
}

export function filterOptions(asset: JsonAsset | null): DashboardOptions {
  const source = assetObject(asset, "filters");
  if (!source) return {};
  return Object.fromEntries(
    Object.entries(source)
      .filter((entry): entry is [string, string[]] =>
        Array.isArray(entry[1]) && entry[1].every((value) => typeof value === "string"),
      ),
  );
}
