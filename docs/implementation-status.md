# Milestone 4 implementation status

Status: complete. Final quality checks passed on 6 August 2026.

This milestone adds the source-backed GST Calculator at `/tools/gst-calculator`, with an effective-dated policy bundle, official-source documentation, pure decimal-safe calculations, explicit supply-type choices, accessible result explanations and privacy-safe browser-only behavior.

## Policy boundary

- Active policy: `gst-general-rates-2025-09-22-v1`, effective 22 September 2025, last verified 6 August 2026.
- Visible current presets: 5% and 18% source-backed headline rates.
- Deliberately excluded: 40%, nil/exempt, 12% and 28% presets, classification, HSN/SAC, place of supply, CGST versus UTGST determination, reverse charge, ITC, returns, registration and tax advice.
- Policy data is controlled code with source references and a 180-day freshness warning. The browser does not scrape or replace policy data at runtime.

## Validation and calculation

- Positive finite INR amounts up to ₹999,999,999,999,999.99, with at most two decimal places.
- Custom rates from 0% to 100%, with at most two decimal places and an explicit warning.
- Exclusive and inclusive formulas use `decimal.js`; final currency values use half-up two-decimal rounding.
- Intra-state output splits displayed GST into CGST plus an SGST/UTGST remainder; inter-state output labels the full amount IGST; unspecified supply type shows total GST only.
- Rounding adjustments and limitations are visible in the result.

## Verification

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm test` — 11 files, 125 tests passed
- `npm run test:e2e` — 169 passed, 15 intentional skips across 320, 360, 390, 430, 768, 1024, 1280 and 1440 px projects
- `npm run build` — production build passed; 31 static pages generated

No invoice generator or other next-milestone feature was started. The next milestone should begin only after a new reviewed specification and source-verification pass.
