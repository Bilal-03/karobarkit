# Calculation verification

Independent verification recorded 8 August 2026. Expected values were calculated from the documented formulas and checked against the pure domain functions and existing golden tests.

| Area                   | Test input                            | Expected                                | Actual                         |                                  Difference | Verdict |
| ---------------------- | ------------------------------------- | --------------------------------------- | ------------------------------ | ------------------------------------------: | ------- |
| CAGR                   | ₹1,00,000 → ₹1,61,051 over 5 years    | 10.00% approximately                    | 10.00% UI/test result          | 0.00 percentage points at display precision | PASS    |
| ROI                    | Cost ₹1,00,000; final value ₹1,25,000 | Profit ₹25,000; ROI 25%                 | ₹25,000; 25%                   |                                           0 | PASS    |
| ROI loss               | Cost ₹1,00,000; final value ₹80,000   | Loss ₹20,000; ROI -20%                  | -₹20,000; -20%                 |                                           0 | PASS    |
| GST exclusive          | ₹1,000 at 18%                         | Tax ₹180; total ₹1,180                  | ₹180.00; ₹1,180.00             |                                           0 | PASS    |
| GST inclusive          | ₹1,180 at 18%                         | Taxable ₹1,000; tax ₹180                | ₹1,000.00; ₹180.00             |                                           0 | PASS    |
| GST intra-state        | ₹1,000 at 18%                         | CGST ₹90 + SGST ₹90                     | ₹90.00 + ₹90.00                |                                           0 | PASS    |
| GST inter-state        | ₹1,000 at 18%                         | IGST ₹180                               | ₹180.00                        |                                           0 | PASS    |
| GST odd paise          | ₹0.01 at 50%, intra-state             | GST ₹0.01; CGST ₹0.01; SGST ₹0.00       | Same                           |                                           0 | PASS    |
| GST custom rate        | ₹100 at 5.5%                          | GST ₹5.50; total ₹105.50                | Same; custom warning visible   |                                           0 | PASS    |
| Invoice single line    | 1 × ₹1,000 at 18%, intra-state        | Tax ₹180; total ₹1,180                  | Same                           |                                           0 | PASS    |
| Invoice discount       | ₹5,000 less 10% at 18%, inter-state   | Taxable ₹4,500; IGST ₹810; total ₹5,310 | Same                           |                                           0 | PASS    |
| Invoice multiple rates | ₹100 each at 5%, 18%, custom 12%      | Three tax groups with reconciled totals | Three groups; totals reconcile |                                           0 | PASS    |

Policy-expiration behavior is covered by validation tests: a date without a reviewed policy is rejected, while a stale policy produces a warning without silently changing rates.
