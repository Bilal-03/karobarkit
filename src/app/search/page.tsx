import Link from 'next/link';

import { Container } from '@/components/ui/container';
import { ToolCard } from '@/components/ui/tool-card';
import { normalizeSearchQuery, searchTools } from '@/domain/discovery';
import { categoryRegistry, toolRegistry } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';

export const metadata = {
  ...pageMetadata({
    title: 'Search business tools',
    description: 'Search KarobarKit by tool name, calculation or business task.',
    path: '/search',
  }),
  robots: { index: false, follow: true },
};

interface SearchPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = searchParams ? await searchParams : {};
  const query = typeof params.q === 'string' ? params.q.slice(0, 80).trim() : '';
  const normalized = normalizeSearchQuery(query);
  const results = normalized ? searchTools(normalized) : [...toolRegistry];

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
              maxLength={80}
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
              <p>Try a shorter phrase such as “invoice”, “receipt”, “QR” or “growth rate”.</p>
              <div className="inline-actions">
                <Link className="button button--secondary" href="/tools">
                  View all tools
                </Link>
                <Link className="button button--ghost" href="/categories">
                  Browse categories
                </Link>
              </div>
              <ul className="category-link-list" aria-label="Available categories">
                {categoryRegistry.map((category) => (
                  <li key={category.id}>
                    <Link href={`/categories/${category.slug}`}>{category.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
