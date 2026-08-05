# India Biz Tools — Public Product, Route, Tool, Technical and Implementation Teardown

**Target:** https://www.indiabiztools.com  
**Research baseline:** 6 August 2026, approximately 01:48 IST  
**Report type:** Best-effort public evidence audit and original-product implementation blueprint  
**Evidence labels:** `[VERIFIED]`, `[STRONG INFERENCE]`, `[POSSIBLE]`, `[UNKNOWN]`, `[RECOMMENDATION]`

> This is not an assertion that every live page, field, interaction or internal service was inspected. The target is a JavaScript-heavy site and the available environment could retrieve search-indexed public evidence but could not operate a full browser DevTools session. Every inaccessible item is marked as unknown rather than guessed.

## Part 1 — Executive Summary

### What the product is

**[VERIFIED]** India Biz Tools is a free, India-focused utility platform that publicly advertises more than 50 business tools covering financial calculations, GST and invoicing, receipts, QR/barcode utilities, document generation, image processing and store operations. Public About-page copy positions it for small retailers, street vendors, MSMEs, startups and other small businesses.

**[VERIFIED — owner disclosure]** In a public creator post, the application is described as built with React, TypeScript and Vite, deployed on Vercel, and developed heavily with AI-assisted coding. A separate creator post describes the app as completely client-side with no server storage. The site’s privacy-policy snippets independently state that calculations, QR/barcode rendering, image compression and PDF receipt work occur in the browser.

### Main strengths

- **[VERIFIED] Strong India-specific utility coverage.** GST, UPI, thermal receipts, HSN/SAC, Indian land units and WhatsApp-oriented outputs directly match common Indian small-business tasks.
- **[VERIFIED] Low-friction positioning.** Public copy emphasizes free access and browser-based use rather than mandatory account creation.
- **[VERIFIED] Privacy-first value proposition.** Local processing is a meaningful differentiator for invoices, logos, images, QR payloads and printable documents.
- **[VERIFIED] Practical output formats.** A4, 58 mm and 80 mm thermal printing, PDF export, PNG/SVG QR output and WhatsApp sharing are aligned with real operating environments.
- **[VERIFIED] Broad search footprint.** Search indexing exposes many individual tool pages and several alternate/legacy routes, giving the product significant keyword coverage.

### Main weaknesses and risks

- **[VERIFIED] Route and metadata inconsistency.** Search results expose legacy URLs, duplicate tool URLs and several title/path mismatches. Examples include `/upi-qr-generator` indexed as a GST invoice generator, `/msme-calculator` indexed as a fuel-expense tool and `/price-tag-barcode-generator` indexed as a WhatsApp direct-chat tool. This creates user confusion, keyword cannibalization and crawler ambiguity.
- **[VERIFIED] GST-rate presentation appears outdated for a 2026 default calculator.** Public snippets advertise 5%, 12%, 18% and 28% fixed rates. Official reforms effective 22 September 2025 primarily moved the structure to 5% and 18%, with 40% for specified luxury/sin categories and other exceptions. A modern calculator must version policy by transaction date and category instead of showing timeless slabs.
- **[VERIFIED] Mock utility/mobile/broadband bill tools create trust and misuse risk.** Disclaimers reduce but do not eliminate the possibility that realistic outputs could be presented as genuine evidence. An original platform should omit these or render only unmistakably fictional, watermarked demos.
- **[UNKNOWN] Formula provenance and review process.** Public snippets do not show a consistent source register, effective dates, last-reviewed dates, version history or independent test evidence.
- **[UNKNOWN] Accessibility, runtime performance and security-header maturity.** These could not be directly measured in the available environment.
- **[STRONG INFERENCE] Tool sprawl has outpaced information governance.** The wide catalogue, duplicate routes and inconsistent indexed metadata suggest faster feature growth than canonicalization, regulatory versioning and QA discipline.

### Overall maturity

| Dimension                     | Provisional score | Rationale                                                                                                                                     |
| ----------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Product breadth               | 8/10              | Large India-specific catalogue and useful output formats.                                                                                     |
| Product focus                 | 6/10              | Useful breadth, but mixed calculators, business documents, generic media tools and risky simulators dilute the core proposition.              |
| Trust and accuracy governance | 4/10              | Disclaimers and privacy copy help, but rate freshness, source versioning and formula audit evidence are not consistently visible.             |
| Technical architecture        | 7/10              | React/TypeScript/Vite and local-first processing are suitable for a utility platform; internal code quality and test coverage remain unknown. |
| SEO architecture              | 5/10              | Strong index coverage, weakened by duplicate and mismatched routes.                                                                           |
| Design maturity               | Not scored        | Exact layouts, tokens and responsive states were not visually inspected.                                                                      |
| Accessibility                 | Not scored        | No keyboard, screen-reader or contrast testing was possible.                                                                                  |
| Overall                       | 6/10 provisional  | Promising, useful platform with a strong niche, but accuracy governance and canonical information architecture require immediate work.        |

### Most important implementation recommendation

**[RECOMMENDATION]** Do not begin by recreating all 50–60 tools. Build a shared, schema-driven tool engine and launch a focused set of eight high-value tools. Make source versioning, effective dates, pure calculation functions, accessibility, privacy declarations and automated tests part of the platform contract. This creates a smaller product that is more trustworthy and easier to maintain than a broad clone.

## Part 2 — Research Scope and Limitations

### Methods used

- Search-engine route and snippet discovery across the target domain.
- Public About, FAQ, privacy, terms and disclaimer evidence.
- Public creator statements describing the stack, deployment and local-processing model.
- Cross-comparison of canonical-looking `/tools/...` routes with legacy root-level URLs.
- Official GST Council and Press Information Bureau materials for current rate-structure validation.
- Public competitor pages for feature benchmarking.
- Independent formula construction for GST, CAGR, ROI, EBITDA and common conversions.

### What was not available

- A functioning interactive browser session with DevTools, network panel, cookie/local-storage panel and console.
- Direct Lighthouse, WebPageTest or Core Web Vitals measurement.
- Direct mobile/tablet viewport screenshots and touch-keyboard testing.
- Keyboard-only and screen-reader testing.
- Direct HTTP-header, redirect-chain, CSP, HSTS, CORS, cache or CDN inspection.
- Reliable robots.txt and XML sitemap retrieval.
- Source bundle, source-map, route-manifest and third-party library inspection.
- Submission of every form and verification of every validation state.
- Exact screenshots, color tokens, spacing measurements, breakpoints and print-output captures.
- Confirmation of actual API endpoints, provider names, database, authentication, analytics, error tracking or deployment pipeline.

### Coverage obtained

**[VERIFIED]** This audit records **51 public routes or route candidates**, including core pages, canonical-looking tool pages and legacy/alternate URLs, and **27 tools with enough public description to classify**. The creator publicly refers to 60+ tools, so this inventory must be treated as a high-confidence partial catalogue rather than a mathematically complete crawl.

### Evidence convention

| Label              | Meaning                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| [VERIFIED]         | Directly supported by public site copy, indexed metadata, owner disclosure or authoritative source. |
| [STRONG INFERENCE] | Multiple signals support the conclusion, but the implementation was not directly inspected.         |
| [POSSIBLE]         | Plausible, limited evidence.                                                                        |
| [UNKNOWN]          | Cannot be determined through the available public inspection.                                       |
| [RECOMMENDATION]   | Original proposal for the new platform.                                                             |

## Part 3 — Complete Sitemap

The machine-readable inventory is supplied separately as `route_inventory.csv`. The table below is the discovered public map, not a guarantee that no other routes exist.

