import { formatIndianCurrency, formatPercentage } from '@/domain/formatting/indian';
import {
  calculateUpi,
  upiInputSchema,
  type UpiInput,
  type UpiResult,
  validateUpiInput,
} from '@/domain/qr/upi';
import {
  calculateUrlQr,
  type UrlQrInput,
  type UrlQrResult,
  urlQrInputSchema,
  validateUrlQrInput,
} from '@/domain/qr/url';
import { QR_LOCAL_PRIVACY_NOTE, UPI_OWNERSHIP_DISCLAIMER } from '@/lib/qr/privacy';
import {
  calculateLetterhead,
  letterheadInputSchema,
  letterheadDefaultValues,
  type LetterheadDocument,
  type LetterheadInput,
  validateLetterheadInput,
} from '@/domain/documents/letterhead';
import {
  calculatePaymentReceipt,
  paymentReceiptInputSchema,
  paymentReceiptDefaultValues,
  type PaymentReceiptDocument,
  type PaymentReceiptInput,
  validatePaymentReceiptInput,
} from '@/domain/documents/payment-receipt';
import { DOCUMENT_LAST_REVIEWED } from '@/domain/documents/constants';

import {
  calculateCagr,
  cagrInputSchema,
  type CagrInput,
  type CagrResult,
  validateCagrInput,
} from '../calculations/cagr';
import {
  calculateRoi,
  roiInputSchema,
  type RoiInput,
  type RoiResult,
  validateRoiInput,
} from '../calculations/roi';
import { calculateGstTool, gstInputSchema, type GstInput, type GstResult, validateGstInput } from '../gst';
import { defaultPolicyContext } from '../policies/context';
import {
  GST_POLICY_AS_OF,
  GST_UI_RATE_PRESET_IDS,
  getGstSourceReferences,
  validateGstUiPresetIds,
} from '../policies/gst';
import type { AnyToolDefinition, SourceReference, ToolDefinition } from './types';

export type { AnyToolDefinition, SourceReference, ToolDefinition } from './types';

export const TOOL_LAST_REVIEWED = '2026-08-06';

const gstUiPolicyValidation = validateGstUiPresetIds(GST_UI_RATE_PRESET_IDS, GST_POLICY_AS_OF);
if (!gstUiPolicyValidation.success) {
  throw new Error('GST UI presets do not match the active GST policy.');
}

const cagrSource: SourceReference = {
  id: 'cagr-standard-financial-mathematics',
  title: 'Compound annual growth rate formula reference',
  publisher: 'Investopedia',
  url: 'https://www.investopedia.com/terms/c/cagr.asp',
  lastChecked: TOOL_LAST_REVIEWED,
  evidenceLevel: 'editorial',
};

const roiSource: SourceReference = {
  id: 'roi-standard-financial-ratio',
  title: 'Return on investment definition and formula',
  publisher: 'Investopedia',
  url: 'https://www.investopedia.com/terms/r/returnoninvestment.asp',
  lastChecked: TOOL_LAST_REVIEWED,
  evidenceLevel: 'editorial',
};

const qrStandardSource: SourceReference = {
  id: 'qr-code-standard-overview',
  title: 'QR Code two-dimensional symbol overview',
  publisher: 'DENSO WAVE',
  url: 'https://www.qrcode.com/en/about/',
  lastChecked: TOOL_LAST_REVIEWED,
  evidenceLevel: 'authoritative',
};

const urlStandardSource: SourceReference = {
  id: 'whatwg-url-standard',
  title: 'URL Standard',
  publisher: 'WHATWG',
  url: 'https://url.spec.whatwg.org/',
  lastChecked: TOOL_LAST_REVIEWED,
  evidenceLevel: 'authoritative',
};

const upiSource: SourceReference = {
  id: 'npci-upi-deep-linking-parameters',
  title: 'UPI QR key deep-linking parameters',
  publisher: 'National Payments Corporation of India',
  url: 'https://www.npci.org.in/PDF/npci/upi/circular/2017/Circular18_BankCompliances_to_enbaleUPIMerchantecosystem_0.pdf',
  lastChecked: TOOL_LAST_REVIEWED,
  evidenceLevel: 'official',
};

