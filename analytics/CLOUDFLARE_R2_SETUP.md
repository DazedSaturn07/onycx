# Cloudflare R2 setup for dashboard data

This guide publishes only the dashboard's aggregate JSON files to Cloudflare R2. The dashboards work without R2: by default Next.js reads files from `public/dashboard-data/v2/`.

> **Public data decision:** connecting a public R2 custom domain makes objects in that bucket publicly readable. Anyone who knows an object URL can fetch it. Keep raw CSV/XLSX files, Parquet intermediates, customer IDs, credentials, and unrelated files out of this bucket. Only upload the reviewed JSON in `public/dashboard-data/v2/`.

Cloudflare keeps R2 buckets private by default. A public custom domain and a narrow CORS rule are required for this browser-based setup. Use a dedicated bucket and data subdomain, for example `portfolio-dashboard-data` and `data.example.com`. Your domain must be in the same Cloudflare account/zone as the R2 bucket before it can be connected.

## 1. Review data rights before publishing

Read the dataset terms in all four source projects and decide whether public redistribution of the derived dashboard data is allowed. UCI Online Retail II is marked CC BY 4.0; retain attribution. Rights for the other source files were not confirmed during the build. The upload command has a `-ConfirmDataRights` switch so an upload cannot be started accidentally; it records your confirmation, it does not check license terms for you.

If you cannot confirm a dataset's terms, keep `NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL` blank and use the local build output, or remove that dataset's payload before publishing.

## 2. Create a private bucket

1. Sign in to the Cloudflare dashboard and open **R2 Object Storage**.
2. Create a bucket with a unique name, such as `portfolio-dashboard-data`.
3. Use the Standard storage class. Leave public access disabled for now. Do not enable the `r2.dev` development URL for production.

You can also create it with Wrangler after installing Node.js:

```powershell
npm install --global wrangler
wrangler login
wrangler r2 bucket create portfolio-dashboard-data
```

## 3. Prepare the exact CORS policy

The repository file [r2-cors.json](r2-cors.json) allows read-only browser requests from the local development origin and the production portfolio origin. It grants only `GET` and `HEAD`.

If your production site uses a different exact hostname, edit `allowed.origins` first. An origin has the scheme and hostname, with an optional port; it has no trailing slash or path. Add each preview origin explicitly if previews need to read the bucket.

Apply and verify the policy from the repository root:

```powershell
wrangler r2 bucket cors set portfolio-dashboard-data --file analytics/r2-cors.json
wrangler r2 bucket cors list portfolio-dashboard-data
```

Or open the bucket in the Cloudflare dashboard, choose **Settings → CORS Policy → Add CORS policy → JSON**, paste the contents of `analytics/r2-cors.json`, and save it.

## 4. Connect a dedicated custom domain

1. In R2, open the new bucket and select **Settings → Custom Domains → Add**.
2. Enter a dedicated data hostname such as `data.example.com` and connect it.
3. Wait for the custom domain status to become active.
4. Leave the `r2.dev` URL disabled. Use the custom domain for the public browser origin.

Connecting this domain makes the bucket's objects publicly accessible at their object paths. The bucket root does not list its contents, but this is not an access-control mechanism. Keep the bucket limited to these dashboard JSON files.

## 5. Build and inspect the payloads locally

From `X:\X1\Portfolio`:

```powershell
python scripts/build_dashboard_data.py
Get-Content public/dashboard-data/manifest.json
```

Check the source and metric reports before continuing:

```powershell
Get-Content analytics/reports/data-quality-report.json
Get-Content analytics/reports/metric-validation.json
Get-Content analytics/reports/payload-report.json
```

The builder only reads copies under `dashboard_datasets/` and checks their hashes against the four original project folders. It writes browser JSON separately from Parquet intermediates. Check the manifest paths: public object keys should start with `v2/` and contain only the four project folders' aggregate JSON files.

## 6. Dry-run, then upload the reviewed JSON

