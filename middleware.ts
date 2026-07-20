import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { config as appConfig } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitHeaders, RateLimitAction } from '@/lib/rate-limit';

const publicPaths = [
  '/',
  '/signup',
  '/auth/callback',
  '/api/auth',
  '/api/health',
  '/u',
];

// Check if Supabase is properly configured (not placeholder values)
function isSupabaseConfigured(): boolean {
  const url = appConfig.SUPABASE_URL;
  const key = appConfig.SUPABASE_ANON_KEY;
  return !!(url && key &&
    url !== 'https://your-project.supabase.co' &&
    key !== 'your-anon-key' &&
    url.startsWith('https://'));
}

// Check dev auth bypass at RUNTIME (not module load time - crucial for Vercel edge)
function isDevAuthEnabledRuntime(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_BYPASS === 'true';
}

// Check if path is a profile path /u/[subdomain]
function isProfilePath(pathname: string): string | null {
  const match = pathname.match(/^\/u\/([^/]+)(?:\/|$)/);
  if (match) {
    const subdomain = match[1];
    if (subdomain && subdomain !== 'www' && subdomain !== 'dashboard' && subdomain !== 'api' && subdomain !== 'signup' && subdomain !== 'auth' && subdomain !== 'health') {
      return subdomain;
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const traceId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `trace-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-trace-id', traceId);
  requestHeaders.set('x-middleware-entry', 'yes');

  // Security: Remove any potential spoofed headers from the client
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-workspace-id');
  requestHeaders.delete('x-user-email');
  requestHeaders.delete('x-dev-auth');

  const { pathname } = request.nextUrl;

  // Check auth configuration at runtime
  // Inverted logic: everything is protected UNLESS it's explicitly public.
  // Public API paths: /api/auth (login flows), /api/health, /api/webhooks, /api/profile/[subdomain] (public profile view)
  const isPublicApiRoute = pathname.startsWith('/api/auth') || pathname.startsWith('/api/health') || pathname.startsWith('/api/webhooks');
  const isProtectedRoute = (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) && !isPublicApiRoute;
  const supabaseConfigured = isSupabaseConfigured();
  const devAuthEnabled = isDevAuthEnabledRuntime();
  const hasDevBypassCookie = request.cookies.has('dev-auth-bypass') || request.cookies.has(`sb-${appConfig.SUPABASE_PROJECT_ID || 'local'}-auth-token`);

  // DEBUG: Prepare debug headers (available for all return paths)
  const debugHeaders = new Headers();
  debugHeaders.set('x-debug-supabaseConfigured', String(supabaseConfigured));
  debugHeaders.set('x-debug-devAuthEnabled', String(devAuthEnabled));
  debugHeaders.set('x-debug-devBypassCookie', String(hasDevBypassCookie));
  debugHeaders.set('x-debug-isProtectedRoute', String(isProtectedRoute));
  debugHeaders.set('x-debug-nodeEnv', process.env.NODE_ENV || 'unset');
  debugHeaders.set('x-debug-devAuthBypassEnv', process.env.DEV_AUTH_BYPASS || 'unset');
  debugHeaders.set('x-debug-cookies', Array.from(request.cookies.getAll().map(c => c.name)).join(','));

  // Helper to add debug headers to response
  const addDebugHeaders = (response: NextResponse) => {
    debugHeaders.forEach((value, key) => response.headers.set(key, value));
    return response;
  };

  // Host-based Subdomain Routing
  const hostname = request.headers.get('host') || '';
  let hostSubdomain: string | null = null;

  if (hostname.endsWith('.unool.co') && hostname !== 'unool.co' && hostname !== 'www.unool.co') {
    hostSubdomain = hostname.replace('.unool.co', '');
  } else if (hostname.endsWith('.localhost:3000') && hostname !== 'localhost:3000') {
    hostSubdomain = hostname.replace('.localhost:3000', '');
  }

  if (hostSubdomain && !pathname.startsWith('/u/')) {
    const url = request.nextUrl.clone();
    url.pathname = `/u/${hostSubdomain}${pathname === '/' ? '' : pathname}`;
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    response.headers.set('x-middleware-run', 'true');
    response.headers.set('x-middleware-path', url.pathname);
    return addDebugHeaders(response);
  }

  // Check for profile path /u/[subdomain] - pass through
  const subdomain = isProfilePath(pathname);
  if (subdomain) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('x-middleware-run', 'true');
    response.headers.set('x-middleware-path', pathname);
    return addDebugHeaders(response);
  }

  // Skip middleware for static assets and public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    publicPaths.some(p => pathname.startsWith(p))
  ) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('x-middleware-run', 'true');
    response.headers.set('x-middleware-path', pathname);
    return addDebugHeaders(response);
  }

  // Create response early to preserve cookies
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Create Supabase client for session validation
  const supabase = createServerClient(
    appConfig.SUPABASE_URL,
    appConfig.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Dev authentication bypass - set user/workspace headers if dev mode
  if (isProtectedRoute && devAuthEnabled && hasDevBypassCookie) {
    // Use deterministic dev IDs (must match middleware.ts and lib/auth/dev/bypass.ts)
    const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
    const DEV_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
    requestHeaders.set('x-user-id', DEV_USER_ID);
    requestHeaders.set('x-workspace-id', DEV_WORKSPACE_ID);
    requestHeaders.set('x-dev-auth', 'true');
    debugHeaders.set('x-debug-dev-context', 'set');
  }

  // For protected routes without dev bypass, check Supabase session
  if (isProtectedRoute && supabaseConfigured && !(devAuthEnabled && hasDevBypassCookie)) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      if (pathname.startsWith('/api/')) {
        return addDebugHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }
      const loginUrl = new URL('/signup', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return addDebugHeaders(NextResponse.redirect(loginUrl));
    }

    // Add user info to headers for downstream use
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email || '');

    // Try to get workspace from profiles first, then workspace_members
    let workspaceId: string | null = null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      workspaceId = profile.workspace_id;
    } else {
      // Fallback: check workspace_members table
      const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();
      workspaceId = member?.workspace_id || null;
    }

    // Ultimate fallback: use userId as workspaceId (single-user mode)
    requestHeaders.set('x-workspace-id', workspaceId || user.id);
  }

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    let rateLimitAction: RateLimitAction = 'magicLink';

    if (pathname.startsWith('/api/auth/') || pathname === '/api/auth/magic-link') {
      rateLimitAction = 'magicLink';
    } else if (pathname.startsWith('/api/composer/adapt') || pathname.startsWith('/api/composer/generate')) {
      rateLimitAction = 'aiGeneration';
    } else if (pathname.startsWith('/api/publish')) {
      rateLimitAction = 'publish';
    } else if (pathname.startsWith('/api/profile/')) {
      rateLimitAction = 'profileView';
    }

    const { success, remaining, reset } = await checkRateLimit(request, rateLimitAction);
    if (!success) {
      return addDebugHeaders(NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(remaining, reset) }
      ));
    }
  }

  // Security headers (applied to all responses)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' wss://*.supabase.co https://*.supabase.co https://*.anthropic.com https://api.openai.com https://*.upstash.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  response.headers.set('x-middleware-run', 'true');
  response.headers.set('x-middleware-path', pathname);

  // Update response with modified headers
  const finalResponse = NextResponse.next({ request: { headers: requestHeaders } });
  finalResponse.headers.set('x-middleware-run', 'true');
  finalResponse.headers.set('x-middleware-path', pathname);

  // Copy security headers
  finalResponse.headers.set('X-Content-Type-Options', 'nosniff');
  finalResponse.headers.set('X-Frame-Options', 'DENY');
  finalResponse.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  finalResponse.headers.set('Content-Security-Policy', response.headers.get('Content-Security-Policy') || '');

  return addDebugHeaders(finalResponse);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
};