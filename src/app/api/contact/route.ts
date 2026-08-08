import { z } from 'zod';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'KarobarKit <onboarding@resend.dev>';
const DEFAULT_SITE_URL = 'https://karobarkit.vercel.app';
const BRAND_NAVY = '#0d1b2a';
const BRAND_TEAL = '#0fa89a';
const BRAND_SLATE = '#64748b';
const BRAND_GRAY = '#f2f4f7';
const BRAND_LINE = '#dbe4eb';
const BRAND_TEAL_SOFT = '#effaf8';

const contactPayloadSchema = z.object({
  name: z.string().trim().max(120, 'Keep your name to 120 characters or fewer.').default(''),
  email: z
    .union([z.string().trim().email('Enter a valid email address.').max(254), z.literal('')])
    .default(''),
  topic: z.enum(['feedback', 'accessibility', 'source', 'other']),
  message: z
    .string()
    .trim()
    .min(1, 'Write a message before sending.')
    .max(5000, 'Keep your message to 5,000 characters or fewer.'),
  website: z.string().max(500).default(''),
});

const topicLabels = {
  feedback: 'Product feedback',
  accessibility: 'Accessibility',
  source: 'Source suggestion',
  other: 'Something else',
} as const;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function formatMessage(input: z.infer<typeof contactPayloadSchema>) {
  return [
    'KarobarKit contact message',
    `Topic: ${topicLabels[input.topic]}`,
    '',
    `Name: ${input.name || 'Not provided'}`,
    `Email: ${input.email || 'Not provided'}`,
    '',
    'Message:',
    input.message,
    '',
    `Sent from: ${process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL}/contact`,
  ].join('\n');
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character as '&' | '<' | '>' | '"' | "'"
      ] ?? character,
  );
}

function buildHtmlMessage(input: z.infer<typeof contactPayloadSchema>) {
  const name = escapeHtml(input.name || 'Not provided');
  const email = escapeHtml(input.email || 'Not provided');
  const topic = escapeHtml(topicLabels[input.topic]);
  const message = escapeHtml(input.message).replace(/\n/g, '<br />');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  const safeSiteUrl = escapeHtml(siteUrl);
  const replyButton = input.email
    ? `<a href="mailto:${encodeURIComponent(input.email)}" style="display:inline-block;background:${BRAND_TEAL};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;line-height:20px;padding:12px 18px;border-radius:8px;">Reply to ${name}</a>`
    : '';

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:${BRAND_GRAY};color:${BRAND_NAVY};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND_GRAY};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid ${BRAND_LINE};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;background:${BRAND_NAVY};color:#ffffff;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width:42px;height:42px;background:${BRAND_TEAL};color:#ffffff;border-radius:10px;text-align:center;vertical-align:middle;font-size:22px;font-weight:800;">K</td>
                    <td style="padding-left:12px;vertical-align:middle;">
                      <div style="font-size:20px;line-height:24px;font-weight:800;">Karobar<span style="color:#5ee4d6;">Kit</span></div>
                      <div style="font-size:12px;line-height:18px;color:#d9f1ee;">Smart tools for smarter business</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 20px;">
                <div style="color:${BRAND_TEAL};font-size:12px;line-height:18px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;">New contact message</div>
                <h1 style="margin:8px 0 10px;color:${BRAND_NAVY};font-size:26px;line-height:34px;">${topic}</h1>
                <p style="margin:0;color:${BRAND_SLATE};font-size:15px;line-height:24px;">Someone sent a message through your KarobarKit contact form.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${BRAND_LINE};border-radius:10px;">
                  <tr><td style="padding:12px 14px;border-bottom:1px solid ${BRAND_LINE};color:${BRAND_SLATE};font-size:12px;font-weight:700;width:28%;">From</td><td style="padding:12px 14px;border-bottom:1px solid ${BRAND_LINE};color:${BRAND_NAVY};font-size:14px;">${name}</td></tr>
                  <tr><td style="padding:12px 14px;border-bottom:1px solid ${BRAND_LINE};color:${BRAND_SLATE};font-size:12px;font-weight:700;">Email</td><td style="padding:12px 14px;border-bottom:1px solid ${BRAND_LINE};color:${BRAND_NAVY};font-size:14px;">${input.email ? `<a href="mailto:${encodeURIComponent(input.email)}" style="color:${BRAND_TEAL};">${email}</a>` : email}</td></tr>
                  <tr><td style="padding:12px 14px;color:${BRAND_SLATE};font-size:12px;font-weight:700;">Topic</td><td style="padding:12px 14px;color:${BRAND_NAVY};font-size:14px;">${topic}</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;">
                <div style="margin-bottom:8px;color:${BRAND_SLATE};font-size:12px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;">Message</div>
                <div style="padding:18px;background:${BRAND_TEAL_SOFT};border-left:3px solid ${BRAND_TEAL};color:${BRAND_NAVY};font-size:15px;line-height:25px;word-break:break-word;">${message}</div>
              </td>
            </tr>
            ${replyButton ? `<tr><td style="padding:0 28px 28px;">${replyButton}</td></tr>` : ''}
            <tr>
              <td style="padding:18px 28px;background:${BRAND_GRAY};border-top:1px solid ${BRAND_LINE};color:${BRAND_SLATE};font-size:12px;line-height:20px;">
                Sent from <a href="${safeSiteUrl}/contact" style="color:${BRAND_TEAL};">KarobarKit</a>. Please keep replies free of passwords, tax IDs, bank details and other sensitive information.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError('Send the form as a valid JSON request.', 400);
  }

  const parsed = contactPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return jsonError(firstIssue?.message ?? 'Check the highlighted fields and try again.', 400);
  }

  // Quietly accept the honeypot so automated submissions do not learn whether they were blocked.
  if (parsed.data.website) return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipient = process.env.CONTACT_TO_EMAIL?.trim();
  const sender = process.env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM;

  if (!apiKey || !recipient) {
    return jsonError('Contact delivery is not configured yet. Please try again later.', 503);
  }

  const emailPayload = {
    from: sender,
    to: [recipient],
    subject: `[KarobarKit] ${topicLabels[parsed.data.topic]}`,
    html: buildHtmlMessage(parsed.data),
    text: formatMessage(parsed.data),
    ...(parsed.data.email ? { reply_to: parsed.data.email } : {}),
  };

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      return jsonError('We could not send your message right now. Please try again shortly.', 502);
    }
  } catch {
    return jsonError('We could not send your message right now. Please try again shortly.', 502);
  }

  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
