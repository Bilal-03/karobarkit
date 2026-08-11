import { z } from 'zod';

import { CalculationInputError, type ValidationResult } from '@/domain/calculations/types';
import { validationFromSchema } from '@/domain/calculations/utilities/shared';

export const passwordModes = ['generate', 'assess'] as const;
export type PasswordMode = (typeof passwordModes)[number];

export const passwordToolkitInputSchema = z.object({
  mode: z.enum(passwordModes),
  length: z.string(),
  includeLowercase: z.boolean(),
  includeUppercase: z.boolean(),
  includeNumbers: z.boolean(),
  includeSymbols: z.boolean(),
  strengthInput: z.string().max(512),
});

export type PasswordToolkitInput = z.infer<typeof passwordToolkitInputSchema>;

export interface PasswordStrengthResult {
  label: 'Very weak' | 'Weak' | 'Moderate' | 'Strong' | 'Very strong';
  entropyBits: number;
  feedback: string[];
}

export interface PasswordToolkitResult extends PasswordStrengthResult {
  mode: PasswordMode;
  password: string | null;
}

const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numbers = '0123456789';
const symbols = '!@#$%^&*()-_=+[]{}:,.?';

function getPool(input: PasswordToolkitInput) {
  return [
    input.includeLowercase ? lowercase : '',
    input.includeUppercase ? uppercase : '',
    input.includeNumbers ? numbers : '',
    input.includeSymbols ? symbols : '',
  ].join('');
}

function labelForEntropy(entropyBits: number): PasswordStrengthResult['label'] {
  if (entropyBits >= 80) return 'Very strong';
  if (entropyBits >= 60) return 'Strong';
  if (entropyBits >= 40) return 'Moderate';
  if (entropyBits >= 28) return 'Weak';
  return 'Very weak';
}

export function estimatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  const poolSize =
    (/[a-z]/u.test(password) ? 26 : 0) +
    (/[A-Z]/u.test(password) ? 26 : 0) +
    (/\d/u.test(password) ? 10 : 0) +
    (/[^A-Za-z0-9]/u.test(password) ? 28 : 0);
  const entropyBits = password.length * (poolSize > 0 ? Math.log2(poolSize) : 0);
  if (password.length < 12) feedback.push('Use at least 12 characters for a stronger estimate.');
  if (!/[a-z]/u.test(password)) feedback.push('Add lowercase letters.');
  if (!/[A-Z]/u.test(password)) feedback.push('Add uppercase letters.');
  if (!/\d/u.test(password)) feedback.push('Add numbers.');
  if (!/[^A-Za-z0-9]/u.test(password)) feedback.push('Add symbols.');
  if (/(.)\1{2,}/u.test(password)) feedback.push('Avoid repeated characters.');
  const commonPattern = /^(?:password|qwerty|letmein|admin|welcome)/iu.test(password);
  if (commonPattern) {
    feedback.push('Avoid common password patterns.');
  }
  return {
    label: commonPattern ? 'Very weak' : labelForEntropy(entropyBits),
    entropyBits: Math.round(entropyBits * 100) / 100,
    feedback,
  };
}

function parseLength(value: string) {
  if (!/^\d+$/u.test(value.trim()))
    throw new CalculationInputError('length', 'invalid_input', 'Length must be a whole number.');
  const length = Number(value);
  if (length < 8 || length > 128)
    throw new CalculationInputError('length', 'out_of_range', 'Use a length between 8 and 128 characters.');
  return length;
}

export function validatePasswordToolkitInput(
  input: PasswordToolkitInput,
): ValidationResult<PasswordToolkitInput> {
  const parsed = validationFromSchema(passwordToolkitInputSchema, input);
  if (!parsed.success) return parsed;
  if (parsed.data.mode === 'assess') {
    if (parsed.data.strengthInput.length === 0) {
      return {
        success: false,
        errors: [
          { field: 'strengthInput', code: 'required', message: 'Enter a password to assess locally.' },
        ],
      };
    }
    return parsed;
  }
  try {
    parseLength(parsed.data.length);
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          field: 'length',
          code: error instanceof CalculationInputError ? error.code : 'invalid_input',
          message: error instanceof Error ? error.message : 'Enter a valid length.',
        },
      ],
    };
  }
  if (!getPool(parsed.data)) {
    return {
      success: false,
      errors: [
        { field: 'characterOptions', code: 'required', message: 'Choose at least one character group.' },
      ],
    };
  }
  return parsed;
}

function randomIndex(cryptoSource: Pick<Crypto, 'getRandomValues'>, length: number) {
  const max = 0x100000000;
  const limit = max - (max % length);
  const buffer = new Uint32Array(1);
  do cryptoSource.getRandomValues(buffer);
  while (buffer[0] >= limit);
  return buffer[0] % length;
}

export function generatePassword(
  input: PasswordToolkitInput,
  cryptoSource?: Pick<Crypto, 'getRandomValues'>,
) {
  const length = parseLength(input.length);
  const pool = getPool(input);
  const source = cryptoSource ?? (typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : undefined);
  if (!source?.getRandomValues) {
    throw new CalculationInputError(
      'form',
      'crypto_unavailable',
      'Web Crypto is unavailable in this browser; secure password generation cannot continue.',
    );
  }
  const required = [
    input.includeLowercase ? lowercase : '',
    input.includeUppercase ? uppercase : '',
    input.includeNumbers ? numbers : '',
    input.includeSymbols ? symbols : '',
  ].filter(Boolean);
  const chars = required.map((group) => group[randomIndex(source, group.length)]);
  while (chars.length < length) chars.push(pool[randomIndex(source, pool.length)]);
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(source, index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }
  return chars.join('');
}

export function calculatePasswordToolkit(
  input: PasswordToolkitInput,
  cryptoSource?: Pick<Crypto, 'getRandomValues'>,
): PasswordToolkitResult {
  const validation = validatePasswordToolkitInput(input);
  if (!validation.success) {
    const first = validation.errors[0];
    throw new CalculationInputError(first.field, first.code, first.message);
  }
  if (validation.data.mode === 'assess') {
    const strength = estimatePasswordStrength(validation.data.strengthInput);
    return { ...strength, mode: 'assess', password: null };
  }
  const password = generatePassword(validation.data, cryptoSource);
  return { ...estimatePasswordStrength(password), mode: 'generate', password };
}
