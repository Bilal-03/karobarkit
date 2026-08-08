import {
  calculateRoi,
  roiInputSchema,
  type RoiInput,
  type RoiResult,
  validateRoiInput,
} from '@/domain/calculations/roi';
import { formatPercentage } from '@/domain/formatting/indian';
import type { ToolDefinition } from '../types';
import { TOOL_LAST_REVIEWED, liveLocalMetadata, roiSource, sharedAnalyticsPolicy } from '../shared';

export const roiTool: ToolDefinition<RoiInput, RoiResult> = {
  id: 'roi-calculator',
  slug: 'roi-calculator',
  kind: 'calculator',
  ui: { adapter: 'calculator', variant: 'roi' },
  name: 'ROI Calculator',
  shortName: 'ROI',
  category: 'business',
  categoryLabel: 'Business',
  secondaryCategories: ['finance'],
  tags: ['return', 'profit', 'loss', 'finance'],
  searchTerms: ['return on investment', 'investment return', 'profit percentage'],
  featured: true,
  launchPriority: 3,
  ...liveLocalMetadata({
    riskTier: 'B',
    reviewCadenceDays: 365,
    method: 'Deterministic basic ROI ratio using final value less investment cost.',
    lastVerified: TOOL_LAST_REVIEWED,
  }),
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
