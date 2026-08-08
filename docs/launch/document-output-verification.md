# Document-output verification

Evidence sources: unit/integration tests, Chromium E2E print/download journeys, and the deterministic document model. No user data or real payment was used.

| Output          | Coverage                                                                                                                                           | Result | Limitation                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Letterhead      | Minimum/all fields, logo validation and local processing, long text pagination, PDF download, print                                                | PASS   | Browser print rendering is the final fallback for uncommon fonts/scripts |
| Payment receipt | Minimum/optional fields, amount in words, long text, PDF download, print, reset/error paths                                                        | PASS   | It is explicitly an acknowledgement, not bank confirmation               |
| GST invoice     | Single/multiple lines, multiple rates, custom rate, discount, intra/inter-state, tax groups, multiple A4 pages, PDF download, print, safe filename | PASS   | Browser print is recommended if PDF font loading is unavailable          |

Validated invariants include A4 page models, deterministic page chunks, visible totals, line/tax reconciliation, no unsafe filenames, and no uploaded logo SVG support. Chrome PDF/download/print behavior is covered by Playwright. Safari PDF behavior and physical printer output remain not tested in this environment.
