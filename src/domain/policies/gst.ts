import { parseDecimal } from '@/domain/formatting/decimal';
import type { SourceAuthority, SourceDocumentType, SourceReference } from '@/domain/registry/types';

import {
  addIsoDays,
  compareIsoDates,
  daysBetweenIsoDates,
  effectiveDateRangesOverlap,
  isEffectiveOn,
  isIsoDate,
  selectEffectiveVersion,
  type EffectiveDatedStatus,
} from './effective-dated';

export const GST_POLICY_AS_OF = '2026-08-08';
export const GST_POLICY_REVIEW_INTERVAL_DAYS = 180;
export const GST_CUSTOM_RATE_ID = 'custom';

export type GstPolicyStatus = EffectiveDatedStatus;

export interface RegulatorySource {
  id: string;
  authority: SourceAuthority;
  title: string;
  documentType: SourceDocumentType;
  referenceNumber?: string;
  publishedOn?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  officialUrl: string;
  accessedOn: string;
  notes?: string;
  supports: string[];
}

export interface GstRatePreset {
  id: string;
  label: string;
  ratePercent: string;
  effectiveFrom: string;
  effectiveTo?: string;
  sourceIds: string[];
  status: GstPolicyStatus;
  scope: string;
  duplicateExplanation?: string;
}

export interface GstPolicyVersion {
  id: string;
  name: string;
  effectiveFrom: string;
  effectiveTo?: string;
  lastVerifiedOn: string;
  sourceIds: string[];
  ratePresets: GstRatePreset[];
  status: GstPolicyStatus;
}

export interface GstPolicyBundle {
  sources: RegulatorySource[];
  policies: GstPolicyVersion[];
}

export interface PolicyValidationError {
  code: string;
  path: string;
  message: string;
}

export type PolicyValidationResult = { success: true } | { success: false; errors: PolicyValidationError[] };

export interface GstPolicyFreshness {
  isStale: boolean;
  reviewDueOn: string;
  daysUntilReview: number;
}

export const GST_REGULATORY_SOURCES: RegulatorySource[] = [
  {
    id: 'gst-cbic-notification-09-2025-ctr',
    authority: 'CBIC',
    title: 'Notification No. 09/2025-Central Tax (Rate)',
    documentType: 'notification',
    referenceNumber: '09/2025-Central Tax (Rate)',
    publishedOn: '2025-09-17',
    effectiveFrom: '2025-09-22',
    officialUrl: 'https://taxinformation.cbic.gov.in/view-pdf/1010436/ENG/Notifications',
    accessedOn: GST_POLICY_AS_OF,
    notes:
      'Notified central-tax rate schedule. This source does not make the calculator a product or service classification tool.',
    supports: ['post-reform rate schedule context', 'effective-date verification'],
  },
  {
    id: 'gst-council-56th-meeting-2025',
    authority: 'GST_COUNCIL',
    title: '56th GST Council meeting press release',
    documentType: 'press-release',
    referenceNumber: 'Release ID 2163555',
    publishedOn: '2025-09-03',
    effectiveFrom: '2025-09-22',
    officialUrl:
      'https://gstcouncil.gov.in/sites/default/files/2025-09/press_release_press_information_bureau.pdf',
    accessedOn: GST_POLICY_AS_OF,
    notes:
      'Council recommendations and implementation timing. The release itself says relevant notifications and law amendments give the recommendations legal effect.',
    supports: ['headline rate structure', 'effective-date context', 'regulatory limitations'],
  },
  {
    id: 'gst-pib-reforms-2025',
    authority: 'OTHER_GOVERNMENT',
    title: 'GST Reforms 2025: Relief for Common Man, Boost for Businesses',
    documentType: 'press-release',
    publishedOn: '2025-09-04',
    effectiveFrom: '2025-09-22',
    officialUrl:
      'https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/sep/doc202594628401.pdf',
    accessedOn: GST_POLICY_AS_OF,
    notes:
      'Government overview of the primarily 5% and 18% structure and the many item-specific changes and exemptions.',
    supports: ['headline rate structure', 'classification limitation'],
  },
  {
    id: 'gst-pib-current-summary-2026',
    authority: 'OTHER_GOVERNMENT',
    title: 'Nine Years of GST: Simplifying Taxation, Strengthening India',
    documentType: 'press-release',
    publishedOn: '2026-06-30',
    effectiveFrom: '2025-09-22',
    officialUrl:
      'https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jul/doc202671908001.pdf',
    accessedOn: GST_POLICY_AS_OF,
    notes:
      'Current Government summary reviewed after the 2025 reforms. It describes 5% and 18% as the primary slabs and 40% for specified luxury and sin goods.',
    supports: ['current headline-rate verification', 'CGST/SGST and IGST context', 'special-rate exclusion'],
  },
  {
    id: 'gst-council-april-2026-rate-update',
    authority: 'GST_COUNCIL',
    title: 'GST Council April 2026 newsletter',
    documentType: 'rate-schedule',
    referenceNumber: '01/2026-Central Tax (Rate)',
    publishedOn: '2026-05-01',
    effectiveFrom: '2026-05-01',
    officialUrl: 'https://gstcouncil.gov.in/sites/default/files/2026-05/newsletter_april_issue.pdf',
    accessedOn: GST_POLICY_AS_OF,
    notes:
      'Reports a subsequent beverage-classification amendment. It is included to show that current policy review considers later updates without attempting item classification.',
    supports: ['subsequent-update review', 'classification limitation'],
  },
];

