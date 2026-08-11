import { describe, expect, it, vi } from 'vitest';

import {
  calculateCurrencyConversion,
  calculateDepreciation,
  calculateGstDueDate,
  calculateHsn,
  calculateMsmeInterest,
  calculateProfessionalTax,
  validateHsnInput,
} from '@/domain/calculations/regulated-utilities';
import {
  isApprovedOfficialPolicyUrl,
  isRegulatedUtilitiesKillSwitchEnabled,
  regulatedPolicyState,
  validateOfficialPolicyUrls,
} from '@/domain/policies/regulated-utilities';
import { fetchEcbReferenceQuote } from '@/lib/regulated/currency-rates';

const TODAY = '2026-08-11';

describe('regulated utility policy controls', () => {
  it('classifies fresh, stale, future and invalid policy dates', () => {
    expect(regulatedPolicyState(TODAY, TODAY)).toBe('fresh');
    expect(regulatedPolicyState('2026-07-01', TODAY)).toBe('stale');
    expect(regulatedPolicyState('2026-08-12', TODAY)).toBe('future');
    expect(regulatedPolicyState(TODAY, TODAY, 'withdrawn')).toBe('withdrawn');
    expect(regulatedPolicyState('not-a-date', TODAY)).toBe('invalid');
    expect(isRegulatedUtilitiesKillSwitchEnabled('true')).toBe(true);
    expect(isRegulatedUtilitiesKillSwitchEnabled('off')).toBe(false);
  });

  it('allows only HTTPS URLs on the named official host allowlist', () => {
    expect(isApprovedOfficialPolicyUrl('https://www.gst.gov.in/')).toBe(true);
    expect(isApprovedOfficialPolicyUrl('https://data.ecb.europa.eu/service/data/EXR/D')).toBe(true);
    expect(isApprovedOfficialPolicyUrl('http://gst.gov.in/')).toBe(false);
    expect(isApprovedOfficialPolicyUrl('https://gst.gov.in.attacker.example/')).toBe(false);
    expect(validateOfficialPolicyUrls(['https://www.rbi.org.in/', 'https://www.mahagst.gov.in/'])).toBe(true);
  });
});

