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
  // Check for /u/[subdomain] path
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

  const { pathname, hostname } = request.nextUrl;

  // Check for profile path /u/[subdomain]
  const subdomain = isProfilePath(pathname);
  if (subdomain) {
    const debugResponse = NextResponse.next({ request: { headers: requestHeaders } });
    debugResponse.headers.set('x-middleware-run', 'true');
    debugResponse.headers.set('x-middleware-path', pathname);
    return debugResponse;
  }

  // Skip middleware for static assets and public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    publicPaths.some(p => pathname.startsWith(p))
  ) {
    const debugResponse = NextResponse.next({ request: { headers: requestHeaders } });
    debugResponse.headers.set('x-middleware-run', 'true');
    debugResponse.headers.set('x-middleware-path', pathname);
    return debugResponse;
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
  // /api/profile/extract is intentionally unprotected for dev testing - dev bypass in middleware not working
  const supabaseConfigured = isSupabaseConfigured();
  const devAuthEnabled = isDevAuthEnabled();
  const devBypassCookie = request.cookies.has('dev-auth-bypass') || request.cookies.has(`sb-${appConfig.SUPABASE_PROJECT_ID || 'local'}-auth-token`);

  // Debug info for headers
  const debugInfo = {
    debug: 'auth-check',
    supabaseConfigured: String(supabaseConfigured),
    devAuthEnabled: String(devAuthEnabled),
    devBypassCookie: String(devBypassCookie),
    anonKey: appConfig.SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
    projectId: appConfig.SUPABASE_PROJECT_ID || 'NOT_SET',
  };

  // DEBUG: Check if we enter the auth block
  if (isProtectedRoute) {
    const debugResponse = NextResponse.json({
      debug: 'auth-block-entered',
      isProtectedRoute,
      devAuthEnabled,
      devBypassCookie,
      supabaseConfigured,
      cookies: Array.from(request.cookies.getAll().map(c => c.name)),
    }, { status: 200 });
    debugResponse.headers.set('x-debug-path', 'auth-block-entered');
    debugResponse.headers.set('x-debug-devAuthEnabled', String(devAuthEnabled));
    debugResponse.headers.set('x-debug-devBypassCookie', String(devBypassCookie));
    debugResponse.headers.set('x-debug-supabaseConfigured', String(supabaseConfigured));
    return debugResponse;
  }

  // If not protected route, pass through
  const passThroughResponse = NextResponse.next({ request: { headers: requestHeaders } });
  passThroughResponse.headers.set('x-middleware-run', 'true');
  passThroughResponse.headers.set('x-middleware-path', pathname);
  return passThroughResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
};