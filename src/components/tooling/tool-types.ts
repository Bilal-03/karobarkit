import type {
  SourceReference,
  ToolExecutionMode,
  ToolGovernance,
  ToolKind,
  ToolLifecycle,
  ToolTrustMetadata,
  ToolUiAdapter,
} from '@/domain/registry/types';

/**
 * The serializable portion of a runtime definition required by the tool page
 * shell. Calculation schemas, functions and React result renderers stay on the
 * server/build side and are never passed across the client boundary.
 */
export interface SupportedTool {
  id: string;
  slug: string;
  kind: ToolKind;
  generatorKind?: 'qr' | 'document' | 'sequence';
  ui: ToolUiAdapter;
  name: string;
  category: string;
  categoryLabel: string;
  summary: string;
  defaultValues: unknown;
  relatedToolIds: string[];
  howToUse: string[];
  formula: string;
  workedExample: string;
  resultInterpretation: string;
  limitations: string[];
  edgeCases: string[];
  privacyNote: string;
  lastReviewed: string;
  sources: SourceReference[];
  faqs: { question: string; answer: string }[];
  disclaimer?: string;
  lifecycle: ToolLifecycle;
  executionMode: ToolExecutionMode;
  governance: ToolGovernance;
  trust: ToolTrustMetadata;
}

export type ToolInteractionTool = Pick<
  SupportedTool,
  'id' | 'name' | 'category' | 'defaultValues' | 'privacyNote' | 'sources' | 'ui'
>;
