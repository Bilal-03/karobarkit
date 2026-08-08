import Image from 'next/image';

interface BrandLockupProps {
  compact?: boolean;
  showTagline?: boolean;
  tone?: 'dark' | 'light';
}

interface BrandIconProps {
  className?: string;
  decorative?: boolean;
  tone?: 'dark' | 'light';
  variant?: 'standalone' | 'badge';
}

export function BrandIcon({
  className,
  decorative = false,
  tone = 'dark',
  variant = 'standalone',
}: BrandIconProps) {
  const src = variant === 'badge' || tone === 'light' ? '/brand-badge.png' : '/brand-icon.png';
  return (
    <Image
      src={src}
      width={100}
      height={100}
      className={className}
      alt={decorative ? '' : 'KarobarKit tools and growth icon'}
      aria-hidden={decorative ? true : undefined}
      unoptimized
    />
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
