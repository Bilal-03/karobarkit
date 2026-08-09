import { describe, expect, it } from 'vitest';

import {
  clearLocalScenarioTransfer,
  readLocalScenarioTransfer,
  saveLocalScenarioTransfer,
  selectSharedScenarioValues,
} from '@/domain/workflows/local-scenario-transfer';

describe('local scenario transfer', () => {
  it('stores and reads an explicitly saved tab-only scenario', () => {
    clearLocalScenarioTransfer();
    expect(
      saveLocalScenarioTransfer({
        sourceToolId: 'pricing-calculator',
        sourceToolName: 'Pricing Calculator',
        sourceKind: 'pricing',
        values: { unitCost: '600', targetMargin: '40' },
      }),
    ).toBe(true);

    const transfer = readLocalScenarioTransfer();
    expect(transfer?.sourceToolId).toBe('pricing-calculator');
    expect(transfer?.values).toEqual({ unitCost: '600', targetMargin: '40' });
    expect(transfer?.version).toBe(1);
    expect(transfer?.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('selects only matching destination fields', () => {
    expect(
      selectSharedScenarioValues({ unitCost: '600', targetMargin: '40', privateNote: 'do not copy' }, [
        'unitCost',
        'sellingPrice',
      ]),
    ).toEqual({ unitCost: '600' });
  });

  it('clears the transfer and rejects malformed storage', () => {
    window.sessionStorage.setItem('karobarkit:scenario-transfer:v1', '{bad json');
    expect(readLocalScenarioTransfer()).toBeNull();
    clearLocalScenarioTransfer();
    expect(readLocalScenarioTransfer()).toBeNull();
  });
});
