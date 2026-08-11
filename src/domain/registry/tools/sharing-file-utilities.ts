import { z } from 'zod';

import {
  barcodeInputSchema,
  calculateBarcode,
  type BarcodeInput,
  type BarcodeResult,
  validateBarcodeInput,
} from '@/domain/qr/barcode';
import { classifyDecodedContent } from '@/domain/qr/decoded-content';
import {
  calculateVcard,
  type VcardInput,
  type VcardResult,
  validateVcardInput,
  vcardInputSchema,
} from '@/domain/qr/vcard';
import {
  calculateWhatsapp,
  type WhatsappInput,
  type WhatsappResult,
  validateWhatsappInput,
  whatsappInputSchema,
} from '@/domain/qr/whatsapp';
import {
  calculateWifi,
  type WifiInput,
  type WifiResult,
  validateWifiInput,
  wifiInputSchema,
} from '@/domain/qr/wifi';
import {
  calculateImageProcessingPlan,
  imageProcessingInputSchema,
  type ImageProcessingInput,
  type ImageProcessingPlan,
  validateImageProcessingInput,
} from '@/domain/files/image';
import {
  calculateFaviconPlan,
  faviconInputSchema,
  type FaviconInput,
  type FaviconPlan,
  validateFaviconInput,
} from '@/domain/files/favicon';
import {
  pdfOperationInputSchema,
  type PdfOperationInput,
  type PdfFileInfo,
  validatePdfOperationInput,
} from '@/domain/files/pdf';
import {
  calculateEmailSignature,
  emailSignatureInputSchema,
  type EmailSignatureInput,
  type EmailSignatureResult,
  validateEmailSignatureInput,
} from '@/domain/marketing/email-signature';
import {
  calculateReviewRequest,
  reviewRequestInputSchema,
  type ReviewRequestInput,
  type ReviewRequestResult,
  validateReviewRequestInput,
} from '@/domain/marketing/review-request';
import type { ValidationResult } from '@/domain/calculations/types';
import type { ToolCapability, ToolDefinition, ToolKind, ToolUiAdapter } from '../types';
import { liveLocalMetadata, qrStandardSource, sharedAnalyticsPolicy } from '../shared';

export const SHARING_FILE_UTILITIES_FEATURE_FLAG = 'sharing-file-utilities-wave';
export const SHARING_FILE_UTILITIES_LAST_REVIEWED = '2026-08-10';

const sharingFileSource = {
  id: 'karobarkit-sharing-file-methods-v1',
  title: 'Sharing and file utilities methodology v1',
  publisher: 'KarobarKit controlled methodology',
  url: 'https://github.com/Bilal-03/karobarkit/blob/main/docs/product-spec/everyday-tools-expansion-implementation-plan.md',
  lastChecked: SHARING_FILE_UTILITIES_LAST_REVIEWED,
  evidenceLevel: 'authoritative' as const,
  documentType: 'methodology' as const,
  notes:
    'Local-first payload construction and browser file processing with explicit safety limits. Destinations, files and branding values are user supplied.',
  supports: ['payload escaping', 'file limits', 'safe decoded-content handling', 'local-only boundary'],
};

const sharingPrivacy =
  'Inputs, generated content and local files stay in this browser. They are not sent to analytics, a backend, a URL or a log, and are not saved by default.';
const filePrivacy =
  'Selected files are processed locally in this browser. Files and their contents are not uploaded, stored, put in URLs or sent to analytics.';
const sharingDisclaimer =
  'Review generated content, destination URLs and downloaded files before sharing or operational use. KarobarKit does not verify ownership, delivery, reputation or legal compliance.';

type SharingConfig<TInput, TResult> = {
  id: string;
  slug: string;
  kind: ToolKind;
  ui: ToolUiAdapter;
  generatorKind?: 'qr' | 'document';
  name: string;
  shortName: string;
  category: string;
  categoryLabel: string;
  secondaryCategories: string[];
  tags: string[];
  searchTerms: string[];
  summary: string;
  riskTier: 'A' | 'B' | 'C';
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
  privacyNote: string;
  disclaimer?: string;
};

