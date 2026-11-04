export interface LogContext {
  traceId?: string;
  userId?: string;
  workspaceId?: string;
  action?: string;
  durationMs?: number;
  [key: string]: unknown;
}

let traceIdCounter = 0;
const traceIdMap = new WeakMap<object, string>();

export function getTraceId(request?: Request | { headers: Headers }): string {
  if (request) {
    const existing = request.headers.get('x-trace-id');
    if (existing) return existing;
    const newId = crypto.randomUUID();
    request.headers.set('x-trace-id', newId);
    return newId;
  }
  // Fallback for non-request contexts
  return `trace-${Date.now()}-${++traceIdCounter}`;
}

export function withTraceId<T>(traceId: string, fn: () => T): T {
  const prev = traceIdMap.get(globalThis);
  traceIdMap.set(globalThis, traceId);
  try {
    return fn();
  } finally {
    if (prev) traceIdMap.set(globalThis, prev);
    else traceIdMap.delete(globalThis);
  }
}

/**
 * Redacts sensitive fields from log context before writing to stdout.
 * Prevents tokens, passwords, and secrets from appearing in Vercel/Sentry logs.
 */
const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'key', 'authorization',
  'cookie', 'access_token', 'refresh_token', 'api_key',
];

function sanitizeContext(ctx: LogContext): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (SENSITIVE_KEYS.some(s => k.toLowerCase().includes(s))) {
      sanitized[k] = '[REDACTED]';
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

function formatLog(level: string, message: string, context: LogContext = {}) {
  const traceId = (context.traceId as string | undefined) || traceIdMap.get(globalThis) || 'unknown';
  const { error, ...rest } = context as LogContext & { error?: Error | unknown };
  const sanitized = sanitizeContext(rest as LogContext);
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
    traceId,
    ...sanitized,
  };
  // Serialize Error objects to preserve message + stack
  if (error instanceof Error) {
    entry.errorMessage = error.message;
    entry.errorStack = error.stack;
  } else if (error !== undefined) {
    entry.error = String(error);
  }
  return JSON.stringify(entry);
}

export const logger = {
  debug: (message: string, context: LogContext = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog('debug', message, context));
    }
  },
  info: (message: string, context: LogContext = {}) => {
    console.log(formatLog('info', message, context));
  },
  warn: (message: string, context: LogContext = {}) => {
    console.warn(formatLog('warn', message, context));
  },
  error: (message: string, context: LogContext = {}) => {
    console.error(formatLog('error', message, context));
  },
  ai: (capability: string, context: LogContext & {
    promptVersion: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    latencyMs: number;
  }) => {
    console.log(formatLog('info', `AI: ${capability}`, { ...context, category: 'ai' }));
  },
};
