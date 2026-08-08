# Regulatory and external-data change control

**Status:** Accepted Phase 0 operating contract
**Applies to:** Risk Tier C and D tools and any approved content used by AI

## 1. Principle

External changes are researched and released as controlled product changes. A crawler, API, model, content-management editor, or runtime request may detect or propose a change; none may silently alter an active calculation policy.

## 2. Roles and separation

| Role                       | Responsibility                                                                   |
| -------------------------- | -------------------------------------------------------------------------------- |
| Monitor                    | Detect source changes, link failures, announcements, and review dates.           |
| Policy owner               | Classify impact, gather controlling material, and prepare the change packet.     |
| Implementer                | Add a new immutable policy/data version and tests.                               |
| Independent fixture author | Prepare expected cases without copying implementation output.                    |
| Domain reviewer            | Approve legal/method interpretation, supported cases, limitations, and fixtures. |
| Release owner              | Verify gates, activate the version, monitor, and own rollback.                   |

For Tier D, the implementer cannot be the only domain reviewer. The approval record must name a real person or contracted firm.

## 3. Source hierarchy

1. Gazette; statute; rule; notification; circular; or regulator order.
2. Official department/regulator portal guidance, validation rules, FAQs, manuals, or calculators.
3. Official vendor fee schedules for marketplace data.
4. Authoritative technical standards.
5. Controlled internal methodology for non-statutory business formulas.
6. Editorial material only as supplementary context; never as the sole source of a regulated value.

If official explanatory content conflicts with a controlling instrument, the tool stays on the last approved version or becomes `stale-disabled` for the affected scenario until the reviewer resolves it.

## 4. Change workflow

### Step 1 — Detect and record

Create a change record containing:

- source ID and URL;
- detection date and method;
- publication and effective dates if known;
- affected policy family and tool IDs;
- change type: editorial, source-only, rule, value, applicability, form/field, or emergency;
- initial severity and earliest possible user impact.

Automated monitoring may create the record but cannot assign final interpretation.

### Step 2 — Triage

| Severity | Meaning                                                                         | Response target                                                                         |
| -------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| S0       | Known result can cause material regulatory or financial harm                    | Disable affected path as soon as confirmed; same-day owner review                       |
| S1       | Active value/rule/applicability changed or is likely wrong                      | Review within one business day; release or disable before effective date where possible |
| S2       | Source clarification or vendor fee change with bounded estimate impact          | Review within five business days                                                        |
| S3       | Broken link, wording, metadata, or future proposal with no active-result impact | Resolve in normal review cycle                                                          |

Proposals, press reports, draft rules, and recommendations are never treated as effective law without the required legal instrument.

### Step 3 — Build the evidence packet

The policy owner records:

- controlling and explanatory sources;
- exact supported claims;
- jurisdiction and affected fact space;
- effective start and prior-version end;
- old/new comparison;
- ambiguity, exceptions, and unsupported cases;
- copy and disclaimer changes;
- historical and boundary test cases;
- reviewer required.

Preserve an evidence fingerprint or approved archive reference where permitted. Do not republish copyrighted vendor schedules beyond what is required to operate and explain the tool.

### Step 4 — Create a new version

- Never edit the meaning of an already-used policy version in place.
- Create a new stable ID.
- End-date the superseded version only when the effective boundary is supported.
- Keep historical versions available for historical-date calculations and incident reconstruction.
- Mark uncertain future material `provisional`; it cannot become a default.

### Step 5 — Independent fixtures

At minimum test:

- normal supported cases;
- threshold boundaries;
- one day before, on, and one day after effective date;
- exceptions and unsupported paths;
- rounding and reconciliation;
- old/new version selection;
- UI source and applicable-period display.

The independent fixture author documents how expected outputs were obtained. Copying current application output is not independent verification.

### Step 6 — Review and approval

Approval records:

- reviewer name and role;
- reviewed policy/data version;
- source IDs and evidence packet version;
- fixture IDs;
- supported and explicitly excluded scope;
- review date and next review date;
- approval, rejection, or conditional approval with conditions.

Tier D cannot be activated without named reviewer approval. Tier C requires the marketplace/data-policy reviewer and release owner.

### Step 7 — Stage and release

- Preview the version behind a non-public feature flag.
- Run unit, historical-policy, integration, content, accessibility, SEO, and production-build gates appropriate to affected tools.
- Activate by explicit release change; do not bind activation to a remote value at runtime.
- Publish visible effective/verified dates and any changed limitations.
- Record release commit, timestamp, and rollback target.

### Step 8 — Monitor

For the first 72 hours after a material change monitor:

- stable error-code rates;
- unsupported-result frequency;
- calculation completion and abandonment changes;
- report-error submissions;
- broken sources and stale-state behavior;
- server/API failures for network tools.

No financial values or document contents enter monitoring.

## 5. Stale and kill-switch behavior

- `fresh`: normal operation and visible verified date.
- `review-due`: calculation may remain available only when the owner has explicitly approved warning-only behavior for that policy family.
- `stale`: affected preset/path is disabled or requires user-entered override according to the tool contract.
- `withdrawn`: calculation path is disabled and the page explains the reason without exposing internal incident details.

A kill switch targets the smallest safe unit: rule, preset, policy version, or tool execution. Informational pages, sources, and report-error access should remain available.

## 6. Rollback

Trigger rollback when:

- active version selection is incorrect;
- a golden fixture fails in production-equivalent verification;
- source interpretation is withdrawn or disputed;
- UI assumptions do not match engine facts;
- a new path materially increases unsafe or unsupported outputs.

Rollback steps:

1. Disable the affected version/path.
2. Restore the last approved compatible version only for dates it legally supports.
3. If no approved version supports the requested date, return `unsupported`; never backfill with an old rule.
4. Record incident, affected versions, duration, detection, decision, and user-facing correction.
5. Add a regression fixture before reactivation.

## 7. Normal review calendar

| Family                                  | Scheduled review                                                 | Event monitoring                                                        |
| --------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Income tax; TDS; corporate; presumptive | Monthly during transition/budget periods and otherwise quarterly | Finance Act; rules; notifications; portal validations                   |
| GST                                     | Formal quarterly review                                          | Monthly official-source monitoring and every Council/notification event |
| Payroll; PF; gratuity                   | Quarterly                                                        | Labour code/rule and EPFO notifications                                 |
| Marketplace fees                        | Monthly human review                                             | Weekly page/link/change monitoring and vendor announcements             |
| Consumer finance                        | Quarterly                                                        | RBI/SEBI circulars and official-calculator changes                      |
| Stable business/startup methods         | Annual                                                           | Defect reports or approved methodology changes                          |
| AI governance                           | Quarterly                                                        | Provider/model changes; safety incidents; DPDP changes                  |

Review dates are maximum intervals, not guarantees that a rule remains current until that date.

## 8. Emergency correction language

Use concise factual language:

> This estimate is temporarily unavailable while we verify a source or rule change. Your inputs have not been submitted. Review the cited official material or consult a qualified professional for a time-sensitive decision.

Do not guess an availability time, conceal a known defect behind a generic disclaimer, or silently return the previous result.

## 9. Phase gates

- Phase 1 may generalize the policy model using existing GST behavior but cannot expand GST legal scope without CA approval.
- Phase 4 tax/payroll development starts only after named CA and payroll/labour reviewers are recorded.
- Phase 5 valuation/equity/ESOP development starts only after a named corporate/legal reviewer is recorded.
- Marketplace development may start with a named internal policy owner; release still requires reviewed source snapshots and visible overrides.
- Phase 6 AI development starts only after a named security/privacy reviewer and approved provider data contract exist.
