"""Independently reconcile published website cohorts with saved project facts/marts."""
import hashlib
import itertools
import json
import math
from pathlib import Path

import pandas as pd
import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent
checks = []


def check(condition, label):
    if not condition:
        raise AssertionError(label)
    checks.append(label)


def near(actual, expected, label):
    if pd.isna(expected):
        check(actual is None, label)
    else:
        check(actual is not None and math.isclose(actual, float(expected), rel_tol=1e-7, abs_tol=1e-7), label)


def load(slug):
    manifest = json.loads((ROOT / "public/study-data/manifest.json").read_text())
    record = manifest["projects"][slug]
    payload = (ROOT / "public/study-data" / record["path"]).read_bytes()
    check(len(payload) == record["bytes"], f"{slug}: exact byte count")
    check(hashlib.sha256(payload).hexdigest() == record["sha256"], f"{slug}: release digest")
    data = json.loads(payload)
    for source in data["sources"]:
        with (SOURCE / source["file"]).open("rb") as stream:
            check(hashlib.file_digest(stream, "sha256").hexdigest() == source["sha256"], f"{slug}: unchanged {Path(source['file']).name}")
    combinations = itertools.product(*[["All", *f["values"]] for f in data["filters"]])
    check(set(data["slices"]) == {json.dumps(c, separators=(",", ":")) for c in combinations}, f"{slug}: complete filter matrix")
    return data


job = load("job-market")
jroot = SOURCE / "DA_projects/Job_Market_Analysis/notebooks/data/exports"
jfact = pd.read_csv(jroot / "fact_job_posting.csv", usecols=["job_key", "role_key", "seniority_title", "salary_numeric_present", "experience_min_years", "workplace_type"])
roles = pd.read_csv(jroot / "dim_role.csv").set_index("role_key").canonical_role_name
jfact["role"] = jfact.role_key.map(roles)
jquality = pd.read_csv(jroot / "fact_job_quality.csv", usecols=["job_key", "jd_quality_score"])
for key, cohort in job["slices"].items():
    role, seniority = json.loads(key)
    rows = jfact.loc[(jfact.role.eq(role) if role != "All" else True) & (jfact.seniority_title.eq(seniority) if seniority != "All" else True)] if key != '["All","All"]' else jfact
    near(cohort["hero"]["value"], len(rows), f"Job {key}: observations")
    near(cohort["facts"]["groups"], rows.job_key.nunique(), f"Job {key}: distinct text groups")
    near(cohort["facts"]["numeric_salary"], rows.salary_numeric_present.sum(), f"Job {key}: numeric salary")
    near(cohort["facts"]["entry_two_plus"], rows.loc[rows.seniority_title.eq("entry") & rows.experience_min_years.ge(2)].job_key.nunique(), f"Job {key}: entry-title 2+ years")
    near(cohort["metrics"][1]["value"], jquality.loc[jquality.job_key.isin(rows.job_key)].jd_quality_score.mean(), f"Job {key}: group-grain mean quality")
    near(sum(p["value"] for p in cohort["trend"]), len(rows), f"Job {key}: daily chart total")
    near(cohort["metrics"][2]["value"] + cohort["facts"]["groups"], len(rows), f"Job {key}: repeated observation grain")

loan = load("loanflow")
cases = pd.read_csv(SOURCE / "major_projects/Business_Analyst/LoanFlow_Process_Redesign/data/processed/case_summary.csv")
for key, cohort in loan["slices"].items():
    application_type, month = json.loads(key)
    mask = pd.Series(True, index=cases.index)
    if application_type != "All":
        mask &= cases.application_type.eq(application_type)
    if month != "All":
        mask &= cases.start_date.str.startswith(month)
    rows = cases.loc[mask]
    resolved = rows.loc[rows.is_resolved.eq(1)].duration_days
    near(cohort["hero"]["value"], len(rows), f"Loan {key}: applications")
    near(cohort["metrics"][0]["value"], resolved.median(), f"Loan {key}: resolved median")
    near(cohort["metrics"][1]["value"], resolved.quantile(.9), f"Loan {key}: inclusive P90")
    near(cohort["facts"]["extra_completions"], rows.repeat_count.sum(), f"Loan {key}: extra completions")
    near(cohort["metrics"][2]["value"], rows.is_incomplete.mean(), f"Loan {key}: incomplete-file signal")
    near(cohort["metrics"][3]["value"], rows.has_repeated_work.mean(), f"Loan {key}: repeated-work rate")
    near(cohort["facts"]["mean_days"], resolved.mean(), f"Loan {key}: mean resolved days")
    near(cohort["facts"]["top_twenty_share"], rows.variant_id.value_counts().head(20).sum()/len(rows) if len(rows) else float("nan"), f"Loan {key}: cohort path coverage")
    near(sum(p["value"] for p in cohort["rankings"]["durations"]), len(resolved), f"Loan {key}: duration histogram population")
    for sample in cohort["samples"]:
        times = [e["time"] for e in sample["events"]]
        check(times == sorted(times), f"Loan {key} {sample['label']}: chronological business events")

