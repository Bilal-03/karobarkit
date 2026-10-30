import { createHash } from 'node:crypto';

import { safeLogger } from '@/lib/security/safe-logger';

import {
  AI_DRAFT_JSON_SCHEMA,
  buildAssistantSystemInstruction,
  buildAssistantPrompt,
  fallbackAssistant,
  getAssistantNumericAuthority,
  mergeProviderDraft,
  providerOutputFromText,
  redactAssistantInput,
  type AIAssistantInput,
  type AIAssistantKind,
  type AIAssistantProvider,
  type AIAssistantResult,
} from './index';
import {
  AI_GATEWAY_DEADLINE_MS,
  AI_BUSINESS_PLAN_OUTPUT_TOKENS,
  AI_MAX_OUTPUT_TOKENS,
  AI_PROVIDER_TIMEOUT_MS,
  consumeAIProviderBudget,
  isAIProviderCircuitOpen,
  recordAIProviderFailure,
  recordAIProviderSuccess,
} from './limits';

interface ProviderConfig {
  provider: Exclude<AIAssistantProvider, 'deterministic-fallback'>;
  key: string;
  model: string;
  groqStructuredMode?: 'strict' | 'json_object';
}

interface GatewayInput {
  kind: AIAssistantKind;
  input: AIAssistantInput;
  redactedFields: string[];
  transmittedFields: string[];
}

export interface GatewayResult {
  result: AIAssistantResult;
  providerAttempted: boolean;
  fallbackReason?:
    | 'not-configured'
    | 'provider-error'
    | 'invalid-provider-output'
    | 'provider-budget'
    | 'provider-circuit-open'
    | 'provider-deadline'
    | 'provider-timeout'
    | 'provider-rate-limited';
}

export interface AIProviderStatus {
  enabled: boolean;
  mode: 'gemini' | 'groq' | 'multiple' | 'deterministic-fallback';
  providers: Array<{ provider: Exclude<AIAssistantProvider, 'deterministic-fallback'>; model: string }>;
}

function providerConfigs(): ProviderConfig[] {
  const requested = process.env.AI_PROVIDER?.trim().toLowerCase() || 'auto';
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const configs: ProviderConfig[] = [];

  if ((requested === 'auto' || requested === 'gemini') && geminiKey) {
    configs.push({
      provider: 'gemini',
      key: geminiKey,
      model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
    });
  }
  if ((requested === 'auto' || requested === 'groq') && groqKey) {
    const model = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b';
    configs.push({
      provider: 'groq',
      key: groqKey,
      model,
      groqStructuredMode: GROQ_STRICT_STRUCTURED_MODELS.has(model) ? 'strict' : 'json_object',
    });
  }
  return configs;
}

const GROQ_STRICT_STRUCTURED_MODELS = new Set(['openai/gpt-oss-20b', 'openai/gpt-oss-120b']);
const GROQ_REASONING_MODELS = new Set(['openai/gpt-oss-20b', 'openai/gpt-oss-120b']);

export function getAIProviderStatus(): AIProviderStatus {
  const providers = providerConfigs().map(({ provider, model }) => ({ provider, model }));
  return {
    enabled: providers.length > 0,
    mode:
      providers.length === 0
        ? 'deterministic-fallback'
        : providers.length > 1
          ? 'multiple'
          : providers[0].provider,
    providers,
  };
}

function timeoutSignal(milliseconds: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), milliseconds);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

function outputTokenLimit(kind: AIAssistantKind) {
  return kind === 'business-plan-assistant' ? AI_BUSINESS_PLAN_OUTPUT_TOKENS : AI_MAX_OUTPUT_TOKENS;
}

async function readJsonResponse(response: Response) {
  if (!response.ok) {
    throw new Error(`provider_http_${response.status}`);
  }
  return (await response.json()) as unknown;
}

