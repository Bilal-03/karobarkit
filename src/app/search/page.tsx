import Link from 'next/link';

import { Container } from '@/components/ui/container';
import { ToolCard } from '@/components/ui/tool-card';
import { toolRegistry } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Search business tools',
  description: 'Search KarobarKit by tool name, calculation or business task.',
  path: '/search',
});

interface SearchPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = searchParams ? await searchParams : {};
  const query = typeof params.q === 'string' ? params.q.trim() : '';
  const normalized = query.toLowerCase();
  const results = normalized
    ? toolRegistry.filter((tool) =>
        [tool.name, tool.summary, tool.categoryLabel, ...(tool.seo.keywords ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(normalized),
      )
    : toolRegistry;

  return (
    <>
      <section className="info-hero">
        <Container narrow>
          <p className="eyebrow">Search</p>
          <h1>Find the right tool for the job</h1>
          <p className="lede">Search by a tool name, a business task or a phrase like “returns over time”.</p>
          <form className="search-form" action="/search" method="get">
            <label className="sr-only" htmlFor="search-page-input">
              Search tools
            </label>
            <input
              className="input"
              id="search-page-input"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Try “return”, “growth” or “profit”…"
            />
            <button className="button button--primary" type="submit">
              Search
            </button>
          </form>
        </Container>
      </section>
      <Container>
        <div className="section">
          <p className="result-count">
            {query
              ? `${results.length} result${results.length === 1 ? '' : 's'} for “${query}”`
              : `${results.length} tools`}
          </p>
          {results.length > 0 ? (
            <div className="tool-grid">
              {results.map((tool) => (
                <ToolCard
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  name={tool.name}
                  summary={tool.summary}
                  categoryLabel={tool.categoryLabel}
                />
              ))}
            </div>
          ) : (
            <div className="state-block state-block--empty">
              <strong>No matching tools yet</strong>
              <p>Try a shorter phrase, or browse the financial calculations category.</p>
              <Link className="button button--secondary" href="/categories/financial-calculators">
                Browse category
              </Link>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