const sharedAnalyticsPolicy = {
  allowedEvents: [
    'tool_viewed',
    'tool_started',
    'tool_completed',
    'tool_validation_failed',
    'result_generated',
    'result_printed',
    'result_downloaded',
    'result_copied',
    'result_shared',
    'related_tool_opened',
  ],
  forbiddenProperties: [
    'beginningValue',
    'endingValue',
    'years',
    'investmentCost',
    'finalValue',
    'profit',
    'percentage',
    'amount',
    'result',
    'rawInput',
    'url',
    'normalizedUrl',
    'payload',
    'upiId',
    'payeeName',
    'note',
    'businessName',
    'businessAddress',
    'phone',
    'email',
    'website',
    'tagline',
    'gstin',
    'cin',
    'registrationNumber',
    'additionalContact',
    'socialHandle',
    'recipientName',
    'recipientAddress',
    'body',
    'receiptNumber',
    'receiptDate',
    'receivedFrom',
    'paymentPurpose',
    'paymentMethod',
    'transactionReference',
    'paymentNote',
    'invoiceReference',
    'customerAddress',
    'signatoryName',
    'signatoryDesignation',
    'documentContents',
    'logo',
  ],
};

export const cagrTool: ToolDefinition<CagrInput, CagrResult> = {
  id: 'cagr-calculator',
  slug: 'cagr-calculator',
  kind: 'calculator',
  name: 'CAGR Calculator',
  category: 'financial-calculators',
  categoryLabel: 'Financial calculations',
  summary: 'See the smoothed annual growth rate between two positive values over time.',
  inputSchema: cagrInputSchema,
  defaultValues: { beginningValue: '100000', endingValue: '161051', years: '5' },
  validate: validateCagrInput,
  calculate: calculateCagr,
  renderResult: (result) => formatPercentage(result.percentage),
  sources: [cagrSource],
  limitations: [
    'CAGR smooths the path between two values; it does not show year-by-year volatility or interim cash flows.',
    'The model requires positive beginning and ending values. It is not a substitute for a cash-flow or investment performance analysis.',
  ],
  lastReviewed: TOOL_LAST_REVIEWED,
  seo: {
    title: 'CAGR Calculator for Indian Businesses | KarobarKit',
    description:
      'Calculate compound annual growth rate from beginning value, ending value and duration with a clear formula and worked example.',
    keywords: ['cagr calculator', 'compound annual growth rate', 'business growth calculator'],
  },
  relatedToolIds: ['roi-calculator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter the starting value and the ending value in rupees or another consistent unit.',
    'Enter the number of years between those values.',
    'Select Calculate to see the annualized rate and an interpretation of the result.',
  ],
  formula: 'CAGR = (ending value ÷ beginning value)^(1 ÷ years) − 1',
  workedExample: '₹1,00,000 growing to ₹1,61,051 over 5 years produces a CAGR of approximately 10.00%.',
  resultInterpretation:
    'A positive result is the smoothed annual growth rate. A negative result indicates a smoothed decline across the period.',
  edgeCases: [
    'Zero or negative values cannot be used in this standard CAGR model because the ratio and fractional exponent are not defined for this use case.',
    'Very long periods and values with excessive precision are rejected to keep the calculation predictable and safe.',
  ],
  faqs: [
    {
      question: 'Does CAGR mean the value grew by the same amount every year?',
      answer: 'No. CAGR is a smoothed annual rate. Actual yearly performance may be uneven.',
    },
    {
      question: 'Can I enter a loss?',
      answer:
        'You can enter a lower positive ending value and receive a negative CAGR. Zero or negative values are outside this model.',
    },
  ],
  privacyNote:
    'Inputs stay in this browser. Financial values are not sent to analytics or stored on a server.',
};

