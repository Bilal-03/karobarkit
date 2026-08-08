# Contact delivery setup

The contact page submits to `/api/contact`, a Vercel serverless Route Handler. The route validates name, email, topic and message fields, ignores honeypot submissions, and sends a plain-text email through Resend. API credentials and the recipient are read only from server-side environment variables.

## Vercel setup

In the Vercel project, open **Settings → Environment Variables** and add these for **Production**:

| Name                 | Value                                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| `RESEND_API_KEY`     | A Resend API key beginning with `re_`                                  |
| `CONTACT_TO_EMAIL`   | The inbox that should receive contact messages                         |
| `CONTACT_FROM_EMAIL` | Optional; defaults to `KarobarKit <onboarding@resend.dev>` for testing |

Redeploy after saving the variables. Environment changes do not affect an existing deployment.

## Important sender limitation

Resend's shared `onboarding@resend.dev` sender is for testing and can send only to the email address associated with the Resend account. For normal production delivery to another inbox, verify a domain in Resend and set `CONTACT_FROM_EMAIL` to an address on that verified domain. A purchased custom domain is not required for the site itself, but it is required for unrestricted branded email sending through Resend.

## Verification

Submit a test message at `/contact` and confirm it arrives in the configured inbox. The reply action should target the visitor's email when one is provided. Do not include bank details, tax IDs, passwords, customer data or document contents in the message.

The error-report form remains intentionally local-only until a separate delivery policy and endpoint are approved.
