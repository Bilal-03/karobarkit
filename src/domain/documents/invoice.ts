import { z } from 'zod';

import type { FieldError, ValidationResult } from '@/domain/calculations/types';
import { safeFilename } from '@/lib/security/safe-filename';

import { QUOTATION_MAX_TEXT_LENGTH, QUOTATION_NUMBER_MAX_LENGTH } from './constants';
import { DocumentInputError } from './errors';
import { formatDocumentDate } from './formatting';
import {
  addCommonDocumentIssues,
  commonDocumentSchema,
  isValidLocalDate,
  mapIssuesToFields,
  normalizeCommonDocumentInput,
} from './validation';
import {
  calculateQuotation,
  quotationDefaultItem,
  quotationInputSchema,
  validateQuotationInput,
} from './quotation';
import type { InvoiceDocument, QuotationInput } from './types';

export type { InvoiceDocument } from './types';

const invoiceNumberPattern = /^[\p{L}\p{N}][\p{L}\p{N}\s/-]*$/u;
const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);
const requiredText = (label: string, max: number) =>
  optionalText(label, max).min(1, `Enter ${label.toLowerCase()}.`);

export interface InvoiceInput extends Omit<QuotationInput, 'quoteNumber' | 'quoteDate' | 'validUntil'> {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentDetails: string;
}

export const invoiceInputSchema = commonDocumentSchema
  .extend({
    invoiceNumber: requiredText('invoice number', QUOTATION_NUMBER_MAX_LENGTH),
    invoiceDate: requiredText('invoice date', 10),
    dueDate: optionalText('Due date', 10),
    customerName: requiredText('customer name', 180),
    customerAddress: optionalText('Customer address', 600),
    customerEmail: optionalText('Customer email', 160),
    customerPhone: optionalText('Customer phone', 50),
    items: quotationInputSchema.shape.items,
    notes: optionalText('Notes', QUOTATION_MAX_TEXT_LENGTH),
    terms: optionalText('Terms', QUOTATION_MAX_TEXT_LENGTH),
    paymentDetails: optionalText('Payment details', QUOTATION_MAX_TEXT_LENGTH),
    signatoryName: optionalText('Signatory name', 160),
    signatoryDesignation: optionalText('Signatory designation', 160),
    signaturePlaceholder: z.boolean(),
  })
  .superRefine((input, context) => addCommonDocumentIssues(input, context));

export const invoiceDefaultValues: InvoiceInput = {
  businessName: '',
  businessAddress: '',
  phone: '',
  email: '',
  website: '',
  tagline: '',
  gstin: '',
  cin: '',
  registrationNumber: '',
  additionalContact: '',
  socialHandle: '',
  logo: null,
  footerText: '',
  template: 'formal',
  accent: 'teal',
  logoAlignment: 'left',
  headerDivider: true,
  footerDivider: true,
  invoiceNumber: '',
  invoiceDate: '',
  dueDate: '',
  customerName: '',
  customerAddress: '',
  customerEmail: '',
  customerPhone: '',
  items: [{ ...quotationDefaultItem }],
  notes: '',
  terms: '',
  paymentDetails: '',
  signatoryName: '',
  signatoryDesignation: '',
  signaturePlaceholder: true,
};

function toQuotationInput(input: InvoiceInput): QuotationInput {
  return {
    ...input,
    quoteNumber: input.invoiceNumber,
    quoteDate: input.invoiceDate,
    validUntil: '',
  };
}

function mapQuotationField(field: string) {
  if (field === 'quoteNumber') return 'invoiceNumber';
  if (field === 'quoteDate') return 'invoiceDate';
  return field;
}

function mapQuotationErrors(errors: FieldError[]): FieldError[] {
  return errors.map((error) => ({ ...error, field: mapQuotationField(error.field) }));
}

