import Decimal from 'decimal.js';
import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';
import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';
import { formatIndianCurrency, formatIndianDate } from '@/domain/formatting/indian';

import { amountToIndianWords } from './formatting';

export const WORKPLACE_LAST_REVIEWED = '2026-08-11';

export const workplacePageProfiles = [
  { value: 'a4', label: 'A4 portrait', widthMm: 210, heightMm: 297, kind: 'sheet' },
  { value: 'thermal-58', label: '58 mm thermal', widthMm: 58, heightMm: 200, kind: 'thermal' },
  { value: 'thermal-80', label: '80 mm thermal', widthMm: 80, heightMm: 200, kind: 'thermal' },
  { value: 'label-4x6', label: '4 × 6 inch shipping label', widthMm: 101.6, heightMm: 152.4, kind: 'label' },
  { value: 'label-sheet-a4', label: 'A4 multi-label sheet', widthMm: 210, heightMm: 297, kind: 'sheet' },
] as const;

export const workplacePageProfileValues = [
  'a4',
  'thermal-58',
  'thermal-80',
  'label-4x6',
  'label-sheet-a4',
] as const;
export type WorkplacePageProfile = (typeof workplacePageProfiles)[number]['value'];

export const workplacePageProfileSchema = z.enum(workplacePageProfileValues);

export const workplaceDocumentTypes = [
  'price-tag',
  'delivery-challan',
  'shipping-label',
  'purchase-order',
  'menu',
  'wage-slip',
  'rent-receipt',
] as const;
export type WorkplaceDocumentType = (typeof workplaceDocumentTypes)[number];

export function isWorkplaceDocument(document: { type: string }): document is WorkplaceDocument {
  return workplaceDocumentTypes.includes(document.type as WorkplaceDocumentType);
}

export type WorkplaceStatusLabel = 'Draft' | 'Template' | 'Declared receipt' | 'Prepared purchase order';

export interface WorkplaceLine {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  amount: string;
  taxRate?: string;
  taxAmount?: string;
}

export interface WorkplaceSection {
  heading: string;
  lines: string[];
}

export interface WorkplaceDocument {
  type: WorkplaceDocumentType;
  title: string;
  subtitle: string;
  statusLabel: WorkplaceStatusLabel;
  pageProfile: WorkplacePageProfile;
  businessName: string;
  contactLine: string;
  metadata: Record<string, string>;
  sections: WorkplaceSection[];
  items: WorkplaceLine[];
  totals: { subtotal: string; tax: string; grandTotal: string; amountInWords?: string } | null;
  barcode: string;
  qrPayload: string;
  footerText: string;
  disclaimer: string;
  exportSettings: { baseFilename: string; formats: Array<'pdf'>; pageProfile: WorkplacePageProfile };
}

export interface NoticePeriodResult {
  startDate: string;
  endDate: string;
  calendarDays: number;
  businessDays: number;
  rule: 'calendar' | 'business-days';
  excludedDays: string[];
}

export interface LeaveBalanceResult {
  annualQuota: string;
  earnedLeave: string;
  usedLeave: string;
  remainingLeave: string;
  proration: 'none' | 'monthly' | 'days';
  asOfDate: string;
}

const text = (label: string, max: number) =>
  z.string().trim().min(1, `Enter ${label}.`).max(max, `${label} must be ${max} characters or fewer.`);
const optionalText = (max: number) =>
  z.string().trim().max(max, `Keep this field to ${max} characters or fewer.`);
const decimalText = (label: string) => z.string().trim().min(1, `Enter ${label}.`);

const dateText = (label: string) =>
  z.string().refine((value) => isValidDate(value), `Enter a valid ${label}.`);

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export interface PriceTagInput {
  businessName: string;
  productName: string;
  mrp: string;
  offerPrice: string;
  sku: string;
  barcode: string;
  pageProfile: WorkplacePageProfile;
  footerText: string;
}
export const priceTagInputSchema = z.object({
  businessName: text('business name', 120),
  productName: text('product name', 120),
  mrp: decimalText('MRP'),
  offerPrice: decimalText('offer price'),
  sku: optionalText(80),
  barcode: optionalText(80),
  pageProfile: workplacePageProfileSchema,
  footerText: optionalText(240),
});

