# Product brief, PRD and decision log

## Initial problem brief — hypothesis

Audience: Indian freelancers preparing job paperwork. Suspected problem: repeated re-entry across quotations, invoices and receipts creates effort and errors. Current evidence: existing handoffs are implemented; no customer interviews yet. Alternative: existing tools already solve the task adequately. Test through recent-task interviews and observation before expanding scope.

Default intervention: make the existing quotation → invoice → receipt flow easy to find, retain explicit imports and measure continuation. Success is an unaided valid export with correct carried details and participant understanding. Do not infer tax registration or completed payment. Accounts, saved profiles, more calculators and expanded AI are deferred.

## PRD

Entry: freelancer landing page and homepage workflow CTA. Quotation preview offers standard or GST invoice continuation. Destination prompts for explicit import; user reviews carried details and completes missing fields. Invoice preview offers receipt continuation after payment. Receipt requires confirmation of payment details; no funds are moved. If temporary storage fails, preserve the current preview and show the existing manual-entry fallback. Export and print remain local. Handoff telemetry contains the originating or destination tool ID only, never transferred values.

## Evidence-backed issue: hidden tax explanation

Observed on 31 October 2026: user asked why ₹6,400 was added to ₹1,60,000 tax. Engine already included 4% cess, but UI limited breakdown to three rows. Change: display all supplied breakdown rows, including cess and credits. This is a usability observation from the project owner, not external user research. Retest comprehension using research.md before claiming an improvement.

## Prioritization and decisions

| Item                       | Evidence                     | Impact hypothesis              | Effort | Decision  | Revisit trigger                 |
| -------------------------- | ---------------------------- | ------------------------------ | ------ | --------- | ------------------------------- |
| Full result breakdown      | Observed unexplained total   | Better comprehension           | Small  | Implement | Participant comprehension test  |
| Visible freelance workflow | Existing functional handoffs | Less discovery/re-entry effort | Small  | Pilot     | Interview/task findings         |
| Persistent measurement     | Events were browser-only     | Enables learning               | Medium | Implement | Verify ingestion                |
| Saved business details     | No customer evidence         | Potential repeat benefit       | Medium | Defer     | Repeated re-entry seen in pilot |
| More AI/calculators        | No customer evidence         | Unclear                        | Medium | Defer     | Specific unmet task confirmed   |

For each new decision record date, source, observation, interpretation, rejected alternatives, cost/effort, owner and review date. Do not invent numerical prioritization scores without evidence.
