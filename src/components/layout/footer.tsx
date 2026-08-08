import Link from 'next/link';

import { BrandLockup } from './brand-lockup';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <Link className="wordmark wordmark--footer" href="/">
            <BrandLockup compact tone="light" />
          </Link>
          <p className="site-footer__tagline">The Business Toolkit for India.</p>
        </div>
        <div className="site-footer__links">
          <div>
            <p className="footer-heading">Explore</p>
            <Link href="/tools">All tools</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/categories/business">Business</Link>
            <Link href="/categories/gst-tax">GST & Tax</Link>
            <Link href="/categories/finance">Finance</Link>
            <Link href="/categories/generators">Generators</Link>
            <Link href="/faq">FAQ</Link>
          </div>
          <div>
            <p className="footer-heading">Trust</p>
            <Link href="/methodology">Methodology</Link>
            <Link href="/sources">Sources</Link>
            <Link href="/report-an-error">Report an error</Link>
          </div>
          <div>
            <p className="footer-heading">About</p>
            <Link href="/about">About KarobarKit</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </div>
      <div className="container site-footer__bottom">
        <span>© 2026 KarobarKit. The Business Toolkit for India.</span>
        <span>
          <Link href="/terms">Terms</Link> · <Link href="/disclaimer">Disclaimer</Link>
        </span>
      </div>
    </footer>
  );
}
