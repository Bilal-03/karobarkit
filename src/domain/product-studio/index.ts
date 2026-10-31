import { z } from 'zod';
const text = z
  .string()
  .trim()
  .min(1, 'Complete the required planning fields.')
  .max(3000, 'Keep each planning field to 3,000 characters or fewer.');
export const experimentSchema = z
  .object({
    id: z.string().uuid(),
    title: text,
    problem: text,
    hypothesis: text,
    change: text,
    audience: text,
    primaryMetric: text,
    guardrails: text,
    duration: text,
    stopping: text,
    status: z.enum(['planned', 'simulated', 'observed', 'inconclusive']),
    evidence: z.string().trim().max(5000),
    decision: z.string().trim().max(3000),
  })
  .strict()
  .superRefine((e, ctx) => {
    if (e.status !== 'planned' && !e.evidence)
      ctx.addIssue({
        code: 'custom',
        message: 'Describe the simulated assumptions or observed evidence before changing evidence status.',
      });
  });
export type Experiment = z.infer<typeof experimentSchema>;
export const initiativeSchema = z
  .object({
    id: z.string().uuid(),
    title: text,
    benefit: text,
    evidence: text,
    reach: z.number().min(0).max(10000000),
    impact: z.number().min(1).max(5),
    confidence: z.number().min(0).max(100),
    effort: z.number().min(0.25).max(365),
    fit: z.number().min(1).max(5),
  })
  .strict();
export type Initiative = z.infer<typeof initiativeSchema>;
export const decisionSchema = z
  .object({
    id: z.string().uuid(),
    initiativeId: z.string().uuid(),
    initiativeTitle: text,
    recordedAt: z.string().datetime(),
    owner: text,
    choice: z.enum(['build', 'defer', 'reject', 'investigate']),
    rationale: text,
    alternatives: text,
    reverseCondition: text,
    revisitOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
        'Choose a real calendar date.',
      ),
  })
  .strict();
export type Decision = z.infer<typeof decisionSchema>;
export const studioSchema = z
  .object({
    experiments: z.array(experimentSchema).max(30),
    initiatives: z.array(initiativeSchema).max(30),
    decisions: z.array(decisionSchema).max(100),
    fitWeight: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  })
  .strict()
  .superRefine((s, ctx) => {
    for (const records of [s.experiments, s.initiatives, s.decisions])
      if (new Set(records.map((r) => r.id)).size !== records.length)
        ctx.addIssue({ code: 'custom', message: 'Duplicate record IDs are not supported.' });
  });
export type Studio = z.infer<typeof studioSchema>;
export const blankStudio = (): Studio => ({ experiments: [], initiatives: [], decisions: [], fitWeight: 1 });
export const newExperiment = (): Experiment => ({
  id: crypto.randomUUID(),
  title: '',
  problem: '',
  hypothesis: '',
  change: '',
  audience: '',
  primaryMetric: '',
  guardrails: '',
  duration: '',
  stopping: '',
  status: 'planned',
  evidence: '',
  decision: '',
});
export const newInitiative = (): Initiative => ({
  id: crypto.randomUUID(),
  title: '',
  benefit: '',
  evidence: '',
  reach: 0,
  impact: 3,
  confidence: 50,
  effort: 1,
  fit: 3,
});
export function rankInitiatives(initiatives: readonly Initiative[], fitWeight: number) {
  if (!Number.isFinite(fitWeight) || fitWeight < 0 || fitWeight > 2)
    throw new Error('Strategic weight must be between 0 and 2.');
  return initiatives
    .map((i) => {
      initiativeSchema.parse(i);
      return {
        ...i,
        score: (i.reach * i.impact * (i.confidence / 100) * Math.pow(i.fit / 3, fitWeight)) / i.effort,
      };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}
