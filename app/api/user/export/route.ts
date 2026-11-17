import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { listUserWorkspaces } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/export
 * Generates a GDPR-style JSON export of the authenticated user's profile, workspaces,
 * public creator profile, studio voice settings, recent posts, and non-secret channel metadata.
 * Excludes password hashes, encrypted/decrypted OAuth tokens, and API key hashes.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    if (auth.isImpersonated) {
      return NextResponse.json(
        { error: 'Data export is blocked during admin impersonation.', code: 'IMPERSONATION_BLOCKED' },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const rate = await checkRateLimit(request, 'dataExport', auth.userId);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Export rate limit exceeded. Please wait before downloading again.' },
        { status: 429, headers: { ...NO_STORE_HEADERS, ...rateLimitHeaders(rate.remaining, rate.reset) } }
      );
    }

    const [
      { data: authUserRes },
      { data: dbUser },
      workspaces,
      { data: profiles },
      { data: posts },
      { data: connections },
      prefsResult,
    ] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(auth.userId),
      supabaseAdmin.from('users').select('id, email, full_name, created_at').eq('id', auth.userId).limit(1).maybeSingle(),
      listUserWorkspaces(auth.userId),
      supabaseAdmin
        .from('profiles')
        .select('id, subdomain, name, bio, role, tagline, custom_domain, theme_config, studio_profile, created_at, updated_at')
        .eq('workspace_id', auth.workspaceId)
        .is('deleted_at', null),
      supabaseAdmin
        .from('posts')
        .select('id, title, content, status, scheduled_at, published_at, platforms, created_at')
        .eq('workspace_id', auth.workspaceId)
        .order('created_at', { ascending: false })
        .limit(500),
      supabaseAdmin
        .from('platform_connections')
        .select('id, platform, platform_username, account_type, is_active, created_at, updated_at')
        .eq('workspace_id', auth.workspaceId),
      Promise.resolve(
        supabaseAdmin
          .from('user_preferences')
          .select('theme, digest_frequency, notify_token_expiry, notify_security_alerts, notify_publishing, ai_personalization_enabled')
          .eq('user_id', auth.userId)
          .limit(1)
          .maybeSingle()
      ).catch(() => ({ data: null })),
    ]);

    const authUser = authUserRes?.user;

    // Record best-effort security audit event (non-blocking)
    try {
      await supabaseAdmin.from('workspace_security_events').insert({
        workspace_id: auth.workspaceId,
        actor_user_id: auth.userId,
        event_type: 'data_exported',
        metadata: { workspace_count: workspaces.length },
      });
    } catch {
      // Ignore if migration hasn't been applied yet
    }

    const primaryStudioProfile = Array.isArray(profiles) && profiles.length > 0 ? profiles[0]?.studio_profile || null : null;

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      activeWorkspaceId: auth.workspaceId,
      account: {
        id: auth.userId,
        email: authUser?.email || dbUser?.email || auth.email || null,
        fullName:
          dbUser?.full_name ||
          (typeof authUser?.user_metadata?.full_name === 'string' ? authUser.user_metadata.full_name : null),
        createdAt: authUser?.created_at || dbUser?.created_at || null,
      },
      preferences: prefsResult?.data || null,
      workspaces,
      profiles: (profiles || []).map(({ studio_profile: _sp, ...rest }) => rest),
      studioProfile: primaryStudioProfile,
      connectedChannels: connections || [],
      posts: posts || [],
    };

    const filename = `unool-export-${auth.userId.slice(0, 8)}.json`;
    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        ...NO_STORE_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    logger.error('GET /api/user/export failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to export user data.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}