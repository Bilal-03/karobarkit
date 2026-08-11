# Everyday Tools Expansion — WP-2 Completion Report

**Date:** 10 August 2026 (IST)
**Scope:** Everyday Utilities wave — nine local-first tools behind `everyday-utilities-wave`
**Baseline:** WP-1.6 analytics allowlist hardening

## Outcome

The first everyday-tools wave is implemented without changing the existing page shell or calculator adapters. Nine approved tools are part of the canonical registry, metadata-only discovery index and typed renderer registry. At the time of the milestone capture they were flag-off; the 11 August personal-project visibility decision now includes `everyday-utilities-wave` in the default fallback, so they are visible in the directory, categories and sitemap unless explicitly opted out.

All calculations run locally. Raw numbers, text, passwords and task values are not placed in URLs, analytics properties or logs. The existing business, finance, tax, document and QR tools remain on their original adapters and layouts.

## Tools delivered

| Tool                         | Adapter              | Primary category   | Core boundary                                                                       |
| ---------------------------- | -------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| Percentage Calculator        | `utility-calculator` | Everyday Utilities | Three explicit percentage modes with decimal-safe arithmetic                        |
| Discount Calculator          | `utility-calculator` | Everyday Utilities | One or two successive discounts; GST is never silently added                        |
| Area Converter               | `utility-calculator` | Everyday Utilities | Standard units plus explicit region-required bigha/katha definitions                |
| Business Days Calculator     | `utility-calculator` | Everyday Utilities | UTC date iteration, boundary controls, weekends and versioned holidays              |
| Fuel Expense Calculator      | `utility-calculator` | Retail & Logistics | User-entered fuel price, metric/imperial normalization and optional declared markup |
| Volumetric Weight Calculator | `utility-calculator` | Retail & Logistics | Visible user-entered divisor and actual-versus-dimensional comparison               |
| Word and Character Counter   | `text-utility`       | Everyday Utilities | Unicode-aware local counts with no text persistence                                 |
| Password Toolkit             | `text-utility`       | Everyday Utilities | Web Crypto generation or local strength estimate; no auto-copy or saving            |
| To-do Checklist              | `todo-checklist`     | Everyday Utilities | Memory-first tasks with priority, progress, print and explicit CSV export           |

## Implementation

- Added isolated domain engines under `src/domain/calculations/utilities/` for percentage, discount, area, business days, fuel and volumetric weight.
- Added local-only helpers under `src/domain/utilities/` for Unicode text counting, Web Crypto password generation/assessment and checklist progress.
- Added nine registry definitions in `src/domain/registry/tools/everyday-utilities.ts` with formula, worked example, limitations, FAQ, privacy, review and feature-flag metadata.
- Extended `ToolUiAdapter` and the typed lazy renderer registry in `src/domain/registry/types.ts` and `src/components/tooling/tool-renderers.tsx`.
- Added `utility-calculator-form.tsx`, `text-utility-form.tsx` and `todo-checklist-form.tsx`; they reuse the existing calculator layout, form fields, result panels and privacy blocks.
- Added a lightweight local PDF export for checklists through `src/lib/documents/checklist-pdf.ts`; CSV and A4 print remain explicit user-triggered actions.
- Added a hydration-ready marker to new client forms so E2E interactions begin only after event handlers are attached; this does not alter the visible layout.
- Added small checklist and long-password presentation styles to `src/styles/globals.css` without redesigning existing components.

## Feature-flag behavior

- Flag: `everyday-utilities-wave`.
- Current default state: visible beta because `everyday-utilities-wave` is in the fallback flag set in `src/domain/registry/feature-flags.ts`; an explicit `NEXT_PUBLIC_TOOL_FEATURE_FLAGS` value can opt out.
- With the flag disabled, the existing 48-tool registry remains unchanged, the four expansion categories remain roadmap-only, and the sitemap excludes the new tools.
- With the flag enabled, the registry exposes seven Everyday Utilities tools and two Retail & Logistics tools; search and category pages use the same metadata-only discovery boundary.

## Verification

| Command                                                                                                                                                                             | Result                       | Evidence                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                                                                                                                                                              | PASS                         | All repository files match Prettier.                                                                                                                                                                |
| `git diff --check`                                                                                                                                                                  | PASS                         | No whitespace errors.                                                                                                                                                                               |
| `npm run typecheck`                                                                                                                                                                 | PASS                         | `tsc --noEmit` completed successfully.                                                                                                                                                              |
| `npm run lint`                                                                                                                                                                      | PASS with warnings           | Zero errors; six pre-existing document-form navigation warnings remain.                                                                                                                             |
| Focused utility unit/integration suite                                                                                                                                              | PASS                         | 4 files, 15 tests passed, including decimal, reciprocity, date, imperial, Unicode, Web Crypto and checklist fixtures.                                                                               |
| `NEXT_PUBLIC_TOOL_FEATURE_FLAGS="...,everyday-utilities-wave" npm run test:e2e -- tests/e2e/everyday-utilities.spec.ts --project=desktop-1440 --project=mobile-390 --timeout=60000` | PASS                         | Flag-enabled category discovery, desktop percentage journey, mobile word counter and checklist journey passed; one viewport-specific test was skipped by design.                                    |
| `npm run build`                                                                                                                                                                     | PASS                         | Next.js 16.3 production build compiled, generated 91 static pages/routes, and included the nine flag-gated tool routes.                                                                             |
| `npm test`                                                                                                                                                                          | PASS after final remediation | The final aggregate passes 42 files / 359 tests with one environment-dependent provider-contract skip. The historical document-workflow timeouts were eliminated; see the final remediation report. |

## Cross-tool handoffs (completed during final remediation)

- Discount -> GST transfers only the final discounted amount after the user selects **Use in GST Calculator**. The GST page displays a pending-import banner and requires a second **Import final price** action before changing its taxable-value field.
- Fuel -> Pricing transfers only the declared trip/customer unit cost after the user selects **Use in Pricing Calculator**. The destination requires an explicit import and revalidates the value with its own schema.
- Transfers are tab-scoped, expire, are consumed once, do not place values in URLs and never emit the transferred value to analytics.
- Volumetric -> COD remains correctly unavailable because the current COD Cost Calculator has no chargeable-weight input. The implementation plan explicitly makes that handoff conditional on destination support; inventing an unmapped field would violate destination revalidation.

## Next gate

WP-2 is complete. Later work packages and the final remediation audit are recorded from `docs/product-spec/README.md`.
