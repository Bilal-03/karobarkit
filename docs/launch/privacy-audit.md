# Privacy audit

The active tool set is browser-local. No server endpoint receives calculator, QR, logo or document values.

| Data class                                       | Analytics                                    | Logs       | URL/query                                                  | Browser storage | Verdict                       |
| ------------------------------------------------ | -------------------------------------------- | ---------- | ---------------------------------------------------------- | --------------- | ----------------------------- |
| Financial inputs/results                         | Forbidden                                    | Not logged | Not placed in URL                                          | None            | PASS                          |
| GSTIN, names, addresses, invoice/receipt details | Forbidden                                    | Not logged | Not placed in URL                                          | None            | PASS                          |
| URLs, UPI IDs, notes and QR payloads             | Forbidden                                    | Not logged | Only user-entered search/tool slug paths; QR data excluded | None            | PASS                          |
| Uploaded logos/document content                  | Forbidden                                    | Not logged | Not placed in URL                                          | None            | PASS                          |
| Aggregate tool/search events                     | Allowlisted names and low-risk metadata only | N/A        | N/A                                                        | N/A             | PASS; no transport configured |

Storage audit: no `localStorage`, `sessionStorage`, IndexedDB or cookie writes were found in `src`. Data is held in React/page memory and clears on reload. Safe error logging accepts only feature/code/digest fields in development and never form state.

The general contact form currently has no delivery backend and now explicitly prepares a local copyable message without claiming delivery. A published support channel or delivery backend remains a launch-readiness dependency, not a hidden data collection path.
