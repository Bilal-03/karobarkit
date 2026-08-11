# Everyday tools expansion — WP-4 completion report

Date: 11 August 2026 (IST)

WP-4 adds the Retail, Documents and Workplace Operations wave behind the `retail-workplace-wave` feature flag. Existing business-document adapters and document designs remain unchanged; the new profiles use a separate workplace document model and renderer branch. The wave is visible by default for this personal project; an explicit `NEXT_PUBLIC_TOOL_FEATURE_FLAGS` value can opt out without removing routes.

## Delivered scope

- Added nine catalogue-aligned tools: Price Tag, Delivery Challan, Shipping Label, Purchase Order, Menu, Wage Slip, Rent Receipt, Notice Period and Leave Balance.
- Added `src/domain/documents/workplace.ts` with shared input schemas, deterministic Decimal.js arithmetic, safe URL validation, page-profile contracts, status labels and explicit draft/template/declared-result boundaries.
- Added `src/domain/registry/tools/retail-workplace.ts` and registered all tools with category metadata, capability declarations, sources, limitations, FAQs, local-only execution and the `retail-workplace-wave` flag.
- Added shared workplace preview and PDF export profile support for A4, 58 mm thermal, 80 mm thermal, 4 × 6 shipping labels and A4 multi-label sheets. Price tags render an 8-up A4 sheet in the label-sheet profile.
- Added code-split `WorkplaceDocumentForm` and `WorkplaceCalculatorForm` renderers. The pre-existing email-signature and review-request business-document variants still route to `SharingFileUtilityForm`.
- Added print-safe CSS with responsive wrapping, metadata tables, long-text handling and profile-specific print dimensions.
- Added unit, integration and feature-flagged Playwright coverage.

## Guardrails

All outputs are labelled as drafts, templates, declared receipts or prepared purchase orders. The wave does not claim legal-metrology compliance, e-way-bill filing or validation, carrier issuance or acceptance, live menu hosting, statutory payroll, HRA eligibility, payment proof, contractual entitlement, filing, settlement, IRN or e-signature. No seals, carrier marks, bank logos or government marks are generated. Analytics receives only tool-level event metadata and never document fields, amounts, addresses or URLs.

## Verification

- `npm run typecheck` — pass.
- `npm run lint` — pass; existing document-form warnings remain unchanged.
- `npm run format:check` — pass.
- `git diff --check` — pass.
- Focused WP-4 tests — 21 tests passed (8 unit, 3 integration, 10 registry/contract tests including the new count and flag assertions).
- `npm run build` — pass; 110 static pages generated with all definitions present for flag-gated route contracts.
- Flag-enabled Playwright run for `tests/e2e/retail-workplace.spec.ts` on desktop-1440 and mobile-390 — 4 passed, 2 viewport skips.
- Full `npm test` — 38 files passed, 338 tests passed, 1 skipped; five pre-existing timeouts remain in the quotation, business-card, commercial-invoice and two GST-invoice integration cases from the baseline.

## Release state

The wave remains a visible beta. Complete visual print checks for every profile using representative long names, addresses, item descriptions, non-Latin text and thermal-printer settings before treating the outputs as authoritative; use `NEXT_PUBLIC_TOOL_FEATURE_FLAGS` for an explicit rollback if needed.
