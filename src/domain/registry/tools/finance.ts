import {
  calculateFinance,
  financeCalculatorFields,
  financeCalculatorInputSchema,
  type FinanceCalculationResult,
  type FinanceCalculatorInput,
  type FinanceCalculatorKind,
  validateFinanceCalculatorInput,
} from '@/domain/calculations/finance';

import type { SourceReference, ToolDefinition } from '../types';
import { liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const FINANCE_TOOL_LAST_REVIEWED = '2026-08-09';

const financeMethodSource: SourceReference = {
  id: 'method-finance-v1',
  title: 'Finance calculation methodology v1',
  publisher: 'KarobarKit controlled methodology',
  url: 'https://github.com/Bilal-03/karobarkit/blob/main/docs/product-spec/Business_Toolkit_for_India_Implementation_Plan_2026-08-09.md',
  lastChecked: FINANCE_TOOL_LAST_REVIEWED,
  evidenceLevel: 'authoritative',
  notes:
    'Controlled internal method for EMI amortization, periodic-compounding illustrations, dated-cash-flow solving and loan comparison. Rates, fees and assumptions are user-entered.',
  supports: [
    'EMI and amortization arithmetic',
    'SIP and FD illustrations',
    'XIRR dated-cash-flow solving',
    'loan comparison assumptions and limitations',
  ],
};

const sebiSipSource: SourceReference = {
  id: 'sebi-sip-calculator',
  title: 'SIP calculator',
  publisher: 'Securities and Exchange Board of India',
  url: 'https://investor.sebi.gov.in/calculators/sip_calculator.html',
  lastChecked: FINANCE_TOOL_LAST_REVIEWED,
  evidenceLevel: 'official',
  notes:
    'Official regulator reference for SIP illustration context. KarobarKit does not import a return assumption or make a performance guarantee.',
  supports: ['SIP illustration framing', 'no-guarantee wording'],
};

const rbiEmiSource: SourceReference = {
  id: 'rbi-emi-reset-faq',
  title: 'FAQs on reset of floating interest rate on equated monthly instalments',
  publisher: 'Reserve Bank of India',
  url: 'https://www.rbi.org.in/scripts/FAQView.aspx?Id=170',
  lastChecked: FINANCE_TOOL_LAST_REVIEWED,
  evidenceLevel: 'official',
  notes:
    'Official reference for disclosing rate-reset assumptions. KarobarKit does not import lender rates, reset policies or fees.',
  supports: ['rate-reset disclosure', 'borrower-context limitations'],
};

const sharedPrivacyNote =
  'Finance inputs and results stay in this browser. Values are not sent to analytics, a backend, a URL or a log, and are not saved by default. Rates and returns are user-entered assumptions, not guarantees or lender recommendations.';

type FinanceToolConfig = {
  kind: FinanceCalculatorKind;
  id: string;
  slug: string;
  name: string;
  shortName: string;
  toolKind: 'calculator' | 'comparison';
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
  sources: SourceReference[];
};

function createFinanceTool(
  config: FinanceToolConfig,
): ToolDefinition<FinanceCalculatorInput, FinanceCalculationResult> {
  const defaultValues = Object.fromEntries(
    financeCalculatorFields[config.kind].map((field) => [field.name, field.defaultValue]),
  );
  return {
    id: config.id,
    slug: config.slug,
    kind: config.toolKind,
    ui: { adapter: 'finance-calculator', variant: config.kind },
    name: config.name,
    shortName: config.shortName,
    category: 'finance',
    categoryLabel: 'Finance',
    secondaryCategories: config.kind === 'loan-comparison' ? ['business'] : [],
    tags: config.tags,
    searchTerms: config.searchTerms,
    summary: config.summary,
    featured: false,
    launchPriority: 30,
    ...liveLocalMetadata({
      riskTier: 'B',
      reviewCadenceDays: 90,
      method: config.method,
      lastVerified: FINANCE_TOOL_LAST_REVIEWED,
      lifecycle: 'beta',
      reviewerRole: 'Finance-method review',
      reviewerStatus: 'pending',
      capabilities: ['download-csv'],
    }),
    inputSchema: financeCalculatorInputSchema,
    defaultValues,
    validate: (input) => validateFinanceCalculatorInput(config.kind, input),
    calculate: (input) => calculateFinance(config.kind, input),
    renderResult: (result) => result.headline.value,
    sources: config.sources,
    limitations: config.limitations,
    lastReviewed: FINANCE_TOOL_LAST_REVIEWED,
    seo: {
      title: config.seoTitle,
      description: config.seoDescription,
      keywords: [...config.searchTerms],
    },
    relatedToolIds: config.relatedToolIds,
    analyticsPolicy: sharedAnalyticsPolicy,
    howToUse: financeCalculatorFields[config.kind].map((field) =>
      field.type === 'textarea'
        ? `Enter ${field.label.toLowerCase()} using the format shown below the field.`
        : `Enter ${field.label.toLowerCase()} using the same currency and period assumptions as the other fields.`,
    ),
    formula: config.formula,
    workedExample: config.workedExample,
    resultInterpretation: config.resultInterpretation,
    edgeCases: config.edgeCases,
    faqs: config.faqs,
    privacyNote: sharedPrivacyNote,
    disclaimer:
      'This is an educational calculation and not accounting, investment, tax, legal or lending advice. Verify terms, rates, tax treatment and product documents with the relevant institution or a qualified professional.',
  };
}

export const emiTool = createFinanceTool({
  kind: 'emi',
  id: 'emi-calculator',
  slug: 'emi-calculator',
  name: 'EMI Calculator',
  shortName: 'EMI',
  toolKind: 'calculator',
  tags: ['emi', 'loan', 'amortization', 'interest'],
  searchTerms: ['equated monthly instalment', 'loan emi', 'loan repayment', 'amortization schedule'],
  summary: 'Estimate monthly EMI, interest, total cost and an optional user-entered rate-reset scenario.',
  method:
    'Fixed-rate amortization with decimal arithmetic, optional processing fee and an explicitly labelled reset scenario.',
  formula:
    'EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where r is the monthly rate and n is the number of months.',
  workedExample:
    'A ₹10,00,000 loan at 10% annual interest for 60 months produces an EMI of approximately ₹21,247.04 before fees.',
  resultInterpretation:
    'The EMI is a payment illustration under the exact rate and tenure assumptions you entered.',
  limitations: [
    'The standard view assumes a fixed annual rate. The optional reset view keeps the remaining tenure unchanged and uses only your supplied reset rate.',
    'Processing, prepayment, insurance, taxes and lender-specific charges are not discovered or classified automatically.',
  ],
  edgeCases: [
    'Zero interest is handled as principal divided by the number of months.',
    'Reset assumptions must be supplied as a pair and the reset month must be before the final month.',
  ],
  faqs: [
    {
      question: 'Does this fetch current bank rates?',
      answer:
        'No. Enter the rate from your own product documents. The tool intentionally does not rank lenders or import live offers.',
    },
    {
      question: 'What does the reset scenario mean?',
      answer:
        'It illustrates a user-entered new rate at a selected month while keeping the original end date. Actual lender policies can differ.',
    },
  ],
  relatedToolIds: ['loan-comparison', 'cagr-calculator'],
  seoTitle: 'EMI Calculator for India | KarobarKit',
  seoDescription:
    'Calculate EMI, total interest and total loan cost with a transparent fixed-rate amortization model.',
  sources: [financeMethodSource, rbiEmiSource],
});

export const sipTool = createFinanceTool({
  kind: 'sip',
  id: 'sip-calculator',
  slug: 'sip-calculator',
  name: 'SIP Calculator',
  shortName: 'SIP',
  toolKind: 'calculator',
  tags: ['sip', 'investment', 'future value', 'returns'],
  searchTerms: ['systematic investment plan', 'monthly investment calculator', 'sip maturity value'],
  summary:
    'Illustrate SIP future value from a monthly contribution, timing, period and user-entered expected return.',
  method:
    'Periodic-contribution future-value illustration with explicit end-of-month or beginning-of-month timing.',
  formula:
    'FV = contribution × (((1 + monthly rate)^months − 1) ÷ monthly rate), adjusted by one period for beginning-of-month contributions.',
  workedExample:
    '₹10,000 contributed monthly for 12 months at a 12% assumed annual return illustrates approximately ₹1,26,825 at month-end timing.',
  resultInterpretation:
    'The result is an assumption-led illustration. It is not a promised return, recommendation or prediction.',
  limitations: [
    'Expected return, contribution timing and duration are supplied by the user; the tool does not import market data.',
    'Taxes, inflation, fees, volatility and changes in contribution are outside this first version.',
  ],
  edgeCases: [
    'A zero expected return produces total contributions as the future value.',
    'Expected return can be negative down to −99.99% for a mathematically valid illustration.',
  ],
  faqs: [
    {
      question: 'Is the SIP result guaranteed?',
      answer:
        'No. It is a mathematical illustration using your expected-return assumption. Actual market performance can be higher or lower.',
    },
    {
      question: 'Why does timing change the result?',
      answer:
        'Beginning-of-month contributions receive one additional compounding period compared with end-of-month contributions.',
    },
  ],
  relatedToolIds: ['cagr-calculator', 'xirr-calculator'],
  seoTitle: 'SIP Calculator for India | KarobarKit',
  seoDescription:
    'Illustrate SIP future value from monthly contributions, timing and a user-entered expected return.',
  sources: [financeMethodSource, sebiSipSource],
});

export const fdTool = createFinanceTool({
  kind: 'fd',
  id: 'fd-calculator',
  slug: 'fd-calculator',
  name: 'FD Calculator',
  shortName: 'FD',
  toolKind: 'calculator',
  tags: ['fixed deposit', 'fd', 'maturity', 'compounding'],
  searchTerms: ['fixed deposit calculator', 'fd maturity calculator', 'compound interest deposit'],
  summary:
    'Calculate fixed-deposit maturity and interest from principal, rate, tenure and declared compounding frequency.',
  method: 'Nominal annual rate compounded at the user-selected frequency with decimal arithmetic.',
  formula:
    'Maturity = principal × (1 + annual rate ÷ compounding frequency)^(compounding frequency × years).',
  workedExample:
    'A ₹1,00,000 deposit at 7% compounded quarterly for 12 months produces a maturity value of approximately ₹1,07,185.90.',
  resultInterpretation:
    'The maturity is an arithmetic illustration using the declared rate and frequency, not a bank quote.',
  limitations: [
    'The bank or product must confirm its day-count, compounding, tax, TDS and premature-closure rules.',
    'No current deposit rate is imported and no product recommendation is made.',
  ],
  edgeCases: [
    'Zero interest leaves maturity equal to principal.',
    'The selected frequency must be annual, half-yearly, quarterly or monthly.',
  ],
  faqs: [
    {
      question: 'Does this include TDS or tax?',
      answer:
        'No. Tax and TDS depend on the product and your circumstances and are intentionally outside this arithmetic model.',
    },
    {
      question: 'Can I use a bank’s advertised rate?',
      answer:
        'Yes, as your own assumption after checking the bank’s current product terms and eligibility conditions.',
    },
  ],
  relatedToolIds: ['cagr-calculator', 'xirr-calculator'],
  seoTitle: 'FD Calculator for India | KarobarKit',
  seoDescription:
    'Calculate fixed-deposit maturity and interest from principal, rate, tenure and compounding frequency.',
  sources: [financeMethodSource],
});

export const xirrTool = createFinanceTool({
  kind: 'xirr',
  id: 'xirr-calculator',
  slug: 'xirr-calculator',
  name: 'XIRR Calculator',
  shortName: 'XIRR',
  toolKind: 'calculator',
  tags: ['xirr', 'cash flows', 'annualized return', 'dated returns'],
  searchTerms: [
    'extended internal rate of return',
    'dated cash flow return',
    'excel xirr',
    'irregular investment returns',
  ],
  summary:
    'Solve an annualized return for irregularly dated cash flows with explicit sign and convergence checks.',
  method:
    'Dated discounted-cash-flow root solving using a bounded Newton hint and deterministic bisection fallback.',
  formula:
    'XNPV(rate) = Σ cash flow ÷ (1 + rate)^((date − first date) ÷ 365); XIRR is the rate where XNPV = 0.',
  workedExample:
    'Investing ₹1,00,000 on 1 January and receiving ₹1,10,000 one year later produces an XIRR close to 10%.',
  resultInterpretation:
    'XIRR annualizes the dated cash-flow sequence you enter; it does not judge whether the result is good or suitable.',
  limitations: [
    'At least one negative and one positive cash flow are required. Dates and amounts must be entered exactly as recorded.',
    'Multiple roots or unusual cash-flow patterns can make interpretation difficult; the tool reports no-solution or non-convergence errors instead of guessing.',
  ],
  edgeCases: [
    'A one-year pair of equal-and-opposite cash flows is a useful cross-check fixture.',
    'Cash flows with no valid sign change cannot produce a meaningful XIRR in this model.',
  ],
  faqs: [
    {
      question: 'Why do dates matter for XIRR?',
      answer:
        'Each cash flow is discounted for its actual number of days from the first date, so irregular timing changes the annualized result.',
    },
    {
      question: 'What happens if the solver cannot find a rate?',
      answer:
        'The tool returns a clear validation error. It does not silently replace the cash flows or return a guessed number.',
    },
  ],
  relatedToolIds: ['sip-calculator', 'cagr-calculator', 'roi-calculator'],
  seoTitle: 'XIRR Calculator for India | KarobarKit',
  seoDescription:
    'Calculate XIRR from irregularly dated cash flows with explicit validation and convergence boundaries.',
  sources: [financeMethodSource],
});

export const loanComparisonTool = createFinanceTool({
  kind: 'loan-comparison',
  id: 'loan-comparison',
  slug: 'loan-comparison',
  name: 'Loan Comparison',
  shortName: 'Loan comparison',
  toolKind: 'comparison',
  tags: ['loan comparison', 'emi', 'total cost', 'fees'],
  searchTerms: ['compare loans', 'loan cost comparison', 'emi comparison', 'fixed floating loan'],
  summary:
    'Compare EMI, interest, fees and total cost for two user-entered loan scenarios without ranking lenders.',
  method:
    'Two independent EMI amortizations using user-entered nominal annual interest rates, with optional rate resets and processing or other/prepayment fees added to total cost.',
  formula:
    'Total cost = principal + amortization interest across the selected rate path + user-entered fees; compare the two totals and show each EMI. APR is not calculated because fee timing is not modelled.',
  workedExample:
    'Two ₹10,00,000 scenarios with the same 60-month term can be compared by EMI, interest, fees and total cost.',
  resultInterpretation:
    'The lower arithmetic total is only lower under the assumptions entered; eligibility, security, service and legal terms are not scored.',
  limitations: [
    'Option A and Option B are neutral labels, not lender rankings or recommendations.',
    'Prepayment or other fees are added as user-entered amounts; the optional reset view keeps the original term and does not simulate a principal prepayment schedule.',
    'The entered rate is nominal annual interest used for EMI arithmetic; this tool does not calculate an effective APR from net disbursal and dated cash flows.',
  ],
  edgeCases: [
    'Zero-rate loans are supported through principal divided by tenure.',
    'Equal totals are reported as a tie rather than using a false precision ranking.',
  ],
  faqs: [
    {
      question: 'Does the comparison identify the best bank?',
      answer:
        'No. It compares only the two assumptions you enter. Check current lender documents, eligibility and all charges separately.',
    },
    {
      question: 'Why is rate type shown separately?',
      answer:
        'A floating label signals that future resets may matter. You can add an optional reset month and rate to either scenario; actual lender policies can still differ.',
    },
  ],
  relatedToolIds: ['emi-calculator'],
  seoTitle: 'Loan Comparison Calculator for India | KarobarKit',
  seoDescription:
    'Compare EMI, interest, fees and total cost for two user-entered loan scenarios with transparent limits.',
  sources: [financeMethodSource, rbiEmiSource],
});

export const financeTools = [emiTool, sipTool, fdTool, xirrTool, loanComparisonTool] as const;
