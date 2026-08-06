import type { ReactNode } from 'react';
import type { ZodType } from 'zod';

import type { PolicyContext } from '@/domain/policies/context';
import type { ValidationResult } from '@/domain/calculations/types';

export type EvidenceLevel = 'official' | 'authoritative' | 'editorial';

export interface SourceReference {
  id: string;
  title: string;
  publisher: string;
  url: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  lastChecked: string;
  evidenceLevel: EvidenceLevel;
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
  name: string;
  category: string;
  categoryLabel: string;
  summary: string;
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
}

export type AnyToolDefinition = ToolDefinition<never, never>;
