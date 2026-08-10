import {
  AI_PROMPT_VERSIONS,
  aiAssistantInputSchema,
  assistantFieldConfigs,
  fallbackAssistant,
  validateAssistantInput,
  type AIAssistantInput,
  type AIAssistantKind,
  type AIAssistantResult,
} from '@/domain/ai';

import type { SourceReference, ToolDefinition } from '../types';
import { liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const PHASE6_LAST_REVIEWED = '2026-08-10';
export const PHASE6_FEATURE_FLAG = 'phase6-ai-assistants';

const aiMethodSource: SourceReference = {
  id: 'method-ai-v1',
  title: 'AI assistant boundary and safety methodology v1',
  publisher: 'KarobarKit controlled methodology',
  url: 'https://github.com/Bilal-03/karobarkit/blob/main/docs/product-spec/Business_Toolkit_for_India_Implementation_Plan_2026-08-09.md',
  lastChecked: PHASE6_LAST_REVIEWED,
  evidenceLevel: 'authoritative',
  documentType: 'methodology',
  notes:
    'AI may draft wording and surface questions. User-entered facts and deterministic engines remain authoritative for numeric scenarios; the user must review before export.',
  supports: ['AI boundary', 'review-first export', 'deterministic fallback'],
};

const geminiSource: SourceReference = {
  id: 'google-gemini-structured-output-v1',
  title: 'Gemini API structured outputs',
  publisher: 'Google AI for Developers',
  url: 'https://ai.google.dev/gemini-api/docs/generate-content/structured-output',
  lastChecked: PHASE6_LAST_REVIEWED,
  evidenceLevel: 'official',
  documentType: 'official-page',
  notes:
    'Provider contract used only for server-side structured draft wording. A user-configured provider key is never sent to the browser.',
  supports: ['structured response schema', 'server-side provider request'],
};

const groqSource: SourceReference = {
  id: 'groq-chat-structured-output-v1',
  title: 'Groq structured outputs and supported models',
  publisher: 'Groq',
  url: 'https://console.groq.com/docs/structured-outputs',
  lastChecked: PHASE6_LAST_REVIEWED,
  evidenceLevel: 'official',
  documentType: 'official-page',
  notes:
    'Optional server-side provider contract. Strict JSON-schema support is limited to the provider-listed models; model availability and free-tier limits remain provider-controlled.',
  supports: ['structured response schema', 'server-side provider request'],
};

const dpdpSource: SourceReference = {
  id: 'meity-dpdp-rules-2025',
  title: 'Digital Personal Data Protection Rules 2025',
  publisher: 'Ministry of Electronics and Information Technology',
  url: 'https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa',
  lastChecked: PHASE6_LAST_REVIEWED,
  evidenceLevel: 'official',
  documentType: 'rule',
  notes:
    'Privacy notice, consent, security and retention context for network-assisted drafting; applicability and commencement remain deployment-specific.',
  supports: ['privacy notice', 'consent', 'security and retention boundary'],
};

const geminiDataControlsSource: SourceReference = {
  id: 'google-gemini-data-controls-v1',
  title: 'Zero data retention in the Gemini Developer API',
  publisher: 'Google AI for Developers',
  url: 'https://ai.google.dev/gemini-api/docs/zdr',
  lastChecked: PHASE6_LAST_REVIEWED,
  evidenceLevel: 'official',
  documentType: 'official-page',
  notes:
    'Provider-controlled retention and logging conditions are disclosed before consent; this app does not promise provider zero retention.',
  supports: ['provider retention notice', 'data-control disclosure'],
};

const groqDataControlsSource: SourceReference = {
  id: 'groq-data-controls-v1',
  title: 'Your Data in GroqCloud',
  publisher: 'Groq',
  url: 'https://console.groq.com/docs/your-data',
  lastChecked: PHASE6_LAST_REVIEWED,
  evidenceLevel: 'official',
  documentType: 'official-page',
  notes:
    'Provider-controlled retention and zero-data-retention controls are disclosed before consent; usage metadata remains provider-controlled.',
  supports: ['provider retention notice', 'data-control disclosure'],
};

const aiPrivacyNote =
  'This is a network-required beta. After you give consent, only the listed assistant fields are sent through the server gateway. Known contact and tax-ID patterns are redacted; confidential financial identifiers and credentials are rejected. The browser never receives provider keys, and this app does not save prompts or drafts. Gemini or Groq retention and usage terms still apply. If no provider key is configured, the gateway returns a deterministic local template.';

type Phase6ToolConfig = {
  kind: AIAssistantKind;
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: string;
  secondaryCategories: string[];
  tags: string[];
  searchTerms: string[];
  summary: string;
  riskTier: 'B';
  formula: string;
  method: string;
  workedExample: string;
  resultInterpretation: string;
  limitations: string[];
  edgeCases: string[];
  faqs: { question: string; answer: string }[];
  relatedToolIds: string[];
  seoTitle: string;
  seoDescription: string;
  howToUse: string[];
  fixtureId: string;
  policyDependencies: string[];
};

function createPhase6Tool(config: Phase6ToolConfig): ToolDefinition<AIAssistantInput, AIAssistantResult> {
  const defaultValues = Object.fromEntries(
    assistantFieldConfigs[config.kind].map((field) => [field.name, field.defaultValue]),
  );
  return {
    id: config.id,
    slug: config.slug,
    kind: 'ai-assisted',
    ui: { adapter: 'ai-assistant', variant: config.kind },
    name: config.name,
    shortName: config.shortName,
    category: config.category,
    categoryLabel: 'AI Tools',
    secondaryCategories: config.secondaryCategories,
    tags: config.tags,
    searchTerms: config.searchTerms,
    summary: config.summary,
    featured: false,
    launchPriority: 80,
    regulatory: false,
    ...liveLocalMetadata({
      riskTier: config.riskTier,
      reviewCadenceDays: 90,
      policyDependencies: [...config.policyDependencies, `prompt-${AI_PROMPT_VERSIONS[config.kind]}`],
      goldenFixtureIds: [config.fixtureId],
      method: config.method,
      lastVerified: PHASE6_LAST_REVIEWED,
      reviewerRole: 'AI safety and product reviewer',
      reviewerStatus: 'pending',
      lifecycle: 'beta',
      featureFlag: PHASE6_FEATURE_FLAG,
      privacyClassification: 'network-required',
      executionMode: 'network-required',
    }),
    inputSchema: aiAssistantInputSchema,
    defaultValues,
    validate: (input) => validateAssistantInput(config.kind, input),
    calculate: (input) => fallbackAssistant(config.kind, input),
    renderResult: (result) => result.title,
    sources: [
      aiMethodSource,
      geminiSource,
      groqSource,
      dpdpSource,
      geminiDataControlsSource,
      groqDataControlsSource,
    ],
    limitations: config.limitations,
    lastReviewed: PHASE6_LAST_REVIEWED,
    seo: {
      title: config.seoTitle,
      description: config.seoDescription,
      keywords: [...config.searchTerms],
    },
    relatedToolIds: config.relatedToolIds,
    analyticsPolicy: sharedAnalyticsPolicy,
    howToUse: config.howToUse,
    formula: config.formula,
    workedExample: config.workedExample,
    resultInterpretation: config.resultInterpretation,
    edgeCases: config.edgeCases,
    faqs: config.faqs,
    privacyNote: aiPrivacyNote,
    disclaimer:
      'This assistant produces an editable planning draft, not accounting, tax, legal, investment, trademark or registration advice. Review every section and verify claims independently before acting or exporting.',
  };
}

export const businessNameAssistantTool = createPhase6Tool({
  kind: 'business-name',
  id: 'business-name-generator',
  slug: 'business-name-generator',
  name: 'Business Name Assistant',
  shortName: 'Business Name',
  category: 'ai-tools',
  secondaryCategories: ['startup'],
  tags: ['business name', 'brand naming', 'startup'],
  searchTerms: ['business name generator', 'brand name ideas', 'startup name'],
  summary: 'Turn a short naming brief into a reviewable shortlist without claiming availability.',
  riskTier: 'B',
  formula: 'Structured prompt + deterministic naming templates; no availability lookup.',
  method:
    'The gateway redacts direct identifiers, asks the configured provider for wording, validates the response, and retains a deterministic shortlist as fallback.',
  workedExample:
    'A Pune snack-delivery brief can produce themed options such as “Fresh Works” and “Pune Fresh”, followed by independent trademark and domain checks.',
  resultInterpretation:
    'Treat names as creative starting points. Availability, pronunciation, meaning and legal clearance require separate checks.',
  limitations: [
    'No domain, trademark, company-name or social-handle search is performed.',
    'The model may miss cultural or language nuances; ask local customers to review the shortlist.',
  ],
  edgeCases: [
    'Avoid confidential brand documents or personal contact data.',
    'A name that sounds good in one language can have an unintended meaning in another.',
  ],
  faqs: [
    {
      question: 'Does this check if a name is available?',
      answer:
        'No. It creates drafts only. Check official trademark, company-name, domain and social registries yourself.',
    },
    {
      question: 'Can I use Hindi or Hinglish?',
      answer:
        'Yes. The language selector changes the draft style; it does not validate spelling or legal suitability.',
    },
  ],
  relatedToolIds: ['business-plan-assistant', 'startup-cost-estimator'],
  seoTitle: 'Business Name Assistant for India | KarobarKit',
  seoDescription:
    'Create a structured, reviewable business-name shortlist with clear availability and legal boundaries.',
  howToUse: [
    'Describe the business and broad market.',
    'Choose language and brand tone.',
    'Review the shortlist, then perform independent name and trademark checks.',
  ],
  fixtureId: 'phase6-business-name-safe-v1',
  policyDependencies: ['method-ai-v1', 'meity-dpdp-rules-2025'],
});

export const pricingAssistantTool = createPhase6Tool({
  kind: 'pricing-assistant',
  id: 'pricing-assistant',
  slug: 'pricing-assistant',
  name: 'Pricing Assistant',
  shortName: 'Pricing Assistant',
  category: 'ai-tools',
  secondaryCategories: ['business'],
  tags: ['pricing', 'margin', 'discount', 'unit economics'],
  searchTerms: ['pricing assistant', 'price recommendation draft', 'pricing scenario'],
  summary: 'Explain a transparent cost-and-margin scenario while keeping every number deterministic.',
  riskTier: 'B',
  formula:
    'List price = (target net revenue + shipping) ÷ (1 − expected discount − channel fee); tax remains a user-entered arithmetic assumption.',
  method:
    'The local engine owns price, discount, tax and fee arithmetic. AI may explain the scenario and suggest questions only.',
  workedExample:
    'A ₹600 cost, 40% target contribution margin, 10% expected discount, 5% channel fee and ₹20 shipping assumption produce a ₹1,200 list-price scenario.',
  resultInterpretation:
    'Use the metrics to compare scenarios, then verify channel fees, applicable tax and customer willingness to pay.',
  limitations: [
    'No market, competitor, tax-rate or marketplace-rate lookup is performed.',
    'The result is not a recommended or guaranteed price.',
  ],
  edgeCases: [
    'A target margin near 100% or discount-plus-fee at 100% makes the scenario unstable and is rejected.',
    'Negative or incomplete costs are rejected before generation.',
  ],
  faqs: [
    {
      question: 'Does the AI decide my price?',
      answer:
        'No. The deterministic arithmetic produces the scenario; AI only drafts explanations and review prompts.',
    },
    {
      question: 'Is the tax amount official?',
      answer:
        'No. Any tax field is a user-supplied arithmetic input, not a determination of applicable GST or income tax.',
    },
  ],
  relatedToolIds: ['pricing-calculator', 'margin-calculator', 'break-even-calculator'],
  seoTitle: 'Pricing Assistant for Indian Businesses | KarobarKit',
  seoDescription:
    'Explain cost, margin, discount and fee scenarios with deterministic numbers and an editable AI draft.',
  howToUse: [
    'Enter your cost and target margin.',
    'Add only the discount, tax and channel assumptions you have evidence for.',
    'Review the deterministic metrics and edit the explanation before exporting.',
  ],
  fixtureId: 'phase6-pricing-deterministic-v1',
  policyDependencies: ['method-ai-v1', 'method-business-metrics-v1', 'meity-dpdp-rules-2025'],
});

export const startupCostAssistantTool = createPhase6Tool({
  kind: 'startup-cost-estimator',
  id: 'startup-cost-estimator',
  slug: 'startup-cost-estimator',
  name: 'Startup Cost Estimator',
  shortName: 'Startup Costs',
  category: 'ai-tools',
  secondaryCategories: ['startup', 'business'],
  tags: ['startup cost', 'runway', 'budget', 'planning'],
  searchTerms: ['startup cost estimator', 'business startup budget', 'initial funding estimate'],
  summary: 'Turn your own cost lines and planning horizon into a reconciled startup-cost scenario.',
  riskTier: 'B',
  formula: 'Estimated funding = (one-time costs + monthly costs × selected runway) × (1 + contingency).',
  method:
    'The local engine sums user-entered cost lines and applies only the selected runway and contingency; AI suggests missing questions.',
  workedExample:
    '₹65,000 one-time costs + ₹70,000 monthly costs × 6 months with 10% contingency produces a transparent planning scenario.',
  resultInterpretation:
    'Use the total as a checklist for quotes and cash planning, not as a funding or permit-cost benchmark.',
  limitations: [
    'No local rent, salary, licence, tax, inventory or vendor rates are invented.',
    'Cost categories are only as complete as the lines you enter.',
  ],
  edgeCases: [
    'Each cost line should contain one amount; ambiguous lines are flagged for review.',
    'Separate deposits and one-time setup from recurring cash costs.',
  ],
  faqs: [
    {
      question: 'Where do the cost numbers come from?',
      answer: 'Only from the amounts you enter. The assistant does not scrape or assume local market rates.',
    },
    {
      question: 'Can I use this as a funding request?',
      answer:
        'Use it as a draft checklist. Replace estimates with quotes and review it with a qualified adviser before presenting it.',
    },
  ],
  relatedToolIds: ['cash-flow-calculator', 'runway-calculator', 'business-plan-assistant'],
  seoTitle: 'Startup Cost Estimator for India | KarobarKit',
  seoDescription:
    'Estimate startup funding needs from your own one-time costs, monthly costs, runway and contingency.',
  howToUse: [
    'Enter one-time and monthly cost lines with amounts.',
    'Select the runway and contingency you want to test.',
    'Review missing categories and replace estimates with evidence.',
  ],
  fixtureId: 'phase6-startup-cost-deterministic-v1',
  policyDependencies: ['method-ai-v1', 'method-startup-metrics-v1', 'meity-dpdp-rules-2025'],
});

export const businessPlanAssistantTool = createPhase6Tool({
  kind: 'business-plan-assistant',
  id: 'business-plan-assistant',
  slug: 'business-plan-assistant',
  name: 'Business Plan Assistant',
  shortName: 'Business Plan',
  category: 'ai-tools',
  secondaryCategories: ['startup', 'business'],
  tags: ['business plan', 'strategy', 'milestones', 'assumptions'],
  searchTerms: ['business plan assistant', 'startup plan', 'business strategy draft'],
  summary: 'Build a structured first draft with assumptions, milestones and risks you can review and edit.',
  riskTier: 'B',
  formula:
    'Structured sections from user-entered facts; no market-size or competitor arithmetic is inferred.',
  method:
    'The gateway creates a constrained draft from supplied facts, filters unsafe claims, and keeps review and export in the user interface.',
  workedExample:
    'A food brand brief becomes an executive summary, problem, solution, revenue model, milestones and assumptions register.',
  resultInterpretation:
    'Treat every paragraph as a question to validate with customers, records, quotes and primary sources.',
  limitations: [
    'No market statistics, citations, competitor analysis or regulatory conclusion is generated.',
    'The plan is not a lender, investor or government filing.',
  ],
  edgeCases: [
    'Do not paste customer lists, bank details, confidential agreements or identity documents.',
    'Missing facts remain placeholders instead of being guessed.',
  ],
  faqs: [
    {
      question: 'Will it write a complete investor-ready plan?',
      answer:
        'It creates an editable first draft. Evidence, financials, citations and professional review are still required.',
    },
    {
      question: 'Can I export immediately?',
      answer: 'No. Export controls unlock only after you confirm that you reviewed the draft.',
    },
  ],
  relatedToolIds: ['startup-cost-estimator', 'startup-valuation-calculator', 'pricing-assistant'],
  seoTitle: 'Business Plan Assistant for India | KarobarKit',
  seoDescription:
    'Draft a reviewable business plan with assumptions, milestones, risks and clear no-fabrication boundaries.',
  howToUse: [
    'Describe your customer, problem, solution and revenue model.',
    'Review each generated section and replace assumptions with evidence.',
    'Confirm review before copying or downloading the draft.',
  ],
  fixtureId: 'phase6-business-plan-safe-v1',
  policyDependencies: ['method-ai-v1', 'meity-dpdp-rules-2025'],
});

export const phase6Tools = [
  businessNameAssistantTool,
  pricingAssistantTool,
  startupCostAssistantTool,
  businessPlanAssistantTool,
] as const;

type Phase6FixtureSignoffStatus = 'pending' | 'signed';
const phase6FixtureSignoffStatus: Phase6FixtureSignoffStatus = 'pending';

/**
 * The manifest makes the executable fixture and reviewer boundary explicit.
 * It remains pending until an independent reviewer signs a release commit.
 */
export const PHASE6_EVALUATION_FIXTURE_MANIFEST = {
  status: phase6FixtureSignoffStatus,
  reviewerRole: 'Named AI safety and product reviewer',
  lastUpdated: PHASE6_LAST_REVIEWED,
  signature: {
    status: phase6FixtureSignoffStatus,
    reviewerName: null,
    reviewedOn: null,
    releaseCommit: null,
  },
  fixtures: [
    { id: 'phase6-business-name-safe-v1', toolId: 'business-name-generator' },
    { id: 'phase6-business-name-injection-v1', toolId: 'business-name-generator' },
    { id: 'phase6-pricing-deterministic-v1', toolId: 'pricing-assistant' },
    { id: 'phase6-pricing-numeric-boundary-v1', toolId: 'pricing-assistant' },
    { id: 'phase6-startup-cost-deterministic-v1', toolId: 'startup-cost-estimator' },
    { id: 'phase6-startup-cost-malformed-line-v1', toolId: 'startup-cost-estimator' },
    { id: 'phase6-business-plan-safe-v1', toolId: 'business-plan-assistant' },
    { id: 'phase6-business-plan-sensitive-data-v1', toolId: 'business-plan-assistant' },
  ],
} as const;

export function validatePhase6FixtureManifest() {
  const registryIds = new Set<string>(phase6Tools.flatMap((tool) => tool.governance.goldenFixtureIds ?? []));
  const manifestIds = new Set<string>(
    PHASE6_EVALUATION_FIXTURE_MANIFEST.fixtures.map((fixture) => fixture.id),
  );
  const errors: string[] = [];
  if ((PHASE6_EVALUATION_FIXTURE_MANIFEST.status as Phase6FixtureSignoffStatus) === 'signed') {
    if ((PHASE6_EVALUATION_FIXTURE_MANIFEST.signature.status as Phase6FixtureSignoffStatus) !== 'signed')
      errors.push('Phase 6 fixture manifest cannot be signed while its signature status is pending.');
    if (!PHASE6_EVALUATION_FIXTURE_MANIFEST.signature.reviewerName)
      errors.push('A signed Phase 6 fixture manifest requires a reviewer name.');
    if (!PHASE6_EVALUATION_FIXTURE_MANIFEST.signature.releaseCommit)
      errors.push('A signed Phase 6 fixture manifest requires a release commit.');
  }
  for (const fixture of PHASE6_EVALUATION_FIXTURE_MANIFEST.fixtures) {
    const tool = phase6Tools.find((candidate) => candidate.id === fixture.toolId);
    if (!tool) errors.push(`Fixture ${fixture.id} references unknown tool ${fixture.toolId}.`);
  }
  for (const id of registryIds)
    if (!manifestIds.has(id)) errors.push(`Registry fixture ${id} is missing from the Phase 6 manifest.`);
  return errors;
}
