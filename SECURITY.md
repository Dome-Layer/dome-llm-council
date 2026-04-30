# Security Policy

## Reporting a vulnerability

Do not open a GitHub issue for security vulnerabilities.

Email **security@domelayer.com** with:
- A description of the issue
- Steps to reproduce
- Potential impact

You will receive an acknowledgement within 48 hours and a status update within 7 days.

## Scope

This repository covers the LLM Council tool. For vulnerabilities affecting the broader
Dome platform or shared authentication infrastructure, use the same address.

## Known design decisions

- The cross-subdomain SSO token (`dome_auth_token`) is stored in a non-HttpOnly cookie by design.
  JavaScript on `*.domelayer.com` subdomains must read it to build the `Authorization` header
  sent to each tool's backend. The cookie is `SameSite=Lax; Secure` in production.

## Contact

- Security & bug reports: security@domelayer.com
- Privacy, GDPR, Terms & Conditions: privacy@domelayer.com
- General enquiries: hello@domelayer.com

## Known security limitations being remediated

Per the Dome Portfolio Audit (2026-04), the following items are scheduled for the next P0 sprint and are documented for transparency:

- Rate limiting on `/deliberate` (currently absent — 7-call burn vector)
- Security-headers middleware (HSTS / X-Frame-Options / Referrer-Policy missing)
- Wildcard CORS methods/headers (currently `["*"]`)
- Structured logging (currently uses stdlib `logging.basicConfig` instead of the portfolio-standard structlog JSON)
- Rule-ID definitions for `R-COUNCIL-01/02/03` (currently emitted but not documented)
- Replacement of regex confidence parsing with structured-output (Anthropic tool-use) to remove the `0.50` fallback distortion

If you are reporting a finding in any of the above categories, please reference this list — those are known items, not new bugs.

## Secrets handling

This repo follows the Dome portfolio standard:

- Real secrets live in Railway environment variables, never in the repo.
- `.env.example` is committed; any `.env*` file with real values is local-only and gitignored.
- Secrets are rotated when there is any suspicion of exposure, on contractor offboarding, and at least annually.

### Secrets inventory

| Variable | Where used | Sensitivity |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude council member + (default) synthesizer | **Secret — high impact** |
| `GOOGLE_AI_API_KEY` | Gemini council member | **Secret — high impact** |
| `OPENAI_API_KEY` | GPT-4o council member | **Secret — high impact** |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend DB writes (bypasses RLS) + JWT verification | **Secret — critical impact** |
| `SUPABASE_URL` | Backend | Public |
| `SYNTHESIZER_MODEL` | Backend config | Public (config, not secret) |
| `NEXT_PUBLIC_API_URL` | Frontend build | Public |

### Rotation log

| Date | Reason | Notes |
|------|--------|-------|
| 2026-04 | Pre-publication audit — repo made public | Keys rotated as part of pre-publication hardening |
