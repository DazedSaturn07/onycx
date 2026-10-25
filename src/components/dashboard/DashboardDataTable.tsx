"use client";

import { useMemo, useState } from "react";
import { novaMoney, novaNumber, novaPercent } from "@/lib/novamart";

export type Cell = string | number | null;
export type Column = {
  label: string;
  format?: "money" | "percent" | "decimal";
  digits?: number;
};
export function DashboardDataTable({
  columns,
  rows,
  caption,
  onSelect,
  search,
  onSearch,
  filename = "dashboard-selection.csv",
}: {
  columns: Column[];
  rows: Cell[][];
  caption: string;
  onSelect?: (row: Cell[]) => void;
  search?: string;
  onSearch?: (query: string) => void;
  filename?: string;
}) {
  const [localQuery, setLocalQuery] = useState("");
  const query = search ?? localQuery;
  const setQuery = onSearch ?? setLocalQuery;
  const [sort, setSort] = useState({ column: -1, descending: true });
  const [page, setPage] = useState(0);
  const filtered = useMemo(
    () =>
      rows
        .filter((r) =>
          r.some((c) =>
            String(c ?? "")
              .toLowerCase()
              .includes(query.toLowerCase()),
          ),
        )
        .sort((a, b) => {
          if (sort.column < 0) return 0;
          const x = a[sort.column],
            y = b[sort.column];
          if (x == null || y == null)
            return x == null ? (y == null ? 0 : 1) : -1;
          return (
            (typeof x === "number" && typeof y === "number"
              ? x - y
              : String(x).localeCompare(String(y))) * (sort.descending ? -1 : 1)
          );
        }),
    [rows, query, sort],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 15));
  const current = Math.min(page, pages - 1);
  const format = (v: Cell, c: Column) =>
    typeof v !== "number"
      ? (v ?? "—")
      : c.format === "money"
        ? novaMoney(v)
        : c.format === "percent"
          ? novaPercent(v)
          : novaNumber(v, c.digits ?? (c.format === "decimal" ? 2 : 0));
  function download() {
    const escape = (v: Cell) =>
      `"${String(typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? "'" + v : (v ?? "")).replaceAll('"', '""')}"`;
    const text = [
      columns.map((c) => c.label + (c.format === "money" ? " (BRL)" : "")),
      ...filtered.map((r) =>
        r.map((v, i) =>
          typeof v === "number" && columns[i].format === "money" ? v / 100 : v,
        ),
      ),
    ]
      .map((r) => r.map(escape).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", text], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div className="study-table-tools">
        <p>
          {caption} · {novaNumber(filtered.length)} rows
        </p>
        <button type="button" onClick={download} disabled={!filtered.length}>
          Export selection ↓
        </button>
      </div>
      <label className="study-search">
        <span>Search this table</span>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
      </label>
      <div
        className="analytics-table-wrap"
        role="region"
        aria-label={caption}
        tabIndex={0}
      >
        <table className="analytics-table">
          <caption className="analytics-sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th
                  scope="col"
                  key={c.label}
                  aria-sort={
                    sort.column === i
                      ? sort.descending
                        ? "descending"
                        : "ascending"
                      : "none"
                  }
                >
                  <button
                    className="nova-sort"
                    type="button"
                    onClick={() => {
                      setSort({
                        column: i,
                        descending: sort.column === i ? !sort.descending : true,
                      });
                      setPage(0);
                    }}
                  >
                    {c.label}{" "}
                    {sort.column === i ? (sort.descending ? "↓" : "↑") : "↕"}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(current * 15, current * 15 + 15).map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <td key={j}>
                    {j === 0 && onSelect ? (
                      <button
                        className="study-table-select"
                        type="button"
                        onClick={() => onSelect(r)}
                      >
                        {format(v, columns[j])} ↗
                      </button>
                    ) : (
                      format(v, columns[j])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="analytics-empty">No observations for this selection.</p>
        )}
      </div>
      <div className="nova-pagination">
        <button
          type="button"
          disabled={current === 0}
          onClick={() => setPage(current - 1)}
        >
          ← Previous
        </button>
        <span>
          Page {current + 1} of {pages}
        </span>
        <button
          type="button"
          disabled={current + 1 === pages}
          onClick={() => setPage(current + 1)}
        >
          Next →
        </button>
      </div>
    </>
  );
}
