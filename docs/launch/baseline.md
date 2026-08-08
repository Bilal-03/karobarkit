# Production-readiness baseline

Recorded 8 August 2026 before Milestone 7 changes.

## Repository and configuration

- Commit: `60bd76836b5e5f58d343fe895647d97da3b830ad`
- Branch: `main` (clean worktree, tracking `origin/main`)
- Node requirement: `>=20.9.0`; local runtime used Node 20-compatible tooling.
- Framework: Next.js 16.3.0 App Router with Turbopack.
- Deployment target: not configured in this repository; no Vercel/Cloudflare adapter or production domain is committed.
- Environment: `.env.example` contains only `NEXT_PUBLIC_SITE_URL`; `.env` and `.env.local` are ignored.
- Analytics transport: none. The browser event seam is allowlisted and local only.
- Error monitoring provider: none configured.
- Existing security headers: CSP, HSTS, Referrer-Policy, Permissions-Policy, nosniff, frame protections and COOP in `next.config.mjs`.

## Automated baseline

- `npm test`: 15 files, 154 tests passed.
- `npm run build`: passed; 33 routes generated.
- `npm audit --omit=dev --audit-level=moderate`: 0 production vulnerabilities. The first sandboxed attempt could not reach the npm registry; the approved network retry succeeded.
- Prior committed browser baseline: `npm run test:e2e -- --workers=1` — 225 passed, 18 intentional skips across 320, 360, 390, 430, 768, 1024, 1280, 1440 and 1920 px.

## Build footprint

- `.next` directory after production build: approximately 725 MB including generated server/build artifacts and caches.
- Browser JavaScript chunks under `.next/static/chunks`: approximately 2.2 MB uncompressed.
- Largest observed browser chunk: approximately 1.15 MB uncompressed; this is primarily document/PDF-capable client code and requires route-level follow-up if performance data warrants it.

## Production-server timing smoke

Measured with `npm start` and local `curl` after the baseline build; these are local server timings, not Core Web Vitals:

| Route                          | Status |   TTFB |  Total | HTML bytes |
| ------------------------------ | -----: | -----: | -----: | ---------: |
| `/`                            |    200 | 292 ms | 292 ms |     41,967 |
| `/tools`                       |    200 | 431 ms | 433 ms |     28,578 |
| `/search`                      |    200 |  34 ms |  39 ms |     26,592 |
| `/tools/cagr-calculator`       |    200 |  19 ms |  19 ms |     39,574 |
| `/tools/gst-calculator`        |    200 |  10 ms |  10 ms |     56,572 |
| `/tools/gst-invoice-generator` |    200 |  12 ms |  12 ms |     72,802 |
| `/sitemap.xml`                 |    200 |  34 ms |  35 ms |      3,460 |
| `/robots.txt`                  |    200 |   9 ms |   9 ms |         67 |

## Baseline findings

- No failing automated check or known calculation mismatch was present.
- Full browser testing is Chromium-based in the repository; Safari, Firefox, Edge and physical devices were not tested in this environment.
- Lighthouse/Core Web Vitals were not available in the baseline environment.
- Contact delivery, external error monitoring, production domain, deployment provider and rollback release process were not configured.
