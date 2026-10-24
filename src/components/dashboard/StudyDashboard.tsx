"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Moon, RotateCcw, Sun } from "lucide-react";
import {
  FinanceBento,
  DashboardPanel as Panel,
  DashboardStat as Stat,
} from "@/components/ui/finance-bento";
import {
  formatStudy as f,
  loadStudyCube,
  loadStudyData,
  studyDashboards,
} from "@/lib/study-dashboards";
import type {
  MetricFormat,
  StudyData,
  StudySlice,
  StudySlug,
  StudyTable,
} from "@/lib/study-dashboards";
import { useDashboardTheme } from "./DashboardThemeShell";
import {
  StudyBars,
  StudyDataTable,
  StudyGauge,
  StudyTrend,
} from "./StudyCharts";
import { DashboardProjectLinks } from "./DashboardProjectLinks";
import { deriveStudySlice } from "@/lib/study-crossfilter";
import type { StudyCube, StudyFocus } from "@/lib/study-crossfilter";

interface StudyActions {
  focus: StudyFocus;
  measure: string;
  selection: string[];
  selectFocus: (kind: string, value: string) => void;
  setMeasure: (value: string) => void;
  statFor: (
    label: string,
  ) => { onClick: () => void; active: boolean } | undefined;
}
const StudyActionsContext = createContext<StudyActions | null>(null);
const tableNumber = (value: string | number | null) =>
  typeof value === "number" ? value : null;

function Fact({
  label,
  value,
  format = "number",
  note = "",
}: {
  label: string;
  value: number | null | undefined;
  format?: MetricFormat;
  note?: string;
}) {
  const actions = useContext(StudyActionsContext);
  return (
    <Stat
      label={label}
      value={f(value, format)}
      note={note}
      {...actions?.statFor(label)}
    />
  );
}

function PilotScenario({ slice }: { slice: StudySlice }) {
  const presets = {
    Conservative: { reduction: 10, minutes: 10, hourly: 25, cost: 20000 },
    Base: { reduction: 20, minutes: 15, hourly: 35, cost: 20000 },
    Stretch: { reduction: 30, minutes: 20, hourly: 45, cost: 20000 },
  };
  const [name, setName] = useState("Base");
  const [inputs, setInputs] = useState(presets.Base);
  const extra = slice.facts.extra_completions ?? 0;
  const hours = (((extra * inputs.reduction) / 100) * inputs.minutes) / 60;
  const gross = hours * inputs.hourly;
  return (
    <>
      <Panel
        title="Test a pilot assumption"
        eyebrow="Decision exercise · hypothetical capacity value"
        className="study-full"
      >
        <p className="study-copy">
          Observed extra completions stay fixed. Change the assumptions to
          explore potential capacity value for the selected application cohort.
          These are the original report presets; no intervention has been
          measured.
        </p>
        <div
          className="study-segments"
          role="group"
          aria-label="Scenario presets"
        >
          {Object.entries(presets).map(([key, value]) => (
            <button
              type="button"
              key={key}
              aria-pressed={name === key}
              onClick={() => {
                setInputs(value);
                setName(key);
              }}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="study-scenario-inputs">
          {(
            [
              ["reduction", "Avoidable completion share (%)", 0, 100, 1],
              ["minutes", "Minutes per completion", 0, 120, 1],
              ["hourly", "Capacity value (EUR/hour)", 0, 500, 1],
              ["cost", "Implementation cost (EUR)", 0, 1000000, 100],
            ] as const
          ).map(([key, label, min, max, step]) => (
            <label key={key}>
              <span>{label}</span>
              <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={inputs[key]}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) {
                    setInputs((v) => ({
                      ...v,
                      [key]: Math.max(min, Math.min(max, n)),
                    }));
                    setName("Custom");
                  }
                }}
              />
            </label>
          ))}
        </div>
        <div className="study-live-note" aria-live="polite">
          {name} assumptions · {f(extra)} observed extra completions ·{" "}
          {f(inputs.reduction / 100, "percent")} assumed reduction
        </div>
      </Panel>
      <div className="analytics-kpi-grid study-full">
        <Fact
          label="Modeled capacity"
          value={hours}
          format="score"
          note="Hours · not measured labour time"
        />
        <Fact
          label="Gross capacity value"
          value={gross}
          format="euro"
          note="Before implementation and ongoing costs"
        />
        <Fact
          label="Implementation cost"
          value={inputs.cost}
          format="euro"
          note="Assumption from the report; editable"
        />
        <Fact
          label="Net modeled value"
          value={gross - inputs.cost}
          format="euro"
          note="Not achieved savings; ongoing costs excluded"
        />
      </div>
      <Panel title="Decision context" className="study-full">
        <p className="study-copy">
          The full-population Base scenario produces EUR 8,900.50 of gross
          capacity value against EUR 20,000 of assumed implementation cost. A
          negative net value supports reviewing the problem and cost assumptions
          before recommending rollout. Repeated work can be legitimate.
        </p>
      </Panel>
    </>
  );
}

