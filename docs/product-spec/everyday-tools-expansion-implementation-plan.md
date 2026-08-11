# KarobarKit Everyday Tools Expansion — Implementation Plan

**Status:** Ready for implementation planning and task execution
**Prepared:** 10 August 2026 (IST)
**Baseline:** 48 published tools, 8 categories, clean `main` branch
**Target:** Add 28 high-frequency local-first tools in three product waves, then 6 reviewed data/regulatory tools in a separately governed wave
**Primary constraint:** Preserve every existing tool, route, calculation, design pattern and workflow while expanding the catalogue

**Owner visibility decision (11 August 2026):** This is a personal project with no paid subscription or public-release gate. All implemented waves are therefore visible and usable by default in the catalogue. Beta labels, reviewer-pending metadata, source-freshness controls, privacy boundaries and the regulated kill switch remain part of the product contract; `NEXT_PUBLIC_TOOL_FEATURE_FLAGS` is an explicit opt-out, not a default-on requirement.

## 1. Purpose

This document is the execution plan for expanding KarobarKit beyond its current finance, tax, startup and business depth into practical day-to-day utilities inspired by the public catalogue at `https://www.indiabiztools.com`.

The reference is a product benchmark only. Do not copy its source code, wording, design, branding, assets, templates or route mistakes. All KarobarKit implementations must be original and must continue to satisfy the accepted contracts in:

- `docs/product-spec/tool-contract-v2.md`
- `docs/product-spec/phase-0-product-contract.md`
- `docs/product-spec/regulatory-change-control.md`
- `docs/product-spec/phase-0-architecture-decisions.md`

The old `Business_Toolkit_for_India_Implementation_Plan_2026-08-09.md` describes phases that are now substantially implemented. This document is the incremental plan for the next expansion and must be treated as the active scope for everyday utilities.

## 2. Non-negotiable outcomes

1. Preserve all 48 existing public tool slugs, calculations, results, exports, feature flags and related-tool journeys.
2. Preserve the existing KarobarKit design system and responsive layouts. New tools must look like native KarobarKit tools.
3. Use one canonical `/tools/{slug}` route per tool. Do not add reference-site legacy paths or aliases unless KarobarKit itself has verified traffic on an old route.
4. Keep local-only processing as the default. Declare every exception before the user enters data.
5. Keep deterministic arithmetic outside React and outside AI services.
6. Do not send form values, uploaded files, generated content, QR payloads, passwords, Wi-Fi credentials, document contents or financial values to analytics or logs.
7. Do not publish a tool until its registry record, validation, engine, UI, content, tests, privacy declaration and risk gates are complete.
8. Permanently exclude realistic fake utility, telecom, medical, travel and entertainment documents.
9. Do not expose a regulated or data-backed preset without an effective date, named source, freshness rule and kill-switch behavior.
10. Follow `AGENTS.md`. Before writing Next.js code, locate and read the relevant Next 16.3 guides under `node_modules/next/dist/docs/` with `rg --files node_modules/next/dist/docs`.

## 3. Current architecture assessment

### 3.1 Existing strengths to reuse

- `src/domain/registry/types.ts` already defines lifecycle, execution mode, risk, governance, sources, SEO and UI adapters.
- `src/domain/registry/categories.ts` is the single category registry.
- `src/domain/registry/index.ts` owns public availability, canonical lookup, related tools and metadata generation.
- `src/app/tools/[slug]/page.tsx` statically generates canonical tool pages from the registry.
- `src/components/tooling/tool-page.tsx` provides the shared tool hero, interaction, trust panel, explanation, FAQ and related-tool shell.
- `src/components/search/live-tool-search.tsx` already provides local URL-backed directory filters.
- `src/domain/documents/` and `src/lib/documents/` provide reusable document modelling and export paths.
- `src/domain/qr/` and `src/lib/qr/` provide reusable QR modelling and rendering.
- `src/lib/analytics/` already applies privacy controls to tool events.
- Registry-driven sitemap, metadata and structured data are already in place.

### 3.2 Scale blockers to resolve first

#### A. Client discovery imports runtime definitions

`src/domain/discovery/index.ts` and `src/components/search/live-tool-search.tsx` currently use `toolRegistry`. That registry contains complete runtime definitions, including schemas, calculation functions and React result renderers. Adding another 30–50 tools without changing this boundary can grow the client directory/search bundle unnecessarily.

