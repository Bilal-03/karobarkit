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
] as const satisfies readonly ToolCategoryDefinition[];

export type ToolCategory = (typeof categoryRegistry)[number];

export function getCategoryBySlug(slug: string) {
  return categoryRegistry.find((category) => category.slug === slug);
}
