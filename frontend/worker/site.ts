/**
 * What is specific to LLM Council. The rest of worker/ is the shared tool Worker
 * (dome-docs/templates/tool-worker, Sprint H phase 2), copied unchanged into each tool.
 */

/** The Content-Security-Policy, except script-src, which index.ts adds with the per-request nonce. */
export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://kuurkyfenexakxahxczn.supabase.co https://kzzljogzlpzzrdyjaqtw.supabase.co https://*.up.railway.app https://*.ingest.de.sentry.io",
  "frame-ancestors 'none'",
]

/** Headers on every response (they were in vercel.json). */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

/**
 * Dynamic routes, served from one prebuilt page each: a request for `prefix + <id>` gets `shell`,
 * and the page reads the id from the URL in the browser. LLM Council has none.
 */
export const SHELL_ROUTES: { prefix: string; shell: string }[] = []
