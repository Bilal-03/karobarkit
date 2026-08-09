import type { SourceReference } from '@/domain/registry/types';

import { addIsoDays, compareIsoDates, isIsoDate, type EffectiveDatedStatus } from './effective-dated';

export const INCOME_TAX_POLICY_AS_OF = '2026-08-09';
export const HRA_POLICY_ASSESSMENT_YEAR = '2026-27';
export const INCOME_TAX_POLICY_REVIEW_INTERVAL_DAYS = 30;

export interface HraPolicyVersion {
  id: string;
  assessmentYear: string;
  financialYear: string;
  effectiveFrom: string;
  effectiveTo: string;
  lastVerifiedOn: string;
  sourceIds: string[];
  status: EffectiveDatedStatus;
  metroSalaryPercent: string;
  nonMetroSalaryPercent: string;
  rentReductionPercent: string;
  eligibleRegime: 'old';
}

const source = (
  value: Omit<SourceReference, 'lastChecked' | 'evidenceLevel'> &
    Partial<Pick<SourceReference, 'lastChecked' | 'evidenceLevel'>>,
): SourceReference => ({
  lastChecked: INCOME_TAX_POLICY_AS_OF,
  evidenceLevel: 'official',
  ...value,
});

export const INCOME_TAX_REGULATORY_SOURCES: SourceReference[] = [
  source({
    id: 'income-tax-hra-rule-2a',
    title: 'Rule 2A — House rent allowance exemption',
    publisher: 'Income Tax Department',
    url: 'https://wmstatic-prd.incometaxindia.gov.in/web/guest/w/rule-2a-1',
    documentType: 'rule',
    effectiveFrom: '1975-04-01',
    notes:
      'Controlling Rule 2A source for the least-of-three HRA limits, named 50% cities, 40% other locations and the relevant occupation period.',
    supports: ['section 10(13A) HRA arithmetic', 'named city boundary', 'relevant period'],
  }),
  source({
    id: 'income-tax-hra-allowances-guidance',
    title: 'Allowances allowable to a taxpayer',
    publisher: 'Income Tax Department',
    url: 'https://www.incometaxindia.gov.in/w/allowances-allowable-to-tax-payer',
    documentType: 'rule',
    effectiveFrom: '2025-04-01',
    notes:
      'Official explanatory material for salary definition, turnover-linked commission and own-house/no-rent treatment.',
    supports: ['salary definition', 'turnover-based commission', 'eligibility boundary'],
  }),
  source({
    id: 'income-tax-hra-itr4-ay-2026-27',
    title: 'CBDT e-Filing ITR-4 Validation Rules for AY 2026-27',
    publisher: 'Income Tax Department',
    url: 'https://www.incometax.gov.in/iec/foportal/sites/default/files/2026-05/CBDT_e-Filing_ITR%204_Validation%20Rules_AY%202026-27.pdf',
    effectiveFrom: '2025-04-01',
    effectiveTo: '2026-03-31',
    documentType: 'validation-rules',
    publishedOn: '2026-05-15',
    notes:
      'The validation rules state the lowest-of-three HRA exemption calculation and the 40%/50% salary cap. The calculator does not prepare or validate an income-tax return.',
    supports: ['section 10(13A) HRA arithmetic', '40%/50% salary cap', 'AY 2026-27 validation context'],
  }),
  source({
    id: 'income-tax-regime-faq-hra',
    title: 'FAQs on New Tax vs Old Tax Regime',
    publisher: 'Income Tax Department',
    url: 'https://www.incometax.gov.in/iec/foportal/help/new-tax-vs-old-tax-regime-faqs?mobile-app=1',
    documentType: 'rule',
    effectiveFrom: '2023-04-01',
    notes:
      'The official FAQ states that HRA exemption under section 10(13A) is available under the old tax regime and not under the new tax regime.',
    supports: ['tax-regime availability boundary', 'new-regime limitation'],
  }),
  source({
    id: 'it-individual-ay-2026-27',
    title: 'Salaried Individuals for AY 2026-27',
    publisher: 'Income Tax Department',
    url: 'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1?fromCampaign=true',
    effectiveFrom: '2025-04-01',
    effectiveTo: '2026-03-31',
    documentType: 'rule',
    notes: 'Official AY 2026-27 individual slabs, regime, rebate, surcharge and cess guidance.',
    supports: ['individual slabs', 'rebate', 'surcharge', 'health and education cess'],
  }),
  source({
    id: 'it-income-tax-calculator-2026',
    title: 'Income and Tax Calculator user guidance',
    publisher: 'Income Tax Department',
    url: 'https://www.incometax.gov.in/iec/foportal/income-tax-calculator?mobile-app=1',
    effectiveFrom: '2025-04-01',
    documentType: 'rule',
    notes:
      'Official calculator boundary for selecting the applicable Act, tax period, category and deductions.',
    supports: ['applicable Act selection', 'tax period selection', 'supported income and deductions'],
  }),
  source({
    id: 'it-tds-transition-2026',
    title: 'TDS compliance transition guidance',
    publisher: 'Income Tax Department',
    url: 'https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/tds-compliance',
    effectiveFrom: '2026-04-01',
    documentType: 'rule',
    notes:
      'The obligation uses the earlier of credit or payment; the 1961 Act applies through 31 March 2026 and the 2025 Act applies from 1 April 2026.',
    supports: ['TDS transition', 'credit/payment trigger', 'new Act section mapping'],
  }),
  source({
    id: 'it-tds-rates-ay-2026-27',
    title: 'Income-tax rates and TDS rate table',
    publisher: 'Income Tax Department',
    url: 'https://www.incometaxindia.gov.in/tax-rates',
    effectiveFrom: '2025-04-01',
    effectiveTo: '2026-03-31',
    documentType: 'rate-schedule',
    notes: 'Official tax-rate navigation used for the supported TDS payment-type presets.',
    supports: ['TDS rates', 'rate-table context'],
  }),
  source({
    id: 'it-domestic-company-ay-2026-27',
    title: 'Domestic Company for AY 2026-27',
    publisher: 'Income Tax Department',
    url: 'https://www.incometax.gov.in/iec/foportal/help/company/return-applicable',
    effectiveFrom: '2025-04-01',
    effectiveTo: '2026-03-31',
    documentType: 'rule',
    notes: 'Official corporate tax regimes, surcharge, cess and MAT guidance.',
    supports: ['domestic-company regimes', 'surcharge', 'cess', 'MAT warning'],
  }),
  source({
    id: 'it-presumptive-ay-2026-27',
    title: 'ITR-4 Sugam FAQs for AY 2026-27',
    publisher: 'Income Tax Department',
    url: 'https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/itr%204-faqs',
    effectiveFrom: '2025-04-01',
    effectiveTo: '2026-03-31',
    documentType: 'rule',
    notes: 'Official 44AD, 44ADA and 44AE eligibility and presumptive-income context.',
    supports: ['44AD', '44ADA', '44AE', 'turnover and receipt thresholds'],
  }),
  source({
    id: 'epfo-faq-2026',
    title: 'EPFO frequently asked questions',
    publisher: 'Employees Provident Fund Organisation',
    url: 'https://www.epfindia.gov.in/site_en/FAQ.php',
    documentType: 'rule',
    notes: 'Official EPFO contribution components, wage ceiling and higher-wage exception guidance.',
    supports: ['EPF 12%', 'EPS 8.33%', 'EDLI 0.5%', '₹15,000 wage ceiling'],
  }),
  source({
    id: 'labour-codes-faq-2026',
    title: 'FAQs on Labour Codes',
    publisher: 'Ministry of Labour and Employment',
    url: 'https://www.labour.gov.in/static/uploads/2026/01/de4758d5bfeffc456d7de97a801891b0.pdf',
    effectiveFrom: '2025-11-21',
    documentType: 'rule',
    notes: 'Official gratuity events, qualifying service, wage definition and fixed-term treatment.',
    supports: ['gratuity events', 'five-year rule', 'fixed-term one-year rule', '15-day wage method'],
  }),
];

