import { z } from 'zod';
import Decimal from 'decimal.js';

import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';
import { CalculationInputError, type ValidationResult } from './types';

export const cagrInputSchema = z
  .object({
    beginningValue: z.string().trim().min(1, 'Enter the beginning value.'),
    endingValue: z.string().trim().min(1, 'Enter the ending value.'),
    years: z.string().trim().min(1, 'Enter the duration in years.'),
  })
  .superRefine((input, context) => {
    const fields = [
      ['beginningValue', input.beginningValue, 'Beginning value'],
      ['endingValue', input.endingValue, 'Ending value'],
      ['years', input.years, 'Duration'],
    ] as const;

    for (const [field, value, label] of fields) {
      try {
        parseDecimal(value);
      } catch (error) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: error instanceof Error ? error.message : `Enter a valid ${label.toLowerCase()}.`,
        });
      }
    }

    try {
      const beginning = parseDecimal(input.beginningValue);
      if (beginning.lte(0)) {
        context.addIssue({
          code: 'custom',
          path: ['beginningValue'],
          message: 'Beginning value must be greater than zero for CAGR.',
        });
      }
    } catch {
      // The field-level issue above gives the user the useful message.
    }

    try {
      const ending = parseDecimal(input.endingValue);
      if (ending.lte(0)) {
        context.addIssue({
          code: 'custom',
          path: ['endingValue'],
          message: 'Ending value must be greater than zero for CAGR.',
        });
      }
    } catch {
      // The field-level issue above gives the user the useful message.
    }

    try {
      const years = parseDecimal(input.years);
      if (years.lte(0)) {
        context.addIssue({
          code: 'custom',
          path: ['years'],
          message: 'Duration must be greater than zero.',
        });
      }
    } catch {
      // The field-level issue above gives the user the useful message.
    }
  });

export type CagrInput = z.infer<typeof cagrInputSchema>;

export interface CagrResult {
  beginningValue: string;
  endingValue: string;
  years: string;
  rate: string;
  percentage: string;
  direction: 'growth' | 'decline' | 'flat';
}

export function validateCagrInput(input: CagrInput): ValidationResult<CagrInput> {
  const parsed = cagrInputSchema.safeParse(input);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  return {
    success: false,
    errors: parsed.error.issues.map((issue) => ({
      field: String(issue.path[0] ?? 'form'),
      code: 'invalid_input',
      message: issue.message,
    })),
  };
}

export function calculateCagr(input: CagrInput): CagrResult {
  const beginning = parseDecimal(input.beginningValue);
  const ending = parseDecimal(input.endingValue);
  const years = parseDecimal(input.years);

  if (beginning.lte(0)) {
    throw new CalculationInputError(
      'beginningValue',
      'must_be_positive',
      'Beginning value must be greater than zero for CAGR.',
    );
  }

  if (ending.lte(0)) {
    throw new CalculationInputError(
      'endingValue',
      'must_be_positive',
      'Ending value must be greater than zero for CAGR.',
    );
  }

  if (years.lte(0)) {
    throw new CalculationInputError('years', 'must_be_positive', 'Duration must be greater than zero.');
  }

  let rate;
  try {
    rate = ending.div(beginning).pow(new Decimal(1).div(years)).minus(1);
  } catch {
    throw new CalculationInputError(
      'form',
      'calculation_failed',
      'These values are outside the safe calculation range. Try smaller values.',
    );
  }

  const percentage = rate.times(100);
  const direction = percentage.gt(0) ? 'growth' : percentage.lt(0) ? 'decline' : 'flat';

  return {
    beginningValue: decimalToString(beginning),
    endingValue: decimalToString(ending),
    years: decimalToString(years),
    rate: decimalToString(rate),
    percentage: decimalToString(percentage),
    direction,
  };
}
