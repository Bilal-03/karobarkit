import {
  businessCalculatorFields,
  businessCalculatorInputSchema,
  calculateBusinessEconomics,
  type BusinessCalculationResult,
  type BusinessCalculatorInput,
  type BusinessCalculatorKind,
  validateBusinessCalculatorInput,
} from '@/domain/calculations/business-economics';

import type { SourceReference, ToolDefinition } from '../types';
import { liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const BUSINESS_TOOL_LAST_REVIEWED = '2026-08-09';

const businessEconomicsSource: SourceReference = {
  id: 'method-business-metrics-v1',
  title: 'Business economics methodology v1',
  publisher: 'KarobarKit controlled methodology',
  url: 'https://github.com/Bilal-03/karobarkit/blob/main/docs/product-spec/Business_Toolkit_for_India_Implementation_Plan_2026-08-09.md',
  lastChecked: BUSINESS_TOOL_LAST_REVIEWED,
  evidenceLevel: 'authoritative',
  notes:
    'Controlled internal methodology for transparent planning arithmetic. Marketplace, tax and payment assumptions remain user-supplied estimates.',
  supports: ['business economics formulas', 'rounding and scope limitations', 'estimate-only language'],
};

type BusinessToolInput = {
  kind: BusinessCalculatorKind;
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: string;
  categoryLabel: string;
  secondaryCategories: string[];
  tags: string[];
  searchTerms: string[];
  summary: string;
  featured?: boolean;
  launchPriority?: number;
  riskTier: 'B' | 'C';
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

const sharedPrivacyNote =
  'Scenario inputs and results stay in this browser. Values are not sent to analytics, a backend, a URL or a log. They are not saved by default; an explicit related-tool transfer is kept only in this tab until it closes or you replace it.';

function createBusinessTool(
  config: BusinessToolInput,
): ToolDefinition<BusinessCalculatorInput, BusinessCalculationResult> {
  const defaultValues = Object.fromEntries(
    businessCalculatorFields[config.kind].map((field) => [field.name, field.defaultValue]),
  );
  return {
    id: config.id,
    slug: config.slug,
    kind: 'calculator',
    ui: { adapter: 'business-calculator', variant: config.kind },
    name: config.name,
    shortName: config.shortName,
    category: config.category,
    categoryLabel: config.categoryLabel,
    secondaryCategories: config.secondaryCategories,
    tags: config.tags,
    searchTerms: config.searchTerms,
    summary: config.summary,
    featured: config.featured ?? false,
    launchPriority: config.launchPriority ?? 20,
    ...liveLocalMetadata({
      riskTier: config.riskTier,
      reviewCadenceDays: 365,
      method: config.method,
      lastVerified: BUSINESS_TOOL_LAST_REVIEWED,
      lifecycle: 'beta',
      capabilities: ['download-csv', 'session-handoff'],
    }),
    inputSchema: businessCalculatorInputSchema,
    defaultValues,
    validate: (input) => validateBusinessCalculatorInput(config.kind, input),
    calculate: (input) => calculateBusinessEconomics(config.kind, input),
    renderResult: (result) => result.headline.value,
    sources: [businessEconomicsSource],
    limitations: config.limitations,
    lastReviewed: BUSINESS_TOOL_LAST_REVIEWED,
    seo: {
      title: config.seoTitle,
      description: config.seoDescription,
      keywords: [...config.searchTerms],
    },
    relatedToolIds: config.relatedToolIds,
    analyticsPolicy: sharedAnalyticsPolicy,
    howToUse: businessCalculatorFields[config.kind].map(
      (field) => `Enter ${field.label.toLowerCase()} using the same period and unit as the other inputs.`,
    ),
    formula: config.formula,
    workedExample: config.workedExample,
    resultInterpretation: config.resultInterpretation,
    edgeCases: config.edgeCases,
    faqs: config.faqs,
    privacyNote: sharedPrivacyNote,
    disclaimer:
      'This is a planning scenario, not accounting, tax, legal, investment or marketplace advice. Verify assumptions against your records before making a decision.',
  };
}

export const marginTool = createBusinessTool({
  kind: 'margin',
  id: 'margin-calculator',
  slug: 'margin-calculator',
  name: 'Margin Calculator',
  shortName: 'Margin',
  category: 'business',
  categoryLabel: 'Business',
  secondaryCategories: [],
  tags: ['margin', 'profit', 'revenue', 'contribution'],
  searchTerms: ['profit margin', 'contribution margin', 'gross margin calculator'],
  summary: 'Compare revenue with selected costs to understand contribution profit and margin.',
  featured: true,
  launchPriority: 8,
  riskTier: 'B',
  method: 'Revenue less selected costs, divided by revenue, using decimal arithmetic.',
  formula: 'Contribution margin = (revenue − total cost) ÷ revenue × 100',
  workedExample: '₹1,00,000 revenue and ₹70,000 selected costs produce ₹30,000 profit and a 30% margin.',
  resultInterpretation:
    'The percentage shows how much of each rupee of revenue remains after the selected costs.',
  limitations: [
    'Margin scope depends on which costs you include.',
    'It is not a statutory gross or net profit statement.',
  ],
  edgeCases: [
    'Revenue must be greater than zero.',
    'Negative profit is shown as a negative margin instead of being hidden.',
  ],
  faqs: [
    {
      question: 'Is this gross margin or net margin?',
      answer:
        'It is a contribution-style margin based on the costs you enter. Name and scope the costs yourself.',
    },
    {
      question: 'Can margin be negative?',
      answer: 'Yes. A negative result means the selected costs exceed revenue.',
    },
  ],
  relatedToolIds: ['markup-calculator', 'break-even-calculator', 'pricing-calculator'],
  seoTitle: 'Margin Calculator for Indian Businesses | KarobarKit',
  seoDescription:
    'Calculate contribution profit and margin from revenue and selected costs with transparent assumptions.',
});

export const markupTool = createBusinessTool({
  kind: 'markup',
  id: 'markup-calculator',
  slug: 'markup-calculator',
  name: 'Markup Calculator',
  shortName: 'Markup',
  category: 'business',
  categoryLabel: 'Business',
  secondaryCategories: [],
  tags: ['markup', 'margin', 'pricing', 'profit'],
  searchTerms: ['markup percentage', 'cost plus markup', 'selling price calculator'],
  summary: 'Calculate profit and markup from unit cost and selling price, with margin shown separately.',
  riskTier: 'B',
  method: 'Selling price less unit cost, divided by unit cost, using decimal arithmetic.',
  formula: 'Markup = (selling price − unit cost) ÷ unit cost × 100',
  workedExample: 'A ₹700 unit cost and ₹1,000 selling price produce ₹300 profit and 42.86% markup.',
  resultInterpretation: 'Markup measures profit against cost. Margin measures profit against selling price.',
  limitations: [
    'Only the unit cost entered is included.',
    'Discounts, tax and marketplace fees require a broader scenario.',
  ],
  edgeCases: [
    'Unit cost must be greater than zero.',
    'A selling price below cost produces a negative markup and margin.',
  ],
  faqs: [
    {
      question: 'Why is markup different from margin?',
      answer: 'Markup divides profit by cost; margin divides profit by selling price.',
    },
    {
      question: 'Can I use this for a discount?',
      answer: 'Use the resulting price as an input to a pricing scenario that models discount separately.',
    },
  ],
  relatedToolIds: ['margin-calculator', 'pricing-calculator'],
  seoTitle: 'Markup Calculator for Indian Businesses | KarobarKit',
  seoDescription:
    'Calculate markup, profit and margin from unit cost and selling price with a clear formula.',
});

export const breakEvenTool = createBusinessTool({
  kind: 'break-even',
  id: 'break-even-calculator',
  slug: 'break-even-calculator',
  name: 'Break-even Calculator',
  shortName: 'Break-even',
  category: 'business',
  categoryLabel: 'Business',
  secondaryCategories: [],
  tags: ['break even', 'fixed cost', 'variable cost', 'contribution'],
  searchTerms: ['break even point', 'break even units', 'break even sales'],
  summary: 'Find the units and revenue needed to cover fixed costs for one product or service.',
  riskTier: 'B',
  method: 'Fixed costs divided by contribution per unit, with whole-unit rounding shown explicitly.',
  formula: 'Break-even units = fixed costs ÷ (selling price per unit − variable cost per unit)',
  workedExample: '₹1,00,000 fixed costs and ₹400 contribution per unit require 250 units to break even.',
  resultInterpretation:
    'The whole-unit result is the minimum complete units needed to cover the selected fixed costs.',
  limitations: [
    'V1 models one product or service.',
    'It assumes price, variable cost and fixed cost remain stable.',
  ],
  edgeCases: [
    'Selling price must exceed variable cost.',
    'The exact fractional result is shown alongside the whole-unit result.',
  ],
  faqs: [
    {
      question: 'Why do I see whole and exact units?',
      answer:
        'The exact division is useful for analysis; a business usually needs a whole unit to reach or exceed break-even.',
    },
    {
      question: 'Does this model a product mix?',
      answer: 'No. This first version is a single-product scenario.',
    },
  ],
  relatedToolIds: ['margin-calculator', 'pricing-calculator', 'cash-flow-calculator'],
  seoTitle: 'Break-even Calculator for Indian Businesses | KarobarKit',
  seoDescription:
    'Calculate break-even units and revenue from fixed costs, selling price and variable cost per unit.',
});

export const pricingTool = createBusinessTool({
  kind: 'pricing',
  id: 'pricing-calculator',
  slug: 'pricing-calculator',
  name: 'Pricing Calculator',
  shortName: 'Pricing',
  category: 'business',
  categoryLabel: 'Business',
  secondaryCategories: [],
  tags: ['pricing', 'cost plus', 'discount', 'tax'],
  searchTerms: ['price calculator', 'cost plus pricing', 'target margin price'],
  summary: 'Model a target-margin price with expected discount and a user-supplied tax rate.',
  riskTier: 'B',
  method: 'Cost-plus target margin followed by discount and user-supplied tax arithmetic.',
  formula: 'Pre-tax price = cost ÷ (1 − target margin); customer price = discounted price × (1 + tax rate).',
  workedExample:
    '₹600 cost at a 40% target margin, 10% discount and 18% user-supplied tax produces a ₹1,180 customer price.',
  resultInterpretation:
    'This is a scenario price, not a recommendation of any legally applicable GST or tax rate.',
  limitations: [
    'The tax input is user-supplied and not classified.',
    'Demand, competitor pricing and capacity are outside the model.',
  ],
  edgeCases: [
    'Target margin and discount must be below 100%.',
    'Tax rate is arithmetic only and does not establish taxability.',
  ],
  faqs: [
    {
      question: 'Does this choose the GST rate for my product?',
      answer: 'No. Enter a rate only if you already know the assumption you want to model.',
    },
    {
      question: 'Is target margin the same as markup?',
      answer:
        'No. Target margin is profit as a percentage of selling price; markup is profit as a percentage of cost.',
    },
  ],
  relatedToolIds: ['margin-calculator', 'markup-calculator', 'break-even-calculator'],
  seoTitle: 'Pricing Calculator for Indian Businesses | KarobarKit',
  seoDescription: 'Model cost-plus pricing with target margin, discount and user-supplied tax arithmetic.',
});

export const cashFlowTool = createBusinessTool({
  kind: 'cash-flow',
  id: 'cash-flow-calculator',
  slug: 'cash-flow-calculator',
  name: 'Cash Flow Calculator',
  shortName: 'Cash Flow',
  category: 'business',
  categoryLabel: 'Business',
  secondaryCategories: ['startup'],
  tags: ['cash flow', 'cash balance', 'forecast', 'planning'],
  searchTerms: ['cash flow forecast', 'closing cash', 'cash planning'],
  summary: 'Plan closing cash from opening cash, expected inflows, operating outflows and one-off payments.',
  riskTier: 'B',
  method: 'Opening cash plus inflows less operating and one-off outflows.',
  formula: 'Closing cash = opening cash + inflows − operating outflows − one-off outflows',
  workedExample: '₹2,50,000 opening cash plus ₹1,80,000 inflows less ₹1,60,000 outflows leaves ₹2,70,000.',
  resultInterpretation: 'The closing balance is a planning forecast based only on the assumptions entered.',
  limitations: [
    'This is not a statutory cash-flow statement.',
    'Timing within the period and unpaid receivables are not modeled.',
  ],
  edgeCases: [
    'Negative closing cash is shown clearly.',
    'One-off payments are separated so they are not mistaken for the operating trend.',
  ],
  faqs: [
    {
      question: 'Can I download the scenario?',
      answer: 'Yes. The result includes a local CSV download of the entered assumptions and outputs.',
    },
    {
      question: 'Does this import bank data?',
      answer: 'No. Values are entered manually and remain in the browser.',
    },
  ],
  relatedToolIds: ['burn-rate-calculator', 'runway-calculator'],
  seoTitle: 'Cash Flow Calculator for Indian Businesses | KarobarKit',
  seoDescription:
    'Forecast closing cash from opening balance, inflows, operating outflows and one-off payments.',
});

export const burnRateTool = createBusinessTool({
  kind: 'burn-rate',
  id: 'burn-rate-calculator',
  slug: 'burn-rate-calculator',
  name: 'Burn Rate Calculator',
  shortName: 'Burn Rate',
  category: 'business',
  categoryLabel: 'Business',
  secondaryCategories: ['startup'],
  tags: ['burn rate', 'gross burn', 'net burn', 'cash change'],
  searchTerms: ['monthly burn', 'net burn', 'gross burn'],
  summary: 'Separate gross burn, net burn and cash change across an explicit planning period.',
  riskTier: 'B',
  method: 'Periodized outflows and inflows; one-off items remain visible in the selected period.',
  formula: 'Gross burn/month = outflows ÷ months; net burn/month = (outflows − inflows) ÷ months',
  workedExample:
    '₹4,50,000 outflows and ₹1,50,000 inflows across 3 months produce ₹1,00,000 net burn per month.',
  resultInterpretation:
    'Net burn is average monthly cash consumption after inflows; negative burn means the scenario generates cash.',
  limitations: [
    'Averages can hide monthly volatility.',
    'The tool does not predict future revenue or survival.',
  ],
  edgeCases: ['The period must be greater than zero.', 'A surplus is not mislabeled as burn.'],
  faqs: [
    {
      question: 'What is gross burn?',
      answer: 'Gross burn is average monthly outflow before considering inflows.',
    },
    {
      question: 'What if inflows exceed outflows?',
      answer: 'The result shows no net burn and reports the positive cash change.',
    },
  ],
  relatedToolIds: ['cash-flow-calculator', 'runway-calculator'],
  seoTitle: 'Burn Rate Calculator for Indian Startups | KarobarKit',
  seoDescription: 'Calculate gross burn, net burn and cash change using a clear planning period.',
});

export const runwayTool = createBusinessTool({
  kind: 'runway',
  id: 'runway-calculator',
  slug: 'runway-calculator',
  name: 'Runway Calculator',
  shortName: 'Runway',
  category: 'business',
  categoryLabel: 'Business',
  secondaryCategories: ['startup'],
  tags: ['runway', 'cash runway', 'net burn', 'startup planning'],
  searchTerms: ['months of runway', 'cash runway', 'startup runway'],
  summary: 'Estimate months of cash runway from current cash and monthly net burn.',
  riskTier: 'B',
  method: 'Current cash divided by monthly outflows less monthly inflows.',
  formula: 'Runway months = current cash ÷ (monthly outflows − monthly inflows)',
  workedExample: '₹9,00,000 cash and ₹2,00,000 monthly net burn produce 4.5 months of runway.',
  resultInterpretation:
    'Runway is a scenario estimate, not a prediction of business survival or fundraising success.',
  limitations: [
    'The model assumes a stable monthly pace.',
    'It does not model funding, working-capital timing or step changes.',
  ],
  edgeCases: [
    'If net burn is zero or negative, the result says no burn rather than inventing an infinite forecast.',
    'Zero cash produces zero runway when burn is positive.',
  ],
  faqs: [
    {
      question: 'Is runway a guarantee?',
      answer: 'No. It is a simple scenario based on current cash and the selected monthly pace.',
    },
    {
      question: 'Why does the tool say no burn?',
      answer:
        'Monthly inflows meet or exceed outflows, so this formula cannot produce a finite consumption period.',
    },
  ],
  relatedToolIds: ['cash-flow-calculator', 'burn-rate-calculator'],
  seoTitle: 'Runway Calculator for Indian Businesses and Startups | KarobarKit',
  seoDescription:
    'Estimate cash runway from current cash, monthly outflows and monthly inflows with clear limits.',
});

export const marketplaceMarginTool = createBusinessTool({
  kind: 'marketplace-margin',
  id: 'marketplace-margin-calculator',
  slug: 'marketplace-margin-calculator',
  name: 'Marketplace Margin Calculator',
  shortName: 'Marketplace Margin',
  category: 'ecommerce',
  categoryLabel: 'E-commerce',
  secondaryCategories: [],
  tags: ['marketplace', 'seller margin', 'platform fee', 'unit economics'],
  searchTerms: ['seller margin', 'marketplace profit', 'platform fee margin'],
  summary:
    'Estimate per-order marketplace contribution after platform, shipping, payment, return and tax costs.',
  riskTier: 'C',
  method:
    'Selling price less user-supplied cost and fee assumptions, with percentage fees applied to selling price.',
  formula:
    'Contribution = selling price − product − platform fee − shipping − payment fee − return − tax cost',
  workedExample:
    'A ₹1,500 order with ₹600 product cost and the displayed fee assumptions produces a positive contribution margin.',
  resultInterpretation:
    'This is a vendor-neutral estimate; actual marketplace schedules and settlements must be checked separately.',
  limitations: [
    'No marketplace schedule is scraped or guaranteed.',
    'Fees, returns, taxes and fulfilment rules vary by vendor, category and date.',
  ],
  edgeCases: [
    'Percentage fees are limited to 0–100%.',
    'Negative contribution is shown as a negative margin.',
  ],
  faqs: [
    {
      question: 'Does this know Amazon or Flipkart fees?',
      answer:
        'No. Enter the fee assumptions you want to model. Vendor-specific schedules are planned for a later phase.',
    },
    {
      question: 'Is this profit after tax?',
      answer:
        'Only the user-supplied tax cost is included; no tax classification or filing result is determined.',
    },
  ],
  relatedToolIds: ['roas-calculator', 'cod-cost-calculator'],
  seoTitle: 'Marketplace Margin Calculator for Indian Sellers | KarobarKit',
  seoDescription:
    'Estimate marketplace contribution margin from product, platform, shipping, payment, return and tax costs.',
});

export const roasTool = createBusinessTool({
  kind: 'roas',
  id: 'roas-calculator',
  slug: 'roas-calculator',
  name: 'ROAS Calculator',
  shortName: 'ROAS',
  category: 'ecommerce',
  categoryLabel: 'E-commerce',
  secondaryCategories: ['business'],
  tags: ['roas', 'advertising', 'ad spend', 'contribution profit'],
  searchTerms: ['return on ad spend', 'advertising return', 'break even roas'],
  summary: 'Compare attributed revenue with ad spend and see the contribution-profit view behind ROAS.',
  riskTier: 'C',
  method: 'Attributed revenue divided by ad spend, with user-supplied variable costs shown separately.',
  formula: 'ROAS = attributed revenue ÷ ad spend; contribution = revenue − ad spend − variable costs',
  workedExample:
    '₹2,00,000 attributed revenue on ₹50,000 ad spend produces 4.00x ROAS before cost interpretation.',
  resultInterpretation:
    'ROAS is a platform-attribution ratio; contribution profit is a broader scenario check.',
  limitations: [
    'Attributed revenue may not equal collected revenue.',
    'Attribution windows, refunds and overhead are not modeled.',
  ],
  edgeCases: [
    'Ad spend must be greater than zero.',
    'Break-even ROAS is unavailable when supplied variable cost is at least revenue.',
  ],
  faqs: [
    {
      question: 'Is high ROAS always profitable?',
      answer:
        'No. Product cost, fulfilment, refunds and other variable costs can make a high ROAS unprofitable.',
    },
    {
      question: 'What is break-even ROAS?',
      answer:
        'It is the ROAS needed to cover the supplied variable costs and ad spend under this simplified model.',
    },
  ],
  relatedToolIds: ['marketplace-margin-calculator', 'cod-cost-calculator'],
  seoTitle: 'ROAS Calculator for Indian E-commerce Businesses | KarobarKit',
  seoDescription:
    'Calculate return on ad spend and contribution profit from attributed revenue, ad spend and variable costs.',
});

export const codCostTool = createBusinessTool({
  kind: 'cod-cost',
  id: 'cod-cost-calculator',
  slug: 'cod-cost-calculator',
  name: 'COD Cost Calculator',
  shortName: 'COD Cost',
  category: 'ecommerce',
  categoryLabel: 'E-commerce',
  secondaryCategories: [],
  tags: ['cod', 'cash on delivery', 'rto', 'return to origin'],
  searchTerms: ['cash on delivery cost', 'rto cost', 'cod profitability'],
  summary:
    'Estimate expected COD cost and contribution after RTO, return shipping and cash-cycle assumptions.',
  riskTier: 'C',
  method: 'Expected-value calculation using the user-supplied RTO rate and per-order costs.',
  formula:
    'Expected RTO cost = RTO rate × (return shipping + return loss); expected contribution subtracts all costs.',
  workedExample: 'An 8% RTO rate applies 8% of return shipping plus return loss to each expected order.',
  resultInterpretation:
    'The expected cost spreads RTO risk across orders; it is not a promise of actual carrier performance.',
  limitations: [
    'All fees, rates and losses are user-supplied.',
    'Customer behavior, carrier policy and settlement timing are not predicted.',
  ],
  edgeCases: [
    'RTO rate must remain between 0% and 100%.',
    'A negative expected contribution is shown clearly.',
  ],
  faqs: [
    {
      question: 'What does RTO mean here?',
      answer:
        'Return to origin: an order that is not delivered and returns to the seller or fulfilment point.',
    },
    {
      question: 'Does this use live courier rates?',
      answer:
        'No. Enter the assumptions you want to compare; live vendor schedules are outside this version.',
    },
  ],
  relatedToolIds: ['marketplace-margin-calculator', 'roas-calculator'],
  seoTitle: 'COD Cost Calculator for Indian E-commerce Sellers | KarobarKit',
  seoDescription:
    'Estimate cash-on-delivery cost, RTO cost and expected contribution per order with explicit assumptions.',
});

export const businessEconomicsTools = [
  marginTool,
  markupTool,
  breakEvenTool,
  pricingTool,
  cashFlowTool,
  burnRateTool,
  runwayTool,
  marketplaceMarginTool,
  roasTool,
  codCostTool,
] as const;
