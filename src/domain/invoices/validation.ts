import { z } from 'zod';

import type { FieldError, ValidationResult } from '@/domain/calculations/types';
import { parseDecimal } from '@/domain/formatting/decimal';
import { GST_RATE_DECIMAL_PLACES, GST_RATE_MAX } from '@/domain/gst/calculation';
import { GST_CUSTOM_RATE_ID, getActiveGstPolicy, getActiveGstRatePresets } from '@/domain/policies/gst';
import { logoSchema, isValidLocalDate } from '@/domain/documents/validation';

import {
  INVOICE_MAX_DESCRIPTION_LENGTH,
  INVOICE_MAX_DISCOUNT,
  INVOICE_MAX_HSN_LENGTH,
  INVOICE_MAX_ITEMS,
  INVOICE_MAX_QUANTITY,
  INVOICE_MAX_TEXT_LENGTH,
  INVOICE_MAX_UNIT_PRICE,
  INVOICE_NUMBER_MAX_LENGTH,
} from './constants';
import type { GstInvoiceInput, InvoiceItemInput } from './types';

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/u;
const INVOICE_NUMBER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9/-]{0,15}$/u;
const HSN_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}./-]*$/u;
const STATE_CODE_PATTERN = /^\d{2}$/u;
const POSTAL_CODE_PATTERN = /^\d{6}$/u;

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);

const requiredText = (label: string, max: number) =>
  optionalText(label, max).min(1, `Enter ${label.toLowerCase()}.`);

const addressSchema = z.object({
  line1: requiredText('address line 1', 180),
  line2: optionalText('Address line 2', 180),
  city: requiredText('city', 80),
  district: optionalText('District', 80),
  state: requiredText('state', 80),
  stateCode: optionalText('State code', 2),
  postalCode: requiredText('postal code', 12),
  country: requiredText('country', 80),
});

const partySchema = z.object({
  legalName: requiredText('legal name', 160),
  tradeName: optionalText('Trade name', 160),
  gstin: optionalText('GSTIN', 32),
  address: addressSchema,
  phone: optionalText('Phone number', 40),
  email: optionalText('Email', 160),
});

const itemSchema = z.object({
  id: z.string().trim().min(1).max(80),
  description: requiredText('item description', INVOICE_MAX_DESCRIPTION_LENGTH),
  hsnOrSac: optionalText('HSN/SAC', INVOICE_MAX_HSN_LENGTH),
  quantity: requiredText('quantity', 40),
  unit: optionalText('unit', 24),
  unitPrice: requiredText('unit price', 40),
  discountType: z.enum(['none', 'percentage', 'fixed']),
  discountValue: optionalText('Discount', 40),
  ratePresetId: requiredText('GST rate', 80),
  customRate: optionalText('Custom GST rate', 40),
});

export const gstInvoiceInputSchema = z.object({
  invoiceNumber: requiredText('invoice number', INVOICE_NUMBER_MAX_LENGTH),
  invoiceDate: requiredText('invoice date', 10),
  dueDate: optionalText('Due date', 10),
  supplier: partySchema,
  recipient: partySchema,
  recipientRegistrationStatus: z.enum(['registered', 'unregistered', 'unknown']),
  supplyType: z.enum(['intra-state', 'inter-state']),
  placeOfSupply: z.object({
    state: optionalText('Place of supply state', 80),
    stateCode: optionalText('Place of supply state code', 2),
  }),
  reverseCharge: z.boolean(),
  items: z
    .array(itemSchema)
    .min(1, 'Keep at least one invoice item.')
    .max(INVOICE_MAX_ITEMS, `Use no more than ${INVOICE_MAX_ITEMS} items.`),
  notes: optionalText('Notes', INVOICE_MAX_TEXT_LENGTH),
  terms: optionalText('Terms', INVOICE_MAX_TEXT_LENGTH),
  paymentDetails: optionalText('Payment details', INVOICE_MAX_TEXT_LENGTH),
  logo: logoSchema,
});

function issue(field: string, code: string, message: string): FieldError {
  return { field, code, message };
}

function mapZodIssues(issues: z.ZodIssue[]) {
  return issues.map((zodIssue) =>
    issue(
      zodIssue.path.length ? zodIssue.path.map(String).join('.') : 'form',
      'invalid_input',
      zodIssue.message,
    ),
  );
}

function addIssue(errors: FieldError[], field: string, code: string, message: string) {
  errors.push(issue(field, code, message));
}

function validateFiniteDecimal(
  value: string,
  field: string,
  errors: FieldError[],
  options: { label: string; max: string; decimalPlaces?: number; positive?: boolean; nonNegative?: boolean },
) {
  try {
    const parsed = parseDecimal(value);
    if (options.decimalPlaces !== undefined && parsed.decimalPlaces() > options.decimalPlaces) {
      addIssue(
        errors,
        field,
        'unsafe_precision',
        `${options.label} can have at most ${options.decimalPlaces} decimal places.`,
      );
    }
    if (options.positive && parsed.lte(0)) {
      addIssue(errors, field, 'must_be_positive', `${options.label} must be greater than zero.`);
    }
    if (options.nonNegative && parsed.lt(0)) {
      addIssue(errors, field, 'must_be_non_negative', `${options.label} cannot be negative.`);
    }
    if (parsed.gt(parseDecimal(options.max))) {
      addIssue(errors, field, 'too_large', `${options.label} is above the supported practical maximum.`);
    }
    return parsed;
  } catch (error) {
    addIssue(
      errors,
      field,
      'invalid_number',
      error instanceof Error ? error.message : `Enter a valid finite ${options.label.toLowerCase()}.`,
    );
    return null;
  }
}