export const roiTool: ToolDefinition<RoiInput, RoiResult> = {
  id: 'roi-calculator',
  slug: 'roi-calculator',
  kind: 'calculator',
  name: 'ROI Calculator',
  category: 'financial-calculators',
  categoryLabel: 'Financial calculations',
  summary: 'Compare an investment cost with its final value to see profit, loss and basic ROI.',
  inputSchema: roiInputSchema,
  defaultValues: { investmentCost: '100000', finalValue: '125000' },
  validate: validateRoiInput,
  calculate: calculateRoi,
  renderResult: (result) => formatPercentage(result.percentage),
  sources: [roiSource],
  limitations: [
    'Basic ROI does not account for time, compounding, taxes, fees, inflation or interim cash flows.',
    'Final value is the amount received or valued at the end—not the profit. Profit is calculated as final value minus investment cost.',
  ],
  lastReviewed: TOOL_LAST_REVIEWED,
  seo: {
    title: 'ROI Calculator for Indian Businesses | KarobarKit',
    description:
      'Calculate profit or loss and basic return on investment from cost and final value with an explicit formula and limitations.',
    keywords: ['roi calculator', 'return on investment', 'profit calculator'],
  },
  relatedToolIds: ['cagr-calculator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter the total investment cost.',
    'Enter the final value received or estimated at the end. This is not the profit field.',
    'Select Calculate to see the rupee profit or loss and the basic ROI percentage.',
  ],
  formula: 'ROI = (final value − investment cost) ÷ investment cost × 100',
  workedExample:
    'An investment cost of ₹1,00,000 with a final value of ₹1,25,000 produces ₹25,000 profit and 25.00% ROI.',
  resultInterpretation:
    'A positive ROI means the final value is above the original cost. A negative ROI means the final value is below the original cost.',
  edgeCases: [
    'Investment cost must be greater than zero because zero would make the percentage undefined.',
    'A final value of zero represents a complete loss. Negative final values are not accepted in this model.',
  ],
  faqs: [
    {
      question: 'Is the final value the same as gain?',
      answer: 'No. Enter the complete final value. The tool subtracts the cost to calculate profit or loss.',
    },
    {
      question: 'Does ROI tell me whether an investment was good over time?',
      answer:
        'Only partly. Basic ROI ignores time, so use CAGR or a cash-flow analysis when duration matters.',
    },
  ],
  privacyNote:
    'Inputs stay in this browser. Financial values are not sent to analytics or stored on a server.',
};

