"""Read existing project exports; write only public portfolio aggregates and an audit.

Run from the portfolio: python scripts/build_study_data.py [--source-root X:/X1]
No source notebook, database, workbook or report is executed or changed.
"""
from __future__ import annotations

import argparse
import hashlib
import itertools
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parents[1]
SOURCES: dict[Path, str] = {}


def track(path: Path) -> Path:
    with path.open("rb") as stream:
        SOURCES[path] = hashlib.file_digest(stream, "sha256").hexdigest()
    return path


def csv(path: Path, **kwargs) -> pd.DataFrame:
    return pd.read_csv(track(path), **kwargs)


def safe(value):
    if isinstance(value, dict):
        return {str(k): safe(v) for k, v in value.items()}
    if isinstance(value, (tuple, list)):
        return [safe(v) for v in value]
    if isinstance(value, np.generic):
        value = value.item()
    if isinstance(value, float):
        return round(value, 8) if np.isfinite(value) else None
    if pd.isna(value):
        return None
    return value


def metric(label, value, fmt="number", note=""):
    return dict(label=label, value=value, format=fmt, note=note)


def point(label, value, count=None):
    return dict(label=str(label), value=value, **({"count": count} if count is not None else {}))


def table(columns, rows):
    return {"columns": columns, "rows": rows}


def ratio(a, b):
    return a / b if b else None


def choices(frame, fields):
    return [dict(key=k, label=label, values=sorted(frame[k].dropna().astype(str).unique().tolist())) for k, label in fields]


def slices(frame, filters):
    for values in itertools.product(*[["All", *f["values"]] for f in filters]):
        selected = frame
        for f, v in zip(filters, values):
            if v != "All":
                selected = selected.loc[selected[f["key"]].astype(str).eq(v)]
        yield json.dumps(values, separators=(",", ":")), selected


def counts(frame, column):
    return [point(k, v) for k, v in frame[column].value_counts().items()]


