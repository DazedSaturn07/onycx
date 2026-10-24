"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatStudy } from "@/lib/study-dashboards";
import type {
  MetricFormat,
  StudyPoint,
  StudyTable,
} from "@/lib/study-dashboards";

export function StudyTrend({
  data,
  format,
  title,
  onSelect,
  selectedLabel,
}: {
  data: StudyPoint[];
  format: MetricFormat;
  title: string;
  onSelect?: (label: string) => void;
  selectedLabel?: string;
}) {
  const id = useId().replaceAll(":", "");
  const [active, setActive] = useState<number | null>(null);
  const [width, setWidth] = useState(760);
  const figure = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = figure.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(1, entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const valid = data.filter((p) => p.value !== null);
  if (!valid.length)
    return (
      <figure ref={figure} className="study-trend" aria-label={title}>
        <p className="analytics-empty">
          No eligible observations for this selection.
        </p>
      </figure>
    );
  const height = 200,
    left = 52,
    right = 20,
    top = 20,
    bottom = 34;
  const min = Math.min(0, ...valid.map((p) => p.value ?? 0));
  const max =
    Math.max(1, ...valid.map((p) => p.value ?? 0)) *
    (format === "percent" ? 1 : 1.1);
  const x = (i: number) =>
    left + (i / Math.max(1, data.length - 1)) * (width - left - right);
  const y = (v: number) =>
    height - bottom - ((v - min) / (max - min)) * (height - top - bottom);
  let line = "";
  let nextMove = true;
  data.forEach((p, i) => {
    if (p.value === null) {
      nextMove = true;
      return;
    }
    line += `${nextMove ? "M" : "L"}${x(i)},${y(p.value)} `;
    nextMove = false;
  });
  const area = data.every((p) => p.value !== null)
    ? `${line} L${x(data.length - 1)},${y(0)} L${left},${y(0)} Z`
    : "";
  const label = (s: string) =>
    s.length === 10
      ? s.slice(5)
      : /^\d{4}-\d{2}$/.test(s)
        ? new Date(`${s}-01T00:00:00Z`).toLocaleDateString("en-GB", {
            month: "short",
            timeZone: "UTC",
          })
        : `${s.padStart(2, "0")}:00`;
  const focused = active === null ? undefined : data[active];
  return (
    <figure ref={figure} className="study-trend" aria-label={title}>
      <div className="study-trend-readout" aria-live="polite">
        {focused
          ? `${focused.label} · ${formatStudy(focused.value, format)}`
          : onSelect
            ? "Select a point to filter related views"
            : "Focus or hover a point for exact values"}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={`${title}. The axis includes zero; straight lines connect observed periods.`}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity=".3" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => {
          const value = min + (max - min) * t;
          return (
            <g key={t}>
              <line
                x1={left}
                x2={width - right}
                y1={y(value)}
                y2={y(value)}
                stroke="currentColor"
                opacity=".16"
                strokeDasharray="3 6"
              />
              <text x={left - 10} y={y(value) + 4} textAnchor="end">
                {format === "percent"
                  ? `${Math.round(value * 100)}%`
                  : new Intl.NumberFormat("en", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(value)}
              </text>
            </g>
          );
        })}
        {area && <path d={area} fill={`url(#${id})`} />}
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
        {data.map(
          (p, i) =>
            p.value !== null && (
              <g
                key={p.label}
                tabIndex={0}
                role={onSelect ? "button" : "img"}
                aria-pressed={onSelect ? selectedLabel === p.label : undefined}
                aria-label={`${onSelect ? "Filter " : ""}${p.label}: ${formatStudy(p.value, format)}`}
                onClick={() => onSelect?.(p.label)}
                onKeyDown={(event) => {
                  if (
                    onSelect &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    onSelect(p.label);
                  }
                }}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                <circle
                  className="study-trend-hit"
                  cx={x(i)}
                  cy={y(p.value)}
                  r="12"
                  fill="transparent"
                />
                <circle
                  cx={x(i)}
                  cy={y(p.value)}
                  r={active === i || selectedLabel === p.label ? 5 : 2.5}
                  fill="currentColor"
                />
                <title>
                  {p.label}: {formatStudy(p.value, format)}
                </title>
              </g>
            ),
        )}
        {[
          ...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]),
        ].map((i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 7}
            textAnchor={
              i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"
            }
          >
            {label(data[i].label)}
          </text>
        ))}
      </svg>
    </figure>
  );
}

