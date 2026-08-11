import { daysBetweenIsoDates, isIsoDate } from './effective-dated';

export const REGULATED_UTILITIES_FEATURE_FLAG = 'regulated-utilities-wave';
export const REGULATED_UTILITIES_KILL_SWITCH_ENV = 'NEXT_PUBLIC_REGULATED_UTILITIES_KILL_SWITCH';
export const REGULATED_UTILITIES_LAST_REVIEWED = '2026-08-11';
export const REGULATED_UTILITIES_REVIEW_CADENCE_DAYS = 31;

export type RegulatedPolicyKey =
  'hsn' | 'gst-calendar' | 'depreciation' | 'professional-tax' | 'msme' | 'currency';

export const regulatedPolicyReviews: Record<
  RegulatedPolicyKey,
  { lastVerifiedOn: string; reviewCadenceDays: number }
> = {
  hsn: { lastVerifiedOn: '2026-08-11', reviewCadenceDays: 90 },
  'gst-calendar': { lastVerifiedOn: '2026-08-11', reviewCadenceDays: 31 },
  depreciation: { lastVerifiedOn: '2026-08-11', reviewCadenceDays: 180 },
  'professional-tax': { lastVerifiedOn: '2026-08-11', reviewCadenceDays: 90 },
  msme: { lastVerifiedOn: '2026-08-11', reviewCadenceDays: 90 },
  currency: { lastVerifiedOn: '2026-08-11', reviewCadenceDays: 7 },
};

export type RegulatedPolicyState = 'fresh' | 'stale' | 'future' | 'withdrawn' | 'invalid';

export function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function regulatedPolicyState(
  lastVerifiedOn: string,
  today = currentIsoDate(),
  status: 'active' | 'withdrawn' = 'active',
  reviewCadenceDays = REGULATED_UTILITIES_REVIEW_CADENCE_DAYS,
): RegulatedPolicyState {
  if (status === 'withdrawn') return 'withdrawn';
  if (!isIsoDate(lastVerifiedOn) || !isIsoDate(today)) return 'invalid';
  if (lastVerifiedOn > today) return 'future';
  return daysBetweenIsoDates(lastVerifiedOn, today) <= reviewCadenceDays ? 'fresh' : 'stale';
}

export function regulatedPolicyMessage(state: RegulatedPolicyState) {
  if (state === 'fresh') return 'Reviewed bundled policy snapshot.';
  if (state === 'future')
    return 'This policy snapshot is dated in the future and is disabled until reviewed.';
  if (state === 'stale') return 'This policy snapshot is stale and is disabled until reviewed.';
  if (state === 'withdrawn') return 'This policy snapshot has been withdrawn and is disabled.';
  return 'This policy snapshot has an invalid review date and is disabled.';
}

export function isRegulatedUtilitiesKillSwitchEnabled(
  value = process.env[REGULATED_UTILITIES_KILL_SWITCH_ENV],
) {
  return ['1', 'true', 'on', 'yes'].includes((value ?? '').trim().toLowerCase());
}

export const approvedOfficialPolicyHosts = [
  'cbic-gst.gov.in',
  'gst.gov.in',
  'mca.gov.in',
  'incometaxindia.gov.in',
  'mahagst.gov.in',
  'msme.gov.in',
  'ramp.msme.gov.in',
  'rbi.org.in',
  'ecb.europa.eu',
  'data.ecb.europa.eu',
] as const;

export function isApprovedOfficialPolicyUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      approvedOfficialPolicyHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
    );
  } catch {
    return false;
  }
}

export function validateOfficialPolicyUrls(urls: readonly string[]) {
  return urls.every((url) => isApprovedOfficialPolicyUrl(url));
}
