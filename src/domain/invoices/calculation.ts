import Decimal from 'decimal.js';

import { DocumentInputError } from '@/domain/documents/errors';
import { amountToIndianWords, formatDocumentDate } from '@/domain/documents/formatting';
import { DOCUMENT_PAGE_LAYOUT } from '@/domain/documents/constants';
import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';
import { calculateGst } from '@/domain/gst';
import {
  GST_CUSTOM_RATE_ID,
  getActiveGstPolicy,
  getActiveGstRatePresets,
  getGstPolicyFreshness,
} from '@/domain/policies/gst';
import { safeFilename } from '@/lib/security/safe-filename';

import { INVOICE_PAGE_ITEM_LIMIT } from './constants';
import type {
  GstInvoiceDocument,
  GstInvoiceInput,
  GstInvoiceLine,
  GstInvoiceTaxGroup,
  GstInvoiceTotals,
  InvoiceAddress,
  InvoiceParty,
} from './types';
import { validateGstInvoiceInput } from './validation';

const CURRENCY_DECIMALS = 2;

function currency(value: Decimal) {
  return value.toDecimalPlaces(CURRENCY_DECIMALS, Decimal.ROUND_HALF_UP);
}

function money(value: Decimal) {
  return currency(value).toFixed(CURRENCY_DECIMALS);
}

function sum(values: string[]) {
  return money(values.reduce((total, value) => total.plus(parseDecimal(value)), new Decimal(0)));
}

