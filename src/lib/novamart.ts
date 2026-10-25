import { loadDashboardManifest, loadPublishedJson } from "./dashboard-data";

export const novaMart = {
  title: "NovaMart",
  eyebrow: "Marketplace analytics / commerce and fulfillment",
  summary:
    "Explore delivered marketplace value, delivery reliability, categories, sellers and repeat purchases across 99,441 historical Olist orders.",
  source: "Olist Brazilian marketplace · September 2016–October 2018 · BRL",
};
export const novaTabs = [
  "Marketplace overview",
  "Delivery performance",
  "Categories & sellers",
  "Customer behaviour",
  "Late-order investigation",
  "Method & quality",
] as const;

// All money is stored and summed as integer centavos. Membership codes are release-local.
export type NovaOrder = [
  month: number,
  state: number,
  status: number,
  eligible: number,
  late: number,
  gmv: number,
  freight: number,
  days: number | null,
  review: number | null,
  customer: number,
  daysLate: number | null,
  calendarLate: number,
];
export type NovaItem = [
  order: number,
  category: number,
  seller: number,
  price: number,
  freight: number,
];
export interface NovaOverview {
  version: number;
  project: string;
  months: string[];
  states: string[];
  statuses: string[];
  categories: string[];
  seller_states: string[];
  baseline: Record<string, number>;
  prepared_at: string;
  audit: string[];
  pages: string[];
  attribution: {
    title: string;
    author: string;
    source: string;
    license: string;
    license_url: string;
    changes: string;
  };
}
export interface NovaData extends NovaOverview {
  orders: NovaOrder[];
  items: NovaItem[];
}
export interface NovaFilters {
  month: string;
  state: string;
  status: string;
  category: string;
  seller: string;
}
export const allNovaFilters: NovaFilters = {
  month: "All",
  state: "All",
  status: "All",
  category: "All",
  seller: "All",
};
export const sellerLabel = (index: number) =>
  `Seller ${String(index + 1).padStart(4, "0")}`;
export const novaNumber = (n: number | null | undefined, digits = 0) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits }).format(
        n,
      );
export const novaMoney = (cents: number | null | undefined) =>
  cents == null
    ? "—"
    : new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "BRL",
        currencyDisplay: "code",
      }).format(cents / 100);
export const novaPercent = (n: number | null) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-GB", {
        style: "percent",
        maximumFractionDigits: 2,
      }).format(n);
export const divide = (n: number, d: number) => (d ? n / d : null);

export async function loadNovaData(signal: AbortSignal): Promise<NovaData> {
  const base =
    process.env.NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL?.trim().replace(
      /\/+$/,
      "",
    ) ?? "";
  const manifest = await loadDashboardManifest(base);
  const [overview, orders, items] = await Promise.all(
    ["overview.json", "orders.json", "items.json"].map((file) =>
      loadPublishedJson(base, manifest, "novamart", file, signal),
    ),
  );
  if (
    [overview, orders, items].some(
      (a) => a.project !== "novamart" || a.version !== 1,
    ) ||
    !Array.isArray(orders.rows) ||
    !Array.isArray(items.rows)
  )
    throw new Error("NovaMart data schema is incompatible.");
  for (const key of [
    "months",
    "states",
    "statuses",
    "categories",
    "seller_states",
  ] as const) {
    if (
      !Array.isArray(overview[key]) ||
      !(overview[key] as unknown[]).every((v) => typeof v === "string")
    )
      throw new Error("NovaMart dimensions are invalid.");
  }
  const meta = overview as unknown as NovaOverview;
  const index = (v: unknown, length: number) =>
    typeof v === "number" && Number.isInteger(v) && v >= 0 && v < length;
  if (
    !orders.rows.every(
      (r: unknown) =>
        Array.isArray(r) &&
        r.length === 12 &&
        r.every(
          (v) => v === null || (typeof v === "number" && Number.isFinite(v)),
        ) &&
        index(r[0], meta.months.length) &&
        index(r[1], meta.states.length) &&
        index(r[2], meta.statuses.length),
    ) ||
    !items.rows.every(
      (r: unknown) =>
        Array.isArray(r) &&
        r.length === 5 &&
        r.every(
          (v) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0,
        ) &&
        index(r[0], (orders.rows as unknown[]).length) &&
        index(r[1], meta.categories.length) &&
        index(r[2], meta.seller_states.length),
    )
  )
    throw new Error("NovaMart analytical rows are invalid.");
  return {
    ...meta,
    orders: orders.rows as NovaOrder[],
    items: items.rows as NovaItem[],
  };
}

export interface NovaSummary {
  orders: number;
  delivered: number;
  canceled: number;
  eligible: number;
  late: number;
  calendarLate: number;
  gmv: number;
  freight: number;
  daysSum: number;
  daysCount: number;
  reviewsSum: number;
  reviewsCount: number;
  lateReviews: number;
  lateReviewCount: number;
  onTimeReviews: number;
  onTimeReviewCount: number;
  missingActual: number;
  customers: number;
  repeat: number;
  repeatGmv: number;
  singleGmv: number;
  lateDaysSum: number;
}
const empty = (): NovaSummary => ({
  orders: 0,
  delivered: 0,
  canceled: 0,
  eligible: 0,
  late: 0,
  calendarLate: 0,
  gmv: 0,
  freight: 0,
  daysSum: 0,
  daysCount: 0,
  reviewsSum: 0,
  reviewsCount: 0,
  lateReviews: 0,
  lateReviewCount: 0,
  onTimeReviews: 0,
  onTimeReviewCount: 0,
  missingActual: 0,
  customers: 0,
  repeat: 0,
  repeatGmv: 0,
  singleGmv: 0,
  lateDaysSum: 0,
});
export interface NovaGroup {
  label: string;
  summary: NovaSummary;
}

