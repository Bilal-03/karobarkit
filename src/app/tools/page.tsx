import { LiveToolSearch } from '@/components/search/live-tool-search';
import { Container } from '@/components/ui/container';
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
          <LiveToolSearch
            key={`${query}:${category}`}
            id="directory-search"
            initialQuery={query}
            initialCategory={category}
            variant="directory"
          />
        </div>
      </Container>
    </>
  );
}
