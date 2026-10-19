"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { DashboardPanel as Panel, DashboardStat as Kpi } from "@/components/ui/dashboard-4";
import { assetObject, assetRows, readNumber as n, readString as s } from "@/lib/analytics-dashboards";
import type { JsonAsset } from "@/lib/analytics-dashboards";
import { retailIqReportAudit } from "@/data/retail-iq-report-audit";

const Scatter = dynamic(() => import("./AnalyticsCharts").then((module) => module.ReportScatter), { ssr: false });
const Ranking = dynamic(() => import("./AnalyticsCharts").then((module) => module.RankingChart), { ssr: false });
const number = (value: number) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(value);
const count = (value: number) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const pounds = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(value);

function Table({ title, headers, rows }: { title: string; headers: string[]; rows: Array<Array<string | number>> }) {
  return <div className="analytics-table-wrap" role="region" aria-label={title} tabIndex={0}>
    <table className="analytics-table"><thead><tr>{headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
      <tbody>{rows.length ? rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>) : <tr><td colSpan={headers.length}>No publishable observations.</td></tr>}</tbody>
    </table>
  </div>;
}

export function RetailIqSegmentValue({ asset, country }: { asset?: JsonAsset; country: string }) {
  const profiles = assetRows<JsonAsset>(assetObject(asset, "rfm"), "profiles").filter((row) => s(row, "country") === country);
  return <Panel title="RFM segment value" eyebrow="Share of identified-customer sales · full-history snapshot">
    <Ranking data={profiles.map((row) => ({ label: s(row, "segment"), value: n(row, "sales_proxy_share") })).sort((a, b) => b.value - a.value)} formatValue={percent} formatAxisValue={percent} />
    <p className="analytics-small-note">Country selects the customer’s assigned home market. Trading year, month, and invoice band do not change this snapshot. Small country segments are suppressed.</p>
  </Panel>;
}

