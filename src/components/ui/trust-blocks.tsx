import { formatIndianDate } from '@/domain/formatting/indian';

export function DisclaimerBlock({ children }: { children: string }) {
  return (
    <aside className="notice notice--muted" aria-label="Disclaimer">
      <strong>Keep in mind</strong>
      <p>{children}</p>
    </aside>
  );
}

export function LastReviewedBlock({ date }: { date: string }) {
  return <p className="last-reviewed">Last reviewed {formatIndianDate(date)} · Formula version 1.0</p>;
}

export function PrivacyBlock({ children }: { children: string }) {
  return (
    <aside className="privacy-note">
      <span className="privacy-note__icon" aria-hidden="true">
        ◌
      </span>
      <div>
        <strong>Private by default</strong>
        <p>{children}</p>
      </div>
    </aside>
  );
}

export function StateBlock({
  title,
  children,
  tone = 'empty',
  titleId,
}: {
  title: string;
  children: string;
  tone?: 'empty' | 'loading' | 'error' | 'success';
  titleId?: string;
}) {
  return (
    <div className={`state-block state-block--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <strong id={titleId}>{title}</strong>
      <p>{children}</p>
    </div>
  );
}
