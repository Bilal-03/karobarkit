'use client';
import { useState } from 'react';
import Link from 'next/link';
import { readWorkspace, writeWorkspace, type DraftKind } from '@/domain/workspace';
export function DocumentWorkspaceControls<T extends object>({
  kind,
  values,
  onLoad,
}: {
  kind: DraftKind;
  values: T;
  onLoad: (value: T) => void;
}) {
  const [name, setName] = useState('My draft');
  const [message, setMessage] = useState('');
  const [drafts, setDrafts] = useState<{ id: string; name: string }[]>([]);
  const [id, setId] = useState('');
  function perform(action: () => void) {
    try {
      action();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Device storage is unavailable.');
    }
  }
  return (
    <details className="field-group">
      <summary>Optional device workspace</summary>
      <p>
        Save only when you choose. Drafts and business details stay in this browser. Logos are excluded.
        Anyone using this browser profile can access saved data.{' '}
        <Link href="/workspace">Manage, back up or delete</Link>.
      </p>
      <label>
        Draft name
        <input className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="inline-actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={() =>
            perform(() => {
              const w = readWorkspace();
              w.drafts.push({
                id: crypto.randomUUID(),
                name: name.trim(),
                kind,
                values: { ...values, logo: null },
              });
              writeWorkspace(w);
              setMessage('Draft saved on this device.');
            })
          }
        >
          Save draft on this device
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={() =>
            perform(() => {
              setDrafts(readWorkspace().drafts.filter((d) => d.kind === kind));
              setMessage('Choose a draft, then explicitly load it.');
            })
          }
        >
          Find saved drafts
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={() =>
            perform(() => {
              const profile = Object.fromEntries(
                Object.entries(readWorkspace().profile).filter(([, value]) => value.trim()),
              );
              if (!Object.keys(profile).length)
                throw new Error('No saved business details. Add them in the workspace first.');
              if (!window.confirm('Apply saved business details to this form?')) return;
              const next = { ...values, ...profile };
              onLoad(next);
              setMessage('Saved business details applied. Review before exporting.');
            })
          }
        >
          Apply saved business details
        </button>
      </div>
      {drafts.length > 0 && (
        <>
          <div>
            <label htmlFor={`${kind}-saved-draft`}>Saved draft</label>
            <select
              id={`${kind}-saved-draft`}
              className="input"
              value={id}
              onChange={(e) => setId(e.target.value)}
            >
              <option value="">Choose a draft</option>
              {drafts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={!id}
            className="button button--secondary"
            onClick={() =>
              perform(() => {
                const draft = readWorkspace().drafts.find((d) => d.id === id && d.kind === kind);
                if (!draft) throw new Error('Draft no longer exists.');
                if (!window.confirm('Replace this form with the saved draft?')) return;
                onLoad(draft.values as T);
                setMessage('Draft loaded. Review all fields before export.');
              })
            }
          >
            Load selected draft
          </button>
        </>
      )}
      <p role="status">{message}</p>
    </details>
  );
}
