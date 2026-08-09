# Milestone 4 implementation status

Status: complete. Final quality checks passed on 6 August 2026.

This milestone adds the source-backed GST Calculator at `/tools/gst-calculator`, with an effective-dated policy bundle, official-source documentation, pure decimal-safe calculations, explicit supply-type choices, accessible result explanations and privacy-safe browser-only behavior.

## Policy boundary

- Active policy: `gst-general-rates-2025-09-22-v1`, effective 22 September 2025, last verified 6 August 2026.
- Visible current presets: 5% and 18% source-backed headline rates.
- Deliberately excluded: 40%, nil/exempt, 12% and 28% presets, classification, HSN/SAC, place of supply, CGST versus UTGST determination, reverse charge, ITC, returns, registration and tax advice.
- Policy data is controlled code with source references and a 180-day freshness warning. The browser does not scrape or replace policy data at runtime.

## Validation and calculation

- Positive finite INR amounts up to ₹999,999,999,999,999.99, with at most two decimal places.
- Custom rates from 0% to 100%, with at most two decimal places and an explicit warning.
- Exclusive and inclusive formulas use `decimal.js`; final currency values use half-up two-decimal rounding.
- Intra-state output splits displayed GST into CGST plus an SGST/UTGST remainder; inter-state output labels the full amount IGST; unspecified supply type shows total GST only.
- Rounding adjustments and limitations are visible in the result.

