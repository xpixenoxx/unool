import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

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

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
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
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

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

        // Ensure workspace exists
        const { data: existingMember } = await adminClient
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .single();

        if (!existingMember) {
          const { data: newWorkspace } = await adminClient
            .from('workspaces')
            .insert({
              owner_id: user.id,
              name: 'Personal Workspace',
              plan: 'free',
            })
            .select('id')
            .single();

          if (newWorkspace) {
            await adminClient.from('workspace_members').insert({
              workspace_id: newWorkspace.id,
              user_id: user.id,
              role: 'owner',
            });
          }
        }
      } catch (profileError) {
        // Non-fatal — session is still valid
        console.error('[auth/callback] Profile upsert error:', profileError);
      }
    }

    // Success — redirect to dashboard (session cookies are now set)
    return NextResponse.redirect(`${origin}${redirect}`);
  }

  // No code found — redirect to signin
  return NextResponse.redirect(`${origin}/signin?error=missing_code`);
}