air = load("airops")
aroot = SOURCE / "major_projects/Data_Analyst/AirOps_Airline_Disruption/notebooks/data/exports"
for file, field, selector in [("mart_carrier_performance.csv", "airline_code", lambda v: [v, "All"]), ("mart_month_performance.csv", "month", lambda v: ["All", f"2015-{int(v):02d}"])]:
    for _, row in pd.read_csv(aroot / file).iterrows():
        c = air["slices"][json.dumps(selector(row[field]), separators=(",", ":"))]
        near(c["facts"]["scheduled"], row.scheduled_flights, f"Air {row[field]}: scheduled vs independent mart")
        near(c["facts"]["arrived"], row.arrived_flights, f"Air {row[field]}: eligible vs independent mart")
        near(c["gauge"]["value"], row.on_time_arrival_rate, f"Air {row[field]}: on time vs independent mart")
        near(c["metrics"][0]["value"], row.cancellation_rate, f"Air {row[field]}: cancellations vs independent mart")
        near(c["metrics"][1]["value"], row.severe_delay_rate, f"Air {row[field]}: severe delay vs independent mart")
        near(c["metrics"][2]["value"], row.average_arrival_delay_minutes, f"Air {row[field]}: mean delay vs independent mart")
for key, c in air["slices"].items():
    n, eligible = c["facts"]["scheduled"], c["facts"]["arrived"]
    near(c["facts"]["ontime"]+c["facts"]["late"], eligible, f"Air {key}: exhaustive eligible arrival outcomes")
    near(c["gauge"]["value"], c["facts"]["ontime"]/eligible if eligible else float("nan"), f"Air {key}: weighted on-time denominator")
    near(c["metrics"][0]["value"], c["facts"]["cancelled"]/n if n else float("nan"), f"Air {key}: scheduled cancellation denominator")
    near(sum(p["count"] for p in c["rankings"]["hours"]), n, f"Air {key}: all departure hours retained")
    check(all(row[1] >= 1000 and row[2] > 0 for row in c["tables"]["routes"]["rows"]), f"Air {key}: route volume gate")

# Independently read the full flight fact at carrier/month grain. The website
# builder uses route-level intermediate tables; this check bypasses those tables.
partial_totals = []
cause_columns = ["air_system_delay_minutes", "security_delay_minutes", "airline_delay_minutes", "late_aircraft_delay_minutes", "weather_delay_minutes"]
columns = ["flight_date", "airline_code", "arrival_delay_minutes", "cancelled", "diverted", *cause_columns]
source_file = aroot.parent / "processed/fact_flight.parquet"
for batch in pq.ParquetFile(source_file).iter_batches(batch_size=400_000, columns=columns):
    frame = batch.to_pandas()
    eligible = frame.cancelled.eq(0) & frame.diverted.eq(0) & frame.arrival_delay_minutes.notna()
    frame["month"] = pd.to_datetime(frame.flight_date).dt.strftime("%Y-%m")
    frame["scheduled"] = 1
    frame["eligible"] = eligible.astype(int)
    frame["on_time"] = (eligible & frame.arrival_delay_minutes.le(15)).astype(int)
    frame["severe"] = (eligible & frame.arrival_delay_minutes.gt(60)).astype(int)
    frame["arrival_sum"] = frame.arrival_delay_minutes.where(eligible, 0).fillna(0)
    partial_totals.append(frame.groupby(["airline_code", "month"])[["scheduled", "eligible", "on_time", "severe", "arrival_sum", "cancelled", "diverted", *cause_columns]].sum())
flight_totals = pd.concat(partial_totals).groupby(level=[0, 1]).sum().reset_index()
for key, cohort in air["slices"].items():
    carrier, month = json.loads(key)
    rows = flight_totals
    if carrier != "All":
        rows = rows.loc[rows.airline_code.eq(carrier)]
    if month != "All":
        rows = rows.loc[rows.month.eq(month)]
    totals = rows.select_dtypes("number").sum()
    eligible, scheduled = totals.eligible, totals.scheduled
    near(cohort["facts"]["scheduled"], scheduled, f"Air {key}: direct full-fact scheduled count")
    near(cohort["facts"]["arrived"], eligible, f"Air {key}: direct full-fact eligible count")
    near(cohort["gauge"]["value"], totals.on_time/eligible if eligible else float("nan"), f"Air {key}: direct full-fact on-time rate")
    near(cohort["metrics"][0]["value"], totals.cancelled/scheduled if scheduled else float("nan"), f"Air {key}: direct full-fact cancellation rate")
    near(cohort["metrics"][1]["value"], totals.severe/eligible if eligible else float("nan"), f"Air {key}: direct full-fact severe rate")
    near(cohort["metrics"][2]["value"], totals.arrival_sum/eligible if eligible else float("nan"), f"Air {key}: direct full-fact mean delay")
    near(cohort["metrics"][3]["value"], totals.diverted/scheduled if scheduled else float("nan"), f"Air {key}: direct full-fact diversion rate")
    near(cohort["facts"]["attribution_minutes"], totals[cause_columns].sum(), f"Air {key}: direct full-fact attribution minutes")

sql_routes = pd.read_csv(aroot / "sql_route_analysis.csv").set_index("route_code")
for row in air["slices"]['["All","All"]']["tables"]["routes"]["rows"]:
    expected = sql_routes.loc[row[0]]
    near(row[1], expected.scheduled_flights, f"Air route {row[0]}: independent SQL scheduled count")
    near(row[2], expected.arrived_flights, f"Air route {row[0]}: independent SQL eligible count")
    near(row[3], expected.delay_over_15_rate, f"Air route {row[0]}: independent SQL late rate")
    near(row[4], expected.cancellation_rate, f"Air route {row[0]}: independent SQL cancellation rate")

out = ROOT / "artifacts/study-dashboards"
out.mkdir(parents=True, exist_ok=True)
(out / "data-verification.json").write_text(json.dumps({"passed": len(checks), "checks": checks}, indent=2), encoding="utf-8")
print(f"PASS: {len(checks)} checks across all 276 cohorts; independent source/mart reconciliation and unchanged input hashes.")
