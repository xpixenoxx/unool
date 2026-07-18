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

  const { pathname, hostname } = request.nextUrl;

  // Check for profile path /u/[subdomain]
  const subdomain = isProfilePath(pathname);
  if (subdomain) {
    // Rewrite to /u/[subdomain] page - already at correct path, just pass through
    // The /u/[subdomain]/page.tsx will handle the profile rendering
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Skip middleware for static assets and public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    publicPaths.some(p => pathname.startsWith(p))
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
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

  // Create response early for cookie handling
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (isProtectedRoute && supabaseConfigured) {
    // Create Supabase client with response for cookie handling
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

    // Dev bypass: if enabled and dev bypass cookie present, inject dev user headers
    if (devAuthEnabled && devBypassCookie) {
      // Use deterministic UUIDs matching lib/auth/dev/bypass.ts and dev-bypass endpoint
      const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
      const DEV_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
      requestHeaders.set('x-user-id', DEV_USER_ID);
      requestHeaders.set('x-user-email', 'dev@unool.local');
      requestHeaders.set('x-workspace-id', DEV_WORKSPACE_ID);

      // Update response with new headers
      response.headers.set('x-middleware-forward-headers', 'true');
    } else {
      // Wrap Supabase auth check in timeout to prevent hanging (increased for production latency)
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 15000)
      );
      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

      if (!session) {
        if (pathname.startsWith('/api/')) {
          const errorResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          errorResponse.headers.set('x-unool-debug', debugInfo.debug);
          errorResponse.headers.set('x-unool-supabase-configured', debugInfo.supabaseConfigured);
          errorResponse.headers.set('x-unool-dev-auth-enabled', debugInfo.devAuthEnabled);
          errorResponse.headers.set('x-unool-dev-bypass-cookie', debugInfo.devBypassCookie);
          errorResponse.headers.set('x-unool-anon-key', debugInfo.anonKey);
          errorResponse.headers.set('x-unool-project-id', debugInfo.projectId);
          return errorResponse;
        }
        const loginUrl = new URL('/signup', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Add user info to headers for downstream use
      requestHeaders.set('x-user-id', session.user.id);
      requestHeaders.set('x-user-email', session.user.email || '');

      // Update response with new headers
      response.headers.set('x-middleware-forward-headers', 'true');
    }
  }

  // Debug headers
  response.headers.set('x-unool-debug', debugInfo.debug);
  response.headers.set('x-unool-supabase-configured', debugInfo.supabaseConfigured);
  response.headers.set('x-unool-dev-auth-enabled', debugInfo.devAuthEnabled);
  response.headers.set('x-unool-dev-bypass-cookie', debugInfo.devBypassCookie);
  response.headers.set('x-unool-anon-key', debugInfo.anonKey);
  response.headers.set('x-unool-project-id', debugInfo.projectId);

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // HSTS (only in production)
  if (appConfig.NODE_ENV === 'production' && appConfig.ENABLE_HSTS) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Permissions Policy
  response.headers.set('Permissions-Policy', [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=()',
    'cross-origin-isolated=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'execution-while-not-rendered=()',
    'execution-while-out-of-viewport=()',
    'fullscreen=()',
    'geolocation=()',
    'gyroscope=()',
    'hid=()',
    'identity-credentials-get=()',
    'idle-detection=()',
    'keyboard-map=()',
    'local-fonts=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'otp-credentials=()',
    'payment=()',
    'picture-in-picture=()',
    'publickey-credentials-create=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'serial=()',
    'speaker-selection=()',
    'sync-xhr=()',
    'usb=()',
    'web-share=()',
    'window-management=()',
    'xr-spatial-tracking=()',
  ].join(', '));

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' wss://*.supabase.co https://*.supabase.co https://*.anthropic.com https://api.openai.com https://*.upstash.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  if (appConfig.CSP_REPORT_URI) {
    cspDirectives.push(`report-uri ${appConfig.CSP_REPORT_URI}`);
  }

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
};