function createSharingTool<TInput, TResult>(
  config: SharingConfig<TInput, TResult>,
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
    launchPriority: 100,
    ...liveLocalMetadata({
      riskTier: config.riskTier,
      reviewCadenceDays: 365,
      method: config.method,
      lastVerified: SHARING_FILE_UTILITIES_LAST_REVIEWED,
      lifecycle: 'beta',
      featureFlag: SHARING_FILE_UTILITIES_FEATURE_FLAG,
      capabilities: config.capabilities ?? [],
    }),
    inputSchema: config.inputSchema,
    defaultValues: config.defaultValues,
    validate: config.validate,
    calculate: config.calculate,
    renderResult: config.renderResult,
    sources: [sharingFileSource, ...(config.ui.adapter === 'qr-barcode-generator' ? [qrStandardSource] : [])],
    limitations: config.limitations,
    lastReviewed: SHARING_FILE_UTILITIES_LAST_REVIEWED,
    seo: { title: config.seoTitle, description: config.seoDescription, keywords: config.searchTerms },
    relatedToolIds: config.relatedToolIds,
    analyticsPolicy: sharedAnalyticsPolicy,
    howToUse: config.howToUse,
    formula: config.formula,
    workedExample: config.workedExample,
    resultInterpretation: config.resultInterpretation,
    edgeCases: config.edgeCases,
    faqs: config.faqs,
    privacyNote: config.privacyNote,
    disclaimer: config.disclaimer,
  };
}

const scannerInputSchema = z.object({ content: z.string() });
type ScannerInput = z.infer<typeof scannerInputSchema>;
type ScannerResult = ReturnType<typeof classifyDecodedContent>;
const scannerValidate = (input: ScannerInput): ValidationResult<ScannerInput> => {
  if (!input.content.trim())
    return {
      success: false,
      errors: [
        {
          field: 'content',
          code: 'required',
          message: 'Upload an image or enter decoded content to review.',
        },
      ],
    };
  return { success: true, data: { content: input.content.trim() } };
};
const scannerCalculate = (input: ScannerInput) => classifyDecodedContent(input.content);

const pdfValidate = validatePdfOperationInput;
const pdfCalculate = (input: PdfOperationInput): PdfFileInfo =>
  ({ name: 'local-selection', type: 'application/pdf', bytes: 0, pages: 0, ...input }) as PdfFileInfo;

export const whatsappLinkTool = createSharingTool<WhatsappInput, WhatsappResult>({
  id: 'whatsapp-link-generator',
  slug: 'whatsapp-link-generator',
  kind: 'generator',
  generatorKind: 'qr',
  ui: { adapter: 'qr-barcode-generator', variant: 'whatsapp-link' },
  name: 'WhatsApp Link Generator',
  shortName: 'WhatsApp Link',
  category: 'marketing-digital',
  categoryLabel: 'Marketing & Digital',
  secondaryCategories: [],
  tags: ['whatsapp', 'link', 'qr', 'message'],
  searchTerms: ['whatsapp click to chat link', 'whatsapp link generator', 'whatsapp qr'],
  summary: 'Create a safe WhatsApp click-to-chat link and optional QR payload without sending a message.',
  riskTier: 'B',
  method:
    'Validate an international phone number, percent-encode an optional message and build a wa.me link locally.',
  defaultValues: { countryCode: '91', phone: '', message: '' },
  inputSchema: whatsappInputSchema,
  validate: validateWhatsappInput,
  calculate: (input) => calculateWhatsapp(input),
  renderResult: (result) => result.payload,
  capabilities: ['qr-output', 'download-png', 'download-svg'],
  limitations: [
    'The link does not verify that the number has WhatsApp or send a message.',
    'Country and phone values are user supplied and are not looked up.',
  ],
  seoTitle: 'WhatsApp Link Generator | KarobarKit',
  seoDescription:
    'Create a safe WhatsApp click-to-chat link and QR payload locally without automatic sending.',
  relatedToolIds: ['vcard-qr-generator', 'review-request-builder'],
  howToUse: [
    'Enter the country code and phone digits.',
    'Optionally add a short message.',
    'Review the destination and scan-test the QR before sharing.',
  ],
  formula: 'wa.me link = https://wa.me/{country code}{phone}?text={encoded message}',
  workedExample: 'Country code 91 and phone 9876543210 become https://wa.me/919876543210.',
  resultInterpretation: 'Opening the link is a separate user action in WhatsApp or a browser.',
  edgeCases: [
    'Unsafe protocols are never generated.',
    'Numbers are normalized to digits and limited to an international maximum.',
  ],
  faqs: [
    {
      question: 'Does this message send automatically?',
      answer: 'No. The tool only prepares a link; the user must choose whether to open and send it.',
    },
  ],
  privacyNote: sharingPrivacy,
  disclaimer: sharingDisclaimer,
});

