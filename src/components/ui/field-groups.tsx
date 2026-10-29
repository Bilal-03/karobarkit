'use client';
import { Children, Fragment, cloneElement, isValidElement, useEffect, useRef, type ReactNode } from 'react';
import { toolPresentations } from '@/domain/registry/presentation';
export function FieldGroups<T extends { name: string }>({
  toolId,
  fields,
  values,
  render,
}: {
  toolId: string;
  fields: readonly T[];
  values?: object;
  render: (field: T) => ReactNode;
}) {
  const presentation = toolPresentations[toolId];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Field errors can arrive from a full-form submit while their section is closed.
    const root = ref.current;
    if (!root) return;
    const reveal = () =>
      root.querySelectorAll<HTMLElement>('[aria-invalid="true"]').forEach((field) => {
        let parent = field.parentElement;
        while (parent && parent !== root) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
          parent = parent.parentElement;
        }
      });
    const observer = new MutationObserver(reveal);
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['aria-invalid'] });
    reveal();
    return () => observer.disconnect();
  }, []);
  if (!presentation) throw new Error(`Missing presentation for ${toolId}`);
  const activeValues = values as Record<string, unknown> | undefined;
  const relevant = (name: string) =>
    toolId !== 'presumptive-tax-calculator' || !activeValues
      ? true
      : ['vehicleCount', 'vehicleMonths', 'vehicleType'].includes(name)
        ? activeValues.scheme === '44ae'
        : ['turnover', 'cashReceiptPercent'].includes(name)
          ? activeValues.scheme !== '44ae'
          : true;
  const renderControl = (field: T) => (
    <div key={field.name} hidden={!relevant(field.name)}>
      {render(field)}
    </div>
  );
  const additional = new Set(presentation.additionalSections.flatMap((section) => section.fields));
  return (
    <div ref={ref}>
      {fields.filter((field) => !additional.has(field.name)).map(renderControl)}
      {presentation.additionalSections.map((section) => (
        <details className="field-group" key={section.title}>
          <summary>{section.title}</summary>
          <div>{fields.filter((field) => section.fields.includes(field.name)).map(renderControl)}</div>
        </details>
      ))}
    </div>
  );
}
export function emptyPrimaryValues<T>(id: string, values: T): T {
  const next = { ...(values as Record<string, unknown>) };
  for (const name of toolPresentations[id]?.primaryFields ?? []) {
    if (typeof next[name] === 'string' && /^-?\d+(\.\d+)?$/.test(next[name] as string)) next[name] = '';
  }
  return next as T;
}
export function ExampleButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="example-button" onClick={onClick}>
      Try an example
    </button>
  );
}

// Layout comes from the explicit field IDs in the registry; values stay owned by each adapter.

export function PresentedControls({ toolId, children }: { toolId: string; children: ReactNode }) {
  const definition = toolPresentations[toolId];
  if (!definition) throw new Error(`Missing presentation for ${toolId}`);
  const additional = new Set(definition.additionalSections.flatMap((section) => section.fields));
  const extras = new Map<string, ReactNode[]>();
  function partition(nodes: ReactNode): ReactNode[] {
    return Children.toArray(nodes).flatMap((node) => {
      if (!isValidElement<{ id?: string; name?: string; className?: string; children?: ReactNode }>(node))
        return [node];
      const id = (node.props.id ?? node.props.name ?? '').replace(/^workplace-/, '');
      if (additional.has(id)) {
        const group = extras.get(id) ?? [];
        group.push(node);
        extras.set(id, group);
        return [];
      }
      if (node.type === Fragment || (node.type === 'div' && node.props.className?.includes('form-grid'))) {
        const content = partition(node.props.children);
        return content.length ? [cloneElement(node, {}, content)] : [];
      }
      return [node];
    });
  }
  const primary = partition(children);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reveal = () => {
      root.querySelectorAll<HTMLElement>('[aria-invalid="true"]').forEach((field) => {
        let parent = field.parentElement;
        while (parent && parent !== root) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
          parent = parent.parentElement;
        }
      });
    };
    const observer = new MutationObserver(reveal);
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['aria-invalid'] });
    reveal();
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref}>
      {primary}
      {definition.additionalSections.map((section) => {
        const content = section.fields.flatMap((id) => extras.get(id) ?? []);
        return content.length ? (
          <details className="field-group" key={section.title}>
            <summary>{section.title}</summary>
            <div>{content}</div>
          </details>
        ) : null;
      })}
    </div>
  );
}
