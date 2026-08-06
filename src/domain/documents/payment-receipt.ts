import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';
import { parseDecimal } from '@/domain/formatting/decimal';

import { DOCUMENT_PAGE_LAYOUT, MAX_RECEIPT_AMOUNT } from './constants';
import { DocumentInputError } from './errors';
import {
  amountToIndianWords,
  formatDocumentAmount,
  formatDocumentDate,
  normalizeDocumentAmount,
} from './formatting';
import type { PaymentReceiptDocument, PaymentReceiptInput } from './types';
import {
  addCommonDocumentIssues,
  brandingFromInput,
  commonDocumentSchema,
  identityFromInput,
  isValidLocalDate,
  mapIssuesToFields,
  normalizeCommonDocumentInput,
} from './validation';

export type { PaymentReceiptDocument, PaymentReceiptInput } from './types';

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);

const receiptNumberPattern = /^[\p{L}\p{N}][\p{L}\p{N}\s/-]*$/u;

export const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank-transfer', label: 'Bank transfer' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
] as const;

const paymentMethodValues = ['', ...paymentMethodOptions.map((option) => option.value)] as [
  '',
  ...Array<(typeof paymentMethodOptions)[number]['value']>,
];

export const paymentReceiptInputSchema = commonDocumentSchema
  .extend({
    receiptNumber: z
      .string()
      .trim()
      .min(1, 'Enter the receipt number.')
      .max(48, 'Receipt number must be 48 characters or fewer.')
      .refine((value) => receiptNumberPattern.test(value), {
        message: 'Use letters, numbers, spaces, hyphens or slashes in the receipt number.',
      }),
    receiptDate: z.string().trim().min(1, 'Enter the receipt date.'),
    receivedFrom: z
      .string()
      .trim()
      .min(1, 'Enter who the payment was received from.')
      .max(180, 'Received-from name must be 180 characters or fewer.'),
    amount: z.string().trim().min(1, 'Enter the amount received.'),
    paymentPurpose: z
      .string()
      .trim()
      .min(1, 'Enter the payment purpose.')
      .max(360, 'Payment purpose must be 360 characters or fewer.'),
    paymentMethod: z.enum(paymentMethodValues),
    transactionReference: optionalText('Transaction reference', 140),
    paymentNote: optionalText('Payment note', 360),
    invoiceReference: optionalText('Invoice reference', 100),
    customerAddress: optionalText('Customer address', 600),
    signatoryName: optionalText('Signatory name', 160),
    signatoryDesignation: optionalText('Signatory designation', 160),
    signaturePlaceholder: z.boolean(),
  })
  .superRefine((input, context) => {
    addCommonDocumentIssues(input, context);
    if (!isValidLocalDate(input.receiptDate)) {
      context.addIssue({ code: 'custom', path: ['receiptDate'], message: 'Enter a valid calendar date.' });
    }

    try {
      const amount = parseDecimal(input.amount);
      if (amount.lte(0)) {
        context.addIssue({ code: 'custom', path: ['amount'], message: 'Amount must be greater than zero.' });
      }
      if ((amount.decimalPlaces() ?? 0) > 2) {
        context.addIssue({
          code: 'custom',
          path: ['amount'],
          message: 'Amount can have no more than two decimal places.',
        });
      }
      if (amount.gt(parseDecimal(MAX_RECEIPT_AMOUNT))) {
        context.addIssue({
          code: 'custom',
          path: ['amount'],
          message: 'Enter an amount within the supported range.',
        });
      }
    } catch (error) {
      context.addIssue({
        code: 'custom',
        path: ['amount'],
        message: error instanceof Error ? error.message : 'Enter a valid amount.',
      });
    }
  });

export const paymentReceiptDefaultValues: PaymentReceiptInput = {
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
  receiptNumber: '',
  receiptDate: '',
  receivedFrom: '',
  amount: '',
  paymentPurpose: '',
  paymentMethod: '',
  transactionReference: '',
  paymentNote: '',
  invoiceReference: '',
  customerAddress: '',
  signatoryName: '',
  signatoryDesignation: '',
  signaturePlaceholder: true,
};

export function validatePaymentReceiptInput(
  input: PaymentReceiptInput,
): ValidationResult<PaymentReceiptInput> {
  const parsed = paymentReceiptInputSchema.safeParse(input);
  if (parsed.success) {
    return { success: true, data: normalizeCommonDocumentInput(parsed.data) };
  }

  return {
    success: false,
    errors: mapIssuesToFields(parsed.error.issues),
  };
}

export function calculatePaymentReceipt(input: PaymentReceiptInput): PaymentReceiptDocument {
  const validation = validatePaymentReceiptInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new DocumentInputError(
      first?.field ?? 'form',
      first?.code ?? 'invalid_input',
      first?.message ?? 'Check the highlighted fields.',
    );
  }

  const value = validation.data;
  const normalizedAmount = normalizeDocumentAmount(value.amount);
  return {
    type: 'payment-receipt',
    identity: identityFromInput(value),
    logo: value.logo,
    branding: brandingFromInput(value),
    footerText: value.footerText,
    metadata: {
      title: 'Payment receipt',
      number: value.receiptNumber,
      date: value.receiptDate,
      subject: '',
    },
    recipient: {
      name: value.receivedFrom,
      address: { text: value.customerAddress },
    },
    amount: normalizedAmount,
    paymentPurpose: value.paymentPurpose,
    paymentMethod: value.paymentMethod,
    transactionReference: value.transactionReference,
    paymentNote: value.paymentNote,
    invoiceReference: value.invoiceReference,
    signature: {
      name: value.signatoryName,
      designation: value.signatoryDesignation,
      showPlaceholder: value.signaturePlaceholder,
    },
    displayDate: formatDocumentDate(value.receiptDate),
    monetaryValue: {
      amount: normalizedAmount,
      currency: 'INR',
      formatted: formatDocumentAmount(normalizedAmount),
      inWords: amountToIndianWords(normalizedAmount),
    },
    layout: DOCUMENT_PAGE_LAYOUT,
    exportSettings: { baseFilename: 'karobarkit-payment-receipt', formats: ['pdf'] },
  };
}
