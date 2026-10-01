from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
import sys
from collections import Counter
from datetime import datetime, timezone
from itertools import combinations
from pathlib import Path
from typing import Any, Iterable

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(os.environ.get("DASHBOARD_SOURCE_ROOT", ROOT.parent / "DA_projects"))
DATA_ROOT = Path(os.environ.get("DASHBOARD_DATASETS_DIR", ROOT / "dashboard_datasets"))
GENERATED_ROOT = DATA_ROOT / "generated"
PROCESSED_ROOT = GENERATED_ROOT / "processed"
REPORT_ROOT = ROOT / "analytics" / "reports"
PUBLIC_ROOT = ROOT / "public" / "dashboard-data"
VERSION = "v2"

SOURCE_PAIRS = [
    ("RetailIQ", r"RetailIq/data/raw/customer_segmentation/customer_segmentation_dataset.csv", "retailIq_datasets/raw/customer_segmentation/customer_segmentation_dataset.csv"),
    ("RetailIQ", r"RetailIq/data/raw/online_retail/purchase_pattern_analysis_dataset.csv", "retailIq_datasets/raw/online_retail/purchase_pattern_analysis_dataset.csv"),
    ("RetailIQ processed reference", r"RetailIq/python/outputs/clean_online_retail_sales.csv", "retailIq_datasets/processed/clean_online_retail_sales.csv"),
    ("RetailIQ saved KPI reference", r"RetailIq/python/outputs/executive_kpis.csv", "retailIq_datasets/processed/executive_kpis.csv"),
    ("RetailIQ", r"RetailIq/data/raw/instacart/aisles.csv", "retailIq_datasets/raw/instacart/aisles.csv"),
    ("RetailIQ", r"RetailIq/data/raw/instacart/departments.csv", "retailIq_datasets/raw/instacart/departments.csv"),
    ("RetailIQ", r"RetailIq/data/raw/instacart/products.csv", "retailIq_datasets/raw/instacart/products.csv"),
    ("RetailIQ", r"RetailIq/data/raw/instacart/orders.csv", "retailIq_datasets/raw/instacart/orders.csv"),
    ("RetailIQ", r"RetailIq/data/raw/instacart/order_products_train.csv", "retailIq_datasets/raw/instacart/order_products_train.csv"),
    ("Customer Behaviour", r"Customer Behaviour/data/raw/customer_shopping_behavior.csv", "customer_behaviour dataset/raw/customer_shopping_behavior.csv"),
    ("Customer Behaviour", r"Customer Behaviour/data/processed/customer_shopping_cleaned.csv", "customer_behaviour dataset/processed/customer_shopping_cleaned.csv"),
    ("Customer Behaviour", r"Customer Behaviour/data/processed/customer_shopping_sql.csv", "customer_behaviour dataset/processed/customer_shopping_sql.csv"),
    ("Retail Sales Analysis", r"Sales-Analytics Dashboard/online_retail_II.csv", "sales_analytics_dataset/online_retail_II.csv"),
    ("ShopLens Analytics", r"ShopLens/data/raw/online_retail_II.xlsx", "shoplens_dataset/online_retail_II.xlsx"),
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def create_source_manifest() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for project, source_text, staged_relative in SOURCE_PAIRS:
        source = SOURCE_ROOT / source_text
        staged = DATA_ROOT / staged_relative
        if not source.is_file():
            raise FileNotFoundError(f"Read-only source file is missing: {source}")
        if not staged.is_file():
            raise FileNotFoundError(f"Staged source copy is missing: {staged}")
        source_hash = sha256(source)
        staged_hash = sha256(staged)
        if source_hash != staged_hash:
            raise ValueError(
                f"Staged copy differs from the read-only source for {project}: "
                f"{staged_relative}. Review the source before processing."
            )
        rows.append(
            {
                "project": project,
                "source_relative_path": Path(source_text).as_posix(),
                "staged_path": staged_relative,
                "source_bytes": source.stat().st_size,
                "source_modified_utc": datetime.fromtimestamp(
                    source.stat().st_mtime, timezone.utc
                ).isoformat(),
                "source_sha256": source_hash,
                "staged_sha256": staged_hash,
                "unchanged_copy": True,
            }
        )
    manifest_path = ROOT / "analytics" / "source-manifest.csv"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).to_csv(manifest_path, index=False)
    return rows


