import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAuth } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const updateAccountSchema = z.object({
  fullName: z.string().trim().min(1, 'Name cannot be empty.').max(100, 'Name must be 100 characters or fewer.'),
  avatarUrl: z
    .string()
    .trim()
    .url('Avatar URL must be a valid URL.')
    .refine((v) => v.startsWith('https://') || v.startsWith('http://localhost'), {
      message: 'Avatar URL must use HTTPS.',
    })
    .nullable()
    .optional(),
});

/**
 * GET /api/user/account
 * Returns the authenticated user's profile and MFA enrollment summary.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const [{ data: userRes, error: userErr }, { data: dbUser }] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(auth.userId),
      supabaseAdmin
        .from('users')
        .select('id, email, full_name, created_at')
        .eq('id', auth.userId)
        .limit(1)
        .maybeSingle(),
    ]);

    const authUser = userRes?.user;
    if (userErr || !authUser) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const meta = (authUser.user_metadata || {}) as Record<string, unknown>;
    const fullName =
      (typeof dbUser?.full_name === 'string' && dbUser.full_name.trim()) ||
      (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
      (typeof meta.name === 'string' && meta.name.trim()) ||
      authUser.email?.split('@')[0] ||
      'Creator';

    const avatarUrl =
      (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) ||
      (typeof meta.picture === 'string' && meta.picture.trim()) ||
      null;

    const factors = Array.isArray((authUser as { factors?: Array<{ status?: string }> }).factors)
      ? ((authUser as { factors?: Array<{ status?: string }> }).factors ?? [])
      : [];
    const mfaEnabled = factors.some((f) => f?.status === 'verified') || Boolean(meta.mfa_enabled);

    return NextResponse.json(
      {
        user: {
          id: authUser.id,
          email: authUser.email || dbUser?.email || '',
          fullName,
          avatarUrl,
          createdAt: authUser.created_at || dbUser?.created_at || null,
          emailConfirmedAt: authUser.email_confirmed_at || null,
          mfaEnabled,
        },
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logger.error('GET /api/user/account failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to load account profile.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * PATCH /api/user/account
 * Updates display name (and optional avatar URL) in both public.users and auth user_metadata.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    if (auth.isImpersonated) {
      return NextResponse.json(
        { error: 'Account edits are disabled during admin impersonation.', code: 'IMPERSONATION_BLOCKED' },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const rate = await checkRateLimit(request, 'accountAction', auth.userId);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many account update requests. Please try again later.' },
        { status: 429, headers: { ...NO_STORE_HEADERS, ...rateLimitHeaders(rate.remaining, rate.reset) } }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = updateAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid account payload.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { fullName, avatarUrl } = parsed.data;

    const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(auth.userId);
    const authUser = userRes?.user;
    if (userErr || !authUser) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const existingMeta = (authUser.user_metadata || {}) as Record<string, unknown>;
    const nextMeta: Record<string, unknown> = {
      ...existingMeta,
      full_name: fullName,
      name: fullName,
    };
    if (avatarUrl !== undefined) {
      nextMeta.avatar_url = avatarUrl;
    }

    const { error: metaUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(auth.userId, {
      user_metadata: nextMeta,
    });
    if (metaUpdateErr) {
      throw new Error(metaUpdateErr.message || 'Failed to update auth profile');
    }

    const { error: dbErr } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          id: auth.userId,
          email: authUser.email || '',
          full_name: fullName,
        },
        { onConflict: 'id' }
      );

    if (dbErr) {
      logger.warn('Failed syncing public.users full_name (non-fatal)', {
        userId: auth.userId,
        error: dbErr.message,
      });
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: auth.userId,
          email: authUser.email || '',
          fullName,
          avatarUrl: avatarUrl !== undefined ? avatarUrl : (typeof nextMeta.avatar_url === 'string' ? nextMeta.avatar_url : null),
        },
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logger.error('PATCH /api/user/account failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to update account profile.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