function textFromProviderBody(provider: ProviderConfig['provider'], body: unknown) {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  if (provider === 'gemini') {
    const candidates = Array.isArray(record.candidates) ? record.candidates : [];
    const candidate = candidates[0];
    if (!candidate || typeof candidate !== 'object') return null;
    const content = (candidate as Record<string, unknown>).content;
    if (!content || typeof content !== 'object') return null;
    const parts = (content as Record<string, unknown>).parts;
    if (!Array.isArray(parts)) return null;
    return parts
      .map((part) => (part && typeof part === 'object' ? (part as Record<string, unknown>).text : null))
      .filter((part): part is string => typeof part === 'string')
      .join('');
  }

  const choices = Array.isArray(record.choices) ? record.choices : [];
  const choice = choices[0];
  if (!choice || typeof choice !== 'object') return null;
  const message = (choice as Record<string, unknown>).message;
  if (!message || typeof message !== 'object') return null;
  const text = (message as Record<string, unknown>).content;
  return typeof text === 'string' ? text : null;
}

async function callGemini(
  config: ProviderConfig,
  kind: AIAssistantKind,
  input: AIAssistantInput,
  deterministic: AIAssistantResult,
  remainingMilliseconds: number,
) {
  const timeout = timeoutSignal(Math.min(AI_PROVIDER_TIMEOUT_MS, remainingMilliseconds));
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.key,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: buildAssistantSystemInstruction(kind) }] },
          contents: [{ parts: [{ text: buildAssistantPrompt(kind, input, deterministic.metrics) }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: outputTokenLimit(kind),
            responseFormat: {
              text: {
                mimeType: 'application/json',
                schema: AI_DRAFT_JSON_SCHEMA,
              },
            },
          },
          store: false,
        }),
        signal: timeout.signal,
      },
    );
    const body = await readJsonResponse(response);
    return providerOutputFromText(textFromProviderBody('gemini', body) ?? '');
  } finally {
    timeout.clear();
  }
}

async function callGroq(
  config: ProviderConfig,
  kind: AIAssistantKind,
  input: AIAssistantInput,
  deterministic: AIAssistantResult,
  remainingMilliseconds: number,
) {
  const timeout = timeoutSignal(Math.min(AI_PROVIDER_TIMEOUT_MS, remainingMilliseconds));
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: buildAssistantSystemInstruction(kind),
          },
          { role: 'user', content: buildAssistantPrompt(kind, input, deterministic.metrics) },
        ],
        temperature: 0.35,
        max_completion_tokens: outputTokenLimit(kind),
        ...(GROQ_REASONING_MODELS.has(config.model) ? { reasoning_effort: 'low' } : {}),
        response_format: {
          ...(config.groqStructuredMode === 'strict'
            ? {
                type: 'json_schema',
                json_schema: {
                  name: 'karobarkit_assistant_draft',
                  strict: true,
                  schema: AI_DRAFT_JSON_SCHEMA,
                },
              }
            : { type: 'json_object' }),
        },
      }),
      signal: timeout.signal,
    });
    const body = await readJsonResponse(response);
    return providerOutputFromText(textFromProviderBody('groq', body) ?? '');
  } finally {
    timeout.clear();
  }
}

function fallbackWithNotice(
  input: GatewayInput,
  reason: GatewayResult['fallbackReason'],
  provider?: AIAssistantProvider,
) {
  const result = fallbackAssistant(input.kind, input.input, {
    provider: provider ?? 'deterministic-fallback',
    redactedFields: input.redactedFields,
    transmittedFields: input.transmittedFields,
  });
  const warning =
    reason === 'not-configured'
      ? 'No Gemini or Groq server key is configured, so this deterministic draft is shown.'
      : reason === 'invalid-provider-output'
        ? 'The provider response did not match the safety schema, so the deterministic draft is shown.'
        : reason === 'provider-budget'
          ? 'The provider daily budget is exhausted, so this deterministic draft is shown.'
          : reason === 'provider-circuit-open'
            ? 'The provider is temporarily paused after repeated failures, so this deterministic draft is shown.'
            : reason === 'provider-deadline'
              ? 'The provider did not have enough time to complete this request, so this deterministic draft is shown.'
              : reason === 'provider-timeout'
                ? 'The provider request timed out, so this deterministic draft is shown.'
                : reason === 'provider-rate-limited'
                  ? 'The provider rate limit was reached, so this deterministic draft is shown.'
                  : 'The configured AI provider was unavailable, so the deterministic draft is shown.';
  return { ...result, warnings: [...result.warnings, warning] };
}

