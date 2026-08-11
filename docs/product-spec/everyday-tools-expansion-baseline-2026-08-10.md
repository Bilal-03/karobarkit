# Everyday Tools Expansion — WP-0 Baseline

**Date:** 10 August 2026 (IST)
**Baseline commit:** `bdb2d0adff7718b87aaa71e7096bd5c787cdd204`
**Branch:** `main`
**Scope:** Before the WP-1 metadata-only discovery refactor

## Repository state

The working tree was clean with respect to application code before this expansion. The implementation plan and its product-spec index entry are intentional documentation changes in the working tree:

- `docs/product-spec/everyday-tools-expansion-implementation-plan.md`
- `docs/product-spec/README.md`

No new end-user tool route is present in this baseline.

## Verification results

| Command                | Result                 | Notes                                                                                                                                                                                           |
| ---------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check` | PASS                   | All files passed Prettier validation.                                                                                                                                                           |
| `npm run lint`         | PASS with warnings     | Six pre-existing `window.location.href` warnings in document workflow components; zero errors.                                                                                                  |
| `npm run typecheck`    | PASS                   | `tsc --noEmit` completed successfully.                                                                                                                                                          |
| `npm test`             | BASELINE KNOWN FAILURE | 30 files passed, 296 tests passed, 1 skipped; three existing document-workflow tests timed out at the default 5 seconds: quotation preview, business-card proof and commercial-invoice preview. |
| `npm run build`        | PASS                   | Next.js 16.3 production build completed and generated 78 static/dynamic routes.                                                                                                                 |
| `git diff --check`     | PASS                   | No whitespace errors.                                                                                                                                                                           |

## Known test timeouts

The full Vitest run timed out in `tests/integration/document-workflow-wave.test.tsx` at:

- quotation preview and estimate disclaimer
- business card proof
- commercial invoice and non-GST disclaimer

These failures occurred before the WP-1 source changes and are not caused by the metadata-only discovery work. They must either be fixed or explicitly re-baselined before a public tool wave is enabled; WP-1 must not weaken or hide them.

## WP-0 exit decision

WP-0 is complete enough to begin WP-1.1. The coding agent must preserve the three timeout findings in all subsequent reports and must rerun the affected focused integration spec after the discovery refactor to prove that the change did not alter document behavior.
