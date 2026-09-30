import type { ReactNode } from "react";
import { ChartNoAxesColumn } from "lucide-react";

/** Shared card treatment for the four project dashboards. Content stays project owned. */
export function DashboardStat({ label, value, note, onClick, active }: {
  label: string;
  value: string;
  note: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const content = (
    <>
      <div className="analytics-kpi-heading">
        <p>{label}</p>
        <span className="analytics-kpi-icon" aria-hidden="true"><ChartNoAxesColumn size={15} strokeWidth={1.8} /></span>
      </div>
      <strong>{value}</strong>
      <span className="analytics-kpi-note">{note}</span>
    </>
  );

  return onClick ? (
    <button type="button" className={`analytics-kpi analytics-kpi-selectable${active ? " is-active" : ""}`} aria-pressed={active} onClick={onClick}>{content}</button>
  ) : <article className="analytics-kpi">{content}</article>;
}

export function DashboardPanel({ title, eyebrow, children, className = "" }: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`analytics-panel ${className}`}>
      <header className="analytics-panel-heading">
        <div>{eyebrow && <p>{eyebrow}</p>}<h3>{title}</h3></div>
        <span className="analytics-panel-glyph" aria-hidden="true"><ChartNoAxesColumn size={17} strokeWidth={1.6} /></span>
      </header>
      {children}
    </section>
  );
}
