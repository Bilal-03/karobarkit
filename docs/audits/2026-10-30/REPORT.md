# KarobarKit accuracy and India-fit audit

Audit date: 30 October 2026 (India). Repository: `a7cfa493ba1ca598da65f290edc0de19fb12df78`. Public origin: https://karobarkit.vercel.app.

## Decision

**Do not treat every tool as verified. Fix the startup-cost gateway before relying on its estimates.** Live production requests demonstrated lost cost lines, foreign-currency wording, and ignored language preferences. The deterministic arithmetic layer is substantially stronger: all 31 independent numeric comparisons passed, and the existing unit/integration suite passed 370 tests. Those successes do not establish that live AI preserves the same inputs.

No application code, policy records, credentials, feature flags or deployment was changed. This directory contains review artifacts only. The existing untracked brand image and video were left untouched.

## Evidence and limits

- Reconciled 83 repository definitions with the 83 links exposed by the public directory. The README's 82-tool count is stale. Registry validation returned no errors.
- Executed every definition's validation and, where valid, calculation using its example input. Passed an explicit `2026-10-30` policy context; functions with their own current-date checks retained those checks. Saved full inputs, results, errors and source metadata in `evidence/registry-results.json`.
- Performed 1,400 single-field validation probes across numeric defaults. These are observations, not 1,400 passing assertions: applicability varies by field. See `evidence/boundary-probes.json`.
- Independently checked 31 numeric outputs with Python arithmetic rather than application functions. All matched within ₹0.005 / 0.005 percentage points or units as applicable. See `evidence/independent-checks.json` and its reproducible Python script.
- Production AI: exactly 12 sequential synthetic requests, three per assistant. Nine returned Groq-labelled drafts; three returned explicitly labelled deterministic fallbacks. No rate-limit bypass, retries or real customer data. Full synthetic requests/responses are in `evidence/live-ai-results.json`.
- Public Browser: expanded the complete directory, completed CAGR and ROI example journeys, and inspected pricing AI. Subsequent GST navigation timed out; the browser then became unavailable. Indian-number rejection was **not** reproduced through the public form; it is confirmed in local validation. This browser limitation is not evidence that all public routes are broken.
- Existing Chromium E2E suites against the local production build passed: desktop-1440 **60 passed, 7 skipped**; mobile-390 **52 passed, 15 skipped**. Exact cases and skip reasons are in the E2E logs. These supplement, and do not substitute for, a full public-site walkthrough.
- TypeScript passed; production build passed (200 generated pages, Next.js 16.4.3); ESLint exited successfully with seven warnings. Unit/integration: 44 files passed, one skipped; 370 tests passed, one live-provider test skipped. The separate 12 production requests supplied live evidence.
- Deployment commit was not independently identified. Public/local tool inventories agree; that does **not** prove identical deployed code. Source-level causes below are consistent with the observed production outputs.
- Every tool has an entry in `coverage.csv`. “LIMITED” means a narrower check passed but full correctness, public UI and export have not all been established. No blanket pass was assigned.

## Findings and exact repair recommendations

### F01 — P1: Startup-cost API silently discards most cost lines

**Production reproduction:** send the startup-cost assistant `Equipment: 50000\nBranding: 15000`, monthly `Rent: 25000\nPeople: 40000\nSoftware: 5000`, runway six months, contingency 10%.

Expected: ₹65,000 upfront + ₹70,000 × 6 = ₹4,85,000; with contingency **₹5,33,500**. Actual production deterministic metrics: ₹15,000 upfront, ₹5,000 monthly, funding **₹49,500**. The one- and twelve-month variants were also wrong (₹22,000 and ₹82,500). This is underestimation of funding, not merely poor AI wording. Local direct calculation returned the correct ₹5,33,500.

**Cause:** `redactAssistantInput` calls `cleanText`, which replaces newlines with spaces. `parseCostLines` subsequently splits on newlines, and its permissive label matcher takes the last amount of each flattened field. Thus earlier amounts become part of a label.

**Fix:** parse and validate cost lines before prose normalization; retain rows as structured `{label, amount}` data. Compute authoritative metrics from validated original amounts and send only redacted labels and canonical amounts to the provider. Reject invalid/redacted amount rows rather than silently dropping them. Until repaired, hide the network-assisted startup estimator or route it through correctly computed local metrics.

