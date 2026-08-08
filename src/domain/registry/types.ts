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

export interface ToolDefinition<TInput, TResult> {
  id: string;
  slug: string;
  kind: 'calculator' | 'generator';
  generatorKind?: 'qr' | 'document';
  name: string;
  shortName?: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  searchTerms: string[];
  summary: string;
  audience?: string[];
  featured?: boolean;
  launchPriority?: number;
  regulatory?: boolean;
  privacyClassification: 'local-only';
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
