# Tool contract v2

**Status:** Accepted Phase 0 architecture contract
**Applies to:** Every planned or live KarobarKit tool
**Implementation:** Phase 1 introduces compatible TypeScript types and per-tool modules.

## 1. Purpose

The tool contract makes catalogue growth predictable. A tool is a governed product unit with a canonical identity, validated execution model, declared policy and privacy dependencies, content, tests, owner, and lifecycle. It is not merely a page component.

The existing `ToolDefinition` remains the working runtime contract until Phase 1 migrates it. Phase 1 must preserve current live routes and behavior while adding the fields below.

## 2. Tool kinds

| Kind          | Contract                                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `calculator`  | Validated inputs produce one deterministic result through a pure function.                                                                                      |
| `worksheet`   | A collection of deterministic subcalculations and assumptions produces a reconciled scenario.                                                                   |
| `comparison`  | Two or more normalized scenarios are evaluated against declared metrics; it cannot recommend a provider unless an independently approved ranking policy exists. |
| `generator`   | Validated user content produces a local artifact or payload with a preview and export contract.                                                                 |
| `data-backed` | A deterministic engine depends on a reviewed effective-dated external data snapshot.                                                                            |
| `ai-assisted` | A network model produces an editable structured draft; deterministic engines and approved policy content retain authority.                                      |

One tool has one primary kind. Capabilities such as PDF export, CSV import, QR output, AI explanation, or optional save are declared separately.

## 3. Execution modes

| Mode                      | Required behavior                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `local-only`              | Inputs and output content do not leave the browser. No hidden persistence.                                             |
| `local-with-bundled-data` | Execution stays local and uses a versioned reviewed data snapshot shipped with the application.                        |
| `network-required`        | A just-in-time notice declares transmitted fields, purpose, provider class, retention, and fallback before submission. |
| `optional-cloud-sync`     | Local use remains available; the user explicitly chooses authenticated storage or synchronization.                     |

Execution mode is a factual data-flow declaration and must be verified in tests. Marketing copy cannot override it.

## 4. Required definition fields

### Identity and discovery

- `id`: stable unique identifier.
- `canonicalSlug`: unique route slug.
- `aliases`: legacy or search aliases; never duplicate canonical pages.
- `name` and optional `shortName`.
- `primaryCategoryId` and `secondaryCategoryIds`.
- `tags`, `searchTerms`, `audiences`, and intent phrases.
- `status`: `internal`, `beta`, `live`, `stale-disabled`, or `retired`.
- `targetPhase` and feature-flag key where applicable.

### Execution

- `kind` and `capabilities`.
- `executionMode`.
- Versioned input and output schemas.
- Defaults are explicitly example data; they cannot be mistaken for user data.
- Validation entry point and stable error codes.
- Pure calculation/generation entry point where applicable.
- Units, date convention, compounding convention, precision, and rounding policy.
- Supported and unsupported fact patterns.

### Risk and policy

- `riskTier`: A through D.
- `regulatory`: boolean plus jurisdictions when true.
- `policyFamilyIds` and policy resolver requirements.
- `sourceIds` with supported-claim mapping.
- Applicable-date input and resolution rule where policy can change.
- Owner role, reviewer role, named reviewer sign-off when required.
- `verifiedOn`, `nextReviewOn`, stale behavior, and kill-switch key.
- Golden fixture set and approval record.

### Privacy and analytics

- Data-flow declaration listing every input class and destination.
- Persistence mode and retention.
- Sensitive-field list and redaction rules.
- Allowed analytics events and allowed property names.
- Forbidden analytics/log fields.
- Export contents and filename policy.

### Product content

- One-sentence purpose and audience.
- Input help and how-to steps.
- Formula or method in plain language.
- Worked example based on independent fixtures.
- Result interpretation and next-step actions.
- Assumptions, limitations, edge cases, disclaimer, and privacy note.
- Sources and exactly which claims they support.
- FAQs, SEO metadata, related tools, and workflow hand-offs.

## 5. Common result envelope

Every deterministic execution returns one of three states:

```text
success
  result
  calculationVersion
  policyVersionIds[]
  assumptions[]
  roundingAdjustments[]
  warnings[]

invalid
  fieldErrors[]
  formErrors[]
  stableErrorCodes[]

unsupported
  reasonCode
  explanation
  missingFacts[]
  safeNextStep
```

`unsupported` is a first-class safe result. A regulated tool must stop instead of using a nearby rule when the facts or applicable policy are not supported.

## 6. Calculator contract

