import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Container } from '@/components/ui/container';
import { ToolCard } from '@/components/ui/tool-card';
import { categoryRegistry, getToolsByCategory } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';

interface CategoryRouteProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return categoryRegistry.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryRegistry.find((candidate) => candidate.slug === slug);
  if (!category) return { title: 'Category not found' };
  const hasLiveTools = getToolsByCategory(category.slug).length > 0;
  return {
    ...pageMetadata({
      title: `${category.name} tools`,
      description: category.description,
      path: `/categories/${category.slug}`,
    }),
    ...(!hasLiveTools ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoryPage({ params }: CategoryRouteProps) {
  const { slug } = await params;
  const category = categoryRegistry.find((candidate) => candidate.slug === slug);
  if (!category) notFound();
  const tools = getToolsByCategory(category.slug);

  return (
    <>
      <div className="page-topline">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Categories', href: '/categories' },
              { label: category.name },
            ]}
          />
        </Container>
      </div>
      <section className="info-hero">
        <Container narrow>
          <p className="eyebrow">Category</p>
          <h1>{category.name}</h1>
          <p className="lede">{category.description}</p>
        </Container>
      </section>
      <Container>
        <div className="section">
          {tools.length > 0 ? (
            <>
              <p className="result-count">
                {tools.length} published tool{tools.length === 1 ? '' : 's'} in this category
              </p>
              <div className="tool-grid">
                {tools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    name={tool.name}
                    summary={tool.summary}
                    categoryLabel={tool.categoryLabel}
                    lifecycle={tool.lifecycle}
                    executionMode={tool.executionMode}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="state-block state-block--empty">
              <strong>This category is on the roadmap</strong>
              <p>
                We have not published a live {category.name} tool yet. Tools remain internal until their
                method, data flow, sources, review status and tests meet the release contract.
              </p>
              <div className="inline-actions">
                <Link className="button button--secondary" href="/tools">
                  Browse published tools
                </Link>
                <Link className="button button--ghost" href="/methodology">
                  Read the release method
                </Link>
              </div>
            </div>
          )}
          <p className="section-link-row">
            <Link href="/methodology">How calculations and sources are reviewed</Link> ·{' '}
            <Link href="/sources">Browse source references</Link>
          </p>
        </div>
      </Container>
    </>
  );
}
