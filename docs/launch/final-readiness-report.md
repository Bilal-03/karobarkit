# Final readiness report

Date: 8 August 2026

## Decision

**CONDITIONAL GO** for a controlled production launch. No P0 calculation, privacy, security, build or accessibility defect was found. Public launch still requires explicit operational setup for the production domain, Resend contact delivery credentials, external monitoring, rollback ownership and non-Chromium/device verification.

## Evidence

- Unit/integration: 160 passed.
- Chromium E2E/accessibility/responsive: 226 passed, 34 intentional skips across all nine required viewport sizes. One desktop-1280 letterhead download timeout in the long serial run passed on focused rerun.
- Production build: passed; 34 routes generated, including `/api/contact`.
- Production dependency audit: 0 vulnerabilities.
- GST source URL checks: all five current official URLs returned HTTP 200 on 8 August 2026.
- Calculation, invoice, QR and document evidence: see sibling launch reports.

## P0/P1

- P0: none identified.
- P1: production domain/canonical host is not configured; the contact delivery route is implemented but Resend credentials and a recipient are not configured; external error monitoring and rollback ownership are not configured; Safari/Firefox/Edge and physical-device verification remain untested.

## P2/P3

- P2: migrate CSP inline allowances to nonce/hash strategy where compatible; measure Lighthouse/field Core Web Vitals; add non-Chromium and screen-reader coverage.
- P3: future operational analytics/monitoring integration and richer support workflow, only after privacy review.

## Required actions before public launch

1. Set and verify the production `NEXT_PUBLIC_SITE_URL` and canonical host/HTTPS redirects.
2. Add `RESEND_API_KEY` and `CONTACT_TO_EMAIL` in Vercel Production, then send a real test message; the error-report flow remains local-only until separately connected.
3. Assign monitoring and rollback owners; test a deployment rollback.
4. Run Safari, Firefox, Edge, iOS Safari and Android Chrome verification.
5. Run Lighthouse/slow-4G measurements and record the results.
