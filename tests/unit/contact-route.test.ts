import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/contact/route';

const validPayload = {
  name: 'Test sender',
  email: 'sender@example.com',
  topic: 'feedback',
  message: 'The contact flow works well.',
  website: '',
};

function makeRequest(payload: unknown) {
  return new Request('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

describe('contact route', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    vi.stubEnv('CONTACT_TO_EMAIL', 'owner@example.com');
    vi.stubEnv('CONTACT_FROM_EMAIL', 'KarobarKit <contact@example.com>');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'email_123' }), { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('validates and sends a plain-text message through Resend', async () => {
    const response = await POST(makeRequest(validPayload));
    const body = await response.json();
    const fetchMock = vi.mocked(fetch);

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer re_test_key' }),
        body: expect.stringContaining('The contact flow works well.'),
      }),
    );
  });

  it('rejects invalid input before calling the provider', async () => {
    const response = await POST(makeRequest({ ...validPayload, email: 'not-an-email' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('valid email');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns a configuration error without exposing secrets when delivery is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('CONTACT_TO_EMAIL', '');

    const response = await POST(makeRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: 'Contact delivery is not configured yet. Please try again later.' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('quietly ignores honeypot submissions', async () => {
    const response = await POST(makeRequest({ ...validPayload, website: 'https://spam.example' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetch).not.toHaveBeenCalled();
  });
});
