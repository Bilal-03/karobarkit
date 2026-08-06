import { z } from 'zod';

import { CalculationInputError, type ValidationResult } from '@/domain/calculations/types';
import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';
import { defaultPolicyContext, type PolicyContext } from '@/domain/policies/context';
import {
  GST_CUSTOM_RATE_ID,
  GST_POLICY_AS_OF,
  getActiveGstPolicy,
  getActiveGstRatePresets,
  getGstPolicyFreshness,
  type GstPolicyVersion,
} from '@/domain/policies/gst';

import {
  calculateGst,
  GST_AMOUNT_MAX,
  GST_RATE_MAX,
  GST_RATE_DECIMAL_PLACES,
  type GstCalculationMode,
  type GstCalculationResult,
} from './calculation';

export { calculateGst } from './calculation';
export * from './calculation';

export const gstInputSchema = z.object({
  amount: z.string(),
  ratePresetId: z.string(),
  customRate: z.string(),
  mode: z.enum(['exclusive', 'inclusive']),
  supplyType: z.enum(['intra-state', 'inter-state', 'unspecified']),
});

export type GstInput = z.infer<typeof gstInputSchema>;

export interface GstResult extends GstCalculationResult {
  rateSource: 'policy' | 'custom';
  rateLabel: string;
  policyVersion?: string;
  policyName?: string;
  policyEffectiveFrom?: string;
  policyLastVerifiedOn?: string;
  policyReviewDueOn?: string;
  policyIsStale?: boolean;
  sourceIds: string[];
  formula: string;
}

export interface ValidatedGstInput {
  input: GstInput;
  ratePercent: string;
  rateSource: 'policy' | 'custom';
  rateLabel: string;
  policy: GstPolicyVersion;
  sourceIds: string[];
}

function mapIssue(field: string, code: string, message: string) {
  return { field, code, message };
}

function validationFailure(errors: ReturnType<typeof mapIssue>[]): ValidationResult<GstInput> {
  return { success: false, errors };
}

function validateAmount(value: string, errors: ReturnType<typeof mapIssue>[]) {
  const trimmed = value.trim();
  if (!trimmed) {
    errors.push(mapIssue('amount', 'required', 'Enter the amount.'));
    return null;
  }
  try {
    const amount = parseDecimal(trimmed);
    if (amount.decimalPlaces() > 2) {
      errors.push(mapIssue('amount', 'unsafe_precision', 'Amount can have at most two decimal places.'));
    }
    if (amount.lte(0)) {
      errors.push(mapIssue('amount', 'must_be_positive', 'Amount must be greater than zero.'));
    }
    if (amount.gt(parseDecimal(GST_AMOUNT_MAX))) {
      errors.push(mapIssue('amount', 'too_large', 'Amount is above the supported practical maximum.'));
    }
    return amount;
  } catch (error) {
    errors.push(
      mapIssue(
        'amount',
        'invalid_number',
        error instanceof Error ? error.message : 'Enter a valid finite amount.',
      ),
    );
    return null;
  }
}

function validateCustomRate(value: string, errors: ReturnType<typeof mapIssue>[]) {
  const trimmed = value.trim();
  if (!trimmed) {
    errors.push(
      mapIssue('customRate', 'required', 'Enter a custom GST rate or choose a source-backed preset.'),
    );
    return null;
  }
  try {
    const rate = parseDecimal(trimmed);
    if (rate.decimalPlaces() > GST_RATE_DECIMAL_PLACES) {
      errors.push(
        mapIssue('customRate', 'unsafe_precision', 'Custom rates can have at most two decimal places.'),
      );
    }
    if (rate.lt(0)) {
      errors.push(mapIssue('customRate', 'negative_rate', 'Custom GST rate cannot be negative.'));
    }
    if (rate.gt(parseDecimal(GST_RATE_MAX))) {
      errors.push(mapIssue('customRate', 'rate_too_large', 'Custom GST rate must be 100% or less.'));
    }
    return rate;
  } catch (error) {
    errors.push(
      mapIssue(
        'customRate',
        'invalid_rate',
        error instanceof Error ? error.message : 'Enter a valid finite percentage.',
      ),
    );
    return null;
  }
}

function normalizeInput(input: GstInput): GstInput {
  return {
    amount: input.amount.trim(),
    ratePresetId: input.ratePresetId.trim(),
    customRate: input.customRate.trim(),
    mode: input.mode,
    supplyType: input.supplyType,
  };
}

