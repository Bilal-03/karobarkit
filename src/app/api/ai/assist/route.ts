import { createHash } from 'node:crypto';

import { z } from 'zod';

import { aiAssistantKinds, getAssistantInputErrorSummary, validateAssistantInput } from '@/domain/ai';
import { generateAssistantDraft, prepareAssistantInput } from '@/domain/ai/gateway';
import { AI_MAX_INPUT_CHARS, assistantInputSize, consumeAIAccessForRequest } from '@/domain/ai/limits';
import { PHASE6_FEATURE_FLAG } from '@/domain/registry/tools/phase6';
import { isFeatureFlagEnabled } from '@/domain/registry/feature-flags';
import { safeLogger } from '@/lib/security/safe-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const requestSchema = z
  .object({
    assistant: z.enum(aiAssistantKinds),
    input: z.record(z.string(), z.unknown()),
    consent: z.literal(true),
  })
  .strict();

const MAX_REQUEST_BYTES = 24_000;

function responseHeaders(remaining?: number, resetAt?: number) {
  return {
    'Cache-Control': 'no-store, max-age=0',
    ...(remaining === undefined ? {} : { 'X-AI-RateLimit-Remaining': String(remaining) }),
    ...(resetAt === undefined
      ? {}
      : {
          'X-AI-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
          'Retry-After': String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))),
        }),
  };
}

function requestKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const source = forwarded || request.headers.get('x-real-ip') || 'anonymous';
  return createHash('sha256').update(source).digest('hex').slice(0, 24);
}

function errorResponse(message: string, status: number, remaining?: number, resetAt?: number) {
  return Response.json(
    { ok: false, error: message },
    { status, headers: responseHeaders(remaining, resetAt) },
  );
}

async function readLimitedBody(request: Request) {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) {
        await reader.cancel('request too large');
        throw new Error('request_too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function POST(request: Request) {
  if (!isFeatureFlagEnabled(PHASE6_FEATURE_FLAG)) {
    return errorResponse('AI assistants are not enabled in this deployment.', 404);
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES)
    return errorResponse('This request is too large. Shorten the brief and try again.', 413);

  let access: Awaited<ReturnType<typeof consumeAIAccessForRequest>>;
  try {
    access = await consumeAIAccessForRequest(requestKey(request));
  } catch (error) {
    safeLogger.error('AI rate-limit store unavailable', {
      feature: 'phase6-ai-rate-limit',
      digest: createHash('sha256')
        .update(error instanceof Error ? error.message : 'rate-limit-store-error')
        .digest('hex')
        .slice(0, 16),
    });
    return errorResponse('The assistant is temporarily unavailable. Please try again shortly.', 503);
  }
  if (!access.allowed) {
    return errorResponse(
      'The assistant limit has been reached. Try again after the rate window resets.',
      429,
      0,
      access.resetAt,
    );
  }

  let body: unknown;
  try {
    const rawBody = await readLimitedBody(request);
    body = JSON.parse(rawBody);
  } catch (error) {
    if (error instanceof Error && error.message === 'request_too_large')
      return errorResponse(
        'This request is too large. Shorten the brief and try again.',
        413,
        access.remaining,
      );
    return errorResponse('Send a valid JSON request.', 400, access.remaining);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      'Choose an assistant, complete its fields and accept the data-use notice.',
      400,
      access.remaining,
    );
  }

  const validation = validateAssistantInput(parsed.data.assistant, parsed.data.input);
  if (!validation.success) {
    return Response.json(
      {
        ok: false,
        error: getAssistantInputErrorSummary(validation.errors),
        fieldErrors: validation.errors,
      },
      { status: 422, headers: responseHeaders(access.remaining) },
    );
  }

  const prepared = prepareAssistantInput(parsed.data.assistant, validation.data);
  if (prepared.blockedFields.length > 0) {
    return Response.json(
      {
        ok: false,
        error: 'Remove confidential financial identifiers or credentials before sending the brief.',
        fieldErrors: prepared.blockedFields.map((field) => ({
          field: field.split(':')[0],
          code: 'sensitive_data_not_allowed',
          message: 'Do not enter bank, identity, payment or credential data in this assistant.',
        })),
      },
      { status: 422, headers: responseHeaders(access.remaining) },
    );
  }
  if (assistantInputSize(prepared.input) > AI_MAX_INPUT_CHARS) {
    return errorResponse('Shorten the brief before sending it to the assistant.', 413, access.remaining);
  }

  try {
    const generated = await generateAssistantDraft({
      kind: parsed.data.assistant,
      input: prepared.input,
      redactedFields: prepared.redactedFields,
      transmittedFields: prepared.transmittedFields,
    });
    return Response.json(
      {
        ok: true,
        result: generated.result,
        providerAttempted: generated.providerAttempted,
        fallbackReason: generated.fallbackReason,
      },
      { headers: responseHeaders(access.remaining) },
    );
  } catch (error) {
    safeLogger.error('AI gateway failed before fallback', {
      feature: 'phase6-ai-gateway',
      digest: createHash('sha256')
        .update(error instanceof Error ? error.message : 'unknown')
        .digest('hex')
        .slice(0, 16),
    });
    return errorResponse(
      'The assistant could not complete that request. Try the deterministic draft again.',
      503,
      access.remaining,
    );
  }
}
