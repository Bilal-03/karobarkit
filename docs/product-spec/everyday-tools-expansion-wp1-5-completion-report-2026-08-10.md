# Everyday Tools Expansion — WP-1.5 Completion Report

**Date:** 10 August 2026 (IST)
**Scope:** Directory scaling, URL-backed filters and multi-token discovery
**Baseline:** WP-1.4 registry-driven category directory

## Outcome

The directory now scales to larger tool catalogues without rendering every match at once. It starts with 24 cards, exposes an accessible progressive reveal, announces the visible and total result counts, and resets the window whenever search or filters change. Filter state remains in the URL and browser back/forward restores the corresponding controls and result window.

## Changes

- Updated `src/components/search/live-tool-search.tsx`:
  - Added a 24-card initial window and 24-card reveal increment.
  - Added a keyboard-accessible `Show more tools` button with `aria-controls`.
  - Added polite, atomic live count announcements such as `Showing 24 of 48 matching tools`.
  - Reset visible results on query edits, filter edits and `popstate` navigation.
  - Uses `replaceState` for query typing to avoid history spam and `pushState` for filter changes/explicit submits.
  - Keeps the existing result cards, filters, empty states and responsive layout intact.
- Updated `src/domain/discovery/index.ts`:
  - Added deterministic multi-token intent scoring across names, synonyms, tags, categories and summaries.
  - Kept exact name, exact synonym, prefix, tag and category tiers ahead of multi-token fallback matches.
  - Continued accepting only serializable discovery metadata; no hosted search dependency was added.
- Added coverage in `tests/integration/directory-search.test.tsx`, `tests/unit/discovery.test.ts` and `tests/e2e/foundation.spec.ts` for pagination, live counts, reset behavior, multi-token ranking and filter history.
- No CSS redesign was required; existing `.tool-grid`, `.inline-actions`, button and responsive rules provide the required presentation.

## URL and accessibility behavior

- Valid directory parameters remain `q`, `category`, `type`, `execution` and `regulated`; unsupported values normalize to `all`.
- Existing unrelated query parameters and URL hashes are preserved while known directory parameters are updated.
- Browser `popstate` restores URL-backed controls and resets the visible window to 24.
- The result count is an `aria-live="polite"` atomic region. The reveal control is a native button and remains keyboard reachable.
- Search preview, search page and directory variants all respect the 24-card initial cap.

## Verification

| Command                                                                                                                                   | Result             | Evidence                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| `npm run format:check`                                                                                                                    | PASS               | All repository files match Prettier.                                             |
| `npm run typecheck`                                                                                                                       | PASS               | `tsc --noEmit` completed successfully.                                           |
| `npm test -- tests/unit/discovery.test.ts tests/integration/directory-search.test.tsx tests/unit/seo.test.ts tests/unit/registry.test.ts` | PASS               | 4 files, 42 tests passed.                                                        |
| `npm run lint`                                                                                                                            | PASS with warnings | Zero errors; the same six pre-existing document-form navigation warnings remain. |
| `npm run build`                                                                                                                           | PASS               | Next.js 16.3 build completed and generated 82 routes.                            |
| `npm run test:e2e -- tests/e2e/foundation.spec.ts --project=desktop-1440 --grep "caps directory cards" --timeout=60000`                   | PASS               | Directory cap, reveal, filter URL, back navigation and reset journey passed.     |
| `npm test`                                                                                                                                | PASS               | 33 files passed, 309 tests passed, 1 skipped.                                    |
| `git diff --check`                                                                                                                        | PASS               | No whitespace errors.                                                            |

## Next gate

WP-1.5 is ready for review. The next planned milestone is WP-1.6 analytics allowlist hardening: enforce a small runtime-safe event payload schema, reject unknown properties by default, and prove that representative sensitive fields never reach analytics.
