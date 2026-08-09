import { allToolDefinitions, categoryRegistry, toolRegistry } from '@/domain/registry';

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

function categorySearchValues(tool: Tool) {
  return categoryRegistry
    .filter((category) => category.id === tool.category || tool.secondaryCategories.includes(category.id))
    .flatMap((category) => [category.name, category.shortDescription, ...category.searchTerms]);
}

export function scoreTool(tool: Tool, rawQuery: string) {
  const query = normalizeSearchQuery(rawQuery);
  if (!query) return 0;

  const names = [tool.name, tool.shortName ?? ''];
  if (exact(names, query)) return 100;
  if (exact(tool.searchTerms, query)) return 90;
  if (names.some((name) => normalizeSearchQuery(name).startsWith(query))) return 80;
  if (exact(tool.tags, query)) return 70;
  const categoryValues = categorySearchValues(tool);
  if (exact(categoryValues, query)) return 60;
  if (includes([...names, ...tool.searchTerms, ...tool.tags], query)) return 50;
  if (includes(categoryValues, query)) return 40;
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
  return toolRegistry.filter(
    (tool) => tool.category === categorySlug || tool.secondaryCategories.includes(categorySlug),
  );
}

export interface ToolDirectoryFilters {
  category?: string;
  kind?: string;
  execution?: string;
  regulated?: string;
}

export function filterToolDirectory(tools: readonly Tool[], filters: ToolDirectoryFilters) {
  return tools.filter((tool) => {
    if (
      filters.category &&
      filters.category !== 'all' &&
      tool.category !== filters.category &&
      !tool.secondaryCategories.includes(filters.category)
    ) {
      return false;
    }
    if (filters.kind && filters.kind !== 'all' && tool.kind !== filters.kind) return false;
    if (filters.execution === 'local' && !tool.executionMode.startsWith('local')) return false;
    if (
      filters.execution === 'network' &&
      tool.executionMode !== 'network-required' &&
      tool.executionMode !== 'optional-cloud-sync'
    ) {
      return false;
    }
    if (filters.regulated === 'regulated' && !tool.regulatory) return false;
    if (filters.regulated === 'general' && tool.regulatory) return false;
    return true;
  });
}

export function getFeaturedTools() {
  return toolRegistry
    .filter((tool) => tool.featured)
    .sort(
      (a, b) => (a.launchPriority ?? Number.MAX_SAFE_INTEGER) - (b.launchPriority ?? Number.MAX_SAFE_INTEGER),
    );
}

export function validateDiscoveryRegistry() {
  const toolIds = new Set(allToolDefinitions.map((tool) => tool.id));
  const categoryIds = new Set<string>(categoryRegistry.map((category) => category.id));
  const errors: string[] = [];

  for (const tool of allToolDefinitions) {
    if (!categoryIds.has(tool.category)) errors.push(`${tool.id}: missing category ${tool.category}`);
    for (const secondaryCategory of tool.secondaryCategories) {
      if (!categoryIds.has(secondaryCategory)) {
        errors.push(`${tool.id}: missing secondary category ${secondaryCategory}`);
      }
      if (secondaryCategory === tool.category) {
        errors.push(`${tool.id}: primary category repeated as secondary category`);
      }
    }
    if (tool.lifecycle !== 'live' && tool.lifecycle !== 'beta' && tool.lifecycle !== 'internal') {
      errors.push(`${tool.id}: non-public lifecycle leaked into public registry`);
    }
    if (tool.ui.adapter === 'unavailable') {
      errors.push(`${tool.id}: public tool is missing a released UI adapter`);
    }
    if (!tool.trust.lastVerified) errors.push(`${tool.id}: missing last-verified date`);
    if (!tool.governance.owner) errors.push(`${tool.id}: missing owner`);
    if (
      tool.governance.riskTier === 'D' &&
      tool.sources.every((source) => source.evidenceLevel !== 'official')
    ) {
      errors.push(`${tool.id}: Tier D tool requires an official source`);
    }
    if (
      (tool.featureFlag === 'phase4-tax-review' ||
        tool.featureFlag === 'phase5-startup-marketplace' ||
        tool.featureFlag === 'phase5-marketplace') &&
      (tool.governance.goldenFixtureIds?.length ?? 0) === 0
    ) {
      errors.push(`${tool.id}: controlled-beta tool requires golden fixture IDs before release`);
    }
    if (new Set(tool.relatedToolIds).size !== tool.relatedToolIds.length)
      errors.push(`${tool.id}: duplicate related tool`);
    for (const relatedId of tool.relatedToolIds) {
      if (relatedId === tool.id) errors.push(`${tool.id}: self-related tool`);
      if (!toolIds.has(relatedId)) errors.push(`${tool.id}: missing related tool ${relatedId}`);
    }
  }
  return errors;
}
