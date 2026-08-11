# Everyday Tools Expansion — WP-1.2 and WP-1.3 Completion Report

**Date:** 10 August 2026 (IST)
**Scope:** Typed capabilities and renderer registry
**Baseline:** WP-1.1 metadata-only discovery boundary on `main`

## Scope and exclusions

This milestone completes the next platform slice without adding an end-user tool, public route, category or feature-flagged wave. The visible `ToolPage` shell, trust content, explanatory sections, canonical routes and existing form behavior are preserved.

## WP-1.2 — Typed capabilities

- `ToolCapability` is now a closed union in `src/domain/registry/types.ts` covering conversion, camera/file/image/PDF processing, QR/barcode output, downloads, print profiles, handoffs and data-flow declarations.
- `ToolDefinition.capabilities` is required. `liveLocalMetadata()` supplies an explicit empty list for tools with no declared capability, so every runtime definition has a typed declaration.
- Existing tools now declare capabilities where their current interaction supports them: QR output/PNG/print, A4 PDF/print documents, CSV scenario exports, A4 tax print, bundled marketplace data and network-backed AI data.
- Registry validation rejects duplicate capabilities and catches capability/execution-mode mismatches for bundled and network data.
- The discovery index carries the same capability list as immutable serializable metadata. No capability bypasses risk, privacy, lifecycle or feature-flag checks.

## WP-1.3 — Typed renderer registry

- The large adapter switch was removed from `src/components/tooling/tool-page.tsx`. The page now owns only the server-rendered shell and projects a small serializable interaction payload.
- `src/components/tooling/tool-renderers.tsx` owns the typed adapter registry. Every current adapter has one renderer entry, including an explicit unavailable state.
- Existing forms remain responsible only for their interaction area. Their props are unchanged, so calculations, document previews, exports, analytics policy and trust copy remain intact.
- Forms are loaded through `next/dynamic` inside a Client Component boundary. Calculator, QR and document interaction code is kept out of the shell module and available as separate client bundles while preserving server-rendered page metadata and explanatory content.
- The registry is exhaustive at the type level and tested at runtime. Missing mappings fail the renderer contract test rather than producing an empty interaction area.

## Changed files

### Platform and registry

- `src/domain/registry/types.ts`
- `src/domain/registry/shared.ts`
- `src/domain/registry/index.ts`
- `src/domain/registry/tools/*.ts` (capability declarations for current QR, document, finance, tax, marketplace and AI tools)

### Tool page and renderer boundary

- `src/components/tooling/tool-page.tsx`
- `src/components/tooling/tool-types.ts`
- `src/components/tooling/tool-renderers.tsx`

### Tests and catalogue evidence

- `tests/unit/registry.test.ts`
- `tests/unit/renderer-registry.test.ts`
- `docs/product-spec/everyday_tools_catalogue.csv`
- `docs/product-spec/README.md`

## Verification

| Command                                                                                                                            | Result                 | Evidence                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                                                                                                             | PASS                   | All repository files match Prettier.                                                                     |
| `npm run typecheck`                                                                                                                | PASS                   | `tsc --noEmit` completed successfully.                                                                   |
| `npm test -- tests/unit/registry.test.ts tests/unit/discovery.test.ts tests/unit/renderer-registry.test.ts tests/unit/seo.test.ts` | PASS                   | 4 files, 40 tests passed.                                                                                |
| `npm run lint`                                                                                                                     | PASS with warnings     | Zero errors; the same six pre-existing document-form navigation warnings remain.                         |
| `npm run build`                                                                                                                    | PASS                   | Next.js 16.3 build completed and generated 78 static/dynamic routes.                                     |
| `npm test`                                                                                                                         | BASELINE KNOWN FAILURE | 31 files passed, 301 tests passed, 1 skipped; the same three 5-second document-workflow timeouts remain. |
| `npm run test:e2e -- tests/e2e/production-smoke.spec.ts --project=desktop-1440 --timeout=60000`                                    | PASS                   | 2 focused browser smoke journeys passed; the 60-second limit accommodates dev-server route warm-up.      |
| CSV schema check                                                                                                                   | PASS                   | 90 catalogue records, 14 columns per row, accepted kinds/waves/statuses.                                 |
| `git diff --check`                                                                                                                 | PASS                   | No whitespace errors.                                                                                    |

The full-suite timeouts remain in `tests/integration/document-workflow-wave.test.tsx` for quotation preview, business-card proof and commercial-invoice preview. They are unchanged from the previous baseline and are not renderer-registry failures.

## Next gate

WP-1.2 and WP-1.3 are ready for review. The next planned platform work is WP-1.4 dynamic category copy, followed by directory scaling and analytics allowlist hardening. New everyday tools remain disabled and unimplemented until those platform gates are complete.