export const INCOME_TAX_SOURCE_IDS = INCOME_TAX_REGULATORY_SOURCES.map((item) => item.id);

export const HRA_POLICY_BUNDLE: readonly HraPolicyVersion[] = [
  {
    id: 'hra-section-10-13a-ay-2026-27-v2',
    assessmentYear: HRA_POLICY_ASSESSMENT_YEAR,
    financialYear: '2025-26',
    effectiveFrom: '2025-04-01',
    effectiveTo: '2026-03-31',
    lastVerifiedOn: INCOME_TAX_POLICY_AS_OF,
    sourceIds: [
      'income-tax-hra-rule-2a',
      'income-tax-hra-allowances-guidance',
      'income-tax-hra-itr4-ay-2026-27',
      'income-tax-regime-faq-hra',
    ],
    status: 'active',
    metroSalaryPercent: '50',
    nonMetroSalaryPercent: '40',
    rentReductionPercent: '10',
    eligibleRegime: 'old',
  },
];

function isFresh(
  lastVerifiedOn: string,
  asOf: string,
  intervalDays = INCOME_TAX_POLICY_REVIEW_INTERVAL_DAYS,
) {
  return compareIsoDates(asOf, addIsoDays(lastVerifiedOn, intervalDays)) <= 0;
}

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function validateIncomeTaxSourceBundle(
  sourceIds: readonly string[],
  sources: readonly SourceReference[] = INCOME_TAX_REGULATORY_SOURCES,
) {
  const errors: string[] = [];
  if (sourceIds.length === 0) errors.push('A policy must reference at least one source.');
  const sourceMap = new Map<string, SourceReference>();
  for (const item of sources) {
    if (sourceMap.has(item.id)) errors.push(`Duplicate source ID: ${item.id}`);
    sourceMap.set(item.id, item);
    try {
      const parsed = new URL(item.url);
      const hostname = parsed.hostname.toLowerCase();
      if (parsed.protocol !== 'https:' || !(hostname === 'gov.in' || hostname.endsWith('.gov.in'))) {
        errors.push(`Source is not on an approved government domain: ${item.id}`);
      }
    } catch {
      errors.push(`Source URL is invalid: ${item.id}`);
    }
  }
  for (const id of sourceIds) {
    if (!sourceMap.has(id)) errors.push(`Missing source reference: ${id}`);
  }
  return errors;
}

