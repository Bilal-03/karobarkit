import { DOCUMENT_LAST_REVIEWED } from '@/domain/documents/constants';
import {
  calculateQuotation,
  quotationDefaultValues,
  quotationInputSchema,
  type QuotationDocument,
  type QuotationInput,
  validateQuotationInput,
} from '@/domain/documents/quotation';

import type { ToolDefinition } from '../types';
import { documentPrivacyNote, documentSource, liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const quotationTool: ToolDefinition<QuotationInput, QuotationDocument> = {
  id: 'quotation-generator',
  slug: 'quotation-generator',
  kind: 'generator',
  ui: { adapter: 'quotation-generator' },
  generatorKind: 'document',
  name: 'Quotation Generator',
  shortName: 'Quotation',
  category: 'generators',
  categoryLabel: 'Generators',
  secondaryCategories: ['business'],
  tags: ['quotation', 'estimate', 'document', 'pdf'],
  searchTerms: ['quotation maker', 'quote generator', 'estimate generator', 'business quotation'],
  featured: true,
  launchPriority: 2,
  ...liveLocalMetadata({
    riskTier: 'B',
    reviewCadenceDays: 365,
    method:
      'Deterministic line-item arithmetic and controlled A4 document templates; tax treatment is intentionally outside this tool.',
    lastVerified: DOCUMENT_LAST_REVIEWED,
  }),
  summary:
    'Create a private A4 quotation with transparent line totals, validity dates and an optional GST invoice handoff.',
  inputSchema: quotationInputSchema,
  defaultValues: quotationDefaultValues,
  validate: validateQuotationInput,
  calculate: calculateQuotation,
  renderResult: (result) => result.totals.amountInWords,
  sources: [documentSource],
  limitations: [
    'A quotation is an estimate and not a GST tax invoice, e-invoice, IRN, payment confirmation or guarantee of supply.',
    'The tool does not classify goods or services, determine GST, verify customer details or reserve quote numbers.',
    'All values remain in memory in this browser. A quote-to-invoice handoff is opt-in and uses session storage only.',
  ],
  lastReviewed: DOCUMENT_LAST_REVIEWED,
  seo: {
    title: 'Quotation Generator for Indian Businesses | KarobarKit',
    description:
      'Create a private A4 business quotation with line totals, validity dates and a local GST invoice handoff.',
    keywords: ['quotation generator', 'estimate maker', 'business quote template'],
  },
  relatedToolIds: ['gst-invoice-generator', 'payment-receipt-generator', 'invoice-number-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter the business and customer details, quote number, date and optional validity date.',
    'Add each item with quantity, unit price and any clearly labelled discount.',
    'Review the estimate, download or print the A4 draft, and hand off to the GST invoice workflow only after checking transaction facts.',
  ],
  formula:
    'Line gross = quantity × unit price; line subtotal = line gross − line discount; quoted subtotal = sum of line subtotals.',
  workedExample:
    'Two units at ₹1,000 each with a ₹100 line discount produce a quoted subtotal of ₹1,900 before any tax treatment.',
  resultInterpretation:
    'The total is an estimate from the entered commercial values. It does not establish taxability, classification or enforceability.',
  edgeCases: [
    'Quantity and unit price use bounded decimal arithmetic with currency rounding to two decimal places.',
    'Discounts cannot make a line subtotal zero or negative.',
    'Quote numbers are display identifiers only; cross-device uniqueness is not claimed.',
  ],
  faqs: [
    {
      question: 'Does a quotation include GST?',
      answer:
        'No. The quotation displays pre-tax commercial values. Use the separate GST invoice workflow after reviewing applicable rules.',
    },
    {
      question: 'Can I continue a quote into an invoice?',
      answer:
        'Yes. Choose the explicit local handoff button after preview. It copies selected fields into the GST invoice form for you to review; it does not issue an invoice automatically.',
    },
  ],
  privacyNote: documentPrivacyNote,
};