export const vcardQrTool = createSharingTool<VcardInput, VcardResult>({
  id: 'vcard-qr-generator',
  slug: 'vcard-qr-generator',
  kind: 'generator',
  generatorKind: 'qr',
  ui: { adapter: 'qr-barcode-generator', variant: 'vcard' },
  name: 'vCard QR Generator',
  shortName: 'vCard QR',
  category: 'marketing-digital',
  categoryLabel: 'Marketing & Digital',
  secondaryCategories: [],
  tags: ['vcard', 'contact', 'qr', 'vcf'],
  searchTerms: ['contact qr code', 'vcard generator', 'vcf download'],
  summary: 'Create a standards-shaped vCard contact payload, QR preview and local .vcf download.',
  riskTier: 'B',
  method: 'Escape vCard 3.0 text fields and validate optional contact URLs before local QR encoding.',
  defaultValues: { fullName: '', organization: '', phone: '', email: '', website: '', address: '', note: '' },
  inputSchema: vcardInputSchema,
  validate: validateVcardInput,
  calculate: (input) => calculateVcard(input),
  renderResult: (result) => result.payload,
  capabilities: ['qr-output', 'download-png', 'download-svg', 'download-vcf'],
  limitations: [
    'Contact apps may interpret optional fields differently.',
    'The tool does not verify identity, phone ownership or email deliverability.',
  ],
  seoTitle: 'vCard QR Generator | KarobarKit',
  seoDescription: 'Create a private contact QR code and downloadable vCard locally.',
  relatedToolIds: ['whatsapp-link-generator', 'email-signature-generator'],
  howToUse: [
    'Enter the contact name and any optional details.',
    'Review the escaped contact payload.',
    'Scan-test before downloading the QR or .vcf file.',
  ],
  formula: 'vCard payload = escaped VERSION:3.0 contact fields',
  workedExample: 'A name containing a comma is escaped so contact apps do not split it into another field.',
  resultInterpretation:
    'The QR and .vcf contain the fields shown in the preview; they do not publish the contact.',
  edgeCases: [
    'Control characters and unsafe website protocols are rejected.',
    'Only minimal optional fields are included.',
  ],
  faqs: [
    {
      question: 'Is my contact saved?',
      answer: 'No. Contact fields remain in the active page session until you download or clear them.',
    },
  ],
  privacyNote: sharingPrivacy,
  disclaimer: sharingDisclaimer,
});

