export const allowedEventNames = [
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
  'search_performed',
  'search_zero_results',
  'feedback_submitted',
] as const;

export type AnalyticsEventName = (typeof allowedEventNames)[number];
export type SafeAnalyticsProperties = Record<string, string | number | boolean | string[] | undefined>;

const forbiddenPropertyNames = new Set([
  'amount',
  'gstAmount',
  'taxableValue',
  'totalAmount',
  'ratePercent',
  'customRate',
  'ratePresetId',
  'cgstAmount',
  'sgstAmount',
  'sgstOrUtgstAmount',
  'igstAmount',
  'supplyType',
  'calculationMode',
  'mode',
  'policyVersion',
  'beginningValue',
  'endingValue',
  'years',
  'investmentCost',
  'finalValue',
  'profit',
  'percentage',
  'result',
  'rawInput',
  'url',
  'normalizedUrl',
  'payload',
  'name',
  'payeeName',
  'note',
  'address',
  'gstin',
  'upiId',
  'wifiPassword',
  'documentContents',
  'businessName',
  'businessAddress',
  'phone',
  'email',
  'website',
  'tagline',
  'cin',
  'registrationNumber',
  'additionalContact',
  'socialHandle',
  'recipientName',
  'recipientAddress',
  'subject',
  'body',
  'letterDate',
  'signatoryName',
  'signatoryDesignation',
  'receiptNumber',
  'receiptDate',
  'receivedFrom',
  'paymentPurpose',
  'paymentMethod',
  'transactionReference',
  'paymentNote',
  'invoiceReference',
  'customerAddress',
  'footerText',
  'signaturePlaceholder',
  'logo',
  'logoDataUrl',
  'dataUrl',
  'originalName',
  'amountWords',
]);

export function trackEvent(event: AnalyticsEventName, properties: SafeAnalyticsProperties = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter(([key]) => !forbiddenPropertyNames.has(key)),
  );

  // The MVP deliberately has no third-party analytics transport. This allowlist is the seam for one later.
  window.dispatchEvent(
    new CustomEvent('karobarkit:analytics', { detail: { event, properties: safeProperties } }),
  );
}
