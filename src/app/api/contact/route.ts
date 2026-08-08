import { z } from 'zod';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'KarobarKit <onboarding@resend.dev>';

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
    'New KarobarKit contact message',
    '',
    `Name: ${input.name || 'Not provided'}`,
    `Email: ${input.email || 'Not provided'}`,
    `Topic: ${topicLabels[input.topic]}`,
    '',
    input.message,
  ].join('\n');
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
