# Phase 0 architecture decisions

## ADR-001 — Local-first is the default execution model

**Status:** Accepted
**Date:** 9 August 2026

### Context

KarobarKit already processes calculations, QR payloads, document data, logos, previews, and PDFs in the browser. The expanded toolkit introduces regulated calculations, changing vendor data, AI, and later optional accounts.

### Decision

- Use browser-local deterministic execution whenever the feature can be complete and safe without a server.
- Ship reviewed external policy/fee data as immutable bundled snapshots for local calculation.
- Keep memory as the anonymous default. Device persistence is explicit and clearable.
- Treat network-required and optional-cloud behavior as capabilities with visible data-flow contracts.
- Keep anonymous tools usable without an account when accounts are introduced.

### Consequences

- Public calculator operating cost and data exposure remain low.
- Cross-device sequence, saved workspaces, and AI require clearly separated services.
- Runtime policy scraping is excluded; source changes use controlled releases.
- Tests must prove data-flow claims and analytics allowlists.

## ADR-002 — Regulated and vendor rules are effective-dated controlled data

**Status:** Accepted
**Date:** 9 August 2026

### Context

GST, income tax, TDS, payroll, gratuity, and marketplace fees change by date and applicability. A timeless constant or silently updated remote response cannot explain or reproduce a result.

### Decision

- Resolve policy from validated facts, applicable date, and jurisdiction.
- Store immutable versions with effective range, sources, supported claims, owner, reviewer, fixtures, and status.
- Permit exactly one active supported version for a fact space and date.
- Treat `unsupported` as a safe engine result.
- Detect source changes automatically where useful but activate values only through reviewed releases.
- Provide targeted stale and kill-switch behavior plus rollback to a legally compatible version.

### Consequences

- Historical results are reproducible.
- Policy changes require an evidence packet and review rather than a component edit.
- Tier C/D tools have longer but safer delivery gates.
- A reusable policy resolver and build-time validators are Phase 1 platform work.

## ADR-003 — Deterministic engines own numbers; AI owns drafts and explanations

**Status:** Accepted
**Date:** 9 August 2026

### Context

The proposed AI tools can improve ideation and explanation but a language model is not a reliable calculator, statutory source, or factual market database.

### Decision

- All numeric results come from versioned deterministic engines.
- AI receives approved results as immutable facts when explaining a calculation.
- AI output is schema-constrained, editable, labelled, and reviewed by the user before export.
- Regulated claims come from approved policy content rather than free-form model recall.
- AI cannot claim availability, trademark status, legal compliance, tax treatment, or market facts without an actual integrated cited source.
- Network notice, data minimization, server-side secrets, rate/cost limits, non-AI fallback, and safety evaluations are mandatory.

### Consequences

- Pricing Assistant depends on the deterministic pricing engine.
- Startup Cost Estimator starts as a deterministic worksheet with AI category suggestions.
- Business Plan Assistant cannot fabricate research or citations.
- Phase 6 requires an AI gateway and evaluation system; a direct client-to-provider call is prohibited.

## ADR-004 — Catalogue metadata and execution modules are separated

**Status:** Accepted
**Date:** 9 August 2026

### Context

The current eight tools can live in one registry module. Forty-eight tools with PDF, policy, data, and AI dependencies would make directory/search bundles and maintenance unnecessarily coupled.

### Decision

- Give each tool a self-contained definition module.
- Generate metadata-only catalogue, search, category, sitemap, and relationship indexes at build time.
- Load calculation, document, chart, policy snapshot, or AI UI only for the active tool.
- Keep canonical identity and lifecycle validation centralized.
- Planned tools do not enter the live registry until their phase gates pass.

### Consequences

- Search and directory pages stay lightweight.
- Build-time validation becomes a release gate.
- Phase 1 must migrate current tools without changing their routes or runtime behavior.

## ADR-005 — Workflows require explicit typed hand-offs

**Status:** Accepted
**Date:** 9 August 2026

### Context

The toolkit becomes more useful when a quotation becomes an invoice or a burn result feeds runway. Hidden sharing or broad persisted state would weaken privacy and make calculations hard to reproduce.

### Decision

- Transfer data only after an explicit user action.
- Use minimal versioned payloads and revalidate at the destination.
- Use memory by default and explicit device/cloud save only when requested.
- Do not send transferred values to analytics.
- Show the user what will be transferred.

### Consequences

- Workflows remain understandable and privacy-preserving.
- Source and destination modules need stable hand-off schemas.
- A future account system can implement the same contract without changing calculator authority.
