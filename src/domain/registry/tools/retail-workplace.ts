import {
  calculateDeliveryChallan,
  calculateLeaveBalance,
  calculateMenu,
  calculateNoticePeriod,
  calculatePriceTag,
  calculatePurchaseOrder,
  calculateRentReceipt,
  calculateShippingLabel,
  calculateWageSlip,
  leaveBalanceInputSchema,
  deliveryChallanInputSchema,
  menuInputSchema,
  noticePeriodInputSchema,
  priceTagInputSchema,
  purchaseOrderInputSchema,
  rentReceiptInputSchema,
  shippingLabelInputSchema,
  wageSlipInputSchema,
  type DeliveryChallanInput,
  type LeaveBalanceInput,
  type LeaveBalanceResult,
  type MenuInput,
  type NoticePeriodInput,
  type NoticePeriodResult,
  type PriceTagInput,
  type PurchaseOrderInput,
  type RentReceiptInput,
  type ShippingLabelInput,
  type WageSlipInput,
  type WorkplaceDocument,
  type WorkplacePageProfile,
  validateDeliveryChallanInput,
  validateLeaveBalanceInput,
  validateMenuInput,
  validateNoticePeriodInput,
  validatePriceTagInput,
  validatePurchaseOrderInput,
  validateRentReceiptInput,
  validateShippingLabelInput,
  validateWageSlipInput,
  WORKPLACE_LAST_REVIEWED,
} from '@/domain/documents/workplace';
import { formatIndianDate, formatIndianNumber } from '@/domain/formatting/indian';

