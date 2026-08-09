import Link from 'next/link';

import type { ToolExecutionMode, ToolLifecycle } from '@/domain/registry/types';

interface ToolCardProps {
  href: string;
  name: string;
  summary: string;
  categoryLabel: string;
  featured?: boolean;
  lifecycle?: ToolLifecycle;
  executionMode?: ToolExecutionMode;
}

export function ToolCard({
  href,
  name,
  summary,
  categoryLabel,
  featured = false,
  lifecycle = 'live',
  executionMode = 'local-only',
}: ToolCardProps) {
  return (
    <article className={`tool-card${featured ? ' tool-card--featured' : ''}`}>
      <Link className="tool-card__link" href={href} aria-label={name}>
        <div className="tool-card__topline">
          <span className="tag">{categoryLabel}</span>
          <span className="local-badge">
            {lifecycle === 'beta'
              ? 'Beta'
              : executionMode === 'local-only'
                ? 'Local-first'
                : 'Data flow disclosed'}
          </span>
        </div>
        <h3>{name}</h3>
        <p>{summary}</p>
        <span className="text-link">
          Open tool <span aria-hidden="true">→</span>
        </span>
      </Link>
    </article>
  );
}