| Route                           | Page type                    | Category              | Observed status                  | Confidence | Notes                                                                                                          |
| ------------------------------- | ---------------------------- | --------------------- | -------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| /                               | Homepage                     | Core                  | Live/indexed                     | High       | Homepage claims 50+ free utilities; exact interactive state not inspected.                                     |
| /about                          | Informational                | Core                  | Indexed                          | High       | Positions platform for Indian small businesses, retailers, vendors, MSMEs and startups.                        |
| /trending                       | Collection                   | Core                  | Indexed                          | Medium     | Collection route; ranking logic not publicly verified.                                                         |
| /favorites                      | Collection                   | Core                  | Indexed                          | Medium     | Likely browser-local due no-account positioning; storage mechanism unverified.                                 |
| /blog                           | Content hub                  | Core                  | Indexed                          | High       | Article inventory not exhaustively retrievable in current environment.                                         |
| /faq                            | Help                         | Core                  | Indexed                          | High       | Public FAQ states tools are free.                                                                              |
| /privacy-policy                 | Legal                        | Core                  | Indexed                          | High       | States many calculations/rendering/compression/PDF operations occur in browser.                                |
| /terms                          | Legal                        | Core                  | Indexed                          | High       | Terms route visible in index.                                                                                  |
| /disclaimer                     | Legal                        | Core                  | Indexed                          | High       | Disclaims certified accounting/legal advice.                                                                   |
| /contact                        | Contact                      | Core                  | Route not independently verified | Low        | Contact is linked in public footer snippets; exact path and form behavior unverified.                          |
| /tools/gst-calculator           | Calculator                   | Billing & Taxes       | Indexed                          | High       | Inclusive/exclusive GST; advertised 5/12/18/28 rates; CGST/SGST/IGST; PDF/thermal export and UPI QR mentioned. |
| /tools/gst-invoice              | Document generator           | Billing & Taxes       | Indexed                          | High       | Itemized GST invoice; A4/thermal PDF; merchant UPI QR.                                                         |
| /tools/payment-receipt          | Document generator           | Billing & Taxes       | Indexed                          | High       | Payment modes include UPI/Cash/Bank Transfer; 58mm/80mm thermal print.                                         |
| /tools/rent-receipt             | Document generator           | Billing & Taxes       | Indexed                          | High       | Rent receipt generator; exact legal fields and HRA wording unverified.                                         |
| /tools/wage-slip                | Document generator           | Billing & Taxes       | Indexed                          | High       | 80mm thermal wage slip; WhatsApp sharing mentioned.                                                            |
| /tools/maintenance-invoice      | Document generator           | Billing & Taxes       | Indexed                          | High       | Maintenance invoice; exact schema unverified.                                                                  |
| /tools/electricity-bill         | Simulator/document generator | Billing & Taxes       | Indexed                          | High       | Explicitly presented as simulator/mock receipt; not for legal/commercial transactions.                         |
| /tools/mobile-bill              | Simulator/document generator | Billing & Taxes       | Indexed                          | High       | Mock mobile bill; misuse/trust risk.                                                                           |
| /tools/broadband-bill?lang=en   | Simulator/document generator | Billing & Taxes       | Indexed                          | High       | Mock broadband bill; localized query parameter observed.                                                       |
| /tools/letterhead               | Document generator           | Print & Logistics     | Indexed                          | High       | A4 PDF, custom logo/header/reference, printable workflow.                                                      |
| /tools/logistics-documents      | Document generator           | Print & Logistics     | Indexed                          | High       | Delivery challans and 12-up barcode price tags.                                                                |
| /tools/media-suite              | Image utility                | Media & Images        | Indexed                          | High       | PNG/JPEG to WebP, resize/compress; public copy says images stay in browser.                                    |
| /tools/social-post-generator    | Content generator            | Marketing & Barcodes  | Indexed                          | High       | Turns raw notes into social copy; AI implementation unverified.                                                |
| /tools/upi-standee              | QR/document generator        | Marketing & Barcodes  | Indexed                          | High       | UPI payment standee; exact validation and QR payload rules unverified.                                         |
| /tools/url-qr                   | QR generator                 | Marketing & Barcodes  | Indexed                          | High       | Custom colors/size; PNG/SVG; client-side claim.                                                                |
| /tools/vcard-qr                 | QR generator                 | Marketing & Barcodes  | Indexed                          | High       | vCard contact QR; client-side claim.                                                                           |
| /tools/wifi-qr                  | QR generator                 | Marketing & Barcodes  | Indexed                          | High       | Wi-Fi QR payload pattern publicly described.                                                                   |
| /tools/menu-creator             | Document/content generator   | Marketing & Barcodes  | Indexed                          | High       | Menu-card creation; exact templates/exports unverified.                                                        |
| /tools/qr-barcode-scanner       | Scanner utility              | Marketing & Barcodes  | Indexed                          | High       | Camera/file behavior and permission flow unverified.                                                           |
| /tools/hsn-sac-finder           | Lookup/compliance tool       | Billing & Taxes       | Indexed                          | High       | HSN/SAC lookup; source, version, search dataset and update date unverified.                                    |
| /tools/area-converter           | Converter                    | Store Operations      | Indexed                          | High       | Includes Bigha, Katha, Gaj, Acre, Hectare, sq ft and Guntha; regional-unit handling needs verification.        |
| /tools/business-days-calculator | Calculator                   | Store Operations      | Indexed                          | High       | Working-day calculation; holiday source and weekend configuration unverified.                                  |
| /tools/cagr-calculator          | Calculator                   | Financial Calculators | Indexed                          | High       | CAGR calculation; exact rounding unverified.                                                                   |
| /tools/ebitda-calculator        | Calculator                   | Financial Calculators | Indexed                          | High       | EBITDA calculation; field definitions and treatment of D&A unverified.                                         |
| /tools/roi-calculator           | Calculator                   | Financial Calculators | Indexed                          | High       | ROI calculator; cash-flow timing assumptions unverified.                                                       |
| /tools/salary-calculator        | Calculator                   | Financial Calculators | Indexed                          | High       | After PF/PT/TDS; state, regime, FY, payroll assumptions unverified.                                            |
| /tools/currency-converter       | Converter                    | Financial Calculators | Indexed                          | High       | Claims real-time rates; API provider, timestamp, cache and failure handling unknown.                           |
| /thermal-receipt-generator      | Legacy/alternate             | Legacy URLs           | Indexed title/path mismatch      | High       | Indexed title identifies Payment Receipt Generator.                                                            |
| /upi-qr-generator               | Legacy/alternate             | Legacy URLs           | Indexed title/path mismatch      | High       | Indexed title identifies GST Invoice Generator.                                                                |
| /msme-calculator                | Legacy/alternate             | Legacy URLs           | Indexed title/path mismatch      | High       | Indexed title identifies Fuel Expense & Mileage Splitter.                                                      |
| /google-review-qr-generator     | Legacy/standalone tool       | Legacy URLs           | Indexed                          | High       | Canonical replacement/redirect not confirmed.                                                                  |
| /letterhead-generator           | Legacy/alternate             | Legacy URLs           | Possible duplicate               | High       | Appears to overlap /tools/letterhead.                                                                          |
| /url-qr-generator               | Legacy/alternate             | Legacy URLs           | Possible duplicate               | High       | Appears to overlap /tools/url-qr.                                                                              |
| /vcard-qr-generator             | Legacy/alternate             | Legacy URLs           | Possible duplicate               | High       | Appears to overlap /tools/vcard-qr.                                                                            |
| /4x6-shipping-label-generator   | Legacy/standalone tool       | Legacy URLs           | Indexed                          | High       | Canonical /tools route not surfaced.                                                                           |
| /ai-social-media-post-generator | Legacy/alternate             | Legacy URLs           | Possible duplicate               | High       | Appears to overlap /tools/social-post-generator.                                                               |
| /delivery-challan-generator     | Legacy/alternate             | Legacy URLs           | Possible duplicate               | High       | Appears to overlap /tools/logistics-documents.                                                                 |
| /menu-card-creator              | Legacy/alternate             | Legacy URLs           | Possible duplicate               | High       | Appears to overlap /tools/menu-creator.                                                                        |
| /gst-margin-calculator          | Legacy/standalone tool       | Legacy URLs           | Indexed                          | High       | Current canonical route not confirmed.                                                                         |
| /fuel-expense-calculator        | Legacy/standalone tool       | Legacy URLs           | Indexed                          | High       | Current canonical route not confirmed.                                                                         |
| /price-tag-barcode-generator    | Legacy/alternate             | Legacy URLs           | Indexed title/path mismatch      | High       | Indexed title identifies WhatsApp Direct Chat & Link.                                                          |

### Sitemap findings

- **[VERIFIED]** The current index mixes root-level legacy slugs and `/tools/...` slugs.
- **[VERIFIED]** Several apparent duplicates are independently indexed rather than visibly consolidated in search.
- **[UNKNOWN]** Whether legacy routes 301 redirect, render duplicate content, use canonical tags or return soft 404s could not be tested.
- **[RECOMMENDATION]** Use one canonical URL format: `/tools/{stable-slug}`. Map every prior slug to a single 301 redirect and generate sitemap, metadata, breadcrumbs and internal links from one tool registry.
- **[RECOMMENDATION]** Add `/methodology`, `/sources`, `/report-an-error` and category pages that have substantial original content.

## Part 4 — Complete Tool Inventory

| Tool                       | URL                             | Category              | Primary purpose                                                        | Processing classification                    | Risk                   | Recommended priority          |
| -------------------------- | ------------------------------- | --------------------- | ---------------------------------------------------------------------- | -------------------------------------------- | ---------------------- | ----------------------------- |
| GST Calculator             | /tools/gst-calculator           | Billing & Taxes       | Calculate inclusive/exclusive GST and split CGST/SGST or IGST.         | Deterministic client-side likely             | High                   | P0                            |
| GST Invoice Generator      | /tools/gst-invoice              | Billing & Taxes       | Create itemized GST invoices.                                          | Client-side document generation likely       | High                   | P0                            |
| Payment Receipt Generator  | /tools/payment-receipt          | Billing & Taxes       | Create printable payment receipts.                                     | Client-side document generation likely       | Medium                 | P0                            |
| Rent Receipt Generator     | /tools/rent-receipt             | Billing & Taxes       | Create rent receipts.                                                  | Client-side document generation likely       | High                   | P1                            |
| Wage Slip Generator        | /tools/wage-slip                | Billing & Taxes       | Create wage/salary slips for small businesses.                         | Client-side document generation likely       | High                   | P1                            |
| Maintenance Invoice        | /tools/maintenance-invoice      | Billing & Taxes       | Create maintenance/service invoices.                                   | Client-side document generation likely       | High                   | P1                            |
| Electricity Bill Simulator | /tools/electricity-bill         | Billing & Taxes       | Generate a simulated electricity-bill style document.                  | Template-based client-side likely            | Very high misuse       | Do not build without redesign |
| Mobile Bill Simulator      | /tools/mobile-bill              | Billing & Taxes       | Generate a simulated mobile-bill style document.                       | Template-based client-side likely            | Very high misuse       | Do not build without redesign |
| Broadband Bill Simulator   | /tools/broadband-bill?lang=en   | Billing & Taxes       | Generate a simulated broadband-bill style document.                    | Template-based client-side likely            | Very high misuse       | Do not build without redesign |
| Letterhead Generator       | /tools/letterhead               | Print & Logistics     | Create branded business letterheads.                                   | Client-side document generation likely       | Low                    | P0                            |
| Logistics Documents        | /tools/logistics-documents      | Print & Logistics     | Create delivery challans and price/barcode labels.                     | Client-side document generation likely       | Medium-high            | P1                            |
| Media Suite                | /tools/media-suite              | Media & Images        | Convert, resize and compress business images.                          | Client-side verified by public copy          | Low                    | P1                            |
| Social Post Generator      | /tools/social-post-generator    | Marketing & Barcodes  | Convert raw notes into social-media copy.                              | AI unknown; could be LLM, rules or templates | Medium                 | P2                            |
| UPI Standee Generator      | /tools/upi-standee              | Marketing & Barcodes  | Create a printable UPI payment standee.                                | Client-side QR/document generation likely    | Medium                 | P0                            |
| URL QR Generator           | /tools/url-qr                   | Marketing & Barcodes  | Generate branded QR codes for URLs.                                    | Client-side claimed                          | Low-medium             | P0                            |
| vCard QR Generator         | /tools/vcard-qr                 | Marketing & Barcodes  | Encode contact details into a vCard QR.                                | Client-side claimed                          | Medium privacy         | P1                            |
| Wi-Fi QR Generator         | /tools/wifi-qr                  | Marketing & Barcodes  | Generate a QR that joins a Wi-Fi network.                              | Client-side claimed                          | Medium privacy         | P1                            |
| Menu Creator               | /tools/menu-creator             | Marketing & Barcodes  | Create restaurant/shop menu cards.                                     | Client-side document generation likely       | Low                    | P1                            |
| QR & Barcode Scanner       | /tools/qr-barcode-scanner       | Marketing & Barcodes  | Read QR/barcodes from camera or image.                                 | Client-side library likely                   | Medium-high security   | P1                            |
| HSN/SAC Finder             | /tools/hsn-sac-finder           | Billing & Taxes       | Search commodity/service classification codes.                         | Static dataset or API unknown                | High regulatory        | P1                            |
| Area Converter             | /tools/area-converter           | Store Operations      | Convert Indian and metric/imperial land units.                         | Deterministic client-side likely             | High accuracy          | P1                            |
| Business Days Calculator   | /tools/business-days-calculator | Store Operations      | Count working days between dates.                                      | Deterministic client-side likely             | Medium                 | P1                            |
| CAGR Calculator            | /tools/cagr-calculator          | Financial Calculators | Calculate compound annual growth rate.                                 | Deterministic client-side likely             | Low-medium             | P0                            |
| EBITDA Calculator          | /tools/ebitda-calculator        | Financial Calculators | Estimate earnings before interest, tax, depreciation and amortization. | Deterministic client-side likely             | Medium                 | P1                            |
| ROI Calculator             | /tools/roi-calculator           | Financial Calculators | Calculate return on investment.                                        | Deterministic client-side likely             | Low-medium             | P0                            |
| Salary Calculator          | /tools/salary-calculator        | Financial Calculators | Estimate take-home salary after PF, PT and TDS.                        | Deterministic + regulatory data likely       | Very high accuracy     | P2 after policy engine        |
| Currency Converter         | /tools/currency-converter       | Financial Calculators | Convert INR and foreign currencies using claimed real-time rates.      | API-dependent likely                         | Medium data dependency | P2                            |

### Publicly named tools not sufficiently verified

Search snippets and related-tool labels also reference Notice Period Calculator, Late Payment Interest Calculator, WhatsApp Direct Chat & Link, Product Barcode Generator, Google Review QR Generator, GST Margin Calculator, Fuel Expense Calculator and a 4×6 Shipping Label Generator. Some have legacy indexed URLs, but canonical status, current functionality and exact schemas remain **[UNKNOWN]**.

## Part 5 — Page-by-Page Analysis

Because exact DOM order and responsive layouts were not available, this part documents verified purpose, evidence-visible content and required next inspection rather than fabricating section sequences.

