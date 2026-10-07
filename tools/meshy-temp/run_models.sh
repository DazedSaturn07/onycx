#!/usr/bin/env bash
set -u

mkdir -p refs outputs previews results
python tools/meshy-temp/build_refs.py

echo "Checking Meshy account balance..."
meshy balance --output-schema v1 --format json --no-update-check | tee results/balance-before.json || true

printf "slug,task_id,status\n" > results/manifest.csv

PRODUCTS=(
  veyr-silk-conditioner
  aurel-barrier-creme
  lune-lip-veil
  mire-melt-cleansing-balm
  nacre-treatment-essence
  oriel-eye-contour
  sable-body-cleanser
  serein-amino-cleanser
  solenne-uv-veil-spf-50
  suede-body-creme
  vesper-peptide-concentrate
  veyr-rich-shampoo
)

failures=0
for slug in "${PRODUCTS[@]}"; do
  echo "============================================================"
  echo "ONYCX / Meshy 7.1 / $slug"
  echo "============================================================"

  # Latest Meshy Image-to-3D API settings:
  # - meshy-7.1
  # - Ultra 4K geometry
  # - 8K texture
  # - PBR maps
  # - image enhancement disabled to preserve exact label/color appearance.
  DATA='{"ai_model":"meshy-7.1","geometry_resolution":"4k"}'

  set +e
  meshy image-to-3d create     --image-url "refs/$slug.jpg"     --model-type standard     --should-texture true     --enable-pbr true     --texture-resolution 8k     --image-enhancement false     --target-formats glb     --data "$DATA"     --timeout 1800     --save-json "results/task-$slug.json"     --output-schema v1     --format json     --no-update-check > "results/create-$slug.json"
  rc=$?
  set -e

  if [ $rc -eq 9 ]; then
    echo "$slug,,INSUFFICIENT_CREDITS" >> results/manifest.csv
    echo "Meshy reported insufficient credits; stopping additional paid submissions."
    failures=$((failures+1))
    break
  fi

  if [ $rc -ne 0 ]; then
    echo "$slug,,CREATE_FAILED" >> results/manifest.csv
    failures=$((failures+1))
    continue
  fi

  task_id=$(jq -r '
    .result.submission.task_id //
    .result.task.id //
    .result.id //
    .id //
    empty
  ' "results/create-$slug.json" | head -n1)

  if [ -z "$task_id" ] && [ -f "results/task-$slug.json" ]; then
    task_id=$(jq -r '.id // .result.id // .result.task.id // empty' "results/task-$slug.json" | head -n1)
  fi

  if [ -z "$task_id" ]; then
    echo "$slug,,TASK_ID_MISSING" >> results/manifest.csv
    failures=$((failures+1))
    continue
  fi

  echo "Task ID: $task_id"

  set +e
  meshy download     --resource image-to-3d     --task-id "$task_id"     --model-format glb     --output "outputs/$slug.glb"     --output-schema v1     --format json     --no-update-check > "results/download-$slug.json"
  dl_rc=$?

  mkdir -p "previews/$slug"
  meshy download     --resource image-to-3d     --task-id "$task_id"     --kind thumbnail     --output-dir "previews/$slug"     --output-schema v1     --format json     --no-update-check > "results/preview-$slug.json"
  pv_rc=$?
  set -e

  if [ $dl_rc -eq 0 ] && [ -s "outputs/$slug.glb" ]; then
    echo "$slug,$task_id,SUCCEEDED" >> results/manifest.csv
    ls -lh "outputs/$slug.glb"
  else
    echo "$slug,$task_id,DOWNLOAD_FAILED" >> results/manifest.csv
    failures=$((failures+1))
  fi
done

meshy balance --output-schema v1 --format json --no-update-check | tee results/balance-after.json || true
echo "$failures" > results/failure-count.txt
cat results/manifest.csv

python - <<'PY'
import csv, json, pathlib
p=pathlib.Path("results/manifest.csv")
rows=[]
if p.exists():
    with p.open() as f:
        rows=list(csv.DictReader(f))
report={
  "collection":"ONYCX Cosmetics & Skincare",
  "generator":"Meshy AI Image-to-3D",
  "settings":{
    "ai_model":"meshy-7.1",
    "geometry_resolution":"4k",
    "texture_resolution":"8k",
    "enable_pbr":True,
    "image_enhancement":False,
    "target_format":"glb"
  },
  "models":rows
}
pathlib.Path("ONYCX_Meshy_12_GLBS_manifest.json").write_text(json.dumps(report,indent=2))
PY

zip -r ONYCX_Meshy_12_GLBS.zip outputs previews refs results ONYCX_Meshy_12_GLBS_manifest.json

if [ "$failures" -ne 0 ]; then
  echo "Completed with $failures failures; package retained for inspection."
  exit 1
fi
