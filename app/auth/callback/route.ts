import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

/**
 * OAuth Callback Route Handler (GET)
 *
 * This is the CORRECT pattern for Supabase PKCE OAuth in Next.js App Router.
 * The PKCE code_verifier is stored in a cookie by the browser Supabase client.
 * The server reads that cookie, exchanges the code for a session server-side,
 * sets the session cookies, then redirects to the dashboard.
 *
 * Flow:
 *   1. User clicks "Continue with Google" → signInWithOAuth() → stores code_verifier in cookie
 *   2. Google redirects back → GET /auth/callback?code=xxx&redirect=/dashboard
 *   3. This handler reads the code + code_verifier, exchanges for session
 *   4. Sets session cookies → redirects to dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/dashboard';
  const errorParam = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  // Handle errors returned from OAuth provider
  if (errorParam) {
    const errorMessage = errorDesc || errorParam;
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent(errorMessage)}`
    );
  }

  if (code) {
    const cookieStore = await cookies();
    const cookiesToSetOnResponse: Array<{ name: string; value: string; options?: any }> = [];

    const supabase = createServerClient(
      config.SUPABASE_URL,
      config.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookiesToSetOnResponse.push({ name, value, options });
              try {
                cookieStore.set(name, value, options);
              } catch {}
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback] Code exchange error:', error.message);
      return NextResponse.redirect(
        `${origin}/signin?error=${encodeURIComponent(error.message)}`
      );
    }

    // Ensure user profile and workspace exist (fire and forget)
    const user = data.session?.user;
    if (user) {
      try {
        const adminClient = createClient(
          config.SUPABASE_URL,
          config.SUPABASE_SERVICE_ROLE_KEY
        );

        // Check whether user already exists before upserting profile (prevents returning OAuth referral farming)
        const [{ data: existingUserRow }, { data: existingMember }, { data: existingOwnedWs }] =
          await Promise.all([
            adminClient.from('users').select('id').eq('id', user.id).limit(1).maybeSingle(),
            adminClient
              .from('workspace_members')
              .select('workspace_id')
              .eq('user_id', user.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle(),
            adminClient
              .from('workspaces')
              .select('id')
              .eq('owner_id', user.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle(),
          ]);

        // Upsert user profile
        await adminClient.from('users').upsert(
          {
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url || null,
          },
          { onConflict: 'id' }
        );

        let resolvedWorkspaceId = existingMember?.workspace_id || existingOwnedWs?.id || null;

        // Repair missing workspace_members row if workspace exists
        if (!existingMember && existingOwnedWs) {
          await adminClient.from('workspace_members').insert({
            workspace_id: existingOwnedWs.id,
            user_id: user.id,
            role: 'owner',
          });
        }

        // Create default workspace only when user has no membership and no owned workspace
        if (!resolvedWorkspaceId) {
          const { data: newWorkspace } = await adminClient
            .from('workspaces')
            .insert({
              owner_id: user.id,
              name: 'Personal Workspace',
              plan: 'spark',
            })
            .select('id')
            .single();

          if (newWorkspace) {
            resolvedWorkspaceId = newWorkspace.id;
            await adminClient.from('workspace_members').insert({
              workspace_id: newWorkspace.id,
              user_id: user.id,
              role: 'owner',
            });
          }
        }

        // Attribute referral ONLY for newly registered accounts (not returning logins).
        // NOTE: In production Supabase, the `public.handle_new_user()` trigger on `auth.users`
        // inserts `public.users`, `public.workspaces`, and `public.workspace_members` synchronously
        // during `exchangeCodeForSession(code)` BEFORE the queries above run — so we must NOT
        // require `!existingUserRow` alone; instead compare `created_at` with `last_sign_in_at` and `now`.
        const refFromQuery = searchParams.get('ref')?.trim();
        const refFromCookie = cookieStore.get('unool_ref')?.value?.trim();
        const refFromMeta =
          typeof user.user_metadata?.referral_code === 'string'
            ? user.user_metadata.referral_code.trim()
            : '';
        const refCode = refFromCookie || refFromQuery || refFromMeta;

        const nowMs = Date.now();
        const createdMs = user.created_at ? new Date(user.created_at).getTime() : 0;
        const lastSignInMs = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
        const noPreTriggerRows = !existingUserRow && !existingMember && !existingOwnedWs;
        const isFirstOAuthSession =
          createdMs > 0 &&
          nowMs - createdMs < 15 * 60 * 1000 &&
          (noPreTriggerRows || !lastSignInMs || Math.abs(lastSignInMs - createdMs) < 60 * 1000);

        if (refCode && isFirstOAuthSession) {
          try {
            const { recordReferralSignup } = await import('@/lib/referrals/service');
            await recordReferralSignup(user.id, refCode);
            cookiesToSetOnResponse.push({
              name: 'unool_ref',
              value: '',
              options: { path: '/', maxAge: 0, sameSite: 'lax' },
            });
          } catch (refErr) {
            console.error('[auth/callback] Referral attribution error:', refErr);
          }
        }

        // Ensure every new OAuth user immediately receives their own unique referral code
        if (isFirstOAuthSession) {
          try {
            const { getOrCreateReferralCode } = await import('@/lib/referrals/service');
            const displayName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'USER';
            await getOrCreateReferralCode(
              user.id,
              resolvedWorkspaceId || user.id,
              String(displayName)
            );
          } catch {
            // Non-fatal — created lazily on /api/referrals if skipped
          }
        }
      } catch (profileError) {
        // Non-fatal — session is still valid
        console.error('[auth/callback] Profile upsert error:', profileError);
      }
    }

    // Success — redirect to dashboard (session cookies are now set on both cookieStore and response)
    const redirectResponse = NextResponse.redirect(`${origin}${redirect}`);
    cookiesToSetOnResponse.forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, options);
    });
    return redirectResponse;
  }

  // No code found — redirect to signin
  return NextResponse.redirect(`${origin}/signin?error=missing_code`);
}
