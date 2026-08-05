import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ToolPage } from '@/components/tooling/tool-page';
import { getToolBySlug, toolRegistry } from '@/domain/registry';
import { absoluteUrl } from '@/lib/site';
import { getToolPageRouteContract } from '@/lib/route-contract';

interface ToolRouteProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return toolRegistry.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    return { title: 'Tool not found' };
  }
  const contract = getToolPageRouteContract(tool);

  return {
    title: contract.title,
    description: tool.seo.description,
    keywords: tool.seo.keywords,
    alternates: { canonical: absoluteUrl(contract.canonicalPath) },
    openGraph: {
      title: tool.seo.title,
      description: tool.seo.description,
      url: absoluteUrl(contract.canonicalPath),
      type: 'website',
    },
  };
}

export default async function ToolRoute({ params }: ToolRouteProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    notFound();
  }

  return <ToolPage tool={tool} />;
}