export const gstTool: ToolDefinition<GstInput, GstResult> = {
  id: 'gst-calculator',
  slug: 'gst-calculator',
  kind: 'calculator',
  name: 'GST Calculator',
  category: 'billing-taxes',
  categoryLabel: 'Billing & taxes',
  summary: 'Calculate GST on an exclusive or inclusive amount with an explicit tax-component choice.',
  inputSchema: gstInputSchema,
  defaultValues: {
    amount: '1000',
    ratePresetId: 'gst-headline-rate-18',
    customRate: '',
    mode: 'exclusive',
    supplyType: 'unspecified',
  },
  validate: validateGstInput,
  calculate: calculateGstTool,
  renderResult: (result) => formatIndianCurrency(result.gstAmount),
  sources: getGstSourceReferences(),
  limitations: [
    'The 5% and 18% choices are source-backed headline presets, not a classification decision. The calculator does not determine whether they apply to a particular product or service.',
    'It does not determine taxability, HSN/SAC, exemption, reverse charge, input tax credit, compensation cess, registration, filing, export treatment or legal place of supply.',
    'Intra-state results use cautious “CGST + SGST/UTGST” wording because the calculator has no verified location model to choose State tax versus Union Territory tax.',
  ],
  disclaimer:
    'This is an educational arithmetic calculator, not tax advice or a filing determination. Verify the applicable notification, classification, supply type and transaction facts with official GST material or a qualified professional.',
  lastReviewed: TOOL_LAST_REVIEWED,
  seo: {
    title: 'GST Calculator for Indian Businesses | KarobarKit',
    description:
      'Calculate GST inclusive or exclusive amounts with source-backed headline presets, explicit supply-type allocation and transparent rounding.',
    keywords: [
      'gst calculator',
      'gst inclusive calculator',
      'gst exclusive calculator',
      'cgst sgst igst calculator',
    ],
  },
  relatedToolIds: ['roi-calculator', 'payment-receipt-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter a positive amount with up to two decimal places.',
    'Choose a source-backed headline rate or select a clearly labelled custom rate if you already know the rate to use.',
    'Choose whether the amount is GST exclusive or already GST inclusive, then select the tax split you need. The calculator does not infer place of supply.',
  ],
  formula:
    'Exclusive: GST = taxable value × rate ÷ 100. Inclusive: taxable value = total ÷ (1 + rate ÷ 100).',
  workedExample:
    'For a ₹1,000 exclusive amount at 18%, GST is ₹180.00 and the total is ₹1,180.00. This numeric example demonstrates the formula only; it does not classify a supply.',
  resultInterpretation:
    'The result shows arithmetic for the values selected. A source-backed preset does not mean that the rate is legally applicable to your product, service or transaction.',
  edgeCases: [
    'Amounts must be finite, positive, at most two decimal places and no more than ₹999,999,999,999,999.99.',
    'Custom rates allow 0% through 100% with at most two decimal places and always carry a user-responsibility warning.',
    'Currency values use half-up rounding. Intra-state components reconcile by assigning the rounded remainder to SGST/UTGST.',
  ],
  faqs: [
    {
      question: 'Does the calculator tell me which GST rate applies?',
      answer:
        'No. It offers two source-backed headline choices and a custom-rate option, but it does not classify products or services or recommend a rate.',
    },
    {
      question: 'Does intra-state always mean SGST rather than UTGST?',
      answer:
        'The calculator does not decide that. It labels the second component SGST/UTGST until a verified location model is added.',
    },
    {
      question: 'Are my amounts sent anywhere?',
      answer:
        'No. The calculation runs in this browser and financial inputs and results are excluded from analytics and logs.',
    },
  ],
  privacyNote:
    'The amount, rate choice, mode, supply type and calculated tax stay in this browser. They are not sent to analytics, a backend, a URL or a log.',
};

export const urlQrTool: ToolDefinition<UrlQrInput, UrlQrResult> = {
  id: 'url-qr-generator',
  slug: 'url-qr',
  kind: 'generator',
  generatorKind: 'qr',
  name: 'URL QR Generator',
  category: 'marketing-barcodes',
  categoryLabel: 'Marketing & QR codes',
  summary: 'Turn a safe HTTP or HTTPS URL into a downloadable, print-ready QR code.',
  inputSchema: urlQrInputSchema,
  defaultValues: { url: '', size: '512' },
  validate: validateUrlQrInput,
  calculate: calculateUrlQr,
  renderResult: (result) => result.normalizedUrl,
  sources: [qrStandardSource, urlStandardSource],
  limitations: [
    'The generator encodes the URL; it does not check whether the site exists, is trustworthy or will remain online.',
    'Only HTTP and HTTPS URLs are supported. Unsupported protocols are rejected instead of being silently changed.',
  ],
  lastReviewed: TOOL_LAST_REVIEWED,
  seo: {
    title: 'URL QR Generator for Indian Businesses | KarobarKit',
    description:
      'Create a private, client-side QR code from an HTTP or HTTPS URL with configurable size, PNG download and print support.',
    keywords: ['url qr generator', 'website qr code', 'qr code generator'],
  },
  relatedToolIds: ['upi-standee-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter an HTTP or HTTPS URL. A bare domain is normalized to HTTPS; unsafe protocols are rejected.',
    'Choose the output size that suits your screen, print or sign.',
    'Generate the preview, scan-test it with a trusted app, then download PNG or print.',
  ],
  formula: 'QR payload = normalized HTTP(S) URL',
  workedExample:
    'Entering example.com/pricing is normalized to https://example.com/pricing before it is encoded.',
  resultInterpretation:
    'The QR code stores the displayed normalized URL. Scanning it may open that URL in the scanning app or browser.',
  edgeCases: [
    'javascript:, data:, file: and other non-HTTP(S) protocols are rejected and never encoded.',
    'URLs with embedded usernames or passwords are rejected to reduce accidental credential sharing.',
    'A 2,048-character limit keeps the QR payload practical to scan and export.',
  ],
  faqs: [
    {
      question: 'Does KarobarKit visit or check the URL?',
      answer: 'No. The URL is normalized and encoded locally; the tool does not request the destination.',
    },
    {
      question: 'Why did my URL become HTTPS?',
      answer:
        'A bare domain has no protocol, so the tool uses HTTPS as the safe default. URLs that explicitly use another protocol are rejected.',
    },
  ],
  privacyNote: QR_LOCAL_PRIVACY_NOTE,
};