export const wifiQrTool = createSharingTool<WifiInput, WifiResult>({
  id: 'wifi-qr-generator',
  slug: 'wifi-qr-generator',
  kind: 'generator',
  generatorKind: 'qr',
  ui: { adapter: 'qr-barcode-generator', variant: 'wifi' },
  name: 'Wi‑Fi QR Generator',
  shortName: 'Wi‑Fi QR',
  category: 'marketing-digital',
  categoryLabel: 'Marketing & Digital',
  secondaryCategories: [],
  tags: ['wifi', 'network', 'qr'],
  searchTerms: ['wifi password qr', 'wireless qr code', 'wifi sharing'],
  summary: 'Prepare a Wi‑Fi connection QR payload with masked password preview and no persistence.',
  riskTier: 'C',
  method: 'Escape SSID and password fields according to the common WIFI QR payload format.',
  defaultValues: { ssid: '', security: 'WPA', password: '', hidden: false },
  inputSchema: wifiInputSchema,
  validate: validateWifiInput,
  calculate: (input) => calculateWifi(input),
  renderResult: (result) => result.payload,
  capabilities: ['qr-output', 'download-png', 'download-svg'],
  limitations: [
    'The password is user supplied and is never verified against a router.',
    'Compatibility depends on the scanning device and network security configuration.',
  ],
  seoTitle: 'Wi‑Fi QR Generator | KarobarKit',
  seoDescription: 'Create a local Wi‑Fi sharing QR code with masked password handling.',
  relatedToolIds: ['vcard-qr-generator'],
  howToUse: [
    'Enter SSID, security type and password.',
    'Review the masked preview and hidden-network setting.',
    'Scan-test with a trusted device before sharing.',
  ],
  formula: 'WIFI:T:{security};S:{escaped SSID};P:{escaped password};H:{hidden};;',
  workedExample: 'A semicolon in an SSID is escaped so it remains part of the network name.',
  resultInterpretation:
    'Scanning may offer to join the network; the tool itself never connects or transmits the password.',
  edgeCases: ['Open networks do not require a password.', 'Control characters and line breaks are rejected.'],
  faqs: [
    {
      question: 'Is the Wi‑Fi password stored?',
      answer: 'No. It stays in browser memory and is never put in analytics or a URL.',
    },
  ],
  privacyNote: `${sharingPrivacy} Passwords are masked by default in the interface.`,
  disclaimer: sharingDisclaimer,
});

export const barcodeGeneratorTool = createSharingTool<BarcodeInput, BarcodeResult>({
  id: 'barcode-generator',
  slug: 'barcode-generator',
  kind: 'generator',
  generatorKind: 'qr',
  ui: { adapter: 'qr-barcode-generator', variant: 'barcode' },
  name: 'Barcode Generator',
  shortName: 'Barcode',
  category: 'retail-logistics',
  categoryLabel: 'Retail & Logistics',
  secondaryCategories: ['marketing-digital'],
  tags: ['barcode', 'code 128', 'ean', 'upc', 'retail'],
  searchTerms: ['barcode maker', 'ean 13 barcode', 'upc barcode', 'code 128'],
  summary: 'Generate supported retail-friendly barcode SVGs with visible symbology and checksum validation.',
  riskTier: 'B',
  method: 'Validate symbology-specific characters and checksums, then render a local vector barcode.',
  defaultValues: { symbology: 'code128', value: '', showLabel: true, width: 'standard' },
  inputSchema: barcodeInputSchema,
  validate: validateBarcodeInput,
  calculate: (input) => calculateBarcode(input),
  renderResult: (result) => result.humanReadable,
  capabilities: ['barcode-output', 'download-svg'],
  limitations: [
    'A valid checksum does not allocate a GS1 prefix or guarantee retail acceptance.',
    'Carrier, retailer and scanner requirements remain authoritative.',
  ],
  seoTitle: 'Barcode Generator | KarobarKit',
  seoDescription: 'Generate Code 128, Code 39, EAN-13 or UPC-A barcode SVGs locally.',
  relatedToolIds: ['volumetric-weight-calculator', 'favicon-app-icon-generator'],
  howToUse: [
    'Choose a supported symbology.',
    'Enter a value and review any generated checksum.',
    'Scan-test the downloaded SVG before production printing.',
  ],
  formula: 'Barcode = start + encoded symbols + checksum + stop',
  workedExample: 'An 11-digit UPC-A value receives its calculated check digit before rendering.',
  resultInterpretation: 'The output is a local barcode graphic, not a product registration or allocation.',
  edgeCases: [
    'EAN-13 and UPC-A check digits are validated.',
    'Values are limited to keep the SVG practical.',
  ],
  faqs: [
    {
      question: 'Does this create a GS1 barcode number?',
      answer: 'No. It renders a value you provide and does not issue or validate a GS1 allocation.',
    },
  ],
  privacyNote: sharingPrivacy,
  disclaimer: sharingDisclaimer,
});

