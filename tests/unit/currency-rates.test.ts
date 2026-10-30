import { afterEach, expect, it, vi } from 'vitest';
import { fetchEcbReferenceQuote } from '@/lib/regulated/currency-rates';

afterEach(() => vi.unstubAllGlobals());

it('uses the latest common ECB observation instead of requiring a quote today', async () => {
  const csv = (rows: string) => `TIME_PERIOD,OBS_VALUE\n${rows}`;
  const fetchMock = vi.fn(
    async (url: string) =>
      new Response(
        url.includes('.INR.') ? csv('2026-10-28,92\n2026-10-29,93') : csv('2026-10-28,1.08\n2026-10-30,1.09'),
        { status: 200 },
      ),
  );
  vi.stubGlobal('fetch', fetchMock);
  const quote = await fetchEcbReferenceQuote('INR', 'USD', '2026-10-30');
  expect(quote.quotedOn).toBe('2026-10-28');
  expect(Number(quote.rate)).toBeCloseTo(1.08 / 92);
  expect(String(fetchMock.mock.calls[0]?.[0])).toContain('startPeriod=2026-10-20');
});

it('uses the actual dated observation when EUR is one side of the conversion', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('TIME_PERIOD,OBS_VALUE\n2026-10-29,93', { status: 200 })),
  );
  const quote = await fetchEcbReferenceQuote('EUR', 'INR', '2026-10-30');
  expect(quote.rate).toBe('93');
  expect(quote.quotedOn).toBe('2026-10-29');
});

it('does not cross-divide two currencies quoted on different dates', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async (url: string) =>
        new Response(
          url.includes('.INR.')
            ? 'TIME_PERIOD,OBS_VALUE\n2026-10-28,92'
            : 'TIME_PERIOD,OBS_VALUE\n2026-10-29,1.09',
          { status: 200 },
        ),
    ),
  );
  await expect(fetchEcbReferenceQuote('INR', 'USD', '2026-10-30')).rejects.toThrow(
    'no common dated observation',
  );
});