| Page                      | Observed purpose                                                                                      | User goal                                                                        | Unknowns/risks                                                                                                                        | Original-product action                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Homepage `/`              | [VERIFIED] Entry point promoting 50+ utilities across calculations, documents, QR/barcodes and media. | Primary audience appears to be Indian small businesses seeking fast, free tools. | Exact hero layout, search behavior, category ordering, popular-tool logic, cards, visual hierarchy and mobile navigation are unknown. | Treat search and task-based entry as the primary action; expose 6–8 P0 tools, categories and a privacy/source trust block before the full directory. |
| About `/about`            | [VERIFIED] Explains the small-business/MSME mission and free browser-based positioning.               | Builds product story and trust.                                                  | Team identity, editorial governance and formula-review ownership are not visible in retrieved evidence.                               | Add named methodology, update process, correction policy and data-processing summary.                                                                |
| Trending `/trending`      | [VERIFIED] Public collection route.                                                                   | Helps users discover popular tools.                                              | Ranking period, event source, privacy treatment and manipulation controls are unknown.                                                | Use aggregated privacy-safe completion counts; disclose period; do not rank by raw views alone.                                                      |
| Favorites `/favorites`    | [VERIFIED] Public collection route.                                                                   | Supports repeat use.                                                             | [POSSIBLE] Browser-local storage is likely because the site emphasizes no server storage; mechanism and clear controls are unknown.   | Use local storage for anonymous users, show a clear local-data notice, and allow one-click clearing.                                                 |
| Blog `/blog`              | [VERIFIED] Content hub.                                                                               | SEO, education and internal linking.                                             | Article inventory, editorial quality, freshness and citations were not exhaustively retrieved.                                        | Publish fewer, source-backed guides linked to relevant tools; avoid thin programmatic content.                                                       |
| FAQ `/faq`                | [VERIFIED] Public FAQ says tools are free.                                                            | Reduces uncertainty.                                                             | Exact questions, accessibility of accordions and freshness are unknown.                                                               | Answer privacy, formula sources, legal limitations, rate updates, PDF storage and error reporting.                                                   |
| Privacy `/privacy-policy` | [VERIFIED] States multiple operations run in the browser.                                             | Critical trust page.                                                             | Cookie list, analytics vendors, retention details, lawful basis and data-subject request process are unknown.                         | Create a tool-by-tool data flow table and analytics property allowlist.                                                                              |
| Terms `/terms`            | [VERIFIED] Terms page indexed.                                                                        | Sets use conditions.                                                             | Exact clauses were not retrieved in sufficient detail.                                                                                | Separate general terms from regulated-tool limitations; prohibit fraudulent document use.                                                            |
| Disclaimer `/disclaimer`  | [VERIFIED] Says outputs are not certified accounting/legal advice.                                    | Risk control.                                                                    | Generic disclaimers cannot compensate for outdated formulas or realistic fake-document outputs.                                       | Place specific limitations adjacent to results and remove risky tools rather than relying on footer text.                                            |
| Contact route             | [VERIFIED] Footer references Contact; exact route/form unverified.                                    | Support and feedback.                                                            | Input fields, spam protection, storage and response handling unknown.                                                                 | Add purpose selector, minimal data collection and dedicated `report-an-error` flow with tool/version context.                                        |
| 404/error page            | [UNKNOWN] Not inspected.                                                                              | Recovery from bad legacy links.                                                  | Behavior, status code and suggestions unknown.                                                                                        | Return true 404, preserve search, show likely tool matches and log the broken referring path without personal data.                                  |

## Part 6 — Tool-by-Tool Analysis

The detailed machine-readable inventory is supplied separately. Exact field names, required states and validation messages are not claimed unless public evidence exposed them.

### 1. GST Calculator

- **URL:** `/tools/gst-calculator`
- **Category:** Billing & Taxes
- **Purpose:** Calculate inclusive/exclusive GST and split CGST/SGST or IGST.
- **Observed or inferable inputs:** Amount; GST rate; inclusive/exclusive mode; tax type/jurisdiction inferred from copy.
- **Observed outputs:** Taxable value; GST; total; CGST/SGST or IGST; PDF/thermal output; optional UPI QR.
- **Processing classification:** **[STRONG INFERENCE]** Deterministic client-side likely
- **Method/source requirement:** Official CBIC/GST Council notifications required; rates must be effective-date aware.
- **Risk:** High
- **Recommended priority:** P0
- **Critical finding:** **[VERIFIED]** Indexed copy advertises 5%, 12%, 18% and 28% presets. Official reforms effective 22 September 2025 primarily moved to 5% and 18%, with a 40% category for specified luxury/sin goods and exceptions. The product must not present old presets as timeless current law.
- **Pseudocode:**

```text
INPUT amount, rate, pricingMode, supplyType
IF exclusive:
  taxable = amount
  tax = round(taxable * rate, policyPrecision)
  total = taxable + tax
ELSE:
  taxable = round(amount / (1 + rate), policyPrecision)
  tax = amount - taxable
  total = amount
IF intrastate:
  cgst = tax / 2
  sgst = tax - cgst
ELSE:
  igst = tax
OUTPUT taxable, components, total, rateVersion, sources
```

### 2. GST Invoice Generator

- **URL:** `/tools/gst-invoice`
- **Category:** Billing & Taxes
- **Purpose:** Create itemized GST invoices.
- **Observed or inferable inputs:** Seller/buyer data, invoice metadata, line items, taxes, UPI details (exact fields unverified).
- **Observed outputs:** A4 or thermal invoice PDF with itemization and optional UPI QR.
- **Processing classification:** **[STRONG INFERENCE]** Client-side document generation likely
- **Method/source requirement:** CGST/SGST/IGST rules; invoice particulars under GST rules.
- **Risk:** High
- **Recommended priority:** P0

### 3. Payment Receipt Generator

- **URL:** `/tools/payment-receipt`
- **Category:** Billing & Taxes
- **Purpose:** Create printable payment receipts.
- **Observed or inferable inputs:** Payer/payee, amount/items, payment mode; exact required fields unverified.
- **Observed outputs:** 58mm/80mm thermal receipt; payment mode such as UPI/Cash/Bank Transfer.
- **Processing classification:** **[STRONG INFERENCE]** Client-side document generation likely
- **Method/source requirement:** No core tax formula unless tax fields are offered.
- **Risk:** Medium
- **Recommended priority:** P0

### 4. Rent Receipt Generator

- **URL:** `/tools/rent-receipt`
- **Category:** Billing & Taxes
- **Purpose:** Create rent receipts.
- **Observed or inferable inputs:** Tenant/landlord, property, rent period, amount likely; exact fields unverified.
- **Observed outputs:** Printable/downloadable receipt presumed from product category; not directly verified.
- **Processing classification:** **[STRONG INFERENCE]** Client-side document generation likely
- **Method/source requirement:** HRA evidence expectations and stamp/PAN caveats must be sourced.
- **Risk:** High
- **Recommended priority:** P1

### 5. Wage Slip Generator

- **URL:** `/tools/wage-slip`
- **Category:** Billing & Taxes
- **Purpose:** Create wage/salary slips for small businesses.
- **Observed or inferable inputs:** Employee, period, earnings/deductions likely; exact fields unverified.
- **Observed outputs:** 80mm thermal wage slip; WhatsApp sharing.
- **Processing classification:** **[STRONG INFERENCE]** Client-side document generation likely
- **Method/source requirement:** Payroll deductions must be explicitly configured and sourced if calculated.
- **Risk:** High
- **Recommended priority:** P1

### 6. Maintenance Invoice

- **URL:** `/tools/maintenance-invoice`
- **Category:** Billing & Taxes
- **Purpose:** Create maintenance/service invoices.
- **Observed or inferable inputs:** Issuer, customer, service lines, charges likely; exact fields unverified.
- **Observed outputs:** Invoice document; format unverified.
- **Processing classification:** **[STRONG INFERENCE]** Client-side document generation likely
- **Method/source requirement:** GST treatment depends on service and registration context.
- **Risk:** High
- **Recommended priority:** P1

### 7. Electricity Bill Simulator

- **URL:** `/tools/electricity-bill`
- **Category:** Billing & Taxes
- **Purpose:** Generate a simulated electricity-bill style document.
- **Observed or inferable inputs:** Consumer/billing fields unverified.
- **Observed outputs:** Mock bill/receipt; disclaimer says not for legal or commercial use.
- **Processing classification:** **[STRONG INFERENCE]** Template-based client-side likely
- **Method/source requirement:** No real tariff calculation verified.
- **Risk:** Very high misuse
- **Recommended priority:** Do not build without redesign
- **Trust decision:** **[RECOMMENDATION]** Exclude from the original product. A footer disclaimer is not enough if the generated artefact visually resembles a genuine provider bill.

### 8. Mobile Bill Simulator

- **URL:** `/tools/mobile-bill`
- **Category:** Billing & Taxes
- **Purpose:** Generate a simulated mobile-bill style document.
- **Observed or inferable inputs:** Subscriber/billing fields unverified.
- **Observed outputs:** Mock mobile bill.
- **Processing classification:** **[STRONG INFERENCE]** Template-based client-side likely
- **Method/source requirement:** No carrier billing integration verified.
- **Risk:** Very high misuse
- **Recommended priority:** Do not build without redesign
- **Trust decision:** **[RECOMMENDATION]** Exclude from the original product. A footer disclaimer is not enough if the generated artefact visually resembles a genuine provider bill.

### 9. Broadband Bill Simulator

- **URL:** `/tools/broadband-bill?lang=en`
- **Category:** Billing & Taxes
- **Purpose:** Generate a simulated broadband-bill style document.
- **Observed or inferable inputs:** Subscriber/billing fields unverified.
- **Observed outputs:** Mock broadband bill.
- **Processing classification:** **[STRONG INFERENCE]** Template-based client-side likely
- **Method/source requirement:** No ISP billing integration verified.
- **Risk:** Very high misuse
- **Recommended priority:** Do not build without redesign
- **Trust decision:** **[RECOMMENDATION]** Exclude from the original product. A footer disclaimer is not enough if the generated artefact visually resembles a genuine provider bill.

### 10. Letterhead Generator

- **URL:** `/tools/letterhead`
- **Category:** Print & Logistics
- **Purpose:** Create branded business letterheads.
- **Observed or inferable inputs:** Logo, header/business details, reference/content fields.
- **Observed outputs:** A4 printable PDF.
- **Processing classification:** **[STRONG INFERENCE]** Client-side document generation likely
- **Method/source requirement:** No formula; privacy of uploaded logo/content is primary concern.
- **Risk:** Low
- **Recommended priority:** P0

### 11. Logistics Documents

- **URL:** `/tools/logistics-documents`
- **Category:** Print & Logistics
- **Purpose:** Create delivery challans and price/barcode labels.
- **Observed or inferable inputs:** Consignor/consignee, items, shipment data, product/price/barcode values likely.
- **Observed outputs:** Delivery challan and 12-up price-tag sheet.
- **Processing classification:** **[STRONG INFERENCE]** Client-side document generation likely
- **Method/source requirement:** GST/document particulars and barcode standards need separate validation.
- **Risk:** Medium-high
- **Recommended priority:** P1

### 12. Media Suite

- **URL:** `/tools/media-suite`
- **Category:** Media & Images
- **Purpose:** Convert, resize and compress business images.
- **Observed or inferable inputs:** Image upload; output format/size/quality controls likely.
- **Observed outputs:** WebP and resized/compressed image download.
- **Processing classification:** **[VERIFIED]** Client-side verified by public copy
- **Method/source requirement:** No formula; preserve metadata/privacy choices.
- **Risk:** Low
- **Recommended priority:** P1

### 13. Social Post Generator

- **URL:** `/tools/social-post-generator`
- **Category:** Marketing & Barcodes
- **Purpose:** Convert raw notes into social-media copy.
- **Observed or inferable inputs:** Raw notes/content and likely platform/tone; exact fields unverified.
- **Observed outputs:** Instagram/Facebook-ready copy.
- **Processing classification:** **[UNKNOWN]** AI unknown; could be LLM, rules or templates
- **Method/source requirement:** Model/provider and privacy disclosures required if network-based.
- **Risk:** Medium
- **Recommended priority:** P2
- **AI classification:** **[UNKNOWN]** The title/description suggests AI, but no model call, provider or disclosure was observed. It may be LLM-based, rule-based or template-based.

### 14. UPI Standee Generator

