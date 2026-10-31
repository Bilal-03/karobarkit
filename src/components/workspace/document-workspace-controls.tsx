'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { readWorkspace, writeWorkspace, type DraftKind } from '@/domain/workspace';
export function DocumentWorkspaceControls<T extends object>({
  kind,
  values,
  onLoad,
  disabled = false,
}: {
  kind: DraftKind;
  values: T;
  onLoad: (value: T) => void;
  disabled?: boolean;
}) {
  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState('My draft');
  const [message, setMessage] = useState('');
  const [id, setId] = useState('');
  const [saved, setSaved] = useState('');
  const [savedName, setSavedName] = useState('');
  const [loadError, setLoadError] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const load = useRef(onLoad);
  useEffect(() => {
    load.current = onLoad;
  }, [onLoad]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setInitialized(true);
      const requested = new URLSearchParams(window.location.search).get('draft');
      if (!requested) return;
      try {
        const draft = readWorkspace().drafts.find((d) => d.id === requested && d.kind === kind);
        if (!draft)
          throw new Error(
            'This draft is unavailable in this browser. You can start a new document or return to Saved drafts.',
          );
        load.current(draft.values as T);
        setId(draft.id);
        setName(draft.name);
        setSavedName(draft.name);
        setSaved(JSON.stringify(draft.values));
        setMessage('Draft opened. Review your details before downloading.');
      } catch (e) {
        setLoadError(true);
        setMessage(e instanceof Error ? e.message : 'Could not open this draft.');
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [kind]);
  useEffect(() => {
    if (!loadError) return;
    const frame = requestAnimationFrame(() => statusRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [loadError]);
  const current = JSON.stringify({ ...values, logo: null });
  const clean = saved === current && savedName === name;
  function perform(action: () => void) {
    try {
      action();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save. Device storage is unavailable.');
    }
  }
  function save(copy: boolean) {
    if (disabled) return;
    const w = readWorkspace();
    if (!name.trim()) throw new Error('Enter a draft name before saving.');
    if ((copy || !id) && w.drafts.length >= 20)
      throw new Error('You can save up to 20 drafts. Remove an unused draft in Saved drafts first.');
    const record = {
      id: copy || !id ? crypto.randomUUID() : id,
      name: name.trim(),
      kind,
      values: { ...values, logo: null },
    };
    if (!copy && id) {
      const existing = w.drafts.find((d) => d.id === id);
      if (!existing || JSON.stringify(existing.values) !== saved || existing.name !== savedName)
        throw new Error(
          'This draft changed or was deleted in another page. Reopen it from Saved drafts, or save a copy.',
        );
      w.drafts = w.drafts.map((d) => (d.id === id ? record : d));
    } else {
      w.drafts.push(record);
    }
    writeWorkspace(w);
    setId(record.id);
    setName(record.name);
    setSavedName(record.name);
    setSaved(JSON.stringify(record.values));
    setMessage('Saved on this device.');
    setLoadError(false);
    const url = new URL(window.location.href);
    url.searchParams.set('draft', record.id);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  }
  return (
    <section className="draft-controls" aria-label="Save this document">
      <p>
        {disabled
          ? 'Examples cannot be saved. Start your own document first.'
          : clean
            ? 'Saved on this device'
            : 'Unsaved changes'}
      </p>
      <details>
        <summary>Draft name</summary>
        <label>
          Draft name
          <input className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </label>
      </details>
      <div className="inline-actions">
        <button
          type="button"
          className="button button--secondary"
          disabled={!initialized || disabled || loadError}
          onClick={() => perform(() => save(false))}
        >
          {id ? 'Save changes' : 'Save draft'}
        </button>
        {id && (
          <button
            type="button"
            className="button button--secondary"
            disabled={!initialized || disabled}
            onClick={() => perform(() => save(true))}
          >
            Save a copy
          </button>
        )}
        <Link href="/workspace">Saved drafts</Link>
      </div>
      <p className="field-hint">Stored in this browser only. Logos are not saved.</p>
      {loadError && (
        <a href={`/tools/${kind === 'receipt' ? 'payment-receipt' : kind}-generator`}>Start a new document</a>
      )}
      <p role="status" ref={statusRef} tabIndex={-1}>
        {message}
      </p>
    </section>
  );
}

export function SavedBusinessDetails<T extends object>({
  values,
  onLoad,
  disabled = false,
}: {
  values: T;
  onLoad: (value: T) => void;
  disabled?: boolean;
}) {
  const [message, setMessage] = useState('');
  return (
    <div className="saved-details-shortcut">
      <button
        type="button"
        className="example-button"
        disabled={disabled}
        onClick={() => {
          try {
            const profile = Object.fromEntries(
              Object.entries(readWorkspace().profile).filter(([, v]) => v.trim()),
            );
            if (!Object.keys(profile).length)
              throw new Error('No business details saved yet. Add them in Saved drafts.');
            if (!window.confirm('Use saved business details in this document?')) return;
            onLoad({ ...values, ...profile });
            setMessage('Business details applied.');
          } catch (e) {
            setMessage(e instanceof Error ? e.message : 'Could not read saved details.');
          }
        }}
      >
        Use saved details
      </button>
      {message && (
        <p role="status">
          {message} <Link href="/workspace">Saved drafts</Link>
        </p>
      )}
    </div>
  );
}
