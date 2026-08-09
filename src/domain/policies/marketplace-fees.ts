import type { SourceReference } from '@/domain/registry/types';

import { addIsoDays, compareIsoDates, isIsoDate, type EffectiveDatedStatus } from './effective-dated';

export const MARKETPLACE_POLICY_AS_OF = '2026-08-10';
export const MARKETPLACE_POLICY_REVIEW_INTERVAL_DAYS = 30;

export type MarketplaceKind = 'amazon' | 'flipkart';
export type AmazonFulfillment = 'fba' | 'easy-ship' | 'self-ship';
export type AmazonCategory =
  'sandals' | 'apparel-shorts' | 'apparel-shirts' | 'beverages' | 'facewash' | 'other';
export type FlipkartFulfillment = 'fbf' | 'nfbf';
export type MarketplacePriceBand = 'under-300' | '301-500' | '501-1000' | 'above-1000';

export interface MarketplaceFeePolicy {
  id: string;
  kind: MarketplaceKind;
  effectiveFrom: string;
  lastVerifiedOn: string;
  reviewIntervalDays: number;
  sourceIds: string[];
  status: EffectiveDatedStatus;
  feeGstRatePercent: string;
  effectiveTo?: string;
  amazon?: {
    closingFees: Record<AmazonFulfillment, Record<MarketplacePriceBand, string | null>>;
    closingFeesByCategory: Record<
      AmazonCategory,
      Record<AmazonFulfillment, Record<MarketplacePriceBand, string | null>>
    >;
  };
  flipkart?: {
    fixedFees: Record<FlipkartFulfillment, Record<MarketplacePriceBand, string>>;
    // The official page requires category/payment-mode verification. Null entries
    // intentionally force the seller-dashboard override instead of inventing a rate.
    commissionFeesByCategory?: Record<string, Record<MarketplacePriceBand, string | null>>;
    collectionFeesByPaymentMode?: Record<'prepaid' | 'cod', Record<MarketplacePriceBand, string | null>>;
  };
}

export interface MarketplacePolicyFreshness {
  status: 'current' | 'stale' | 'future' | 'invalid';
  isStale: boolean;
  reviewDueOn: string;
  message: string;
}

export const MARKETPLACE_SOURCE_REFERENCES: SourceReference[] = [
  {
    id: 'amazon-india-fees-2026',
    title: 'Amazon.in seller fees and pricing',
    publisher: 'Amazon Seller Services Private Limited',
    url: 'https://sell.amazon.in/fees-and-pricing/?mons_sel_locale=en_IN',
    effectiveFrom: '2026-03-16',
    lastChecked: MARKETPLACE_POLICY_AS_OF,
    evidenceLevel: 'official',
    documentType: 'rate-schedule',
    notes:
      'Official fee structure for category referral fees, price-band closing fees, weight-handling/shipping fees and taxes on fees. Category and fulfilment terms can vary; the tool requires user overrides for those variable inputs.',
    supports: ['Amazon fee categories', 'closing-fee price bands', 'GST on displayed fees'],
  },
  {
    id: 'flipkart-seller-fees-2026',
    title: 'Flipkart seller fees and commission',
    publisher: 'Flipkart',
    url: 'https://seller.flipkart.com/fees-and-commission',
    effectiveFrom: '2026-01-01',
    lastChecked: MARKETPLACE_POLICY_AS_OF,
    evidenceLevel: 'official',
    documentType: 'rate-schedule',
    notes:
      'Official standard-rate-card guidance for fixed fees and the requirement to confirm category commission, collection and shipping charges in the seller dashboard.',
    supports: [
      'FBF/NFBF fixed-fee bands',
      'commission and collection fee caveat',
      'seller-dashboard verification',
    ],
  },
];

