# Studio redesign

KarobarKit now uses a task-focused application shell rather than a sequence of reference-heavy pages.

## Product changes

- Collapsible desktop sidebar and accessible mobile drawer, with six task groups and a searchable command dialog.
- Saved light/dark themes, local fonts, SVG icons, restrained Motion/CSS transitions, and reduced-motion support.
- Explicit presentation definitions covering all 83 currently available tools. Primary controls, optional assumptions, and output settings are separate from calculation and policy metadata.
- Dedicated `/tools/[slug]/help` pages for instructions, sources, methods, FAQs, limitations, and review records. Old reference anchors forward to these guides.
- GST has three primary control groups and an optional tax split; EMI has three primary inputs, a months/years switch, optional fees/reset assumptions, and an accessible cost breakdown.
- Calculator examples require an explicit action. Advanced values remain in their owning form state; validation reveals the affected section.
- Documents use explicit three-step definitions and field-to-step mappings. Parties, document/items, and review replace fieldset-order inference. Long retail documents use the same step system; short labels stay on one screen.
- AI consent, review-before-export behavior, payment verification, policy gates, local file processing, and export engines are preserved. No new analytics or account requirements.

## Verification

- Production build, TypeScript, ESLint, and `git diff --check` passed.
- Full unit/integration run: **353 passed, 14 failed, 1 skipped**. All 14 failures are in the existing tax, HRA, and marketplace policy fixtures whose source reviews expired in September 2026. These safeguards were not weakened or re-dated.
- Studio discovery, theme persistence, keyboard search, reference forwarding, group filters, and axe accessibility checks passed at all nine configured viewport widths (320–1920px).
- Mobile and desktop EMI scenarios, retained advanced values, invoice editing/reset/PDF export, and light/dark reference screens passed. Navigation drawer, collapsed-sidebar Help menu, and keyboard focus restoration checks also passed.
- Sixteen reference PNGs cover Home, GST, EMI, and Invoice in both themes at 390px and 1280px. Captures also check horizontal overflow; reduced-motion/200% zoom reflow checks passed. A separate JavaScript-disabled test verifies that discovery cards are visible before hydration; entrance motion no longer hides server-rendered content.
- Browser checks caught and corrected mobile link names, visible-label/name consistency, and cramped action spacing. Integration checks caught and corrected the AI-form cleanup regression and retained its consent/export tests.

## Text audit

See `studio-text-audit.json`. Rendered main-content word counts exclude navigation/footer and include labels and results. The deployed website is the baseline; an exact snapshot of the intermediate local revision was not captured.

| Screen                         | Deployed baseline | Studio | Reduction |
| ------------------------------ | ----------------: | -----: | --------: |
| Home                           |               865 |    151 |     82.5% |
| GST, same ₹1,000 / 18% example |             1,239 |     50 |     96.0% |

## Manual validation still required

The five-participant usability study and hands-on assistive-technology validation require human participants. Automated accessibility checks do not establish complete WCAG conformance. Policy fixture failures require an independent source-review task before affected estimates can be relied on.
