import { Container } from '@/components/ui/container';
import { ToolCard } from '@/components/ui/tool-card';
import { toolRegistry } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'All business tools',
  description: 'Browse KarobarKit calculators and practical business tools for Indian small businesses.',
  path: '/tools',
});

export default function ToolsPage() {
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
          <form className="search-form" action="/search" method="get">
            <label className="sr-only" htmlFor="directory-search">
              Search tools
            </label>
            <input
              className="input"
              id="directory-search"
              name="q"
              type="search"
              placeholder="Search by tool or job…"
            />
            <button className="button button--secondary" type="submit">
              Search
            </button>
          </form>
        </div>
        <div className="section">
          <div className="tool-grid">
            {toolRegistry.map((tool) => (
              <ToolCard
                key={tool.id}
                href={`/tools/${tool.slug}`}
                name={tool.name}
                summary={tool.summary}
                categoryLabel={tool.categoryLabel}
              />
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
