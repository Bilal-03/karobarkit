'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { filterToolDirectory, normalizeSearchQuery, searchTools, type Tool } from '@/domain/discovery';
import { categoryRegistry } from '@/domain/registry/categories';

import { ToolCard } from '@/components/ui/tool-card';

type LiveToolSearchVariant = 'home' | 'page' | 'directory' | 'not-found';

export const INITIAL_VISIBLE_TOOLS = 24;
export const VISIBLE_TOOL_INCREMENT = 24;

const toolKinds = ['calculator', 'generator', 'worksheet', 'comparison', 'data-backed', 'ai-assisted'];
const executionModes = ['local', 'network'];
const regulatoryScopes = ['regulated', 'general'];

interface SearchParamReader {
  get(name: string): string | null;
}

export interface DirectorySearchState {
  query: string;
  category: string;
  kind: string;
  execution: string;
  regulated: string;
}

function allowedSearchParam(value: string | null, allowed: readonly string[]) {
  return value && allowed.includes(value) ? value : 'all';
}

export function parseDirectorySearchParams(searchParams: SearchParamReader): DirectorySearchState {
  const requestedCategory = searchParams.get('category');

  return {
    query: (searchParams.get('q') ?? '').slice(0, 80),
    category: categoryRegistry.some((item) => item.slug === requestedCategory)
      ? (requestedCategory ?? 'all')
      : 'all',
    kind: allowedSearchParam(searchParams.get('type'), toolKinds),
    execution: allowedSearchParam(searchParams.get('execution'), executionModes),
    regulated: allowedSearchParam(searchParams.get('regulated'), regulatoryScopes),
  };
}

