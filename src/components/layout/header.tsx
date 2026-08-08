import Link from 'next/link';

import { MobileNav } from './mobile-nav';

export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="wordmark" href="/" aria-label="KarobarKit home">
          <span className="wordmark__mark" aria-hidden="true">
            v
          </span>
          <span>KarobarKit</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/tools">Tools</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/sources">Sources</Link>
        </nav>
        <div className="site-header__actions">
          <Link className="header-action" href="/search" aria-label="Search tools">
            <span aria-hidden="true">⌕</span>
            <span className="header-action__label">Search</span>
          </Link>
          <Link className="button button--small button--secondary header-cta" href="/tools">
            Browse tools
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
