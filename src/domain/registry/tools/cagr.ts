import {
  calculateCagr,
  cagrInputSchema,
  type CagrInput,
  type CagrResult,
  validateCagrInput,
} from '@/domain/calculations/cagr';
import { formatPercentage } from '@/domain/formatting/indian';
import type { ToolDefinition } from '../types';
import { TOOL_LAST_REVIEWED, cagrSource, liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const cagrTool: ToolDefinition<CagrInput, CagrResult> = {
  id: 'cagr-calculator',
  slug: 'cagr-calculator',
  kind: 'calculator',
  ui: { adapter: 'calculator', variant: 'cagr' },
  name: 'CAGR Calculator',
  shortName: 'CAGR',
  category: 'finance',
  categoryLabel: 'Finance',
  secondaryCategories: [],
  tags: ['growth', 'finance', 'percentage'],
  searchTerms: ['compound annual growth rate', 'annual growth', 'growth rate', 'returns over time'],
  featured: true,
  launchPriority: 2,
  ...liveLocalMetadata({
    riskTier: 'B',
    reviewCadenceDays: 365,
    method: 'Deterministic compound annual growth rate formula using decimal arithmetic.',
    lastVerified: TOOL_LAST_REVIEWED,
  }),
  summary: 'See the smoothed annual growth rate between two positive values over time.',
  inputSchema: cagrInputSchema,
  defaultValues: { beginningValue: '100000', endingValue: '161051', years: '5' },
  validate: validateCagrInput,
  calculate: calculateCagr,
  renderResult: (result) => formatPercentage(result.percentage),
  sources: [cagrSource],
  limitations: [
    'CAGR smooths the path between two values; it does not show year-by-year volatility or interim cash flows.',
    'The model requires positive beginning and ending values. It is not a substitute for a cash-flow or investment performance analysis.',
  ],
  lastReviewed: TOOL_LAST_REVIEWED,
  seo: {
    title: 'CAGR Calculator for Indian Businesses | KarobarKit',
    description:
      'Calculate compound annual growth rate from beginning value, ending value and duration with a clear formula and worked example.',
    keywords: ['cagr calculator', 'compound annual growth rate', 'business growth calculator'],
  },
  relatedToolIds: ['roi-calculator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter the starting value and the ending value in rupees or another consistent unit.',
    'Enter the number of years between those values.',
    'Select Calculate to see the annualized rate and an interpretation of the result.',
  ],
  formula: 'CAGR = (ending value ÷ beginning value)^(1 ÷ years) − 1',
  workedExample: '₹1,00,000 growing to ₹1,61,051 over 5 years produces a CAGR of approximately 10.00%.',
  resultInterpretation:
    'A positive result is the smoothed annual growth rate. A negative result indicates a smoothed decline across the period.',
  edgeCases: [
    'Zero or negative values cannot be used in this standard CAGR model because the ratio and fractional exponent are not defined for this use case.',
    'Very long periods and values with excessive precision are rejected to keep the calculation predictable and safe.',
  ],
  faqs: [
    {
      question: 'Does CAGR mean the value grew by the same amount every year?',
      answer: 'No. CAGR is a smoothed annual rate. Actual yearly performance may be uneven.',
    },
    {
      question: 'Can I enter a loss?',
      answer:
        'You can enter a lower positive ending value and receive a negative CAGR. Zero or negative values are outside this model.',
    },
  ],
  privacyNote:
    'Inputs stay in this browser. Financial values are not sent to analytics or stored on a server.',
};
