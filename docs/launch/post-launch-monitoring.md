# Post-launch monitoring plan

Monitor aggregate, privacy-safe signals only:

- 404 rate and route error rate
- tool-view/start/completion and validation-failure counts
- search zero-result rate using normalized, low-risk terms or aggregates
- PDF/download/print failure counts
- response time and Core Web Vitals
- accessibility reports and browser-specific issues
- calculation/error reports and broken-source reports
- GST source changes and review due dates

Never collect financial amounts, GSTINs, names, addresses, invoice numbers, URLs, UPI IDs, notes, logos or document contents for monitoring. The repository currently has no external analytics or error-monitoring transport; configure one only after a privacy review and redaction test.

Suggested cadence: first-day checks at 1h/4h/12h/24h, daily for the first week, then weekly review. Assign an owner for source freshness, support/contact delivery, deployment health and calculation reports before launch.
