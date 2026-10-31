'use client';
export function DocumentExampleActions({
  example,
  onExample,
  onStart,
}: {
  example: boolean;
  onExample: () => void;
  onStart: () => void;
}) {
  return (
    <div className="document-example-actions">
      {example ? (
        <>
          <p className="notice" role="status">
            Example preview — sample details. Downloading, printing and saving are disabled.
          </p>
          <button type="button" className="button button--secondary" onClick={onStart}>
            Start my own document
          </button>
        </>
      ) : (
        <button type="button" className="example-button" onClick={onExample}>
          Try an example
        </button>
      )}
    </div>
  );
}

export function detachDraftReference() {
  const url = new URL(window.location.href);
  url.searchParams.delete('draft');
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}
