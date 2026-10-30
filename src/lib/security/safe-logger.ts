interface SafeLogContext {
  feature?: string;
  digest?: string;
  code?: string;
}

function safeContext(context: SafeLogContext) {
  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => typeof value === 'string' && value.length < 200),
  );
}

export const safeLogger = {
  error(message: string, context: SafeLogContext = {}) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[KarobarKit] ${message}`, safeContext(context));
    }
  },
  info(message: string, context: SafeLogContext = {}) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[KarobarKit] ${message}`, safeContext(context));
    }
  },
  aiOutcome({
    assistant,
    provider,
    outcome,
    attempted,
    elapsedMs,
  }: {
    assistant: string;
    provider: 'groq' | 'gemini' | 'multiple' | 'none';
    outcome: string;
    attempted: boolean;
    elapsedMs: number;
  }) {
    if (process.env.NODE_ENV !== 'production') return;
    const latencyBucket =
      elapsedMs < 500
        ? 'under-500ms'
        : elapsedMs < 2_000
          ? '500-2000ms'
          : elapsedMs < 6_000
            ? '2000-6000ms'
            : 'over-6000ms';
    // Fixed categories only: never log prompts, metrics, IPs, provider keys or response text.
    console.info('[KarobarKit] ai_gateway_outcome', {
      assistant,
      provider,
      outcome,
      attempted,
      latencyBucket,
    });
  },
};
