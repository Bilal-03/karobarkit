import {
  calculateCurrencyConversion,
  calculateDepreciation,
  calculateGstDueDate,
  calculateHsn,
  calculateMsmeInterest,
  calculateProfessionalTax,
  currencyInputSchema,
  depreciationInputSchema,
  gstDueDateInputSchema,
  hsnInputSchema,
  msmeInterestInputSchema,
  professionalTaxInputSchema,
  type CurrencyInput,
  type CurrencyResult,
  type DepreciationInput,
  type DepreciationResult,
  type GstDueDateInput,
  type GstDueDateResult,
  type HsnInput,
  type HsnResult,
  type MsmeInterestInput,
  type MsmeInterestResult,
  type ProfessionalTaxInput,
  type ProfessionalTaxResult,
  validateCurrencyInput,
  validateDepreciationInput,
  validateGstDueDateInput,
  validateHsnInput,
  validateMsmeInterestInput,
  validateProfessionalTaxInput,
} from '@/domain/calculations/regulated-utilities';
import { formatIndianCurrency, formatIndianDate, formatIndianNumber } from '@/domain/formatting/indian';
import {
  REGULATED_UTILITIES_FEATURE_FLAG,
  REGULATED_UTILITIES_LAST_REVIEWED,
  regulatedPolicyReviews,
  type RegulatedPolicyKey,
} from '@/domain/policies/regulated-utilities';