export const GST_POLICY_BUNDLE: GstPolicyBundle = {
  sources: GST_REGULATORY_SOURCES,
  policies: [
    {
      id: 'gst-general-rates-2025-09-22-v1',
      name: 'GST general headline rates · unclassified calculator',
      effectiveFrom: '2025-09-22',
      lastVerifiedOn: GST_POLICY_AS_OF,
      sourceIds: GST_REGULATORY_SOURCES.map((source) => source.id),
      status: 'active',
      ratePresets: [
        {
          id: 'gst-headline-rate-5',
          label: '5% · current headline rate',
          ratePercent: '5',
          effectiveFrom: '2025-09-22',
          sourceIds: [
            'gst-cbic-notification-09-2025-ctr',
            'gst-council-56th-meeting-2025',
            'gst-pib-current-summary-2026',
          ],
          status: 'active',
          scope: 'A source-backed headline choice; classification and eligibility are not assessed.',
        },
        {
          id: 'gst-headline-rate-18',
          label: '18% · current headline rate',
          ratePercent: '18',
          effectiveFrom: '2025-09-22',
          sourceIds: [
            'gst-cbic-notification-09-2025-ctr',
            'gst-council-56th-meeting-2025',
            'gst-pib-current-summary-2026',
          ],
          status: 'active',
          scope: 'A source-backed headline choice; classification and eligibility are not assessed.',
        },
      ],
    },
  ],
};

export const GST_UI_RATE_PRESET_IDS = ['gst-headline-rate-5', 'gst-headline-rate-18'] as const;

export class GstPolicyError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'GstPolicyError';
    this.code = code;
  }
}

const AUTHORITY_HOSTS: Record<SourceAuthority, readonly string[]> = {
  CBIC: ['cbic-gst.gov.in', 'www.cbic-gst.gov.in', 'taxinformation.cbic.gov.in'],
  GST_COUNCIL: ['gstcouncil.gov.in', 'www.gstcouncil.gov.in'],
  GST_PORTAL: ['gst.gov.in', 'www.gst.gov.in'],
  OTHER_GOVERNMENT: ['pib.gov.in', 'www.pib.gov.in', 'static.pib.gov.in'],
};