- **URL:** `/tools/upi-standee`
- **Category:** Marketing & Barcodes
- **Purpose:** Create a printable UPI payment standee.
- **Observed or inferable inputs:** UPI ID, payee name, optional amount/branding likely.
- **Observed outputs:** QR standee/printable document.
- **Processing classification:** **[STRONG INFERENCE]** Client-side QR/document generation likely
- **Method/source requirement:** NPCI UPI deep-link format; validate payee/amount encoding.
- **Risk:** Medium
- **Recommended priority:** P0

### 15. URL QR Generator

- **URL:** `/tools/url-qr`
- **Category:** Marketing & Barcodes
- **Purpose:** Generate branded QR codes for URLs.
- **Observed or inferable inputs:** URL, color, size.
- **Observed outputs:** PNG/SVG QR.
- **Processing classification:** **[VERIFIED]** Client-side claimed
- **Method/source requirement:** QR standard and URL validation.
- **Risk:** Low-medium
- **Recommended priority:** P0

### 16. vCard QR Generator

- **URL:** `/tools/vcard-qr`
- **Category:** Marketing & Barcodes
- **Purpose:** Encode contact details into a vCard QR.
- **Observed or inferable inputs:** Name/contact/company/address fields likely; exact version unverified.
- **Observed outputs:** Contact QR image.
- **Processing classification:** **[VERIFIED]** Client-side claimed
- **Method/source requirement:** vCard format version and escaping rules.
- **Risk:** Medium privacy
- **Recommended priority:** P1

### 17. Wi-Fi QR Generator

- **URL:** `/tools/wifi-qr`
- **Category:** Marketing & Barcodes
- **Purpose:** Generate a QR that joins a Wi-Fi network.
- **Observed or inferable inputs:** SSID, security type, password, hidden-network flag likely.
- **Observed outputs:** Wi-Fi QR using WIFI payload syntax.
- **Processing classification:** **[VERIFIED]** Client-side claimed
- **Method/source requirement:** Escaping rules for special characters are essential.
- **Risk:** Medium privacy
- **Recommended priority:** P1

### 18. Menu Creator

- **URL:** `/tools/menu-creator`
- **Category:** Marketing & Barcodes
- **Purpose:** Create restaurant/shop menu cards.
- **Observed or inferable inputs:** Business identity, sections/items/prices, style fields likely.
- **Observed outputs:** Menu document/image/PDF; exact export unverified.
- **Processing classification:** **[STRONG INFERENCE]** Client-side document generation likely
- **Method/source requirement:** No formula.
- **Risk:** Low
- **Recommended priority:** P1

### 19. QR & Barcode Scanner

- **URL:** `/tools/qr-barcode-scanner`
- **Category:** Marketing & Barcodes
- **Purpose:** Read QR/barcodes from camera or image.
- **Observed or inferable inputs:** Camera or uploaded image presumed; not directly verified.
- **Observed outputs:** Decoded value/action.
- **Processing classification:** **[STRONG INFERENCE]** Client-side library likely
- **Method/source requirement:** Permission, malicious URL and privacy safeguards required.
- **Risk:** Medium-high security
- **Recommended priority:** P1

### 20. HSN/SAC Finder

- **URL:** `/tools/hsn-sac-finder`
- **Category:** Billing & Taxes
- **Purpose:** Search commodity/service classification codes.
- **Observed or inferable inputs:** Keyword or code likely.
- **Observed outputs:** Matching HSN/SAC codes/descriptions.
- **Processing classification:** **[UNKNOWN]** Static dataset or API unknown
- **Method/source requirement:** Official tariff/CBIC dataset with version date required.
- **Risk:** High regulatory
- **Recommended priority:** P1

### 21. Area Converter

- **URL:** `/tools/area-converter`
- **Category:** Store Operations
- **Purpose:** Convert Indian and metric/imperial land units.
- **Observed or inferable inputs:** Value, source unit, target unit; region selector not observed.
- **Observed outputs:** Converted value across Bigha/Katha/Gaj/Acre/Hectare/sq ft/Guntha.
- **Processing classification:** **[STRONG INFERENCE]** Deterministic client-side likely
- **Method/source requirement:** Regional definitions required for Bigha/Katha.
- **Risk:** High accuracy
- **Recommended priority:** P1
- **Critical finding:** Bigha and Katha are not universal constants. Require a state/region definition before conversion, display the factor used and never silently default.

### 22. Business Days Calculator

- **URL:** `/tools/business-days-calculator`
- **Category:** Store Operations
- **Purpose:** Count working days between dates.
- **Observed or inferable inputs:** Start/end date; weekend/holiday configuration unverified.
- **Observed outputs:** Working-day count.
- **Processing classification:** **[STRONG INFERENCE]** Deterministic client-side likely
- **Method/source requirement:** Calendar rules and holiday dataset must be disclosed.
- **Risk:** Medium
- **Recommended priority:** P1

### 23. CAGR Calculator

- **URL:** `/tools/cagr-calculator`
- **Category:** Financial Calculators
- **Purpose:** Calculate compound annual growth rate.
- **Observed or inferable inputs:** Beginning value, ending value, period.
- **Observed outputs:** Annualized percentage growth.
- **Processing classification:** **[STRONG INFERENCE]** Deterministic client-side likely
- **Method/source requirement:** (Ending/Beginning)^(1/n)-1.
- **Risk:** Low-medium
- **Recommended priority:** P0
- **Pseudocode:** `cagr = (ending / beginning) ** (1 / years) - 1`; reject beginning ≤ 0 and years ≤ 0; explain that CAGR smooths volatility.

### 24. EBITDA Calculator

- **URL:** `/tools/ebitda-calculator`
- **Category:** Financial Calculators
- **Purpose:** Estimate earnings before interest, tax, depreciation and amortization.
- **Observed or inferable inputs:** Revenue/expenses or net income adjustments; exact mode unverified.
- **Observed outputs:** EBITDA and possibly margin.
- **Processing classification:** **[STRONG INFERENCE]** Deterministic client-side likely
- **Method/source requirement:** Clearly define accounting inputs and exclusions.
- **Risk:** Medium
- **Recommended priority:** P1

### 25. ROI Calculator

- **URL:** `/tools/roi-calculator`
- **Category:** Financial Calculators
- **Purpose:** Calculate return on investment.
- **Observed or inferable inputs:** Investment cost and gain/value.
- **Observed outputs:** ROI percentage and possibly profit.
- **Processing classification:** **[STRONG INFERENCE]** Deterministic client-side likely
- **Method/source requirement:** (Gain-Cost)/Cost × 100; disclose time-value limitation.
- **Risk:** Low-medium
- **Recommended priority:** P0
- **Pseudocode:** `roi = (gain - cost) / cost * 100`; reject cost = 0; distinguish gross value from net gain.

### 26. Salary Calculator

- **URL:** `/tools/salary-calculator`
- **Category:** Financial Calculators
- **Purpose:** Estimate take-home salary after PF, PT and TDS.
- **Observed or inferable inputs:** Salary components and deductions likely; FY/state/regime not verified.
- **Observed outputs:** Take-home salary and deduction breakdown.
- **Processing classification:** **[STRONG INFERENCE]** Deterministic + regulatory data likely
- **Method/source requirement:** Income-tax FY/regime, EPF wage definition, state PT and cess/surcharge rules.
- **Risk:** Very high accuracy
- **Recommended priority:** P2 after policy engine
- **Trust decision:** **[RECOMMENDATION]** Defer until a versioned policy engine supports financial year, regime, state professional tax, EPF assumptions and full calculation explanations.

### 27. Currency Converter

- **URL:** `/tools/currency-converter`
- **Category:** Financial Calculators
- **Purpose:** Convert INR and foreign currencies using claimed real-time rates.
- **Observed or inferable inputs:** Amount, source currency, target currency.
- **Observed outputs:** Converted amount/rate.
- **Processing classification:** **[STRONG INFERENCE]** API-dependent likely
- **Method/source requirement:** Provider, timestamp, rate type and cache/fallback must be shown.
- **Risk:** Medium data dependency
- **Recommended priority:** P2
- **Data requirement:** Show provider, quote timestamp, base/target direction, cache age, indicative-rate disclaimer and stale-data behavior.

## Part 7 — Information Architecture

### Current structure

- **[VERIFIED]** Public labels group tools under Billing & Taxes, Marketing & Barcodes, Print & Logistics, Store Operations and Media & Images.
- **[VERIFIED]** Trending and Favorites provide alternate discovery paths.
- **[VERIFIED]** Related-tool labels appear in search snippets.
- **[UNKNOWN]** On-site search quality, filtering, category pages, breadcrumb consistency and mobile menu behavior were not directly tested.

### Problems

- Categories mix user jobs, output types and technical formats. “Marketing & Barcodes” combines campaign copy, QR codes and scanning; “Store Operations” includes both date and land calculators.
- Duplicate/legacy slugs mean the URL system is not the sole source of truth.
- The product lacks an evidence-visible browse path by business job: get paid, issue a document, price a product, calculate returns, prepare compliance data.
- A 50–60-tool homepage can become a card wall unless search and prioritization are strong.

### Recommended original sitemap

```text
/
├── tools
│   ├── search
│   ├── calculate
│   │   ├── gst-calculator
│   │   ├── cagr-calculator
│   │   ├── roi-calculator
│   │   └── ...
│   ├── generate
│   │   ├── gst-invoice
│   │   ├── payment-receipt
│   │   ├── letterhead
│   │   └── ...
│   ├── qr-and-barcode
│   │   ├── upi-standee
│   │   ├── url-qr
│   │   └── ...
│   └── media
├── categories/[slug]
├── collections
│   ├── retail-shop
│   ├── freelancer
│   ├── service-business
│   └── startup
├── methodology
├── sources
├── guides
├── about
├── faq
├── contact
├── report-an-error
├── privacy
├── terms
└── disclaimer
```

**[RECOMMENDATION]** A user should reach a tool through search, category or business collection in no more than three meaningful actions. Recently used and favorites should stay browser-local unless the user deliberately creates an account.

## Part 8 — UI and Design System

### What could be verified

**[UNKNOWN]** Exact colors, fonts, spacing scale, container widths, breakpoints, radii, shadows, icon library, chart styling and component dimensions could not be responsibly extracted. No HEX values are reported.

### Recommended original design direction

| Token group | Recommendation                                                                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color       | Neutral light surfaces, dark high-contrast text, one restrained trustworthy accent, semantic success/warning/error tokens. Do not reuse benchmark brand colors.   |
| Typography  | System-first or a licensed variable sans; 16 px minimum body, 1.5–1.65 line-height, clear numeric tabular variant for financial results.                          |
| Layout      | Mobile-first 16 px gutters; 720–800 px reading width; 1120–1200 px tool shell; one-column form under tablet; optional sticky result summary only on wide screens. |
| Spacing     | 4/8 px-based scale; 16–24 px component gaps; 48–72 px section rhythm.                                                                                             |
| Controls    | Minimum 44 px touch target; 48 px standard input height; visible focus ring; explicit units and prefixes/suffixes.                                                |
| Cards       | Use for tool discovery and result groups, not every paragraph. Borders over heavy shadows.                                                                        |
| Results     | Headline answer, calculation breakdown, interpretation, assumptions, source/effective date and next action.                                                       |
| Print       | Dedicated A4/58 mm/80 mm style sheets; no navigation/ads; avoid clipped tables and raster text.                                                                   |
| Charts      | Optional enhancement only; always pair with a table/text summary.                                                                                                 |
| Motion      | Minimal, functional and reduced-motion aware.                                                                                                                     |

### Core component inventory for the new platform

