# Portfolio analytics dashboards

Four project case studies now have interactive dashboards at `/projects/<slug>/dashboard`:

| Project | Route | Main views |
| --- | --- | --- |
| RetailIQ | `/projects/retail-iq/dashboard` | Trading, products, customer retention, mall personas, basket affinity, Instacart reorder sample |
| ShopLens Analytics | `/projects/shoplens/dashboard` | Trading, products, snapshot RFM, inactivity, customer cohorts |
| Customer Shopping Behaviour | `/projects/customer-behaviour/dashboard` | Customer profile and shopping choices |
| Retail Sales Analysis | `/projects/sales-analysis/dashboard` | Performance, products, data quality |

The dashboards use locally bundled aggregate JSON by default. To serve the same files from a public Cloudflare R2 custom domain, follow [Cloudflare R2 setup](CLOUDFLARE_R2_SETUP.md). R2 publishing is not part of the local build.

The dated transaction dashboards use Power BI-style cross-filtering within their trading report page. KPI cards select the measure used in the linked charts; selecting a month, market, or invoice-value histogram band recomputes compatible KPIs and visuals from a privacy-minimized invoice aggregation. The customer behaviour dashboard has no transaction date, so its category and demographic selections filter only its source-backed customer metrics. Product selections update product-specific KPIs and details; product totals are not presented as month or invoice-band slices.

## Build and run

From the portfolio root in PowerShell:

```powershell
python -m pip install -r analytics/requirements.txt
python scripts/build_dashboard_data.py
npm run dev
```

Open one of the routes in the table above. The data builder reads only the staged copies under the ignored `dashboard_datasets/` folder. It checks each copy's SHA-256 against the corresponding source file before processing. It writes reproducible Parquet intermediates under `dashboard_datasets/generated/processed/`, versioned browser payloads under `public/dashboard-data/v2/`, and audit artifacts under `analytics/`.

If your staged folder is outside the repository, set `DASHBOARD_DATASETS_DIR` in the PowerShell session before running the builder; this variable is read by Python and is separate from Next.js `.env` loading:

```powershell
$env:DASHBOARD_DATASETS_DIR = 'X:\path\to\dashboard_datasets'
python scripts/build_dashboard_data.py
```

The original folders (`RetailIq`, `ShopLens`, `Customer Behaviour`, and `Sales-Analytics Dashboard`) are inputs only. Do not point the builder at output paths in those folders. The manifest records the source and staged hashes, sizes, timestamps, and copy check for each of the 14 staged source/reference files.

The source-project root defaults to a `DA_projects` folder beside the portfolio checkout. Set `DASHBOARD_SOURCE_ROOT` to your source-project directory when it lives elsewhere. Source paths in the builder and manifest are relative to that root; machine-specific absolute paths are not published.

## Data and metric contracts

| Dashboard | Definition and boundaries |
| --- | --- |
| RetailIQ trading | Follows the project's online-retail cleaning rules: exact duplicate copies, returns, invalid dates, missing item data, and invalid or nonpositive price/quantity rows are excluded. Anonymous positive sale lines remain in sales totals; RFM excludes them. Currency is GBP. Revenue is a positive-line sales proxy, not profit or accounting revenue. |
| RetailIQ reference check | The source project's cleaned CSV and a separate rebuild from raw rows both contain 514,269 retained rows and 19,559 invoices. The saved `executive_kpis.csv` says 19,561 invoices; that figure does not match either row-level result, so the dashboard uses the verified rows and reports the mismatch. |
| RetailIQ mall personas | The source has one unique customer and invoice identifier per row. It supports profile comparisons, not repeat-customer or cohort analysis. The category test-priority score is descriptive, not measured discount elasticity or lift. |
| RetailIQ Instacart | Product, aisle, department, reorder, and basket measures use all 1,047,617 supplied order-product rows. Only 238,156 (22.7%) match the supplied orders extract; user and time measures use matched rows only. The reorder-rate denominator excludes missing reorder flags. |
| ShopLens and Retail Sales Analysis | Both use UCI Online Retail II in GBP. The displayed sales measure is a positive-line sales proxy, not profit or accounting revenue. They use the projects' respective cleaning logic, preserve exact repeated rows, exclude anonymous customers, cancellations, and nonpositive quantity/price lines. ShopLens rounds line value to two decimals; the Sales Analysis copy sums unrounded line values, giving a small total difference. |
| Customer Shopping Behaviour | 3,900 records; 37 missing review ratings remain missing and are omitted from rating averages. `Promo Code Used` duplicates `Discount Applied` and is not double-counted. There is no transaction date; Season is a recorded category, not a time series. Groups below five records are suppressed. |

The dashboards do not expose row-level customer identifiers or transaction identifiers. Payloads contain aggregates and product/category labels only. The trading interaction cube groups invoices by year, country, month, and invoice-total band, and emits no transaction keys. Do not add row-level data, IDs, or raw source files to the public payload folder.

## Audit and payload reports

- `source-manifest.csv`: 14 staged files, original/staged SHA-256, bytes, source modification time, and unchanged-copy result.
- `reports/data-quality-report.json`: per-source rows, columns, dtypes, nulls, cardinality, potential identifier fields, duplicate counts, date parsing, and project-specific cleaning checks.
- `reports/metric-validation.json`: independent dataframe aggregations for the key totals, invoice/customer counts, average invoice value, and Instacart coverage.
- `reports/payload-report.json`: source and processed sizes, per-dashboard initial/lazy JSON sizes, gzip sizes, and largest lazy asset.
- `public/dashboard-data/manifest.json`: versioned paths, byte counts, and SHA-256 for the generated JSON assets.

The current v2 output contains 4,923,454 bytes across 17 JSON files. The four overview files total 906,907 bytes (123,823 bytes with gzip); the lazy-loaded assets total 4,016,547 bytes (408,211 bytes with gzip). The largest individual asset is the 901,981-byte ShopLens interaction cube. These figures come from `reports/payload-report.json`; rerun the builder to refresh them after changing source data or aggregation logic.

## Source rights and attribution

The Retail Sales Analysis and ShopLens workbook both contain UCI Online Retail II data. UCI lists the dataset under [CC BY 4.0](https://archive.ics.uci.edu/dataset/502/online+retail); attribute the source and preserve that license notice if republishing derived material. Review the terms and attribution for every other dataset in the source projects before publishing the dashboard payloads. The source-file audit did not establish public redistribution rights for all four project datasets.

## Checks performed

The build verifies staged hashes, expected schemas and row-level cleaning outcomes, key aggregations against independent source-frame calculations, reconciliation of each invoice interaction cube to retained source rows, the RetailIQ cleaned-reference row hash, payload sizes, and that only derived JSON is in the public output. Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` before deployment.

## Implementation map

- `scripts/build_dashboard_data.py`: reproducible, read-only source pipeline and reports.
- `src/lib/analytics-dashboards.ts`: route content and data types.
- `src/components/dashboard/AnalyticsDashboard.tsx`: tab, filter, lazy-loading, and metric behavior.
- `src/components/dashboard/AnalyticsCharts.tsx`: accessible responsive charts.
- `src/components/ui/dashboard-4.tsx` and `src/app/dashboard-4.css`: shared monochrome card layout and responsive dashboard styling.
- `src/app/projects/[project]/dashboard/page.tsx`: dashboard route and metadata.
- `scripts/upload_dashboard_data.ps1`: guarded upload of versioned aggregate JSON to an existing R2 bucket; it never creates a bucket or enables public access.