export interface DeliveryChallanInput {
  consignor: string;
  consignee: string;
  itemsText: string;
  reason: string;
  vehicleNumber: string;
  issueDate: string;
  deliveryDate: string;
  pageProfile: WorkplacePageProfile;
  footerText: string;
}
export const deliveryChallanInputSchema = z.object({
  consignor: text('consignor', 200),
  consignee: text('consignee', 200),
  itemsText: text('items', 2000),
  reason: text('reason', 240),
  vehicleNumber: optionalText(40),
  issueDate: dateText('issue date'),
  deliveryDate: dateText('delivery date'),
  pageProfile: workplacePageProfileSchema,
  footerText: optionalText(240),
});

export interface ShippingLabelInput {
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  recipientName: string;
  recipientAddress: string;
  recipientPhone: string;
  orderReference: string;
  parcelCount: string;
  weight: string;
  barcode: string;
  pageProfile: WorkplacePageProfile;
  footerText: string;
}
export const shippingLabelInputSchema = z.object({
  senderName: text('sender name', 120),
  senderAddress: text('sender address', 500),
  senderPhone: optionalText(40),
  recipientName: text('recipient name', 120),
  recipientAddress: text('recipient address', 500),
  recipientPhone: optionalText(40),
  orderReference: optionalText(80),
  parcelCount: decimalText('parcel count'),
  weight: optionalText(40),
  barcode: optionalText(80),
  pageProfile: workplacePageProfileSchema,
  footerText: optionalText(240),
});

export interface PurchaseOrderLineInput {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  taxRate: string;
}
export interface PurchaseOrderInput {
  buyerName: string;
  buyerAddress: string;
  supplierName: string;
  supplierAddress: string;
  poNumber: string;
  poDate: string;
  items: PurchaseOrderLineInput[];
  taxDisplay: 'none' | 'declared';
  terms: string;
  pageProfile: WorkplacePageProfile;
  footerText: string;
}
export const purchaseOrderLineSchema = z.object({
  description: text('item description', 240),
  quantity: decimalText('quantity'),
  unit: optionalText(24),
  unitPrice: decimalText('unit price'),
  taxRate: optionalText(8),
});
export const purchaseOrderInputSchema = z.object({
  buyerName: text('buyer name', 160),
  buyerAddress: text('buyer address', 500),
  supplierName: text('supplier name', 160),
  supplierAddress: text('supplier address', 500),
  poNumber: text('purchase order number', 64),
  poDate: dateText('purchase order date'),
  items: z
    .array(purchaseOrderLineSchema)
    .min(1, 'Add at least one purchase order item.')
    .max(25, 'Keep the order to 25 items or fewer.'),
  taxDisplay: z.enum(['none', 'declared']),
  terms: optionalText(1000),
  pageProfile: workplacePageProfileSchema,
  footerText: optionalText(240),
});

export interface MenuItemInput {
  name: string;
  price: string;
  note: string;
}
export interface MenuSectionInput {
  heading: string;
  items: MenuItemInput[];
}
export interface MenuInput {
  businessName: string;
  address: string;
  phone: string;
  sections: MenuSectionInput[];
  includeQr: boolean;
  qrUrl: string;
  pageProfile: WorkplacePageProfile;
  footerText: string;
}
export const menuItemSchema = z.object({
  name: text('menu item', 120),
  price: optionalText(40),
  note: optionalText(160),
});
export const menuSectionSchema = z.object({
  heading: text('menu section', 120),
  items: z.array(menuItemSchema).min(1, 'Add at least one item to each menu section.').max(30),
});
export const menuInputSchema = z
  .object({
    businessName: text('business name', 120),
    address: optionalText(500),
    phone: optionalText(40),
    sections: z.array(menuSectionSchema).min(1, 'Add at least one menu section.').max(10),
    includeQr: z.boolean(),
    qrUrl: optionalText(2048),
    pageProfile: workplacePageProfileSchema,
    footerText: optionalText(240),
  })
  .superRefine((input, context) => {
    if (input.includeQr) {
      try {
        const value = input.qrUrl.trim();
        const parsed = new URL(value.match(/^[a-z][a-z\d+.-]*:/iu) ? value : `https://${value}`);
        if (
          !['http:', 'https:'].includes(parsed.protocol) ||
          !parsed.hostname ||
          parsed.username ||
          parsed.password
        )
          throw new Error('invalid');
      } catch {
        context.addIssue({
          code: 'custom',
          path: ['qrUrl'],
          message: 'Enter a safe HTTP or HTTPS menu URL for the QR.',
        });
      }
    }
  });

