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
