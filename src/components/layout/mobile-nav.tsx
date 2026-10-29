'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const links = [
  { href: '/tools', label: 'Tools' },
  { href: '/categories', label: 'Categories' },
  { href: '/search', label: 'Search' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  return (
    <div className="mobile-nav">
      <button
        type="button"
        className="menu-button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="sr-only">{open ? 'Close navigation' : 'Open navigation'}</span>
        <span aria-hidden="true" className="menu-button__lines">
          {open ? '×' : '☰'}
        </span>
      </button>
      {open ? (
        <div className="mobile-menu" id="mobile-menu" role="dialog" aria-label="Mobile navigation">
          <div className="mobile-menu__bar">
            <span className="mobile-menu__title">Navigate</span>
            <button
              ref={closeButtonRef}
              type="button"
              className="mobile-menu__close"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <nav aria-label="Mobile primary navigation">
            <ul>
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={() => setOpen(false)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
