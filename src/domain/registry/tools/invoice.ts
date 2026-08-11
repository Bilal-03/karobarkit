import { DOCUMENT_LAST_REVIEWED } from '@/domain/documents/constants';
import {
  calculateInvoice,
  invoiceDefaultValues,
  invoiceInputSchema,
  type InvoiceDocument,
  type InvoiceInput,
  validateInvoiceInput,
} from '@/domain/documents/invoice';

import type { ToolDefinition } from '../types';
import { documentPrivacyNote, documentSource, liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const invoiceTool: ToolDefinition<InvoiceInput, InvoiceDocument> = {
  id: 'invoice-generator',
  slug: 'invoice-generator',
  kind: 'generator',
  ui: { adapter: 'invoice-generator' },
  generatorKind: 'document',
  name: 'Invoice Generator',
  shortName: 'Invoice',
  category: 'generators',
  categoryLabel: 'Generators',
  secondaryCategories: ['business'],
  tags: ['invoice', 'bill', 'document', 'pdf'],
  searchTerms: ['invoice maker', 'bill generator', 'non gst invoice', 'invoice template'],
  featured: true,
  launchPriority: 1,
  ...liveLocalMetadata({
    riskTier: 'B',
    reviewCadenceDays: 365,
    method:
      'Deterministic line-item arithmetic and controlled A4 document templates; GST classification and tax arithmetic are intentionally outside this tool.',
    lastVerified: DOCUMENT_LAST_REVIEWED,
    capabilities: ['download-pdf', 'print-a4'],
  }),
  summary: 'Create a private A4 invoice with item totals, payment terms and explicit non-GST draft language.',
  inputSchema: invoiceInputSchema,
  defaultValues: invoiceDefaultValues,
  validate: validateInvoiceInput,
  calculate: calculateInvoice,
  renderResult: (result) => result.totals.amountInWords,
  sources: [documentSource],
  limitations: [
    'This is a commercial invoice draft; it does not calculate GST, establish tax treatment or replace a GST tax invoice where one is required.',
    'The tool does not verify business, customer or payment details and does not issue, submit or deliver an invoice.',
    'All values remain in memory in this browser. Receipt and UPI handoffs are opt-in and use session storage only.',
  ],
  lastReviewed: DOCUMENT_LAST_REVIEWED,
  seo: {
    title: 'Invoice Generator for Indian Businesses | KarobarKit',
    description:
      'Create a private A4 invoice draft with item totals, payment terms and clear non-GST limitations.',
    keywords: ['invoice generator', 'bill maker', 'invoice template India'],
  },
  relatedToolIds: ['quotation-generator', 'gst-invoice-generator', 'payment-receipt-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter the business and customer details, invoice number, date and optional due date.',
    'Add each item with quantity, unit price and any clearly labelled discount.',
    'Review the local draft, download or print the A4 invoice, and use the optional receipt or UPI handoff only after confirming the payment facts.',
  ],
  formula:
    'Line gross = quantity × unit price; line subtotal = line gross − line discount; invoice subtotal = sum of line subtotals.',
  workedExample:
    'Two units at ₹1,000 each with a ₹100 line discount produce an invoice subtotal of ₹1,900 before any tax treatment.',
  resultInterpretation:
    'The total is a commercial amount calculated from the entered values. It does not determine GST registration, classification or tax liability.',
  edgeCases: [
    'Quantity and unit price use bounded decimal arithmetic with currency rounding to two decimal places.',
    'Discounts cannot make a line subtotal zero or negative.',
    'Invoice numbers are display identifiers only; cross-device uniqueness is not claimed.',
  ],
  faqs: [
    {
      question: 'Is this a GST tax invoice?',
      answer:
        'No. This tool creates a commercial invoice draft without GST calculation. Use the GST Invoice Generator when your transaction requires a tax invoice, after reviewing the applicable rules.',
    },
    {
      question: 'Can I create a payment receipt from this invoice?',
      answer:
        'Yes. Use the explicit local handoff after preview. It copies selected fields into the receipt form for review; it does not confirm that payment was received.',
    },
  ],
  privacyNote: documentPrivacyNote,
};
