# KarobarKit: “The Business Toolkit for India”

## Research-backed implementation plan

**Prepared:** 9 August 2026
**Status:** Build-ready product and technical plan
**Planning assumption:** Two product engineers, one product/design owner, and fractional CA/tax, payroll, and security reviewers. A single-engineer delivery will take approximately two to three times longer.

**Execution status:** Phase 0 contracts, Phase 1 platform foundation, Phase 2 everyday business-economics beta, Phase 3 finance/document beta, Phase 4 tax/payroll controlled beta, and the initial Phase 5 startup/marketplace controlled beta are implemented. See the [Phase 0 completion report](phase-0-completion-report.md), [Phase 1 completion report](phase-1-completion-report.md), [Phase 2 completion report](phase-2-completion-report.md), [Phase 5 completion report](phase-5-completion-report.md), [canonical catalogue](business_toolkit_catalogue.csv), [formula and policy register](business_toolkit_formula_policy_register.csv), [source library](business_toolkit_source_library.csv), [tool contract v2](tool-contract-v2.md), [change-control workflow](regulatory-change-control.md), and [architecture decisions](phase-0-architecture-decisions.md).

## 1. Executive decision

KarobarKit should move from “a website containing business calculators” to **The Business Toolkit for India**: a trustworthy collection of calculators, document generators, and guided operational tools for Indian freelancers, sellers, startups, and small businesses.

The recommended product progression is:

1. **Answer:** a transparent calculation with assumptions, formula, and sources.
2. **Create:** an invoice, quotation, QR code, or other usable artifact.
3. **Act:** a guided next step, comparison, export, or reusable workflow.
4. **Remember, only when invited:** optional saved business profiles and team workspaces.

This follows the useful direction visible in Outzo and LaunchGrid without trying to become an ERP, professional-services marketplace, or storefront platform in the first release. Outzo positions itself as a business operating and execution system; LaunchGrid combines store creation, payments, orders, and GST workflows. KarobarKit's defensible starting position is narrower and clearer: **fast, source-backed business decisions and artifacts, built for India, with local-first privacy**.

### Recommended positioning

**Primary promise:** Make a business decision, create the document, and understand the next step—without a spreadsheet, account, or hidden assumptions.

**Suggested homepage headline:** The Business Toolkit for India.

**Suggested supporting copy:** Calculate, compare, plan, and create practical business documents with transparent formulas, Indian formats, and source-backed rules.

**Trust promise:** Inputs stay on the device whenever a tool can work locally. Regulated tools show the applicable period, official sources, assumptions, and last verification date. AI features are clearly labelled and never replace deterministic tax or finance calculations.

## 2. Current product assessment

The repository is not a blank slate. It already has a good foundation that should be extended rather than rewritten.

### Existing strengths to preserve

- Eight working tools: CAGR, ROI, GST, URL QR, UPI standee, letterhead, payment receipt, and GST invoice.
- Next.js 16.3, React 19, TypeScript, Zod, `decimal.js`, Vitest, and Playwright.
- Pure domain calculation modules separated from UI components.
- A typed tool registry with metadata, sources, limitations, FAQs, SEO, privacy notes, and related tools.
- Effective-dated GST policy data with official-source allowlisting and validation.
- Browser-local calculator, QR, and document processing.
- Indian number and currency formatting.
- Reusable calculator, generator, result, source, and trust components.
- Automated unit, integration, responsive, accessibility, print, SEO, and production smoke coverage.
- Existing methodology, source, privacy, regulatory verification, and launch-readiness documentation.

### Constraints to address before large-scale expansion

- The registry is one large file and its `ToolDefinition` supports only calculators and local-only generators. It needs modular manifests and execution/privacy types for AI, data-backed, and optional-cloud tools.
- Four current categories do not support the proposed eight-category information architecture.
- Policy versioning is implemented for GST but not as a reusable tax, payroll, marketplace-fee, or finance-policy platform.
- There is no governed authoring/review workflow for frequent regulatory or vendor-fee changes.
- There is no server-side AI gateway, consent boundary, rate limiting, cost control, or AI evaluation system.
- Anonymous local-first use is strong; optional saved business profiles, document sequences, and cross-device workflows do not yet exist.
- Current sources for stable finance formulas include editorial references. Regulated and consumer-finance tools should prefer primary official material and independent golden fixtures.

## 3. Product information architecture

### Eight primary categories

| Category    | User job                                              | Proposed tools                                                                    |
| ----------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| Business    | Price, plan, and understand operating economics       | Margin, Markup, Break-even, ROI, Pricing, Cash Flow, Runway                       |
| GST & Tax   | Estimate common India-specific tax outcomes           | GST, Income Tax, TDS, HRA, Corporate Tax, Presumptive Tax                         |
| Startup     | Understand growth, fundraising, and recurring revenue | Burn Rate, Runway, CAC, LTV, Valuation, Equity Dilution, SaaS Metrics             |
| Finance     | Compare borrowing, saving, and returns                | EMI, SIP, FD, CAGR, XIRR, Loan Comparison                                         |
| E-commerce  | Understand per-order and advertising economics        | Amazon Fees, Flipkart Fees, Marketplace Margin, ROAS, COD Cost                    |
| HR & Salary | Explain compensation and statutory components         | CTC, In-hand Salary, PF, Gratuity, ESOP                                           |
| Generators  | Create day-to-day business artifacts                  | Invoice, Quotation, GST Invoice, QR Code, Business Card, Invoice Number           |
| AI Tools    | Turn business context into a structured first draft   | Business Name, Pricing Assistant, Startup Cost Estimator, Business Plan Assistant |