| Component     | Purpose                                                          | Variants/states                              | Accessibility requirement                                        |
| ------------- | ---------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| Header        | Desktop/mobile navigation, search trigger, no forced account CTA | Default, compact, mobile drawer              | Skip link; focus trap in drawer; Esc close                       |
| ToolSearch    | Find by tool, synonym or job                                     | Idle, typing, loading, results, no result    | Combobox pattern; keyboard selection                             |
| ToolCard      | Name, purpose, category, privacy/data badge                      | Default, featured, recent, disabled          | Entire card not ambiguously nested; descriptive link             |
| Field         | Label, value, unit, help and error                               | Default, focus, invalid, disabled, read-only | Label association; error ID; input mode                          |
| CurrencyField | Indian grouping without corrupting raw value                     | Empty, formatted, negative-disallowed        | Screen-reader friendly unformatted value strategy                |
| ResultCard    | Primary result and breakdown                                     | Success, warning, stale, partial             | Live region only when appropriate                                |
| SourceBlock   | Method, source, effective date, last review                      | Collapsed/expanded                           | Real link text; not hidden behind tooltip                        |
| PrintPreview  | Document preview and page controls                               | A4/58/80 mm, overflow warning                | Keyboard zoom controls; textual status                           |
| PrivacyBadge  | Local-only/API/AI disclosure                                     | Local, external data, saved account          | Plain language, not icon-only                                    |
| ErrorSummary  | List of invalid fields                                           | Visible after submit                         | Focus on submit; links to fields                                 |
| Toast         | Non-critical confirmation                                        | Success, info, failure                       | Does not disappear too quickly; no critical errors only in toast |
| Modal         | Confirmation, source details                                     | Default, destructive                         | Focus trap, labelled title, restore focus                        |

## Part 9 — UX Analysis

### Provisional user journeys

| Journey                | Likely steps                            | Risk                                                                  | Recommended improvement                                                                      |
| ---------------------- | --------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Discover from homepage | Homepage → tool                         | Card overload and unclear priority if 50+ tools are surfaced equally. | Prominent search; 6–8 popular tools; job-based categories; privacy/source trust.             |
| Browse by category     | Category → tool                         | Mixed category logic may make related tools difficult to predict.     | Use stable task categories and cross-tag business type.                                      |
| Complete calculator    | Open → input → calculate → interpret    | Formula/source assumptions may be invisible.                          | Progressive fields, defaults with explanation, result assumptions and worked example.        |
| Generate document      | Enter identity/items → preview → export | Long forms on mobile; accidental data loss; print mismatch.           | Sectioned form, autosave local draft, preview, print diagnostics and clear-data control.     |
| Correct invalid input  | Submit → error → repair                 | Unknown current behavior.                                             | Focus error summary, preserve values, field-linked messages.                                 |
| Download/print         | Result → preview → export               | Browser PDF/print variance; thermal clipping.                         | Dedicated print CSS, page-size selection, snapshot tests.                                    |
| Use mobile             | Search → form → result → share          | Keyboard overlap, dense tables and repeated scrolling.                | Single column, numeric input modes, sticky calculate only when safe, compact result summary. |
| Move to related tool   | Result → related tool                   | Generic related links may not preserve context.                       | Explain relation and offer safe value transfer only with consent.                            |
| Return to tool         | Favorites/recent                        | Storage behavior may be unclear.                                      | Local history disclosure and clear controls.                                                 |

### Provisional evidence-based scores

| Dimension          | Score            | Explanation                                                                                              |
| ------------------ | ---------------- | -------------------------------------------------------------------------------------------------------- |
| Discoverability    | 7/10             | Many indexed tool pages and category labels, but route duplication and catalogue breadth reduce clarity. |
| Ease of use        | 6/10             | Free/no-account positioning is strong; field-level friction was not tested.                              |
| Input clarity      | Not scored       | No direct form inspection.                                                                               |
| Output usefulness  | 8/10             | A4/thermal/PDF/PNG/SVG/WhatsApp formats are practical.                                                   |
| Mobile usability   | Not scored       | No viewport interaction.                                                                                 |
| Trust              | 5/10             | Privacy and disclaimers help; rate freshness and mock-bill tools hurt.                                   |
| Accessibility      | Not scored       | No direct audit.                                                                                         |
| Speed              | Not scored       | Local processing suggests potential speed, but bundles and runtime were not measured.                    |
| Visual design      | Not scored       | No reliable visual capture.                                                                              |
| Overall usefulness | 7/10 provisional | Broad practical value, especially for small businesses, but governance must improve.                     |

## Part 10 — Frontend Analysis

| Technology/behavior                      | Classification                       | Evidence                                                                                                      | Confidence |
| ---------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ---------- |
| React                                    | [VERIFIED — owner disclosure]        | Creator publicly states React.                                                                                | High       |
| TypeScript                               | [VERIFIED — owner disclosure]        | Creator publicly states TypeScript.                                                                           | High       |
| Vite                                     | [VERIFIED — owner disclosure]        | Creator publicly states Vite.                                                                                 | High       |
| Vercel                                   | [VERIFIED — owner disclosure]        | Creator publicly states Vercel deployment.                                                                    | High       |
| Client-side processing                   | [VERIFIED for many named operations] | Owner statement plus privacy copy says calculations, image work, QR/barcodes and PDF receipts run in browser. | High       |
| Single-page application behavior         | [STRONG INFERENCE]                   | React+Vite and JS-heavy retrieval pattern are consistent with SPA routing.                                    | Medium     |
| Per-route pre-rendering/dynamic metadata | [POSSIBLE]                           | Search index contains many route-specific titles/snippets despite JS-heavy public retrieval.                  | Low-medium |
| Form library                             | [UNKNOWN]                            | No bundle/source inspection.                                                                                  | Unknown    |
| Validation library                       | [UNKNOWN]                            | No bundle/source inspection.                                                                                  | Unknown    |
| State management                         | [UNKNOWN]                            | No bundle/source inspection.                                                                                  | Unknown    |
| PDF library                              | [UNKNOWN]                            | PDF output is advertised, library not visible.                                                                | Unknown    |
| QR/barcode library                       | [UNKNOWN]                            | QR/barcode output is advertised, library not visible.                                                         | Unknown    |
| Analytics                                | [UNKNOWN]                            | No network/cookie inspection.                                                                                 | Unknown    |
| Favorites storage                        | [POSSIBLE localStorage]              | Favorites route plus no-server positioning; not verified.                                                     | Low        |

### Recommended frontend architecture

- **Framework:** Next.js App Router with TypeScript, using server-rendered/static content shells and client components only for tools. This improves indexable content and reduces all-or-nothing JavaScript dependence.
- **Tool registry:** One typed metadata source generates routes, categories, sitemap, breadcrumbs, related tools, SEO, sources and analytics policy.
- **Forms:** React Hook Form plus Zod; domain calculations do not depend on form state.
- **Calculation engine:** Pure TypeScript functions using decimal-safe arithmetic where paise-level accuracy matters.
- **Policy engine:** Effective-dated JSON/TypeScript records for GST and later payroll rules; no timeless magic constants.
- **State:** URL only for non-sensitive shareable parameters; local storage for explicit favorites/drafts; no sensitive values in query strings.
- **Print/export:** Print CSS first; browser PDF for simple documents; server rendering only when deterministic cross-browser output cannot be achieved.
- **Internationalization:** English-first with Hindi-ready message keys, Indian numbering/date formats and future regional-language expansion.
- **Testing:** Vitest unit/property tests, Playwright journeys and print snapshots, axe integration.

## Part 11 — Backend and Infrastructure Analysis

### Publicly supportable conclusions

- **[VERIFIED — owner disclosure]** Deployed on Vercel.
- **[VERIFIED for described operations]** Many tools process data entirely in the browser and do not require server storage.
- **[UNKNOWN]** Backend framework, database, object storage, authentication, admin CMS, CI/CD, error monitoring, logs and backup systems.
- **[STRONG INFERENCE]** Deterministic calculators, QR generators and image transforms can operate without a proprietary backend.
- **[STRONG INFERENCE]** The real-time currency converter requires an external or server-proxied rate source unless rates are bundled and therefore not actually real-time.
- **[UNKNOWN]** Whether the social-post generator calls a model API, local rules or templates.

### Option A — Lean MVP

| Layer        | Choice                                | Why                                                      |
| ------------ | ------------------------------------- | -------------------------------------------------------- |
| Hosting      | Vercel or Cloudflare Pages            | Static/content routes plus client tools; low operations. |
| Frontend     | Next.js + TypeScript                  | SEO content and interactive tools in one codebase.       |
| Data         | Versioned source files in repository  | Auditable formulas/rates for initial tool set.           |
| Storage      | Browser local storage only            | Favorites and explicit drafts without accounts.          |
| PDF          | Client print/PDF                      | No document data leaves device.                          |
| Analytics    | Privacy-conscious, allowlisted events | Measure use without financial values.                    |
| Admin        | Git-based editorial review            | Small team; pull-request audit trail.                    |
| Cost profile | Low                                   | Mostly bandwidth/builds; no always-on database.          |

### Option B — Scalable production

| Layer          | Choice                                                   | Purpose                                                                             |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| API            | Next.js server routes or separate Fastify/NestJS service | Accounts, policy retrieval, document jobs and integrations.                         |
| Database       | PostgreSQL                                               | Users, business profiles, documents, subscriptions, source versions and audit logs. |
| Authentication | Passkeys/email OTP through a managed provider            | Low-friction sign-in; basic tools remain anonymous.                                 |
| Object storage | S3-compatible, encrypted                                 | Explicitly saved exports only; signed URLs and retention.                           |
| Queue          | Managed queue                                            | PDF generation, email/WhatsApp notifications and imports.                           |
| Admin          | Role-based content/policy console                        | Four-eyes review, versioning and rollback.                                          |
| Observability  | Error tracking, structured logs, metrics                 | Redacted telemetry and alerting.                                                    |
| Rate limiting  | Edge and account-level                                   | Protect APIs and AI costs.                                                          |
| Backups        | Point-in-time DB plus tested restore                     | Operational resilience.                                                             |
| Cost profile   | Medium and usage-linked                                  | Only justified after saved data, teams or paid plans.                               |

### Architecture decision

**[RECOMMENDATION]** Launch Option A. Add the database only when saved business profiles, reusable customers, team workspaces or administrative policy editing have demonstrated demand.

## Part 12 — APIs and External Services

| API/service                   | Classification                            | Likely method                    | Inputs                            | Response                         | Authentication | Evidence                      | Confidence |
| ----------------------------- | ----------------------------------------- | -------------------------------- | --------------------------------- | -------------------------------- | -------------- | ----------------------------- | ---------- |
| Currency rates                | [STRONG INFERENCE] external data required | GET likely                       | Base, quote, amount               | Rate, timestamp, converted value | Unknown        | No provider/endpoint observed | Medium     |
| Social-post generation        | [UNKNOWN]                                 | Unknown                          | Raw notes, platform/tone possibly | Generated copy                   | Unknown        | Feature name/copy only        | Low        |
| Analytics                     | [UNKNOWN]                                 | Event posts likely if present    | Tool/event metadata               | Acknowledgement                  | Unknown        | No network inspection         | Unknown    |
| Contact form                  | [UNKNOWN]                                 | POST likely                      | Contact details/message           | Success/error                    | Unknown        | Footer label only             | Low        |
| All deterministic calculators | [VERIFIED/strongly supported client-side] | None required                    | Browser form state                | Browser-calculated result        | None           | Owner/privacy claims          | High       |
| QR/media/PDF tools            | [VERIFIED for local-processing claim]     | None required for core transform | Browser data/files                | Local output                     | None           | Privacy copy                  | High       |

### Proposed API contracts

```http
GET /api/v1/policies/gst?date=2026-08-06
200 {
  "version": "gst-2026-02-01",
  "effectiveFrom": "2026-02-01",
  "rates": [...],
  "sources": [...]
}
```

