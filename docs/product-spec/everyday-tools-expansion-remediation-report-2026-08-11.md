# Everyday Tools Expansion — Final Remediation and Audit Report

Date: 11 August 2026 (IST)

## Final outcome

The approved expansion scope is implemented and visible by default without replacing the existing page shell, tool routes, adapters or visual system.

- 48 pre-expansion tools remain covered.
- 28 approved everyday tools across WP-2, WP-3 and WP-4 are implemented.
- 6 separately governed WP-5 tools are implemented as visible beta tools.
- The public registry therefore contains 82 tool routes.
- Five demand-deferred catalogue proposals remain intentionally deferred and three realistic bill simulators remain intentionally excluded. These are product-scope decisions in the implementation plan, not unfinished approved work.

## Remediation completed

### Regulated and data-backed calculations

- Reclassified the bundled HSN/SAC content as **reference samples** so the interface does not imply complete tariff coverage.
- Added policy-specific review cadences and approved-host validation rather than applying one generic freshness period to every regulated tool.
- Corrected GST QRMP quarterly due-date handling, including the official 22nd/24th state groups and quarter-end validation.
- Corrected Income Tax WDV depreciation to apply the half-rate rule below 180 days instead of prorating every asset by days used.
- Corrected Maharashtra professional-tax monthly slabs, gender threshold and April-to-March annual total.
- Corrected MSME delayed-payment handling for the 15-day no-agreement limit, maximum 45-day written-agreement limit, three-times RBI bank-rate input and calendar-month rests.
- Added boundary fixtures for 179/180 days, professional-tax annual totals, GST QRMP groups and month-end MSME compounding.
- Reconciled the official source and formula registers with the actual UI and calculation behavior.

### Workplace documents and printable artifacts

- Purchase orders now support up to 25 independently editable line items.
- Menus now support multiple sections and multiple items without overwriting earlier entries.
- Browser previews and PDFs now render real Code 128 barcodes and QR images rather than textual placeholders.
- PDF export embeds Latin and Devanagari fonts, wraps mixed-script text, paginates long documents and adds continuation/page information.
- Implemented and verified A4, 58 mm thermal, 80 mm thermal, 4 × 6 label and A4 label-sheet output profiles.
- Kept every existing document generator on the existing document shell and preserved its original route and visual treatment.

### File, image and scanner utilities

- Moved merge/split work into a dedicated browser worker and added abort propagation, timeout termination and malformed/oversized-file validation.
- Added per-file removal and explicit cancellation/clearing controls to PDF processing.
- Image resize/compress now always re-encodes the selected image and truthfully reports metadata removal; output analytics records only an allowed format label.
- Camera scanning now runs continuously until a result, cancellation or error and releases timers, media tracks and video source state on cleanup.
- File inputs reset after removal so the same file can be selected again.

### Cross-tool workflows

- Discount -> GST transfers only the final discounted amount, requires an explicit source action and a second explicit destination import.
- Fuel -> Pricing transfers only the declared unit/trip cost with the same tab-only, expiring, consume-once boundary.
- Existing business-scenario handoffs are declared consistently in registry capabilities.
- No transfer uses query parameters, logs or analytics values.
- Volumetric -> COD is correctly omitted because the COD destination has no chargeable-weight field. The plan makes this handoff conditional on destination support and revalidation.

### Reliability, hydration and downloads

- Added hydration-ready form states to old and new calculator/document families used by browser journeys. Forms are inert until their React handlers are attached, preventing slow-hydration input from being replaced by defaults.
- Replaced internal full-page assignments with Next router navigation in document and handoff workflows.
- Made browser downloads more reliable by attaching the download anchor and delaying object-URL revocation until the browser has accepted the artifact.
- Replaced character-by-character integration setup with deterministic field events where the interaction speed was not the behavior under test.
- Raised browser assertion timeouts from 5 to 15 seconds for local PDF/QR generation under development compilation load; user-facing operations retain their own explicit timeouts and cancellation paths.
- The previously intermittent quotation workflow now passes in the complete Vitest aggregate and the selected mobile/desktop browser runs.

### Catalogue visibility and discovery

- All four implemented wave flags are present in the default fallback, so tools are visible and usable without environment configuration.
- An explicit environment flag list can still opt out of a wave; the regulated kill switch remains an emergency availability control.
- `reviewer.status = pending` remains honest governance metadata and does not hide or disable a personal-project tool.
- Search and directory pages use metadata-only discovery, capped result windows and URL-backed filters; calculation and document engines are not imported into the client discovery index.

## Verification evidence

| Gate              | Final result                                                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript        | PASS — `tsc --noEmit`                                                                                                                                                                                                                             |
| ESLint            | PASS — no errors or warnings                                                                                                                                                                                                                      |
| Vitest            | PASS — 42 files / 359 tests; one environment-dependent AI provider-contract test intentionally skipped                                                                                                                                            |
| Production build  | PASS — Next.js 16.3 compiled 116 static pages, including 82 tool routes                                                                                                                                                                           |
| Mobile browser    | PASS — `mobile-320`: 40 passed, 18 tests skipped because they are explicitly assigned to another reference viewport                                                                                                                               |
| Desktop browser   | PASS after remediation — initial `desktop-1440` run passed 50 and isolated two Phase 5 hydration failures; both affected tests pass after the shared hydration fix. Six tests are explicitly assigned to mobile or production-smoke environments. |
| Artifact coverage | PASS — non-empty PDFs, PDF page sizes, Unicode text, QR image presence and worker-based PDF merge are checked automatically                                                                                                                       |
| Whitespace/format | PASS after targeted Prettier formatting and `git diff --check`                                                                                                                                                                                    |

The owner explicitly limited the final browser audit to one mobile and one desktop viewport. The other seven configured viewports were not rerun after remediation.

## External acceptance checks

The following checks require physical devices or third-party rendering environments and cannot be proven by the automated workspace suite:

- live camera permission and focus behavior on representative phones;
- physical A4, label and 58/80 mm thermal-printer alignment, clipping and cutter margins;
- thermal-paper contrast and barcode/QR scanning from the printed output;
- email-signature rendering in the exact email clients the owner intends to support.

Automated fallbacks, artifact dimensions, machine-readable payloads and cleanup paths are covered. These external checks are deployment acceptance checks, not missing implementations. Any device-specific defect found during acceptance should be logged with device/browser/printer details and fixed before relying on that profile in day-to-day use.

## Remaining catalogue boundary

No approved WP-1 through WP-5 implementation item is known to be missing.

The following catalogue rows intentionally remain outside the completed scope:

- demand deferred: Maintenance Invoice, Social Post Generator, EBITDA Calculator, GST Margin Calculator and Salary Calculator;
- excluded for realistic-document misuse risk: Electricity Bill Simulator, Mobile Bill Simulator and Broadband Bill Simulator.

Promoting a deferred item requires a new product decision and its own acceptance criteria. Excluded realistic bill replicas must not be added under the current product contract.
