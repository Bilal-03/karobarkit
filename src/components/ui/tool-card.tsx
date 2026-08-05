import Link from 'next/link';

interface ToolCardProps {
  href: string;
  name: string;
  summary: string;
  categoryLabel: string;
  featured?: boolean;
}

export function ToolCard({ href, name, summary, categoryLabel, featured = false }: ToolCardProps) {
  return (
    <article className={`tool-card${featured ? ' tool-card--featured' : ''}`}>
      <div className="tool-card__topline">
        <span className="tag">{categoryLabel}</span>
        <span className="local-badge">Local-first</span>
      </div>
      <h3>
        <Link href={href}>{name}</Link>
      </h3>
      <p>{summary}</p>
      <Link className="text-link" href={href}>
        Open tool <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
