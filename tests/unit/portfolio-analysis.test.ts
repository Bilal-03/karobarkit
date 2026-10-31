import { describe, expect, it } from 'vitest';
import { sampleEvents, summarize, type SampleEvent } from '@/domain/portfolio/analysis';
describe('simulated portfolio analysis', () => {
  it('reconciles both modeled scenarios', () => {
    expect(summarize(sampleEvents('a'))).toEqual({
      started: 12,
      results: 9,
      exported: 6,
      completion: 0.5,
      medianMs: 92500,
    });
    const b = summarize(sampleEvents('b'));
    expect(b.exported).toBe(8);
    expect(b.medianMs).toBe(63500);
    expect(b.completion).toBeCloseTo(8 / 12);
  });
  it('deduplicates repeated events and respects chronological prerequisites', () => {
    const rows: SampleEvent[] = [
      { session: 'one', channel: 'direct', stage: 'exported', atMs: 5 },
      { session: 'one', channel: 'direct', stage: 'started', atMs: 10 },
      { session: 'one', channel: 'direct', stage: 'result', atMs: 20 },
      { session: 'one', channel: 'direct', stage: 'exported', atMs: 30 },
    ];
    expect(summarize([...rows, ...rows])).toEqual({
      started: 1,
      results: 1,
      exported: 1,
      completion: 1,
      medianMs: 20,
    });
    expect(summarize(rows.slice(0, 3)).exported).toBe(0);
    expect(summarize(rows.filter((e) => e.stage !== 'result')).exported).toBe(0);
  });
  it('handles empty inputs and channel segmentation without invented rates', () => {
    expect(summarize([])).toEqual({ started: 0, results: 0, exported: 0, completion: null, medianMs: null });
    expect(summarize(sampleEvents('b').filter((e) => e.channel === 'direct')).exported).toBe(2);
  });
});