export function isSupportedOfficialUrl(url: unknown, authority: unknown): url is string {
  if (typeof url !== 'string' || typeof authority !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return (AUTHORITY_HOSTS[authority as SourceAuthority] ?? []).includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function validateGstPolicyBundle(
  bundle: GstPolicyBundle,
  asOf = GST_POLICY_AS_OF,
): PolicyValidationResult {
  const errors: PolicyValidationError[] = [];
  const sources = Array.isArray(bundle?.sources) ? bundle.sources : [];
  const policies = Array.isArray(bundle?.policies) ? bundle.policies : [];
  const sourceIds = new Set<string>();

  if (!isIsoDate(asOf)) {
    errors.push({
      code: 'invalid_as_of',
      path: 'asOf',
      message: 'Policy validation requires a valid ISO date.',
    });
  }

  for (const [index, source] of sources.entries()) {
    const path = `sources.${index}`;
    if (!source?.id)
      errors.push({ code: 'missing_source_id', path, message: 'A source must have a stable ID.' });
    if (source?.id && sourceIds.has(source.id)) {
      errors.push({ code: 'duplicate_source_id', path: `${path}.id`, message: 'Source IDs must be unique.' });
    }
    if (source?.id) sourceIds.add(source.id);
    if (!source?.authority) {
      errors.push({
        code: 'missing_source_authority',
        path: `${path}.authority`,
        message: 'A source must name its authority.',
      });
    }
    if (!source?.title) {
      errors.push({
        code: 'missing_source_title',
        path: `${path}.title`,
        message: 'A source must have a title.',
      });
    }
    if (!source?.officialUrl) {
      errors.push({
        code: 'missing_official_url',
        path: `${path}.officialUrl`,
        message: 'A source must have an official URL.',
      });
    } else if (!isSupportedOfficialUrl(source.officialUrl, source.authority)) {
      errors.push({
        code: 'unsupported_source_domain',
        path: `${path}.officialUrl`,
        message: 'A source URL must be HTTPS on a supported official Government domain for its authority.',
      });
    }
    if (!isIsoDate(source?.accessedOn)) {
      errors.push({
        code: 'missing_last_reviewed',
        path: `${path}.accessedOn`,
        message: 'A source must have an accessed date.',
      });
    }
    for (const field of ['publishedOn', 'effectiveFrom', 'effectiveTo'] as const) {
      if (source?.[field] !== undefined && !isIsoDate(source[field])) {
        errors.push({
          code: 'invalid_source_date',
          path: `${path}.${field}`,
          message: `${field} must be a valid ISO date.`,
        });
      }
    }
  }

  const policyIds = new Set<string>();
  for (const [index, policy] of policies.entries()) {
    const path = `policies.${index}`;
    if (!policy?.id)
      errors.push({ code: 'missing_policy_id', path, message: 'A policy must have a stable ID.' });
    if (policy?.id && policyIds.has(policy.id)) {
      errors.push({ code: 'duplicate_policy_id', path: `${path}.id`, message: 'Policy IDs must be unique.' });
    }
    if (policy?.id) policyIds.add(policy.id);
    if (!isIsoDate(policy?.effectiveFrom)) {
      errors.push({
        code: 'missing_policy_effective_from',
        path: `${path}.effectiveFrom`,
        message: 'A policy must have an effective start date.',
      });
    }
    if (policy?.effectiveTo !== undefined && !isIsoDate(policy.effectiveTo)) {
      errors.push({
        code: 'invalid_policy_effective_to',
        path: `${path}.effectiveTo`,
        message: 'A policy end date must be valid.',
      });
    }
    if (!isIsoDate(policy?.lastVerifiedOn)) {
      errors.push({
        code: 'missing_last_reviewed',
        path: `${path}.lastVerifiedOn`,
        message: 'A policy must have a last-verified date.',
      });
    }
    if (!['active', 'historical', 'provisional'].includes(policy?.status)) {
      errors.push({
        code: 'invalid_policy_status',
        path: `${path}.status`,
        message: 'A policy status is invalid.',
      });
    }
    if (
      policy?.status === 'active' &&
      policy.effectiveTo &&
      isIsoDate(asOf) &&
      compareIsoDates(policy.effectiveTo, asOf) < 0
    ) {
      errors.push({
        code: 'expired_active_policy',
        path: `${path}.status`,
        message: 'An expired policy cannot be marked active.',
      });
    }
    for (const sourceId of policy?.sourceIds ?? []) {
      if (!sourceIds.has(sourceId)) {
        errors.push({
          code: 'missing_policy_source',
          path: `${path}.sourceIds`,
          message: `Policy source ${sourceId} is not registered.`,
        });
      }
    }

    const rateIds = new Set<string>();
    const rateValues = new Map<string, GstRatePreset>();
    for (const [rateIndex, rate] of (policy?.ratePresets ?? []).entries()) {
      const ratePath = `${path}.ratePresets.${rateIndex}`;
      if (!rate?.id)
        errors.push({
          code: 'missing_rate_id',
          path: ratePath,
          message: 'A rate preset must have a stable ID.',
        });
      if (rate?.id && rateIds.has(rate.id)) {
        errors.push({
          code: 'duplicate_rate_id',
          path: `${ratePath}.id`,
          message: 'Rate preset IDs must be unique.',
        });
      }
      if (rate?.id) rateIds.add(rate.id);
      if (!isIsoDate(rate?.effectiveFrom)) {
        errors.push({
          code: 'missing_rate_effective_from',
          path: `${ratePath}.effectiveFrom`,
          message: 'An active rate must have an effective start date.',
        });
      }
      if (rate?.effectiveTo !== undefined && !isIsoDate(rate.effectiveTo)) {
        errors.push({
          code: 'invalid_rate_effective_to',
          path: `${ratePath}.effectiveTo`,
          message: 'A rate end date must be valid.',
        });
      }
      if (!rate?.sourceIds?.length) {
        errors.push({
          code: 'rate_without_source',
          path: `${ratePath}.sourceIds`,
          message: 'A rate cannot exist without at least one source.',
        });
      }
      for (const sourceId of rate?.sourceIds ?? []) {
        if (!sourceIds.has(sourceId)) {
          errors.push({
            code: 'missing_rate_source',
            path: `${ratePath}.sourceIds`,
            message: `Rate source ${sourceId} is not registered.`,
          });
        }
      }
      if (
        rate?.status === 'active' &&
        rate.effectiveTo &&
        isIsoDate(asOf) &&
        compareIsoDates(rate.effectiveTo, asOf) < 0
      ) {
        errors.push({
          code: 'expired_active_rate',
          path: `${ratePath}.status`,
          message: 'An expired rate cannot be marked active.',
        });
      }
      try {
        const rateValue = parseDecimal(rate?.ratePercent ?? '');
        if (rateValue.lt(0) || rateValue.gt(100)) {
          errors.push({
            code: 'invalid_rate_range',
            path: `${ratePath}.ratePercent`,
            message: 'A policy rate must be between 0% and 100%.',
          });
        }
        const key = rateValue.toFixed(6);
        const previous = rateValues.get(key);
        if (previous && !rate?.duplicateExplanation) {
          errors.push({
            code: 'duplicate_rate_without_explanation',
            path: `${ratePath}.ratePercent`,
            message: 'Duplicate rate values require an explicit scope explanation.',
          });
        }
        if (!previous) rateValues.set(key, rate);
      } catch {
        errors.push({
          code: 'invalid_rate_value',
          path: `${ratePath}.ratePercent`,
          message: 'A policy rate must be a finite decimal percentage.',
        });
      }
      if (!['active', 'historical', 'provisional'].includes(rate?.status)) {
        errors.push({
          code: 'invalid_rate_status',
          path: `${ratePath}.status`,
          message: 'A rate status is invalid.',
        });
      }
    }
  }

  const activePolicies = policies.filter((policy) => policy.status === 'active');
  for (let leftIndex = 0; leftIndex < activePolicies.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < activePolicies.length; rightIndex += 1) {
      const left = activePolicies[leftIndex];
      const right = activePolicies[rightIndex];
      if (left && right && effectiveDateRangesOverlap(left, right)) {
        errors.push({
          code: 'overlapping_active_policies',
          path: 'policies',
          message: 'Active policy versions overlap unexpectedly.',
        });
      }
    }
  }

  if (isIsoDate(asOf)) {
    const currentPolicies = activePolicies.filter((policy) => isEffectiveOn(policy, asOf));
    if (currentPolicies.length === 0) {
      errors.push({
        code: 'missing_active_policy',
        path: 'policies',
        message: 'No active GST policy covers the requested date.',
      });
    }
    if (currentPolicies.length === 1) {
      const currentRates = currentPolicies[0]?.ratePresets.filter(
        (rate) => rate.status === 'active' && isEffectiveOn(rate, asOf),
      );
      if (!currentRates?.length) {
        errors.push({
          code: 'missing_active_rates',
          path: 'policies',
          message: 'The active GST policy has no rate covering the requested date.',
        });
      }
    }
  }

  return errors.length === 0 ? { success: true } : { success: false, errors };
}

export function getActiveGstPolicy(asOf = GST_POLICY_AS_OF): GstPolicyVersion {
  const validation = validateGstPolicyBundle(GST_POLICY_BUNDLE, asOf);
  if (!validation.success) {
    throw new GstPolicyError(
      'invalid_policy_bundle',
      validation.errors.map((error) => error.message).join(' '),
    );
  }
  const activePolicy = selectEffectiveVersion(GST_POLICY_BUNDLE, asOf);
  if (!activePolicy) {
    throw new GstPolicyError('missing_active_policy', 'No single active GST policy covers this date.');
  }
  return activePolicy;
}

export function getActiveGstRatePresets(asOf = GST_POLICY_AS_OF) {
  const policy = getActiveGstPolicy(asOf);
  return policy.ratePresets.filter((rate) => rate.status === 'active' && isEffectiveOn(rate, asOf));
}

export function getGstSourceById(sourceId: string) {
  return GST_POLICY_BUNDLE.sources.find((source) => source.id === sourceId);
}

export function getGstSourceReferences(asOf = GST_POLICY_AS_OF): SourceReference[] {
  const policy = getActiveGstPolicy(asOf);
  const ids = new Set(policy.sourceIds);
  return GST_POLICY_BUNDLE.sources
    .filter((source) => ids.has(source.id))
    .map((source) => ({
      id: source.id,
      title: source.title,
      publisher:
        source.authority === 'CBIC'
          ? 'Central Board of Indirect Taxes and Customs'
          : source.authority === 'GST_COUNCIL'
            ? 'Goods and Services Tax Council'
            : 'Press Information Bureau, Government of India',
      url: source.officialUrl,
      effectiveFrom: source.effectiveFrom,
      effectiveTo: source.effectiveTo,
      lastChecked: source.accessedOn,
      evidenceLevel: 'official' as const,
      authority: source.authority,
      documentType: source.documentType,
      referenceNumber: source.referenceNumber,
      publishedOn: source.publishedOn,
      accessedOn: source.accessedOn,
      notes: source.notes,
      supports: source.supports,
    }));
}

export function validateGstUiPresetIds(
  ids: readonly string[],
  asOf = GST_POLICY_AS_OF,
): PolicyValidationResult {
  const expected = getActiveGstRatePresets(asOf)
    .map((rate) => rate.id)
    .sort();
  const actual = [...ids].sort();
  return JSON.stringify(expected) === JSON.stringify(actual)
    ? { success: true }
    : {
        success: false,
        errors: [
          {
            code: 'ui_policy_mismatch',
            path: 'ui.ratePresets',
            message: 'The visible rate presets do not match the active GST policy.',
          },
        ],
      };
}

export function getGstPolicyFreshness(policy: GstPolicyVersion, asOf = GST_POLICY_AS_OF): GstPolicyFreshness {
  const reviewDueOn = addIsoDays(policy.lastVerifiedOn, GST_POLICY_REVIEW_INTERVAL_DAYS);
  return {
    isStale: compareIsoDates(asOf, reviewDueOn) > 0,
    reviewDueOn,
    daysUntilReview: daysBetweenIsoDates(asOf, reviewDueOn),
  };
}
