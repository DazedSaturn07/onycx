export function analyticsDataOrigin(value = "") {
  if (!value.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error();
    return url.origin;
  } catch {
    throw new Error("NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL must be an HTTPS origin with no credentials, path, query, or fragment.");
  }
}

export function contentSecurityPolicy({ nonce = "", production = true, dataOrigin = "" } = {}) {
  return [
    "default-src 'self'", "base-uri 'self'",
    `connect-src 'self'${dataOrigin ? ` ${dataOrigin}` : ""}`,
    "font-src 'self' data:", "form-action 'self'", "frame-ancestors 'none'", "frame-src 'none'",
    "img-src 'self' data: blob:", "object-src 'none'",
    `script-src 'self'${nonce ? ` 'nonce-${nonce}' 'strict-dynamic'` : ""}${production ? "" : " 'unsafe-eval'"}`,
    "script-src-attr 'none'",
    // Recharts and motion position elements using inline style attributes.
    "style-src 'self' 'unsafe-inline'",
    ...(production ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
