import type { ReactNode } from 'react';
export function ResultSummary({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div className="studio-result-summary">
      <span>{label}</span>
      <strong>{value}</strong>
      {children}
    </div>
  );
}
export function Distribution({ parts }: { parts: { label: string; value: number; display: string }[] }) {
  const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0);
  if (!total) return null;
  return (
    <div className="distribution">
      <div className="distribution-bar" aria-hidden="true">
        {parts.map((part, index) => (
          <span
            key={part.label}
            style={{
              width: `${(Math.max(0, part.value) / total) * 100}%`,
              background: index === 0 ? 'var(--accent-600)' : 'var(--chart-secondary)',
            }}
          />
        ))}
      </div>
      <dl>
        {parts.map((part) => (
          <div key={part.label}>
            <dt>{part.label}</dt>
            <dd>{part.display}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