There are 46 requested category entries but 45 unique tools because Runway appears in both Business and Startup. It must have one canonical route, `/tools/runway-calculator`, and be discoverable from both categories. Do not duplicate the calculator or its URL.

Retain the existing UPI standee, letterhead, and payment-receipt generators as adjacent tools. The long-term catalogue is therefore **48 unique tools**, of which five requested tools already have a foundation: ROI, GST, CAGR, GST Invoice, and QR Code.

### Navigation model

- Main navigation: Tools, Categories, Generators, AI Tools, Methodology.
- Homepage: search first, eight category cards, “popular jobs” journeys, trust proof, then featured tools.
- All-tools page: query, category, tool type, local/cloud, and “regulated” filters.
- Every tool has one canonical `/tools/{slug}` route.
- Tool pages link to one primary category and any secondary discovery categories.
- Use job language in search synonyms: “take-home pay,” “how much to charge,” “months of cash left,” “Amazon profit,” and “tax on salary.”
- Keep legal, methodology, sources, policy versions, privacy, and report-error pages globally accessible.

### Product journeys, not just isolated tools

Build cross-tool hand-offs using explicit user action, never hidden data sharing:

- Pricing → Margin → Break-even → Cash Flow.
- Burn Rate → Runway → Startup Cost → Fundraising dilution.
- Marketplace Fees → Marketplace Margin → ROAS → COD Cost.
- CTC → In-hand Salary → PF → HRA → Income Tax.
- Quotation → Invoice → GST Invoice → QR/UPI → Payment Receipt.
- SIP/CAGR/XIRR and EMI/Loan Comparison as paired learning journeys.

## 4. Tool scope and release assignment

### Business

| Tool       | V1 scope and result                                                                     | Important limits                                         | Release           |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------- |
| Margin     | Revenue, cost, gross profit, margin percentage                                          | Distinguish gross margin from net margin                 | Phase 2           |
| Markup     | Cost, selling price, markup percentage                                                  | Explain why markup and margin are not interchangeable    | Phase 2           |
| Break-even | Fixed cost, price/unit, variable cost/unit, contribution, break-even units/revenue      | V1 is single-product; multi-product mix is later         | Phase 2           |
| ROI        | Preserve current implementation; add time-period hand-off to CAGR/XIRR                  | Basic ROI ignores time and interim cash flow             | Phase 1 hardening |
| Pricing    | Cost-plus, target-margin, discount, tax-exclusive/inclusive scenarios                   | Does not decide a legally applicable GST rate            | Phase 2           |
| Cash Flow  | Opening cash plus monthly inflows/outflows and closing balance; CSV import/export later | A planning forecast, not a statutory cash-flow statement | Phase 2           |
| Runway     | Current cash divided by net burn; monthly scenario table                                | One canonical tool shared with Startup                   | Phase 2           |

### GST & Tax

| Tool            | V1 scope and result                                                                                       | Policy requirement                                                                  | Release                              |
| --------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------ |
| GST             | Preserve inclusive/exclusive calculation and explicit supply split; add transaction-date policy selection | Effective-dated CBIC/GST Council policy; no product classification claim            | Phase 1 hardening, Phase 4 expansion |
| Income Tax      | Individual estimate by tax period, regime, income type, deductions, surcharge/rebate/cess where supported | Version by applicable Act and tax period; CA-reviewed fixtures                      | Phase 4                              |
| TDS             | Guided payment type, payee/residency/PAN status, threshold, rate, timing, estimate, and compliance note   | Versioned tables; old/new Act transition; not a filing tool                         | Phase 4                              |
| HRA             | Lowest eligible amount calculation, metro status, rent, HRA, salary/DA definition                         | Tax regime/period eligibility and official return-validation rules                  | Phase 4                              |
| Corporate Tax   | Entity/regime scenario, taxable income, surcharge, cess, MAT applicability warning                        | Do not infer eligibility for sections or deductions                                 | Phase 4                              |
| Presumptive Tax | 44AD/44ADA/44AE eligibility questionnaire and estimated presumptive income                                | Entity, activity, cash-receipt share, turnover thresholds, lockout/records warnings | Phase 4                              |

### Startup

| Tool            | V1 scope and result                                                                    | Important limits                                                    | Release |
| --------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------- |
| Burn Rate       | Gross burn, net burn, monthly trend, and cash change                                   | Require an explicit time period; flag one-off items                 | Phase 2 |
| Runway          | Reuse the canonical Business tool with startup examples                                | Scenario, not a survival prediction                                 | Phase 2 |
| CAC             | Total attributed cost ÷ all new customers; paid-channel spend ÷ paid-channel customers | Declare attribution window and keep paid spend separate             | Phase 5 |
| LTV             | Simple subscription model using ARPU, gross margin, and churn; scenario range          | Do not present a precise forecast when churn is unstable or zero    | Phase 5 |
| Valuation       | Scenario models such as revenue multiple and funding pre/post-money; show ranges       | Educational only; not a legal, tax, or registered valuation         | Phase 5 |
| Equity Dilution | Pre-money, investment, post-money ownership, option-pool scenarios, cap-table preview  | Does not replace Companies Act approvals or a registered valuer     | Phase 5 |
| SaaS Metrics    | MRR, ARR, ARPU, logo/revenue churn, GRR, NRR, CAC payback, LTV:CAC, Rule of 40         | Normalize multi-month growth/churn to explicit monthly/annual units | Phase 5 |

