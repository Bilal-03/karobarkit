export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export type EffectiveDatedStatus = 'active' | 'historical' | 'provisional';

export interface EffectiveDateRange {
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface EffectiveDatedVersion extends EffectiveDateRange {
  id: string;
  status: EffectiveDatedStatus;
  lastVerifiedOn: string;
}

export interface EffectiveDatedBundle<TVersion extends EffectiveDatedVersion> {
  policies: readonly TVersion[];
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function compareIsoDates(left: string, right: string) {
  return left.localeCompare(right);
}

export function isEffectiveOn(range: EffectiveDateRange, asOf: string) {
  return (
    compareIsoDates(range.effectiveFrom, asOf) <= 0 &&
    (!range.effectiveTo || compareIsoDates(asOf, range.effectiveTo) <= 0)
  );
}

export function effectiveDateRangesOverlap(left: EffectiveDateRange, right: EffectiveDateRange) {
  const leftEnd = left.effectiveTo ?? '9999-12-31';
  const rightEnd = right.effectiveTo ?? '9999-12-31';
  return (
    compareIsoDates(left.effectiveFrom, rightEnd) <= 0 && compareIsoDates(right.effectiveFrom, leftEnd) <= 0
  );
}

export function selectEffectiveVersion<TVersion extends EffectiveDatedVersion>(
  bundle: EffectiveDatedBundle<TVersion>,
  asOf: string,
) {
  if (!isIsoDate(asOf)) return undefined;
  const matches = bundle.policies.filter(
    (policy) => policy.status === 'active' && isEffectiveOn(policy, asOf),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function addIsoDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetweenIsoDates(left: string, right: string) {
  const milliseconds = new Date(`${right}T00:00:00Z`).getTime() - new Date(`${left}T00:00:00Z`).getTime();
  return Math.floor(milliseconds / 86_400_000);
}
