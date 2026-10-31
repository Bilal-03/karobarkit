import { describe, it, expect } from 'vitest';
import {
  blankStudio,
  newExperiment,
  newInitiative,
  experimentSchema,
  initiativeSchema,
  decisionSchema,
  rankInitiatives,
  studioSchema,
} from '@/domain/product-studio';
import { blankWorkspace, parseWorkspace } from '@/domain/workspace';
describe('product planning contracts', () => {
  it('requires experiment design and evidence labels without inventing results', () => {
    expect(experimentSchema.safeParse(newExperiment()).success).toBe(false);
    const e = {
      ...newExperiment(),
      title: 'Task entry',
      problem: 'Discovery',
      hypothesis: 'Task entry may help',
      change: 'Task-based homepage',
      audience: 'Visitors',
      primaryMetric: 'Exporting sessions / started sessions',
      guardrails: 'No new export errors',
      duration: 'Two weeks; eligibility specified before launch',
      stopping: 'Stop if exports fail',
    };
    expect(experimentSchema.safeParse(e).success).toBe(true);
    expect(experimentSchema.safeParse({ ...e, status: 'observed' }).success).toBe(false);
    expect(
      experimentSchema.safeParse({
        ...e,
        status: 'simulated',
        evidence: 'Invented dataset; not actual participants.',
      }).success,
    ).toBe(true);
  });
  it('changes ranking when strategic assumptions change and handles zero confidence', () => {
    const a = {
      ...newInitiative(),
      title: 'A',
      benefit: 'Conversion',
      evidence: 'Assumption',
      reach: 100,
      impact: 3,
      confidence: 100,
      effort: 1,
      fit: 1,
    };
    const b = {
      ...newInitiative(),
      title: 'B',
      benefit: 'Time saved',
      evidence: 'Assumption',
      reach: 80,
      impact: 3,
      confidence: 100,
      effort: 1,
      fit: 5,
    };
    expect(rankInitiatives([a, b], 0)[0].title).toBe('A');
    expect(rankInitiatives([a, b], 2)[0].title).toBe('B');
    expect(rankInitiatives([{ ...a, confidence: 0 }], 1)[0].score).toBe(0);
    expect(() => rankInitiatives([{ ...a, effort: 0 }], 1)).toThrow();
    expect(initiativeSchema.safeParse({ ...a, confidence: 101 }).success).toBe(false);
    expect(() => rankInitiatives([a], NaN)).toThrow();
  });
  it('supports old business backups and preserves new studio records in backup round trips', () => {
    const old = blankWorkspace();
    delete (old as Partial<typeof old>).studio;
    expect(parseWorkspace(JSON.stringify(old)).studio).toEqual(blankStudio());
    const w = blankWorkspace();
    w.studio.fitWeight = 2;
    expect(parseWorkspace(JSON.stringify(w)).studio.fitWeight).toBe(2);
    expect(studioSchema.safeParse({ ...blankStudio(), fitWeight: 3 }).success).toBe(false);
  });
  it('requires decision rationale, alternatives, ownership and a real revisit date', () => {
    const d = {
      id: crypto.randomUUID(),
      initiativeId: crypto.randomUUID(),
      initiativeTitle: 'Entry flow',
      recordedAt: new Date().toISOString(),
      owner: 'Project owner',
      choice: 'investigate',
      rationale: 'Limited evidence',
      alternatives: 'Cloud login deferred',
      reverseCondition: 'Repeated actual use',
      revisitOn: '2026-12-01',
    };
    expect(decisionSchema.safeParse(d).success).toBe(true);
    expect(decisionSchema.safeParse({ ...d, revisitOn: '2026-02-30' }).success).toBe(false);
    expect(decisionSchema.safeParse({ ...d, alternatives: '' }).success).toBe(false);
  });
});
