"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Moon, RotateCcw, Sun } from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard/DashboardThemeShell";
import { DashboardPanel as Panel, DashboardStat as KpiCard } from "@/components/ui/dashboard-4";
import {
  analyticsDashboards,
  DASHBOARD_DATA_VERSION,
  assetObject,
  assetRows,
  filterOptions,
  isJsonAsset,
  readNumber,
  readNullableNumber,
  readString,
} from "@/lib/analytics-dashboards";
import type {
  AnalyticsDashboardSlug,
  CustomerMetricRecord,
  DashboardOptions,
  JsonAsset,
  RankingDatum,
  RollupRecord,
} from "@/lib/analytics-dashboards";

const TrendChart = dynamic(
  () => import("@/components/dashboard/AnalyticsCharts").then((module) => module.TrendChart),
  { ssr: false, loading: () => <div className="analytics-chart-loading" aria-hidden="true" /> },
);
const RankingChart = dynamic(
  () => import("@/components/dashboard/AnalyticsCharts").then((module) => module.RankingChart),
  { ssr: false, loading: () => <div className="analytics-chart-loading" aria-hidden="true" /> },
);
const CategoryChart = dynamic(
  () => import("@/components/dashboard/AnalyticsCharts").then((module) => module.CategoryChart),
  { ssr: false, loading: () => <div className="analytics-chart-loading" aria-hidden="true" /> },
);
const HistogramChart = dynamic(
  () => import("@/components/dashboard/AnalyticsCharts").then((module) => module.HistogramChart),
  { ssr: false, loading: () => <div className="analytics-chart-loading" aria-hidden="true" /> },
);

type LoadStates = Record<string, boolean>;
type ErrorStates = Record<string, string>;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits }).format(value);
}

function formatMoney(value: number, currency: string | undefined, decimals = 0) {
  if (!currency || currency === "SOURCE") {
    return `${formatNumber(value, decimals)} source units`;
  }
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${formatNumber(value, decimals)} ${currency}`;
  }
}

function formatPercent(value: number, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

function formatMonth(value: string) {
  const [year, month] = value.split("-");
  const monthName = new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleString("en", { month: "short", timeZone: "UTC" });
  return `${monthName} '${year.slice(-2)}`;
}

function projectLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function filteredRollups(rows: RollupRecord[], filters: Record<string, string>) {
  const year = filters.year ?? "All";
  const country = filters.country ?? "All";
  return rows.filter((row) => row.year === year && row.country === country);
}

const invoiceMeasures = [
  { id: "sales_proxy", label: "Sales proxy" },
  { id: "invoices", label: "Invoices" },
  { id: "customers", label: "Known customers" },
  { id: "units", label: "Units" },
  { id: "average_invoice", label: "Avg. invoice" },
] as const;

type InvoiceMeasure = (typeof invoiceMeasures)[number]["id"];

const invoiceValueBands = ["£0–£25", "£25–£50", "£50–£100", "£100–£250", "£250–£500", "£500–£1k", "£1k–£2.5k", "£2.5k+"];

function measureValue(row: JsonAsset, measure: InvoiceMeasure) {
  if (measure === "average_invoice") {
    const invoices = readNumber(row, "invoices");
    return invoices ? readNumber(row, "sales_proxy") / invoices : 0;
  }
  return readNumber(row, measure);
}

function selectMetric(overview: JsonAsset, filters: Record<string, string>, project: AnalyticsDashboardSlug) {
  const rows = assetRows<JsonAsset>(overview, "metrics");
  if (project === "customer-behaviour") {
    return rows.find((row) =>
      ["gender", "category", "season"].every((dimension) =>
        readString(row, dimension) === (filters[dimension] ?? "All"),
      ),
    ) ?? null;
  }
  return rows.find((row) =>
    readString(row, "year") === (filters.year ?? "All")
    && readString(row, "country") === (filters.country ?? "All"),
  ) ?? null;
}

function matchesDemographicFilters(row: JsonAsset, filters: Record<string, string>) {
  return ["gender", "category", "season"].every((dimension) => {
    const selected = filters[dimension] ?? "All";
    return selected === "All" || readString(row, dimension) === selected;
  });
}

