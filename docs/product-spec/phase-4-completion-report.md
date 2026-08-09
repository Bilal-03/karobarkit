# Phase 4 tax, payroll and compliance implementation report

Date: 10 August 2026 (IST)

Status: public controlled beta; named CA/tax and payroll/labour reviewer approval remains pending and is shown honestly in the trust metadata.

## Corrective changes

- HRA now includes turnover-based commission in the Rule 2A salary base.
- HRA uses explicit Mumbai, Kolkata, Delhi, Chennai and other-location branches; generic “metro” input is not exposed.
- HRA asks for rented accommodation and a stable fact pattern, and stops own-house/no-rent and changing-period cases.
- HRA policy evidence includes controlling Rule 2A, official salary-definition guidance, AY 2026-27 validation rules and the regime FAQ. The ITR-4 publication date is recorded as 15 May 2026.
- GST policy selection rejects dates after the verified policy snapshot and invoice generation stops when freshness is stale. The invoice UI declares both historical and future-date boundaries.
- Phase 4 Tier D tools use the `phase4-tax-review` feature flag (enabled by default for this personal project) and carry golden fixture IDs. An explicit empty flag value opts them out of a deployment; reviewer-pending labels remain visible.
- Sensitive tax and payroll field names are included in the analytics sanitizer and forbidden-property policy.

## Implemented sub-waves

1. HRA and GST transaction-date refinement.
2. Income Tax and TDS.
3. Presumptive Tax and Corporate Tax.
4. CTC, In-hand Salary, PF and Gratuity.

The new tools are local-only and policy-scoped. Income Tax supports ordinary resident individual income for AY 2026-27 and a constrained Tax Year 2026-27 new-Act path. TDS supports selected domestic contractor, professional, rent and commission categories and resolves the Act by the earlier credit/payment date. Presumptive Tax screens common 44AD/44ADA/44AE facts. Corporate Tax shows declared domestic-company regimes with surcharge, cess and MAT comparison. Payroll tools expose employer assumptions, dated PF components and gratuity eligibility boundaries.

## Official source boundary

- [Income Tax Department individual AY 2026-27 guidance](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1?fromCampaign=true)
- [Income Tax Department Income and Tax Calculator guidance](https://www.incometax.gov.in/iec/foportal/income-tax-calculator?mobile-app=1)
- [Income Tax Department TDS transition guidance](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/tds-compliance)
- [Income Tax Department domestic-company AY 2026-27 guidance](https://www.incometax.gov.in/iec/foportal/help/company/return-applicable)
- [Income Tax Department HRA Rule 2A](https://wmstatic-prd.incometaxindia.gov.in/web/guest/w/rule-2a-1)
- [EPFO FAQ](https://www.epfindia.gov.in/site_en/FAQ.php)
- [Ministry of Labour and Employment Labour Code FAQ](https://www.labour.gov.in/static/uploads/2026/01/de4758d5bfeffc456d7de97a801891b0.pdf)

The official sources are bundled at build time. The browser does not scrape tax or payroll policy, and none of these tools files a return, creates a challan, produces a payslip or establishes legal eligibility.

## Golden fixtures and release gates

The independent fixture set covers HRA commission/city/eligibility boundaries; individual slab, rebate, surcharge and cess; old/new TDS transition, thresholds and PAN treatment; 44AD; corporate tax/MAT; CTC; take-home; EPF/EPS/EDLI; and gratuity eligibility. The fixtures are executable and traceable by registry IDs, but remain unsigned until the named external reviewers are recorded.

For continued public-beta operation, record:

- named CA/tax and payroll/labour reviewers;
- policy/source bundle approval and next review dates;
- signed fixture IDs and release commit;
- a tested stale/withdrawn policy kill-switch decision;
- production-equivalent build and focused browser verification.

## Verification run on 10 August 2026

- `npm run format:check`, `npm run typecheck`, `npm run lint` and `git diff --check` passed. ESLint reports six pre-existing Next.js internal-navigation warnings and no errors.
- Serialized `npm test -- --maxWorkers=1 --no-file-parallelism` passed: 26 files and 249 tests.
- `npm run build` passed: 66 static pages generated, including all 36 public tool route parameters. An explicit empty `NEXT_PUBLIC_TOOL_FEATURE_FLAGS` value can opt Phase 4 out of a deployment.
- Focused Playwright `desktop-1440` HRA smoke check passed after the expected-copy assertion was updated. Mobile and multi-viewport layout matrices were intentionally not repeated.
