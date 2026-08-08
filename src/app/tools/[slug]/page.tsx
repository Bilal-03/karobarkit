import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ToolPage } from '@/components/tooling/tool-page';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Container } from '@/components/ui/container';
import { allToolDefinitions, getToolDefinitionBySlug, isToolAvailable } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';
import { getToolPageRouteContract } from '@/lib/route-contract';

interface ToolRouteProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return allToolDefinitions
    .filter((tool) => tool.lifecycle !== 'internal' && tool.lifecycle !== 'retired')
    .map((tool) => ({ slug: tool.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: ToolRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolDefinitionBySlug(slug);
  if (!tool || tool.lifecycle === 'internal' || tool.lifecycle === 'retired') {
    return { title: 'Tool not found' };
  }
  const contract = getToolPageRouteContract(tool);

  return {
    ...pageMetadata({
      title: contract.title,
      description: tool.seo.description,
      path: contract.canonicalPath,
    }),
    keywords: tool.seo.keywords,
    ...(!isToolAvailable(tool) ? { robots: { index: false, follow: true } } : {}),
  };
}

function UnavailableTool({ tool }: { tool: (typeof allToolDefinitions)[number] }) {
  const stale = tool.lifecycle === 'stale-disabled';
  return (
    <>
      <div className="page-topline">
        <Container>
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Tools', href: '/tools' }, { label: tool.name }]}
          />
        </Container>
      </div>
      <section className="info-hero">
        <Container narrow>
          <p className="eyebrow">Temporarily unavailable</p>
          <h1>{tool.name}</h1>
          <p className="lede">
            {stale
              ? 'This tool has been disabled because its policy or source review is out of date. It will return only after verification and regression testing.'
              : 'This tool is not enabled for public use. It will appear in the directory only after its release checks pass.'}
          </p>
          <div className="inline-actions">
            <Link className="button button--secondary" href="/tools">
              Browse available tools
            </Link>
            <Link className="button button--ghost" href={`/report-an-error?tool=${tool.slug}`}>
              Report a problem
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}

export default async function ToolRoute({ params }: ToolRouteProps) {
  const { slug } = await params;
  const tool = getToolDefinitionBySlug(slug);
  if (!tool || tool.lifecycle === 'internal' || tool.lifecycle === 'retired') {
    notFound();
  }

  if (!isToolAvailable(tool)) return <UnavailableTool tool={tool} />;

  return <ToolPage tool={tool} />;
}