export async function generateAssistantDraft(input: GatewayInput): Promise<GatewayResult> {
  const startedAt = Date.now();
  const configs = providerConfigs();
  const deterministic = fallbackAssistant(input.kind, input.input, {
    redactedFields: input.redactedFields,
    transmittedFields: input.transmittedFields,
  });
  if (configs.length === 0) {
    safeLogger.aiOutcome({
      assistant: input.kind,
      provider: 'none',
      outcome: 'not-configured',
      attempted: false,
      elapsedMs: Date.now() - startedAt,
    });
    return {
      result: fallbackWithNotice(input, 'not-configured'),
      providerAttempted: false,
      fallbackReason: 'not-configured',
    };
  }
  let invalidProviderOutput = false;
  let providerBudgetExhausted = false;
  let providerCircuitOpen = false;
  let providerAttempted = false;
  let providerDeadlineReached = false;
  let providerTimedOut = false;
  let providerRateLimited = false;
  const deadline = Date.now() + AI_GATEWAY_DEADLINE_MS;
  const approvedNumbers = getAssistantNumericAuthority(input.input, deterministic.metrics);

  for (const config of configs) {
    const remainingMilliseconds = deadline - Date.now();
    if (remainingMilliseconds <= 250) {
      providerDeadlineReached = true;
      break;
    }
    if (isAIProviderCircuitOpen(config.provider)) {
      providerCircuitOpen = true;
      continue;
    }
    const budget = consumeAIProviderBudget(config.provider);
    if (!budget.allowed) {
      providerBudgetExhausted = true;
      continue;
    }
    try {
      providerAttempted = true;
      const draft =
        config.provider === 'gemini'
          ? await callGemini(config, input.kind, input.input, deterministic, remainingMilliseconds - 100)
          : await callGroq(config, input.kind, input.input, deterministic, remainingMilliseconds - 100);
      if (draft) {
        const merged = mergeProviderDraft(deterministic, draft, config.provider, {
          approvedNumbers,
          language: input.input.language,
        });
        const mergedWasRejected = merged.provider === 'deterministic-fallback';
        if (mergedWasRejected) {
          invalidProviderOutput = true;
          recordAIProviderFailure(config.provider);
          safeLogger.info('AI provider draft failed numeric or safety validation', {
            feature: `phase6-${config.provider}`,
          });
          continue;
        }
        recordAIProviderSuccess(config.provider);
        safeLogger.aiOutcome({
          assistant: input.kind,
          provider: config.provider,
          outcome: 'success',
          attempted: true,
          elapsedMs: Date.now() - startedAt,
        });
        return {
          result: merged,
          providerAttempted: true,
        };
      }
      invalidProviderOutput = true;
      recordAIProviderFailure(config.provider);
      safeLogger.info('AI provider output failed schema validation', {
        feature: `phase6-${config.provider}`,
      });
    } catch (error) {
      recordAIProviderFailure(config.provider);
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
        providerTimedOut = true;
      if (error instanceof Error && error.message === 'provider_http_429') providerRateLimited = true;
      const digest = createHash('sha256')
        .update(error instanceof Error ? error.message : 'provider-error')
        .digest('hex')
        .slice(0, 16);
      safeLogger.error('AI provider request failed', { feature: `phase6-${config.provider}`, digest });
    }
  }

  const fallbackReason: GatewayResult['fallbackReason'] = providerBudgetExhausted
    ? 'provider-budget'
    : invalidProviderOutput
      ? 'invalid-provider-output'
      : providerCircuitOpen && !providerAttempted
        ? 'provider-circuit-open'
        : providerDeadlineReached && !providerAttempted
          ? 'provider-deadline'
          : providerRateLimited
            ? 'provider-rate-limited'
            : providerTimedOut
              ? 'provider-timeout'
              : 'provider-error';
  const safeFallback = fallbackWithNotice(input, fallbackReason);
  safeLogger.aiOutcome({
    assistant: input.kind,
    provider: configs.length === 1 ? configs[0].provider : 'multiple',
    outcome: fallbackReason,
    attempted: providerAttempted,
    elapsedMs: Date.now() - startedAt,
  });
  return {
    result: safeFallback,
    providerAttempted,
    fallbackReason,
  };
}

export function prepareAssistantInput(kind: AIAssistantKind, input: unknown) {
  const redacted = redactAssistantInput(kind, input);
  return {
    ...redacted,
    transmittedFields: Object.keys(redacted.input),
  };
}