Required fix: make directory and search consume a serializable metadata-only index. Runtime definitions must be loaded only by individual tool routes and server-side catalogue functions.

#### B. The tool interaction switch grows centrally

`src/components/tooling/tool-page.tsx` has a central `switch` over every UI adapter. Adding many variants will turn this into a fragile integration hotspot.

Required fix: introduce a typed renderer registry or a small number of stable adapter families. The visible `ToolPage` shell must not change.

#### C. Category count and copy are hardcoded

- `src/components/layout/header.tsx` displays `8 categories` as literal text.
- `src/app/categories/page.tsx` describes eight areas in literal copy.

Required fix: derive the count and category description from `categoryRegistry`.

#### D. Directory length and filtering

The directory renders every matching card. At 75–100 tools, it needs an accessible result limit and progressive expansion without losing URL-backed filters or canonical tool pages.

#### E. Analytics privacy is denylist-heavy

`src/domain/registry/shared.ts` contains a large global forbidden-property list. Catalogue expansion will make this increasingly error-prone.

Required fix: move runtime analytics payloads toward a small, default-deny schema of generic metadata fields.

## 4. Target information architecture

Keep all existing categories and append four new categories.

| Category ID         | Label               | Purpose                                                       | Example primary tools                                                |
| ------------------- | ------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| `daily-utilities`   | Everyday Utilities  | Common calculations, conversions and lightweight productivity | Percentage, discount, area, business days, word counter              |
| `retail-logistics`  | Retail & Logistics  | Store, packaging, delivery and procurement workflows          | Barcode, price tag, fuel, volumetric weight, challan, purchase order |
| `marketing-digital` | Marketing & Digital | Customer sharing, business identity and communication         | WhatsApp link, vCard QR, Wi-Fi QR, review request, email signature   |
| `media-files`       | Media & Files       | Browser-local image, PDF and asset operations                 | Photo resize/compress, PDF merge/split, favicon                      |

Category rules:

- One primary category is required.
- Use existing categories as secondary categories where they improve discovery.
- `generators` remains a valid secondary category for artifact-producing tools.
- `ecommerce` is secondary for retail labels, barcodes, shipping and product-image tools.
- `hr-salary` is primary for wage slips, notice period and leave balance.
- `gst-tax` is secondary only when the tool genuinely handles a governed tax workflow.
- Do not place all new tools into `generators`; primary categories must reflect the user task.

## 5. Delivery model

The coding agent must execute the plan in work packages. Do not begin individual tool development until Work Package 0 and Work Package 1 are green.

### Dependency order

```text
WP-0 Baseline and contracts
  -> WP-1 Scale-safe platform foundation
      -> WP-2 Everyday Utilities
      -> WP-3 Sharing, QR and File Utilities
      -> WP-4 Retail, Documents and Workplace Operations
          -> WP-5 Data-backed and Regulated Utilities
```

WP-2 and WP-3 may be developed independently after WP-1, but each wave must have its own feature flag and release evidence.

## 6. Work Package 0 — Baseline and scope freeze

**Goal:** Establish a reproducible baseline and machine-readable scope before implementation.

### Tasks

1. Read `AGENTS.md` and relevant Next 16.3 documentation.
2. Confirm the working tree and branch:
   - `git status --short --branch`
3. Run the baseline quality suite:
   - `npm run format:check`
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
4. Record the baseline commit and command results in a new completion report for this expansion.
5. Add a machine-readable catalogue file, recommended path:
   - `docs/product-spec/everyday_tools_catalogue.csv`
6. Include these columns:
   - `tool_id`
   - `name`
   - `canonical_slug`
   - `primary_category`
   - `secondary_categories`
   - `kind`
   - `capabilities`
   - `execution_mode`
   - `risk_tier`
   - `wave`
   - `status`
   - `feature_flag`
   - `policy_family`
   - `reviewer_role`
7. Mark every reference-site item as one of:
   - `covered`
   - `approved-new`
   - `deferred-demand`
   - `blocked-review`
   - `excluded-misuse`

### Acceptance criteria

- Baseline commands are recorded with no unexplained failures.
- Every proposed tool has one stable ID and one stable slug.
- No new public route exists yet.
- Excluded tools are explicitly recorded so a future coding agent does not reintroduce them accidentally.

## 7. Work Package 1 — Scale-safe platform foundation

**Goal:** Make the existing architecture safe for an 80–100 tool catalogue without changing the visible design.

### WP-1.1 Metadata-only discovery boundary

Files to inspect/change:

