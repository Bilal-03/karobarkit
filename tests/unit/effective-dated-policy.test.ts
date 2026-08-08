import { describe, expect, it } from 'vitest';

import {
  addIsoDays,
  daysBetweenIsoDates,
  effectiveDateRangesOverlap,
  isEffectiveOn,
  isIsoDate,
  selectEffectiveVersion,
  type EffectiveDatedVersion,
} from '@/domain/policies/effective-dated';

const versions: EffectiveDatedVersion[] = [
  {
    id: 'historical-v1',
    effectiveFrom: '2025-01-01',
    effectiveTo: '2025-12-31',
    lastVerifiedOn: '2026-01-10',
    status: 'historical',
  },
  {
    id: 'active-v2',
    effectiveFrom: '2026-01-01',
    lastVerifiedOn: '2026-08-08',
    status: 'active',
  },
];

describe('effective-dated policy primitives', () => {
  it('validates real ISO calendar dates', () => {
    expect(isIsoDate('2026-08-09')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('09-08-2026')).toBe(false);
  });

  it('selects exactly one active version for the applicable date', () => {
    expect(selectEffectiveVersion({ policies: versions }, '2026-08-09')?.id).toBe('active-v2');
    expect(selectEffectiveVersion({ policies: versions }, '2025-06-01')).toBeUndefined();
    expect(
      selectEffectiveVersion(
        { policies: [...versions, { ...versions[1]!, id: 'active-overlap' }] },
        '2026-08-09',
      ),
    ).toBeUndefined();
  });

  it('handles inclusive boundaries, overlap and freshness date arithmetic', () => {
    expect(isEffectiveOn(versions[0]!, '2025-12-31')).toBe(true);
    expect(
      effectiveDateRangesOverlap(
        { effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31' },
        { effectiveFrom: '2025-12-31', effectiveTo: '2026-01-31' },
      ),
    ).toBe(true);
    expect(addIsoDays('2026-01-01', 180)).toBe('2026-06-30');
    expect(daysBetweenIsoDates('2026-06-30', '2026-08-09')).toBe(40);
  });
});
