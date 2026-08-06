import type {
  BrandingPreferences,
  BusinessIdentity,
  ExportSettings,
  LogoAsset,
  PageLayout,
  SignatureField,
} from '@/domain/documents/types';

export type InvoiceDiscountType = 'none' | 'percentage' | 'fixed';
export type InvoiceSupplyType = 'intra-state' | 'inter-state';
export type RecipientRegistrationStatus = 'registered' | 'unregistered' | 'unknown';
export type InvoiceRateSourceType = 'policy-preset' | 'custom';

export interface InvoiceAddress {
  line1: string;
  line2: string;
  city: string;
  district: string;
  state: string;
  stateCode: string;
  postalCode: string;
  country: string;
}

export interface InvoiceParty {
  legalName: string;
  tradeName: string;
  gstin: string;
  address: InvoiceAddress;
  phone: string;
  email: string;
}

export type InvoiceAddressInput = InvoiceAddress;

export interface InvoicePartyInput {
  legalName: string;
  tradeName: string;
  gstin: string;
  address: InvoiceAddressInput;
  phone: string;
  email: string;
}

export interface InvoiceItemInput {
  id: string;
  description: string;
  hsnOrSac: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountType: InvoiceDiscountType;
  discountValue: string;
  ratePresetId: string;
  customRate: string;
}

export interface GstInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  supplier: InvoicePartyInput;
  recipient: InvoicePartyInput;
  recipientRegistrationStatus: RecipientRegistrationStatus;
  supplyType: InvoiceSupplyType;
  placeOfSupply: {
    state: string;
    stateCode: string;
  };
  reverseCharge: boolean;
  items: InvoiceItemInput[];
  notes: string;
  terms: string;
  paymentDetails: string;
  logo: LogoAsset | null;
}

export interface GstInvoiceLine {
  id: string;
  description: string;
  hsnOrSac: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  grossValue: string;
  discountType: InvoiceDiscountType;
  discountValue: string;
  discountAmount: string;
  taxableValue: string;
  gstRatePercent: string;
  gstPolicyRateId: string;
  rateSourceType: InvoiceRateSourceType;
  rateLabel: string;
  sourceIds: string[];
  gstAmount: string;
  cgstAmount: string;
  sgstOrUtgstAmount: string;
  igstAmount: string;
  lineTotal: string;
  roundingOccurred: boolean;
}

export interface GstInvoiceTaxGroup {
  key: string;
  label: string;
  ratePercent: string;
  rateSourceType: InvoiceRateSourceType;
  taxableValue: string;
  gstAmount: string;
  cgstAmount: string;
  sgstOrUtgstAmount: string;
  igstAmount: string;
  sourceIds: string[];
}

export interface GstInvoiceTotals {
  grossValue: string;
  discountAmount: string;
  taxableValue: string;
  cgstAmount: string;
  sgstOrUtgstAmount: string;
  igstAmount: string;
  gstAmount: string;
  grandTotal: string;
  amountInWords: string;
  roundingOccurred: boolean;
}

export interface GstInvoicePolicySnapshot {
  id: string;
  name: string;
  effectiveFrom: string;
  lastVerifiedOn: string;
  reviewDueOn: string;
  isStale: boolean;
  sourceIds: string[];
}

export interface GstInvoiceDocument {
  type: 'gst-invoice';
  identity: BusinessIdentity;
  logo: LogoAsset | null;
  branding: BrandingPreferences;
  footerText: string;
  invoiceNumber: string;
  invoiceDate: string;
  displayInvoiceDate: string;
  dueDate: string;
  displayDueDate: string;
  supplier: InvoiceParty;
  recipient: InvoiceParty;
  recipientRegistrationStatus: RecipientRegistrationStatus;
  supplyType: InvoiceSupplyType;
  placeOfSupply: {
    state: string;
    stateCode: string;
  } | null;
  reverseCharge: boolean;
  items: GstInvoiceLine[];
  pageChunks: GstInvoiceLine[][];
  taxGroups: GstInvoiceTaxGroup[];
  totals: GstInvoiceTotals;
  notes: string;
  terms: string;
  paymentDetails: string;
  hsnWarning: boolean;
  customRateWarning: boolean;
  policy: GstInvoicePolicySnapshot;
  signature: SignatureField;
  layout: PageLayout;
  exportSettings: ExportSettings;
}
