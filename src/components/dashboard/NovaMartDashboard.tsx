"use client";

import { useEffect, useMemo, useState } from "react";
import { Moon, RotateCcw, Sun } from "lucide-react";
import {
  FinanceBento,
  DashboardPanel as Panel,
  DashboardStat as Stat,
} from "@/components/ui/finance-bento";
import { RankingChart, TrendChart } from "./AnalyticsCharts";
import { DashboardProjectLinks } from "./DashboardProjectLinks";
import { useDashboardTheme } from "./DashboardThemeShell";
import {
  allNovaFilters,
  deriveNova,
  divide,
  loadNovaData,
  novaMoney,
  novaNumber,
  novaPercent,
  novaTabs,
  sellerLabel,
} from "@/lib/novamart";
import { DashboardDataTable as Table } from "./DashboardDataTable";
import type { Column } from "./DashboardDataTable";
import type { NovaData, NovaFilters, NovaGroup } from "@/lib/novamart";

export default function NovaMartDashboard() {
  const [data, setData] = useState<NovaData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState<NovaFilters>(allNovaFilters);
  const [tab, setTab] = useState(0);
  const [measure, setMeasure] = useState<"gmv" | "delivered" | "late">("gmv");
  const { theme, toggleTheme } = useDashboardTheme();
  useEffect(() => {
    const controller = new AbortController();
    loadNovaData(controller.signal)
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Unable to load NovaMart.");
      });
    return () => controller.abort();
  }, [attempt]);
  const view = useMemo(
    () => (data ? deriveNova(data, filters) : null),
    [data, filters],
  );
  const select = (key: keyof NovaFilters, value: string) =>
    setFilters((f) => ({ ...f, [key]: f[key] === value ? "All" : value }));
  if (error)
    return (
      <div className="analytics-error" role="alert">
        <h2>NovaMart data is unavailable</h2>
        <p>{error}</p>
        <button
          type="button"
          onClick={() => {
            setError("");
            setAttempt((a) => a + 1);
          }}
        >
          Retry data load
        </button>
      </div>
    );
  if (!data || !view)
    return (
      <div className="study-loading" role="status">
        <span />
        Loading and verifying the NovaMart analysis…
      </div>
    );
  const s = view.summary;
  const money = measure === "gmv";
  const percent = measure === "late";
  const value = (g: NovaGroup) =>
    money
      ? g.summary.gmv
      : percent
        ? divide(g.summary.late, g.summary.eligible)
        : g.summary.delivered;
  const chartFormat = (n: number) =>
    money ? novaMoney(n) : percent ? novaPercent(n) : novaNumber(n);
  const axisFormat = (n: number) =>
    percent
      ? novaPercent(n)
      : (money ? "BRL " : "") +
        new Intl.NumberFormat("en", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(money ? n / 100 : n);
  const measureLabel = money
    ? "Delivered item value · BRL"
    : percent
      ? "Late delivery rate"
      : "Delivered orders";
  const points = (groups: NovaGroup[], limit = 12) =>
    groups
      .map((g) => ({
        label: g.label,
        value: value(g),
        note: `${novaNumber(g.summary.delivered)} delivered · ${novaNumber(g.summary.eligible)} eligible`,
      }))
      .filter((g): g is typeof g & { value: number } => g.value !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  const groupColumns: Column[] = [
    { label: "Group" },
    { label: "All orders" },
    { label: "Delivered" },
    { label: "Item value", format: "money" },
    { label: "Eligible" },
    { label: "Late" },
    { label: "Late rate", format: "percent" },
    { label: "Review score", format: "decimal" },
  ];
  const groupRows = (groups: NovaGroup[]) =>
    groups.map(({ label, summary: g }) => [
      label,
      g.orders,
      g.delivered,
      g.gmv,
      g.eligible,
      g.late,
      divide(g.late, g.eligible),
      divide(g.reviewsSum, g.reviewsCount),
    ]);
  const scope =
    Object.entries(filters)
      .filter(([, v]) => v !== "All")
      .map(([k, v]) => `${k}: ${k === "seller" ? sellerLabel(Number(v)) : v}`)
      .join(" · ") ||
    "All months · all states · all statuses · all categories · all sellers";
  const filterOptions = {
    month: data.months,
    state: data.states,
    status: data.statuses,
    category: data.categories,
    seller: data.seller_states.map((_, i) => String(i)),
  };
  return (
    <FinanceBento
      label="NovaMart dashboard"
      className="analytics-dashboard study-dashboard nova-dashboard"
    >
      <div className="study-workspace-heading">
        <div>
          <span className="study-status-dot" /> Marketplace workspace{" "}
          <small>Historical Olist data</small>
        </div>
        <DashboardProjectLinks project="novamart" />
      </div>
      <div className="analytics-toolbar">
        <div className="analytics-filter-list">
          {(Object.keys(filterOptions) as (keyof NovaFilters)[]).map((key) => (
            <label className="analytics-filter" key={key}>
              <span>
                {key === "state"
                  ? "Customer state"
                  : key === "month"
                    ? "Purchase month"
                    : key === "status"
                      ? "Order status"
                      : key}
              </span>
              <select
                value={filters[key]}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, [key]: e.target.value }))
                }
              >
                <option value="All">
                  All{" "}
                  {key === "category"
                    ? "categories"
                    : key === "status"
                      ? "statuses"
                      : key + "s"}
                </option>
                {filterOptions[key].map((v) => (
                  <option key={v} value={v}>
                    {key === "seller"
                      ? `${sellerLabel(Number(v))} · ${data.seller_states[Number(v)]}`
                      : v.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="analytics-toolbar-actions">
          <button
            type="button"
            className="analytics-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            className="analytics-reset"
            onClick={() => {
              setFilters(allNovaFilters);
              setMeasure("gmv");
            }}
          >
            <RotateCcw size={14} />
            Reset filters
          </button>
        </div>
      </div>
      <nav
        className="analytics-tabs"
        role="tablist"
        aria-label="NovaMart report pages"
      >
        {novaTabs.map((name, i) => (
          <button
            key={name}
            type="button"
            role="tab"
            id={`nova-tab-${i}`}
            aria-selected={tab === i}
            aria-controls="nova-panel"
            tabIndex={tab === i ? 0 : -1}
            onClick={() => setTab(i)}
            onKeyDown={(e) => {
              const next =
                e.key === "ArrowRight"
                  ? (i + 1) % novaTabs.length
                  : e.key === "ArrowLeft"
                    ? (i + novaTabs.length - 1) % novaTabs.length
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? novaTabs.length - 1
                        : null;
              if (next !== null) {
                e.preventDefault();
                setTab(next);
                document.getElementById(`nova-tab-${next}`)?.focus();
              }
            }}
          >
            {name}
          </button>
        ))}
      </nav>
      <div className="nova-selection" aria-live="polite">
        <strong>{novaNumber(s.orders)} matching orders</strong>
        <span>{scope}</span>
      </div>
      <p className="analytics-small-note nova-scope">
        Every filter applies across all report pages. Item value and freight
        include selected items; delivery, reviews and customer counts use
        distinct matching orders. Category and seller order counts can overlap.
      </p>
      <div
        role="tabpanel"
        id="nova-panel"
        aria-labelledby={`nova-tab-${tab}`}
        tabIndex={0}
      >
        <div className="analytics-kpi-grid">
          <Stat
            label="Delivered item value"
            value={novaMoney(s.gmv)}
            note="GMV proxy · excludes freight · not revenue or profit"
            active={measure === "gmv"}
            onClick={() => setMeasure("gmv")}
          />
          <Stat
            label="Delivered orders"
            value={novaNumber(s.delivered)}
            note={`${novaNumber(s.orders)} orders in the current selection`}
            active={measure === "delivered"}
            onClick={() => setMeasure("delivered")}
          />
          <Stat
            label="Late delivery rate"
            value={novaPercent(divide(s.late, s.eligible))}
            note={`${novaNumber(s.late)} late ÷ ${novaNumber(s.eligible)} eligible deliveries`}
            active={measure === "late"}
            onClick={() => setMeasure("late")}
          />
          <Stat
            label="Average order value"
            value={novaMoney(divide(s.gmv, s.delivered))}
            note="Selected delivered item value ÷ distinct delivered orders"
          />
        </div>
        {!s.orders && (
          <p className="analytics-empty" role="status">
            No matching orders. Broaden a filter or use Reset filters.
          </p>
        )}
        <div className="study-grid">
          {tab === 0 && (
            <>
              <Panel
                title="Marketplace value over time"
                eyebrow={`${measureLabel} · select a KPI to change the measure`}
                className="study-full"
              >
                <TrendChart
                  data={view.monthly.flatMap((g) => {
                    const v = value(g);
                    return v === null ? [] : [{ label: g.label, value: v }];
                  })}
                  valueLabel={measureLabel}
                  formatValue={chartFormat}
                  formatAxisValue={axisFormat}
                  selectedLabel={filters.month}
                  onSelect={(v) => select("month", v)}
                />
                <p className="analytics-small-note">
                  {percent
                    ? "Undefined delivery rates are omitted from this chart. The detail table retains every observed month and its denominator; rates in sparse months can be unstable."
                    : "All observed purchase months are included, including sparse boundary months."}{" "}
                  The selected month also filters this chart.
                </p>
              </Panel>
              <Panel
                title="Customer states"
                eyebrow={`${measureLabel} · top 12 · select a state to filter`}
              >
                <RankingChart
                  data={points(view.states)}
                  choiceTitle={measureLabel}
                  formatValue={chartFormat}
                  formatAxisValue={axisFormat}
                  selectedLabel={filters.state}
                  onSelect={(v) => select("state", v)}
                />
              </Panel>
              <Panel
                title="Order outcomes"
                eyebrow="Distinct orders in the current selection"
              >
                <RankingChart
                  data={view.statuses.map((g) => ({
                    label: g.label,
                    value: g.summary.orders,
                  }))}
                  choiceTitle="Orders"
                  formatValue={novaNumber}
                  selectedLabel={filters.status}
                  onSelect={(v) => select("status", v)}
                />
                <p className="analytics-small-note">
                  Cancellation rate: {novaPercent(divide(s.canceled, s.orders))}
                  . Status totals include orders with no item records when no
                  item filter is selected.
                </p>
              </Panel>
              <Panel title="Monthly detail" className="study-full">
                <Table
                  key={`month-${scope}`}
                  columns={groupColumns}
                  rows={groupRows(view.monthly)}
                  caption="Exact purchase-month metrics"
                  onSelect={(r) => select("month", String(r[0]))}
                />
              </Panel>
            </>
          )}
          {tab === 1 && (
            <>
              <div className="analytics-kpi-grid study-full">
                <Stat
                  label="Eligible deliveries"
                  value={novaNumber(s.eligible)}
                  note="Delivered with actual and estimated timestamps"
                />
                <Stat
                  label="Missing actual date"
                  value={novaNumber(s.missingActual)}
                  note="Retained in delivered totals; excluded from delivery rates"
                />
                <Stat
                  label="Average delivery days"
                  value={novaNumber(divide(s.daysSum, s.daysCount), 2)}
                  note="Purchase to actual delivery · eligible orders only"
                />
                <Stat
                  label="Average days late"
                  value={novaNumber(divide(s.lateDaysSum, s.late), 2)}
                  note="Actual minus estimated timestamp · late orders only"
                />
              </div>
              <Panel
                title="Delivery duration"
                eyebrow="Eligible deliveries · consecutive, non-overlapping bands"
              >
                <RankingChart
                  data={view.deliveryBands}
                  choiceTitle="Orders"
                  formatValue={novaNumber}
                />
              </Panel>
              <Panel
                title="Review and delivery context"
                eyebrow="Per-order review means · delivered orders with a score"
              >
                <div className="nova-facts">
                  <p>
                    On-time review{" "}
                    <strong>
                      {novaNumber(
                        divide(s.onTimeReviews, s.onTimeReviewCount),
                        2,
                      )}{" "}
                      / 5
                    </strong>
                    <small>
                      {novaNumber(s.onTimeReviewCount)} scored orders
                    </small>
                  </p>
                  <p>
                    Late review{" "}
                    <strong>
                      {novaNumber(divide(s.lateReviews, s.lateReviewCount), 2)}{" "}
                      / 5
                    </strong>
                    <small>{novaNumber(s.lateReviewCount)} scored orders</small>
                  </p>
                </div>
                <p className="analytics-small-note">
                  Observed association does not establish that delivery timing
                  caused a review score.
                </p>
              </Panel>
              <Panel title="Promise-date sensitivity" className="study-full">
                <div className="nova-facts">
                  <p>
                    Strict timestamp rule{" "}
                    <strong>{novaPercent(divide(s.late, s.eligible))}</strong>
                    <small>{novaNumber(s.late)} late orders</small>
                  </p>
                  <p>
                    Calendar-date comparison{" "}
                    <strong>
                      {novaPercent(divide(s.calendarLate, s.eligible))}
                    </strong>
                    <small>{novaNumber(s.calendarLate)} late orders</small>
                  </p>
                  <p>
                    Same-day difference{" "}
                    <strong>{novaNumber(s.late - s.calendarLate)}</strong>
                    <small>Actual delivery later on the estimated date</small>
                  </p>
                </div>
                <p className="analytics-small-note">
                  Canonical lateness is actual timestamp &gt; estimated
                  timestamp. Estimates are midnight; confirm the business
                  meaning of a promised date before interpreting this as an SLA
                  breach.
                </p>
              </Panel>
              <Panel title="Delivery by customer state" className="study-full">
                <Table
                  key={`delivery-${scope}`}
                  columns={groupColumns}
                  rows={groupRows(view.states)}
                  caption="State rates and their eligible denominators · small populations remain visible"
                  onSelect={(r) => select("state", String(r[0]))}
                />
              </Panel>
            </>
          )}
          {tab === 2 && (
            <>
              <Panel
                title="Category contribution"
                eyebrow={`${measureLabel} · top 12 · select to investigate`}
              >
                <RankingChart
                  data={points(view.categories)}
                  choiceTitle={measureLabel}
                  formatValue={chartFormat}
                  formatAxisValue={axisFormat}
                  selectedLabel={filters.category}
                  onSelect={(v) => select("category", v)}
                />
              </Panel>
              <Panel
                title="Seller contribution"
                eyebrow={`${measureLabel} · top 12 · release-local seller aliases`}
              >
                <RankingChart
                  data={points(view.sellers)}
                  choiceTitle={measureLabel}
                  formatValue={chartFormat}
                  formatAxisValue={axisFormat}
                  selectedLabel={
                    filters.seller === "All"
                      ? "All"
                      : sellerLabel(Number(filters.seller))
                  }
                  onSelect={(v) =>
                    select("seller", String(Number(v.split(" ")[1]) - 1))
                  }
                />
              </Panel>
              <Panel title="Category detail" className="study-full">
                <Table
                  key={`categories-${scope}`}
                  columns={groupColumns}
                  rows={groupRows(view.categories)}
                  caption="All matching categories · sort, search or select a category"
                  onSelect={(r) => select("category", String(r[0]))}
                />
              </Panel>
              <Panel title="Seller detail" className="study-full">
                <Table
                  key={`sellers-${scope}`}
                  columns={groupColumns}
                  rows={groupRows(view.sellers)}
                  caption="All matching sellers · distinct orders per seller · overlapping populations"
                  onSelect={(r) =>
                    select(
                      "seller",
                      String(Number(String(r[0]).split(" ")[1]) - 1),
                    )
                  }
                />
              </Panel>
            </>
          )}
          {tab === 3 && (
            <>
              <div className="analytics-kpi-grid study-full">
                <Stat
                  label="Delivered customers"
                  value={novaNumber(s.customers)}
                  note="Distinct customer_unique_id membership · selected deliveries"
                />
                <Stat
                  label="Repeat customers"
                  value={novaNumber(s.repeat)}
                  note="At least two delivered orders within the current selection"
                />
                <Stat
                  label="Repeat customer rate"
                  value={novaPercent(divide(s.repeat, s.customers))}
                  note="Repeat customers ÷ selected delivered customers"
                />
                <Stat
                  label="Average review score"
                  value={novaNumber(divide(s.reviewsSum, s.reviewsCount), 2)}
                  note={`${novaNumber(s.reviewsCount)} scored delivered orders · per-order mean`}
                />
              </div>
              <Panel
                title="Observed purchase frequency"
                eyebrow="Mutually exclusive customer groups within the active filters"
              >
                <RankingChart
                  data={view.customerBands}
                  choiceTitle="Customers"
                  formatValue={novaNumber}
                />
              </Panel>
              <Panel
                title="Customer value context"
                eyebrow="Selected delivered item value · BRL"
              >
                <div className="nova-facts">
                  <p>
                    One-time customer value{" "}
                    <strong>{novaMoney(s.singleGmv)}</strong>
                  </p>
                  <p>
                    Repeat customer value{" "}
                    <strong>{novaMoney(s.repeatGmv)}</strong>
                  </p>
                </div>
                <p className="analytics-small-note">
                  Customer identity uses customer_unique_id across orders,
                  without exposing the source identifier. Repeat status is
                  recalculated within the selected purchase window; it is not
                  lifetime retention or a churn estimate.
                </p>
              </Panel>
            </>
          )}
          {tab === 4 && (
            <Panel
              title="Late-order investigation"
              eyebrow="All matching late orders · largest timestamp gap first"
              className="study-full"
            >
              <p className="analytics-small-note">
                Order labels are local analytical references. Reviews are
                order-level averages; this list supports investigation and does
                not prove causes.
              </p>
              <Table
                key={`exceptions-${scope}`}
                columns={[
                  { label: "Order reference" },
                  { label: "Purchase month" },
                  { label: "Customer state" },
                  { label: "Days late", format: "decimal" },
                  { label: "Delivery days", format: "decimal" },
                  { label: "Full order item value", format: "money" },
                  { label: "Review score", format: "decimal" },
                ]}
                rows={view.exceptions.map(({ r, i }) => [
                  `Order ${String(i + 1).padStart(6, "0")}`,
                  data.months[r[0]],
                  data.states[r[1]],
                  r[10],
                  r[7],
                  r[5],
                  r[8],
                ])}
                caption="Filtered late orders · value column shows full order value, including items outside an item selection"
              />
            </Panel>
          )}
          {tab === 5 && (
            <>
              <Panel title="Metric definitions" className="study-full">
                <ul className="study-notes">
                  <li>
                    Item value is an observed GMV proxy in BRL, excluding
                    freight. No costs, profit, recognized revenue, stock or
                    campaign exposure are available.
                  </li>
                  <li>
                    Order grain drives status, delivery, review and customer
                    metrics. Category and seller filters first identify matching
                    orders; monetary contribution includes only matching items.
                  </li>
                  <li>
                    Late rate = late delivered orders ÷ eligible deliveries.
                    Eight delivered records lack actual delivery timestamps in
                    the complete source.
                  </li>
                  <li>
                    Reviews are averaged within each order, then across
                    delivered orders with a score. Missing scores and undefined
                    ratios remain blank.
                  </li>
                  <li>
                    Headline totals include all observed months. Sparse periods
                    and small groups remain visible with denominators; avoid
                    ranking them as established operational problems.
                  </li>
                  <li>
                    Data is historical and observational. NovaMart is the
                    analysis project name; Olist is the source marketplace.
                  </li>
                </ul>
              </Panel>
              <Panel
                title="Power BI review and website treatment"
                className="study-full"
              >
                <ul className="study-notes">
                  {data.audit.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                <p className="analytics-small-note">
                  The source model has date→orders, product→items and
                  seller→items relationships. Some measures require explicit
                  TREATAS to transfer the order context. This dashboard applies
                  the complete selection to both grains, preserves missing
                  outcomes, and recalculates distinct customers. Source files
                  were kept read-only.
                </p>
              </Panel>
              <Panel title="Full-source control totals" className="study-full">
                <Table
                  columns={[{ label: "Control" }, { label: "Expected" }]}
                  rows={Object.entries(data.baseline).map(([key, val]) => [
                    key === "gmv_cents"
                      ? "Delivered item value (BRL)"
                      : key.replaceAll("_", " "),
                    key === "gmv_cents" ? novaMoney(val) : val,
                  ])}
                  caption="Unfiltered snapshot controls · independent of the current selection"
                />
              </Panel>
            </>
          )}
        </div>
      </div>
      <footer className="study-footnote">
        <p>
          Source:{" "}
          <a
            href={data.attribution.source}
            target="_blank"
            rel="noopener noreferrer"
          >
            {data.attribution.title}
          </a>{" "}
          · {data.attribution.author} ·{" "}
          <a
            href={data.attribution.license_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {data.attribution.license}
          </a>
          . {data.attribution.changes}
        </p>
        <span>
          Prepared {data.prepared_at.slice(0, 10)} · hash-verified data release
        </span>
        <a
          href="https://github.com/DazedSaturn07/NovaMart"
          target="_blank"
          rel="noopener noreferrer"
        >
          Explore NovaMart on GitHub ↗
        </a>
      </footer>
    </FinanceBento>
  );
}
