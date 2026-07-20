import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const traceId = crypto.randomUUID();
  const cookieStore = await cookies();

  try {
    const body = await request.json();
    const { code, redirectTo } = body;

    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    const supabase = createServerClient(
      config.SUPABASE_URL,
      config.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error('Auth callback error', { error, traceId });
      return NextResponse.json({ error: error.message || 'Invalid or expired magic link' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Ensure user profile exists
      const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
      await adminClient.from('users').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
      }, { onConflict: 'id' });

      // Ensure workspace exists for this user
      const { data: existingMember } = await adminClient
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();

      if (!existingMember) {
        // Create a new workspace for the user
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
          logger.info('Created workspace for new user', { userId: user.id, workspaceId: newWorkspace.id, traceId });
        }
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