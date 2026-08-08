import { DOCUMENT_LAST_REVIEWED } from '@/domain/documents/constants';
import {
  calculateLetterhead,
  letterheadDefaultValues,
  letterheadInputSchema,
  type LetterheadDocument,
  type LetterheadInput,
  validateLetterheadInput,
} from '@/domain/documents/letterhead';
import type { ToolDefinition } from '../types';
import { documentPrivacyNote, documentSource, liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const letterheadTool: ToolDefinition<LetterheadInput, LetterheadDocument> = {
  id: 'letterhead-generator',
  slug: 'letterhead-generator',
  kind: 'generator',
  ui: { adapter: 'document-generator', variant: 'letterhead' },
  generatorKind: 'document',
  name: 'Letterhead Generator',
  shortName: 'Letterhead',
  category: 'generators',
  categoryLabel: 'Generators',
  secondaryCategories: ['business'],
  tags: ['letterhead', 'document', 'pdf', 'business stationery'],
  searchTerms: ['company letterhead', 'business letterhead', 'letter pad'],
  featured: true,
  launchPriority: 7,
  ...liveLocalMetadata({
    riskTier: 'B',
    reviewCadenceDays: 365,
    method: 'Deterministic mapping of entered content into controlled A4 document templates.',
    lastVerified: DOCUMENT_LAST_REVIEWED,
  }),
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
