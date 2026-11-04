/**
 * HOC-style wrapper for API route handlers that require authentication.
 *
 * Usage:
 *   export const POST = withAuth(async (req, { userId, workspaceId }) => {
 *     return NextResponse.json({ ok: true });
 *   });
 *
 * The wrapper handles:
 *   - Auth check → 401 if missing session
 *   - Unhandled errors → 500 with structured JSON (never leaks stack trace)
 *   - Consistent error logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth, type AuthContext } from '@/lib/auth/server';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/errors/AppError';

type AuthHandler = (req: NextRequest, auth: AuthContext) => Promise<NextResponse>;

export function withAuth(handler: AuthHandler) {
  return async function (req: NextRequest): Promise<NextResponse> {
    try {
      const auth = await getCurrentAuth(req);
      if (!auth?.userId || !auth?.workspaceId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return await handler(req, auth);
    } catch (error) {
      // Structured AppErrors → use their statusCode and code
      if (error instanceof AppError) {
        logger.warn('API route AppError', { code: error.code, message: error.message });
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.statusCode },
        );
      }
      // Unhandled errors → 500
      logger.error('API route unhandled error', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

