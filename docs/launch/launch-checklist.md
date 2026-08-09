# Launch checklist

## Product and calculations

- [x] Eighteen published tools are registry-backed and discoverable (8 live foundation tools plus 10 Phase 2 beta tools).
- [x] No placeholder, fake popularity or debug route is exposed.
- [x] CAGR, ROI, GST and invoice calculations independently verified.
- [x] GST sources resolve and current presets are source-backed.
- [x] Rounding, tax splits, discounts and invoice reconciliation pass tests.

## UX and accessibility

- [x] Homepage, directory, search, categories, tools, methodology, sources, FAQ, legal pages and 404 smoke-tested.
- [x] Chromium mobile/desktop matrix passed with no serious/critical axe violations.
- [x] Keyboard labels, focus, errors, mobile menu and touch targets verified.
- [ ] Physical Safari, Firefox, Edge and screen-reader/200% zoom audit.

## Security and privacy

- [x] Security headers and upload/URL/filename validation reviewed.
- [x] Contact delivery route validates inputs, blocks honeypot submissions and avoids content logging.
- [x] No production dependency vulnerabilities reported.
- [x] Sensitive inputs excluded from analytics, URLs and safe logs; explicit scenario transfer is tab-only and opt-in.
- [ ] Production contact delivery and monitoring provider configured.

## SEO and deployment

- [x] Metadata, canonicals, sitemap, robots and structured data verified.
- [ ] Production domain, HTTPS redirects, canonical host and Search Console configured.
- [x] Reproducible lockfile build and CI quality gates exist.
- [ ] Hosting release/rollback and emergency tool-disable controls assigned.

Decision remains CONDITIONAL GO until unchecked deployment, contact, monitoring and non-Chromium items have owners.
