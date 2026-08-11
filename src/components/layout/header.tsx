import Link from 'next/link';

import { categoryRegistry } from '@/domain/registry/categories';

import { MobileNav } from './mobile-nav';
import { BrandLockup } from './brand-lockup';

export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="wordmark" href="/" aria-label="KarobarKit home">
          <BrandLockup compact />
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/tools">All tools</Link>
          <Link href="/categories">{categoryRegistry.length} categories</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/sources">Sources</Link>
        </nav>
        <div className="site-header__actions">
          <Link className="header-action" href="/search" aria-label="Search tools">
            <span aria-hidden="true">⌕</span>
            <span className="header-action__label">Search</span>
          </Link>
          <Link className="button button--small button--secondary header-cta" href="/tools">
            Open toolkit
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