export const upiStandeeTool: ToolDefinition<UpiInput, UpiResult> = {
  id: 'upi-standee-generator',
  slug: 'upi-standee',
  kind: 'generator',
  generatorKind: 'qr',
  name: 'UPI Standee Generator',
  category: 'marketing-barcodes',
  categoryLabel: 'Marketing & QR codes',
  summary: 'Create a local, print-ready UPI payment QR standee with an optional fixed amount and note.',
  inputSchema: upiInputSchema,
  defaultValues: { payeeName: '', upiId: '', amount: '', note: '' },
  validate: validateUpiInput,
  calculate: calculateUpi,
  renderResult: (result) => result.payload,
  sources: [qrStandardSource, upiSource],
  limitations: [
    'The tool constructs a standard UPI payment URI but does not verify ownership, activity, bank support or settlement.',
    'A UPI app and compatible bank account are required to complete a payment. Always verify the payee in the app before authorizing.',
    'The fixed amount limit is a QR payload safety guard, not a claim about UPI transaction limits.',
  ],
  lastReviewed: TOOL_LAST_REVIEWED,
  seo: {
    title: 'UPI Standee Generator for Indian Businesses | KarobarKit',
    description:
      'Generate a private, client-side UPI payment QR standee with safe URI encoding, optional amount, print layout and PNG download.',
    keywords: ['upi standee generator', 'upi qr code', 'payment qr standee'],
  },
  relatedToolIds: ['url-qr-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter the payee name and UPI ID exactly as you want users to see them.',
    'Optionally add a fixed INR amount and a short payment note.',
    'Generate the standee, scan-test it in a trusted UPI app, then download or print it.',
  ],
  formula: 'upi://pay?pa={UPI ID}&pn={payee name}&am={optional amount}&cu=INR&tn={optional note}',
  workedExample:
    'A payee name of Ravi & Sons and UPI ID ravi@bank become safely percent-encoded URI parameters before QR rendering.',
  resultInterpretation:
    'The QR code contains payment details for a UPI app to interpret. It does not initiate or confirm a payment by itself.',
  edgeCases: [
    'Payee name is required; UPI ID must use an ASCII name@handle format with supported punctuation.',
    'Fixed amounts must be greater than zero, use no more than two decimal places and stay within the QR safety bound.',
    `Payment notes are limited to ${80} characters and cannot contain line breaks or control characters.`,
  ],
  faqs: [
    {
      question: 'Does a valid-looking UPI ID guarantee that payments will work?',
      answer:
        'No. Syntax validation cannot verify account ownership, activity or bank support. Confirm the payee inside your UPI app.',
    },
    {
      question: 'Can I leave the amount blank?',
      answer: 'Yes. A blank amount lets the payer enter the amount in their UPI app if the app supports it.',
    },
  ],
  privacyNote: `${QR_LOCAL_PRIVACY_NOTE} ${UPI_OWNERSHIP_DISCLAIMER}`,
};

