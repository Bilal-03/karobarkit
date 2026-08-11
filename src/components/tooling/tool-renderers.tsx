'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import type { ToolUiAdapter } from '@/domain/registry/types';

import type { ToolInteractionTool } from './tool-types';

function ToolInteractionLoading() {
  return (
    <div className="state-block state-block--loading" role="status" aria-live="polite">
      <strong>Loading this tool interface</strong>
      <p>The page shell is ready; the interaction area is loading.</p>
    </div>
  );
}

const CalculatorForm = dynamic(() => import('./calculator-form').then((module) => module.CalculatorForm), {
  loading: ToolInteractionLoading,
});
const BusinessCalculatorForm = dynamic(
  () => import('./business-calculator-form').then((module) => module.BusinessCalculatorForm),
  { loading: ToolInteractionLoading },
);
const FinanceCalculatorForm = dynamic(
  () => import('./finance-calculator-form').then((module) => module.FinanceCalculatorForm),
  { loading: ToolInteractionLoading },
);
const TaxCalculatorForm = dynamic(
  () => import('./tax-calculator-form').then((module) => module.TaxCalculatorForm),
  { loading: ToolInteractionLoading },
);
const Phase5CalculatorForm = dynamic(
  () => import('./phase5-calculator-form').then((module) => module.Phase5CalculatorForm),
  { loading: ToolInteractionLoading },
);
const AIAssistantForm = dynamic(
  () => import('./ai-assistant-form').then((module) => module.AIAssistantForm),
  { loading: ToolInteractionLoading },
);
const GstCalculatorForm = dynamic(
  () => import('./gst-calculator-form').then((module) => module.GstCalculatorForm),
  { loading: ToolInteractionLoading },
);
const DocumentGeneratorForm = dynamic(
  () =>
    import('@/components/documents/document-generator-form').then((module) => module.DocumentGeneratorForm),
  { loading: ToolInteractionLoading },
);
const GstInvoiceGeneratorForm = dynamic(
  () =>
    import('@/components/documents/gst-invoice-generator-form').then(
      (module) => module.GstInvoiceGeneratorForm,
    ),
  { loading: ToolInteractionLoading },
);
const QuotationGeneratorForm = dynamic(
  () =>
    import('@/components/documents/quotation-generator-form').then((module) => module.QuotationGeneratorForm),
  { loading: ToolInteractionLoading },
);
const InvoiceGeneratorForm = dynamic(
  () => import('@/components/documents/invoice-generator-form').then((module) => module.InvoiceGeneratorForm),
  { loading: ToolInteractionLoading },
);
const BusinessCardGeneratorForm = dynamic(
  () =>
    import('@/components/documents/business-card-generator-form').then(
      (module) => module.BusinessCardGeneratorForm,
    ),
  { loading: ToolInteractionLoading },
);
const InvoiceNumberGeneratorForm = dynamic(
  () =>
    import('@/components/documents/invoice-number-generator-form').then(
      (module) => module.InvoiceNumberGeneratorForm,
    ),
  { loading: ToolInteractionLoading },
);
const GeneratorForm = dynamic(() => import('./generator-form').then((module) => module.GeneratorForm), {
  loading: ToolInteractionLoading,
});
const UtilityCalculatorForm = dynamic(
  () => import('./utility-calculator-form').then((module) => module.UtilityCalculatorForm),
  { loading: ToolInteractionLoading },
);
const TextUtilityForm = dynamic(
  () => import('./text-utility-form').then((module) => module.TextUtilityForm),
  { loading: ToolInteractionLoading },
);
const TodoChecklistForm = dynamic(
  () => import('./todo-checklist-form').then((module) => module.TodoChecklistForm),
  { loading: ToolInteractionLoading },
);
const SharingFileUtilityForm = dynamic(
  () => import('./sharing-file-utility-form').then((module) => module.SharingFileUtilityForm),
  { loading: ToolInteractionLoading },
);
const WorkplaceDocumentForm = dynamic(
  () =>
    import('@/components/documents/workplace-document-form').then((module) => module.WorkplaceDocumentForm),
  { loading: ToolInteractionLoading },
);
const WorkplaceCalculatorForm = dynamic(
  () => import('./workplace-calculator-form').then((module) => module.WorkplaceCalculatorForm),
  { loading: ToolInteractionLoading },
);
const RegulatedUtilityForm = dynamic(
  () => import('./regulated-utility-form').then((module) => module.RegulatedUtilityForm),
  { loading: ToolInteractionLoading },
);

type ToolAdapterName = ToolUiAdapter['adapter'];
type ToolForAdapter<Adapter extends ToolAdapterName> = Omit<ToolInteractionTool, 'ui'> & {
  ui: Extract<ToolUiAdapter, { adapter: Adapter }>;
};
type ToolRenderer<Adapter extends ToolAdapterName> = (tool: ToolForAdapter<Adapter>) => ReactNode;
type ToolRendererRegistry = {
  [Adapter in ToolAdapterName]: ToolRenderer<Adapter>;
};

