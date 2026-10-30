import { afterEach, expect, it, vi } from 'vitest';

import { safeLogger } from '@/lib/security/safe-logger';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it('logs only fixed AI outcome categories in production', () => {
  vi.stubEnv('NODE_ENV', 'production');
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  safeLogger.aiOutcome({
    assistant: 'business-name',
    provider: 'groq',
    outcome: 'provider-timeout',
    attempted: true,
    elapsedMs: 2_500,
  });
  expect(info).toHaveBeenCalledWith('[KarobarKit] ai_gateway_outcome', {
    assistant: 'business-name',
    provider: 'groq',
    outcome: 'provider-timeout',
    attempted: true,
    latencyBucket: '2000-6000ms',
  });
});
