import { formatIndianCurrency } from '@/domain/formatting/indian';
import {
  calculateGstTool,
  gstInputSchema,
  type GstInput,
  type GstResult,
  validateGstInput,
} from '@/domain/gst';
import {
  GST_POLICY_AS_OF,
  GST_UI_RATE_PRESET_IDS,
  getGstSourceReferences,
  validateGstUiPresetIds,
} from '@/domain/policies/gst';
import type { ToolDefinition } from '../types';
import { TOOL_LAST_REVIEWED, liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

const gstUiPolicyValidation = validateGstUiPresetIds(GST_UI_RATE_PRESET_IDS, GST_POLICY_AS_OF);
if (!gstUiPolicyValidation.success) {
  throw new Error('GST UI presets do not match the active GST policy.');
}

export const gstTool: ToolDefinition<GstInput, GstResult> = {
  id: 'gst-calculator',
  slug: 'gst-calculator',
  kind: 'calculator',
  ui: { adapter: 'gst-calculator' },
  name: 'GST Calculator',
  shortName: 'GST',
  category: 'gst-tax',
  categoryLabel: 'GST & Tax',
  secondaryCategories: ['business'],
  tags: ['gst', 'tax', 'cgst', 'sgst', 'igst'],
  searchTerms: ['gst calculator', 'tax calculator', 'inclusive gst', 'exclusive gst'],
  featured: true,
  launchPriority: 1,
  regulatory: true,
  ...liveLocalMetadata({
    riskTier: 'D',
    reviewCadenceDays: 180,
    policyDependencies: ['gst-general-rates-2025-09-22-v1'],
    method: 'Effective-dated GST arithmetic with explicit inclusive/exclusive and supply-split choices.',
    lastVerified: GST_POLICY_AS_OF,
    effectiveFrom: '2025-09-22',
    reviewerRole: 'Independent CA or tax reviewer',
    reviewerStatus: 'pending',
    capabilities: ['session-handoff'],
  }),
  summary: 'Calculate GST on an exclusive or inclusive amount with an explicit tax-component choice.',
  inputSchema: gstInputSchema,
  defaultValues: {
    amount: '1000',
    ratePresetId: 'gst-headline-rate-18',
    customRate: '',
    mode: 'exclusive',
    supplyType: 'unspecified',
  },
  validate: validateGstInput,
  calculate: calculateGstTool,
  renderResult: (result) => formatIndianCurrency(result.gstAmount),
  sources: getGstSourceReferences(),
  limitations: [
    'The 5% and 18% choices are source-backed headline presets, not a classification decision. The calculator does not determine whether they apply to a particular product or service.',
    'It does not determine taxability, HSN/SAC, exemption, reverse charge, input tax credit, compensation cess, registration, filing, export treatment or legal place of supply.',
    'Intra-state results use cautious “CGST + SGST/UTGST” wording because the calculator has no verified location model to choose State tax versus Union Territory tax.',
  ],
  disclaimer:
    'This is an educational arithmetic calculator, not tax advice or a filing determination. Verify the applicable notification, classification, supply type and transaction facts with official GST material or a qualified professional.',
  lastReviewed: TOOL_LAST_REVIEWED,
  seo: {
    title: 'GST Calculator for Indian Businesses | KarobarKit',
    description:
      'Calculate GST inclusive or exclusive amounts with source-backed headline presets, explicit supply-type allocation and transparent rounding.',
    keywords: [
      'gst calculator',
      'gst inclusive calculator',
      'gst exclusive calculator',
      'cgst sgst igst calculator',
    ],
  },
  relatedToolIds: ['roi-calculator', 'payment-receipt-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter a positive amount with up to two decimal places.',
    'Choose a source-backed headline rate or select a clearly labelled custom rate if you already know the rate to use.',
    'Choose whether the amount is GST exclusive or already GST inclusive, then select the tax split you need. The calculator does not infer place of supply.',
  ],
  formula:
    'Exclusive: GST = taxable value × rate ÷ 100. Inclusive: taxable value = total ÷ (1 + rate ÷ 100).',
  workedExample:
    'For a ₹1,000 exclusive amount at 18%, GST is ₹180.00 and the total is ₹1,180.00. This numeric example demonstrates the formula only; it does not classify a supply.',
  resultInterpretation:
    'The result shows arithmetic for the values selected. A source-backed preset does not mean that the rate is legally applicable to your product, service or transaction.',
  edgeCases: [
    'Amounts must be finite, positive, at most two decimal places and no more than ₹999,999,999,999,999.99.',
    'Custom rates allow 0% through 100% with at most two decimal places and always carry a user-responsibility warning.',
    'Currency values use half-up rounding. Intra-state components reconcile by assigning the rounded remainder to SGST/UTGST.',
  ],
  faqs: [
    {
      question: 'Does the calculator tell me which GST rate applies?',
      answer:
        'No. It offers two source-backed headline choices and a custom-rate option, but it does not classify products or services or recommend a rate.',
    },
    {
      question: 'Does intra-state always mean SGST rather than UTGST?',
      answer:
        'The calculator does not decide that. It labels the second component SGST/UTGST until a verified location model is added.',
    },
    {
      question: 'Are my amounts sent anywhere?',
      answer:
        'No. The calculation runs in this browser and financial inputs and results are excluded from analytics and logs.',
    },
  ],
  privacyNote:
    'The amount, rate choice, mode, supply type and calculated tax stay in this browser. They are not sent to analytics, a backend, a URL or a log.',
};