export const qrBarcodeScannerTool = createSharingTool<ScannerInput, ScannerResult>({
  id: 'qr-barcode-scanner',
  slug: 'qr-barcode-scanner',
  kind: 'generator',
  generatorKind: 'qr',
  ui: { adapter: 'qr-barcode-generator', variant: 'scanner' },
  name: 'QR & Barcode Scanner',
  shortName: 'Scanner',
  category: 'marketing-digital',
  categoryLabel: 'Marketing & Digital',
  secondaryCategories: ['retail-logistics'],
  tags: ['scanner', 'qr', 'barcode', 'camera'],
  searchTerms: ['scan qr code', 'scan barcode image', 'camera qr scanner'],
  summary:
    'Decode a QR or barcode from a user-selected image or camera when the browser supports it, then review the content safely.',
  riskTier: 'C',
  method:
    'Use the browser BarcodeDetector API when available and classify decoded schemes without auto-opening them.',
  defaultValues: { content: '' },
  inputSchema: scannerInputSchema,
  validate: scannerValidate,
  calculate: scannerCalculate,
  renderResult: (result) => result.display,
  capabilities: ['scanner', 'camera', 'file-upload'],
  limitations: [
    'Camera support depends on the browser and permission.',
    'Decoded content is displayed first; no link is opened automatically.',
  ],
  seoTitle: 'QR & Barcode Scanner | KarobarKit',
  seoDescription: 'Scan a local image or supported camera stream and review decoded content safely.',
  relatedToolIds: ['url-qr-generator', 'barcode-generator'],
  howToUse: [
    'Choose image upload or explicitly start the camera.',
    'Review decoded text, scheme and domain.',
    'Open only trusted HTTP or HTTPS URLs after your own check.',
  ],
  formula: 'Decoded content → scheme classification → user-reviewed action',
  workedExample: 'A javascript: payload is classified as unsafe and remains text-only.',
  resultInterpretation:
    'Scanning is not verification. Payment, credential-like and unknown schemes remain non-openable.',
  edgeCases: [
    'Malformed or unsupported images show a readable error.',
    'UPI content displays payee and amount fields for review but never confirms payment.',
  ],
  faqs: [
    {
      question: 'Will a scanned URL open automatically?',
      answer:
        'No. HTTP and HTTPS destinations receive an optional action only after the decoded value is shown.',
    },
  ],
  privacyNote: filePrivacy,
  disclaimer: sharingDisclaimer,
});

