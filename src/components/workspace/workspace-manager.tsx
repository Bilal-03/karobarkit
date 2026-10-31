'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  blankWorkspace,
  emptyProfile,
  parseWorkspace,
  readWorkspace,
  writeWorkspace,
  WORKSPACE_KEY,
  type Workspace,
} from '@/domain/workspace';
import { draftHref } from './saved-drafts';
export function WorkspaceManager() {
  const [workspace, setWorkspace] = useState<Workspace>(blankWorkspace);
  const [snapshot, setSnapshot] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('Loading saved drafts…');
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const current = readWorkspace();
        setWorkspace(current);
        setSnapshot(JSON.stringify(current));
        setLoaded(true);
        setMessage('');
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'Storage unavailable.');
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  function run(action: () => void) {
    try {
      action();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Storage unavailable.');
    }
  }
  function save(next: Workspace) {
    if (snapshot !== JSON.stringify(readWorkspace()))
      throw new Error('Saved data changed in another page. Reload this page before saving.');
    writeWorkspace(next);
    setSnapshot(JSON.stringify(next));
    setWorkspace(next);
    setMessage('Saved on this device.');
  }
  return (
    <div>
      <p>
        Saved only when you choose, in this browser. No account or cloud backup. Anyone using this browser
        profile can access these records.
      </p>
      {loaded && (
        <>
          <h2>Your drafts</h2>
          {!workspace.drafts.length && (
            <p>
              No saved drafts yet. <Link href="/tools/quotation-generator">Prepare a quotation</Link> or{' '}
              <Link href="/tools/invoice-generator">create an invoice</Link>, then choose Save draft.
            </p>
          )}
          <ul className="saved-draft-list">
            {workspace.drafts.map((d) => (
              <li key={d.id}>
                <strong>{d.name}</strong> <span>({d.kind})</span>
                <div className="inline-actions">
                  <Link className="button button--secondary" href={draftHref(d.id, d.kind)}>
                    Continue editing
                  </Link>
                  <button
                    className="button button--ghost"
                    onClick={() =>
                      run(() =>
                        save({
                          ...workspace,
                          drafts: [
                            ...workspace.drafts,
                            { ...d, id: crypto.randomUUID(), name: (d.name + ' copy').slice(0, 80) },
                          ],
                        }),
                      )
                    }
                  >
                    Make a copy
                  </button>
                  <button
                    className="button button--ghost"
                    onClick={() =>
                      run(() => {
                        if (window.confirm('Delete this saved draft?'))
                          save({ ...workspace, drafts: workspace.drafts.filter((x) => x.id !== d.id) });
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <details className="field-group">
            <summary>My business details</summary>
            <p>Save once and choose Use saved details when creating a document.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(() => save(workspace));
              }}
            >
              {Object.keys(emptyProfile).map((key) => (
                <label className="field" key={key}>
                  {
                    {
                      businessName: 'Business name',
                      businessAddress: 'Business address',
                      phone: 'Phone',
                      email: 'Email',
                      gstin: 'GSTIN',
                    }[key as keyof typeof emptyProfile]
                  }
                  <input
                    className="input"
                    value={workspace.profile[key as keyof typeof emptyProfile]}
                    maxLength={
                      key === 'businessAddress'
                        ? 600
                        : key === 'email'
                          ? 254
                          : key === 'businessName'
                            ? 120
                            : 100
                    }
                    onChange={(e) =>
                      setWorkspace({ ...workspace, profile: { ...workspace.profile, [key]: e.target.value } })
                    }
                  />
                </label>
              ))}
              <button className="button button--secondary">Save business details</button>
            </form>
          </details>
        </>
      )}
      <details className="field-group">
        <summary>Backup &amp; data settings</summary>
        <p>
          Backups contain private business details, drafts, and any legacy comparison or portfolio records.
          Keep them safe. Downloaded backups are not deleted by this site.
        </p>
        {loaded && (
          <>
            <button
              className="button button--secondary"
              onClick={() =>
                run(() => {
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(readWorkspace(), null, 2)], { type: 'application/json' }),
                  );
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'karobarkit-private-workspace.json';
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                })
              }
            >
              Download private backup
            </button>
            <label className="field">
              Restore backup (replaces saved data)
              <input
                type="file"
                accept="application/json,.json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    if (file.size > 512000) throw new Error('Backup exceeds 512 KB.');
                    const next = parseWorkspace(await file.text());
                    if (
                      window.confirm('Replace saved data in this browser? Download a backup first if needed.')
                    )
                      save(next);
                  } catch (err) {
                    setMessage(err instanceof Error ? err.message : 'Invalid backup.');
                  }
                }}
              />
            </label>
          </>
        )}
        <button
          className="button button--secondary"
          onClick={() =>
            run(() => {
              if (
                !window.confirm(
                  'Delete all saved data in this browser, including drafts, business details and legacy planning records? Downloaded backups remain unchanged.',
                )
              )
                return;
              localStorage.removeItem(WORKSPACE_KEY);
              const blank = blankWorkspace();
              setWorkspace(blank);
              setSnapshot(JSON.stringify(blank));
              setLoaded(true);
              setMessage('Saved data deleted. Downloaded backups remain yours to manage.');
            })
          }
        >
          {loaded ? 'Delete all saved data' : 'Clear unreadable saved data'}
        </button>
      </details>
      <p role="status">{message}</p>
    </div>
  );
}
