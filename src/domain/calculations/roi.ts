import { z } from 'zod';

import { decimalToString, parseDecimal } from '@/domain/formatting/decimal';
import { CalculationInputError, type ValidationResult } from './types';

export const roiInputSchema = z
  .object({
    investmentCost: z.string().trim().min(1, 'Enter the investment cost.'),
    finalValue: z.string().trim().min(1, 'Enter the final value.'),
  })
  .superRefine((input, context) => {
    try {
      const cost = parseDecimal(input.investmentCost);
      if (cost.lte(0)) {
        context.addIssue({
          code: 'custom',
          path: ['investmentCost'],
          message: 'Investment cost must be greater than zero.',
        });
      }
    } catch (error) {
      context.addIssue({
        code: 'custom',
        path: ['investmentCost'],
        message: error instanceof Error ? error.message : 'Enter a valid investment cost.',
      });
    }

    try {
      const finalValue = parseDecimal(input.finalValue);
      if (finalValue.lt(0)) {
        context.addIssue({
          code: 'custom',
          path: ['finalValue'],
          message: 'Final value cannot be negative. Use zero for a complete loss.',
        });
      }
    } catch (error) {
      context.addIssue({
        code: 'custom',
        path: ['finalValue'],
        message: error instanceof Error ? error.message : 'Enter a valid final value.',
      });
    }
  });

export type RoiInput = z.infer<typeof roiInputSchema>;

export interface RoiResult {
  investmentCost: string;
  finalValue: string;
  profit: string;
  percentage: string;
  direction: 'profit' | 'loss' | 'break_even';
}

export function validateRoiInput(input: RoiInput): ValidationResult<RoiInput> {
  const parsed = roiInputSchema.safeParse(input);
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

export function calculateRoi(input: RoiInput): RoiResult {
  const investmentCost = parseDecimal(input.investmentCost);
  const finalValue = parseDecimal(input.finalValue);

  if (investmentCost.lte(0)) {
    throw new CalculationInputError(
      'investmentCost',
      'must_be_positive',
      'Investment cost must be greater than zero.',
    );
  }

  if (finalValue.lt(0)) {
    throw new CalculationInputError(
      'finalValue',
      'must_not_be_negative',
      'Final value cannot be negative. Use zero for a complete loss.',
    );
  }

  const profit = finalValue.minus(investmentCost);
  const percentage = profit.div(investmentCost).times(100);
  const direction = profit.gt(0) ? 'profit' : profit.lt(0) ? 'loss' : 'break_even';

  return {
    investmentCost: decimalToString(investmentCost),
    finalValue: decimalToString(finalValue),
    profit: decimalToString(profit),
    percentage: decimalToString(percentage),
    direction,
  };
}