**Regression:** the exact production fixture must yield ₹5,33,500 through the API with a valid provider, provider error, no provider, CRLF input and three or more rows. Also test duplicate labels and failed amount parsing. Require equality between local and API metrics for the same validated input.

### F02 — P1: AI numeric protection accepts incorrect associations

Local adversarial probe: input unit cost ₹600 and target margin 40%; provider prose “Your unit cost is ₹40 and your target margin is 600%.” The merge accepted the prose as provider output because both `40` and `600` are on the allowed-number list. The accepted summary is recorded in `boundary-probes.json`. A separate “guaranteed” sentence was stripped; that did not prevent the swapped facts in the summary.

**Fix:** generate financial statements from named deterministic metrics and templates. Restrict free AI prose to qualitative explanation; require structured references to metric IDs when it mentions values. Validate value, currency, unit and associated metric together, not an unordered set of digits. Do not rely on another prompt alone.

**Regression:** swap margin/cost, change rupees to dollars, relabel revenue as profit, alter sign, or express an invented value in words/Devanagari. Preserve safe qualitative prose and reject/rebuild incorrect financial statements.

### F03 — P1: Production AI pricing uses dollars for Indian amounts

Pricing scenarios 1 and 2 returned `$1111.11`, `$1000.00`, `$180.00` and `$196,101.96`, despite these being INR scenarios. Startup scenario 3 also used dollars. Other startup outputs said “currency units”. The UI formats deterministic cards with ₹, so prose and cards can contradict each other.

**Fix:** add explicit locale `en-IN` and currency `INR` to the server-owned prompt context. Render money-bearing sentences with the shared Indian formatter. Reject unsupported foreign-currency symbols/code in INR assistant output; retain foreign currencies only when the tool explicitly supports them.

**Regression:** ₹1,111.11 and ₹1,96,101.96 must appear consistently in prose, cards, edited preview and CSV, without changing numeric value. Include zero, negatives where supported, paise, lakh and crore.

### F04 — P2: Business-name assistant fails its requested task and language

All three live naming requests returned one title and generic business-planning suggestions rather than a useful naming shortlist. Hindi scenario 2 returned “Fresh Bite Pune” and English sections describing a Hindi service, rather than drafting names in Hindi. Hinglish scenario 3 similarly described a Hinglish brand in English. Scenario 1 invented same-day delivery and eco-friendly packaging as parts of the business concept.

**Fix:** introduce a naming-specific output contract, e.g. a list of candidate names, language and short rationale. Require a minimum useful shortlist; enforce selected language on actual output, not merely mention it. Keep availability/trademark claims prohibited. Classify added business ideas as suggestions rather than established facts. Local fallback also needs a language-quality review.

**Regression:** English, Hindi and Hinglish fixtures each return multiple distinct usable names; Hindi includes meaningful Devanagari names. No unsupported availability, logistics or sustainability assertion.

### F05 — P1 availability: Policy review gates have expired

At the actual audit date, example calculations for income tax, TDS, corporate tax, presumptive tax and in-hand salary threw “policy review is due (2026-09-08)”. HRA validation reported no reviewed policy. GST calendar threw stale-policy disabled. Amazon and Flipkart examples require current seller-dashboard overrides because review was due 9 September. These are deliberate safeguards functioning as designed, coupled with an unresolved maintenance obligation.

The GST registry calculation with `asOf: 2026-10-30` rejects dates after 8 August. Its default policy context remains frozen at `2026-08-08`; a historical default can conceal current-date coverage gaps. This audit did not complete the public GST form journey, so it does not claim every public GST arithmetic path is disabled.

**Fix:** assign policy owners and review alerts before expiry. Reverify controlling sources and effective periods, add independently checked boundary fixtures, then update the relevant record. Never extend dates just to make tests pass. Show “temporarily unavailable / source review overdue” in discovery instead of advertising a working calculator and revealing the block only after entry. Separate explicitly entered-rate arithmetic from officially sourced rates and classifications.

