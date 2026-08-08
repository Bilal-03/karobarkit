import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ToolPage } from '@/components/tooling/tool-page';
import { getToolBySlug, toolRegistry } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';
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
    ...pageMetadata({
      title: contract.title,
      description: tool.seo.description,
      path: contract.canonicalPath,
    }),
    keywords: tool.seo.keywords,
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
