/**
 * Standardized application error classes for UNOOL.
 *
 * Usage in API routes:
 *   throw new AuthError();
 *   throw new NotFoundError('Post');
 *   throw new ValidationError('planId is required');
 *
 * Usage in error handlers:
 *   if (error instanceof AppError) {
 *     return NextResponse.json({ error: error.message }, { status: error.statusCode });
 *   }
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/** 401 — Request has no valid session */
export class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'AuthError';
  }
}

/** 403 — Authenticated but not allowed */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

/** 404 — Resource does not exist */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/** 400 — Request body/params are invalid */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/** 429 — Too many requests */
export class RateLimitError extends AppError {
  constructor() {
    super('Too many requests. Please try again later.', 'RATE_LIMITED', 429);
    this.name = 'RateLimitError';
  }
}

/** 409 — Conflict (e.g. duplicate resource) */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

/** 503 — Downstream service unavailable */
export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`${service} is temporarily unavailable`, 'SERVICE_UNAVAILABLE', 503);
    this.name = 'ServiceUnavailableError';
  }
}

