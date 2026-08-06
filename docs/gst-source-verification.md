# GST source-verification summary

Status: reviewed for Milestone 4 on 6 August 2026.

This summary records the official material used to define the GST Calculator's deliberately narrow policy. It is a source register, not tax advice and not a complete GST rate database.

## Sources reviewed

| Authority                 | Official material                                                                                                                                            | Publication / effective context                                                                                   | What was confirmed                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CBIC Tax Information      | [Notification No. 09/2025-Central Tax (Rate)](https://taxinformation.cbic.gov.in/view-pdf/1010436/ENG/Notifications)                                         | Issued 17 September 2025; the revised schedule is used from 22 September 2025 in the reviewed Government material | The notified central-tax rate schedule is source material for the post-reform framework. Item-level classification is outside this calculator.                                   |
| GST Council               | [56th GST Council meeting press release](https://gstcouncil.gov.in/sites/default/files/2025-09/press_release_press_information_bureau.pdf)                   | Meeting 3 September 2025; rate changes generally planned from 22 September 2025                                   | The Council material describes the rate changes, the phased exception for specified tobacco goods, and the fact that recommendations take effect through notifications / law.    |
| Government of India / PIB | [GST Reforms 2025: Relief for Common Man, Boost for Businesses](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/sep/doc202594628401.pdf) | 4 September 2025; revised rates and exemptions described as effective from 22 September 2025                      | The reform is described as primarily 5% and 18%, with exemptions and category-specific changes.                                                                                  |
| Government of India / PIB | [Nine Years of GST: Simplifying Taxation, Strengthening India](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jul/doc202671908001.pdf)  | 30 June 2026                                                                                                      | The current Government summary still describes the structure primarily as 5% and 18%, with a 40% luxury / sin category. It also describes the CGST/SGST and IGST dual structure. |
| GST Council               | [April 2026 GST Council newsletter](https://gstcouncil.gov.in/sites/default/files/2026-05/newsletter_april_issue.pdf)                                        | Published May 2026; reports Notification No. 01/2026-Central Tax (Rate) dated 30 April 2026                       | Subsequent updates changed classification entries for beverages. They reinforce that a generic calculator cannot decide a product's rate from the percentage alone.              |

All links were accessed on 6 August 2026. The source links are controlled application data; they are never accepted from calculator input and are not scraped at runtime.

## Confidently implemented

- A deterministic percentage calculation for an amount the user has already selected as taxable or tax-inclusive.
- Current, source-backed headline presets of 5% and 18%, presented as choices rather than classifications or recommendations.
- A custom percentage from 0% through 100%, to two decimal places, with an explicit user-responsibility warning.
- Explicit exclusive / inclusive modes.
- Explicit intra-state, inter-state and total-only allocation choices.
- CGST plus SGST/UTGST wording that does not choose a State tax versus Union Territory tax.
- IGST as the total interstate GST amount.
- Effective dates, source IDs, policy version, verification date and stale-review status in controlled policy data.

## Excluded or blocked

- 40%: officially described as a special rate for specified goods and services; no product or service classification is collected here.
- Nil / exempt treatment: eligibility depends on the supply and the applicable schedule or exemption entry.
- 12% and 28% as current presets: they are not presented as current general presets after the reviewed reform material.
- Historical rate selection by transaction date: the policy model supports effective dating, but this milestone does not collect a product, service, HSN/SAC or historical transaction classification.
- The deferred transition for specified tobacco goods, compensation cess, reverse charge, ITC, place of supply, registration, filing and all other legal determinations listed in the milestone brief.

## Review decision

The calculator may perform transparent arithmetic, but it must not answer “what rate applies?” for a product or service. Every preset is labelled as a source-backed headline choice, and every result carries the classification, place-of-supply and regulatory disclaimer.
