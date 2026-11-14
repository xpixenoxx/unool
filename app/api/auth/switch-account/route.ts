import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createServerClient } from '@supabase/ssr';
import { getCurrentAuth } from '@/lib/auth/server';
import { createAccountSwitchToken, verifyAccountSwitchToken } from '@/lib/auth/account-switch-token';
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

    const switchToken = createAccountSwitchToken(userId, user.email);

    return NextResponse.json({
      account: {
        userId,
        email: user.email,
        displayName,
        subdomain: profile?.subdomain || null,
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) || null,
        switchToken,
      },
    });
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
        { status: 401 }
      );
    }

    const { data: userLookup, error: lookupError } = await supabaseAdmin.auth.admin.getUserById(
      verified.userId
    );
    const user = userLookup?.user;
    if (lookupError || !user || !user.email || user.email.toLowerCase().trim() !== verified.email) {
      return NextResponse.json(
        { success: false, message: 'Account not found. Please sign in again.' },
        { status: 404 }
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

    const freshSwitchToken = createAccountSwitchToken(user.id, user.email);

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

