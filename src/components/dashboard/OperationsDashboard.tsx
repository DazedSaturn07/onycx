"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Moon, RotateCcw, Sun } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FinanceBento,
  DashboardPanel as Panel,
  DashboardStat as Stat,
} from "@/components/ui/finance-bento";
import { DashboardDataTable as Table } from "./DashboardDataTable";
import type { Column } from "./DashboardDataTable";
import { DashboardProjectLinks } from "./DashboardProjectLinks";
import { RankingChart } from "./AnalyticsCharts";
import { useDashboardTheme } from "./DashboardThemeShell";
import { novaNumber as number, novaPercent as percent } from "@/lib/novamart";
import {
  allCivicFilters,
  allFreightFilters,
  civicGroups,
  deriveCivic,
  freightGroups,
  freightLanes,
  freightSummary,
  operationDashboards,
  operationsReader,
  ratio,
} from "@/lib/operations-data";
import type {
  Attribution,
  CivicData,
  CivicFilters,
  CivicOverview,
  CivicRow,
  CivicSummary,
  FreightFilters,
  FreightLane,
  FreightOverview,
  OperationsReader,
  OperationsSlug,
} from "@/lib/operations-data";

type Filter = {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  select: (value: string) => void;
};
const compact = (n: number) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
const decimal = (n: number | null) => number(n, 2);
function Plot({
  points,
  title,
  format,
  select,
  selected,
}: {
  points: { label: string; value: number }[];
  title: string;
  format: (n: number) => string;
  select?: (value: string) => void;
  selected?: string;
}) {
  if (!points.length)
    return (
      <p className="analytics-empty">No observations for this selection.</p>
    );
  return (
    <>
      <figure className="analytics-chart" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 12, right: 18, left: 0, bottom: 8 }}
            accessibilityLayer
            onClick={(e) => {
              if (e.activeLabel != null) select?.(String(e.activeLabel));
            }}
          >
            <CartesianGrid vertical={false} stroke="var(--dash-chart-grid)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--dash-chart-axis)", fontSize: 10 }}
              minTickGap={26}
              tickFormatter={(v) =>
                String(v).length === 10 ? String(v).slice(5) : String(v)
              }
            />
            <YAxis
              domain={[0, "auto"]}
              tickFormatter={compact}
              width={58}
              tick={{ fill: "var(--dash-chart-axis)", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--dash-chart-tooltip)",
                color: "var(--dash-chart-tooltip-text)",
                border: "1px solid var(--dash-line)",
                borderRadius: 12,
              }}
              formatter={(v) => [format(Number(v)), title]}
            />
            <Line
              dataKey="value"
              type="linear"
              stroke="var(--dash-series-1)"
              strokeWidth={2.5}
              dot={points.length < 6}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </figure>
      {select && (
        <details className="analytics-chart-choices">
          <summary>Select a period with keyboard</summary>
          <div className="analytics-chart-choice-list">
            {points.map((p) => (
              <button
                type="button"
                key={p.label}
                aria-pressed={selected === p.label}
                onClick={() => select(p.label)}
              >
                {p.label} · {format(p.value)}
              </button>
            ))}
          </div>
        </details>
      )}
    </>
  );
}
function Frame({
  project,
  tab,
  setTab,
  filters,
  reset,
  scope,
  attribution,
  children,
  extra,
}: {
  project: OperationsSlug;
  tab: number;
  setTab: (tab: number) => void;
  filters: Filter[];
  reset: () => void;
  scope: string;
  attribution: Attribution;
  children: ReactNode;
  extra?: ReactNode;
}) {
  const { theme, toggleTheme } = useDashboardTheme(),
    config = operationDashboards[project];
  return (
    <FinanceBento
      label={`${config.title} dashboard`}
      className="analytics-dashboard study-dashboard operations-dashboard"
    >
      <div className="study-workspace-heading">
        <div>
          <span className="study-status-dot" />{" "}
          {project === "freightflow"
            ? "Freight planning workspace"
            : "Service operations workspace"}
          <small> Historical source snapshot</small>
        </div>
        <DashboardProjectLinks project={project} />
      </div>
      <div className="analytics-toolbar">
        <div className="analytics-filter-list">
          {filters.map((f) => (
            <label
              className="analytics-filter"
              key={f.key}
              htmlFor={`${project}-${f.key}`}
            >
              <span>{f.label}</span>
              <select
                id={`${project}-${f.key}`}
                value={f.value}
                onChange={(e) => f.select(e.target.value)}
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
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
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button type="button" className="analytics-reset" onClick={reset}>
            <RotateCcw size={14} />
            Reset filters
          </button>
        </div>
      </div>
      <nav
        className="analytics-tabs"
        role="tablist"
        aria-label={`${config.title} report pages`}
      >
        {config.tabs.map((t, i) => (
          <button
            type="button"
            role="tab"
            key={t}
            id={`operations-tab-${i}`}
            aria-selected={tab === i}
            aria-controls="operations-panel"
            tabIndex={tab === i ? 0 : -1}
            onClick={() => setTab(i)}
            onKeyDown={(e) => {
              const next =
                e.key === "ArrowRight"
                  ? (i + 1) % config.tabs.length
                  : e.key === "ArrowLeft"
                    ? (i + config.tabs.length - 1) % config.tabs.length
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? config.tabs.length - 1
                        : null;
              if (next != null) {
                e.preventDefault();
                setTab(next);
                document.getElementById(`operations-tab-${next}`)?.focus();
              }
            }}
          >
            {t}
          </button>
        ))}
      </nav>
      <p className="operations-scope" aria-live="polite">
        {scope}
      </p>
      {extra}
      <div
        role="tabpanel"
        id="operations-panel"
        tabIndex={0}
        aria-labelledby={`operations-tab-${tab}`}
      >
        {children}
      </div>
      <footer className="study-footnote">
        <p>
          <a href={attribution.url} target="_blank" rel="noopener noreferrer">
            {attribution.title}
          </a>
          {attribution.terms !== attribution.url && (
            <>
              {" · "}
              <a href={attribution.terms} target="_blank" rel="noopener noreferrer">
                Source terms
              </a>
            </>
          )}
          . {attribution.changes}
        </p>
        <span>
          Hash-verified published release · exact calculations use the selected
          source population
        </span>
      </footer>
    </FinanceBento>
  );
}
function Failure({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="analytics-error" role="alert">
      <h2>Dashboard data is unavailable</h2>
      <p>{message}</p>
      <button type="button" onClick={retry}>
        Retry data load
      </button>
    </div>
  );
}
function Loading({
  children = "Loading and verifying the complete analysis…",
}: {
  children?: ReactNode;
}) {
  return (
    <div className="study-loading" role="status">
      <span />
      {children}
    </div>
  );
}

const civicLabels: Record<keyof CivicFilters, string> = {
  created_day: "Intake day",
  agency: "Agency",
  borough: "Borough",
  complaint_type: "Complaint type",
  channel: "Channel",
  incident_zip: "ZIP",
  status: "Source status",
};
const civicColumns: Column[] = [
  { label: "Group" },
  { label: "Requests" },
  { label: "Unclosed cohort" },
  { label: "Median hours", format: "decimal" },
  { label: "P90 hours", format: "decimal" },
  { label: "Valid durations" },
  { label: "Due eligible" },
  { label: "Due met" },
  { label: "Due-date rate", format: "percent" },
];
function CivicDashboard() {
  const [data, setData] = useState<CivicData | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState<CivicFilters>(allCivicFilters),
    [tab, setTab] = useState(0),
    [measure, setMeasure] = useState<"requests" | "backlog">("requests"),
    [reviewMode, setReviewMode] = useState("review");
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const read = await operationsReader("civicpulse", controller.signal),
        meta = (await read("overview")) as unknown as CivicOverview;
      if (
        !Array.isArray(meta.parts) ||
        !meta.names ||
        !Array.isArray(meta.flags)
      )
        throw new Error("CivicPulse metadata is invalid.");
      const chunks = await Promise.all(meta.parts.map(read));
      const rows = chunks.flatMap((c) => c.rows as CivicRow[]);
      if (
        rows.length !== meta.baseline.requests ||
        rows.some((r) => r.length !== 14)
      )
        throw new Error("The CivicPulse request population is incomplete.");
      return { ...meta, rows };
    })()
      .then((d) => {
        if (!controller.signal.aborted) setData(d);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Unable to load requests.");
      });
    return () => controller.abort();
  }, [attempt]);
  const view = useMemo(
    () => (data ? deriveCivic(data, filters) : null),
    [data, filters],
  );
  const dimension =
    tab === 1 ? "agency" : tab === 2 ? "complaint_type" : "borough";
  const detailed = useMemo(
    () =>
      data && view && tab > 0 && tab < 4
        ? civicGroups(view.rows, dimension, data.names, true)
        : [],
    [data, view, tab, dimension],
  );
  const quick = useMemo(
    () =>
      data && view
        ? Object.fromEntries(
            (
              [
                "created_day",
                "agency",
                "borough",
                "complaint_type",
                "channel",
                "incident_zip",
                "status",
              ] as (keyof CivicFilters)[]
            ).map((key) => [key, civicGroups(view.rows, key, data.names)]),
          )
        : {},
    [data, view],
  );
  const investigation = useMemo(
    () =>
      !view || tab !== 4
        ? []
        : view.rows
            .filter((r) =>
              reviewMode === "all" || reviewMode === "backlog"
                ? reviewMode === "all" || !r[7]
                : reviewMode === "quality"
                  ? r[12] > 0
                  : !r[7] || r[12] > 0 || (r[8] ?? 0) > 720 * 3600,
            )
            .sort((a, b) => (b[13] ?? b[8] ?? 0) - (a[13] ?? a[8] ?? 0)),
    [view, tab, reviewMode],
  );
  if (error)
    return (
      <Failure
        message={error}
        retry={() => {
          setError("");
          setAttempt((n) => n + 1);
        }}
      />
    );
  if (!data || !view) return <Loading />;
  const s = view.summary;
  const select = (key: keyof CivicFilters, value: string) =>
    setFilters((f) => ({ ...f, [key]: f[key] === value ? "All" : value }));
  const bars = (key: keyof CivicFilters, metric = measure) =>
    (quick[key] ?? [])
      .map((g) => ({ label: g.label, value: g.summary[metric] }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
      .slice(0, 12);
  const groupTableRows = detailed.map((g) => {
    const x = g.summary as CivicSummary;
    return [
      g.label,
      x.requests,
      x.backlog,
      x.median_hours,
      x.p90_hours,
      x.valid_duration,
      x.due_eligible,
      x.due_met,
      ratio(x.due_met, x.due_eligible),
    ];
  });
  const selectionText =
    Object.entries(filters)
      .filter(([, v]) => v !== "All")
      .map(([k, v]) => `${civicLabels[k as keyof CivicFilters]}: ${v}`)
      .join(" · ") || "Complete January 2025 intake cohort";
  const labels = data.flags.map((f) => f.replaceAll("_", " "));
  const selectedKey = JSON.stringify(filters);
  return (
    <Frame
      project="civicpulse"
      tab={tab}
      setTab={setTab}
      attribution={data.attribution}
      scope={`${number(s.requests)} matching requests · ${selectionText} · status observed ${data.snapshot.slice(0, 10)}`}
      filters={(
        [
          "created_day",
          "agency",
          "borough",
          "complaint_type",
          "channel",
        ] as (keyof CivicFilters)[]
      ).map((key) => ({
        key,
        label: civicLabels[key],
        value: filters[key],
        options: [
          {
            value: "All",
            label: `All ${key === "created_day" ? "days" : key === "agency" ? "agencies" : key === "complaint_type" ? "complaint types" : key === "borough" ? "boroughs" : "channels"}`,
          },
          ...data.names[key].map((v) => ({ value: v, label: v })),
        ],
        select: (v) => setFilters((f) => ({ ...f, [key]: v })),
      }))}
      reset={() => {
        setFilters(allCivicFilters);
        setMeasure("requests");
        setReviewMode("review");
      }}
      extra={
        <>
          <p className="analytics-small-note">
            Backlog refers to unclosed requests in this creation cohort at
            retrieval. It is not total city backlog or January month-end
            backlog. Due-date evidence covers only eligible source records.
          </p>
          <div className="operations-chips">
            {(["incident_zip", "status"] as const)
              .filter((k) => filters[k] !== "All")
              .map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setFilters((f) => ({ ...f, [k]: "All" }))}
                  aria-label={`Remove ${civicLabels[k]} filter`}
                >
                  {civicLabels[k]}: {filters[k]} ×
                </button>
              ))}
          </div>
        </>
      }
    >
      <div className="analytics-kpi-grid">
        <Stat
          label="Requests"
          value={number(s.requests)}
          note="Complete filtered request population"
          active={measure === "requests"}
          onClick={() => setMeasure("requests")}
        />
        <Stat
          label="Unclosed cohort requests"
          value={number(s.backlog)}
          note="Still unclosed at the retrieval snapshot"
          active={measure === "backlog"}
          onClick={() => setMeasure("backlog")}
        />
        <Stat
          label="Median valid resolution"
          value={`${decimal(s.median_hours)} h`}
          note={`${number(s.valid_duration)} valid wall-time durations`}
        />
        <Stat
          label="P90 valid resolution"
          value={`${decimal(s.p90_hours)} h`}
          note="Recomputed from selected requests; never averaged group percentiles"
        />
      </div>
      {!s.requests && (
        <p className="analytics-empty" role="status">
          No matching requests. Broaden a filter or reset the selection.
        </p>
      )}
      <div className="study-grid">
        {tab === 0 && (
          <>
            <Panel
              title="Intake-day pattern"
              eyebrow={`${measure === "requests" ? "Created requests" : "Unclosed cohort requests"} · select a day to filter`}
              className="study-full"
            >
              <Plot
                points={(quick.created_day ?? [])
                  .map((g) => ({ label: g.label, value: g.summary[measure] }))
                  .sort((a, b) => a.label.localeCompare(b.label))}
                title={
                  measure === "requests"
                    ? "Requests"
                    : "Unclosed cohort requests"
                }
                format={number}
                select={(v) => select("created_day", v)}
                selected={filters.created_day}
              />
            </Panel>
            <Panel
              title="Agency workload"
              eyebrow="Top 12 within the active selection"
            >
              <RankingChart
                data={bars("agency")}
                formatValue={number}
                selectedLabel={filters.agency}
                onSelect={(v) => select("agency", v)}
                choiceTitle="agency"
              />
            </Panel>
            <Panel
              title="Borough demand"
              eyebrow="Observed requests; not population-adjusted need"
            >
              <RankingChart
                data={bars("borough")}
                formatValue={number}
                selectedLabel={filters.borough}
                onSelect={(v) => select("borough", v)}
                choiceTitle="borough"
              />
            </Panel>
            <Panel title="Rates and coverage" className="study-full">
              <div className="nova-facts">
                <p>
                  Closure rate
                  <strong>{percent(ratio(s.closed, s.requests))}</strong>
                  <small>
                    {number(s.closed)} closed / {number(s.requests)} requests
                  </small>
                </p>
                <p>
                  Within 72 hours
                  <strong>
                    {percent(ratio(s.benchmark_met, s.valid_duration))}
                  </strong>
                  <small>
                    {number(s.benchmark_met)} / {number(s.valid_duration)} valid
                    durations; analyst-defined benchmark
                  </small>
                </p>
                <p>
                  Due-date adherence
                  <strong>{percent(ratio(s.due_met, s.due_eligible))}</strong>
                  <small>
                    {number(s.due_met)} met / {number(s.due_eligible)} eligible;
                    source-wide eligibility is DSNY only
                  </small>
                </p>
              </div>
              <p className="analytics-small-note">
                Due-date coverage is {percent(ratio(s.due_eligible, s.closed))}{" "}
                of selected closed requests. This is not a citywide SLA measure.
                Missing denominators remain undefined.
              </p>
            </Panel>
          </>
        )}
        {tab === 1 && (
          <>
            <Panel
              title="Agency cohort backlog"
              eyebrow="Select an agency to update every view"
            >
              <RankingChart
                data={bars("agency", "backlog")}
                formatValue={number}
                onSelect={(v) => select("agency", v)}
                choiceTitle="agency"
                selectedLabel={filters.agency}
              />
            </Panel>
            <Panel title="Agency comparison context">
              <p className="study-copy">
                Compare resolution distributions alongside intake and eligible
                counts. Agencies receive different work; these rates do not
                establish relative effectiveness or resident satisfaction.
              </p>
              <div className="nova-facts">
                <p>
                  Closed without valid duration
                  <strong>{number(s.closed - s.valid_duration)}</strong>
                </p>
                <p>
                  Requests flagged for review
                  <strong>{number(s.quality_issues)}</strong>
                </p>
              </div>
            </Panel>
          </>
        )}
        {tab === 2 && (
          <>
            <Panel
              title="Complaint patterns"
              eyebrow="Top 12 complaint labels · select to investigate"
            >
              <RankingChart
                data={bars("complaint_type")}
                formatValue={number}
                onSelect={(v) => select("complaint_type", v)}
                choiceTitle="complaint type"
                selectedLabel={filters.complaint_type}
              />
            </Panel>
            <Panel
              title="Request channels"
              eyebrow="Missing source channels remain UNKNOWN"
            >
              <RankingChart
                data={bars("channel")}
                formatValue={number}
                onSelect={(v) => select("channel", v)}
                choiceTitle="channel"
                selectedLabel={filters.channel}
              />
            </Panel>
          </>
        )}
        {tab === 3 && (
          <>
            <Panel
              title="Borough comparison"
              eyebrow="Counts describe reported requests"
            >
              <RankingChart
                data={bars("borough")}
                formatValue={number}
                onSelect={(v) => select("borough", v)}
                choiceTitle="borough"
                selectedLabel={filters.borough}
              />
            </Panel>
            <Panel
              title="ZIP demand"
              eyebrow="Top 12 · UNKNOWN remains in totals"
            >
              <RankingChart
                data={bars("incident_zip")}
                formatValue={number}
                onSelect={(v) => select("incident_zip", v)}
                choiceTitle="ZIP"
                selectedLabel={filters.incident_zip}
              />
            </Panel>
          </>
        )}
        {tab > 0 && tab < 4 && (
          <Panel
            title={
              tab === 1
                ? "Agency detail"
                : tab === 2
                  ? "Complaint detail"
                  : "Borough detail"
            }
            className="study-full"
          >
            <Table
              key={dimension + selectedKey}
              columns={civicColumns}
              rows={groupTableRows}
              caption="Exact filtered counts and request-level percentiles · select a group to filter"
              onSelect={(r) => select(dimension, String(r[0]))}
              filename={`civicpulse-${dimension}.csv`}
            />
          </Panel>
        )}
        {tab === 4 && (
          <>
            <Panel
              title="Request investigation"
              eyebrow="Source identifiers, addresses and descriptors omitted"
              className="study-full"
            >
              <label
                className="analytics-filter operations-review-filter"
                htmlFor="civic-review-mode"
              >
                <span>Investigation population</span>
                <select
                  id="civic-review-mode"
                  value={reviewMode}
                  onChange={(e) => setReviewMode(e.target.value)}
                >
                  <option value="review">
                    Review required: unclosed, flagged or resolution over 30
                    days
                  </option>
                  <option value="backlog">Unclosed cohort only</option>
                  <option value="quality">Source-quality flags only</option>
                  <option value="all">All selected requests</option>
                </select>
              </label>
              <p className="analytics-small-note">
                Review references number the current list and are not source
                request IDs. Durations use New York local wall-time differences.
              </p>
              <Table
                key={selectedKey + reviewMode}
                columns={[
                  { label: "Review reference" },
                  { label: "Intake day" },
                  { label: "Agency" },
                  { label: "Borough" },
                  { label: "Complaint" },
                  { label: "Resolution hours", format: "decimal" },
                  { label: "Unclosed age (days)", format: "decimal" },
                  { label: "Reason" },
                ]}
                rows={investigation.map((r, i) => [
                  `Review ${i + 1}`,
                  data.names.created_day[r[0]],
                  data.names.agency[r[1]],
                  data.names.borough[r[2]],
                  data.names.complaint_type[r[3]],
                  r[8] === null ? null : r[8] / 3600,
                  r[13] === null ? null : r[13] / 86400,
                  [
                    ...(!r[7] ? ["Unclosed at snapshot"] : []),
                    ...labels.filter((_, i) => r[12] & (1 << i)),
                    ...((r[8] ?? 0) > 720 * 3600
                      ? ["Resolution over 30 days"]
                      : []),
                  ].join("; ") || "No review flag",
                ])}
                caption="Full matching investigation population · sort, search or export"
                filename="civicpulse-investigation.csv"
              />
            </Panel>
            <Panel title="Source status" className="study-full">
              <RankingChart
                data={bars("status", "requests")}
                formatValue={number}
                onSelect={(v) => select("status", v)}
                choiceTitle="source status"
                selectedLabel={filters.status}
              />
            </Panel>
          </>
        )}
        {tab === 5 && (
          <>
            <Panel title="Definitions and source limits" className="study-full">
              <ul className="study-notes">
                <li>
                  The complete cohort includes requests created from 1–31
                  January 2025. Status and backlog are observed at the 25
                  October 2026 retrieval snapshot.
                </li>
                <li>
                  Closed status without a valid timestamp counts as closed, but
                  is excluded from durations and due-date comparisons. Invalid
                  past/future closure timestamps remain quality flags.
                </li>
                <li>
                  Median and P90 use the selected valid request durations, with
                  inclusive linear interpolation. Group medians and percentiles
                  are never averaged.
                </li>
                <li>
                  The 72-hour comparison is an analyst-defined benchmark. Source
                  due dates are not proof of an official SLA; all 1,295 eligible
                  full-source requests belong to DSNY.
                </li>
                <li>
                  Missing channels and unknown boroughs remain visible. These
                  are reported requests, not population-adjusted need,
                  established causes or proven satisfaction.
                </li>
                <li>
                  All {data.report_pages.length} saved Power BI pages and their
                  model definitions were reviewed. Native Desktop refresh was
                  not rerun during portfolio integration.
                </li>
              </ul>
            </Panel>
            <Panel
              title="Quality flags in this selection"
              className="study-full"
            >
              <Table
                columns={[{ label: "Rule" }, { label: "Flagged requests" }]}
                rows={labels.map((name, i) => [
                  name,
                  view.rows.reduce(
                    (n, r) => n + Number(Boolean(r[12] & (1 << i))),
                    0,
                  ),
                ])}
                caption="Flags may overlap; their counts must not be added to estimate affected requests"
                filename="civicpulse-quality.csv"
              />
            </Panel>
          </>
        )}
      </div>
    </Frame>
  );
}

