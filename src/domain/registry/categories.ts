import type { ToolCategoryDefinition } from './types';

export const categoryRegistry = [
  {
    id: 'business',
    slug: 'business',
    name: 'Business',
    shortDescription: 'Pricing, profitability and operating decisions.',
    description:
      'Understand margins, pricing, returns, break-even points and the cash decisions behind a healthy business.',
    searchTerms: ['margin', 'markup', 'break even', 'roi', 'pricing', 'cash flow', 'runway'],
    roadmapPhase: 1,
  },
  {
    id: 'gst-tax',
    slug: 'gst-tax',
    name: 'GST & Tax',
    shortDescription: 'Source-backed Indian tax calculations and workflows.',
    description:
      'Use clearly scoped tax arithmetic with official sources, effective dates and limitations shown beside the result.',
    searchTerms: ['gst', 'income tax', 'tds', 'hra', 'corporate tax', 'presumptive tax'],
    roadmapPhase: 1,
  },
  {
    id: 'startup',
    slug: 'startup',
    name: 'Startup',
    shortDescription: 'Runway, growth and ownership planning.',
    description:
      'Model startup economics including burn, runway, acquisition, lifetime value, valuation and dilution.',
    searchTerms: ['burn rate', 'runway', 'cac', 'ltv', 'valuation', 'equity dilution', 'saas metrics'],
    roadmapPhase: 2,
  },
  {
    id: 'finance',
    slug: 'finance',
    name: 'Finance',
    shortDescription: 'Loans, investments and growth over time.',
    description:
      'Compare borrowing and investment outcomes with transparent formulas, assumptions and Indian number formatting.',
    searchTerms: ['emi', 'sip', 'fd', 'cagr', 'xirr', 'loan comparison'],
    roadmapPhase: 1,
  },
  {
    id: 'ecommerce',
    slug: 'ecommerce',
    name: 'E-commerce',
    shortDescription: 'Marketplace fees and unit economics.',
    description:
      'Estimate marketplace costs, contribution margin, advertising returns and cash-on-delivery economics.',
    searchTerms: ['amazon fees', 'flipkart fees', 'marketplace margin', 'roas', 'cod cost'],
    roadmapPhase: 2,
  },
  {
    id: 'hr-salary',
    slug: 'hr-salary',
    name: 'HR & Salary',
    shortDescription: 'Compensation and employment calculations.',
    description:
      'Explain salary structure, statutory components, long-term benefits and employee equity with dated rules.',
    searchTerms: ['ctc', 'in hand salary', 'pf', 'gratuity', 'esop'],
    roadmapPhase: 4,
  },
  {
    id: 'generators',
    slug: 'generators',
    name: 'Generators',
    shortDescription: 'Private documents, QR codes and business assets.',
    description:
      'Create practical business documents and shareable assets locally, with clear scope and misuse safeguards.',
    searchTerms: ['invoice', 'quotation', 'gst invoice', 'qr code', 'business card', 'invoice number'],
    roadmapPhase: 1,
  },
  {
    id: 'ai-tools',
    slug: 'ai-tools',
    name: 'AI Tools',
    shortDescription: 'Guided drafting and business planning assistants.',
    description:
      'Use AI for structured drafting and explanation while deterministic engines remain responsible for numbers.',
    searchTerms: ['business name', 'pricing assistant', 'startup cost estimator', 'business plan assistant'],
    roadmapPhase: 6,
  },
  {
    id: 'daily-utilities',
    slug: 'daily-utilities',
    name: 'Everyday Utilities',
    shortDescription: 'Common calculations, conversions and lightweight productivity tools.',
    description:
      'Handle everyday calculations, conversions and small productivity tasks locally, with clear assumptions and no account required.',
    searchTerms: [
      'percentage',
      'discount',
      'area converter',
      'business days',
      'word counter',
      'password',
      'checklist',
    ],
    roadmapPhase: 2,
  },
  {
    id: 'retail-logistics',
    slug: 'retail-logistics',
    name: 'Retail & Logistics',
    shortDescription: 'Store, packaging, delivery and procurement workflows.',
    description:
      'Prepare practical retail, packaging, delivery and procurement outputs with declared assumptions, print profiles and clear limits.',
    searchTerms: [
      'barcode',
      'price tag',
      'fuel expense',
      'volumetric weight',
      'delivery challan',
      'shipping label',
      'purchase order',
    ],
    roadmapPhase: 4,
  },
  {
    id: 'marketing-digital',
    slug: 'marketing-digital',
    name: 'Marketing & Digital',
    shortDescription: 'Customer sharing, business identity and communication tools.',
    description:
      'Create safe share links, QR-based contact assets and lightweight communication materials locally, without automatic sending or publishing.',
    searchTerms: ['whatsapp link', 'vcard', 'wifi qr', 'email signature', 'review request', 'menu'],
    roadmapPhase: 3,
  },
  {
    id: 'media-files',
    slug: 'media-files',
    name: 'Media & Files',
    shortDescription: 'Browser-local image, PDF and asset operations.',
    description:
      'Resize, compress, merge and prepare local media or documents in the browser, with explicit file limits and cleanup behavior.',
    searchTerms: ['photo resize', 'compress image', 'pdf merge', 'pdf split', 'favicon', 'app icon'],
    roadmapPhase: 3,
  },
] as const satisfies readonly ToolCategoryDefinition[];

export type ToolCategory = (typeof categoryRegistry)[number];

export const categoryNames = categoryRegistry.map((category) => category.name).join(', ');

export function getCategoryBySlug(slug: string) {
  return categoryRegistry.find((category) => category.slug === slug);
}
