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
};