def job_market(base):
    p = base / "DA_projects/Job_Market_Analysis/notebooks/data"
    e = p / "exports"
    fact = csv(e / "fact_job_posting.csv", usecols=["job_key", "role_key", "published_date_key", "seniority_title", "employment_type", "salary_numeric_present", "experience_min_years", "experience_numeric_present", "workplace_type", "salary_currency", "salary_period"])
    roles = csv(e / "dim_role.csv").set_index("role_key").canonical_role_name
    fact["role"] = fact.role_key.map(roles)
    fact["date"] = pd.to_datetime(fact.published_date_key.astype(str)).dt.strftime("%Y-%m-%d")
    calendar_dates = pd.date_range(fact.date.min(), fact.date.max()).strftime("%Y-%m-%d")
    quality = csv(e / "fact_job_quality.csv")
    flags = csv(e / "fact_job_flag.csv", usecols=["job_key", "rule_code", "severity"])
    repeats = csv(e / "fact_repost_event.csv")
    jobs = csv(e / "dim_job.csv", usecols=["job_key", "title_normalized"])
    bridge = csv(e / "bridge_job_skill.csv")
    skills = csv(e / "dim_skill.csv").set_index("skill_key").skill_name
    qa = json.loads(track(p / "qa_summary.json").read_text())
    assert fact.job_key.nunique() == len(quality) == 119041
    assert len(fact) == qa["rows_raw"] == 123849
    filters = choices(fact, [("role", "Role classification"), ("seniority_title", "Title seniority")])
    result = {}
    for key, df in slices(fact, filters):
        ids = set(df.job_key)
        q = quality.loc[quality.job_key.isin(ids)]
        fl = flags.loc[flags.job_key.isin(ids)]
        rp = repeats.loc[repeats.job_key.isin(ids)]
        entry = df.loc[df.seniority_title.eq("entry")]
        entry_ids = entry.job_key.nunique()
        flagged = entry.loc[entry.experience_min_years.ge(2)].job_key.nunique()
        numeric = int(df.salary_numeric_present.sum())
        daily_counts = df.groupby("date").size()
        dates = [point(day, int(daily_counts.get(day, 0))) for day in calendar_dates]
        by_role = [point(k, len(v), v.job_key.nunique()) for k, v in df.groupby("role")]
        pay = df.loc[df.salary_numeric_present]
        pay_table = [[str(c or "Unknown"), str(period or "Unknown"), len(v)] for (c, period), v in pay.fillna({"salary_currency": "Unknown", "salary_period": "Unknown"}).groupby(["salary_currency", "salary_period"])]
        sk = bridge.loc[bridge.job_key.isin(ids)].groupby("skill_key").job_key.nunique().sort_values(ascending=False)
        detail = q.nsmallest(12, ["jd_quality_score", "job_key"]).merge(jobs, on="job_key")
        flag_text = fl.groupby("job_key").rule_code.agg(lambda x: "; ".join(sorted(x.unique()))).to_dict()
        repeat_counts = df.groupby("job_key").size()
        result[key] = dict(
            hero=metric("Posting observations", len(df), note="Historical LinkedIn snapshot · March–April 2024"),
            gauge=dict(label="Numeric pay disclosure", value=ratio(numeric, len(df)), segments=[point("Numeric salary", numeric), point("No numeric salary", len(df)-numeric)]),
            metrics=[metric("Exact text groups", len(ids), note="Not verified unique vacancies"), metric("Representative JD quality", q.jd_quality_score.mean(), "score", "Mean score per visible text group · heuristic, 0–100"), metric("Extra repeated observations", len(rp), note="Exact text matching · not fraud evidence"), metric("Confirmed remote permission", int(df.workplace_type.eq("remote").sum()), note="Blank permission remains unknown")],
            trend=dates,
            rankings=dict(roles=sorted(by_role, key=lambda r: -r["value"]), quality=counts(q, "quality_band"), employment=counts(df, "employment_type"), flags=counts(fl, "rule_code"), skills=[point(skills.get(k, str(k)), v) for k, v in sk.head(12).items()], repetition=[point("One observation", int(repeat_counts.eq(1).sum())), point("Repeated text groups", int(repeat_counts.gt(1).sum()))]),
            facts=dict(observations=len(df), groups=len(ids), numeric_salary=numeric, entry_groups=entry_ids, entry_two_plus=flagged, entry_share=ratio(flagged, entry_ids), experience_coverage=ratio(int(df.experience_numeric_present.sum()), len(df)), remote_share=ratio(int(df.workplace_type.eq("remote").sum()), len(df)), review_groups=int(q.quality_band.isin(["Review Recommended", "Multiple Quality Concerns"]).sum()), repeated_groups=int(repeat_counts.gt(1).sum()), repeat_share=ratio(len(rp), len(df))),
            tables=dict(pay=table(["Currency", "Pay period", "Disclosing observations"], pay_table), review=table(["Representative title (lowest scores; up to 12)", "Quality score / 100", "Band", "Review rules"], [[r.title_normalized, r.jd_quality_score, r.quality_band, flag_text.get(r.job_key, "No flags")] for r in detail.itertuples()]), entry=table(["Role", "Entry text groups", "Parsed 2+ years", "Share of entry groups"], [[role, v.job_key.nunique(), v.loc[v.experience_min_years.ge(2)].job_key.nunique(), ratio(v.loc[v.experience_min_years.ge(2)].job_key.nunique(), v.job_key.nunique())] for role, v in entry.groupby("role")]))
        )
    all_data = result['["All","All"]']
    assert all_data["facts"]["entry_two_plus"] == qa["entry_jobs_requiring_2plus_years"] == 73
    assert all_data["facts"]["numeric_salary"] == 36073
    assert all_data["metrics"][2]["value"] == qa["repost_events_count"] == 4808
    return dict(filters=filters, slices=result, period="24 March–20 April 2024 UTC · final day is partial", notes=["Historical posting quality, not a fake-job detector or a measure of today's vacancies.", "Observations, exact text groups and representative quality records use different grains. A text group is not a verified unique vacancy.", "Quality is the latest representative group score, not a historical score for each observation. Missing numeric experience is unknown, not zero.", "Numeric disclosure includes usable minimum, maximum or publisher median pay. Currency and pay period are kept separate.", "Title and skill classification use limited rules; unclassified postings are retained. Remote permission is known only where recorded."], validation=["123,849 observations and 119,041 exact text groups reconcile with qa_summary.json.", "36,073 numeric-salary observations; 4,808 repeated observations; 73 of 2,919 entry-title groups have parsed 2+ years.", "All 42 role/seniority selections are computed independently from the exported posting and group facts."])


