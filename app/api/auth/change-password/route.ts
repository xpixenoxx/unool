import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAuth } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hashPassword, validatePassword, verifyPassword } from '@/lib/auth/password';
import { getUserPasswordHash, saveUserPasswordHash } from '@/lib/auth/credentials';
import { bumpUserSecurityVersion } from '@/lib/auth/security-version';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(1, 'New password is required.'),
});

/**
 * POST /api/auth/change-password
 * Verifies the user's current Argon2id password, stores the new hash in
 * user_credentials, bumps security_version, and revokes other active sessions.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    if (auth.isImpersonated) {
      return NextResponse.json(
        {
          error: 'Password changes are blocked during admin impersonation sessions.',
          code: 'IMPERSONATION_BLOCKED',
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const rate = await checkRateLimit(request, 'accountAction', auth.userId);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many password change attempts. Please try again later.' },
        { status: 429, headers: { ...NO_STORE_HEADERS, ...rateLimitHeaders(rate.remaining, rate.reset) } }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid password payload.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { currentPassword, newPassword } = parsed.data;
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from your current password.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(auth.userId);
    const user = userRes?.user;
    if (userErr || !user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const bannedUntil = (user as { banned_until?: string | null }).banned_until;
    if (
      user.user_metadata?.is_deleted === true ||
      (bannedUntil && new Date(bannedUntil) > new Date())
    ) {
      return NextResponse.json({ error: 'Account is disabled or deleted.' }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const { hash: existingHash } = await getUserPasswordHash({
      id: user.id,
      user_metadata: user.user_metadata,
    });

    if (!existingHash) {
      return NextResponse.json(
        {
          error:
            'No password is set on this account yet. Use Reset Password via email verification code to set a password.',
          code: 'PASSWORD_NOT_SET',
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const validCurrent = await verifyPassword(existingHash, currentPassword);
    if (!validCurrent) {
      return NextResponse.json(
        { error: 'Current password is incorrect.', code: 'INVALID_CURRENT_PASSWORD' },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const newHash = await hashPassword(newPassword);
    await saveUserPasswordHash(user.id, newHash, user.user_metadata);

    const newSecurityVersion = await bumpUserSecurityVersion(user.id);

    // Best-effort revoke other active sessions while keeping the current session alive
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut({ scope: 'others' });
    } catch {
      // Non-fatal in Bearer/test callers
    }

    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (bearer) {
      try {
        await supabaseAdmin.auth.admin.signOut(bearer, 'others');
      } catch {
        // Non-fatal
      }
    }

    // Best-effort security event audit log (safe pre-migration if table missing)
    try {
      await supabaseAdmin.from('workspace_security_events').insert({
        workspace_id: auth.workspaceId,
        actor_user_id: auth.userId,
        event_type: 'password_changed',
        metadata: { security_version: newSecurityVersion },
      });
    } catch {
      // Ignore if migration hasn't been applied yet
    }

    logger.info('User password changed via settings', { userId: auth.userId });

    return NextResponse.json(
      {
        success: true,
        message: 'Password updated and other sessions revoked.',
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logger.error('POST /api/auth/change-password failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to update password.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

