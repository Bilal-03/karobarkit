import { formatPercentage } from '@/domain/formatting/indian';

import {
  calculateCagr,
  cagrInputSchema,
  type CagrInput,
  type CagrResult,
  validateCagrInput,
} from '../calculations/cagr';
import {
  calculateRoi,
  roiInputSchema,
  type RoiInput,
  type RoiResult,
  validateRoiInput,
} from '../calculations/roi';
import { defaultPolicyContext } from '../policies/context';
import type { AnyToolDefinition, SourceReference, ToolDefinition } from './types';

export type { AnyToolDefinition, SourceReference, ToolDefinition } from './types';

export const TOOL_LAST_REVIEWED = '2026-08-06';

const cagrSource: SourceReference = {
  id: 'cagr-standard-financial-mathematics',
  title: 'Compound annual growth rate formula reference',
  publisher: 'Investopedia',
  url: 'https://www.investopedia.com/terms/c/cagr.asp',
  lastChecked: TOOL_LAST_REVIEWED,
  evidenceLevel: 'editorial',
};

const roiSource: SourceReference = {
  id: 'roi-standard-financial-ratio',
  title: 'Return on investment definition and formula',
  publisher: 'Investopedia',
  url: 'https://www.investopedia.com/terms/r/returnoninvestment.asp',
  lastChecked: TOOL_LAST_REVIEWED,
  evidenceLevel: 'editorial',
};

const sharedAnalyticsPolicy = {
  allowedEvents: [
    'tool_viewed',
    'tool_started',
    'tool_completed',
    'tool_validation_failed',
    'result_generated',
    'related_tool_opened',
  ],
  forbiddenProperties: [
    'beginningValue',
    'endingValue',
    'years',
    'investmentCost',
    'finalValue',
    'profit',
    'percentage',
    'amount',
    'result',
    'rawInput',
  ],
};

export const cagrTool: ToolDefinition<CagrInput, CagrResult> = {
  id: 'cagr-calculator',
  slug: 'cagr-calculator',
  name: 'CAGR Calculator',
  category: 'financial-calculators',
  categoryLabel: 'Financial calculations',
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

export const roiTool: ToolDefinition<RoiInput, RoiResult> = {
  id: 'roi-calculator',
  slug: 'roi-calculator',
  name: 'ROI Calculator',
  category: 'financial-calculators',
  categoryLabel: 'Financial calculations',
  summary: 'Compare an investment cost with its final value to see profit, loss and basic ROI.',
  inputSchema: roiInputSchema,
  defaultValues: { investmentCost: '100000', finalValue: '125000' },
  validate: validateRoiInput,
  calculate: calculateRoi,
  renderResult: (result) => formatPercentage(result.percentage),
  sources: [roiSource],
  limitations: [
    'Basic ROI does not account for time, compounding, taxes, fees, inflation or interim cash flows.',
    'Final value is the amount received or valued at the end—not the profit. Profit is calculated as final value minus investment cost.',
  ],
  lastReviewed: TOOL_LAST_REVIEWED,
  seo: {
    title: 'ROI Calculator for Indian Businesses | KarobarKit',
    description:
      'Calculate profit or loss and basic return on investment from cost and final value with an explicit formula and limitations.',
    keywords: ['roi calculator', 'return on investment', 'profit calculator'],
  },
  relatedToolIds: ['cagr-calculator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter the total investment cost.',
    'Enter the final value received or estimated at the end. This is not the profit field.',
    'Select Calculate to see the rupee profit or loss and the basic ROI percentage.',
  ],
  formula: 'ROI = (final value − investment cost) ÷ investment cost × 100',
  workedExample:
    'An investment cost of ₹1,00,000 with a final value of ₹1,25,000 produces ₹25,000 profit and 25.00% ROI.',
  resultInterpretation:
    'A positive ROI means the final value is above the original cost. A negative ROI means the final value is below the original cost.',
  edgeCases: [
    'Investment cost must be greater than zero because zero would make the percentage undefined.',
    'A final value of zero represents a complete loss. Negative final values are not accepted in this model.',
  ],
  faqs: [
    {
      question: 'Is the final value the same as gain?',
      answer: 'No. Enter the complete final value. The tool subtracts the cost to calculate profit or loss.',
    },
    {
      question: 'Does ROI tell me whether an investment was good over time?',
      answer:
        'Only partly. Basic ROI ignores time, so use CAGR or a cash-flow analysis when duration matters.',
    },
  ],
  privacyNote:
    'Inputs stay in this browser. Financial values are not sent to analytics or stored on a server.',
};

export const toolRegistry = [cagrTool, roiTool] as const;

export const categoryRegistry = [
  {
    id: 'financial-calculators',
    slug: 'financial-calculators',
    name: 'Financial calculations',
    description: 'Understand growth and returns with formulas that show their work.',
  },
] as const;

export function getToolBySlug(slug: string) {
  return toolRegistry.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: string) {
  return toolRegistry.filter((tool) => tool.category === category);
}

export function getRelatedTools(tool: Pick<AnyToolDefinition, 'relatedToolIds'>) {
  return tool.relatedToolIds
    .map((relatedId) => toolRegistry.find((candidate) => candidate.id === relatedId))
    .filter((related): related is (typeof toolRegistry)[number] => Boolean(related));
}

export function getToolResult<TInput, TResult>(
  tool: import('./types').ToolDefinition<TInput, TResult>,
  input: TInput,
) {
  const validation = tool.validate(input);
  if (!validation.success) {
    return validation;
  }

  return {
    success: true as const,
    result: tool.calculate(validation.data, defaultPolicyContext),
  };
}
