'use client';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormHTMLAttributes,
  type ReactNode,
  type FieldsetHTMLAttributes,
} from 'react';
import type { FieldError } from '@/domain/calculations/types';
export interface DocumentStep {
  id: string;
  label: string;
  fields: readonly string[];
}
export interface DocumentFlow {
  steps: readonly DocumentStep[];
}
const DocumentStepContext = createContext<string | undefined>(undefined);
export function DocumentSection({
  stepId,
  optional,
  children,
  ...props
}: FieldsetHTMLAttributes<HTMLFieldSetElement> & { stepId: string; optional?: string }) {
  const active = useContext(DocumentStepContext);
  return (
    <div className="document-step-panel" hidden={active !== undefined && active !== stepId}>
      {optional ? (
        <details className="field-group">
          <summary>{optional}</summary>
          <fieldset {...props}>{children}</fieldset>
        </details>
      ) : (
        <fieldset {...props}>{children}</fieldset>
      )}
    </div>
  );
}

export const documentFlows = {
  invoice: {
    steps: [
      {
        id: 'parties',
        label: 'Parties',
        fields: [
          'businessName',
          'businessAddress',
          'phone',
          'email',
          'website',
          'gstin',
          'customerName',
          'customerAddress',
          'customerEmail',
          'customerPhone',
          'logo',
        ],
      },
      {
        id: 'details',
        label: 'Document & items',
        fields: [
          'invoiceNumber',
          'invoiceDate',
          'dueDate',
          'items',
          'notes',
          'terms',
          'paymentDetails',
          'template',
          'accent',
          'signatoryName',
          'signatoryDesignation',
          'signaturePlaceholder',
          'footerText',
        ],
      },
      { id: 'review', label: 'Review', fields: [] },
    ],
  },
  quotation: {
    steps: [
      {
        id: 'parties',
        label: 'Parties',
        fields: [
          'businessName',
          'businessAddress',
          'phone',
          'email',
          'website',
          'gstin',
          'tagline',
          'customerName',
          'customerAddress',
          'customerEmail',
          'customerPhone',
          'logo',
        ],
      },
      {
        id: 'details',
        label: 'Document & items',
        fields: [
          'quoteNumber',
          'quoteDate',
          'validUntil',
          'items',
          'notes',
          'terms',
          'template',
          'accent',
          'signatoryName',
          'signatoryDesignation',
          'signaturePlaceholder',
          'footerText',
        ],
      },
      { id: 'review', label: 'Review', fields: [] },
    ],
  },
  gstInvoice: {
    steps: [
      {
        id: 'parties',
        label: 'Parties',
        fields: ['supplier', 'recipient', 'recipientRegistrationStatus', 'logo'],
      },
      {
        id: 'details',
        label: 'Document & items',
        fields: [
          'invoiceNumber',
          'invoiceDate',
          'dueDate',
          'supplyType',
          'placeOfSupply',
          'reverseCharge',
          'items',
          'notes',
          'terms',
          'paymentDetails',
        ],
      },
      { id: 'review', label: 'Review', fields: [] },
    ],
  },
  letterhead: {
    steps: [
      {
        id: 'parties',
        label: 'Details',
        fields: [
          'businessName',
          'businessAddress',
          'phone',
          'email',
          'website',
          'tagline',
          'gstin',
          'cin',
          'registrationNumber',
          'additionalContact',
          'socialHandle',
          'letterDate',
          'recipientName',
          'recipientAddress',
          'subject',
          'body',
          'signatoryName',
          'signatoryDesignation',
          'signaturePlaceholder',
        ],
      },
      {
        id: 'details',
        label: 'Appearance',
        fields: [
          'logo',
          'footerText',
          'template',
          'accent',
          'logoAlignment',
          'headerDivider',
          'footerDivider',
        ],
      },
      { id: 'review', label: 'Review', fields: [] },
    ],
  },
  receipt: {
    steps: [
      {
        id: 'parties',
        label: 'Parties',
        fields: [
          'businessName',
          'businessAddress',
          'phone',
          'email',
          'website',
          'tagline',
          'gstin',
          'cin',
          'registrationNumber',
          'additionalContact',
          'socialHandle',
        ],
      },
      {
        id: 'details',
        label: 'Payment',
        fields: [
          'receiptNumber',
          'receiptDate',
          'receivedFrom',
          'amount',
          'paymentPurpose',
          'paymentMethod',
          'transactionReference',
          'paymentNote',
          'invoiceReference',
          'customerAddress',
          'signatoryName',
          'signatoryDesignation',
          'signaturePlaceholder',
          'logo',
          'footerText',
          'template',
          'accent',
          'logoAlignment',
          'headerDivider',
          'footerDivider',
        ],
      },
      { id: 'review', label: 'Review', fields: [] },
    ],
  },
  businessCard: {
    steps: [
      {
        id: 'parties',
        label: 'Details',
        fields: [
          'businessName',
          'businessAddress',
          'phone',
          'email',
          'website',
          'tagline',
          'gstin',
          'personName',
          'designation',
          'cardPhone',
          'cardEmail',
          'cardWebsite',
          'cardAddress',
          'cardTagline',
          'cardNote',
        ],
      },
      {
        id: 'details',
        label: 'Appearance',
        fields: [
          'logo',
          'footerText',
          'template',
          'accent',
          'logoAlignment',
          'headerDivider',
          'footerDivider',
        ],
      },
      { id: 'review', label: 'Review', fields: [] },
    ],
  },
} satisfies Record<string, DocumentFlow>;
interface Props extends FormHTMLAttributes<HTMLFormElement> {
  simple?: boolean;
  definition: DocumentFlow;
  validate: () => FieldError[];
  errors: FieldError[];
  onPreview: () => void;
  onStepErrors?: (errors: FieldError[]) => void;
}
export function GuidedDocumentForm({
  children,
  simple = false,
  definition,
  validate,
  errors,
  onPreview,
  onStepErrors,
  ...props
}: Props) {
  const [step, setStep] = useState(0),
    [completed, setCompleted] = useState(0),
    [issues, setIssues] = useState<FieldError[]>([]),
    [preview, setPreview] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const last = definition.steps.length - 1;
  const stepFor = (field: string) =>
    definition.steps.findIndex((item) =>
      item.fields.some((prefix) => field === prefix || field.startsWith(`${prefix}.`)),
    );
  useEffect(() => {
    if (!errors.length) return;
    const index = definition.steps.findIndex((item) =>
      item.fields.some((prefix) => errors[0].field === prefix || errors[0].field.startsWith(`${prefix}.`)),
    );
    const frame = requestAnimationFrame(() => {
      if (index >= 0) setStep(index);
      const target =
        document.getElementById(errors[0].field) ?? document.getElementById(`workplace-${errors[0].field}`);
      let parent = target?.parentElement;
      while (parent && parent !== ref.current) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [errors, definition]);
  function move(next: number) {
    if (next > step) {
      const failures = validate().filter((error) => stepFor(error.field) === step);
      setIssues(onStepErrors ? [] : failures);
      onStepErrors?.(failures);
      if (failures.length) return;
    }
    setIssues([]);
    if (next < step) onStepErrors?.([]);
    setCompleted((value) => Math.max(value, next));
    setStep(next);
    if (next === last) {
      setPreview(true);
      onPreview();
    }
  }
  if (simple) return <form {...props}>{children}</form>;
  return (
    <>
      <button
        className="button button--secondary mobile-preview-button"
        type="button"
        aria-pressed={preview}
        onClick={() => setPreview((value) => !value)}
      >
        {preview ? 'Hide preview' : 'Preview'}
      </button>
      <form
        ref={ref}
        {...props}
        data-step={definition.steps[step].id}
        data-preview={preview}
        className="guided-document-form"
        onSubmit={(event) => {
          if (step < last) {
            event.preventDefault();
            move(step + 1);
          } else props.onSubmit?.(event);
        }}
      >
        <nav className="document-steps" aria-label="Document steps">
          {definition.steps.map((item, index) => (
            <button
              type="button"
              key={item.id}
              aria-current={index === step ? 'step' : undefined}
              disabled={index > completed}
              onClick={() => move(index)}
            >
              <span>{index + 1}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <p className="sr-only" role="status">
          Step {step + 1} of {definition.steps.length}: {definition.steps[step].label}
        </p>
        {issues.length > 0 && (
          <div role="alert" className="error-summary">
            <strong>Check these details</strong>
            <ul>
              {issues.map((error) => (
                <li key={error.field}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}
        <DocumentStepContext.Provider value={definition.steps[step].id}>
          {children}
        </DocumentStepContext.Provider>
        {step === last && (
          <div className="review-edit-actions">
            {definition.steps.slice(0, last).map((item, index) => (
              <button type="button" className="example-button" key={item.id} onClick={() => move(index)}>
                Edit {item.label.toLowerCase()}
              </button>
            ))}
          </div>
        )}
        <div className="document-step-actions">
          {step > 0 && (
            <button type="button" className="button button--secondary" onClick={() => move(step - 1)}>
              Back
            </button>
          )}
          {step < last && (
            <button type="button" className="button button--primary" onClick={() => move(step + 1)}>
              {step === last - 1 ? 'Review document' : 'Next'}
            </button>
          )}
        </div>
      </form>
    </>
  );
}
