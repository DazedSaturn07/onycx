"""Build minimized, identifier-free inputs for coordinated dashboard selections.

Source projects are read-only. Airline records are aggregated before publication;
job and loan records omit source identifiers, descriptions, resources and amounts.
"""
from pathlib import Path
import hashlib
import json

import pandas as pd
import pyarrow.parquet as pq

from build_study_data import ROOT, AIR_SUMS, SOURCES, csv, safe, track

BASE = ROOT.parent
OUT = ROOT / "public/dashboard-data/v2"


def dictionary(series):
    values = sorted(series.fillna("Unknown").astype(str).unique().tolist())
    return values, {value: i for i, value in enumerate(values)}


def emit(slug, name, data):
    folder = OUT / slug
    folder.mkdir(parents=True, exist_ok=True)
    data.update(version=1, project=slug)
    payload = json.dumps(safe(data), ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode()
    (folder / f"{name}.json").write_bytes(payload)
    print(f"{slug}/{name}: {len(payload):,} bytes", flush=True)


def jobs():
    p = BASE / "DA_projects/Job_Market_Analysis/notebooks/data/exports"
    f = csv(p / "fact_job_posting.csv", usecols=["job_key", "source_job_id", "role_key", "published_date_key", "seniority_title", "employment_type", "salary_numeric_present", "workplace_type", "experience_min_years", "experience_numeric_present", "salary_currency", "salary_period"])
    q = csv(p / "fact_job_quality.csv").sort_values("job_key").reset_index(drop=True)
    titles = csv(p / "dim_job.csv", usecols=["job_key", "title_normalized"]).set_index("job_key").title_normalized
    flags = csv(p / "fact_job_flag.csv", usecols=["job_key", "rule_code"])
    reposts = csv(p / "fact_repost_event.csv")
    role_names = csv(p / "dim_role.csv").set_index("role_key").canonical_role_name.to_dict()
    f["role"] = f.role_key.map(role_names)
    f["date"] = pd.to_datetime(f.published_date_key.astype(str)).dt.strftime("%Y-%m-%d")
    names, codes = {}, {}
    for key, col in [("roles", "role"), ("dates", "date"), ("seniorities", "seniority_title"), ("employment", "employment_type"), ("currencies", "salary_currency"), ("periods", "salary_period")]:
        names[key], codes[key] = dictionary(f[col])
    names["bands"], codes["bands"] = dictionary(q.quality_band)
    names["rules"], codes["rules"] = dictionary(flags.rule_code)
    index = {key: i for i, key in enumerate(q.job_key)}
    group_roles = f.drop_duplicates("job_key").set_index("job_key").role
    masks = flags.groupby("job_key").rule_code.agg(lambda values: sum(1 << codes["rules"][value] for value in set(values)))
    groups = [[codes["roles"][group_roles[key]], score, codes["bands"][band], int(masks.get(key, 0))] for key, score, band in q[["job_key", "jd_quality_score", "quality_band"]].itertuples(index=False, name=None)]
    repeated_ids = set(reposts.current_source_job_id)
    observations = [[index[r.job_key], codes["dates"][r.date], codes["seniorities"][r.seniority_title], codes["employment"][r.employment_type], int(r.salary_numeric_present), int(r.workplace_type == "remote"), r.experience_min_years, int(r.experience_numeric_present), codes["currencies"][str(r.salary_currency) if pd.notna(r.salary_currency) else "Unknown"], codes["periods"][str(r.salary_period) if pd.notna(r.salary_period) else "Unknown"], int(r.source_job_id in repeated_ids)] for r in f.itertuples()]
    bridge = csv(p / "bridge_job_skill.csv")
    skill_names = csv(p / "dim_skill.csv").set_index("skill_key").skill_name
    names["skills"] = skill_names.tolist()
    skill_codes = {key: i for i, key in enumerate(skill_names.index)}
    skills = [[index[r.job_key], skill_codes[r.skill_key]] for r in bridge.itertuples()]
    # Preserve a bounded, diverse set of representative titles, not descriptions.
    profiles = f[["job_key", "role", "seniority_title"]].drop_duplicates("job_key").merge(q[["job_key", "jd_quality_score", "quality_band"]], on="job_key")
    examples = profiles.sort_values(["jd_quality_score", "job_key"]).groupby(["role", "seniority_title", "quality_band"]).head(12)
    review = {str(index[key]): titles[key] for key in examples.job_key}
    emit("job-market", "crossfilter", dict(names=names, groups=groups, rows=observations, skills=skills, review=review, calendar=pd.date_range(f.date.min(), f.date.max()).strftime("%Y-%m-%d").tolist()))


def loans():
    p = BASE / "major_projects/Business_Analyst/LoanFlow_Process_Redesign/data/processed"
    f = csv(p / "case_summary.csv").sort_values("case_id").reset_index(drop=True)
    f["month"] = f.start_date.str[:7]
    names, codes = {}, {}
    for key, col in [("types", "application_type"), ("goals", "loan_goal"), ("months", "month"), ("statuses", "resolution_label")]:
        names[key], codes[key] = dictionary(f[col])
    variants = csv(p / "variant_summary.csv").sort_values("variant_id")
    variant_codes = {key: i for i, key in enumerate(variants.variant_id)}
    paths = [[r.variant_id, r.path] for r in variants.itertuples()]
    rows = [[codes["types"][r.application_type], codes["goals"][r.loan_goal], codes["months"][r.month], codes["statuses"][r.resolution_label], r.duration_days if r.is_resolved else None, int(r.is_incomplete), int(r.repeat_count), int(r.offer_count), int(r.has_offer_acceptance), variant_codes[r.variant_id], int(r.event_count), r.unresolved_age_days] for r in f.itertuples()]
    row_index = {key: i for i, key in enumerate(f.case_id)}
    events = csv(p / "event_log.csv", usecols=["case_id", "activity", "lifecycle"])
    work = events.loc[events.activity.str.startswith("W_") & events.lifecycle.eq("complete")].groupby(["case_id", "activity"]).size().sub(1).clip(lower=0).rename("extra").reset_index()
    names["activities"], activity_codes = dictionary(work.activity)
    repetitions = [[row_index[r.case_id], activity_codes[r.activity], int(r.extra)] for r in work.loc[work.extra.gt(0)].itertuples()]
    sample = csv(p / "validation_sample.csv", usecols=["case_id"])
    anchors = f.groupby(["application_type", "month"]).head(3).case_id
    preserved = set(sample.case_id) | set(anchors)
    business = csv(p / "business_events.csv")
    histories = {str(row_index[key]): [[r.activity, r.event_time] for r in group.sort_values("event_seq").itertuples()] for key, group in business.loc[business.case_id.isin(preserved)].groupby("case_id")}
    emit("loanflow", "crossfilter", dict(names=names, rows=rows, paths=paths, repetitions=repetitions, histories=histories))


def flights():
    p = BASE / "major_projects/Data_Analyst/AirOps_Airline_Disruption/notebooks/data"
    source = track(p / "processed/fact_flight.parquet")
    columns = ["flight_date", "airline_code", "route_code", "departure_hour", "arrival_delay_minutes", "cancelled", "diverted", "air_system_delay_minutes", "security_delay_minutes", "airline_delay_minutes", "late_aircraft_delay_minutes", "weather_delay_minutes"]
    core, hourly = [], []
    for batch in pq.ParquetFile(source).iter_batches(batch_size=400_000, columns=columns):
        f = batch.to_pandas()
        f["month"] = pd.to_datetime(f.flight_date).dt.strftime("%Y-%m")
        f["carrier"] = f.airline_code
        f["scheduled"] = 1
        eligible = f.cancelled.eq(0) & f.diverted.eq(0) & f.arrival_delay_minutes.notna()
        for key, mask in [("arrived", eligible), ("ontime", eligible & f.arrival_delay_minutes.le(15)), ("late", eligible & f.arrival_delay_minutes.gt(15)), ("severe", eligible & f.arrival_delay_minutes.gt(60)), ("cancelled_n", f.cancelled.eq(1)), ("diverted_n", f.diverted.eq(1)), ("numeric", f.route_code.str.match(r"\d"))]:
            f[key] = mask.astype(int)
        f["arrival_sum"] = f.arrival_delay_minutes.where(eligible, 0).fillna(0)
        for label, col in zip(AIR_SUMS[9:], columns[-5:]):
            f[label] = f[col].fillna(0)
        core.append(f.groupby(["carrier", "month", "route_code"])[AIR_SUMS].sum())
        hourly.append(f.groupby(["carrier", "month", "route_code", "departure_hour"])[["scheduled", "arrived", "arrival_sum"]].sum())
    core = pd.concat(core).groupby(level=[0, 1, 2]).sum().reset_index()
    hourly = pd.concat(hourly).groupby(level=[0, 1, 2, 3]).sum().reset_index()
    names, codes = {}, {}
    for key, col in [("carriers", "carrier"), ("months", "month"), ("routes", "route_code")]:
        names[key], codes[key] = dictionary(core[col])
    airline = csv(p / "raw/airlines.csv")
    airline_names = dict(zip(airline.iloc[:, 0], airline.iloc[:, 1]))
    rows = [[codes["carriers"][r[0]], codes["months"][r[1]], codes["routes"][r[2]], *r[3:]] for r in core.itertuples(index=False, name=None)]
    hours = [[codes["carriers"][r[0]], codes["months"][r[1]], codes["routes"][r[2]], *r[3:]] for r in hourly.itertuples(index=False, name=None)]
    emit("airops", "crossfilter", dict(names=names, airlineNames=airline_names, columns=AIR_SUMS, rows=rows))
    emit("airops", "hourly", dict(rows=hours))


if __name__ == "__main__":
    jobs()
    loans()
    flights()
    for path, digest in SOURCES.items():
        with path.open("rb") as stream:
            assert hashlib.file_digest(stream, "sha256").hexdigest() == digest, f"Source changed: {path.name}"
    print(f"Verified {len(SOURCES)} unchanged read-only source inputs.")
