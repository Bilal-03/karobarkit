import { categoryRegistry, toolRegistry } from '@/domain/registry';

export type Tool = (typeof toolRegistry)[number];

export function normalizeSearchQuery(value: string) {
  return value
    .slice(0, 80)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function exact(values: readonly string[], query: string) {
  return values.some((value) => normalizeSearchQuery(value) === query);
}

function includes(values: readonly string[], query: string) {
  return values.some((value) => normalizeSearchQuery(value).includes(query));
}

export function scoreTool(tool: Tool, rawQuery: string) {
  const query = normalizeSearchQuery(rawQuery);
  if (!query) return 0;

  const names = [tool.name, tool.shortName ?? ''];
  if (exact(names, query)) return 100;
  if (exact(tool.searchTerms, query)) return 90;
  if (names.some((name) => normalizeSearchQuery(name).startsWith(query))) return 80;
  if (exact(tool.tags, query)) return 70;
  if (normalizeSearchQuery(tool.categoryLabel) === query) return 60;
  if (includes([...names, ...tool.searchTerms, ...tool.tags], query)) return 50;
  if (normalizeSearchQuery(tool.categoryLabel).includes(query)) return 40;
  if (normalizeSearchQuery(tool.summary).includes(query)) return 20;
  return 0;
}

export function searchTools(rawQuery: string) {
  const query = normalizeSearchQuery(rawQuery);
  if (!query) return [...toolRegistry];

  return toolRegistry
    .map((tool) => ({ tool, score: scoreTool(tool, query) }))
    .filter((result) => result.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.tool.launchPriority ?? Number.MAX_SAFE_INTEGER) -
          (b.tool.launchPriority ?? Number.MAX_SAFE_INTEGER) ||
        a.tool.name.localeCompare(b.tool.name),
    )
    .map(({ tool }) => tool);
}

export function filterTools(categorySlug?: string) {
  if (!categorySlug || categorySlug === 'all') return [...toolRegistry];
  return toolRegistry.filter((tool) => tool.category === categorySlug);
}

export function getFeaturedTools() {
  return toolRegistry
    .filter((tool) => tool.featured)
    .sort(
      (a, b) => (a.launchPriority ?? Number.MAX_SAFE_INTEGER) - (b.launchPriority ?? Number.MAX_SAFE_INTEGER),
    );
}

export function validateDiscoveryRegistry() {
  const toolIds = new Set(toolRegistry.map((tool) => tool.id));
  const categoryIds = new Set<string>(categoryRegistry.map((category) => category.id));
  const errors: string[] = [];

  for (const tool of toolRegistry) {
    if (!categoryIds.has(tool.category)) errors.push(`${tool.id}: missing category ${tool.category}`);
    if (new Set(tool.relatedToolIds).size !== tool.relatedToolIds.length)
      errors.push(`${tool.id}: duplicate related tool`);
    for (const relatedId of tool.relatedToolIds) {
      if (relatedId === tool.id) errors.push(`${tool.id}: self-related tool`);
      if (!toolIds.has(relatedId)) errors.push(`${tool.id}: missing related tool ${relatedId}`);
    }
  }
  return errors;
}
