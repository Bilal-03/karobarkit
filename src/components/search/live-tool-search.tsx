'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { filterTools, normalizeSearchQuery, searchTools, type Tool } from '@/domain/discovery';
import { categoryRegistry, toolRegistry } from '@/domain/registry';

import { ToolCard } from '@/components/ui/tool-card';

type LiveToolSearchVariant = 'home' | 'page' | 'directory' | 'not-found';

interface LiveToolSearchProps {
  id: string;
  initialQuery?: string;
  initialCategory?: string;
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
  variant,
}: LiveToolSearchProps) {
  const [query, setQuery] = useState(initialQuery.slice(0, 80));
  const [category, setCategory] = useState(initialCategory);

  const tools = useMemo(() => {
    const searched = normalizeSearchQuery(query) ? searchTools(query) : [...toolRegistry];
    if (variant !== 'directory' || category === 'all') return searched;

    const categoryIds = new Set(filterTools(category).map((tool) => tool.id));
    return searched.filter((tool) => categoryIds.has(tool.id));
  }, [category, query, variant]);

  useEffect(() => {
    if (variant === 'home' || variant === 'not-found') return;

    const url = new URL(window.location.href);
    const trimmedQuery = query.slice(0, 80).trim();
    if (trimmedQuery) url.searchParams.set('q', trimmedQuery);
    else url.searchParams.delete('q');

    if (variant === 'directory') {
      if (category !== 'all') url.searchParams.set('category', category);
      else url.searchParams.delete('category');
    }

    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [category, query, variant]);

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