function formatSearchStateUrl(state: DirectorySearchState, includeDirectoryFilters: boolean) {
  const url = new URL(window.location.href);
  const trimmedQuery = state.query.slice(0, 80).trim();

  if (trimmedQuery) url.searchParams.set('q', trimmedQuery);
  else url.searchParams.delete('q');

  if (includeDirectoryFilters) {
    if (state.category !== 'all') url.searchParams.set('category', state.category);
    else url.searchParams.delete('category');
    if (state.kind !== 'all') url.searchParams.set('type', state.kind);
    else url.searchParams.delete('type');
    if (state.execution !== 'all') url.searchParams.set('execution', state.execution);
    else url.searchParams.delete('execution');
    if (state.regulated !== 'all') url.searchParams.set('regulated', state.regulated);
    else url.searchParams.delete('regulated');
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function updateSearchUrl(
  state: DirectorySearchState,
  includeDirectoryFilters: boolean,
  mode: 'push' | 'replace',
) {
  const nextUrl = formatSearchStateUrl(state, includeDirectoryFilters);
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl === currentUrl) return;

  window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', nextUrl);
}

interface LiveToolSearchProps {
  id: string;
  tools: readonly Tool[];
  initialQuery?: string;
  initialCategory?: string;
  initialKind?: string;
  initialExecution?: string;
  initialRegulated?: string;
  variant: LiveToolSearchVariant;
}

function resultLabel(count: number, suffix = 'matching tool') {
  return `${count} ${suffix}${count === 1 ? '' : 's'}`;
}

function ToolResults({
  tools,
  visibleTools,
  query,
  variant,
  resultsId,
  onShowMore,
}: {
  tools: readonly Tool[];
  visibleTools: readonly Tool[];
  query: string;
  variant: LiveToolSearchVariant;
  resultsId: string;
  onShowMore: () => void;
}) {
  const normalized = normalizeSearchQuery(query);
  const countText =
    variant === 'page'
      ? query.trim()
        ? `Showing ${visibleTools.length} of ${tools.length} result${tools.length === 1 ? '' : 's'} for “${query.trim()}”`
        : `Showing ${visibleTools.length} of ${tools.length} tools`
      : `Showing ${visibleTools.length} of ${resultLabel(tools.length)}`;

  const showMore = visibleTools.length < tools.length;
  const renderCards = () => (
    <>
      <div className="tool-grid">
        {visibleTools.map((tool) => (
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
      {showMore ? (
        <div className="inline-actions">
          <button
            className="button button--secondary"
            type="button"
            aria-controls={resultsId}
            onClick={onShowMore}
          >
            Show more tools
          </button>
        </div>
      ) : null}
    </>
  );

  if (variant === 'home' || variant === 'not-found') {
    if (!normalized) return null;

    return (
      <div className="live-search-results live-search-results--preview" id={resultsId}>
        <p className="result-count" aria-live="polite" aria-atomic="true">
          {countText}
        </p>
        {tools.length > 0 ? (
          renderCards()
        ) : (
          <p className="live-search-empty">No matching tools yet. Try invoice, receipt, QR or growth rate.</p>
        )}
      </div>
    );
  }

  return (
    <div className="section live-search-results" id={resultsId}>
      <p className="result-count" aria-live="polite" aria-atomic="true">
        {countText}
      </p>
      {tools.length > 0 ? (
        renderCards()
      ) : (
        <div className="state-block state-block--empty">
          <strong>
            {variant === 'directory' ? 'No tools match those filters' : 'No matching tools yet'}
          </strong>
          <p>Try a shorter phrase such as “invoice”, “receipt”, “QR” or “growth rate”.</p>
          <div className="inline-actions">
            <Link className="button button--secondary" href="/tools">
              View all tools
            </Link>
            <Link className="button button--ghost" href="/categories">
              Browse categories
            </Link>
          </div>
          {variant === 'page' ? (
            <ul className="category-link-list" aria-label="Available categories">
              {categoryRegistry.map((category) => (
                <li key={category.id}>
                  <Link href={`/categories/${category.slug}`}>{category.name}</Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function LiveToolSearch({
  id,
  tools: availableTools,
  initialQuery = '',
  initialCategory = 'all',
  initialKind = 'all',
  initialExecution = 'all',
  initialRegulated = 'all',
  variant,
}: LiveToolSearchProps) {
  const [query, setQuery] = useState(initialQuery.slice(0, 80));
  const [category, setCategory] = useState(initialCategory);
  const [kind, setKind] = useState(initialKind);
  const [execution, setExecution] = useState(initialExecution);
  const [regulated, setRegulated] = useState(initialRegulated);
  const [visibleToolCount, setVisibleToolCount] = useState(INITIAL_VISIBLE_TOOLS);
  const historyModeRef = useRef<'push' | 'replace'>('replace');

  const tools = useMemo(() => {
    const searched = normalizeSearchQuery(query) ? searchTools(availableTools, query) : [...availableTools];
    if (variant !== 'directory') return searched;
    return filterToolDirectory(searched, { category, kind, execution, regulated });
  }, [availableTools, category, execution, kind, query, regulated, variant]);

  useEffect(() => {
    if (variant !== 'directory' && variant !== 'page') return;

    const syncFromUrl = () => {
      const nextState = parseDirectorySearchParams(new URLSearchParams(window.location.search));
      setQuery(nextState.query);
      setVisibleToolCount(INITIAL_VISIBLE_TOOLS);
      if (variant === 'directory') {
        setCategory(nextState.category);
        setKind(nextState.kind);
        setExecution(nextState.execution);
        setRegulated(nextState.regulated);
      }
    };

    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [variant]);

  useEffect(() => {
    if (variant === 'home' || variant === 'not-found') return;

    updateSearchUrl(
      { query, category, kind, execution, regulated },
      variant === 'directory',
      historyModeRef.current,
    );
    historyModeRef.current = 'replace';
  }, [category, execution, kind, query, regulated, variant]);

  const handleQueryChange = (value: string) => {
    historyModeRef.current = 'replace';
    setVisibleToolCount(INITIAL_VISIBLE_TOOLS);
    setQuery(value.slice(0, 80));
  };

  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    historyModeRef.current = 'push';
    setVisibleToolCount(INITIAL_VISIBLE_TOOLS);
    setter(value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (variant === 'home' || variant === 'not-found') return;

    event.preventDefault();
    historyModeRef.current = 'push';
    updateSearchUrl({ query, category, kind, execution, regulated }, variant === 'directory', 'push');
  };

  const visibleTools = tools.slice(0, visibleToolCount);
  const showMoreTools = () =>
    setVisibleToolCount((current) => Math.min(current + VISIBLE_TOOL_INCREMENT, tools.length));
  const resultsId = `${id}-results`;

  if (variant === 'directory') {
    return (
      <>
        <form className="directory-filters" action="/tools" method="get" onSubmit={handleSubmit}>
          <div>
            <label htmlFor={id}>Search tools</label>
            <input
              className="input"
              id={id}
              name="q"
              type="search"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Try GST bill or growth rate…"
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="directory-category">Category</label>
            <select
              className="select"
              id="directory-category"
              name="category"
              value={category}
              onChange={(event) => handleFilterChange(setCategory, event.target.value)}
            >
              <option value="all">All categories</option>
              {categoryRegistry.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="directory-type">Tool type</label>
            <select
              className="select"
              id="directory-type"
              name="type"
              value={kind}
              onChange={(event) => handleFilterChange(setKind, event.target.value)}
            >
              <option value="all">All types</option>
              <option value="calculator">Calculators</option>
              <option value="generator">Generators</option>
              <option value="worksheet">Worksheets</option>
              <option value="comparison">Comparisons</option>
              <option value="data-backed">Data-backed</option>
              <option value="ai-assisted">AI-assisted</option>
            </select>
          </div>
          <div>
            <label htmlFor="directory-execution">Data use</label>
            <select
              className="select"
              id="directory-execution"
              name="execution"
              value={execution}
              onChange={(event) => handleFilterChange(setExecution, event.target.value)}
            >
              <option value="all">All data modes</option>
              <option value="local">Runs locally</option>
              <option value="network">Network or cloud</option>
            </select>
          </div>
          <div>
            <label htmlFor="directory-regulated">Scope</label>
            <select
              className="select"
              id="directory-regulated"
              name="regulated"
              value={regulated}
              onChange={(event) => handleFilterChange(setRegulated, event.target.value)}
            >
              <option value="all">All scopes</option>
              <option value="regulated">Tax or regulated</option>
              <option value="general">General business</option>
            </select>
          </div>
          <button className="button button--secondary" type="submit">
            Apply filters
          </button>
        </form>
        <ToolResults
          tools={tools}
          visibleTools={visibleTools}
          query={query}
          variant={variant}
          resultsId={resultsId}
          onShowMore={showMoreTools}
        />
      </>
    );
  }

  const isHome = variant === 'home';
  const isNotFound = variant === 'not-found';

  return (
    <>
      <form className="search-form" action="/search" method="get" onSubmit={handleSubmit}>
        <label className={isHome || isNotFound ? undefined : 'sr-only'} htmlFor={id}>
          {isHome ? 'What do you need to do?' : 'Search tools'}
        </label>
        <div className="search-form__row">
          <input
            className="input"
            id={id}
            name="q"
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            maxLength={80}
            placeholder={
              isHome
                ? 'Try GST bill, payment QR or growth rate…'
                : isNotFound
                  ? 'Try GST, invoice or QR…'
                  : 'Try “return”, “growth” or “profit”…'
            }
          />
          <button
            className={`button ${isHome ? 'button--primary' : isNotFound ? 'button--secondary' : 'button--primary'}`}
            type="submit"
          >
            {isHome ? 'Search tools' : 'Search'}
          </button>
        </div>
      </form>
      <ToolResults
        tools={tools}
        visibleTools={visibleTools}
        query={query}
        variant={variant}
        resultsId={resultsId}
        onShowMore={showMoreTools}
      />
    </>
  );
}

export function DirectoryToolSearch({ id, tools }: { id: string; tools: readonly Tool[] }) {
  const searchParams = useSearchParams();
  const initialState = parseDirectorySearchParams(searchParams);

  return (
    <LiveToolSearch
      id={id}
      tools={tools}
      initialQuery={initialState.query}
      initialCategory={initialState.category}
      initialKind={initialState.kind}
      initialExecution={initialState.execution}
      initialRegulated={initialState.regulated}
      variant="directory"
    />
  );
}
