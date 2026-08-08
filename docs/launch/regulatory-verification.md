# GST regulatory verification

Reviewed 8 August 2026. The application exposes only the 5% and 18% unclassified headline presets. It does not infer classification, exemptions, place of supply, filing treatment or a legally applicable rate.

| Source                                      | Authority         | URL check       | Application use                                       | Status |
| ------------------------------------------- | ----------------- | --------------- | ----------------------------------------------------- | ------ |
| Notification No. 09/2025-Central Tax (Rate) | CBIC              | HTTP 200; HTTPS | Rate-schedule context and effective date              | PASS   |
| 56th GST Council meeting release            | GST Council / PIB | HTTP 200; PDF   | Headline structure and implementation context         | PASS   |
| GST Reforms 2025 explainer                  | PIB               | HTTP 200; PDF   | Headline structure and limitations                    | PASS   |
| Nine Years of GST summary                   | Government / PIB  | HTTP 200; PDF   | Current headline-rate and special-rate context        | PASS   |
| GST Council April 2026 newsletter           | GST Council       | HTTP 200; PDF   | Subsequent amendment/classification freshness context | PASS   |

All source URLs are HTTPS on the authority allowlist, have explicit accessed dates, and validate through `validateGstPolicyBundle`. The active bundle remains `gst-general-rates-2025-09-22-v1`, with 5% and 18% source-backed presets. The 40% special de-merit category and item-level changes are intentionally not exposed as generic calculator choices.

No source was automatically changed from a non-authoritative feed. No unsupported preset was added.
