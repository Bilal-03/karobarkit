'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readWorkspace, type Workspace, type DraftKind } from '@/domain/workspace';
export function draftHref(id: string, kind: DraftKind) {
  return `/tools/${kind === 'receipt' ? 'payment-receipt' : kind}-generator?draft=${encodeURIComponent(id)}`;
}
export function SavedDrafts({ compact = false }: { compact?: boolean }) {
  const [drafts, setDrafts] = useState<Workspace['drafts']>([]);
  const [message, setMessage] = useState('Loading saved drafts…');
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setDrafts(readWorkspace().drafts);
        setMessage('');
      } catch {
        setMessage('Saved drafts could not be read. Open Saved drafts for recovery options.');
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <>
      <p>Saved only when you choose, in this browser. No account or cloud backup.</p>
      {message ? (
        <p role="status">{message}</p>
      ) : drafts.length ? (
        <ul className="saved-draft-list">
          {(compact ? drafts.slice(-3).reverse() : drafts).map((d) => (
            <li key={d.id}>
              <Link href={draftHref(d.id, d.kind)}>{d.name}</Link> <span>· {d.kind}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No drafts yet. Choose Save draft while preparing a quotation, invoice or receipt.</p>
      )}
      <Link href="/workspace">View saved drafts</Link>
    </>
  );
}
