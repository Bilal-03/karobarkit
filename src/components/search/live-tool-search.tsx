'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { filterToolDirectory, normalizeSearchQuery, searchTools, type Tool } from '@/domain/discovery';
import { categoryRegistry, toolRegistry } from '@/domain/registry';

import { ToolCard } from '@/components/ui/tool-card';

type LiveToolSearchVariant = 'home' | 'page' | 'directory' | 'not-found';

interface LiveToolSearchProps {
  id: string;
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
  query,
  variant,
}: {
  tools: readonly Tool[];
  query: string;
  variant: LiveToolSearchVariant;
}) {
  const normalized = normalizeSearchQuery(query);
  const countText =
    variant === 'page'
      ? query.trim()
        ? `${tools.length} result${tools.length === 1 ? '' : 's'} for “${query.trim()}”`
        : `${tools.length} tools`
      : resultLabel(tools.length);

  if (variant === 'home' || variant === 'not-found') {
    if (!normalized) return null;

    return (
      <div className="live-search-results live-search-results--preview">
        <p className="result-count" aria-live="polite">
          {countText}
        </p>
        {tools.length > 0 ? (
          <div className="tool-grid">
            {tools.map((tool) => (
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
        ) : (
          <p className="live-search-empty">No matching tools yet. Try invoice, receipt, QR or growth rate.</p>
        )}
      </div>
    );
  }

  return (
    <div className="section live-search-results">
      <p className="result-count" aria-live="polite">
        {countText}
      </p>
      {tools.length > 0 ? (
        <div className="tool-grid">
          {tools.map((tool) => (
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

  const tools = useMemo(() => {
    const searched = normalizeSearchQuery(query) ? searchTools(query) : [...toolRegistry];
    if (variant !== 'directory') return searched;
    return filterToolDirectory(searched, { category, kind, execution, regulated });
  }, [category, execution, kind, query, regulated, variant]);

  useEffect(() => {
    if (variant === 'home' || variant === 'not-found') return;

    const url = new URL(window.location.href);
    const trimmedQuery = query.slice(0, 80).trim();
    if (trimmedQuery) url.searchParams.set('q', trimmedQuery);
    else url.searchParams.delete('q');

    if (variant === 'directory') {
      if (category !== 'all') url.searchParams.set('category', category);
      else url.searchParams.delete('category');
      if (kind !== 'all') url.searchParams.set('type', kind);
      else url.searchParams.delete('type');
      if (execution !== 'all') url.searchParams.set('execution', execution);
      else url.searchParams.delete('execution');
      if (regulated !== 'all') url.searchParams.set('regulated', regulated);
      else url.searchParams.delete('regulated');
    }

    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [category, execution, kind, query, regulated, variant]);

  if (variant === 'directory') {
    return (
      <>
        <form className="directory-filters" action="/tools" method="get">
          <div>
            <label htmlFor={id}>Search tools</label>
            <input
              className="input"
              id={id}
              name="q"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value.slice(0, 80))}
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
              onChange={(event) => setCategory(event.target.value)}
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
              onChange={(event) => setKind(event.target.value)}
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
              onChange={(event) => setExecution(event.target.value)}
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
              onChange={(event) => setRegulated(event.target.value)}
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
        <ToolResults tools={tools} query={query} variant={variant} />
      </>
    );
  }

  const isHome = variant === 'home';
  const isNotFound = variant === 'not-found';

  return (
    <>
      <form className="search-form" action="/search" method="get">
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
            onChange={(event) => setQuery(event.target.value.slice(0, 80))}
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
      <ToolResults tools={tools} query={query} variant={variant} />
    </>
  );
}

const toolKinds = ['calculator', 'generator', 'worksheet', 'comparison', 'data-backed', 'ai-assisted'];

function allowedSearchParam(value: string | null, allowed: readonly string[]) {
  return value && allowed.includes(value) ? value : 'all';
}

export function DirectoryToolSearch({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get('category');
  const initialCategory = categoryRegistry.some((item) => item.slug === requestedCategory)
    ? (requestedCategory ?? 'all')
    : 'all';

  return (
    <LiveToolSearch
      id={id}
      initialQuery={(searchParams.get('q') ?? '').slice(0, 80)}
      initialCategory={initialCategory}
      initialKind={allowedSearchParam(searchParams.get('type'), toolKinds)}
      initialExecution={allowedSearchParam(searchParams.get('execution'), ['local', 'network'])}
      initialRegulated={allowedSearchParam(searchParams.get('regulated'), ['regulated', 'general'])}
      variant="directory"
    />
  );
}
