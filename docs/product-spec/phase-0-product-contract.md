# Phase 0 product contract

**Product:** KarobarKit — The Business Toolkit for India
**Baseline:** 9 August 2026
**Status:** Accepted for implementation
**Scope owner:** Product owner
**Change control:** An accepted ADR or product-contract amendment is required to change a decision below.

## 1. Product promise

KarobarKit helps Indian freelancers, sellers, startups, and small businesses calculate a decision, create a practical artifact, and understand the next step. It is not an ERP, filing portal, lender or investment marketplace, payment custodian, or substitute for a qualified professional.

The product progression is:

1. **Answer:** transparent deterministic calculation.
2. **Create:** usable document or QR artifact.
3. **Act:** comparison, export, or explicit next-tool hand-off.
4. **Remember only when invited:** optional saved business profiles and team workspaces in a later phase.

## 2. Accepted decisions

The instruction to begin the approved implementation plan is recorded as acceptance of these six plan decisions:

| Decision         | Accepted contract                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand            | KarobarKit remains the product brand. “The Business Toolkit for India” is the category-level position and homepage promise.                              |
| Default use      | Anonymous and local-first remain the default. Accounts are postponed to Phase 7.                                                                         |
| Regulated review | Tier D tools require an accountable external domain reviewer before new regulated scope enters implementation or release.                                |
| Marketplace data | Amazon and Flipkart tools use reviewed effective-dated published schedules plus visible user overrides. Runtime scraping cannot silently change results. |
| AI authority     | AI may draft and explain. Deterministic engines own every numeric result and approved policy content owns regulated claims.                              |
| Excluded scope   | Filing; payment custody; banking; realistic official-document replicas; lender/investment ranking; and a full ERP are excluded from these phases.        |

## 3. Audiences and priority

1. Indian freelancers and sole proprietors who need a quick decision or document.
2. Marketplace and direct-to-consumer sellers managing per-order economics.
3. Small teams and MSMEs managing pricing, cash, payroll estimates, and routine documents.
4. Early-stage startups managing runway, SaaS metrics, and fundraising scenarios.

The public experience must not assume accounting, tax, finance, or startup jargon.

## 4. Frozen catalogue and routes

The Phase 0 catalogue contains 48 unique tools. The requested catalogue contains 46 category entries and 45 unique tools because Runway is shared by Business and Startup. UPI Standee, Letterhead, and Payment Receipt remain supported adjacent generators.

The machine-readable catalogue is [`business_toolkit_catalogue.csv`](business_toolkit_catalogue.csv). Its `tool_id` and `canonical_slug` values are the route contract for later phases.

Rules:

- One canonical `/tools/{canonical_slug}` route per tool.
- Runway has one canonical route and two discovery categories.
- Existing live slugs remain canonical unless a separate migration decision includes redirects, sitemap changes, and search/SEO tests.
- Planned tools remain `internal` until their definition of done and phase exit gate pass.
- Empty or planned tool pages are not indexable public pages.

## 5. Category contract

| ID           | Label       | User job                                                           |
| ------------ | ----------- | ------------------------------------------------------------------ |
| `business`   | Business    | Price; plan; and understand operating economics.                   |
| `gst-tax`    | GST & Tax   | Estimate supported India-specific tax outcomes.                    |
| `startup`    | Startup     | Understand growth; recurring revenue; fundraising; and runway.     |
| `finance`    | Finance     | Compare borrowing; saving; and return illustrations.               |
| `ecommerce`  | E-commerce  | Understand per-order; marketplace; advertising; and COD economics. |
| `hr-salary`  | HR & Salary | Explain compensation and supported statutory components.           |
| `generators` | Generators  | Create day-to-day business artifacts.                              |
| `ai-tools`   | AI Tools    | Produce a structured draft from user-provided business context.    |

## 6. Risk and release gates

| Tier | Meaning                                                       | Minimum gate                                                                                                                                  |
| ---- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| A    | Stable arithmetic or technical transformation                 | Method owner; independent unit fixtures; edge cases; standard tool QA.                                                                        |
| B    | Assumption-sensitive business or finance scenario             | Tier A plus visible assumptions; scenarios; limitations; and domain review.                                                                   |
| C    | Changing external/vendor data                                 | Tier B plus versioned source snapshot; freshness monitoring; override; and stale behavior.                                                    |
| D    | Regulated; payroll; tax; or sensitive personal-finance result | Official controlling sources; applicable period; named external reviewer; golden fixtures; policy version; kill switch; and release sign-off. |

