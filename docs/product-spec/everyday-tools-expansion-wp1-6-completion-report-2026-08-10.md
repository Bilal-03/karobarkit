# Everyday Tools Expansion — WP-1.6 Completion Report

**Date:** 10 August 2026 (IST)
**Scope:** Runtime analytics allowlist hardening
**Baseline:** WP-1.5 capped directory and multi-token discovery

## Outcome

Analytics events now cross a small, explicit runtime boundary. The browser emitter accepts only generic, low-cardinality metadata, drops unknown keys by default, removes malformed values without discarding otherwise valid metadata, and ignores unsupported event names. Existing registry-level forbidden-property declarations remain available for documentation and release validation, while the runtime schema is independent of the registry and therefore cannot accidentally inherit calculator or document payloads.

No analytics transport, page structure, existing tool adapter, or result design was changed.

## Changes

- Updated `src/lib/analytics/index.ts`:
  - Added the strict `analyticsPayloadSchema` runtime schema.
  - Allowed only `toolId`, `category`, `format`, `pageSize` and `errorCodes`.
  - Added length, character, enum and array-size constraints for each field.
  - Kept the existing forbidden-property set as a defense-in-depth declaration.
  - Sanitizes each event before dispatching `karobarkit:analytics`; invalid known fields and all unknown fields are omitted.
  - Preserves the existing browser-only event seam and event-name allowlist.
- Updated `src/domain/registry/types.ts` and `src/domain/registry/shared.ts`:
  - Added `AnalyticsPolicy.allowedProperties`.
  - Documented the registry/runtime synchronization boundary with the same five generic fields.
- Updated `src/components/tooling/gst-calculator-form.tsx`:
  - Removed `policyVersion` from emitted metadata; the policy version remains visible in the GST result for user trust and auditability.
- Added tests in `tests/unit/privacy.test.ts` and `tests/unit/registry.test.ts`:
  - Representative calculator, tax, finance, document, QR, file, search and credential fields are proven not to transmit.
  - Unknown keys and malformed values are rejected while valid generic fields remain.
  - Every registered tool exposes the documented property allowlist.

## Runtime contract

| Property     | Accepted values                                             |
| ------------ | ----------------------------------------------------------- |
| `toolId`     | Lowercase kebab-case identifier, 1–120 characters           |
| `category`   | Lowercase kebab-case identifier, 1–80 characters            |
| `format`     | `pdf`, `png`, `svg` or `csv`                                |
| `pageSize`   | Approved A4, summary, QR, standee, thermal and label tokens |
| `errorCodes` | Up to 20 short alphanumeric/error-token strings             |

The allowlist is intentionally generic. Raw calculator inputs, generated document content, URLs, names, contact details, uploaded file data, QR/barcode values, passwords, search text and policy snapshots are outside the runtime contract.

## Verification

| Command                                                                                                                   | Result                       | Evidence                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                                                                                                    | PASS                         | All repository files match Prettier after the completion report was added.                                                                                                                          |
| `npm run typecheck`                                                                                                       | PASS                         | `tsc --noEmit` completed successfully.                                                                                                                                                              |
| `npm run lint`                                                                                                            | PASS with warnings           | Zero errors; the same six pre-existing document-form navigation warnings remain.                                                                                                                    |
| `npm test -- tests/unit/privacy.test.ts tests/unit/registry.test.ts tests/unit/discovery.test.ts tests/unit/seo.test.ts`  | PASS                         | 4 files, 42 tests passed.                                                                                                                                                                           |
| `npm run test:e2e -- tests/e2e/gst-calculator.spec.ts --project=desktop-1440 --grep "protects analytics" --timeout=60000` | PASS                         | GST custom values were absent from emitted analytics events.                                                                                                                                        |
| `npm run build`                                                                                                           | PASS                         | Next.js 16.3 production build completed and generated 82 routes.                                                                                                                                    |
| `npm test`                                                                                                                | PASS after final remediation | The final aggregate passes 42 files / 359 tests with one environment-dependent provider-contract skip. The historical document-workflow timeouts were eliminated; see the final remediation report. |
| `git diff --check`                                                                                                        | PASS                         | No whitespace errors.                                                                                                                                                                               |

The full-suite timeout failures are unchanged baseline behavior in `tests/integration/document-workflow-wave.test.tsx` (quotation, business-card and commercial-invoice preview journeys); they do not exercise the analytics boundary and require a separate timeout-stability follow-up before treating the global suite as green.

## Next gate

WP-1.6 is implemented and ready for the WP-1 exit review. After the platform gate is accepted, the next planned milestone is WP-2 Everyday Utilities (`everyday-utilities-wave`), beginning with the local percentage, discount, fuel, volumetric-weight, business-days and area-conversion foundations.