- `src/domain/registry/types.ts`
- `src/domain/registry/index.ts`
- `src/domain/discovery/index.ts`
- `src/components/search/live-tool-search.tsx`
- `tests/unit/registry.test.ts`
- `tests/unit/discovery.test.ts`

Implementation requirements:

1. Define a serializable `ToolDiscoveryRecord` containing only:
   - identity and slug
   - kind and capabilities
   - name and short name
   - categories
   - tags and search terms
   - summary
   - lifecycle and feature state
   - execution mode
   - regulatory/risk labels required by directory filters
   - verification date
2. Generate `toolDiscoveryIndex` from available definitions on the server/build boundary.
3. Make client search and directory import `toolDiscoveryIndex`, never `toolRegistry` or `allToolDefinitions`.
4. Keep runtime lookup in `getToolDefinitionBySlug` for the tool route.
5. Add an import-boundary test or static assertion preventing client discovery modules from importing runtime calculation modules.

Acceptance criteria:

- Search results, ranking and filters match baseline behavior.
- No existing tool disappears or changes order unexpectedly.
- The browser directory bundle does not include calculation engines or document implementations.
- Registry, discovery and production build tests pass.

### WP-1.2 Typed capabilities

Add a capability model without replacing the accepted six tool kinds.

Recommended capabilities:

```text
converter
scanner
camera
file-upload
image-processing
pdf-processing
qr-output
barcode-output
download-png
download-svg
download-pdf
download-csv
print-a4
print-thermal-58
print-thermal-80
print-label-4x6
print-label-sheet
session-handoff
bundled-data
network-data
```

Requirements:

- Capabilities are discovery metadata and implementation declarations.
- Add a directory capability/task filter only after at least two tools use the capability.
- Do not use a capability to bypass risk, privacy or execution-mode declarations.

### WP-1.3 Renderer registry

Files to inspect/change:

- `src/components/tooling/tool-page.tsx`
- `src/domain/registry/types.ts`
- new `src/components/tooling/tool-renderers.tsx` or equivalent

Recommended stable adapter families:

- `utility-calculator`
- `operations-calculator`
- `qr-barcode-generator`
- `file-utility`
- `business-document`
- existing specialized finance, tax, AI and GST/document adapters

Requirements:

- Keep `ToolPage` responsible for page shell and trust content.
- Keep adapter components responsible only for the interaction area.
- Do not create one route component per tool.
- Lazy-load file, camera, QR/barcode and document-heavy adapters where appropriate, following the repository's Next 16.3 documentation.
- Preserve server-rendered metadata and explanatory content.

Acceptance criteria:

- All 48 existing tools render unchanged.
- Adding a new variant does not require editing a large page-level `switch`.
- Missing adapter mappings fail tests/build rather than rendering a blank page.

### WP-1.4 Dynamic category copy

Files to change:

- `src/components/layout/header.tsx`
- `src/app/categories/page.tsx`
- `src/domain/registry/categories.ts`
- relevant unit/SEO tests

Requirements:

- Header label derives from `categoryRegistry.length`.
- Category overview copy does not hardcode eight categories.
- Add the four new category definitions.
- Preserve the current category card and responsive grid CSS.

### WP-1.5 Directory scaling

Files to inspect/change:

- `src/components/search/live-tool-search.tsx`
- `src/domain/discovery/index.ts`
- `src/styles/globals.css`
- `tests/integration/` directory search tests
- `tests/e2e/foundation.spec.ts` or a new focused directory spec

Requirements:

- Initially render at most 24 matching cards.
- Add an accessible `Show more tools` button.
- Announce visible and total result counts with `aria-live`.
- Reset visible count when query or filters change.
- Keep filters URL-backed and back/forward compatible.
- Improve search to support multi-token intent while preserving exact-name and exact-synonym priority.
- Do not add a hosted search dependency.

### WP-1.6 Analytics allowlist hardening

Files to inspect/change:

- `src/lib/analytics/index.ts`
- `src/domain/registry/shared.ts`
- `tests/unit/privacy.test.ts`
- integration tests that emit tool events

Requirements:

- Define a small runtime payload schema that accepts generic metadata only.
- Reject unknown properties by default.
- Keep the registry-level forbidden-property declarations for documentation and validation, but do not rely on them as the only runtime protection.
- Add tests proving representative new sensitive fields cannot be transmitted.

### WP-1 exit gate