function addressToText(address: InvoiceAddress) {
  return [
    address.line1,
    address.line2,
    [address.city, address.district].filter(Boolean).join(', '),
    [address.state, address.stateCode ? `(${address.stateCode})` : ''].filter(Boolean).join(' '),
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join('\n');
}

function mapParty(party: GstInvoiceInput['supplier']): InvoiceParty {
  return {
    legalName: party.legalName,
    tradeName: party.tradeName,
    gstin: party.gstin,
    address: party.address,
    phone: party.phone,
    email: party.email,
  };
}

function resolveRate(item: GstInvoiceInput['items'][number], invoiceDate: string) {
  if (item.ratePresetId === GST_CUSTOM_RATE_ID) {
    return {
      ratePercent: decimalToString(parseDecimal(item.customRate)),
      rateSourceType: 'custom' as const,
      rateLabel: `${parseDecimal(item.customRate).toFixed(2)}% · user supplied`,
      gstPolicyRateId: GST_CUSTOM_RATE_ID,
      sourceIds: [],
    };
  }
  const preset = getActiveGstRatePresets(invoiceDate).find((candidate) => candidate.id === item.ratePresetId);
  if (!preset)
    throw new DocumentInputError('items', 'invalid_rate_preset', 'Choose a current GST rate for every item.');
  return {
    ratePercent: preset.ratePercent,
    rateSourceType: 'policy-preset' as const,
    rateLabel: preset.label,
    gstPolicyRateId: preset.id,
    sourceIds: preset.sourceIds,
  };
}

function calculateLine(
  item: GstInvoiceInput['items'][number],
  supplyType: GstInvoiceInput['supplyType'],
  invoiceDate: string,
): GstInvoiceLine {
  const quantity = parseDecimal(item.quantity);
  const unitPrice = parseDecimal(item.unitPrice);
  const grossValue = currency(quantity.times(unitPrice));
  let discountAmount = new Decimal(0);
  if (item.discountType === 'percentage') {
    discountAmount = currency(grossValue.times(parseDecimal(item.discountValue)).div(100));
  } else if (item.discountType === 'fixed') {
    discountAmount = currency(parseDecimal(item.discountValue));
  }
  const taxableValue = currency(grossValue.minus(discountAmount));
  if (taxableValue.lte(0)) {
    throw new DocumentInputError(
      `items.${item.id}.discountValue`,
      'non_positive_taxable_value',
      'Discount must leave a positive taxable value.',
    );
  }
  const rate = resolveRate(item, invoiceDate);
  const gst = calculateGst({
    amount: taxableValue.toFixed(CURRENCY_DECIMALS),
    ratePercent: rate.ratePercent,
    mode: 'exclusive',
    supplyType,
  });
  return {
    id: item.id,
    description: item.description,
    hsnOrSac: item.hsnOrSac,
    quantity: decimalToString(quantity),
    unit: item.unit,
    unitPrice: money(unitPrice),
    grossValue: money(grossValue),
    discountType: item.discountType,
    discountValue: item.discountValue || '0',
    discountAmount: money(discountAmount),
    taxableValue: gst.taxableValue,
    gstRatePercent: gst.ratePercent,
    gstPolicyRateId: rate.gstPolicyRateId,
    rateSourceType: rate.rateSourceType,
    rateLabel: rate.rateLabel,
    sourceIds: rate.sourceIds,
    gstAmount: gst.gstAmount,
    cgstAmount: gst.cgstAmount ?? '0.00',
    sgstOrUtgstAmount: gst.sgstOrUtgstAmount ?? '0.00',
    igstAmount: gst.igstAmount ?? '0.00',
    lineTotal: gst.totalAmount,
    roundingOccurred: gst.roundingOccurred,
  };
}

function addGroup(groups: Map<string, GstInvoiceTaxGroup>, line: GstInvoiceLine) {
  const key = `${line.rateSourceType}:${line.gstRatePercent}`;
  const existing = groups.get(key);
  if (!existing) {
    groups.set(key, {
      key,
      label: line.rateLabel,
      ratePercent: line.gstRatePercent,
      rateSourceType: line.rateSourceType,
      taxableValue: line.taxableValue,
      gstAmount: line.gstAmount,
      cgstAmount: line.cgstAmount,
      sgstOrUtgstAmount: line.sgstOrUtgstAmount,
      igstAmount: line.igstAmount,
      sourceIds: [...line.sourceIds],
    });
    return;
  }
  existing.taxableValue = sum([existing.taxableValue, line.taxableValue]);
  existing.gstAmount = sum([existing.gstAmount, line.gstAmount]);
  existing.cgstAmount = sum([existing.cgstAmount, line.cgstAmount]);
  existing.sgstOrUtgstAmount = sum([existing.sgstOrUtgstAmount, line.sgstOrUtgstAmount]);
  existing.igstAmount = sum([existing.igstAmount, line.igstAmount]);
  existing.sourceIds = [...new Set([...existing.sourceIds, ...line.sourceIds])];
}

function calculateTotals(lines: GstInvoiceLine[]): GstInvoiceTotals {
  const cgstAmount = sum(lines.map((line) => line.cgstAmount));
  const sgstOrUtgstAmount = sum(lines.map((line) => line.sgstOrUtgstAmount));
  const igstAmount = sum(lines.map((line) => line.igstAmount));
  const gstAmount = sum(lines.map((line) => line.gstAmount));
  const taxableValue = sum(lines.map((line) => line.taxableValue));
  const grandTotal = sum(lines.map((line) => line.lineTotal));
  return {
    grossValue: sum(lines.map((line) => line.grossValue)),
    discountAmount: sum(lines.map((line) => line.discountAmount)),
    taxableValue,
    cgstAmount,
    sgstOrUtgstAmount,
    igstAmount,
    gstAmount,
    grandTotal,
    amountInWords: amountToIndianWords(grandTotal),
    roundingOccurred: lines.some((line) => line.roundingOccurred),
  };
}

export function gstInvoiceFilename(invoiceNumber: string, invoiceDate: string) {
  return safeFilename(`gst-invoice-${invoiceNumber}-${invoiceDate}`, 'gst-invoice', 'pdf');
}

export function calculateGstInvoice(input: GstInvoiceInput): GstInvoiceDocument {
  const validation = validateGstInvoiceInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new DocumentInputError(
      first?.field ?? 'form',
      first?.code ?? 'invalid_input',
      first?.message ?? 'Check the highlighted invoice fields.',
    );
  }
  const value = validation.data;
  const policy = getActiveGstPolicy(value.invoiceDate);
  const freshness = getGstPolicyFreshness(policy);
  if (freshness.isStale) {
    throw new DocumentInputError(
      'invoiceDate',
      'policy_stale',
      `The GST policy review is due (${freshness.reviewDueOn}). This invoice path is disabled until the policy is re-verified.`,
    );
  }
  const lines = value.items.map((item) => calculateLine(item, value.supplyType, value.invoiceDate));
  const taxGroups = [
    ...lines
      .reduce((groups, line) => {
        addGroup(groups, line);
        return groups;
      }, new Map<string, GstInvoiceTaxGroup>())
      .values(),
  ];
  const totals = calculateTotals(lines);
  const supplier = mapParty(value.supplier);
  const recipient = mapParty(value.recipient);
  const identity = {
    name: supplier.legalName,
    tagline: supplier.tradeName,
    address: { text: addressToText(supplier.address) },
    contact: {
      phone: supplier.phone,
      email: supplier.email,
      website: '',
      additionalLine: '',
      socialHandle: '',
    },
    gstin: supplier.gstin,
    cin: '',
    registrationNumber: '',
  };
  const placeOfSupply =
    value.placeOfSupply.state && value.placeOfSupply.stateCode ? value.placeOfSupply : null;
  const pageChunks: GstInvoiceLine[][] = [];
  for (let index = 0; index < lines.length; index += INVOICE_PAGE_ITEM_LIMIT) {
    pageChunks.push(lines.slice(index, index + INVOICE_PAGE_ITEM_LIMIT));
  }
  return {
    type: 'gst-invoice',
    identity,
    logo: value.logo,
    branding: {
      template: 'formal',
      accent: 'teal',
      logoAlignment: 'left',
      headerDivider: true,
      footerDivider: true,
    },
    footerText: 'Generated locally. Review all particulars and applicable GST rules before issue.',
    invoiceNumber: value.invoiceNumber,
    invoiceDate: value.invoiceDate,
    displayInvoiceDate: formatDocumentDate(value.invoiceDate),
    dueDate: value.dueDate,
    displayDueDate: value.dueDate ? formatDocumentDate(value.dueDate) : '',
    supplier,
    recipient,
    recipientRegistrationStatus: value.recipientRegistrationStatus,
    supplyType: value.supplyType,
    placeOfSupply,
    reverseCharge: value.reverseCharge,
    items: lines,
    pageChunks,
    taxGroups,
    totals,
    notes: value.notes,
    terms: value.terms,
    paymentDetails: value.paymentDetails,
    hsnWarning: lines.some((line) => !line.hsnOrSac),
    customRateWarning: lines.some((line) => line.rateSourceType === 'custom'),
    policy: {
      id: policy.id,
      name: policy.name,
      effectiveFrom: policy.effectiveFrom,
      lastVerifiedOn: policy.lastVerifiedOn,
      reviewDueOn: freshness.reviewDueOn,
      isStale: freshness.isStale,
      sourceIds: [...policy.sourceIds],
    },
    signature: {
      name: 'Authorised signatory',
      designation: '',
      showPlaceholder: true,
    },
    layout: DOCUMENT_PAGE_LAYOUT,
    exportSettings: {
      baseFilename: gstInvoiceFilename(value.invoiceNumber, value.invoiceDate).replace(/\.pdf$/u, ''),
      formats: ['pdf'],
    },
  };
}

export { addressToText };
