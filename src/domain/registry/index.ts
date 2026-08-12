import { defaultPolicyContext } from '../policies/context';
import {
  isApprovedOfficialPolicyUrl,
  isRegulatedUtilitiesKillSwitchEnabled,
  REGULATED_UTILITIES_FEATURE_FLAG,
} from '../policies/regulated-utilities';

import { isFeatureFlagEnabled } from './feature-flags';
import { categoryNames, categoryRegistry, getCategoryBySlug } from './categories';
import type { AnyToolDefinition, ToolDiscoveryRecord } from './types';
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
import {
  businessNameAssistantTool,
  businessPlanAssistantTool,
  phase6Tools,
  pricingAssistantTool,
  startupCostAssistantTool,
  PHASE6_FEATURE_FLAG,
  PHASE6_EVALUATION_FIXTURE_MANIFEST,
  validatePhase6FixtureManifest,
} from './tools/phase6';
import {
  areaConverterTool,
  businessDaysTool,
  discountTool,
  everydayUtilityTools,
  fuelExpenseTool,
  percentageTool,
  passwordToolkitTool,
  todoChecklistTool,
  volumetricWeightTool,
  wordCharacterCounterTool,
  EVERYDAY_UTILITIES_FEATURE_FLAG,
} from './tools/everyday-utilities';
import {
  barcodeGeneratorTool,
  digitalSignatureTool,
  emailSignatureTool,
  faviconAppIconTool,
  pdfMergeSplitTool,
  photoResizerTool,
  qrBarcodeScannerTool,
  reviewRequestTool,
  sharingFileUtilityTools,
  SHARING_FILE_UTILITIES_FEATURE_FLAG,
  vcardQrTool,
  whatsappLinkTool,
  wifiQrTool,
} from './tools/sharing-file-utilities';
import {
  deliveryChallanTool,
  leaveBalanceTool,
  menuTool,
  noticePeriodTool,
  priceTagTool,
  purchaseOrderTool,
  rentReceiptTool,
  retailWorkplaceTools,
  RETAIL_WORKPLACE_FEATURE_FLAG,
  shippingLabelTool,
  wageSlipTool,
} from './tools/retail-workplace';
import {
  currencyConverterTool,
  depreciationTool,
  gstDueDateTool,
  hsnSacFinderTool,
  msmeInterestTool,
  professionalTaxTool,
  regulatedUtilitiesTools,
  REGULATED_UTILITIES_WAVE,
  REGULATED_UTILITIES_GOLDEN_FIXTURE_MANIFEST,
  validateRegulatedUtilitiesGoldenFixtureManifest,
} from './tools/regulated-utilities';

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
  ToolCapability,
  ToolLifecycle,
  ToolReviewer,
  ToolRiskTier,
  ToolDiscoveryRecord,
  ToolTrustMetadata,
  ToolUiAdapter,
} from './types';
export { categoryNames, categoryRegistry, getCategoryBySlug };
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
  businessNameAssistantTool,
  pricingAssistantTool,
  startupCostAssistantTool,
  businessPlanAssistantTool,
  phase6Tools,
  PHASE6_FEATURE_FLAG,
  PHASE6_EVALUATION_FIXTURE_MANIFEST,
  validatePhase6FixtureManifest,
  areaConverterTool,
  businessDaysTool,
  discountTool,
  fuelExpenseTool,
  percentageTool,
  passwordToolkitTool,
  todoChecklistTool,
  volumetricWeightTool,
  wordCharacterCounterTool,
  everydayUtilityTools,
  EVERYDAY_UTILITIES_FEATURE_FLAG,
  barcodeGeneratorTool,
  digitalSignatureTool,
  emailSignatureTool,
  faviconAppIconTool,
  pdfMergeSplitTool,
  photoResizerTool,
  qrBarcodeScannerTool,
  reviewRequestTool,
  sharingFileUtilityTools,
  SHARING_FILE_UTILITIES_FEATURE_FLAG,
  vcardQrTool,
  whatsappLinkTool,
  wifiQrTool,
  deliveryChallanTool,
  leaveBalanceTool,
  menuTool,
  noticePeriodTool,
  priceTagTool,
  purchaseOrderTool,
  rentReceiptTool,
  retailWorkplaceTools,
  RETAIL_WORKPLACE_FEATURE_FLAG,
  shippingLabelTool,
  wageSlipTool,
  hsnSacFinderTool,
  gstDueDateTool,
  depreciationTool,
  professionalTaxTool,
  msmeInterestTool,
  currencyConverterTool,
  regulatedUtilitiesTools,
  REGULATED_UTILITIES_WAVE,
  REGULATED_UTILITIES_GOLDEN_FIXTURE_MANIFEST,
  validateRegulatedUtilitiesGoldenFixtureManifest,
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
  ...phase6Tools,
  ...everydayUtilityTools,
  ...sharingFileUtilityTools,
  ...retailWorkplaceTools,
  ...regulatedUtilitiesTools,
] as const;

export const toolRegistry = allToolDefinitions.filter((tool) => isToolAvailable(tool));

