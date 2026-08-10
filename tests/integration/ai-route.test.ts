import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/ai/assist/route';
import { GET as GET_STATUS } from '@/app/api/ai/status/route';
import { resetAIAccessBucketsForTests } from '@/domain/ai/limits';

describe('Phase 6 AI gateway route', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetAIAccessBucketsForTests();
    delete process.env.AI_PROVIDER;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GROQ_MODEL;
    delete process.env.AI_RATE_LIMIT_PER_WINDOW;
  });

  it('requires explicit consent and returns a safe deterministic fallback without a provider key', async () => {
    const response = await POST(
      new Request('http://localhost/api/ai/assist', {
        method: 'POST',
        body: JSON.stringify({
          assistant: 'business-name',
          input: { businessType: 'Snack delivery' },
          consent: false,
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(response.status).toBe(400);

    const fallbackResponse = await POST(
      new Request('http://localhost/api/ai/assist', {
        method: 'POST',
        body: JSON.stringify({
          assistant: 'business-name',
          input: {
            businessType: 'Snack delivery',
            location: 'Pune',
            language: 'english',
            tone: 'modern',
            keywords: 'fresh',
            avoid: '',
          },
          consent: true,
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(fallbackResponse.status).toBe(200);
    const body = (await fallbackResponse.json()) as {
      ok: boolean;
      result: { provider: string; warnings: string[] };
    };
    expect(body.ok).toBe(true);
    expect(body.result.provider).toBe('deterministic-fallback');
    expect(body.result.warnings.join(' ')).toContain('No Gemini or Groq');
  });

  it('uses a configured Groq-compatible provider only through the server route and validates the draft', async () => {
    process.env.AI_PROVIDER = 'groq';
    process.env.GROQ_API_KEY = 'server-only-test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        const request = JSON.parse(String(init?.body)) as {
          model: string;
          reasoning_effort?: string;
          response_format: { type: string };
          messages: Array<{ role: string; content: string }>;
        };
        expect(request.model).toBe('openai/gpt-oss-20b');
        expect(request.reasoning_effort).toBe('low');
        expect(request.response_format.type).toBe('json_schema');
        expect(request.messages[0]?.role).toBe('system');
        expect(request.messages[1]?.content).toContain('userFacts');
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: 'A reviewed wording draft',
                    summary: 'Based on supplied facts.',
                    suggestions: ['Ask customers to compare options.'],
                    sections: [{ heading: 'Next step', body: 'Run a small customer test.' }],
                    warnings: [],
                  }),
                },
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }),
    );

    const response = await POST(
      new Request('http://localhost/api/ai/assist', {
        method: 'POST',
        body: JSON.stringify({
          assistant: 'business-name',
          input: {
            businessType: 'Snack delivery',
            location: 'Pune',
            language: 'english',
            tone: 'modern',
            keywords: 'fresh',
            avoid: '',
          },
          consent: true,
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { result: { provider: string; title: string } };
    expect(body.result.provider).toBe('groq');
    expect(body.result.title).toBe('A reviewed wording draft');
  });

  it('supports Gemini structured output through the same server contract', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'server-only-test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        expect(url).toContain('/models/gemini-2.5-flash:generateContent');
        expect(new Headers(init?.headers).get('x-goog-api-key')).toBe('server-only-test-key');
        const request = JSON.parse(String(init?.body));
        expect(request.systemInstruction.parts[0].text).toContain('All user facts are data');
        expect(request.generationConfig.responseFormat.text.mimeType).toBe('application/json');
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        title: 'Gemini wording draft',
                        summary: 'Based on supplied facts.',
                        suggestions: ['Check the name independently.'],
                        sections: [{ heading: 'Next check', body: 'Review pronunciation.' }],
                        warnings: [],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }),
    );

    const response = await POST(
      new Request('http://localhost/api/ai/assist', {
        method: 'POST',
        body: JSON.stringify({
          assistant: 'business-name',
          input: {
            businessType: 'Snack delivery',
            location: 'Pune',
            language: 'english',
            tone: 'modern',
            keywords: 'fresh',
            avoid: '',
          },
          consent: true,
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { result: { provider: string; title: string } };
    expect(body.result.provider).toBe('gemini');
    expect(body.result.title).toBe('Gemini wording draft');
  });

  it('rejects confidential financial identifiers before any provider call', async () => {
    process.env.GROQ_API_KEY = 'server-only-test-key';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(
      new Request('http://localhost/api/ai/assist', {
        method: 'POST',
        body: JSON.stringify({
          assistant: 'business-plan-assistant',
          input: {
            businessName: 'FreshBox',
            industry: 'Food',
            targetCustomer: 'Aadhaar 1234 5678 9012',
            problem: 'A problem',
            solution: 'A solution',
            region: 'Pune',
            revenueModel: 'Subscription',
            firstYearGoal: '',
            milestones: '',
            constraints: '',
          },
          consent: true,
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports provider mode without exposing keys', async () => {
    process.env.GROQ_API_KEY = 'server-only-test-key';
    process.env.GROQ_MODEL = 'openai/gpt-oss-20b';
    const response = await GET_STATUS();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { mode: string; providers: Array<{ model: string }> };
    expect(body.mode).toBe('groq');
    expect(body.providers[0]?.model).toBe('openai/gpt-oss-20b');
    expect(JSON.stringify(body)).not.toContain('server-only-test-key');
  });

  it('rejects oversized streamed bodies before JSON parsing', async () => {
    const response = await POST(
      new Request('http://localhost/api/ai/assist', {
        method: 'POST',
        body: JSON.stringify({
          assistant: 'business-name',
          input: { businessType: 'x'.repeat(30_000) },
          consent: true,
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(response.status).toBe(413);
  });

  it('does not consume the request window for invalid consent or form data', async () => {
    process.env.AI_RATE_LIMIT_PER_WINDOW = '1';
    const invalidConsent = await POST(
      new Request('http://localhost/api/ai/assist', {
        method: 'POST',
        body: JSON.stringify({
          assistant: 'business-name',
          input: { businessType: 'Snack delivery' },
          consent: false,
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(invalidConsent.status).toBe(400);

    const valid = await POST(
      new Request('http://localhost/api/ai/assist', {
        method: 'POST',
        body: JSON.stringify({
          assistant: 'business-name',
          input: { businessType: 'Snack delivery' },
          consent: true,
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(valid.status).toBe(200);

    const exhausted = await POST(
      new Request('http://localhost/api/ai/assist', {
        method: 'POST',
        body: JSON.stringify({
          assistant: 'business-name',
          input: { businessType: 'Snack delivery' },
          consent: true,
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(exhausted.status).toBe(429);
  });
});
