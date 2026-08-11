import type { SourceReference } from '@/domain/registry/types';
import { GST_CUSTOM_RATE_ID, GST_POLICY_AS_OF, getActiveGstRatePresets } from '@/domain/policies/gst';

import type { GstInvoiceInput, InvoiceItemInput } from './types';

export const INVOICE_LAST_REVIEWED = GST_POLICY_AS_OF;
export const INVOICE_MAX_ITEMS = 50;
export const INVOICE_PAGE_ITEM_LIMIT = 8;
export const INVOICE_NUMBER_MAX_LENGTH = 16;
export const INVOICE_MAX_TEXT_LENGTH = 600;
export const INVOICE_MAX_DESCRIPTION_LENGTH = 240;
export const INVOICE_MAX_HSN_LENGTH = 20;
export const INVOICE_MAX_QUANTITY = '999999999999.999999';
export const INVOICE_MAX_UNIT_PRICE = '999999999999999.99';
export const INVOICE_MAX_DISCOUNT = '999999999999999.99';

export const invoiceSourceReferences: SourceReference[] = [
  {
    id: 'gst-cbic-rule-46-tax-invoice',
    title: 'Central Goods and Services Tax Rules · Rule 46 tax invoice particulars',
    publisher: 'Central Board of Indirect Taxes and Customs',
    url: 'https://cbic-gst.gov.in/pdf/01072020_CGST-Rules-2017-Part-A-Rules.pdf',
    lastChecked: INVOICE_LAST_REVIEWED,
    evidenceLevel: 'official',
    authority: 'CBIC',
    documentType: 'rule',
    referenceNumber: 'Rule 46',
    accessedOn: INVOICE_LAST_REVIEWED,
    notes:
      'The generator maps the standard Rule 46 fields it supports. Applicable HSN/SAC digits, special cases and signatures remain the issuer’s responsibility.',
    supports: ['tax invoice particulars', 'invoice number format', 'inter-State place of supply'],
  },
  {
    id: 'gst-cbic-rule-46-current-page',
    title: 'CBIC tax invoice, credit and debit note rules',
    publisher: 'Central Board of Indirect Taxes and Customs',
    url: 'https://cbic-gst.gov.in/gst-invoice-rules.html',
    lastChecked: INVOICE_LAST_REVIEWED,
    evidenceLevel: 'official',
    authority: 'CBIC',
    documentType: 'rule',
    referenceNumber: 'Tax invoice rules',
    accessedOn: INVOICE_LAST_REVIEWED,
    supports: ['tax invoice field overview', 'invoice special cases'],
  },
  {
    id: 'gst-cbic-circular-90-09-2019',
    title: 'Circular No. 90/09/2019-GST · place of supply on inter-State invoices',
    publisher: 'Central Board of Indirect Taxes and Customs',
    url: 'https://cbic-gst.gov.in/pdf/circular-cgst-90.pdf',
    lastChecked: INVOICE_LAST_REVIEWED,
    evidenceLevel: 'official',
    authority: 'CBIC',
    documentType: 'circular',
    referenceNumber: '90/09/2019-GST',
    publishedOn: '2019-02-18',
    accessedOn: INVOICE_LAST_REVIEWED,
    supports: ['inter-State place of supply display'],
  },
  {
    id: 'gst-cbic-cgst-act-section-31',
    title: 'Central Goods and Services Tax Act · Section 31 tax invoice',
    publisher: 'Central Board of Indirect Taxes and Customs',
    url: 'https://cbic-gst.gov.in/hindi/CGST-bill-e.html',
    lastChecked: INVOICE_LAST_REVIEWED,
    evidenceLevel: 'official',
    authority: 'CBIC',
    documentType: 'rule',
    referenceNumber: 'Section 31',
    accessedOn: INVOICE_LAST_REVIEWED,
    supports: ['tax invoice context', 'bill of supply distinction'],
  },
];

export const invoiceDefaultItem: InvoiceItemInput = {
  id: 'item-1',
  description: 'Sample service',
  hsnOrSac: '',
  quantity: '1',
  unit: 'unit',
  unitPrice: '1000',
  discountType: 'none',
  discountValue: '',
  ratePresetId: 'gst-headline-rate-18',
  customRate: '',
};

export function getInvoiceRateOptions(asOf = GST_POLICY_AS_OF) {
  try {
    return getActiveGstRatePresets(asOf);
  } catch {
    return [];
  }
}

export const invoiceDefaultValues: GstInvoiceInput = {
  invoiceNumber: 'GST-2026-001',
  invoiceDate: INVOICE_LAST_REVIEWED,
  dueDate: '2026-08-23',
  supplier: {
    legalName: 'KarobarKit Demo',
    tradeName: 'KarobarKit',
    gstin: '27ABCDE1234F1Z5',
    address: {
      line1: 'India',
      line2: '',
      city: 'Mumbai',
      district: '',
      state: 'Maharashtra',
      stateCode: '27',
      postalCode: '400001',
      country: 'India',
    },
    phone: '+91 9876543210',
    email: 'hello@example.com',
  },
  recipient: {
    legalName: 'Sample customer',
    tradeName: '',
    gstin: '27AAAAA0000A1Z5',
    address: {
      line1: 'India',
      line2: '',
      city: 'Mumbai',
      district: '',
      state: 'Maharashtra',
      stateCode: '27',
      postalCode: '400002',
      country: 'India',
    },
    phone: '+91 9000000000',
    email: 'customer@example.com',
  },
  recipientRegistrationStatus: 'registered',
  supplyType: 'intra-state',
  placeOfSupply: { state: 'Maharashtra', stateCode: '27' },
  reverseCharge: false,
  items: [{ ...invoiceDefaultItem }],
  notes: 'This is an illustrative GST invoice preview.',
  terms: 'Verify classification and tax treatment before issue.',
  paymentDetails: 'UPI: demo@upi',
  logo: null,
};

export const invoiceCustomRateOption = { value: GST_CUSTOM_RATE_ID, label: 'Custom rate · user supplied' };
