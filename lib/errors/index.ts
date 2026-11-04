/**
 * Public API for lib/errors — standardized application error classes.
 * Import from here: import { AuthError, NotFoundError } from '@/lib/errors';
 */
export {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ConflictError,
  ServiceUnavailableError,
} from './AppError';

