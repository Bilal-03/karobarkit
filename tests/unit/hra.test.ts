import { describe, expect, it } from 'vitest';

import {
  calculateHra,
  hraCalculatorDefaultValues,
  validateHraCalculatorInput,
} from '@/domain/calculations/hra';
import {
  getHraPolicy,
  getHraPolicyFreshness,
  HRA_POLICY_ASSESSMENT_YEAR,
  HRA_POLICY_BUNDLE,
  validateIncomeTaxSourceBundle,
} from '@/domain/policies/income-tax';

describe('HRA policy and calculation', () => {
  it('selects the AY 2026-27 policy and applies the lowest-of-three rule', () => {
    const validation = validateHraCalculatorInput({
      ...hraCalculatorDefaultValues,
      assessmentYear: HRA_POLICY_ASSESSMENT_YEAR,
      basicSalary: '600000',
      dearnessAllowance: '0',
      turnoverBasedCommission: '0',
      hraReceived: '180000',
      rentPaid: '180000',
      accommodationStatus: 'rented',
      periodPattern: 'stable',
      taxRegime: 'old',
      cityType: 'other',
    });
    expect(validation.success).toBe(true);
    expect(getHraPolicy(HRA_POLICY_ASSESSMENT_YEAR)?.id).toBe('hra-section-10-13a-ay-2026-27-v2');
    if (!validation.success) return;
    const result = calculateHra(validation.data);
    expect(result.headline.value).toBe('120000.00');
    expect(result.status).toBe('eligible-rule');
    expect(result.policy.assessmentYear).toBe('2026-27');
  });

  it('changes only the salary cap branch for metro and non-metro examples', () => {
    const base = {
      ...hraCalculatorDefaultValues,
      basicSalary: '600000',
      dearnessAllowance: '0',
      hraReceived: '400000',
      rentPaid: '400000',
      taxRegime: 'old' as const,
    };
    const metro = calculateHra({ ...base, cityType: 'mumbai' });
    const nonMetro = calculateHra({ ...base, cityType: 'other' });
    expect(metro.headline.value).toBe('300000.00');
    expect(nonMetro.headline.value).toBe('240000.00');
  });

  it('reports no HRA exemption under the new regime without inventing eligibility', () => {
    const result = calculateHra({ ...hraCalculatorDefaultValues, taxRegime: 'new' });
    expect(result.headline.value).toBe('0.00');
    expect(result.status).toBe('not-available-under-regime');
    expect(result.detail).toMatch(/not available/iu);
  });

  it('rejects unsupported years, negative amounts and unsafe precision', () => {
    const invalid = validateHraCalculatorInput({
      ...hraCalculatorDefaultValues,
      assessmentYear: '2027-28',
      basicSalary: '-1',
      hraReceived: '1.234',
    });
    expect(invalid.success).toBe(false);
    if (invalid.success) return;
    expect(invalid.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['assessmentYear', 'basicSalary', 'hraReceived']),
    );
  });

  it('includes eligible turnover-based commission in the salary base', () => {
    const result = calculateHra({
      ...hraCalculatorDefaultValues,
      basicSalary: '600000',
      turnoverBasedCommission: '100000',
      hraReceived: '500000',
      rentPaid: '500000',
      cityType: 'mumbai',
      taxRegime: 'old',
    });
    expect(result.headline.value).toBe('350000.00');
    expect(result.details[0]?.value).toBe('700000.00');
  });

  it('stops own-house and changing-period fact patterns', () => {
    const validation = validateHraCalculatorInput({
      ...hraCalculatorDefaultValues,
      accommodationStatus: 'owned-or-no-rent',
      periodPattern: 'changed',
    });
    expect(validation.success).toBe(false);
    if (validation.success) return;
    expect(validation.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['unsupported_eligibility', 'unsupported_period_pattern']),
    );
  });

  it('uses the named Rule 2A cities for the 50% branch', () => {
    const result = calculateHra({ ...hraCalculatorDefaultValues, cityType: 'chennai' });
    expect(result.details.find((detail) => detail.label.startsWith('50%'))?.value).toBe('300000.00');
  });

  it('keeps the HRA source bundle official and exposes a freshness gate', () => {
    const policy = HRA_POLICY_BUNDLE[0]!;
    expect(validateIncomeTaxSourceBundle(policy.sourceIds)).toEqual([]);
    expect(getHraPolicyFreshness('2026-08-09').isStale).toBe(false);
    expect(getHraPolicyFreshness('2026-10-01').isStale).toBe(true);
    expect(getHraPolicyFreshness('not-a-date').isStale).toBe(true);
  });

  it('rejects non-government source hosts before a policy can activate', () => {
    const policy = HRA_POLICY_BUNDLE[0]!;
    const source = {
      id: policy.sourceIds[0]!,
      title: 'Untrusted fixture',
      publisher: 'Fixture',
      url: 'https://notgov.in/rule',
      lastChecked: '2026-08-09',
      evidenceLevel: 'official' as const,
    };
    expect(validateIncomeTaxSourceBundle(policy.sourceIds, [source])).toEqual(
      expect.arrayContaining([expect.stringMatching(/approved government domain/iu)]),
    );
  });
});