export const MARKETPLACE_POLICY_BUNDLE: readonly MarketplaceFeePolicy[] = [
  {
    id: 'amazon-india-fees-2026-03-16-v1',
    kind: 'amazon',
    effectiveFrom: '2026-03-16',
    lastVerifiedOn: MARKETPLACE_POLICY_AS_OF,
    reviewIntervalDays: MARKETPLACE_POLICY_REVIEW_INTERVAL_DAYS,
    sourceIds: ['amazon-india-fees-2026'],
    status: 'active',
    feeGstRatePercent: '18',
    amazon: {
      // Retained as a compatibility shape for consumers that display the policy.
      // Calculations use closingFeesByCategory so no universal fee is implied.
      closingFees: {
        fba: {
          'under-300': null,
          '301-500': null,
          '501-1000': null,
          'above-1000': null,
        },
        'easy-ship': {
          'under-300': null,
          '301-500': null,
          '501-1000': null,
          'above-1000': null,
        },
        'self-ship': {
          'under-300': null,
          '301-500': null,
          '501-1000': null,
          'above-1000': null,
        },
      },
      closingFeesByCategory: {
        sandals: {
          fba: {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
          'easy-ship': {
            'under-300': '1',
            '301-500': '22',
            '501-1000': null,
            'above-1000': null,
          },
          'self-ship': {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
        },
        'apparel-shorts': {
          fba: {
            'under-300': null,
            '301-500': '14',
            '501-1000': null,
            'above-1000': null,
          },
          'easy-ship': {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
          'self-ship': {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
        },
        'apparel-shirts': {
          fba: {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
          'easy-ship': {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
          'self-ship': {
            'under-300': null,
            '301-500': '26',
            '501-1000': null,
            'above-1000': null,
          },
        },
        beverages: {
          fba: {
            'under-300': '26',
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
          'easy-ship': {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
          'self-ship': {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
        },
        facewash: {
          fba: {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
          'easy-ship': {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
          'self-ship': {
            'under-300': '20',
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
        },
        other: {
          fba: {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
          'easy-ship': {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
          'self-ship': {
            'under-300': null,
            '301-500': null,
            '501-1000': null,
            'above-1000': null,
          },
        },
      },
    },
  },
  {
    id: 'flipkart-seller-fees-2026-01-01-v1',
    kind: 'flipkart',
    effectiveFrom: '2026-01-01',
    lastVerifiedOn: MARKETPLACE_POLICY_AS_OF,
    reviewIntervalDays: MARKETPLACE_POLICY_REVIEW_INTERVAL_DAYS,
    sourceIds: ['flipkart-seller-fees-2026'],
    status: 'active',
    feeGstRatePercent: '18',
    flipkart: {
      fixedFees: {
        fbf: {
          'under-300': '14',
          '301-500': '14',
          '501-1000': '30',
          'above-1000': '50',
        },
        nfbf: {
          'under-300': '16',
          '301-500': '16',
          '501-1000': '30',
          'above-1000': '55',
        },
      },
      commissionFeesByCategory: {
        general: {
          'under-300': null,
          '301-500': null,
          '501-1000': null,
          'above-1000': null,
        },
        fashion: {
          'under-300': null,
          '301-500': null,
          '501-1000': null,
          'above-1000': null,
        },
        home: {
          'under-300': null,
          '301-500': null,
          '501-1000': null,
          'above-1000': null,
        },
        electronics: {
          'under-300': null,
          '301-500': null,
          '501-1000': null,
          'above-1000': null,
        },
        books: {
          'under-300': null,
          '301-500': null,
          '501-1000': null,
          'above-1000': null,
        },
      },
      collectionFeesByPaymentMode: {
        prepaid: {
          'under-300': null,
          '301-500': null,
          '501-1000': null,
          'above-1000': null,
        },
        cod: {
          'under-300': null,
          '301-500': null,
          '501-1000': null,
          'above-1000': null,
        },
      },
    },
  },
];

function currentIsoDate() {
  // Policy freshness follows the India calendar, not the UTC date boundary
  // used by the hosting runtime.
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function validSourceUrl(url: string, expectedHost: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.toLowerCase() === expectedHost;
  } catch {
    return false;
  }
}

export function validateMarketplaceSourceBundle(
  sourceIds: readonly string[],
  sources: readonly SourceReference[] = MARKETPLACE_SOURCE_REFERENCES,
) {
  const errors: string[] = [];
  if (sourceIds.length === 0) errors.push('A marketplace policy must reference at least one source.');
  const sourceMap = new Map<string, SourceReference>();
  for (const source of sources) {
    if (sourceMap.has(source.id)) errors.push(`Duplicate source ID: ${source.id}`);
    sourceMap.set(source.id, source);
    const expectedHost = source.id.startsWith('amazon-')
      ? 'sell.amazon.in'
      : source.id.startsWith('flipkart-')
        ? 'seller.flipkart.com'
        : undefined;
    if (!expectedHost || !validSourceUrl(source.url, expectedHost)) {
      errors.push(`Marketplace source is not on the approved official domain: ${source.id}`);
    }
  }
  for (const sourceId of sourceIds) {
    if (!sourceMap.has(sourceId)) errors.push(`Missing marketplace source reference: ${sourceId}`);
  }
  return errors;
}

export function getMarketplaceSourceReferences(sourceIds: readonly string[]) {
  const wanted = new Set(sourceIds);
  return MARKETPLACE_SOURCE_REFERENCES.filter((source) => wanted.has(source.id));
}

export function validateMarketplacePolicyBundle(
  bundle: readonly MarketplaceFeePolicy[] = MARKETPLACE_POLICY_BUNDLE,
) {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const policy of bundle) {
    if (ids.has(policy.id)) errors.push(`Duplicate marketplace policy ID: ${policy.id}`);
    ids.add(policy.id);
    if (!isIsoDate(policy.effectiveFrom)) errors.push(`${policy.id}: invalid effectiveFrom date.`);
    if (policy.effectiveTo !== undefined && !isIsoDate(policy.effectiveTo))
      errors.push(`${policy.id}: invalid effectiveTo date.`);
    if (policy.effectiveTo && compareIsoDates(policy.effectiveFrom, policy.effectiveTo) > 0)
      errors.push(`${policy.id}: effectiveTo precedes effectiveFrom.`);
    errors.push(...validateMarketplaceSourceBundle(policy.sourceIds));
  }
  for (const left of bundle) {
    for (const right of bundle) {
      if (
        left.id >= right.id ||
        left.kind !== right.kind ||
        left.status !== 'active' ||
        right.status !== 'active'
      )
        continue;
      const leftEnds = left.effectiveTo ?? '9999-12-31';
      const rightEnds = right.effectiveTo ?? '9999-12-31';
      if (
        compareIsoDates(left.effectiveFrom, rightEnds) <= 0 &&
        compareIsoDates(right.effectiveFrom, leftEnds) <= 0
      ) {
        errors.push(`Overlapping active marketplace policies: ${left.id} and ${right.id}.`);
      }
    }
  }
  return errors;
}

export function getMarketplacePolicy(
  kind: MarketplaceKind,
  asOf: string,
  bundle: readonly MarketplaceFeePolicy[] = MARKETPLACE_POLICY_BUNDLE,
) {
  if (!isIsoDate(asOf)) return undefined;
  const policy = [...bundle]
    .filter(
      (candidate) =>
        candidate.kind === kind &&
        candidate.status === 'active' &&
        isIsoDate(candidate.effectiveFrom) &&
        (candidate.effectiveTo === undefined || isIsoDate(candidate.effectiveTo)) &&
        (candidate.effectiveTo === undefined ||
          compareIsoDates(candidate.effectiveFrom, candidate.effectiveTo) <= 0) &&
        compareIsoDates(candidate.effectiveFrom, asOf) <= 0 &&
        (candidate.effectiveTo === undefined || compareIsoDates(asOf, candidate.effectiveTo) <= 0),
    )
    .sort((left, right) => compareIsoDates(right.effectiveFrom, left.effectiveFrom))[0];
  if (!policy) return undefined;
  const sourceReferences = getMarketplaceSourceReferences(policy.sourceIds);
  return validateMarketplaceSourceBundle(policy.sourceIds, sourceReferences).length === 0
    ? policy
    : undefined;
}

export function getMarketplacePolicyFreshness(
  policy: MarketplaceFeePolicy,
  asOf = currentIsoDate(),
): MarketplacePolicyFreshness {
  const reviewDueOn = addIsoDays(policy.lastVerifiedOn, policy.reviewIntervalDays);
  if (!isIsoDate(asOf)) {
    return {
      status: 'invalid',
      isStale: true,
      reviewDueOn,
      message: 'The policy freshness date is invalid.',
    };
  }
  if (compareIsoDates(asOf, policy.lastVerifiedOn) < 0) {
    return {
      status: 'future',
      isStale: true,
      reviewDueOn,
      message: 'The selected policy snapshot is newer than the verification date.',
    };
  }
  if (compareIsoDates(asOf, reviewDueOn) > 0) {
    return {
      status: 'stale',
      isStale: true,
      reviewDueOn,
      message: `Review was due on ${reviewDueOn}; verify the current seller schedule before relying on this estimate.`,
    };
  }
  return {
    status: 'current',
    isStale: false,
    reviewDueOn,
    message: `Verified through ${policy.lastVerifiedOn}; review due on ${reviewDueOn}.`,
  };
}

export function getMarketplacePriceBand(price: string): MarketplacePriceBand {
  const numericPrice = Number(price);
  if (numericPrice <= 300) return 'under-300';
  if (numericPrice <= 500) return '301-500';
  if (numericPrice <= 1000) return '501-1000';
  return 'above-1000';
}
