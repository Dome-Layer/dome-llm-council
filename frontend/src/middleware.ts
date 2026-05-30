import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Per-request nonce-based Content-Security-Policy.
//
// Replaces the static `script-src 'unsafe-inline'` that used to live in
// vercel.json. With a per-request nonce, an injected inline script cannot
// execute — so the CSP is a real XSS backstop for the JS-readable
// cross-subdomain SSO session token (see SECURITY.md).
//
// Next.js reads the nonce from the request's Content-Security-Policy header and
// applies it to its own bootstrap/hydration scripts automatically; our inline
// theme script in app/layout.tsx reads it from the `x-nonce` request header.
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://kuurkyfenexakxahxczn.supabase.co https://kzzljogzlpzzrdyjaqtw.supabase.co https://*.up.railway.app https://*.ingest.de.sentry.io",
    "frame-ancestors 'none'",
  ].join('; ')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    // Run on everything except Next static assets, which don't execute scripts.
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|favicon.png|favicon-64.png|apple-touch-icon.png).*)',
  ],
}
