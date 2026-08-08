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

The launch surface contains `/`, `/tools`, `/categories`, `/categories/[slug]`, `/search`, eight canonical `/tools/[slug]` routes, methodology and source pages, FAQ/about/contact pages, legal pages, an error-report workflow and custom not-found behavior. The four normalized categories are Financial calculations, Billing & taxes, Business documents, and Marketing & QR codes. No placeholder category or new tool was added.

The tool registry remains the source of truth for names, slugs, categories, summaries, SEO, sources and relationships. It now also owns short names, tags, synonyms, featured status, launch priority, regulatory status and the local-only privacy classification. The homepage featured section is an explicitly curated list ordered by launch priority; it does not claim usage-based popularity.

### Search and relationships

Search is local, dependency-free and deterministic. Queries are Unicode-normalized, lowercased, punctuation-normalized, whitespace-collapsed and capped at 80 characters. Ranking is exact name (100), exact synonym (90), name prefix (80), exact tag (70), exact category (60), partial discovery metadata (50), partial category (40), then description (20). Ties use launch priority and then alphabetical order. Registered synonyms cover GST/tax, invoices and bills, receipts, QR/UPI, ROI/return on investment, and CAGR/growth rate. Empty and zero-result states link back to the directory and categories.

Related tools are curated by registry ID, not inferred from category membership. Validation rejects missing, duplicate and self references. Tool pages link to their category, methodology, sources, related tools and the error-report workflow.

### SEO and content

Reusable metadata creates unique titles, descriptions, canonicals, Open Graph fields and Twitter cards. Search is `noindex,follow`, and query variants canonicalize to `/search`; arbitrary search results are excluded from the sitemap. The sitemap is registry-generated for tools and categories and includes the selected static production pages. `robots.txt` allows public crawling and declares the sitemap; it is not used as access control.

Visible content powers WebSite/SearchAction, WebApplication, BreadcrumbList and FAQPage JSON-LD. Tool pages use the existing shared how-to, formula/method, worked example, interpretation, limitations, edge cases, sources, FAQ, privacy, disclaimer and last-reviewed architecture. Methodology now explicitly documents rounding, independent examples, testing, privacy and the policy update process. Sources are derived from each tool’s registered references.

### Accessibility, analytics and performance

Discovery uses labelled native search/select controls, accessible result counts, a single interactive link per tool card, breadcrumb current-page semantics, visible focus, skip navigation, keyboard-operable FAQ disclosures, a mobile menu and responsive one-column states. The Playwright viewport matrix covers 320, 360, 390, 430, 768, 1024, 1280, 1440 and 1920 pixels. The directory and search import registry metadata only and add no search library or package.

The discovery analytics allowlist includes search, zero-result, category, featured-tool, related-tool and report-error event names. No analytics transport is configured, and raw search queries or form values are not sent. The error-report page prepares a copyable report locally and explicitly states that it does not submit anything; a delivery backend or published support address remains a launch-operations dependency.

### Audit notes and known limitations

The pre-implementation audit found a clean worktree, eight active registry tools, four populated categories, the approved core routes, and a passing baseline production build. Existing canonical slugs intentionally differ from the benchmark inventory and no benchmark legacy aliases were added because this is an original product with no verified legacy traffic. The previous homepage said seven tools despite eight active entries; discovery is now registry-driven. The existing `/contact` form still has no submission backend and should be connected or converted to an equally explicit fallback before public launch. Search uses a normal GET navigation rather than instant client-side filtering, which keeps the bundle small and remains keyboard accessible.
