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
$releasePrefix = [string]$manifest.r2_release_prefix
if ($releasePrefix -notmatch '^analytics/releases/[a-f0-9]{64}$') {
    throw 'Missing content-addressed release prefix. Rebuild the dashboard manifest first.'
}
$versionRoot = Join-Path $dataRoot $version
if (-not (Test-Path -LiteralPath $versionRoot -PathType Container)) {
    throw "Versioned dashboard data was not found: $versionRoot. Run scripts/build_dashboard_data.py first."
}
if (-not $DryRun -and -not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
    throw 'Wrangler CLI is required. Install it with npm install --global wrangler, then run wrangler login.'
}
$workerConfigPath = Join-Path $repoRoot 'analytics\cloudflare\wrangler.jsonc'
if (-not $DryRun) {
    & node (Join-Path $PSScriptRoot 'configure_dashboard_worker.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Cloudflare configuration failed; no files uploaded.' }
    $workerConfig = Get-Content -LiteralPath $workerConfigPath -Raw | ConvertFrom-Json
    if ($workerConfig.r2_buckets[0].bucket_name -ne $Bucket) { throw 'Upload bucket does not match the configured Worker bucket.' }
}

$versionRootPath = (Resolve-Path -LiteralPath $versionRoot).Path.TrimEnd('\')
$cachePolicy = 'public, max-age=31536000, immutable'
$files = @()
$seen = @{}
# Validate the entire manifest before the first upload. Never recurse over and
# publish arbitrary extra JSON placed under the public folder.
foreach ($entry in $manifest.files) {
    $relativePath = [string]$entry.path
    if ($relativePath -notmatch "^$version/(retail-iq|shoplens|customer-behaviour|sales-analysis)/(overview|interactions|products|retention|personas|affinity|instacart|behavior|quality)\.json$" -or $seen.ContainsKey($relativePath)) {
        throw "Invalid or duplicate manifest path: $relativePath"
    }
    $seen[$relativePath] = $true
    $fullPath = [IO.Path]::GetFullPath((Join-Path $dataRoot $relativePath))
    if (-not $fullPath.StartsWith($versionRootPath + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Asset path escaped the data directory.' }
    $file = Get-Item -LiteralPath $fullPath
    if ($file.Attributes -band [IO.FileAttributes]::ReparsePoint -or $file.Directory.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Linked asset paths are not permitted: $relativePath" }
    $hash = (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($file.Length -ne $entry.bytes -or $hash -ne $entry.sha256) { throw "Manifest size or hash mismatch: $relativePath" }
    $files += [PSCustomObject]@{ FullName = $fullPath; RelativePath = $relativePath }
}
if ($files.Count -eq 0) { throw 'The dashboard manifest has no assets.' }
$releaseText = (($manifest.files | Sort-Object path | ForEach-Object { "$($_.path):$($_.sha256)" }) -join "`n")
$releaseDigest = [Security.Cryptography.SHA256]::Create()
try { $releaseHash = ([BitConverter]::ToString($releaseDigest.ComputeHash([Text.Encoding]::UTF8.GetBytes($releaseText)))).Replace('-', '').ToLowerInvariant() } finally { $releaseDigest.Dispose() }
if ($releasePrefix -ne "analytics/releases/$releaseHash") { throw 'Release prefix does not match manifest content.' }

foreach ($file in $files) {
    $objectKey = "$releasePrefix/$($file.RelativePath)"
    $destination = "$Bucket/$objectKey"
    if ($DryRun) {
        Write-Output "DRY RUN: $($file.FullName) -> $destination"
        continue
    }

    & wrangler r2 object put $destination '--remote' "--config=$workerConfigPath" "--file=$($file.FullName)" '--content-type=application/json' "--cache-control=$cachePolicy"
    if ($LASTEXITCODE -ne 0) {
        throw "Wrangler failed while uploading $destination (exit $LASTEXITCODE)."
    }
}

$manifestDestination = "$Bucket/analytics/manifest.json"
if ($DryRun) {
    Write-Output "DRY RUN: $manifestPath -> $manifestDestination (short cache)"
    return
}

& wrangler r2 object put $manifestDestination '--remote' "--config=$workerConfigPath" "--file=$manifestPath" '--content-type=application/json' '--cache-control=public, max-age=60, must-revalidate'
if ($LASTEXITCODE -ne 0) {
    throw "Wrangler failed while uploading $manifestDestination (exit $LASTEXITCODE)."
}

Write-Output "Uploaded $($files.Count) immutable versioned JSON assets and the short-lived manifest to bucket '$Bucket'."