## Verification

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm test` — 11 files, 125 tests passed
- `npm run test:e2e` — 169 passed, 15 intentional skips across 320, 360, 390, 430, 768, 1024, 1280 and 1440 px projects
- `npm run build` — production build passed; 31 static pages generated

## Milestone 5 — GST Invoice Generator

Status: implementation complete for the invoice scope. Invoice-specific checks are green; the broad cross-suite browser run was intentionally interrupted after 152 passing tests at the user’s request, so run `npm run test:e2e` before committing if a full-suite sign-off is required.

The GST Invoice Generator at `/tools/gst-invoice-generator` reuses the existing GST calculation engine, effective-dated policy bundle, decimal parser, amount-to-words formatter, local logo processor, A4 document preview, PDF export and print preparation. It adds a pure invoice model, line-item editor, line-level discount arithmetic, rate grouping, tax reconciliation and in-memory-only draft handling.

The internal field matrix is recorded in [`docs/gst-invoice-field-matrix.md`](gst-invoice-field-matrix.md). The reviewed Rule 46 fields are surfaced with conditional wording; HSN/SAC is issuer-entered and warns when absent, while no classification or digit-count recommendation is attempted. Inter-State place of supply is required only when that workflow is explicitly selected. GSTIN checks are structural only.

Calculation order is: rounded gross line value → rounded line discount → rounded taxable value → existing `calculateGst` exclusive calculation → rounded tax components → line total → grouped and invoice totals. Invoice-level discounts, unmodelled additional charges, RCM computation, e-invoicing, IRN, filing and storage are excluded. Policy dates without a reviewed policy version are rejected.

Draft values stay in memory and refresh clears them. Invoice inputs, line values, GSTINs, notes, customer data and export content are excluded from analytics and logs. Export filenames contain only a sanitized invoice number and date. Browser PDF font loading has a Print → Save as PDF fallback.

## Milestone 6 — Discovery, information architecture and SEO

Status: implemented; final verification results are recorded in the completion handoff.

### Information architecture

The launch surface contains `/`, `/tools`, `/categories`, `/categories/[slug]`, `/search`, eight canonical `/tools/[slug]` routes, methodology and source pages, FAQ/about/contact pages, legal pages, an error-report workflow and custom not-found behavior. Phase 1 replaces the four launch categories with the approved eight-category Business Toolkit architecture. Four categories currently contain live tools; roadmap categories are visibly unavailable, noindex and contain no placeholder tool cards.

The tool registry remains the source of truth for names, slugs, categories, summaries, SEO, sources and relationships. It is now split into per-tool modules with a metadata-only index and owns tool type, UI adapter, primary/secondary categories, execution mode, lifecycle, feature flag, risk, owner, policy dependencies, reviewer status and trust metadata. The homepage featured section is an explicitly curated list ordered by launch priority; it does not claim usage-based popularity.

### Search and relationships

Search is local, dependency-free and deterministic. Queries are Unicode-normalized, lowercased, punctuation-normalized, whitespace-collapsed and capped at 80 characters. Ranking is exact name (100), exact synonym (90), name prefix (80), exact tag (70), exact category (60), partial discovery metadata (50), partial category (40), then description (20). Ties use launch priority and then alphabetical order. Registered synonyms cover GST/tax, invoices and bills, receipts, QR/UPI, ROI/return on investment, and CAGR/growth rate. Empty and zero-result states link back to the directory and categories.

Related tools are curated by registry ID, not inferred from category membership. Validation rejects missing, duplicate and self references. Tool pages link to their category, methodology, sources, related tools and the error-report workflow.

### SEO and content

Reusable metadata creates unique titles, descriptions, canonicals, Open Graph fields and Twitter cards. Search is `noindex,follow`, and query variants canonicalize to `/search`; arbitrary search results are excluded from the sitemap. The sitemap is registry-generated for tools and categories and includes the selected static production pages. `robots.txt` allows public crawling and declares the sitemap; it is not used as access control.

Visible content powers WebSite/SearchAction, WebApplication, BreadcrumbList and FAQPage JSON-LD. Tool pages use the existing shared how-to, formula/method, worked example, interpretation, limitations, edge cases, sources, FAQ, privacy, disclaimer and last-reviewed architecture. Methodology now explicitly documents rounding, independent examples, testing, privacy and the policy update process. Sources are derived from each tool’s registered references.

### Accessibility, analytics and performance

Discovery uses labelled native search/select controls, accessible result counts, a single interactive link per tool card, breadcrumb current-page semantics, visible focus, skip navigation, keyboard-operable FAQ disclosures, a mobile menu and responsive one-column states. The Playwright viewport matrix covers 320, 360, 390, 430, 768, 1024, 1280, 1440 and 1920 pixels. The directory and search import registry metadata only and add no search library or package.

The discovery analytics allowlist includes search, zero-result, category, featured-tool, related-tool and report-error event names. No analytics transport is configured, and raw search queries or form values are not sent. The directory now filters locally by category, type, execution mode and regulatory scope while the canonical catalogue route remains statically renderable. The error-report page prepares a copyable report locally and explicitly states that it does not submit anything; a delivery backend or published support address remains a launch-operations dependency.

### Audit notes and known limitations

The pre-implementation audit found eight active registry tools, four populated launch categories, the approved core routes, and a passing baseline production build. Existing canonical slugs intentionally differ from the benchmark inventory and no benchmark legacy aliases were added because this is an original product with no verified legacy traffic. The previous homepage said seven tools despite eight active entries; discovery is now registry-driven. The `/contact` form later gained the controlled server delivery described below. Search and directory filters use local deterministic metadata without a hosted index or search dependency.

## Milestone 7 — Production readiness

Status: conditional go for controlled launch preparation; see [`docs/launch/final-readiness-report.md`](launch/final-readiness-report.md).

The production-readiness pass recorded a clean baseline at commit `60bd76836b5e5f58d343fe895647d97da3b830ad`, reverified all deterministic calculation paths and current GST source URLs on 8 August 2026, and added a complete launch evidence set under `docs/launch/`. The reviewed GST policy date and tool/document review dates are now 8 August 2026.

The contact page now posts to a Vercel/Next Route Handler at `/api/contact`. The server validates the payload, ignores honeypot submissions, and sends plain-text delivery through Resend using server-only `RESEND_API_KEY`, `CONTACT_TO_EMAIL` and optional `CONTACT_FROM_EMAIL` variables; setup is documented in [`docs/contact-delivery.md`](contact-delivery.md). The error-report page remains a local copyable fallback. Security headers, URL/image/filename validation, safe logging and privacy boundaries were reviewed. No persistent browser storage, production analytics transport, external error-monitoring provider or production domain are configured; Phase 2 has only an explicit tab-only scenario handoff. Contact delivery still needs its Vercel credentials and a real test send.

Verification: 160 unit/integration tests passed; the Chromium responsive/accessibility matrix passed 226 tests with 34 intentional skips. One desktop-1280 letterhead download timeout in the long serial run passed on focused rerun. The production build generated 34 routes, including `/api/contact`, and `npm audit --omit=dev --audit-level=moderate` reported zero vulnerabilities. Safari, Firefox, Edge, physical devices, Lighthouse/Core Web Vitals, production domain redirects, contact credentials/test delivery, monitoring and rollback execution remain explicit pre-launch actions rather than unverified claims.

## Brand identity alignment

The current site shell follows the KarobarKit identity board: navy blue `#0D1B2A`, emerald teal `#0FA89A`, slate `#64748B`, saffron gold `#F6A623` and light gray `#F2F4F7`. Outfit is used for display headings and Plus Jakarta Sans for body copy. The supplied transparent badge and standalone PNG marks are used consistently in the header, footer, homepage hero and favicon; accessible darker shades are reserved for text and action contrast. The contact notification email and generated document accents use the same navy/teal system.

