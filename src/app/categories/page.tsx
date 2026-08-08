import Link from 'next/link';

import { Container } from '@/components/ui/container';
import { categoryRegistry, getToolsByCategory } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Business toolkit categories for India',
  description:
    'Browse KarobarKit across Business, GST & Tax, Startup, Finance, E-commerce, HR & Salary, Generators and AI Tools.',
  path: '/categories',
});

export default function CategoriesPage() {
  return (
    <>
      <section className="info-hero">
        <Container narrow>
          <p className="eyebrow">Categories</p>
          <h1>Browse tools by business task</h1>
          <p className="lede">
            Eight clear areas form the product architecture. Live counts are explicit, and roadmap categories
            do not publish placeholder tool pages.
          </p>
        </Container>
      </section>
      <Container>
        <div className="section category-grid">
          {categoryRegistry.map((category) => {
            const count = getToolsByCategory(category.slug).length;
            return (
              <article className="content-card" key={category.id}>
                <h2>
                  <Link href={`/categories/${category.slug}`}>{category.name}</Link>
                </h2>
                <p>{category.description}</p>
                <Link className="text-link" href={`/categories/${category.slug}`}>
                  {count > 0
                    ? `${count} live tool${count === 1 ? '' : 's'}`
                    : `Roadmap · Phase ${category.roadmapPhase}`}{' '}
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            );
          })}
        </div>
      </Container>
    </>
  );
}
