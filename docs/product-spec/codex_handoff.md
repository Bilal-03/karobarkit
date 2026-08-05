# Codex Handoff Prompt — Original India-First Business Tools Platform

## Role

Act as the lead product engineer and implementation agent for an original, privacy-first, India-focused business tools platform. Build from this specification, not by copying India Biz Tools branding, text, layouts, code or assets.

## Product Goal

Create a fast, trustworthy, mobile-first web platform for Indian small retailers, freelancers, consultants, service businesses, MSMEs and aspiring entrepreneurs. Users must be able to calculate, generate and export common business outputs without mandatory registration.

## Non-Negotiable Principles

1. Deterministic calculations use pure, tested functions. Never ask an LLM to perform arithmetic.
2. Every legal, tax or payroll rule has an official source, effective date, version and last-reviewed date.
3. Basic tools work without an account.
4. Local-first processing is the default for documents, images and QR codes.
5. Never send financial inputs, document contents, UPI IDs, Wi-Fi passwords or personal data to analytics.
6. Do not create realistic fake utility, telecom or bank documents. Exclude those tools from the MVP.
7. Use an original design system and original copy.
8. Meet WCAG 2.2 AA for core journeys.
9. Implement tests before declaring a calculator or generator complete.
10. Do not invent APIs, credentials or regulatory assumptions.

## Approved MVP Sitemap

- `/`
- `/tools`
- `/tools/[slug]`
- `/categories/[slug]`
- `/search`
- `/methodology`
- `/sources`
- `/about`
- `/contact`
- `/faq`
- `/privacy`
- `/terms`
- `/disclaimer`
- `/report-an-error`
- `/404`

## MVP Tool Set

P0:

1. GST Calculator
2. GST Invoice Generator
3. Payment Receipt Generator
4. Letterhead Generator
5. UPI Standee Generator
6. URL QR Generator
7. CAGR Calculator
8. ROI Calculator

P1 after the shared engine is stable: 9. Rent Receipt Generator 10. Wage Slip Generator 11. Logistics Documents 12. Media Suite 13. vCard QR 14. Wi-Fi QR 15. QR/Barcode Scanner 16. Area Converter with mandatory region selection for regional units 17. Business Days Calculator 18. EBITDA Calculator 19. HSN/SAC Finder with versioned official dataset

Do not build salary/take-home, real-time currency, AI content generation or account features until the P0/P1 quality gates are passed.

## Recommended Stack

- Next.js latest stable App Router with TypeScript
- React Server Components for content shells and SEO; client components only where interactive
- Tailwind CSS or CSS Modules with design tokens; do not import benchmark-site styles
- React Hook Form + Zod for forms
- Pure TypeScript calculation packages under `src/domain/calculations`
- Vitest for unit/property tests
- Playwright for end-to-end, mobile, accessibility and print flows
- axe-core integration
- `next-intl` or equivalent for English/Hindi architecture, even if Hindi ships later
- Client-side PDF/print where reliable; server PDF service only when necessary
- QR library with explicit payload tests
- Sentry-compatible error monitoring with input redaction
- Privacy-conscious analytics such as Plausible or a self-hosted equivalent; event allowlist only
- Vercel or Cloudflare deployment for MVP
- PostgreSQL only when saved profiles/accounts/admin workflows are introduced

## Suggested Repository Structure

```text
src/
  app/
    (marketing)/
    tools/
    categories/
    search/
    methodology/
    sources/
  components/
    ui/
    forms/
    results/
    print/
    seo/
  domain/
    calculations/
    documents/
    qr/
    formatting/
    policies/
  features/
    gst-calculator/
    gst-invoice/
    payment-receipt/
    letterhead/
    upi-standee/
    url-qr/
    cagr/
    roi/
  content/
    tools/
    categories/
    sources/
  lib/
    analytics/
    storage/
    security/
    validation/
  styles/
  tests/
    unit/
    integration/
    e2e/
    fixtures/
```

## Shared Tool Contract

Implement a typed, schema-driven tool registry.

```ts
type EvidenceLevel = 'official' | 'authoritative' | 'editorial';

interface SourceReference {
  id: string;
  title: string;
  publisher: string;
  url: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  lastChecked: string;
  evidenceLevel: EvidenceLevel;
}

interface ToolDefinition<TInput, TResult> {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string;
  inputSchema: unknown;
  defaultValues: Partial<TInput>;
  calculate?: (input: TInput, context: PolicyContext) => TResult;
  renderResult: (result: TResult) => React.ReactNode;
  sources: SourceReference[];
  limitations: string[];
  lastReviewed: string;
  seo: {
    title: string;
    description: string;
    keywords?: string[];
  };
  relatedToolIds: string[];
  analyticsPolicy: {
    allowedEvents: string[];
    forbiddenProperties: string[];
  };
}
```

## GST Requirements

- Do not hard-code a single timeless set of rates into the UI.
- Create a versioned policy table keyed by effective date and category/rule.
- The transaction date must control available defaults.
- Support custom rate only with an explanatory label.
- Separate intrastate CGST/SGST from interstate IGST.
- Implement inclusive and exclusive calculations as pure decimal-safe functions.
- Define rounding at line and invoice level.
- Test:
  - ₹1,000 exclusive at 18% → tax ₹180; total ₹1,180.
  - ₹1,180 inclusive at 18% → taxable ₹1,000; tax ₹180.
  - Intrastate ₹180 tax → CGST ₹90 + SGST ₹90.
  - Interstate ₹180 tax → IGST ₹180.