- The domain function has no DOM, React, storage, analytics, clock, locale, or network dependency.
- All context enters explicitly: inputs, calculation version, and resolved policy context.
- Currency and statutory percentages use decimal values rather than binary floating point.
- Zero denominators, negative values, extreme values, and missing periods are handled intentionally.
- The UI displays the same inputs, assumptions, units, and version used by the engine.
- A calculation never chooses a legally applicable rate unless classification and eligibility are explicitly in scope and reviewed.

## 7. Worksheet contract

- Each section has a typed submodel and reconciles into a summary.
- Users can see which values are entered, derived, default assumptions, or policy values.
- Changes to assumptions update dependent outputs deterministically.
- Import/export has a versioned schema and rejects ambiguous columns or units.
- Forecasts show time horizon, scenario, and missing-data limitations.

## 8. Comparison contract

- Normalize term, frequency, taxes, fees, timing, and unit conventions before comparison.
- Display both normalized and original inputs.
- Show total-cost and scenario differences; do not reduce a decision to one promotional number.
- Ranking is excluded unless its policy, commercial conflicts, and evidence are separately approved.
- Provider rates are user-entered in V1 unless a reviewed data integration is explicitly declared.

## 9. Generator contract

- User content is validated and escaped before preview and export.
- Uploaded assets have type, size, dimension, and decoding limits.
- Preview, print, and file output use the same document model.
- Filename construction is sanitized and contains no unnecessary personal data.
- Document status is explicit: quotation, invoice, receipt, draft, or preview.
- The generator cannot imply filing, delivery, settlement, verification, IRN, e-signature, or government approval without a real integration and receipt.
- Realistic government, bank, utility, identity, or compliance-document replicas are prohibited.

## 10. Data-backed contract

- External values live in an immutable effective-dated snapshot.
- A source snapshot records publication/effective/access dates, checksum or evidence artifact, owner, reviewer, and status.
- Runtime scraping cannot activate values.
- The result shows data version and last verified date.
- Stale state is visible; the policy can disable affected presets without disabling user-entered overrides.
- A user override is clearly marked and never written back into the reviewed dataset.

## 11. AI-assisted contract

- AI accepts a minimal structured brief and returns a schema-constrained editable draft.
- AI cannot compute or overwrite deterministic numeric results.
- Approved deterministic results are passed as immutable facts with version metadata when explanation is needed.
- Regulated claims come only from approved policy content; free-form retrieval is not an authority.
- No domain, trademark, company, tax, compliance, market-statistic, or availability claim is made without an actual cited verification source.
- The UI labels AI output and requires review before export.
- Provider errors, refusal, timeout, and quota exhaustion have safe non-AI fallbacks.
- Prompts and completions are not logged by default.
- Required evaluations cover prompt injection, fabricated statistics/citations, sensitive-data leakage, numeric mutation, harmful advice, latency, cost, and provider failure.

## 12. Policy resolution contract

Policy resolution is deterministic:

```text
validated facts + applicable date + jurisdiction
  -> candidate policy set
  -> exactly one supported version
  -> matching rule or explicit unsupported result
```

Requirements:

- No overlapping active versions for the same fact space.
- No value without a source supporting that value or rule.
- Effective start is required; effective end is explicit when superseded.
- Provisional policy cannot be exposed as an active default.
- A stale warning cannot silently change a result.
- Rollback activates the last approved policy version and records the incident.

## 13. Workflow hand-off contract

- A hand-off happens only through an explicit action such as “Use this in Break-even.”
- The payload is typed, versioned, minimal, and shown to the user.
- Memory is the default transport. Device persistence requires explicit save.
- A destination tool revalidates transferred data and does not trust source-page state.
- Analytics record the tool IDs and action only; transferred values are forbidden.

## 14. Lifecycle contract

| Status           | Public behavior                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| `internal`       | No public route or index entry.                                                                           |
| `beta`           | Discoverable only through controlled beta entry; labelled; not in the production sitemap unless approved. |
| `live`           | Meets definition of done and has an active owner.                                                         |
| `stale-disabled` | Page explains the temporary unavailability and sources; calculation controls are disabled.                |
| `retired`        | Canonical retirement or redirect decision; history and reason retained internally.                        |

## 15. Migration from the current registry

Phase 1 must:

1. Add v2 metadata without changing current calculations or routes.
2. Split definitions into per-tool modules and generate metadata-only discovery indexes.
3. Map current `kind` and `generatorKind` into the new kinds/capabilities.
4. Map current `privacyClassification: local-only` into `executionMode` and a detailed data-flow declaration.
5. Preserve current source, formula, limitation, FAQ, analytics, and privacy fields.
6. Add validation that rejects duplicate IDs/slugs, missing sources, invalid related tools, risk/policy mismatches, and live tools without required gates.
7. Migrate one current tool of each applicable kind before mass migration.

No planned tool is added to the live runtime registry merely to advertise future scope.
