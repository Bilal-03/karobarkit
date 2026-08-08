import Link from 'next/link';

import { Container } from '@/components/ui/container';
import { ToolCard } from '@/components/ui/tool-card';
import { filterTools, searchTools } from '@/domain/discovery';
import { categoryRegistry, toolRegistry } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'All business tools',
  description: 'Browse KarobarKit calculators and practical business tools for Indian small businesses.',
  path: '/tools',
});

interface ToolsPageProps {
  searchParams?: Promise<{ category?: string; q?: string }>;
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const params = searchParams ? await searchParams : {};
  const query = typeof params.q === 'string' ? params.q : '';
  const requestedCategory = typeof params.category === 'string' ? params.category : 'all';
  const category = categoryRegistry.some((item) => item.slug === requestedCategory)
    ? requestedCategory
    : 'all';
  const searched = query ? searchTools(query) : [...toolRegistry];
  const categoryIds = new Set(filterTools(category).map((tool) => tool.id));
  const tools = searched.filter((tool) => categoryIds.has(tool.id));
  return (
    <>
      <section className="info-hero">
        <Container>
          <p className="eyebrow">Tool directory</p>
          <div className="directory-heading">
            <div>
              <h1>Tools for the numbers behind your business</h1>
              <p className="lede">
                A small, growing collection of local-first utilities. Each tool has a clear purpose, a visible
                method and a date it was reviewed.
              </p>
            </div>
            <span className="result-count">{toolRegistry.length} tools available</span>
          </div>
        </Container>
      </section>
      <Container>
        <div className="search-section">
          <form className="directory-filters" action="/tools" method="get">
            <div>
              <label htmlFor="directory-search">Search tools</label>
              <input
                className="input"
                id="directory-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Try GST bill or growth rate…"
                maxLength={80}
              />
            </div>
            <div>
              <label htmlFor="directory-category">Category</label>
              <select className="select" id="directory-category" name="category" defaultValue={category}>
                <option value="all">All categories</option>
                {categoryRegistry.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="button button--secondary" type="submit">
              Apply filters
            </button>
          </form>
        </div>
        <div className="section">
          <p className="result-count" aria-live="polite">
            {tools.length} matching tool{tools.length === 1 ? '' : 's'}
          </p>
          {tools.length ? (
            <div className="tool-grid">
              {tools.map((tool) => (
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
              <strong>No tools match those filters</strong>
              <p>Try another term or remove the category filter.</p>
              <Link className="button button--secondary" href="/tools">
                Clear filters
              </Link>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
