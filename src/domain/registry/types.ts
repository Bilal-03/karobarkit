import type { ReactNode } from 'react';
import type { ZodType } from 'zod';

import type { PolicyContext } from '@/domain/policies/context';
import type { ValidationResult } from '@/domain/calculations/types';

export type EvidenceLevel = 'official' | 'authoritative' | 'editorial';

export type SourceAuthority =
  | 'CBIC'
  | 'GST_COUNCIL'
  | 'GST_PORTAL'
  | 'INCOME_TAX_DEPARTMENT'
  | 'MCA'
  | 'MAHAGST'
  | 'MSME'
  | 'RBI'
  | 'ECB'
  | 'OTHER_GOVERNMENT';

export type SourceDocumentType =
  | 'notification'
  | 'rule'
  | 'circular'
  | 'press-release'
  | 'rate-schedule'
  | 'validation-rules'
  | 'official-page'
  | 'official-playbook'
  | 'methodology';

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
  allowedProperties: string[];
  forbiddenProperties: string[];
}

export type ToolKind =
  'calculator' | 'generator' | 'worksheet' | 'comparison' | 'data-backed' | 'ai-assisted';

export type ToolCapability =
  | 'converter'
  | 'scanner'
  | 'camera'
  | 'file-upload'
  | 'image-processing'
  | 'pdf-processing'
  | 'qr-output'
  | 'barcode-output'
  | 'download-png'
  | 'download-svg'
  | 'download-pdf'
  | 'download-csv'
  | 'download-vcf'
  | 'download-zip'
  | 'download-html'
  | 'download-text'
  | 'print-a4'
  | 'print-thermal-58'
  | 'print-thermal-80'
  | 'print-label-4x6'
  | 'print-label-sheet'
  | 'session-handoff'
  | 'bundled-data'
  | 'network-data';

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
  goldenFixtureIds?: string[];
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

export interface ToolDiscoveryRecord {
  id: string;
  slug: string;
  kind: ToolKind;
  uiAdapter: ToolUiAdapter['adapter'];
  name: string;
  shortName?: string;
  category: string;
  categoryLabel: string;
  secondaryCategories: readonly string[];
  tags: readonly string[];
  searchTerms: readonly string[];
  summary: string;
  capabilities: readonly ToolCapability[];
  featured: boolean;
  launchPriority?: number;
  lifecycle: ToolLifecycle;
  featureFlag?: string;
  executionMode: ToolExecutionMode;
  riskTier: ToolRiskTier;
  regulatory: boolean;
  lastVerified: string;
}

export type ToolUiAdapter =
  | { adapter: 'calculator'; variant: 'cagr' | 'roi' }
  | {
      adapter: 'finance-calculator';
      variant: 'emi' | 'sip' | 'fd' | 'xirr' | 'loan-comparison';
    }
  | {
      adapter: 'tax-calculator';
      variant:
        | 'hra'
        | 'income-tax'
        | 'tds'
        | 'corporate-tax'
        | 'presumptive-tax'
        | 'ctc'
        | 'in-hand-salary'
        | 'pf'
        | 'gratuity';
    }
  | {
      adapter: 'phase5-calculator';
      variant:
        | 'cac'
        | 'ltv'
        | 'saas-metrics'
        | 'valuation'
        | 'equity-dilution'
        | 'esop'
        | 'amazon-fees'
        | 'flipkart-fees';
    }
  | {
      adapter: 'business-calculator';
      variant:
        | 'margin'
        | 'markup'
        | 'break-even'
        | 'pricing'
        | 'cash-flow'
        | 'burn-rate'
        | 'runway'
        | 'marketplace-margin'
        | 'roas'
        | 'cod-cost';
    }
  | { adapter: 'gst-calculator' }
  | { adapter: 'qr-generator'; variant: 'url-qr' | 'upi-standee' }
  | { adapter: 'document-generator'; variant: 'letterhead' | 'payment-receipt' }
  | { adapter: 'quotation-generator' }
  | { adapter: 'invoice-generator' }
  | { adapter: 'business-card-generator' }
  | { adapter: 'invoice-number-generator' }
  | { adapter: 'gst-invoice-generator' }
  | {
      adapter: 'ai-assistant';
      variant: 'business-name' | 'pricing-assistant' | 'startup-cost-estimator' | 'business-plan-assistant';
    }
  | {
      adapter: 'utility-calculator';
      variant: 'percentage' | 'discount' | 'area' | 'business-days' | 'fuel-expense' | 'volumetric-weight';
    }
  | { adapter: 'text-utility'; variant: 'word-counter' | 'password-toolkit' }
  | { adapter: 'todo-checklist' }
  | {
      adapter: 'qr-barcode-generator';
      variant: 'whatsapp-link' | 'vcard' | 'wifi' | 'barcode' | 'scanner';
    }
  | {
      adapter: 'file-utility';
      variant: 'photo-resizer-compressor' | 'pdf-merge-split' | 'favicon-app-icon';
    }
  | {
      adapter: 'business-document';
      variant:
        | 'email-signature'
        | 'digital-signature'
        | 'review-request'
        | 'price-tag'
        | 'delivery-challan'
        | 'shipping-label'
        | 'purchase-order'
        | 'menu'
        | 'wage-slip'
        | 'rent-receipt'
        | 'notice-period'
        | 'leave-balance';
    }
  | {
      adapter: 'regulated-utility';
      variant:
        | 'hsn-sac'
        | 'gst-due-date'
        | 'depreciation'
        | 'professional-tax'
        | 'msme-interest'
        | 'currency-converter';
    }
  | { adapter: 'unavailable' };

export interface ToolDefinition<TInput, TResult> {
  id: string;
  slug: string;
  kind: ToolKind;
  generatorKind?: 'qr' | 'document' | 'sequence';
  ui: ToolUiAdapter;
  name: string;
  shortName?: string;
  category: string;
  categoryLabel: string;
  secondaryCategories: string[];
  tags: string[];
  searchTerms: string[];
  summary: string;
  capabilities: readonly ToolCapability[];
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