function customerCategoryData(overview: JsonAsset, filters: Record<string, string>): RankingDatum[] {
  const rows = assetRows<CustomerMetricRecord>(overview, "metrics");
  const gender = filters.gender ?? "All";
  const season = filters.season ?? "All";
  const category = filters.category ?? "All";
  return rows
    .filter((row) =>
      row.gender === gender
      && row.season === season
      && row.category !== "All"
      && (category === "All" || row.category === category)
      && row.purchase_amount !== null,
    )
    .map((row) => ({ label: row.category, value: asNumber(row.purchase_amount) }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 8);
}

function getCurrency(overview: JsonAsset) {
  const metadata = assetObject(overview, "metadata");
  return asText(metadata?.currency) || undefined;
}

function filterControls(options: DashboardOptions, selected: Record<string, string>, setSelected: (value: Record<string, string>) => void) {
  const order = ["year", "country", "gender", "category", "season"];
  const labels: Record<string, string> = {
    year: "Sales year",
    country: "Country",
    gender: "Gender",
    category: "Category",
    season: "Season",
  };
  return Object.entries(options)
    .sort(([left], [right]) => order.indexOf(left) - order.indexOf(right))
    .map(([key, values]) => (
      <label className="analytics-filter" htmlFor={`analytics-filter-${key}`} key={key}>
        <span>{labels[key] ?? projectLabel(key)}</span>
        <select
          id={`analytics-filter-${key}`}
          value={selected[key] ?? "All"}
          onChange={(event) => setSelected({ ...selected, [key]: event.target.value })}
        >
          {values.map((value) => <option key={`${key}-${value}`} value={value}>{value}</option>)}
        </select>
      </label>
    ));
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="analytics-empty">{children}</div>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) return <EmptyState>No rows are available for this selection.</EmptyState>;
  return (
    <div className="analytics-table-wrap" role="region" aria-label={`${headers[0]} detail table`} tabIndex={0}>
      <table className="analytics-table">
        <thead><tr>{headers.map((header) => <th scope="col" key={header}>{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="analytics-dashboard-skeleton" aria-label="Loading dashboard data" role="status">
      <div className="analytics-skeleton-filters" />
      <div className="analytics-skeleton-kpis"><i /><i /><i /><i /></div>
      <div className="analytics-skeleton-panels"><i /><i /></div>
      <span className="analytics-sr-only">Preparing the dashboard from summarized data.</span>
    </div>
  );
}

function FilterEmpty({ onReset }: { onReset: () => void }) {
  return (
    <div className="analytics-error" role="status">
      <p>No aggregate rows match these filter selections.</p>
      <button type="button" onClick={onReset}>Reset filters</button>
    </div>
  );
}

function DataError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="analytics-error" role="alert">
      <p>{message}</p>
      <button type="button" onClick={onRetry}>Retry data request</button>
    </div>
  );
}

export default function AnalyticsDashboard({ project }: { project: AnalyticsDashboardSlug }) {
  const { theme, toggleTheme } = useDashboardTheme();
  const config = analyticsDashboards[project];
  const remoteBase = process.env.NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL?.trim().replace(/\/+$/, "");
  const [assets, setAssets] = useState<Record<string, JsonAsset>>({});
  const [pending, setPending] = useState<LoadStates>({});
  const [errors, setErrors] = useState<ErrorStates>({});
  const [activeTabId, setActiveTabId] = useState<string>(config.tabs[0].id);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [crossFilters, setCrossFilters] = useState({ period: "All", value_band: "All" });
  const [selectedMeasure, setSelectedMeasure] = useState<InvoiceMeasure>("sales_proxy");
  const [selectedProduct, setSelectedProduct] = useState("");
  const inflight = useRef(new Set<string>());
  const loaded = useRef(new Set<string>());

  const assetUrl = useCallback((file: string) => {
    if (remoteBase) return `${remoteBase}/analytics/${DASHBOARD_DATA_VERSION}/${project}/${file}`;
    return `/dashboard-data/${DASHBOARD_DATA_VERSION}/${project}/${file}`;
  }, [project, remoteBase]);

  const loadAsset = useCallback(async (file: string, retry = false) => {
    if (loaded.current.has(file) && !retry) return;
    if (inflight.current.has(file)) return;
    const url = assetUrl(file);
    inflight.current.add(file);
    setPending((current) => ({ ...current, [file]: true }));
    setErrors((current) => ({ ...current, [file]: "" }));
    try {
      const response = await fetch(url, {
        cache: process.env.NODE_ENV === "development" ? "no-store" : "force-cache",
        mode: "cors",
      });
      if (!response.ok) throw new Error(`The ${file} asset returned HTTP ${response.status}.`);
      const value: unknown = await response.json();
      if (!isJsonAsset(value)) throw new Error(`The ${file} asset is not a JSON object.`);
      setAssets((current) => ({ ...current, [file]: value }));
      loaded.current.add(file);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "The dashboard data request failed.";
      setErrors((current) => ({ ...current, [file]: reason }));
    } finally {
      inflight.current.delete(file);
      setPending((current) => ({ ...current, [file]: false }));
    }
  }, [assetUrl]);

  useEffect(() => {
    const requestTimer = window.setTimeout(() => { void loadAsset("overview.json"); }, 0);
    return () => window.clearTimeout(requestTimer);
  }, [loadAsset]);

  const overview = assets["overview.json"] ?? null;
  const options = useMemo(() => filterOptions(overview), [overview]);
  const selectedFilters = useMemo(() => Object.fromEntries(
    Object.entries(options).map(([key, values]) => [
      key,
      values.includes(selected[key]) ? selected[key] : values[0] ?? "All",
    ]),
  ), [options, selected]);

  const activeTab = config.tabs.find((tab) => tab.id === activeTabId) ?? config.tabs[0];
  useEffect(() => {
    if (activeTab.files.length === 0) return;
    const requestTimer = window.setTimeout(() => {
      for (const file of activeTab.files) void loadAsset(file);
    }, 0);
    return () => window.clearTimeout(requestTimer);
  }, [activeTab.files, loadAsset]);

  const activeTabFilesPending = activeTab.files.some((file) => pending[file]);
  const activeTabFileError = activeTab.files.find((file) => errors[file]);
  const interactions = assets["interactions.json"]
    ? assetRows<RollupRecord>(assets["interactions.json"], "rollups")
    : [];
  const baseMetric = overview ? selectMetric(overview, selectedFilters, project) : null;
  const currency = overview ? getCurrency(overview) : undefined;
  const year = selectedFilters.year ?? "All";
  const country = selectedFilters.country ?? "All";
  const commerceDashboard = project !== "customer-behaviour";
  const metric = commerceDashboard && interactions.length > 0
    ? interactions.find((row) => row.year === year && row.country === country
      && readString(row, "period") === crossFilters.period
      && readString(row, "value_band") === crossFilters.value_band) ?? null
    : baseMetric;
  const chartRows = interactions.length > 0
    ? interactions.filter((row) => row.year === year && row.country === country
      && row.period !== "All" && readString(row, "value_band") === crossFilters.value_band)
      .sort((left, right) => readString(left, "period").localeCompare(readString(right, "period")))
    : overview ? filteredRollups(assetRows<RollupRecord>(overview, "timeline"), selectedFilters) : [];
  const chartTimeline = chartRows.map((row) => ({
    label: readString(row, "period"),
    value: interactions.length > 0 ? measureValue(row, selectedMeasure) : readNumber(row, "sales_proxy"),
  }));
  const countryRows = interactions.length > 0
    ? interactions.filter((row) => row.year === year && row.country !== "All"
      && (country === "All" || row.country === country)
      && row.period === crossFilters.period
      && readString(row, "value_band") === crossFilters.value_band)
      .sort((left, right) => measureValue(right, selectedMeasure) - measureValue(left, selectedMeasure))
      .slice(0, 8)
    : overview
      ? assetRows<RollupRecord>(overview, "countries")
        .filter((row) => row.year === year && row.country !== "All" && (country === "All" || row.country === country))
        .sort((left, right) => right.sales_proxy - left.sales_proxy)
        .slice(0, 8)
      : [];
  const countryRank = countryRows.map((row) => ({ label: row.country, value: interactions.length > 0 ? measureValue(row, selectedMeasure) : readNumber(row, "sales_proxy") }));
  const histogramRows = interactions.filter((row) => row.year === year && row.country === country
    && row.period === crossFilters.period && row.value_band !== "All")
    .sort((left, right) => invoiceValueBands.indexOf(readString(left, "value_band")) - invoiceValueBands.indexOf(readString(right, "value_band")));
  const histogramData = histogramRows.map((row) => ({ label: readString(row, "value_band"), value: readNumber(row, "invoices") }));
  const currentProducts = assets["products.json"]
    ? assetRows<RollupRecord>(assets["products.json"], "products")
      .filter((row) => row.year === year && row.country === country)
      .sort((left, right) => right.sales_proxy - left.sales_proxy)
      .slice(0, 12)
    : [];
  const productDetail = currentProducts.find((row) => readString(row, "product_name") === selectedProduct) ?? null;
  const visibleProducts = selectedProduct && productDetail
    ? [productDetail]
    : currentProducts;

  const resetFilters = () => {
    setSelected(Object.fromEntries(Object.keys(options).map((key) => [key, "All"])));
    setCrossFilters({ period: "All", value_band: "All" });
    setSelectedProduct("");
  };
  const clearCrossFilters = () => setCrossFilters({ period: "All", value_band: "All" });
  const clearChartSelections = () => {
    clearCrossFilters();
    setSelected((current) => ({ ...current, country: "All" }));
  };
  const changeTab = (tabId: string) => {
    setActiveTabId(tabId);
    setSelectedProduct("");
    if (tabId !== "trading" && tabId !== "performance") clearCrossFilters();
  };
  const hasFilters = Object.keys(options).length > 0 || crossFilters.period !== "All" || crossFilters.value_band !== "All";
  const hasChartSelections = commerceDashboard && (country !== "All" || crossFilters.period !== "All" || crossFilters.value_band !== "All");
  const metricMissing = !metric;
  const formatDatasetAmount = useCallback((value: number, decimals = 0) => formatMoney(value, currency, decimals), [currency]);

  const insights = useMemo(() => {
    if (!overview || !metric) return [] as string[];
    if (project === "customer-behaviour") {
      const rows = customerCategoryData(overview, selectedFilters);
      const totalAmount = readNumber(metric, "purchase_amount");
      const bestCategory = rows[0];
      const recordCount = readNumber(metric, "records");
      const subscriptions = readNumber(metric, "subscribers");
      const discounts = readNumber(metric, "discount_records");
      const ratingCount = readNumber(metric, "rating_count");
      const ratingAverage = readNullableNumber(metric, "average_rating");
      const list = [];
      if (bestCategory && totalAmount > 0) list.push(`${bestCategory.label} has the highest observed purchase amount in this customer slice (${formatMoney(bestCategory.value, "USD")}; ${formatPercent(bestCategory.value / totalAmount)} of the slice).`);
      if (recordCount > 0) list.push(`${formatPercent(subscriptions / recordCount)} of records in this slice show an active subscription.`);
      if (recordCount > 0) list.push(`${formatPercent(discounts / recordCount)} of records show a discount; the source also repeats this field under an identical promo-code column.`);
      if (ratingAverage !== null) list.push(`Observed review average is ${ratingAverage.toFixed(2)} from ${formatNumber(ratingCount)} non-missing ratings.`);
      return list.slice(0, 4);
    }
    const total = readNumber(metric, "sales_proxy");
    const selectedTotal = measureValue(metric, selectedMeasure);
    const measureLabel = invoiceMeasures.find((item) => item.id === selectedMeasure)?.label.toLowerCase() ?? "sales proxy";
    const formatSelected = (value: number) => selectedMeasure === "sales_proxy" || selectedMeasure === "average_invoice"
      ? formatDatasetAmount(value, selectedMeasure === "average_invoice" ? 2 : 0)
      : formatNumber(value);
    const peak = [...chartTimeline].sort((left, right) => right.value - left.value)[0];
    const leadingCountry = countryRank[0];
    const invoices = readNumber(metric, "invoices");
    const list = [];
    if (peak && peak.value > 0 && selectedTotal > 0) list.push(
      selectedMeasure === "average_invoice"
        ? `${formatMonth(peak.label)} has the highest observed ${measureLabel} (${formatSelected(peak.value)}) in this selection.`
        : `${formatMonth(peak.label)} is the largest observed month for ${measureLabel} (${formatSelected(peak.value)}; ${formatPercent(peak.value / selectedTotal)} of the selected total).`,
    );
    if (leadingCountry && selectedTotal > 0) list.push(
      selectedMeasure === "average_invoice"
        ? `${leadingCountry.label} leads the displayed market ranking for ${measureLabel} (${formatSelected(leadingCountry.value)}).`
        : `${leadingCountry.label} leads the displayed market ranking at ${formatPercent(leadingCountry.value / selectedTotal)} of selected ${measureLabel}.`,
    );
    if (invoices > 0) list.push(`Average invoice value is ${formatDatasetAmount(total / invoices, 2)} across ${formatNumber(invoices)} distinct retained invoices.`);
    if (project === "retail-iq") {
      const anonymousRows = readNumber(assetObject(overview, "quality") ?? undefined, "anonymous_retained_rows");
      const retainedRows = readNumber(assetObject(overview, "quality") ?? undefined, "retained_positive_sales_rows");
      if (retainedRows > 0) list.push(`${formatPercent(anonymousRows / retainedRows)} of retained positive sales lines have no customer ID; those lines remain in trading totals.`);
    }
    return list.slice(0, 4);
  }, [overview, metric, project, selectedFilters, selectedMeasure, chartTimeline, countryRank, formatDatasetAmount]);

  if (!overview) {
    return (
      <section className={`analytics-dashboard analytics-dashboard-${project}`} aria-label={`${config.title} dashboard`}>
        {errors["overview.json"]
          ? <DataError message={errors["overview.json"]} onRetry={() => { loaded.current.delete("overview.json"); void loadAsset("overview.json", true); }} />
          : <LoadingDashboard />}
      </section>
    );
  }

  const filters = filterControls(options, selectedFilters, setSelected);
  const currencyNote = currency === "GBP"
    ? "GBP · positive-line sales proxy, not profit"
    : currency === "USD"
      ? "USD · recorded purchase amounts, not company revenue"
      : project === "retail-iq"
        ? "Multiple sources · their customer populations are not linked"
        : "Source amounts shown in reported units";

  return (
    <section className={`analytics-dashboard analytics-dashboard-${project}`} aria-label={`${config.title} dashboard`}>
      <div className="analytics-dashboard-topline">
        <Link href="/projects" className="analytics-back-link"><ArrowLeft size={14} aria-hidden="true" /> Project studies</Link>
        <span className="analytics-source-tag"><i aria-hidden="true" /> {config.source}</span>
      </div>

      <div className="analytics-toolbar" aria-label="Dashboard filters">
        <div className="analytics-filter-list">
          {filters.length > 0 ? filters : <span className="analytics-no-filters">No dated transaction filter · descriptive customer records</span>}
        </div>
        <div className="analytics-toolbar-actions">
          <button
            type="button"
            className="analytics-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme === "dark"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
          </button>
          {hasFilters && <button type="button" className="analytics-reset" onClick={resetFilters}><RotateCcw size={13} aria-hidden="true" /> Reset</button>}
        </div>
      </div>

      {hasChartSelections && (
        <div className="analytics-selection-bar" aria-live="polite">
          <span>Cross-filtered view</span>
          {country !== "All" && <button type="button" onClick={() => setSelected((current) => ({ ...current, country: "All" }))}>Country · {country} <b aria-hidden="true">×</b></button>}
          {crossFilters.period !== "All" && <button type="button" onClick={() => setCrossFilters((current) => ({ ...current, period: "All" }))}>Month · {formatMonth(crossFilters.period)} <b aria-hidden="true">×</b></button>}
          {crossFilters.value_band !== "All" && <button type="button" onClick={() => setCrossFilters((current) => ({ ...current, value_band: "All" }))}>Invoice value · {crossFilters.value_band} <b aria-hidden="true">×</b></button>}
          <button type="button" className="analytics-selection-clear" onClick={clearChartSelections}>Clear chart selections</button>
        </div>
      )}

      <nav className="analytics-tabs" role="tablist" aria-label={`${config.title} dashboard sections`}>
        {config.tabs.map((tab) => (
          <button
            key={tab.id}
            id={`analytics-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab.id === tab.id}
            aria-controls="analytics-tabpanel"
            tabIndex={activeTab.id === tab.id ? 0 : -1}
            onClick={() => changeTab(tab.id)}
            onKeyDown={(event) => {
              const currentIndex = config.tabs.findIndex((item) => item.id === tab.id);
              let nextIndex = currentIndex;
              if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % config.tabs.length;
              else if (event.key === "ArrowLeft") nextIndex = (currentIndex + config.tabs.length - 1) % config.tabs.length;
              else if (event.key === "Home") nextIndex = 0;
              else if (event.key === "End") nextIndex = config.tabs.length - 1;
              if (nextIndex !== currentIndex) {
                event.preventDefault();
                const nextId = config.tabs[nextIndex].id;
                changeTab(nextId);
                window.requestAnimationFrame(() => document.getElementById(`analytics-tab-${nextId}`)?.focus());
              }
            }}
          >
            {tab.label}
            {tab.files.length > 0 && <span aria-hidden="true">+</span>}
          </button>
        ))}
      </nav>

      <div id="analytics-tabpanel" className="analytics-tabpanel" role="tabpanel" aria-labelledby={`analytics-tab-${activeTab.id}`} aria-busy={activeTabFilesPending}>
        {activeTabFileError
          ? <DataError message={errors[activeTabFileError]} onRetry={() => { loaded.current.delete(activeTabFileError); void loadAsset(activeTabFileError, true); }} />
          : activeTabFilesPending
            ? <div className="analytics-lazy-state" role="status"><div className="analytics-chart-loading" /><span>Opening this analysis from its summarized dataset…</span></div>
            : null}

        {activeTab.id === "trading" || activeTab.id === "performance" || activeTab.id === "profile" ? (
          <>
            <div className="analytics-kpi-grid" aria-label="Key performance indicators">
              {project === "customer-behaviour" ? (
                <>
                  <KpiCard label="Recorded purchase amount" value={formatMoney(readNumber(metric ?? undefined, "purchase_amount"), "USD")} note="Sum of source purchase amount field" />
                  <KpiCard label="Customer records" value={formatNumber(readNumber(metric ?? undefined, "records"))} note="One source row per customer ID" />
                  <KpiCard label="Average purchase" value={formatMoney(readNumber(metric ?? undefined, "average_purchase_amount"), "USD", 2)} note="Mean of recorded purchase amounts" />
                  <KpiCard label="Observed rating" value={readNullableNumber(metric ?? undefined, "average_rating")?.toFixed(2) ?? "—"} note={`${formatNumber(readNumber(metric ?? undefined, "rating_count"))} non-missing ratings · raw values only`} />
                </>
              ) : (
                <>
                  <KpiCard label="Sales proxy" value={formatDatasetAmount(readNumber(metric ?? undefined, "sales_proxy"))} note={currencyNote} active={selectedMeasure === "sales_proxy"} onClick={() => setSelectedMeasure("sales_proxy")} />
                  <KpiCard label="Distinct invoices" value={formatNumber(readNumber(metric ?? undefined, "invoices"))} note="Retained invoice identifiers" active={selectedMeasure === "invoices"} onClick={() => setSelectedMeasure("invoices")} />
                  <KpiCard label="Known customers" value={formatNumber(readNumber(metric ?? undefined, "customers"))} note={project === "retail-iq" ? "Anonymous sales lines excluded from this count" : "Rows without a customer ID are excluded"} active={selectedMeasure === "customers"} onClick={() => setSelectedMeasure("customers")} />
                  <KpiCard label="Retained units" value={formatNumber(readNumber(metric ?? undefined, "units"))} note="Sum of retained positive quantities" active={selectedMeasure === "units"} onClick={() => setSelectedMeasure("units")} />
                  <KpiCard label="Average invoice value" value={formatDatasetAmount(readNumber(metric ?? undefined, "invoices") ? readNumber(metric ?? undefined, "sales_proxy") / readNumber(metric ?? undefined, "invoices") : 0, 2)} note="Sales proxy divided by distinct invoices" active={selectedMeasure === "average_invoice"} onClick={() => setSelectedMeasure("average_invoice")} />
                </>
              )}
            </div>

            {metricMissing ? <FilterEmpty onReset={resetFilters} /> : (
              <>
                <div className="analytics-content-grid analytics-content-grid-main">
                  {project === "customer-behaviour" ? (
                    <Panel title="Purchase amount by category" eyebrow="Select a category to filter this customer slice">
                      <CategoryChart data={customerCategoryData(overview, selectedFilters).map((item) => ({ label: item.label, value: item.value }))} dataKey="purchase amount" formatValue={(value) => formatMoney(value, "USD")} selectedLabel={selectedFilters.category === "All" ? undefined : selectedFilters.category} onSelect={(label) => setSelected({ ...selectedFilters, category: selectedFilters.category === label ? "All" : label })} />
                    </Panel>
                  ) : (
                    <Panel title={`${invoiceMeasures.find((item) => item.id === selectedMeasure)?.label ?? "Sales proxy"} by month`} eyebrow="Select a point to cross-filter">
                      <TrendChart
                        data={chartTimeline}
                        valueLabel={invoiceMeasures.find((item) => item.id === selectedMeasure)?.label ?? "Sales proxy"}
                        formatValue={(value) => selectedMeasure === "average_invoice" || selectedMeasure === "sales_proxy" ? formatDatasetAmount(value, 2) : formatNumber(value)}
                        selectedLabel={crossFilters.period === "All" ? undefined : crossFilters.period}
                        onSelect={(label) => setCrossFilters((current) => ({ ...current, period: current.period === label ? "All" : label }))}
                      />
                    </Panel>
                  )}
                  <Panel title={project === "customer-behaviour" ? "Shopping snapshot" : "Market contribution"} eyebrow={project === "customer-behaviour" ? "Current customer slice" : "Country ranking"}>
                    {project === "customer-behaviour" ? (
                      <div className="analytics-snapshot-list">
                        <div><span>Subscription records</span><strong>{formatNumber(readNumber(metric ?? undefined, "subscribers"))}</strong><small>{formatPercent(readNumber(metric ?? undefined, "records") ? readNumber(metric ?? undefined, "subscribers") / readNumber(metric ?? undefined, "records") : 0)} of this slice</small></div>
                        <div><span>Discount records</span><strong>{formatNumber(readNumber(metric ?? undefined, "discount_records"))}</strong><small>{formatPercent(readNumber(metric ?? undefined, "records") ? readNumber(metric ?? undefined, "discount_records") / readNumber(metric ?? undefined, "records") : 0)} of this slice</small></div>
                        <div><span>Average previous purchases</span><strong>{formatNumber(readNumber(metric ?? undefined, "average_previous_purchases"), 1)}</strong><small>Recorded field mean</small></div>
                        <div><span>Mean observed rating</span><strong>{readNullableNumber(metric ?? undefined, "average_rating")?.toFixed(2) ?? "—"}</strong><small>{formatNumber(readNumber(metric ?? undefined, "rating_count"))} rating values</small></div>
                      </div>
                    ) : (
                      <>
                        <RankingChart
                          data={countryRank}
                          formatValue={(value) => selectedMeasure === "average_invoice" || selectedMeasure === "sales_proxy" ? formatDatasetAmount(value, 2) : formatNumber(value)}
                          height={280}
                          selectedLabel={country === "All" ? undefined : country}
                          choiceTitle="country"
                          onSelect={(label) => setSelected({ ...selectedFilters, country: country === label ? "All" : label })}
                        />
                        {countryRank.length === 0 && <EmptyState>No market rows match this selection.</EmptyState>}
                      </>
                    )}
                  </Panel>
                </div>

                {commerceDashboard && interactions.length > 0 && (
                  <div className="analytics-content-grid analytics-content-grid-secondary analytics-distribution-row">
                    <Panel title="Invoice value distribution" eyebrow="Distinct retained invoices by basket value">
                      <HistogramChart
                        data={histogramData}
                        formatValue={formatNumber}
                        selectedLabel={crossFilters.value_band === "All" ? undefined : crossFilters.value_band}
                        onSelect={(label) => setCrossFilters((current) => ({ ...current, value_band: current.value_band === label ? "All" : label }))}
                      />
                    </Panel>
                    <Panel title="Quick actions" eyebrow="Explore the current report page">
                      <ol className="analytics-exploration-list">
                        <li><span>01</span><p>Choose a KPI to change the measure shown in the charts.</p></li>
                        <li><span>02</span><p>Select a month or invoice value bar to update the KPIs and linked visuals.</p></li>
                        <li><span>03</span><p>Select a country to narrow the market ranking and current totals.</p></li>
                      </ol>
                      <div className="analytics-quick-actions">
                        <button type="button" className="analytics-quick-action" onClick={() => changeTab("products")}>Explore products <ArrowUpRight size={15} aria-hidden="true" /></button>
                        <button type="button" className="analytics-quick-action" onClick={resetFilters}><RotateCcw size={15} aria-hidden="true" /> Reset report filters</button>
                      </div>
                      <p className="analytics-small-note">Selections combine with the year and country controls above.</p>
                    </Panel>
                  </div>
                )}

                <div className="analytics-content-grid analytics-content-grid-secondary">
                  <Panel title={project === "customer-behaviour" ? "What the records say" : "Data-backed readout"} eyebrow="Current filters">
                    {insights.length > 0
                      ? <ul className="analytics-insight-list">{insights.map((insight) => <li key={insight}>{insight}</li>)}</ul>
                      : <EmptyState>Insights appear when the current selection contains observations.</EmptyState>}
                  </Panel>
                  <Panel title="Measurement notes" eyebrow="Scope and interpretation">
                    <p className="analytics-panel-copy">
                      {project === "customer-behaviour"
                        ? "The file contains no date field, so Season is treated as a recorded category. Purchase amounts and relationships are descriptive; they do not establish cause."
                        : project === "retail-iq"
                          ? "The online-retail, mall-customer, and Instacart sources describe separate populations. They have not been joined to one another."
                          : "Returns, cancellations, and non-positive lines are excluded by the project’s cleaning policy. Sales proxy is not profit or net accounting revenue."}
                    </p>
                    <a className="analytics-text-link" href="/projects#analytics">Project context <ArrowUpRight size={13} aria-hidden="true" /></a>
                  </Panel>
                </div>
              </>
            )}
          </>
        ) : null}

        {activeTab.id === "products" && project !== "customer-behaviour" ? (
          <>
            {productDetail ? (
              <div className="analytics-product-selection-heading">
                <div><span>Selected product</span><strong>{readString(productDetail, "product_name")}</strong></div>
                <button type="button" onClick={() => setSelectedProduct("")}>Clear product selection</button>
              </div>
            ) : <p className="analytics-product-prompt">Select a product bar to update its detail KPIs and table.</p>}
            {productDetail && (
              <div className="analytics-kpi-grid analytics-kpi-grid-four">
                <KpiCard label="Product sales proxy" value={formatDatasetAmount(readNumber(productDetail, "sales_proxy"))} note={currencyNote} />
                <KpiCard label="Retained units" value={formatNumber(readNumber(productDetail, "units"))} note="Positive quantity total" />
                <KpiCard label="Distinct invoices" value={formatNumber(readNumber(productDetail, "invoices"))} note="Invoices containing this product" />
                <KpiCard label="Sales per invoice" value={formatDatasetAmount(readNumber(productDetail, "invoices") ? readNumber(productDetail, "sales_proxy") / readNumber(productDetail, "invoices") : 0, 2)} note="Product sales proxy ÷ invoices" />
              </div>
            )}
            <div className="analytics-content-grid analytics-content-grid-main">
              <Panel title="Leading products" eyebrow="Ranked within the selected year and country">
                <RankingChart
                  data={currentProducts.map((row) => ({ label: readString(row, "product_name"), value: readNumber(row, "sales_proxy") }))}
                  formatValue={(value) => formatDatasetAmount(value)}
                  height={370}
                  selectedLabel={selectedProduct || undefined}
                  choiceTitle="product"
                  onSelect={(label) => setSelectedProduct((current) => current === label ? "" : label)}
                />
              </Panel>
              <Panel title="Product detail" eyebrow={productDetail ? "Selected product slice" : "Retained positive lines"}>
                <DataTable
                  headers={["Product", "Sales proxy", "Units", "Invoices"]}
                  rows={visibleProducts.map((row) => [
                    <span className="analytics-product-name" key="name">{readString(row, "product_name") || "Unknown product"}</span>,
                    <span key="sales">{formatDatasetAmount(readNumber(row, "sales_proxy"), 2)}</span>,
                    <span key="units">{formatNumber(readNumber(row, "units"))}</span>,
                    <span key="invoices">{formatNumber(readNumber(row, "invoices"))}</span>,
                  ])}
                />
                <p className="analytics-small-note">Top product rows are aggregated by the dashboard’s selected year and country. Product totals are not broken down by month or basket value.</p>
              </Panel>
            </div>
          </>
        ) : null}

        {activeTab.id === "retention" && project === "shoplens" ? (
          <ShopLensRetention asset={assets["retention.json"]} country={country} />
        ) : null}
        {activeTab.id === "retention" && project === "retail-iq" ? (
          <RetailIqRetention asset={assets["retention.json"]} country={country} />
        ) : null}
        {activeTab.id === "baskets" && project === "retail-iq" ? (
          <RetailIqBasket persona={assets["personas.json"]} affinity={assets["affinity.json"]} instacart={assets["instacart.json"]} />
        ) : null}
        {activeTab.id === "choices" && project === "customer-behaviour" ? (
          <CustomerChoices asset={assets["behavior.json"]} selected={selectedFilters} />
        ) : null}
        {activeTab.id === "quality" && project === "sales-analysis" ? (
          <QualityDetails asset={assets["quality.json"]} project={project} />
        ) : null}
      </div>

      <div className="analytics-dashboard-footnote">
        <span>Aggregated dashboard data · no customer IDs in the browser payload</span>
        <span>Versioned asset set · {DASHBOARD_DATA_VERSION}</span>
      </div>
    </section>
  );
}

function ShopLensRetention({ asset, country }: { asset: JsonAsset | undefined; country: string }) {
  if (!asset) return null;
  const rfmRows = assetRows<JsonAsset>(asset, "rfm").filter((row) => readString(row, "country") === country);
  const statusRows = assetRows<JsonAsset>(asset, "customer_status").filter((row) => readString(row, "country") === country);
  const cohortRows = assetRows<JsonAsset>(asset, "cohorts")
    .filter((row) => readString(row, "country") === country)
    .sort((left, right) => readString(left, "cohort_month").localeCompare(readString(right, "cohort_month")) || readNumber(left, "month_index") - readNumber(right, "month_index"));
  const latestCohorts = cohortRows.slice(-60);
  const customerCount = assetRows<JsonAsset>(asset, "customer_count_by_country")
    .find((row) => readString(row, "country") === country)?.customers;
  const churned = statusRows.find((row) => readString(row, "customer_status") === "Churned");
  const atRisk = statusRows.find((row) => readString(row, "customer_status") === "At Risk");
  const segments = rfmRows
    .reduce<RankingDatum[]>((result, row) => {
      const label = readString(row, "rfm_segment");
      const existing = result.find((item) => item.label === label);
      if (existing) existing.value += readNumber(row, "customers");
      else result.push({ label, value: readNumber(row, "customers") });
      return result;
    }, [])
    .sort((left, right) => right.value - left.value);
  const definition = assetObject(asset, "definitions");
  return (
    <>
      <div className="analytics-kpi-grid analytics-kpi-grid-three">
        <KpiCard label="Known shoppers" value={formatNumber(asNumber(customerCount))} note={`One snapshot · ${readString(asset, "snapshot_date")}`} />
        <KpiCard label="Project-defined churned" value={formatNumber(readNumber(churned, "customers"))} note="More than 90 days since last retained purchase" />
        <KpiCard label="Project-defined at risk" value={formatNumber(readNumber(atRisk, "customers"))} note="60–90 days inactive, inclusive" />
      </div>
      <div className="analytics-content-grid analytics-content-grid-main">
        <Panel title="RFM customer groups" eyebrow={`Customer count · ${country === "All" ? "all countries" : country}`}>
          <RankingChart data={segments} formatValue={formatNumber} height={340} />
        </Panel>
        <Panel title="Observed repeat purchase" eyebrow="Cohort month and month index">
          <DataTable
            headers={["First month", "Month index", "Returning", "Cohort size", "Retention"]}
            rows={latestCohorts.map((row) => [
              <span key="month">{readString(row, "cohort_month")}</span>,
              <span key="index">{formatNumber(readNumber(row, "month_index"))}</span>,
              <span key="returning">{formatNumber(readNumber(row, "returning_customers"))}</span>,
              <span key="size">{formatNumber(readNumber(row, "cohort_size"))}</span>,
              <span key="rate">{formatPercent(readNumber(row, "retention_rate"))}</span>,
            ])}
          />
          <p className="analytics-small-note">Only observed months are included. Country and cohort cells below the documented privacy threshold are suppressed.</p>
        </Panel>
      </div>
      <Panel title="How to read this snapshot" eyebrow="Project definitions">
        <p className="analytics-panel-copy">{readString(definition ?? undefined, "churn")} {readString(definition ?? undefined, "cohort_retention")} {readString(definition ?? undefined, "privacy_suppression")}</p>
      </Panel>
    </>
  );
}

function RetailIqRetention({ asset, country }: { asset: JsonAsset | undefined; country: string }) {
  if (!asset) return null;
  const rfm = assetObject(asset, "rfm");
  const cohort = assetObject(asset, "cohorts");
  const segments = assetRows<JsonAsset>(rfm, "profiles").filter((row) => readString(row, "country") === country);
  const cohorts = assetRows<JsonAsset>(cohort, "rows").filter((row) => readString(row, "country") === country);
  const customerCount = assetRows<JsonAsset>(rfm, "customer_count_by_country")
    .find((row) => readString(row, "country") === country)?.customers;
  const ranked = segments
    .reduce<RankingDatum[]>((result, row) => {
      const label = readString(row, "segment");
      const existing = result.find((item) => item.label === label);
      if (existing) existing.value += readNumber(row, "customers");
      else result.push({ label, value: readNumber(row, "customers") });
      return result;
    }, [])
    .sort((left, right) => right.value - left.value);
  return (
    <div className="analytics-content-grid analytics-content-grid-main">
      <Panel title="RetailIQ RFM profiles" eyebrow="Online Retail population · known customers only">
          <p className="analytics-small-note">{formatNumber(asNumber(customerCount))} known shoppers in this country slice · snapshot {readString(rfm ?? undefined, "snapshot_date")}. The year filter does not change this full-history snapshot.</p>
        <RankingChart data={ranked} formatValue={formatNumber} height={340} />
        <p className="analytics-small-note">Anonymous positive sales lines remain in trading totals and do not enter these profiles.</p>
      </Panel>
      <Panel title="Observed acquisition cohorts" eyebrow="Positive-sales first-seen month">
        <DataTable
          headers={["Cohort", "Month index", "Customers", "Cohort size", "Retention"]}
          rows={cohorts.slice(-45).map((row) => [
            <span key="month">{readString(row, "cohort")}</span>,
            <span key="index">{formatNumber(readNumber(row, "month_index"))}</span>,
            <span key="retained">{formatNumber(readNumber(row, "customers"))}</span>,
            <span key="size">{formatNumber(readNumber(row, "cohort_size"))}</span>,
            <span key="rate">{formatPercent(readNumber(row, "retention_rate"))}</span>,
          ])}
        />
        <p className="analytics-small-note">{readString(cohort ?? undefined, "suppression")}</p>
      </Panel>
    </div>
  );
}

function RetailIqBasket({ persona, affinity, instacart }: {
  persona: JsonAsset | undefined;
  affinity: JsonAsset | undefined;
  instacart: JsonAsset | undefined;
}) {
  if (!persona || !affinity || !instacart) return null;
  const personaCategories = assetRows<JsonAsset>(persona, "categories").slice().sort((a, b) => readNumber(b, "sales_proxy") - readNumber(a, "sales_proxy"));
  const clusters = assetRows<JsonAsset>(persona, "cluster_profiles");
  const agePayment = assetRows<JsonAsset>(persona, "age_payment")
    .slice().sort((a, b) => readNumber(b, "customer_records") - readNumber(a, "customer_records")).slice(0, 10);
  const modelMetadata = assetObject(persona, "metadata");
  const rules = assetRows<JsonAsset>(affinity, "rules").slice(0, 8);
  const departments = assetRows<JsonAsset>(instacart, "departments").slice().sort((a, b) => readNumber(b, "ordered_units") - readNumber(a, "ordered_units")).slice(0, 8);
  const reorderProducts = assetRows<JsonAsset>(instacart, "high_reorder_products").slice(0, 8);
  const quality = assetObject(instacart, "quality");
  return (
    <>
      <div className="analytics-source-separation">
        <strong>Separate populations, shown side by side</strong>
        <p>RetailIQ combines independent Online Retail transactions, mall customer records, and an Instacart order sample. No person or order key connects these sources.</p>
      </div>
      <div className="analytics-content-grid analytics-content-grid-main">
        <Panel title="Mall customer categories" eyebrow={`${formatNumber(readNumber(modelMetadata ?? undefined, "source_rows"))} source records · source purchase units`}>
          <CategoryChart data={personaCategories.map((row) => ({ label: readString(row, "category"), value: readNumber(row, "sales_proxy") }))} dataKey="Source purchase amount" formatValue={(value) => formatMoney(value, undefined)} />
          <p className="analytics-small-note">These are source purchase amounts; a currency unit is not documented in the supplied project. Category test priority is descriptive, not measured discount lift.</p>
        </Panel>
        <Panel title="Modelled shopper profiles" eyebrow={`K-means · selected k = ${readNumber(modelMetadata ?? undefined, "selected_k")}`}>
          <div className="analytics-persona-list">
            {clusters.map((row) => (
              <article key={readString(row, "persona")}>
                <span>{readString(row, "persona")}</span>
                <strong>{formatNumber(readNumber(row, "customer_records"))} records</strong>
                <small>Mean age {formatNumber(readNumber(row, "average_age"), 1)} · mean purchase {formatMoney(readNumber(row, "average_purchase"), undefined)} · {readString(row, "top_mall")}</small>
              </article>
            ))}
          </div>
        </Panel>
      </div>
      <div className="analytics-content-grid analytics-content-grid-secondary">
        <Panel title="Frequently co-purchased items" eyebrow={`Association rules · ${formatNumber(readNumber(affinity, "transaction_count"))} baskets`}>
          <DataTable
            headers={["Observed pair", "Support", "Confidence", "Lift", "Pair count"]}
            rows={rules.map((row) => [
              <span key="pair">{readString(row, "antecedent")} → {readString(row, "consequent")}</span>,
              <span key="support">{formatPercent(readNumber(row, "support"), 2)}</span>,
              <span key="confidence">{formatPercent(readNumber(row, "confidence"), 1)}</span>,
              <span key="lift">{formatNumber(readNumber(row, "lift"), 1)}</span>,
              <span key="count">{formatNumber(readNumber(row, "pair_count"))}</span>,
            ])}
          />
          <p className="analytics-small-note">Co-occurrence does not show that one item causes another to be purchased.</p>
        </Panel>
        <Panel title="Instacart reorder and department mix" eyebrow={`${formatPercent(readNumber(quality ?? undefined, "matched_share"), 1)} of order-product lines join to supplied orders`}>
          <CategoryChart data={departments.map((row) => ({ label: readString(row, "department"), value: readNumber(row, "ordered_units") }))} dataKey="Ordered lines" formatValue={formatNumber} />
          <DataTable
            headers={["Product", "Orders", "Observed reorder"]}
            rows={reorderProducts.map((row) => [
              <span key="name">{readString(row, "product_name")}</span>,
              <span key="orders">{formatNumber(readNumber(row, "orders"))}</span>,
              <span key="rate">{formatPercent(readNumber(row, "reorder_rate"))}</span>,
            ])}
          />
          <p className="analytics-small-note">User and time metrics use matched IDs only; product and department counts use all supplied order-product lines.</p>
        </Panel>
      </div>
      <Panel title="Largest mall customer slices" eyebrow="Age band × payment method · top source record counts">
        <DataTable
          headers={["Age band", "Payment method", "Records", "Purchase amount", "Mean purchase"]}
          rows={agePayment.map((row) => [
            <span key="age">{readString(row, "age_band")}</span>,
            <span key="payment">{readString(row, "payment_method")}</span>,
            <span key="count">{formatNumber(readNumber(row, "customer_records"))}</span>,
            <span key="amount">{formatMoney(readNumber(row, "sales_proxy"), undefined)}</span>,
            <span key="mean">{formatMoney(readNumber(row, "average_purchase"), undefined)}</span>,
          ])}
        />
      </Panel>
    </>
  );
}

function CustomerChoices({ asset, selected }: { asset: JsonAsset | undefined; selected: Record<string, string> }) {
  if (!asset) return null;
  const charts = assetObject(asset, "charts");
  const chartRows = (key: string, axis: string) => assetRows<JsonAsset>(charts, key)
    .filter((row) => matchesDemographicFilters(row, selected) && readNumber(row, "records") > 0)
    .reduce<RankingDatum[]>((result, row) => {
      const label = readString(row, axis);
      const existing = result.find((item) => item.label === label);
      const value = readNumber(row, "purchase_amount");
      if (existing) existing.value += value;
      else result.push({ label, value });
      return result;
    }, [])
    .sort((left, right) => right.value - left.value)
    .slice(0, 10);
  const notes = Array.isArray(asset.notes) ? asset.notes.filter((note): note is string => typeof note === "string") : [];
  return (
    <>
      <div className="analytics-content-grid analytics-content-grid-main">
        <Panel title="Age groups" eyebrow="Fixed project-documentation bands">
          <CategoryChart data={chartRows("age_groups", "age_group").map((row) => ({ label: row.label, value: row.value }))} dataKey="Purchase amount" formatValue={(value) => formatMoney(value, "USD")} />
        </Panel>
        <Panel title="Customer groups" eyebrow="Descriptive previous-purchase rule">
          <CategoryChart data={chartRows("customer_segments", "customer_segment").map((row) => ({ label: row.label, value: row.value }))} dataKey="Purchase amount" formatValue={(value) => formatMoney(value, "USD")} />
        </Panel>
      </div>
      <div className="analytics-content-grid analytics-content-grid-secondary">
        <Panel title="Purchase frequency" eyebrow="As recorded in the source">
          <CategoryChart data={chartRows("purchase_frequency", "frequency_of_purchases").map((row) => ({ label: row.label, value: row.value }))} dataKey="Purchase amount" formatValue={(value) => formatMoney(value, "USD")} />
        </Panel>
        <Panel title="Product categories" eyebrow="Sum of recorded purchase amounts">
          <CategoryChart data={chartRows("categories", "category").map((row) => ({ label: row.label, value: row.value }))} dataKey="Purchase amount" formatValue={(value) => formatMoney(value, "USD")} />
          {notes.map((note) => <p className="analytics-small-note" key={note}>{note}</p>)}
        </Panel>
      </div>
    </>
  );
}

function QualityDetails({ asset, project }: { asset: JsonAsset | undefined; project: AnalyticsDashboardSlug }) {
  if (!asset) return null;
  const quality = assetObject(asset, "quality");
  const salesQuality = assetObject(quality, "sales_analysis");
  const exclusions = assetObject(salesQuality, "exclusions_by_step");
  const rawRows = readNumber(quality ?? undefined, "source_rows");
  const duplicates = readNumber(quality ?? undefined, "source_duplicate_rows");
  const missingCustomers = readNumber(quality ?? undefined, "missing_customer_rows");
  const missingDescriptions = readNumber(quality ?? undefined, "missing_description_rows");
  const duplicateRows = readNumber(salesQuality ?? undefined, "duplicate_rows_preserved");
  const policy = readString(salesQuality ?? undefined, "policy");
  return (
    <div className="analytics-content-grid analytics-content-grid-main">
      <Panel title="Source quality" eyebrow="Online Retail II · audited raw rows">
        <div className="analytics-quality-grid">
          <div><span>Source rows</span><strong>{formatNumber(rawRows)}</strong></div>
          <div><span>Exact duplicate rows</span><strong>{formatNumber(duplicates)}</strong></div>
          <div><span>Missing customer IDs</span><strong>{formatNumber(missingCustomers)}</strong></div>
          <div><span>Missing descriptions</span><strong>{formatNumber(missingDescriptions)}</strong></div>
          <div><span>Duplicates retained by project cleaner</span><strong>{formatNumber(duplicateRows)}</strong></div>
          <div><span>Current filter scope</span><strong>{projectLabel(project)}</strong></div>
        </div>
      </Panel>
      <Panel title="Applied exclusions" eyebrow="Source project cleaning behavior">
        <DataTable
          headers={["Rule", "Rows removed"]}
          rows={Object.entries(exclusions ?? {}).map(([name, count]) => [
            <span key="rule">{projectLabel(name.replaceAll("_", "-"))}</span>,
            <span key="count">{formatNumber(asNumber(count))}</span>,
          ])}
        />
        <p className="analytics-panel-copy">{policy}</p>
        <p className="analytics-small-note">The current report follows the source project’s existing cleaner and does not deduplicate retained transaction lines.</p>
      </Panel>
    </div>
  );
}