export interface WageSlipInput {
  employerName: string;
  workerName: string;
  period: string;
  grossEarnings: string;
  deductions: string;
  pageProfile: WorkplacePageProfile;
  footerText: string;
}
export const wageSlipInputSchema = z.object({
  employerName: text('employer name', 160),
  workerName: text('worker name', 160),
  period: text('pay period', 80),
  grossEarnings: decimalText('declared earnings'),
  deductions: decimalText('declared deductions'),
  pageProfile: workplacePageProfileSchema,
  footerText: optionalText(240),
});

export interface RentReceiptInput {
  landlordName: string;
  tenantName: string;
  propertyAddress: string;
  period: string;
  amount: string;
  receiptNumber: string;
  date: string;
  pageProfile: WorkplacePageProfile;
  footerText: string;
}
export const rentReceiptInputSchema = z.object({
  landlordName: text('landlord name', 160),
  tenantName: text('tenant name', 160),
  propertyAddress: text('property address', 600),
  period: text('rent period', 80),
  amount: decimalText('rent amount'),
  receiptNumber: text('receipt number', 64),
  date: dateText('receipt date'),
  pageProfile: workplacePageProfileSchema,
  footerText: optionalText(240),
});

export interface NoticePeriodInput {
  startDate: string;
  noticeDays: string;
  rule: 'calendar' | 'business-days';
  includeStart: boolean;
  weekendPattern: 'saturday-sunday' | 'sunday' | 'none';
  customHolidays: string;
}
export const noticePeriodInputSchema = z.object({
  startDate: dateText('start date'),
  noticeDays: decimalText('notice days'),
  rule: z.enum(['calendar', 'business-days']),
  includeStart: z.boolean(),
  weekendPattern: z.enum(['saturday-sunday', 'sunday', 'none']),
  customHolidays: optionalText(1000),
});

export interface LeaveBalanceInput {
  annualQuota: string;
  joiningDate: string;
  asOfDate: string;
  usedLeave: string;
  proration: 'none' | 'monthly' | 'days';
}
export const leaveBalanceInputSchema = z.object({
  annualQuota: decimalText('annual leave quota'),
  joiningDate: dateText('joining date'),
  asOfDate: dateText('as-of date'),
  usedLeave: decimalText('used leave'),
  proration: z.enum(['none', 'monthly', 'days']),
});

