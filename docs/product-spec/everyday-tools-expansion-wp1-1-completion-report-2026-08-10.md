# Everyday Tools Expansion — WP-1.1 Completion Report

**Date:** 10 August 2026 (IST)
**Scope:** WP-0 baseline and WP-1.1 metadata-only discovery boundary
**Baseline commit:** `bdb2d0adff7718b87aaa71e7096bd5c787cdd204`
**Branch:** `main`

## Scope and exclusions

This milestone implements the first coding task in the active expansion plan. It does not add an end-user tool, new public route, new category, or visual redesign. Existing calculation engines, result renderers, document workflows, SEO contracts and canonical `/tools/{slug}` routes remain runtime-owned.

The machine-readable scope is recorded in [`everyday_tools_catalogue.csv`](./everyday_tools_catalogue.csv). It marks all 48 current tools as `covered`, the 28 approved WP-2 through WP-4 tools as `approved-new`, the six implemented WP-5 tools as `visible-beta`, deferred demand explicitly, and the realistic bill simulators as `excluded-misuse`. The WP-5 rows were promoted from the original `blocked-review` baseline after the owner’s personal-project visibility decision; their reviewer-pending metadata remains visible.

## Implemented boundary

### Serializable discovery contract

`ToolDiscoveryRecord` is defined in `src/domain/registry/types.ts`. It contains identity, slug, kind, capabilities, display labels, category metadata, search metadata, lifecycle/feature state, execution mode, directory risk/regulatory labels and the trust verification date. Runtime schemas, calculation functions, result renderers, sources, policy engines and React implementations are intentionally absent.

`toolDiscoveryIndex` is generated from the currently available definitions in `src/domain/registry/index.ts`. It clones array fields and is JSON-serializable. `toolMetadataIndex` remains as a compatibility alias during the migration. Existing definitions expose an empty capability list until WP-1.2 adds and verifies per-tool capability declarations.

### Consumer migration

The server parents for the homepage, search page, tools directory and not-found page pass the discovery index as serializable props. The client search/directory component and discovery helpers operate only on the supplied metadata records. Neither client discovery module imports `toolRegistry` or `allToolDefinitions`.

Full runtime invariants were moved to `validateToolRegistry()` in `src/domain/registry/index.ts`; `validateDiscoveryRegistry()` now validates only the serializable public records. Individual tool routes continue to use `getToolDefinitionBySlug()` for runtime behavior.

## Changed files

- `src/domain/registry/types.ts`
- `src/domain/registry/index.ts`
- `src/domain/discovery/index.ts`
- `src/components/search/live-tool-search.tsx`
- `src/app/page.tsx`
- `src/app/search/page.tsx`
- `src/app/tools/page.tsx`
- `src/components/layout/not-found-content.tsx`
- `tests/unit/registry.test.ts`
- `tests/unit/discovery.test.ts`
- `docs/product-spec/everyday_tools_catalogue.csv`
- `docs/product-spec/everyday-tools-expansion-baseline-2026-08-10.md`
- `docs/product-spec/README.md`

## Verification

| Command                                                                                       | Result                 | Evidence                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                                                                        | PASS                   | Run against the final WP-1.1 tree.                                                                                                            |
| `npm run typecheck`                                                                           | PASS                   | `tsc --noEmit` completed successfully.                                                                                                        |
| `npm test -- tests/unit/registry.test.ts tests/unit/discovery.test.ts tests/unit/seo.test.ts` | PASS                   | 3 files, 37 tests passed.                                                                                                                     |
| `npm run lint`                                                                                | PASS with warnings     | Zero errors; six pre-existing document-form `window.location.href` warnings remain.                                                           |
| `npm run build`                                                                               | PASS                   | Next.js 16.3 build completed and generated 78 static/dynamic routes.                                                                          |
| `npm test`                                                                                    | BASELINE KNOWN FAILURE | 30 files passed, 298 tests passed, 1 skipped; the same three 5-second timeouts remain in `tests/integration/document-workflow-wave.test.tsx`. |
| `git diff --check`                                                                            | PASS                   | No whitespace errors.                                                                                                                         |

The three full-suite timeouts are the quotation preview, business-card proof and commercial-invoice preview tests documented in the WP-0 report. No new timeout or discovery-related failure was introduced; the focused registry, discovery and SEO contract tests pass.

## Next gate

WP-1.1 is ready for review. Before adding WP-2 or WP-3 tools, complete WP-1.2 typed capability declarations and WP-1.3 renderer-family registration, then re-run the full quality suite and resolve or explicitly re-baseline the existing document-workflow timeouts. No wave feature flag has been enabled and no new public route has been created in this milestone.