- No visual redesign.
- All existing unit, integration and focused E2E tests pass.
- Production build passes.
- Directory/search use metadata only.
- Four new categories exist but remain absent from the sitemap if they contain no enabled tools.
- Feature flags for later waves can hide every new tool independently of existing phases.

## 8. Work Package 2 — Everyday Utilities

**Feature flag:** `everyday-utilities-wave`
**Default initial state:** visible beta (owner-configurable)
**Primary adapter:** `utility-calculator`
**Default execution mode:** `local-only`

### Shared implementation structure

Recommended new paths:

```text
src/domain/calculations/utilities/
  percentage.ts
  discount.ts
  fuel.ts
  volumetric-weight.ts
  business-days.ts
src/domain/converters/
  area.ts
src/domain/utilities/
  word-counter.ts
  password.ts
  todo.ts
src/domain/registry/tools/
  percentage.ts
  discount.ts
  area.ts
  business-days.ts
  fuel-expense.ts
  volumetric-weight.ts
  word-counter.ts
  password-toolkit.ts
  todo-checklist.ts
src/components/tooling/
  utility-calculator-form.tsx
  text-utility-form.tsx
  todo-checklist-form.tsx
```

Do not create a single large `utilities.ts` containing unrelated engines. Share parsing and presentation primitives, not domain models.

### Approved tools

| ID / slug                      | Primary category   | Minimum inputs                                         | Required outputs                                     | Special boundary                                                |
| ------------------------------ | ------------------ | ------------------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------- |
| `percentage-calculator`        | Everyday Utilities | mode, base/value/percentage                            | result, formula substitution                         | Support percentage-of, what-percent and percentage-change modes |
| `discount-calculator`          | Everyday Utilities | original price, one or two discounts                   | savings, final price, effective discount             | Do not silently add GST; provide explicit GST handoff           |
| `area-converter`               | Everyday Utilities | value, from unit, to unit, region when needed          | converted value, factor, regional warning            | Bigha/Katha require explicit regional definition                |
| `business-days-calculator`     | Everyday Utilities | start/end, inclusion rule, weekends, optional holidays | business days, excluded days, calendar summary       | Default to weekends only; holiday presets must be versioned     |
| `fuel-expense-calculator`      | Retail & Logistics | distance, mileage, fuel price, trips, optional markup  | litres, fuel cost, trip/customer cost                | User-entered fuel price only                                    |
| `volumetric-weight-calculator` | Retail & Logistics | dimensions, unit, actual weight, divisor               | dimensional and chargeable weight                    | User sees and can override divisor                              |
| `word-character-counter`       | Everyday Utilities | local text                                             | words, characters, no-space characters, lines        | No text persistence or analytics                                |
| `password-toolkit`             | Everyday Utilities | length and character options; strength input           | generated password or local strength assessment      | Use Web Crypto; never log, save or auto-copy                    |
| `todo-checklist`               | Everyday Utilities | task text, priority, completion                        | local checklist, progress, printable/exportable list | Memory-first; persistence only after explicit save design       |

### Cross-tool handoffs

- Discount result -> GST Calculator: transfer final discounted amount only after explicit user action.
- Fuel result -> Pricing Calculator or Quotation: transfer declared trip cost only after explicit user action.
- Volumetric result -> COD Cost Calculator: transfer chargeable weight only when the destination supports and revalidates it.

### WP-2 test requirements

- Decimal-safe calculations and explicit rounding.
- Unit conversion reciprocity fixtures.
- Region-required validation for variable land units.
- Leap year, same-day, reversed-date and weekend-boundary fixtures for business days.
- Zero distance, zero mileage, invalid divisor and metric/imperial conversion fixtures.
- Unicode word-count fixtures for English, Hindi and mixed text.
- Password entropy labels are described as estimates, not guaranteed crack times.
- Web Crypto availability failure has an honest error state.
- No raw text/password/task values in URLs, analytics or logs.

### WP-2 exit gate

- Nine tools appear in directory/category/search by default; the wave flag remains available for an explicit opt-out.
- Every tool has formula/method, example, interpretation, limitations, FAQ, privacy and related tools.
- Focused mobile and desktop E2E journeys pass.
- Existing calculator adapters and results remain unchanged.

## 9. Work Package 3 — Sharing, QR and File Utilities

**Feature flag:** `sharing-file-utilities-wave`
**Default initial state:** visible beta (owner-configurable)
**Adapters:** `qr-barcode-generator`, `file-utility`, `business-document`

### Shared modules