```http
GET /api/v1/fx/quote?base=INR&quote=USD
200 {
  "base": "INR",
  "quote": "USD",
  "rate": "0.0119",
  "asOf": "2026-08-06T00:00:00Z",
  "provider": "Named Provider",
  "indicative": true,
  "cacheAgeSeconds": 900
}
```

```http
POST /api/v1/feedback/calculation
{
  "toolId": "gst-calculator",
  "toolVersion": "1.3.0",
  "policyVersion": "gst-2026-02-01",
  "category": "incorrect-result",
  "description": "User-supplied explanation without financial values by default"
}
```

**[RECOMMENDATION]** Do not create server calculation endpoints for formulas that can be safely and accurately executed locally. Use APIs for versioned policy distribution, dynamic public data, account persistence and explicitly requested server jobs.

## Part 13 — AI Analysis

| Feature               | Classification                     | Evidence                                                                                    | Risk                                              | Decision                                                      |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| Social Post Generator | Unknown                            | The public title/description uses AI-oriented language; no model request/provider observed. | Could be LLM, rules or templates.                 | Do not claim AI until disclosed; show data flow and fallback. |
| Calculators           | Standard deterministic calculation | Arithmetic and formulas do not require AI.                                                  | LLM would add cost and error.                     | Keep deterministic.                                           |
| HSN/SAC search        | Unknown/search problem             | Could be keyword or semantic search.                                                        | LLM could hallucinate codes.                      | Use official dataset search; AI only reranks with citations.  |
| Result explanation    | Absent/unverified                  | No evidence-visible AI explanation.                                                         | Useful if grounded in exact deterministic output. | P2 with source citations and fixed facts.                     |

### Recommended AI opportunities

| Opportunity                       | Problem                                                  | Input                                       | Output                        | Grounding                                                       | Guardrails/fallback                                                                 |
| --------------------------------- | -------------------------------------------------------- | ------------------------------------------- | ----------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Plain-language result explanation | Users understand what a result means                     | Typed deterministic result + policy version | Explanation with source links | Retrieval from approved source register; no arithmetic by model | Show formula output as immutable facts; citation check; non-AI explanation template |
| Natural-language tool search      | Users describe a job instead of knowing a tool name      | Short query                                 | Ranked tool suggestions       | Tool metadata only                                              | Do not answer legal questions; route to tools/guides                                |
| Document wording assistant        | Help with invoice notes, payment terms or marketing copy | Non-sensitive prompt                        | Editable draft                | Prompt templates and safety filters                             | No silent retention; label AI; user review                                          |
| Compliance checklist              | Create a task list, not legal conclusion                 | Business context                            | Cited checklist               | Official documents indexed by effective date                    | Jurisdiction/date required; prominent verification notice                           |

## Part 14 — Formula and Accuracy Audit

| Tool                     | Formula/rule                                                                                                                                                                                                         | Independent test                                                                                        | Website result                                | Verdict                                                                                       | Required source                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| GST Calculator           | Exclusive: tax = taxable × rate; total = taxable + tax. Inclusive: taxable = gross ÷ (1 + rate); tax = gross - taxable. Intra-state split normally divides applicable GST into CGST and SGST; inter-state uses IGST. | ₹1,000 exclusive at 18% => ₹180 tax, ₹1,180 total. ₹1,180 inclusive at 18% => ₹1,000 taxable, ₹180 tax. | Not interactively observed                    | Cannot verify calculation; advertised fixed rate choices appear outdated for 2026 default UX. | GST Council 56th meeting/PIB reform communications effective 22 Sep 2025; subsequent official updates. |
| CAGR Calculator          | CAGR = (ending value ÷ beginning value)^(1/years) - 1.                                                                                                                                                               | ₹100,000 to ₹161,051 over 5 years ≈ 10.00%.                                                             | Not interactively observed                    | Expected standard formula; implementation/rounding unverified.                                | Standard financial mathematics; document formula and edge cases.                                       |
| ROI Calculator           | ROI = (gain from investment - investment cost) ÷ investment cost × 100.                                                                                                                                              | Cost ₹100,000; final gain/value ₹125,000 => ROI 25%.                                                    | Not interactively observed                    | Expected standard formula; timing/cash-flow limitations must be disclosed.                    | Standard financial ratio definition.                                                                   |
| EBITDA Calculator        | Either operating approach: revenue - operating expenses excluding interest, tax, depreciation and amortization; or reconciliation: net income + I + T + D + A.                                                       | Revenue ₹10,00,000; eligible operating costs ₹6,50,000 => EBITDA ₹3,50,000.                             | Not interactively observed                    | Cannot verify because input model is not publicly visible.                                    | Accounting policy definitions must be explicit.                                                        |
| Area Converter           | Stable SI/imperial conversions can be fixed; Guntha commonly 1,089 sq ft. Bigha and Katha are region-dependent and must not use one universal factor.                                                                | 1 acre = 43,560 sq ft; 40 guntha = 1 acre if using 1,089 sq ft per guntha.                              | Snippet exposes units but not regional logic. | Potentially misleading unless region is required and definitions are shown.                   | Use state land-record/revenue references for local units.                                              |
| Salary Calculator        | Take-home depends on FY tax regime, taxable components, standard deduction, surcharge/cess, EPF wage definition, employer policy and state professional tax.                                                         | No universal test case is valid without state, FY, regime and salary structure.                         | Not interactively observed                    | Cannot verify; high regulatory risk.                                                          | Income Tax Department, EPFO and state PT notifications.                                                |
| Business Days Calculator | Count dates excluding configured weekends and optionally a declared holiday calendar.                                                                                                                                | Result varies by inclusion rules, weekend pattern and holiday dataset.                                  | Not interactively observed                    | Cannot verify; methodology must be shown.                                                     | Product-defined calendar plus explicit holiday source.                                                 |
| Currency Converter       | converted = amount × quoted rate; rate must have provider, timestamp and direction.                                                                                                                                  | Cannot create a durable expected value for a real-time rate.                                            | Claims real-time rates; no provider observed. | API/provider and freshness unknown.                                                           | Named FX provider and timestamp required.                                                              |

### GST policy finding

**[VERIFIED]** The indexed GST calculator description exposes 5%, 12%, 18% and 28% presets. Official GST Council/PIB material states that changes generally took effect on 22 September 2025 and describes the revised structure as primarily 5% and 18%, with a 40% rate for specified luxury/sin goods and exceptions. Therefore:

- A 2026 calculator should not present 12% and 28% as ordinary timeless default slabs.
- Historical invoices may still need rates valid before the reform date.
- Category-specific and later notifications must override any simplified headline structure.
- The engine needs transaction date, policy version and source metadata.
- The UI should say “common current rates” rather than imply that a short list covers every supply.

### Required verification workflow

1. Define the legal/business question precisely.
2. Record authoritative source, notification identifier, effective date and scope.
3. Encode policy separately from UI.
4. Create independent golden examples.
5. Add boundary and historical-date tests.
6. Obtain subject-matter review for high-risk tools.
7. Publish the source and last-reviewed date.
8. Provide a report-error workflow that captures tool and policy version.

## Part 15 — Security and Privacy

| Area                | Observation                                                                                                                                           | Required control                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| HTTPS               | [VERIFIED] Target is served under HTTPS URL.                                                                                                          | Certificate details/HSTS not inspected.                                              |
| Local processing    | [VERIFIED for many operations by public disclosure] Calculations, QR/barcode rendering, image compression and PDF receipts described as browser-side. | Need tool-specific data-flow accuracy.                                               |
| Server storage      | [VERIFIED — owner disclosure] Creator says no data stored on servers.                                                                                 | Cannot independently verify logs, analytics or external API payloads.                |
| Security headers    | [UNKNOWN]                                                                                                                                             | Inspect CSP, HSTS, frame-ancestors, nosniff, Referrer-Policy and Permissions-Policy. |
| Cookies/analytics   | [UNKNOWN]                                                                                                                                             | Publish vendor list, cookie purpose and event allowlist.                             |
| Uploads             | [UNKNOWN]                                                                                                                                             | Validate file signatures, dimensions and resource limits even client-side.           |
| Document misuse     | [VERIFIED product risk] Mock bill tools exist with disclaimers.                                                                                       | Remove or make unmistakably fictional; terms alone are insufficient.                 |
| QR scanner          | [UNKNOWN]                                                                                                                                             | Never auto-open decoded links; expose scheme/domain and warnings.                    |
| AI prompt injection | [UNKNOWN until AI confirmed]                                                                                                                          | Ground only approved sources; isolate user content from instructions.                |

### Threat model for the proposed platform

| Threat                      | Impact                                          | Protection                                                                                       |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| XSS through document fields | Stored or reflected script in preview/PDF       | Treat text as text, sanitize rich content, CSP, no unsafe HTML.                                  |
| Formula tampering           | Incorrect policy/source update                  | Signed/reviewed policy versions, four-eyes approval, audit log, golden tests.                    |
| Malicious image/file        | Memory exhaustion or parser exploit             | Content sniffing, size/dimension limits, safe libraries, worker isolation.                       |
| QR abuse                    | Phishing URL opened from scan                   | Preview decoded value, no auto-navigation, scheme allowlist, warning.                            |
| Sensitive telemetry         | Amounts/IDs leak to analytics or errors         | Strict event schema, redaction tests, no form-state breadcrumbs.                                 |
| Predictable documents       | Saved private PDF exposed                       | Local default; otherwise signed unguessable URLs, short expiry, access control.                  |
| API scraping                | FX/AI costs or dataset extraction               | Rate limits, caching, quotas, abuse monitoring.                                                  |
| Broken access control       | User accesses another business profile/document | Object-level authorization tests and tenant scoping.                                             |
| AI hallucination            | Incorrect compliance guidance                   | Deterministic facts, citations, source retrieval, constrained output, human verification notice. |

## Part 16 — Performance

### Direct measurements

**[UNKNOWN]** LCP, INP, CLS, TTFB, transfer size, JavaScript size and Lighthouse scores were not measured. Any exact metric would be invented.

### Architecture-based risks

| Risk                          | Why it matters                                               | Action                                                                                       |
| ----------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Large single Vite bundle      | A 60+ tool SPA can ship code for tools the user never opens. | Route-level lazy loading; split heavy PDF/image/chart libraries.                             |
| Client-only content rendering | Slow devices may wait for JS and SEO content can be fragile. | Pre-render tool descriptions and sources; hydrate only forms.                                |
| PDF/image libraries           | Large parsers and canvas work can block main thread.         | Dynamic import; Web Workers; file-size limits; progress state.                               |
| Fonts                         | Multiple webfont weights delay text.                         | System/variable font; preload only critical file; `font-display: swap`.                      |
| Charts                        | Unnecessary charts add bundle and rendering cost.            | Use only where insight improves; lazy load.                                                  |
| Third-party scripts           | Analytics/ads can hurt privacy and INP.                      | One privacy-conscious analytics script; defer; no ad scripts in MVP.                         |
| Large tool directory          | Many cards/images can create DOM and layout cost.            | Server render concise list; paginate/filter only when needed; no decorative images per card. |

### Performance budgets for the new platform

| Metric/budget    | Target                                                                       |
| ---------------- | ---------------------------------------------------------------------------- |
| LCP              | ≤2.5 s at p75 on mobile field data                                           |
| INP              | ≤200 ms at p75                                                               |
| CLS              | ≤0.1                                                                         |
| Initial JS       | Aim <150 kB compressed for content/tool shell; heavy libraries route-loaded  |
| Route transition | Useful content immediately; calculation response <100 ms for ordinary inputs |
| Image upload     | Explicit limit; processing off main thread where practical                   |
| Third-party      | Zero non-essential third-party scripts at first paint                        |

