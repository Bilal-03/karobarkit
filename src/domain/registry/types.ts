import type { ReactNode } from 'react';
import type { ZodType } from 'zod';

import type { PolicyContext } from '@/domain/policies/context';
import type { ValidationResult } from '@/domain/calculations/types';

export type EvidenceLevel = 'official' | 'authoritative' | 'editorial';

export type SourceAuthority = 'CBIC' | 'GST_COUNCIL' | 'GST_PORTAL' | 'OTHER_GOVERNMENT';

export type SourceDocumentType = 'notification' | 'rule' | 'circular' | 'press-release' | 'rate-schedule';

export interface SourceReference {
  id: string;
  title: string;
  publisher: string;
  url: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  lastChecked: string;
  evidenceLevel: EvidenceLevel;
  authority?: SourceAuthority;
  documentType?: SourceDocumentType;
  referenceNumber?: string;
  publishedOn?: string;
  accessedOn?: string;
  notes?: string;
  supports?: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface AnalyticsPolicy {
  allowedEvents: string[];
  forbiddenProperties: string[];
}

export type ToolKind =
  'calculator' | 'generator' | 'worksheet' | 'comparison' | 'data-backed' | 'ai-assisted';

export type ToolExecutionMode =
  'local-only' | 'local-with-bundled-data' | 'network-required' | 'optional-cloud-sync';

export type ToolLifecycle = 'internal' | 'beta' | 'live' | 'stale-disabled' | 'retired';

export type ToolRiskTier = 'A' | 'B' | 'C' | 'D';

export type ReviewerStatus = 'not-required' | 'pending' | 'approved';

export interface ToolReviewer {
  status: ReviewerStatus;
  role: string;
  name?: string;
  reviewedOn?: string;
}

export interface ToolTrustMetadata {
  method: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  lastVerified: string;
  reviewer: ToolReviewer;
}

export interface ToolGovernance {
  owner: string;
  riskTier: ToolRiskTier;
  reviewCadenceDays: number;
  policyDependencies: string[];
}

export interface ToolCategoryDefinition {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  searchTerms: string[];
  roadmapPhase: number;
}

export type ToolUiAdapter =
  | { adapter: 'calculator'; variant: 'cagr' | 'roi' }
  | { adapter: 'gst-calculator' }
  | { adapter: 'qr-generator'; variant: 'url-qr' | 'upi-standee' }
  | { adapter: 'document-generator'; variant: 'letterhead' | 'payment-receipt' }
  | { adapter: 'gst-invoice-generator' }
  | { adapter: 'unavailable' };

export interface ToolDefinition<TInput, TResult> {
  id: string;
  slug: string;
  kind: ToolKind;
  generatorKind?: 'qr' | 'document';
  ui: ToolUiAdapter;
  name: string;
  shortName?: string;
  category: string;
  categoryLabel: string;
  secondaryCategories: string[];
  tags: string[];
  searchTerms: string[];
  summary: string;
  audience?: string[];
  featured?: boolean;
  launchPriority?: number;
  regulatory?: boolean;
  privacyClassification: ToolExecutionMode;
  executionMode: ToolExecutionMode;
  lifecycle: ToolLifecycle;
  featureFlag?: string;
  governance: ToolGovernance;
  trust: ToolTrustMetadata;
  inputSchema: ZodType<TInput>;
  defaultValues: TInput;
  validate: (input: TInput) => ValidationResult<TInput>;
  calculate: (input: TInput, context: PolicyContext) => TResult;
  renderResult: (result: TResult) => ReactNode;
  sources: SourceReference[];
  limitations: string[];
  lastReviewed: string;
  seo: {
    title: string;
    description: string;
    keywords?: string[];
  };
  relatedToolIds: string[];
  analyticsPolicy: AnalyticsPolicy;
  howToUse: string[];
  formula: string;
  workedExample: string;
  resultInterpretation: string;
  edgeCases: string[];
  faqs: FaqItem[];
  privacyNote: string;
  disclaimer?: string;
}

export type AnyToolDefinition = ToolDefinition<never, never>;
