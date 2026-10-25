"""Audit read-only project outputs and prepare precise, minimized portfolio data.

No training, database writes, source notebook execution or source-folder writes.
Freight headlines use a small cube; full lane partitions load only on demand.
"""
from pathlib import Path
from datetime import datetime, timezone
from zipfile import ZipFile
import argparse
import hashlib
import json
import math
import subprocess
import duckdb
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public/dashboard-data/v2"
AUDIT = ROOT / "artifacts/project-expansion"
MICRO = 1_000_000


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False), encoding="utf-8")


def sha(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(4 * 1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def snapshot(root, extra):
    tracked = subprocess.check_output(["git", "-C", str(root), "ls-files", "-z"]).decode().split("\0")
    paths = {root / p for p in [*tracked, *extra] if p and (root / p).is_file()}
    return {str(p.relative_to(root)): sha(p) for p in sorted(paths)}


def report_review(root, title):
    folder = root / "power_bi"
    pbix = next(folder.glob("*.pbix"))
    with ZipFile(pbix) as z:
        names = z.namelist()
        if "Report/Layout" in names:
            layout = json.loads(z.read("Report/Layout").decode("utf-16-le"))
            pages = [p["displayName"] for p in layout["sections"]]
            visuals = sum(len(p["visualContainers"]) for p in layout["sections"])
        else:
            pages = [json.loads(z.read(n))["displayName"] for n in names if n.startswith("Report/definition/pages/") and n.endswith("/page.json")]
            visuals = sum(n.endswith("/visual.json") for n in names)
    model = json.loads((folder / f"{title}.SemanticModel/model.bim").read_text(encoding="utf-8"))["model"]
    return dict(pages=pages, visual_definitions=visuals, measures=[m["name"] for t in model["tables"] for m in t.get("measures", [])], native_refresh_performed=False)


def civic(root):
    consumed = ["data/raw/service_requests.csv", "data/raw/manifest.json", "data/processed/requests.csv", "reports/python_kpis.json", "power_bi/CivicPulse_Report.pbix"]
    before = snapshot(root, consumed)
    manifest = json.loads((root / consumed[1]).read_text())
    assert sha(root / consumed[0]) == manifest["sha256"]
    raw = pd.read_csv(root / consumed[0], dtype="string")
    frame = pd.read_csv(root / consumed[2], dtype={"unique_key": str, "incident_zip": str})
    assert raw.unique_key.is_unique and frame.unique_key.is_unique
    assert len(raw) == len(frame) == 348180 and raw.unique_key.tolist() == frame.unique_key.tolist()
    dates = {col: pd.to_datetime(raw[col], errors="coerce", format="mixed") for col in ["created_date", "closed_date", "due_date"]}
    created, closed, due = dates.values()
    snapshot_time = pd.Timestamp(manifest["snapshot_local"]).floor("s")
    invalid_closed = (closed < created) | (closed > snapshot_time)
    invalid_due = due < created
    unparseable = pd.concat([raw[k].notna() & v.isna() for k, v in dates.items()], axis=1).any(axis=1)
    closed = closed.mask(invalid_closed)
    due = due.mask(invalid_due)
    status = raw.status.str.strip().replace("", pd.NA).fillna("Unknown")
    closed_flag = status.str.casefold().eq("closed") | closed.notna()
    seconds = (closed - created).dt.total_seconds()
    due_eligible = closed.notna() & due.notna()
    checks = dict(is_closed=closed_flag, is_backlog=~closed_flag, valid_duration=seconds.notna(), due_eligible=due_eligible,
                  due_met=due_eligible & closed.le(due), benchmark_met=seconds.le(72 * 3600), invalid_closed_date=invalid_closed,
                  invalid_due_date=invalid_due, unparseable_date=unparseable, invalid_zip=~raw.incident_zip.fillna("").str.fullmatch(r"\d{5}"),
                  closed_without_time=closed_flag & closed.isna(), status_conflict=closed.notna() & ~status.str.casefold().eq("closed"))
    for key, values in checks.items():
        assert np.array_equal(frame[key].astype(bool), values.fillna(False).astype(bool)), key
    assert np.allclose(frame.resolution_hours * 3600, seconds, equal_nan=True)
    for col, fallback in [("agency", "UNKNOWN"), ("complaint_type", "Unspecified")]:
        expected = raw[col].str.strip().replace("", pd.NA).fillna(fallback)
        if col == "agency":
            expected = expected.str.upper()
        assert frame[col].tolist() == expected.tolist()
    assert frame.created_day.tolist() == created.dt.strftime("%Y-%m-%d").tolist()
    assert np.allclose(frame.aging_hours * 3600, (snapshot_time - created).dt.total_seconds().where(~closed_flag), equal_nan=True)
    names = {k: sorted(frame[k].fillna("UNKNOWN").unique().tolist()) for k in ["created_day", "agency", "borough", "complaint_type", "channel", "incident_zip", "status"]}
    flags = ["invalid_closed_date", "invalid_due_date", "unparseable_date", "invalid_zip", "closed_without_time", "status_conflict"]
    quality = sum(frame[k].astype(int) * (1 << i) for i, k in enumerate(flags))
    assert np.array_equal(quality.ne(0), frame.quality_issue.astype(bool))
    codes = [frame[k].fillna("UNKNOWN").map({v:i for i,v in enumerate(names[k])}).to_numpy() for k in names]
    nsec = [None if pd.isna(v) else int(round(v)) for v in seconds]
    ages = [None if pd.isna(v) else int(round(v * 3600)) for v in frame.aging_hours]
    rows = [[*[int(c[i]) for c in codes], int(closed_flag.iloc[i]), nsec[i], int(frame.due_eligible.iloc[i]), int(frame.due_met.iloc[i]), int(frame.benchmark_met.iloc[i]), int(quality.iloc[i]), ages[i]] for i in range(len(frame))]
    baseline = json.loads((root / "reports/python_kpis.json").read_text())
    def stats(f):
        durations = f.resolution_hours.dropna()
        return dict(requests=len(f), closed=int(f.is_closed.sum()), backlog=int(f.is_backlog.sum()), valid_duration=len(durations),
                    median_hours=None if durations.empty else float(durations.median()), p90_hours=None if durations.empty else float(durations.quantile(.9)),
                    due_eligible=int(f.due_eligible.sum()), due_met=int(f.due_met.sum()), benchmark_met=int(f.benchmark_met.sum()), quality_issues=int(f.quality_issue.sum()))
    for k, v in stats(frame).items():
        assert abs(v - baseline[k]) < 1e-8, k
    cases = [{}] + [{k:v} for k in ["created_day", "agency", "borough", "complaint_type", "channel"] for v in names[k]]
    cases += [dict(agency="NYPD", borough="BRONX"), dict(agency="DSNY", created_day="2025-01-15"), dict(agency="DHS", borough="QUEENS", channel="MOBILE"), dict(agency="DHS", complaint_type="Noise - Residential")]
    oracle = []
    for case in cases:
        selected = frame
        for key, val in case.items():
            selected = selected.loc[selected[key].eq(val)]
        oracle.append(dict(filters=case, expected=stats(selected)))
    dump(AUDIT / "civic-oracle.json", oracle)
    dump(ROOT / "scripts/fixtures/civic-oracle.json", oracle)
    target = PUBLIC / "civicpulse"
    parts = ["requests-a", "requests-b", "requests-c"]
    for name, chunk in zip(parts, np.array_split(np.arange(len(rows)), 3)):
        dump(target / f"{name}.json", dict(version=1, project="civicpulse", rows=rows[int(chunk[0]):int(chunk[-1])+1]))
    review = report_review(root, "CivicPulse")
    dump(target / "overview.json", dict(version=1, project="civicpulse", names=names, flags=flags, parts=parts, baseline=baseline,
        snapshot=manifest["snapshot_local"], period="January 2025 intake · status snapshot 25 October 2026", report_pages=review["pages"],
        attribution=dict(title="NYC Open Data · 311 Service Requests", url=manifest["source_url"], terms="https://www.nyc.gov/home/terms-of-use.page", changes="Minimized analytical records. Source request IDs, addresses, descriptors and exact creation timestamps omitted.")))
    assert before == snapshot(root, consumed), "CivicPulse source files changed"
    dump(AUDIT / "civic-audit.json", dict(files=before, raw_requests=len(raw), rows_reconciled=len(frame), oracle_cases=len(oracle), powerbi=review))
    print("CivicPulse: all 348,180 requests, date flags, durations, source totals and", len(oracle), "filter cases audited.")


def freight(root):
    p = root / "data/processed"
    raw = root / "data/raw/FAF5.7.1/FAF5.7.1.csv"
    consumed = [str(raw.relative_to(root)), "data/processed/fact_freight_flow.parquet", "data/processed/mart_lane_priority.parquet", "data/processed/mart_kpi_summary.csv", "power_bi/FreightFlow_Report.pbix"]
    before = snapshot(root, consumed)
    c = duckdb.connect()
    c.execute("CREATE TEMP TABLE facts AS SELECT * FROM read_parquet(?)", [str(p / "fact_freight_flow.parquet")])
    assert c.execute("SELECT count(*) FROM facts").fetchone()[0] == 3950145
    assert c.execute("SELECT count(*) FROM facts WHERE tons_kilotons<0 OR value_musd<0 OR tmiles_million<0 OR NOT isfinite(tons_kilotons+value_musd+tmiles_million)").fetchone()[0] == 0
    source_aggregates = c.execute("SELECT trade_type, count(*), " + ",".join(f"sum({metric}_{year})" for year in [2024,2030,2050] for metric in ["tons","value","tmiles"]) + " FROM read_csv_auto(?) GROUP BY trade_type ORDER BY trade_type", [str(raw)]).fetchall()
    checks = []
    for rec in source_aggregates:
        for i, year in enumerate([2024,2030,2050]):
            actual = c.execute("SELECT sum(tons_kilotons),sum(value_musd),sum(tmiles_million) FROM facts WHERE year=? AND trade_type_code=?", [year, rec[0]]).fetchone()
            for j in range(3):
                difference = actual[j] - rec[2 + i*3+j]
                assert abs(difference) < 1e-6, (year, rec[0], difference)
                checks.append(dict(year=year, trade=rec[0], metric=j, difference=difference))
    names = {}
    for key, file, code, label in [("zones","dim_zone.csv","zone_code","zone_name"),("commodities","dim_commodity.csv","commodity_code","commodity_name"),("modes","dim_mode.csv","mode_code","mode_name"),("trades","dim_trade_type.csv","trade_type_code","trade_type_name")]:
        f = pd.read_csv(p / file, dtype={code:str}).sort_values(code)
        names[key] = [dict(code=v, label=n) for v,n in f[[code,label]].itertuples(index=False,name=None)]
    maps = {k:{v["code"]:i for i,v in enumerate(vals)} for k,vals in names.items()}
    # Source metric precision is six decimals. Fixed-point sums avoid binary rounding drift.
    c.execute("CREATE TEMP TABLE fixed AS SELECT * EXCLUDE(tons_kilotons,value_musd,tmiles_million), CAST(round(tons_kilotons*1000000) AS BIGINT) tons, CAST(round(value_musd*1000000) AS BIGINT) worth, CAST(round(tmiles_million*1000000) AS BIGINT) miles FROM facts")
    cube = c.execute("SELECT year,trade_type_code,mode_code,commodity_code,sum(tons),sum(worth),sum(miles),count(*) FROM fixed GROUP BY ALL ORDER BY 1,2,3,4").fetchall()
    def indexed(r):
        return [[2024,2030,2050].index(r[0]),maps["trades"][str(r[1])],maps["modes"][str(r[2])],maps["commodities"][str(r[3]).zfill(2)],*[int(v) for v in r[4:]]]
    cube = [indexed(r) for r in cube]
    target = PUBLIC / "freightflow"
    partitions = {}
    def letter(n):
        return chr(97+n) if n < 26 else "a"+chr(97+n-26)
    for commodity in [None, *[v["code"] for v in names["commodities"]]]:
        where = "" if commodity is None else "WHERE commodity_code=?"
        query = f"SELECT origin_zone_code,destination_zone_code,mode_code,trade_type_code," + ",".join(f"sum(CASE WHEN year={y} THEN {col} ELSE 0 END)" for y in [2024,2030,2050] for col in ["tons","worth","miles"]) + f",count(*)/3 FROM fixed {where} GROUP BY 1,2,3,4 ORDER BY 1,2,3,4"
        values = c.execute(query, [] if commodity is None else [commodity]).fetchall()
        rows = [[maps["zones"][str(r[0]).zfill(3)], maps["zones"][str(r[1]).zfill(3)], maps["modes"][str(r[2])], maps["trades"][str(r[3])], *[int(v) for v in r[4:]]] for r in values]
        chunks = np.array_split(np.arange(len(rows)), max(1, math.ceil(len(rows)/45000)))
        files = []
        for i, chunk in enumerate(chunks):
            filename = f"lanes-{letter(i)}" if commodity is None else f"commodity-{letter(maps['commodities'][commodity])}" + ("" if len(chunks)==1 else f"-{letter(i)}")
            dump(target / f"{filename}.json", dict(version=1, project="freightflow", rows=rows[int(chunk[0]):int(chunk[-1])+1]))
            assert (target / f"{filename}.json").stat().st_size < 12_000_000
            files.append(filename)
        partitions["All" if commodity is None else str(maps["commodities"][commodity])] = files
    priorities = pd.read_parquet(p / "mart_lane_priority.parquet")
    assert np.allclose((priorities.tons_2050_kilotons/priorities.tons_2024_kilotons)**(1/26)-1, priorities.cagr_2024_2050, atol=1e-12)
    assert np.allclose(priorities.value_2024_musd/priorities.tons_2024_kilotons, priorities.value_density_2024_musd_per_kton, atol=1e-12)
    # Independently recompute global percentile ranks from the complete positive-endpoint population.
    expected_index = (priorities.cagr_2024_2050.rank(method="min")-1)/(len(priorities)-1) * (priorities.value_density_2024_musd_per_kton.rank(method="min")-1)/(len(priorities)-1)
    assert np.allclose(expected_index, priorities.high_growth_lane_index, atol=1e-12)
    candidates = priorities.loc[priorities.tons_2024_kilotons.ge(1000) & priorities.mode_code.between(1,6)]
    assert len(candidates) == 2031
    priority_rows = [[maps["zones"][str(r.origin_zone_code).zfill(3)],maps["zones"][str(r.destination_zone_code).zfill(3)],maps["modes"][str(r.mode_code)],maps["trades"][str(r.trade_type_code)],r.tons_2024_kilotons,r.tons_2030_kilotons,r.tons_2050_kilotons,r.cagr_2024_2050,r.high_growth_lane_index] for r in candidates.itertuples()]
    dump(target / "priorities.json", dict(version=1,project="freightflow",rows=priority_rows))
    cases = [dict(year=y, trade=t, mode=m, commodity=k) for y in [2024,2030,2050] for t in [-1,0,1,2] for m in [-1,0,1,5] for k in [-1,0,10]]
    oracle = []
    for case in cases:
        sql = "SELECT sum(tons_kilotons),sum(value_musd),sum(tmiles_million),count(*) FROM facts WHERE year=?"
        params = [case["year"]]
        for key, column, dim in [("trade","trade_type_code","trades"),("mode","mode_code","modes"),("commodity","commodity_code","commodities")]:
            if case[key] >= 0:
                sql += f" AND {column}=?"; params.append(names[dim][case[key]]["code"])
        result = c.execute(sql, params).fetchone()
        oracle.append(dict(filters=case, expected=[float(v or 0) for v in result]))
    review = report_review(root, "FreightFlow")
    dump(target / "overview.json", dict(version=1,project="freightflow",names=names,years=[2024,2030,2050],scale=MICRO,cube=cube,partitions=partitions,
        baseline=dict(source_rows=2671386,fact_rows=3950145,candidates=2031),report_pages=review["pages"],
        attribution=dict(title="BTS / FHWA · Freight Analysis Framework 5.7.1",url="https://www.bts.gov/faf/faf5",terms="https://www.bts.gov/faf/faf5",changes="Aggregated analytical tables. Original thousand-ton, million 2017 USD and million ton-mile units retained; estimates and forecasts remain separate.")))
    dump(AUDIT / "freight-oracle.json", oracle)
    dump(ROOT / "scripts/fixtures/freight-oracle.json", oracle)
    assert before == snapshot(root, consumed), "FreightFlow source files changed"
    dump(AUDIT / "freight-audit.json", dict(files=before,raw_total_checks=checks,oracle_cases=len(oracle),powerbi=review,partitions=len(partitions),priority_rows=len(candidates)))
    print("FreightFlow: 27 raw-source totals, 3,950,145 fact records, 2,031 fixed-index candidates and",len(oracle),"filter cases audited.")


def ml_evidence(campaign, mobility):
    from sklearn.metrics import average_precision_score, roc_auc_score, brier_score_loss
    before_c = snapshot(campaign, ["output/metrics.json","output/scores.csv","output/test.csv"])
    before_m = snapshot(mobility, ["output/metrics.json","output/test_predictions.csv","output/capacity.json"])
    cm = json.loads((campaign / "output/metrics.json").read_text())
    test = pd.read_csv(campaign / "output/test.csv")
    scores = pd.read_csv(campaign / "output/scores.csv")
    scored = test.merge(scores, on="customer_id", validate="one_to_one")
    assert len(scored) == len(test) == 468
    capacity = math.floor(len(scored) * .2)
    ranked = scored.sort_values("priority_rank")
    caught = int(ranked.head(capacity).churn.sum())
    assert caught == 60 and capacity == 93
    checked = dict(average_precision=average_precision_score(scored.churn,scored.churn_probability),roc_auc=roc_auc_score(scored.churn,scored.churn_probability),brier_score=brier_score_loss(scored.churn,scored.churn_probability),lift_at_capacity=(caught/capacity)/scored.churn.mean())
    for k,v in checked.items(): assert abs(v-cm["selected_model_test"][k])<1e-10
    profiles = []
    for part in ["train","validation","test"]:
        f = pd.read_csv(campaign / f"output/{part}.csv")
        profiles.append(set(map(tuple,f[cm["features"]].itertuples(index=False,name=None))))
    assert all(not profiles[i] & profiles[j] for i in range(3) for j in range(i))
    mm = json.loads((mobility / "output/metrics.json").read_text())
    predictions = pd.read_csv(mobility / "output/test_predictions.csv")
    measured = {}
    for model,col in [("last_week","baseline_prediction"),("gradient_boosting","model_prediction")]:
        error = predictions[col]-predictions.cnt
        measured[model]=dict(mae=float(error.abs().mean()),rmse=float(np.sqrt((error**2).mean())),wape_pct=float(error.abs().sum()/predictions.cnt.sum()*100),bias_pct=float(error.sum()/predictions.cnt.sum()*100))
        for k,v in measured[model].items(): assert abs(v-mm["test"][model][k])<1e-9
    improvement = (1-measured["gradient_boosting"]["mae"]/measured["last_week"]["mae"])*100
    assert abs(improvement-mm["test_mae_improvement_pct"])<1e-9
    policy = json.loads((mobility / "output/capacity.json").read_text())
    planned = np.ceil(predictions.prediction*(1+policy["buffer_pct"]/100))
    shortage = (predictions.cnt-planned).clip(lower=0).sum()
    excess = (planned-predictions.cnt).clip(lower=0).sum()
    assert int(shortage)==policy["test_selected_policy"]["shortage_slots"] and int(excess)==policy["test_selected_policy"]["excess_slots"]
    assert before_c==snapshot(campaign,["output/metrics.json","output/scores.csv","output/test.csv"])
    assert before_m==snapshot(mobility,["output/metrics.json","output/test_predictions.csv","output/capacity.json"])
    evidence = dict(campaignlift=dict(test_rows=468,contacts=capacity,churners_captured=caught,recall=caught/int(scored.churn.sum()),**checked),mobilitydemand=dict(test_hours=len(predictions),mae=measured["gradient_boosting"]["mae"],mae_improvement_pct=improvement,baseline_mae=measured["last_week"]["mae"],wape_pct=measured["gradient_boosting"]["wape_pct"]))
    dump(ROOT / "src/data/project-evidence.json", evidence)
    dump(AUDIT / "ml-audit.json", dict(campaign_files=before_c,mobility_files=before_m,metrics=evidence,training_performed=False))
    print("CampaignLift and MobilityDemand: saved predictions and held-out results independently reconciled; no training run.")


if __name__ == "__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--source-root",type=Path,default=ROOT.parent);parser.add_argument("--project",choices=["all","civicpulse","freightflow","ml"],default="all");args=parser.parse_args()
    source=args.source_root/"major_projects"
    if args.project in ["all","ml"]: ml_evidence(source/"Applied_AI_ML/CampaignLift",source/"Applied_AI_ML/MobilityDemand_Bike_Sharing")
    if args.project in ["all","civicpulse"]: civic(source/"Data_Analyst/CivicPulse_Service_Operations")
    if args.project in ["all","freightflow"]: freight(source/"Supply_Chain_Analytics/FreightFlow_Lane_Capacity")
    dump(ROOT / "analytics/cloudflare/operations-assets.json", {project:sorted(f.stem for f in (PUBLIC/project).glob("*.json")) for project in ["civicpulse","freightflow"]})
    print("All source files remained unchanged. Portfolio outputs written only inside this checkout.")
