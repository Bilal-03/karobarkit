import {
  calculateHra,
  hraCalculatorDefaultValues,
  hraCalculatorInputSchema,
  type HraCalculationResult,
  type HraCalculatorInput,
  validateHraCalculatorInput,
} from '@/domain/calculations/hra';
import {
  HRA_POLICY_ASSESSMENT_YEAR,
  INCOME_TAX_POLICY_AS_OF,
  getIncomeTaxSourceReferences,
} from '@/domain/policies/income-tax';

import type { ToolDefinition } from '../types';
import { liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

const hraPrivacyNote =
  'Salary, rent, HRA and regime inputs stay in this browser. They are not sent to analytics, a backend, a URL or a log, and are not saved by default.';

export const hraTool: ToolDefinition<HraCalculatorInput, HraCalculationResult> = {
  id: 'hra-calculator',
  slug: 'hra-calculator',
  kind: 'calculator',
  ui: { adapter: 'tax-calculator', variant: 'hra' },
  name: 'HRA Calculator',
  shortName: 'HRA',
  category: 'gst-tax',
  categoryLabel: 'GST & Tax',
  secondaryCategories: ['hr-salary'],
  tags: ['hra', 'house rent allowance', 'income tax', 'salary'],
  searchTerms: ['house rent allowance', 'hra exemption', 'section 10(13a)', 'rent exemption'],
  featured: false,
  launchPriority: 35,
  regulatory: true,
  ...liveLocalMetadata({
    riskTier: 'D',
    reviewCadenceDays: 30,
    policyDependencies: [
      'hra-section-10-13a-ay-2026-27-v2',
      'income-tax-hra-rule-2a',
      'income-tax-hra-allowances-guidance',
      'income-tax-hra-itr4-ay-2026-27',
      'income-tax-regime-faq-hra',
    ],
    goldenFixtureIds: [
      'hra-ay-2026-27-lowest-of-three',
      'hra-ay-2026-27-named-city-cap',
      'hra-ay-2026-27-unsupported-eligibility',
    ],
    method:
      'Lowest-of-three HRA exemption illustration using actual HRA, rent reduced by 10% of basic salary plus eligible DA and eligible turnover-based commission, and the 40%/50% salary cap for the named Rule 2A city branch.',
    lastVerified: INCOME_TAX_POLICY_AS_OF,
    effectiveFrom: '2025-04-01',
    reviewerRole: 'Income-tax and payroll review',
    reviewerStatus: 'pending',
    lifecycle: 'beta',
    featureFlag: 'phase4-tax-review',
  }),
  summary:
    'Estimate HRA exemption for AY 2026-27 with explicit regime, rented-period, salary-definition and named-city limits.',
  inputSchema: hraCalculatorInputSchema,
  defaultValues: hraCalculatorDefaultValues,
  validate: validateHraCalculatorInput,
  calculate: (input) => calculateHra(input),
  renderResult: (result) => result.headline.value,
  sources: getIncomeTaxSourceReferences([
    'income-tax-hra-rule-2a',
    'income-tax-hra-allowances-guidance',
    'income-tax-hra-itr4-ay-2026-27',
    'income-tax-regime-faq-hra',
  ]),
  limitations: [
    'The first policy bundle covers AY 2026-27 / FY 2025-26 only; unsupported assessment years are rejected.',
    'The calculator does not decide whether DA or turnover-based commission forms part of salary, verify rent records, or accept a return claim. Own-house/no-rent cases and changing salary, rent or city periods are stopped.',
    'This is not an income-tax return, Form 10BA workflow, payroll result, assessment or professional tax advice.',
  ],
  lastReviewed: INCOME_TAX_POLICY_AS_OF,
  seo: {
    title: 'HRA Calculator — Exemption for AY 2026-27 | KarobarKit',
    description:
      'Estimate HRA exemption using the official lowest-of-three rule with tax-regime, salary and city-category boundaries.',
    keywords: ['HRA calculator', 'HRA exemption calculator', 'house rent allowance calculator'],
  },
  relatedToolIds: ['gst-calculator', 'gst-invoice-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    `Select the supported assessment year (${HRA_POLICY_ASSESSMENT_YEAR}) and the regime from your records.`,
    'Enter annual basic salary, eligible DA, turnover-based commission, HRA received and rent actually paid.',
    'Choose one of the four Rule 2A cities or another location, confirm a stable rented-accommodation period, review the lowest-of-three breakdown and confirm the result with payroll or a qualified tax professional.',
  ],
  formula:
    'Old-regime HRA exemption = minimum(actual HRA, rent paid − 10% × (basic salary + eligible DA + eligible turnover-based commission), 50% of that salary base in Mumbai/Kolkata/Delhi/Chennai or 40% elsewhere); floor the rent condition at zero.',
  workedExample:
    'With salary base ₹6,00,000, HRA ₹1,80,000, rent ₹1,80,000 and an other-location category, the three limits are ₹1,80,000, ₹1,20,000 and ₹2,40,000, so the illustration is ₹1,20,000 under the old regime.',
  resultInterpretation:
    'The output is a policy-scoped arithmetic illustration. It is not a final exemption claim and does not establish eligibility or return acceptance.',
  edgeCases: [
    'The new regime reports no exemption under section 10(13A) according to the cited official FAQ.',
    'Rent below 10% of salary produces a zero rent-condition limit rather than a negative exemption.',
    'Only Mumbai, Kolkata, Delhi and Chennai use the 50% branch; all other locations use 40%.',
  ],
  faqs: [
    {
      question: 'Can I claim HRA exemption under the new regime?',
      answer:
        'The cited Income Tax Department FAQ says HRA exemption under section 10(13A) is available under the old regime and not under the new regime. This calculator therefore reports zero under the new-regime selection.',
    },
    {
      question: 'Does the calculator verify my rent or salary records?',
      answer:
        'No. It uses the values and city category you declare. Keep records and confirm the claim with payroll or a qualified tax professional.',
    },
  ],
  privacyNote: hraPrivacyNote,
  disclaimer:
    'This policy-scoped estimate is educational and not tax, payroll or legal advice. Verify the applicable Act, rules, assessment-year instructions and records before filing or claiming an exemption.',
};