import type { SourceReference, ToolCapability, ToolDefinition, ToolKind, ToolUiAdapter } from '../types';
import { liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const RETAIL_WORKPLACE_FEATURE_FLAG = 'retail-workplace-wave';
export const RETAIL_WORKPLACE_LAST_REVIEWED = WORKPLACE_LAST_REVIEWED;

const workplaceSource: SourceReference = {
  id: 'karobarkit-retail-workplace-methods-v1',
  title: 'Retail, document and workplace operations methodology v1',
  publisher: 'KarobarKit controlled methodology',
  url: 'https://github.com/Bilal-03/karobarkit/blob/main/docs/product-spec/everyday-tools-expansion-implementation-plan.md',
  lastChecked: RETAIL_WORKPLACE_LAST_REVIEWED,
  evidenceLevel: 'authoritative',
  documentType: 'methodology',
  notes:
    'Local-first document templates and policy-explicit calculators. User-entered identity, prices, dates and employment assumptions are not verified externally.',
  supports: ['document profiles', 'declared arithmetic', 'local-only execution boundary'],
};

const wageBoundarySource: SourceReference = {
  id: 'ministry-labour-employment-india-home',
  title: 'Ministry of Labour and Employment — official information portal',
  publisher: 'Ministry of Labour and Employment, Government of India',
  url: 'https://labour.gov.in/',
  lastChecked: RETAIL_WORKPLACE_LAST_REVIEWED,
  evidenceLevel: 'official',
  documentType: 'official-page',
  notes: 'Context for the statutory boundary; this tool does not calculate or determine statutory payroll.',
};

const rentBoundarySource: SourceReference = {
  id: 'income-tax-department-india-home',
  title: 'Income Tax Department — official information portal',
  publisher: 'Income Tax Department, Government of India',
  url: 'https://www.incometax.gov.in/iec/foportal/',
  lastChecked: RETAIL_WORKPLACE_LAST_REVIEWED,
  evidenceLevel: 'official',
  documentType: 'official-page',
  notes:
    'Context for the declared-receipt boundary; the tool does not determine HRA eligibility or payment proof.',
};

const workplacePrivacy =
  'Inputs and generated documents stay in this browser. They are not sent to analytics, a backend, a URL or a log, and are not saved by default.';
const workplaceDisclaimer =
  'Review every field before printing or sharing. This local draft uses user-declared information and is not an official filing, acceptance, settlement or proof of payment.';

type WorkplaceUi = Extract<ToolUiAdapter, { adapter: 'business-document' }>;

type WorkplaceToolConfig<TInput, TResult> = {
  id: string;
  slug: string;
  kind: ToolKind;
  generatorKind?: 'document';
  ui: WorkplaceUi;
  name: string;
  shortName: string;
  category: string;
  categoryLabel: string;
  secondaryCategories: string[];
  tags: string[];
  searchTerms: string[];
  summary: string;
  riskTier: 'B' | 'C' | 'D';
  method: string;
  capabilities?: readonly ToolCapability[];
  defaultValues: TInput;
  inputSchema: ToolDefinition<TInput, TResult>['inputSchema'];
  validate: ToolDefinition<TInput, TResult>['validate'];
  calculate: ToolDefinition<TInput, TResult>['calculate'];
  renderResult: ToolDefinition<TInput, TResult>['renderResult'];
  limitations: string[];
  seoTitle: string;
  seoDescription: string;
  relatedToolIds: string[];
  howToUse: string[];
  formula: string;
  workedExample: string;
  resultInterpretation: string;
  edgeCases: string[];
  faqs: { question: string; answer: string }[];
  sources?: SourceReference[];
  privacyNote?: string;
  disclaimer?: string;
};

function createWorkplaceTool<TInput, TResult>(
  config: WorkplaceToolConfig<TInput, TResult>,
): ToolDefinition<TInput, TResult> {
  return {
    id: config.id,
    slug: config.slug,
    kind: config.kind,
    generatorKind: config.generatorKind,
    ui: config.ui,
    name: config.name,
    shortName: config.shortName,
    category: config.category,
    categoryLabel: config.categoryLabel,
    secondaryCategories: config.secondaryCategories,
    tags: config.tags,
    searchTerms: config.searchTerms,
    summary: config.summary,
    featured: false,
    launchPriority: 80,
    ...liveLocalMetadata({
      riskTier: config.riskTier,
      reviewCadenceDays: 365,
      policyDependencies: config.riskTier === 'D' ? ['employment and income-tax policy'] : [],
      method: config.method,
      lastVerified: RETAIL_WORKPLACE_LAST_REVIEWED,
      reviewerRole:
        config.riskTier === 'D' ? 'Named policy and professional reviewer' : 'Product and domain review',
      reviewerStatus: config.riskTier === 'D' ? 'pending' : 'not-required',
      lifecycle: 'beta',
      featureFlag: RETAIL_WORKPLACE_FEATURE_FLAG,
      capabilities: config.capabilities ?? [],
    }),
    inputSchema: config.inputSchema,
    defaultValues: config.defaultValues,
    validate: config.validate,
    calculate: config.calculate,
    renderResult: config.renderResult,
    sources: [workplaceSource, ...(config.sources ?? [])],
    limitations: config.limitations,
    lastReviewed: RETAIL_WORKPLACE_LAST_REVIEWED,
    seo: { title: config.seoTitle, description: config.seoDescription, keywords: config.searchTerms },
    relatedToolIds: config.relatedToolIds,
    analyticsPolicy: sharedAnalyticsPolicy,
    howToUse: config.howToUse,
    formula: config.formula,
    workedExample: config.workedExample,
    resultInterpretation: config.resultInterpretation,
    edgeCases: config.edgeCases,
    faqs: config.faqs,
    privacyNote: config.privacyNote ?? workplacePrivacy,
    disclaimer: config.disclaimer ?? workplaceDisclaimer,
  };
}

const profile = (value: WorkplacePageProfile) => value;

export const priceTagTool = createWorkplaceTool<PriceTagInput, WorkplaceDocument>({
  id: 'price-tag-generator',
  slug: 'price-tag-generator',
  kind: 'generator',
  generatorKind: 'document',
  ui: { adapter: 'business-document', variant: 'price-tag' },
  name: 'Price Tag Generator',
  shortName: 'Price Tag',
  category: 'retail-logistics',
  categoryLabel: 'Retail & Logistics',
  secondaryCategories: ['ecommerce'],
  tags: ['price tag', 'mrp', 'retail', 'label', 'discount'],
  searchTerms: ['price tag maker', 'mrp label', 'discount tag', 'retail label sheet'],
  summary:
    'Prepare printable retail price tags with declared MRP, offer price, SKU and an optional scannable Code 128 barcode.',
  riskTier: 'C',
  method:
    'Calculate the declared discount percentage with decimal-safe arithmetic and render it in a selected print profile.',
  capabilities: [
    'barcode-output',
    'download-pdf',
    'print-label-sheet',
    'print-thermal-58',
    'print-thermal-80',
  ],
  defaultValues: {
    businessName: '',
    productName: '',
    mrp: '1000',
    offerPrice: '900',
    sku: '',
    barcode: '',
    pageProfile: profile('label-sheet-a4'),
    footerText: '',
  },
  inputSchema: priceTagInputSchema,
  validate: validatePriceTagInput,
  calculate: (input) => calculatePriceTag(input),
  renderResult: (result) => result.metadata['Offer price'] ?? '',
  limitations: [
    'The barcode is rendered as Code 128, but no GS1 allocation, scanner compatibility or retail-system acceptance is inferred.',
    'Legal-metrology requirements, product claims and label disclosures remain the user’s responsibility.',
  ],
  seoTitle: 'Price Tag Generator | KarobarKit',
  seoDescription:
    'Create local draft price tags for retail products with MRP, offer price, SKU and print profiles.',
  relatedToolIds: ['barcode-generator', 'shipping-label-generator'],
  howToUse: [
    'Enter the store and product details.',
    'Choose a page profile and review the declared discount.',
    'Print a test label and verify size, barcode and required disclosures.',
  ],
  formula: 'Discount % = (MRP − offer price) ÷ MRP × 100',
  workedExample: 'MRP ₹1,000 and offer ₹900 produce a declared 10% discount.',
  resultInterpretation: 'The output is a local draft label based only on the prices entered.',
  edgeCases: ['Offer price cannot exceed MRP.', 'A zero MRP produces a zero discount display.'],
  faqs: [
    {
      question: 'Does this make a legally compliant MRP label?',
      answer: 'No. It is a draft template; verify local legal-metrology requirements before use.',
    },
  ],
});

export const deliveryChallanTool = createWorkplaceTool<DeliveryChallanInput, WorkplaceDocument>({
  id: 'delivery-challan-generator',
  slug: 'delivery-challan-generator',
  kind: 'generator',
  generatorKind: 'document',
  ui: { adapter: 'business-document', variant: 'delivery-challan' },
  name: 'Delivery Challan Generator',
  shortName: 'Delivery Challan',
  category: 'retail-logistics',
  categoryLabel: 'Retail & Logistics',
  secondaryCategories: ['generators'],
  tags: ['delivery challan', 'consignment', 'movement', 'dispatch'],
  searchTerms: ['delivery challan format', 'goods movement document', 'dispatch challan'],
  summary: 'Prepare a declared delivery challan draft with parties, items, reason, vehicle and dates.',
  riskTier: 'C',
  method: 'Validate parties and dates, then render user-entered item lines in a local print-ready document.',
  capabilities: ['download-pdf', 'print-a4', 'print-thermal-58', 'print-thermal-80'],
  defaultValues: {
    consignor: '',
    consignee: '',
    itemsText: 'Item 1',
    reason: 'Stock transfer',
    vehicleNumber: '',
    issueDate: '2026-08-11',
    deliveryDate: '2026-08-11',
    pageProfile: profile('a4'),
    footerText: '',
  },
  inputSchema: deliveryChallanInputSchema,
  validate: validateDeliveryChallanInput,
  calculate: (input) => calculateDeliveryChallan(input),
  renderResult: (result) => result.title,
  limitations: [
    'The output does not file or validate an e-way bill.',
    'Delivery, ownership, transport and acceptance remain outside the tool.',
  ],
  seoTitle: 'Delivery Challan Generator | KarobarKit',
  seoDescription: 'Prepare a local delivery challan draft with parties, items, reason, vehicle and dates.',
  relatedToolIds: ['shipping-label-generator', 'purchase-order-generator'],
  howToUse: [
    'Enter consignor, consignee and one item per line.',
    'Add the movement reason, dates and optional vehicle number.',
    'Review the draft before printing or sharing.',
  ],
  formula: 'Document fields = user-declared parties + item lines + movement metadata',
  workedExample: 'A stock transfer for two item lines can be printed as an A4 draft.',
  resultInterpretation: 'The document records what you entered; it does not confirm movement or acceptance.',
  edgeCases: ['Delivery date cannot precede issue date.', 'Blank item lines are removed.'],
  faqs: [
    { question: 'Does this create an e-way bill?', answer: 'No. It only prepares a local draft challan.' },
  ],
});

export const shippingLabelTool = createWorkplaceTool<ShippingLabelInput, WorkplaceDocument>({
  id: 'shipping-label-generator',
  slug: 'shipping-label-generator',
  kind: 'generator',
  generatorKind: 'document',
  ui: { adapter: 'business-document', variant: 'shipping-label' },
  name: 'Shipping Label Generator',
  shortName: 'Shipping Label',
  category: 'retail-logistics',
  categoryLabel: 'Retail & Logistics',
  secondaryCategories: ['ecommerce'],
  tags: ['shipping label', 'parcel', 'address label', '4x6'],
  searchTerms: ['shipping label maker', '4x6 label', 'parcel label template'],
  summary:
    'Prepare a 4 × 6 shipping label draft with sender, recipient, order reference and an optional scannable Code 128 barcode.',
  riskTier: 'C',
  method: 'Validate parcel count and render user-entered addresses in a local 4 × 6 or sheet profile.',
  capabilities: ['barcode-output', 'download-pdf', 'print-label-4x6'],
  defaultValues: {
    senderName: '',
    senderAddress: '',
    senderPhone: '',
    recipientName: '',
    recipientAddress: '',
    recipientPhone: '',
    orderReference: '',
    parcelCount: '1',
    weight: '',
    barcode: '',
    pageProfile: profile('label-4x6'),
    footerText: '',
  },
  inputSchema: shippingLabelInputSchema,
  validate: validateShippingLabelInput,
  calculate: (input) => calculateShippingLabel(input),
  renderResult: (result) => result.metadata.To ?? '',
  limitations: [
    'The label is not carrier-issued or carrier-accepted.',
    'Addresses, service levels, postage and barcode requirements are not verified.',
  ],
  seoTitle: 'Shipping Label Generator | KarobarKit',
  seoDescription: 'Create a local draft shipping label for a 4 × 6 printer or PDF.',
  relatedToolIds: ['price-tag-generator', 'delivery-challan-generator'],
  howToUse: [
    'Enter sender and recipient addresses.',
    'Add the order reference, parcel count and optional Code 128 barcode.',
    'Print a test label and verify the carrier’s requirements.',
  ],
  formula: 'Label = sender + recipient + parcel metadata + optional barcode value',
  workedExample: 'Parcel count 1 and an order reference are shown on a standard 4 × 6 draft.',
  resultInterpretation: 'The output is a prepared address label, not a shipment booking.',
  edgeCases: ['Parcel count must be a positive whole number.', 'Long addresses wrap in the preview and PDF.'],
  faqs: [
    {
      question: 'Will a courier accept this label?',
      answer: 'Acceptance is carrier-specific and is not promised by this local template.',
    },
  ],
});

export const purchaseOrderTool = createWorkplaceTool<PurchaseOrderInput, WorkplaceDocument>({
  id: 'purchase-order-generator',
  slug: 'purchase-order-generator',
  kind: 'generator',
  generatorKind: 'document',
  ui: { adapter: 'business-document', variant: 'purchase-order' },
  name: 'Purchase Order Generator',
  shortName: 'Purchase Order',
  category: 'retail-logistics',
  categoryLabel: 'Retail & Logistics',
  secondaryCategories: ['business'],
  tags: ['purchase order', 'procurement', 'supplier', 'po'],
  searchTerms: ['purchase order format', 'po generator', 'supplier order template'],
  summary: 'Prepare a purchase order draft with buyer, supplier, items, optional declared tax and terms.',
  riskTier: 'B',
  method: 'Calculate line amounts and optional user-entered tax rates with decimal-safe arithmetic.',
  capabilities: ['download-pdf', 'print-a4'],
  defaultValues: {
    buyerName: '',
    buyerAddress: '',
    supplierName: '',
    supplierAddress: '',
    poNumber: 'PO-001',
    poDate: '2026-08-11',
    items: [{ description: 'Item 1', quantity: '1', unit: 'pcs', unitPrice: '100', taxRate: '0' }],
    taxDisplay: 'none',
    terms: '',
    pageProfile: profile('a4'),
    footerText: '',
  },
  inputSchema: purchaseOrderInputSchema,
  validate: validatePurchaseOrderInput,
  calculate: (input) => calculatePurchaseOrder(input),
  renderResult: (result) => result.totals?.amountInWords ?? '',
  limitations: [
    'The output does not transmit an order or confirm stock, acceptance or terms.',
    'Tax rates are displayed only when the user chooses the declared option.',
  ],
  seoTitle: 'Purchase Order Generator | KarobarKit',
  seoDescription: 'Create a local purchase order draft with items, totals, optional tax display and terms.',
  relatedToolIds: ['delivery-challan-generator', 'price-tag-generator'],
  howToUse: [
    'Enter buyer and supplier details.',
    'Add items and choose whether to display declared tax rates.',
    'Review totals and terms before sending the draft.',
  ],
  formula: 'Line amount = quantity × unit price; declared tax = line amount × tax rate ÷ 100',
  workedExample: 'Two units at ₹100 with a declared 5% rate show ₹200 subtotal and ₹10 declared tax.',
  resultInterpretation: 'Totals are arithmetic on user-entered values and do not represent a tax invoice.',
  edgeCases: [
    'Negative quantities, prices and rates are rejected.',
    'No tax display keeps the tax total at zero.',
  ],
  faqs: [
    {
      question: 'Does this place an order with the supplier?',
      answer: 'No. It prepares a purchase order draft for your review.',
    },
  ],
});

export const menuTool = createWorkplaceTool<MenuInput, WorkplaceDocument>({
  id: 'menu-generator',
  slug: 'menu-generator',
  kind: 'generator',
  generatorKind: 'document',
  ui: { adapter: 'business-document', variant: 'menu' },
  name: 'Menu Generator',
  shortName: 'Menu',
  category: 'marketing-digital',
  categoryLabel: 'Marketing & Digital',
  secondaryCategories: ['generators'],
  tags: ['menu', 'restaurant', 'price list', 'qr'],
  searchTerms: ['menu card maker', 'restaurant menu template', 'digital menu qr'],
  summary: 'Create a local menu template with sections, items, prices and an optional QR destination.',
  riskTier: 'B',
  method: 'Validate menu sections and safe HTTP(S) QR destinations, then render a printable local template.',
  capabilities: ['download-pdf', 'print-a4', 'qr-output'],
  defaultValues: {
    businessName: '',
    address: '',
    phone: '',
    sections: [{ heading: 'Featured', items: [{ name: 'Item 1', price: '100', note: '' }] }],
    includeQr: false,
    qrUrl: '',
    pageProfile: profile('a4'),
    footerText: '',
  },
  inputSchema: menuInputSchema,
  validate: validateMenuInput,
  calculate: (input) => calculateMenu(input),
  renderResult: (result) => result.businessName,
  limitations: [
    'The tool does not publish or host a live menu.',
    'Prices, allergens, ingredients and claims are not verified.',
  ],
  seoTitle: 'Menu Generator | KarobarKit',
  seoDescription: 'Create a printable menu template with sections, item prices and an optional safe QR URL.',
  relatedToolIds: ['vcard-qr-generator', 'whatsapp-link-generator'],
  howToUse: [
    'Enter the business identity and menu sections.',
    'Optionally add a safe HTTPS QR destination.',
    'Review prices and print a test page before sharing.',
  ],
  formula: 'Menu = identity + sections + item names/prices + optional QR payload',
  workedExample: 'A Featured section with two items produces a single-page menu draft.',
  resultInterpretation: 'The QR payload opens only if the user chooses to scan or open it.',
  edgeCases: ['QR URLs must use HTTP or HTTPS.', 'Long item notes wrap without being truncated.'],
  faqs: [
    {
      question: 'Does this host my digital menu?',
      answer: 'No. It only prepares a local printable template and optional QR payload.',
    },
  ],
});

export const wageSlipTool = createWorkplaceTool<WageSlipInput, WorkplaceDocument>({
  id: 'wage-slip-generator',
  slug: 'wage-slip-generator',
  kind: 'generator',
  generatorKind: 'document',
  ui: { adapter: 'business-document', variant: 'wage-slip' },
  name: 'Wage Slip Generator',
  shortName: 'Wage Slip',
  category: 'hr-salary',
  categoryLabel: 'HR & Salary',
  secondaryCategories: ['generators'],
  tags: ['wage slip', 'salary', 'earnings', 'pay period'],
  searchTerms: ['wage slip format', 'salary slip draft', 'worker earnings receipt'],
  summary: 'Prepare a declared wage slip with employer, worker, period, earnings and deductions.',
  riskTier: 'D',
  method:
    'Subtract declared deductions from declared earnings with decimal-safe arithmetic; no statutory payroll rules are inferred.',
  capabilities: ['download-pdf', 'print-thermal-58', 'print-thermal-80'],
  defaultValues: {
    employerName: '',
    workerName: '',
    period: 'August 2026',
    grossEarnings: '10000',
    deductions: '0',
    pageProfile: profile('thermal-80'),
    footerText: '',
  },
  inputSchema: wageSlipInputSchema,
  validate: validateWageSlipInput,
  calculate: (input) => calculateWageSlip(input),
  renderResult: (result) => result.totals?.amountInWords ?? '',
  sources: [wageBoundarySource],
  limitations: [
    'This is a declared receipt, not a statutory payroll calculation.',
    'It does not determine benefits, minimum wages, deductions or employment entitlement.',
  ],
  seoTitle: 'Wage Slip Generator | KarobarKit',
  seoDescription: 'Create a local declared wage slip draft with earnings and deductions.',
  relatedToolIds: ['rent-receipt-generator', 'notice-period-calculator'],
  howToUse: [
    'Enter employer, worker and pay-period details.',
    'Enter declared earnings and deductions.',
    'Review the net declared amount and print a test slip.',
  ],
  formula: 'Net declared = gross earnings − declared deductions',
  workedExample: '₹10,000 gross less ₹500 declared deductions produces ₹9,500 net declared.',
  resultInterpretation: 'The result is a declared arithmetic summary, not a payroll determination.',
  edgeCases: ['Deductions cannot exceed gross earnings.', 'Zero deductions are allowed.'],
  faqs: [
    {
      question: 'Is this an official salary slip?',
      answer: 'No. It is a local declared template and should be reviewed by the employer.',
    },
  ],
});

export const rentReceiptTool = createWorkplaceTool<RentReceiptInput, WorkplaceDocument>({
  id: 'rent-receipt-generator',
  slug: 'rent-receipt-generator',
  kind: 'generator',
  generatorKind: 'document',
  ui: { adapter: 'business-document', variant: 'rent-receipt' },
  name: 'Rent Receipt Generator',
  shortName: 'Rent Receipt',
  category: 'hr-salary',
  categoryLabel: 'HR & Salary',
  secondaryCategories: ['generators'],
  tags: ['rent receipt', 'tenant', 'landlord', 'hra'],
  searchTerms: ['rent receipt format', 'house rent receipt', 'rent receipt pdf'],
  summary: 'Prepare a declared rent receipt draft with landlord, tenant, property, period and amount.',
  riskTier: 'D',
  method: 'Format a user-declared rent amount and receipt metadata with Indian date and number formatting.',
  capabilities: ['download-pdf', 'print-a4', 'print-thermal-58', 'print-thermal-80'],
  defaultValues: {
    landlordName: '',
    tenantName: '',
    propertyAddress: '',
    period: 'August 2026',
    amount: '10000',
    receiptNumber: 'RR-001',
    date: '2026-08-11',
    pageProfile: profile('a4'),
    footerText: '',
  },
  inputSchema: rentReceiptInputSchema,
  validate: validateRentReceiptInput,
  calculate: (input) => calculateRentReceipt(input),
  renderResult: (result) => result.totals?.amountInWords ?? '',
  sources: [rentBoundarySource],
  limitations: [
    'The receipt does not prove payment, establish tenancy or determine HRA eligibility.',
    'Identity, amount and date remain user-declared.',
  ],
  seoTitle: 'Rent Receipt Generator | KarobarKit',
  seoDescription: 'Create a local declared rent receipt draft with amount in Indian number words.',
  relatedToolIds: ['wage-slip-generator', 'leave-balance-calculator'],
  howToUse: [
    'Enter landlord, tenant and property details.',
    'Add the rent period, amount and receipt date.',
    'Review the declared receipt before printing or sharing.',
  ],
  formula: 'Receipt amount = user-declared rent amount; words = Indian amount wording',
  workedExample: 'A declared ₹10,000 monthly rent is shown as ₹10,000.00 and in Indian words.',
  resultInterpretation:
    'The output is a receipt template only; payment evidence must come from the parties and their records.',
  edgeCases: ['Negative amounts are rejected.', 'Date must be a valid YYYY-MM-DD value.'],
  faqs: [
    {
      question: 'Can I use this to claim HRA?',
      answer: 'The tool does not determine HRA eligibility or provide payment proof.',
    },
  ],
});

export const noticePeriodTool = createWorkplaceTool<NoticePeriodInput, NoticePeriodResult>({
  id: 'notice-period-calculator',
  slug: 'notice-period-calculator',
  kind: 'calculator',
  ui: { adapter: 'business-document', variant: 'notice-period' },
  name: 'Notice Period Calculator',
  shortName: 'Notice Period',
  category: 'hr-salary',
  categoryLabel: 'HR & Salary',
  secondaryCategories: [],
  tags: ['notice period', 'last working day', 'business days', 'employment'],
  searchTerms: ['notice period end date', 'last working day calculator', 'business day notice'],
  summary: 'Estimate a notice-period end date using calendar or business days and declared holidays.',
  riskTier: 'C',
  method:
    'Iterate UTC dates locally and count the selected calendar/business-day rule with optional weekend and holiday exclusions.',
  defaultValues: {
    startDate: '2026-08-11',
    noticeDays: '30',
    rule: 'calendar',
    includeStart: true,
    weekendPattern: 'saturday-sunday',
    customHolidays: '',
  },
  inputSchema: noticePeriodInputSchema,
  validate: validateNoticePeriodInput,
  calculate: (input) => calculateNoticePeriod(input),
  renderResult: (result) => `${formatIndianDate(result.endDate)} · ${result.calendarDays} calendar days`,
  limitations: [
    'The result is an estimate under the selected rule and does not decide contractual or legal entitlement.',
    'Employer policy, contract wording and approved leave may change the applicable date.',
  ],
  seoTitle: 'Notice Period Calculator | KarobarKit',
  seoDescription: 'Estimate a notice-period end date with calendar or business-day rules locally.',
  relatedToolIds: ['leave-balance-calculator', 'wage-slip-generator'],
  howToUse: [
    'Enter the start date and notice days.',
    'Choose calendar or business days and a weekend rule.',
    'Add declared holidays if your policy excludes them, then review the estimate.',
  ],
  formula: 'End date = first date on which the selected notice-day count is reached',
  workedExample: 'Thirty calendar days including 11 August 2026 end on 9 September 2026.',
  resultInterpretation: 'The date is a policy-based estimate, not a contractual conclusion.',
  edgeCases: [
    'The start-date inclusion choice changes the end date.',
    'Custom holidays must use YYYY-MM-DD.',
  ],
  faqs: [
    {
      question: 'Does this know my employment contract?',
      answer: 'No. It applies only the rule and dates you enter.',
    },
  ],
});

export const leaveBalanceTool = createWorkplaceTool<LeaveBalanceInput, LeaveBalanceResult>({
  id: 'leave-balance-calculator',
  slug: 'leave-balance-calculator',
  kind: 'calculator',
  ui: { adapter: 'business-document', variant: 'leave-balance' },
  name: 'Leave Balance Calculator',
  shortName: 'Leave Balance',
  category: 'hr-salary',
  categoryLabel: 'HR & Salary',
  secondaryCategories: [],
  tags: ['leave balance', 'leave quota', 'proration', 'hr'],
  searchTerms: ['leave balance calculator', 'earned leave proration', 'annual leave remaining'],
  summary:
    'Estimate earned and remaining leave from an annual quota, joining date, as-of date and used leave.',
  riskTier: 'C',
  method: 'Apply a selected none, monthly or day-based proration method with decimal-safe arithmetic.',
  defaultValues: {
    annualQuota: '24',
    joiningDate: '2026-01-01',
    asOfDate: '2026-08-11',
    usedLeave: '4',
    proration: 'monthly',
  },
  inputSchema: leaveBalanceInputSchema,
  validate: validateLeaveBalanceInput,
  calculate: (input) => calculateLeaveBalance(input),
  renderResult: (result) => `${formatIndianNumber(result.remainingLeave)} days remaining`,
  limitations: [
    'The result reflects only the selected user policy and does not determine employer entitlement.',
    'Carry-forward, encashment, probation, leave types and approvals are not modelled.',
  ],
  seoTitle: 'Leave Balance Calculator | KarobarKit',
  seoDescription: 'Estimate earned and remaining leave with transparent local proration choices.',
  relatedToolIds: ['notice-period-calculator', 'wage-slip-generator'],
  howToUse: [
    'Enter annual quota, joining date and as-of date.',
    'Choose no proration, monthly proration or day-based proration.',
    'Enter used leave and review the declared balance.',
  ],
  formula: 'Remaining leave = earned leave under selected proration − used leave',
  workedExample: 'A 24-day quota with eight months of monthly proration earns 16 days before used leave.',
  resultInterpretation:
    'The result is a policy estimate and should be checked against the employer’s leave ledger.',
  edgeCases: [
    'As-of date cannot precede joining date.',
    'Used leave cannot exceed earned leave under the selected policy.',
  ],
  faqs: [
    {
      question: 'Does this calculate statutory leave entitlement?',
      answer: 'No. It applies your chosen policy assumptions only.',
    },
  ],
});

export const retailWorkplaceTools = [
  priceTagTool,
  deliveryChallanTool,
  shippingLabelTool,
  purchaseOrderTool,
  menuTool,
  wageSlipTool,
  rentReceiptTool,
  noticePeriodTool,
  leaveBalanceTool,
] as const;