export function deriveNova(data: NovaData, filters: NovaFilters) {
  const itemFilter = filters.category !== "All" || filters.seller !== "All";
  const category = data.categories.indexOf(filters.category);
  const seller = filters.seller === "All" ? -1 : Number(filters.seller);
  const selectedItems = data.items.filter(
    (r) =>
      (filters.category === "All" || r[1] === category) &&
      (seller === -1 || r[2] === seller),
  );
  const members = new Set(selectedItems.map((r) => r[0]));
  const selected = data.orders
    .map((r, i) => ({ r, i }))
    .filter(
      ({ r, i }) =>
        (!itemFilter || members.has(i)) &&
        (filters.month === "All" || data.months[r[0]] === filters.month) &&
        (filters.state === "All" || data.states[r[1]] === filters.state) &&
        (filters.status === "All" || data.statuses[r[2]] === filters.status),
    );
  const indices = new Set(selected.map((o) => o.i));
  const amounts = new Map<number, [number, number]>();
  const categoryGroups = new Map<number, { ids: Set<number>; cents: number }>();
  const sellerGroups = new Map<number, { ids: Set<number>; cents: number }>();
  for (const r of selectedItems) {
    if (!indices.has(r[0])) continue;
    const a = amounts.get(r[0]) ?? [0, 0];
    a[0] += r[3];
    a[1] += r[4];
    amounts.set(r[0], a);
    for (const [key, groups] of [
      [r[1], categoryGroups],
      [r[2], sellerGroups],
    ] as const) {
      const g = groups.get(key) ?? { ids: new Set<number>(), cents: 0 };
      g.ids.add(r[0]);
      if (data.statuses[data.orders[r[0]][2]] === "delivered") g.cents += r[3];
      groups.set(key, g);
    }
  }
  function summarize(rows: typeof selected): NovaSummary {
    const s = empty();
    const customers = new Map<number, { count: number; cents: number }>();
    for (const { r, i } of rows) {
      s.orders++;
      if (data.statuses[r[2]] === "canceled") s.canceled++;
      if (data.statuses[r[2]] !== "delivered") continue;
      const a = itemFilter ? (amounts.get(i) ?? [0, 0]) : [r[5], r[6]];
      s.delivered++;
      s.gmv += a[0];
      s.freight += a[1];
      if (r[9] >= 0) {
        const c = customers.get(r[9]) ?? { count: 0, cents: 0 };
        c.count++;
        c.cents += a[0];
        customers.set(r[9], c);
      }
      if (r[8] !== null) {
        s.reviewsSum += r[8];
        s.reviewsCount++;
      }
      if (!r[3]) {
        s.missingActual++;
        continue;
      }
      s.eligible++;
      s.late += r[4];
      s.calendarLate += r[11];
      if (r[7] !== null) {
        s.daysSum += r[7];
        s.daysCount++;
      }
      if (r[4]) {
        s.lateDaysSum += r[10] ?? 0;
        if (r[8] !== null) {
          s.lateReviews += r[8];
          s.lateReviewCount++;
        }
      } else if (r[8] !== null) {
        s.onTimeReviews += r[8];
        s.onTimeReviewCount++;
      }
    }
    s.customers = customers.size;
    for (const c of customers.values()) {
      if (c.count >= 2) {
        s.repeat++;
        s.repeatGmv += c.cents;
      } else s.singleGmv += c.cents;
    }
    return s;
  }
  function group(key: (r: NovaOrder) => string): NovaGroup[] {
    const groups = new Map<string, typeof selected>();
    for (const row of selected) {
      const label = key(row.r);
      const g = groups.get(label) ?? [];
      g.push(row);
      groups.set(label, g);
    }
    return [...groups].map(([label, rows]) => ({
      label,
      summary: summarize(rows),
    }));
  }
  function itemGroups(
    groups: typeof categoryGroups,
    label: (key: number) => string,
  ) {
    return [...groups].map(([key, g]) => {
      const summary = summarize(
        [...g.ids].map((i) => ({ i, r: data.orders[i] })),
      );
      summary.gmv = g.cents; // Segment value includes only items in that category/seller.
      return { label: label(key), key, summary };
    });
  }
  return {
    summary: summarize(selected),
    monthly: group((r) => data.months[r[0]]).sort((a, b) =>
      a.label.localeCompare(b.label),
    ),
    states: group((r) => data.states[r[1]]),
    statuses: group((r) => data.statuses[r[2]]),
    categories: itemGroups(categoryGroups, (k) => data.categories[k]),
    sellers: itemGroups(sellerGroups, sellerLabel),
    exceptions: selected
      .filter((o) => o.r[4])
      .sort((a, b) => (b.r[10] ?? 0) - (a.r[10] ?? 0)),
    deliveryBands: [0, 7, 14, 30].map((min, j) => ({
      label: ["0–7 days", "7–14 days", "14–30 days", "30+ days"][j],
      value: selected.filter(
        ({ r }) =>
          r[3] &&
          r[7] !== null &&
          r[7] >= min &&
          r[7] < [7, 14, 30, Infinity][j],
      ).length,
    })),
    customerBands: (() => {
      const counts = new Map<number, number>();
      selected.forEach(({ r }) => {
        if (data.statuses[r[2]] === "delivered" && r[9] >= 0)
          counts.set(r[9], (counts.get(r[9]) ?? 0) + 1);
      });
      return [1, 2, 3, 4].map((n) => ({
        label:
          n === 4
            ? "4+ delivered orders"
            : `${n} delivered order${n === 1 ? "" : "s"}`,
        value: [...counts.values()].filter((c) => (n === 4 ? c >= 4 : c === n))
          .length,
      }));
    })(),
  };
}
