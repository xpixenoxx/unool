import { randomUUID } from 'crypto';

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
    const newId = randomUUID();
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

function formatLog(level: string, message: string, context: LogContext = {}) {
  const traceId = context.traceId || traceIdMap.get(globalThis) || 'unknown';
  const log = {
    timestamp: new Date().toISOString(),
    level,
    message,
    traceId,
    ...context,
  };
  return JSON.stringify(log);
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
  error: (message: string, context: LogContext & { error?: Error } = {}) => {
    const { error, ...rest } = context;
    console.error(formatLog('error', message, { ...rest, error: error?.message, stack: error?.stack }));
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