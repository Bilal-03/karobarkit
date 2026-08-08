import { INVOICE_LAST_REVIEWED } from '@/domain/invoices/constants';
import {
  calculateGstInvoice,
  gstInvoiceInputSchema,
  invoiceDefaultValues,
  invoiceSourceReferences,
  type GstInvoiceDocument,
  type GstInvoiceInput,
  validateGstInvoiceInput,
} from '@/domain/invoices';
import { getGstSourceReferences } from '@/domain/policies/gst';
import type { ToolDefinition } from '../types';
import { liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const gstInvoiceTool: ToolDefinition<GstInvoiceInput, GstInvoiceDocument> = {
  id: 'gst-invoice-generator',
  slug: 'gst-invoice-generator',
  kind: 'generator',
  ui: { adapter: 'gst-invoice-generator' },
  generatorKind: 'document',
  name: 'GST Invoice Generator',
  shortName: 'GST Invoice',
  category: 'generators',
  categoryLabel: 'Generators',
  secondaryCategories: ['gst-tax'],
  tags: ['gst', 'invoice', 'tax invoice', 'billing', 'pdf'],
  searchTerms: ['gst invoice', 'gst bill', 'tax invoice', 'invoice maker', 'bill generator'],
  featured: true,
  launchPriority: 1,
  regulatory: true,
  ...liveLocalMetadata({
    riskTier: 'D',
    reviewCadenceDays: 180,
    policyDependencies: ['gst-general-rates-2025-09-22-v1', 'cgst-rule-46-invoice-particulars'],
    method: 'Deterministic line-item invoice arithmetic using the effective-dated GST policy package.',
    lastVerified: INVOICE_LAST_REVIEWED,
    effectiveFrom: '2025-09-22',
    reviewerRole: 'Independent CA or tax reviewer',
    reviewerStatus: 'pending',
  }),
  summary:
    'Prepare a private A4 GST tax invoice draft with source-backed rate choices and reconciled totals.',
  inputSchema: gstInvoiceInputSchema,
  defaultValues: invoiceDefaultValues,
  validate: validateGstInvoiceInput,
  calculate: calculateGstInvoice,
  renderResult: (result) => result.totals.amountInWords,
  sources: [...invoiceSourceReferences, ...getGstSourceReferences()],
  limitations: [
    'This is a standard tax-invoice draft workflow. It does not claim that the output is legally compliant for every transaction or taxpayer.',
    'The generator does not determine classification, HSN/SAC, exemption, applicable GST rate, place of supply, CGST versus UTGST, reverse-charge applicability, ITC, registration, filing, e-invoicing, IRN or tax advice.',
    'GSTIN validation is structural only. The tool does not verify existence, ownership, registration status or recipient identity.',
    'HSN/SAC, tax rate, supply type, place of supply and reverse-charge marking are user-supplied choices. Review official rules and transaction facts before issue.',
    'Drafts remain in memory and are cleared on refresh. PDF export depends on browser font loading; Print → Save as PDF is the fallback for unsupported characters.',
  ],
  disclaimer:
    'Review this locally generated draft against the applicable CGST/SGST/UTGST/IGST rules, invoice particulars, classification, rate notifications and your records before issue. It is not an e-invoice, IRN, filing record or professional tax advice.',
  lastReviewed: INVOICE_LAST_REVIEWED,
  seo: {
    title: 'GST Invoice Generator for Indian Businesses | KarobarKit',
    description:
      'Create a private A4 GST tax invoice draft with line-item GST calculations, source-backed rate presets, PDF download and print preview.',
    keywords: ['gst invoice generator', 'gst tax invoice', 'invoice maker india', 'a4 gst invoice'],
  },
  relatedToolIds: ['gst-calculator', 'payment-receipt-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter supplier and recipient particulars from your records, then explicitly choose the supply type and inter-State place of supply where applicable.',
    'Add each line with a pre-GST unit price, quantity, optional issuer-supplied HSN/SAC and a reviewed rate preset or clearly marked custom rate.',
    'Review rounded line values, tax groups, totals, warnings and A4 page breaks before downloading or printing the draft.',
  ],
  formula:
    'Gross line value = quantity × pre-GST unit price; taxable value = gross value − line discount; GST = taxable value × selected rate ÷ 100; line total = taxable value + GST.',
  workedExample:
    'Two units at ₹1,000 each at 18% for an intra-State supply produce ₹2,000 taxable value, ₹180 CGST, ₹180 SGST/UTGST and ₹2,360 total.',
  resultInterpretation:
    'Totals are deterministic arithmetic from the values and tax choices entered. They do not establish that a rate, classification, place of supply or invoice treatment is legally applicable.',
  edgeCases: [
    'Currency inputs allow at most two decimal places; quantities allow up to six decimal places. NaN, Infinity, negative values, unsafe precision and impractical totals are rejected.',
    'Line discounts must be nonnegative and leave a positive taxable value. Invoice-level discounts and unmodelled additional charges are not supported.',
    'An invoice date must be covered by a reviewed GST policy bundle. Dates before the current bundle’s effective date are rejected rather than assigned an invented rate.',
    'The PDF filename contains only a sanitized invoice number and date; it never contains GSTIN, customer data or amounts.',
  ],
  faqs: [
    {
      question: 'Does this create a legally compliant GST invoice?',
      answer:
        'It creates an A4 draft containing the supported Rule 46-style fields. You must verify classification, HSN/SAC, rate, place of supply, reverse charge, e-invoice applicability and all transaction facts before issue.',
    },
    {
      question: 'Does it check whether a GSTIN is active or belongs to the party?',
      answer:
        'No. Only the structure of the entered GSTIN is checked locally; existence and ownership are never verified.',
    },
    {
      question: 'Are invoice drafts saved?',
      answer:
        'No. Drafts are held in memory for the current page session and are cleared when the page is refreshed or closed.',
    },
  ],
  privacyNote:
    'Supplier, recipient, line-item, tax and payment details are processed in memory in this browser only. They are not sent to a backend, stored by default, included in analytics or written to logs.',
};