Recommended new/extended paths:

```text
src/domain/qr/
  vcard.ts
  wifi.ts
  whatsapp.ts
  barcode.ts
  decoded-content.ts
src/lib/qr/
  barcode-render.ts
  scanner.ts
src/domain/files/
  image.ts
  pdf.ts
  favicon.ts
src/lib/files/
  limits.ts
  image-processing.ts
  pdf-processing.ts
src/components/files/
  local-file-dropzone.tsx
  file-processing-status.tsx
  download-list.tsx
```

Reuse `src/components/ui/`, result panels and trust blocks. Do not introduce a second design system for dropzones or previews.

### Approved tools

| ID / slug                    | Primary category    | Required scope                                                  | Security/privacy requirement                                         |
| ---------------------------- | ------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| `whatsapp-link-generator`    | Marketing & Digital | phone, country code, optional message, direct link and QR       | Validate scheme/number; never contact WhatsApp automatically         |
| `vcard-qr-generator`         | Marketing & Digital | vCard 3.0 contact fields, QR, `.vcf` download                   | Correct escaping and minimal optional fields                         |
| `wifi-qr-generator`          | Marketing & Digital | SSID, security type, password, hidden flag, QR                  | Password masked by default; no persistence; correct payload escaping |
| `barcode-generator`          | Retail & Logistics  | supported symbology, value, size, optional human-readable label | Validate length/checksum rules; do not claim GS1 allocation          |
| `qr-barcode-scanner`         | Marketing & Digital | camera or image input; decoded preview                          | Never auto-open; show scheme/domain; permission-first flow           |
| `photo-resizer-compressor`   | Media & Files       | local image, dimensions/quality/format                          | Pixel/file limits, EXIF removal option, object-URL cleanup           |
| `pdf-merge-split`            | Media & Files       | multiple PDFs or page selection                                 | File/page/memory limits; encrypted/invalid PDF errors                |
| `email-signature-generator`  | Marketing & Digital | identity, contact, branding, links                              | Escape HTML; safe URL schemes; local preview/export                  |
| `review-request-builder`     | Marketing & Digital | business/review URL, tone/template, optional WhatsApp output    | Validate destination; no fabricated reviews or automatic sending     |
| `favicon-app-icon-generator` | Media & Files       | source image or simple initials/colors                          | Image limits; correct output dimensions; ZIP generated locally       |

### File safety limits

Define shared constants with tests rather than scattering limits through components. Initial values must be selected through measured browser tests, not guessed. The contract must include:

- maximum file count
- maximum compressed bytes per file and total
- maximum decoded image pixels
- maximum PDF pages and output pages
- allowed MIME types plus content decoding validation
- worker timeout/cancellation behavior
- object URL and ArrayBuffer cleanup
- user-readable unsupported/encrypted/corrupt file states

### Scanner safety

- Camera permission is requested only after a user action.
- Provide image-upload fallback.
- Decoded URLs are displayed as text first.
- Only `http` and `https` receive an optional open action.
- Warn on `data`, `javascript`, unknown, payment and credential-like schemes.
- UPI content must show payee and amount fields for verification; scanning does not confirm ownership or payment.

### WP-3 exit gate

- Ten tools are feature-flag controlled and local-first.
- File/camera dependencies are code-split away from unrelated tools and the directory.
- Malformed, oversized and unsupported input tests pass.
- Physical/mobile camera validation is recorded as an external manual gate if unavailable in automated CI.

## 10. Work Package 4 — Retail, Documents and Workplace Operations

**Feature flag:** `retail-workplace-wave`
**Default initial state:** visible beta (owner-configurable)
**Primary adapter:** `business-document`

### Document-engine changes

Extend, do not replace:

- `src/domain/documents/`
- `src/lib/documents/pdf.ts`
- `src/lib/documents/export.ts`
- `src/components/documents/document-preview.tsx`
- existing logo and safe-filename utilities

Add explicit page profiles:

```text
A4 portrait
58 mm thermal
80 mm thermal
4 x 6 inch shipping label
A4 multi-label sheet
```

The preview model and exported document must use the same domain data. Do not maintain separate arithmetic in preview and PDF code.

### Approved tools