export const photoResizerTool = createSharingTool<ImageProcessingInput, ImageProcessingPlan>({
  id: 'photo-resizer-compressor',
  slug: 'photo-resizer-compressor',
  kind: 'calculator',
  ui: { adapter: 'file-utility', variant: 'photo-resizer-compressor' },
  name: 'Photo Resizer & Compressor',
  shortName: 'Photo Resizer',
  category: 'media-files',
  categoryLabel: 'Media & Files',
  secondaryCategories: [],
  tags: ['image', 'photo', 'resize', 'compress', 'webp'],
  searchTerms: ['resize image', 'compress photo', 'jpg to webp', 'image dimensions'],
  summary: 'Resize and compress a local image with explicit dimensions, quality, format and pixel limits.',
  riskTier: 'B',
  method: 'Decode a validated image locally, draw it to a bounded canvas and export the selected format.',
  defaultValues: {
    width: '1200',
    height: '1200',
    quality: '0.82',
    format: 'image/jpeg',
    stripMetadata: true,
  },
  inputSchema: imageProcessingInputSchema,
  validate: validateImageProcessingInput,
  calculate: (input) => calculateImageProcessingPlan(input),
  renderResult: (result) => `${result.width} × ${result.height} px`,
  capabilities: ['file-upload', 'image-processing', 'download-png'],
  limitations: [
    'Browser codec support varies by format.',
    'Canvas export strips metadata; it does not guarantee a forensic wipe of every source property.',
  ],
  seoTitle: 'Photo Resizer & Compressor | KarobarKit',
  seoDescription: 'Resize, compress and convert local images in the browser with visible safety limits.',
  relatedToolIds: ['favicon-app-icon-generator'],
  howToUse: [
    'Select a local image within the displayed limits.',
    'Choose output dimensions, quality and format.',
    'Download the processed copy after previewing its size.',
  ],
  formula: 'Output = bounded canvas draw(source image, width, height, quality, format)',
  workedExample: 'A 3,000 × 2,000 image can be exported to a 1,200 × 800 JPEG copy locally.',
  resultInterpretation: 'The output is a new local copy; the source file is not changed.',
  edgeCases: [
    'Oversized or unsupported images are rejected before decode.',
    'Object URLs and image bitmaps are released after processing.',
  ],
  faqs: [
    { question: 'Is the image uploaded?', answer: 'No. The browser decodes and exports the image locally.' },
  ],
  privacyNote: filePrivacy,
  disclaimer: sharingDisclaimer,
});

const pdfResultInputSchema = pdfOperationInputSchema;
export const pdfMergeSplitTool = createSharingTool<PdfOperationInput, PdfFileInfo>({
  id: 'pdf-merge-split',
  slug: 'pdf-merge-split',
  kind: 'generator',
  generatorKind: 'document',
  ui: { adapter: 'file-utility', variant: 'pdf-merge-split' },
  name: 'PDF Merge & Split',
  shortName: 'PDF Tools',
  category: 'media-files',
  categoryLabel: 'Media & Files',
  secondaryCategories: [],
  tags: ['pdf', 'merge', 'split', 'pages'],
  searchTerms: ['merge pdf', 'split pdf', 'extract pdf pages'],
  summary: 'Merge local PDFs or select pages for a local split output with file and page safety limits.',
  riskTier: 'B',
  method:
    'Decode PDFs with pdf-lib locally, enforce file/page limits and copy only selected pages to a new document.',
  defaultValues: { mode: 'merge', splitPages: '' },
  inputSchema: pdfResultInputSchema,
  validate: pdfValidate,
  calculate: pdfCalculate,
  renderResult: (result) => (result.pages ? `${result.pages} pages` : 'Ready for local PDF selection'),
  capabilities: ['file-upload', 'pdf-processing', 'download-pdf'],
  limitations: [
    'Encrypted, malformed or unsupported PDFs are rejected.',
    'The output is not digitally signed and does not preserve every metadata field.',
  ],
  seoTitle: 'PDF Merge & Split Tool | KarobarKit',
  seoDescription: 'Merge PDFs or extract pages locally in your browser with explicit file limits.',
  relatedToolIds: ['photo-resizer-compressor', 'todo-checklist'],
  howToUse: [
    'Choose Merge or Split.',
    'Select PDFs locally; for Split, enter page numbers and ranges.',
    'Review the page count and download the new PDF.',
  ],
  formula: 'Merged PDF = ordered page copies; split PDF = selected page copies',
  workedExample: 'Pages 1 and 3-4 become a three-page local PDF output.',
  resultInterpretation: 'The new file is a local copy and should be opened and checked before sending.',
  edgeCases: [
    'Invalid, encrypted and oversized inputs are reported without upload.',
    'Page ranges are deduplicated and sorted.',
  ],
  faqs: [
    {
      question: 'Does this upload my PDFs?',
      answer: 'No. Processing is browser-local and files are released after the operation.',
    },
  ],
  privacyNote: filePrivacy,
  disclaimer: sharingDisclaimer,
});

