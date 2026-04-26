import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const requestCache = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 50; // 50 requests per minute

export function middleware(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';

  const now = Date.now();
  const record = requestCache.get(ip);

  if (record) {
    if (now - record.timestamp < RATE_LIMIT_WINDOW) {
      if (record.count >= MAX_REQUESTS) {
        return new NextResponse("Too Many Requests", { status: 429 });
      }
      record.count++;
    } else {
      // Reset window
      requestCache.set(ip, { count: 1, timestamp: now });
    }
  } else {
    requestCache.set(ip, { count: 1, timestamp: now });
  }

  // Set security headers while we're at it
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
  response.headers.set('X-RateLimit-Remaining', record ? Math.max(0, MAX_REQUESTS - record.count).toString() : (MAX_REQUESTS - 1).toString());
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
