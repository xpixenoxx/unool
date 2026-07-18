import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { config as appConfig } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitHeaders, RateLimitAction } from '@/lib/rate-limit';
import { getDevAuthContext, isDevAuthEnabled } from '@/lib/auth/dev/bypass';

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

  // Check for profile path /u/[subdomain] - pass through
  const subdomain = isProfilePath(pathname);
  if (subdomain) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('x-middleware-run', 'true');
    response.headers.set('x-middleware-path', pathname);
    return response;
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
    return response;
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
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(remaining, reset) }
      );
    }
  }

  // Check auth for protected routes
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/api/v1/') || pathname.startsWith('/api/profile');
  const supabaseConfigured = isSupabaseConfigured();
  const devAuthEnabled = isDevAuthEnabled();
  const devBypassCookie = request.cookies.has('dev-auth-bypass') || request.cookies.has(`sb-${appConfig.SUPABASE_PROJECT_ID || 'local'}-auth-token`);

  // DEBUG: Add debug headers to trace execution
  requestHeaders.set('x-debug-supabaseConfigured', String(supabaseConfigured));
  requestHeaders.set('x-debug-devAuthEnabled', String(devAuthEnabled));
  requestHeaders.set('x-debug-devBypassCookie', String(devBypassCookie));
  requestHeaders.set('x-debug-isProtectedRoute', String(isProtectedRoute));
  requestHeaders.set('x-debug-cookies', Array.from(request.cookies.getAll().map(c => c.name)).join(','));

  // Dev authentication bypass - set user/workspace headers if dev mode
  if (isProtectedRoute && devAuthEnabled && devBypassCookie) {
    const devContext = getDevAuthContext();
    if (devContext) {
      requestHeaders.set('x-user-id', devContext.userId);
      requestHeaders.set('x-workspace-id', devContext.workspaceId);
      requestHeaders.set('x-dev-auth', 'true');
    }
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
    return response;
  }

  // Pass through for all other cases
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('x-middleware-run', 'true');
  response.headers.set('x-middleware-path', pathname);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
};