function PathDetail({ table }: { table: StudyTable }) {
  const actions = useContext(StudyActionsContext);
  const [selected, setSelected] = useState("");
  const row = table.rows.find((r) => r[0] === selected) ?? table.rows[0];
  return (
    <>
      <Panel
        title="Most common exact paths"
        eyebrow="Up to 20 paths · ranked within the selected cohort"
        className="study-full"
      >
        <StudyDataTable
          data={table}
          caption="Select a path to filter related views and read its recorded steps"
          onSelect={(r) => {
            setSelected(String(r[0]));
            actions?.selectFocus("path", String(r[0]));
          }}
        />
      </Panel>
      {row && (
        <Panel
          title={String(row[0])}
          eyebrow={`${f(tableNumber(row[1]))} applications · ${f(tableNumber(row[2]), "percent")} of cohort`}
          className="study-full"
        >
          <ol className="study-path">
            {String(row[3])
              .split(" → ")
              .map((step, i) => (
                <li key={i}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {step}
                </li>
              ))}
          </ol>
        </Panel>
      )}
    </>
  );
}

function CaseInvestigation({ slice }: { slice: StudySlice }) {
  const [selected, setSelected] = useState(0);
  const samples = slice.samples ?? [];
  const sample = samples[selected] ?? samples[0];
  return (
    <Panel
      title="Read an application history"
      eyebrow="Deterministic source examples · anonymized labels"
      className="study-full"
    >
      <p className="study-copy">
        Up to three preserved source examples matching the current cohort. These
        are a bounded investigation sample, not an exhaustive case browser;
        resource identities and source application IDs are omitted.
      </p>
      <div
        className="study-segments"
        role="group"
        aria-label="Application examples"
      >
        {samples.map((s, i) => (
          <button
            key={s.label}
            type="button"
            aria-pressed={sample === s}
            onClick={() => setSelected(i)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {sample ? (
        <>
          <div className="study-sample-summary">
            <span>
              {sample.type} · {sample.goal}
            </span>
            <strong>{sample.status}</strong>
            <span>{f(sample.days, "days")} · resolved duration</span>
          </div>
          <ol className="study-timeline">
            {sample.events.map((e, i) => (
              <li key={i}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{e.activity}</strong>
                  <time>{e.time} UTC</time>
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="analytics-empty">
          No preserved application example is available for this selection.
        </p>
      )}
    </Panel>
  );
}

function RouteDetail({ slice }: { slice: StudySlice }) {
  const actions = useContext(StudyActionsContext);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const table = slice.tables.route_detail ?? slice.tables.routes;
  const rows = table.rows.filter((row) =>
    String(row[0]).toLowerCase().includes(query.toLowerCase()),
  );
  const row = rows.find((r) => r[0] === selected) ?? rows[0];
  return (
    <>
      <Panel
        title="Investigate a ranked source-code route"
        eyebrow={
          slice.tables.route_detail
            ? "Selected route · the minimum-volume rule applies to rankings only"
            : "Top 20 routes by >15-minute delay rate · at least 1,000 scheduled observations"
        }
        className="study-full"
      >
        <label className="study-search">
          <span>Search the ranked routes in this cohort</span>
          <input
            type="search"
            placeholder="e.g. LGA"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <StudyDataTable
          data={{ ...table, rows }}
          caption="Select a route to inspect its cohort metrics"
          onSelect={(r) => {
            setSelected(String(r[0]));
            actions?.selectFocus("route", String(r[0]));
          }}
        />
      </Panel>
      {row && (
        <>
          <div className="analytics-kpi-grid study-full">
            <Fact label={`${row[0]} · scheduled`} value={tableNumber(row[1])} />
            <Fact
              label="Eligible arrivals"
              value={tableNumber(row[2])}
              note="Arrival-rate denominator"
            />
            <Fact
              label="Delay >15 minutes"
              value={tableNumber(row[3])}
              format="percent"
            />
            <Fact
              label="Cancellation rate"
              value={tableNumber(row[4])}
              format="percent"
            />
          </div>
          <Panel
            title={`${row[0]} · reliability context`}
            className="study-full"
          >
            <p className="study-copy">
              Severe arrival delay: {f(tableNumber(row[5]), "percent")}. Mean
              arrival delay: {f(tableNumber(row[6]), "minutes")}. Custom
              reliability index: {f(tableNumber(row[7]), "score")} / 100. This
              index is max(0, 100 − 50 × delay &gt;15m rate − 50 × cancellation
              rate). Source codes remain unharmonized, including numeric October
              identifiers.
            </p>
          </Panel>
        </>
      )}
    </>
  );
}

function Method({ data }: { data: StudyData }) {
  const config = studyDashboards[data.project];
  return (
    <>
      <Panel
        title="How to read this analysis"
        eyebrow="Scope and interpretation"
        className="study-full"
      >
        <ul className="study-notes">
          {data.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </Panel>
      <Panel
        title="Data reconciliation"
        eyebrow="Checks performed when building these website aggregates"
      >
        <ul className="study-notes">
          {data.validation.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="study-copy">
          These checks validate the website’s source-derived calculations. They
          do not constitute a fresh Excel or Power BI Desktop refresh.
        </p>
      </Panel>
      <Panel
        title="Source lineage"
        eyebrow={`${data.sources.length} read-only inputs · SHA-256 recorded`}
      >
        <p className="study-copy">
          Prepared{" "}
          {new Date(data.prepared_at).toLocaleDateString("en-GB", {
            timeZone: "UTC",
          })}
          . Source file hashes were checked again after extraction.
        </p>
        <a
          className="study-repo-link"
          href={config.repo}
          target="_blank"
          rel="noopener noreferrer"
        >
          Project repository <ArrowUpRight size={15} />
        </a>
        <details className="study-provenance">
          <summary>Inspect input file fingerprints</summary>
          {data.sources.map((source) => (
            <div key={source.file}>
              <span>{source.file}</span>
              <code>{source.sha256}</code>
            </div>
          ))}
        </details>
      </Panel>
    </>
  );
}

function ReportContent({
  project,
  tab,
  data,
  slice,
  select,
}: {
  project: StudySlug;
  tab: string;
  data: StudyData;
  slice: StudySlice;
  select: (index: number, value: string) => void;
}) {
  const config = studyDashboards[project];
  const actions = useContext(StudyActionsContext);
  const kinds: Record<string, string> = {
    quality: "quality",
    employment: "employment",
    skills: "skill",
    flags: "rule",
    repetition: "repetition",
    goals: "goal",
    milestones: "milestone",
    repeats: "activity",
    durations: "duration",
    routes: "route",
    origins: "origin",
    destinations: "destination",
  };
  const bars = (
    key: string,
    format: MetricFormat = "number",
    onSelect?: (label: string) => void,
  ) => (
    <StudyBars
      data={slice.rankings[key] ?? []}
      format={format}
      onSelect={
        onSelect ??
        (key === "attribution"
          ? (value) => actions?.setMeasure(`cause:${value}`)
          : kinds[key]
            ? (value) => actions?.selectFocus(kinds[key], value)
            : undefined)
      }
      selectedLabel={
        key === "roles" || key === "carriers"
          ? actions?.selection[0]
          : key === "attribution"
            ? actions?.measure.replace("cause:", "")
            : actions?.focus[kinds[key]]
      }
      countLabel={
        key === "roles" ? "exact text groups" : "scheduled observations"
      }
      limit={tab === "Overview" ? 6 : 10}
    />
  );
  const chartSelect = (index: number, value: string) =>
    select(index, actions?.selection[index] === value ? "All" : value);
  const trendSelection = (value: string) =>
    project === "job-market"
      ? actions?.selectFocus("date", value)
      : chartSelect(1, value);
  const trendTitle = slice.trend_title ?? config.trendTitle;
  const trendFormat = slice.trend_format ?? config.trendFormat;
  const gaugeSelection = (value: string) =>
    project === "job-market"
      ? actions?.selectFocus("salary", value)
      : project === "loanflow"
        ? actions?.selectFocus("milestone", value)
        : actions?.setMeasure(value === "On time ≤15m" ? "ontime" : "late");
  const tbl = (key: string, caption: string) => (
    <StudyDataTable data={slice.tables[key]} caption={caption} />
  );
  if (tab === "Method & quality") return <Method data={data} />;
  if (tab === "Overview")
    return (
      <>
        <div className="study-hero-grid study-full">
          <Panel
            title={slice.hero.label}
            eyebrow="Selected source population"
            className="bento-blue study-hero-card"
          >
            <div className="study-hero-number">
              {f(slice.hero.value, slice.hero.format)}
            </div>
            <p className="study-hero-note">{slice.hero.note}</p>
            <div className="study-hero-chart-heading">
              <h4>{trendTitle}</h4>
              <span>
                {trendFormat === "percent"
                  ? "Rate"
                  : trendFormat === "number"
                    ? "Observed count"
                    : "Selected measure"}
              </span>
            </div>
            <StudyTrend
              data={slice.trend}
              format={trendFormat}
              title={trendTitle}
              onSelect={trendSelection}
              selectedLabel={
                project === "job-market"
                  ? actions?.focus.date
                  : actions?.selection[1]
              }
            />
          </Panel>
          <Panel
            title={
              project === "loanflow"
                ? "Recorded milestones"
                : project === "airops"
                  ? "Arrival reliability"
                  : "Pay visibility"
            }
            eyebrow={
              project === "airops"
                ? `${f(slice.facts.arrived)} eligible arrivals`
                : "Within the current cohort"
            }
            className="bento-graph"
          >
            <StudyGauge
              {...slice.gauge}
              onSelect={gaugeSelection}
              selectedLabel={
                project === "airops"
                  ? actions?.measure === "ontime"
                    ? "On time ≤15m"
                    : actions?.measure === "late"
                      ? "Late >15m"
                      : undefined
                  : actions?.focus[
                      project === "job-market" ? "salary" : "milestone"
                    ]
              }
            />
          </Panel>
        </div>
        <div className="analytics-kpi-grid study-full">
          {slice.metrics.map((m) => (
            <Stat
              key={m.label}
              label={m.label}
              value={f(m.value, m.format)}
              note={m.note}
              {...actions?.statFor(m.label)}
            />
          ))}
        </div>
        <Panel
          title={
            project === "job-market"
              ? "Posting observations by role"
              : project === "loanflow"
                ? "Application purpose"
                : "Carrier cancellation rate"
          }
          eyebrow={
            project === "airops"
              ? "Six highest rates · select a carrier · full list under Carriers & routes"
              : project === "job-market"
                ? "Select a role to filter the workspace"
                : "Six largest purposes · counts in the selected cohort"
          }
        >
          {bars(
            project === "job-market"
              ? "roles"
              : project === "loanflow"
                ? "goals"
                : "carriers",
            project === "airops" ? "percent" : "number",
            project === "job-market" || project === "airops"
              ? (v) => chartSelect(0, v)
              : undefined,
          )}
        </Panel>
        <Panel
          title={
            project === "job-market"
              ? "Representative information quality"
              : project === "loanflow"
                ? "Extra completed work by activity"
                : "Recorded delay attribution"
          }
          eyebrow={
            project === "job-market"
              ? "Exact text groups · rule-based scores"
              : project === "loanflow"
                ? "Investigative proxy · not automatically avoidable"
                : "Minutes · not proven root cause"
          }
          className="bento-pink"
        >
          {bars(
            project === "job-market"
              ? "quality"
              : project === "loanflow"
                ? "repeats"
                : "attribution",
          )}
        </Panel>
      </>
    );
  if (project === "job-market") {
    if (tab === "Pay & information")
      return (
        <>
          <div className="analytics-kpi-grid study-full">
            <Fact
              label="Numeric salary observations"
              value={slice.facts.numeric_salary}
            />
            <Fact
              label="Numeric salary disclosure"
              value={slice.gauge.value}
              format="percent"
              note="Minimum, maximum or median present"
            />
            <Fact
              label="Parsed numeric experience"
              value={slice.facts.experience_coverage}
              format="percent"
              note="Missing experience remains unknown"
            />
            <Fact
              label="Confirmed remote permission"
              value={slice.facts.remote_share}
              format="percent"
              note="Missing permission is not on-site"
            />
          </div>
          <Panel
            title="Pay disclosure by currency and period"
            className="study-full"
          >
            {tbl(
              "pay",
              "Numeric disclosure counts; currencies and pay periods are not combined",
            )}
          </Panel>
          <Panel title="Employment arrangements" eyebrow="Posting observations">
            {bars("employment")}
          </Panel>
          <Panel
            title="Matched skill vocabulary"
            eyebrow="Distinct visible text groups per skill · groups can have multiple skills"
          >
            {bars("skills")}
          </Panel>
        </>
      );
    if (tab === "Entry expectations")
      return (
        <>
          <div className="analytics-kpi-grid study-full">
            <Fact
              label="Entry-title text groups"
              value={slice.facts.entry_groups}
            />
            <Fact
              label="Parsed minimum 2+ years"
              value={slice.facts.entry_two_plus}
            />
            <Fact
              label="Share of entry-title groups"
              value={slice.facts.entry_share}
              format="percent"
              note="All entry-title groups are the denominator"
            />
            <Fact
              label="Numeric experience coverage"
              value={slice.facts.experience_coverage}
              format="percent"
              note="Within selected posting observations"
            />
          </div>
          <Panel
            title="Entry-title review by role"
            eyebrow="A review signal, not evidence of deception"
            className="study-full"
          >
            {tbl(
              "entry",
              "Explicit entry titles with parsed minimum requirements of two or more years",
            )}
            <p className="study-copy">
              A missing experience requirement is unknown. A rule flag does not
              establish that a requirement is unreasonable, and these results do
              not validate fake-job detection.
            </p>
          </Panel>
        </>
      );
    if (tab === "Exact repetition")
      return (
        <>
          <div className="analytics-kpi-grid study-full">
            <Fact
              label="Posting observations"
              value={slice.facts.observations}
            />
            <Fact label="Exact text groups" value={slice.facts.groups} />
            <Fact
              label="Repeated text groups"
              value={slice.facts.repeated_groups}
            />
            <Fact
              label="Extra observation share"
              value={slice.facts.repeat_share}
              format="percent"
              note="Extra observations / all observations"
            />
          </div>
          <Panel title="Exact text repetition" eyebrow="Group counts">
            {bars("repetition")}
          </Panel>
          <Panel title="What repetition means">
            <p className="study-copy">
              Exact matching uses normalized company, title, location and
              cleaned description. An extra observation comes after the first
              observation in a group. Reused text can describe legitimate
              vacancies; edited copies can escape exact matching.
            </p>
            <StudyTrend
              data={slice.trend}
              format={trendFormat}
              title={trendTitle}
              onSelect={trendSelection}
            />
          </Panel>
        </>
      );
    return (
      <>
        <Panel
          title="Visible information-quality rules"
          eyebrow="Flag instances within visible text groups"
        >
          {bars("flags")}
        </Panel>
        <Panel title="Quality review population">
          <Fact
            label="Groups recommended for review"
            value={slice.facts.review_groups}
            note="Representative group scores, not verified misconduct"
          />
          <p className="study-copy">
            Review rules are transparent heuristics. The table below contains up
            to 12 matching records from a preserved representative review
            sample, ordered by quality score.
          </p>
        </Panel>
        <Panel title="Representative review examples" className="study-full">
          {tbl(
            "review",
            "Preserved representative records matching this selection; not an exhaustive list",
          )}
        </Panel>
      </>
    );
  }
  if (project === "loanflow") {
    if (tab === "Durations & signals")
      return (
        <>
          <div className="analytics-kpi-grid study-full">
            <Fact label="Resolved applications" value={slice.facts.resolved} />
            <Fact label="Unresolved at cutoff" value={slice.facts.unresolved} />
            <Fact
              label="Mean resolution"
              value={slice.facts.mean_days}
              format="days"
              note="Resolved only · calendar time"
            />
            <Fact
              label="Mean unresolved age"
              value={slice.facts.unresolved_age}
              format="days"
              note="Censored population · separate from resolution"
            />
          </div>
          <Panel
            title="Resolution distribution"
            eyebrow="Resolved applications only"
          >
            {bars("durations")}
          </Panel>
          <Panel title="Offers and acceptance signals">
            <Fact
              label="Acceptance signal share"
              value={slice.facts.acceptance_share}
              format="percent"
              note="Among applications with an offer; not proof of funding"
            />
            <Fact
              label="Multiple-offer share"
              value={slice.facts.multi_offer_share}
              format="percent"
              note="Among applications with an offer"
            />
          </Panel>
          <Panel title="Signal comparisons" className="study-full">
            {tbl("signals", "Observed differences are not causal effects")}
          </Panel>
        </>
      );
    if (tab === "Process paths")
      return (
        <>
          <div className="analytics-kpi-grid study-full">
            <Fact label="Distinct exact paths" value={slice.facts.path_count} />
            <Fact
              label="Top 20 path coverage"
              value={slice.facts.top_twenty_share}
              format="percent"
            />
            <Fact label="Recorded events" value={slice.facts.event_count} />
            <Fact
              label="Extra completed W_ records"
              value={slice.facts.extra_completions}
            />
          </div>
          <PathDetail table={slice.tables.paths} />
          <Panel
            title="Full-source transition gaps"
            eyebrow="Global context · application cohort filters do not apply"
            className="study-full"
          >
            {data.transitions && (
              <StudyDataTable
                data={data.transitions}
                caption="15 largest mean elapsed gaps · calendar hours, not proven queue time"
              />
            )}
          </Panel>
        </>
      );
    if (tab === "Case investigation")
      return <CaseInvestigation slice={slice} />;
    return <PilotScenario slice={slice} />;
  }
  if (tab === "Carriers & routes")
    return (
      <>
        <Panel
          title="Carrier comparison"
          eyebrow="Cancellation rate · scheduled volume shown"
        >
          {bars("carriers", "percent", (v) => chartSelect(0, v))}
        </Panel>
        <Panel
          title="Routes with higher delay rates"
          eyebrow="At least 1,000 scheduled observations · up to 10 of the top 20"
        >
          {bars("routes", "percent")}
        </Panel>
        <Panel title="Carrier details" className="study-full">
          {tbl("carriers", "Arrival and scheduled denominators kept separate")}
        </Panel>
        <Panel title="Ranked route detail" className="study-full">
          {tbl("routes", "Top 20 source-code routes by >15-minute delay rate")}
        </Panel>
      </>
    );
  if (tab === "Airport patterns")
    return (
      <>
        <div className="analytics-kpi-grid study-full">
          <Fact
            label="Numeric airport ID rows"
            value={slice.facts.numeric_airport_rows}
            note="Unresolved October identifiers retained"
          />
          <Fact
            label="Numeric airport share"
            value={slice.facts.numeric_share}
            format="percent"
          />
          <Fact label="Eligible arrivals" value={slice.facts.arrived} />
          <Fact label="Scheduled observations" value={slice.facts.scheduled} />
        </div>
        <Panel
          title="Origin severe-delay patterns"
          eyebrow="Source code · >60m / eligible arrivals · minimum 1,000 scheduled"
        >
          {bars("origins", "percent")}
        </Panel>
        <Panel
          title="Destination severe-delay patterns"
          eyebrow="Source code · >60m / eligible arrivals · minimum 1,000 scheduled"
        >
          {bars("destinations", "percent")}
        </Panel>
        <Panel title="Airport-code context" className="study-full">
          <p className="study-copy">
            October’s numeric airport identifiers are unresolved. These
            source-code rankings preserve that limitation; numeric codes are not
            matched to named airports and are not silently combined with IATA
            codes from other months.
          </p>
        </Panel>
      </>
    );
  if (tab === "Recorded attribution")
    return (
      <>
        <Panel
          title="Recorded attribution minutes"
          eyebrow="Observed source categories · selected carrier/month"
        >
          {bars("attribution")}
        </Panel>
        <Panel title="Share of recorded attribution">
          <StudyGauge
            label="Late-aircraft share"
            value={
              slice.facts.attribution_minutes
                ? (slice.rankings.attribution.find(
                    (x) => x.label === "Late aircraft",
                  )?.value ?? 0) / slice.facts.attribution_minutes
                : null
            }
            segments={slice.rankings.attribution}
            onSelect={(value) => actions?.setMeasure(`cause:${value}`)}
          />
        </Panel>
        <Panel title="Attribution limits" className="study-full">
          <p className="study-copy">
            {f(slice.facts.attribution_minutes)} recorded category minutes in
            the selected cohort. Recorded attribution is not proof of root
            cause, controllability or recoverable cost. Missing attribution
            fields are not evidence that a cause did not occur.
          </p>
        </Panel>
      </>
    );
  if (tab === "Time & seasonality")
    return (
      <>
        <Panel title={trendTitle} className="bento-blue">
          <StudyTrend
            data={slice.trend}
            format={trendFormat}
            title={trendTitle}
            onSelect={trendSelection}
          />
        </Panel>
        <Panel
          title="Scheduled local departure hour"
          eyebrow="Mean eligible arrival delay · minutes; early arrivals can make values negative"
        >
          <StudyTrend
            data={slice.rankings.hours}
            format="minutes"
            title="Mean arrival delay by scheduled local departure hour"
          />
          <details>
            <summary className="study-copy">
              Inspect hourly counts and values
            </summary>
            <StudyDataTable
              data={{
                columns: [
                  "Local departure hour",
                  "Scheduled observations",
                  "Mean delay (min)",
                ],
                rows: slice.rankings.hours.map((p) => [
                  p.label,
                  p.count ?? 0,
                  p.value,
                ]),
              }}
              caption="All observed scheduled local departure hours in the selected cohort"
            />
          </details>
        </Panel>
        <Panel title="Monthly context" className="study-full">
          {tbl(
            "months",
            "Current selections; arrival metrics use eligible outcomes",
          )}
        </Panel>
      </>
    );
  return <RouteDetail slice={slice} />;
}

export default function StudyDashboard({ project }: { project: StudySlug }) {
  const config = studyDashboards[project];
  const { theme, toggleTheme } = useDashboardTheme();
  const [data, setData] = useState<StudyData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selection, setSelection] = useState(["All", "All"]);
  const [tab, setTab] = useState<string>("Overview");
  const [focus, setFocus] = useState<StudyFocus>({});
  const [measure, setPrimaryMeasure] = useState("default");
  const [cube, setCube] = useState<StudyCube | null>(null);
  const [hourly, setHourly] = useState<StudyCube | null>(null);
  const [relatedError, setRelatedError] = useState("");
  const [relatedAttempt, setRelatedAttempt] = useState(0);
  const needsCube = Object.keys(focus).length > 0 || measure !== "default";
  const needsHourly =
    needsCube && project === "airops" && tab === "Time & seasonality";
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () =>
        controller.abort(
          new Error("The study request timed out. Please retry."),
        ),
      20000,
    );
    loadStudyData(project, controller.signal)
      .then(setData)
      .catch((reason: unknown) => {
        if (
          !controller.signal.aborted ||
          controller.signal.reason?.message?.includes("timed out")
        )
          setError(
            reason instanceof Error
              ? reason.message
              : "The study could not be loaded.",
          );
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [project, attempt]);
  useEffect(() => {
    if (!needsCube || cube) return;
    const controller = new AbortController();
    const timer = window.setTimeout(
      () =>
        controller.abort(
          new Error("Related-data request timed out. Please retry."),
        ),
      30000,
    );
    loadStudyCube(project, "crossfilter", controller.signal)
      .then(setCube)
      .catch((reason: unknown) => {
        if (
          !controller.signal.aborted ||
          controller.signal.reason?.message?.includes("timed out")
        )
          setRelatedError(
            reason instanceof Error
              ? reason.message
              : "Related data could not be loaded.",
          );
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [project, needsCube, cube, relatedAttempt]);
  useEffect(() => {
    if (!needsHourly || hourly) return;
    const controller = new AbortController();
    const timer = window.setTimeout(
      () =>
        controller.abort(
          new Error("Hourly-data request timed out. Please retry."),
        ),
      30000,
    );
    loadStudyCube(project, "hourly", controller.signal)
      .then(setHourly)
      .catch((reason: unknown) => {
        if (
          !controller.signal.aborted ||
          controller.signal.reason?.message?.includes("timed out")
        )
          setRelatedError(
            reason instanceof Error
              ? reason.message
              : "Hourly data could not be loaded.",
          );
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [project, needsHourly, hourly, relatedAttempt]);
  const select = (index: number, value: string) =>
    setSelection((current) => current.map((v, i) => (i === index ? value : v)));
  const selectFocus = (kind: string, value: string) =>
    setFocus((current) => {
      const next = { ...current };
      if (next[kind] === value) delete next[kind];
      else next[kind] = value;
      return next;
    });
  const setMeasure = (value: string) =>
    setPrimaryMeasure((current) => (current === value ? "default" : value));
  const reset = () => {
    setSelection(["All", "All"]);
    setFocus({});
    setPrimaryMeasure("default");
    setRelatedError("");
  };
  const baseline = data?.slices[JSON.stringify(selection)];
  const slice = useMemo(
    () =>
      baseline && needsCube && cube
        ? deriveStudySlice(
            cube,
            selection,
            focus,
            measure,
            baseline,
            hourly ?? undefined,
          )
        : baseline,
    [baseline, needsCube, cube, selection, focus, measure, hourly],
  );
  const statFor: StudyActions["statFor"] = (label) => {
    const measures: Record<string, string> = {
      "Exact text groups": "groups",
      "Representative JD quality": "quality",
      "Median resolution": "median",
      "P90 resolution": "p90",
      "Mean resolution": "mean",
      "Cancellation rate": "cancel",
      "Severe arrival delay": "severe",
      "Mean arrival delay": "mean",
      "Diversion rate": "diversion",
    };
    const selections: Record<string, [string, string]> = {
      "Extra repeated observations": ["repetition", "Repeated text groups"],
      "Repeated text groups": ["repetition", "Repeated text groups"],
      "Extra observation share": ["repetition", "Repeated text groups"],
      "Confirmed remote permission": ["remote", "Confirmed remote"],
      "Numeric salary observations": ["salary", "Numeric salary"],
      "Numeric salary disclosure": ["salary", "Numeric salary"],
      "Parsed numeric experience": ["experience", "Parsed numeric experience"],
      "Numeric experience coverage": [
        "experience",
        "Parsed numeric experience",
      ],
      "Parsed minimum 2+ years": ["entry", "Entry titles with 2+ years"],
      "Share of entry-title groups": ["entry", "Entry titles with 2+ years"],
      "Groups recommended for review": ["quality", "Review Recommended"],
      "Incomplete-file signal": ["incomplete", "Incomplete-file signal"],
      "Repeated completed work": ["work", "Repeated completed work"],
      "Extra completed W_ records": ["work", "Repeated completed work"],
      "Resolved applications": ["milestone", "Resolved"],
      "Unresolved at cutoff": ["milestone", "Unresolved at cutoff"],
      "Acceptance signal share": ["offer", "Accepted signal"],
      "Multiple-offer share": ["offer", "Multiple offers"],
    };
    if (label === "Entry-title text groups")
      return {
        onClick: () => select(1, selection[1] === "entry" ? "All" : "entry"),
        active: selection[1] === "entry",
      };
    if (measures[label])
      return {
        onClick: () => setMeasure(measures[label]),
        active: measure === measures[label],
      };
    if (selections[label]) {
      const [kind, value] = selections[label];
      return {
        onClick: () => selectFocus(kind, value),
        active: focus[kind] === value,
      };
    }
    return undefined;
  };
  if (error)
    return (
      <div className="analytics-error" role="alert">
        <h2>Study data unavailable</h2>
        <p>{error}</p>
        <button
          type="button"
          onClick={() => {
            setError("");
            setAttempt((v) => v + 1);
          }}
        >
          Retry data request
        </button>
      </div>
    );
  if (!data || !slice)
    return (
      <div className="study-loading" role="status">
        <span />
        Preparing the source-derived analysis…
      </div>
    );
  return (
    <StudyActionsContext.Provider
      value={{ focus, measure, selection, selectFocus, setMeasure, statFor }}
    >
      <FinanceBento
        label={`${config.title} dashboard`}
        className={`analytics-dashboard study-dashboard study-${project}`}
      >
        <div className="study-workspace-heading">
          <div>
            <span className="study-status-dot" /> Analysis workspace{" "}
            <small>Historical source data</small>
          </div>
          <DashboardProjectLinks project={project} />
        </div>
        <div className="analytics-toolbar">
          <div className="analytics-filter-list">
            {data.filters.map((filter, index) => (
              <label className="analytics-filter" key={filter.key}>
                <span>{filter.label}</span>
                <select
                  value={selection[index]}
                  onChange={(e) => select(index, e.target.value)}
                >
                  <option value="All">
                    All{" "}
                    {filter.key === "month"
                      ? "months"
                      : filter.key === "carrier"
                        ? "carriers"
                        : filter.key === "role"
                          ? "roles"
                          : filter.key === "application_type"
                            ? "types"
                            : "seniorities"}
                  </option>
                  {filter.values.map((v) => (
                    <option key={v} value={v}>
                      {v}
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
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
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
          {config.tabs.map((name, i) => (
            <button
              type="button"
              role="tab"
              key={name}
              id={`study-tab-${i}`}
              aria-selected={tab === name}
              aria-controls="study-tabpanel"
              tabIndex={tab === name ? 0 : -1}
              onClick={() => setTab(name)}
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowRight"
                    ? (i + 1) % config.tabs.length
                    : event.key === "ArrowLeft"
                      ? (i + config.tabs.length - 1) % config.tabs.length
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? config.tabs.length - 1
                          : null;
                if (next !== null) {
                  event.preventDefault();
                  setTab(config.tabs[next]);
                  document.getElementById(`study-tab-${next}`)?.focus();
                }
              }}
            >
              {name}
            </button>
          ))}
        </nav>
        <div className="study-current-selection" aria-live="polite">
          <span>
            {selection.every((v) => v === "All")
              ? "Full source population"
              : selection.filter((v) => v !== "All").join(" · ")}
          </span>
          <span>{data.period}</span>
        </div>
        <div
          className="study-selection-chips"
          aria-label="Active chart selections"
          aria-live="polite"
        >
          {Object.entries(focus).map(([kind, value]) => (
            <button
              type="button"
              key={kind}
              onClick={() => selectFocus(kind, value)}
              aria-label={`Clear ${kind}: ${value}`}
            >
              {kind.replaceAll("_", " ")} · {value}{" "}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          {measure !== "default" && (
            <button
              type="button"
              onClick={() => setPrimaryMeasure("default")}
              aria-label="Restore default primary measure"
            >
              Primary measure · {measure.replace("cause:", "")}{" "}
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
        <p className="study-selection-help">
          Select a chart, legend or KPI to explore related views. Switching the
          primary measure changes the main trend; full-source panels retain
          their stated scope.
        </p>
        <div
          id="study-tabpanel"
          role="tabpanel"
          aria-labelledby={`study-tab-${config.tabs.findIndex((name) => name === tab)}`}
          aria-busy={(needsCube && !cube) || (needsHourly && !hourly)}
          className="study-grid"
        >
          {relatedError && needsCube ? (
            <div className="analytics-error study-full" role="alert">
              <p>{relatedError}</p>
              <button
                type="button"
                onClick={() => {
                  setRelatedError("");
                  setRelatedAttempt((v) => v + 1);
                }}
              >
                Retry related data
              </button>
              <button type="button" onClick={reset}>
                Clear selections
              </button>
            </div>
          ) : (needsCube && !cube) || (needsHourly && !hourly) ? (
            <div className="study-loading study-full" role="status">
              <span />
              Updating related views from the selected source records…
            </div>
          ) : (
            <ReportContent
              project={project}
              tab={tab}
              data={data}
              slice={slice}
              select={select}
            />
          )}
        </div>
        <div className="study-footnote">
          <p>{config.credit}{" "}<a href={config.sourceUrl} target="_blank" rel="noopener noreferrer">Dataset source</a>{" · "}<a href={config.licenseUrl} target="_blank" rel="noopener noreferrer">{config.license}</a></p>
          <p>
            {project === "airops"
              ? data.notes[0] + " " + data.notes[2]
              : data.notes[0]}
          </p>
          <Link href="/projects#analytics">
            Explore all analysis projects ↗
          </Link>
          <span>
            Design adapted from Finance Bento by{" "}
            <a
              href="https://vasnev.art"
              target="_blank"
              rel="noopener noreferrer"
            >
              vasnev.art
            </a>
          </span>
        </div>
      </FinanceBento>
    </StudyActionsContext.Provider>
  );
}
