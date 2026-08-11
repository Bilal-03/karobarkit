import {
  calculateUpi,
  upiInputSchema,
  type UpiInput,
  type UpiResult,
  validateUpiInput,
} from '@/domain/qr/upi';
import { QR_LOCAL_PRIVACY_NOTE, UPI_OWNERSHIP_DISCLAIMER } from '@/lib/qr/privacy';
import type { ToolDefinition } from '../types';
import {
  TOOL_LAST_REVIEWED,
  liveLocalMetadata,
  qrStandardSource,
  sharedAnalyticsPolicy,
  upiSource,
} from '../shared';

export const upiStandeeTool: ToolDefinition<UpiInput, UpiResult> = {
  id: 'upi-standee-generator',
  slug: 'upi-standee',
  kind: 'generator',
  ui: { adapter: 'qr-generator', variant: 'upi-standee' },
  generatorKind: 'qr',
  name: 'UPI Standee Generator',
  shortName: 'UPI QR',
  category: 'generators',
  categoryLabel: 'Generators',
  secondaryCategories: [],
  tags: ['upi', 'qr', 'payment', 'standee'],
  searchTerms: ['upi qr', 'payment qr', 'upi standee', 'shop payment display'],
  featured: true,
  launchPriority: 5,
  ...liveLocalMetadata({
    riskTier: 'C',
    reviewCadenceDays: 180,
    method: 'Deterministic UPI deep-link construction and QR encoding; ownership is not verified.',
    lastVerified: TOOL_LAST_REVIEWED,
    reviewerRole: 'Payments workflow reviewer',
    reviewerStatus: 'pending',
    capabilities: ['qr-output', 'download-png', 'print-a4'],
  }),
  summary: 'Create a local, print-ready UPI payment QR standee with an optional fixed amount and note.',
  inputSchema: upiInputSchema,
  defaultValues: {
    payeeName: 'KarobarKit Demo',
    upiId: 'demo@upi',
    amount: '250',
    note: 'Sample payment',
  },
  validate: validateUpiInput,
  calculate: calculateUpi,
  renderResult: (result) => result.payload,
  sources: [qrStandardSource, upiSource],
  limitations: [
    'The tool constructs a standard UPI payment URI but does not verify ownership, activity, bank support or settlement.',
    'A UPI app and compatible bank account are required to complete a payment. Always verify the payee in the app before authorizing.',
    'The fixed amount limit is a QR payload safety guard, not a claim about UPI transaction limits.',
  ],
  lastReviewed: TOOL_LAST_REVIEWED,
  seo: {
    title: 'UPI Standee Generator for Indian Businesses | KarobarKit',
    description:
      'Generate a private, client-side UPI payment QR standee with safe URI encoding, optional amount, print layout and PNG download.',
    keywords: ['upi standee generator', 'upi qr code', 'payment qr standee'],
  },
  relatedToolIds: ['url-qr-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter the payee name and UPI ID exactly as you want users to see them.',
    'Optionally add a fixed INR amount and a short payment note.',
    'Generate the standee, scan-test it in a trusted UPI app, then download or print it.',
  ],
  formula: 'upi://pay?pa={UPI ID}&pn={payee name}&am={optional amount}&cu=INR&tn={optional note}',
  workedExample:
    'A payee name of Ravi & Sons and UPI ID ravi@bank become safely percent-encoded URI parameters before QR rendering.',
  resultInterpretation:
    'The QR code contains payment details for a UPI app to interpret. It does not initiate or confirm a payment by itself.',
  edgeCases: [
    'Payee name is required; UPI ID must use an ASCII name@handle format with supported punctuation.',
    'Fixed amounts must be greater than zero, use no more than two decimal places and stay within the QR safety bound.',
    `Payment notes are limited to ${80} characters and cannot contain line breaks or control characters.`,
  ],
  faqs: [
    {
      question: 'Does a valid-looking UPI ID guarantee that payments will work?',
      answer:
        'No. Syntax validation cannot verify account ownership, activity or bank support. Confirm the payee inside your UPI app.',
    },
    {
      question: 'Can I leave the amount blank?',
      answer: 'Yes. A blank amount lets the payer enter the amount in their UPI app if the app supports it.',
    },
  ],
  privacyNote: `${QR_LOCAL_PRIVACY_NOTE} ${UPI_OWNERSHIP_DISCLAIMER}`,
};