export const emailSignatureTool = createSharingTool<EmailSignatureInput, EmailSignatureResult>({
  id: 'email-signature-generator',
  slug: 'email-signature-generator',
  kind: 'generator',
  generatorKind: 'document',
  ui: { adapter: 'business-document', variant: 'email-signature' },
  name: 'Email Signature Generator',
  shortName: 'Email Signature',
  category: 'marketing-digital',
  categoryLabel: 'Marketing & Digital',
  secondaryCategories: [],
  tags: ['email', 'signature', 'html', 'branding'],
  searchTerms: ['email signature html', 'professional email footer', 'gmail signature'],
  summary: 'Build an escaped, local HTML email signature with safe HTTP(S) links and plain-text fallback.',
  riskTier: 'B',
  method:
    'Escape visible text and validate destination schemes before assembling a table-based email signature.',
  defaultValues: {
    name: '',
    role: '',
    company: '',
    phone: '',
    email: '',
    website: '',
    linkedin: '',
    accent: 'teal',
  },
  inputSchema: emailSignatureInputSchema,
  validate: validateEmailSignatureInput,
  calculate: (input) => calculateEmailSignature(input),
  renderResult: (result) => result.plainText,
  capabilities: ['download-html', 'download-text'],
  limitations: [
    'Email clients may rewrite HTML styles and links.',
    'The generator does not publish, send or verify the identity represented.',
  ],
  seoTitle: 'Email Signature Generator | KarobarKit',
  seoDescription: 'Create a safe local HTML and plain-text email signature.',
  relatedToolIds: ['vcard-qr-generator', 'review-request-builder'],
  howToUse: [
    'Enter identity and contact details.',
    'Review the escaped HTML preview and links.',
    'Copy or download only after checking the rendered signature in your email client.',
  ],
  formula: 'Signature HTML = escaped visible fields + validated HTTP(S) links',
  workedExample: 'A name containing < characters is rendered as text rather than executable HTML.',
  resultInterpretation: 'Treat the output as a template and test it in the target email client.',
  edgeCases: ['javascript: and credential-bearing URLs are rejected.', 'Empty optional fields are omitted.'],
  faqs: [
    {
      question: 'Can it send the signature to Gmail automatically?',
      answer: 'No. It only creates local HTML and plain text for a user-controlled copy or export.',
    },
  ],
  privacyNote: sharingPrivacy,
  disclaimer: sharingDisclaimer,
});

export const reviewRequestTool = createSharingTool<ReviewRequestInput, ReviewRequestResult>({
  id: 'review-request-builder',
  slug: 'review-request-builder',
  kind: 'generator',
  generatorKind: 'document',
  ui: { adapter: 'business-document', variant: 'review-request' },
  name: 'Review Request Builder',
  shortName: 'Review Request',
  category: 'marketing-digital',
  categoryLabel: 'Marketing & Digital',
  secondaryCategories: [],
  tags: ['review', 'feedback', 'message', 'whatsapp'],
  searchTerms: ['customer review request', 'feedback message template', 'whatsapp review request'],
  summary:
    'Draft an honest review request around a destination you provide, with optional WhatsApp link output.',
  riskTier: 'B',
  method:
    'Validate the destination URL and compose a transparent template without fabricating reviews or auto-sending.',
  defaultValues: {
    businessName: '',
    reviewUrl: '',
    tone: 'warm',
    whatsappCountryCode: '91',
    whatsappPhone: '',
  },
  inputSchema: reviewRequestInputSchema,
  validate: validateReviewRequestInput,
  calculate: (input) => calculateReviewRequest(input),
  renderResult: (result) => result.message,
  capabilities: [],
  limitations: [
    'The destination and business name are user supplied.',
    'The template asks for honest feedback and does not incentivize or fabricate reviews.',
  ],
  seoTitle: 'Review Request Builder | KarobarKit',
  seoDescription: 'Draft honest customer review requests and optional WhatsApp links locally.',
  relatedToolIds: ['whatsapp-link-generator', 'email-signature-generator'],
  howToUse: [
    'Enter your business name and review URL.',
    'Choose a tone and optionally add a WhatsApp recipient.',
    'Review and send the message yourself through a channel you trust.',
  ],
  formula: 'Message = business context + honest feedback request + validated review URL',
  workedExample:
    'A warm template includes the destination link but never claims a customer had a particular experience.',
  resultInterpretation: 'The output is a draft; it is not an automatic campaign or a review guarantee.',
  edgeCases: [
    'Only HTTP and HTTPS destinations are accepted.',
    'An optional WhatsApp URL is omitted until a valid phone is entered.',
  ],
  faqs: [
    {
      question: 'Does this send messages or create reviews?',
      answer: 'No. It only prepares a draft and optional link for your own review and sending.',
    },
  ],
  privacyNote: sharingPrivacy,
  disclaimer: sharingDisclaimer,
});