const documentSource: SourceReference = {
  id: 'css-paged-media-a4-printing',
  title: 'CSS Paged Media Module Level 3',
  publisher: 'World Wide Web Consortium',
  url: 'https://www.w3.org/TR/css-page-3/',
  lastChecked: DOCUMENT_LAST_REVIEWED,
  evidenceLevel: 'authoritative',
};

const documentPrivacyNote =
  'Business details, document text and logos are processed locally in this browser. They are not sent to a server, saved by default or included in analytics.';

export const letterheadTool: ToolDefinition<LetterheadInput, LetterheadDocument> = {
  id: 'letterhead-generator',
  slug: 'letterhead-generator',
  kind: 'generator',
  generatorKind: 'document',
  name: 'Letterhead Generator',
  category: 'business-documents',
  categoryLabel: 'Business documents',
  summary: 'Create an original, print-ready A4 letterhead with local logo processing and simple layouts.',
  inputSchema: letterheadInputSchema,
  defaultValues: letterheadDefaultValues,
  validate: validateLetterheadInput,
  calculate: calculateLetterhead,
  renderResult: (result) => result.metadata.title,
  sources: [documentSource],
  limitations: [
    'The generator creates a business document layout; it does not verify business names, registrations, logos or recipient details.',
    'Plain text is supported. Longer letters are split across A4 pages; review page breaks before sharing.',
    'PDF text supports Latin and Devanagari through a bundled Noto Sans font. Use browser Print → Save as PDF for other scripts or full system-font coverage.',
  ],
  lastReviewed: DOCUMENT_LAST_REVIEWED,
  seo: {
    title: 'Letterhead Generator for Indian Businesses | KarobarKit',
    description:
      'Create a private, original A4 letterhead with business details, optional logo, controlled layouts, print preview and PDF download.',
    keywords: ['letterhead generator', 'business letterhead', 'letterhead maker'],
  },
  relatedToolIds: ['payment-receipt-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter the business name and address, then add contact details or identifiers you want displayed.',
    'Choose one of the controlled layouts, an accessible accent and an optional local logo.',
    'Add recipient and letter text if needed, review the A4 preview, then download the PDF or print.',
  ],
  formula: 'No calculation. The tool maps the entered text into a deterministic A4 document template.',
  workedExample:
    'A business name, multiline address and optional recipient/body text are placed into the selected A4 template without a server upload.',
  resultInterpretation:
    'The preview is a printable business communication layout. Optional registration details are displayed as entered and are not verified.',
  edgeCases: [
    'Whitespace-only required fields are rejected while Unicode and multiline text are preserved.',
    'Only safe raster logos are accepted; SVG and arbitrary markup are rejected.',
    'Long letter bodies continue onto additional A4 pages instead of being silently clipped.',
  ],
  faqs: [
    {
      question: 'Is my logo uploaded anywhere?',
      answer: 'No. PNG, JPEG and WebP logos are decoded and resized in your browser only.',
    },
    {
      question: 'Are GSTIN, CIN or registration details verified?',
      answer: 'No. They are optional display fields and should be checked against your own records.',
    },
  ],
  privacyNote: documentPrivacyNote,
};