- Display official sources, effective date, last-reviewed date and a report-error link.
- Never describe output as professional tax advice.

## Document Generator Requirements

- Separate data model from template presentation.
- Store drafts in memory/local storage only unless user explicitly saves to an account later.
- Add “Clear local data” controls.
- A4, 58mm and 80mm print styles where applicable.
- Avoid raster-only text; generate selectable text in PDF where possible.
- Add print preview, validation summary and export failure handling.
- Generated payment receipts must state that they record a declared payment and are not bank confirmation.
- No realistic fake bills, government documents or telecom-provider replicas.

## Form and Validation Requirements

- Every input has a programmatic label, help text where needed and an inline error.
- Submit displays an accessible error summary linked to fields.
- Support Indian currency grouping without corrupting numeric parsing.
- Reject NaN, infinity, unsafe precision, invalid dates and impossible combinations.
- Preserve user input after validation failure.
- Reset requires confirmation when data is non-empty.
- No sensitive values in URLs.

## Design Direction

Original, lightweight and trustworthy:

- Mobile-first single-column forms; split form/result only when space permits.
- Strong heading hierarchy and clear primary action.
- Neutral professional surfaces with one restrained accent.
- Minimum 44×44 px touch targets.
- Visible keyboard focus.
- Results show headline value, breakdown, interpretation, source and next action.
- Use cards sparingly; prioritize readable sections over dashboard clutter.
- Do not copy India Biz Tools colors, illustrations, wording, logo or exact component geometry.

## SEO Requirements

- Unique title, description, canonical and H1 for every route.
- One canonical URL per tool.
- Generate sitemap from the tool registry.
- Tool pages include: introduction, how to use, formula/method, worked example, result interpretation, official sources, FAQs, last-reviewed date, disclaimer and related tools.
- Add BreadcrumbList and appropriate WebApplication/SoftwareApplication schema only where accurate.
- CI test: route slug, metadata, H1 and canonical refer to the same tool.
- No thin, state-spam or duplicate programmatic pages.

## Privacy and Security Requirements

- Content Security Policy, HSTS, Referrer-Policy, Permissions-Policy and nosniff.
- Sanitize document text and uploaded filenames.
- Validate image type by content, not extension.
- Limit file size and dimensions.
- Never auto-open scanned QR URLs.
- Redact all form values from telemetry and error breadcrumbs.
- Rate-limit any server endpoints.
- Use signed, unguessable URLs with short retention if server-generated files are ever introduced.
- Add dependency scanning and secret scanning in CI.

## Accessibility Requirements

- WCAG 2.2 AA.
- Logical heading order, landmarks, skip link, keyboard support and visible focus.
- Announce validation and calculation results.
- Accessible tables with captions and headers.
- Text alternatives for charts.
- Respect reduced-motion.
- Test at 200% zoom and 320 CSS px width.
- Include axe checks in Playwright.

## Analytics Events

Allowed event names:

- `tool_viewed`
- `tool_started`
- `tool_completed`
- `tool_validation_failed`
- `result_generated`
- `result_printed`
- `result_downloaded`
- `result_copied`
- `result_shared`
- `related_tool_opened`
- `search_performed`
- `search_zero_results`
- `feedback_submitted`

Allowed properties are non-sensitive metadata such as tool ID, category, device class and validation error code. Never include amounts, names, addresses, tax IDs, UPI IDs, Wi-Fi details, document contents or scanned values.

## Definition of Done for Every Tool

- Requirements and non-goals approved.
- Official or authoritative methodology source recorded.
- Pure calculation/transform code implemented.
- Unit and boundary tests pass.
- Validation and error recovery pass.
- Mobile 320/360/390/430 px checks pass.
- Keyboard-only journey passes.
- axe has no critical/serious violations.
- Print/PDF snapshots pass where relevant.
- Metadata/canonical/structured data checks pass.
- Analytics payload contains no sensitive values.
- Privacy statement accurately describes processing.
- Source and last-reviewed date are visible.
- Error-reporting link works.
- Product owner signs off independent expected results.

## Implementation Sequence

1. Initialize repository, linting, type checking, test runners and preview deployment.
2. Build design tokens and accessible primitives.
3. Build tool registry, category/search metadata and route generation.
4. Build formatting, validation, decimal and policy modules.
5. Build CAGR and ROI first to prove the engine.
6. Build URL QR and UPI standee to prove export and payload testing.
7. Build letterhead and payment receipt to prove document/print engine.
8. Build versioned GST calculator.
9. Reuse GST engine in the invoice generator.
10. Add content/source blocks, structured data and analytics allowlist.
11. Run security, privacy, accessibility, performance and cross-browser gates.
12. Launch only the approved P0 set; use measured demand to prioritize P1.

## Final Instruction

Work in small, reviewable commits. Before each feature, state the files to change and the tests to add. Do not silently change product scope, invent formulas, or add AI. When a requirement cannot be verified, create a blocking issue with the exact missing source or decision instead of guessing.
