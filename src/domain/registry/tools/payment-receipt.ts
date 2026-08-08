import { DOCUMENT_LAST_REVIEWED } from '@/domain/documents/constants';
import {
  calculatePaymentReceipt,
  paymentReceiptDefaultValues,
  paymentReceiptInputSchema,
  type PaymentReceiptDocument,
  type PaymentReceiptInput,
  validatePaymentReceiptInput,
} from '@/domain/documents/payment-receipt';
import type { ToolDefinition } from '../types';
import { documentPrivacyNote, documentSource, liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const paymentReceiptTool: ToolDefinition<PaymentReceiptInput, PaymentReceiptDocument> = {
  id: 'payment-receipt-generator',
  slug: 'payment-receipt-generator',
  kind: 'generator',
  ui: { adapter: 'document-generator', variant: 'payment-receipt' },
  generatorKind: 'document',
  name: 'Payment Receipt Generator',
  shortName: 'Payment Receipt',
  category: 'generators',
  categoryLabel: 'Generators',
  secondaryCategories: ['business'],
  tags: ['receipt', 'payment', 'document', 'pdf'],
  searchTerms: ['payment receipt', 'receipt maker', 'payment acknowledgement', 'money receipt'],
  featured: true,
  launchPriority: 4,
  ...liveLocalMetadata({
    riskTier: 'C',
    reviewCadenceDays: 365,
    method: 'Deterministic payment acknowledgement document and Indian amount-to-words conversion.',
    lastVerified: DOCUMENT_LAST_REVIEWED,
    reviewerRole: 'Business document reviewer',
    reviewerStatus: 'pending',
  }),
  summary: 'Create a clear A4 acknowledgement of a declared payment without an account or server storage.',
  inputSchema: paymentReceiptInputSchema,
  defaultValues: paymentReceiptDefaultValues,
  validate: validatePaymentReceiptInput,
  calculate: calculatePaymentReceipt,
  renderResult: (result) => result.monetaryValue.formatted,
  sources: [documentSource],
  limitations: [
    'This is an acknowledgement created from information you enter. It is not bank confirmation, proof of settlement, a government receipt or a GST tax invoice.',
    'The tool never contacts a bank, UPI app, card network or payment gateway. Independently verify settlement.',
    'Amount-to-words supports positive INR values up to ₹99,99,99,99,99,99,999.99 with a maximum of two decimal places.',
  ],
  lastReviewed: DOCUMENT_LAST_REVIEWED,
  seo: {
    title: 'Payment Receipt Generator for Indian Businesses | KarobarKit',
    description:
      'Create a private A4 payment acknowledgement with amount in Indian words, optional payment details, print preview and local PDF download.',
    keywords: ['payment receipt generator', 'receipt maker', 'payment acknowledgement'],
  },
  relatedToolIds: ['letterhead-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter a receipt number, local receipt date, payer name, positive amount and payment purpose.',
    'Optionally add issuer identity, payment method, references, a logo and signature placeholder.',
    'Review the amount in figures and words, then download the A4 PDF or print after checking settlement independently.',
  ],
  formula: 'Amount in words = deterministic Indian numbering conversion of the entered rupees and paise.',
  workedExample:
    '₹1,250.50 is displayed as ₹1,250.50 and “One Thousand Two Hundred Fifty Rupees and Fifty Paise Only.”',
  resultInterpretation:
    'The receipt records what the issuer declares was received. It does not prove that a financial transaction settled.',
  edgeCases: [
    'Receipt numbers allow letters, numbers, spaces, hyphens and slashes; global uniqueness is not claimed.',
    'Dates are validated as local calendar dates and formatted without timezone shifting.',
    'NaN, infinity, zero, negative values, excessive precision and unsupported large values are rejected.',
  ],
  faqs: [
    {
      question: 'Can this receipt be used as bank confirmation?',
      answer: 'No. It is a user-created acknowledgement. Check the relevant bank or payment app separately.',
    },
    {
      question: 'Does it create a GST tax invoice?',
      answer:
        'No. GST invoicing is outside this milestone and the receipt is explicitly not a GST tax invoice.',
    },
  ],
  privacyNote: documentPrivacyNote,
};