describe('regulated utility calculation contracts', () => {
  it('searches HSN/SAC fixture rows and blocks stale policy', () => {
    const result = calculateHsn({ query: 'bread', kind: 'all' }, TODAY);
    expect(result.matches[0]?.code).toBe('1905');
    expect(result.datasetVersion).toContain('2026-04');
    expect(() => calculateHsn({ query: 'bread', kind: 'all' }, '2026-12-01')).toThrow(/stale/i);
    expect(validateHsnInput({ query: '', kind: 'all' }).success).toBe(false);
  });

  it('keeps GST calendar inside the FY boundary and exposes the reference date', () => {
    const result = calculateGstDueDate(
      {
        financialYear: '2026-27',
        returnType: 'gstr-1',
        taxpayerType: 'regular-monthly',
        qrmpDueDateGroup: '22',
        period: '2027-03',
      },
      TODAY,
    );
    expect(result.referenceDueDate).toBe('2027-04-11');
    expect(() =>
      calculateGstDueDate(
        {
          financialYear: '2026-27',
          returnType: 'gstr-1',
          taxpayerType: 'regular-monthly',
          qrmpDueDateGroup: '22',
          period: '2027-04',
        },
        TODAY,
      ),
    ).toThrow(/April 2026 to March 2027/);
  });

  it('uses quarter-end periods and the selected 22nd/24th QRMP GSTR-3B group', () => {
    expect(
      calculateGstDueDate(
        {
          financialYear: '2026-27',
          returnType: 'gstr-3b',
          taxpayerType: 'qrmp-quarterly',
          qrmpDueDateGroup: '24',
          period: '2026-09',
        },
        TODAY,
      ).referenceDueDate,
    ).toBe('2026-10-24');
    expect(() =>
      calculateGstDueDate(
        {
          financialYear: '2026-27',
          returnType: 'gstr-3b',
          taxpayerType: 'qrmp-quarterly',
          qrmpDueDateGroup: '22',
          period: '2026-08',
        },
        TODAY,
      ),
    ).toThrow(/quarter ending/i);
  });

  it('separates Companies Act SLM and Income Tax WDV depreciation modes', () => {
    const slm = calculateDepreciation(
      {
        mode: 'companies-act',
        assetCost: '100000',
        residualValue: '5000',
        usefulLifeYears: '5',
        openingWdv: '',
        ratePercent: '',
        daysInService: '365',
        method: 'slm',
      },
      TODAY,
    );
    expect(slm.annualDepreciation).toBe('19000');
    expect(() =>
      calculateDepreciation(
        {
          mode: 'companies-act',
          assetCost: '100000',
          residualValue: '5000',
          usefulLifeYears: '5',
          openingWdv: '',
          ratePercent: '',
          daysInService: '365',
          method: 'wdv',
        },
        TODAY,
      ),
    ).toThrow(/straight-line/i);
    expect(
      calculateDepreciation(
        {
          mode: 'income-tax',
          assetCost: '100000',
          residualValue: '0',
          usefulLifeYears: '',
          openingWdv: '80000',
          ratePercent: '15',
          daysInService: '365',
          method: 'wdv',
        },
        TODAY,
      ).annualDepreciation,
    ).toBe('12000');
    expect(
      calculateDepreciation(
        {
          mode: 'income-tax',
          assetCost: '100000',
          residualValue: '0',
          usefulLifeYears: '',
          openingWdv: '80000',
          ratePercent: '15',
          daysInService: '179',
          method: 'wdv',
        },
        TODAY,
      ).annualDepreciation,
    ).toBe('6000');
    expect(
      calculateDepreciation(
        {
          mode: 'income-tax',
          assetCost: '100000',
          residualValue: '0',
          usefulLifeYears: '',
          openingWdv: '80000',
          ratePercent: '15',
          daysInService: '180',
          method: 'wdv',
        },
        TODAY,
      ).annualDepreciation,
    ).toBe('12000');
  });

  it('applies the visible Maharashtra professional-tax reference assumptions', () => {
    const result = calculateProfessionalTax(
      {
        state: 'maharashtra',
        salaryAmount: '50000',
        salaryPeriod: 'monthly',
        salaryDefinition: 'gross-monthly',
        gender: 'male',
        month: '2027-02',
      },
      TODAY,
    );
    expect(result.monthlyTax).toBe('300');
    expect(result.annualIllustration).toBe('2500');
    expect(
      calculateProfessionalTax(
        {
          state: 'maharashtra',
          salaryAmount: '25000',
          salaryPeriod: 'monthly',
          salaryDefinition: 'gross-monthly',
          gender: 'female',
          month: '2027-02',
        },
        TODAY,
      ).annualIllustration,
    ).toBe('0');
  });

  it('reports MSME eligibility separately from delayed-payment arithmetic', () => {
    const eligible = calculateMsmeInterest(
      {
        principal: '100000',
        invoiceDate: '2026-05-01',
        acceptedDate: '2026-05-01',
        agreedPaymentDays: '45',
        agreementBasis: 'written-agreement',
        paymentDate: '2026-08-11',
        bankRatePercent: '6.5',
        bankRateEffectiveOn: '2026-05-01',
        enterpriseType: 'micro',
      },
      TODAY,
    );
    expect(eligible.eligible).toBe(true);
    expect(eligible.overdueDays).toBe(57);
    expect(Number(eligible.estimatedInterest)).toBeGreaterThan(0);
    const trading = calculateMsmeInterest(
      {
        principal: '100000',
        invoiceDate: '2026-05-01',
        acceptedDate: '2026-05-01',
        agreedPaymentDays: '45',
        agreementBasis: 'written-agreement',
        paymentDate: '2026-08-11',
        bankRatePercent: '6.5',
        bankRateEffectiveOn: '2026-05-01',
        enterpriseType: 'trading',
      },
      TODAY,
    );
    expect(trading.eligible).toBe(false);
    expect(trading.estimatedInterest).toBe('0');

    const monthEnd = calculateMsmeInterest(
      {
        principal: '100',
        invoiceDate: '2026-01-16',
        acceptedDate: '2026-01-16',
        agreedPaymentDays: '0',
        agreementBasis: 'no-agreement',
        paymentDate: '2026-03-31',
        bankRatePercent: '6',
        bankRateEffectiveOn: '2026-01-01',
        enterpriseType: 'small',
      },
      TODAY,
    );
    expect(monthEnd.dueDate).toBe('2026-01-31');
    expect(monthEnd.estimatedInterest).toBe('3.0225');
  });

  it('never silently reuses a network rate and marks stale quotes', () => {
    const manual = calculateCurrencyConversion(
      { amount: '1000', fromCurrency: 'INR', toCurrency: 'USD', manualRate: '0.012' },
      undefined,
      TODAY,
    );
    expect(manual.quoteSource).toBe('manual');
    expect(manual.fallback).toBe(true);
    expect(manual.convertedAmount).toBe('12');
    const stale = calculateCurrencyConversion(
      { amount: '1000', fromCurrency: 'INR', toCurrency: 'USD', manualRate: '0.012' },
      {
        rate: '0.012',
        quotedOn: '2026-08-01',
        source: 'ECB reference',
        rateType: 'reference',
        cacheState: 'not-cached',
        sourceUrl:
          'https://data.ecb.europa.eu/key-figures/ecb-interest-rates-and-exchange-rates/exchange-rates',
      },
      TODAY,
    );
    expect(stale.stale).toBe(true);
    expect(stale.quoteSource).toBe('ECB reference');
  });

  it('surfaces an ECB network failure for explicit manual fallback handling', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));
    await expect(fetchEcbReferenceQuote('INR', 'USD', TODAY)).rejects.toThrow('network unavailable');
    vi.unstubAllGlobals();
  });
});