**Regression:** run tests at real current date and immediately before/on/after review expiry. Verify active/historical/future periods, review notices, catalogue availability and supported manual overrides. Preserve conservative blocking for unverified legal rates.

### F06 — P2: Indian-grouped numeric input is rejected in AI tools

Local validation rejects `1,00,000` even though output uses Indian grouping. The numeric pattern accepts ungrouped digits or Western groups of three; cost-line parsing uses the same style. The numeric-authority tokenizer likewise does not reliably treat lakh/crore grouping as a single value.

**Fix:** share a strict decimal-input parser supporting ungrouped digits, valid Indian grouping and explicitly supported Western grouping. Strip separators only after validating their positions. Use the same parser in scalar inputs, cost lines and output validation. Provide clear examples; decide explicitly whether optional ₹ prefixes are accepted. Do not simply remove every comma from arbitrary input.

**Regression:** `100000`, `1,00,000`, `1,00,000.50`, `100,000`; reject malformed grouping and non-finite values. Ensure approval checks compare ₹1,00,000 as 100000, not separate numeric fragments.

### F07 — P2: AI result can remain attached to an earlier brief

Source inspection: `AIAssistantForm.updateValue` changes inputs without clearing `result` or resetting `reviewed`. A user can review one draft, change cost/constraints, and still copy/download the previous reviewed result. This is a source-confirmed state risk; public interactive reproduction was blocked by the browser session.

**Fix:** tie results and review confirmation to an input revision/hash. On input change, invalidate review/export and clearly label the previous draft as outdated; preserve it for reference only. Snapshot submitted input for in-flight requests and discard or label responses when inputs have since changed.

**Regression:** generate → review → change a field → export disabled; edit during request; fail regeneration; edit draft; confirm the visible brief, metrics and export share the same revision.

### F08 — P2: FX lookup requests only today's observations

Calling the ECB adapter on the audit date returned “The ECB response did not contain a reference quote.” Its URL sets `startPeriod` to today, so a normal morning in India can fail before Europe's publication, as can a non-publication day. ECB publishes around 16:00 CET on working days, with stated exceptions. Manual conversion works; a missing quote is not evidence of an incorrect exchange rate.

**Fix:** request a bounded recent window and select the newest common observation date for both currencies. Display the true quote date and age. Do not cross-divide rates from inconsistent dates or silently reuse a cached quote. Keep manual entry and transaction-rate limitations explicit.

**Regression:** India morning, weekends/TARGET closure, one missing currency observation, stale/future quote, inversion, EUR base, same currency, timeout and manual fallback.

### F09 — P2: Live AI reliability needs diagnosis, not silent confidence

Nine of twelve production requests returned Groq output. Pricing scenario 3 fell back with `invalid-provider-output`; business-plan scenarios 2 and 3 fell back with `provider-error`. The latter completed in about 409 ms and 329 ms. The public response does not establish whether the root cause was provider quota, schema, circuit state or another failure. Do not label these as provider-quality passes.

**Fix:** keep fallback visible; add privacy-safe reason codes, provider status/latency and aggregate fallback rates. Test provider JSON shape, timeout and circuit recovery. Improve prompts only after classifying rejected output. No prompts/financial briefs in logs.

### F10 — P2: Document forms emit duplicate React keys

Unit/integration execution repeatedly emitted duplicate keys `.0` and `.1` in document-form workflows. Source inspection points to `PresentedControls.partition`: recursive `Children.toArray` calls and regrouping preserve locally generated keys that can collide among siblings. Tests still passed; actual dropped controls were not demonstrated.

**Fix:** key regrouped controls by stable field identity plus section/path. Add a document form rerender/reordering check that fails on duplicate-key warnings and verifies controls retain their values and focus. Do not suppress the warning.

### F11 — P3: Catalogue and documentation disagree

83 tool definitions and public links versus README statements of 82; old launch evidence reports only 34 routes and 160 tests. These historical reports must not be interpreted as current release evidence.

**Fix:** derive displayed counts from the registry, update the README, and clearly date/scope historical reports. Link this audit as current evidence without calling its untested cases passed.

## Modify / temporarily hide / add

