"""Merge the new study payloads into the existing immutable R2 release manifest."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
root = ROOT / "public/dashboard-data"
manifest_path = root / "manifest.json"
manifest = json.loads(manifest_path.read_text())
credits = {
    "job-market": dict(title="LinkedIn Job Postings (2023-2024)", author="arshkon / Kaggle", source="https://www.kaggle.com/datasets/arshkon/linkedin-job-postings", license="CC BY-SA 4.0", license_url="https://creativecommons.org/licenses/by-sa/4.0/", changes="Cleaned, minimized and aggregated dashboard data. Derived dashboard data distributed under CC BY-SA 4.0."),
    "loanflow": dict(title="BPI Challenge 2017", author="Boudewijn van Dongen / 4TU.ResearchData", source="https://doi.org/10.4121/uuid:5f3067df-f10b-45da-b98b-86ae4c7a310b", license="4TU General Terms of Use", license_url="https://doi.org/10.4121/resource:terms_of_use", changes="Cleaned, minimized and aggregated dashboard data; source identifiers, staff resources and monetary amounts omitted."),
    "airops": dict(title="2015 Flight Delays and Cancellations", author="US Department of Transportation / Kaggle", source="https://www.kaggle.com/datasets/usdot/flight-delays", license="CC0 Public Domain", license_url="https://creativecommons.org/publicdomain/zero/1.0/", changes="Cleaned and aggregated dashboard data."),
}
for project in ["job-market", "loanflow", "airops"]:
    target = root / "v2" / project
    target.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / f"public/study-data/v1/{project}.json", target / "overview.json")
    for file in target.glob("*.json"):
        value = json.loads(file.read_text(encoding="utf-8"))
        value["attribution"] = credits[project]
        file.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False), encoding="utf-8")
entries = []
for project in ["retail-iq", "shoplens", "customer-behaviour", "novamart", "civicpulse", "freightflow", "job-market", "loanflow", "airops"]:
    for file in sorted((root / "v2" / project).glob("*.json")):
        payload = file.read_bytes()
        if not 0 < len(payload) < 12_000_000:
            raise ValueError(f"Asset exceeds the client size bound: {file.name}")
        entries.append(dict(path=file.relative_to(root).as_posix(),bytes=len(payload),sha256=hashlib.sha256(payload).hexdigest()))
entries.sort(key=lambda row: row["path"])
digest = hashlib.sha256("\n".join(f"{r['path']}:{r['sha256']}" for r in entries).encode()).hexdigest()
manifest.update(data_version="v2",built_at_utc=datetime.now(timezone.utc).isoformat(),r2_release_prefix=f"analytics/releases/{digest}",files=entries)
manifest_path.write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
print(f"Prepared immutable release {digest}: {len(entries)} verified assets.")
