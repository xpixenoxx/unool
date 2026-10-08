import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const publicPaths = [
  '/',
  '/signup',
  '/signin',
  '/auth/callback',
  '/api/auth',
  '/api/health',
  '/u',
  '/privacy',
  '/privacy-policy',
  '/terms',
  '/terms-of-service',
  '/forgot-password',
];

// Admin paths that should be public (no auth required)
const publicAdminPaths = [
  '/admin/login',
  '/admin/api/login',
  '/admin/api/logout',
];

// Simple admin credentials
const ADMIN_CREDENTIALS = {
  username: 'asd@asd.com',
  password: 'asd@asd.com',
};

function validateAdminAuth(request: NextRequest): boolean {
  const adminSession = request.cookies.get('admin_session')?.value;
  if (adminSession === 'authenticated') {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
      const [username, password] = credentials.split(':');
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        return true;
      }
    } catch {
      // Ignore decode errors
    }
  }

  return false;
}

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function isPublicAdminPath(pathname: string): boolean {
  return publicAdminPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function isProfilePath(pathname: string): string | null {
  const match = pathname.match(/^\/u\/([^/]+)(?:\/|$)/);
  if (match) {
    const subdomain = match[1];
    if (subdomain && !['www', 'dashboard', 'api', 'signup', 'auth', 'health'].includes(subdomain)) {
      return subdomain;
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Admin auth check - BEFORE other checks
  if (pathname.startsWith('/admin')) {
    if (isPublicAdminPath(pathname)) {
      return NextResponse.next();
    }

    const isAdminAuthed = validateAdminAuth(request);
    if (!isAdminAuthed) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      return response;
    }

    // Set cookie if authenticated via Basic Auth
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Basic ')) {
      try {
        const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
        const [username, password] = credentials.split(':');
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
          const response = NextResponse.next();
          response.cookies.set('admin_session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/admin',
          });
          return response;
        }
      } catch {
        // Ignore
      }
    }

    return NextResponse.next();
  }

  // Host-based subdomain routing
  const hostname = request.headers.get('host') || '';
  let hostSubdomain: string | null = null;

  if (hostname.endsWith('.unool.co') && hostname !== 'unool.co' && hostname !== 'www.unool.co') {
    hostSubdomain = hostname.replace('.unool.co', '');
  } else if (hostname.includes('.localhost:')) {
    const match = hostname.match(/^([^.]+)\.localhost:\d+$/);
    if (match) hostSubdomain = match[1];
  }

  if (hostSubdomain && !pathname.startsWith('/u/') && !pathname.startsWith('/api/')) {
    const url = request.nextUrl.clone();
    url.pathname = `/u/${hostSubdomain}${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Public paths
  if (!hostSubdomain && isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Profile paths
  if (isProfilePath(pathname)) {
    return NextResponse.next();
  }

  // ── Inject auth identity headers for API routes ──────────────────────────
  // This enables getCurrentAuth() to take its fast "header" path instead of
  // doing sequential Supabase + DB calls on every request.
  if (pathname.startsWith('/api/')) {
    // Only inject if headers aren't already present (e.g. from a trusted caller)
    if (!request.headers.get('x-user-id')) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll() { /* read-only in middleware */ },
            },
          });
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-user-id', user.id);
            // x-workspace-id will be resolved by getCurrentAuth from the DB
            // (or the route can pass it via query params)
            return NextResponse.next({ request: { headers: requestHeaders } });
          }
        }
      } catch {
        // Auth injection failed — let routes handle their own auth
      }
    }
  }

  // For everything else, allow through (let page components handle auth)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
};