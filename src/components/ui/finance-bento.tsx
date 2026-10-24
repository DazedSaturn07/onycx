import type { ReactNode } from "react";
import { ArrowUpRight, ChartNoAxesColumn } from "lucide-react";

/** Supplied Finance Bento design adapted to project-owned data in typed React.
 * Design reference: Roman Vasnev / vasnev.art, supplied by the portfolio owner.
 */
export function FinanceBento({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <section className={`finance-bento ${className}`} aria-label={label}>
      {children}
    </section>
  );
}

export function DashboardStat({
  label,
  value,
  note,
  onClick,
  active,
}: {
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
        <span className="analytics-kpi-icon" aria-hidden="true">
          {onClick ? (
            <ArrowUpRight size={16} />
          ) : (
            <ChartNoAxesColumn size={16} />
          )}
        </span>
      </div>
      <strong>{value}</strong>
      <span className="analytics-kpi-note">{note}</span>
    </>
  );
  return onClick ? (
    <button
      type="button"
      className={`analytics-kpi analytics-kpi-selectable${active ? " is-active" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <article className="analytics-kpi">{content}</article>
  );
}

export function DashboardPanel({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`analytics-panel ${className}`}>
      <header className="analytics-panel-heading">
        <div>
          {eyebrow && <p>{eyebrow}</p>}
          <h3>{title}</h3>
        </div>
        <span className="analytics-panel-glyph" aria-hidden="true">
          <ChartNoAxesColumn size={17} strokeWidth={1.6} />
        </span>
      </header>
      {children}
    </section>
  );
}