function validateGstin(value: string, field: string, errors: FieldError[], required: boolean) {
  const normalized = value.trim().toUpperCase();
  if (!normalized && required) {
    addIssue(errors, field, 'required', 'Enter the GSTIN for this registered party.');
  } else if (normalized && !GSTIN_PATTERN.test(normalized)) {
    addIssue(
      errors,
      field,
      'invalid_gstin',
      'Enter a structurally valid 15-character GSTIN. It is not verified.',
    );
  }
  return normalized;
}

function validateAddressCodes(input: GstInvoiceInput, errors: FieldError[]) {
  for (const [party, label] of [
    [input.supplier, 'supplier'],
    [input.recipient, 'recipient'],
  ] as const) {
    if (party.address.stateCode && !STATE_CODE_PATTERN.test(party.address.stateCode)) {
      addIssue(
        errors,
        `${label}.address.stateCode`,
        'invalid_state_code',
        'Use a two-digit state or UT code, or leave it blank.',
      );
    }
    if (!POSTAL_CODE_PATTERN.test(party.address.postalCode)) {
      addIssue(
        errors,
        `${label}.address.postalCode`,
        'invalid_postal_code',
        'Enter a six-digit Indian postal code.',
      );
    }
    if (party.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(party.email)) {
      addIssue(errors, `${label}.email`, 'invalid_email', 'Enter a valid email address.');
    }
  }
  if (input.placeOfSupply.stateCode && !STATE_CODE_PATTERN.test(input.placeOfSupply.stateCode)) {
    addIssue(
      errors,
      'placeOfSupply.stateCode',
      'invalid_state_code',
      'Use a two-digit place-of-supply state code.',
    );
  }
}

function normalizeItem(item: InvoiceItemInput): InvoiceItemInput {
  return {
    ...item,
    id: item.id.trim(),
    description: item.description.trim(),
    hsnOrSac: item.hsnOrSac.trim(),
    quantity: item.quantity.trim(),
    unit: item.unit.trim(),
    unitPrice: item.unitPrice.trim(),
    discountValue: item.discountValue.trim(),
    ratePresetId: item.ratePresetId.trim(),
    customRate: item.customRate.trim(),
  };
}

function normalizeInput(input: GstInvoiceInput): GstInvoiceInput {
  const normalizeParty = (party: GstInvoiceInput['supplier']) => ({
    ...party,
    legalName: party.legalName.trim(),
    tradeName: party.tradeName.trim(),
    gstin: party.gstin.trim().toUpperCase(),
    phone: party.phone.trim(),
    email: party.email.trim(),
    address: Object.fromEntries(
      Object.entries(party.address).map(([key, value]) => [key, value.trim()]),
    ) as GstInvoiceInput['supplier']['address'],
  });
  return {
    ...input,
    invoiceNumber: input.invoiceNumber.trim(),
    invoiceDate: input.invoiceDate.trim(),
    dueDate: input.dueDate.trim(),
    supplier: normalizeParty(input.supplier),
    recipient: normalizeParty(input.recipient),
    placeOfSupply: {
      state: input.placeOfSupply.state.trim(),
      stateCode: input.placeOfSupply.stateCode.trim(),
    },
    items: input.items.map(normalizeItem),
    notes: input.notes.trim(),
    terms: input.terms.trim(),
    paymentDetails: input.paymentDetails.trim(),
  };
}

