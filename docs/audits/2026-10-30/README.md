# Audit artifacts — 30 October 2026

Start with [REPORT.md](REPORT.md). The [coverage.csv](coverage.csv) file has one verdict per published tool. A LIMITED verdict is not a correctness pass.

Evidence:

- `evidence/registry-results.json`: 83 local definitions, examples, source metadata and calculation outcomes. Some file tools return settings rather than transforming a real file; those records do not prove file processing.
- `evidence/independent-checks.json`: 31 independently calculated comparisons. Reproduce from the repository root with `python3 docs/audits/2026-10-30/evidence/independent-checks.py`.
- `evidence/boundary-probes.json`: 1,400 numeric-field validation observations and semantic-guard reproduction. These are exploratory probes, not an asserted pass count.
- `evidence/startup-input-integrity.json`: original versus gateway-normalized cost rows and the resulting deterministic metrics.
- `evidence/live-ai-results.json`: all 12 authorized production attempts, including three fallbacks. All supplied briefs are synthetic.
- `evidence/e2e-desktop.log` and `evidence/e2e-mobile.log`: existing Chromium suites against the local production build; each contains its own final summary and deliberate skips.
- `evidence/baseline-summary.json`: quality-gate summary and exact repository revision.

The `.cjs.txt` files preserve diagnostic scripts as text evidence. They use the repository's TypeScript package to transpile imports in memory; they do not edit application modules. The live script is **not** a normal regression test: executing it again would use production AI quota. Do not replay it automatically. No credentials are stored in these artifacts.

Browser-session notes: public directory showed 83 tools after expanding all cards. Public CAGR example returned 10.00% for ₹1,00,000 → ₹1,61,051 over five years; public ROI example returned ₹25,000 profit and 25.00% for ₹1,00,000 → ₹1,25,000. Public GST navigation then timed out. A fresh pricing page loaded, but later browser interaction became unavailable. Do not infer public-site defects solely from that automation failure. Subsequent production AI verification used the documented application API directly and is recorded separately.