## Part 17 — Accessibility

**[UNKNOWN]** No direct WCAG conformance claim can be made. The following is the mandatory audit and implementation specification.

| Area           | Requirement                                                                                        | Severity |
| -------------- | -------------------------------------------------------------------------------------------------- | -------- |
| Page structure | One H1, ordered headings, header/main/footer landmarks and skip link.                              | Critical |
| Forms          | Visible labels, correct input type/mode, help association, required state and error summary.       | Critical |
| Keyboard       | All controls operable, visible focus, logical order, no keyboard traps.                            | Critical |
| Results        | Announce completion without repeatedly reading the full result; focus management after submit.     | High     |
| Contrast       | 4.5:1 normal text, 3:1 large text and essential UI boundaries.                                     | High     |
| Touch          | At least 44×44 CSS px targets and adequate spacing.                                                | High     |
| Tables         | Captions, header scope and responsive non-destructive alternative.                                 | High     |
| Charts         | Text/table equivalent and no color-only encoding.                                                  | High     |
| Modals/drawers | Labelled, focus trapped, Esc close, focus restored.                                                | High     |
| Print/PDF      | Logical reading order and selectable text where possible.                                          | Medium   |
| Zoom/reflow    | Works at 200% zoom and 320 CSS px without two-dimensional scrolling except legitimate data tables. | High     |
| Motion         | Reduced-motion support; no essential information only in animation.                                | Medium   |

## Part 18 — SEO and Content

### Verified SEO findings

- **[VERIFIED]** A large number of tool pages are indexed with descriptive titles and snippets.
- **[VERIFIED]** Duplicate or legacy routes exist in the index.
- **[VERIFIED]** Several title/path mismatches indicate metadata-route synchronization defects.
- **[UNKNOWN]** Canonicals, robots directives, structured data validity, sitemap completeness, Open Graph data, image alt text and HTTP status behavior were not directly inspected.
- **[STRONG INFERENCE]** Repeated category/footer copy across indexed snippets may contribute to templated or thin-page signals unless each tool page has substantial unique methodology and examples.

### Priority corrections

| Priority | Work                    | Definition                                                                                              |
| -------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| P0       | Canonical consolidation | One indexable URL per tool; 301 all alternate slugs.                                                    |
| P0       | Metadata integrity      | Generate slug, title, H1, canonical and structured data from one record; test in CI.                    |
| P0       | Regulatory freshness    | Visible last-reviewed/effective date and sources for GST, salary, HSN/SAC and legal-document tools.     |
| P1       | Unique tool content     | Introduction, use cases, inputs, method, worked example, limitations, FAQ and related tools.            |
| P1       | Structured data         | BreadcrumbList and accurate WebApplication/SoftwareApplication data; no review schema without evidence. |
| P1       | Internal linking        | Category → tool, tool → methodology/related tools, guides → tool; avoid automated irrelevant links.     |
| P1       | 404 and redirects       | True status codes, useful search recovery and monitored broken-link report.                             |
| P2       | Business collections    | Retail/freelancer/service-business pages only when they contain unique curated guidance.                |
| Avoid    | Thin programmatic pages | Do not generate every state/unit/keyword permutation without distinct value.                            |

### Tool-page content template

1. Clear title and one-sentence purpose. 2. Tool form. 3. Result and interpretation. 4. How to use. 5. Method/formula. 6. Worked example. 7. Assumptions and limitations. 8. Official/authoritative sources. 9. Last reviewed and policy version. 10. FAQ. 11. Related tools. 12. Error-report link. 13. Specific disclaimer.

## Part 19 — Competitive Comparison

| Platform            | Coverage                                                                   | UI/UX position                                          | Accuracy/compliance                          | Mobile                          | SEO                                            | AI                                    | Accounts                         | Pricing position               | Key advantage                                     |
| ------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- | ------------------------------- | ---------------------------------------------- | ------------------------------------- | -------------------------------- | ------------------------------ | ------------------------------------------------- |
| India Biz Tools     | Very broad utilities                                                       | Simple/free positioning; direct interaction not audited | Accuracy governance not consistently visible | Unknown direct test             | Strong indexed footprint but route duplication | One possible AI post tool             | No-account/local-first emphasis  | Free                           | India-specific breadth + thermal/local processing |
| Zoho Invoice        | Invoices, quotes, reminders, expenses, delivery challans, filing support   | Mature product workflow                                 | Defined GST product features                 | Web and mobile apps             | Strong brand/content                           | Limited AI relevance to comparison    | Accounts, teams, customer portal | Free invoicing product         | End-to-end invoicing and payment workflow         |
| Refrens             | Invoices plus quotations, e-way/e-invoice, inventory and client management | Rich customization and sharing                          | Broader compliance workflow                  | Mobile-accessible/app ecosystem | Large content footprint                        | Not central to generator              | Accounts and saved clients/docs  | Freemium/limits                | Integrated business document lifecycle            |
| Vyapar              | Invoice generator plus billing/inventory app                               | No-signup generator + product upsell                    | GST-focused claims                           | Mobile/desktop product          | Strong India keywords                          | Not central                           | Accounts/app for management      | Free generator + paid software | Retail billing/inventory scale                    |
| ClearTax            | Tax/GST and financial tools                                                | Compliance-oriented                                     | High domain specialization                   | Web/mobile varies               | Very strong tax authority                      | AI/features vary                      | Accounts for filing/products     | Freemium/paid services         | Tax filing and compliance depth                   |
| SmartGST            | 28+ GST-focused tools and guidance                                         | Focused utility hub                                     | Public accuracy/content policy positioning   | Web                             | Focused SEO                                    | AI notice-reply capability advertised | Varies                           | Free/unknown mix               | Narrow GST specialization and trust framing       |
| bydigital GST tools | Small browser-only GST tool suite                                          | Lightweight                                             | Focused deterministic tools                  | Web                             | Niche                                          | None central                          | No-signup/local emphasis         | Free                           | Comparable privacy-first simplicity               |
| BizBil              | Retail billing, inventory, WhatsApp and thermal workflows                  | Operational app rather than isolated tools              | Business workflow accuracy                   | Mobile-oriented                 | Product-led                                    | Not central                           | Accounts and persistent data     | Paid                           | Offline/retail workflow integration               |

### Differentiation opportunity

**[RECOMMENDATION]** Position the new product between isolated free calculators and heavyweight billing software: local-first, no-account tools with unusually strong methodology, current policy versions, accessible mobile UX and export quality. Do not compete initially on inventory, filing or full accounting.

## Part 20 — Keep, Improve, Remove and Add

| Decision     | Item                                              | Reason                                                                   | Priority |
| ------------ | ------------------------------------------------- | ------------------------------------------------------------------------ | -------- |
| Keep         | India-specific utility focus                      | Real relevance for GST, UPI, thermal print and MSME workflows.           | P0       |
| Keep         | Free basic tools without account                  | Reduces friction and supports occasional users.                          | P0       |
| Keep         | Local browser processing                          | Strong privacy and cost advantage.                                       | P0       |
| Keep         | A4 and thermal outputs                            | Matches real shop workflows.                                             | P0       |
| Improve      | Category model                                    | Reorganize by user job and output type; add business collections.        | P0       |
| Improve      | GST and compliance tools                          | Effective-dated rules, official sources, last-reviewed and golden tests. | P0       |
| Improve      | URLs and metadata                                 | Canonical registry and automated consistency tests.                      | P0       |
| Improve      | Favorites/recent tools                            | Explicit local storage and clear-history control.                        | P1       |
| Remove/Avoid | Realistic mock electricity/mobile/broadband bills | Misuse and trust risk outweigh utility.                                  | P0       |
| Remove/Avoid | AI for arithmetic                                 | Unnecessary error, cost and opacity.                                     | P0       |
| Remove/Avoid | Unverified universal Bigha/Katha conversion       | Regional units require region/source.                                    | P0       |
| Remove/Avoid | Thin duplicate SEO routes                         | Cannibalization and maintenance burden.                                  | P0       |
| Add          | Methodology/source centre                         | Core trust differentiator.                                               | P0       |
| Add          | Report incorrect result                           | Creates correction loop with tool/policy version.                        | P0       |
| Add          | Schema-driven tool engine                         | Prevents one-off inconsistent implementation.                            | P0       |
| Add          | Privacy badges per tool                           | Shows local/API/AI/storage behavior before input.                        | P0       |
| Add          | Accessible error summary and print diagnostics    | Improves completion and export success.                                  | P1       |
| Add          | Grounded result explanation                       | Useful P2 AI after formulas are stable.                                  | P2       |

## Part 21 — Proposed Original Product

### Positioning

- **Placeholder name:** `KarobarKit` (working name only; trademark/domain review required).
- **Target:** Indian freelancers, retailers, service businesses and micro/MSMEs needing occasional calculations and professional documents without adopting accounting software.
- **Primary problem:** Free tools are either fragmented and generic, or broad but unclear about accuracy, freshness and data handling.
- **Value proposition:** “Business calculations and documents that show their work—private by default, current by date, ready for print and WhatsApp.”
- **Differentiation:** Source-backed formulas, visible policy versions, local-first processing, accessible mobile UX and a curated rather than bloated catalogue.
- **Non-goals for first release:** Inventory, bookkeeping ledger, GST filing, payroll engine, payment gateway, bank sync, team workspaces, realistic fake bills and general AI chatbot.

### Personas

| Persona                       | Job                                                                  | Highest-value tools                                  |
| ----------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| Freelancer                    | Creates invoices/receipts, calculates ROI, shares PDF/WhatsApp       | GST invoice, receipt, letterhead, ROI                |
| Small retailer                | Needs QR display, thermal receipt and simple tax breakdown           | UPI standee, receipt, GST calculator, price/QR tools |
| Service MSME                  | Issues branded documents and quotations, needs compliance references | GST invoice, letterhead, logistics docs later        |
| Aspiring entrepreneur/student | Learns business calculations and terminology                         | CAGR, ROI, EBITDA, guides                            |
| Accountant/bookkeeper         | Uses quick cross-checks but needs provenance                         | GST calculator, HSN/SAC, methodology/source register |

### Product pillars

1. **Calculate** — deterministic, source-backed calculations. 2. **Generate** — private business documents and print outputs. 3. **Pay & Share** — safe QR and lightweight sharing. 4. **Learn** — method, examples and current sources. “Manage” and “AI Assist” are deferred until evidence supports them.

### Focused launch set

| MVP tool        | Reason                               | Complexity/risk                | Priority |
| --------------- | ------------------------------------ | ------------------------------ | -------- |
| GST Calculator  | High demand and benchmark core       | Medium build; high policy risk | P0       |
| GST Invoice     | High-value output; reuses GST engine | High build; high legal/QA risk | P0       |
| Payment Receipt | Common retail/service need           | Medium; misuse wording needed  | P0       |
| Letterhead      | Low-risk, useful document            | Medium print/export complexity | P0       |
| UPI Standee     | India-specific, high practical value | Medium QR/print validation     | P0       |
| URL QR          | Simple acquisition utility           | Low                            | P0       |
| CAGR            | Low-risk proof of calculator engine  | Low                            | P0       |
| ROI             | Low-risk proof of calculator engine  | Low                            | P0       |

## Part 22 — Recommended Architecture

```text
Browser
├── Server-rendered/static tool content
├── Client tool form
├── Pure calculation / transform package
├── Versioned policy bundle
├── Local draft/favorites store
├── Print/PDF/QR worker
└── Privacy-safe analytics adapter

Optional production services
├── Policy/source API
├── Authentication
├── PostgreSQL
├── Encrypted object storage
├── Job queue / PDF service
├── Admin review console
└── AI gateway with retrieval and redaction
```

### Data model when persistence becomes justified

