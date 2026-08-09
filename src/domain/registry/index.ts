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
import { hraTool } from './tools/hra';
import {
  corporateTaxTool,
  ctcTool,
  gratuityTool,
  inHandSalaryTool,
  incomeTaxTool,
  pfTool,
  presumptiveTaxTool,
  taxTools,
  tdsTool,
} from './tools/tax';
import { financeTools, fdTool, emiTool, loanComparisonTool, sipTool, xirrTool } from './tools/finance';
import { letterheadTool } from './tools/letterhead';
import { paymentReceiptTool } from './tools/payment-receipt';
import { businessCardTool } from './tools/business-card';
import { invoiceTool } from './tools/invoice';
import { invoiceNumberTool } from './tools/invoice-number';
import { quotationTool } from './tools/quotation';
import { roiTool } from './tools/roi';
import { upiStandeeTool } from './tools/upi-standee';
import { urlQrTool } from './tools/url-qr';
import {
  amazonFeesTool,
  cacTool,
  equityDilutionTool,
  esopTool,
  flipkartFeesTool,
  ltvTool,
  PHASE5_GOLDEN_FIXTURE_MANIFEST,
  PHASE5_MARKETPLACE_FEATURE_FLAG,
  phase5Tools,
  saasMetricsTool,
  valuationTool,
  validatePhase5FixtureManifest,
} from './tools/phase5';

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
  hraTool,
  incomeTaxTool,
  tdsTool,
  corporateTaxTool,
  presumptiveTaxTool,
  ctcTool,
  inHandSalaryTool,
  pfTool,
  gratuityTool,
  letterheadTool,
  marginTool,
  markupTool,
  marketplaceMarginTool,
  paymentReceiptTool,
  businessCardTool,
  invoiceTool,
  invoiceNumberTool,
  quotationTool,
  pricingTool,
  roiTool,
  roasTool,
  runwayTool,
  upiStandeeTool,
  urlQrTool,
  emiTool,
  sipTool,
  fdTool,
  xirrTool,
  loanComparisonTool,
  businessEconomicsTools,
  financeTools,
  cacTool,
  ltvTool,
  saasMetricsTool,
  valuationTool,
  equityDilutionTool,
  esopTool,
  amazonFeesTool,
  flipkartFeesTool,
  phase5Tools,
  PHASE5_GOLDEN_FIXTURE_MANIFEST,
  PHASE5_MARKETPLACE_FEATURE_FLAG,
  validatePhase5FixtureManifest,
};

export const allToolDefinitions = [
  cagrTool,
  roiTool,
  gstTool,
  urlQrTool,
  upiStandeeTool,
  letterheadTool,
  paymentReceiptTool,
  businessCardTool,
  invoiceTool,
  invoiceNumberTool,
  quotationTool,
  gstInvoiceTool,
  hraTool,
  ...businessEconomicsTools,
  ...financeTools,
  ...taxTools,
  ...phase5Tools,
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
