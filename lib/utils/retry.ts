/**
 * Shared retry logic with exponential backoff for platform API calls
 */

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
  isRetryableError: (error: Error) => boolean;
  onRetry?: (attempt: number, delayMs: number, error: Error) => void;
}

export interface RateLimitInfo {
  retryAfterMs: number;
  limit?: number;
  remaining?: number;
  resetAt?: Date;
}

export class RateLimitedError extends Error {
  public readonly retryAfterMs: number;
  public readonly limit?: number;
  public readonly remaining?: number;
  public readonly resetAt?: Date;

  constructor(message: string, retryAfterMs: number, limit?: number, remaining?: number, resetAt?: Date) {
    super(message);
    this.name = 'RateLimitedError';
    this.retryAfterMs = retryAfterMs;
    this.limit = limit;
    this.remaining = remaining;
    this.resetAt = resetAt;
  }
}

export class TokenExpiredError extends Error {
  public readonly platform: string;

  constructor(message: string, platform: string) {
    super(message);
    this.name = 'TokenExpiredError';
    this.platform = platform;
  }
}

export class AuthenticationError extends Error {
  public readonly platform: string;
  public readonly statusCode: number;

  constructor(message: string, platform: string, statusCode: number) {
    super(message);
    this.name = 'AuthenticationError';
    this.platform = platform;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends Error {
  public readonly platform: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, platform: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
    this.platform = platform;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class APIError extends Error {
  public readonly platform: string;
  public readonly statusCode: number;
  public readonly isRetryable: boolean;

  constructor(message: string, platform: string, statusCode: number, isRetryable: boolean = true) {
    super(message);
    this.name = 'APIError';
    this.platform = platform;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
  }
}

/**
 * Parses Retry-After header value (seconds or HTTP-date)
 */
export function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;

  // Try parsing as seconds
  const seconds = parseInt(header, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }

  // Try parsing as HTTP-date
  const date = new Date(header);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return null;
}

/**
 * Default retry options for platform API calls
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  isRetryableError: (error: Error) => {
    // Network errors, timeouts are retryable
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    if (error instanceof RateLimitedError) {
      return true;
    }
    if (error instanceof APIError) {
      return error.isRetryable;
    }
    return false;
  },
};

/**
 * Executes a function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Check if error is retryable
      const isRetryableStatus = lastError instanceof APIError
        ? opts.retryableStatuses.includes(lastError.statusCode)
        : false;

      const isRetryable = opts.isRetryableError(lastError) || isRetryableStatus;

      if (!isRetryable) {
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      let delayMs = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt),
        opts.maxDelayMs
      );

      // Add jitter (±25%)
      const jitter = delayMs * 0.25 * (Math.random() * 2 - 1);
      delayMs = Math.floor(delayMs + jitter);

      // For rate limits, respect Retry-After header if available
      if (lastError instanceof RateLimitedError && lastError.retryAfterMs > 0) {
        delayMs = Math.max(delayMs, lastError.retryAfterMs);
      }

      opts.onRetry?.(attempt + 1, delayMs, lastError);

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Creates a standard fetch wrapper with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryOptions?: Partial<RetryOptions>
): Promise<Response> {
  return withRetry(
    async () => {
      const response = await fetch(url, options);

      // Parse rate limit headers
      const retryAfter = response.headers.get('Retry-After');
      const rateLimitLimit = response.headers.get('X-RateLimit-Limit') || response.headers.get('x-rate-limit-limit');
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining') || response.headers.get('x-rate-limit-remaining');

      if (response.status === 429) {
        const retryAfterMs = parseRetryAfter(retryAfter) || 60000;
        throw new RateLimitedError(
          `Rate limited: ${response.statusText}`,
          retryAfterMs,
          rateLimitLimit ? parseInt(rateLimitLimit, 10) : undefined,
          rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new TokenExpiredError('Token expired or invalid', '');
      }

      if (response.status >= 500) {
        throw new APIError(
          `Server error: ${response.status} ${response.statusText}`,
          '',
          response.status,
          true
        );
      }

      if (response.status === 400) {
        const text = await response.text().catch(() => '');
        throw new ValidationError(
          `Bad request: ${text}`,
          '',
          400,
          { responseBody: text }
        );
      }

      if (response.status >= 400) {
        throw new APIError(
          `API error: ${response.status} ${response.statusText}`,
          '',
          response.status,
          DEFAULT_RETRY_OPTIONS.retryableStatuses.includes(response.status)
        );
      }

      return response;
    },
    retryOptions
  );
}

/**
 * Wraps a fetch call with platform-specific error handling
 */
export async function platformFetch<T>(
  platform: string,
  fn: () => Promise<T>,
  retryOptions?: Partial<RetryOptions>
): Promise<T> {
  return withRetry(
    async () => {
      try {
        return await fn();
      } catch (error) {
        if (error instanceof RateLimitedError) {
          throw new RateLimitedError(
            error.message,
            error.retryAfterMs,
            error.limit,
            error.remaining,
            error.resetAt
          );
        }
        if (error instanceof TokenExpiredError) {
          throw new TokenExpiredError(error.message, platform);
        }
        if (error instanceof APIError) {
          throw new APIError(error.message, platform, error.statusCode, error.isRetryable);
        }
        if (error instanceof ValidationError) {
          throw new ValidationError(error.message, platform, error.statusCode, error.details);
        }
        throw error;
      }
    },
    retryOptions
  );
}