def loanflow(base):
    p = base / "major_projects/Business_Analyst/LoanFlow_Process_Redesign/data/processed"
    cases = csv(p / "case_summary.csv")
    cases["month"] = cases.start_date.str[:7]
    variants = csv(p / "variant_summary.csv").set_index("variant_id")
    events = csv(p / "event_log.csv", usecols=["case_id", "activity", "lifecycle"])
    completed = events.loc[events.activity.str.startswith("W_") & events.lifecycle.eq("complete")].groupby(["case_id", "activity"]).size().sub(1).clip(lower=0).rename("extra").reset_index()
    business = csv(p / "business_events.csv")
    transitions = csv(p / "transition_summary.csv")
    expected = csv(p / "python_kpis.csv").set_index("metric").value
    assert len(cases) == expected.applications == 31509
    assert completed.extra.sum() == cases.repeat_count.sum() == expected.extra_completions == 5086
    filters = choices(cases, [("application_type", "Application type"), ("month", "Application start month")])
    result = {}
    for key, df in slices(cases, filters):
        ids = set(df.case_id)
        resolved = df.loc[df.is_resolved.eq(1)]
        duration = resolved.duration_days
        path_counts = df.variant_id.value_counts()
        extra = completed.loc[completed.case_id.isin(ids)].groupby("activity").extra.sum().sort_values(ascending=False)
        path_rows = [[f"Path {i}", int(count), ratio(count, len(df)), variants.loc[i, "path"]] for i, count in path_counts.head(20).items()]
        detail = []
        for i, r in enumerate(df.sort_values("case_id").head(3).itertuples(), 1):
            ev = business.loc[business.case_id.eq(r.case_id)].sort_values("event_seq")
            detail.append(dict(label=f"Example {i}", type=r.application_type, goal=r.loan_goal, status=r.resolution_label, days=r.duration_days, events=[dict(activity=e.activity, time=e.event_time) for e in ev.itertuples()]))
        signal_rows = []
        for field, label in [("is_incomplete", "Incomplete-file signal"), ("has_repeated_work", "Repeated completed work")]:
            for value, group in df.groupby(field):
                d = group.loc[group.is_resolved.eq(1)].duration_days
                signal_rows.append([label, "Present" if value else "Absent", len(group), len(d), d.median()])
        result[key] = dict(
            hero=metric("Loan applications", len(df), note="BPI Challenge 2017 · historical application start cohorts"),
            gauge=dict(label="Resolved at cutoff", value=ratio(len(resolved), len(df)), segments=counts(df, "resolution_label")),
            metrics=[metric("Median resolution", duration.median(), "days", "Resolved applications only · calendar days"), metric("P90 resolution", duration.quantile(.9), "days", "90th percentile · unresolved cases excluded"), metric("Incomplete-file signal", df.is_incomplete.mean(), "percent", "A recorded signal, not an established cause"), metric("Repeated completed work", df.has_repeated_work.mean(), "percent", "Investigative proxy; repetitions can be legitimate")],
            trend=[point(k, len(v)) for k, v in df.groupby("month")],
            rankings=dict(goals=counts(df, "loan_goal"), milestones=counts(df, "resolution_label"), repeats=[point(k.replace("W_", ""), v) for k, v in extra.items() if v], durations=[point(label, int(((duration >= lo) & (duration < hi)).sum())) for label, lo, hi in [("0–7 days", 0, 7), ("7–14 days", 7, 14), ("14–21 days", 14, 21), ("21–35 days", 21, 35), ("35+ days", 35, float("inf"))]]),
            facts=dict(applications=len(df), resolved=len(resolved), unresolved=len(df)-len(resolved), mean_days=duration.mean(), extra_completions=df.repeat_count.sum(), acceptance_share=ratio(int(df.loc[df.offer_count.gt(0)].has_offer_acceptance.sum()), int(df.offer_count.gt(0).sum())), multi_offer_share=ratio(int(df.offer_count.gt(1).sum()), int(df.offer_count.gt(0).sum())), top_twenty_share=ratio(int(path_counts.head(20).sum()), len(df)), path_count=len(path_counts), event_count=df.event_count.sum(), unresolved_age=df.loc[df.is_resolved.eq(0)].unresolved_age_days.mean()),
            tables=dict(paths=table(["Exact path", "Applications", "Cohort share", "Ordered recorded activities"], path_rows), signals=table(["Signal", "State", "Applications", "Resolved", "Median calendar days"], signal_rows)), samples=detail)
    full = result['["All","All"]']
    assert abs(full["metrics"][0]["value"] - expected.median_duration_days) < 1e-8
    assert abs(full["metrics"][1]["value"] - expected.p90_duration_days) < 1e-8
    assert full["facts"]["event_count"] == len(events) == 1202267
    return dict(filters=filters, slices=result, period="2016 application start cohorts · BPI Challenge 2017 event log", transitions=table(["From activity", "To activity", "Transitions", "Affected cases", "Mean calendar hours", "Median calendar hours"], [[r.activity, r.next_activity, r.transition_count, r.affected_cases, r.mean_gap_hours, r.median_gap_hours] for r in transitions.nlargest(15, "mean_gap_hours").itertuples()]), notes=["Elapsed calendar time is not proven queue time or labour time. Pending is a recorded milestone, not proof of funding.", "Unresolved applications are censored at the historical cutoff; resolution percentiles exclude them.", "Repeated completed W_ records are an investigation proxy. Review the original case evidence before proposing an intervention.", "Pilot scenarios use the original Conservative, Base and Stretch assumptions. Capacity value is hypothetical, not achieved savings; implementation cost is EUR 20,000.", "Case investigation shows up to three deterministic examples per selection, using real ordered business activities with anonymized labels. It is not an exhaustive case browser."], validation=["31,509 applications, 1,202,267 events and 5,086 extra completions reconcile with source exports.", "Full-population median and P90 match python_kpis.csv to 1e-8 calendar days.", "Every displayed start-month/application-type cohort is calculated from the case fact; exact-path coverage is recalculated within that cohort."])


