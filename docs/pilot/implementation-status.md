# Pilot implementation status

Implemented and published to GitHub/Vercel:

- Homepage positioning and /freelancers workflow entry; broader toolkit remains available.
- Quotation/invoice/receipt handoff continuation and import measurement; transfers remain explicit and local.
- Vercel custom-event SDK integration with sanitized properties, tab-session expiry, allowlisted first-touch channel attribution, elapsed timing, start deduplication, opt-out and privacy signals.
- Full HRA/tax/payroll result breakdown, including cess and credits.
- Research/consent scripts, prioritization brief, PRD, decision log, acquisition drafts, SQL exercises, workbook and portfolio/resume/demo templates.

Verification: privacy and analytics unit tests; existing document workflow integrations; full tax breakdown regression; browser pilot journeys on desktop and mobile. The workbook is empty, its rate formulas have been tested with temporary sample inputs and restored, and both sheets were visually checked. It is not connected to live analytics.

Outstanding external work:

- The freelancer workflow is deployed; live desktop and mobile tests confirmed quotation, invoice and receipt PDF exports with explicit imports. Custom-event ingestion is blocked by the Hobby plan (Vercel HTTP 402); the owner explicitly chose to deploy with sending disabled. See measurement.md.
- Recruit and interview participants, collect baseline observations, run two acquisition channels, and follow up at their natural task frequency.
- Choose the next workflow change from research and collect before/after evidence.
- Fill the case study/resume metrics and record the actual demo after evidence exists.

Nothing in the template asserts completed customer interviews, adoption, revenue, causal uplift or product-market fit. Outreach drafts have not been sent. No new service subscription, paid upgrade or additional AI capability has been purchased.