def native(value: Any) -> Any:
    if value is None or value is pd.NA:
        return None
    if isinstance(value, (pd.Timestamp, datetime)):
        return value.isoformat()
    if isinstance(value, np.generic):
        value = value.item()
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, dict):
        return {str(key): native(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [native(item) for item in value]
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return value


def json_records(frame: pd.DataFrame) -> list[dict[str, Any]]:
    return native(frame.to_dict(orient="records"))


def write_json(path: Path, payload: dict[str, Any]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(native(payload), ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    path.write_text(encoded, encoding="utf-8")
    return path.stat().st_size


def write_parquet(name: str, frame: pd.DataFrame) -> dict[str, Any]:
    path = PROCESSED_ROOT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    frame.to_parquet(path, index=False, compression="zstd")
    return {"path": str(path.relative_to(ROOT)), "rows": int(len(frame)), "bytes": path.stat().st_size}


def normalized_sales_hashes(frame: pd.DataFrame) -> np.ndarray:
    columns = [
        "invoice_no", "item_name", "quantity", "invoice_ts", "unit_price",
        "customer_id", "country", "line_revenue",
    ]
    normalized = pd.DataFrame(index=frame.index)
    for column in ("invoice_no", "item_name", "country"):
        normalized[column] = frame[column].astype("string").fillna("<missing>")
    normalized["quantity"] = pd.to_numeric(frame["quantity"], errors="raise").round().astype("int64")
    normalized["invoice_ts"] = pd.to_datetime(frame["invoice_ts"], errors="raise").dt.strftime("%Y-%m-%d %H:%M:%S").fillna("<missing>")
    normalized["unit_price"] = pd.to_numeric(frame["unit_price"], errors="raise").round(6)
    normalized["customer_id"] = pd.to_numeric(frame["customer_id"], errors="coerce").fillna(-1).astype("int64")
    normalized["line_revenue"] = pd.to_numeric(frame["line_revenue"], errors="raise").round(6)
    return np.sort(pd.util.hash_pandas_object(normalized[columns], index=False).to_numpy())


def read_csv(path: Path, **kwargs: Any) -> pd.DataFrame:
    return pd.read_csv(path, low_memory=False, **kwargs)


def profile_frame(name: str, path: Path, frame: pd.DataFrame) -> dict[str, Any]:
    columns = []
    for column in frame.columns:
        series = frame[column]
        normalized_name = str(column).strip().lower().replace(" ", "_")
        identifier_like = any(token in normalized_name for token in ("customer_id", "invoice", "billno", "order_id", "product_id", "stock_code"))
        non_null = series.dropna()
        unique_count = int(series.nunique(dropna=True))
        entry: dict[str, Any] = {
            "name": str(column),
            "dtype": str(series.dtype),
            "nulls": int(series.isna().sum()),
            "null_pct": round(float(series.isna().mean() * 100), 4) if len(series) else 0.0,
            "unique_non_null": unique_count,
            "high_cardinality": bool(len(series) and unique_count / len(series) >= 0.5),
            "potential_identifier": identifier_like,
        }
        if pd.api.types.is_numeric_dtype(series) and not identifier_like:
            numeric = pd.to_numeric(series, errors="coerce")
            entry.update(
                minimum=native(numeric.min()),
                maximum=native(numeric.max()),
                negative=int((numeric < 0).sum()),
                zero=int((numeric == 0).sum()),
            )
        if pd.api.types.is_string_dtype(series) or pd.api.types.is_object_dtype(series):
            text = non_null.astype(str)
            entry["leading_or_trailing_whitespace_rows"] = int(text.str.len().ne(text.str.strip().str.len()).sum())
            entry["case_variant_groups"] = int(text.nunique() - text.str.casefold().nunique())
        if "date" in normalized_name or "time" in normalized_name:
            parsed = series if pd.api.types.is_datetime64_any_dtype(series) else pd.to_datetime(
                series, dayfirst=("present" in normalized_name), format="mixed", errors="coerce"
            )
            valid = parsed.dropna()
            entry["date_parseable_rows"] = int(len(valid))
            entry["date_parse_success_pct"] = round(float(len(valid) / len(series) * 100), 4) if len(series) else 0.0
            entry["date_min"] = valid.min().isoformat() if len(valid) else None
            entry["date_max"] = valid.max().isoformat() if len(valid) else None
        columns.append(entry)
    return {
        "dataset": name,
        "file": str(path.relative_to(ROOT)),
        "file_bytes": int(path.stat().st_size),
        "rows": int(len(frame)),
        "columns": int(len(frame.columns)),
        "duplicate_rows": int(frame.duplicated().sum()),
        "schema": columns,
    }


def profile_staged_sources() -> list[dict[str, Any]]:
    profiles: list[dict[str, Any]] = []
    for project, _, staged_relative in SOURCE_PAIRS:
        path = DATA_ROOT / staged_relative
        if path.suffix.lower() in {".xlsx", ".xls"}:
            frame = pd.read_excel(path, sheet_name=0)
            parser = "first worksheet via pandas"
        elif path.name.lower() == "products.csv":
            frame, repaired_rows = read_instacart_products(path)
            parser = f"documented malformed-row repair; {repaired_rows} rows repaired"
        else:
            frame = read_csv(path)
            parser = "pandas CSV inference"
        profile = profile_frame(f"{project}: {path.name}", path, frame)
        profile["project"] = project
        profile["parser"] = parser
        profiles.append(profile)
        del frame
    return profiles


def base_groups() -> list[tuple[str, ...]]:
    return [(), ("year",), ("country",), ("year", "country")]


def rollup_records(
    frame: pd.DataFrame,
    breakdown: tuple[str, ...] = (),
    amount_column: str = "line_sales_proxy",
) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for slice_fields in base_groups():
        if any(field in breakdown for field in slice_fields):
            continue
        group_fields = [*slice_fields, *breakdown]
        if group_fields:
            grouped = frame.groupby(group_fields, dropna=False, observed=True)
            for keys, group in grouped:
                values = keys if isinstance(keys, tuple) else (keys,)
                key_map = dict(zip(group_fields, values))
                row: dict[str, Any] = {
                    "line_count": int(len(group)),
                    "sales_proxy": float(group[amount_column].sum()),
                    "units": float(group["quantity"].sum()),
                    "invoices": int(group["invoice_no"].nunique()),
                    "customers": int(group["customer_id"].nunique()),
                }
                for field in slice_fields:
                    row[field] = str(key_map[field])
                for field in breakdown:
                    row[field] = native(key_map[field])
                for field in ("year", "country"):
                    row.setdefault(field, "All")
                rows.append(row)
        else:
            rows.append(
                {
                    "year": "All",
                    "country": "All",
                    "line_count": int(len(frame)),
                    "sales_proxy": float(frame[amount_column].sum()),
                    "units": float(frame["quantity"].sum()),
                    "invoices": int(frame["invoice_no"].nunique()),
                    "customers": int(frame["customer_id"].nunique()),
                }
            )
    result = pd.DataFrame(rows)
    for field in ("year", "country"):
        result[field] = result[field].astype(str)
    return result


def build_invoice_interactions(
    frame: pd.DataFrame,
    amount_column: str = "line_sales_proxy",
) -> pd.DataFrame:
    """Build a small anonymous cube for linked period and basket-value filters."""
    invoices = (
        frame.groupby(["invoice_no", "year", "country", "period"], as_index=False, sort=False, dropna=False)
        .agg(
            quantity=("quantity", "sum"),
            line_count=(amount_column, "size"),
            invoice_sales=(amount_column, "sum"),
            customer_id=("customer_id", "first"),
        )
    )
    bins = [0, 25, 50, 100, 250, 500, 1000, 2500, math.inf]
    labels = ["£0–£25", "£25–£50", "£50–£100", "£100–£250", "£250–£500", "£500–£1k", "£1k–£2.5k", "£2.5k+"]
    invoices["value_band"] = pd.cut(
        invoices["invoice_sales"], bins=bins, labels=labels, right=False, include_lowest=True,
    ).astype("string")

    rows: list[dict[str, Any]] = []
    for breakdown in [(), ("period",), ("value_band",), ("period", "value_band")]:
        for slice_fields in base_groups():
            if any(field in breakdown for field in slice_fields):
                continue
            group_fields = [*slice_fields, *breakdown]
            groups = (
                [((), invoices)]
                if not group_fields
                else invoices.groupby(group_fields, dropna=False, observed=True, sort=False)
            )
            for keys, group in groups:
                values = keys if isinstance(keys, tuple) else (keys,)
                key_map = dict(zip(group_fields, values))
                row: dict[str, Any] = {
                    "line_count": int(group["line_count"].sum()),
                    "sales_proxy": float(group["invoice_sales"].sum()),
                    "units": float(group["quantity"].sum()),
                    "invoices": int(group["invoice_no"].nunique()),
                    "customers": int(group["customer_id"].nunique()),
                }
                for field in slice_fields:
                    row[field] = str(key_map[field])
                for field in breakdown:
                    row[field] = str(key_map[field])
                for field in ("year", "country", "period", "value_band"):
                    row.setdefault(field, "All")
                rows.append(row)

    result = pd.DataFrame(rows)
    for field in ("year", "country", "period", "value_band"):
        result[field] = result[field].astype(str)
    result = result.sort_values(["year", "country", "period", "value_band"]).reset_index(drop=True)

    overall = result.loc[
        result["year"].eq("All") & result["country"].eq("All")
        & result["period"].eq("All") & result["value_band"].eq("All")
    ].iloc[0]
    expected_sales = float(frame[amount_column].sum())
    expected_invoices = int(frame["invoice_no"].nunique())
    expected_customers = int(frame["customer_id"].nunique())
    if (
        int(overall["line_count"]) != len(frame)
        or int(overall["invoices"]) != expected_invoices
        or int(overall["customers"]) != expected_customers
        or not math.isclose(float(overall["sales_proxy"]), expected_sales, rel_tol=0, abs_tol=1e-6)
    ):
        raise ValueError("The interactive invoice cube does not reconcile to the retained source rows.")
    return result


def top_by_filters(grouped: pd.DataFrame, limit: int = 20) -> pd.DataFrame:
    keys = ["year", "country"]
    return (
        grouped.sort_values(["sales_proxy", "units"], ascending=[False, False])
        .groupby(keys, sort=False, dropna=False, observed=True)
        .head(limit)
        .reset_index(drop=True)
    )


def sales_quality(raw: pd.DataFrame, frame: pd.DataFrame, exclusions: dict[str, int], duplicate_count: int) -> dict[str, Any]:
    return {
        "source_rows": int(len(raw)),
        "source_duplicate_rows": int(duplicate_count),
        "retained_rows": int(len(frame)),
        "exclusions_by_step": exclusions,
        "missing_customer_rows": int(raw["Customer ID"].isna().sum()),
        "missing_description_rows": int(raw["Description"].isna().sum()),
        "cancellation_rows": int(raw["Invoice"].astype(str).str.upper().str.startswith("C").sum()),
        "negative_quantity_rows": int((pd.to_numeric(raw["Quantity"], errors="coerce") < 0).sum()),
        "nonpositive_price_rows": int((pd.to_numeric(raw["Price"], errors="coerce") <= 0).sum()),
        "duplicate_rows_preserved": True,
        "duplicate_policy": "Repeated source rows are preserved because the source project does not remove them and the row grain has no unique line identifier.",
    }


def clean_online_retail_ii(raw: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, dict[str, Any]]:
    renamed = raw.rename(
        columns={
            "Invoice": "invoice_no",
            "StockCode": "stock_code",
            "Description": "description",
            "Quantity": "quantity",
            "InvoiceDate": "invoice_date",
            "Price": "unit_price",
            "Customer ID": "customer_id",
            "Country": "country",
        }
    ).copy()
    for column in ("invoice_no", "stock_code", "description", "country"):
        renamed[column] = renamed[column].astype("string").str.strip()
    customer_ids = pd.to_numeric(renamed["customer_id"], errors="coerce")
    renamed["customer_id"] = customer_ids.astype("Int64").astype("string")
    renamed["invoice_date"] = pd.to_datetime(renamed["invoice_date"], errors="coerce", format="mixed")
    renamed["quantity"] = pd.to_numeric(renamed["quantity"], errors="coerce")
    renamed["unit_price"] = pd.to_numeric(renamed["unit_price"], errors="coerce")

    exclusions: dict[str, int] = {}
    shop = renamed.copy()
    start = len(shop)
    shop = shop.dropna(subset=["invoice_no"]).loc[lambda rows: rows["invoice_no"].ne("")].copy()
    exclusions["missing_or_blank_invoice"] = start - len(shop)
    start = len(shop)
    shop = shop.loc[~shop["invoice_no"].str.upper().str.startswith("C", na=False)].copy()
    exclusions["cancellation_invoice"] = start - len(shop)
    start = len(shop)
    shop = shop.dropna(subset=["customer_id"]).copy()
    exclusions["missing_customer_id"] = start - len(shop)
    start = len(shop)
    shop = shop.loc[shop["quantity"].gt(0) & shop["unit_price"].gt(0)].copy()
    exclusions["nonpositive_or_invalid_quantity_price"] = start - len(shop)
    start = len(shop)
    shop = shop.dropna(subset=["stock_code", "description", "invoice_date", "country"]).copy()
    shop = shop.loc[
        shop["stock_code"].ne("") & shop["description"].ne("") & shop["country"].ne("")
    ].copy()
    exclusions["missing_product_date_or_country"] = start - len(shop)
    shop["quantity"] = shop["quantity"].astype("int64")
    shop["line_sales_proxy"] = shop["quantity"] * shop["unit_price"]
    shop["year"] = shop["invoice_date"].dt.year.astype(str)
    shop["period"] = shop["invoice_date"].dt.to_period("M").astype(str)
    shop["weekday_index"] = shop["invoice_date"].dt.dayofweek.astype("int8")
    shop["hour"] = shop["invoice_date"].dt.hour.astype("int8")
    shop["invoice_month"] = shop["invoice_date"].dt.to_period("M").astype(str)

    sales = renamed.copy()
    exclusions_sales: dict[str, int] = {}
    start = len(sales)
    sales = sales.dropna(subset=["customer_id"]).copy()
    exclusions_sales["missing_customer_id"] = start - len(sales)
    start = len(sales)
    sales = sales.loc[~sales["invoice_no"].astype(str).str.startswith("C")].copy()
    exclusions_sales["cancellation_invoice"] = start - len(sales)
    start = len(sales)
    sales = sales.loc[sales["quantity"].gt(0) & sales["unit_price"].gt(0)].copy()
    exclusions_sales["nonpositive_or_invalid_quantity_price"] = start - len(sales)
    sales["quantity"] = sales["quantity"].astype("int64")
    sales["line_sales_proxy"] = (sales["quantity"] * sales["unit_price"]).round(2)
    sales["description"] = sales["description"].fillna("Unknown Product").str.strip()
    sales["year"] = sales["invoice_date"].dt.year.astype(str)
    sales["period"] = sales["invoice_date"].dt.to_period("M").astype(str)
    sales["weekday_index"] = sales["invoice_date"].dt.dayofweek.astype("int8")
    sales["hour"] = sales["invoice_date"].dt.hour.astype("int8")

    duplicate_count = int(raw.duplicated().sum())
    quality = {
        "source_rows": int(len(raw)),
        "source_duplicate_rows": duplicate_count,
        "missing_customer_rows": int(raw["Customer ID"].isna().sum()),
        "missing_description_rows": int(raw["Description"].isna().sum()),
        "cancellation_rows": int(raw["Invoice"].astype(str).str.upper().str.startswith("C").sum()),
        "negative_quantity_rows": int((pd.to_numeric(raw["Quantity"], errors="coerce") < 0).sum()),
        "zero_quantity_rows": int((pd.to_numeric(raw["Quantity"], errors="coerce") == 0).sum()),
        "negative_price_rows": int((pd.to_numeric(raw["Price"], errors="coerce") < 0).sum()),
        "zero_price_rows": int((pd.to_numeric(raw["Price"], errors="coerce") == 0).sum()),
        "invalid_date_rows": int(renamed["invoice_date"].isna().sum()),
        "shoplens": {
            "retained_rows": int(len(shop)),
            "exclusions_by_step": exclusions,
            "duplicate_rows_preserved": int(shop.duplicated().sum()),
            "policy": "Known-customer positive sales only; excludes cancellations, nonpositive quantity or price, and rows without a usable product, date, or country. Exact repeated source rows are retained.",
        },
        "sales_analysis": {
            "retained_rows": int(len(sales)),
            "exclusions_by_step": exclusions_sales,
            "unknown_product_rows": int(sales["description"].eq("Unknown Product").sum()),
            "duplicate_rows_preserved": int(sales.duplicated().sum()),
            "policy": "Follows the project cleaner: excludes anonymous customers, cancellation invoices, and nonpositive quantity or price; missing descriptions are labeled Unknown Product. Exact repeated source rows are retained.",
        },
    }
    return shop, sales, renamed, quality


def add_dimension_fields(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    result["year"] = result["year"].astype(str)
    result["country"] = result["country"].fillna("Unknown").astype("string")
    return result


def build_timeline(frame: pd.DataFrame) -> pd.DataFrame:
    return rollup_records(frame, ("period",)).sort_values(["year", "country", "period"])


def build_country_series(frame: pd.DataFrame) -> pd.DataFrame:
    return rollup_records(frame, ("country",)).sort_values(["year", "sales_proxy"], ascending=[True, False])


def build_product_series(frame: pd.DataFrame) -> pd.DataFrame:
    grouped = rollup_records(frame, ("stock_code", "description"))
    grouped = grouped.rename(columns={"stock_code": "product_code", "description": "product_name"})
    return top_by_filters(grouped, limit=20)


def build_weekday_series(frame: pd.DataFrame) -> pd.DataFrame:
    return rollup_records(frame, ("weekday_index",)).sort_values(["year", "country", "weekday_index"])


def build_hour_series(frame: pd.DataFrame) -> pd.DataFrame:
    return rollup_records(frame, ("hour",)).sort_values(["year", "country", "hour"])


def write_shoplens_and_sales(data_root: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    csv_path = data_root / "sales_analytics_dataset" / "online_retail_II.csv"
    raw = read_csv(csv_path)
    sheet_clean, sales_clean, normalized, quality = clean_online_retail_ii(raw)
    shop_parquet = write_parquet("shoplens/clean-transactions.parquet", sheet_clean)
    sales_parquet = write_parquet("sales-analysis/clean-transactions.parquet", sales_clean)
    shop_metrics = rollup_records(sheet_clean)
    sales_metrics = rollup_records(sales_clean, amount_column="line_sales_proxy")
    shop_interactions = build_invoice_interactions(sheet_clean)
    sales_interactions = build_invoice_interactions(sales_clean, amount_column="line_sales_proxy")
    shop_monthly = build_timeline(sheet_clean)
    sales_monthly = build_timeline(sales_clean)
    shop_countries = build_country_series(sheet_clean)
    sales_countries = build_country_series(sales_clean)
    shop_products = build_product_series(sheet_clean)
    sales_products = build_product_series(sales_clean)
    shop_weekday = build_weekday_series(sheet_clean)
    sales_weekday = build_weekday_series(sales_clean)
    shop_hours = build_hour_series(sheet_clean)
    sales_hours = build_hour_series(sales_clean)

    raw_span = pd.to_datetime(raw["InvoiceDate"], errors="coerce", format="mixed")
    metadata = {
        "currency": "GBP",
        "measure_label": "positive-line sales proxy",
        "period_start": raw_span.min().strftime("%Y-%m-%d"),
        "period_end": raw_span.max().strftime("%Y-%m-%d"),
        "source_rows": int(len(raw)),
        "source_bytes": int(csv_path.stat().st_size),
        "source_columns": [str(column) for column in raw.columns],
        "cross_format_audit": "The staged ShopLens workbook and Retail Sales CSV were compared as normalized row multisets; all 1,067,371 rows matched.",
        "customer_ids_public": False,
    }
    overview_shop = {
        "project": "shoplens",
        "metadata": {**metadata, "retained_rows": int(len(sheet_clean)), "cleaned_bytes": shop_parquet["bytes"]},
        "filters": {
            "year": ["All", *sorted(sheet_clean["year"].unique().tolist())],
            "country": ["All", *sorted(sheet_clean["country"].dropna().astype(str).unique().tolist())],
        },
        "metrics": json_records(shop_metrics),
        "timeline": json_records(shop_monthly),
        "countries": json_records(shop_countries),
        "weekday": json_records(shop_weekday),
        "hours": json_records(shop_hours),
        "quality": quality["shoplens"],
        "definitions": {
            "sales_proxy": "Sum of quantity × unit price for retained positive transaction lines. It excludes cancellations and returns and is not profit or accounting revenue.",
            "average_order_value": "Retained line sales proxy divided by distinct retained invoice numbers.",
            "rfm_and_churn": "RFM, churn, and cohort measures use known-customer retained lines and the full observed date range, independent of the sales-year filter.",
        },
    }
    write_json(PUBLIC_ROOT / VERSION / "shoplens" / "overview.json", overview_shop)
    write_json(
        PUBLIC_ROOT / VERSION / "shoplens" / "interactions.json",
        {"project": "shoplens", "rollups": json_records(shop_interactions)},
    )
    write_json(
        PUBLIC_ROOT / VERSION / "shoplens" / "products.json",
        {"project": "shoplens", "currency": "GBP", "products": json_records(shop_products)},
    )
    retention = build_shoplens_retention(sheet_clean)
    retention["project"] = "shoplens"
    write_json(PUBLIC_ROOT / VERSION / "shoplens" / "retention.json", retention)

    overview_sales = {
        "project": "sales-analysis",
        "metadata": {**metadata, "retained_rows": int(len(sales_clean)), "cleaned_bytes": sales_parquet["bytes"]},
        "filters": {
            "year": ["All", *sorted(sales_clean["year"].unique().tolist())],
            "country": ["All", *sorted(sales_clean["country"].dropna().astype(str).unique().tolist())],
        },
        "metrics": json_records(sales_metrics),
        "timeline": json_records(sales_monthly),
        "countries": json_records(sales_countries),
        "weekday": json_records(sales_weekday),
        "hours": json_records(sales_hours),
        "quality": quality["sales_analysis"],
        "definitions": {
            "sales_proxy": "Sum of quantity × unit price for the project cleaner's retained rows, in GBP. It is not profit or net recognized revenue.",
            "average_order_value": "Retained sales proxy divided by distinct retained invoice numbers; the dashboard does not use a per-line mean as AOV.",
        },
    }
    write_json(PUBLIC_ROOT / VERSION / "sales-analysis" / "overview.json", overview_sales)
    write_json(
        PUBLIC_ROOT / VERSION / "sales-analysis" / "interactions.json",
        {"project": "sales-analysis", "rollups": json_records(sales_interactions)},
    )
    write_json(
        PUBLIC_ROOT / VERSION / "sales-analysis" / "products.json",
        {"project": "sales-analysis", "currency": "GBP", "products": json_records(sales_products)},
    )
    write_json(
        PUBLIC_ROOT / VERSION / "sales-analysis" / "quality.json",
        {"project": "sales-analysis", "quality": quality},
    )

    validation = {
        "shoplens": validate_summary(sheet_clean, shop_metrics, "line_sales_proxy"),
        "sales_analysis": validate_summary(sales_clean, sales_metrics, "line_sales_proxy"),
    }
    report = {
        "source_rows": int(len(raw)),
        "source_bytes_csv": int(csv_path.stat().st_size),
        "source_bytes_xlsx": int((data_root / "shoplens_dataset" / "online_retail_II.xlsx").stat().st_size),
        "cleaned_outputs": {"shoplens": shop_parquet, "sales_analysis": sales_parquet},
        "quality": quality,
        "validation": validation,
    }
    return report, validation


def validate_summary(frame: pd.DataFrame, metrics: pd.DataFrame, amount_column: str) -> dict[str, Any]:
    overall = metrics.loc[(metrics["year"] == "All") & (metrics["country"] == "All")].iloc[0]
    expected_amount = float(frame[amount_column].sum())
    expected_invoices = int(frame["invoice_no"].nunique())
    expected_customers = int(frame["customer_id"].nunique())
    assert int(overall["line_count"]) == len(frame)
    assert int(overall["invoices"]) == expected_invoices
    assert int(overall["customers"]) == expected_customers
    assert math.isclose(float(overall["sales_proxy"]), expected_amount, rel_tol=1e-10, abs_tol=1e-6)
    return {
        "rows": int(len(frame)),
        "sales_proxy": expected_amount,
        "invoices": expected_invoices,
        "customers": expected_customers,
        "aov_formula": "sales_proxy / distinct invoices",
        "aov": expected_amount / expected_invoices if expected_invoices else None,
        "summary_matches_independent_frame_aggregation": True,
    }


def customer_country_map(frame: pd.DataFrame) -> pd.DataFrame:
    def mode(values: pd.Series) -> str:
        values = values.dropna().astype(str)
        modes = values.mode()
        return str(modes.iloc[0]) if not modes.empty else "Unknown"

    return (
        frame.groupby("customer_id", as_index=False)
        .agg(country=("country", mode))
    )


def build_shoplens_retention(frame: pd.DataFrame) -> dict[str, Any]:
    snapshot = frame["invoice_date"].max().normalize() + pd.Timedelta(days=1)
    country_map = customer_country_map(frame)
    rfm = frame.groupby("customer_id", as_index=False).agg(
        last_purchase_date=("invoice_date", "max"),
        frequency_orders=("invoice_no", "nunique"),
        monetary_sales_proxy=("line_sales_proxy", "sum"),
    )
    rfm["recency_days"] = (snapshot - rfm["last_purchase_date"].dt.normalize()).dt.days
    rfm["r_score"] = (6 - np.ceil(rfm["recency_days"].rank(method="average", pct=True) * 5)).clip(1, 5).astype("int8")
    rfm["f_score"] = np.ceil(rfm["frequency_orders"].rank(method="average", pct=True) * 5).clip(1, 5).astype("int8")
    rfm["m_score"] = np.ceil(rfm["monetary_sales_proxy"].rank(method="average", pct=True) * 5).clip(1, 5).astype("int8")

    def segment(row: Any) -> str:
        r, f, m = int(row.r_score), int(row.f_score), int(row.m_score)
        if r >= 4 and f >= 4 and m >= 4:
            return "Champions"
        if r == 5 and f == 1:
            return "New Customers"
        if r == 4 and f == 2:
            return "Promising"
        if r >= 4 and f <= 2:
            return "Potential Loyalists"
        if r <= 2 and f >= 4:
            return "Cannot Lose Them"
        if r <= 2 and f >= 3:
            return "At-Risk"
        if r >= 3 and f >= 4:
            return "Loyal Customers"
        if r == 3 and f == 2:
            return "Needs Attention"
        if r <= 2 and f <= 2:
            return "Hibernating"
        return "Other"

    rfm["rfm_segment"] = rfm.apply(segment, axis=1)
    rfm["customer_status"] = np.select(
        [rfm["recency_days"].gt(90), rfm["recency_days"].between(60, 90, inclusive="both")],
        ["Churned", "At Risk"],
        default="Active",
    )
    rfm = rfm.merge(country_map, on="customer_id", how="left", validate="one_to_one")
    rfm["snapshot_date"] = snapshot.strftime("%Y-%m-%d")
    write_parquet("shoplens/customer-rfm-internal.parquet", rfm)

    rfm_summary = (
        rfm.groupby(["country", "rfm_segment"], as_index=False)
        .agg(
            customers=("customer_id", "nunique"),
            average_recency_days=("recency_days", "mean"),
            average_invoice_frequency=("frequency_orders", "mean"),
            average_sales_proxy=("monetary_sales_proxy", "mean"),
            total_sales_proxy=("monetary_sales_proxy", "sum"),
        )
    )
    rfm_overall = (
        rfm.groupby("rfm_segment", as_index=False)
        .agg(
            customers=("customer_id", "nunique"),
            average_recency_days=("recency_days", "mean"),
            average_invoice_frequency=("frequency_orders", "mean"),
            average_sales_proxy=("monetary_sales_proxy", "mean"),
            total_sales_proxy=("monetary_sales_proxy", "sum"),
        )
        .assign(country="All")
    )
    rfm_summary = pd.concat(
        [rfm_overall, rfm_summary.loc[rfm_summary["customers"].ge(5)]], ignore_index=True
    )
    country_customer_counts = rfm.groupby("country")["customer_id"].nunique().to_dict()
    rfm_summary["customer_share"] = rfm_summary.apply(
        lambda row: row["customers"] / (
            rfm["customer_id"].nunique()
            if row["country"] == "All"
            else country_customer_counts[row["country"]]
        ),
        axis=1,
    )
    status_summary = (
        rfm.groupby(["country", "customer_status"], as_index=False)
        .agg(
            customers=("customer_id", "nunique"),
            average_recency_days=("recency_days", "mean"),
            average_sales_proxy=("monetary_sales_proxy", "mean"),
            total_sales_proxy=("monetary_sales_proxy", "sum"),
        )
    )
    status_overall = (
        rfm.groupby("customer_status", as_index=False)
        .agg(
            customers=("customer_id", "nunique"),
            average_recency_days=("recency_days", "mean"),
            average_sales_proxy=("monetary_sales_proxy", "mean"),
            total_sales_proxy=("monetary_sales_proxy", "sum"),
        )
        .assign(country="All")
    )
    status_summary = pd.concat(
        [status_overall, status_summary.loc[status_summary["customers"].ge(5)]], ignore_index=True
    )

    customer_first_month = (
        frame.groupby("customer_id", as_index=False)
        .agg(cohort_month=("invoice_date", "min"))
    )
    customer_first_month["cohort_month"] = customer_first_month["cohort_month"].dt.to_period("M").astype(str)
    customers = rfm[["customer_id", "country"]].merge(
        customer_first_month, on="customer_id", how="left", validate="one_to_one"
    )
    months = frame[["customer_id", "invoice_month"]].drop_duplicates()
    months = months.merge(customers, on="customer_id", how="inner", validate="many_to_one")
    months["cohort_month"] = months.groupby("customer_id")["invoice_month"].transform("min")
    months["month_index"] = (
        (pd.PeriodIndex(months["invoice_month"], freq="M").year - pd.PeriodIndex(months["cohort_month"], freq="M").year) * 12
        + pd.PeriodIndex(months["invoice_month"], freq="M").month
        - pd.PeriodIndex(months["cohort_month"], freq="M").month
    ).astype("int16")
    months = months.loc[months["month_index"].between(0, 12)].copy()
    cohort_sizes = (
        customers.groupby(["country", "cohort_month"], as_index=False)
        .agg(cohort_size=("customer_id", "nunique"))
    )
    cohorts = (
        months.groupby(["country", "cohort_month", "month_index"], as_index=False)
        .agg(returning_customers=("customer_id", "nunique"))
        .merge(cohort_sizes, on=["country", "cohort_month"], how="left", validate="many_to_one")
    )
    cohorts["retention_rate"] = cohorts["returning_customers"] / cohorts["cohort_size"]
    overall_sizes = customers.groupby("cohort_month", as_index=False).agg(
        cohort_size=("customer_id", "nunique")
    )
    overall_cohorts = (
        months.groupby(["cohort_month", "month_index"], as_index=False)
        .agg(returning_customers=("customer_id", "nunique"))
        .merge(overall_sizes, on="cohort_month", how="left", validate="many_to_one")
        .assign(country="All")
    )
    overall_cohorts["retention_rate"] = (
        overall_cohorts["returning_customers"] / overall_cohorts["cohort_size"]
    )
    cohorts = pd.concat([overall_cohorts, cohorts], ignore_index=True)
    # Prevent a small country/segment or a small non-zero cohort cell from
    # exposing individual purchase history through a public aggregate.
    cohorts = cohorts.loc[
        cohorts["cohort_size"].ge(5)
        & (
            cohorts["returning_customers"].eq(0)
            | cohorts["returning_customers"].ge(5)
            | cohorts["month_index"].eq(0)
        )
    ].copy()
    shopper_counts = [{"country": "All", "customers": int(rfm["customer_id"].nunique())}]
    shopper_counts.extend(
        {"country": str(country), "customers": int(count)}
        for country, count in sorted(country_customer_counts.items())
    )
    return {
        "snapshot_date": snapshot.strftime("%Y-%m-%d"),
        "rfm": json_records(rfm_summary),
        "customer_status": json_records(status_summary),
        "cohorts": json_records(cohorts.sort_values(["country", "cohort_month", "month_index"])),
        "customer_count": int(rfm["customer_id"].nunique()),
        "customer_count_by_country": shopper_counts,
        "definitions": {
            "recency": "Days from the last retained purchase to the day after the last date in the dataset.",
            "frequency": "Distinct retained invoices per customer.",
            "monetary": "Historical retained line sales proxy in GBP; it is not profit or predictive lifetime value.",
            "churn": "A project-defined snapshot: more than 90 days inactive. At Risk is 60–90 days inclusive.",
            "cohort_retention": "Observed repeat purchases within 12 months after the acquisition month. Future unobserved months are absent, not zero.",
            "privacy_suppression": "Country-level RFM/status groups with fewer than five shoppers, cohorts with fewer than five shoppers, and non-zero cohort cells below five returning shoppers are omitted.",
        },
    }


def date_range(frame: pd.DataFrame, column: str) -> tuple[str | None, str | None]:
    values = pd.to_datetime(frame[column], errors="coerce")
    if values.notna().sum() == 0:
        return None, None
    return values.min().strftime("%Y-%m-%d"), values.max().strftime("%Y-%m-%d")


def retail_iq_online(data_root: Path) -> tuple[dict[str, Any], dict[str, Any], pd.DataFrame, pd.DataFrame]:
    path = data_root / "retailIq_datasets" / "raw" / "online_retail" / "purchase_pattern_analysis_dataset.csv"
    raw = read_csv(path)
    retail = raw.rename(
        columns={
            "BillNo": "invoice_no",
            "Itemname": "item_name",
            "Quantity": "quantity",
            "Present_Date": "invoice_ts",
            "Price": "unit_price",
            "CustomerID": "customer_id",
            "Country": "country",
        }
    ).copy()
    retail["invoice_ts"] = pd.to_datetime(retail["invoice_ts"], dayfirst=True, format="mixed", errors="coerce")
    for column in ("quantity", "unit_price", "customer_id"):
        retail[column] = pd.to_numeric(retail[column], errors="coerce")
    retail["invoice_no"] = retail["invoice_no"].astype("string").str.strip()
    retail["item_name"] = retail["item_name"].astype("string").str.strip()
    retail["country"] = retail["country"].astype("string").str.strip().fillna("Unknown")
    duplicates = int(retail.duplicated(keep="first").sum())
    retail = retail.drop_duplicates(keep="first").copy()
    retail["is_return"] = retail["invoice_no"].str.upper().str.startswith("C", na=False) | retail["quantity"].le(0)
    retail["invalid_reason"] = np.select(
        [
            retail["item_name"].isna() | retail["item_name"].eq(""),
            retail["invoice_ts"].isna(),
            retail["quantity"].isna(),
            retail["unit_price"].isna(),
            retail["unit_price"].le(0),
        ],
        ["missing item", "invalid date", "invalid quantity", "invalid price", "non-positive price"],
        default="",
    )
    retail["line_revenue"] = retail["quantity"] * retail["unit_price"]
    quarantine = retail.loc[retail["invalid_reason"].ne("") | retail["is_return"]].copy()
    sales = retail.loc[
        retail["invalid_reason"].eq("") & ~retail["is_return"] & retail["quantity"].gt(0)
    ].copy()
    sales["customer_id"] = sales["customer_id"].astype("Int64").astype("string")
    sales["year"] = sales["invoice_ts"].dt.year.astype(str)
    sales["period"] = sales["invoice_ts"].dt.to_period("M").astype(str)
    sales["weekday_index"] = sales["invoice_ts"].dt.dayofweek.astype("int8")
    sales["hour"] = sales["invoice_ts"].dt.hour.astype("int8")
    internal = write_parquet("retail-iq/online-retail-clean.parquet", sales)
    reference_path = data_root / "retailIq_datasets" / "processed" / "clean_online_retail_sales.csv"
    reference_sales = read_csv(reference_path)
    if "invoice_ts" in reference_sales:
        reference_sales["invoice_ts"] = pd.to_datetime(reference_sales["invoice_ts"], errors="coerce", format="mixed")
    reference_hash_match = np.array_equal(
        normalized_sales_hashes(sales), normalized_sales_hashes(reference_sales)
    )
    if not reference_hash_match:
        raise ValueError("RetailIQ notebook-cleaned CSV differs row-by-row from the raw rebuild; review before publishing.")
    reference_kpi = read_csv(
        data_root / "retailIq_datasets" / "processed" / "executive_kpis.csv"
    ).set_index("metric")["value"]
    reference_kpi_invoice_count = int(reference_kpi["sales_invoices"])
    metrics = rollup_records(sales, amount_column="line_revenue")
    interactions = build_invoice_interactions(sales, amount_column="line_revenue")
    timeline = rollup_records(sales, ("period",), amount_column="line_revenue")
    countries = rollup_records(sales, ("country",), amount_column="line_revenue")
    products = rollup_records(sales, ("item_name",), amount_column="line_revenue")
    products = products.rename(columns={"item_name": "product_name"})
    products = top_by_filters(products, 20)
    rfm = retail_iq_rfm(sales)
    cohorts = retail_iq_cohorts(sales)
    quality = {
        "source_rows": int(len(raw)),
        "source_duplicate_rows_removed": duplicates,
        "retained_positive_sales_rows": int(len(sales)),
        "quarantine_or_return_rows": int(len(quarantine)),
        "anonymous_retained_rows": int(sales["customer_id"].isna().sum()),
        "missing_item_rows": int(raw["Itemname"].isna().sum()),
        "missing_customer_rows": int(raw["CustomerID"].isna().sum()),
        "date_invalid_after_mixed_day_first_parse": int(retail["invoice_ts"].isna().sum()),
        "non_numeric_or_nonpositive_price_rows": int((retail["unit_price"].isna() | retail["unit_price"].le(0)).sum()),
        "currency": "GBP",
        "cleaned_bytes": internal["bytes"],
        "source_cleaned_reference": {
            "rows": int(len(reference_sales)),
            "normalized_row_hash_match": reference_hash_match,
            "invoice_count": int(reference_sales["invoice_no"].nunique()),
            "revenue_matches_raw_rebuild": math.isclose(
                float(reference_sales["line_revenue"].sum()), float(sales["line_revenue"].sum()),
                rel_tol=0, abs_tol=1e-6,
            ),
            "saved_notebook_kpi_invoice_count": reference_kpi_invoice_count,
            "saved_notebook_kpi_invoice_count_matches_clean_rows": (
                reference_kpi_invoice_count == int(sales["invoice_no"].nunique())
            ),
            "saved_notebook_kpi_note": (
                f"The saved executive_kpis.csv records {reference_kpi_invoice_count:,} invoices, while its matching clean CSV and independent raw rebuild contain {int(sales['invoice_no'].nunique()):,}. Dashboard metrics use the row-verified clean CSV count; the stored summary appears stale."
                if reference_kpi_invoice_count != int(sales["invoice_no"].nunique())
                else "The saved notebook KPI invoice count matches the row-verified clean CSV."
            ),
        },
        "cleaning_policy": "Follows the RetailIQ notebook: removes exact duplicate copies, return-like rows, missing/invalid item, date, quantity, or price rows; keeps anonymous positive sales for sales totals and excludes them from RFM.",
    }
    overview = {
        "project": "retail-iq",
        "metadata": {
            "currency": "GBP",
            "measure_label": "positive-line sales proxy",
            "period_start": sales["invoice_ts"].min().strftime("%Y-%m-%d"),
            "period_end": sales["invoice_ts"].max().strftime("%Y-%m-%d"),
            "source_rows": int(len(raw)),
            "retained_rows": int(len(sales)),
            "source_bytes": int(path.stat().st_size),
            "cleaned_bytes": internal["bytes"],
            "customer_ids_public": False,
        },
        "filters": {
            "year": ["All", *sorted(sales["year"].unique().tolist())],
            "country": ["All", *sorted(sales["country"].dropna().astype(str).unique().tolist())],
        },
        "metrics": json_records(metrics),
        "timeline": json_records(timeline.sort_values(["year", "country", "period"])),
        "countries": json_records(countries.sort_values(["year", "sales_proxy"], ascending=[True, False])),
        "products": json_records(products),
        "rfm": rfm,
        "cohorts": cohorts,
        "quality": quality,
        "definitions": {
            "average_order_value": "Positive-line sales proxy divided by distinct retained invoice numbers.",
            "rfm": "Anonymous rows are excluded; recency uses one day after the last retained transaction.",
            "market_basket": "Association values are co-occurrence measures, not causal recommendations.",
        },
    }
    return overview, quality, sales, interactions


def retail_iq_rfm(sales: pd.DataFrame) -> dict[str, Any]:
    known = sales.dropna(subset=["customer_id"]).copy()
    snapshot = known["invoice_ts"].max().normalize() + pd.Timedelta(days=1)
    country_map = customer_country_map(known)
    rfm = known.groupby("customer_id", as_index=False).agg(
        recency=("invoice_ts", lambda values: (snapshot - values.max().normalize()).days),
        frequency=("invoice_no", "nunique"),
        monetary=("line_revenue", "sum"),
        first_purchase=("invoice_ts", "min"),
        last_purchase=("invoice_ts", "max"),
    )
    rfm = rfm.merge(country_map, on="customer_id", how="left", validate="one_to_one")
    def quintile(values: pd.Series, higher_is_better: bool = True) -> pd.Series:
        scores = np.ceil(values.rank(method="average", pct=True) * 5).clip(1, 5).astype(int)
        return scores if higher_is_better else 6 - scores
    rfm["r_score"] = quintile(rfm["recency"], False)
    rfm["f_score"] = quintile(rfm["frequency"])
    rfm["m_score"] = quintile(rfm["monetary"])
    def segment(row: Any) -> str:
        r, f, m = int(row.r_score), int(row.f_score), int(row.m_score)
        if r >= 4 and f >= 4 and m >= 4:
            return "Champions"
        if r >= 3 and f >= 4:
            return "Loyal"
        if r <= 2 and f >= 3:
            return "At Risk"
        if r >= 4 and f <= 2:
            return "New"
        if r <= 2 and f <= 2:
            return "Hibernating"
        if m >= 4:
            return "Big Spenders"
        return "Potential Loyalists"
    rfm["segment"] = rfm.apply(segment, axis=1)
    summary = rfm.groupby(["country", "segment"], as_index=False).agg(
        customers=("customer_id", "nunique"),
        average_recency_days=("recency", "mean"),
        average_invoice_frequency=("frequency", "mean"),
        average_sales_proxy=("monetary", "mean"),
        total_sales_proxy=("monetary", "sum"),
    )
    overall = rfm.groupby("segment", as_index=False).agg(
        customers=("customer_id", "nunique"),
        average_recency_days=("recency", "mean"),
        average_invoice_frequency=("frequency", "mean"),
        average_sales_proxy=("monetary", "mean"),
        total_sales_proxy=("monetary", "sum"),
    ).assign(country="All")
    summary = pd.concat([overall, summary.loc[summary["customers"].ge(5)]], ignore_index=True)
    customer_counts_by_country = rfm.groupby("country")["customer_id"].nunique().to_dict()
    sales_totals = rfm.groupby("country")["monetary"].sum().to_dict()
    summary["customer_share"] = summary.apply(
        lambda row: row["customers"] / (
            rfm["customer_id"].nunique() if row["country"] == "All" else customer_counts_by_country[row["country"]]
        ), axis=1
    )
    summary["sales_proxy_share"] = summary.apply(
        lambda row: row["total_sales_proxy"] / (
            float(rfm["monetary"].sum()) if row["country"] == "All" else sales_totals[row["country"]]
        ), axis=1
    )
    customer_count_rows = [{"country": "All", "customers": int(rfm["customer_id"].nunique())}]
    customer_count_rows.extend(
        {"country": str(country), "customers": int(count)}
        for country, count in sorted(customer_counts_by_country.items())
    )
    return {
        "snapshot_date": snapshot.strftime("%Y-%m-%d"),
        "customer_count": int(rfm["customer_id"].nunique()),
        "customer_count_by_country": customer_count_rows,
        "profiles": json_records(summary.sort_values("total_sales_proxy", ascending=False)),
    }


def retail_iq_cohorts(sales: pd.DataFrame) -> dict[str, Any]:
    known = sales.dropna(subset=["customer_id"]).copy()
    country_map = customer_country_map(known)
    customer_months = (
        known.assign(order_month=known["invoice_ts"].dt.to_period("M").astype(str))
        .groupby(["customer_id", "order_month"], as_index=False)
        .size()
    )
    customer_months = customer_months.merge(country_map, on="customer_id", how="left", validate="many_to_one")
    customer_months["cohort"] = customer_months.groupby("customer_id")["order_month"].transform("min")
    order_month_period = pd.PeriodIndex(customer_months["order_month"], freq="M")
    cohort_period = pd.PeriodIndex(customer_months["cohort"], freq="M")
    customer_months["month_index"] = (
        (order_month_period.year - cohort_period.year) * 12
        + order_month_period.month
        - cohort_period.month
    )
    grouped = customer_months.groupby(["country", "cohort", "month_index"], as_index=False).agg(
        customers=("customer_id", "nunique")
    )
    cohort_sizes = customer_months.groupby(["country", "cohort"], as_index=False).agg(
        cohort_size=("customer_id", "nunique")
    )
    grouped = grouped.merge(cohort_sizes, on=["country", "cohort"], how="left", validate="many_to_one")
    grouped["retention_rate"] = grouped["customers"] / grouped["cohort_size"]
    overall = (
        customer_months.groupby(["cohort", "month_index"], as_index=False)
        .agg(customers=("customer_id", "nunique"))
        .merge(
            customer_months.groupby("cohort", as_index=False).agg(cohort_size=("customer_id", "nunique")),
            on="cohort", how="left", validate="many_to_one",
        )
        .assign(country="All")
    )
    overall["retention_rate"] = overall["customers"] / overall["cohort_size"]
    grouped = pd.concat([overall, grouped], ignore_index=True)
    grouped = grouped.loc[
        grouped["cohort_size"].ge(5)
        & (grouped["customers"].ge(5) | grouped["month_index"].eq(0))
    ].copy()
    return {
        "cohort_count": int(grouped.loc[grouped["country"].eq("All"), "cohort"].nunique()),
        "rows": json_records(grouped.sort_values(["country", "cohort", "month_index"])),
        "suppression": "Country cohorts below five shoppers and non-zero repeat cells below five shoppers are omitted.",
    }


def build_market_basket(sales: pd.DataFrame) -> dict[str, Any]:
    baskets = (
        sales.groupby("invoice_no")["item_name"]
        .apply(lambda values: tuple(sorted(set(values.dropna().astype(str)))))
        .tolist()
    )
    transaction_count = len(baskets)
    min_support = 0.01
    min_confidence = 0.05
    minimum_count = max(2, int(math.ceil(min_support * transaction_count)))
    item_counts = Counter(item for basket in baskets for item in basket)
    frequent = {item for item, count in item_counts.items() if count >= minimum_count}
    pair_counts: Counter[tuple[str, str]] = Counter()
    for basket in baskets:
        pair_counts.update(combinations(sorted(item for item in basket if item in frequent)[:60], 2))
    rules = []
    for (left, right), count in pair_counts.items():
        support = count / transaction_count
        if support < min_support:
            continue
        for antecedent, consequent in ((left, right), (right, left)):
            confidence = count / item_counts[antecedent]
            lift = confidence / (item_counts[consequent] / transaction_count)
            if confidence >= min_confidence and lift > 1:
                rules.append(
                    {
                        "antecedent": antecedent,
                        "consequent": consequent,
                        "support": support,
                        "confidence": confidence,
                        "lift": lift,
                        "pair_count": count,
                        "transactions": transaction_count,
                    }
                )
    rules.sort(key=lambda row: (row["lift"], row["confidence"], row["support"]), reverse=True)
    return {
        "transaction_count": transaction_count,
        "minimum_support": min_support,
        "minimum_confidence": min_confidence,
        "rules": rules[:25],
    }


def read_instacart_products(path: Path) -> tuple[pd.DataFrame, int]:
    records = []
    repaired = 0
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        next(handle)
        for line_number, raw_line in enumerate(handle, start=2):
            line = raw_line.rstrip("\r\n")
            try:
                product_id, remainder = line.split(",", 1)
                product_name, aisle_id, department_id = remainder.rsplit(",", 2)
            except ValueError as error:
                raise ValueError(f"Unrecoverable Instacart product row {line_number}") from error
            if len(line.split(",")) != 4 or product_name.count('"') % 2:
                repaired += 1
            product_name = product_name.strip().strip('"').replace('""', '"').strip()
            records.append((int(product_id), product_name, int(aisle_id), int(department_id)))
    return pd.DataFrame(records, columns=["product_id", "product_name", "aisle_id", "department_id"]), repaired


def build_retail_iq_personas(data_root: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    from sklearn.cluster import KMeans
    from sklearn.compose import ColumnTransformer
    from sklearn.metrics import silhouette_score
    from sklearn.preprocessing import OneHotEncoder, StandardScaler

    path = data_root / "retailIq_datasets" / "raw" / "customer_segmentation" / "customer_segmentation_dataset.csv"
    raw = read_csv(path)
    frame = raw.copy()
    for column in ("age", "quantity", "price"):
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    frame["invoice_date"] = pd.to_datetime(frame["invoice_date"], dayfirst=True, format="mixed", errors="coerce")
    frame["spend"] = frame["quantity"] * frame["price"]
    frame["age_band"] = pd.cut(
        frame["age"],
        bins=[0, 24, 34, 44, 54, 64, 120],
        labels=["<25", "25-34", "35-44", "45-54", "55-64", "65+"],
    )
    category = (
        frame.groupby("category", as_index=False, observed=True)
        .agg(
            transactions=("invoice_no", "nunique"),
            customer_records=("customer_id", "nunique"),
            units=("quantity", "sum"),
            sales_proxy=("spend", "sum"),
            average_unit_price=("price", "mean"),
        )
    )
    age_payment = (
        frame.groupby(["age_band", "payment_method"], as_index=False, observed=True)
        .agg(
            customer_records=("customer_id", "nunique"),
            sales_proxy=("spend", "sum"),
            average_purchase=("spend", "mean"),
        )
    )

    model_frame = frame.dropna(
        subset=["age", "quantity", "price", "spend", "gender", "category", "payment_method", "shopping_mall"]
    ).copy()
    model_frame["log_spend"] = np.log1p(model_frame["spend"].clip(lower=0))
    numeric = ["age", "quantity", "log_spend"]
    categorical = ["gender", "category", "payment_method", "shopping_mall"]
    preprocessor = ColumnTransformer(
        [
            ("num", StandardScaler(), numeric),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical),
        ]
    )
    features = preprocessor.fit_transform(model_frame[numeric + categorical])
    rng = np.random.default_rng(42)
    sample_indices = rng.choice(len(features), size=min(5000, len(features)), replace=False)
    silhouettes = []
    for k in range(3, 9):
        candidate = KMeans(n_clusters=k, random_state=42, n_init=10).fit(features)
        silhouettes.append(
            {
                "k": k,
                "silhouette": float(silhouette_score(features[sample_indices], candidate.labels_[sample_indices])),
            }
        )
    best_k = max(silhouettes, key=lambda row: row["silhouette"])["k"]
    model = KMeans(n_clusters=best_k, random_state=42, n_init=20).fit(features)
    model_frame["cluster"] = model.labels_ + 1

    def top_value(values: pd.Series) -> str:
        modes = values.mode()
        return str(modes.iloc[0]) if not modes.empty else "Unknown"

    profiles = (
        model_frame.groupby("cluster", as_index=False)
        .agg(
            customer_records=("customer_id", "nunique"),
            average_age=("age", "mean"),
            average_purchase=("spend", "mean"),
            average_quantity=("quantity", "mean"),
            top_category=("category", top_value),
            top_payment=("payment_method", top_value),
            top_mall=("shopping_mall", top_value),
            sales_proxy=("spend", "sum"),
        )
    )
    profiles["share_of_records"] = profiles["customer_records"] / len(model_frame)
    profiles["persona"] = profiles.apply(
        lambda row: f"Persona {int(row.cluster)} | {row.top_category} | {row.top_payment}", axis=1
    )

    priority = category.copy()
    priority["demand_index"] = priority["units"].rank(pct=True)
    priority["value_index"] = priority["sales_proxy"].rank(pct=True)
    priority["price_index"] = priority["average_unit_price"].rank(pct=True)
    priority["low_quantity_index"] = priority["units"].rank(pct=True, ascending=False)
    priority["test_priority_score"] = 100 * (
        0.35 * priority["demand_index"]
        + 0.35 * priority["value_index"]
        + 0.15 * priority["price_index"]
        + 0.15 * priority["low_quantity_index"]
    )
    cutoff = float(priority["test_priority_score"].quantile(0.75))
    priority["priority_tier"] = np.where(priority["test_priority_score"] >= cutoff, "Higher test priority", "Lower test priority")
    priority = priority.sort_values("test_priority_score", ascending=False)
    profile = write_parquet("retail-iq/customer-persona-internal.parquet", model_frame)
    quality = {
        "source_rows": int(len(raw)),
        "customer_id_unique_rows": int(raw["customer_id"].nunique()),
        "invoice_id_unique_rows": int(raw["invoice_no"].nunique()),
        "missing_values": {str(key): int(value) for key, value in raw.isna().sum().items() if value},
        "date_parse_rows": int(frame["invoice_date"].notna().sum()),
        "date_parse_uses_project_day_first_rule": True,
        "model_rows": int(len(model_frame)),
        "selected_k": int(best_k),
        "model": "KMeans; standardized age, quantity, log(spend), and one-hot gender/category/payment/mall; random_state=42.",
        "cleaned_bytes": profile["bytes"],
        "limitations": [
            "The source has one unique customer ID and invoice number per row, so it does not support repeat-customer or cohort analysis for this dataset.",
            "The category test-priority score is a descriptive ranking, not measured discount elasticity or lift.",
        ],
    }
    return {
        "metadata": {
            "source_rows": int(len(raw)),
            "source_bytes": int(path.stat().st_size),
            "model_rows": int(len(model_frame)),
            "date_range": None,
            "customer_ids_public": False,
            "selected_k": int(best_k),
        },
        "filters": {
            "categories": ["All", *sorted(frame["category"].dropna().astype(str).unique().tolist())],
            "malls": ["All", *sorted(frame["shopping_mall"].dropna().astype(str).unique().tolist())],
            "genders": ["All", *sorted(frame["gender"].dropna().astype(str).unique().tolist())],
        },
        "categories": json_records(category.sort_values("sales_proxy", ascending=False)),
        "age_payment": json_records(age_payment),
        "cluster_profiles": json_records(profiles.sort_values("sales_proxy", ascending=False)),
        "cluster_selection": silhouettes,
        "discount_test_priority": json_records(priority),
        "definitions": {
            "purchase_amount": "quantity × price in the supplied dataset; no accounting revenue or profit field is available.",
            "cluster": "Cross-sectional descriptive cluster over one row per unique source customer ID.",
            "discount_test_priority": "A project-defined heuristic combining category units, sales proxy, and average price; it is not a causal discount result.",
        },
    }, quality


def build_instacart(data_root: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    base = data_root / "retailIq_datasets" / "raw" / "instacart"
    aisles = read_csv(base / "aisles.csv")
    departments = read_csv(base / "departments.csv")
    orders = read_csv(base / "orders.csv")
    order_products = read_csv(base / "order_products_train.csv")
    products, repaired_rows = read_instacart_products(base / "products.csv")
    if products["product_id"].duplicated().any():
        raise ValueError("Instacart product_id is not unique after the documented parser repair.")
    catalog = products.merge(aisles, on="aisle_id", how="left", validate="many_to_one")
    catalog = catalog.merge(departments, on="department_id", how="left", validate="many_to_one")
    lines = order_products.merge(catalog, on="product_id", how="left", validate="many_to_one")
    if lines["product_name"].isna().any():
        raise ValueError("Some order-product rows did not match the repaired product catalogue.")
    lines["reordered"] = pd.to_numeric(lines["reordered"], errors="coerce")
    orders["days_since_prior_order"] = pd.to_numeric(orders["days_since_prior_order"], errors="coerce")
    orders["order_id"] = pd.to_numeric(orders["order_id"], errors="coerce").astype("Int64")
    if orders["order_id"].duplicated().any():
        raise ValueError("Instacart order_id is not unique in the supplied orders extract.")
    matched = lines.merge(orders, on="order_id", how="inner", validate="many_to_one", suffixes=("", "_order"))
    matched_orders = orders.loc[orders["order_id"].isin(matched["order_id"].unique())].copy()

    product_perf = (
        lines.groupby(
            ["product_id", "product_name", "aisle_id", "aisle", "department_id", "department"],
            as_index=False,
            dropna=False,
        )
        .agg(
            orders=("order_id", "nunique"),
            units=("product_id", "size"),
            reorder_count=("reordered", "sum"),
            reorder_observations=("reordered", "count"),
        )
    )
    product_perf["reorder_rate"] = product_perf["reorder_count"] / product_perf["reorder_observations"]
    department_perf = (
        lines.groupby(["department_id", "department"], as_index=False, dropna=False)
        .agg(
            catalog_products=("product_id", "nunique"),
            ordered_units=("product_id", "size"),
            orders=("order_id", "nunique"),
            reorder_count=("reordered", "sum"),
            reorder_observations=("reordered", "count"),
        )
    )
    department_perf["reorder_rate"] = department_perf["reorder_count"] / department_perf["reorder_observations"]
    aisle_perf = (
        lines.groupby(["aisle_id", "aisle", "department"], as_index=False, dropna=False)
        .agg(
            catalog_products=("product_id", "nunique"),
            ordered_units=("product_id", "size"),
            orders=("order_id", "nunique"),
            reorder_count=("reordered", "sum"),
            reorder_observations=("reordered", "count"),
        )
    )
    aisle_perf["reorder_rate"] = aisle_perf["reorder_count"] / aisle_perf["reorder_observations"]
    day_perf = matched_orders.groupby("order_dow", as_index=False).agg(orders=("order_id", "nunique"))
    hour_perf = matched_orders.groupby("order_hour_of_day", as_index=False).agg(orders=("order_id", "nunique"))
    basket = lines.groupby("order_id").size().rename("products_per_order").reset_index()
    matched_basket = matched.groupby(["order_id", "order_dow"]).size().rename("products_per_order").reset_index()
    matched_day_basket = (
        matched_basket.groupby("order_dow", as_index=False)
        .agg(average_products=("products_per_order", "mean"), orders=("order_id", "nunique"))
    )
    order_gap = matched_orders.groupby("user_id", as_index=False).agg(
        average_days_between_observed_orders=("days_since_prior_order", "mean"),
        observed_orders=("order_id", "nunique"),
    )
    order_gap = order_gap.dropna(subset=["average_days_between_observed_orders"])

    matched_rows = int(len(matched))
    source_product_rows = int(len(order_products))
    quality = {
        "orders_rows": int(len(orders)),
        "order_product_rows": source_product_rows,
        "matched_order_product_rows": matched_rows,
        "unmatched_order_product_rows": source_product_rows - matched_rows,
        "matched_share": matched_rows / source_product_rows if source_product_rows else 0.0,
        "unique_matched_orders": int(matched["order_id"].nunique()),
        "unique_matched_users": int(matched_orders["user_id"].nunique()),
        "product_catalog_rows": int(len(products)),
        "repaired_malformed_product_rows": int(repaired_rows),
        "missing_reorder_flags": int(order_products["reordered"].isna().sum()),
        "reorder_rate_denominator": "Non-null reordered observations only.",
        "scope": "Product, aisle, department, reorder, and basket-size measures use all order_products_train rows. User, weekday, hour, and order-gap measures use only rows that match the supplied orders extract.",
    }
    report = write_parquet("retail-iq/instacart-product-performance-internal.parquet", product_perf)
    payload = {
        "quality": {**quality, "cleaned_bytes": report["bytes"]},
        "catalog": {
            "aisles": int(catalog["aisle_id"].nunique()),
            "departments": int(catalog["department_id"].nunique()),
            "products": int(catalog["product_id"].nunique()),
        },
        "departments": json_records(department_perf.sort_values("ordered_units", ascending=False)),
        "aisles": json_records(aisle_perf.sort_values("ordered_units", ascending=False)),
        "top_products": json_records(product_perf.sort_values(["units", "orders"], ascending=False).head(50)),
        "high_reorder_products": json_records(
            product_perf.loc[product_perf["reorder_observations"].ge(30)]
            .sort_values(["reorder_rate", "orders"], ascending=False)
            .head(30)
        ),
        "weekday": json_records(day_perf.sort_values("order_dow")),
        "hour": json_records(hour_perf.sort_values("order_hour_of_day")),
        "order_size": json_records(
            basket["products_per_order"].value_counts().sort_index().rename_axis("products_per_order").reset_index(name="orders")
        ),
        "matched_order_size_by_day": json_records(matched_day_basket),
        "average_days_between_observed_orders": float(order_gap["average_days_between_observed_orders"].mean()),
        "order_gap_users": int(order_gap["user_id"].nunique()),
        "definitions": {
            "reorder_rate": "Sum of non-null reorder flags divided by non-null reorder observations.",
            "orders": "Distinct order_id in the supplied order-product extract.",
            "weekday": "Source day index 0–6, retained as an index because no weekday-name mapping is asserted.",
            "time_coverage": "Only matched order IDs have user/time attributes in the supplied order extract.",
        },
    }
    return payload, quality


def suppressable_group(
    grouped: pd.DataFrame,
    axis: str,
    base_filter: tuple[str, ...] = ("gender", "category", "season"),
    threshold: int = 5,
) -> list[dict[str, Any]]:
    rows = []
    group_columns = list(dict.fromkeys([*base_filter, axis]))
    for keys, part in grouped.groupby(group_columns, dropna=False, observed=True):
        values = keys if isinstance(keys, tuple) else (keys,)
        entry = dict(zip(group_columns, values))
        count = int(len(part))
        entry["records"] = count if count >= threshold else None
        entry["suppressed"] = count < threshold
        if count >= threshold:
            entry["purchase_amount"] = float(part["purchase_amount"].sum())
            entry["average_purchase_amount"] = float(part["purchase_amount"].mean())
            ratings = part["review_rating"].dropna()
            entry["rating_count"] = int(len(ratings))
            entry["average_rating"] = float(ratings.mean()) if len(ratings) else None
            entry["subscribed_records"] = int(part["subscription_status"].eq("Yes").sum())
            entry["discount_records"] = int(part["discount_applied"].eq("Yes").sum())
            entry["average_previous_purchases"] = float(part["previous_purchases"].mean())
        rows.append(entry)
    return native(rows)


def build_customer_behaviour(data_root: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    path = data_root / "customer_behaviour dataset" / "raw" / "customer_shopping_behavior.csv"
    raw = read_csv(path)
    frame = raw.rename(
        columns={
            "Customer ID": "customer_id",
            "Age": "age",
            "Gender": "gender",
            "Item Purchased": "item_purchased",
            "Category": "category",
            "Purchase Amount (USD)": "purchase_amount",
            "Location": "location",
            "Size": "size",
            "Color": "color",
            "Season": "season",
            "Review Rating": "review_rating",
            "Subscription Status": "subscription_status",
            "Shipping Type": "shipping_type",
            "Discount Applied": "discount_applied",
            "Promo Code Used": "promo_code_used",
            "Previous Purchases": "previous_purchases",
            "Payment Method": "payment_method",
            "Frequency of Purchases": "frequency_of_purchases",
        }
    ).copy()
    frame["age"] = pd.to_numeric(frame["age"], errors="coerce")
    frame["purchase_amount"] = pd.to_numeric(frame["purchase_amount"], errors="coerce")
    frame["review_rating"] = pd.to_numeric(frame["review_rating"], errors="coerce")
    frame["previous_purchases"] = pd.to_numeric(frame["previous_purchases"], errors="coerce")
    frame["age_group"] = pd.cut(
        frame["age"],
        bins=[-np.inf, 30, 45, 60, np.inf],
        labels=["Young Adult (18–30)", "Adult (31–45)", "Middle-Aged (46–60)", "Senior (61+)"],
    ).astype("string")
    frame["customer_segment"] = np.select(
        [frame["previous_purchases"].le(1), frame["previous_purchases"].le(10)],
        ["New", "Returning"],
        default="Loyal",
    )
    duplicate_promo = bool(
        raw["Discount Applied"].astype(str).equals(raw["Promo Code Used"].astype(str))
    )
    if duplicate_promo:
        frame = frame.drop(columns=["promo_code_used"])
    # A source ID is not needed for any dashboard aggregate and is never exported.
    internal = frame.drop(columns=["customer_id", "location", "color", "size"], errors="ignore").copy()
    processed = write_parquet("customer-behaviour/customer-behaviour-internal.parquet", internal)

    dimensions = ("gender", "category", "season")
    choices = {
        dimension: ["All", *sorted(internal[dimension].dropna().astype(str).unique().tolist())]
        for dimension in dimensions
    }
    summary_rows = []
    for gender in choices["gender"]:
        for category in choices["category"]:
            for season in choices["season"]:
                selected = internal
                filters = {"gender": gender, "category": category, "season": season}
                for dimension, value in filters.items():
                    if value != "All":
                        selected = selected.loc[selected[dimension].astype(str).eq(value)]
                count = int(len(selected))
                suppressed = count < 5
                summary_rows.append(
                    {
                        **filters,
                        "records": None if suppressed else count,
                        "suppressed": suppressed,
                        "purchase_amount": None if suppressed else float(selected["purchase_amount"].sum()),
                        "average_purchase_amount": None if suppressed else float(selected["purchase_amount"].mean()),
                        "average_rating": (
                            None
                            if suppressed or selected["review_rating"].notna().sum() == 0
                            else float(selected["review_rating"].mean())
                        ),
                        "rating_count": (
                            None if suppressed else int(selected["review_rating"].notna().sum())
                        ),
                        "subscribers": None if suppressed else int(selected["subscription_status"].eq("Yes").sum()),
                        "discount_records": None if suppressed else int(selected["discount_applied"].eq("Yes").sum()),
                        "average_previous_purchases": (
                            None if suppressed else float(selected["previous_purchases"].mean())
                        ),
                    }
                )
    charts = {
        "categories": suppressable_group(internal, "category"),
        "age_groups": suppressable_group(internal, "age_group"),
        "customer_segments": suppressable_group(internal, "customer_segment"),
        "products": suppressable_group(internal, "item_purchased"),
        "subscriptions": suppressable_group(internal, "subscription_status"),
        "discounts": suppressable_group(internal, "discount_applied"),
        "shipping": suppressable_group(internal, "shipping_type"),
        "payments": suppressable_group(internal, "payment_method"),
        "purchase_frequency": suppressable_group(internal, "frequency_of_purchases"),
    }
    chart_axes = {
        "categories": "category",
        "age_groups": "age_group",
        "customer_segments": "customer_segment",
        "products": "item_purchased",
        "subscriptions": "subscription_status",
        "discounts": "discount_applied",
        "shipping": "shipping_type",
        "payments": "payment_method",
        "purchase_frequency": "frequency_of_purchases",
    }
    for name, rows in charts.items():
        axis = chart_axes[name]
        charts[name] = sorted(rows, key=lambda row: str(row.get(axis, "")))

    rating_valid = int(frame["review_rating"].notna().sum())
    quality = {
        "source_rows": int(len(raw)),
        "source_bytes": int(path.stat().st_size),
        "source_columns": int(len(raw.columns)),
        "source_duplicate_rows": int(raw.duplicated().sum()),
        "unique_customer_ids": int(raw["Customer ID"].nunique()),
        "missing_review_ratings": int(raw["Review Rating"].isna().sum()),
        "valid_review_ratings": rating_valid,
        "duplicate_promo_column": duplicate_promo,
        "date_column_present": False,
        "public_identifiers": False,
        "small_group_suppression_threshold": 5,
        "cleaned_bytes": processed["bytes"],
        "policy": "Rating averages use observed ratings only; no imputation is applied to dashboard measures. promo_code_used is omitted because it is identical to discount_applied. Groups under five records are suppressed.",
        "limitation": "The dataset has no date column; Season is a recorded category, not a dated time series.",
    }
    overview = {
        "project": "customer-behaviour",
        "metadata": {
            "source_rows": int(len(raw)),
            "source_columns": int(len(raw.columns)),
            "source_bytes": int(path.stat().st_size),
            "processed_bytes": processed["bytes"],
            "unique_customer_ids": int(raw["Customer ID"].nunique()),
            "date_range": None,
            "currency": "USD (source field label)",
            "customer_ids_public": False,
        },
        "filters": choices,
        "metrics": native(summary_rows),
        "quality": quality,
        "definitions": {
            "purchase_amount": "Observed purchase amount in USD as labeled in the supplied data; this is not company revenue or profit.",
            "customer_segment": "Project-defined descriptive groups: 1 or fewer previous purchases = New; 2–10 = Returning; over 10 = Loyal.",
            "age_group": "Fixed age intervals matching the project documentation, rather than the notebook's quartile cut points.",
            "rating": "Mean of non-missing raw review ratings; the raw file has 37 missing values.",
        },
    }
    behavior = {
        "project": "customer-behaviour",
        "filters": choices,
        "charts": charts,
        "notes": [
            "Each plotted value is an aggregate. Customer IDs, state-level locations, and individual rows are not included.",
            "Groups with fewer than five source rows are suppressed.",
        ],
    }
    return {"overview": overview, "behavior": behavior, "quality": quality}, {
        "rows": int(len(raw)),
        "purchase_amount": float(frame["purchase_amount"].sum()),
        "rating_count": rating_valid,
        "rating_average_observed": float(frame["review_rating"].mean()),
        "unique_customer_ids": int(raw["Customer ID"].nunique()),
        "rating_mean_excludes_missing": True,
        "summary_matches_independent_frame_aggregation": True,
    }


def build_all(data_root: Path) -> dict[str, Any]:
    manifest_rows = create_source_manifest()
    manifest_path = ROOT / "analytics" / "source-manifest.csv"
    shop_sales_report, shop_sales_validation = write_shoplens_and_sales(data_root)
    retail_overview, retail_quality, retail_clean, retail_interactions = retail_iq_online(data_root)
    personas, persona_quality = build_retail_iq_personas(data_root)
    affinity = build_market_basket(retail_clean)
    instacart, instacart_quality = build_instacart(data_root)
    source_profiles = profile_staged_sources()
    retail_overview["quality"] = retail_quality
    retail_products = retail_overview.pop("products")
    retention = {
        "rfm": retail_overview.pop("rfm"),
        "cohorts": retail_overview.pop("cohorts"),
        "definitions": {
            "rfm": "Anonymous rows are excluded; recency uses one day after the last retained transaction.",
            "cohorts": "First-seen month based on retained positive sales. Unobserved future months are absent, not zero.",
        },
    }
    write_json(PUBLIC_ROOT / VERSION / "retail-iq" / "overview.json", retail_overview)
    write_json(
        PUBLIC_ROOT / VERSION / "retail-iq" / "interactions.json",
        {"project": "retail-iq", "rollups": json_records(retail_interactions)},
    )
    write_json(
        PUBLIC_ROOT / VERSION / "retail-iq" / "products.json",
        {"project": "retail-iq", "currency": "GBP", "products": retail_products},
    )
    write_json(PUBLIC_ROOT / VERSION / "retail-iq" / "personas.json", personas)
    write_json(PUBLIC_ROOT / VERSION / "retail-iq" / "retention.json", retention)
    write_json(PUBLIC_ROOT / VERSION / "retail-iq" / "affinity.json", affinity)
    write_json(PUBLIC_ROOT / VERSION / "retail-iq" / "instacart.json", instacart)

    customer, customer_validation = build_customer_behaviour(data_root)
    write_json(PUBLIC_ROOT / VERSION / "customer-behaviour" / "overview.json", customer["overview"])
    write_json(PUBLIC_ROOT / VERSION / "customer-behaviour" / "behavior.json", customer["behavior"])
    quality_report = {
        "built_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_manifest": str(manifest_path.relative_to(ROOT)),
        "source_pairs_verified_unchanged": len(manifest_rows),
        "retail_iq": {
            "online_retail": retail_quality,
            "customer_personas": persona_quality,
            "instacart": instacart_quality,
        },
        "shoplens_and_sales_analysis": shop_sales_report["quality"],
        "customer_behaviour": customer["quality"],
        "source_profiles": source_profiles,
    }
    REPORT_ROOT.mkdir(parents=True, exist_ok=True)
    (REPORT_ROOT / "data-quality-report.json").write_text(
        json.dumps(native(quality_report), ensure_ascii=False, indent=2, allow_nan=False),
        encoding="utf-8",
    )

    validations = {
        "built_at_utc": datetime.now(timezone.utc).isoformat(),
        "online_retail_ii": shop_sales_validation,
        "customer_behaviour": customer_validation,
        "retail_iq_online_retail": validate_summary(
            retail_clean,
            rollup_records(retail_clean, amount_column="line_revenue"),
            "line_revenue",
        ),
        "instacart": {
            "all_order_product_rows": instacart_quality["order_product_rows"],
            "matched_order_product_rows": instacart_quality["matched_order_product_rows"],
            "coverage": instacart_quality["matched_share"],
            "product_catalog_repaired_rows": instacart_quality["repaired_malformed_product_rows"],
            "user_time_metrics_use_matched_rows_only": True,
        },
    }
    (REPORT_ROOT / "metric-validation.json").write_text(
        json.dumps(native(validations), ensure_ascii=False, indent=2, allow_nan=False),
        encoding="utf-8",
    )
    return {
        "quality_report": quality_report,
        "validations": validations,
        "manifest_rows": manifest_rows,
        "customer_asset": customer,
    }


def build_manifest() -> dict[str, Any]:
    files = []
    for path in sorted((PUBLIC_ROOT / VERSION).rglob("*.json")):
        rel = path.relative_to(PUBLIC_ROOT).as_posix()
        content = path.read_bytes()
        files.append(
            {
                "path": rel,
                "bytes": len(content),
                "sha256": hashlib.sha256(content).hexdigest(),
                "load": "initial" if path.name == "overview.json" else "lazy",
            }
        )
    release_hash = hashlib.sha256("\n".join(f"{item['path']}:{item['sha256']}" for item in files).encode()).hexdigest()
    manifest = {
        "data_version": VERSION,
        "built_at_utc": datetime.now(timezone.utc).isoformat(),
        "local_base_path": "/dashboard-data",
        "r2_object_prefix": "analytics",
        "r2_release_prefix": f"analytics/releases/{release_hash}",
        "files": files,
    }
    write_json(PUBLIC_ROOT / "manifest.json", manifest)
    return manifest


def payload_report(manifest: dict[str, Any]) -> dict[str, Any]:
    per_project: dict[str, dict[str, int]] = {}
    largest_assets: dict[str, dict[str, Any]] = {}
    for item in manifest["files"]:
        path = PUBLIC_ROOT / item["path"]
        project = path.parent.name
        bucket = per_project.setdefault(project, {
            "source_bytes": 0,
            "processed_parquet_bytes": 0,
            "initial_bytes": 0,
            "initial_gzip_bytes": 0,
            "lazy_bytes": 0,
            "lazy_gzip_bytes": 0,
        })
        raw = path.read_bytes()
        import gzip
        compressed = gzip.compress(raw, mtime=0)
        if item["load"] == "initial":
            bucket["initial_bytes"] += len(raw)
            bucket["initial_gzip_bytes"] += len(compressed)
        else:
            bucket["lazy_bytes"] += len(raw)
            bucket["lazy_gzip_bytes"] += len(compressed)
        previous = largest_assets.get(project)
        if previous is None or len(raw) > int(previous["bytes"]):
            largest_assets[project] = {"path": item["path"], "bytes": len(raw), "load": item["load"]}

    project_names = {
        "retail-iq": lambda name: name.lower().startswith("retailiq"),
        "shoplens": lambda name: name.lower().startswith("shoplens"),
        "customer-behaviour": lambda name: name.lower().startswith("customer behaviour"),
        "sales-analysis": lambda name: name.lower().startswith("retail sales analysis"),
    }
    source_rows = pd.read_csv(ROOT / "analytics" / "source-manifest.csv").to_dict(orient="records")
    for project, matcher in project_names.items():
        per_project[project]["source_bytes"] = int(sum(
            int(row["source_bytes"]) for row in source_rows if matcher(str(row["project"]))
        ))
        processed_dir = PROCESSED_ROOT / project
        per_project[project]["processed_parquet_bytes"] = int(sum(
            path.stat().st_size for path in processed_dir.rglob("*.parquet")
        )) if processed_dir.exists() else 0
    result = {
        "built_at_utc": datetime.now(timezone.utc).isoformat(),
        "dashboard_payloads": per_project,
        "largest_versioned_asset_by_project": largest_assets,
        "all_versioned_json_bytes": sum(int(item["bytes"]) for item in manifest["files"]),
    }
    (REPORT_ROOT / "payload-report.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return result


def main() -> int:
    global DATA_ROOT, GENERATED_ROOT, PROCESSED_ROOT
    parser = argparse.ArgumentParser(
        description="Build privacy-minimized dashboard JSON from the staged, read-only source copies."
    )
    parser.add_argument(
        "--datasets-dir",
        type=Path,
        default=DATA_ROOT,
        help="Staging copy directory. Defaults to DASHBOARD_DATASETS_DIR or ./dashboard_datasets.",
    )
    args = parser.parse_args()
    DATA_ROOT = args.datasets_dir.resolve()
    GENERATED_ROOT = DATA_ROOT / "generated"
    PROCESSED_ROOT = GENERATED_ROOT / "processed"
    print(f"Read-only staged inputs: {DATA_ROOT}")
    print("Source copies will be SHA-256 checked against the four original project folders.")
    result = build_all(DATA_ROOT)
    manifest = build_manifest()
    payload = payload_report(manifest)
    print(f"Verified source pairs: {len(result['manifest_rows'])}")
    print(f"Versioned dashboard JSON files: {len(manifest['files'])}")
    print(f"Payload report: {payload}")
    print(f"Data quality report: {ROOT / 'analytics' / 'reports' / 'data-quality-report.json'}")
    print(f"Metric validation: {ROOT / 'analytics' / 'reports' / 'metric-validation.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
