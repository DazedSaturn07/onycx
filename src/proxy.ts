import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { analyticsDataOrigin, contentSecurityPolicy } from "@/lib/security-policy.mjs";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = contentSecurityPolicy({
    nonce, production: process.env.NODE_ENV === "production",
    dataOrigin: analyticsDataOrigin(process.env.NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL),
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!api(?:/|$)|_next/static|_next/image|.*\\.[^/]+$).*)"],
};