export function isToolAvailable(tool: Pick<AnyToolDefinition, 'featureFlag' | 'lifecycle'>) {
  if (tool.featureFlag === REGULATED_UTILITIES_FEATURE_FLAG && isRegulatedUtilitiesKillSwitchEnabled()) {
    return false;
  }
  return (tool.lifecycle === 'live' || tool.lifecycle === 'beta') && isFeatureFlagEnabled(tool.featureFlag);
}

export const toolDiscoveryIndex: readonly ToolDiscoveryRecord[] = toolRegistry.map((tool) => ({
  id: tool.id,
  slug: tool.slug,
  kind: tool.kind,
  uiAdapter: tool.ui.adapter,
  name: tool.name,
  shortName: tool.shortName,
  category: tool.category,
  categoryLabel: tool.categoryLabel,
  secondaryCategories: [...tool.secondaryCategories],
  tags: [...tool.tags],
  searchTerms: [...tool.searchTerms],
  summary: tool.summary,
  capabilities: [...(tool.capabilities ?? [])],
  featured: tool.featured ?? false,
  launchPriority: tool.launchPriority,
  lifecycle: tool.lifecycle,
  featureFlag: tool.featureFlag,
  executionMode: tool.executionMode,
  riskTier: tool.governance.riskTier,
  regulatory: tool.regulatory ?? false,
  lastVerified: tool.trust.lastVerified,
}));

// Kept as a compatibility alias for existing metadata consumers while the
// discovery boundary moves to the explicitly named index.
export const toolMetadataIndex = toolDiscoveryIndex;

/**
 * Validate the full runtime registry without making the client discovery graph
 * depend on calculation, policy or React result implementations.
 */
export function validateToolRegistry() {
  const toolIds = new Set(allToolDefinitions.map((tool) => tool.id));
  const categoryIds = new Set<string>(categoryRegistry.map((category) => category.id));
  const errors: string[] = [];

  for (const tool of allToolDefinitions) {
    if (!categoryIds.has(tool.category)) errors.push(`${tool.id}: missing category ${tool.category}`);
    for (const secondaryCategory of tool.secondaryCategories) {
      if (!categoryIds.has(secondaryCategory)) {
        errors.push(`${tool.id}: missing secondary category ${secondaryCategory}`);
      }
      if (secondaryCategory === tool.category) {
        errors.push(`${tool.id}: primary category repeated as secondary category`);
      }
    }
    if (tool.lifecycle !== 'live' && tool.lifecycle !== 'beta' && tool.lifecycle !== 'internal') {
      errors.push(`${tool.id}: non-public lifecycle leaked into public registry`);
    }
    if (tool.ui.adapter === 'unavailable') {
      errors.push(`${tool.id}: public tool is missing a released UI adapter`);
    }
    if (!tool.trust.lastVerified) errors.push(`${tool.id}: missing last-verified date`);
    if (!tool.governance.owner) errors.push(`${tool.id}: missing owner`);
    if (new Set(tool.capabilities).size !== tool.capabilities.length) {
      errors.push(`${tool.id}: duplicate capability`);
    }
    if (tool.capabilities.includes('bundled-data') && tool.executionMode !== 'local-with-bundled-data') {
      errors.push(`${tool.id}: bundled-data capability requires local bundled-data execution`);
    }
    if (
      tool.capabilities.includes('network-data') &&
      tool.executionMode !== 'network-required' &&
      tool.executionMode !== 'optional-cloud-sync'
    ) {
      errors.push(`${tool.id}: network-data capability requires disclosed network execution`);
    }
    if (
      tool.governance.riskTier === 'D' &&
      tool.sources.every((source) => source.evidenceLevel !== 'official')
    ) {
      errors.push(`${tool.id}: Tier D tool requires an official source`);
    }
    if (tool.featureFlag === REGULATED_UTILITIES_FEATURE_FLAG) {
      for (const source of tool.sources) {
        if (!isApprovedOfficialPolicyUrl(source.url)) {
          errors.push(`${tool.id}: source ${source.id} is outside the approved official host allowlist`);
        }
      }
    }
    if (
      (tool.featureFlag === 'phase4-tax-review' ||
        tool.featureFlag === 'phase5-startup-marketplace' ||
        tool.featureFlag === 'phase5-marketplace' ||
        tool.featureFlag === 'phase6-ai-assistants') &&
      (tool.governance.goldenFixtureIds?.length ?? 0) === 0
    ) {
      errors.push(`${tool.id}: controlled-beta tool requires golden fixture IDs before release`);
    }
    if (new Set(tool.relatedToolIds).size !== tool.relatedToolIds.length) {
      errors.push(`${tool.id}: duplicate related tool`);
    }
    for (const relatedId of tool.relatedToolIds) {
      if (relatedId === tool.id) errors.push(`${tool.id}: self-related tool`);
      if (!toolIds.has(relatedId)) errors.push(`${tool.id}: missing related tool ${relatedId}`);
    }
  }
  return errors;
}

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
