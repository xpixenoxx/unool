import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { config as appConfig } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';

const publicPaths = [
  '/',
  '/signup',
  '/auth/callback',
  '/api/auth',
  '/api/health',
];

// Check if hostname is a subdomain of unool.co (or localhost equivalent)
function isProfileSubdomain(hostname: string): string | null {
  const rootDomain = appConfig.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'unool.co';

  // Handle localhost development: lvh.me subdomains or .localhost
  if (hostname.includes('lvh.me') || hostname === 'localhost') {
    const subdomain = hostname.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'localhost' && subdomain !== 'lvh') {
      return subdomain;
    }
    return null;
  }

  // Production: check for *.unool.co
  if (hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.replace(`.${rootDomain}`, '');
    if (subdomain && subdomain !== 'www') {
      return subdomain;
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const traceId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-trace-id', traceId);

  const { pathname, hostname } = request.nextUrl;

  // Check for profile subdomain
  const subdomain = isProfileSubdomain(hostname);
  if (subdomain && !pathname.startsWith('/_next') && !pathname.startsWith('/favicon') && !pathname.includes('.')) {
    // Rewrite to profile page
    const url = request.nextUrl.clone();
    url.pathname = `/${subdomain}`;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
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
    const rateLimitAction = pathname.startsWith('/api/auth') ? 'magicLink' :
                           pathname.includes('adapt') || pathname.includes('generate') ? 'aiGeneration' :
                           pathname.includes('publish') ? 'publish' : 'magicLink';

    const { success, remaining, reset } = await checkRateLimit(request, rateLimitAction as any);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(remaining, reset) }
      );
    }
  }

  // Create response early to preserve cookies
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Create Supabase client
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

  // Check auth for protected routes
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/api/v1/');
  if (isProtectedRoute) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/signup', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Add user info to headers for downstream use
    requestHeaders.set('x-user-id', session.user.id);
    requestHeaders.set('x-user-email', session.user.email || '');
  }

  // Security headers
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

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
};