function FreightDashboard() {
  const [data, setData] = useState<FreightOverview | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [read, setRead] = useState<OperationsReader | null>(null);
  const [filters, setFilters] = useState<FreightFilters>(allFreightFilters),
    [tab, setTab] = useState(0),
    [measure, setMeasure] = useState<"tons" | "value" | "miles">("tons"),
    [search, setSearch] = useState("");
  const [laneData, setLaneData] = useState<{
      key: string;
      rows: FreightLane[];
    } | null>(null),
    [laneError, setLaneError] = useState(""),
    [laneAttempt, setLaneAttempt] = useState(0),
    [priorities, setPriorities] = useState<number[][] | null>(null);
  const cache = useRef(new Map<string, FreightLane[]>());
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const reader = await operationsReader("freightflow", controller.signal),
        meta = (await reader("overview")) as unknown as FreightOverview;
      if (
        !Array.isArray(meta.cube) ||
        !meta.names ||
        !meta.partitions ||
        meta.scale !== 1_000_000
      )
        throw new Error("FreightFlow metadata is invalid.");
      return { reader, meta };
    })()
      .then(({ reader, meta }) => {
        if (!controller.signal.aborted) {
          setData(meta);
          setRead(() => reader);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Unable to load freight data.",
          );
      });
    return () => controller.abort();
  }, [attempt]);
  const partition = filters.commodity < 0 ? "All" : String(filters.commodity);
  useEffect(() => {
    let current = true;
    if (!read || !data || tab !== 1) return;
    const load = cache.current.has(partition)
      ? Promise.resolve(cache.current.get(partition)!)
      : Promise.all(data.partitions[partition].map(read)).then((chunks) =>
          chunks.flatMap((c) => c.rows as FreightLane[]),
        );
    load
      .then((rows) => {
        if (current) {
          cache.current.set(partition, rows);
          if (cache.current.size > 3)
            cache.current.delete(cache.current.keys().next().value!);
          setLaneData({ key: partition, rows });
          setLaneError("");
        }
      })
      .catch((e) => {
        if (current)
          setLaneError(
            e instanceof Error ? e.message : "Unable to load lanes.",
          );
      });
    return () => {
      current = false;
    };
  }, [read, data, tab, partition, laneAttempt]);
  useEffect(() => {
    let current = true;
    if (read && tab === 3 && !priorities)
      read("priorities")
        .then((a) => {
          if (current) setPriorities(a.rows as number[][]);
        })
        .catch((e) => {
          if (current)
            setLaneError(
              e instanceof Error ? e.message : "Unable to load priorities.",
            );
        });
    return () => {
      current = false;
    };
  }, [read, tab, priorities, laneAttempt]);
  const effective = useMemo(
    () => (tab === 3 ? { ...filters, year: 2024, commodity: -1 } : filters),
    [tab, filters],
  );
  const summary = useMemo(
    () => (data ? freightSummary(data, effective) : null),
    [data, effective],
  );
  const lanes = useMemo(
    () =>
      data && laneData?.key === partition
        ? freightLanes(data, laneData.rows, effective)
        : [],
    [data, laneData, partition, effective],
  );
  const regions = useMemo(() => {
    const origin = new Map<string, number>(),
      destination = new Map<string, number>();
    for (const r of lanes) {
      origin.set(r.origin, (origin.get(r.origin) ?? 0) + r[measure]);
      destination.set(
        r.destination,
        (destination.get(r.destination) ?? 0) + r[measure],
      );
    }
    return {
      origin: [...origin]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12),
      destination: [...destination]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12),
    };
  }, [lanes, measure]);
  if (error)
    return (
      <Failure
        message={error}
        retry={() => {
          setError("");
          setAttempt((n) => n + 1);
        }}
      />
    );
  if (!data || !summary) return <Loading />;
  const valueFormat = (n: number) =>
    `${decimal(n)} ${measure === "tons" ? "ktons" : measure === "value" ? "M USD (2017)" : "M ton-miles"}`;
  const select = (key: "trade" | "mode" | "commodity", value: number) => {
    setFilters((f) => ({ ...f, [key]: f[key] === value ? -1 : value }));
    setSearch("");
  };
  const groups = (kind: "mode" | "commodity") =>
    freightGroups(data, effective, kind)
      .map((g) => ({ label: g.label, value: g.summary[measure], code: g.code }))
      .sort((a, b) => b.value - a.value);
  const modeGroups = groups("mode"),
    commodityGroups = groups("commodity");
  const years = data.years.map((year) => ({
    label: String(year),
    value: freightSummary(data, { ...effective, year })[measure],
  }));
  const start = freightSummary(data, { ...effective, year: 2024 }),
    end = freightSummary(data, { ...effective, year: 2050 });
  const priorityRows = (priorities ?? []).filter(
    (r) =>
      (filters.mode < 0 || r[2] === filters.mode) &&
      (filters.trade < 0 || r[3] === filters.trade),
  );
  const candidateBaseline = priorityRows.reduce((n, r) => n + r[4], 0),
    candidateForecast = priorityRows.reduce((n, r) => n + r[6], 0);
  const context = [
    `${effective.year} ${effective.year === 2024 ? "baseline estimate" : "source forecast"}`,
    effective.trade < 0
      ? "All trade types"
      : data.names.trades[effective.trade].label,
    effective.mode < 0 ? "All modes" : data.names.modes[effective.mode].label,
    effective.commodity < 0
      ? "All commodities"
      : data.names.commodities[effective.commodity].label,
  ].join(" · ");
  const options = (kind: "trades" | "modes" | "commodities") => [
    { value: "-1", label: `All ${kind === "trades" ? "trade types" : kind}` },
    ...data.names[kind].map((v, i) => ({ value: String(i), label: v.label })),
  ];
  const controls: Filter[] = [
    ...(tab === 3
      ? []
      : [
          {
            key: "year",
            label: "Estimate / scenario year",
            value: String(filters.year),
            options: data.years.map((y) => ({
              value: String(y),
              label: `${y} · ${y === 2024 ? "baseline estimate" : "source forecast"}`,
            })),
            select: (v: string) =>
              setFilters((f) => ({ ...f, year: Number(v) })),
          },
        ]),
    {
      key: "trade",
      label: "Trade type",
      value: String(filters.trade),
      options: options("trades"),
      select: (v) => select("trade", Number(v)),
    },
    {
      key: "mode",
      label: "Domestic mode",
      value: String(filters.mode),
      options: options("modes"),
      select: (v) => select("mode", Number(v)),
    },
    ...(tab === 3
      ? []
      : [
          {
            key: "commodity",
            label: "Commodity",
            value: String(filters.commodity),
            options: options("commodities"),
            select: (v: string) => select("commodity", Number(v)),
          },
        ]),
  ];
  const sourceCandidateNote =
    tab === 3
      ? "This page fixes the source-wide 2024 baseline and 2050 endpoints across all commodities. Trade and mode filters apply; the global source index and eligibility rules remain unchanged."
      : "Choose one annual estimate/scenario at a time. Forecast years are comparisons, never additional realized freight. Commodity and mode charts remove only their own filter for comparison.";
  return (
    <Frame
      project="freightflow"
      tab={tab}
      setTab={setTab}
      attribution={data.attribution}
      filters={controls}
      scope={context}
      reset={() => {
        setFilters(allFreightFilters);
        setMeasure("tons");
        setSearch("");
      }}
      extra={<p className="analytics-small-note">{sourceCandidateNote}</p>}
    >
      {tab === 3 ? (
        <div className="analytics-kpi-grid">
          <Stat
            label="Eligible lane-trade candidates"
            value={priorities ? number(priorityRows.length) : "—"}
            note="Fixed source eligibility; current trade/mode filters"
          />
          <Stat
            label="Candidate baseline tonnage"
            value={priorities ? decimal(candidateBaseline) : "—"}
            note="2024 estimate · thousand tons"
          />
          <Stat
            label="Candidate forecast tonnage"
            value={priorities ? decimal(candidateForecast) : "—"}
            note="2050 source forecast · thousand tons"
          />
          <Stat
            label="Candidate annualized growth"
            value={
              priorities
                ? percent(
                    candidateBaseline > 0 && candidateForecast > 0
                      ? (candidateForecast / candidateBaseline) ** (1 / 26) - 1
                      : null,
                  )
                : "—"
            }
            note="CAGR of summed endpoints over 26 years"
          />
        </div>
      ) : (
        <div className="analytics-kpi-grid">
          <Stat
            label="Tonnage"
            value={decimal(summary.tons)}
            note="Thousand tons · selected annual population"
            onClick={() => setMeasure("tons")}
            active={measure === "tons"}
          />
          <Stat
            label="Freight value"
            value={decimal(summary.value)}
            note="Millions of constant 2017 USD · not operator revenue"
            onClick={() => setMeasure("value")}
            active={measure === "value"}
          />
          <Stat
            label="Ton-miles"
            value={decimal(summary.miles)}
            note="Millions of ton-miles · freight activity"
            onClick={() => setMeasure("miles")}
            active={measure === "miles"}
          />
          <Stat
            label="Value density"
            value={decimal(ratio(summary.value, summary.tons))}
            note="Total million USD ÷ total thousand tons"
          />
        </div>
      )}
      {!summary.records && (
        <p className="analytics-empty" role="status">
          No source cells for this combination. Broaden a filter or reset.
        </p>
      )}
      <div className="study-grid">
        {tab === 0 && (
          <>
            <Panel
              title="Estimate and source scenarios"
              eyebrow={`${measure === "tons" ? "Tonnage" : measure === "value" ? "Freight value" : "Ton-miles"} · select a year`}
              className="study-full"
            >
              <Plot
                points={years}
                title={
                  measure === "tons"
                    ? "Thousand tons"
                    : measure === "value"
                      ? "Million 2017 USD"
                      : "Million ton-miles"
                }
                format={valueFormat}
                select={(v) => setFilters((f) => ({ ...f, year: Number(v) }))}
                selected={String(filters.year)}
              />
              <p className="analytics-small-note">
                2024 is an estimate. 2030 and 2050 are FAF source forecasts; the
                connecting line does not represent observed intervening years.
              </p>
            </Panel>
            <Panel
              title="Transport mode mix"
              eyebrow="Own mode filter removed; trade, commodity and year retained"
            >
              <RankingChart
                data={modeGroups.filter((g) => g.value > 0)}
                formatValue={valueFormat}
                onSelect={(v) =>
                  select(
                    "mode",
                    data.names.modes.findIndex((n) => n.label === v),
                  )
                }
                selectedLabel={
                  effective.mode < 0
                    ? undefined
                    : data.names.modes[effective.mode].label
                }
                choiceTitle="transport mode"
              />
            </Panel>
            <Panel
              title="Commodity contribution"
              eyebrow="Top 12 · own commodity filter removed"
            >
              <RankingChart
                data={commodityGroups.filter((g) => g.value > 0).slice(0, 12)}
                formatValue={valueFormat}
                onSelect={(v) =>
                  select(
                    "commodity",
                    data.names.commodities.findIndex((n) => n.label === v),
                  )
                }
                selectedLabel={
                  effective.commodity < 0
                    ? undefined
                    : data.names.commodities[effective.commodity].label
                }
                choiceTitle="commodity"
              />
            </Panel>
            <Panel
              title="What the network screen supports"
              className="study-full"
            >
              <div className="nova-facts">
                <p>
                  Selected fact records
                  <strong>{number(summary.records)}</strong>
                </p>
                <p>
                  Source-wide eligible candidates
                  <strong>{number(data.baseline.candidates)}</strong>
                  <small>Fixed eligibility before current filters</small>
                </p>
                <p>
                  2050 vs 2024 tonnage
                  <strong>
                    {percent(ratio(end.tons - start.tons, start.tons))}
                  </strong>
                  <small>Matching current trade, mode and commodity</small>
                </p>
              </div>
              <p className="analytics-small-note">
                FAF estimates aggregate regional flows. It contains no vehicle
                availability, spare capacity, lead times, carrier costs or
                achieved savings.
              </p>
            </Panel>
          </>
        )}
        {tab === 1 &&
          (laneError ? (
            <div className="study-full">
              <Failure
                message={laneError}
                retry={() => {
                  setLaneError("");
                  setLaneAttempt((n) => n + 1);
                }}
              />
            </div>
          ) : laneData?.key !== partition ? (
            <div className="study-full">
              <Loading>
                Loading the complete selected commodity’s lane table…
              </Loading>
            </div>
          ) : (
            <>
              <Panel
                title="Origin regions"
                eyebrow="Top 12 · select to search the lane table"
              >
                <RankingChart
                  data={regions.origin}
                  formatValue={valueFormat}
                  onSelect={setSearch}
                  selectedLabel={search}
                  choiceTitle="origin region"
                />
              </Panel>
              <Panel
                title="Destination regions"
                eyebrow="Top 12 · select to search the lane table"
              >
                <RankingChart
                  data={regions.destination}
                  formatValue={valueFormat}
                  onSelect={setSearch}
                  selectedLabel={search}
                  choiceTitle="destination region"
                />
              </Panel>
              <Panel title="Complete lane explorer" className="study-full">
                <p className="analytics-small-note">
                  Region selection searches this table; the global KPIs retain
                  the toolbar selection. Lane identity includes origin,
                  destination, domestic mode and trade. Within-zone flows remain
                  visible.
                </p>
                <Table
                  key={JSON.stringify(filters)}
                  columns={[
                    { label: "Origin → destination" },
                    { label: "Mode" },
                    { label: "Trade" },
                    { label: "Tonnage (ktons)", format: "decimal" },
                    { label: "Value (M 2017 USD)", format: "decimal" },
                    { label: "Ton-miles (M)", format: "decimal" },
                    { label: "Fact records" },
                  ]}
                  rows={lanes
                    .sort((a, b) => b[measure] - a[measure])
                    .map((r) => [
                      `${r.origin} → ${r.destination}`,
                      r.mode,
                      r.trade,
                      r.tons,
                      r.value,
                      r.miles,
                      r.records,
                    ])}
                  search={search}
                  onSearch={setSearch}
                  caption="Every matching lane-trade record · no top-N truncation"
                  filename="freightflow-lanes.csv"
                />
              </Panel>
            </>
          ))}
        {tab === 2 && (
          <>
            <Panel
              title="Mode shares"
              eyebrow="Tonnage denominator removes only the mode filter"
              className="study-full"
            >
              <Table
                key={JSON.stringify(filters) + "mode"}
                columns={[
                  { label: "Transport mode" },
                  { label: "Tonnage (ktons)", format: "decimal" },
                  { label: "Tonnage share", format: "percent" },
                  { label: "Value (M 2017 USD)", format: "decimal" },
                  { label: "Ton-miles (M)", format: "decimal" },
                ]}
                rows={freightGroups(data, effective, "mode").map((g) => [
                  g.label,
                  g.summary.tons,
                  ratio(
                    g.summary.tons,
                    freightSummary(data, { ...effective, mode: -1 }).tons,
                  ),
                  g.summary.value,
                  g.summary.miles,
                ])}
                onSelect={(r) =>
                  select(
                    "mode",
                    data.names.modes.findIndex((n) => n.label === r[0]),
                  )
                }
                caption="All modes · same year, trade and commodity; select a mode to filter"
                filename="freightflow-mode-shares.csv"
              />
            </Panel>
            <Panel title="Commodity detail" className="study-full">
              <Table
                key={JSON.stringify(filters) + "commodity"}
                columns={[
                  { label: "Commodity" },
                  { label: "Tonnage (ktons)", format: "decimal" },
                  { label: "Value (M 2017 USD)", format: "decimal" },
                  { label: "Ton-miles (M)", format: "decimal" },
                ]}
                rows={freightGroups(data, effective, "commodity")
                  .sort((a, b) => b.summary[measure] - a.summary[measure])
                  .map((g) => [
                    g.label,
                    g.summary.tons,
                    g.summary.value,
                    g.summary.miles,
                  ])}
                onSelect={(r) =>
                  select(
                    "commodity",
                    data.names.commodities.findIndex((n) => n.label === r[0]),
                  )
                }
                caption="All commodities · own commodity filter removed; select one to filter every view"
                filename="freightflow-commodities.csv"
              />
            </Panel>
          </>
        )}
        {tab === 3 && (
          <Panel
            title="Source-wide lane candidates"
            eyebrow="2024 baseline ≥1,000 ktons · modes 1–6 · positive endpoints"
            className="study-full"
          >
            <p className="analytics-small-note">
              {number(priorityRows.length)} candidates match the current
              trade/mode selection. Scores were calculated once across all
              positive-endpoint lane-trade records and do not rerank under
              filters.
            </p>
            {laneError ? (
              <Failure
                message={laneError}
                retry={() => {
                  setLaneError("");
                  setLaneAttempt((n) => n + 1);
                }}
              />
            ) : !priorities ? (
              <Loading />
            ) : (
              <Table
                key={`priorities-${filters.trade}-${filters.mode}`}
                columns={[
                  { label: "Origin → destination" },
                  { label: "Mode" },
                  { label: "Trade" },
                  { label: "2024 ktons", format: "decimal" },
                  { label: "2030 ktons", format: "decimal" },
                  { label: "2050 ktons", format: "decimal" },
                  { label: "CAGR 2024–2050", format: "percent" },
                  { label: "Global index", format: "decimal", digits: 4 },
                ]}
                rows={priorityRows.map((r) => [
                  `${data.names.zones[r[0]].label} → ${data.names.zones[r[1]].label}`,
                  data.names.modes[r[2]].label,
                  data.names.trades[r[3]].label,
                  ...r.slice(4),
                ])}
                caption="Full eligible candidate population · fixed global index, not an optimizer or evidence of shortage"
                filename="freightflow-source-candidates.csv"
              />
            )}
          </Panel>
        )}
        {tab === 4 && (
          <>
            <Panel
              title="Growth scenario comparison"
              eyebrow="Matching trade, mode and commodity across source years"
              className="study-full"
            >
              <Plot
                points={years}
                title={
                  measure === "tons"
                    ? "Thousand tons"
                    : measure === "value"
                      ? "Million 2017 USD"
                      : "Million ton-miles"
                }
                format={valueFormat}
              />
              <div className="nova-facts">
                <p>
                  2024 estimate<strong>{decimal(start.tons)} ktons</strong>
                </p>
                <p>
                  2050 source scenario<strong>{decimal(end.tons)} ktons</strong>
                </p>
                <p>
                  Scenario tonnage change
                  <strong>
                    {percent(ratio(end.tons - start.tons, start.tons))}
                  </strong>
                </p>
                <p>
                  Annualized 26-year change
                  <strong>
                    {percent(
                      start.tons > 0 && end.tons > 0
                        ? (end.tons / start.tons) ** (1 / 26) - 1
                        : null,
                    )}
                  </strong>
                </p>
              </div>
            </Panel>
            <Panel title="Scenario detail" className="study-full">
              <Table
                columns={[
                  { label: "Year / source role" },
                  { label: "Tonnage (ktons)", format: "decimal" },
                  { label: "Value (M 2017 USD)", format: "decimal" },
                  { label: "Ton-miles (M)", format: "decimal" },
                ]}
                rows={data.years.map((year) => {
                  const s = freightSummary(data, { ...effective, year });
                  return [
                    `${year} · ${year === 2024 ? "estimate" : "source forecast"}`,
                    s.tons,
                    s.value,
                    s.miles,
                  ];
                })}
                caption="Separate annual populations · never sum estimate and forecast years into realized annual freight"
                filename="freightflow-scenarios.csv"
              />
            </Panel>
          </>
        )}
        {tab === 5 && (
          <>
            <Panel
              title="Definitions, model and validation"
              className="study-full"
            >
              <ul className="study-notes">
                <li>
                  The source contains 2,671,386 regional records. Repeated
                  origin/destination/commodity/mode/trade/year keys are summed
                  into 3,950,145 fact cells across the three years.
                </li>
                <li>
                  Tonnage is in thousand tons, freight value in millions of
                  constant 2017 USD, and activity in million ton-miles. Value
                  density divides summed value by summed tonnage.
                </li>
                <li>
                  All 27 raw-source year/trade metric totals reconcile.
                  Fixed-point six-decimal source units prevent floating
                  accumulation drift in browser sums.
                </li>
                <li>
                  Lane detail is loaded only when requested, partitioned by
                  commodity. The explorer covers every matching lane; it is not
                  the Excel workbook’s top-250 shortlist.
                </li>
                <li>
                  The candidate index multiplies global CAGR and value-density
                  percentiles. Scores remain fixed under filters. Eligible
                  candidates have positive endpoints, ≥1,000 baseline ktons and
                  modes 1–6.
                </li>
                <li>
                  Within-zone flows are regional freight, not necessarily
                  intercity corridors. Obtain actual capacity, utilization, cost
                  and service evidence before acting.
                </li>
                <li>
                  The {data.report_pages.length} saved Power BI pages, measures
                  and model were reviewed. Native Desktop refresh was not rerun
                  for this website integration.
                </li>
              </ul>
            </Panel>
            <Panel title="Report scope" className="study-full">
              <Table
                columns={[
                  { label: "Saved Power BI page" },
                  { label: "Website treatment" },
                ]}
                rows={data.report_pages.map((p) => [
                  p,
                  "Full-source aggregates, explicit units and responsive drill-down views",
                ])}
                caption="Saved report definitions reviewed against source outputs"
                filename="freightflow-report-review.csv"
              />
            </Panel>
          </>
        )}
      </div>
    </Frame>
  );
}

export default function OperationsDashboard({
  project,
}: {
  project: OperationsSlug;
}) {
  return project === "civicpulse" ? <CivicDashboard /> : <FreightDashboard />;
}