## Business Toolkit expansion — Phase 0

Status: complete on 9 August 2026 with downstream reviewer staffing gates.

The approved “Business Toolkit for India” plan now has an implementation-governance packet under `docs/product-spec/`. It freezes a 48-tool canonical catalogue, method/policy register, normalized source library, v2 execution contracts, risk and language rules, effective-dated change control, and five architecture decisions. Inventory validation found 48 unique tool IDs, 48 unique canonical slugs, 48 matching formula/policy entries, and no unresolved source IDs.

No application behavior or current route changed during Phase 0. New Tier D tax/payroll scope is blocked until named external CA and payroll/labour reviewers are recorded; legal-sensitive Phase 5 scenarios have the equivalent corporate/legal reviewer gate. These staffing dependencies do not block Phase 1 platform work or Phase 2 non-regulated business tools. See [`docs/product-spec/phase-0-completion-report.md`](product-spec/phase-0-completion-report.md).

## Business Toolkit expansion — Phase 1

Status: complete on 9 August 2026, with GST and GST Invoice external CA/tax review still explicitly pending.

KarobarKit is now positioned as **The Business Toolkit for India**. The application uses the eight approved categories, keeps all eight existing tool routes and results, and shows honest roadmap states without publishing planned tool pages. Homepage, category discovery, directory filters, global metadata, sitemap and structured data use the new architecture.

The runtime contract now covers six tool types, four execution modes, five lifecycle states, primary and secondary categories, feature flags, risk, ownership, review cadence, policy dependencies, reviewer status and a task-specific UI adapter. The former monolithic registry is split into per-tool modules and a metadata-only build index. GST now consumes a reusable effective-dated policy primitive.

Every live tool page exposes a trust record containing method, formula, sources, effective period, last verification date, review cadence, reviewer status, risk, data behavior, limitations and an error-report path. Tier D tools retain official sources and say “external review pending”; no unearned approval is claimed. See [`docs/product-spec/phase-1-completion-report.md`](product-spec/phase-1-completion-report.md).

## Business Toolkit expansion — Phase 2

Status: complete on 9 August 2026 as a lower-regulatory-risk beta wave; the existing GST and GST Invoice external review gates remain unchanged.

