# Phase 5 startup and marketplace implementation report

Date: 10 August 2026 (IST)

Status: public controlled beta; startup-metrics, corporate/legal and marketplace-policy reviewer approval remains pending and is shown in the trust metadata. Startup tools use `phase5-startup-marketplace`; marketplace tools use the separate `phase5-marketplace` flag. Both are enabled by default for this personal project.

## Implemented scope

The registry now publishes eight Phase 5 tools with separate startup and marketplace controls:

1. CAC with blended and paid-channel views and an explicit attribution window.
2. LTV with ARPU, gross-margin and low/base/high churn sensitivity.
3. SaaS Metrics with MRR, ARR, ARPU, growth, logo churn, GRR, NRR, CAC payback, LTV:CAC and Rule of 40.
4. Startup Valuation with user-selected revenue-multiple and pre/post-money scenarios.
5. Equity Dilution with a reconciled starting cap table and explicit post-money option-pool convention.
6. ESOP with grant, vesting, exercised/allotted shares, exercise date, exercise cost, ownership, spread and optional rate-based tax illustration.
7. Amazon Fees with category-aware verified examples (sandals, apparel, beverages and facewash) and seller-specific referral/shipping/closing-fee overrides for unsupported bands.
8. Flipkart Fees with versioned FBF/NFBF fixed-fee bands; category commission, payment-mode collection and shipping are explicit seller-dashboard inputs rather than universal defaults.

Deployment control: leave `NEXT_PUBLIC_TOOL_FEATURE_FLAGS` unset to publish both groups. To opt out selectively, set a comma-separated allowlist such as `phase4-tax-review,phase5-startup-marketplace` (startup tools only) or `phase4-tax-review,phase5-marketplace` (marketplace tools only). An explicitly empty value hides both Phase 5 groups.

All eight tools are local-first. Amazon and Flipkart use bundled policy data (`local-with-bundled-data`); no seller dashboard, account, product category or live fee page is scraped at runtime.

## Source and policy controls

- Amazon source: [Amazon.in seller fees and pricing](https://sell.amazon.in/fees-and-pricing/?mons_sel_locale=en_IN).
- Flipkart source: [Flipkart seller fees and commission](https://seller.flipkart.com/fees-and-commission).
- Startup metrics source: controlled methodology in the [implementation plan](Business_Toolkit_for_India_Implementation_Plan_2026-08-09.md).
- Corporate context: [India Code Companies Act section 62](https://www.indiacode.nic.in/show-data?actid=AC_CEN_22_29_00008_201318_1517807327856&orderno=64&sectionId=1252&sectionno=62).
- ESOP context: [Income Tax Department perquisites guidance](https://www.incometaxindia.gov.in/w/perquisites) and the [Startup India playbook](https://www.startupindia.gov.in/content/dam/startupindia/Verify-Rec-Mapping/Startup-Playbook-Exclusive-Benefits-for-DPIIT-Recognised-Startups-in-India-April-2026.pdf).

The marketplace policy bundle is effective-dated, validates exact HTTPS official hosts, records the verified snapshot date and review due date, resolves the newest eligible snapshot (including `effectiveTo`), rejects future policy dates, and blocks calculations that would rely on a stale snapshot. Amazon category/channel/price combinations without a verified official example require a current Seller Central closing-fee override. Variable referral, commission, collection, shipping and account fees remain explicit overrides.

## Trust and privacy boundaries

- CAC/LTV/SaaS outputs are metrics and sensitivity scenarios, not forecasts or benchmarks. Paid CAC cannot reuse blended spend; SaaS multi-month windows normalize annualized growth and monthly churn/LTV.
- Valuation and dilution outputs are educational arithmetic, not fair values, securities offers, registered valuations or corporate approvals.
- ESOP output separates ownership, vesting, exercised/allotted shares, exercise-date FMV, spread and optional tax arithmetic; it does not determine FMV, eligibility or tax liability.
- Marketplace outputs are estimates, not seller settlements, payout guarantees or tax conclusions.
- Phase 5 input names are excluded from the shared analytics allowlist and runtime event sanitizer.
- Reviewer status, policy dependencies and golden fixture IDs are visible in registry trust metadata. `PHASE5_GOLDEN_FIXTURE_MANIFEST` cross-checks every ID against an executable fixture; its independent reviewer signature remains explicitly `pending` until a named reviewer signs the release commit.

## Fixtures and verification

The executable fixtures cover separate paid-spend CAC, LTV churn ranges and unstable churn, one- and three-month SaaS windows (including customer/MRR reconciliation), valuation ranges, cap-table reconciliation, ESOP tax-event inputs and no-sale behavior, Amazon sandals and apparel official examples plus unsupported-category/override behavior, Flipkart fixed-fee bands with category/payment-mode context, policy-version transitions, stale-policy blocking and override paths, future dates, and official-source hostname validation. The manifest is complete but remains unsigned.

Verification completed for this implementation:

- `npm run format:check`, `npm run typecheck`, `npm run lint` and `git diff --check` pass. ESLint reports six pre-existing Next.js internal-navigation warnings and no Phase 5 errors.
- Serialized `npx vitest run --maxWorkers=1 --no-file-parallelism --reporter=dot` passes: 28 files and 271 tests.
- `npm run build` passes and generates 74 static pages, including all 44 public tool route parameters.
- Focused Playwright `desktop-1440` Phase 5 smoke checks pass: CAC result/CSV export and Amazon category-aware policy/estimate boundary (2 tests).
- The responsive layout matrix is intentionally not repeated, per the project instruction to skip non-functional mobile/desktop repetition.

## Remaining Phase 5 release gates

- Record named startup-metrics, corporate/legal and marketplace-policy reviewers.
- Sign the golden fixtures against the release commit and approve the policy/source bundle.
- Rehearse the stale/withdrawn marketplace-policy response and seller-dashboard override path.
- Recheck official vendor pages on the weekly monitoring cadence before calling the data-backed tools reviewed.
- Keep the public beta labels and estimate/scenario disclaimers until those gates are complete.
