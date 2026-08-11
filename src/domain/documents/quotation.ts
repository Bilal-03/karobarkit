import { z } from 'zod';

import type { FieldError, ValidationResult } from '@/domain/calculations/types';
import { parseDecimal } from '@/domain/formatting/decimal';
import { safeFilename } from '@/lib/security/safe-filename';

import {
  DOCUMENT_PAGE_LAYOUT,
  MAX_RECEIPT_AMOUNT,
  QUOTATION_MAX_DESCRIPTION_LENGTH,
  QUOTATION_MAX_DISCOUNT,
  QUOTATION_MAX_ITEMS,
  QUOTATION_MAX_QUANTITY,
  QUOTATION_MAX_TEXT_LENGTH,
  QUOTATION_MAX_UNIT_PRICE,
  QUOTATION_NUMBER_MAX_LENGTH,
  QUOTATION_PAGE_ITEM_LIMIT,
} from './constants';
import { DocumentInputError } from './errors';
import { amountToIndianWords, formatDocumentDate } from './formatting';
import type {
  QuotationDocument,
  QuotationInput,
  QuotationLine,
  QuotationLineInput,
  QuotationTotals,
} from './types';
import {
  addCommonDocumentIssues,
  brandingFromInput,
  commonDocumentSchema,
  identityFromInput,
  isValidLocalDate,
  normalizeCommonDocumentInput,
} from './validation';

export type { QuotationDocument, QuotationInput, QuotationLine, QuotationLineInput } from './types';

const quoteNumberPattern = /^[\p{L}\p{N}][\p{L}\p{N}\s/-]*$/u;
const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);
const requiredText = (label: string, max: number) =>
  optionalText(label, max).min(1, `Enter ${label.toLowerCase()}.`);

const quotationLineSchema = z.object({
  id: requiredText('item id', 80),
  description: requiredText('item description', QUOTATION_MAX_DESCRIPTION_LENGTH),
  quantity: requiredText('quantity', 40),
  unit: optionalText('Unit', 24),
  unitPrice: requiredText('unit price', 40),
  discountType: z.enum(['none', 'percentage', 'fixed']),
  discountValue: optionalText('Discount', 40),
});

export const quotationInputSchema = commonDocumentSchema
  .extend({
    quoteNumber: requiredText('quote number', QUOTATION_NUMBER_MAX_LENGTH),
    quoteDate: requiredText('quote date', 10),
    validUntil: optionalText('Valid until', 10),
    customerName: requiredText('customer name', 180),
    customerAddress: optionalText('Customer address', 600),
    customerEmail: optionalText('Customer email', 160),
    customerPhone: optionalText('Customer phone', 50),
    items: z.array(quotationLineSchema).min(1, 'Keep at least one quotation item.').max(QUOTATION_MAX_ITEMS),
    notes: optionalText('Notes', QUOTATION_MAX_TEXT_LENGTH),
    terms: optionalText('Terms', QUOTATION_MAX_TEXT_LENGTH),
    signatoryName: optionalText('Signatory name', 160),
    signatoryDesignation: optionalText('Signatory designation', 160),
    signaturePlaceholder: z.boolean(),
  })
  .superRefine((input, context) => {
    addCommonDocumentIssues(input, context);
  });

export const quotationDefaultItem: QuotationLineInput = {
  id: 'quote-item-1',
  description: 'Sample service',
  quantity: '1',
  unit: 'unit',
  unitPrice: '1000',
  discountType: 'none',
  discountValue: '',
};

export const quotationDefaultValues: QuotationInput = {
  businessName: 'KarobarKit Demo',
  businessAddress: 'India',
  phone: '+91 9876543210',
  email: 'hello@example.com',
  website: 'https://example.com',
  tagline: 'Simple tools for small businesses',
  gstin: '',
  cin: '',
  registrationNumber: '',
  additionalContact: '',
  socialHandle: '',
  logo: null,
  footerText: 'Sample quotation — replace with your details.',
  template: 'formal',
  accent: 'teal',
  logoAlignment: 'left',
  headerDivider: true,
  footerDivider: true,
  quoteNumber: 'QUO-2026-001',
  quoteDate: '2026-08-11',
  validUntil: '2026-08-25',
  customerName: 'Sample customer',
  customerAddress: 'India',
  customerEmail: 'customer@example.com',
  customerPhone: '+91 9000000000',
  items: [{ ...quotationDefaultItem }],
  notes: 'This is an illustrative quotation preview.',
  terms: 'Prices are subject to confirmation.',
  signatoryName: 'KarobarKit Demo',
  signatoryDesignation: 'Business owner',
  signaturePlaceholder: true,
};

function issue(field: string, code: string, message: string): FieldError {
  return { field, code, message };
}

function mapZodIssues(issues: z.ZodIssue[]) {
  return issues.map((item) =>
    issue(item.path.length ? item.path.map(String).join('.') : 'form', 'invalid_input', item.message),
  );
}