export function getIncomeTaxSourceReferences(sourceIds: readonly string[] = INCOME_TAX_SOURCE_IDS) {
  const wanted = new Set(sourceIds);
  return INCOME_TAX_REGULATORY_SOURCES.filter((item) => wanted.has(item.id));
}

export function getHraPolicy(assessmentYear: string, asOf = currentIsoDate()) {
  if (!isIsoDate(asOf)) return undefined;
  const policy = HRA_POLICY_BUNDLE.find(
    (candidate) =>
      candidate.assessmentYear === assessmentYear &&
      candidate.status === 'active' &&
      isFresh(candidate.lastVerifiedOn, asOf),
  );
  if (!policy) return undefined;
  const references = getIncomeTaxSourceReferences(policy.sourceIds);
  return validateIncomeTaxSourceBundle(policy.sourceIds, references).length === 0 ? policy : undefined;
}

export function getHraPolicyFreshness(asOf = currentIsoDate()) {
  const policy = HRA_POLICY_BUNDLE[0];
  const reviewDueOn = addIsoDays(policy.lastVerifiedOn, INCOME_TAX_POLICY_REVIEW_INTERVAL_DAYS);
  return {
    isStale: !isIsoDate(asOf) || compareIsoDates(asOf, reviewDueOn) > 0,
    reviewDueOn,
  };
}
