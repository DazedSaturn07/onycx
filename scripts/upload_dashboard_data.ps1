param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$')]
    [string]$Bucket,

    [switch]$ConfirmDataRights,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

if (-not $ConfirmDataRights) {
    throw 'Review each source dataset license and privacy terms first, then rerun with -ConfirmDataRights. This script never creates a bucket or enables public access.'
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$dataRoot = Join-Path $repoRoot 'public\dashboard-data'
$manifestPath = Join-Path $dataRoot 'manifest.json'

if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw "Dashboard manifest was not found: $manifestPath. Run scripts/build_dashboard_data.py first."
}
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$version = [string]$manifest.data_version
if ($version -notmatch '^v[0-9]+$') {
    throw "Unsupported or missing dashboard data version in $manifestPath."
}
$versionRoot = Join-Path $dataRoot $version
if (-not (Test-Path -LiteralPath $versionRoot -PathType Container)) {
    throw "Versioned dashboard data was not found: $versionRoot. Run scripts/build_dashboard_data.py first."
}
if (-not $DryRun -and -not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
    throw 'Wrangler CLI is required. Install it with npm install --global wrangler, then run wrangler login.'
}

$versionRootPath = (Resolve-Path -LiteralPath $versionRoot).Path.TrimEnd('\')
$cachePolicy = 'public, max-age=31536000, immutable'
$files = Get-ChildItem -LiteralPath $versionRootPath -Filter '*.json' -File -Recurse | Sort-Object FullName

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($versionRootPath.Length).TrimStart('\') -replace '\\', '/'
    $objectKey = "analytics/$version/$relativePath"
    $destination = "$Bucket/$objectKey"
    if ($DryRun) {
        Write-Output "DRY RUN: $($file.FullName) -> $destination"
        continue
    }

    & wrangler r2 object put $destination "--file=$($file.FullName)" '--content-type=application/json' "--cache-control=$cachePolicy"
    if ($LASTEXITCODE -ne 0) {
        throw "Wrangler failed while uploading $destination (exit $LASTEXITCODE)."
    }
}

$manifestDestination = "$Bucket/analytics/manifest.json"
if ($DryRun) {
    Write-Output "DRY RUN: $manifestPath -> $manifestDestination (short cache)"
    return
}

& wrangler r2 object put $manifestDestination "--file=$manifestPath" '--content-type=application/json' '--cache-control=public, max-age=60, stale-while-revalidate=300'
if ($LASTEXITCODE -ne 0) {
    throw "Wrangler failed while uploading $manifestDestination (exit $LASTEXITCODE)."
}

Write-Output "Uploaded $($files.Count) immutable versioned JSON assets and the short-lived manifest to bucket '$Bucket'."
