export interface ToolPageRouteContract {
  slug: string;
  h1: string;
  title: string;
  canonicalPath: string;
}

interface ToolPageContractSource {
  slug: string;
  name: string;
  seo: { title: string };
}

export function getToolPageRouteContract(tool: ToolPageContractSource): ToolPageRouteContract {
  return {
    slug: tool.slug,
    h1: tool.name,
    title: tool.seo.title,
    canonicalPath: `/tools/${tool.slug}`,
  };
}