| ID / slug                    | Primary category    | Required scope                                                | Excluded claim                                        |
| ---------------------------- | ------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| `price-tag-generator`        | Retail & Logistics  | product, MRP, offer price, discount, SKU/barcode, label sheet | Does not validate legal-metrology compliance          |
| `delivery-challan-generator` | Retail & Logistics  | consignor/consignee, items, reason, vehicle, dates            | Does not file or validate e-way bill requirements     |
| `shipping-label-generator`   | Retail & Logistics  | sender/recipient, order/reference, parcel, optional barcode   | Not a carrier-issued or accepted label                |
| `purchase-order-generator`   | Retail & Logistics  | buyer/supplier, items, tax-display option, terms, totals      | Does not place or transmit an order                   |
| `menu-generator`             | Marketing & Digital | business identity, sections/items/prices, optional QR         | Does not publish/host a live menu in V1               |
| `wage-slip-generator`        | HR & Salary         | employer/worker, period, declared earnings/deductions         | Does not calculate statutory payroll by default       |
| `rent-receipt-generator`     | HR & Salary         | tenant/landlord, property, period, declared amount            | Does not establish HRA eligibility or payment proof   |
| `notice-period-calculator`   | HR & Salary         | start date, days/calendar rule, holidays                      | Does not determine contractual/legal entitlement      |
| `leave-balance-calculator`   | HR & Salary         | annual quota, joining period, used leave, proration rule      | Employer/user policy only unless reviewed data exists |

### Document safeguards

- Clear artifact labels: `Draft`, `Template`, `Declared receipt`, `Prepared purchase order`.
- No government seals, carrier marks, bank marks or third-party marketplace logos.
- No claim of filing, delivery, acceptance, settlement, IRN, e-signature or official verification.
- Uploaded logos remain local and use existing size/type controls.
- Export filenames use sanitized non-sensitive identifiers.
- Print tests cover clipping, page breaks and long text for every page profile.

### WP-4 exit gate

- Nine tools are feature-flag controlled.
- A4, thermal, 4x6 and label-sheet output fixtures pass.
- Document language is reviewed against `tool-contract-v2.md`.
- Existing Invoice, GST Invoice, Quotation, Letterhead, Receipt and Business Card outputs remain unchanged.

## 11. Work Package 5 — Data-backed and Regulated Utilities

**Feature flag:** `regulated-utilities-wave`
**Default initial state:** visible beta (owner-configurable)
**Rule:** Visibility does not make this package authoritative; each result must retain its source, freshness, reviewer and disclaimer boundaries.

**Project-owner visibility decision (11 August 2026):** This is a personal project and the owner requested that WP-5 remain visible and usable by default. The implementation therefore enables the wave by default while retaining beta labels, explicit disclaimers, reviewer-pending metadata, source freshness controls and the independent kill switch. Deployments may opt out with `NEXT_PUBLIC_TOOL_FEATURE_FLAGS` or the kill switch.

### Approved reviewed backlog

| Tool                                    | Kind / execution                      | Required policy boundary                                                        |
| --------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| HSN/SAC Reference Samples               | data-backed / local-with-bundled-data | Versioned bounded samples, search limitations and classification disclaimer     |
| GST Filing Due-date Calendar            | data-backed / local-with-bundled-data | FY, taxpayer/return type, notification updates, stale disable behavior          |
| Depreciation Calculator                 | calculator/data-backed                | Separate Companies Act and Income Tax modes; dated rates and methods            |
| Maharashtra Professional Tax Calculator | data-backed                           | State, period, salary definition, gender and annual/monthly schedule rules      |
| MSME Late-payment Interest Calculator   | calculator/data-backed                | Eligibility inputs separated from arithmetic; RBI rate snapshot/effective dates |
| Currency Converter                      | network-required with manual fallback | Provider, quote timestamp, cache, rate type, failure and stale behavior         |

### Required files and controls

- Add policy families under `src/domain/policies/`.
- Add normalized sources to `docs/product-spec/business_toolkit_source_library.csv` or its successor.
- Add formula/policy entries to the active formula register.
- Use `src/domain/policies/effective-dated.ts` rather than tool-local date selection.
- Add source hostname validation and policy freshness tests.
- Add a kill switch distinct from the feature flags of existing tax/payroll tools.
- Currency conversion must not silently reuse the last network rate; show timestamp and stale state.

### WP-5 exit gate

- Named reviewer roles and approval state are recorded honestly.
- Golden fixtures are traceable to the release commit.
- Stale, withdrawn, future-date and network-failure paths are tested.
- No regulated result is presented as filing, eligibility determination or professional advice.

## 12. Deferred demand-validated backlog

Do not add these merely to reach a catalogue count:

- Customer Retention Rate
- Referral Rate
- Lead Conversion Rate
- Funnel Conversion
- Opportunity Win Rate
- Sales Cycle Length
- Sales Forecast Accuracy
- Revenue Growth Rate when current tools already answer the intended question
- Budget Variance
- CSAT
- First Contact Resolution
- First Response Time
- NPS
- Order Fulfilment Accuracy
- On-time Delivery Rate
- Inventory Turnover
- Capacity Utilisation
- Defect/Error Rate
- Freelance Rate
- EBITDA
- Generic developer and SEO utilities

Before promoting one of these tools, record evidence from privacy-safe search zero-results, feedback or an explicit product decision. Similar ratio tools should share calculation primitives but retain separate canonical pages only when user intent and explanatory content are genuinely distinct.

## 13. Permanently excluded or redesign-required tools

### Permanently exclude realistic replicas

- Electricity bills
- Mobile/telecom bills
- Broadband bills
- Medical prescriptions
- Flight/boarding passes
- Movie tickets
- Hotel booking vouchers

### Redesign required before consideration

- `Digital Signature Maker` -> only a `Signature Image Maker`, never an official/secure e-signature claim.
- Staff ID cards and employment/internship/award certificates -> organization-created templates with explicit non-verification language and misuse review.
- Privacy Policy Generator -> editable legal draft only after jurisdiction-specific legal review; no compliance guarantee.
- Website-to-PDF mockups -> clarify the real user task and avoid deceptive browser/search replicas.

## 14. Registry record checklist for every new tool

Each new tool definition must include and pass validation for:

- unique `id`
- unique canonical `slug`
- accepted `kind`
- declared `capabilities`
- stable UI adapter and variant
- primary and secondary categories
- tags, synonyms, audiences and task-intent phrases
- lifecycle and wave feature flag
- execution mode and privacy note
- risk tier, owner, review cadence and dependencies
- typed input schema and safe defaults
- validation with stable error codes
- pure engine or generation function
- original result presentation
- sources and supported-claim mapping
- formula/method and worked example
- result interpretation
- limitations and edge cases
- FAQ and SEO metadata
- related-tool IDs and explicit handoffs
- analytics event policy
- `lastReviewed` and `lastVerified`

No placeholder registry records may be published to advertise future tools.

## 15. UI and design contract

### Calculator/converter

- Use the existing `calculator-layout`.
- Controls remain in the left `calculator-card` and results in the right `calculator-result`.
- Mobile stacks form before result.
- Result includes headline, breakdown, assumptions and next action.

### Generator/document

- Reuse current form sections, preview panel, buttons and status states.
- Keep the same typography, spacing, borders, radii and navy/teal palette.
- Add only narrowly scoped CSS classes to `src/styles/globals.css`.

### File utility

- Use existing card and form tokens for the dropzone and processing list.
- Show local-processing notice before file selection.
- Provide per-file status, cancel/remove and clear-all controls.
- Do not introduce dashboard-style visual clutter.

### Scanner

- Show a permission explanation and explicit camera-start action.
- Keep decoded content in a normal result panel.
- Do not navigate automatically.

### Directory/homepage

- Do not place every tool on the homepage.
- Maintain a curated featured list with explicit launch priority.
- Do not call tools `Popular` or `Trending` without evidence.
- Existing cards and category grids remain visually unchanged.

## 16. SEO and content requirements

For every new public route:

1. Unique name, title, H1, description and canonical URL.
2. Search terms reflect the task, not keyword stuffing.
3. WebApplication structured data remains derived from the registry.
4. FAQ structured data exactly matches visible FAQ content.
5. Tool appears once in the sitemap only when publicly available.
6. Disabled/beta-withdrawn pages follow existing noindex/unavailable behavior.
7. Original explanatory copy; do not paraphrase the reference site line-by-line.
8. Related tools are curated by workflow, not automatically inferred from category.

Add regression tests for duplicate titles, duplicate slugs, mismatched H1/canonical and missing populated category routes.

## 17. Test strategy

### Unit tests

- Pure formula and conversion fixtures.
- Validation and stable error codes.
- Precision, rounding, zero, negative, maximum and unsafe-number boundaries.
- Payload escaping for QR, vCard, Wi-Fi, HTML and barcode formats.
- File limit and malformed-content checks.
- Effective-dated policy and stale-state behavior.
- Registry, capability and related-tool validation.

### Integration tests

