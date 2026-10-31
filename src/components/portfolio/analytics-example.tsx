'use client';
import { useState } from 'react';
import { channels, sampleEvents, summarize } from '@/domain/portfolio/analysis';

export function AnalyticsExample() {
  const [mode, setMode] = useState<'a' | 'b'>('a');
  const [channel, setChannel] = useState('all');
  const events = sampleEvents(mode).filter((e) => channel === 'all' || e.channel === channel);
  const summary = summarize(events);
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `synthetic-events-${mode}-${channel}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section aria-labelledby="analysis-title" className="content-card">
      <h2 id="analysis-title">Explore a product funnel</h2>
      <p className="notice">
        <strong>Simulated data only.</strong> Every session and timing below is invented. These are analytical
        examples, not real users, experiments, traction or measured improvements.
      </p>
      <div className="form-grid form-grid--two">
        <label className="field">
          Scenario
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value as 'a' | 'b')}>
            <option value="a">Sample A</option>
            <option value="b">Modeled B — more exports, shorter completion</option>
          </select>
        </label>
        <label className="field">
          Channel
          <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="all">All channels</option>
            {channels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <dl className="result-breakdown" aria-live="polite">
        <div>
          <dt>Started sessions</dt>
          <dd>{summary.started}</dd>
        </div>
        <div>
          <dt>Valid results</dt>
          <dd>{summary.results}</dd>
        </div>
        <div>
          <dt>Exporting sessions</dt>
          <dd>{summary.exported}</dd>
        </div>
        <div>
          <dt>Completion rate</dt>
          <dd>{summary.completion === null ? 'No starts' : `${(summary.completion * 100).toFixed(1)}%`}</dd>
        </div>
        <div>
          <dt>Median start-to-export</dt>
          <dd>
            {summary.medianMs === null ? 'No exports' : `${(summary.medianMs / 1000).toFixed(1)} seconds`}
          </dd>
        </div>
      </dl>
      <p>
        In this sample, {summary.started - summary.results} sessions stop before a result and{' '}
        {summary.results - summary.exported} stop between result and export. The next investigation would
        inspect those steps; these counts alone cannot explain why people left.
      </p>
      <p>
        Each session counts once per stage. Export requires an earlier start and result. Completion is
        exporting sessions divided by started sessions; median time includes exporting sessions only, so it
        excludes abandonments. An export is a proxy for value, not proof of a useful document.
      </p>
      <p>
        Modeled B changes assumed export counts and timings. It demonstrates sensitivity to assumptions, not a
        causal effect or statistically significant uplift. Channel counts are too small and nonrandom for
        ranking acquisition quality.
      </p>
      <button className="button button--secondary" type="button" onClick={download}>
        Download simulated events (JSON)
      </button>{' '}
      <a href="/portfolio/funnel.sql" download>
        Download SQL analysis
      </a>
    </section>
  );
}