export const paymentReceiptTool: ToolDefinition<PaymentReceiptInput, PaymentReceiptDocument> = {
  id: 'payment-receipt-generator',
  slug: 'payment-receipt-generator',
  kind: 'generator',
  generatorKind: 'document',
  name: 'Payment Receipt Generator',
  category: 'business-documents',
  categoryLabel: 'Business documents',
  summary: 'Create a clear A4 acknowledgement of a declared payment without an account or server storage.',
  inputSchema: paymentReceiptInputSchema,
  defaultValues: paymentReceiptDefaultValues,
  validate: validatePaymentReceiptInput,
  calculate: calculatePaymentReceipt,
  renderResult: (result) => result.monetaryValue.formatted,
  sources: [documentSource],
  limitations: [
    'This is an acknowledgement created from information you enter. It is not bank confirmation, proof of settlement, a government receipt or a GST tax invoice.',
    'The tool never contacts a bank, UPI app, card network or payment gateway. Independently verify settlement.',
    'Amount-to-words supports positive INR values up to ₹99,99,99,99,99,99,999.99 with a maximum of two decimal places.',
  ],
  lastReviewed: DOCUMENT_LAST_REVIEWED,
  seo: {
    title: 'Payment Receipt Generator for Indian Businesses | KarobarKit',
    description:
      'Create a private A4 payment acknowledgement with amount in Indian words, optional payment details, print preview and local PDF download.',
    keywords: ['payment receipt generator', 'receipt maker', 'payment acknowledgement'],
  },
  relatedToolIds: ['letterhead-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter a receipt number, local receipt date, payer name, positive amount and payment purpose.',
    'Optionally add issuer identity, payment method, references, a logo and signature placeholder.',
    'Review the amount in figures and words, then download the A4 PDF or print after checking settlement independently.',
  ],
  formula: 'Amount in words = deterministic Indian numbering conversion of the entered rupees and paise.',
  workedExample:
    '₹1,250.50 is displayed as ₹1,250.50 and “One Thousand Two Hundred Fifty Rupees and Fifty Paise Only.”',
  resultInterpretation:
    'The receipt records what the issuer declares was received. It does not prove that a financial transaction settled.',
  edgeCases: [
    'Receipt numbers allow letters, numbers, spaces, hyphens and slashes; global uniqueness is not claimed.',
    'Dates are validated as local calendar dates and formatted without timezone shifting.',
    'NaN, infinity, zero, negative values, excessive precision and unsupported large values are rejected.',
  ],
  faqs: [
    {
      question: 'Can this receipt be used as bank confirmation?',
      answer: 'No. It is a user-created acknowledgement. Check the relevant bank or payment app separately.',
    },
    {
      question: 'Does it create a GST tax invoice?',
      answer:
        'No. GST invoicing is outside this milestone and the receipt is explicitly not a GST tax invoice.',
    },
  ],
  privacyNote: documentPrivacyNote,
};

export const toolRegistry = [
  cagrTool,
  roiTool,
  gstTool,
  urlQrTool,
  upiStandeeTool,
  letterheadTool,
  paymentReceiptTool,
] as const;

export const categoryRegistry = [
  {
    id: 'financial-calculators',
    slug: 'financial-calculators',
    name: 'Financial calculations',
    description: 'Understand growth and returns with formulas that show their work.',
  },
  {
    id: 'marketing-barcodes',
    slug: 'marketing-barcodes',
    name: 'Marketing & QR codes',
    description: 'Create local QR outputs for URLs and UPI payment displays.',
  },
  {
    id: 'billing-taxes',
    slug: 'billing-taxes',
    name: 'Billing & taxes',
    description:
      'Use transparent arithmetic for selected billing and tax calculations, with source and scope limits visible.',
  },
  {
    id: 'business-documents',
    slug: 'business-documents',
    name: 'Business documents',
    description: 'Prepare original, local-first A4 documents for everyday business communication.',
  },
] as const;

export function getToolBySlug(slug: string) {
  return toolRegistry.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: string) {
  return toolRegistry.filter((tool) => tool.category === category);
}

export function getRelatedTools(tool: Pick<AnyToolDefinition, 'relatedToolIds'>) {
  return tool.relatedToolIds
    .map((relatedId) => toolRegistry.find((candidate) => candidate.id === relatedId))
    .filter((related): related is (typeof toolRegistry)[number] => Boolean(related));
}

export function getToolResult<TInput, TResult>(
  tool: import('./types').ToolDefinition<TInput, TResult>,
  input: TInput,
) {
  const validation = tool.validate(input);
  if (!validation.success) {
    return validation;
  }

  return {
    success: true as const,
    result: tool.calculate(validation.data, defaultPolicyContext),
  };
}
