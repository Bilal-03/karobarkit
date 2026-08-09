import { DOCUMENT_LAST_REVIEWED } from '@/domain/documents/constants';
import {
  businessCardDefaultValues,
  businessCardInputSchema,
  calculateBusinessCard,
  type BusinessCardDocument,
  type BusinessCardInput,
  validateBusinessCardInput,
} from '@/domain/documents/business-card';

import type { ToolDefinition } from '../types';
import { documentPrivacyNote, documentSource, liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const businessCardTool: ToolDefinition<BusinessCardInput, BusinessCardDocument> = {
  id: 'business-card-generator',
  slug: 'business-card-generator',
  kind: 'generator',
  ui: { adapter: 'business-card-generator' },
  generatorKind: 'document',
  name: 'Business Card Generator',
  shortName: 'Business Card',
  category: 'generators',
  categoryLabel: 'Generators',
  secondaryCategories: ['business'],
  tags: ['business card', 'contact card', 'print', 'pdf'],
  searchTerms: ['business card maker', 'visiting card', 'contact card generator'],
  featured: true,
  launchPriority: 3,
  ...liveLocalMetadata({
    riskTier: 'B',
    reviewCadenceDays: 365,
    method: 'Deterministic mapping of entered identity and contact details into a print-ready A4 card sheet.',
    lastVerified: DOCUMENT_LAST_REVIEWED,
  }),
  summary: 'Create a private print-ready business card sheet with local logo processing and no account.',
  inputSchema: businessCardInputSchema,
  defaultValues: businessCardDefaultValues,
  validate: validateBusinessCardInput,
  calculate: calculateBusinessCard,
  renderResult: (result) => result.personName,
  sources: [documentSource],
  limitations: [
    'The output is a design and print preview, not a guarantee of printer dimensions, bleed, colour or stock compatibility.',
    'Business names, registration details, contact details and logos are displayed as entered and are not verified.',
    'Review every contact detail and perform a physical proof before producing a large batch.',
  ],
  lastReviewed: DOCUMENT_LAST_REVIEWED,
  seo: {
    title: 'Business Card Generator for Indian Businesses | KarobarKit',
    description:
      'Create a private A4 business card sheet with contact details, logo, print preview and local PDF download.',
    keywords: ['business card generator', 'visiting card maker', 'business card india'],
  },
  relatedToolIds: ['letterhead-generator', 'quotation-generator'],
  analyticsPolicy: sharedAnalyticsPolicy,
  howToUse: [
    'Enter the business identity and the person details you want printed on the card.',
    'Add contact channels, optional logo and a short note for the reverse side.',
    'Review the front and back card preview, then print a proof or download the A4 PDF.',
  ],
  formula:
    'No calculation. The generator maps the entered text and logo into a controlled local print layout.',
  workedExample:
    'A person name, designation, phone, email and business identity appear on a front card with an optional notes back.',
  resultInterpretation:
    'The result is a print layout. The correctness and ownership of every displayed detail remain your responsibility.',
  edgeCases: [
    'Only the existing local logo validation and safe raster formats are supported.',
    'Long names and contact values wrap instead of being sent to a server or silently omitted.',
    'Printer alignment and final card size vary by paper, printer and trimming process.',
  ],
  faqs: [
    {
      question: 'Are card details uploaded?',
      answer:
        'No. The card is assembled in this browser. Details are not sent to a backend or included in analytics.',
    },
    {
      question: 'Does the PDF guarantee standard card dimensions?',
      answer:
        'No. It provides an A4 proof layout. Check your printer and card stock, then trim or adapt it before production.',
    },
  ],
  privacyNote: documentPrivacyNote,
};