function validate<T>(schema: z.ZodType<T>, input: T): ValidationResult<T> {
  const parsed = schema.safeParse(input);
  return parsed.success
    ? { success: true, data: parsed.data }
    : {
        success: false,
        errors: parsed.error.issues.map((issue) => ({
          field: String(issue.path[0] ?? 'form'),
          code: 'invalid_input',
          message: issue.message,
        })),
      };
}
function positive(value: string, field: string) {
  const parsed = parseDecimal(value);
  if (parsed.isNegative()) throw new Error(`${field} cannot be negative.`);
  return parsed;
}
function safeProfile(value: WorkplacePageProfile): WorkplacePageProfile {
  return workplacePageProfiles.some((profile) => profile.value === value) ? value : 'a4';
}
function filename(value: string, fallback: string) {
  return `${
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-|-$/gu, '')
      .slice(0, 60) || fallback
  }`;
}
function baseDocument(input: {
  type: WorkplaceDocumentType;
  title: string;
  subtitle: string;
  statusLabel: WorkplaceStatusLabel;
  pageProfile: WorkplacePageProfile;
  businessName: string;
  contactLine?: string;
  metadata?: Record<string, string>;
  sections?: WorkplaceSection[];
  items?: WorkplaceLine[];
  totals?: WorkplaceDocument['totals'];
  barcode?: string;
  qrPayload?: string;
  footerText?: string;
  disclaimer: string;
}): WorkplaceDocument {
  return {
    type: input.type,
    title: input.title,
    subtitle: input.subtitle,
    statusLabel: input.statusLabel,
    pageProfile: safeProfile(input.pageProfile),
    businessName: input.businessName,
    contactLine: input.contactLine ?? '',
    metadata: input.metadata ?? {},
    sections: input.sections ?? [],
    items: input.items ?? [],
    totals: input.totals ?? null,
    barcode: input.barcode ?? '',
    qrPayload: input.qrPayload ?? '',
    footerText: input.footerText ?? '',
    disclaimer: input.disclaimer,
    exportSettings: {
      baseFilename: filename(input.businessName, `karobarkit-${input.type}`),
      formats: ['pdf'],
      pageProfile: safeProfile(input.pageProfile),
    },
  };
}
export function validatePriceTagInput(input: PriceTagInput) {
  return validate(priceTagInputSchema, input);
}
export function calculatePriceTag(input: PriceTagInput): WorkplaceDocument {
  const value = validateOrThrow(priceTagInputSchema, input);
  const mrp = positive(value.mrp, 'MRP');
  const offer = positive(value.offerPrice, 'Offer price');
  if (offer.gt(mrp)) throw new Error('Offer price cannot be greater than MRP for this discount label.');
  const discount = mrp.isZero() ? new Decimal(0) : mrp.minus(offer).div(mrp).times(100);
  return baseDocument({
    type: 'price-tag',
    title: 'Price Tag',
    subtitle: 'Retail label · Draft',
    statusLabel: 'Draft',
    pageProfile: value.pageProfile,
    businessName: value.businessName,
    metadata: {
      Product: value.productName,
      MRP: formatIndianCurrency(mrp.toString()),
      'Offer price': formatIndianCurrency(offer.toString()),
      Discount: `${decimalToString(discount, 8)}%`,
      ...(value.sku ? { SKU: value.sku } : {}),
    },
    barcode: value.barcode,
    sections: [
      {
        heading: 'Display particulars',
        lines: [
          'MRP and offer price are user-declared.',
          'Check label size and local legal-metrology requirements before sale.',
        ],
      },
    ],
    footerText: value.footerText,
    disclaimer:
      'Draft price tag. KarobarKit does not validate legal-metrology compliance, MRP rules, barcode allocation or product claims.',
  });
}

function splitItemLines(value: string) {
  return value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 100);
}
export function validateDeliveryChallanInput(input: DeliveryChallanInput) {
  return validate(deliveryChallanInputSchema, input);
}
export function calculateDeliveryChallan(input: DeliveryChallanInput): WorkplaceDocument {
  const value = validateOrThrow(deliveryChallanInputSchema, input);
  if (value.deliveryDate < value.issueDate) throw new Error('Delivery date cannot be before issue date.');
  const lines = splitItemLines(value.itemsText);
  if (!lines.length) throw new Error('Add at least one item.');
  return baseDocument({
    type: 'delivery-challan',
    title: 'Delivery Challan',
    subtitle: 'Prepared movement document · Draft',
    statusLabel: 'Draft',
    pageProfile: value.pageProfile,
    businessName: value.consignor,
    metadata: {
      Consignor: value.consignor,
      Consignee: value.consignee,
      Reason: value.reason,
      'Issue date': formatIndianDate(value.issueDate),
      'Delivery date': formatIndianDate(value.deliveryDate),
      ...(value.vehicleNumber ? { Vehicle: value.vehicleNumber } : {}),
    },
    sections: [{ heading: 'Declared items', lines }],
    footerText: value.footerText,
    disclaimer:
      'Draft delivery challan. It does not file or validate e-way bill requirements, transport permissions, ownership or delivery acceptance.',
  });
}