### Finance

| Tool            | V1 scope and result                                                                                      | Important limits                                                                                   | Release           |
| --------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------- |
| EMI             | Fixed-rate EMI, amortization, total interest, fees, and rate-shock scenarios                             | Display rate type and nominal-rate/fee limitations; do not label the result as APR                 | Phase 3           |
| SIP             | Periodic contribution future-value illustration and invested amount                                      | Expected return is an assumption, never a guarantee                                                | Phase 3           |
| FD              | Principal, rate, tenure, compounding frequency, maturity and interest                                    | Bank-specific rules, premature closure, and tax are excluded unless selected                       | Phase 3           |
| CAGR            | Preserve current formula; add clearer comparison with XIRR                                               | Unsuitable for irregular cash flows                                                                | Phase 1 hardening |
| XIRR            | Dated cash flows, numerical root solving, convergence status, CSV input                                  | Require at least one negative and one positive flow; show non-unique/no-solution cases             | Phase 3           |
| Loan Comparison | Compare nominal annual rate, fees, EMI, total cost, rate type, reset scenario, and prepayment assumption | Do not calculate APR without dated fee/cash-flow inputs; do not rank lenders or scrape rates in V1 | Phase 3           |

### E-commerce

| Tool               | V1 scope and result                                                                                           | Data requirement                                                                      | Release |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------- |
| Amazon Fees        | Category-aware closing examples, price band, fulfilment, weight/size/distance, taxes, estimated payout/profit | Versioned official examples plus Seller Central override for unsupported combinations | Phase 5 |
| Flipkart Fees      | Category/commission, FBF/NFBF, fixed, payment-mode collection, shipping, taxes, estimated payout/profit       | Versioned fixed bands plus category/payment-mode seller-dashboard overrides           | Phase 5 |
| Marketplace Margin | Vendor-neutral selling price, product cost, platform, shipping, payment, return and tax costs                 | User-supplied inputs; reusable by marketplace tools                                   | Phase 2 |
| ROAS               | Revenue/ad spend plus contribution-profit view and break-even ROAS                                            | Distinguish platform-attributed revenue from actual collected revenue                 | Phase 2 |
| COD Cost           | COD fee, forward/return freight, RTO rate, return loss, cash-cycle cost, expected contribution                | All rates user-supplied in V1                                                         | Phase 2 |

### HR & Salary

| Tool           | V1 scope and result                                                                                        | Policy requirement                                                                                          | Release |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------- |
| CTC            | Earnings, employer contributions, benefits, bonus, gratuity provision, annual/monthly breakdown            | Employer-policy assumptions must be editable                                                                | Phase 4 |
| In-hand Salary | CTC structure to monthly take-home with employee deductions and estimated TDS                              | Tax period/regime, state professional tax, PF applicability, payroll policy                                 | Phase 4 |
| PF             | Employee/employer EPF, EPS, EDLI/administrative components where applicable                                | Effective-dated EPFO rules and wage definition; support establishment exceptions                            | Phase 4 |
| Gratuity       | Eligibility/event, service period, last-drawn wage, estimated gratuity and cap                             | Effective labour-law version and employment type                                                            | Phase 4 |
| ESOP           | Grant, vesting, exercised/allotted shares, exercise date/cost, ownership/dilution, and tax-event scenarios | Educational scenario; exercise-date FMV, legal plan terms and tax treatment require professional validation | Phase 5 |

### Generators

| Tool           | V1 scope and output                                                                          | Safety/operational requirement                                                                | Release           |
| -------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------- |
| Invoice        | Non-GST invoice with items, payment terms, PDF/print                                         | Never imply GST compliance; local draft by default                                            | Phase 3           |
| Quotation      | Quote/estimate with validity, items, terms, conversion to invoice                            | Clearly label as quotation, not tax invoice                                                   | Phase 3           |
| GST Invoice    | Preserve existing Rule 46-aware implementation; add version history and quotation conversion | No IRN/e-invoice/filing claim without official integration                                    | Phase 1 hardening |
| QR Code        | Preserve URL QR; add text/contact modes only with payload-specific validation                | Never auto-open decoded links; local rendering                                                | Phase 3           |
| Business Card  | Print-ready card templates with optional QR and local logo processing                        | Accessible preview; bleed and safe-area guidance                                              | Phase 3           |
| Invoice Number | Prefix, financial year, sequence, preview, and copy                                          | Local-only sequence can collide across devices; cloud sequence requires atomic server storage | Phase 3           |

Retain UPI standee, letterhead, and payment receipt as supported Generator-category tools. Do not add realistic utility bills, bank proofs, government certificates, or other documents that can be mistaken for official evidence.

### AI tools

| Tool                    | V1 scope and output                                                                          | AI boundary                                                                                     | Release |
| ----------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------- |
| Business Name           | Structured naming brief, candidate names, rationale, filters, domain/trademark-check prompts | Never claim name, domain, company, or trademark availability without a live authoritative check | Phase 6 |
| Pricing Assistant       | Starts from deterministic cost/margin/break-even results, then explains scenarios            | AI explains options; the calculation engine owns all numbers                                    | Phase 6 |
| Startup Cost Estimator  | Deterministic cost categories and ranges supplied by user; AI suggests missing categories    | Do not invent permit, rent, salary, or compliance costs                                         | Phase 6 |
| Business Plan Assistant | Guided structured plan, assumptions register, risks, milestones, and export                  | No fabricated market statistics or citations; user approves every section                       | Phase 6 |