import type { SourceReference, ToolCapability, ToolDefinition, ToolKind, ToolUiAdapter } from '../types';
import { liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const REGULATED_UTILITIES_WAVE = REGULATED_UTILITIES_FEATURE_FLAG;
export const REGULATED_UTILITIES_REVIEWED_ON = REGULATED_UTILITIES_LAST_REVIEWED;

const hsnSource: SourceReference = {
  id: 'cbic-hsn-sac-reference-2026',
  title: 'CBIC GST goods and services reference portal',
  publisher: 'Central Board of Indirect Taxes and Customs',
  url: 'https://cbic-gst.gov.in/gst-goods-services-rates.html',
  lastChecked: REGULATED_UTILITIES_REVIEWED_ON,
  evidenceLevel: 'official',
  authority: 'CBIC',
  documentType: 'official-page',
  notes: 'The bundled rows are a small reference search fixture, not an exhaustive classification dataset.',
};

const gstCalendarSource: SourceReference = {
  id: 'gst-portal-return-calendar-2026',
  title: 'GST Portal advisory on the Quarterly Return Monthly Payment scheme',
  publisher: 'Goods and Services Tax Network',
  url: 'https://tutorial.gst.gov.in/offlineutilities/returns/QRMP_Advisory.pdf',
  lastChecked: REGULATED_UTILITIES_REVIEWED_ON,
  evidenceLevel: 'official',
  authority: 'GST_PORTAL',
  documentType: 'official-page',
  notes:
    'Supports the regular QRMP reference days, including the state/UT groups due on the 22nd or 24th. Dates can still be extended by notification.',
};

const depreciationSource: SourceReference = {
  id: 'mca-schedule-ii-depreciation-reference',
  title: 'Companies Act and Schedule II reference material',
  publisher: 'Ministry of Corporate Affairs',
  url: 'https://www.mca.gov.in/content/dam/mca/pdf/CompaniesAct2013.pdf',
  lastChecked: REGULATED_UTILITIES_REVIEWED_ON,
  evidenceLevel: 'official',
  authority: 'MCA',
  documentType: 'rule',
  notes: 'Schedule II supports the Companies Act useful-life mode only.',
};

const incomeTaxDepreciationSource: SourceReference = {
  id: 'income-tax-section-32-depreciation-reference',
  title: 'Income Tax allowances allowable to taxpayers — Section 32',
  publisher: 'Income Tax Department, Ministry of Finance',
  url: 'https://www.incometaxindia.gov.in/w/allowances-allowable-to-tax-payer',
  lastChecked: REGULATED_UTILITIES_REVIEWED_ON,
  evidenceLevel: 'official',
  authority: 'INCOME_TAX_DEPARTMENT',
  documentType: 'official-page',
  notes: 'Supports WDV block treatment and the 50% restriction for qualifying assets used below 180 days.',
};

const professionalTaxSource: SourceReference = {
  id: 'mahagst-profession-tax-rate-schedule-2026',
  title: 'Profession Tax and Other Rate Schedule',
  publisher: 'Maharashtra Goods and Services Tax Department',
  url: 'https://www.mahagst.gov.in/en/profession-tax-and-other-rate-schedule',
  lastChecked: REGULATED_UTILITIES_REVIEWED_ON,
  evidenceLevel: 'official',
  authority: 'MAHAGST',
  documentType: 'rate-schedule',
  notes:
    'Reference schedule is state-specific and must be checked against the current notification and taxpayer facts.',
};

const msmeSource: SourceReference = {
  id: 'msme-delayed-payment-section-16-reference',
  title: 'Delayed Payments to Micro and Small Enterprises',
  publisher: 'Ministry of Micro, Small and Medium Enterprises',
  url: 'https://ramp.msme.gov.in/ramp/pdf-documents/scheme-guidelines/msefc.pdf',
  lastChecked: REGULATED_UTILITIES_REVIEWED_ON,
  evidenceLevel: 'official',
  authority: 'MSME',
  documentType: 'official-page',
  notes:
    'The result separates reference eligibility from arithmetic and does not initiate an MSEFC or Samadhaan process.',
};

const rbiSource: SourceReference = {
  id: 'rbi-bank-rate-reference',
  title: 'Reserve Bank of India rates and notifications',
  publisher: 'Reserve Bank of India',
  url: 'https://www.rbi.org.in/',
  lastChecked: REGULATED_UTILITIES_REVIEWED_ON,
  evidenceLevel: 'official',
  authority: 'RBI',
  documentType: 'official-page',
  notes: 'Bank rate is entered by the user; the tool does not fetch or determine the applicable rate.',
};

const ecbSource: SourceReference = {
  id: 'ecb-reference-rates-2026',
  title: 'Euro foreign exchange reference rates',
  publisher: 'European Central Bank',
  url: 'https://data.ecb.europa.eu/key-figures/ecb-interest-rates-and-exchange-rates/exchange-rates',
  lastChecked: REGULATED_UTILITIES_REVIEWED_ON,
  evidenceLevel: 'official',
  authority: 'ECB',
  documentType: 'official-page',
  notes:
    'ECB reference rates are informational and are shown with quote date and stale state; manual rates remain available.',
};

const localPrivacy =
  'Inputs and bundled policy data stay in this browser. They are not sent to analytics, a backend, a URL or a log, and are not saved by default.';
const networkPrivacy =
  'Manual inputs stay in this browser. An explicit quote action may request a dated ECB reference rate; no entered amount, identity or business record is sent.';

type RegulatedUi = Extract<ToolUiAdapter, { adapter: 'regulated-utility' }>;

type RegulatedConfig<TInput, TResult> = {
  id: string;
  slug: string;
  kind: ToolKind;
  ui: RegulatedUi;
  name: string;
  shortName: string;
  category: string;
  categoryLabel: string;
  secondaryCategories: string[];
  tags: string[];
  searchTerms: string[];
  summary: string;
  riskTier: 'C' | 'D';
  method: string;
  capabilities: readonly ToolCapability[];
  executionMode: 'local-with-bundled-data' | 'network-required';
  policyKey: RegulatedPolicyKey;
  defaultValues: TInput;
  inputSchema: ToolDefinition<TInput, TResult>['inputSchema'];
  validate: ToolDefinition<TInput, TResult>['validate'];
  calculate: ToolDefinition<TInput, TResult>['calculate'];
  renderResult: ToolDefinition<TInput, TResult>['renderResult'];
  limitations: string[];
  seoTitle: string;
  seoDescription: string;
  relatedToolIds: string[];
  howToUse: string[];
  formula: string;
  workedExample: string;
  resultInterpretation: string;
  edgeCases: string[];
  faqs: { question: string; answer: string }[];
  sources: SourceReference[];
  privacyNote: string;
};

function createRegulatedTool<TInput, TResult>(
  config: RegulatedConfig<TInput, TResult>,
): ToolDefinition<TInput, TResult> {
  return {
    id: config.id,
    slug: config.slug,
    kind: config.kind,
    ui: config.ui,
    name: config.name,
    shortName: config.shortName,
    category: config.category,
    categoryLabel: config.categoryLabel,
    secondaryCategories: config.secondaryCategories,
    tags: config.tags,
    searchTerms: config.searchTerms,
    summary: config.summary,
    featured: false,
    launchPriority: 40,
    regulatory: true,
    ...liveLocalMetadata({
      riskTier: config.riskTier,
      reviewCadenceDays: regulatedPolicyReviews[config.policyKey].reviewCadenceDays,
      policyDependencies: config.sources.map((source) => source.id),
      goldenFixtureIds: [`${config.id}-base-case`, `${config.id}-stale-case`],
      method: config.method,
      lastVerified: regulatedPolicyReviews[config.policyKey].lastVerifiedOn,
      reviewerRole:
        config.riskTier === 'D' ? 'Named policy and professional reviewer' : 'Named data-source reviewer',
      reviewerStatus: 'pending',
      lifecycle: 'beta',
      featureFlag: REGULATED_UTILITIES_WAVE,
      privacyClassification: config.executionMode,
      executionMode: config.executionMode,
      capabilities: config.capabilities,
    }),
    inputSchema: config.inputSchema,
    defaultValues: config.defaultValues,
    validate: config.validate,
    calculate: config.calculate,
    renderResult: config.renderResult,
    sources: config.sources,
    limitations: config.limitations,
    lastReviewed: REGULATED_UTILITIES_REVIEWED_ON,
    seo: { title: config.seoTitle, description: config.seoDescription, keywords: config.searchTerms },
    relatedToolIds: config.relatedToolIds,
    analyticsPolicy: sharedAnalyticsPolicy,
    howToUse: config.howToUse,
    formula: config.formula,
    workedExample: config.workedExample,
    resultInterpretation: config.resultInterpretation,
    edgeCases: config.edgeCases,
    faqs: config.faqs,
    privacyNote: config.privacyNote,
    disclaimer:
      'Controlled beta reference utility. It is not a filing, classification, eligibility, tax, legal, accounting or settlement determination. Verify current official material and records before acting.',
  };
}

export const hsnSacFinderTool = createRegulatedTool<HsnInput, HsnResult>({
  id: 'hsn-sac-finder',
  slug: 'hsn-sac-finder',
  kind: 'data-backed',
  ui: { adapter: 'regulated-utility', variant: 'hsn-sac' },
  name: 'HSN/SAC Reference Samples',
  shortName: 'HSN/SAC Samples',
  category: 'gst-tax',
  categoryLabel: 'GST & Tax',
  secondaryCategories: ['ecommerce'],
  tags: ['hsn', 'sac', 'gst', 'classification', 'search'],
  searchTerms: ['hsn code finder', 'sac code search', 'gst classification reference'],
  summary: 'Search a small versioned HSN/SAC reference fixture by code or keyword.',
  riskTier: 'D',
  method: 'Case-insensitive local search across versioned bundled code, description and keyword fields.',
  capabilities: ['bundled-data'],
  executionMode: 'local-with-bundled-data',
  policyKey: 'hsn',
  defaultValues: { query: '', kind: 'all' },
  inputSchema: hsnInputSchema,
  validate: validateHsnInput,
  calculate: (input) => calculateHsn(input),
  renderResult: (result) => `${result.matches.length} reference matches`,
  limitations: [
    'The fixture is not exhaustive and does not decide classification, rate, exemption or filing treatment.',
    'Descriptions and keywords are intentionally bounded until a named reviewer approves a complete official dataset.',
  ],
  seoTitle: 'HSN/SAC Reference Samples India | KarobarKit',
  seoDescription: 'Search a versioned local HSN/SAC reference fixture with explicit classification limits.',
  relatedToolIds: ['gst-calculator', 'gst-invoice-generator'],
  howToUse: [
    'Enter a code or plain-language keyword.',
    'Filter goods, services or all reference rows.',
    'Verify any candidate against the current official tariff and transaction facts.',
  ],
  formula: 'Match = code or description/keyword contains the normalized query',
  workedExample:
    'Searching “bread” returns the bundled bakery reference row when the policy snapshot is fresh.',
  resultInterpretation: 'A match is a research starting point, not a classification conclusion.',
  edgeCases: [
    'No result means only that the bounded fixture has no match.',
    'Multiple matches require independent review.',
  ],
  faqs: [
    {
      question: 'Can I use this result on an invoice?',
      answer: 'Not without checking the current official classification and the actual goods or service.',
    },
  ],
  sources: [hsnSource],
  privacyNote: localPrivacy,
});

export const gstDueDateTool = createRegulatedTool<GstDueDateInput, GstDueDateResult>({
  id: 'gst-filing-due-date-calendar',
  slug: 'gst-filing-due-date-calendar',
  kind: 'data-backed',
  ui: { adapter: 'regulated-utility', variant: 'gst-due-date' },
  name: 'GST Filing Due-date Calendar',
  shortName: 'GST Due Dates',
  category: 'gst-tax',
  categoryLabel: 'GST & Tax',
  secondaryCategories: [],
  tags: ['gst', 'filing', 'due date', 'calendar', 'return'],
  searchTerms: ['gst return due date', 'gstr 1 due date', 'gstr 3b calendar'],
  summary: 'Look up a provisional FY 2026-27 GST return reference date with visible freshness status.',
  riskTier: 'D',
  method: 'Select a versioned return/taxpayer rule and construct a reference date for the selected period.',
  capabilities: ['bundled-data'],
  executionMode: 'local-with-bundled-data',
  policyKey: 'gst-calendar',
  defaultValues: {
    financialYear: '2026-27',
    returnType: 'gstr-1',
    taxpayerType: 'regular-monthly',
    qrmpDueDateGroup: '22',
    period: '2026-07',
  },
  inputSchema: gstDueDateInputSchema,
  validate: validateGstDueDateInput,
  calculate: (input) => calculateGstDueDate(input),
  renderResult: (result) => formatIndianDate(result.referenceDueDate),
  limitations: [
    'Extensions, notifications, taxpayer exceptions and portal status are not inferred.',
    'The bundle is provisional and remains separately gated until reviewed.',
  ],
  seoTitle: 'GST Filing Due-date Calendar FY 2026-27 | KarobarKit',
  seoDescription:
    'Check a versioned provisional GST return reference date with explicit notification limits.',
  relatedToolIds: ['gst-calculator', 'income-tax-calculator'],
  howToUse: [
    'Choose the financial year, return type and taxpayer cadence.',
    'Select the return period.',
    'Confirm the current GST portal and notifications before filing.',
  ],
  formula: 'Reference due date = selected return period + versioned reference day',
  workedExample: 'A monthly GSTR-1 period of July 2026 uses the provisional 11 August 2026 reference day.',
  resultInterpretation: 'The date is a calendar reference, not a filing confirmation or extension notice.',
  edgeCases: [
    'A notification can supersede the bundled day.',
    'QRMP and regular cadence use different reference rows.',
  ],
  faqs: [
    { question: 'Does this submit a GST return?', answer: 'No. It only displays a local reference date.' },
  ],
  sources: [gstCalendarSource],
  privacyNote: localPrivacy,
});

export const depreciationTool = createRegulatedTool<DepreciationInput, DepreciationResult>({
  id: 'depreciation-calculator',
  slug: 'depreciation-calculator',
  kind: 'calculator',
  ui: { adapter: 'regulated-utility', variant: 'depreciation' },
  name: 'Depreciation Calculator',
  shortName: 'Depreciation',
  category: 'gst-tax',
  categoryLabel: 'GST & Tax',
  secondaryCategories: ['business'],
  tags: ['depreciation', 'asset', 'straight line', 'wdv'],
  searchTerms: ['depreciation calculator', 'straight line depreciation', 'wdv depreciation'],
  summary: 'Illustrate separate Companies Act useful-life and Income Tax rate arithmetic for an asset.',
  riskTier: 'D',
  method:
    'Keep useful-life and rate-based modes separate; Income Tax mode applies the 50% first-year restriction below 180 days.',
  capabilities: ['bundled-data'],
  executionMode: 'local-with-bundled-data',
  policyKey: 'depreciation',
  defaultValues: {
    mode: 'companies-act',
    assetCost: '100000',
    residualValue: '5000',
    usefulLifeYears: '5',
    openingWdv: '',
    ratePercent: '',
    daysInService: '365',
    method: 'slm',
  },
  inputSchema: depreciationInputSchema,
  validate: validateDepreciationInput,
  calculate: (input) => calculateDepreciation(input),
  renderResult: (result) => formatIndianCurrency(result.annualDepreciation),
  limitations: [
    'Useful lives, residual values, blocks, rates, component accounting and tax eligibility are not inferred.',
    'The output is illustrative arithmetic, not a statutory books or return schedule.',
  ],
  seoTitle: 'Depreciation Calculator India | KarobarKit',
  seoDescription:
    'Compare illustrative Companies Act and Income Tax depreciation arithmetic with clear policy boundaries.',
  relatedToolIds: ['professional-tax-calculator', 'gst-calculator'],
  howToUse: [
    'Choose Companies Act useful-life or Income Tax rate mode.',
    'Enter the relevant asset assumptions from reviewed records.',
    'Review annual depreciation and closing value as an illustration.',
  ],
  formula:
    'Companies Act illustration = (cost − residual) ÷ useful life × days ÷ 365; Income Tax illustration = opening WDV × rate × 50% when used below 180 days, otherwise the full entered rate',
  workedExample: '₹1,00,000 cost, ₹5,000 residual and 5 years produce ₹19,000 for a full SLM year.',
  resultInterpretation: 'The number reflects only the selected arithmetic mode and supplied assumptions.',
  edgeCases: ['Residual value cannot exceed cost.', 'Income Tax mode requires a user-entered rate.'],
  faqs: [
    {
      question: 'Does the calculator know the correct rate for my asset?',
      answer: 'No. Enter a reviewed rate or useful life and verify the applicable policy independently.',
    },
  ],
  sources: [depreciationSource, incomeTaxDepreciationSource],
  privacyNote: localPrivacy,
});

export const professionalTaxTool = createRegulatedTool<ProfessionalTaxInput, ProfessionalTaxResult>({
  id: 'professional-tax-calculator',
  slug: 'professional-tax-calculator',
  kind: 'data-backed',
  ui: { adapter: 'regulated-utility', variant: 'professional-tax' },
  name: 'Maharashtra Professional Tax Calculator',
  shortName: 'Maharashtra PT',
  category: 'hr-salary',
  categoryLabel: 'HR & Salary',
  secondaryCategories: ['gst-tax'],
  tags: ['professional tax', 'maharashtra', 'salary', 'payroll'],
  searchTerms: ['professional tax calculator maharashtra', 'pt salary slab', 'professional tax monthly'],
  summary:
    'Estimate a Maharashtra professional-tax reference amount from a selected salary definition and period.',
  riskTier: 'D',
  method:
    'Apply the bundled Maharashtra reference slabs, gender field and February adjustment to a declared monthly salary.',
  capabilities: ['bundled-data'],
  executionMode: 'local-with-bundled-data',
  policyKey: 'professional-tax',
  defaultValues: {
    state: 'maharashtra',
    salaryAmount: '50000',
    salaryPeriod: 'monthly',
    salaryDefinition: 'gross-monthly',
    gender: 'male',
    month: '2026-08',
  },
  inputSchema: professionalTaxInputSchema,
  validate: validateProfessionalTaxInput,
  calculate: (input) => calculateProfessionalTax(input),
  renderResult: (result) => formatIndianCurrency(result.monthlyTax),
  limitations: [
    'Only a Maharashtra reference schedule is included.',
    'Exemptions, employer registration, state changes, salary definitions and notifications require review.',
  ],
  seoTitle: 'Maharashtra Professional Tax Calculator | KarobarKit',
  seoDescription:
    'Estimate a provisional Maharashtra professional-tax reference amount with visible assumptions.',
  relatedToolIds: ['wage-slip-generator', 'income-tax-calculator'],
  howToUse: [
    'Select Maharashtra and the salary period.',
    'Declare the salary definition and gender field used by the reference schedule.',
    'Verify the current state notification before payroll or payment.',
  ],
  formula:
    'Reference PT = selected Maharashtra slab for declared monthly salary, with February adjustment where applicable',
  workedExample: 'A declared ₹50,000 monthly salary uses the provisional upper reference slab.',
  resultInterpretation: 'The result is a reference estimate, not a payroll deduction instruction.',
  edgeCases: [
    'Annual salary is normalized to a monthly amount.',
    'Female-specific exemptions and February rules require current notification review.',
  ],
  faqs: [
    {
      question: 'Does this cover every Indian state?',
      answer: 'No. This controlled beta contains only a Maharashtra reference schedule.',
    },
  ],
  sources: [professionalTaxSource],
  privacyNote: localPrivacy,
});

export const msmeInterestTool = createRegulatedTool<MsmeInterestInput, MsmeInterestResult>({
  id: 'msme-late-payment-interest-calculator',
  slug: 'msme-late-payment-interest-calculator',
  kind: 'calculator',
  ui: { adapter: 'regulated-utility', variant: 'msme-interest' },
  name: 'MSME Late-payment Interest Calculator',
  shortName: 'MSME Interest',
  category: 'business',
  categoryLabel: 'Business',
  secondaryCategories: ['gst-tax'],
  tags: ['msme', 'late payment', 'interest', 'msefc', 'delayed payment'],
  searchTerms: ['msme delayed payment interest', 'msmed interest calculator', 'late payment interest india'],
  summary:
    'Illustrate delayed-payment interest arithmetic after a separately declared MSME eligibility check.',
  riskTier: 'D',
  method:
    'Use a declared acceptance date, maximum agreed period, bank rate and monthly-rest illustration; eligibility is reported separately.',
  capabilities: ['bundled-data'],
  executionMode: 'local-with-bundled-data',
  policyKey: 'msme',
  defaultValues: {
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
  inputSchema: msmeInterestInputSchema,
  validate: validateMsmeInterestInput,
  calculate: (input) => calculateMsmeInterest(input),
  renderResult: (result) => formatIndianCurrency(result.estimatedInterest),
  limitations: [
    'The result does not determine MSE status, acceptance, written terms, bank rate or dispute process.',
    'One declared bank-rate snapshot is used; later rate changes across a long overdue period are not modelled.',
    'Trading and unknown enterprise types are not treated as eligible by default.',
  ],
  seoTitle: 'MSME Late-payment Interest Calculator | KarobarKit',
  seoDescription:
    'Estimate MSME delayed-payment interest with explicit eligibility and monthly-rest assumptions.',
  relatedToolIds: ['cash-flow-calculator', 'professional-tax-calculator'],
  howToUse: [
    'Enter principal, invoice/acceptance dates and payment date.',
    'Enter the declared bank rate, its effective date and enterprise type.',
    'Review eligibility status and arithmetic separately before seeking advice.',
  ],
  formula:
    'Reference interest = principal × [(1 + 3 × bank rate ÷ 12)^full months − 1] plus remainder-day interest',
  workedExample:
    'A micro enterprise with a 45-day agreed period shows overdue days only after the reference due date.',
  resultInterpretation:
    'The output is a scenario estimate and does not create a demand, claim or legal entitlement.',
  edgeCases: ['Agreed payment days are capped at 45.', 'On-time payment produces zero estimated interest.'],
  faqs: [
    {
      question: 'Does this file an MSME claim?',
      answer: 'No. It only illustrates user-entered interest assumptions.',
    },
  ],
  sources: [msmeSource, rbiSource],
  privacyNote: localPrivacy,
});

export const currencyConverterTool = createRegulatedTool<CurrencyInput, CurrencyResult>({
  id: 'currency-converter',
  slug: 'currency-converter',
  kind: 'data-backed',
  ui: { adapter: 'regulated-utility', variant: 'currency-converter' },
  name: 'Currency Converter',
  shortName: 'Currency Converter',
  category: 'finance',
  categoryLabel: 'Finance',
  secondaryCategories: [],
  tags: ['currency', 'exchange rate', 'fx', 'converter', 'ecb'],
  searchTerms: ['currency converter', 'inr usd converter', 'exchange rate calculator'],
  summary:
    'Convert supported currencies using an explicit manual rate or a user-triggered dated ECB reference quote.',
  riskTier: 'C',
  method:
    'Multiply the amount by a clearly labelled rate, retaining quote source, date, stale state and manual fallback.',
  capabilities: ['converter', 'network-data'],
  executionMode: 'network-required',
  policyKey: 'currency',
  defaultValues: { amount: '1000', fromCurrency: 'INR', toCurrency: 'USD', manualRate: '0.012' },
  inputSchema: currencyInputSchema,
  validate: validateCurrencyInput,
  calculate: (input) => calculateCurrencyConversion(input),
  renderResult: (result) => `${formatIndianNumber(result.convertedAmount)} ${result.toCurrency}`,
  limitations: [
    'ECB reference rates are informational and may differ from bank, card, remittance or settlement rates.',
    'Network failure does not silently reuse an old quote; manual fallback is explicit.',
  ],
  seoTitle: 'Currency Converter with Dated Reference Rates | KarobarKit',
  seoDescription:
    'Convert supported currencies with a manual fallback or dated ECB reference quote and stale state.',
  relatedToolIds: ['emi-calculator', 'fd-calculator'],
  howToUse: [
    'Enter an amount and choose source and target currencies.',
    'Use the explicit quote action or enter a current manual rate.',
    'Review quote source, date and stale status before using the illustration.',
  ],
  formula: 'Converted amount = amount × quoted or manual rate',
  workedExample: '₹1,000 converted at a declared 0.012 USD/INR rate produces USD 12.',
  resultInterpretation: 'The output is a rate illustration, not a transaction or settlement quote.',
  edgeCases: [
    'Same-currency conversion uses rate 1.',
    'A failed network quote leaves manual fallback available.',
  ],
  faqs: [
    {
      question: 'Is the rate real-time?',
      answer: 'No guarantee is made. A quote is shown with its ECB date, and manual rates are supported.',
    },
  ],
  sources: [ecbSource],
  privacyNote: networkPrivacy,
});

export const regulatedUtilitiesTools = [
  hsnSacFinderTool,
  gstDueDateTool,
  depreciationTool,
  professionalTaxTool,
  msmeInterestTool,
  currencyConverterTool,
] as const;

export const REGULATED_UTILITIES_GOLDEN_FIXTURE_MANIFEST = [
  { id: 'hsn-sac-finder-base-case', toolId: 'hsn-sac-finder', expectedPolicyState: 'fresh' },
  { id: 'hsn-sac-finder-stale-case', toolId: 'hsn-sac-finder', expectedPolicyState: 'stale' },
  {
    id: 'gst-filing-due-date-calendar-base-case',
    toolId: 'gst-filing-due-date-calendar',
    expectedPolicyState: 'fresh',
  },
  {
    id: 'gst-filing-due-date-calendar-stale-case',
    toolId: 'gst-filing-due-date-calendar',
    expectedPolicyState: 'stale',
  },
  {
    id: 'depreciation-calculator-base-case',
    toolId: 'depreciation-calculator',
    expectedPolicyState: 'fresh',
  },
  {
    id: 'depreciation-calculator-stale-case',
    toolId: 'depreciation-calculator',
    expectedPolicyState: 'stale',
  },
  {
    id: 'professional-tax-calculator-base-case',
    toolId: 'professional-tax-calculator',
    expectedPolicyState: 'fresh',
  },
  {
    id: 'professional-tax-calculator-stale-case',
    toolId: 'professional-tax-calculator',
    expectedPolicyState: 'stale',
  },
  {
    id: 'msme-late-payment-interest-calculator-base-case',
    toolId: 'msme-late-payment-interest-calculator',
    expectedPolicyState: 'fresh',
  },
  {
    id: 'msme-late-payment-interest-calculator-stale-case',
    toolId: 'msme-late-payment-interest-calculator',
    expectedPolicyState: 'stale',
  },
  { id: 'currency-converter-base-case', toolId: 'currency-converter', expectedPolicyState: 'fresh' },
  { id: 'currency-converter-stale-case', toolId: 'currency-converter', expectedPolicyState: 'stale' },
] as const;

export function validateRegulatedUtilitiesGoldenFixtureManifest() {
  const toolIds = new Set(regulatedUtilitiesTools.map((tool) => tool.id));
  const governanceFixtureIds = new Set(
    regulatedUtilitiesTools.flatMap((tool) => tool.governance.goldenFixtureIds ?? []),
  );
  return (
    REGULATED_UTILITIES_GOLDEN_FIXTURE_MANIFEST.length === governanceFixtureIds.size &&
    REGULATED_UTILITIES_GOLDEN_FIXTURE_MANIFEST.every(
      (fixture) => toolIds.has(fixture.toolId) && governanceFixtureIds.has(fixture.id),
    )
  );
}
