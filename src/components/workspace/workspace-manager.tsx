'use client';
import { useState } from 'react';
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
export function WorkspaceManager() {
  const [workspace, setWorkspace] = useState<Workspace>(blankWorkspace);
  const [snapshot, setSnapshot] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  function run(action: () => void) {
    try {
      action();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Storage unavailable.');
    }
  }
  function save(next: Workspace) {
    if (snapshot !== JSON.stringify(readWorkspace()))
      throw new Error(
        'The saved workspace changed in another page. Open device workspace again before saving.',
      );
    writeWorkspace(next);
    setSnapshot(JSON.stringify(next));
    setWorkspace(next);
    setMessage('Saved on this device.');
  }
  return (
    <div>
      <p className="notice">
        Optional local storage. No account or server backup. Anyone with this browser profile can read these
        details. Backups contain your business details and drafts; keep them private. Nothing is saved
        automatically.
      </p>
      <button
        className="button button--primary"
        onClick={() =>
          run(() => {
            const current = readWorkspace();
            setWorkspace(current);
            setSnapshot(JSON.stringify(current));
            setLoaded(true);
            setMessage('Workspace opened.');
          })
        }
      >
        Open device workspace
      </button>
      {!loaded && (
        <button
          className="button button--secondary"
          onClick={() =>
            run(() => {
              if (
                !window.confirm(
                  'Clear saved workspace data without opening it? This also clears unreadable backups on this device. Downloaded files remain unchanged.',
                )
              )
                return;
              localStorage.removeItem(WORKSPACE_KEY);
              setWorkspace(blankWorkspace());
              setSnapshot(JSON.stringify(blankWorkspace()));
              setLoaded(true);
              setMessage('Device workspace cleared.');
            })
          }
        >
          Clear device workspace
        </button>
      )}
      {loaded && (
        <>
          <p>
            <Link href="/product-studio">Plan experiments and roadmap decisions in Product Studio</Link>.
            Studio records are included in workspace backups and full deletion.
          </p>
          <h2>Reusable business details</h2>
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
          <h2>Document drafts</h2>
          {workspace.drafts.length === 0 && (
            <p>No saved drafts. Save from a quotation, invoice or receipt form.</p>
          )}
          <ul>
            {workspace.drafts.map((d) => (
              <li key={d.id}>
                {d.name} ({d.kind}){' '}
                <Link href={`/tools/${d.kind === 'receipt' ? 'payment-receipt' : d.kind}-generator`}>
                  Open form to load
                </Link>{' '}
                <button
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
                  Duplicate
                </button>{' '}
                <button
                  onClick={() =>
                    run(() => {
                      if (window.confirm('Delete this saved draft?'))
                        save({ ...workspace, drafts: workspace.drafts.filter((x) => x.id !== d.id) });
                    })
                  }
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <h2>Saved comparisons</h2>
          <p>
            {workspace.scenarios.length} scenario(s).{' '}
            <Link href="/decision-workbench">Open the workbench and load saved scenarios</Link>.
          </p>
          <div className="inline-actions">
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
              Restore backup (replaces saved workspace)
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
                    if (!window.confirm('Replace this device workspace? Download a backup first if needed.'))
                      return;
                    save(next);
                  } catch (err) {
                    setMessage(err instanceof Error ? err.message : 'Invalid backup.');
                  }
                }}
              />
            </label>
            <button
              className="button button--secondary"
              onClick={() =>
                run(() => {
                  if (
                    !window.confirm(
                      'Delete all saved business details, scenarios, drafts and Product Studio records on this device? Downloaded backups are not deleted.',
                    )
                  )
                    return;
                  localStorage.removeItem(WORKSPACE_KEY);
                  setWorkspace(blankWorkspace());
                  setSnapshot(JSON.stringify(blankWorkspace()));
                  setMessage('Device workspace deleted. Downloaded backups remain yours to manage.');
                })
              }
            >
              Delete entire workspace
            </button>
          </div>
        </>
      )}
      <p role="status">{message}</p>
    </div>
  );
}
