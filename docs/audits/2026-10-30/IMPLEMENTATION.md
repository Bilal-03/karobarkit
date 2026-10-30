# Repair status after the 30 October 2026 audit

The source changes in this worktree address F01, F02, F03, F04, F06, F07, F08, F10 and F11 from [REPORT.md](./REPORT.md). The public deployment has not been changed.

| Finding | Repair in this worktree | Remaining verification |
| --- | --- | --- |
| F01 | Preserve startup cost rows through gateway redaction so local and API arithmetic use the same rows. | Deploy and repeat the original production fixture; live requests were capped at 12 during the audit. |
| F02/F03 | Reject provider financial prose with numeric claims or foreign currencies. Retain deterministic INR metric cards and qualitative provider wording when safe. | Observe live provider fallback rates and improve a metric-reference contract before allowing provider financial sentences. |
| F04 | Require a multi-name output, reject generic action suggestions, require Devanagari in every Hindi name, and provide a Hindi fallback shortlist. A live retest found invented facts in naming prose; a subsequent fix now uses provider names only and keeps deterministic brief prose. | Human review of naming quality and a post-release live check of the names-only merge. |
| F05 | Block the seven overdue tax/GST-calendar forms before entry. Marketplace forms retain an upfront warning and require a current seller-dashboard fixed or closing fee. See [source follow-up](./POLICY_REVIEW_FOLLOWUP.md). | Reconcile the new tax year and all controlling sources, then update policy records and tests. No source date was advanced in this worktree. |
| F06 | Accept strict Indian comma grouping in AI numeric fields, cost rows and numeric token checks. | Confirm public form behavior after deployment. |
| F07 | Clear AI results and review status when inputs change, and ignore late responses to superseded briefs. | Browser journey after deployment. |
| F08 | Query a 10-day ECB window, reject invalid or future observations, and use the newest common quote date for cross rates. | Live ECB request and UI journey after deployment. |
| F09 | Distinguish an open circuit, deadline, timeout, provider rate limit and malformed response from a generic provider error. The API reports whether an attempt actually occurred and retains the deterministic fallback. Production logs record only assistant, provider, outcome, attempted flag and a latency bucket for aggregate monitoring; no brief or response text is logged. Mocked route tests cover the failure paths. | Fresh controlled live evaluation; the previous 12-attempt cap remains exhausted. |
| F10 | Give regrouped document controls stable, unique React keys. | Browser rerender and focus check after deployment. |
| F11 | README now matches the 83 registered tools. | Regenerate the badge if tool inventory changes. |

The original coverage matrix remains an audit record. Its LIMITED and BLOCKED entries have not been promoted to PASS by these fixes.

## Follow-up verification

- Full local suite: 382 passed, one live-provider contract test skipped. Production build and TypeScript passed. ESLint had no errors and seven existing warnings.
- A local Chromium mobile check confirmed that overdue HRA and GST filing-calendar pages show no form. The Amazon fee page shows its warning and still presents its seller-input form.
- The user authorized a new cap of 12. The [live retest](./LIVE_RETEST.md) made nine local-gateway HTTP requests and stopped at the application's 429. Seven received provider output, one reached provider rate limiting, and the last was blocked by the application. Two provider outputs were accepted; five failed the financial/fact safety gate and returned deterministic drafts.
- No deployment or policy-date refresh was made. The public site therefore has not been verified with this worktree's fixes.