- One form test per materially different adapter/variant.
- Error summary focus and inline error linkage.
- Result generation, reset and explicit handoff behavior.
- Export/print action state.
- No raw values in analytics calls.
- File processing progress, cancellation and failure states.

### E2E tests

Use representative coverage per adapter plus critical-tool-specific cases:

- mobile 320/390 px
- tablet 768 px
- desktop 1280/1440 px
- keyboard-only core journey
- axe accessibility pass for representative pages
- A4/thermal/4x6/label print verification
- download filename and non-empty artifact verification
- camera fallback where automation permits

Do not multiply every unit fixture across every browser viewport. Use unit tests for arithmetic depth and E2E tests for integration confidence.

### Release commands

Each completed work package must run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Run focused Playwright specs for the changed adapter families. Run the full E2E matrix before enabling a complete public wave or record why an environment-specific manual gate remains.

## 18. Feature flags and rollout

Add independent wave flags:

```text
everyday-utilities-wave
sharing-file-utilities-wave
retail-workplace-wave
regulated-utilities-wave
```

Rules:

- Existing phase flags remain untouched.
- In this personal project, all four wave flags are enabled when `NEXT_PUBLIC_TOOL_FEATURE_FLAGS` is unset.
- Set `NEXT_PUBLIC_TOOL_FEATURE_FLAGS` explicitly (including an empty value) to opt out of one or more waves in a deployment.
- A wave may be disabled without removing routes from source or affecting existing tools.
- Stale regulated/data tools use lifecycle/kill-switch behavior, not only a broad wave flag.
- Beta labels stay visible until wave-specific exit gates are complete.

Rollout order:

1. Default-visible personal-project implementation.
2. Preview deployment and focused QA.
3. Keep beta labels and safety boundaries visible while iterating.
4. Use the explicit feature flags or regulated kill switch for rollback, and observe privacy-safe events: views, starts, completions, validation failures, exports and zero-result search intents. Never record entered values.
5. Fix high-impact defects and confirm no regression to existing tools.
6. Promote lifecycle only after evidence is recorded.

## 19. Suggested commit/work-review boundaries

Keep changes reviewable. Recommended boundaries:

1. `refactor: isolate metadata-only tool discovery`
2. `refactor: add renderer registry and tool capabilities`
3. `feat: add everyday utility categories and scalable directory`
4. `feat: add percentage discount and area utilities`
5. `feat: add business days fuel and volumetric utilities`
6. `feat: add text password and checklist utilities`
7. `feat: add sharing and qr barcode utilities`
8. `feat: add local image pdf and icon utilities`
9. `feat: add retail document output profiles`
10. `feat: add retail and workplace generators`
11. Separate reviewed commits for each regulated/data policy family.

Do not combine the platform refactor and all tool waves into one unreviewable change.

## 20. Coding-agent handoff protocol

At the start of each work package, the coding agent must report:

- work package and task IDs being attempted
- files expected to change
- assumptions and excluded scope
- baseline test status

At completion, report:

- implemented tools/capabilities
- changed files
- validation and calculation boundaries
- privacy/data-flow behavior
- tests and command results
- remaining manual or reviewer gates
- feature-flag state
- any deviations from this plan and why

If a task requires a product decision that would change scope, category, privacy, risk or canonical routes, stop and request direction rather than inventing the decision.

## 21. Definition of done

The first expansion is complete only when:

- WP-1 scale foundation is green.
- 28 approved WP-2 through WP-4 tools are implemented or explicitly removed by a recorded product decision.
- All existing 48 tools and routes remain functional.
- New categories and counts are registry-driven.
- Search and directory are metadata-only and usable at the larger catalogue size.
- New tools use the existing design system without layout regression.
- File, camera, QR and document utilities pass their security/privacy gates.
- No excluded realistic document simulator exists.
- Each enabled wave has a completion report, test evidence and rollback/feature-flag path.
- Regulated/data-backed WP-5 tools remain separately governed and may be independently disabled until their source and reviewer requirements pass; they are not hidden by default.

## 22. First coding task

The coding agent should begin with **WP-0 and WP-1.1 only**:

1. Record the baseline.
2. Define `ToolDiscoveryRecord`.
3. Generate a metadata-only public discovery index.
4. Migrate search and directory to that index.
5. Add boundary/regression tests.
6. Run the full non-E2E quality suite and production build.

Do not add a new end-user tool in the first change. This creates the safe catalogue boundary needed by every later wave and produces a small, reviewable first implementation milestone.
