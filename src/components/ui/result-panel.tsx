import type { ReactNode } from 'react';

interface ResultPanelProps {
  label: string;
  value: string;
  detail?: string;
  tone?: 'positive' | 'negative' | 'neutral';
  children?: ReactNode;
}

export function ResultPanel({ label, value, detail, tone = 'positive', children }: ResultPanelProps) {
  return (
    <section className={`result-panel result-panel--${tone}`} aria-live="polite" aria-atomic="true">
      <p className="result-panel__label">{label}</p>
      <p className="result-panel__value">{value}</p>
      {detail ? <p className="result-panel__detail">{detail}</p> : null}
      {children ? <div className="result-panel__content">{children}</div> : null}
    </section>
  );
}