The public registry now contains ten beta business-economics tools: Margin, Markup, Break-even, Pricing, Cash Flow, Burn Rate, Runway, Marketplace Margin, ROAS and COD Cost. They share a decimal-safe validation/calculation engine, Indian currency/number formatting, local CSV export, print-friendly result summaries and the same trust record as the foundation tools. Marketplace, tax, advertising and COD rates are explicitly user-supplied estimates; no live vendor or statutory rate is inferred.

Each tool has an independent definition, formula, worked example, limitations, edge cases, FAQ, source record, risk tier, review cadence and privacy-safe analytics policy. The related-tool graph provides curated journeys, and an explicit tab-only scenario transfer can copy only matching fields after the user chooses to save and import. Values never enter URLs, analytics, logs or a backend, and are not saved by default.

Verification completed:

- `npm run format:check`, `npm run lint`, `npm run typecheck` and `git diff --check` passed.
- Serialized `npm test -- --maxWorkers=1`: 20 files and 191 tests passed.
- `npm run build`: production build passed and generated 48 pages, including all 18 published tool routes.
- Focused Playwright check on `desktop-1440`: 2 Phase 2 journeys passed (calculation/CSV and explicit scenario handoff).
- Mobile/desktop layout matrix was not rerun, per the user’s request to skip non-functional responsive repetition; existing responsive CSS and keyboard semantics remain in place.

The next authorized phase is Phase 4: India tax, payroll and compliance tools, beginning with the controlled HRA and GST transaction-date sub-wave.

## Business Toolkit expansion — Phase 3 finance foundation

Status: complete on 9 August 2026 for the beta scope; finance and document-language review gates remain external release dependencies.

The registry now includes five local-only finance tools: EMI, SIP, FD, XIRR and Loan Comparison. They share a decimal-safe engine, bounded validation, Indian formatting, print summaries and CSV export. EMI includes a complete amortization schedule and an explicitly labelled user-entered rate-reset scenario. SIP distinguishes end-of-month and beginning-of-month contributions and uses no-guarantee language. FD requires a declared compounding frequency and excludes bank-specific tax or premature-closure rules. XIRR accepts dated cash-flow lines, requires both signs and reports no-solution or non-convergence errors. Loan Comparison compares two neutral user-entered scenarios without lender scraping or ranking.

The finance source records point to the controlled finance methodology, SEBI’s official SIP calculator reference and RBI’s official EMI reset FAQ. No current rate, tax treatment or product term is hardcoded into the calculations. Finance input names are excluded from both the registry analytics policy and the runtime event sanitizer.

Finance foundation verification:

- Unit and integration fixtures cover EMI reconciliation, zero-rate and reset scenarios, SIP timing, FD compounding, leap-year and Microsoft XIRR fixtures, signed-return validation, solver boundary errors, loan comparisons and form behavior.
- `npm run format:check`, `npm run lint`, `npm run typecheck` and serialized `npm test -- --maxWorkers=1` passed (22 files, 213 tests).
- `npm run build` passed and generated 53 static pages, including all 23 published tool routes.
- Focused Playwright finance journey passed on `desktop-1440` (1 test: EMI result, amortization output, source link and CSV download). The previously requested responsive matrix is not being repeated.
- The finance foundation’s sub-wave exit gates are complete. The document workflow sub-wave and its remaining external language review are recorded below.

## Business Toolkit expansion — Phase 3 document workflow wave

Status: implementation complete on 9 August 2026 for the beta scope; external document-language review remains a release staffing gate.

The public registry now also includes local-only Invoice, Quotation, Business Card and Invoice Number generators. Invoice and Quotation use shared document identity, logo, style, Indian amount-to-words and decimal-safe line arithmetic, while deliberately excluding GST calculation and unsupported compliance claims. Business Card produces a local front/back proof sheet and PDF. Invoice Number formats a user-supplied prefix, financial year and padded sequence without claiming reservation or cross-device uniqueness.