function addDecimalIssue(
  errors: FieldError[],
  value: string,
  field: string,
  label: string,
  options: { max: string; decimalPlaces: number; positive?: boolean; nonNegative?: boolean },
) {
  try {
    const parsed = parseDecimal(value);
    if (parsed.decimalPlaces() > options.decimalPlaces) {
      errors.push(
        issue(
          field,
          'unsafe_precision',
          `${label} can have at most ${options.decimalPlaces} decimal places.`,
        ),
      );
    }
    if (options.positive && parsed.lte(0))
      errors.push(issue(field, 'must_be_positive', `${label} must be greater than zero.`));
    if (options.nonNegative && parsed.lt(0))
      errors.push(issue(field, 'must_be_non_negative', `${label} cannot be negative.`));
    if (parsed.gt(parseDecimal(options.max)))
      errors.push(issue(field, 'too_large', `${label} is above the supported practical maximum.`));
    return parsed;
  } catch (error) {
    errors.push(
      issue(
        field,
        'invalid_number',
        error instanceof Error ? error.message : `Enter a valid ${label.toLowerCase()}.`,
      ),
    );
    return null;
  }
}

function normalizeInput(input: QuotationInput): QuotationInput {
  return {
    ...normalizeCommonDocumentInput(input),
    quoteNumber: input.quoteNumber.trim(),
    quoteDate: input.quoteDate.trim(),
    validUntil: input.validUntil.trim(),
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
    signatoryName: input.signatoryName.trim(),
    signatoryDesignation: input.signatoryDesignation.trim(),
  };
}

export function validateQuotationInput(input: QuotationInput): ValidationResult<QuotationInput> {
  const parsed = quotationInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, errors: mapZodIssues(parsed.error.issues) };
  const normalized = normalizeInput(parsed.data);
  const errors: FieldError[] = [];
  if (!quoteNumberPattern.test(normalized.quoteNumber)) {
    errors.push(
      issue(
        'quoteNumber',
        'invalid_quote_number',
        'Use letters, numbers, spaces, hyphens or slashes in the quote number.',
      ),
    );
  }
  if (!isValidLocalDate(normalized.quoteDate))
    errors.push(issue('quoteDate', 'invalid_date', 'Enter a valid quote date.'));
  if (normalized.validUntil && !isValidLocalDate(normalized.validUntil)) {
    errors.push(issue('validUntil', 'invalid_date', 'Enter a valid valid-until date.'));
  }
  if (
    normalized.validUntil &&
    isValidLocalDate(normalized.quoteDate) &&
    isValidLocalDate(normalized.validUntil) &&
    normalized.validUntil < normalized.quoteDate
  ) {
    errors.push(
      issue('validUntil', 'before_quote_date', 'Valid-until date cannot be before the quote date.'),
    );
  }
  if (normalized.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized.customerEmail)) {
    errors.push(issue('customerEmail', 'invalid_email', 'Enter a valid customer email address.'));
  }
  normalized.items.forEach((item, index) => {
    const prefix = `items.${index}`;
    const quantity = addDecimalIssue(errors, item.quantity, `${prefix}.quantity`, 'Quantity', {
      max: QUOTATION_MAX_QUANTITY,
      decimalPlaces: 6,
      positive: true,
    });
    const unitPrice = addDecimalIssue(errors, item.unitPrice, `${prefix}.unitPrice`, 'Unit price', {
      max: QUOTATION_MAX_UNIT_PRICE,
      decimalPlaces: 2,
      positive: true,
    });
    const gross = quantity && unitPrice ? quantity.times(unitPrice).toDecimalPlaces(2, 4) : null;
    if (item.discountType === 'none' && item.discountValue) {
      errors.push(
        issue(
          `${prefix}.discountValue`,
          'unexpected_value',
          'Clear the discount value when no discount is selected.',
        ),
      );
    } else if (item.discountType === 'percentage') {
      const discount = addDecimalIssue(
        errors,
        item.discountValue,
        `${prefix}.discountValue`,
        'Discount percentage',
        {
          max: '99.99',
          decimalPlaces: 2,
          nonNegative: true,
        },
      );
      if (discount?.gte(100))
        errors.push(
          issue(
            `${prefix}.discountValue`,
            'discount_too_large',
            'Percentage discount must be less than 100%.',
          ),
        );
    } else if (item.discountType === 'fixed') {
      const discount = addDecimalIssue(
        errors,
        item.discountValue,
        `${prefix}.discountValue`,
        'Discount amount',
        {
          max: QUOTATION_MAX_DISCOUNT,
          decimalPlaces: 2,
          nonNegative: true,
        },
      );
      if (discount && gross && discount.gte(gross))
        errors.push(
          issue(
            `${prefix}.discountValue`,
            'discount_too_large',
            'Discount must leave a positive line subtotal.',
          ),
        );
    }
  });
  return errors.length ? { success: false, errors } : { success: true, data: normalized };
}

