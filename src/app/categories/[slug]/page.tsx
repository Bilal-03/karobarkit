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
  return pageMetadata({
    title: `${category.name} tools`,
    description: category.description,
    path: `/categories/${category.slug}`,
  });
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
          <p className="result-count">
            {tools.length} tool{tools.length === 1 ? '' : 's'} in this category
          </p>
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
          <p className="section-link-row">
            <Link href="/methodology">How calculations and sources are reviewed</Link> ·{' '}
            <Link href="/sources">Browse source references</Link>
          </p>
        </div>
      </Container>
    </>
  );
}
