'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body className="global-error">
        <main className="not-found-page">
          <div className="container container--narrow">
            <p className="eyebrow">KarobarKit</p>
            <h1>The page needs a fresh start.</h1>
            <p className="lede">No input has been saved or transmitted. Reload the page to try again.</p>
            <button className="button button--primary" type="button" onClick={() => reset()}>
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