## 5. Delivery phases

The ranges below are elapsed delivery estimates for the assumed team and include engineering, content, review, and release gates.

### Phase 0 — Product contract and governance (1–2 weeks)

**Goal:** prevent tool sprawl and define what “trustworthy” means before expanding.

Deliverables:

- Approve positioning, audience hierarchy, eight categories, naming, and canonical route map.
- Assign every tool a risk tier, owner, review cadence, source plan, and release phase.
- Create a master formula and policy-source register.
- Define calculator, generator, data-backed, and AI execution contracts.
- Appoint a CA/tax reviewer for tax tools and a payroll/labour reviewer for salary tools.
- Define “estimate,” “illustration,” “document,” and “official filing” language rules.
- Create a change protocol: research → implementation → independent fixture → expert approval → release → rollback.

Exit gate:

- No regulated tool enters development without named official sources, applicable-period rules, reviewer, and golden test cases.

### Phase 1 — Reposition and platform foundation (2–3 weeks)

**Goal:** launch the new product architecture without waiting for all tools.

Deliverables:

- Update homepage and metadata to “The Business Toolkit for India.”
- Add the eight-category navigation and scalable all-tools directory.
- Present the current eight tools inside the new architecture; do not show empty tool cards as live.
- Split the monolithic registry into per-tool definitions and build-time indexes.
- Extend tool types to calculator, generator, worksheet, comparison, data-backed, and AI-assisted.
- Extend privacy types to local-only, network-required, and optional-cloud-sync.
- Generalize the GST policy design into a reusable effective-dated policy package.
- Add a visible trust panel: method, source, effective period, last verified, reviewer status, limitations, privacy, report error.
- Add feature flags and a beta/unavailable state so catalogue growth does not create broken pages.
- Harden current ROI, CAGR, GST, and GST Invoice tools and preserve their routes.

Exit gate:

- Registry validation, static generation, category discovery, search, sitemap, structured data, and existing test suites pass with the new IA.

### Phase 2 — Everyday business economics MVP (4–5 weeks)

**Goal:** prove the broader toolkit proposition with high-frequency, lower-regulatory-risk decisions.

Ship:

- Margin, Markup, Break-even, Pricing, Cash Flow, Runway, Burn Rate.
- Marketplace Margin, ROAS, and COD Cost.
- Cross-tool journeys and optional local scenario transfer.
- CSV export for cash-flow and scenario tables; print-friendly summaries.

Why this wave:

- These tools provide immediate business value, share a common contribution-economics model, and do not depend on frequently changing statutory rates.

Exit gate:

- Independent formula fixtures, decimal/rounding tests, boundary tests, keyboard/mobile tests, and plain-language method review pass for every tool.

### Phase 3 — Finance and document workflows (4–6 weeks)

**Goal:** move from answers to reusable outputs and comparisons.

Ship:

- EMI, SIP, FD, XIRR, and Loan Comparison.
- Invoice, Quotation, QR modes, Business Card, and Invoice Number.
- Quote → Invoice → Payment Receipt and Invoice → QR/UPI flows.
- Shared amortization, dated-cash-flow, document-template, sequence, and export modules.

Exit gate:

- EMI and SIP behavior matches independent official examples or verified fixtures.
- XIRR is cross-checked against Excel/Google Sheets-compatible fixtures, including non-convergence.
- PDF/print outputs pass A4 and mobile-browser tests; generated documents contain no unsupported compliance claims.

### Phase 4 — India tax, payroll, and compliance layer (6–8 weeks)

**Goal:** ship India-specific regulated tools only after the policy system and review workflow are working.

Ship in controlled sub-waves:

1. GST transaction-date refinement and HRA.
2. Income Tax and TDS.
3. Presumptive Tax and Corporate Tax.
4. CTC, In-hand Salary, PF, and Gratuity.

Required controls:

- Every calculation selects a policy version by tax/payment/transaction date.
- Support the transition between the Income-tax Act, 1961 and Income-tax Act, 2025 where applicable; never rely only on renamed section numbers.
- Separate eligibility questions from arithmetic results.
- Show unsupported fact patterns and stop rather than silently simplify them.
- Expert sign-off is tied to the policy version, fixtures, and release commit.
- Add a kill switch that can disable a stale policy preset without taking down the whole tool.

Exit gate:

- Official-source links are live, policy freshness checks pass, all golden cases are signed off, and the UI clearly says what is and is not determined.

### Phase 5 — Startup and marketplace depth (4–6 weeks)

**Goal:** add scenario planning and seller-specific economics after common primitives are stable.

Ship:

- CAC, LTV, SaaS Metrics, Valuation, Equity Dilution, and ESOP scenarios.
- Amazon Fees and Flipkart Fees.
- Saved vendor-fee snapshots in versioned policy data; manual overrides are always available.
- Compare scenarios, not companies or investment recommendations.

Exit gate:

- Marketplace schedules show source, effective/verified date, fulfilment assumptions, taxes, and “estimate only” language.
- A stale marketplace snapshot cannot calculate without a current seller override, and startup/marketplace beta flags can be disabled independently.
- Valuation, dilution, and ESOP tools never present scenario output as a legal valuation, securities offer, or tax advice.