function calculateLine(item: QuotationLineInput): QuotationLine {
  const quantity = parseDecimal(item.quantity);
  const unitPrice = parseDecimal(item.unitPrice);
  const gross = quantity.times(unitPrice).toDecimalPlaces(2, 4);
  let discount = parseDecimal('0');
  if (item.discountType === 'percentage')
    discount = gross.times(parseDecimal(item.discountValue)).div(100).toDecimalPlaces(2, 4);
  if (item.discountType === 'fixed') discount = parseDecimal(item.discountValue).toDecimalPlaces(2, 4);
  const subtotal = gross.minus(discount).toDecimalPlaces(2, 4);
  if (subtotal.lte(0))
    throw new DocumentInputError(
      `items.${item.id}.discountValue`,
      'non_positive_subtotal',
      'Discount must leave a positive line subtotal.',
    );
  return {
    id: item.id,
    description: item.description,
    quantity: quantity.toString(),
    unit: item.unit,
    unitPrice: unitPrice.toFixed(2),
    grossValue: gross.toFixed(2),
    discountType: item.discountType,
    discountValue: item.discountValue || '0',
    discountAmount: discount.toFixed(2),
    subtotal: subtotal.toFixed(2),
  };
}

function calculateTotals(lines: QuotationLine[]): QuotationTotals {
  const sum = (values: string[]) =>
    values.reduce((total, value) => total.plus(parseDecimal(value)), parseDecimal('0')).toFixed(2);
  const grossValue = sum(lines.map((line) => line.grossValue));
  const discountAmount = sum(lines.map((line) => line.discountAmount));
  const subtotal = sum(lines.map((line) => line.subtotal));
  if (parseDecimal(subtotal).gt(parseDecimal(MAX_RECEIPT_AMOUNT))) {
    throw new DocumentInputError(
      'items',
      'total_too_large',
      'The quoted total is above the supported amount-to-words range.',
    );
  }
  return { grossValue, discountAmount, subtotal, amountInWords: amountToIndianWords(subtotal) };
}

export function quotationFilename(quoteNumber: string, quoteDate: string) {
  return safeFilename(`quotation-${quoteNumber}-${quoteDate}`, 'quotation', 'pdf');
}

export function calculateQuotation(input: QuotationInput): QuotationDocument {
  const validation = validateQuotationInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new DocumentInputError(
      first?.field ?? 'form',
      first?.code ?? 'invalid_input',
      first?.message ?? 'Check the highlighted quotation fields.',
    );
  }
  const value = validation.data;
  const lines = value.items.map(calculateLine);
  const pageChunks: QuotationLine[][] = [];
  for (let index = 0; index < lines.length; index += QUOTATION_PAGE_ITEM_LIMIT)
    pageChunks.push(lines.slice(index, index + QUOTATION_PAGE_ITEM_LIMIT));
  const totals = calculateTotals(lines);
  return {
    type: 'quotation',
    identity: identityFromInput(value),
    logo: value.logo,
    branding: brandingFromInput(value),
    footerText: value.footerText,
    metadata: { title: 'Quotation', number: value.quoteNumber, date: value.quoteDate, subject: '' },
    recipient: { name: value.customerName, address: { text: value.customerAddress } },
    recipientContact: {
      phone: value.customerPhone,
      email: value.customerEmail,
      website: '',
      additionalLine: '',
      socialHandle: '',
    },
    items: lines,
    pageChunks,
    totals,
    notes: value.notes,
    terms: value.terms,
    signature: {
      name: value.signatoryName,
      designation: value.signatoryDesignation,
      showPlaceholder: value.signaturePlaceholder,
    },
    displayDate: formatDocumentDate(value.quoteDate),
    displayValidUntil: value.validUntil ? formatDocumentDate(value.validUntil) : '',
    layout: DOCUMENT_PAGE_LAYOUT,
    exportSettings: {
      baseFilename: quotationFilename(value.quoteNumber, value.quoteDate).replace(/\.pdf$/u, ''),
      formats: ['pdf'],
    },
  };
}

export function quotationToInvoiceTransferValues(document: QuotationDocument) {
  return {
    invoiceNumber: document.metadata.number,
    invoiceDate: document.metadata.date,
    supplierLegalName: document.identity.name,
    supplierGstin: document.identity.gstin,
    supplierPhone: document.identity.contact.phone,
    supplierEmail: document.identity.contact.email,
    supplierAddress: document.identity.address.text,
    recipientName: document.recipient.name,
    recipientAddress: document.recipient.address.text,
    recipientPhone: document.recipientContact.phone,
    recipientEmail: document.recipientContact.email,
    itemsJson: JSON.stringify(
      document.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountType: item.discountType,
        discountValue: item.discountValue,
      })),
    ),
  };
}
