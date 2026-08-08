import {
  calculateUrlQr,
  type UrlQrInput,
  type UrlQrResult,
  urlQrInputSchema,
  validateUrlQrInput,
} from '@/domain/qr/url';
import { QR_LOCAL_PRIVACY_NOTE } from '@/lib/qr/privacy';
import type { ToolDefinition } from '../types';
import {
  TOOL_LAST_REVIEWED,
  liveLocalMetadata,
  qrStandardSource,
  sharedAnalyticsPolicy,
  urlStandardSource,
} from '../shared';

export const urlQrTool: ToolDefinition<UrlQrInput, UrlQrResult> = {
  id: 'url-qr-generator',
  slug: 'url-qr',
  kind: 'generator',
  ui: { adapter: 'qr-generator', variant: 'url-qr' },
  generatorKind: 'qr',
  name: 'URL QR Generator',
  shortName: 'URL QR',
  category: 'generators',
  categoryLabel: 'Generators',
  secondaryCategories: [],
  tags: ['qr', 'url', 'website', 'link'],
  searchTerms: ['qr code generator', 'website qr', 'link qr', 'url qr'],
  featured: true,
  launchPriority: 6,
  ...liveLocalMetadata({
    riskTier: 'B',
    reviewCadenceDays: 365,
    method: 'Deterministic URL normalization followed by standards-based QR encoding.',
    lastVerified: TOOL_LAST_REVIEWED,
  }),
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
