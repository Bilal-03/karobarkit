# Everyday Tools Expansion — WP-5 Completion Report

Date: 11 August 2026 (IST)

## Scope delivered

All implemented expansion waves (WP-2 through WP-5, 34 tools) are visible and usable by default in this personal project. Their beta/reviewer labels, privacy boundaries and safety disclaimers remain visible. `NEXT_PUBLIC_TOOL_FEATURE_FLAGS` is an explicit opt-out for any wave, while `NEXT_PUBLIC_REGULATED_UTILITIES_KILL_SWITCH` provides an independent availability stop for WP-5.

WP-5 adds six controlled-beta records behind the distinct `regulated-utilities-wave` flag.

- HSN/SAC Reference Samples — bounded, versioned bundled search samples with a classification disclaimer; it does not claim to be a complete tariff finder.
- GST Filing Due-date Calendar — FY 2026–27 provisional reference dates with return and taxpayer cadence inputs.
- Depreciation Calculator — separate Companies Act/SLM and Income Tax/WDV modes, including the Income Tax 180-day half-rate boundary.
- Maharashtra Professional Tax Calculator — state-specific monthly and annual schedule with gender-aware thresholds.
- MSME Late-payment Interest Calculator — separate reference eligibility status and delayed-payment arithmetic.
- Currency Converter — manual rate by default, explicit dated ECB request, source/timestamp/rate-type retention, explicit not-cached state and stale/failure handling.

## Architecture and safety controls

- `src/domain/policies/regulated-utilities.ts` owns the wave flag, review cadence, fresh/stale/future/withdrawn/invalid states, approved official host allowlist and independent kill switch.
- `src/domain/calculations/regulated-utilities.ts` contains pure Decimal-safe engines, versioned result metadata, stable validation and no filing/eligibility/professional-advice claims.
- `src/lib/regulated/currency-rates.ts` is the only network quote boundary. It validates the ECB hostname, uses an abort timeout, and never silently reuses a previous network quote.
- `src/components/tooling/regulated-utility-form.tsx` is loaded through the existing typed renderer registry, preserving the page shell and existing adapters.
- `REGULATED_UTILITIES_GOLDEN_FIXTURE_MANIFEST` ties every base/stale governance fixture ID to one of the six tool definitions and is validated by the registry test.
- Source rows were added to `business_toolkit_source_library.csv`; formula and fixture references were added to `formula_source_register.csv`.
- Analytics continues to accept only generic metadata; regulated input names are explicitly forbidden from analytics policy lists.

## Verification completed

- TypeScript typecheck passes; the production build generated 116 static pages and 82 public tool routes.
- WP-5 calculation coverage includes GST QRMP 22nd/24th groups, Income Tax 179/180-day depreciation, Maharashtra monthly/annual professional tax and MSME calendar-month rests.
- Focused WP-5 unit, integration, registry, renderer and privacy tests pass.
- Default-environment Playwright coverage passes for category placement, desktop HSN search and mobile manual currency fallback; project-mismatched cases are skipped by design.
- The final remediation replaces internal full-page navigation with Next router navigation and removes the previous navigation warnings.
- The formerly intermittent quotation workflow test now uses deterministic field events, hydration-ready E2E markers and a realistic integration timeout. The final aggregate result is maintained in the remediation report.

## Release status

The six definitions remain `beta` with `reviewer.status = pending`; the catalogue labels them `visible-beta`. They are visible and usable in the default public `toolRegistry`. Pending reviewer metadata is an honesty/governance label, not an availability block. Results remain references or estimates rather than filing, classification, eligibility or professional-advice determinations.