export function StudyBars({
  data,
  format = "number",
  onSelect,
  limit = 10,
  countLabel = "scheduled observations",
  selectedLabel,
}: {
  data: StudyPoint[];
  format?: MetricFormat;
  onSelect?: (label: string) => void;
  limit?: number;
  countLabel?: string;
  selectedLabel?: string;
}) {
  if (!data.length)
    return (
      <p className="analytics-empty">
        No matching observations for this selection.
      </p>
    );
  const max = Math.max(1e-9, ...data.map((d) => Math.abs(d.value ?? 0)));
  return (
    <div className="study-bars">
      {data.slice(0, limit).map((p, i) => {
        const body = (
          <>
            <span className="study-bar-label">
              {p.label.replaceAll("_", " ")}
              {p.count !== undefined && (
                <small>
                  {formatStudy(p.count)} {countLabel}
                </small>
              )}
            </span>
            <strong>{formatStudy(p.value, format)}</strong>
            <span className="study-bar-track" aria-hidden="true">
              <i
                className={p.value !== null && p.value < 0 ? "is-negative" : ""}
                style={
                  {
                    width: `${(Math.abs(p.value ?? 0) / max) * 100}%`,
                    "--bar-color": `var(--bento-color-${i % 4})`,
                  } as React.CSSProperties
                }
              />
            </span>
          </>
        );
        return onSelect ? (
          <button
            className="study-bar"
            key={p.label}
            type="button"
            aria-pressed={selectedLabel === p.label}
            onClick={() => onSelect(p.label)}
            aria-label={`Select ${p.label}, ${formatStudy(p.value, format)}`}
          >
            {body}
          </button>
        ) : (
          <div className="study-bar" key={p.label}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

export function StudyGauge({
  label,
  value,
  segments,
  onSelect,
  selectedLabel,
}: {
  label: string;
  value: number | null;
  segments: StudyPoint[];
  onSelect?: (label: string) => void;
  selectedLabel?: string;
}) {
  const sum = segments.reduce((s, p) => s + (p.value ?? 0), 0);
  const circumference = 2 * Math.PI * 82;
  return (
    <div className="study-gauge">
      <div className="study-gauge-dial">
        <svg
          viewBox="0 0 200 200"
          role="img"
          aria-label={`${label}: ${formatStudy(value, "percent")}`}
        >
          <circle
            cx="100"
            cy="100"
            r="82"
            fill="none"
            stroke="currentColor"
            strokeWidth="11"
            opacity=".1"
          />
          {segments.map((p, i) => {
            const length = sum ? ((p.value ?? 0) / sum) * circumference : 0;
            const start = sum
              ? (segments
                  .slice(0, i)
                  .reduce((total, segment) => total + (segment.value ?? 0), 0) /
                  sum) *
                circumference
              : 0;
            return (
              <circle
                key={p.label}
                cx="100"
                cy="100"
                r="82"
                fill="none"
                stroke={`var(--bento-color-${i % 4})`}
                strokeWidth="11"
                strokeDasharray={`${Math.max(0, length - 4)} ${circumference - Math.max(0, length - 4)}`}
                strokeDashoffset={-start}
                transform="rotate(-90 100 100)"
              />
            );
          })}
        </svg>
        <div>
          <strong>{formatStudy(value, "percent")}</strong>
          <span>{label}</span>
        </div>
      </div>
      <ul className="study-gauge-legend">
        {segments.map((p, i) => (
          <li key={p.label}>
            {onSelect ? (
              <button
                type="button"
                aria-pressed={selectedLabel === p.label}
                onClick={() => onSelect(p.label)}
                aria-label={`Select ${p.label}, ${formatStudy(p.value)}`}
              >
                <i
                  style={{ background: `var(--bento-color-${i % 4})` }}
                  aria-hidden="true"
                />
                <span>{p.label}</span>
                <b>{formatStudy(p.value)}</b>
              </button>
            ) : (
              <>
                <i
                  style={{ background: `var(--bento-color-${i % 4})` }}
                  aria-hidden="true"
                />
                <span>{p.label}</span>
                <b>{formatStudy(p.value)}</b>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StudyDataTable({
  data,
  caption,
  onSelect,
}: {
  data: StudyTable;
  caption: string;
  onSelect?: (row: StudyTable["rows"][number]) => void;
}) {
  function formatCell(value: string | number | null, column: string) {
    if (typeof value !== "number") return value ?? "—";
    const fmt: MetricFormat = /rate|share|≤15m/i.test(column)
      ? "percent"
      : /days/i.test(column)
        ? "days"
        : /score|index|hours|delay \(min\)/i.test(column)
          ? "score"
          : "number";
    return formatStudy(value, fmt);
  }
  function download() {
    const escape = (v: string | number | null) =>
      `"${(typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? "'" + v : String(v ?? "")).replaceAll('"', '""')}"`;
    const content = [data.columns, ...data.rows]
      .map((row) => row.map(escape).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "study-selection.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div className="study-table-tools">
        <p>{caption}</p>
        <button type="button" onClick={download} disabled={!data.rows.length}>
          Export rows ↓
        </button>
      </div>
      <div
        className="analytics-table-wrap"
        tabIndex={0}
        role="region"
        aria-label={`${caption}, scroll horizontally on small screens`}
      >
        <table className="analytics-table">
          <caption className="analytics-sr-only">{caption}</caption>
          <thead>
            <tr>
              {data.columns.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>
                    {j === 0 && onSelect ? (
                      <button
                        className="study-table-select"
                        type="button"
                        onClick={() => onSelect(row)}
                      >
                        {formatCell(cell, data.columns[j])} ↗
                      </button>
                    ) : (
                      formatCell(cell, data.columns[j])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!data.rows.length && (
          <p className="analytics-empty">No observations for this selection.</p>
        )}
      </div>
    </>
  );
}
