import Link from 'next/link';
import { categoryRegistry } from '@/domain/registry/categories';
import { ToolIcon } from './tool-icon';

import type { ToolExecutionMode, ToolLifecycle } from '@/domain/registry/types';

interface ToolCardProps {
  href: string;
  name: string;
  summary: string;
  categoryLabel: string;
  presentation?: { description?: string; iconKey?: string };
  featured?: boolean;
  lifecycle?: ToolLifecycle;
  executionMode?: ToolExecutionMode;
}

export function ToolCard({
  href,
  name,
  summary,
  categoryLabel,
  presentation,
  featured = false,
  lifecycle = 'live',
  executionMode = 'local-only',
}: ToolCardProps) {
  return (
    <article className={`tool-card${featured ? ' tool-card--featured' : ''}`}>
      <Link className="tool-card__link" href={href} aria-label={name}>
        <div className="tool-card__topline">
          <ToolIcon
            category={
              presentation?.iconKey ??
              categoryRegistry.find((category) => category.name === categoryLabel)?.id ??
              'business'
            }
          />
          {lifecycle === 'beta' ? <span className="local-badge">Beta</span> : null}
          {executionMode === 'network-required' ? <span className="local-badge">Online</span> : null}
        </div>
        <h3>{name}</h3>
        <p>{presentation?.description ?? summary.split('. ')[0].replace(/\.$/, '')}.</p>
      </Link>
    </article>
  );
}