export function validateShippingLabelInput(input: ShippingLabelInput) {
  return validate(shippingLabelInputSchema, input);
}
export function calculateShippingLabel(input: ShippingLabelInput): WorkplaceDocument {
  const value = validateOrThrow(shippingLabelInputSchema, input);
  const parcelCount = positive(value.parcelCount, 'Parcel count');
  if (!parcelCount.isInteger() || parcelCount.isZero())
    throw new Error('Parcel count must be a positive whole number.');
  return baseDocument({
    type: 'shipping-label',
    title: 'Shipping Label',
    subtitle: 'Prepared label · Draft',
    statusLabel: 'Draft',
    pageProfile: value.pageProfile,
    businessName: value.senderName,
    metadata: {
      From: value.senderName,
      'From address': value.senderAddress,
      ...(value.senderPhone ? { 'From phone': value.senderPhone } : {}),
      To: value.recipientName,
      'To address': value.recipientAddress,
      ...(value.recipientPhone ? { 'To phone': value.recipientPhone } : {}),
      ...(value.orderReference ? { Reference: value.orderReference } : {}),
      Parcels: parcelCount.toFixed(0),
      ...(value.weight ? { Weight: value.weight } : {}),
    },
    barcode: value.barcode,
    footerText: value.footerText,
    disclaimer:
      'Draft shipping label. It is not carrier-issued, carrier-accepted or proof of dispatch; verify address, service and barcode requirements before use.',
  });
}

function parsePurchaseLines(items: PurchaseOrderLineInput[]): WorkplaceLine[] {
  return items.map((item, index) => {
    const quantity = positive(item.quantity, 'Quantity');
    const unitPrice = positive(item.unitPrice, 'Unit price');
    const amount = quantity.times(unitPrice);
    const taxRate = item.taxRate.trim() ? positive(item.taxRate, 'Tax rate') : new Decimal(0);
    const taxAmount = amount.times(taxRate).div(100);
    return {
      id: `po-${index + 1}`,
      description: item.description.trim(),
      quantity: decimalToString(quantity),
      unit: item.unit.trim(),
      unitPrice: decimalToString(unitPrice),
      amount: decimalToString(amount),
      taxRate: decimalToString(taxRate),
      taxAmount: decimalToString(taxAmount),
    };
  });
}
export function validatePurchaseOrderInput(input: PurchaseOrderInput) {
  return validate(purchaseOrderInputSchema, input);
}
export function calculatePurchaseOrder(input: PurchaseOrderInput): WorkplaceDocument {
  const value = validateOrThrow(purchaseOrderInputSchema, input);
  const items = parsePurchaseLines(value.items);
  const subtotal = items.reduce((sum, item) => sum.plus(parseDecimal(item.amount)), new Decimal(0));
  const tax =
    value.taxDisplay === 'declared'
      ? items.reduce((sum, item) => sum.plus(parseDecimal(item.taxAmount ?? '0')), new Decimal(0))
      : new Decimal(0);
  const grandTotal = subtotal.plus(tax);
  return baseDocument({
    type: 'purchase-order',
    title: 'Purchase Order',
    subtitle: 'Prepared purchase order · Draft',
    statusLabel: 'Prepared purchase order',
    pageProfile: value.pageProfile,
    businessName: value.buyerName,
    metadata: {
      Buyer: value.buyerName,
      'Buyer address': value.buyerAddress,
      Supplier: value.supplierName,
      'Supplier address': value.supplierAddress,
      'PO number': value.poNumber,
      'PO date': formatIndianDate(value.poDate),
      'Tax display': value.taxDisplay === 'declared' ? 'Declared user-entered rates' : 'No tax display',
    },
    sections: value.terms ? [{ heading: 'Terms', lines: [value.terms] }] : [],
    items,
    totals: {
      subtotal: decimalToString(subtotal),
      tax: decimalToString(tax),
      grandTotal: decimalToString(grandTotal),
      amountInWords: amountToIndianWords(grandTotal.toString()),
    },
    footerText: value.footerText,
    disclaimer:
      'Prepared purchase order. It does not place or transmit an order, confirm stock, accept terms or validate tax treatment.',
  });
}

