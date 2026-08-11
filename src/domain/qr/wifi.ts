import { z } from 'zod';

import type { ValidationResult } from '@/domain/calculations/types';

import { QrInputError } from './types';

export const WIFI_FIELD_MAX_LENGTH = 128;
export const WIFI_SECURITY_TYPES = ['WPA', 'WEP', 'nopass'] as const;
export type WifiSecurity = (typeof WIFI_SECURITY_TYPES)[number];

const controlCharacterPattern = /[\u0000-\u001F\u007F]/u;

export const wifiInputSchema = z
  .object({
    ssid: z.string(),
    security: z.enum(WIFI_SECURITY_TYPES),
    password: z.string(),
    hidden: z.boolean(),
  })
  .superRefine((input, context) => {
    const ssid = input.ssid.trim();
    const password = input.password;
    if (!ssid) context.addIssue({ code: 'custom', path: ['ssid'], message: 'Enter the Wi-Fi network name.' });
    if (Array.from(ssid).length > WIFI_FIELD_MAX_LENGTH) {
      context.addIssue({
        code: 'custom',
        path: ['ssid'],
        message: `Keep the SSID to ${WIFI_FIELD_MAX_LENGTH} characters or fewer.`,
      });
    }
    if (controlCharacterPattern.test(ssid)) {
      context.addIssue({
        code: 'custom',
        path: ['ssid'],
        message: 'SSID cannot contain control characters or line breaks.',
      });
    }
    if (input.security !== 'nopass' && password.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'Enter the network password or choose an open network.',
      });
    }
    if (Array.from(password).length > WIFI_FIELD_MAX_LENGTH) {
      context.addIssue({
        code: 'custom',
        path: ['password'],
        message: `Keep the password to ${WIFI_FIELD_MAX_LENGTH} characters or fewer.`,
      });
    }
    if (controlCharacterPattern.test(password)) {
      context.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'Password cannot contain control characters or line breaks.',
      });
    }
  });

export type WifiInput = z.infer<typeof wifiInputSchema>;

export interface WifiResult {
  payload: string;
  security: WifiSecurity;
  ssid: string;
  passwordPresent: boolean;
}

function escapeWifiValue(value: string) {
  return value.replace(/\\/gu, '\\\\').replace(/([;,:"])/gu, '\\$1');
}

export function validateWifiInput(input: WifiInput): ValidationResult<WifiInput> {
  const parsed = wifiInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? 'form'),
        code: `invalid_${String(issue.path[0] ?? 'input')}`,
        message: issue.message,
      })),
    };
  }
  return {
    success: true,
    data: { ...parsed.data, ssid: parsed.data.ssid.trim() },
  };
}

export function calculateWifi(input: WifiInput): WifiResult {
  const validation = validateWifiInput(input);
  if (!validation.success) {
    const firstError = validation.errors[0];
    throw new QrInputError(firstError.field, firstError.code, firstError.message);
  }
  const value = validation.data;
  const payload = `WIFI:T:${value.security};S:${escapeWifiValue(value.ssid)};P:${escapeWifiValue(value.password)};H:${value.hidden ? 'true' : 'false'};;`;
  return { payload, security: value.security, ssid: value.ssid, passwordPresent: Boolean(value.password) };
}

export { escapeWifiValue };
