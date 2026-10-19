"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { RankingDatum } from "@/lib/analytics-dashboards";
import { useId } from "react";

// Hash labels so categories retain their colors when rankings or filters change.
function categoryColor(label: string) {
  let hash = 0;
  for (const character of label) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0;
  return `var(--dash-series-${(hash >>> 0) % 6 + 1})`;
}

function ChartLegend({ distribution = false, selected }: { distribution?: boolean; selected?: boolean }) {
  return <p className="analytics-chart-legend"><i style={{ background: distribution ? "var(--dash-series-2)" : "var(--dash-series-1)" }} aria-hidden="true" />{distribution ? "Invoice counts by value band" : "Color identifies a category; length shows its value"}{selected && <><i className="is-selected" aria-hidden="true" />Outlined = selected</>}</p>;
}

interface ChartDatum extends RankingDatum {
  selected?: boolean;
}

export function ReportScatter({ data, xLabel, yLabel, formatX, formatY, formatAxisY, sizeLabel }: {
  data: Array<{ label: string; x: number; y: number; size: number }>;
  xLabel: string;
  yLabel: string;
  formatX: (value: number) => string;
  formatY: (value: number) => string;
  formatAxisY?: (value: number) => string;
  sizeLabel: string;
}) {
  if (!data.length) return <div className="analytics-empty">No observations for this selection.</div>;
  return <figure className="analytics-chart" aria-label={`${yLabel} versus ${xLabel}`}>
    <figcaption className="analytics-small-note">X: {xLabel} · Y: {yLabel} · point size: {sizeLabel}. Exact values are in the detail table.</figcaption>
    <ResponsiveContainer width="100%" height="85%">
      <ScatterChart margin={{ top: 15, right: 20, bottom: 10, left: 0 }} accessibilityLayer>
        <CartesianGrid stroke="var(--dash-chart-grid)" />
        <XAxis type="number" dataKey="x" name={xLabel} tickFormatter={formatX} tick={{ fill: "var(--dash-chart-axis-muted)", fontSize: 10 }} />
        <YAxis type="number" dataKey="y" name={yLabel} tickFormatter={formatAxisY ?? formatY} tick={{ fill: "var(--dash-chart-axis-muted)", fontSize: 10 }} width={75} />
        <ZAxis type="number" dataKey="size" name={sizeLabel} range={[35, 220]} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
          const point = payload?.[0]?.payload as typeof data[number] | undefined;
          return active && point ? <div className="analytics-scatter-tooltip"><strong>{point.label}</strong><p>{xLabel}: {formatX(point.x)}</p><p>{yLabel}: {formatY(point.y)}</p><p>{sizeLabel}: {new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(point.size)}</p></div> : null;
        }} />
        <Scatter data={data} fill="var(--dash-series-2)" fillOpacity={0.7} isAnimationActive={false} />
      </ScatterChart>
    </ResponsiveContainer>
  </figure>;
}

function KeyboardChoices({
  title,
  data,
  selectedLabel,
  onSelect,
  formatValue,
}: {
  title: string;
  data: ChartDatum[];
  selectedLabel?: string;
  onSelect?: (label: string) => void;
  formatValue: (value: number) => string;
}) {
  if (!onSelect || data.length === 0) return null;
  return (
    <details className="analytics-chart-choices">
      <summary>Choose {title.toLowerCase()} with keyboard</summary>
      <div className="analytics-chart-choice-list" role="group" aria-label={`${title} choices`}>
        {data.map((item) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={selectedLabel === item.label}
            onClick={() => onSelect(item.label)}
          >
            <span>{item.label}</span><strong>{formatValue(item.value)}</strong>
          </button>
        ))}
      </div>
    </details>
  );
}