function menuUrl(value: string) {
  if (!value.trim()) return '';
  const raw = value.trim();
  const parsed = new URL(raw.match(/^[a-z][a-z\d+.-]*:/iu) ? raw : `https://${raw}`);
  return parsed.toString();
}
export function validateMenuInput(input: MenuInput) {
  return validate(menuInputSchema, input);
}
export function calculateMenu(input: MenuInput): WorkplaceDocument {
  const value = validateOrThrow(menuInputSchema, input);
  const sections = value.sections.map((section) => ({
    heading: section.heading,
    lines: section.items.map((item) =>
      [item.name, item.price ? `₹${item.price}` : '', item.note].filter(Boolean).join(' · '),
    ),
  }));
  return baseDocument({
    type: 'menu',
    title: 'Menu',
    subtitle: 'Local menu template · Draft',
    statusLabel: 'Template',
    pageProfile: value.pageProfile,
    businessName: value.businessName,
    contactLine: [value.address, value.phone].filter(Boolean).join(' · '),
    sections,
    qrPayload: value.includeQr ? menuUrl(value.qrUrl) : '',
    footerText: value.footerText,
    disclaimer:
      'Menu template. It does not publish or host a live menu, verify prices, allergens or regulatory claims.',
  });
}

export function validateWageSlipInput(input: WageSlipInput) {
  return validate(wageSlipInputSchema, input);
}
export function calculateWageSlip(input: WageSlipInput): WorkplaceDocument {
  const value = validateOrThrow(wageSlipInputSchema, input);
  const gross = positive(value.grossEarnings, 'Declared earnings');
  const deductions = positive(value.deductions, 'Declared deductions');
  if (deductions.gt(gross)) throw new Error('Declared deductions cannot exceed declared earnings.');
  const net = gross.minus(deductions);
  return baseDocument({
    type: 'wage-slip',
    title: 'Wage Slip',
    subtitle: 'Declared earnings · Draft',
    statusLabel: 'Declared receipt',
    pageProfile: value.pageProfile,
    businessName: value.employerName,
    metadata: {
      Employer: value.employerName,
      Worker: value.workerName,
      Period: value.period,
      'Gross declared': formatIndianCurrency(gross.toString()),
      'Deductions declared': formatIndianCurrency(deductions.toString()),
      'Net declared': formatIndianCurrency(net.toString()),
    },
    totals: {
      subtotal: decimalToString(gross),
      tax: decimalToString(deductions),
      grandTotal: decimalToString(net),
      amountInWords: amountToIndianWords(net.toString()),
    },
    footerText: value.footerText,
    disclaimer:
      'Declared wage slip. It does not calculate statutory payroll, benefits, deductions, minimum wages or employment entitlement by default.',
  });
}

export function validateRentReceiptInput(input: RentReceiptInput) {
  return validate(rentReceiptInputSchema, input);
}
export function calculateRentReceipt(input: RentReceiptInput): WorkplaceDocument {
  const value = validateOrThrow(rentReceiptInputSchema, input);
  const amount = positive(value.amount, 'Rent amount');
  return baseDocument({
    type: 'rent-receipt',
    title: 'Rent Receipt',
    subtitle: 'Declared receipt · Draft',
    statusLabel: 'Declared receipt',
    pageProfile: value.pageProfile,
    businessName: value.landlordName,
    metadata: {
      Landlord: value.landlordName,
      Tenant: value.tenantName,
      Property: value.propertyAddress,
      Period: value.period,
      Amount: formatIndianCurrency(amount.toString()),
      'Receipt number': value.receiptNumber,
      Date: formatIndianDate(value.date),
    },
    totals: {
      subtotal: decimalToString(amount),
      tax: '0',
      grandTotal: decimalToString(amount),
      amountInWords: amountToIndianWords(amount.toString()),
    },
    footerText: value.footerText,
    disclaimer:
      'Declared rent receipt. It does not establish HRA eligibility, payment proof, tenancy rights or landlord/tenant identity.',
  });
}

function validateOrThrow<T>(schema: z.ZodType<T>, input: T): T {
  const result = validate(schema, input);
  if (!result.success) throw new Error(result.errors[0]?.message ?? 'Check the highlighted fields.');
  return result.data;
}

function parseCustomHolidays(value: string) {
  const holidays = value
    .split(/[\s,;]+/u)
    .map((item) => item.trim())
    .filter(Boolean);
  if (holidays.some((holiday) => !isValidDate(holiday))) {
    throw new Error('Use YYYY-MM-DD for custom holiday dates.');
  }
  return [...new Set(holidays)];
}

