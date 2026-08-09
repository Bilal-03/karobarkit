import { defaultPolicyContext } from '../policies/context';

import { isFeatureFlagEnabled } from './feature-flags';
import type { AnyToolDefinition } from './types';
import { cagrTool } from './tools/cagr';
import {
  breakEvenTool,
  burnRateTool,
  cashFlowTool,
  codCostTool,
  marginTool,
  markupTool,
  marketplaceMarginTool,
  pricingTool,
  roasTool,
  runwayTool,
  businessEconomicsTools,
} from './tools/business-economics';
import { gstTool } from './tools/gst';
import { gstInvoiceTool } from './tools/gst-invoice';
import { letterheadTool } from './tools/letterhead';
import { paymentReceiptTool } from './tools/payment-receipt';
import { roiTool } from './tools/roi';
import { upiStandeeTool } from './tools/upi-standee';
import { urlQrTool } from './tools/url-qr';

export type {
  AnalyticsPolicy,
  AnyToolDefinition,
  FaqItem,
  ReviewerStatus,
  SourceReference,
  ToolCategoryDefinition,
  ToolDefinition,
  ToolExecutionMode,
  ToolGovernance,
  ToolKind,
  ToolLifecycle,
  ToolReviewer,
  ToolRiskTier,
  ToolTrustMetadata,
  ToolUiAdapter,
} from './types';
export { categoryRegistry, getCategoryBySlug } from './categories';
export { TOOL_LAST_REVIEWED } from './shared';
export {
  cagrTool,
  breakEvenTool,
  burnRateTool,
  cashFlowTool,
  codCostTool,
  gstInvoiceTool,
  gstTool,
  letterheadTool,
  marginTool,
  markupTool,
  marketplaceMarginTool,
  paymentReceiptTool,
  pricingTool,
  roiTool,
  roasTool,
  runwayTool,
  upiStandeeTool,
  urlQrTool,
  businessEconomicsTools,
};

export const allToolDefinitions = [
  cagrTool,
  roiTool,
  gstTool,
  urlQrTool,
  upiStandeeTool,
  letterheadTool,
  paymentReceiptTool,
  gstInvoiceTool,
  ...businessEconomicsTools,
] as const;

export const toolRegistry = allToolDefinitions.filter((tool) => isToolAvailable(tool));

export function isToolAvailable(tool: Pick<AnyToolDefinition, 'featureFlag' | 'lifecycle'>) {
  return (tool.lifecycle === 'live' || tool.lifecycle === 'beta') && isFeatureFlagEnabled(tool.featureFlag);
}

export const toolMetadataIndex = toolRegistry.map((tool) => ({
  id: tool.id,
  slug: tool.slug,
  kind: tool.kind,
  uiAdapter: tool.ui.adapter,
  name: tool.name,
  shortName: tool.shortName,
  category: tool.category,
  categoryLabel: tool.categoryLabel,
  secondaryCategories: tool.secondaryCategories,
  tags: tool.tags,
  searchTerms: tool.searchTerms,
  summary: tool.summary,
  featured: tool.featured ?? false,
  lifecycle: tool.lifecycle,
  executionMode: tool.executionMode,
  riskTier: tool.governance.riskTier,
  regulatory: tool.regulatory ?? false,
  lastVerified: tool.trust.lastVerified,
}));

export function getToolBySlug(slug: string) {
  return toolRegistry.find((tool) => tool.slug === slug);
}

export function getToolDefinitionBySlug(slug: string) {
  return allToolDefinitions.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: string) {
  return toolRegistry.filter(
    (tool) => tool.category === category || tool.secondaryCategories.includes(category),
  );
}

export function getRelatedTools(tool: Pick<AnyToolDefinition, 'relatedToolIds'>) {
  return tool.relatedToolIds
    .map((relatedId) => toolRegistry.find((candidate) => candidate.id === relatedId))
    .filter((related): related is (typeof toolRegistry)[number] => Boolean(related));
}

export function getToolResult<TInput, TResult>(
  tool: import('./types').ToolDefinition<TInput, TResult>,
  input: TInput,
) {
  const validation = tool.validate(input);
  if (!validation.success) {
    return validation;
  }

  return {
    success: true as const,
    result: tool.calculate(validation.data, defaultPolicyContext),
  };
}
