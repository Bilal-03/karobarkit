import { DOCUMENT_LAST_REVIEWED } from '@/domain/documents/constants';
import type { SourceReference } from './types';

export const TOOL_LAST_REVIEWED = '2026-08-08';

export function liveLocalMetadata({
  riskTier,
  reviewCadenceDays,
  policyDependencies = [],
  method,
  lastVerified,
  effectiveFrom,
  reviewerRole = 'Product and domain review',
  reviewerStatus = 'not-required',
  lifecycle = 'live',
  featureFlag,
}: {
  riskTier: 'A' | 'B' | 'C' | 'D';
  reviewCadenceDays: number;
  policyDependencies?: string[];
  method: string;
  lastVerified: string;
  effectiveFrom?: string;
  reviewerRole?: string;
  reviewerStatus?: 'not-required' | 'pending' | 'approved';
  lifecycle?: 'internal' | 'beta' | 'live' | 'stale-disabled' | 'retired';
  featureFlag?: string;
}) {
  return {
    privacyClassification: 'local-only' as const,
    executionMode: 'local-only' as const,
    lifecycle,
    featureFlag,
    governance: {
      owner: 'KarobarKit product and domain team',
      riskTier,
      reviewCadenceDays,
      policyDependencies,
    },
    trust: {
      method,
      effectiveFrom,
      lastVerified,
      reviewer: {
        status: reviewerStatus,
        role: reviewerRole,
      },
    },
  };
}

export const cagrSource: SourceReference = {
  id: 'cagr-standard-financial-mathematics',
  title: 'Compound annual growth rate formula reference',
  publisher: 'Investopedia',
  url: 'https://www.investopedia.com/terms/c/cagr.asp',
  lastChecked: TOOL_LAST_REVIEWED,
  evidenceLevel: 'editorial',
};

export const roiSource: SourceReference = {
  id: 'roi-standard-financial-ratio',
  title: 'Return on investment definition and formula',
  publisher: 'Investopedia',
  url: 'https://www.investopedia.com/terms/r/returnoninvestment.asp',
  lastChecked: TOOL_LAST_REVIEWED,
  evidenceLevel: 'editorial',
};

export const qrStandardSource: SourceReference = {
  id: 'qr-code-standard-overview',
  title: 'QR Code two-dimensional symbol overview',
  publisher: 'DENSO WAVE',
  url: 'https://www.qrcode.com/en/about/',
  lastChecked: TOOL_LAST_REVIEWED,
  evidenceLevel: 'authoritative',
};

export const urlStandardSource: SourceReference = {
  id: 'whatwg-url-standard',
  title: 'URL Standard',
  publisher: 'WHATWG',
  url: 'https://url.spec.whatwg.org/',
  lastChecked: TOOL_LAST_REVIEWED,
  evidenceLevel: 'authoritative',
};

export const upiSource: SourceReference = {
  id: 'npci-upi-deep-linking-parameters',
  title: 'UPI QR key deep-linking parameters',
  publisher: 'National Payments Corporation of India',
  url: 'https://www.npci.org.in/PDF/npci/upi/circular/2017/Circular18_BankCompliances_to_enbaleUPIMerchantecosystem_0.pdf',
  lastChecked: TOOL_LAST_REVIEWED,
  evidenceLevel: 'official',
};

export const sharedAnalyticsPolicy = {
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
    'revenue',
    'totalCost',
    'unitCost',
    'sellingPrice',
    'fixedCosts',
    'sellingPricePerUnit',
    'variableCostPerUnit',
    'targetMargin',
    'discountPercent',
    'taxRate',
    'openingCash',
    'cashInflows',
    'cashOutflows',
    'oneOffOutflows',
    'periodMonths',
    'totalOutflows',
    'totalInflows',
    'currentCash',
    'monthlyOutflows',
    'monthlyInflows',
    'productCost',
    'platformFeePercent',
    'shippingCost',
    'paymentFeePercent',
    'returnCost',
    'taxCost',
    'adSpend',
    'attributedRevenue',
    'otherVariableCosts',
    'orderValue',
    'codFee',
    'forwardShipping',
    'returnShipping',
    'rtoRate',
    'returnLoss',
    'cashCycleCost',
  ],
};

export const documentSource: SourceReference = {
  id: 'css-paged-media-a4-printing',
  title: 'CSS Paged Media Module Level 3',
  publisher: 'World Wide Web Consortium',
  url: 'https://www.w3.org/TR/css-page-3/',
  lastChecked: DOCUMENT_LAST_REVIEWED,
  evidenceLevel: 'authoritative',
};

export const documentPrivacyNote =
  'Business details, document text and logos are processed locally in this browser. They are not sent to a server, saved by default or included in analytics.';
