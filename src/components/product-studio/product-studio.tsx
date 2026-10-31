'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  blankStudio,
  studioSchema,
  newExperiment,
  newInitiative,
  experimentSchema,
  initiativeSchema,
  decisionSchema,
  rankInitiatives,
  type Studio,
  type Experiment,
  type Initiative,
  type Decision,
} from '@/domain/product-studio';
import { readWorkspace, writeWorkspace } from '@/domain/workspace';
const experimentFields = {
  title: 'Experiment title',
  problem: 'Problem to investigate',
  hypothesis: 'Hypothesis',
  change: 'Proposed change',
  audience: 'Target audience',
  primaryMetric: 'Primary metric and success threshold',
  guardrails: 'Guardrail metrics and limits',
  duration: 'Duration and sample requirement',
  stopping: 'Stopping conditions',
  evidence: 'Evidence source, sample and results',
  decision: 'Result interpretation and next decision',
};
export function ProductStudio() {
  const [studio, setStudio] = useState<Studio>(blankStudio);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [experiment, setExperiment] = useState<Experiment>(newExperiment);
  const [initiative, setInitiative] = useState<Initiative>(newInitiative);
  const [owner, setOwner] = useState('');
  const [choice, setChoice] = useState<Decision['choice']>('investigate');
  const [rationale, setRationale] = useState('');
  const [alternatives, setAlternatives] = useState('');
  const [reverseCondition, setReverseCondition] = useState('');
  const [revisit, setRevisit] = useState('');
  const [selected, setSelected] = useState('');
  function run(fn: () => void) {
    try {
      fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Check the fields.');
    }
  }
  function save() {
    run(() => {
      const workspace = readWorkspace();
      if (
        snapshot === null &&
        (workspace.studio.experiments.length ||
          workspace.studio.initiatives.length ||
          workspace.studio.decisions.length)
      )
        throw new Error('Saved studio records exist. Load them before saving to avoid overwriting them.');
      if (snapshot !== null && JSON.stringify(workspace.studio) !== snapshot)
        throw new Error('Saved studio changed in another page. Load saved studio again before saving.');
      const parsed = studioSchema.safeParse(studio);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      writeWorkspace({ ...workspace, studio: parsed.data });
      setStudio(parsed.data);
      setSnapshot(JSON.stringify(parsed.data));
      setMessage('Product Studio saved on this device.');
    });
  }
  const ranking = rankInitiatives(studio.initiatives, studio.fitWeight);
  return (
    <div>
      <p className="notice">
        Owner planning tools. Plans and scores are assumptions, not measured outcomes. Nothing is sent to
        analytics or saved until you choose Save studio. This is not a live A/B testing or traffic-allocation
        system.
      </p>
      <p>
        Add or update a record before saving. Unsubmitted editor fields are not included in the saved board.
      </p>
      <div className="inline-actions">
        <button
          className="button button--secondary"
          onClick={() =>
            run(() => {
              if (
                !window.confirm(
                  'Replace this planning board with saved studio records? Unsaved edits will be lost.',
                )
              )
                return;
              const saved = readWorkspace().studio;
              setStudio(saved);
              setExperiment(newExperiment());
              setInitiative(newInitiative());
              setSelected('');
              setOwner('');
              setRationale('');
              setAlternatives('');
              setReverseCondition('');
              setRevisit('');
              setChoice('investigate');
              setSnapshot(JSON.stringify(saved));
              setMessage('Saved studio loaded.');
            })
          }
        >
          Load saved studio
        </button>
        <button className="button button--primary" onClick={save}>
          Save studio on this device
        </button>
        <Link href="/workspace">Back up, restore or delete all workspace data</Link>
      </div>
      <p role="status">{message}</p>
      <nav aria-label="Product Studio sections" className="inline-actions">
        <a href="#experiment-planner">Experiments</a>
        <a href="#prioritization-board">Prioritization</a>
        <a href="#decision-log">Decisions</a>
      </nav>
      <h2 id="experiment-planner">Experiment planner</h2>
      <p>
        Define metrics and failure conditions before a test. “Observed” is a label you provide; it is not an
        independent verification of evidence or causal impact.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => {
            const parsed = experimentSchema.safeParse(experiment);
            if (!parsed.success) throw new Error(parsed.error.issues[0].message);
            setStudio({
              ...studio,
              experiments: [...studio.experiments.filter((x) => x.id !== experiment.id), parsed.data],
            });
            setExperiment(newExperiment());
            setMessage('Experiment added to this board. Save studio to persist it.');
          });
        }}
      >
        {Object.entries(experimentFields).map(([key, label]) => (
          <div className="field" key={key}>
            <label htmlFor={`experiment-${key}`}>{label}</label>
            <textarea
              className="input"
              rows={2}
              id={`experiment-${key}`}
              maxLength={key === 'evidence' ? 5000 : 3000}
              required={!['evidence', 'decision'].includes(key)}
              value={experiment[key as keyof typeof experimentFields]}
              onChange={(e) => setExperiment({ ...experiment, [key]: e.target.value })}
            />
          </div>
        ))}
        <label htmlFor="experiment-status">Evidence status</label>
        <select
          className="input"
          id="experiment-status"
          value={experiment.status}
          onChange={(e) => setExperiment({ ...experiment, status: e.target.value as Experiment['status'] })}
        >
          <option value="planned">Planned — no results</option>
          <option value="simulated">Simulated — invented/modelled evidence</option>
          <option value="observed">Observed — describe actual source</option>
          <option value="inconclusive">Inconclusive — no supported decision</option>
        </select>
        <div className="inline-actions">
          <button className="button button--secondary">Add or update experiment</button>
          <button type="button" onClick={() => setExperiment(newExperiment())}>
            Clear experiment editor
          </button>
        </div>
      </form>
      {studio.experiments.length === 0 ? (
        <p>No experiments yet.</p>
      ) : (
        studio.experiments.map((x) => (
          <article className="content-card" key={x.id}>
            <h3>
              {x.title} — {x.status}
            </h3>
            <dl>
              {Object.entries(experimentFields)
                .filter(([key]) => key !== 'title')
                .map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {x[key as keyof typeof experimentFields] || 'Not recorded'}
                    </dd>
                  </div>
                ))}
            </dl>
            <button onClick={() => setExperiment(x)}>Edit experiment</button>{' '}
            <button
              onClick={() => {
                if (
                  window.confirm('Remove this experiment from the board? Save studio to persist the removal.')
                )
                  setStudio({ ...studio, experiments: studio.experiments.filter((e) => e.id !== x.id) });
              }}
            >
              Remove experiment
            </button>
          </article>
        ))
      )}
      <h2 id="prioritization-board">Prioritization board</h2>
      <p>
        Use the same 30-day reach period and person-day effort basis for every candidate. Impact and strategic
        fit range from 1–5. Confidence is an estimate, not a measured probability. Scores help compare
        assumptions; they do not decide the roadmap.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => {
            const parsed = initiativeSchema.safeParse(initiative);
            if (!parsed.success) throw new Error(parsed.error.issues[0].message);
            setStudio({
              ...studio,
              initiatives: [...studio.initiatives.filter((x) => x.id !== initiative.id), parsed.data],
            });
            setInitiative(newInitiative());
            setMessage('Candidate added to this board. Save studio to persist it.');
          });
        }}
      >
        {(['title', 'benefit', 'evidence'] as const).map((key) => (
          <div className="field" key={key}>
            <label htmlFor={`initiative-${key}`}>
              {
                {
                  title: 'Candidate feature',
                  benefit: 'Expected benefit and success measure',
                  evidence: 'Evidence or explicitly labeled assumption',
                }[key]
              }
            </label>
            <textarea
              className="input"
              required
              rows={2}
              maxLength={3000}
              id={`initiative-${key}`}
              value={initiative[key]}
              onChange={(e) => setInitiative({ ...initiative, [key]: e.target.value })}
            />
          </div>
        ))}
        {(['reach', 'impact', 'confidence', 'effort', 'fit'] as const).map((key) => (
          <div className="field" key={key}>
            <label htmlFor={`initiative-${key}`}>
              {
                {
                  reach: 'Estimated people reached in 30 days',
                  impact: 'Impact (1–5)',
                  confidence: 'Confidence (0–100%)',
                  effort: 'Effort (person-days)',
                  fit: 'Strategic fit (1–5)',
                }[key]
              }
            </label>
            <input
              className="input"
              required
              type="number"
              step={key === 'effort' ? '0.25' : '1'}
              min={key === 'effort' ? 0.25 : key === 'impact' || key === 'fit' ? 1 : 0}
              max={key === 'reach' ? 10000000 : key === 'confidence' ? 100 : key === 'effort' ? 365 : 5}
              id={`initiative-${key}`}
              value={Number.isNaN(initiative[key]) ? '' : initiative[key]}
              onChange={(e) =>
                setInitiative({ ...initiative, [key]: e.target.value === '' ? NaN : Number(e.target.value) })
              }
            />
          </div>
        ))}
        <div className="inline-actions">
          <button className="button button--secondary">Add or update candidate</button>
          <button type="button" onClick={() => setInitiative(newInitiative())}>
            Clear candidate editor
          </button>
        </div>
      </form>
      <div className="field">
        <label htmlFor="fit-weight">Strategic weighting sensitivity</label>
        <select
          className="input"
          id="fit-weight"
          value={studio.fitWeight}
          onChange={(e) => setStudio({ ...studio, fitWeight: Number(e.target.value) as 0 | 1 | 2 })}
        >
          <option value={0}>0 — ignore strategic fit</option>
          <option value={1}>1 — standard fit weighting</option>
          <option value={2}>2 — stronger fit weighting</option>
        </select>
      </div>
      <p>
        Custom RICE-style score = reach × impact × confidence/100 ÷ effort × (fit/3)^weight. This is a custom
        comparison formula, not an industry benchmark. Zero confidence gives zero score. Equal scores are
        sorted by title; the order is not a tie-breaking recommendation.
      </p>
      {ranking.length === 0 ? (
        <p>No candidates yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <caption>Ranked assumptions — edit the inputs to explore how ordering changes.</caption>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Score</th>
                <th>If confidence halves</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((x) => (
                <tr key={x.id}>
                  <th scope="row" style={{ overflowWrap: 'anywhere' }}>
                    {x.title}
                  </th>
                  <td>{x.score.toFixed(2)}</td>
                  <td>{(x.score / 2).toFixed(2)}</td>
                  <td>
                    <button onClick={() => setInitiative(studio.initiatives.find((i) => i.id === x.id)!)}>
                      Edit candidate
                    </button>{' '}
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            'Remove this candidate? Decision records retain their original title.',
                          )
                        )
                          setStudio({
                            ...studio,
                            initiatives: studio.initiatives.filter((i) => i.id !== x.id),
                          });
                      }}
                    >
                      Remove candidate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h2 id="decision-log">Decision log</h2>
      <p>
        Record why a candidate is selected, deferred, rejected or needs investigation. Records retain the
        candidate title at the time of the decision, even if the candidate is later renamed or removed.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => {
            const candidate = studio.initiatives.find((i) => i.id === selected);
            if (!candidate) throw new Error('Choose an existing candidate.');
            const record = decisionSchema.safeParse({
              id: crypto.randomUUID(),
              initiativeId: selected,
              initiativeTitle: candidate.title,
              recordedAt: new Date().toISOString(),
              owner,
              choice,
              rationale,
              alternatives,
              reverseCondition,
              revisitOn: revisit,
            });
            if (!record.success) throw new Error(record.error.issues[0].message);
            setStudio({ ...studio, decisions: [...studio.decisions, record.data] });
            setRationale('');
            setAlternatives('');
            setReverseCondition('');
            setMessage('Decision recorded on this board. Save studio to persist it.');
          });
        }}
      >
        <label htmlFor="decision-candidate">Decision candidate</label>
        <select
          id="decision-candidate"
          className="input"
          required
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Choose candidate</option>
          {studio.initiatives.map((i) => (
            <option key={i.id} value={i.id}>
              {i.title}
            </option>
          ))}
        </select>
        <label htmlFor="decision-choice">Decision</label>
        <select
          id="decision-choice"
          className="input"
          value={choice}
          onChange={(e) => setChoice(e.target.value as Decision['choice'])}
        >
          <option value="build">Build</option>
          <option value="defer">Defer</option>
          <option value="reject">Reject</option>
          <option value="investigate">Investigate further</option>
        </select>
        {(
          [
            ['owner', 'Decision owner', owner, setOwner],
            ['rationale', 'Why this decision?', rationale, setRationale],
            ['alternatives', 'Alternatives considered or deferred', alternatives, setAlternatives],
            ['reverse', 'What evidence would reverse this decision?', reverseCondition, setReverseCondition],
          ] as const
        ).map(([key, label, value, setter]) => (
          <div className="field" key={key}>
            <label htmlFor={`decision-${key}`}>{label}</label>
            <textarea
              className="input"
              rows={2}
              required
              maxLength={3000}
              id={`decision-${key}`}
              value={value}
              onChange={(e) => setter(e.target.value)}
            />
          </div>
        ))}
        <label htmlFor="decision-revisit">Revisit date</label>
        <input
          className="input"
          required
          type="date"
          id="decision-revisit"
          value={revisit}
          onChange={(e) => setRevisit(e.target.value)}
        />
        <button className="button button--secondary">Record decision</button>
      </form>
      {studio.decisions.length === 0 ? (
        <p>No decisions recorded.</p>
      ) : (
        studio.decisions.map((d) => (
          <article className="content-card" key={d.id}>
            <h3>
              {d.initiativeTitle} — {d.choice}
            </h3>
            <p>
              Owner: {d.owner}. Recorded: {d.recordedAt}. Revisit: {d.revisitOn}.
            </p>
            <p>Rationale: {d.rationale}</p>
            <p>Alternatives: {d.alternatives}</p>
            <p>Reverse condition: {d.reverseCondition}</p>
          </article>
        ))
      )}
    </div>
  );
}
