# Local production-gateway AI retest — 30 October 2026

The user authorized up to 12 new live generation attempts. This retest used the local production build at `localhost:3001`, the configured Groq provider, synthetic briefs and the normal `/api/ai/assist` route. It made nine HTTP requests: seven received provider output, one reached a provider rate limit and returned a deterministic fallback, and the ninth received the application's HTTP 429. No rate limit was bypassed; testing stopped at that response. The public deployment was not changed.

Reproduction script: [evidence/live-ai-retest.mjs](./evidence/live-ai-retest.mjs). Full synthetic requests and responses: [evidence/live-ai-retest-results.json](./evidence/live-ai-retest-results.json).

| Scenario | Result | Key observation |
| --- | --- | --- |
| English business name | Groq | Six distinct names, but the provider's prose invented ingredients, suppliers, marketing channels and customer traits. A subsequent local code fix now uses provider names only and retains deterministic brief prose. |
| Standard pricing | Deterministic fallback, `invalid-provider-output` | INR metrics were internally consistent; the live wording did not pass the strict financial prose gate. |
| Original startup-cost regression | Deterministic fallback, `invalid-provider-output` | Gateway metrics correctly used all five cost rows: ₹65,000 one-time, ₹70,000 monthly and ₹5,33,500 funding. |
| Food business plan | Deterministic fallback, `invalid-provider-output` | The live wording did not pass the strict numeric/fact gate. The fallback exposed awkward grammar and a doubled period; a subsequent local code fix corrected these templates. |
| Hindi business name | Groq | Six Devanagari names. Provider prose invented natural ingredients, product varieties and customer groups. The same names-only code fix now discards that prose. |
| Indian-grouped pricing | Deterministic fallback, `invalid-provider-output` | `1,00,000` was accepted; list price ₹1,25,000 and contribution ₹25,000 were correct for the entered scenario. |
| Indian-grouped startup costs | Deterministic fallback, `invalid-provider-output` | Grouped rows were accepted; one-time ₹1,25,000, monthly ₹1,00,000 and funding ₹4,46,250 were correct. |
| Tailoring business plan | Deterministic fallback, `provider-rate-limited` | The provider returned a rate limit. The fallback preserved the user's supplied facts. |
| Hinglish business name | HTTP 429 | The application's eight-request window was exhausted; no provider attempt occurred. Testing stopped. |

Provider success in this retest is limited to the two naming requests. The five `invalid-provider-output` outcomes are **safety fallbacks**, not evidence that the live financial or plan assistants produced useful AI text. The production gateway now logs only low-cardinality outcome and latency categories, so post-release fallback rates can be monitored without storing briefs. Live provider wording after the names-only change remains untested because the rate limit was reached.
