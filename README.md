# KarobarKit

An original, privacy-first business toolkit for Indian freelancers, retailers and small businesses.

The current public beta includes business economics, GST and tax, finance, startup metrics, marketplace estimates,
salary tools, document/QR generators and Phase 6 AI assistants. Calculators remain deterministic; AI assistants create
editable drafts and never replace the calculator, policy or compliance authority.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality gates

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright covers 320, 360, 390, 430, 768, 1024, 1280 and 1440 CSS-pixel viewports, keyboard journeys, print geometry and axe checks. Install the browser once with `npx playwright install chromium` when setting up a new machine.

`npm run preview` builds and starts the production server. `npm start` serves an already-built production bundle.

## Privacy boundary

Calculator values, URLs, UPI standee details, document fields and selected logos stay in the browser. QR images, payment URIs,
document previews and PDFs are generated locally. Phase 6 assistants are the explicit network exception: after consent,
only declared fields are sent through the server gateway. Known contact/tax-ID patterns are redacted, while obvious identity,
payment and credential data are rejected. Provider keys never reach the browser, prompts/drafts are not saved by this app, and
no-key deployments use deterministic fallback templates. The
analytics adapter accepts only allowlisted, non-sensitive metadata; financial values, URLs, UPI IDs, names, notes, logos
and payloads are rejected from event properties. Error boundaries use safe logging that never receives form state.

### Phase 6 provider setup

AI assistants work without a provider key. To enable a free-tier provider locally, copy `.env.example` to `.env.local` and
set either `GEMINI_API_KEY` (Google AI Studio) or `GROQ_API_KEY` (Groq). Keep `AI_PROVIDER=auto` to prefer Gemini and fall
back to Groq, or set it to `gemini`/`groq` explicitly. These are server-only variables; never prefix them with `NEXT_PUBLIC_`.
The Groq default is `openai/gpt-oss-20b`; choose a model listed as supporting the requested output mode. For multi-instance
deployments, configure `AI_RATE_LIMIT_SHARED_ENDPOINT` and its server-only token for an atomic shared counter. The default
public-beta window is eight valid requests per client per ten minutes; a personal deployment can set the server-only
`AI_RATE_LIMIT_PER_WINDOW` to a value from 1 to 100. The selected
provider's own retention, quota and usage terms apply. See `docs/product-spec/phase-6-implementation-status.md` for the
gateway boundary and release gates.

With a configured server-only key, `PHASE6_LIVE_PROVIDER_TESTS=1 npm test -- --maxWorkers=1 tests/integration/ai-provider-contract.test.ts` runs the opt-in provider contract check; it is skipped by default.

## Structure

- `src/domain/calculations` — pure decimal-safe calculation functions and validation
- `src/domain/qr` — pure URL normalization and UPI payment URI construction
- `src/domain/documents` — pure document models, validation, formatting, templates and logo processing
- `src/domain/registry` — typed tool metadata, sources, SEO, FAQs and relationships
- `src/domain/ai` — redaction, prompt versions, provider gateway contracts, limits and deterministic drafts
- `src/domain/formatting` — Indian grouping, currency, percentage, date and decimal parsing
- `src/lib/qr` — local QR rendering, safe PNG export, print preparation and privacy boundaries
- `src/lib/documents` — lazy PDF generation, print preparation and export error handling
- `src/components` — accessible UI, layout and calculator shells
- `src/app` — App Router routes, metadata, sitemap and security boundaries
- `tests/unit` and `tests/integration` — independent calculations and form behavior
- `tests/e2e` — responsive, keyboard, metadata and accessibility coverage
