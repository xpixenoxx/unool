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

  const { pathname } = request.nextUrl;

  // Check auth configuration at runtime
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/api/v1/') || pathname.startsWith('/api/profile');
  const supabaseConfigured = isSupabaseConfigured();
  const devAuthEnabled = isDevAuthEnabledRuntime();
  const devBypassCookie = request.cookies.has('dev-auth-bypass') || request.cookies.has(`sb-${appConfig.SUPABASE_PROJECT_ID || 'local'}-auth-token`);

  // DEBUG: Prepare debug headers (available for all return paths)
  const debugHeaders = new Headers();
  debugHeaders.set('x-debug-supabaseConfigured', String(supabaseConfigured));
  debugHeaders.set('x-debug-devAuthEnabled', String(devAuthEnabled));
  debugHeaders.set('x-debug-devBypassCookie', String(devBypassCookie));
  debugHeaders.set('x-debug-isProtectedRoute', String(isProtectedRoute));
  debugHeaders.set('x-debug-nodeEnv', process.env.NODE_ENV || 'unset');
  debugHeaders.set('x-debug-devAuthBypassEnv', process.env.DEV_AUTH_BYPASS || 'unset');
  debugHeaders.set('x-debug-cookies', Array.from(request.cookies.getAll().map(c => c.name)).join(','));

  // Helper to add debug headers to response
  const addDebugHeaders = (response: NextResponse) => {
    debugHeaders.forEach((value, key) => response.headers.set(key, value));
    return response;
  };

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

  // Dev authentication bypass - set user/workspace headers if dev mode
  if (isProtectedRoute && devAuthEnabled && devBypassCookie) {
    // Use deterministic dev IDs directly (bypass config module which was evaluated at build time)
    const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
    const DEV_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
    requestHeaders.set('x-user-id', DEV_USER_ID);
    requestHeaders.set('x-workspace-id', DEV_WORKSPACE_ID);
    requestHeaders.set('x-dev-auth', 'true');
  }

  // For protected routes without dev bypass, check Supabase session
  if (isProtectedRoute && supabaseConfigured && !(devAuthEnabled && devBypassCookie)) {
    // Create Supabase client in middleware to validate session
    const response = NextResponse.next({ request: { headers: requestHeaders } });

    const supabase = createServerClient(
      appConfig.SUPABASE_URL,
      appConfig.SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            requestHeaders.set('Set-Cookie', `${name}=${value}; Path=${options.path || '/'}; Max-Age=${options.maxAge || 0}; ${options.httpOnly ? 'HttpOnly;' : ''} ${options.secure ? 'Secure;' : ''} ${options.sameSite ? `SameSite=${options.sameSite};` : ''}`);
          },
          remove(name: string, options: CookieOptions) {
            requestHeaders.set('Set-Cookie', `${name}=; Path=${options.path || '/'}; Max-Age=0; ${options.httpOnly ? 'HttpOnly;' : ''} ${options.secure ? 'Secure;' : ''} ${options.sameSite ? `SameSite=${options.sameSite};` : ''}`);
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      requestHeaders.set('x-user-id', user.id);
      // Try to get workspace from user metadata or profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();
      if (profile) {
        requestHeaders.set('x-workspace-id', profile.workspace_id);
      }
    }
    response.headers.set('x-middleware-run', 'true');
    response.headers.set('x-middleware-path', pathname);
    return addDebugHeaders(response);
  }

  // Pass through for all other cases
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('x-middleware-run', 'true');
  response.headers.set('x-middleware-path', pathname);
  return addDebugHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
};