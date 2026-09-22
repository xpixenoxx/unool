import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdapter } from '@/lib/platforms';
import { generateOAuthState, storeOAuthState, createOAuthCookie } from '@/lib/auth/oauth-state';
import { getAuthContext } from '@/lib/auth/context';
import { getCurrentAuth } from '@/lib/auth/server';
import { logger } from '@/lib/logger';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function resolveWorkspaceId(request: NextRequest): Promise<{ id: string | null; userId: string | null, debug: string }> {
  let debug = [];
  
  // Method 1: getAuthContext
  try {
    const authCtx = await getAuthContext();
    if (authCtx) return { id: authCtx.workspaceId, userId: authCtx.userId, debug: 'authCtx_success' };
    debug.push('authCtx_null');
  } catch (e) {
    debug.push('authCtx_err_' + (e instanceof Error ? e.message : String(e)));
  }

  // Method 2: getCurrentAuth
  try {
    const auth = await getCurrentAuth(request);
    if (auth) return { id: auth.workspaceId, userId: auth.userId, debug: 'currAuth_success' };
    debug.push('currAuth_null');
  } catch (e) {
    debug.push('currAuth_err_' + (e instanceof Error ? e.message : String(e)));
  }

  // Method 3: Direct Supabase SSR
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    debug.push('cookies_' + allCookies.length);
    
    // Check if the specific sb- cookies exist
    const hasSbCookies = allCookies.some(c => c.name.startsWith('sb-'));
    debug.push('url_' + Buffer.from(config.SUPABASE_URL).toString('base64url').substring(0, 15));
    debug.push('hasSb_' + hasSbCookies);

    const supabaseSSR = createServerClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() { return allCookies; },
        setAll() { /* read-only */ },
      },
    });

    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    if (error) {
      debug.push('ssr_err_' + error.message);
    }
    if (user) {
      const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
      const { data: member, error: dbError } = await adminClient
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();

      if (dbError) {
        debug.push('db_err_' + dbError.message);
      }
        
      const workspaceId = member?.workspace_id || user.id;
      return { id: workspaceId, userId: user.id, debug: 'ssr_success' };
    } else {
      debug.push('ssr_user_null');
    }
  } catch (e) {
    debug.push('ssr_fatal_' + (e instanceof Error ? e.message : String(e)));
  }

  return { id: null, userId: null, debug: debug.join('|') };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform');
  let workspaceId = searchParams.get('workspaceId');
  let userId = searchParams.get('userId');
  const returnUrl = searchParams.get('returnUrl') || undefined;
  const errorRedirect = returnUrl || '/onboarding/connect/add';
  
  let debugInfo = 'none';

  if (!workspaceId || !userId) {
    const resolution = await resolveWorkspaceId(request);
    workspaceId = workspaceId || resolution.id;
    userId = userId || resolution.userId;
    debugInfo = resolution.debug;
  }

  if (!platform || !workspaceId || !userId) {
    logger.warn('Platform connect: missing params after all auth methods', { 
      platform, 
      hasWorkspace: String(!!workspaceId),
      hasUser: String(!!userId),
      debugInfo 
    });
    
    const errUrl = new URL(`${errorRedirect}?error=missing_params`, request.url);
    errUrl.searchParams.set('debug', debugInfo);
    
    return NextResponse.redirect(errUrl);
  }

  const adapter = getPlatformAdapter(platform);
  if (!adapter) {
    logger.warn('Platform connect: unsupported platform', { platform });
    return NextResponse.redirect(
      new URL(`${errorRedirect}?error=unsupported_platform&platform=${platform}`, request.url)
    );
  }

  // Generate cryptographically secure state
  const state = generateOAuthState(workspaceId, platform);

  // Store in Redis with TTL (fails silently if unconfigured and falls back to cookie)
  await storeOAuthState(state, workspaceId, userId, platform, returnUrl);

  // Handle PKCE for X/Twitter - getAuthUrl can return string or {url, pkceCookie}
  const authUrlResult = adapter.getAuthUrl(state);

  let authUrl: string;
  const resCookies: string[] = [createOAuthCookie(state, workspaceId, userId, platform, returnUrl)];

  if (typeof authUrlResult === 'string') {
    authUrl = authUrlResult;
  } else {
    const result = await authUrlResult;
    authUrl = result.url;
    if (result.pkceCookie) {
      resCookies.push(result.pkceCookie);
    }
  }

  logger.info('Platform connect: redirecting to OAuth', { platform, authUrl: authUrl.substring(0, 100) });

  const response = NextResponse.redirect(authUrl);
  resCookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));

  return response;
}