export const faviconAppIconTool = createSharingTool<FaviconInput, FaviconPlan>({
  id: 'favicon-app-icon-generator',
  slug: 'favicon-app-icon-generator',
  kind: 'generator',
  generatorKind: 'document',
  ui: { adapter: 'file-utility', variant: 'favicon-app-icon' },
  name: 'Favicon & App Icon Generator',
  shortName: 'Favicon Generator',
  category: 'media-files',
  categoryLabel: 'Media & Files',
  secondaryCategories: ['marketing-digital'],
  tags: ['favicon', 'app icon', 'png', 'brand'],
  searchTerms: ['favicon generator', 'app icon maker', 'website icon png'],
  summary: 'Create a local set of bounded favicon and app-icon PNG sizes from initials, colors or an image.',
  riskTier: 'B',
  method: 'Render a bounded canvas at common web and app dimensions and package the copies in a local ZIP.',
  defaultValues: { mode: 'initials', initials: '', background: '#0d8076', foreground: '#ffffff' },
  inputSchema: faviconInputSchema,
  validate: validateFaviconInput,
  calculate: (input) => calculateFaviconPlan(input),
  renderResult: (result) => `${result.sizes.length} PNG sizes`,
  capabilities: ['file-upload', 'image-processing', 'download-png', 'download-zip'],
  limitations: [
    'App stores and platforms may require additional icon masks or metadata.',
    'The generator does not inspect a brand trademark or publish an icon.',
  ],
  seoTitle: 'Favicon & App Icon Generator | KarobarKit',
  seoDescription: 'Create common favicon and app icon PNG sizes locally and download a ZIP.',
  relatedToolIds: ['photo-resizer-compressor', 'barcode-generator'],
  howToUse: [
    'Choose initials or select a source image.',
    'Set colors and review the generated sizes.',
    'Download the ZIP and inspect each output before publishing.',
  ],
  formula: 'Icon set = bounded canvas render at 16, 32, 48, 180, 192 and 512 px',
  workedExample: 'The initials KK become six PNG files suitable for quick favicon testing.',
  resultInterpretation:
    'Outputs are starting assets; platform-specific manifests and masks remain your responsibility.',
  edgeCases: [
    'Initials are limited to three characters.',
    'Source images are decoded under shared pixel and byte limits.',
  ],
  faqs: [
    {
      question: 'Is the source image uploaded?',
      answer: 'No. The browser creates the icon set and ZIP locally.',
    },
  ],
  privacyNote: filePrivacy,
  disclaimer: sharingDisclaimer,
});

export const sharingFileUtilityTools = [
  whatsappLinkTool,
  vcardQrTool,
  wifiQrTool,
  barcodeGeneratorTool,
  qrBarcodeScannerTool,
  photoResizerTool,
  pdfMergeSplitTool,
  emailSignatureTool,
  reviewRequestTool,
  faviconAppIconTool,
] as const;

export type SharingFileUtilityTool = (typeof sharingFileUtilityTools)[number];
