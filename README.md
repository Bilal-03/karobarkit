# KarobarKit

An original, privacy-first foundation for practical business tools aimed at Indian freelancers, retailers and small businesses.

This milestone ships four focused tools:

- CAGR Calculator
- ROI Calculator
- URL QR Generator
- UPI Standee Generator

The shared registry, formatting, validation, QR rendering and export architecture is ready for later tools. GST, other document generators, accounts, databases, admin features and AI are explicitly out of scope for this milestone.

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

Playwright covers 320, 360, 390, 430, 768, 1024 and 1440 CSS-pixel viewports, keyboard journeys and axe checks. Install the browser once with `npx playwright install chromium` when setting up a new machine.

`npm run preview` builds and starts the production server. `npm start` serves an already-built production bundle.

## Privacy boundary

Calculator values, URLs and UPI standee details stay in the browser. QR images and payment URIs are generated locally; no QR content is stored or sent to a server. The analytics adapter accepts only allowlisted, non-sensitive metadata; financial values, URLs, UPI IDs, names, notes and payloads are rejected from event properties. Error boundaries use safe logging that never receives form state.

## Structure

- `src/domain/calculations` — pure decimal-safe calculation functions and validation
- `src/domain/qr` — pure URL normalization and UPI payment URI construction
- `src/domain/registry` — typed tool metadata, sources, SEO, FAQs and relationships
- `src/domain/formatting` — Indian grouping, currency, percentage, date and decimal parsing
- `src/lib/qr` — local QR rendering, safe PNG export, print preparation and privacy boundaries
- `src/components` — accessible UI, layout and calculator shells
- `src/app` — App Router routes, metadata, sitemap and security boundaries
- `tests/unit` and `tests/integration` — independent calculations and form behavior
- `tests/e2e` — responsive, keyboard, metadata and accessibility coverage