**Modify:** F01–F11 as described. Prioritize gateway input integrity, semantic numeric binding and INR consistency before visual refinements.

**Temporarily hide or mark unavailable:** the startup-cost network workflow until F01 is fixed; overdue regulated tools where no valid reviewed policy exists. Keep supported manual marketplace-fee modes with an explicit override requirement. No evidence justifies permanently deleting useful deterministic calculators.

**Add:** structured cost rows and metric references; per-tool availability status; owner/review-expiry checks; AI language/INR acceptance checks; result revision tracking; privacy-safe fallback monitoring. Expand state-specific tax coverage only with separately sourced policies. The Maharashtra-only PT label is an appropriate limitation, not a claim of nationwide coverage.

## Repair order, interfaces and release checks

1. **Input integrity:** parse startup rows before normalization. Add canonical structured cost rows to the internal gateway contract; keep the existing public request backward-compatible initially. Return field errors when rows cannot safely survive preparation. Lock numeric metrics to original validated inputs.
2. **AI contract:** introduce assistant-specific response schemas, currency/locale context and metric-ID references. Validate naming language and required candidate list. Keep provider wording separate from financial statements. Version prompts/contracts and preserve explicit fallback provenance.
3. **State and operations:** bind reviewed exports to the submitted revision; classify provider failures; surface disabled-policy state in discovery. No database migration is required for the observed defects.
4. **Policy maintenance:** review primary sources, effective periods and fixtures with appropriate tax/payroll expertise; do not refresh stale dates without verification. Use current-date and historical fixtures separately.
5. **Release:** rerun the exact production regressions above, all unit/integration tests, desktop/mobile E2E and export checks. Canary the revised AI gateway and compare local/API metrics before restoring startup-cost discovery. Monitor fallback rate and metric disagreement; roll back/hide the affected workflow if any amount changes across preparation.

## Primary-source checks and remaining regulatory work

These sources were consulted during this audit; access does not amount to a full legal sign-off:

- [Income Tax Department ITR-2 FAQ, AY 2026-27](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/itr-2/itr-2-faqs): supports the new-regime slab/rebate reference. Complete source-to-fixture validation of income tax, TDS, corporate and presumptive cases remains outstanding because current review gates blocked their examples.
- [GST Council September 2025 FAQ](https://www.gstcouncil.gov.in/sites/default/files/2025-09/faq_0.pdf): supports the effective-date context and need for classification-specific notifications; not an exhaustive current rate table.
- [EPFO contribution-rate reference](https://www.epfindia.gov.in/site_docs/PDFs/MiscPDFs/ContributionRate.pdf): supports contribution splits and the need for membership/wage conditions. Higher pension and exception coverage was not independently certified.
- [Maharashtra official professional-tax schedule](https://www.mahagst.gov.in/public/uploads/mvatservices/1761635638Schedule%20of%20Rates%20of%20Tax%20on%20Professions%2C%20Trades%2C%20Callings%20and%20Employments.pdf): supports checking Maharashtra-specific salary/gender/February boundaries. This is not every Indian state's schedule.
- [MSME delayed-payment guidance](https://ramp.msme.gov.in/ramp/pdf-documents/scheme-guidelines/msefc.pdf): supports monthly rests, three times bank rate and agreement-period boundary. Actual eligibility and changing bank-rate schedules were not certified.
- [ECB reference-rate publication](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.eu.html): supports F08's publication-timing finding.
- [Gemini REST contract](https://ai.google.dev/api/generate-content) and [structured-output guide](https://ai.google.dev/gemini-api/docs/generate-content/structured-output): current documentation supports `responseFormat.text.schema` and request `store`; no obsolete-API defect was asserted merely from those fields. Production requests here used Groq; Gemini itself remains unverified.

**Remaining acceptance work:** full public UI/validation/export walkthrough for the other 81 tools; real Safari/Firefox/device checks; exhaustive regulatory source reconciliation (including gratuity/labour-code transitions, HRA and depreciation); live Gemini behavior; independent visual inspection of all generated PDFs/labels and file transformations. The matrix deliberately retains LIMITED/BLOCKED verdicts for this work. This report is a completed evidence collection and prioritized review, not a certificate that all 83 tools are correct.
