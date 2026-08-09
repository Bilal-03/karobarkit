# Phase 4 tax sub-wave 1 report (superseded)

Date: 9 August 2026 (IST)

Status: historical sub-wave record. The corrected all-sub-wave implementation is documented in [`phase-4-completion-report.md`](phase-4-completion-report.md); external tax/payroll review and signed golden fixtures remain release gates.

## Delivered scope

- `/tools/hra-calculator` for AY 2026-27 / FY 2025-26.
- Effective-dated HRA policy bundle with explicit old/new regime boundary, named Rule 2A city cap branch, turnover-commission salary base, rented-accommodation/stable-period gates and unsupported-assessment-year stop.
- GST Invoice policy summary that names the policy selected by invoice date; unsupported historical dates remain blocked by the policy resolver and validation path.
- Local-only HRA form, print summary, source links, limitations, reviewer status and privacy copy. HRA fields and results are excluded from analytics, URLs, logs and persistence.

## Official source boundary

The HRA policy cites the [CBDT e-Filing ITR-4 Validation Rules for AY 2026-27](https://www.incometax.gov.in/iec/foportal/sites/default/files/2026-05/CBDT_e-Filing_ITR%204_Validation%20Rules_AY%202026-27.pdf), [Income Tax Department Rule 2A](https://wmstatic-prd.incometaxindia.gov.in/web/guest/w/rule-2a-1) and the [Income Tax Department FAQ on the new versus old tax regime](https://www.incometax.gov.in/iec/foportal/help/new-tax-vs-old-tax-regime-faqs?mobile-app=1) for the arithmetic, named city boundary and section 10(13A) regime boundary. The tool does not decide salary definitions, rent-record genuineness, return acceptance or filing eligibility.

## Verification evidence

- `npm run format:check`, `npm run lint`, `npm run typecheck` — passed; lint has six existing Next.js internal-navigation warnings and no errors.
- Focused HRA/policy/privacy/registry/discovery checks — 5 files, 32 tests passed.
- Serialized `npx vitest run --maxWorkers=1 --no-file-parallelism` — 25 files, 232 tests passed.
- `npm run build` — passed; 55 prerendered routes plus 2 dynamic routes, including 28 published tool routes.
- Focused Playwright `desktop-1440` — 1 HRA smoke test passed. Responsive layout matrix intentionally not repeated.

## Remaining gates

The remaining Phase 4 sub-waves are now implemented and publicly available as a controlled beta. The `phase4-tax-review` flag is enabled by default for this personal project, while named tax/payroll reviewer status and golden-fixture signatures remain visible governance follow-ups.