export function validateGstInput(
  input: GstInput,
  asOf = defaultPolicyContext.asOf,
): ValidationResult<GstInput> {
  const parsed = gstInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure(
      parsed.error.issues.map((issue) =>
        mapIssue(String(issue.path[0] ?? 'form'), 'invalid_input', issue.message),
      ),
    );
  }

  const normalized = normalizeInput(parsed.data);
  const errors: ReturnType<typeof mapIssue>[] = [];
  validateAmount(normalized.amount, errors);

  try {
    getActiveGstPolicy(asOf);
  } catch (error) {
    errors.push(
      mapIssue(
        'ratePresetId',
        'policy_unavailable',
        error instanceof Error
          ? error.message
          : 'The current GST policy is unavailable. Try again after a reviewed update.',
      ),
    );
    return validationFailure(errors);
  }

  if (normalized.ratePresetId === GST_CUSTOM_RATE_ID) {
    validateCustomRate(normalized.customRate, errors);
  } else {
    const preset = getActiveGstRatePresets(asOf).find((rate) => rate.id === normalized.ratePresetId);
    if (!preset) {
      errors.push(
        mapIssue('ratePresetId', 'invalid_rate_preset', 'Choose a current source-backed GST rate preset.'),
      );
    }
  }

  return errors.length > 0 ? validationFailure(errors) : { success: true, data: normalized };
}

export function resolveValidatedGstInput(
  input: GstInput,
  asOf = defaultPolicyContext.asOf,
): ValidatedGstInput {
  const validation = validateGstInput(input, asOf);
  if (!validation.success) {
    const firstError = validation.errors[0];
    throw new CalculationInputError(
      firstError?.field ?? 'form',
      firstError?.code ?? 'invalid_input',
      firstError?.message ?? 'Enter valid GST calculator inputs.',
    );
  }

  const policy = getActiveGstPolicy(asOf);
  if (validation.data.ratePresetId === GST_CUSTOM_RATE_ID) {
    const customRate = parseDecimal(validation.data.customRate);
    return {
      input: validation.data,
      ratePercent: decimalToString(customRate),
      rateSource: 'custom',
      rateLabel: 'Custom rate · user supplied',
      policy,
      sourceIds: [],
    };
  }

  const preset = getActiveGstRatePresets(asOf).find((rate) => rate.id === validation.data.ratePresetId);
  if (!preset) {
    throw new CalculationInputError(
      'ratePresetId',
      'invalid_rate_preset',
      'Choose a current source-backed GST rate preset.',
    );
  }
  return {
    input: validation.data,
    ratePercent: preset.ratePercent,
    rateSource: 'policy',
    rateLabel: preset.label,
    policy,
    sourceIds: preset.sourceIds,
  };
}

function formulaFor(mode: GstCalculationMode) {
  return mode === 'exclusive'
    ? 'GST = taxable value × rate ÷ 100; total = taxable value + GST.'
    : 'Taxable value = entered total ÷ (1 + rate ÷ 100); GST = entered total − taxable value.';
}

export function calculateGstTool(input: GstInput, context: PolicyContext = defaultPolicyContext): GstResult {
  const resolved = resolveValidatedGstInput(input, context.asOf);
  const calculation = calculateGst({
    amount: resolved.input.amount,
    ratePercent: resolved.ratePercent,
    mode: resolved.input.mode,
    supplyType: resolved.input.supplyType,
  });
  const freshness = getGstPolicyFreshness(resolved.policy, context.asOf);
  return {
    ...calculation,
    rateSource: resolved.rateSource,
    rateLabel: resolved.rateLabel,
    policyVersion: resolved.policy.id,
    policyName: resolved.policy.name,
    policyEffectiveFrom: resolved.policy.effectiveFrom,
    policyLastVerifiedOn: resolved.policy.lastVerifiedOn,
    policyReviewDueOn: freshness.reviewDueOn,
    policyIsStale: freshness.isStale,
    sourceIds: resolved.sourceIds.length > 0 ? resolved.sourceIds : resolved.policy.sourceIds,
    formula: formulaFor(resolved.input.mode),
  };
}

export function getGstRateOptions(asOf = GST_POLICY_AS_OF) {
  return [
    ...getActiveGstRatePresets(asOf).map((rate) => ({ value: rate.id, label: rate.label, help: rate.scope })),
    {
      value: GST_CUSTOM_RATE_ID,
      label: 'Custom rate · not policy-verified',
      help: 'You are responsible for choosing the correct rate; classification is not validated.',
    },
  ];
}
