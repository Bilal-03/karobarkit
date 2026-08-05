import type { SourceReference } from '@/domain/registry/types';
import { formatIndianDate } from '@/domain/formatting/indian';

export function SourceReferenceBlock({ sources }: { sources: SourceReference[] }) {
  return (
    <section className="source-block" aria-labelledby="source-title">
      <div className="source-block__heading">
        <p className="eyebrow">Method & sources</p>
        <h2 id="source-title">How this result is grounded</h2>
      </div>
      <p className="source-block__intro">
        The formula is deterministic and runs in your browser. Read the reference below for the method used by
        this tool.
      </p>
      <ul className="source-list">
        {sources.map((source) => (
          <li key={source.id} className="source-list__item">
            <div>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
              </a>
              <p>
                {source.publisher} · {source.evidenceLevel} reference · Checked{' '}
                {formatIndianDate(source.lastChecked)}
              </p>
            </div>
            {source.effectiveFrom ? <span>Effective {formatIndianDate(source.effectiveFrom)}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