### Phase 6 — AI assistants (3–5 weeks for initial set)

**Goal:** use AI to structure and explain business thinking without allowing it to become the calculator or compliance authority.

Deliverables:

- Server-side AI gateway with secret isolation, rate limiting, budgets, consent, redaction, timeout, and provider fallback.
- Versioned prompts, structured response schemas, safety filters, and evaluation datasets.
- Clear “AI-generated draft” labels, regenerate/edit controls, and deterministic fallback templates.
- Business Name, Pricing Assistant, Startup Cost Estimator, and Business Plan Assistant.
- Export only after the user reviews the draft.

Exit gate:

- Red-team prompts, prompt-injection tests, fabricated-statistic tests, sensitive-data tests, cost limits, latency/error states, and human review of evaluation samples pass.

### Phase 7 — Optional accounts and operational platform (later, evidence-led)

**Goal:** add retention and workflows only when anonymous usage proves what users want to save.

Candidates:

- Optional business profile and brand kit.
- Saved calculations, reusable customers/items, templates, and cross-device invoice numbering.
- Team workspaces, approval roles, audit logs, and exports.
- Reminder calendar, recurring documents, or integrations only after validation.
- Paid tier for saved profiles, branded templates, team workflows, and API/bulk use; keep core calculations, methods, and sources free.

Do not start with CRM, accounting ledger, filing, payments custody, or an expert marketplace. Each would materially change the product's compliance and security scope.

## 6. Scalable technical architecture

### 6.1 Target layers

1. **Tool catalogue:** build-time registry for names, slugs, categories, search terms, risk, capabilities, SEO, and relationships.
2. **Deterministic domain engine:** pure TypeScript functions using decimal arithmetic, explicit rounding, and no UI/network dependencies.
3. **Policy engine:** effective-dated statutory and vendor rules with sources, jurisdiction, applicability, status, reviewer, fixtures, and rollback.
4. **Workflow engine:** explicit transfer of a typed result into the next tool, held in memory or user-approved local storage.
5. **Generator engine:** reusable document models, templates, preview, print/PDF, logo assets, and safe filenames.
6. **AI gateway:** server-only provider calls; structured input/output; no computation authority; rate/cost/privacy controls.
7. **Optional persistence:** accounts and workspaces isolated from anonymous tools; encrypted storage and audited access.
8. **Observability:** privacy-safe events, Web Vitals, errors without form values, policy freshness, and release health.

### 6.2 Recommended repository structure

```text
src/
  domain/
    tools/{category}/{tool}/
      definition.ts
      schema.ts
      calculation.ts
      fixtures.ts
      content.ts
    policies/{gst,income-tax,payroll,marketplaces}/
      sources.ts
      versions.ts
      validation.ts
    workflows/
    documents/
    formatting/
  components/
    tools/
    worksheets/
    documents/
    trust/
  lib/
    ai/
    analytics/
    security/
    persistence/
  app/
    tools/[slug]/
    categories/[slug]/
    api/ai/
```

Generate catalogue/search/sitemap indexes from tool definitions at build time. Do not import every calculation, PDF, or AI dependency into directory and search pages.

### 6.3 Tool contract v2

Every tool definition should declare:

- Stable ID, canonical slug, aliases, primary/secondary categories, tags, and search terms.
- Tool kind and execution mode.
- Input/output schema and default example.
- Pure calculation or generation entry point.
- Units, rounding policy, supported/unsupported cases, and error codes.
- Risk tier, regulatory status, policy dependencies, jurisdictions, and applicable periods.
- Sources with title, authority, URL, publication/effective/accessed dates, supported claims, and archived fingerprint.
- Reviewer status, owner, last verified, next review, and stale behavior.
- Privacy classification, data-flow declaration, retention, analytics allowlist, and export behavior.
- Method, worked examples, interpretation, limitations, disclaimer, FAQs, SEO, and related journeys.
- Feature status: internal, beta, live, stale-disabled, or retired.

### 6.4 Policy data model

Never hardcode a current rate directly in a component. Store it in a validated policy version:

```text
policySet
  id
  jurisdiction
  legalBasis
  effectiveFrom / effectiveTo
  verifiedOn / nextReviewOn
  sources[]
  rules[]
    conditions
    value or formula reference
    exceptions
    sourceIds[]
  reviewer
  status
  goldenFixtureIds[]
```

Resolution must be deterministic: facts + applicable date → policy version → rule or an explicit “unsupported” result. New data is staged, reviewed, tested, then activated. Runtime scraping must never silently change a result.

### 6.5 Local-first and cloud boundaries

- Keep arithmetic, QR rendering, document previews, and PDF creation in the browser where practical.
- Load heavy PDF/chart modules only when requested.
- Use browser memory by default; local storage requires a visible “save on this device” action and a clear-data control.
- Network tools must show what fields leave the device before submission.
- AI provider keys and prompts stay server-side. Do not send GSTIN, PAN, bank details, employee names, customer lists, or document contents unless the feature requires them and the user gives informed consent.
- Optional accounts must be a separate capability; anonymous public tools remain usable without login.

## 7. Trust, accuracy, and regulatory governance

### 7.1 Risk tiers

