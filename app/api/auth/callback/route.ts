import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const traceId = crypto.randomUUID();
  const cookieStore = await cookies();

  try {
    const body = await request.json();
    const { code, token_hash, type, redirectTo } = body;

    // For OAuth flows, the browser client already exchanged the code.
    // We only need to do profile/workspace upsert here.
    const isOAuthProfileUpsert = type === 'oauth';

    if (!code && !token_hash && !isOAuthProfileUpsert) {
      return NextResponse.json({ error: 'Missing authorization credentials' }, { status: 400 });
    }

    const supabase = createServerClient(
      config.SUPABASE_URL,
      config.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    let error;

    if (!isOAuthProfileUpsert) {
      if (code) {
        const resp = await supabase.auth.exchangeCodeForSession(code);
        error = resp.error;
      } else if (token_hash) {
        const resp = await supabase.auth.verifyOtp({ token_hash, type: type as any });
        error = resp.error;
      }

      if (error) {
        logger.error('Auth callback error', { error, traceId });
        return NextResponse.json({ error: error.message || 'Invalid or expired magic link' }, { status: 400 });
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Ensure user profile exists
      
      await supabaseAdmin.from('users').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
      }, { onConflict: 'id' });

      // Ensure workspace exists for this user (multi-workspace safe & heals missing owner membership)
      const [{ data: existingMember }, { data: existingOwnedWs }] = await Promise.all([
        supabaseAdmin
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .or('status.eq.active,status.is.null')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabaseAdmin
          .from('workspaces')
          .select('id')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!existingMember && existingOwnedWs) {
        await supabaseAdmin.from('workspace_members').upsert(
          {
            workspace_id: existingOwnedWs.id,
            user_id: user.id,
            role: 'owner',
            status: 'active',
          },
          { onConflict: 'workspace_id,user_id' }
        );
      }

      if (!existingMember && !existingOwnedWs) {
        // Create a new workspace for the user on canonical 'spark' tier
        const { data: newWorkspace } = await supabaseAdmin
          .from('workspaces')
          .insert({
            owner_id: user.id,
            name: 'Personal Workspace',
            plan: 'spark',
          })
          .select('id')
          .limit(1)
          .maybeSingle();

        if (newWorkspace) {
          await supabaseAdmin.from('workspace_members').insert({
            workspace_id: newWorkspace.id,
            user_id: user.id,
            role: 'owner',
            status: 'active',
          });
          logger.info('Created workspace for new user', { userId: user.id, workspaceId: newWorkspace.id, traceId });
        }
      }

      // Attribute referral + generate referral code for fresh OAuth/magiclink signups
      const refFromBody = typeof body?.ref === 'string' ? body.ref.trim() : '';
      const refFromCookie = cookieStore.get('unool_ref')?.value?.trim() || '';
      const refCode = refFromCookie || refFromBody;
      const nowMs = Date.now();
      const createdMs = user.created_at ? new Date(user.created_at).getTime() : 0;
      const lastSignInMs = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
      const isFirstSession =
        createdMs > 0 &&
        nowMs - createdMs < 15 * 60 * 1000 &&
        ((!existingMember && !existingOwnedWs) || !lastSignInMs || Math.abs(lastSignInMs - createdMs) < 60 * 1000);

      if (isFirstSession) {
        if (refCode) {
          try {
            const { recordReferralSignup } = await import('@/lib/referrals/service');
            await recordReferralSignup(user.id, refCode);
            cookieStore.set('unool_ref', '', { path: '/', maxAge: 0, sameSite: 'lax' });
          } catch (refErr) {
            logger.warn('POST /api/auth/callback referral attribution failed', { error: refErr, traceId });
          }
        }
        try {
          const { getOrCreateReferralCode } = await import('@/lib/referrals/service');
          const resolvedWsId = existingMember?.workspace_id || existingOwnedWs?.id || user.id;
          await getOrCreateReferralCode(
            user.id,
            resolvedWsId,
            String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'USER')
          );
        } catch {}
      }
    }

    logger.info('Auth callback success', { traceId, userId: user?.id });

    return NextResponse.json({ success: true, redirectTo: redirectTo || '/dashboard' });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error('Auth callback endpoint error', { error, traceId });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