export function RetailIqCustomerValue({ asset, country, detail = false }: { asset?: JsonAsset; country: string; detail?: boolean }) {
  const [segment, setSegment] = useState("All");
  const rfm = assetObject(asset, "rfm");
  const profiles = assetRows<JsonAsset>(rfm, "profiles").filter((row) => s(row, "country") === country);
  const activeSegment = profiles.some((row) => s(row, "segment") === segment) ? segment : "All";
  const selected = profiles.filter((row) => activeSegment === "All" || s(row, "segment") === activeSegment);
  const customers = selected.reduce((total, row) => total + n(row, "customers"), 0);
  const repeat = selected.reduce((total, row) => total + n(row, "repeat_customers"), 0);
  const value = selected.reduce((total, row) => total + n(row, "total_sales_proxy"), 0);
  if (!asset) return null;
  return <>
    {detail && <label className="analytics-filter analytics-report-filter" htmlFor="retail-iq-segment"><span>RFM segment</span><select id="retail-iq-segment" value={activeSegment} onChange={(event) => setSegment(event.target.value)}><option>All</option>{profiles.map((row) => <option key={s(row, "segment")}>{s(row, "segment")}</option>)}</select></label>}
    <div className="analytics-kpi-grid analytics-kpi-grid-four">
      <Kpi label="Published identified customers" value={count(customers)} note="Anonymous IDs excluded; small country groups suppressed" />
      <Kpi label="Repeat customers" value={count(repeat)} note="More than one distinct retained invoice" />
      <Kpi label="Repeat customer share" value={customers ? percent(repeat / customers) : "—"} note="Repeat customers ÷ published identified customers" />
      <Kpi label="Identified sales proxy" value={pounds(value)} note={`Full history · snapshot ${s(rfm ?? undefined, "snapshot_date")}`} />
    </div>
    <div className="analytics-content-grid analytics-content-grid-main">
      <Panel title={detail ? "Selected segment profile" : "Segment customers and value"} eyebrow="One point per published RFM segment">
        <Scatter data={selected.map((row) => ({ label: s(row, "segment"), x: n(row, "customers"), y: n(row, "total_sales_proxy"), size: n(row, "average_invoice_frequency") }))} xLabel="Customers" yLabel="Sales proxy" sizeLabel="Mean invoice frequency" formatX={count} formatY={pounds} formatAxisY={(value) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", notation: "compact", maximumFractionDigits: 1 }).format(value)} />
      </Panel>
      <Panel title="RFM profile detail" eyebrow="Means and shares are displayed per segment">
        <Table title="RFM segment profiles" headers={["Segment", "Customers", "Mean recency (days)", "Mean invoices", "Mean sales", "Sales share"]} rows={selected.map((row) => [s(row, "segment"), count(n(row, "customers")), number(n(row, "average_recency_days")), number(n(row, "average_invoice_frequency")), pounds(n(row, "average_sales_proxy")), percent(n(row, "sales_proxy_share"))])} />
        <p className="analytics-small-note">No summed totals for means or percentages. Country attribution uses each customer’s most frequent retained market.</p>
      </Panel>
    </div>
    {detail && <p className="analytics-small-note">The original drill-through lists customer IDs. This public report provides selectable segment summaries; individual customer records remain private.</p>}
  </>;
}

export function RetailIqPersonas({ asset }: { asset?: JsonAsset }) {
  if (!asset) return null;
  const profiles = assetRows<JsonAsset>(asset, "cluster_profiles");
  const mix = assetRows<JsonAsset>(asset, "category_mix");
  const priority = assetRows<JsonAsset>(asset, "discount_test_priority");
  const metadata = assetObject(asset, "metadata");
  return <>
    <div className="analytics-source-separation"><strong>Mall customer snapshot</strong><p>{count(n(metadata ?? undefined, "source_rows"))} records; each has a unique customer ID. Purchase amount = quantity × price, in source units. These personas do not measure loyalty or repeat shopping.</p></div>
    <div className="analytics-content-grid analytics-content-grid-main">
      <Panel title="Persona population" eyebrow={`K-means · selected k = ${n(metadata ?? undefined, "selected_k")}`}><Ranking data={profiles.map((row) => ({ label: s(row, "persona"), value: n(row, "customer_records") }))} formatValue={count} /><Table title="Persona profiles" headers={["Persona", "Records", "Mean age", "Mean purchase", "Purchase amount"]} rows={profiles.map((row) => [s(row, "persona"), count(n(row, "customer_records")), number(n(row, "average_age")), number(n(row, "average_purchase")), number(n(row, "sales_proxy"))])} /></Panel>
      <Panel title="Discount test priority" eyebrow="Project heuristic · score out of 100"><Ranking data={priority.map((row) => ({ label: s(row, "category"), value: n(row, "test_priority_score") }))} formatValue={number} /><p className="analytics-small-note">35% demand + 35% value + 15% price + 15% low quantity percentile. Top quartile identifies controlled test candidates; this is not measured elasticity or causal uplift.</p><Table title="Discount test candidates" headers={["Category", "Score", "Priority"]} rows={priority.map((row) => [s(row, "category"), number(n(row, "test_priority_score")), s(row, "priority_tier")])} /></Panel>
    </div>
    <Panel title="Category mix within each persona" eyebrow="Distinct source invoices · percentages within persona"><Table title="Persona category composition" headers={["Persona", "Category", "Invoices", "Within-persona share"]} rows={mix.map((row) => [s(row, "persona"), s(row, "category"), count(n(row, "records")), percent(n(row, "share"))])} /></Panel>
    <Panel title="Cluster selection" eyebrow="Reproducible silhouette comparison · K = 3–8"><Table title="Cluster silhouette scores" headers={["K", "Silhouette"]} rows={assetRows<JsonAsset>(asset, "cluster_selection").map((row) => [n(row, "k"), n(row, "silhouette").toFixed(4)])} /></Panel>
    <Panel title="Age and payment patterns" eyebrow="All source age × payment groups"><Table title="Mall age and payment groups" headers={["Age band", "Payment", "Records", "Purchase amount", "Mean purchase"]} rows={assetRows<JsonAsset>(asset, "age_payment").map((row) => [s(row, "age_band"), s(row, "payment_method"), count(n(row, "customer_records")), number(n(row, "sales_proxy")), number(n(row, "average_purchase"))])} /></Panel>
  </>;
}

export function RetailIqAffinity({ asset }: { asset?: JsonAsset }) {
  const [query, setQuery] = useState("");
  const [reliableOnly, setReliableOnly] = useState(false);
  const [page, setPage] = useState(0);
  if (!asset) return null;
  const all = assetRows<JsonAsset>(asset, "rules");
  const rules = all.filter((row) => (!reliableOnly || (n(row, "support") >= .01 && n(row, "confidence") >= .20 && n(row, "pair_count") >= 50)) && `${s(row, "antecedent")} ${s(row, "consequent")}`.toLowerCase().includes(query.toLowerCase()));
  const lastPage = Math.max(0, Math.ceil(rules.length / 25) - 1);
  const currentPage = Math.min(page, lastPage);
  return <>
    <div className="analytics-source-separation"><strong>Online Retail basket affinity</strong><p>{count(n(asset, "transaction_count"))} distinct retained invoices. Co-occurrence supports merchandising tests; it does not establish causation.</p></div>
    <div className="analytics-kpi-grid analytics-kpi-grid-four"><Kpi label="Directional rules" value={count(all.length)} note="Support ≥ 1%; confidence ≥ 5%; lift > 1" /><Kpi label="Reliable candidates" value={count(n(asset, "reliable_rule_count"))} note="Confidence ≥ 20%; pair count ≥ 50; support ≥ 1%" /><Kpi label="Matching rules" value={count(rules.length)} note="Current search and reliability selection" /><Kpi label="Basket population" value={count(n(asset, "transaction_count"))} note="Anonymous positive invoices included" /></div>
    <Panel title="Rule support and confidence" eyebrow="One point per directional rule · lift sizes each point"><Scatter data={rules.map((row) => ({ label: `${s(row, "antecedent")} → ${s(row, "consequent")}`, x: n(row, "support"), y: n(row, "confidence"), size: n(row, "lift") }))} xLabel="Support" yLabel="Confidence" formatX={percent} formatY={percent} sizeLabel="Lift" /></Panel>
    <Panel title="Association rule details" eyebrow="All qualifying source rules · 25 per page">
      <div className="analytics-report-controls"><label className="analytics-filter" htmlFor="retail-rule-search"><span>Find a product</span><input id="retail-rule-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} /></label><label><input type="checkbox" checked={reliableOnly} onChange={(event) => { setReliableOnly(event.target.checked); setPage(0); }} /> Reliable candidates only</label></div>
      <Table title="Directional association rules" headers={["Antecedent", "Consequent", "Support", "Confidence", "Lift", "Pair count"]} rows={rules.slice(currentPage * 25, (currentPage + 1) * 25).map((row) => [s(row, "antecedent"), s(row, "consequent"), percent(n(row, "support")), percent(n(row, "confidence")), number(n(row, "lift")), count(n(row, "pair_count"))])} />
      <div className="analytics-report-controls"><button type="button" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous rules</button><span aria-live="polite">Page {currentPage + 1} of {lastPage + 1} · {count(rules.length)} rules</span><button type="button" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Next rules</button></div>
      <p className="analytics-small-note">Pair-level Apriori uses at most the first 60 sorted frequent items per invoice, matching the source notebook. It does not enumerate larger itemsets.</p>
    </Panel>
  </>;
}

export function RetailIqInstacart({ asset }: { asset?: JsonAsset }) {
  const [timeScope, setTimeScope] = useState("supplied");
  if (!asset) return null;
  const summary = assetObject(asset, "summary");
  const quality = assetObject(asset, "quality");
  const time = assetRows<JsonAsset>(assetObject(asset, "order_time"), timeScope);
  const departments = assetRows<JsonAsset>(asset, "departments");
  const products = assetRows<JsonAsset>(asset, "top_products");
  const highReorder = assetRows<JsonAsset>(asset, "high_reorder_products");
  const maxTime = Math.max(1, ...time.map((row) => n(row, "orders")));
  const productRows = (rows: JsonAsset[]) => rows.map((row) => [s(row, "product_name"), count(n(row, "orders")), count(n(row, "units")), count(n(row, "reorder_observations")), percent(n(row, "reorder_rate"))]);
  return <>
    <div className="analytics-source-separation"><strong>Instacart sample coverage</strong><p>{count(n(quality ?? undefined, "matched_order_product_rows"))} of {count(n(quality ?? undefined, "order_product_rows"))} basket lines ({percent(n(quality ?? undefined, "matched_share"))}) join to the supplied orders. Product measures use all basket lines; time views name their own order population. No calendar dates support market growth claims.</p></div>
    <div className="analytics-kpi-grid analytics-kpi-grid-four"><Kpi label="Distinct basket orders" value={count(n(summary ?? undefined, "distinct_basket_orders"))} note="Order-product extract; department orders overlap" /><Kpi label="Catalog products" value={count(n(assetObject(asset, "catalog") ?? undefined, "products"))} note="Complete supplied product catalog" /><Kpi label="Observed reorder rate" value={n(summary ?? undefined, "reorder_observations") ? percent(n(summary ?? undefined, "reorder_count") / n(summary ?? undefined, "reorder_observations")) : "—"} note="Total reorder flags ÷ non-missing observations" /><Kpi label="Mean basket size" value={number(n(summary ?? undefined, "average_products_per_order"))} note="Product lines per distinct basket order" /></div>
    <Panel title="Department performance" eyebrow="All 21 departments · distinct orders within each department"><Table title="Instacart departments" headers={["Department", "Ordered lines", "Orders", "Ordered products", "Reorder rate"]} rows={departments.map((row) => [s(row, "department"), count(n(row, "ordered_units")), count(n(row, "orders")), count(n(row, "catalog_products")), percent(n(row, "reorder_rate"))])} /><p className="analytics-small-note">Orders can contain several departments, so department order counts must not be summed into a unique-order KPI. Ordered products count observed products, not the full catalog.</p></Panel>
    <Panel title="Aisle opportunity" eyebrow="Top 20 of 134 aisles by ordered product lines"><Ranking data={assetRows<JsonAsset>(asset, "aisles").slice(0, 20).map((row) => ({ label: s(row, "aisle"), value: n(row, "ordered_units") }))} formatValue={count} height={500} /><details><summary>All aisle performance</summary><Table title="All Instacart aisles" headers={["Aisle", "Department", "Lines", "Orders", "Reorder rate"]} rows={assetRows<JsonAsset>(asset, "aisles").map((row) => [s(row, "aisle"), s(row, "department"), count(n(row, "ordered_units")), count(n(row, "orders")), percent(n(row, "reorder_rate"))])} /></details></Panel>
    <Panel title="Product order and reorder patterns" eyebrow="50 leading products by ordered lines · one point per product"><Scatter data={products.map((row) => ({ label: s(row, "product_name"), x: n(row, "orders"), y: n(row, "reorder_rate"), size: n(row, "reorder_observations") }))} xLabel="Distinct orders" yLabel="Reorder rate" formatX={count} formatY={percent} sizeLabel="Valid reorder observations" /><Table title="Leading Instacart products" headers={["Product", "Orders", "Lines", "Reorder observations", "Reorder rate"]} rows={productRows(products)} /></Panel>
    <Panel title="Highest observed reorder rates" eyebrow="Top 30 products · at least 30 valid reorder observations"><Table title="High reorder Instacart products" headers={["Product", "Orders", "Lines", "Reorder observations", "Reorder rate"]} rows={productRows(highReorder)} /></Panel>
    <Panel title="Order time heatmap" eyebrow="Distinct order counts · source day index × hour"><label className="analytics-filter analytics-report-filter" htmlFor="instacart-time-scope"><span>Order population</span><select id="instacart-time-scope" value={timeScope} onChange={(event) => setTimeScope(event.target.value)}><option value="supplied">All supplied orders ({count(n(summary ?? undefined, "supplied_orders"))})</option><option value="matched">Orders matched to baskets ({count(n(quality ?? undefined, "unique_matched_orders"))})</option></select></label>
      <div className="analytics-table-wrap" role="region" aria-label="Instacart distinct orders by day and hour" tabIndex={0}><table className="analytics-table analytics-cohort-map"><thead><tr><th scope="col">Day index</th>{Array.from({ length: 24 }, (_, hour) => <th scope="col" key={hour}>{hour}:00</th>)}</tr></thead><tbody>{Array.from({ length: 7 }, (_, day) => <tr key={day}><th scope="row">{day}</th>{Array.from({ length: 24 }, (_, hour) => { const orders = n(time.find((row) => n(row, "order_dow") === day && n(row, "order_hour_of_day") === hour), "orders"); return <td key={hour} style={{ background: `color-mix(in srgb, var(--dash-series-2) ${10 + orders / maxTime * 45}%, transparent)` }}>{count(orders)}</td>; })}</tr>)}</tbody></table></div><p className="analytics-small-note">Day index 0–6 is retained as recorded. The supplied-orders view matches the source report population; the matched view links time patterns to this basket extract. Cell counts reconcile to the selected population.</p>
    </Panel>
  </>;
}

export function RetailIqQuality({ overview, personas, instacart }: { overview: JsonAsset; personas?: JsonAsset; instacart?: JsonAsset }) {
  const quality = assetObject(overview, "quality");
  const mall = assetObject(personas, "metadata");
  const grocery = assetObject(instacart, "quality");
  return <>
    <Panel title="Source quality across the three studies" eyebrow="Full-source checks · trading filters do not apply"><Table title="RetailIQ source checks" headers={["Dataset", "Check", "Observed", "Treatment"]} rows={[
      ["Online Retail", "Exact duplicate copies", count(n(quality ?? undefined, "source_duplicate_rows_removed")), "Removed"],
      ["Online Retail", "Quarantine or return-like rows", count(n(quality ?? undefined, "quarantine_or_return_rows")), "Excluded from positive sales"],
      ["Online Retail", "Anonymous positive lines", count(n(quality ?? undefined, "anonymous_retained_rows")), "Included in sales; excluded from RFM"],
      ["Mall records", "Source / model records", `${count(n(mall ?? undefined, "source_rows"))} / ${count(n(mall ?? undefined, "model_rows"))}`, "Unique customer IDs; descriptive snapshot"],
      ["Instacart", "Repaired product catalog rows", count(n(grocery ?? undefined, "repaired_malformed_product_rows")), "Parsed product names from both ends"],
      ["Instacart", "Unmatched basket lines", count(n(grocery ?? undefined, "unmatched_order_product_rows")), "Kept for product metrics; no time/user attributes"],
      ["Instacart", "Missing reorder flags", count(n(grocery ?? undefined, "missing_reorder_flags")), "Excluded from rate denominator"],
    ]} /><p className="analytics-small-note">Affected-row counts describe different checks and can overlap. Anonymous sales are retained records, not failed or removed rows.</p></Panel>
    <Panel title="Original Power BI report review" eyebrow="Saved PBIX model and visual definitions reviewed · 11 October 2026"><p className="analytics-small-note">The transaction rows reconcile to the project source. Some saved analytical tables are stale, and several visual aggregations need correction; this website rebuilds calculations from verified rows. Native Power BI rendering and refresh were not tested.</p><Table title="Power BI findings and website corrections" headers={["Report area", "Saved report finding", "Website treatment"]} rows={retailIqReportAudit.map((row) => [row.area, row.finding, row.correction])} /></Panel>
  </>;
}