AIR_SUMS = ["scheduled", "arrived", "ontime", "late", "severe", "cancelled_n", "diverted_n", "arrival_sum", "numeric", "Air system", "Security", "Airline", "Late aircraft", "Weather"]


def air_metrics(df):
    s = df[AIR_SUMS].sum()
    return dict(s, ontime_rate=ratio(s.ontime, s.arrived), cancellation_rate=ratio(s.cancelled_n, s.scheduled), severe_rate=ratio(s.severe, s.arrived), late_rate=ratio(s.late, s.arrived), diversion_rate=ratio(s.diverted_n, s.scheduled), mean_delay=ratio(s.arrival_sum, s.arrived), reliability=max(0, 100-50*s.late/s.arrived-50*s.cancelled_n/s.scheduled) if s.arrived and s.scheduled else None)


def airops(base):
    p = base / "major_projects/Data_Analyst/AirOps_Airline_Disruption/notebooks/data"
    source = track(p / "processed/fact_flight.parquet")
    expected = csv(p / "exports/python_kpi_summary.csv").iloc[0]
    airline_df = csv(p / "raw/airlines.csv")
    airlines = dict(zip(airline_df.iloc[:, 0], airline_df.iloc[:, 1]))
    columns = ["flight_date", "airline_code", "route_code", "departure_hour", "arrival_delay_minutes", "cancelled", "diverted", "air_system_delay_minutes", "security_delay_minutes", "airline_delay_minutes", "late_aircraft_delay_minutes", "weather_delay_minutes"]
    routes, hours = [], []
    for batch in pq.ParquetFile(source).iter_batches(batch_size=400_000, columns=columns):
        d = batch.to_pandas()
        d["month"] = pd.to_datetime(d.flight_date).dt.strftime("%Y-%m")
        d["carrier"] = d.airline_code
        d["scheduled"] = 1
        eligible = d.cancelled.eq(0) & d.diverted.eq(0) & d.arrival_delay_minutes.notna()
        for key, test in [("arrived", eligible), ("ontime", eligible & d.arrival_delay_minutes.le(15)), ("late", eligible & d.arrival_delay_minutes.gt(15)), ("severe", eligible & d.arrival_delay_minutes.gt(60)), ("cancelled_n", d.cancelled.eq(1)), ("diverted_n", d.diverted.eq(1)), ("numeric", d.route_code.str.match(r"\d"))]:
            d[key] = test.astype("int32")
        d["arrival_sum"] = d.arrival_delay_minutes.where(eligible, 0).fillna(0)
        for label, col in zip(AIR_SUMS[9:], columns[-5:]):
            d[label] = d[col].fillna(0)
        routes.append(d.groupby(["carrier", "month", "route_code"], observed=True)[AIR_SUMS].sum())
        hours.append(d.groupby(["carrier", "month", "departure_hour"], observed=True)[AIR_SUMS].sum())
        print(f"AirOps: read {int(sum(x.scheduled.sum() for x in routes)):,} observations", flush=True)
    r = pd.concat(routes).groupby(level=[0, 1, 2]).sum().reset_index()
    h = pd.concat(hours).groupby(level=[0, 1, 2]).sum().reset_index()
    filters = choices(r, [("carrier", "Carrier code"), ("month", "Month in 2015")])
    result = {}
    for key, df in slices(r, filters):
        s = air_metrics(df)
        values = json.loads(key)
        hf = h
        for f, v in zip(filters, values):
            if v != "All":
                hf = hf.loc[hf[f["key"]].eq(v)]
        def rank_groups(frame, col, field):
            return [point(k, (m := air_metrics(g))[field], int(m["scheduled"])) for k, g in frame.groupby(col, sort=True)]
        trend = rank_groups(df, "month", "ontime_rate")
        carrier = sorted(rank_groups(df, "carrier", "cancellation_rate"), key=lambda x: -(x["value"] or 0))
        rt = df.groupby("route_code")[AIR_SUMS].sum().reset_index()
        rt = rt.loc[rt.scheduled.ge(1000) & rt.arrived.gt(0)].copy()
        rt["late_rate"] = rt.late / rt.arrived
        rt = rt.sort_values(["late_rate", "route_code"], ascending=[False, True]).head(20)
        split = df.route_code.str.split("-", n=1, expand=True).reindex(columns=[0, 1])
        airports = df.assign(origin=split[0], destination=split[1])
        origin = [x for x in rank_groups(airports, "origin", "severe_rate") if x["count"] >= 1000 and x["value"] is not None]
        destination = [x for x in rank_groups(airports, "destination", "severe_rate") if x["count"] >= 1000 and x["value"] is not None]
        route_rows = []
        for row in rt.itertuples():
            m = air_metrics(rt.loc[rt.route_code.eq(row.route_code)])
            route_rows.append([row.route_code, int(m["scheduled"]), int(m["arrived"]), m["late_rate"], m["cancellation_rate"], m["severe_rate"], m["mean_delay"], m["reliability"]])
        result[key] = dict(
            hero=metric("Scheduled observations", int(s["scheduled"]), note="US flight records · January–December 2015"),
            gauge=dict(label="Custom on-time arrivals", value=s["ontime_rate"], segments=[point("On time ≤15m", int(s["ontime"])), point("Late >15m", int(s["late"]))]),
            metrics=[metric("Cancellation rate", s["cancellation_rate"], "percent", f"{int(s['cancelled_n']):,} of {int(s['scheduled']):,} scheduled"), metric("Severe arrival delay", s["severe_rate"], "percent", f">60 minutes · {int(s['severe']):,} eligible arrivals"), metric("Mean arrival delay", s["mean_delay"], "minutes", "Eligible arrivals · includes early arrivals"), metric("Diversion rate", s["diversion_rate"], "percent", f"{int(s['diverted_n']):,} of {int(s['scheduled']):,} scheduled")],
            trend=trend, rankings=dict(carriers=carrier, routes=[point(row[0], row[3], row[1]) for row in route_rows], origins=sorted(origin, key=lambda x: -x["value"])[:20], destinations=sorted(destination, key=lambda x: -x["value"])[:20], attribution=sorted([point(k, float(s[k])) for k in AIR_SUMS[9:]], key=lambda x: -x["value"]), hours=rank_groups(hf, "departure_hour", "mean_delay")),
            facts=dict(scheduled=int(s["scheduled"]), arrived=int(s["arrived"]), ontime=int(s["ontime"]), late=int(s["late"]), cancelled=int(s["cancelled_n"]), diverted=int(s["diverted_n"]), numeric_airport_rows=int(s["numeric"]), numeric_share=ratio(s["numeric"], s["scheduled"]), attribution_minutes=float(sum(s[k] for k in AIR_SUMS[9:])), reliability=s["reliability"]),
            tables=dict(routes=table(["Source-code route", "Scheduled", "Eligible arrivals", "Delay >15m rate", "Cancellation rate", "Severe >60m rate", "Mean delay (min)", "Reliability index / 100"], route_rows), carriers=table(["Carrier", "Name", "Scheduled", "Eligible arrivals", "On time ≤15m", "Cancellation rate"], [[k, airlines.get(k, k), int((m := air_metrics(g))["scheduled"]), int(m["arrived"]), m["ontime_rate"], m["cancellation_rate"]] for k, g in df.groupby("carrier")]), months=table(["Month", "Scheduled", "Eligible arrivals", "On time ≤15m", "Cancellation rate"], [[k, int((m := air_metrics(g))["scheduled"]), int(m["arrived"]), m["ontime_rate"], m["cancellation_rate"]] for k, g in df.groupby("month")]))
        )
    full = result['["All","All"]']
    assert full["facts"]["scheduled"] == expected.scheduled_flights == 5819079
    assert full["facts"]["arrived"] == expected.arrived_flights == 5714008
    assert full["facts"]["ontime"] == expected.on_time_arrivals == 4690510
    assert full["facts"]["numeric_airport_rows"] == 486165
    assert abs(full["metrics"][2]["value"] - expected.average_arrival_delay_minutes) < 1e-9
    return dict(filters=filters, slices=result, period="January–December 2015 · historical US flight observations", notes=["Custom on time means arrival delay ≤15 minutes; the official BTS boundary differs at exactly 15 minutes.", "Arrival rates exclude cancelled, diverted and missing-delay observations. Cancellation and diversion rates use all scheduled observations.", "October includes 486,165 unresolved numeric airport IDs. Totals retain them; route and airport codes are not harmonized across the year.", "Ranked routes and airports require at least 1,000 scheduled observations within the selected cohort. Rankings show up to 20 entries, not all routes.", "Recorded attribution minutes are source categories, not proven root cause or achievable savings. One row is a source observation, not a guaranteed unique physical flight."], validation=["All 5,819,079 observations retained; 5,714,008 eligible arrivals and 4,690,510 custom on-time arrivals match python_kpi_summary.csv.", "Weighted rates and mean delay are calculated from summed numerators and denominators, never averages of rates.", "Carrier/month selections, route and airport ranks, departure hours and recorded attribution all derive from the same processed flight fact."])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, default=ROOT.parent)
    parser.add_argument("--project", choices=["job-market", "loanflow", "airops", "all"], default="all")
    args = parser.parse_args()
    out = ROOT / "public/study-data/v1"
    out.mkdir(parents=True, exist_ok=True)
    manifest_path = out.parent / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {"version": 1, "projects": {}}
    for slug, builder in [("job-market", job_market), ("loanflow", loanflow), ("airops", airops)]:
        if args.project not in ("all", slug):
            continue
        SOURCES.clear()
        data = builder(args.source_root)
        provenance = [{"file": str(p.relative_to(args.source_root)).replace("\\", "/"), "sha256": digest} for p, digest in SOURCES.items()]
        for p, digest in SOURCES.items():
            assert hashlib.file_digest(p.open("rb"), "sha256").hexdigest() == digest, f"Source changed during build: {p.name}"
        data.update(version=1, project=slug, prepared_at=datetime.now(timezone.utc).isoformat(), sources=provenance)
        payload = json.dumps(safe(data), ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode()
        (out / f"{slug}.json").write_bytes(payload)
        manifest["projects"][slug] = dict(path=f"v1/{slug}.json", bytes=len(payload), sha256=hashlib.sha256(payload).hexdigest())
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(f"{slug}: {len(data['slices'])} exact cohorts; {len(payload):,} bytes; {len(provenance)} source hashes unchanged", flush=True)


if __name__ == "__main__":
    main()