function datePlusDays(startDate: string, days: number) {
  const date = new Date(`${startDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function validateNoticePeriodInput(input: NoticePeriodInput) {
  return validate(noticePeriodInputSchema, input);
}

export function calculateNoticePeriod(input: NoticePeriodInput): NoticePeriodResult {
  const value = validateOrThrow(noticePeriodInputSchema, input);
  const days = positive(value.noticeDays, 'Notice days');
  if (!days.isInteger() || days.isNegative()) {
    throw new Error('Notice days must be a non-negative whole number.');
  }

  const integerDays = days.toNumber();
  if (integerDays === 0) {
    return {
      startDate: value.startDate,
      endDate: value.startDate,
      calendarDays: 0,
      businessDays: 0,
      rule: value.rule,
      excludedDays: [],
    };
  }

  const start = new Date(`${value.startDate}T00:00:00Z`);
  if (value.rule === 'calendar') {
    const endDate = datePlusDays(value.startDate, value.includeStart ? integerDays - 1 : integerDays);
    const end = new Date(`${endDate}T00:00:00Z`);
    return {
      startDate: value.startDate,
      endDate,
      calendarDays: Math.floor((end.getTime() - start.getTime()) / 86_400_000) + (value.includeStart ? 1 : 0),
      businessDays: integerDays,
      rule: value.rule,
      excludedDays: [],
    };
  }

  const holidays = new Set(parseCustomHolidays(value.customHolidays));
  const isWeekend = (date: Date) => {
    const day = date.getUTCDay();
    return value.weekendPattern === 'saturday-sunday'
      ? day === 0 || day === 6
      : value.weekendPattern === 'sunday'
        ? day === 0
        : false;
  };
  const excludedDays: string[] = [];
  const cursor = new Date(start.getTime());
  let counted = 0;
  let calendarDays = 0;
  while (counted < integerDays) {
    const date = cursor.toISOString().slice(0, 10);
    const isStartBoundary = calendarDays === 0 && !value.includeStart;
    if (isStartBoundary || isWeekend(cursor) || holidays.has(date)) {
      if (!isStartBoundary) excludedDays.push(date);
    } else {
      counted += 1;
    }
    calendarDays += 1;
    if (counted < integerDays) cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return {
    startDate: value.startDate,
    endDate: cursor.toISOString().slice(0, 10),
    calendarDays,
    businessDays: counted,
    rule: value.rule,
    excludedDays,
  };
}

export function validateLeaveBalanceInput(input: LeaveBalanceInput) {
  return validate(leaveBalanceInputSchema, input);
}

export function calculateLeaveBalance(input: LeaveBalanceInput): LeaveBalanceResult {
  const value = validateOrThrow(leaveBalanceInputSchema, input);
  const quota = positive(value.annualQuota, 'Annual leave quota');
  const used = positive(value.usedLeave, 'Used leave');
  if (value.asOfDate < value.joiningDate) throw new Error('As-of date cannot be before joining date.');

  let earned = quota;
  if (value.proration === 'monthly') {
    const start = new Date(`${value.joiningDate}T00:00:00Z`);
    const end = new Date(`${value.asOfDate}T00:00:00Z`);
    const months = Math.max(
      0,
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1,
    );
    earned = quota.times(Math.min(months, 12)).div(12);
  } else if (value.proration === 'days') {
    const start = new Date(`${value.joiningDate}T00:00:00Z`);
    const end = new Date(`${value.asOfDate}T00:00:00Z`);
    const elapsed = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1);
    const yearDays = new Date(Date.UTC(start.getUTCFullYear(), 1, 29)).getUTCMonth() === 1 ? 366 : 365;
    earned = quota.times(Math.min(elapsed, yearDays)).div(yearDays);
  }
  if (used.gt(earned)) throw new Error('Used leave cannot exceed earned leave under this policy.');
  return {
    annualQuota: decimalToString(quota),
    earnedLeave: decimalToString(earned),
    usedLeave: decimalToString(used),
    remainingLeave: decimalToString(earned.minus(used)),
    proration: value.proration,
    asOfDate: value.asOfDate,
  };
}