AI execution is an additional risk overlay. It never lowers the underlying tier of the calculation or claim it explains.

No Tier D expansion may enter implementation until the reviewer seat contains a real person or contracted firm. The responsible roles are frozen now; the individuals remain a procurement/staffing dependency.

## 7. Accountable roles

| Role                      | Accountability                                                   | Assignment state                                                           |
| ------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Product owner             | Scope; journeys; release decision; language; metrics             | Project role established; person to be recorded before Phase 1 exit        |
| Domain-engine owner       | Formula contracts; decimal behavior; golden fixtures             | Project role established; person to be recorded before Phase 2 development |
| Platform owner            | Registry; policy engine; performance; security; delivery         | Project role established; person to be recorded before Phase 1 development |
| Design/content owner      | Form UX; accessibility; terminology; examples                    | Project role established; person to be recorded before Phase 1 exit        |
| CA/tax reviewer           | GST; income tax; TDS; HRA; corporate; presumptive tax            | External named reviewer required before Phase 4 implementation             |
| Payroll/labour reviewer   | CTC; salary; PF; gratuity; employment-side ESOP content          | External named reviewer required before Phase 4 implementation             |
| Corporate/legal reviewer  | Equity dilution; valuation limitations; ESOP/company-law content | External named reviewer required before Phase 5 implementation             |
| Security/privacy reviewer | AI; optional accounts; DPDP readiness; threat models             | Named reviewer required before Phase 6 implementation                      |

## 8. Language rules

Use the following labels deliberately:

- **Calculation:** the deterministic result for the stated inputs and supported method.
- **Estimate:** an outcome affected by incomplete facts, policies, or user assumptions.
- **Illustration:** a forward-looking scenario such as SIP growth, valuation, or loan-rate change.
- **Document preview:** an artifact created from user-entered information; not proof of filing, delivery, authenticity, or settlement.
- **AI-generated draft:** editable output that may be incomplete or incorrect and requires user review.

Forbidden without direct evidence and an approved claim:

- “100% accurate”
- “guaranteed”
- “official” or “government approved”
- “file-ready” or “filed”
- “verified GSTIN/PAN/bank account”
- “best loan/investment”
- “legal valuation” or “registered valuation”

Disclaimers never compensate for a known incorrect formula, stale policy, unsupported scenario, or misleading label.

## 9. Data and privacy contract

- Arithmetic, QR rendering, document preview, and PDF generation stay local when technically practical.
- The browser uses memory by default. Persistent local storage requires an explicit save action and clear-data control.
- A network-required tool declares transmitted fields, provider class, purpose, retention, and fallback before submission.
- Analytics exclude amounts, names, IDs, contact details, URLs, free text, document contents, and AI prompts/completions.
- Accounts and cloud persistence are optional later capabilities and cannot become a prerequisite for public calculators.

## 10. Phase 0 artifacts

- [`business_toolkit_catalogue.csv`](business_toolkit_catalogue.csv) — canonical 48-tool catalogue.
- [`business_toolkit_formula_policy_register.csv`](business_toolkit_formula_policy_register.csv) — method, policy, ownership, cadence, and implementation gate per tool.
- [`business_toolkit_source_library.csv`](business_toolkit_source_library.csv) — normalized official, authoritative, and controlled internal sources.
- [`tool-contract-v2.md`](tool-contract-v2.md) — calculator, worksheet, comparison, generator, data-backed, and AI execution contracts.
- [`regulatory-change-control.md`](regulatory-change-control.md) — research-to-release and rollback workflow.
- [`phase-0-architecture-decisions.md`](phase-0-architecture-decisions.md) — accepted local-first, effective-dated policy, and deterministic-AI boundary ADRs.

## 11. Phase exit

Phase 0 is complete when:

- all 48 tool IDs and slugs are unique;
- every tool has a risk tier, phase, method/policy basis, owner role, reviewer role, and review cadence;
- every external source ID used by the formula/policy register exists in the source library;
- the product contract and execution contracts contain no conflicting authority or privacy rule;
- Tier D tools are visibly blocked from new implementation until a named external reviewer is assigned.

Named external reviewers are an explicit staffing gate for Phases 4 and 5, not a reason to delay the non-regulated Phase 1 and Phase 2 foundation.
