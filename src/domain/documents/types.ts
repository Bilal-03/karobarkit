import type { ValidationResult } from '@/domain/calculations/types';
import type { GstInvoiceDocument } from '@/domain/invoices/types';

export type DocumentTemplateId = 'editorial' | 'formal';
export type DocumentAccent = 'teal' | 'navy' | 'ochre';
export type LogoAlignment = 'left' | 'center' | 'right';
export type PaymentMethod = 'cash' | 'upi' | 'bank-transfer' | 'card' | 'cheque' | 'other';

export interface AddressBlock {
  text: string;
}

export interface ContactInformation {
  phone: string;
  email: string;
  website: string;
  additionalLine: string;
  socialHandle: string;
}

export interface BusinessIdentity {
  name: string;
  tagline: string;
  address: AddressBlock;
  contact: ContactInformation;
  gstin: string;
  cin: string;
  registrationNumber: string;
}

export interface RecipientBlock {
  name: string;
  address: AddressBlock;
}

export interface DocumentMetadata {
  title: string;
  number: string;
  date: string;
  subject: string;
}

export interface MonetaryValue {
  amount: string;
  currency: 'INR';
  formatted: string;
  inWords: string;
}

export interface SignatureField {
  name: string;
  designation: string;
  showPlaceholder: boolean;
}

export interface BrandingPreferences {
  template: DocumentTemplateId;
  accent: DocumentAccent;
  logoAlignment: LogoAlignment;
  headerDivider: boolean;
  footerDivider: boolean;
}

export interface PageLayout {
  pageSize: 'a4';
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
}

export interface ExportSettings {
  baseFilename: string;
  formats: Array<'pdf' | 'png'>;
}

export interface LogoAsset {
  dataUrl: string;
  mimeType: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
  originalName: string;
}

export interface DocumentFormInput {
  businessName: string;
  businessAddress: string;
  phone: string;
  email: string;
  website: string;
  tagline: string;
  gstin: string;
  cin: string;
  registrationNumber: string;
  additionalContact: string;
  socialHandle: string;
  logo: LogoAsset | null;
  footerText: string;
  template: DocumentTemplateId;
  accent: DocumentAccent;
  logoAlignment: LogoAlignment;
  headerDivider: boolean;
  footerDivider: boolean;
}

export interface LetterheadInput extends DocumentFormInput {
  letterDate: string;
  recipientName: string;
  recipientAddress: string;
  subject: string;
  body: string;
  signatoryName: string;
  signatoryDesignation: string;
  signaturePlaceholder: boolean;
}

export interface PaymentReceiptInput extends DocumentFormInput {
  receiptNumber: string;
  receiptDate: string;
  receivedFrom: string;
  amount: string;
  paymentPurpose: string;
  paymentMethod: PaymentMethod | '';
  transactionReference: string;
  paymentNote: string;
  invoiceReference: string;
  customerAddress: string;
  signatoryName: string;
  signatoryDesignation: string;
  signaturePlaceholder: boolean;
}

export interface LetterheadDocument {
  type: 'letterhead';
  identity: BusinessIdentity;
  logo: LogoAsset | null;
  branding: BrandingPreferences;
  footerText: string;
  metadata: DocumentMetadata;
  recipient: RecipientBlock;
  body: string;
  signature: SignatureField;
  displayDate: string;
  bodyPages: string[];
  layout: PageLayout;
  exportSettings: ExportSettings;
}

export interface PaymentReceiptDocument {
  type: 'payment-receipt';
  identity: BusinessIdentity;
  logo: LogoAsset | null;
  branding: BrandingPreferences;
  footerText: string;
  metadata: DocumentMetadata;
  recipient: RecipientBlock;
  amount: string;
  paymentPurpose: string;
  paymentMethod: PaymentMethod | '';
  transactionReference: string;
  paymentNote: string;
  invoiceReference: string;
  signature: SignatureField;
  displayDate: string;
  monetaryValue: MonetaryValue;
  layout: PageLayout;
  exportSettings: ExportSettings;
}

export type BusinessDocument = LetterheadDocument | PaymentReceiptDocument | GstInvoiceDocument;

export type DocumentValidationResult<T> = ValidationResult<T>;
