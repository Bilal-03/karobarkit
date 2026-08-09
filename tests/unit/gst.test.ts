import { describe, expect, it } from 'vitest';

import { calculateGst, validateGstInput, type GstInput } from '@/domain/gst';
import {
  GST_POLICY_BUNDLE,
  GST_POLICY_AS_OF,
  GST_UI_RATE_PRESET_IDS,
  getActiveGstPolicy,
  getGstPolicyFreshness,
  validateGstPolicyBundle,
  validateGstUiPresetIds,
  type GstPolicyBundle,
  type RegulatorySource,
} from '@/domain/policies/gst';

const baseInput: GstInput = {
  amount: '1000',
  ratePresetId: 'gst-headline-rate-18',
  customRate: '',
  mode: 'exclusive',
  supplyType: 'unspecified',
};

function clonePolicyBundle() {
  return JSON.parse(JSON.stringify(GST_POLICY_BUNDLE)) as GstPolicyBundle;
}

describe('pure GST calculation engine', () => {
  it('calculates the required exclusive example exactly', () => {
    expect(
      calculateGst({ amount: '1000', ratePercent: '18', mode: 'exclusive', supplyType: 'unspecified' }),
    ).toMatchObject({
      taxableValue: '1000.00',
      gstAmount: '180.00',
      totalAmount: '1180.00',
      roundingOccurred: false,
    });
  });

  it('rounds a two-decimal exclusive amount and keeps the total reconciled', () => {
    const result = calculateGst({
      amount: '999.99',
      ratePercent: '5',
      mode: 'exclusive',
      supplyType: 'unspecified',
    });
    expect(result.taxableValue).toBe('999.99');
    expect(result.gstAmount).toBe('50.00');
    expect(result.totalAmount).toBe('1049.99');
    expect(result.roundingOccurred).toBe(true);
  });

  it.each([
    ['1180', '1000.00', '180.00', '1180.00'],
    ['1050', '1000.00', '50.00', '1050.00'],
  ])('calculates inclusive amount %s', (amount, taxableValue, gstAmount, totalAmount) => {
    const result = calculateGst({
      amount,
      ratePercent: amount === '1180' ? '18' : '5',
      mode: 'inclusive',
      supplyType: 'unspecified',
    });
    expect(result).toMatchObject({ taxableValue, gstAmount, totalAmount });
  });

  it('reconciles intra-state and inter-state components', () => {
    const intra = calculateGst({
      amount: '1000',
      ratePercent: '18',
      mode: 'exclusive',
      supplyType: 'intra-state',
    });
    expect(intra).toMatchObject({ gstAmount: '180.00', cgstAmount: '90.00', sgstOrUtgstAmount: '90.00' });
    expect(Number(intra.cgstAmount) + Number(intra.sgstOrUtgstAmount)).toBe(Number(intra.gstAmount));

    const inter = calculateGst({
      amount: '1000',
      ratePercent: '18',
      mode: 'exclusive',
      supplyType: 'inter-state',
    });
    expect(inter.igstAmount).toBe('180.00');
    expect(inter.cgstAmount).toBeUndefined();
  });

  it('assigns an odd paise remainder after half-up rounding', () => {
    const result = calculateGst({
      amount: '0.01',
      ratePercent: '50',
      mode: 'exclusive',
      supplyType: 'intra-state',
    });
    expect(result).toMatchObject({
      gstAmount: '0.01',
      cgstAmount: '0.01',
      sgstOrUtgstAmount: '0.00',
      totalAmount: '0.02',
    });
  });

  it('supports decimal and zero custom rates in the pure engine', () => {
    expect(
      calculateGst({ amount: '100', ratePercent: '5.5', mode: 'exclusive', supplyType: 'unspecified' })
        .gstAmount,
    ).toBe('5.50');
    expect(
      calculateGst({ amount: '100', ratePercent: '0', mode: 'inclusive', supplyType: 'unspecified' }),
    ).toMatchObject({ taxableValue: '100.00', gstAmount: '0.00', totalAmount: '100.00' });
  });

  it.each([
    ['NaN', '18'],
    ['Infinity', '18'],
    ['-1', '18'],
    ['1.001', '18'],
    ['1000000000000000.00', '18'],
  ])('rejects unsafe amount %s', (amount, ratePercent) => {
    expect(() =>
      calculateGst({ amount, ratePercent, mode: 'exclusive', supplyType: 'unspecified' }),
    ).toThrow();
  });
});

