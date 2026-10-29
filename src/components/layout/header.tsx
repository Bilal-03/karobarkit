import Link from 'next/link';

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
          <Link href="/tools">Tools</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/search">Search</Link>
        </nav>
        <div className="site-header__actions">
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
