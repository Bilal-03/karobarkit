import {
  calculateTax,
  taxCalculatorFields,
  taxCalculatorInputSchema,
  type TaxCalculationResult,
  type TaxCalculatorInput,
  type TaxCalculatorKind,
  validateTaxCalculatorInput,
} from '@/domain/calculations/tax';
import { getTaxSourceReferences } from '@/domain/calculations/tax';

import type { ToolDefinition } from '../types';
import { liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

const TAX_LAST_REVIEWED = '2026-08-09';
const TAX_FEATURE_FLAG = 'phase4-tax-review';
const privacyNote =
  'Tax and payroll inputs stay in this browser. They are not sent to analytics, a backend, a URL or a log, and are not saved by default.';

type TaxToolConfig = {
  kind: TaxCalculatorKind;
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: 'gst-tax' | 'hr-salary';
  secondaryCategories: string[];
  tags: string[];
  searchTerms: string[];
  summary: string;
  method: string;
  formula: string;
  workedExample: string;
  resultInterpretation: string;
  limitations: string[];
  edgeCases: string[];
  faqs: { question: string; answer: string }[];
  relatedToolIds: string[];
  seoTitle: string;
  seoDescription: string;
};

function createTaxTool(config: TaxToolConfig): ToolDefinition<TaxCalculatorInput, TaxCalculationResult> {
  const defaultValues = Object.fromEntries(
    taxCalculatorFields[config.kind].map((field) => [field.name, field.defaultValue]),
  );
  const dependencies: Record<TaxCalculatorKind, string[]> = {
    'income-tax': ['it-individual-ay-2026-27', 'it-income-tax-calculator-2026'],
    tds: ['it-tds-transition-2026', 'it-tds-rates-ay-2026-27'],
    'corporate-tax': ['it-domestic-company-ay-2026-27'],
    'presumptive-tax': ['it-presumptive-ay-2026-27'],
    ctc: ['epfo-faq-2026', 'labour-codes-faq-2026'],
    'in-hand-salary': ['it-individual-ay-2026-27', 'it-tds-transition-2026', 'epfo-faq-2026'],
    pf: ['epfo-faq-2026'],
    gratuity: ['labour-codes-faq-2026'],
  };
  return {
    id: config.id,
    slug: config.slug,
    kind: 'calculator',
    ui: { adapter: 'tax-calculator', variant: config.kind },
    name: config.name,
    shortName: config.shortName,
    category: config.category,
    categoryLabel: config.category === 'gst-tax' ? 'GST & Tax' : 'HR & Salary',
    secondaryCategories: config.secondaryCategories,
    tags: config.tags,
    searchTerms: config.searchTerms,
    summary: config.summary,
    featured: false,
    launchPriority: 60,
    regulatory: true,
    ...liveLocalMetadata({
      riskTier: 'D',
      reviewCadenceDays: config.kind === 'pf' || config.kind === 'gratuity' ? 90 : 30,
      policyDependencies: dependencies[config.kind],
      goldenFixtureIds: [`${config.kind}-base-case`, `${config.kind}-unsupported-case`],
      method: config.method,
      lastVerified: TAX_LAST_REVIEWED,
      effectiveFrom: '2025-04-01',
      reviewerRole:
        config.category === 'hr-salary' ? 'Named payroll/labour reviewer' : 'Named CA/tax reviewer',
      reviewerStatus: 'pending',
      lifecycle: 'beta',
      featureFlag: TAX_FEATURE_FLAG,
    }),
    inputSchema: taxCalculatorInputSchema,
    defaultValues,
    validate: (input) => validateTaxCalculatorInput(config.kind, input),
    calculate: (input) => calculateTax(config.kind, input),
    renderResult: (result) => result.headline.value,
    sources: getTaxSourceReferences(config.kind),
    limitations: config.limitations,
    lastReviewed: TAX_LAST_REVIEWED,
    seo: { title: config.seoTitle, description: config.seoDescription, keywords: config.searchTerms },
    relatedToolIds: config.relatedToolIds,
    analyticsPolicy: sharedAnalyticsPolicy,
    howToUse: taxCalculatorFields[config.kind].map((field) =>
      field.type === 'select'
        ? `Choose ${field.label.toLowerCase()} from your records.`
        : `Enter ${field.label.toLowerCase()} from your records or declared policy assumptions.`,
    ),
    formula: config.formula,
    workedExample: config.workedExample,
    resultInterpretation: config.resultInterpretation,
    edgeCases: config.edgeCases,
    faqs: config.faqs,
    privacyNote,
    disclaimer:
      'This is a policy-scoped educational estimate, not a tax return, payroll register, statutory filing, legal opinion or professional advice. Verify the applicable official source and records before acting.',
  };
}

export const incomeTaxTool = createTaxTool({
  kind: 'income-tax',
  id: 'income-tax-calculator',
  slug: 'income-tax-calculator',
  name: 'Income Tax Calculator',
  shortName: 'Income Tax',
  category: 'gst-tax',
  secondaryCategories: ['business'],
  tags: ['income tax', 'tax slabs', 'rebate', 'cess', 'surcharge'],
  searchTerms: ['income tax calculator', 'tax calculator india', 'old regime', 'new regime'],
  summary:
    'Estimate ordinary individual income tax by applicable period, regime, income and declared deductions.',
  method:
    'Effective-period individual slab estimate with explicit Act, regime, rebate, surcharge and cess boundaries.',
  formula:
    'Taxable income = supported income − declared deductions; tax = slab tax − rebate + surcharge + 4% health and education cess.',
  workedExample:
    'For ₹9,00,000 taxable income in the new regime, the estimate applies the published AY 2026-27 slabs, any eligible rebate and 4% cess.',
  resultInterpretation:
    'The result is an ordinary-income scenario, not a return computation or eligibility decision.',
  limitations: [
    'Capital gains, business income, special rates, loss set-off, marginal relief, AMT, filing validation and detailed salary schedules are excluded.',
    'Deductions are user-entered and must be supported by records; the tool does not validate Form 16, AIS or tax-return schedules.',
  ],
  edgeCases: [
    'The Tax Year 2026-27 path uses the Income Tax Act, 2025/new regime in this release.',
    'Non-resident and treaty/special-rate cases stop rather than silently using resident slabs.',
  ],
  faqs: [
    {
      question: 'Does this file my return?',
      answer: 'No. It is a local estimate and does not prepare or submit an income-tax return.',
    },
  ],
  relatedToolIds: ['tds-calculator', 'hra-calculator', 'in-hand-salary-calculator'],
  seoTitle: 'Income Tax Calculator India — AY/TY 2026-27 | KarobarKit',
  seoDescription:
    'Estimate Indian individual income tax with dated Act selection, regime slabs, rebate, surcharge, cess and visible limits.',
});

export const tdsTool = createTaxTool({
  kind: 'tds',
  id: 'tds-calculator',
  slug: 'tds-calculator',
  name: 'TDS Calculator',
  shortName: 'TDS',
  category: 'gst-tax',
  secondaryCategories: ['business'],
  tags: ['tds', 'withholding tax', 'contractor tds', 'professional tds'],
  searchTerms: ['tds calculator', 'tds on contractor', 'tds on rent', 'tds rate'],
  summary:
    'Estimate domestic TDS by payment type, threshold, PAN status and the old/new Act transition date.',
  method:
    'Policy-by-trigger-date TDS estimate using the earlier of credit or payment and explicitly mapped payment categories.',
  formula:
    'Estimated TDS = current amount × applicable rate when the applicable single-payment or annual threshold is exceeded; otherwise zero.',
  workedExample:
    'A ₹1,00,000 contractor payment to an individual with PAN uses the supported contractor rate after the applicable threshold is crossed.',
  resultInterpretation:
    'The result is a withholding estimate; it does not create a challan, certificate or filing statement.',
  limitations: [
    'Non-resident remittances, salary, property purchase, VDA, lower/nil certificates and special exceptions are excluded.',
    'PAN is recorded but not verified; rate tables and thresholds must be checked before deduction.',
  ],
  edgeCases: [
    'The earlier of credit or payment selects the Act and section reference.',
    'Missing PAN uses the higher-rate estimate and carries a verification warning.',
  ],
  faqs: [
    {
      question: 'Which Act applies after 1 April 2026?',
      answer:
        'The official transition guidance says payments or credits from 1 April 2026 use the Income Tax Act, 2025 section table; earlier triggers use the 1961 Act.',
    },
  ],
  relatedToolIds: ['income-tax-calculator', 'corporate-tax-calculator'],
  seoTitle: 'TDS Calculator India — Contractor, Professional and Rent | KarobarKit',
  seoDescription:
    'Estimate TDS by payment type, threshold, PAN status and credit/payment transition date with clear filing limits.',
});

export const corporateTaxTool = createTaxTool({
  kind: 'corporate-tax',
  id: 'corporate-tax-calculator',
  slug: 'corporate-tax-calculator',
  name: 'Corporate Tax Calculator',
  shortName: 'Corporate Tax',
  category: 'gst-tax',
  secondaryCategories: ['business'],
  tags: ['corporate tax', 'company tax', 'mat', 'surcharge'],
  searchTerms: ['corporate tax calculator', 'company tax calculator', 'mat calculator'],
  summary: 'Compare a declared domestic-company regime with surcharge, cess and a MAT warning.',
  method:
    'Scenario arithmetic for user-selected domestic-company regimes; no section eligibility is inferred.',
  formula:
    'Normal tax = taxable income × selected rate; add surcharge and 4% cess; compare with MAT when applicable.',
  workedExample:
    'A company entering ₹50,00,000 taxable income under a declared 25% regime receives a rate, cess and MAT comparison.',
  resultInterpretation:
    'This is a company scenario, not a tax audit or concessional-regime eligibility decision.',
  limitations: [
    'Deductions, turnover tests, marginal relief, book-profit adjustments and statutory return schedules are excluded.',
    '115BAA/115BAB eligibility must be confirmed independently.',
  ],
  edgeCases: [
    'Special 115BAA/115BAB scenarios are shown without MAT in accordance with the cited company guidance.',
    'Surcharge is estimated without marginal relief.',
  ],
  faqs: [
    {
      question: 'Does this determine if my company can choose 115BAA?',
      answer: 'No. Choose a regime only after confirming eligibility with a tax professional.',
    },
  ],
  relatedToolIds: ['income-tax-calculator', 'tds-calculator'],
  seoTitle: 'Corporate Tax Calculator India — Domestic Company | KarobarKit',
  seoDescription:
    'Compare domestic-company tax scenarios with surcharge, cess and MAT boundaries for AY 2026-27.',
});

export const presumptiveTaxTool = createTaxTool({
  kind: 'presumptive-tax',
  id: 'presumptive-tax-calculator',
  slug: 'presumptive-tax-calculator',
  name: 'Presumptive Tax Calculator',
  shortName: 'Presumptive Tax',
  category: 'gst-tax',
  secondaryCategories: ['business'],
  tags: ['presumptive tax', '44ad', '44ada', '44ae'],
  searchTerms: ['44ad calculator', '44ada calculator', '44ae calculator', 'presumptive income'],
  summary: 'Screen common 44AD, 44ADA and 44AE eligibility facts and estimate presumptive income.',
  method:
    'Eligibility-first questionnaire followed by the supported receipts, profession or vehicle formula.',
  formula:
    '44AD = 6% of eligible non-cash receipts + 8% of other receipts; 44ADA = 50% of receipts; 44AE = ₹7,500 per supported vehicle-month.',
  workedExample:
    'With ₹10,00,000 receipts and no cash receipts, the 44AD estimate is ₹60,000 before any return-level decisions.',
  resultInterpretation:
    'The result is estimated presumptive income, not a declaration that the taxpayer is eligible.',
  limitations: [
    'Detailed 44AD/44ADA/44AE exclusions, heavy-vehicle tonnage, books/audit consequences and return validation require separate review.',
    'Companies, LLPs, non-residents and unsupported activities stop.',
  ],
  edgeCases: [
    'Receipt share changes the 44AD turnover threshold.',
    '44AE heavy-vehicle and seasonal calculations are not included.',
  ],
  faqs: [
    {
      question: 'Can every small business use 44AD?',
      answer:
        'No. Entity, activity, residency, turnover and receipt facts must satisfy the official conditions.',
    },
  ],
  relatedToolIds: ['income-tax-calculator', 'corporate-tax-calculator'],
  seoTitle: 'Presumptive Tax Calculator — 44AD, 44ADA, 44AE | KarobarKit',
  seoDescription:
    'Screen common presumptive-tax facts and estimate 44AD, 44ADA or 44AE income with explicit limits.',
});

export const ctcTool = createTaxTool({
  kind: 'ctc',
  id: 'ctc-calculator',
  slug: 'ctc-calculator',
  name: 'CTC Calculator',
  shortName: 'CTC',
  category: 'hr-salary',
  secondaryCategories: ['business'],
  tags: ['ctc', 'cost to company', 'salary structure'],
  searchTerms: ['ctc calculator', 'salary ctc breakdown', 'annual ctc'],
  summary: 'Build an editable employer-cost structure with annual and monthly CTC breakdown.',
  method: 'Local sum of employer-entered earnings, contributions, provisions and benefits.',
  formula: 'Annual CTC = earnings + variable pay + employer contributions + provisions + benefits.',
  workedExample:
    'A ₹6,00,000 basic salary plus declared allowances, bonus, PF and benefits produces a transparent annual/monthly CTC.',
  resultInterpretation: 'CTC is an employer-policy total and is not the same as gross salary or in-hand pay.',
  limitations: [
    'No universal CTC structure is inferred; bonus, gratuity, insurance and employer contributions remain editable assumptions.',
  ],
  edgeCases: ['Provisions such as gratuity are shown as employer cost, not monthly cash.'],
  faqs: [
    {
      question: 'Is CTC the same as take-home?',
      answer:
        'No. Employer-side contributions and provisions can be part of CTC without being paid as monthly cash.',
    },
  ],
  relatedToolIds: ['in-hand-salary-calculator', 'pf-calculator', 'gratuity-calculator'],
  seoTitle: 'CTC Calculator India — Annual and Monthly Salary Structure | KarobarKit',
  seoDescription:
    'Build a transparent employer-policy CTC breakdown with earnings, benefits, PF, gratuity provision and monthly equivalent.',
});

export const inHandSalaryTool = createTaxTool({
  kind: 'in-hand-salary',
  id: 'in-hand-salary-calculator',
  slug: 'in-hand-salary-calculator',
  name: 'In-hand Salary Calculator',
  shortName: 'In-hand Salary',
  category: 'hr-salary',
  secondaryCategories: ['business'],
  tags: ['in hand salary', 'take home salary', 'salary calculator'],
  searchTerms: ['in hand salary calculator', 'take home salary india', 'salary after tax'],
  summary:
    'Estimate annual and monthly take-home pay from declared salary, PF, professional tax and TDS inputs.',
  method:
    'Gross earnings minus declared employee deductions and an ordinary-income TDS estimate by period and regime.',
  formula:
    'Estimated in-hand = gross earnings − employee PF − professional tax − other deductions − estimated TDS.',
  workedExample:
    '₹9,60,000 gross earnings with declared PF, professional tax and a new-regime TDS estimate produces an annual and monthly view.',
  resultInterpretation:
    'This is a payroll planning estimate; employer calendars and state rules can change the amount.',
  limitations: [
    'Professional tax is user-entered because state and employer rules vary. Bonuses, perquisites, arrears and special-rate income are excluded.',
  ],
  edgeCases: [
    'The tax period selects the Act; the Tax Year 2026-27 path uses the new Act/new regime in this release.',
  ],
  faqs: [
    {
      question: 'Does this calculate my official payslip?',
      answer: 'No. It estimates take-home from the declared structure and assumptions.',
    },
  ],
  relatedToolIds: ['ctc-calculator', 'pf-calculator', 'income-tax-calculator'],
  seoTitle: 'In-hand Salary Calculator India — Take-home Pay | KarobarKit',
  seoDescription:
    'Estimate monthly and annual take-home pay with declared PF, professional tax, deductions and dated TDS assumptions.',
});

export const pfTool = createTaxTool({
  kind: 'pf',
  id: 'pf-calculator',
  slug: 'pf-calculator',
  name: 'PF Calculator',
  shortName: 'PF',
  category: 'hr-salary',
  secondaryCategories: ['business'],
  tags: ['pf', 'epf', 'eps', 'edli'],
  searchTerms: ['pf calculator', 'epf calculator', 'employee provident fund', 'eps contribution'],
  summary: 'Estimate employee EPF, employer EPF, EPS, EDLI and declared administration components.',
  method:
    'Effective policy snapshot with wage ceiling, higher-wage option and establishment-specific inputs shown separately.',
  formula:
    'Employee EPF = EPF wage × employee rate; employer total = EPF wage × employer rate; EPS is diverted from employer share when eligible.',
  workedExample:
    'A ₹50,000 monthly basic-plus-DA wage with the ₹15,000 statutory ceiling shows the capped employee and employer components.',
  resultInterpretation:
    'The output is a contribution estimate, not an EPFO passbook, ECR or membership determination.',
  limitations: [
    'Membership, higher-wage joint requests, EPS eligibility, rounding and establishment-level minimums require payroll records.',
  ],
  edgeCases: [
    'Excluded employees and higher-wage options are explicit selections; no automatic legal eligibility inference is made.',
  ],
  faqs: [
    {
      question: 'Does the employer contribution reduce my salary?',
      answer:
        'No. EPFO guidance distinguishes employee deductions from the employer share; this tool displays them separately.',
    },
  ],
  relatedToolIds: ['ctc-calculator', 'in-hand-salary-calculator', 'gratuity-calculator'],
  seoTitle: 'PF Calculator India — EPF, EPS and EDLI | KarobarKit',
  seoDescription:
    'Estimate employee and employer PF components with wage ceiling, EPS, EDLI and higher-wage assumptions visible.',
});

export const gratuityTool = createTaxTool({
  kind: 'gratuity',
  id: 'gratuity-calculator',
  slug: 'gratuity-calculator',
  name: 'Gratuity Calculator',
  shortName: 'Gratuity',
  category: 'hr-salary',
  secondaryCategories: ['business', 'gst-tax'],
  tags: ['gratuity', 'long service benefit', 'fixed term gratuity'],
  searchTerms: ['gratuity calculator', 'gratuity formula india', '15 days wages gratuity'],
  summary:
    'Estimate gratuity after checking the event, service period, employment type and last-drawn wages.',
  method:
    'Eligibility-first gratuity estimate using 15 days of last-drawn wages per qualifying year and an editable cap.',
  formula: 'Gratuity = 15/26 × last-drawn monthly wages × qualifying years, subject to the entered cap.',
  workedExample:
    'Five completed years at ₹50,000 last-drawn wages produces ₹1,44,230.77 before the applicable cap.',
  resultInterpretation:
    'The result is an estimate and does not decide continuous service, wage components or a better contractual benefit.',
  limitations: [
    'Seasonal and piece-rated methods, disputes, forfeiture, better contractual terms and cap amendments are excluded or user-confirmed.',
  ],
  edgeCases: [
    'Death/disablement can remove the five-year gate; fixed-term expiry uses a one-year and pro-rata path in this release.',
  ],
  faqs: [
    {
      question: 'Is five years always required?',
      answer:
        'The official labour FAQ lists exceptions including death, disablement and fixed-term employment; confirm the applicable employment facts.',
    },
  ],
  relatedToolIds: ['ctc-calculator', 'in-hand-salary-calculator', 'pf-calculator'],
  seoTitle: 'Gratuity Calculator India — Service and Last-drawn Wages | KarobarKit',
  seoDescription:
    'Estimate gratuity with explicit event, service, fixed-term and last-drawn-wage boundaries based on official labour guidance.',
});

export const taxTools = [
  incomeTaxTool,
  tdsTool,
  corporateTaxTool,
  presumptiveTaxTool,
  ctcTool,
  inHandSalaryTool,
  pfTool,
  gratuityTool,
] as const;
