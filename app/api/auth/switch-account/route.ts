import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createServerClient } from '@supabase/ssr';
import { getCurrentAuth } from '@/lib/auth/server';
import { createAccountSwitchToken, verifyAccountSwitchToken } from '@/lib/auth/account-switch-token';
import { getUserSecurityVersion } from '@/lib/auth/security-version';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const profileRepository = new SupabaseProfileRepository();

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, workspaceId } = auth;
    const [userResult, profile] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(userId),
      profileRepository.findByWorkspaceId(workspaceId),
    ]);

    const user = userResult.data?.user;
    if (!user || !user.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rawName = profile?.name || (user.user_metadata?.full_name as string | undefined) || '';
    const displayName =
      !rawName || rawName.toLowerCase() === 'user' || rawName.toLowerCase() === 'new user'
        ? user.email.split('@')[0]
        : rawName;

    const securityVersion = await getUserSecurityVersion(userId);
    const switchToken = createAccountSwitchToken(userId, user.email, undefined, undefined, securityVersion);

    return NextResponse.json({
      account: {
        userId,
        email: user.email,
        displayName,
        subdomain: profile?.subdomain || null,
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) || null,
        switchToken,
      },
    }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    logger.error('GET /api/auth/switch-account failed', {
      error: err instanceof Error ? err : new Error(String(err)),
    });
    return NextResponse.json({ error: 'Failed to prepare account switcher token' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const switchToken = typeof body?.switchToken === 'string' ? body.switchToken : '';

    const verified = verifyAccountSwitchToken(switchToken);
    if (!verified) {
      return NextResponse.json(
        { success: false, message: 'Saved session expired. Please sign in to that account again.' },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const rate = await checkRateLimit(request, 'accountAction', verified.userId);
    if (!rate.success) {
      return NextResponse.json(
        { success: false, message: 'Too many switch attempts. Please wait a moment.' },
        { status: 429, headers: { ...NO_STORE_HEADERS, ...rateLimitHeaders(rate.remaining, rate.reset) } }
      );
    }

    const { data: userLookup, error: lookupError } = await supabaseAdmin.auth.admin.getUserById(
      verified.userId
    );
    const user = userLookup?.user;
    if (lookupError || !user || !user.email || user.email.toLowerCase().trim() !== verified.email) {
      return NextResponse.json(
        { success: false, message: 'Account not found. Please sign in again.' },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const currentSecurityVersion = await getUserSecurityVersion(user.id);
    if ((verified.securityVersion ?? 0) !== currentSecurityVersion) {
      return NextResponse.json(
        {
          success: false,
          code: 'SESSION_REVOKED',
          message: 'Saved session was invalidated after a security change. Please sign in again.',
        },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    let hasMfa = user.user_metadata?.mfa_enabled === true ||
      (Array.isArray((user as { factors?: Array<{ status?: string }> }).factors) &&
        ((user as { factors?: Array<{ status?: string }> }).factors ?? []).some((f) => f?.status === 'verified'));

    if (!hasMfa && typeof supabaseAdmin.auth.admin?.mfa?.listFactors === 'function') {
      try {
        const { data: factorList } = await supabaseAdmin.auth.admin.mfa.listFactors({ userId: user.id });
        const factors = factorList?.factors || [];
        hasMfa = factors.some((f) => f?.status === 'verified');
      } catch {
        // Non-fatal
      }
    }

    if (hasMfa) {
      return NextResponse.json(
        {
          success: false,
          code: 'MFA_REQUIRED',
          message: 'Multi-factor authentication is enabled on this account. Please sign in to verify.',
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const userRecord = user as unknown as Record<string, unknown>;
    let isDeleted = user.user_metadata?.is_deleted === true;
    if (!isDeleted) {
      try {
        const { data: delAcc } = await supabaseAdmin
          .from('deleted_accounts')
          .select('id')
          .eq('user_id', user.id)
          .is('recovered_at', null)
          .limit(1);
        if (delAcc && delAcc.length > 0) {
          isDeleted = true;
        }
      } catch {
        // Non-fatal
      }
    }
    const bannedUntil = userRecord.banned_until as string | undefined;
    const isSuspended = !isDeleted && Boolean(bannedUntil && new Date(bannedUntil) > new Date());

    if (isDeleted || isSuspended) {
      return NextResponse.json(
        {
          success: false,
          message: isSuspended
            ? 'Account suspended. Contact Unool team'
            : 'Session creation failed. Contact Unool team',
        },
        { status: 403 }
      );
    }

    const tempPassword = crypto.randomBytes(32).toString('base64');
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: tempPassword,
    });

    if (updateError) {
      logger.error('Failed to prepare switch-account session', { error: updateError, userId: user.id });
      return NextResponse.json({ success: false, message: 'Session switch failed.' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

    const supabaseSSR = createServerClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          toSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as any);
            cookiesToSet.push({ name, value, options });
          });
        },
      },
    });

    const { data: signInData, error: signInError } = await supabaseSSR.auth.signInWithPassword({
      email: user.email.toLowerCase().trim(),
      password: tempPassword,
    });

    if (signInError || !signInData?.session) {
      logger.error('Switch-account session exchange error', { error: signInError, userId: user.id });
      return NextResponse.json({ success: false, message: 'Session switch failed.' }, { status: 500 });
    }

    const freshSwitchToken = createAccountSwitchToken(
      user.id,
      user.email,
      undefined,
      undefined,
      currentSecurityVersion
    );

    const response = NextResponse.json(
      {
        success: true,
        message: 'Switched account successfully.',
        switchToken: freshSwitchToken,
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          expires_at: signInData.session.expires_at,
          user: {
            id: signInData.user?.id || user.id,
            email: signInData.user?.email || user.email,
          },
        },
      },
      { status: 200 }
    );

    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as any);
    });

    return response;
  } catch (err) {
    logger.error('POST /api/auth/switch-account failed', {
      error: err instanceof Error ? err : new Error(String(err)),
    });
    return NextResponse.json({ success: false, message: 'Failed to switch account.' }, { status: 500 });
  }
}