export function validateGstInvoiceInput(input: GstInvoiceInput): ValidationResult<GstInvoiceInput> {
  const parsed = gstInvoiceInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, errors: mapZodIssues(parsed.error.issues) };

  const normalized = normalizeInput(parsed.data);
  const errors: FieldError[] = [];

  if (!INVOICE_NUMBER_PATTERN.test(normalized.invoiceNumber)) {
    addIssue(
      errors,
      'invoiceNumber',
      'invalid_invoice_number',
      'Use up to 16 letters, numbers, hyphens or slashes; no spaces or other punctuation.',
    );
  }
  if (!isValidLocalDate(normalized.invoiceDate)) {
    addIssue(errors, 'invoiceDate', 'invalid_date', 'Enter a valid invoice date.');
  }
  if (normalized.dueDate && !isValidLocalDate(normalized.dueDate)) {
    addIssue(errors, 'dueDate', 'invalid_date', 'Enter a valid due date.');
  }
  if (
    normalized.invoiceDate &&
    normalized.dueDate &&
    isValidLocalDate(normalized.invoiceDate) &&
    isValidLocalDate(normalized.dueDate) &&
    normalized.dueDate < normalized.invoiceDate
  ) {
    addIssue(errors, 'dueDate', 'before_invoice_date', 'Due date cannot be before the invoice date.');
  }

  validateGstin(normalized.supplier.gstin, 'supplier.gstin', errors, true);
  validateGstin(
    normalized.recipient.gstin,
    'recipient.gstin',
    errors,
    normalized.recipientRegistrationStatus === 'registered',
  );
  validateAddressCodes(normalized, errors);

  if (normalized.recipientRegistrationStatus === 'unregistered' && normalized.recipient.gstin) {
    addIssue(
      errors,
      'recipient.gstin',
      'registration_mismatch',
      'Leave the recipient GSTIN blank when the recipient is marked unregistered.',
    );
  }

  if (normalized.supplyType === 'inter-state') {
    if (!normalized.placeOfSupply.state)
      addIssue(
        errors,
        'placeOfSupply.state',
        'required',
        'Enter the place-of-supply state for an inter-State invoice.',
      );
    if (!normalized.placeOfSupply.stateCode)
      addIssue(
        errors,
        'placeOfSupply.stateCode',
        'required',
        'Enter the place-of-supply state code for an inter-State invoice.',
      );
  } else if (Boolean(normalized.placeOfSupply.state) !== Boolean(normalized.placeOfSupply.stateCode)) {
    addIssue(
      errors,
      'placeOfSupply',
      'incomplete_place_of_supply',
      'Enter both place-of-supply state and code, or leave both blank.',
    );
  }

  let activeRateIds = new Set<string>();
  let policyAvailable = false;
  if (isValidLocalDate(normalized.invoiceDate)) {
    try {
      activeRateIds = new Set(getActiveGstRatePresets(normalized.invoiceDate).map((rate) => rate.id));
      getActiveGstPolicy(normalized.invoiceDate);
      policyAvailable = true;
    } catch (error) {
      addIssue(
        errors,
        'invoiceDate',
        'policy_unavailable',
        error instanceof Error ? error.message : 'No reviewed GST policy covers this invoice date.',
      );
    }
  }

  normalized.items.forEach((item, index) => {
    const prefix = `items.${index}`;
    if (item.hsnOrSac && !HSN_PATTERN.test(item.hsnOrSac)) {
      addIssue(
        errors,
        `${prefix}.hsnOrSac`,
        'unsupported_characters',
        'Use letters, numbers, dots, slashes or hyphens in HSN/SAC.',
      );
    }
    const quantity = validateFiniteDecimal(item.quantity, `${prefix}.quantity`, errors, {
      label: 'Quantity',
      max: INVOICE_MAX_QUANTITY,
      decimalPlaces: 6,
      positive: true,
    });
    const unitPrice = validateFiniteDecimal(item.unitPrice, `${prefix}.unitPrice`, errors, {
      label: 'Unit price',
      max: INVOICE_MAX_UNIT_PRICE,
      decimalPlaces: 2,
      positive: true,
    });
    const gross = quantity && unitPrice ? quantity.times(unitPrice).toDecimalPlaces(2, 4) : null;

    if (item.discountType === 'none') {
      if (item.discountValue)
        addIssue(
          errors,
          `${prefix}.discountValue`,
          'unexpected_value',
          'Clear the discount value when no discount is selected.',
        );
    } else if (item.discountType === 'percentage') {
      const discount = validateFiniteDecimal(item.discountValue, `${prefix}.discountValue`, errors, {
        label: 'Discount percentage',
        max: '100',
        decimalPlaces: 2,
        nonNegative: true,
      });
      if (discount?.gte(100))
        addIssue(
          errors,
          `${prefix}.discountValue`,
          'discount_too_large',
          'Percentage discount must be less than 100% so the line remains taxable.',
        );
    } else {
      const discount = validateFiniteDecimal(item.discountValue, `${prefix}.discountValue`, errors, {
        label: 'Fixed discount',
        max: INVOICE_MAX_DISCOUNT,
        decimalPlaces: 2,
        nonNegative: true,
      });
      if (discount && gross && discount.gte(gross))
        addIssue(
          errors,
          `${prefix}.discountValue`,
          'discount_too_large',
          'Fixed discount must be less than the line gross value.',
        );
    }

    if (item.ratePresetId === GST_CUSTOM_RATE_ID) {
      validateFiniteDecimal(item.customRate, `${prefix}.customRate`, errors, {
        label: 'Custom GST rate',
        max: GST_RATE_MAX,
        decimalPlaces: GST_RATE_DECIMAL_PLACES,
        nonNegative: true,
      });
    } else if (policyAvailable && !activeRateIds.has(item.ratePresetId)) {
      addIssue(
        errors,
        `${prefix}.ratePresetId`,
        'invalid_rate_preset',
        'Choose a current source-backed GST rate for the invoice date.',
      );
    }
  });

  return errors.length ? { success: false, errors } : { success: true, data: normalized };
}

export { GSTIN_PATTERN, INVOICE_NUMBER_PATTERN };
