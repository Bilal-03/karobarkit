'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Search,
  Moon,
  Sun,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Home,
  Grid2X2,
  FileText,
  FolderOpen,
  CircleHelp,
  ArrowUpRight,
} from 'lucide-react';
import { BrandLockup } from './brand-lockup';
import { ToolIcon } from '@/components/ui/tool-icon';
import { MotionProvider } from '@/components/ui/studio-motion';
import { searchTools } from '@/domain/discovery';
import type { ToolDiscoveryRecord } from '@/domain/registry/types';

function HelpMenu({ onNavigate }: { onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="studio-sidebar-bottom">
      <details onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary role="button" aria-expanded={open} aria-label="Help & more">
          <CircleHelp size={18} />
          <span>Help & more</span>
        </summary>
        <div>
          {[
            ['Help', '/faq'],
            ['Methods', '/methodology'],
            ['Sources', '/sources'],
            ['About', '/about'],
            ['Contact', '/contact'],
            ['Privacy', '/privacy'],
            ['Terms', '/terms'],
            ['Disclaimer', '/disclaimer'],
          ].map(([label, href]) => (
            <Link key={href} href={href} onClick={onNavigate}>
              {label}
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}

export function StudioShell({
  children,
  tools,
}: {
  children: ReactNode;
  tools: readonly ToolDiscoveryRecord[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  function openSearch() {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setSearchOpen(true);
  }
  const [dark, setDark] = useState(false);
  const workspace = /^\/tools\/[^/]+$/.test(pathname);
  const helpPath = workspace ? `${pathname}/help` : '/faq';
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDark(document.documentElement.dataset.theme === 'dark'));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (searchOpen) setSearchOpen(false);
        else openSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);
  function toggleTheme() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    setDark(next);
    try {
      localStorage.setItem('kk-theme', next ? 'dark' : 'light');
    } catch {}
  }
  const navigation = (
    <>
      <Link className="studio-brand" href="/" aria-label="KarobarKit home" onClick={() => setDrawer(false)}>
        <BrandLockup compact />
      </Link>
      <nav className="studio-navigation" aria-label="Primary navigation">
        <Link
          href="/"
          aria-current={pathname === '/' ? 'page' : undefined}
          onClick={() => setDrawer(false)}
          title="Home"
        >
          <Home size={19} />
          <span>Home</span>
        </Link>
        {[
          { href: '/tools?group=documents', label: 'Documents', icon: FileText },
          { href: '/workspace', label: 'Saved drafts', icon: FolderOpen },
          { href: '/tools', label: 'More tools', icon: Grid2X2 },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            href={href}
            key={href}
            title={label}
            aria-current={pathname === href ? 'page' : undefined}
            onClick={() => setDrawer(false)}
          >
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <HelpMenu onNavigate={() => setDrawer(false)} />
    </>
  );
  const results = searchTools(tools, query).slice(0, 8);
  return (
    <MotionProvider>
      <div className={`studio-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <aside className="studio-sidebar">
          {navigation}
          <button
            className="sidebar-collapse icon-button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </aside>
        <div className="studio-main">
          <header className="studio-toolbar">
            <Dialog.Root open={drawer} onOpenChange={setDrawer}>
              <Dialog.Trigger asChild>
                <button className="icon-button mobile-drawer-trigger" aria-label="Open navigation">
                  <Menu size={21} />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="studio-overlay" />
                <Dialog.Content className="studio-drawer">
                  <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                  <Dialog.Description className="sr-only">Choose a tool or task group.</Dialog.Description>
                  <Dialog.Close className="icon-button drawer-close" aria-label="Close navigation">
                    <X size={20} />
                  </Dialog.Close>
                  {navigation}
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <button className="toolbar-search" onClick={openSearch}>
              <Search size={18} />
              <span>Find a tool</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="toolbar-actions">
              <button
                className="icon-button"
                onClick={toggleTheme}
                aria-label={dark ? 'Use light theme' : 'Use dark theme'}
              >
                {dark ? <Sun size={19} /> : <Moon size={19} />}
              </button>
              <Link className="toolbar-help" href={helpPath} aria-label="Help">
                <CircleHelp size={18} />
                <span>Help</span>
              </Link>
            </div>
          </header>
          <main id="main-content" className={workspace ? 'studio-content is-workspace' : 'studio-content'}>
            {children}
          </main>
          {!workspace && (
            <footer className="studio-footer">
              <span>Made for everyday business.</span>
              <div>
                <Link href="/privacy">Privacy</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/terms">Terms</Link>
              </div>
            </footer>
          )}
        </div>
        <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="studio-overlay" />
            <Dialog.Content
              className="studio-search-dialog"
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                searchInputRef.current?.focus();
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                previousFocusRef.current?.focus();
              }}
            >
              <Dialog.Title>Find your next tool</Dialog.Title>
              <Dialog.Description className="sr-only">
                Search by name or task. Use Tab to move through results.
              </Dialog.Description>
              <Dialog.Close className="icon-button dialog-close" aria-label="Close search">
                <X size={20} />
              </Dialog.Close>
              <div className="command-input">
                <Search size={20} />
                <input
                  ref={searchInputRef}
                  aria-label="Search all tools"
                  placeholder="Try invoice, GST, or resize…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="command-results">
                {results.length ? (
                  results.map((tool) => (
                    <Link href={`/tools/${tool.slug}`} key={tool.id} onClick={() => setSearchOpen(false)}>
                      <ToolIcon category={tool.category} />
                      <span>
                        {tool.name}
                        <small>{tool.presentation?.description ?? tool.categoryLabel}</small>
                      </span>
                      <ArrowUpRight size={16} />
                    </Link>
                  ))
                ) : (
                  <p>No matches. Try a shorter name or another task.</p>
                )}
              </div>
              <Link
                className="command-all"
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={() => setSearchOpen(false)}
              >
                See all results <ArrowUpRight size={16} />
              </Link>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </MotionProvider>
  );
}
