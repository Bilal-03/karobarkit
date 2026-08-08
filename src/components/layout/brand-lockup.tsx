interface BrandLockupProps {
  compact?: boolean;
  showTagline?: boolean;
  tone?: 'dark' | 'light';
}

interface BrandIconProps {
  className?: string;
  decorative?: boolean;
  tone?: 'dark' | 'light';
}

export function BrandIcon({ className, decorative = false, tone = 'dark' }: BrandIconProps) {
  const navy = tone === 'light' ? '#ffffff' : '#0d1b2a';
  const slate = tone === 'light' ? '#d7e5ed' : '#64748b';

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'KarobarKit tools and growth icon'}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <rect x="9" y="7" width="24" height="32" rx="3" fill={navy} />
      <rect x="9" y="43" width="24" height="16" rx="3" fill={navy} />
      <rect x="9" y="63" width="24" height="16" rx="3" fill={navy} />
      <rect x="37" y="43" width="24" height="16" rx="3" fill={navy} />
      <rect x="37" y="63" width="24" height="16" rx="3" fill={navy} />
      <path
        d="M21 47v8M17 51h8M45 51h8M17 67l8 8M25 67l-8 8M45 67l8 8M53 67l-8 8"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path d="M42 35 73 6h22L67 35l18 18-13 13-18-18-10 10-9-9 10-10Z" fill="#0fa89a" />
      <path d="m52 35 13 13-13 13-10-10 10-10Z" fill={navy} />
      <path d="M52 33c-3 1-6 4-7 8l7 7 7-7c-1-4-4-7-7-8Z" fill="#fff" />
      <path d="M61 89h31M67 89V78h7v11M77 89V69h7v20M87 89V58h7v31" fill="#0fa89a" />
      <path
        d="m58 85 15-13 9 3 14-20"
        fill="none"
        stroke="#0fa89a"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m89 56 7-1-2 7"
        fill="none"
        stroke="#0fa89a"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M61 92h35" stroke={slate} strokeWidth="2" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

export function BrandLockup({ compact = false, showTagline = false, tone = 'dark' }: BrandLockupProps) {
  return (
    <span
      className={`brand-lockup${compact ? ' brand-lockup--compact' : ''}${tone === 'light' ? ' brand-lockup--light' : ''}`}
    >
      <BrandIcon className="brand-lockup__icon" tone={tone} decorative />
      <span className="brand-lockup__copy">
        <span className="brand-lockup__name">
          <span>Karobar</span>
          <span className="brand-lockup__accent">Kit</span>
        </span>
        {showTagline ? <span className="brand-lockup__tagline">Smart Tools for Smarter Business</span> : null}
      </span>
    </span>
  );
}