Document output now shares the existing A4 preview and PDF/print path. Explicit, opt-in session-only handoffs are available for Quotation → Invoice, Quotation → GST Invoice, Invoice/GST Invoice → Payment Receipt and Invoice/GST Invoice → UPI QR. Handoffs copy only selected fields, never place values in URLs or analytics, require destination-side review and do not issue invoices, confirm settlement or verify UPI ownership automatically.

Verification completed for this wave:

- `npm run format:check`, `npm run lint` and `npm run typecheck` pass (lint has only the existing Next.js warning for full-page internal handoff navigation).
- Focused unit and integration fixtures cover invoice and quotation rounding/discount boundaries, invoice due-date ordering, business-card website safety, invoice-number sequence boundaries, preview rendering and privacy/disclaimer language.
- Serialized `npm test -- --maxWorkers=1` passes: 23 files and 224 tests.
- `npm run build` passes and generates 54 static routes (plus 2 dynamic routes), including all 27 published tool routes.
- Focused Playwright `desktop-1440` checks pass: quotation A4/PDF/print plus Quote → GST Invoice import, Business Card PDF plus Invoice Number preview, commercial Invoice PDF/print plus receipt handoff, and GST Invoice receipt/UPI handoffs (4 tests). The responsive matrix is intentionally not repeated.

Phase 3 implementation and built-app handoff checks are complete. The remaining release gate is final reviewer sign-off for document language and export behavior. No GST compliance, invoice issuance, payment settlement or QR ownership claim is made by this wave.

## Business Toolkit expansion — Phase 4 tax, payroll and compliance layer

Status: public controlled beta on 10 August 2026. Named CA/tax and payroll/labour reviewer approval and signed fixtures remain governance follow-ups; they do not block visibility for this personal project.

The five release blockers and two governance/test gaps identified in the Phase 4 review are corrected. HRA now uses the controlling Rule 2A city list (Mumbai, Kolkata, Delhi and Chennai), includes eligible turnover-based commission in its salary base, asks for rented accommodation and a stable fact pattern, and stops unsupported own-house/no-rent and changed-period claims. Its official source bundle records the 15 May 2026 ITR-4 publication date and validates HTTPS Government domains. GST rejects future transaction dates beyond the reviewed snapshot, evaluates freshness against the runtime date and disables invoice generation when the policy is stale.

All four Phase 4 sub-waves are implemented and public as a controlled beta: HRA/GST transaction-date refinement; Income Tax and TDS; Presumptive Tax and Corporate Tax; and CTC, In-hand Salary, PF and Gratuity. The eight new tax/payroll calculators are local-only, policy-scoped, Tier D, beta and reviewer-pending. They carry source dependencies, explicit eligibility lockouts, stale/source kill-switches, golden fixture IDs and analytics field exclusions. `phase4-tax-review` remains an explicit opt-out flag for deployments that need to hide them.

Verification evidence:

- `npm run format:check`, `npm run typecheck`, `npm run lint` and `git diff --check` pass. ESLint reports six pre-existing Next.js internal-navigation warnings and no errors.
- Serialized `npm test -- --maxWorkers=1 --no-file-parallelism` passes: 26 files and 249 tests. Negative cases cover future dates, stale policies, unsupported eligibility, Act transition, residency, threshold and payroll boundaries.
- `npm run build` passes: 66 static pages, including all 36 public tool route parameters. An explicit empty `NEXT_PUBLIC_TOOL_FEATURE_FLAGS` value can opt Phase 4 out of a deployment.
- Focused Playwright `desktop-1440` HRA smoke check passes. Mobile and multi-viewport layout matrices are intentionally not repeated per the user’s instruction.
- Public beta operation still requires clear reviewer-pending labels, signed golden fixtures, source-policy approval, stale/withdrawn kill-switch rehearsal and production-equivalent build evidence before any “reviewed” or “approved” claim is made.

See [`docs/product-spec/phase-4-completion-report.md`](product-spec/phase-4-completion-report.md) for the source links, scope, fixture coverage and activation checklist.
