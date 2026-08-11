import { categoryRegistry } from '@/domain/registry/categories';
import type { ToolDiscoveryRecord } from '@/domain/registry/types';

export type Tool = ToolDiscoveryRecord;

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

function allTokensMatch(values: readonly string[], tokens: readonly string[]) {
  return tokens.every((token) => values.some((value) => normalizeSearchQuery(value).includes(token)));
}

function scoreMultiTokenIntent(
  tool: Tool,
  tokens: readonly string[],
  names: readonly string[],
  categoryValues: readonly string[],
) {
  if (tokens.length < 2) return 0;

  // Keep multi-token intent below the existing exact/starts-with tiers. This
  // lets exact names and exact synonyms remain the strongest matches while
  // still handling natural phrases assembled from several metadata fields.
  const fields = [
    { values: names, score: 78 },
    { values: tool.searchTerms, score: 68 },
    { values: tool.tags, score: 58 },
    { values: categoryValues, score: 38 },
    { values: [tool.summary], score: 20 },
  ] as const;

  for (const field of fields) {
    if (allTokensMatch(field.values, tokens)) return field.score;
  }

  const allSearchValues = fields.flatMap((field) => field.values);
  return allTokensMatch(allSearchValues, tokens) ? 34 : 0;
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
  const multiTokenScore = scoreMultiTokenIntent(tool, query.split(' '), names, categoryValues);
  if (multiTokenScore > 0) return multiTokenScore;
  if (includes([...names, ...tool.searchTerms, ...tool.tags], query)) return 50;
  if (includes(categoryValues, query)) return 40;
  if (normalizeSearchQuery(tool.summary).includes(query)) return 20;
  return 0;
}

export function searchTools(tools: readonly Tool[], rawQuery: string) {
  const query = normalizeSearchQuery(rawQuery);
  if (!query) return [...tools];

  return tools
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

export function filterTools(tools: readonly Tool[], categorySlug?: string) {
  if (!categorySlug || categorySlug === 'all') return [...tools];
  return tools.filter(
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

export function getFeaturedTools(tools: readonly Tool[]) {
  return tools
    .filter((tool) => tool.featured)
    .sort(
      (a, b) => (a.launchPriority ?? Number.MAX_SAFE_INTEGER) - (b.launchPriority ?? Number.MAX_SAFE_INTEGER),
    );
}

/**
 * Validate the serializable records used by discovery and the client directory.
 * Runtime calculation/source/policy validation remains owned by the full registry.
 */
export function validateDiscoveryRegistry(tools: readonly Tool[]) {
  const categoryIds = new Set<string>(categoryRegistry.map((category) => category.id));
  const toolIds = new Set<string>();
  const slugs = new Set<string>();
  const errors: string[] = [];

  for (const tool of tools) {
    if (toolIds.has(tool.id)) errors.push(`${tool.id}: duplicate discovery tool id`);
    toolIds.add(tool.id);
    if (slugs.has(tool.slug)) errors.push(`${tool.id}: duplicate discovery slug ${tool.slug}`);
    slugs.add(tool.slug);
    if (!categoryIds.has(tool.category)) errors.push(`${tool.id}: missing category ${tool.category}`);
    for (const secondaryCategory of tool.secondaryCategories) {
      if (!categoryIds.has(secondaryCategory)) {
        errors.push(`${tool.id}: missing secondary category ${secondaryCategory}`);
      }
      if (secondaryCategory === tool.category) {
        errors.push(`${tool.id}: primary category repeated as secondary category`);
      }
    }
    if (tool.lifecycle !== 'live' && tool.lifecycle !== 'beta') {
      errors.push(`${tool.id}: non-public lifecycle leaked into discovery index`);
    }
    if (tool.uiAdapter === 'unavailable')
      errors.push(`${tool.id}: unavailable tool leaked into discovery index`);
    if (!tool.lastVerified) errors.push(`${tool.id}: missing last-verified date`);
  }
  return errors;
}
