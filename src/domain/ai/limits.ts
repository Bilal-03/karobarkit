export const AI_MAX_INPUT_CHARS = 6000;
export const AI_MAX_OUTPUT_TOKENS = 700;
export const AI_RATE_WINDOW_MS = 10 * 60 * 1000;
export const AI_RATE_LIMIT = 8;
export const AI_RATE_MAX_BUCKETS = 10_000;
export const AI_PROVIDER_TIMEOUT_MS = 6_000;
export const AI_GATEWAY_DEADLINE_MS = 13_500;
export const AI_PROVIDER_DEFAULT_DAILY_REQUEST_LIMIT = 250;
export const AI_PROVIDER_CIRCUIT_FAILURE_THRESHOLD = 3;
export const AI_PROVIDER_CIRCUIT_COOLDOWN_MS = 60_000;

interface RateBucket {
  count: number;
  resetAt: number;
}

export interface AIAccessDecision {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();
const providerBudgets = new Map<string, { day: string; count: number }>();
const providerCircuits = new Map<string, { failures: number; openUntil: number }>();

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size <= AI_RATE_MAX_BUCKETS) return;
  const oldest = [...buckets.entries()]
    .sort(([, first], [, second]) => first.resetAt - second.resetAt)
    .slice(0, buckets.size - AI_RATE_MAX_BUCKETS);
  for (const [key] of oldest) buckets.delete(key);
}

export function consumeAIAccess(key: string, now = Date.now()): AIAccessDecision {
  pruneExpiredBuckets(now);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + AI_RATE_WINDOW_MS };
    buckets.set(key, next);
    return { allowed: true, remaining: AI_RATE_LIMIT - 1, resetAt: next.resetAt };
  }

  if (current.count >= AI_RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { allowed: true, remaining: AI_RATE_LIMIT - current.count, resetAt: current.resetAt };
}

export function consumeAIProviderBudget(provider: string, now = Date.now()) {
  const limitValue = Number.parseInt(process.env.AI_PROVIDER_DAILY_REQUEST_LIMIT ?? '', 10);
  const limit =
    Number.isFinite(limitValue) && limitValue > 0 ? limitValue : AI_PROVIDER_DEFAULT_DAILY_REQUEST_LIMIT;
  const day = new Date(now).toISOString().slice(0, 10);
  const current = providerBudgets.get(provider);
  if (!current || current.day !== day) {
    providerBudgets.set(provider, { day, count: 1 });
    return { allowed: true, remaining: limit - 1 };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0 };
  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}

export function isAIProviderCircuitOpen(provider: string, now = Date.now()) {
  const circuit = providerCircuits.get(provider);
  if (!circuit) return false;
  if (circuit.openUntil <= now) {
    providerCircuits.delete(provider);
    return false;
  }
  return true;
}

export function recordAIProviderSuccess(provider: string) {
  providerCircuits.delete(provider);
}

export function recordAIProviderFailure(provider: string, now = Date.now()) {
  const current = providerCircuits.get(provider) ?? { failures: 0, openUntil: 0 };
  current.failures += 1;
  if (current.failures >= AI_PROVIDER_CIRCUIT_FAILURE_THRESHOLD)
    current.openUntil = now + AI_PROVIDER_CIRCUIT_COOLDOWN_MS;
  providerCircuits.set(provider, current);
}

/**
 * A deployment may provide a small atomic HTTP counter for multi-instance
 * enforcement. The local bounded map remains the safe development/public-beta
 * fallback; production deployments should configure the shared endpoint.
 */
export async function consumeAIAccessForRequest(key: string, now = Date.now()): Promise<AIAccessDecision> {
  const endpoint = process.env.AI_RATE_LIMIT_SHARED_ENDPOINT?.trim();
  if (!endpoint) return consumeAIAccess(key, now);
  const token = process.env.AI_RATE_LIMIT_SHARED_TOKEN?.trim();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ key, now, limit: AI_RATE_LIMIT, windowMs: AI_RATE_WINDOW_MS }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`rate_limit_store_http_${response.status}`);
  const body = (await response.json()) as Partial<AIAccessDecision>;
  if (
    typeof body.allowed !== 'boolean' ||
    typeof body.remaining !== 'number' ||
    typeof body.resetAt !== 'number' ||
    !Number.isFinite(body.remaining) ||
    !Number.isFinite(body.resetAt)
  ) {
    throw new Error('rate_limit_store_invalid_response');
  }
  return {
    allowed: body.allowed,
    remaining: Math.max(0, Math.floor(body.remaining)),
    resetAt: body.resetAt,
  };
}

export function assistantInputSize(input: Record<string, string>) {
  return Object.entries(input).reduce((total, [key, value]) => total + key.length + value.length, 0);
}

export function resetAIAccessBucketsForTests() {
  buckets.clear();
  providerBudgets.clear();
  providerCircuits.clear();
}
