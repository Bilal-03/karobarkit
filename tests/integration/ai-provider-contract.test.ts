import { describe, expect, it } from 'vitest';
import { loadEnvConfig } from '@next/env';

import { generateAssistantDraft } from '@/domain/ai/gateway';

const liveProviderTestsEnabled = process.env.PHASE6_LIVE_PROVIDER_TESTS === '1';
const providerEnvironmentKeys = [
  'AI_PROVIDER',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'GROQ_API_KEY',
  'GROQ_MODEL',
] as const;

function loadLiveProviderEnvironment() {
  const mutableEnvironment = process.env as Record<string, string | undefined>;
  const previousEnvironment = { ...process.env };
  // Next intentionally ignores `.env.local` when NODE_ENV=test; use its development
  // loading mode here because this is an explicit, opt-in live-provider check.
  const previousNodeEnvironment = mutableEnvironment.NODE_ENV;
  mutableEnvironment.NODE_ENV = 'development';
  const loadedEnvironment = loadEnvConfig(process.cwd(), true).combinedEnv;
  if (previousNodeEnvironment === undefined) delete mutableEnvironment.NODE_ENV;
  else mutableEnvironment.NODE_ENV = previousNodeEnvironment;

  for (const key of providerEnvironmentKeys) {
    if (previousEnvironment[key] === undefined && loadedEnvironment[key] !== undefined) {
      process.env[key] = loadedEnvironment[key];
    }
  }

  return () => {
    for (const key of Object.keys(process.env)) {
      if (!(key in previousEnvironment)) delete process.env[key];
    }
    for (const [key, value] of Object.entries(previousEnvironment)) {
      process.env[key] = value;
    }
  };
}

describe.skipIf(!liveProviderTestsEnabled)('Phase 6 live provider contract (opt-in)', () => {
  it('returns a schema-validated draft through the configured provider', async () => {
    const restoreEnvironment = loadLiveProviderEnvironment();
    try {
      const result = await generateAssistantDraft({
        kind: 'business-name',
        input: {
          businessType: 'Local snack delivery',
          location: 'Pune',
          language: 'english',
          tone: 'modern',
          keywords: 'fresh, local',
          avoid: '',
        },
        redactedFields: [],
        transmittedFields: ['businessType', 'location', 'language', 'tone', 'keywords', 'avoid'],
      });
      expect(result.result.reviewRequired).toBe(true);
      expect(result.result.provider).not.toBe('deterministic-fallback');
      expect(result.result.title.length).toBeGreaterThan(0);
    } finally {
      restoreEnvironment();
    }
  }, 20_000);
});
