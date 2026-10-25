"""Read-only NovaMart audit and minimized browser data. Never runs its source pipeline."""
from pathlib import Path
from datetime import datetime, timezone
from decimal import Decimal
from zipfile import ZipFile
import argparse
import hashlib
import json
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def money(series):
    return series.fillna(0).map(lambda x: int((Decimal(str(x)) * 100).quantize(Decimal("1"))))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False), encoding="utf-8")


def build(source):
    processed = source / "data/processed"
    raw = source / "data/raw/olist"
    files = [*raw.glob("*.csv"), *processed.glob("*.csv"), source / "powerbi/NovaMart.pbix", source / "powerbi/NovaMart.SemanticModel/model.bim"]
    hashes = {str(f.relative_to(source)): hashlib.sha256(f.read_bytes()).hexdigest() for f in files}
    orders = pd.read_csv(processed / "fct_order.csv", dtype={"order_id": str, "customer_unique_id": str})
    items = pd.read_csv(processed / "fct_order_item.csv")
    products = pd.read_csv(processed / "dim_product.csv")
    sellers = pd.read_csv(processed / "dim_seller.csv")
    source_orders = pd.read_csv(raw / "olist_orders_dataset.csv")
    source_items = pd.read_csv(raw / "olist_order_items_dataset.csv")
    source_customers = pd.read_csv(raw / "olist_customers_dataset.csv")
    reviews = pd.read_csv(raw / "olist_order_reviews_dataset.csv")
    source_products = pd.read_csv(raw / "olist_products_dataset.csv").merge(
        pd.read_csv(raw / "product_category_name_translation.csv"), on="product_category_name", how="left", validate="many_to_one")
    source_products["product_category"] = source_products.product_category_name_english.fillna("Unknown / untranslated")
    pd.testing.assert_frame_equal(products.set_index("product_id").sort_index(), source_products.set_index("product_id")[["product_category"]].sort_index())
    pd.testing.assert_frame_equal(sellers.set_index("seller_id").sort_index(), pd.read_csv(raw / "olist_sellers_dataset.csv").set_index("seller_id")[["seller_city", "seller_state"]].sort_index())
    assert orders.order_id.is_unique and source_orders.order_id.is_unique
    assert len(orders) == len(source_orders) == 99441
    assert len(items) == len(source_items) == 112650
    original = source_orders.set_index("order_id").loc[orders.order_id]
    assert original.order_status.tolist() == orders.order_status.tolist()
    customers = source_customers.set_index("customer_id").loc[original.customer_id]
    assert customers.customer_unique_id.tolist() == orders.customer_unique_id.tolist()
    assert customers.customer_state.tolist() == orders.customer_state.tolist()
    delivered = original.order_status.eq("delivered").to_numpy()
    actual = pd.to_datetime(original.order_delivered_customer_date)
    estimated = pd.to_datetime(original.order_estimated_delivery_date)
    purchased = pd.to_datetime(original.order_purchase_timestamp)
    eligible = delivered & actual.notna().to_numpy() & estimated.notna().to_numpy()
    late = eligible & (actual > estimated).to_numpy()
    assert np.array_equal(orders.is_delivered, delivered)
    assert np.array_equal(orders.is_delivery_eligible, eligible)
    assert np.array_equal(orders.is_late.eq(True), late)
    cents = money(source_items.price).groupby(source_items.order_id).sum().reindex(orders.order_id, fill_value=0).to_numpy()
    freight = money(source_items.freight_value).groupby(source_items.order_id).sum().reindex(orders.order_id, fill_value=0).to_numpy()
    assert np.array_equal(money(orders.gmv_proxy), cents)
    assert np.array_equal(money(orders.freight_value), freight)
    score = reviews.groupby("order_id").review_score.mean().reindex(orders.order_id).to_numpy()
    assert np.allclose(orders.avg_review_score, score, equal_nan=True)
    days = ((actual - purchased).dt.total_seconds() / 86400).to_numpy()
    assert np.allclose(orders.delivery_days, days, equal_nan=True)
    item_check = items.rename(columns={"item_price": "price", "item_freight_value": "freight_value"}).set_index(["order_id", "order_item_id"]).sort_index()
    raw_check = source_items.set_index(["order_id", "order_item_id"]).sort_index()
    pd.testing.assert_frame_equal(item_check[raw_check.columns], raw_check, check_dtype=False)
    customer_counts = orders.loc[delivered].groupby("customer_unique_id").size()
    baseline = dict(orders=len(orders), delivered=int(delivered.sum()), eligible=int(eligible.sum()), late=int(late.sum()),
                    gmv_cents=int(cents[delivered].sum()), canceled=int(orders.is_canceled.sum()), customers=len(customer_counts),
                    repeat_customers=int((customer_counts >= 2).sum()), missing_actual=int((delivered & actual.isna().to_numpy()).sum()),
                    calendar_late=int((eligible & (actual.dt.normalize() > estimated.dt.normalize()).to_numpy()).sum()))
    assert baseline == dict(orders=99441, delivered=96478, eligible=96470, late=7826, gmv_cents=1322149811, canceled=625, customers=93358, repeat_customers=2801, missing_actual=8, calendar_late=6534)
    model = json.loads((source / "powerbi/NovaMart.SemanticModel/model.bim").read_text(encoding="utf-8"))["model"]
    measures = {m["name"]: m["expression"] for t in model["tables"] for m in t.get("measures", [])}
    with ZipFile(source / "powerbi/NovaMart.pbix") as pbix:
        pages = [json.loads(pbix.read(n)) for n in pbix.namelist() if n.startswith("Report/definition/pages/") and n.endswith("/page.json")]
        visuals = [json.loads(pbix.read(n)) for n in pbix.namelist() if n.endswith("/visual.json")]
    assert len(pages) == 5
    # Keep model audit local; public notes explain behavior without publishing machine paths.
    audit = dict(baseline=baseline, source_hashes=hashes, raw_order_checks="99,441 rows reconciled: identity, state, status, eligibility, lateness, cents, freight, duration and per-order review means",
                 raw_item_checks="112,650 rows reconciled", powerbi_pages=[p["displayName"] for p in pages],
                 powerbi_visuals=len(visuals), powerbi_measures=measures, relationships=model.get("relationships"),
                 native_powerbi_refresh="Not executed in this portfolio task; source report definitions and saved PBIX visuals inspected.")
    write(ROOT / "analytics/reports/novamart-audit.json", audit)
    months = sorted(orders.order_purchase_timestamp.str[:7].unique())
    states = sorted(orders.customer_state.unique())
    statuses = sorted(orders.order_status.unique())
    categories = sorted(products.product_category.fillna("unknown").unique())
    customer_codes = pd.factorize(orders.customer_unique_id, sort=True)[0]
    order_index = {v: i for i, v in enumerate(orders.order_id)}
    seller_ids = sorted(sellers.seller_id)
    seller_index = {v: i for i, v in enumerate(seller_ids)}
    seller_states = sellers.set_index("seller_id").loc[seller_ids].seller_state.tolist()
    product_categories = products.set_index("product_id").product_category.fillna("unknown").to_dict()
    # Independent pandas oracle for the browser engine, including intersecting item/order filters.
    oracle_items = items.copy()
    oracle_items["category"] = oracle_items.product_id.map(product_categories).fillna("unknown")
    oracle_items["cents"] = money(oracle_items.item_price)
    oracle_items["freight_cents"] = money(oracle_items.item_freight_value)
    oracle_orders = orders.copy()
    oracle_orders["month"] = oracle_orders.order_purchase_timestamp.str[:7]
    oracle_orders["calendar_late"] = eligible & (actual.dt.normalize() > estimated.dt.normalize()).to_numpy()
    cases = [{}]
    cases += [{"month": m} for m in months] + [{"state": s} for s in states]
    cases += [{"category": c} for c in categories] + [{"status": s} for s in statuses]
    cases += [{"seller": str(i)} for i in range(0, len(seller_ids), 150)]
    cases += [dict(month="2018-01", state="SP", category="health_beauty"), dict(month="2016-09", state="RR"), dict(category="health_beauty", seller="0"), dict(month="2018-01", status="canceled"), dict(state="SP", seller="12")]
    oracle = []
    for case in cases:
        part = oracle_orders
        for key, col in [("month", "month"), ("state", "customer_state"), ("status", "order_status")]:
            if key in case:
                part = part.loc[part[col].eq(case[key])]
        chosen = oracle_items
        if "category" in case:
            chosen = chosen.loc[chosen.category.eq(case["category"])]
        if "seller" in case:
            chosen = chosen.loc[chosen.seller_id.eq(seller_ids[int(case["seller"])])]
        if "category" in case or "seller" in case:
            part = part.loc[part.order_id.isin(chosen.order_id)]
        delivered_part = part.loc[part.is_delivered]
        chosen = chosen.loc[chosen.order_id.isin(delivered_part.order_id)]
        frequencies = delivered_part.groupby("customer_unique_id").size()
        expected = dict(orders=len(part), delivered=len(delivered_part), canceled=int(part.is_canceled.sum()), eligible=int(part.is_delivery_eligible.sum()), late=int(part.is_late.eq(True).sum()), calendarLate=int(part.calendar_late.sum()),
                        gmv=int(chosen.cents.sum()), freight=int(chosen.freight_cents.sum()), customers=len(frequencies), repeat=int(frequencies.ge(2).sum()),
                        reviewsSum=float(delivered_part.avg_review_score.sum()), reviewsCount=int(delivered_part.avg_review_score.count()), daysSum=float(part.loc[part.is_delivery_eligible].delivery_days.sum()), daysCount=int(part.is_delivery_eligible.sum()))
        oracle.append(dict(filters=case, expected=expected))
    write(ROOT / "analytics/reports/novamart-filter-oracle.json", oracle)
    def finite(x):
        return round(float(x), 8) if pd.notna(x) else None
    late_days = ((actual - estimated).dt.total_seconds() / 86400).to_numpy()
    # Numeric membership codes are local to this release. No source order/customer/seller IDs, cities, ZIPs or review text.
    order_rows = [[months.index(r.order_purchase_timestamp[:7]), states.index(r.customer_state), statuses.index(r.order_status),
                   int(eligible[i]), int(late[i]), int(cents[i]), int(freight[i]), finite(days[i]), finite(score[i]),
                   int(customer_codes[i]), finite(late_days[i]), int(eligible[i] and actual.iloc[i].normalize() > estimated.iloc[i].normalize())]
                  for i, r in enumerate(orders.itertuples(index=False))]
    item_rows = [[order_index[r.order_id], categories.index(product_categories.get(r.product_id, "unknown")), seller_index[r.seller_id],
                  int(Decimal(str(r.item_price)) * 100), int(Decimal(str(r.item_freight_value)) * 100)] for r in items.itertuples(index=False)]
    target = ROOT / "public/dashboard-data/v2/novamart"
    attribution = dict(title="Brazilian E-Commerce Public Dataset by Olist", author="Olist / Kaggle", source="https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce", license="CC BY-NC-SA 4.0", license_url="https://creativecommons.org/licenses/by-nc-sa/4.0/", changes="Minimized analytical records and numeric membership codes; no source identifiers, locations below state, or free text. Historical analysis under NovaMart project name.")
    write(target / "overview.json", dict(version=1, project="novamart", prepared_at=datetime.now(timezone.utc).isoformat(),
        months=months, states=states, statuses=statuses, categories=categories, seller_states=seller_states, baseline=baseline, attribution=attribution,
        audit=["All 99,441 orders and 112,650 items independently reconciled to raw CSVs.", "Review rows are averaged within each order before averaging delivered orders.",
               "Power BI has separate order and item contexts; the website explicitly propagates every selected filter across both grains.",
               "All 25 observed purchase months are retained, including sparse boundary periods. No synthetic zero months are added.",
               "Category and seller counts overlap. Never sum their distinct-order counts to estimate marketplace orders.",
               "Native Power BI refresh and rendering were not rerun for this integration; five saved PBIX pages and semantic model definitions were inspected."],
        pages=[p["displayName"] for p in pages]))
    write(target / "orders.json", dict(version=1, project="novamart", columns=["month", "state", "status", "eligible", "late", "gmv_cents", "freight_cents", "delivery_days", "review", "customer_code", "days_late", "calendar_late"], rows=order_rows))
    write(target / "items.json", dict(version=1, project="novamart", columns=["order_index", "category", "seller_code", "price_cents", "freight_cents"], rows=item_rows))
    assert all(hashlib.sha256((source / name).read_bytes()).hexdigest() == digest for name, digest in hashes.items())
    print(json.dumps(dict(baseline=baseline, pages=audit["powerbi_pages"], visuals=len(visuals), assets={p.name:p.stat().st_size for p in target.glob("*.json")}), indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=ROOT.parent / "DA_projects/NovaMart")
    build(parser.parse_args().source)