| Tier                       | Examples                                                            | Release control                                                                  |
| -------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| A — stable arithmetic      | Margin, Markup, ROI, CAGR, Break-even                               | Formula review plus unit/property tests                                          |
| B — assumption-sensitive   | Cash Flow, Runway, CAC, LTV, EMI, SIP, Valuation                    | Tier A controls plus visible assumptions and scenario tests                      |
| C — changing external data | Amazon/Flipkart Fees, FD products if rates are fetched              | Versioned source data, freshness state, override, monitoring                     |
| D — regulated/personal     | GST, Income Tax, TDS, Corporate Tax, PF, Gratuity, Salary, ESOP tax | Official sources, effective dates, expert sign-off, golden fixtures, kill switch |

AI is an additional execution risk, not a substitute for these tiers. An AI explanation of a Tier D result remains Tier D and must use the deterministic result and approved content.

### 7.2 Source hierarchy

1. Gazette, statute, rule, notification, circular, or official regulator/department page.
2. Official portal validation rules, FAQs, manuals, or calculators.
3. Official vendor fee schedules for Amazon and Flipkart.
4. Standards bodies for technical formats.
5. Professional/editorial sources only for stable non-statutory concepts, clearly labelled.

If sources conflict, the tool stays unavailable for the disputed scenario until a reviewer resolves it. A disclaimer is not a substitute for correct implementation.

### 7.3 Review cadence

| Policy family                        | Normal review                                                 | Event trigger                                                 |
| ------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------- |
| Income tax/TDS/corporate/presumptive | Monthly during budget/rule transition, otherwise quarterly    | Finance Act, rule, notification, portal validation update     |
| GST                                  | Monthly source monitoring, formal quarterly review            | GST Council meeting, notification, rate/classification change |
| Payroll/PF/gratuity                  | Quarterly                                                     | Labour code/rule or EPFO notification                         |
| Marketplace fees                     | Weekly automated link/change monitoring; monthly human review | Vendor announcement or fee-page change                        |
| Consumer finance explanations        | Quarterly                                                     | RBI/SEBI circular or calculator change                        |
| Stable business formulas             | Annual                                                        | Methodology defect or user report                             |

Automated monitoring may detect changes and open a review task. It must not publish new rates automatically.

### 7.4 Trust UI on every result

- “Estimate,” “illustration,” or “document preview” label.
- Applicable date/tax year and selected assumptions.
- Formula and intermediate breakdown.
- Rounding method.
- Official sources and exactly what each source supports.
- Last verified date and stale warning.
- Limitations and unsupported cases.
- Privacy/data-flow statement.
- Report-an-error action with tool and policy version prefilled, but no raw financial values.

## 8. Official research baseline

These are the starting official sources, not a permanent substitute for the source-review workflow.

