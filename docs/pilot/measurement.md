# Measurement contract and activation runbook

Destination: Vercel Web Analytics custom events via the existing SDK. Production sends sanitized events by default; NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=false disables custom events and requires rebuilding. Local development/test does not transmit. Confirm the Vercel project supports custom events before launch; no plan upgrade or paid subscription is automatically purchased. A compiled integration does not prove ingestion.

Vercel custom-event reference: https://vercel.com/docs/analytics/custom-events

## Production launch status

31 October 2026: Vercel confirmed this team is on Hobby and returned HTTP 402 (custom events require Pro or Enterprise). The owner chose to deploy now and leave analytics blocked. Production custom-event sending is disabled with NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=false. Page-view analytics remains available. Do not claim custom-event ingestion or an automated completion funnel until the plan supports it and the production checks below pass.

## Keep verification traffic separate

Open /freelancers?kk_traffic=verification before testing. This marks the tab until it closes (including subsequent navigation) and suppresses its page-view requests. If custom events are enabled later, verification events carry traffic=verification; pilot event reporting must filter eventData/traffic eq 'production'. Use a fresh tab for genuine pilot activity. This is a reporting label, not an authentication mechanism or a participant identity. Do not share the verification link with recruits.

## Verify before counting users

Deploy, open /freelancers?kk_channel=outreach with dummy data, generate/export a quotation and continue to an invoice. Confirm tool_started, result_generated, result_downloaded, workflow_continued and workflow_imported appear in the Vercel custom-event view. Verify only allowlisted metadata plus session_id, channel, elapsed_ms appears. Ensure page-view URLs omit query strings/fragments. Repeat with privacy signals enabled and confirm no custom requests. Analytics failure must not block exports. Exclude these test sessions from pilot results.

## Definitions

| Metric             | Definition and limitation                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Activation         | First valid document export for a recruited participant; anonymous session export is a proxy. Confirm real-world value in follow-up.        |
| Completion         | Distinct tool/session pairs with download following start / distinct tool/session starts. Repeated clicks are not new starts.               |
| Time to value      | First successful download elapsed_ms since first tool start in that session. Report median and sample size; interrupted tasks distort this. |
| Channel efficiency | Activated recruited participants / invitations, plus time and rupees spent. Attribute only known campaign entries.                          |
| Repeat value       | Consenting participants reporting or demonstrating another relevant task. No cross-visit identity inference.                                |

A random identifier lives in sessionStorage for this tab and resets after 30 minutes inactivity. No fingerprint, account identity, persistent device ID or participant ID is sent. Blocked storage disables custom events. GPC or Do Not Track disables custom events. Page views are separate aggregate measurement. Channel is outreach/community/direct, captured from allowlisted kk_channel on first event. No raw URL, free-text campaign or referrer is added to custom properties. Session-level “direct” includes unattributed visits and is not a known marketing channel.

## Data analysis

Use Vercel aggregate custom-event views for an initial overview. Do not divide raw event clicks and call it session conversion. Session funnels/SQL require a supported event-level export containing session_id and timestamp. If the account cannot export this, use manual consented task observations in the workbook and label the source. Do not reconstruct person-level retention from anonymous sessions.

Normalize an authorized export locally into events(event_name, session_id, tool_id, channel, occurred_at, elapsed_ms). SQL examples use SQLite. Keep raw exports private; publish aggregate counts only. Missing data stays blank, not zero. Weekly participant/channel figures in the workbook come from the recruitment log; they are not automatically connected to Vercel.