export function TrendChart({
  data,
  valueLabel,
  formatValue,
  selectedLabel,
  onSelect,
}: {
  data: ChartDatum[];
  valueLabel: string;
  formatValue: (value: number) => string;
  selectedLabel?: string;
  onSelect?: (label: string) => void;
}) {
  const gradientId = useId().replaceAll(":", "");
  if (data.length === 0) return <div className="analytics-empty">No matching observations for these filters.</div>;
  return (
    <>
      <figure className="analytics-chart" aria-label={`${valueLabel} by month`}>
        <figcaption className="analytics-sr-only">A monthly area chart of {valueLabel.toLowerCase()}. Click a month to filter the dashboard, or open the keyboard choices below.</figcaption>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 8, bottom: 0, left: 4 }}
            accessibilityLayer
            onClick={(state) => {
              if (state?.activeLabel !== undefined) onSelect?.(String(state.activeLabel));
            }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--dash-series-1)" stopOpacity={0.4} />
                <stop offset="92%" stopColor="var(--dash-series-1)" stopOpacity={0.025} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--dash-chart-grid)" />
            <XAxis dataKey="label" tick={{ fill: "var(--dash-chart-axis)", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={28} tickFormatter={(value: string) => value.slice(2)} />
            <YAxis width={48} tick={{ fill: "var(--dash-chart-axis-muted)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)} />
            <Tooltip
              cursor={{ stroke: "var(--dash-chart-cursor-line)", strokeDasharray: "3 4" }}
              contentStyle={{ background: "var(--dash-chart-tooltip)", border: "1px solid var(--dash-chart-tooltip-border)", borderRadius: 10, color: "var(--dash-chart-tooltip-text)", fontSize: 12 }}
              labelStyle={{ color: "var(--dash-chart-tooltip-label)", marginBottom: 5 }}
              formatter={(value) => [formatValue(Number(value)), valueLabel]}
            />
            {selectedLabel && <ReferenceLine x={selectedLabel} stroke="var(--dash-accent)" strokeDasharray="4 4" />}
            <Area type="linear" isAnimationActive={false} dataKey="value" name={valueLabel} stroke="var(--dash-series-1)" strokeWidth={2.3} fill={`url(#${gradientId})`} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--dash-chart-dot-outline)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </figure>
      <KeyboardChoices title="month" data={data} selectedLabel={selectedLabel} onSelect={onSelect} formatValue={formatValue} />
    </>
  );
}

export function RankingChart({
  data,
  formatValue,
  formatAxisValue,
  height = 310,
  selectedLabel,
  onSelect,
  choiceTitle = "category",
}: {
  data: ChartDatum[];
  formatValue: (value: number) => string;
  formatAxisValue?: (value: number) => string;
  height?: number;
  selectedLabel?: string;
  onSelect?: (label: string) => void;
  choiceTitle?: string;
}) {
  if (data.length === 0) return <div className="analytics-empty">No matching observations for these filters.</div>;
  const chartHeight = Math.max(height, Math.min(480, data.length * 37 + 32));
  return (
    <>
      <figure className="analytics-chart analytics-chart-ranking" aria-label="Ranked comparison" style={{ height: chartHeight }}>
        <figcaption className="analytics-sr-only">A ranked horizontal bar chart. Click a bar to filter the dashboard, or open the keyboard choices below.</figcaption>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 0, left: 4 }}
            accessibilityLayer
          >
            <CartesianGrid horizontal={false} stroke="var(--dash-chart-grid)" />
            <XAxis type="number" tick={{ fill: "var(--dash-chart-axis-muted)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={formatAxisValue ?? ((value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value))} />
            <YAxis type="category" dataKey="label" width={132} tick={{ fill: "var(--dash-chart-axis-strong)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "var(--dash-chart-cursor)" }}
              contentStyle={{ background: "var(--dash-chart-tooltip)", border: "1px solid var(--dash-chart-tooltip-border)", borderRadius: 10, color: "var(--dash-chart-tooltip-text)", fontSize: 12 }}
              formatter={(value) => [formatValue(Number(value)), "Observed"]}
            />
            <Bar
              isAnimationActive={false}
              dataKey="value"
              fill="var(--dash-accent)"
              radius={[0, 5, 5, 0]}
              maxBarSize={18}
              onClick={(bar, index) => {
                const point = bar.payload as ChartDatum | undefined;
                const label = point?.label ?? data[index]?.label;
                if (label) onSelect?.(label);
              }}
            >
              {data.map((item) => <Cell key={item.label} fill={categoryColor(item.label)} stroke={selectedLabel === item.label ? "var(--dash-chart-selected)" : "none"} strokeWidth={2} fillOpacity={selectedLabel && selectedLabel !== item.label ? 0.45 : 1} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </figure>
      <ChartLegend selected={!!selectedLabel} />
      <KeyboardChoices title={choiceTitle} data={data} selectedLabel={selectedLabel} onSelect={onSelect} formatValue={formatValue} />
    </>
  );
}

export function HistogramChart({
  data,
  formatValue,
  selectedLabel,
  onSelect,
}: {
  data: ChartDatum[];
  formatValue: (value: number) => string;
  selectedLabel?: string;
  onSelect?: (label: string) => void;
}) {
  if (data.length === 0) return <div className="analytics-empty">No matching invoices for these filters.</div>;
  return (
    <>
      <figure className="analytics-chart analytics-chart-histogram" aria-label="Invoice count by invoice value band">
        <figcaption className="analytics-sr-only">A histogram of invoice counts by total invoice value. Click a band to filter the dashboard, or open the keyboard choices below.</figcaption>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 12, bottom: 8, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="var(--dash-chart-grid)" />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              minTickGap={9}
              tick={{ fill: "var(--dash-chart-axis)", fontSize: 9 }}
              tickFormatter={(value: string) => value.replace(/£/g, "")}
              axisLine={false}
              tickLine={false}
            />
            <YAxis width={46} tick={{ fill: "var(--dash-chart-axis-muted)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)} />
            <Tooltip
              cursor={{ fill: "var(--dash-chart-cursor)" }}
              contentStyle={{ background: "var(--dash-chart-tooltip)", border: "1px solid var(--dash-chart-tooltip-border)", borderRadius: 10, color: "var(--dash-chart-tooltip-text)", fontSize: 12 }}
              formatter={(value) => [formatValue(Number(value)), "Invoices"]}
            />
            <Bar
              isAnimationActive={false}
              dataKey="value"
              fill="var(--dash-accent)"
              radius={[4, 4, 0, 0]}
              maxBarSize={46}
              onClick={(bar, index) => {
                const point = bar.payload as ChartDatum | undefined;
                const label = point?.label ?? data[index]?.label;
                if (label) onSelect?.(label);
              }}
            >
              {data.map((item) => <Cell key={item.label} fill="var(--dash-series-2)" stroke={selectedLabel === item.label ? "var(--dash-chart-selected)" : "none"} strokeWidth={2} fillOpacity={selectedLabel && selectedLabel !== item.label ? 0.45 : 1} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </figure>
      <ChartLegend distribution selected={!!selectedLabel} />
      <KeyboardChoices title="invoice value band" data={data} selectedLabel={selectedLabel} onSelect={onSelect} formatValue={formatValue} />
    </>
  );
}

export function CategoryChart({
  data,
  dataKey,
  formatValue,
  selectedLabel,
  onSelect,
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  formatValue: (value: number) => string;
  selectedLabel?: string;
  onSelect?: (label: string) => void;
}) {
  if (data.length === 0) return <div className="analytics-empty">No matching observations for these filters.</div>;
  const height = Math.max(250, Math.min(440, data.length * 36 + 28));
  const chartData = data.map((row) => ({ label: String(row.label), value: Number(row.value) }));
  return (
    <>
      <figure className="analytics-chart analytics-chart-ranking" aria-label="Category comparison" style={{ height }}>
        <figcaption className="analytics-sr-only">A ranked category comparison. Click a bar to filter the customer dashboard, or open the keyboard choices below.</figcaption>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 10, bottom: 0, left: 4 }}
            accessibilityLayer
          >
            <CartesianGrid horizontal={false} stroke="var(--dash-chart-grid)" />
            <XAxis type="number" tick={{ fill: "var(--dash-chart-axis-muted)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)} />
            <YAxis type="category" dataKey="label" width={132} tick={{ fill: "var(--dash-chart-axis-strong)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "var(--dash-chart-cursor)" }}
              contentStyle={{ background: "var(--dash-chart-tooltip)", border: "1px solid var(--dash-chart-tooltip-border)", borderRadius: 10, color: "var(--dash-chart-tooltip-text)", fontSize: 12 }}
              formatter={(value) => [formatValue(Number(value)), dataKey]}
            />
            <Bar
              isAnimationActive={false}
              dataKey="value"
              fill="var(--dash-accent)"
              radius={[0, 5, 5, 0]}
              maxBarSize={18}
              onClick={(bar, index) => {
                const point = bar.payload as ChartDatum | undefined;
                const label = point?.label ?? chartData[index]?.label;
                if (label) onSelect?.(label);
              }}
            >
              {chartData.map((item) => <Cell key={item.label} fill={categoryColor(item.label)} stroke={selectedLabel === item.label ? "var(--dash-chart-selected)" : "none"} strokeWidth={2} fillOpacity={selectedLabel && selectedLabel !== item.label ? 0.45 : 1} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </figure>
      <ChartLegend selected={!!selectedLabel} />
      <KeyboardChoices title="category" data={chartData} selectedLabel={selectedLabel} onSelect={onSelect} formatValue={formatValue} />
    </>
  );
}