describe('GST input validation', () => {
  it.each([
    ['empty', { ...baseInput, amount: '' }, 'amount'],
    ['whitespace', { ...baseInput, amount: '   ' }, 'amount'],
    ['zero', { ...baseInput, amount: '0' }, 'amount'],
    ['negative', { ...baseInput, amount: '-1' }, 'amount'],
    ['invalid string', { ...baseInput, amount: 'not-a-number' }, 'amount'],
    ['NaN', { ...baseInput, amount: 'NaN' }, 'amount'],
    ['Infinity', { ...baseInput, amount: 'Infinity' }, 'amount'],
    ['more than two decimals', { ...baseInput, amount: '1.001' }, 'amount'],
    ['extremely large', { ...baseInput, amount: '1000000000000000.00' }, 'amount'],
    ['missing custom rate', { ...baseInput, ratePresetId: 'custom' }, 'customRate'],
    ['negative custom rate', { ...baseInput, ratePresetId: 'custom', customRate: '-1' }, 'customRate'],
    ['too large custom rate', { ...baseInput, ratePresetId: 'custom', customRate: '100.01' }, 'customRate'],
    ['unsafe custom precision', { ...baseInput, ratePresetId: 'custom', customRate: '5.001' }, 'customRate'],
    ['invalid preset', { ...baseInput, ratePresetId: 'old-28-percent' }, 'ratePresetId'],
  ] as const)('rejects %s', (_label, input, field) => {
    const validation = validateGstInput(input);
    expect(validation.success).toBe(false);
    if (!validation.success) expect(validation.errors.some((error) => error.field === field)).toBe(true);
  });

  it('normalizes valid custom input without changing the pure result contract', () => {
    const validation = validateGstInput({
      ...baseInput,
      amount: ' 100.50 ',
      ratePresetId: 'custom',
      customRate: '5.5',
    });
    expect(validation).toEqual({
      success: true,
      data: { ...baseInput, amount: '100.50', ratePresetId: 'custom', customRate: '5.5' },
    });
  });
});

describe('GST policy validation and freshness', () => {
  it('records the current source-review date and active source access dates', () => {
    expect(GST_POLICY_AS_OF).toBe('2026-08-08');
    for (const source of GST_POLICY_BUNDLE.sources) expect(source.accessedOn).toBe(GST_POLICY_AS_OF);
  });

  it('has a single current policy and source-backed UI presets', () => {
    expect(validateGstPolicyBundle(GST_POLICY_BUNDLE)).toEqual({ success: true });
    expect(getActiveGstPolicy().id).toBe('gst-general-rates-2025-09-22-v1');
    expect(validateGstUiPresetIds(GST_UI_RATE_PRESET_IDS)).toEqual({ success: true });
    for (const preset of getActiveGstPolicy().ratePresets) {
      expect(preset.sourceIds.length).toBeGreaterThan(0);
      for (const sourceId of preset.sourceIds) {
        expect(getActiveGstPolicy().sourceIds).toContain(sourceId);
      }
    }
  });

  it('reports a stale review without changing the policy', () => {
    const stale = getGstPolicyFreshness(
      { ...getActiveGstPolicy(), lastVerifiedOn: '2025-01-01' },
      GST_POLICY_AS_OF,
    );
    expect(stale.isStale).toBe(true);
    expect(stale.reviewDueOn).toBe('2025-06-30');
  });

  it('rejects dates beyond the verified policy snapshot', () => {
    expect(() => getActiveGstPolicy('2099-01-01')).toThrow(/No reviewed GST policy covers dates after/iu);
  });

  it('rejects missing source authority, URL, unsupported domains and review dates', () => {
    const bundle = clonePolicyBundle();
    const firstSource = bundle.sources[0] as RegulatorySource;
    delete (firstSource as Partial<RegulatorySource>).authority;
    firstSource.officialUrl = 'https://example.com/rate.pdf';
    firstSource.accessedOn = '';
    const result = validateGstPolicyBundle(bundle);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.map((error) => error.code)).toEqual(
        expect.arrayContaining([
          'missing_source_authority',
          'unsupported_source_domain',
          'missing_last_reviewed',
        ]),
      );
    }
  });

  it('rejects source-less, expired, missing-date and duplicate rates', () => {
    const bundle = clonePolicyBundle();
    const policy = bundle.policies[0];
    if (!policy) throw new Error('Expected a policy fixture.');
    policy.effectiveTo = '2026-01-01';
    policy.lastVerifiedOn = '';
    const firstRate = policy.ratePresets[0];
    if (!firstRate) throw new Error('Expected a rate fixture.');
    firstRate.sourceIds = [];
    firstRate.effectiveFrom = '';
    policy.ratePresets.push({ ...firstRate, id: 'duplicate-rate' });
    const result = validateGstPolicyBundle(bundle);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.map((error) => error.code)).toEqual(
        expect.arrayContaining([
          'expired_active_policy',
          'missing_last_reviewed',
          'rate_without_source',
          'missing_rate_effective_from',
          'duplicate_rate_without_explanation',
        ]),
      );
    }
  });

  it('rejects overlapping active policies and UI/policy drift', () => {
    const bundle = clonePolicyBundle();
    const current = bundle.policies[0];
    if (!current) throw new Error('Expected a policy fixture.');
    bundle.policies.push({ ...current, id: 'gst-overlap', name: 'Overlapping fixture' });
    const result = validateGstPolicyBundle(bundle);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.errors.some((error) => error.code === 'overlapping_active_policies')).toBe(true);

    const mismatch = validateGstUiPresetIds(['gst-headline-rate-5']);
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) expect(mismatch.errors[0]?.code).toBe('ui_policy_mismatch');
  });
});
