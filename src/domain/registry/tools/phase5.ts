import {
  calculatePhase5,
  phase5CalculatorFields,
  phase5CalculatorInputSchema,
  type Phase5CalculationResult,
  type Phase5CalculatorInput,
  type Phase5CalculatorKind,
  validatePhase5CalculatorInput,
} from '@/domain/calculations/phase5';
import { MARKETPLACE_SOURCE_REFERENCES } from '@/domain/policies/marketplace-fees';

import type { SourceReference, ToolDefinition } from '../types';
import { liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const PHASE5_LAST_REVIEWED = '2026-08-10';
export const PHASE5_FEATURE_FLAG = 'phase5-startup-marketplace';
export const PHASE5_MARKETPLACE_FEATURE_FLAG = 'phase5-marketplace';

const startupMethodSource: SourceReference = {
  id: 'method-startup-metrics-v1',
  title: 'Startup and SaaS metrics methodology v1',
  publisher: 'KarobarKit controlled methodology',
  url: 'https://github.com/Bilal-03/karobarkit/blob/main/docs/product-spec/Business_Toolkit_for_India_Implementation_Plan_2026-08-09.md',
  lastChecked: PHASE5_LAST_REVIEWED,
  evidenceLevel: 'authoritative',
  documentType: 'methodology',
  notes:
    'Controlled internal definitions for CAC, LTV, SaaS metrics, valuation scenarios, dilution and ESOP arithmetic. Inputs remain user supplied and outputs are educational scenarios.',
  supports: ['startup metrics definitions', 'scenario boundaries', 'period consistency'],
};

const companiesActSource: SourceReference = {
  id: 'indiacode-companies-section-62',
  title: 'Companies Act, 2013 — Section 62 further issue of share capital',
  publisher: 'India Code',
  url: 'https://www.indiacode.nic.in/show-data?actid=AC_CEN_22_29_00008_201318_1517807327856&orderno=64&sectionId=1252&sectionno=62',
  lastChecked: PHASE5_LAST_REVIEWED,
  evidenceLevel: 'official',
  documentType: 'rule',
  notes:
    'Official corporate-law context for further share issues. The calculator does not determine compliance or replace approvals.',
  supports: ['further issue context', 'corporate approval boundary'],
};

const startupIndiaSource: SourceReference = {
  id: 'startup-india-playbook-2026',
  title: 'Startup Playbook for DPIIT-recognised startups',
  publisher: 'Startup India',
  url: 'https://www.startupindia.gov.in/content/dam/startupindia/Verify-Rec-Mapping/Startup-Playbook-Exclusive-Benefits-for-DPIIT-Recognised-Startups-in-India-April-2026.pdf',
  lastChecked: PHASE5_LAST_REVIEWED,
  evidenceLevel: 'official',
  documentType: 'official-playbook',
  notes:
    'Official context for startup-specific company and ESOP considerations; eligibility is not inferred by this tool.',
  supports: ['startup context', 'ESOP eligibility boundary'],
};

const esopTaxSource: SourceReference = {
  id: 'it-perquisites-2026',
  title: 'Salary perquisites including ESOPs',
  publisher: 'Income Tax Department',
  url: 'https://www.incometaxindia.gov.in/w/perquisites',
  lastChecked: PHASE5_LAST_REVIEWED,
  evidenceLevel: 'official',
  documentType: 'rule',
  notes:
    'Official explanatory context for the difference between fair market value and exercise price and the need for plan/tax review.',
  supports: ['ESOP perquisite context', 'FMV and exercise-price boundary'],
};

const startupPrivacyNote =
  'Startup inputs and results stay in this browser. They are not sent to analytics, a backend, a URL or a log, and are not saved by default. These outputs are user-entered scenarios, not recommendations or professional valuations.';

const marketplacePrivacyNote =
  'Marketplace inputs and bundled fee schedules run in this browser. Values are not sent to analytics, a backend, a URL or a log, and are not saved by default. Seller dashboards remain the authority for account-specific charges.';

type Phase5ToolConfig = {
  kind: Phase5CalculatorKind;
  id: string;
  slug: string;
  name: string;
  shortName: string;
  toolKind: 'calculator' | 'worksheet' | 'data-backed';
  category: 'startup' | 'ecommerce' | 'hr-salary';
  secondaryCategories: string[];
  tags: string[];
  searchTerms: string[];
  summary: string;
  riskTier: 'B' | 'C' | 'D';
  regulatory?: boolean;
  reviewCadenceDays: number;
  reviewerRole: string;
  policyDependencies: string[];
  goldenFixtureIds: string[];
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
  sources: SourceReference[];
  privacyNote: string;
  disclaimer: string;
  executionMode?: 'local-only' | 'local-with-bundled-data';
  featureFlag?: string;
};

function createPhase5Tool(
  config: Phase5ToolConfig,
): ToolDefinition<Phase5CalculatorInput, Phase5CalculationResult> {
  const defaultValues = Object.fromEntries(
    phase5CalculatorFields[config.kind].map((field) => [field.name, field.defaultValue]),
  );
  return {
    id: config.id,
    slug: config.slug,
    kind: config.toolKind,
    ui: { adapter: 'phase5-calculator', variant: config.kind },
    name: config.name,
    shortName: config.shortName,
    category: config.category,
    categoryLabel:
      config.category === 'startup'
        ? 'Startup'
        : config.category === 'ecommerce'
          ? 'E-commerce'
          : 'HR & Salary',
    secondaryCategories: config.secondaryCategories,
    tags: config.tags,
    searchTerms: config.searchTerms,
    summary: config.summary,
    featured: false,
    launchPriority: 70,
    regulatory: config.regulatory,
    ...liveLocalMetadata({
      riskTier: config.riskTier,
      reviewCadenceDays: config.reviewCadenceDays,
      policyDependencies: config.policyDependencies,
      goldenFixtureIds: config.goldenFixtureIds,
      method: config.method,
      lastVerified: PHASE5_LAST_REVIEWED,
      effectiveFrom:
        config.kind === 'amazon-fees'
          ? '2026-03-16'
          : config.kind === 'flipkart-fees'
            ? '2026-01-01'
            : undefined,
      reviewerRole: config.reviewerRole,
      reviewerStatus: 'pending',
      lifecycle: 'beta',
      featureFlag:
        config.featureFlag ??
        (config.kind === 'amazon-fees' || config.kind === 'flipkart-fees'
          ? PHASE5_MARKETPLACE_FEATURE_FLAG
          : PHASE5_FEATURE_FLAG),
      privacyClassification: config.executionMode ?? 'local-only',
      executionMode: config.executionMode ?? 'local-only',
    }),
    inputSchema: phase5CalculatorInputSchema,
    defaultValues,
    validate: (input) => validatePhase5Input(config.kind, input),
    calculate: (input) => calculatePhase5(config.kind, input),
    renderResult: (result) => result.headline.value,
    sources: config.sources,
    limitations: config.limitations,
    lastReviewed: PHASE5_LAST_REVIEWED,
    seo: {
      title: config.seoTitle,
      description: config.seoDescription,
      keywords: [...config.searchTerms],
    },
    relatedToolIds: config.relatedToolIds,
    analyticsPolicy: sharedAnalyticsPolicy,
    howToUse: phase5CalculatorFields[config.kind].map((field) =>
      field.type === 'select'
        ? `Choose ${field.label.toLowerCase()} using the option that matches your scenario.`
        : `Enter ${field.label.toLowerCase()} using the same period and unit as the other inputs.`,
    ),
    formula: config.formula,
    workedExample: config.workedExample,
    resultInterpretation: config.resultInterpretation,
    edgeCases: config.edgeCases,
    faqs: config.faqs,
    privacyNote: config.privacyNote,
    disclaimer: config.disclaimer,
  };
}

function validatePhase5Input(kind: Phase5CalculatorKind, input: Phase5CalculatorInput) {
  return validatePhase5CalculatorInput(kind, input);
}

export const cacTool = createPhase5Tool({
  kind: 'cac',
  id: 'cac-calculator',
  slug: 'cac-calculator',
  name: 'CAC Calculator',
  shortName: 'CAC',
  toolKind: 'calculator',
  category: 'startup',
  secondaryCategories: ['ecommerce'],
  tags: ['cac', 'customer acquisition cost', 'growth', 'marketing'],
  searchTerms: ['customer acquisition cost', 'cost to acquire a customer', 'blended cac', 'paid cac'],
  summary: 'Calculate blended and paid-channel customer acquisition cost from a declared attribution window.',
  riskTier: 'B',
  reviewCadenceDays: 365,
  reviewerRole: 'Startup metrics reviewer',
  policyDependencies: ['method-startup-metrics-v1'],
  goldenFixtureIds: ['cac-base-case', 'cac-zero-paid-case'],
  method:
    'Blended CAC uses all attributed acquisition cost; paid-channel CAC uses paid-channel spend only, each divided by its matching customer cohort.',
  formula:
    'Blended CAC = total attributed acquisition cost ÷ all attributable new customers; paid CAC = paid-channel spend ÷ paid-channel customers.',
  workedExample:
    '₹1,00,000 of included cost and 20 attributable customers produces a blended CAC of ₹5,000; ₹60,000 paid spend and 15 paid customers produces paid CAC of ₹4,000.',
  resultInterpretation:
    'CAC is meaningful only when cost scope, attribution window and customer definition stay consistent.',
  limitations: [
    'The tool does not infer attribution, channel quality, payback or customer profitability; paid spend must be entered separately.',
    'One-off campaign costs and sales costs must be included or excluded deliberately by the user.',
  ],
  edgeCases: [
    'A zero paid-customer denominator omits the paid-only view instead of dividing by zero.',
    'Changing the attribution window changes the result.',
  ],
  faqs: [
    {
      question: 'What is blended CAC?',
      answer: 'Blended CAC uses all attributable acquisition cost divided by all attributable new customers.',
    },
    {
      question: 'Can I compare paid CAC with blended CAC?',
      answer: 'Yes, when the paid-customer definition and attribution window are documented and comparable.',
    },
  ],
  relatedToolIds: ['ltv-calculator', 'saas-metrics-calculator', 'burn-rate-calculator', 'roas-calculator'],
  seoTitle: 'CAC Calculator for Indian Startups | KarobarKit',
  seoDescription: 'Calculate blended and paid customer acquisition cost with an explicit attribution window.',
  sources: [startupMethodSource],
  privacyNote: startupPrivacyNote,
  disclaimer:
    'This is a planning metric, not an investment recommendation or accounting conclusion. Validate attribution and cost classification with your records.',
});

export const ltvTool = createPhase5Tool({
  kind: 'ltv',
  id: 'ltv-calculator',
  slug: 'ltv-calculator',
  name: 'LTV Calculator',
  shortName: 'LTV',
  toolKind: 'calculator',
  category: 'startup',
  secondaryCategories: ['ecommerce'],
  tags: ['ltv', 'customer lifetime value', 'arpu', 'churn'],
  searchTerms: ['customer lifetime value', 'lifetime value calculator', 'arpu gross margin churn'],
  summary: 'Illustrate simple subscription LTV using ARPU, gross margin and a churn sensitivity range.',
  riskTier: 'B',
  reviewCadenceDays: 365,
  reviewerRole: 'Startup metrics reviewer',
  policyDependencies: ['method-startup-metrics-v1'],
  goldenFixtureIds: ['ltv-base-case', 'ltv-unstable-churn-case'],
  method: 'Simple subscription LTV using ARPU multiplied by gross margin and divided by monthly churn.',
  formula: 'Illustrated LTV = monthly ARPU × gross margin ÷ monthly customer churn.',
  workedExample: '₹2,000 ARPU at 70% gross margin and 5% monthly churn illustrates ₹28,000 of LTV.',
  resultInterpretation:
    'The range shows sensitivity to churn assumptions; it is not a precise forecast of future cash flows.',
  limitations: [
    'The simple model excludes expansion, contraction, retention curves, cohorts, refunds, taxes and discounting.',
    'Churn must be observed and stable enough for the scenario to be useful.',
  ],
  edgeCases: [
    'Zero or unstable churn is not treated as infinite or certain LTV.',
    'Low and high churn must bracket the base churn.',
  ],
  faqs: [
    {
      question: 'Why does churn dominate LTV?',
      answer:
        'The simple model divides contribution per customer by monthly churn, so small churn changes can materially change the illustration.',
    },
    {
      question: 'Is this a forecast?',
      answer: 'No. It is a sensitivity scenario based on your ARPU, margin and churn assumptions.',
    },
  ],
  relatedToolIds: ['cac-calculator', 'saas-metrics-calculator', 'roas-calculator'],
  seoTitle: 'LTV Calculator for Indian Startups | KarobarKit',
  seoDescription: 'Illustrate customer lifetime value from ARPU, gross margin and churn scenarios.',
  sources: [startupMethodSource],
  privacyNote: startupPrivacyNote,
  disclaimer:
    'This is an educational scenario, not a valuation, investment recommendation or revenue forecast.',
});

export const saasMetricsTool = createPhase5Tool({
  kind: 'saas-metrics',
  id: 'saas-metrics-calculator',
  slug: 'saas-metrics-calculator',
  name: 'SaaS Metrics Calculator',
  shortName: 'SaaS Metrics',
  toolKind: 'worksheet',
  category: 'startup',
  secondaryCategories: ['business'],
  tags: ['saas metrics', 'mrr', 'arr', 'nrr', 'grr', 'rule of 40'],
  searchTerms: [
    'mrr arr calculator',
    'net revenue retention',
    'gross revenue retention',
    'cac payback',
    'rule of 40',
  ],
  summary:
    'Build a period-consistent SaaS snapshot covering MRR, ARR, retention, CAC payback and Rule of 40.',
  riskTier: 'B',
  reviewCadenceDays: 365,
  reviewerRole: 'Startup metrics reviewer',
  policyDependencies: ['method-startup-metrics-v1'],
  goldenFixtureIds: ['saas-metrics-reconciliation', 'saas-metrics-zero-denominator'],
  method: 'Definition-led SaaS metric worksheet using one declared measurement period.',
  formula:
    'ARR = MRR × 12; window growth is annualized over the declared period; monthly churn is normalized from window churn; GRR = (prior MRR − churn − contraction) ÷ prior MRR; NRR adds expansion; CAC payback = CAC ÷ monthly gross-margin contribution.',
  workedExample:
    '₹5,00,000 MRR becomes ₹60,00,000 ARR; retention and payback metrics use the same period inputs.',
  resultInterpretation:
    'Metrics are comparable only when revenue, customers, churn and acquisition costs share definitions and periods.',
  limitations: [
    'No accounting recognition, cohort normalization or benchmark ranking is performed.',
    'Rule of 40 uses your user-entered margin and the observed MRR change; it is not a company-quality score.',
  ],
  edgeCases: [
    'Zero new customers omits CAC and payback.',
    'Zero logo churn omits LTV:CAC instead of implying infinite retention.',
  ],
  faqs: [
    {
      question: 'What is NRR?',
      answer:
        'NRR measures starting recurring revenue after churn, contraction and expansion, excluding new customer revenue.',
    },
    {
      question: 'Does the tool benchmark my startup?',
      answer: 'No. It calculates only the definitions and assumptions you enter.',
    },
  ],
  relatedToolIds: ['cac-calculator', 'ltv-calculator', 'burn-rate-calculator', 'runway-calculator'],
  seoTitle: 'SaaS Metrics Calculator for Indian Startups | KarobarKit',
  seoDescription: 'Calculate MRR, ARR, ARPU, churn, GRR, NRR, CAC payback, LTV:CAC and Rule of 40.',
  sources: [startupMethodSource],
  privacyNote: startupPrivacyNote,
  disclaimer:
    'This is an educational metrics worksheet, not an accounting report, investment recommendation or valuation.',
});

export const valuationTool = createPhase5Tool({
  kind: 'valuation',
  id: 'startup-valuation-calculator',
  slug: 'startup-valuation-calculator',
  name: 'Startup Valuation Calculator',
  shortName: 'Valuation',
  toolKind: 'worksheet',
  category: 'startup',
  secondaryCategories: [],
  tags: ['startup valuation', 'revenue multiple', 'pre money', 'post money'],
  searchTerms: ['startup valuation', 'revenue multiple valuation', 'pre money post money'],
  summary: 'Explore revenue-multiple and pre/post-money funding scenarios without claiming a fair value.',
  riskTier: 'B',
  reviewCadenceDays: 90,
  reviewerRole: 'Named corporate/legal reviewer',
  policyDependencies: [
    'method-startup-metrics-v1',
    'indiacode-companies-section-62',
    'startup-india-playbook-2026',
  ],
  goldenFixtureIds: ['valuation-range-case', 'valuation-zero-investment-case'],
  method:
    'User-selected revenue multiple range plus pre-money, investment and post-money ownership arithmetic.',
  formula:
    'Scenario value = annual revenue × selected revenue multiple; post-money = pre-money + investment.',
  workedExample: '₹60,00,000 annual revenue at 3×–5× produces a ₹1.8–₹3 crore scenario range.',
  resultInterpretation:
    'The result is a sensitivity range. It is not a registered valuation, fairness opinion or investment recommendation.',
  limitations: [
    'Multiples, revenue quality, debt, cash, market conditions and legal terms are user-supplied or excluded.',
    'No comparable-company data is scraped or asserted.',
  ],
  edgeCases: [
    'Low multiple must not exceed high multiple.',
    'Zero investment still shows a declared pre-money value without investor ownership.',
  ],
  faqs: [
    {
      question: 'Is this a registered valuation?',
      answer: 'No. It is an educational scenario using your own revenue and multiple assumptions.',
    },
    {
      question: 'Does it recommend a fundraising price?',
      answer: 'No. Speak with qualified corporate, finance and legal professionals for transaction terms.',
    },
  ],
  relatedToolIds: ['equity-dilution-calculator', 'esop-calculator', 'saas-metrics-calculator'],
  seoTitle: 'Startup Valuation Calculator for India | KarobarKit',
  seoDescription:
    'Explore revenue-multiple and pre/post-money startup valuation scenarios with clear boundaries.',
  sources: [startupMethodSource, companiesActSource, startupIndiaSource],
  privacyNote: startupPrivacyNote,
  disclaimer:
    'This is an educational scenario, not a registered valuation, securities offer, tax advice or investment recommendation.',
});

export const equityDilutionTool = createPhase5Tool({
  kind: 'equity-dilution',
  id: 'equity-dilution-calculator',
  slug: 'equity-dilution-calculator',
  name: 'Equity Dilution Calculator',
  shortName: 'Equity Dilution',
  toolKind: 'calculator',
  category: 'startup',
  secondaryCategories: [],
  tags: ['equity dilution', 'cap table', 'option pool', 'ownership'],
  searchTerms: ['cap table dilution', 'investor ownership', 'option pool dilution', 'post money ownership'],
  summary: 'Preview post-money ownership and an option-pool scenario from a reconciled starting cap table.',
  riskTier: 'B',
  reviewCadenceDays: 90,
  reviewerRole: 'Named corporate/legal reviewer',
  policyDependencies: ['method-startup-metrics-v1', 'indiacode-companies-section-62'],
  goldenFixtureIds: ['equity-dilution-reconciles', 'equity-dilution-invalid-cap-table'],
  method:
    'Post-money ownership arithmetic with a post-money option pool and pro-rata dilution of existing holders.',
  formula:
    'New investor % = investment ÷ post-money; existing holder % = original holder % × remaining post-money ownership.',
  workedExample:
    '₹6 lakh into a ₹24 lakh pre-money company gives a 20% new investor share before the selected option-pool scenario.',
  resultInterpretation:
    'The cap-table preview reconciles to 100% under the stated post-money pool assumption.',
  limitations: [
    'It does not model share classes, liquidation preferences, convertibles, SAFEs, employee grants or legal approvals.',
    'Existing holder percentages must be supplied and reconcile exactly to 100%.',
  ],
  edgeCases: [
    'An option pool that leaves no room for the investor is rejected.',
    'A zero or negative valuation is rejected rather than producing a meaningless percentage.',
  ],
  faqs: [
    {
      question: 'Does this create a cap table?',
      answer:
        'No. It previews simple ownership percentages from your inputs and does not issue or reserve securities.',
    },
    {
      question: 'Why is the option pool described as post-money?',
      answer:
        'That makes the dilution convention explicit; other term-sheet conventions can produce different results.',
    },
  ],
  relatedToolIds: ['startup-valuation-calculator', 'esop-calculator'],
  seoTitle: 'Equity Dilution Calculator for Indian Startups | KarobarKit',
  seoDescription: 'Preview post-money investor ownership, founder dilution and option-pool scenarios.',
  sources: [startupMethodSource, companiesActSource],
  privacyNote: startupPrivacyNote,
  disclaimer:
    'This is an educational cap-table scenario, not legal, securities, tax or registered-valuer advice.',
});

export const esopTool = createPhase5Tool({
  kind: 'esop',
  id: 'esop-calculator',
  slug: 'esop-calculator',
  name: 'ESOP Calculator',
  shortName: 'ESOP',
  toolKind: 'worksheet',
  category: 'hr-salary',
  secondaryCategories: ['startup'],
  tags: ['esop', 'employee stock options', 'vesting', 'exercise price'],
  searchTerms: [
    'employee stock option calculator',
    'esop vesting',
    'esop exercise cost',
    'esop tax illustration',
  ],
  summary: 'Illustrate ESOP vesting, exercise cost, ownership and separate tax-event scenarios.',
  riskTier: 'D',
  regulatory: true,
  reviewCadenceDays: 90,
  reviewerRole: 'Named corporate/legal and tax reviewer',
  policyDependencies: [
    'method-startup-metrics-v1',
    'it-perquisites-2026',
    'indiacode-companies-section-62',
    'startup-india-playbook-2026',
  ],
  goldenFixtureIds: ['esop-vesting-case', 'esop-no-sale-case'],
  method:
    'Grant and vesting arithmetic with a separately labelled exercise spread and optional rate-based tax illustration.',
  formula:
    'Vested shares = grant shares × vested %; tax-event exercise spread = max(FMV on exercise/allotment date − exercise price, 0) × exercised/allotted shares.',
  workedExample:
    'A 10,000-share grant with 25% vested has a ₹1,00,000 spread only when 2,500 shares are actually exercised/allotted at a ₹10 exercise price and ₹50 exercise-date FMV.',
  resultInterpretation:
    'The output separates ownership, vested shares, exercised/allotted shares, exercise-date FMV, spread and later sale gain so no one number is presented as the tax answer.',
  limitations: [
    'The tool does not determine FMV, vesting validity, startup eligibility, perquisite timing, capital gains or plan compliance.',
    'Tax-rate input is optional arithmetic only and does not replace tax computation.',
  ],
  edgeCases: [
    'A sale price is optional; no later gain is shown when it is blank.',
    'A fair market value below the exercise price produces zero positive spread rather than a negative tax base.',
  ],
  faqs: [
    {
      question: 'Does this calculate ESOP tax?',
      answer:
        'Only an optional, rate-based spread illustration. Actual treatment depends on law, FMV, plan terms and personal facts.',
    },
    {
      question: 'Does it verify my company’s ESOP plan?',
      answer: 'No. Use the approved plan documents and qualified corporate and tax advice.',
    },
  ],
  relatedToolIds: ['equity-dilution-calculator', 'startup-valuation-calculator', 'in-hand-salary-calculator'],
  seoTitle: 'ESOP Calculator for Indian Startups | KarobarKit',
  seoDescription: 'Illustrate ESOP vesting, exercise cost, ownership and optional rate-based tax scenarios.',
  sources: [startupMethodSource, esopTaxSource, companiesActSource, startupIndiaSource],
  privacyNote: startupPrivacyNote,
  disclaimer: 'This is an educational ESOP scenario, not legal, tax, securities, FMV or employment advice.',
});

const marketplaceConfig = {
  amazon: {
    kind: 'amazon-fees' as const,
    id: 'amazon-fees-calculator',
    slug: 'amazon-fees-calculator',
    name: 'Amazon Fees Calculator',
    shortName: 'Amazon Fees',
    summary:
      'Estimate Amazon marketplace fees and contribution using a verified snapshot plus seller-specific overrides.',
    fulfillment: 'Amazon referral, closing, shipping and other fee assumptions.',
    formula:
      'Total fees = referral + closing + shipping + other fees + GST on marketplace fees; contribution = sale price − fees − product cost.',
    workedExample:
      'A ₹299 sandals sale with Easy Ship uses the official ₹1 closing-fee example; referral, shipping and product cost remain seller inputs.',
    resultInterpretation:
      'The result is an estimate; category, weight, distance, seller level and services can change actual settlement.',
    faqs: [
      {
        question: 'Does this use my live Amazon Seller Central fees?',
        answer:
          'No. It uses a bundled official snapshot plus the category, shipping and other-fee overrides you enter.',
      },
      {
        question: 'Why is Self-Ship asking for a closing-fee override?',
        answer:
          'The bundled source only includes selected official category examples. If your category, price band or channel is not one of those examples, the tool stops rather than applying a universal fee.',
      },
    ],
    limitations: [
      'The bundled schedule covers selected closing-fee bands only.',
      'Referral and shipping rates are user overrides because Seller Central varies by category and fulfilment facts.',
    ],
    edgeCases: [
      'Any category, price band or channel without a verified bundled example requires a current Seller Central closing-fee override.',
      'Future policy dates are rejected.',
    ],
    relatedToolIds: [
      'flipkart-fees-calculator',
      'marketplace-margin-calculator',
      'roas-calculator',
      'cod-cost-calculator',
    ],
    seoTitle: 'Amazon Fees Calculator for India | KarobarKit',
    seoDescription:
      'Estimate Amazon referral, closing, shipping, GST and contribution with seller-specific overrides.',
  },
  flipkart: {
    kind: 'flipkart-fees' as const,
    id: 'flipkart-fees-calculator',
    slug: 'flipkart-fees-calculator',
    name: 'Flipkart Fees Calculator',
    shortName: 'Flipkart Fees',
    summary:
      'Estimate Flipkart fixed, commission, collection, shipping and GST fees using the standard card and overrides.',
    fulfillment: 'Flipkart fixed, commission, collection, shipping and other fee assumptions.',
    formula:
      'Total fees = fixed + commission + collection + shipping + other fees + GST on marketplace fees; contribution = sale price − fees − product cost.',
    workedExample:
      'A ₹2,000 NFBF sale uses the official ₹55 fixed-fee band; category commission, prepaid/COD collection and shipping must be copied from the seller dashboard.',
    resultInterpretation:
      'The result is an estimate; the seller dashboard remains authoritative for category and account-specific charges.',
    faqs: [
      {
        question: 'Does this use my live Flipkart seller dashboard?',
        answer:
          'No. Enter the current commission, collection and shipping values from your dashboard; the bundled policy only supplies standard fixed-fee bands.',
      },
      {
        question: 'Why can the actual settlement differ?',
        answer:
          'Category, payment mode, packed dimensions, fulfilment programme, taxes and account-specific terms can change the final fees.',
      },
    ],
    limitations: [
      'The bundled schedule covers standard FBF/NFBF fixed fees only.',
      'Commission, collection and shipping are user overrides because they vary by category, payment mode and packed shipment.',
    ],
    edgeCases: [
      'A seller-dashboard fixed-fee override can replace the standard price-band value.',
      'Future policy dates are rejected.',
    ],
    relatedToolIds: [
      'amazon-fees-calculator',
      'marketplace-margin-calculator',
      'roas-calculator',
      'cod-cost-calculator',
    ],
    seoTitle: 'Flipkart Fees Calculator for India | KarobarKit',
    seoDescription:
      'Estimate Flipkart fixed, commission, collection, shipping, GST and contribution with overrides.',
  },
};

export const amazonFeesTool = createPhase5Tool({
  ...marketplaceConfig.amazon,
  toolKind: 'data-backed',
  category: 'ecommerce',
  secondaryCategories: [],
  tags: ['amazon fees', 'seller fees', 'referral fee', 'closing fee', 'shipping'],
  searchTerms: [
    'amazon seller fees',
    'amazon profit calculator',
    'amazon referral fee',
    'amazon closing fee',
  ],
  riskTier: 'C',
  reviewCadenceDays: 30,
  reviewerRole: 'Marketplace policy reviewer',
  policyDependencies: ['amazon-india-fees-2026'],
  goldenFixtureIds: ['amazon-fees-fba-band', 'amazon-fees-self-ship-override'],
  method: marketplaceConfig.amazon.fulfillment,
  sources: MARKETPLACE_SOURCE_REFERENCES.filter((source) => source.id === 'amazon-india-fees-2026'),
  privacyNote: marketplacePrivacyNote,
  disclaimer:
    'This is an estimate, not a seller settlement, payout guarantee, tax conclusion or marketplace recommendation.',
  executionMode: 'local-with-bundled-data',
});

export const flipkartFeesTool = createPhase5Tool({
  ...marketplaceConfig.flipkart,
  toolKind: 'data-backed',
  category: 'ecommerce',
  secondaryCategories: [],
  tags: ['flipkart fees', 'seller fees', 'commission', 'collection fee', 'shipping'],
  searchTerms: [
    'flipkart seller fees',
    'flipkart profit calculator',
    'flipkart commission',
    'flipkart fixed fee',
  ],
  riskTier: 'C',
  reviewCadenceDays: 30,
  reviewerRole: 'Marketplace policy reviewer',
  policyDependencies: ['flipkart-seller-fees-2026'],
  goldenFixtureIds: ['flipkart-fees-fbf-band', 'flipkart-fees-commission-override'],
  method: marketplaceConfig.flipkart.fulfillment,
  sources: MARKETPLACE_SOURCE_REFERENCES.filter((source) => source.id === 'flipkart-seller-fees-2026'),
  privacyNote: marketplacePrivacyNote,
  disclaimer:
    'This is an estimate, not a seller settlement, payout guarantee, tax conclusion or marketplace recommendation.',
  executionMode: 'local-with-bundled-data',
});

export const phase5Tools = [
  cacTool,
  ltvTool,
  saasMetricsTool,
  valuationTool,
  equityDilutionTool,
  esopTool,
  amazonFeesTool,
  flipkartFeesTool,
] as const;

/**
 * Golden fixtures are deliberately tracked as a manifest rather than as
 * unqualified strings in the registry. A reviewer must still sign this
 * manifest before the beta can be represented as independently approved.
 */
type Phase5FixtureSignoffStatus = 'pending' | 'signed';
const phase5FixtureSignoffStatus: Phase5FixtureSignoffStatus = 'pending';

export const PHASE5_GOLDEN_FIXTURE_MANIFEST = {
  status: phase5FixtureSignoffStatus,
  reviewerRole: 'Named startup, marketplace and tax/payroll reviewers',
  lastUpdated: PHASE5_LAST_REVIEWED,
  signature: {
    status: phase5FixtureSignoffStatus,
    reviewerName: null,
    reviewedOn: null,
    releaseCommit: null,
  },
  fixtures: [
    { id: 'cac-base-case', toolId: 'cac-calculator' },
    { id: 'cac-zero-paid-case', toolId: 'cac-calculator' },
    { id: 'ltv-base-case', toolId: 'ltv-calculator' },
    { id: 'ltv-unstable-churn-case', toolId: 'ltv-calculator' },
    { id: 'saas-metrics-reconciliation', toolId: 'saas-metrics-calculator' },
    { id: 'saas-metrics-zero-denominator', toolId: 'saas-metrics-calculator' },
    { id: 'valuation-range-case', toolId: 'startup-valuation-calculator' },
    { id: 'valuation-zero-investment-case', toolId: 'startup-valuation-calculator' },
    { id: 'equity-dilution-reconciles', toolId: 'equity-dilution-calculator' },
    { id: 'equity-dilution-invalid-cap-table', toolId: 'equity-dilution-calculator' },
    { id: 'esop-vesting-case', toolId: 'esop-calculator' },
    { id: 'esop-no-sale-case', toolId: 'esop-calculator' },
    { id: 'amazon-fees-fba-band', toolId: 'amazon-fees-calculator' },
    { id: 'amazon-fees-self-ship-override', toolId: 'amazon-fees-calculator' },
    { id: 'flipkart-fees-fbf-band', toolId: 'flipkart-fees-calculator' },
    { id: 'flipkart-fees-commission-override', toolId: 'flipkart-fees-calculator' },
  ],
} as const;

export function validatePhase5FixtureManifest() {
  const registryIds = new Set<string>(phase5Tools.flatMap((tool) => tool.governance.goldenFixtureIds ?? []));
  const manifestIds = new Set<string>(PHASE5_GOLDEN_FIXTURE_MANIFEST.fixtures.map((fixture) => fixture.id));
  const errors: string[] = [];
  if ((PHASE5_GOLDEN_FIXTURE_MANIFEST.status as Phase5FixtureSignoffStatus) === 'signed') {
    if ((PHASE5_GOLDEN_FIXTURE_MANIFEST.signature.status as Phase5FixtureSignoffStatus) !== 'signed')
      errors.push('Phase 5 fixture manifest cannot be signed while its signature status is pending.');
    if (!PHASE5_GOLDEN_FIXTURE_MANIFEST.signature.reviewerName)
      errors.push('A signed Phase 5 fixture manifest requires a reviewer name.');
    if (!PHASE5_GOLDEN_FIXTURE_MANIFEST.signature.releaseCommit)
      errors.push('A signed Phase 5 fixture manifest requires a release commit.');
  }
  for (const fixture of PHASE5_GOLDEN_FIXTURE_MANIFEST.fixtures) {
    const tool = phase5Tools.find((candidate) => candidate.id === fixture.toolId);
    if (!tool) errors.push(`Fixture ${fixture.id} references unknown tool ${fixture.toolId}.`);
    else if (!(tool.governance.goldenFixtureIds ?? []).includes(fixture.id))
      errors.push(`Fixture ${fixture.id} is missing from ${fixture.toolId} governance metadata.`);
  }
  for (const id of registryIds)
    if (!manifestIds.has(id)) errors.push(`Registry fixture ${id} is missing from the manifest.`);
  return errors;
}