Install Wrangler globally because the upload script invokes the `wrangler` command:

```powershell
npm install --global wrangler
wrangler login
```

From the repository root, preview the exact object keys:

```powershell
.\scripts\upload_dashboard_data.ps1 -Bucket "portfolio-dashboard-data" -DryRun -ConfirmDataRights
```

After reviewing the output and confirming the data terms, upload:

```powershell
.\scripts\upload_dashboard_data.ps1 -Bucket "portfolio-dashboard-data" -ConfirmDataRights
```

The script reads the version from the generated manifest, uploads those versioned JSON files to `analytics/v2/...`, and writes the manifest to `analytics/manifest.json`. Versioned files get a one-year immutable cache header; the manifest gets a short cache lifetime. It uploads no CSV, Excel, Parquet, environment, or source project files. The script never creates a bucket or changes its public-access setting.

## 7. Allow Cloudflare to cache only the data paths

Cloudflare does not cache JSON by default, even when the R2 object carries a `Cache-Control` header. On the zone used by the data hostname, create a **Cache Rule** with this expression (replace the hostname):

```text
(http.host eq "data.example.com" and starts_with(http.request.uri.path, "/analytics/"))
```

Set **Cache eligibility** to **Eligible for cache**. Do not apply this rule to the portfolio hostname or unrelated paths. Let the object `Cache-Control` headers set the TTL: versioned files are immutable for one year, and the manifest can update after its short TTL. After changing bucket CORS for a hostname already serving cached objects, purge that hostname's cache so the new CORS headers are returned.

## 8. Point the portfolio at R2

Set this environment variable in the hosting provider's **build environment** (and in a local `.env.local` only if you want to test R2 locally):

```text
NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL=https://data.example.com
```

Use only the origin: no trailing slash and no `/analytics` suffix. The dashboard builds the complete URL, for example `https://data.example.com/analytics/v2/retail-iq/overview.json`. The Next.js Content Security Policy is generated from this exact environment origin; rebuild and redeploy the portfolio after changing it. Keep `.env.local` out of version control. Do not put R2 access keys in a `NEXT_PUBLIC_` variable.

## 9. Verify in a browser

After the deployment is live:

1. Open all four dashboard routes and check the browser Network panel for successful `overview.json` requests.
2. Open each tab and confirm the lazy JSON requests return HTTP 200 and charts render.
3. Confirm responses include `Access-Control-Allow-Origin` for the site origin. If the browser reports a CORS error, compare the request's `Origin` value exactly with the bucket policy; after policy changes, allow up to 30 seconds for propagation and purge the data hostname's cache.
4. Repeat one versioned JSON request and inspect `cf-cache-status`; after the cache rule is active, a later request should be served from cache.
5. Check the public object URL in a private browser window. It should return the JSON object; the bucket root should not expose a file listing.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Browser CORS error | Use an exact scheme/hostname/port in `analytics/r2-cors.json`; include the actual production or preview origin and only the required methods. Purge cached responses after CORS changes. |
| 404 for dashboard JSON | Check that uploads exist under the version prefix in `public/dashboard-data/manifest.json` and that the environment variable is only the custom-domain origin. |
| Browser still reads the local copy | Confirm the public environment variable was set at build time and redeploy the Next.js application. |
| `cf-cache-status: DYNAMIC` or no cache hit | Confirm the Cache Rule expression matches the dedicated data hostname and `/analytics/` paths, and that cache eligibility is enabled. JSON is not cached by default. |
| Dashboard fails CSP | Check the `connect-src` policy built from `NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL`; use HTTPS in production and rebuild after editing the variable. |

## Cloudflare references

- [R2 public buckets and custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [R2 CORS policy](https://developers.cloudflare.com/r2/buckets/cors/)
- [Wrangler R2 commands](https://developers.cloudflare.com/r2/reference/wrangler-commands/)
- [Cloudflare default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)
- [Create a Cache Rule](https://developers.cloudflare.com/cache/how-to/cache-rules/)