function normalizeInvoiceInput(input: InvoiceInput): InvoiceInput {
  return {
    ...normalizeCommonDocumentInput(input),
    invoiceNumber: input.invoiceNumber.trim(),
    invoiceDate: input.invoiceDate.trim(),
    dueDate: input.dueDate.trim(),
    customerName: input.customerName.trim(),
    customerAddress: input.customerAddress.trim(),
    customerEmail: input.customerEmail.trim(),
    customerPhone: input.customerPhone.trim(),
    items: input.items.map((item) => ({
      ...item,
      id: item.id.trim(),
      description: item.description.trim(),
      quantity: item.quantity.trim(),
      unit: item.unit.trim(),
      unitPrice: item.unitPrice.trim(),
      discountValue: item.discountValue.trim(),
    })),
    notes: input.notes.trim(),
    terms: input.terms.trim(),
    paymentDetails: input.paymentDetails.trim(),
    signatoryName: input.signatoryName.trim(),
    signatoryDesignation: input.signatoryDesignation.trim(),
  };
}

export function validateInvoiceInput(input: InvoiceInput): ValidationResult<InvoiceInput> {
  const parsed = invoiceInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, errors: mapIssuesToFields(parsed.error.issues) };
  const normalized = normalizeInvoiceInput(parsed.data);
  const errors: FieldError[] = [];
  if (!invoiceNumberPattern.test(normalized.invoiceNumber)) {
    errors.push({
      field: 'invoiceNumber',
      code: 'invalid_invoice_number',
      message: 'Use letters, numbers, spaces, hyphens or slashes in the invoice number.',
    });
  }
  if (normalized.dueDate && !isValidLocalDate(normalized.dueDate)) {
    errors.push({ field: 'dueDate', code: 'invalid_date', message: 'Enter a valid due date.' });
  }
  const quotationValidation = validateQuotationInput(toQuotationInput(normalized));
  if (!quotationValidation.success) errors.push(...mapQuotationErrors(quotationValidation.errors));
  if (
    normalized.dueDate &&
    isValidLocalDate(normalized.dueDate) &&
    isValidLocalDate(normalized.invoiceDate) &&
    normalized.dueDate < normalized.invoiceDate
  ) {
    errors.push({
      field: 'dueDate',
      code: 'before_invoice_date',
      message: 'Due date cannot be before the invoice date.',
    });
  }
  if (errors.length) return { success: false, errors };
  return { success: true, data: normalized };
}

export function invoiceFilename(invoiceNumber: string, invoiceDate: string) {
  return safeFilename(`invoice-${invoiceNumber}-${invoiceDate}`, 'invoice', 'pdf');
}

export function calculateInvoice(input: InvoiceInput): InvoiceDocument {
  const validation = validateInvoiceInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new DocumentInputError(
      first?.field ?? 'form',
      first?.code ?? 'invalid_input',
      first?.message ?? 'Check the highlighted invoice fields.',
    );
  }
  const value = validation.data;
  const quotation = calculateQuotation(toQuotationInput(value));
  const { type: quotationType, displayValidUntil, ...shared } = quotation;
  void quotationType;
  void displayValidUntil;
  return {
    ...shared,
    type: 'invoice',
    metadata: { ...quotation.metadata, title: 'Invoice' },
    dueDate: value.dueDate,
    displayDueDate: value.dueDate ? formatDocumentDate(value.dueDate) : '',
    paymentDetails: value.paymentDetails,
    exportSettings: {
      baseFilename: invoiceFilename(value.invoiceNumber, value.invoiceDate).replace(/\.pdf$/u, ''),
      formats: ['pdf'],
    },
  };
}

export function invoiceToReceiptTransferValues(document: InvoiceDocument) {
  return {
    receiptNumber: document.metadata.number,
    receiptDate: document.metadata.date,
    receivedFrom: document.recipient.name,
    amount: document.totals.subtotal,
    paymentPurpose: `Payment against invoice ${document.metadata.number}`,
    invoiceReference: document.metadata.number,
    customerAddress: document.recipient.address.text,
    businessName: document.identity.name,
    businessAddress: document.identity.address.text,
    phone: document.identity.contact.phone,
    email: document.identity.contact.email,
    gstin: document.identity.gstin,
  };
}

export function invoiceToUpiTransferValues(document: InvoiceDocument) {
  return { amount: document.totals.subtotal, note: `Invoice ${document.metadata.number}` };
}
