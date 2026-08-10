# Phase 6 implementation status — AI assistants

**Status:** initial public-beta implementation complete on 10 August 2026. The four assistant routes are visible by default,
but AI safety review, red-team evaluation, provider quota monitoring and independently reviewed fixtures remain release gates.
No paid provider key is required: without a configured Gemini or Groq key, the same route returns a deterministic draft.

## Delivered

- `business-name-generator` — naming brief and six deterministic shortlist templates; never claims domain, trademark,
  company-name or social-handle availability.
- `pricing-assistant` — deterministic list price, discount, arithmetic tax and fee metrics; AI wording cannot change the
  numbers. The list-price solver reconciles expected discount, channel fee and shipping against the target contribution margin.
- `startup-cost-estimator` — entered one-time/monthly cost lines, selected runway and contingency reconciliation; no local
  rent, salary, permit or market rate is invented.
- `business-plan-assistant` — structured executive summary, problem, solution, revenue model, milestones, constraints and
  assumptions draft; no market statistics or citations are fabricated.

## Gateway contract

The browser posts to `/api/ai/assist` only after an explicit consent checkbox. The route:

1. validates the assistant-specific schema and rejects unknown/malformed input;
2. hashes the request source for eight requests per ten minutes, using an optional shared atomic counter for multi-instance deployments;
3. hard-caps the streamed request body at 24 KB, assistant input at 6,000 characters and provider output at 700 tokens;
4. redacts known contact/tax-ID patterns and rejects obvious identity, payment and credential data before transmission;
5. sends an immutable system policy plus a JSON data payload to the configured provider within a bounded total deadline;
6. validates structured JSON output, rejects provider-created numeric claims and filters unsafe claims;
7. falls back to a deterministic template when no key, network, quota or schema response is available.

`AI_RATE_LIMIT_SHARED_ENDPOINT` can point to a deployment-owned atomic counter accepting `{ key, now, limit, windowMs }` and returning `{ allowed, remaining, resetAt }`. Without it, the bounded in-process limiter is suitable for local/public-beta use but must not be treated as a multi-instance production control.

`AI_PROVIDER_DAILY_REQUEST_LIMIT` provides a per-instance provider safety ceiling (250 by default), and three consecutive provider failures open a 60-second circuit. Multi-instance deployments should enforce the same budget and circuit policy in the shared service.

The gateway supports `AI_PROVIDER=gemini`, `AI_PROVIDER=groq` and `AI_PROVIDER=auto`. `auto` tries Gemini first and Groq
second when both server-only keys exist. The provider keys are `GEMINI_API_KEY` and `GROQ_API_KEY`; neither is exposed to
client code. The application does not save prompts or drafts, but the selected provider's own terms, retention and quota
controls still apply.

For Gemini deployments, use a server-only restricted/auth key and monitor the provider's migration guidance: [Gemini API-key security](https://ai.google.dev/gemini-api/docs/api-key).

Provider contracts are based on the official [Gemini structured-output documentation](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)
and [Groq structured-output documentation](https://console.groq.com/docs/structured-outputs). Groq defaults to
`openai/gpt-oss-20b`, a currently listed strict-schema model; custom unsupported models use validated JSON-object mode.
The implementation uses only structured draft wording from a provider; local arithmetic and approved policy records retain authority.

`tests/integration/ai-provider-contract.test.ts` is an opt-in live contract check (`PHASE6_LIVE_PROVIDER_TESTS=1`) so deployments with a free Gemini or Groq key can verify the real provider response without putting credentials in CI.

## Review and export boundary

Every result is labelled as either **AI-generated draft** or **Deterministic fallback draft** and shows the provider/fallback mode,
prompt version, warnings and redacted field count. A user can regenerate, edit the draft locally and preview it. Copy and CSV export stay disabled until the user
checks “I reviewed this draft and its assumptions”. Analytics receives tool/status metadata only; assistant field values and
draft content are not event properties. Copied exports include the provider, prompt version, deterministic metrics and review boundaries.

## Remaining Phase 6 exit gates

- Run prompt-injection, sensitive-data, fabricated-statistic and unsafe-claim red-team cases against both provider adapters.
- Add a versioned, independently signed evaluation fixture set and record reviewer names/status in the governance bundle.
- Measure provider latency, error/fallback rate and token/quota usage without storing prompt or draft content.
- Validate production environment secrets, provider restrictions, rate-limit behavior and incident/kill-switch rehearsal.
- Complete human review of representative Hindi, Hinglish, English and business-domain samples before removing the beta label.