/**
 * One typed entry per adapter keeps page-shell routing stable while allowing
 * heavy interaction components to remain in separate client bundles.
 */
export const toolRendererRegistry = {
  'gst-calculator': (tool) => (
    <GstCalculatorForm
      tool={{
        id: tool.id,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
        sources: tool.sources,
      }}
    />
  ),
  'gst-invoice-generator': (tool) => (
    <GstInvoiceGeneratorForm
      tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
    />
  ),
  'quotation-generator': (tool) => (
    <QuotationGeneratorForm
      tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
    />
  ),
  'invoice-generator': (tool) => (
    <InvoiceGeneratorForm
      tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
    />
  ),
  'business-card-generator': (tool) => (
    <BusinessCardGeneratorForm
      tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
    />
  ),
  'invoice-number-generator': (tool) => (
    <InvoiceNumberGeneratorForm
      tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
    />
  ),
  calculator: (tool) => (
    <CalculatorForm
      kind={tool.ui.variant}
      tool={{
        id: tool.id,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
      }}
    />
  ),
  'business-calculator': (tool) => (
    <BusinessCalculatorForm
      kind={tool.ui.variant}
      tool={{
        id: tool.id,
        name: tool.name,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
      }}
    />
  ),
  'finance-calculator': (tool) => (
    <FinanceCalculatorForm
      kind={tool.ui.variant}
      tool={{
        id: tool.id,
        name: tool.name,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
      }}
    />
  ),
  'tax-calculator': (tool) => (
    <TaxCalculatorForm
      kind={tool.ui.variant}
      tool={{
        id: tool.id,
        name: tool.name,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
      }}
    />
  ),
  'phase5-calculator': (tool) => (
    <Phase5CalculatorForm
      kind={tool.ui.variant}
      tool={{
        id: tool.id,
        name: tool.name,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
      }}
    />
  ),
  'ai-assistant': (tool) => (
    <AIAssistantForm
      kind={tool.ui.variant}
      tool={{
        id: tool.id,
        name: tool.name,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
      }}
    />
  ),
  'document-generator': (tool) => (
    <DocumentGeneratorForm
      kind={tool.ui.variant}
      tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
    />
  ),
  'qr-generator': (tool) => (
    <GeneratorForm
      kind={tool.ui.variant}
      tool={{ id: tool.id, category: tool.category, defaultValues: tool.defaultValues }}
    />
  ),
  'utility-calculator': (tool) => (
    <UtilityCalculatorForm
      kind={tool.ui.variant}
      tool={{
        id: tool.id,
        name: tool.name,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
      }}
    />
  ),
  'text-utility': (tool) => (
    <TextUtilityForm
      kind={tool.ui.variant}
      tool={{
        id: tool.id,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
      }}
    />
  ),
  'todo-checklist': (tool) => (
    <TodoChecklistForm
      tool={{
        id: tool.id,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
      }}
    />
  ),
  'qr-barcode-generator': (tool) => (
    <SharingFileUtilityForm
      kind={tool.ui.variant}
      tool={{
        id: tool.id,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
      }}
    />
  ),
  'file-utility': (tool) => (
    <SharingFileUtilityForm
      kind={tool.ui.variant}
      tool={{
        id: tool.id,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
      }}
    />
  ),
  'business-document': (tool) => {
    if (tool.ui.variant === 'email-signature' || tool.ui.variant === 'review-request') {
      return (
        <SharingFileUtilityForm
          kind={tool.ui.variant}
          tool={{
            id: tool.id,
            category: tool.category,
            defaultValues: tool.defaultValues,
            privacyNote: tool.privacyNote,
          }}
        />
      );
    }
    if (tool.ui.variant === 'notice-period' || tool.ui.variant === 'leave-balance') {
      return (
        <WorkplaceCalculatorForm
          kind={tool.ui.variant}
          tool={{
            id: tool.id,
            category: tool.category,
            defaultValues: tool.defaultValues,
            privacyNote: tool.privacyNote,
          }}
        />
      );
    }
    return (
      <WorkplaceDocumentForm
        kind={tool.ui.variant}
        tool={{
          id: tool.id,
          category: tool.category,
          defaultValues: tool.defaultValues,
          privacyNote: tool.privacyNote,
        }}
      />
    );
  },
  'regulated-utility': (tool) => (
    <RegulatedUtilityForm
      kind={tool.ui.variant}
      tool={{
        id: tool.id,
        category: tool.category,
        defaultValues: tool.defaultValues,
        privacyNote: tool.privacyNote,
      }}
    />
  ),
  unavailable: () => (
    <div className="state-block state-block--empty">
      <strong>This interface is not available yet</strong>
      <p>The tool remains unavailable until its task-specific interface passes release review.</p>
    </div>
  ),
} satisfies ToolRendererRegistry;

export function ToolInteraction({ tool }: { tool: ToolInteractionTool }) {
  const renderer = toolRendererRegistry[tool.ui.adapter] as (tool: ToolInteractionTool) => ReactNode;
  if (!renderer) throw new Error(`Missing tool renderer for adapter: ${tool.ui.adapter}`);
  return renderer(tool);
}