| Area                             | Implementation implication                                                                                                                                     | Primary source                                                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GST invoices                     | Rule 46 defines invoice particulars, including supplier/recipient information and financial-year-unique serial requirements                                    | [CBIC CGST Rules, Rule 46](https://cbic-gst.gov.in/pdf/15102020_CGST-Rules-2017-Part-A-Rules.pdf)                                                                                                                |
| Individual income tax            | Tax slabs, regimes, rebate, surcharge, and cess are period-specific                                                                                            | [Income Tax Department: Salaried Individuals for AY 2026–27](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1?fromCampaign=true)                                                    |
| Tax-law transition               | Payments/credits through 31 March 2026 and from 1 April 2026 can fall under different Acts and section numbering                                               | [Income Tax Department: TDS compliance](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/tds-compliance)                                                                              |
| TDS                              | Payment type, threshold, payee, PAN/residency, and period determine treatment                                                                                  | [Income Tax Department: tax and TDS rates](https://www.incometaxindia.gov.in/tax-rates)                                                                                                                          |
| HRA                              | Official return validations apply the lowest-of-three calculation and salary/DA basis                                                                          | [CBDT ITR-4 validation rules for AY 2026–27](https://www.incometax.gov.in/iec/foportal/sites/default/files/2026-05/CBDT_e-Filing_ITR%204_Validation%20Rules_AY%202026-27.pdf)                                    |
| Corporate tax                    | Regimes, surcharge, cess, MAT, eligibility, and excluded deductions must be separated                                                                          | [Income Tax Department: Domestic Company for AY 2026–27](https://www.incometax.gov.in/iec/foportal/help/company/return-applicable)                                                                               |
| Presumptive tax                  | 44AD/44ADA/44AE have entity, activity, turnover/receipt, payment-mode, and vehicle conditions                                                                  | [Income Tax Department: ITR-4 FAQs](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/itr%204-faqs)                                                                                    |
| EPF                              | Contribution components and wage ceiling/applicability are not a single universal CTC deduction                                                                | [EPFO FAQ](https://www.epfindia.gov.in/site_en/FAQ.php)                                                                                                                                                          |
| Gratuity                         | Eligibility event, service duration, wage definition, and employment type affect the estimate                                                                  | [Ministry of Labour: FAQs on Labour Codes](https://www.labour.gov.in/static/uploads/2026/01/de4758d5bfeffc456d7de97a801891b0.pdf)                                                                                |
| ESOP tax                         | Exercise/allotment can create a salary perquisite and later transfer can create capital gains; eligible startup deferral has conditions                        | [Income Tax Department: Perquisites](https://www.incometaxindia.gov.in/w/perquisites)                                                                                                                            |
| Further share issue              | Some share issues require a special resolution and registered-valuer pricing                                                                                   | [India Code: Companies Act section 62](https://www.indiacode.nic.in/show-data?actid=AC_CEN_22_29_00008_201318_1517807327856&orderno=64&sectionId=1252&sectionno=62)                                              |
| Startup/ESOP context             | Startup-specific company and ESOP relaxations require eligibility checks                                                                                       | [Startup India startup benefits playbook](https://www.startupindia.gov.in/content/dam/startupindia/Verify-Rec-Mapping/Startup-Playbook-Exclusive-Benefits-for-DPIIT-Recognised-Startups-in-India-April-2026.pdf) |
| SIP                              | Projected return is illustrative and cannot represent actual or guaranteed market returns                                                                      | [SEBI Investor SIP Calculator](https://investor.sebi.gov.in/calculators/sip_calculator.html)                                                                                                                     |
| EMI/loan comparison              | Show nominal annual rate/fees, fixed/floating rate, reset impact, and total cost—not EMI alone; calculate APR only when fee timing and cash flows are modelled | [RBI FAQ on floating-rate EMI resets](https://www.rbi.org.in/scripts/FAQView.aspx?Id=170)                                                                                                                        |
| Amazon fees                      | Fees vary by category, price, fulfilment, weight/distance, and effective date; estimates can differ from actual                                                | [Amazon India Seller fees and pricing](https://sell.amazon.in/fees-and-pricing?mons_sel_locale=en_IN)                                                                                                            |
| Flipkart fees                    | Commission, fixed, collection, fulfilment, and shipping fees vary; seller dashboard may be the current authority                                               | [Flipkart Seller fees and commission](https://seller.flipkart.com/fees-and-commission)                                                                                                                           |
| Personal data                    | Cloud accounts and AI tools require purpose limitation, notice/consent, security, retention, and rights workflows according to applicable commencement dates   | [MeitY Digital Personal Data Protection Rules 2025](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa)                                                 |
| Accessibility/security lifecycle | Use WCAG-level accessibility, clear ownership, lifecycle governance, and security review                                                                       | [GIGW 3.0](https://guidelines.india.gov.in/new-features-of-gigw-3-0/) and [WCAG 2.2](https://www.w3.org/TR/WCAG22/)                                                                                              |

Important: official portal summaries often state that they are informational and users should verify Acts, Rules, and Notifications. For Tier D tools, the production source register should include both the controlling legal instrument and the official explanatory/validation material used for UX.

## 9. Calculation and content quality system

### Required test layers

- Unit tests for formulas, validation, rounding, date resolution, and policy selection.
- Golden fixtures independently prepared from official examples or reviewer worksheets.
- Property tests for invariants: totals reconcile, ownership sums correctly, balances never drift because of floating point, and amortization ends within the defined rounding tolerance.
- Historical policy tests on the day before, day of, and day after an effective-date change.
- Metamorphic tests: changing a single input produces the expected directional result.
- Integration tests for input errors, assumption changes, and result explanations.
- PDF/print snapshot and semantic checks for documents.
- End-to-end tests at the existing responsive viewport matrix plus real iOS Safari and Android Chrome before major releases.
- Accessibility checks: WCAG 2.2 AA target, keyboard-only, screen reader smoke, zoom/reflow, touch target, contrast, and reduced motion.
- Security tests for file upload, PDF content, XSS, unsafe URLs, API abuse, rate limits, and AI prompt injection.

### Numerical rules

- Continue using `decimal.js`; never use binary floating point for currency or tax.
- Store rates as strings/decimals, not JavaScript numbers.
- Declare rounding per intermediate step and final result.
- Preserve unrounded values internally only where the defined method requires it.
- State day-count and compounding conventions for finance tools.
- Treat a non-converging XIRR or ambiguous solution as a valid error state, not zero.
- Reconcile displayed line items and totals after rounding.

### Content rules

- Use “estimate” or “illustration” unless the output is purely deterministic and complete for the stated facts.
- Never use “accurate,” “guaranteed,” “official,” “approved,” or “file-ready” without evidence.
- Explain each input in business language and show an example.
- Put key limitations next to the relevant input/result, not only in a footer.
- Use English first with architecture ready for Hindi and other Indian languages; do not auto-translate statutory meaning without review.

## 10. Privacy, security, and abuse prevention

### Anonymous/local tools

- No account and no server transmission for ordinary calculations and document generation.
- Analytics receive only tool ID, category, action, error code, viewport group, and policy version—never amounts, names, IDs, URLs, notes, or document content.
- File uploads are processed locally, constrained by type/size/dimensions, and stripped from memory after use.
- QR tools validate schemes and do not fetch user-entered URLs.

### Network and AI tools

- Show a concise just-in-time data notice before the first submission.
- Collect only fields required for the output.
- Redact obvious PAN, GSTIN, bank, email, phone, and customer identifiers when they are unnecessary.
- Set explicit provider, region, retention, and model-training controls in vendor contracts/configuration.
- Use server-side secrets, schema-constrained responses, request limits, abuse detection, and per-tool budgets.
- Do not log prompts or completions by default. If evaluation sampling is introduced, require opt-in and de-identification.

### Documents and misuse

- Do not reproduce government seals, bank receipts, utility bills, certificates, or official portal layouts.
- GST Invoice must say whether it is a local draft and must not claim an IRN, e-invoice registration, filing, or recipient delivery without a real integration.
- A payment receipt records a declaration by the issuer; it is not proof of bank settlement.
- Sanitize filenames and user text; prevent HTML/script execution in preview and export.

## 11. SEO, discovery, and performance

- Each live tool gets unique intent-aligned title, H1, summary, method, example, limitations, FAQs, sources, and last-verified content.
- Do not index internal, beta, empty, search-query, or user-document URLs.
- One canonical URL per tool; Runway uses category links, not duplicate pages.
- Use registry-generated sitemaps and structured data that match visible content.
- Add “compare” and “how it works” content only when it helps the tool task; avoid mass-generated thin pages.
- Render catalogue/category pages statically; dynamically load only the active tool engine.
- Lazy-load PDFs, charts, AI UI, and large policy datasets.
- Set budgets: no new tool may materially degrade LCP, INP, CLS, or initial JavaScript without review.
- Keep search local and metadata-only until catalogue scale demonstrates a need for a hosted index.

## 12. Measurement and business model

### Privacy-safe product metrics

- Tool discovery → start → valid result → export/copy/next-tool conversion.
- Validation failure by error code.
- Result completion time and abandonment step.
- Related-workflow continuation.
- Returning-device usage only with consent; otherwise use aggregate sessions.
- Source-link opens and error reports as trust signals.
- Policy freshness, broken official links, stale-disabled tools, and calculation incidents.
- AI success, edit/regenerate rate, latency, error rate, token cost, and explicit helpfulness—without recording sensitive content.

### North-star metric

**Weekly successful business outcomes:** valid calculations, comparisons, or generated artifacts completed and intentionally copied, downloaded, printed, or moved into a next-step tool.

Do not use page views as the primary success measure.

### Monetization sequence

1. Keep calculators, formulas, limitations, and source access free.
2. Test paid brand kits, premium document templates, saved profiles, bulk export, and team workspaces.
3. Consider API/embedded tools after policy governance and versioning are stable.
4. Never sell ranking placement inside tax, loan, or investment results without prominent separation and disclosure.

## 13. Team and operating model

Minimum accountable roles:

- Product owner: roadmap, user journeys, release decisions, and metrics.
- Domain-engine owner: calculation contracts, decimal correctness, and fixtures.
- Platform owner: registry, policy engine, Next.js performance, security, and delivery.
- Design/content owner: forms, mobile UX, accessibility, terminology, and examples.
- CA/tax reviewer: GST, income tax, TDS, HRA, corporate, and presumptive tools.
- Payroll/labour reviewer: CTC, salary, PF, gratuity, and ESOP employment content.
- Security/privacy reviewer: AI gateway, optional accounts, DPDP readiness, threat models, and incident response.

One person may hold multiple roles, but every Tier D policy version requires a named reviewer separate from the implementer.

## 14. First 30 days: actionable backlog

### Week 1

- Approve the positioning and audience order.
- Freeze the 48-unique-tool catalogue and canonical slugs.
- Mark all proposed tools internal; keep only existing verified tools live.
- Create risk tiers, source owners, reviewers, and a source-register schema.
- Write architecture decision records for local-first, policy versioning, and AI boundaries.

### Week 2

- Refactor registry types and per-tool modules without changing current behavior.
- Add eight categories, secondary discovery categories, execution mode, policy dependencies, and lifecycle status.
- Update homepage, directory, search, sitemap, and metadata to the new positioning.
- Add trust-panel fields and stale/unavailable behavior.

### Week 3

- Build shared contribution-economics primitives.
- Implement Margin, Markup, and Break-even with independent fixtures.
- Design Pricing, Cash Flow, Burn, and Runway as one consistent workflow family.
- Add property-based or invariant-focused test helpers.

### Week 4

- Finish Pricing, Cash Flow, Burn, and Runway.
- Add Marketplace Margin, ROAS, and COD Cost using the same cost model.
- Run mobile, accessibility, performance, and content QA.
- Release Phase 1 and a small Phase 2 beta behind feature flags.

## 15. Definition of done for every tool

A tool is not “done” until all applicable items are true:

- Canonical route, category, discovery metadata, SEO, and related journey are registered.
- Inputs, outputs, units, defaults, bounds, and unsupported cases are documented.
- Pure calculation/generation logic has independent normal, boundary, invalid, and regression fixtures.
- Currency and percentages use the declared decimal and rounding rules.
- The result shows formula/method, inputs/assumptions, interpretation, and limitations.
- Sources support the claims shown; effective and verified dates are visible.
- Regulated/data-backed tools have approved policy versions and reviewer sign-off.
- Privacy/data flow and analytics allowlists are declared and tested.
- Keyboard, screen-reader, reflow, phone, print/export, and error states pass.
- Security and abuse cases appropriate to the tool pass.
- Metrics use no sensitive values.
- Feature flag, stale behavior, monitoring, owner, and rollback are defined.

## 16. Decisions to approve before implementation

1. Confirm KarobarKit remains the brand and “The Business Toolkit for India” becomes the category-level positioning.
2. Confirm anonymous local-first use remains the default and accounts are postponed until Phase 7.
3. Confirm regulated tools require external reviewer sign-off, even if that slows their release.
4. Confirm marketplace tools use versioned published schedules plus user overrides, not runtime scraping presented as guaranteed current fees.
5. Confirm AI is used for drafting and explanation, while deterministic engines own every numeric result.
6. Confirm the team will not build filing, banking/payment custody, realistic official-document replicas, or a full ERP in these phases.

Once those six decisions are accepted, implementation can begin with Phase 0 and the first 30-day backlog without further product discovery.