| Entity              | Purpose                              | Key fields                                        | Sensitivity/retention                            | Relationships                   |
| ------------------- | ------------------------------------ | ------------------------------------------------- | ------------------------------------------------ | ------------------------------- |
| User                | Account identity and preferences     | id, email/passkey ID, locale, createdAt           | Sensitive identity; retain until deletion        | 1:N business profiles/documents |
| BusinessProfile     | Reusable issuer details              | name, GSTIN, address, contact, logo reference     | Business personal data; user-controlled deletion | Belongs to user                 |
| Customer            | Reusable recipient                   | name, GSTIN, address, contact                     | Personal/business data; minimize                 | Belongs to business profile     |
| Tool                | Registry metadata                    | id, slug, category, status, currentVersion        | Public                                           | 1:N versions/calculations       |
| ToolVersion         | Formula/schema release               | version, code hash, source versions, releasedAt   | Audit record                                     | Belongs to tool                 |
| RegulatoryReference | Official source record               | publisher, title, URL, effective dates, checkedAt | Public                                           | Linked to tool/policy versions  |
| Calculation         | Optional saved input/result snapshot | toolVersion, policyVersion, encrypted payload     | Sensitive; opt-in and retention limit            | Belongs to user/business        |
| Document            | Saved document metadata              | type, version, storage key, expiry                | Sensitive; encrypted/signed access               | Belongs to user/business        |
| Invoice/InvoiceItem | Structured invoice data              | parties, dates, line items, tax                   | Financial/business sensitive                     | Belongs to document             |
| SavedTemplate       | Presentation settings                | template ID, logo/style fields                    | Potentially sensitive logo                       | Belongs to business             |
| Subscription        | Plan/billing state                   | provider customer ID, status                      | Financial metadata                               | Belongs to user/business        |
| Feedback            | Error/report record                  | tool version, category, description               | Avoid input values                               | May be anonymous                |
| AuditLog            | Policy/admin changes                 | actor, action, before/after hash, time            | Security record                                  | Admin-only                      |

### Analytics plan

| Event                  | Trigger                    | Properties                                            | Privacy rule                                         |
| ---------------------- | -------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| tool_viewed            | Tool route becomes visible | toolId, category, deviceClass                         | No input values                                      |
| tool_started           | First valid interaction    | toolId                                                | No field names if sensitive                          |
| tool_completed         | Valid result created       | toolId, toolVersion, policyVersion                    | Never send amount/result                             |
| tool_validation_failed | Submit has errors          | toolId, errorCodes                                    | Codes only                                           |
| result_downloaded      | Successful export          | toolId, format                                        | No filename/content                                  |
| result_printed         | Print invoked              | toolId, pageSize                                      | No document data                                     |
| search_performed       | Search submitted           | Normalized category or locally aggregated query class | Raw query can contain personal data; avoid or redact |
| search_zero_results    | No matches                 | Safe taxonomy token only                              | No raw sensitive query                               |
| feedback_submitted     | Feedback accepted          | toolId, version, category                             | Description stays in support system, not analytics   |

## Part 23 — Phased Implementation Roadmap

| Phase                     | Deliverables                                                                                            | Exit criteria                                                         | Indicative duration |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------- |
| 0. Governance             | PRD, personas, non-goals, source register, risk register, policy owner                                  | Eight MVP tools approved; every formula has source and test examples. | 2–3 weeks           |
| 1. IA and content model   | Canonical sitemap, URL convention, tool registry schema, search taxonomy                                | Every page has one location; no duplicate route design.               | 1–2 weeks           |
| 2. UX wireframes          | Homepage, directory, category, tool empty/error/result, document preview, mobile nav, legal/error pages | Core journeys reviewed at mobile and desktop widths.                  | 2–3 weeks           |
| 3. Design system          | Tokens, fields, buttons, cards, result/source blocks, print components                                  | WCAG component checks and responsive states approved.                 | 2–3 weeks           |
| 4. Technical foundation   | Repository, TypeScript, lint, tests, CI/CD, preview, error/analytics adapters                           | Green pipeline and security/privacy defaults.                         | 1 week              |
| 5. Shared engine          | Registry, schema forms, formatting, decimal math, policy versions, source blocks                        | CAGR and ROI prove reusable contract.                                 | 2 weeks             |
| 6. QR/document engines    | URL QR, UPI standee, letterhead, receipt, print/PDF snapshots                                           | Exports pass mobile/desktop and print matrix.                         | 3–4 weeks           |
| 7. GST engine and invoice | Effective-date policy, inclusive/exclusive, tax split, invoice lines and totals                         | Independent golden tests and expert review pass.                      | 4–6 weeks           |
| 8. Content/SEO            | Unique methodology, examples, FAQs, canonicals, sitemap and structured data                             | Automated metadata integrity tests pass.                              | 2 weeks parallel    |
| 9. QA hardening           | Browsers, devices, keyboard, axe, performance, security, large/invalid inputs                           | No critical defects; performance/accessibility budgets met.           | 2–3 weeks           |
| 10. Launch                | Domain, headers, monitoring, privacy, terms, search console, backups where applicable                   | Launch checklist signed.                                              | 1 week              |
| 11. Post-launch           | Completion funnels, errors, zero-result search, incorrect-result reports                                | P1 roadmap chosen from evidence, not catalogue pressure.              | Ongoing             |

## Part 24 — Prioritized Development Backlog

The separate `prioritized_backlog.csv` contains 28 backlog items with acceptance criteria and dependencies. Highest-priority epics are:

| Epic    | Outcome                                | Priority |
| ------- | -------------------------------------- | -------- |
| EPIC-01 | Research and regulatory governance     | P0       |
| EPIC-02 | Canonical information architecture     | P0       |
| EPIC-03 | Shared schema-driven tool engine       | P0       |
| EPIC-04 | Focused core tool implementation       | P0       |
| EPIC-05 | Trust and misuse controls              | P0       |
| EPIC-06 | Local-first privacy contract           | P0       |
| EPIC-07 | Accessible design system               | P0       |
| EPIC-08 | SEO content and automated integrity    | P1       |
| EPIC-09 | Calculation, browser and print QA      | P0       |
| EPIC-10 | Policy administration                  | P1       |
| EPIC-11 | Grounded AI enhancements               | P2       |
| EPIC-12 | Non-intrusive monetization experiments | P2       |

### Prioritization model

Score features 1–5 for user value, frequency, differentiation and revenue; score effort, maintenance, regulatory risk, data dependency and accuracy risk 1–5. A suggested decision score is `(value + frequency + differentiation + 0.5×revenue) - (0.8×effort + 0.7×maintenance + regulatoryRisk + 0.6×dataDependency + accuracyRisk)`. The numerical score is a discussion aid, not an automatic decision. Any uncontrolled fraud, privacy or legal risk can veto a feature regardless of score.

## Part 25 — Codex Handoff Prompt

A separate implementation-ready prompt is supplied as `codex_handoff.md`. It includes:

- Approved MVP and non-goals.
- Recommended Next.js/TypeScript stack.
- Repository structure.
- Shared typed tool contract.
- GST effective-date requirements and golden tests.
- Document/QR/privacy requirements.
- Form, design, SEO, security, accessibility and analytics rules.
- Definition of done and implementation sequence.

### Condensed instruction to Codex

> Build a new, original local-first business tools platform from the approved MVP. Do not copy India Biz Tools branding, text, layouts, assets or code. Use one typed tool registry, pure deterministic calculations, versioned regulatory policies, official sources, accessible forms, privacy-safe analytics and automated calculation/print/SEO tests. Do not build realistic mock bills, AI arithmetic or unsourced compliance logic. When a rule is missing, block the feature and request the exact source instead of guessing.

## Quality-Control Status

| Check                                    | Status                                                     |
| ---------------------------------------- | ---------------------------------------------------------- |
| Analysis did not stop at homepage        | Passed via public route/index discovery                    |
| Every publicly discovered route recorded | Passed for retrieved evidence; completeness caveat remains |
| Every discoverable tool recorded         | Partial by necessity: 27 classified, creator claims 60+    |
| Every interaction tested                 | Not possible; explicitly not claimed                       |
| Desktop/mobile tested                    | Not possible; specification supplied                       |
| Calculations independently checked       | Partial: key deterministic examples and GST policy checked |
| Official sources used                    | Passed for current GST reform finding                      |
| Facts separated from inference           | Passed                                                     |
| Private backend details not invented     | Passed                                                     |
| AI not assumed                           | Passed                                                     |
| Design tokens documented                 | Not extractable; original recommendations supplied         |
| Accessibility evaluated                  | No direct audit; requirements supplied                     |
| Performance evaluated                    | No direct metrics; architecture risk/budgets supplied      |
| SEO evaluated                            | Passed for indexed route/metadata evidence                 |
| Privacy/security evaluated               | Public disclosure plus threat model                        |
| Competitors compared                     | Passed                                                     |
| Product gaps prioritized                 | Passed                                                     |
| Original product defined                 | Passed                                                     |
| Implementation phased                    | Passed                                                     |
| Backlog acceptance criteria              | Passed in CSV                                              |
| Codex handoff produced                   | Passed                                                     |

## Evidence and Source Register

| Source                                 | URL                                                                                                      | Use                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Target homepage                        | https://www.indiabiztools.com/                                                                           | Public product positioning and route base.                                     |
| Target About                           | https://www.indiabiztools.com/about                                                                      | Audience and mission snippets.                                                 |
| Target privacy policy                  | https://www.indiabiztools.com/privacy-policy                                                             | Browser-side processing claims.                                                |
| Target FAQ                             | https://www.indiabiztools.com/faq                                                                        | Free-access positioning.                                                       |
| Target disclaimer                      | https://www.indiabiztools.com/disclaimer                                                                 | Accounting/legal disclaimer.                                                   |
| Creator stack disclosure               | https://www.reddit.com/r/IndiaBusiness/comments/1vfy28p/built_a_60_tool_website_almost_entirely_with_ai/ | React, TypeScript, Vite, GitHub and Vercel statement.                          |
| Creator privacy disclosure             | https://www.reddit.com/r/StartUpIndia/comments/1vchwxu/building_a_free_alternative_to_paid/              | Completely client-side/no server storage statement.                            |
| GST Council 56th meeting press release | https://gstcouncil.gov.in/sites/default/files/2025-09/press_release_press_information_bureau.pdf         | Implementation timing and rate-change recommendations.                         |
| PIB GST reforms explainer              | https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/sep/doc202594628401.pdf              | Two-slab 5%/18% reform description.                                            |
| PIB GST reforms overview               | https://www.pib.gov.in/PressReleasePage.aspx?PRID=2279318&lang=1&reg=3                                   | 2026 official summary of 22 Sep 2025 reforms and 40% category.                 |
| Zoho Invoice generator                 | https://www.zoho.com/in/invoice/free-invoice-generator.html                                              | Free generator workflow and download/print/save options.                       |
| Zoho Invoice                           | https://www.zoho.com/in/invoice/                                                                         | GST invoicing, payments, reminders, delivery challans and filing integrations. |
| Refrens invoice generator              | https://www.refrens.com/free-online-invoice-generator                                                    | Invoice customization, sharing and broader workflow.                           |
| Vyapar invoice generator               | https://vyaparapp.in/invoice-generator                                                                   | No-signup GST invoice generation and app funnel.                               |
| SmartGST About                         | https://smartgst.in/about                                                                                | Focused GST utility competitor.                                                |

### Final limitation statement

This report is intentionally stricter than a conventional teardown: where screenshots, DOM, network requests, headers or live interaction were unavailable, it records unknowns and supplies a verification plan. A full second-stage audit should be run in Chrome DevTools and real mobile browsers before treating field-level, visual, accessibility, performance or backend conclusions as complete.
