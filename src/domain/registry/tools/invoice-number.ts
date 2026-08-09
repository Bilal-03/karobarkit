import { DOCUMENT_LAST_REVIEWED } from '@/domain/documents/constants';
import {
  createInvoiceNumber,
  invoiceNumberDefaultValues,
  invoiceNumberInputSchema,
  type InvoiceNumberInput,
  type InvoiceNumberResult,
  validateInvoiceNumberInput,
} from '@/domain/documents/sequence';

import type { ToolDefinition } from '../types';
import { documentPrivacyNote, documentSource, liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const invoiceNumberTool: ToolDefinition<InvoiceNumberInput, InvoiceNumberResult> = {
  id: 'invoice-number-generator',
  slug: 'invoice-number-generator',
  kind: 'generator',
  ui: { adapter: 'invoice-number-generator' },
  generatorKind: 'sequence',
  name: 'Invoice Number Generator',
  shortName: 'Invoice Number',
  category: 'generators',
  categoryLabel: 'Generators',
  secondaryCategories: ['business'],
  tags: ['invoice number', 'sequence', 'billing'],
  searchTerms: ['invoice number format', 'invoice serial number', 'bill number generator'],
  featured: false,
  launchPriority: 8,
  ...liveLocalMetadata({
    riskTier: 'B',
    reviewCadenceDays: 365,
    method: 'Deterministic formatting of a user-supplied prefix, financial year and sequence number.',
    lastVerified: DOCUMENT_LAST_REVIEWED,
  }),
  summary:
    'Preview a consistent invoice number format without claiming reservation or cross-device uniqueness.',
  inputSchema: invoiceNumberInputSchema,
  defaultValues: invoiceNumberDefaultValues,
  validate: validateInvoiceNumberInput,
  calculate: createInvoiceNumber,
  renderResult: (result) => result.value,
  sources: [documentSource],
  limitations: [
    'The tool formats a number; it does not reserve, persist or synchronize sequences across users, devices or accounting systems.',
    'Number format should be checked against your records and applicable invoicing process before use.',
  ],
  lastReviewed: DOCUMENT_LAST_REVIEWED,
  seo: {
    title: 'Invoice Number Generator for Indian Businesses | KarobarKit',
    description: 'Preview a clear invoice numbering format with financial year and padded sequence controls.',
    keywords: ['invoice number generator', 'invoice serial number', 'bill number format'],
  },
  relatedToolIds: ['gst-invoice-generator', 'quotation-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Choose an optional prefix, financial year, starting sequence and padding width.',
    'Copy the preview into your own controlled records after checking for duplicates.',
    'Use the result as a display identifier in the invoice workflow; no number is reserved automatically.',
  ],
  formula: 'Formatted number = optional prefix + financial year + zero-padded user-supplied sequence.',
  workedExample: 'Prefix INV, financial year 2026-27, sequence 1 and padding 4 produce INV/2026-27/0001.',
  resultInterpretation:
    'The result is a deterministic formatting preview, not a globally unique invoice identifier.',
  edgeCases: [
    'Prefixes allow letters, numbers, underscores, hyphens and slashes only.',
    'Sequence values are whole positive integers and padding is limited to nine digits.',
    'The browser does not know whether a number already exists in your books.',
  ],
  faqs: [
    {
      question: 'Does this reserve the invoice number?',
      answer:
        'No. It only formats the values you enter. Keep the authoritative sequence in your accounting process.',
    },
  ],
  privacyNote: documentPrivacyNote,
};
