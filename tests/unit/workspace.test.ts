import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  blankWorkspace,
  parseWorkspace,
  writeWorkspace,
  readWorkspace,
  WORKSPACE_KEY,
  compareScenario,
  exampleScenario,
  documentTemplates,
} from '@/domain/workspace';
beforeEach(() => localStorage.clear());
describe('business comparisons', () => {
  it('reconciles contribution, fixed costs, break-even and independent downside cases', () => {
    expect(compareScenario(exampleScenario)).toMatchObject({
      revenue: '100000.00',
      contribution: '400.00',
      profit: '20000.00',
      breakEven: '50',
      lowerVolumeProfit: '12000.00',
      higherCostProfit: '14000.00',
    });
  });
  it('handles losses, zero units, paise rounding and invalid inputs', () => {
    expect(compareScenario({ ...exampleScenario, cost: '1000' }).breakEven).toBeNull();
    expect(compareScenario({ ...exampleScenario, units: '0' }).profit).toBe('-20000.00');
    expect(compareScenario({ ...exampleScenario, price: '100.01', discount: '12.35' }).netPrice).toBe(
      '87.66',
    );
    for (const value of ['NaN', '-1', '1e5', '1.234', '9999999999'])
      expect(() => compareScenario({ ...exampleScenario, price: value })).toThrow();
    expect(() => compareScenario({ ...exampleScenario, units: '1.5' })).toThrow();
    expect(() => compareScenario({ ...exampleScenario, discount: '100' })).toThrow();
    expect(() => compareScenario({ ...exampleScenario, price: '0.01', discount: '99.99' })).toThrow();
  });
});
describe('optional workspace', () => {
  it('writes only on request and round-trips supported incomplete drafts', () => {
    expect(localStorage.getItem(WORKSPACE_KEY)).toBeNull();
    const w = blankWorkspace();
    w.profile.businessName = 'Private example';
    w.scenarios = [exampleScenario];
    w.drafts = [
      {
        id: crypto.randomUUID(),
        name: 'Incomplete quote',
        kind: 'quotation',
        values: { ...documentTemplates.quotation, quoteNumber: '', logo: null },
      },
    ];
    writeWorkspace(w);
    expect(readWorkspace()).toEqual(w);
  });
  it('rejects malformed and unsupported backups without altering saved data', () => {
    writeWorkspace(blankWorkspace());
    const previous = localStorage.getItem(WORKSPACE_KEY);
    for (const data of [
      'bad',
      JSON.stringify({ ...blankWorkspace(), version: 2 }),
      JSON.stringify({
        ...blankWorkspace(),
        drafts: [{ id: crypto.randomUUID(), name: 'Bad', kind: 'quotation', values: { items: 'bad' } }],
      }),
      'x'.repeat(512001),
    ])
      expect(() => parseWorkspace(data)).toThrow();
    expect(localStorage.getItem(WORKSPACE_KEY)).toBe(previous);
  });
  it('validates every supported document template and rejects embedded logos and excess scenarios', () => {
    for (const kind of ['quotation', 'invoice', 'receipt'] as const) {
      const w = blankWorkspace();
      w.drafts = [{ id: crypto.randomUUID(), name: kind, kind, values: documentTemplates[kind] }];
      expect(() => parseWorkspace(JSON.stringify(w))).not.toThrow();
    }
    expect(() =>
      writeWorkspace({ ...blankWorkspace(), scenarios: Array(4).fill(exampleScenario) }),
    ).toThrow();
  });
  it('surfaces storage failures rather than claiming a save', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    expect(() => writeWorkspace(blankWorkspace())).toThrow('Quota exceeded');
    spy.mockRestore();
  });
});
