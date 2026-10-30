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
  '/s',
  '/privacy',
  '/terms',
  '/forgot-password',
];

// Admin paths that should be public (no auth required)
const publicAdminPaths = [
  '/admin/login',
  '/admin/api/login',
  '/admin/api/logout',
  '/admin/api/setup',
];

function decodeBase64Url(str: string): string {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'base64url').toString();
    }
  } catch {}
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

// Admin session validation — checks signed JWT cookie structure and expiry.
// Full signature verification happens in API routes via requireAdmin().
// This is a lightweight check so the edge middleware stays fast.
function validateAdminAuth(request: NextRequest): boolean {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    if (!payload.adminId || !payload.exp) return false;
    // Reject expired tokens
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
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

  // ── Referral cookie: capture ?ref=CODE on any page ───────────────────────────
  // Set server-side so it's available immediately (before JS hydration).
  // Only set if not already set to avoid overwriting an existing referrer.
  const refParam = request.nextUrl.searchParams.get('ref');
  const existingRefCookie = request.cookies.get('unool_ref')?.value;
  let refResponse: NextResponse | null = null;

  if (refParam && refParam.length >= 4 && refParam.length <= 20 && /^[A-Z0-9]+$/i.test(refParam) && !existingRefCookie) {
    // We'll apply this cookie to whatever response we return below
    refResponse = NextResponse.next();
    refResponse.cookies.set('unool_ref', refParam.toUpperCase(), {
      httpOnly: false,  // readable by client JS too
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  // Admin auth check - BEFORE other checks
  if (pathname.startsWith('/admin')) {
    if (isPublicAdminPath(pathname)) {
      return refResponse ?? NextResponse.next();
    }

    const isAdminAuthed = validateAdminAuth(request);
    if (!isAdminAuthed) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return refResponse ?? NextResponse.next();
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

  if (
    hostSubdomain &&
    !pathname.startsWith('/u/') &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/signin') &&
    !pathname.startsWith('/signup')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/u/${hostSubdomain}${pathname === '/' ? '' : pathname}`;
    const rewriteRes = NextResponse.rewrite(url);
    if (refResponse) {
      refResponse.cookies.getAll().forEach(({ name, value, ...opts }) =>
        rewriteRes.cookies.set(name, value, opts)
      );
    }
    return rewriteRes;
  }

  // Public paths
  if (!hostSubdomain && isPublicPath(pathname)) {
    return refResponse ?? NextResponse.next();
  }

  // Profile paths
  if (isProfilePath(pathname)) {
    return refResponse ?? NextResponse.next();
  }

  // ── Protected Dashboard Routes ───────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const isDevAuth = request.cookies.get('dev-auth-bypass')?.value === 'true' || process.env.DEV_AUTH_BYPASS === 'true';
    const allCookies = request.cookies.getAll();
    const hasAuthCookie = allCookies.some(
      (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token') && c.value && c.value.length > 5
    );

    if (!isDevAuth && !hasAuthCookie) {
      const signinUrl = new URL('/signin', request.url);
      signinUrl.searchParams.set('redirect', pathname);
      const redirectResponse = NextResponse.redirect(signinUrl);
      redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      redirectResponse.headers.set('Pragma', 'no-cache');
      redirectResponse.headers.set('Expires', '0');
      return redirectResponse;
    }

    return refResponse ?? NextResponse.next();
  }

  // ── Inject auth identity headers for API routes ──────────────────────────
  // Resolves BOTH x-user-id + x-workspace-id so getCurrentAuth() can return
  // instantly from headers without any DB round-trip.
  if (pathname.startsWith('/api/')) {
    if (!request.headers.get('x-user-id')) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
              getAll() { return request.cookies.getAll(); },
              setAll() {},
            },
          });
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-user-id', user.id);

            // Also resolve workspace ID so getCurrentAuth needs zero DB calls
            if (supabaseServiceKey) {
              try {
                const { createClient: createSbClient } = await import('@supabase/supabase-js');
                const admin = createSbClient(supabaseUrl, supabaseServiceKey);
                // Use a short timeout (1.5s) so a slow DB never blocks the API call
                const workspacePromise = admin
                  .from('workspace_members')
                  .select('workspace_id')
                  .eq('user_id', user.id)
                  .single();
                const timeoutPromise = new Promise<{ data: null; error: Error }>(
                  (resolve) => setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 1500)
                );
                const result = await Promise.race([workspacePromise, timeoutPromise]);
                const workspaceId = result.data?.workspace_id || user.id;
                requestHeaders.set('x-workspace-id', workspaceId);
              } catch {
                // workspace lookup failed — getCurrentAuth will resolve it
              }
            }

            return NextResponse.next({ request: { headers: requestHeaders } });
          }
        }
      } catch {
        // Auth injection failed — let routes handle their own auth
      }
    }
  }

  // For everything else, allow through (let page components handle auth)
  return refResponse ?? NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.html$).*)',
  ],
};
