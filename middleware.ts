import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isOriginAllowed } from '@/lib/security/cors';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  signInternalAuthHeaders,
  INTERNAL_AUTH_SIGNATURE_HEADER,
} from '@/lib/auth/internal-header';

function applyApiCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return response;
  }

  response.headers.set('Vary', 'Origin');
  const origin = request.headers.get('origin');
  const allowedOrigin = isOriginAllowed(origin);
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-Requested-With, Content-Type, Authorization'
    );
  }
  return response;
}

const publicPaths = [
  '/',
  '/signup',
  '/signin',
  '/auth/callback',
  '/api/auth',
  '/api/feature-flags',
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
  } catch { }
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

const customDomainCache = new Map<string, { subdomain: string | null; expiresAt: number }>();
const CUSTOM_DOMAIN_TTL_MS = 60_000;

function pickValidSupabaseEnv(...candidates: Array<string | undefined>): string | undefined {
  for (const c of candidates) {
    if (!c) continue;
    const v = c.trim();
    if (
      v &&
      !v.includes('your-project.supabase.co') &&
      v !== 'your-anon-key' &&
      v !== 'your-service-role-key'
    ) {
      return v;
    }
  }
  return undefined;
}

interface CachedSignedIdentity {
  userId: string;
  workspaceId: string;
  sig: string | null;
  expiresAt: number;
}

const IDENTITY_CACHE_TTL_MS = 30_000;
const signedIdentityCache = new Map<string, CachedSignedIdentity>();
const signedIdentityInFlight = new Map<
  string,
  Promise<Omit<CachedSignedIdentity, 'expiresAt'> | null>
>();

async function resolveWorkspaceIdForMiddleware(
  userId: string,
  preferredWsId: string
): Promise<{ workspaceId: string; timedOut: boolean }> {
  let timedOut = false;

  const resolveWs = async (): Promise<string> => {
    if (preferredWsId) {
      const { data: prefMember } = await supabaseAdmin
        .from('workspace_members')
        .select('workspace_id, status')
        .eq('workspace_id', preferredWsId)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      if (prefMember?.workspace_id && (!prefMember.status || prefMember.status === 'active')) {
        return prefMember.workspace_id;
      }
      const { data: prefOwner } = await supabaseAdmin
        .from('workspaces')
        .select('id')
        .eq('id', preferredWsId)
        .eq('owner_id', userId)
        .limit(1)
        .maybeSingle();
      if (prefOwner?.id) {
        return prefOwner.id;
      }
    }

    const { data: firstMember } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id, status')
      .eq('user_id', userId)
      .or('status.eq.active,status.is.null')
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (firstMember?.workspace_id) {
      return firstMember.workspace_id;
    }

    const { data: firstOwned } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    return firstOwned?.id || userId;
  };

  const timeoutPromise = new Promise<string>((resolve) =>
    setTimeout(() => {
      timedOut = true;
      resolve(userId);
    }, 1500)
  );
  const workspaceId = await Promise.race([resolveWs(), timeoutPromise]);
  return { workspaceId, timedOut };
}

async function resolveSignedIdentity(
  request: NextRequest
): Promise<Omit<CachedSignedIdentity, 'expiresAt'> | null> {
  const allCookies = request.cookies.getAll();
  const authCookies = allCookies
    .filter(
      (c) =>
        c.name.startsWith('sb-') &&
        !c.name.startsWith('sb-your-project-') &&
        c.name.includes('-auth-token') &&
        c.value &&
        c.value.length > 5
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const authHeader = request.headers.get('authorization');
  const rawBearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const bearerToken = rawBearer && rawBearer.split('.').length === 3 ? rawBearer : '';

  if (authCookies.length === 0 && !bearerToken) {
    return null;
  }

  const preferredWsId = request.cookies.get('active_workspace_id')?.value?.trim() || '';
  const cookieSig = authCookies.map((c) => `${c.name}=${c.value}`).join('&');
  const cacheKey = cookieSig
    ? `cookie:${cookieSig}:ws:${preferredWsId}`
    : `bearer:${bearerToken}:ws:${preferredWsId}`;

  const cached = signedIdentityCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { userId: cached.userId, workspaceId: cached.workspaceId, sig: cached.sig };
  }

  const existingFlight = signedIdentityInFlight.get(cacheKey);
  if (existingFlight) {
    return existingFlight;
  }

  const work = (async (): Promise<Omit<CachedSignedIdentity, 'expiresAt'> | null> => {
    try {
      let user: { id: string; user_metadata?: Record<string, unknown> } | null = null;

      if (authCookies.length > 0) {
        const supabaseUrl = pickValidSupabaseEnv(
          process.env.SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_URL
        );
        const supabaseAnonKey = pickValidSupabaseEnv(
          process.env.SUPABASE_ANON_KEY,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        if (!supabaseUrl || !supabaseAnonKey) {
          return null;
        }
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            getAll() {
              return allCookies;
            },
            setAll() { },
          },
        });
        const { data } = await supabase.auth.getUser();
        user = data.user;
      } else if (bearerToken) {
        const { data } = await supabaseAdmin.auth.getUser(bearerToken);
        user = data.user;
      }

      if (!user || user.user_metadata?.is_deleted === true) {
        return null;
      }

      const { workspaceId, timedOut } = await resolveWorkspaceIdForMiddleware(
        user.id,
        preferredWsId
      );
      const sig = await signInternalAuthHeaders(user.id, workspaceId);
      const identity = { userId: user.id, workspaceId, sig };

      if (!timedOut) {
        if (signedIdentityCache.size > 500) {
          signedIdentityCache.clear();
        }
        signedIdentityCache.set(cacheKey, {
          ...identity,
          expiresAt: Date.now() + IDENTITY_CACHE_TTL_MS,
        });
      }

      return identity;
    } catch {
      return null;
    }
  })();

  signedIdentityInFlight.set(cacheKey, work);
  try {
    return await work;
  } finally {
    signedIdentityInFlight.delete(cacheKey);
  }
}

async function resolveVerifiedCustomDomainSubdomain(hostWithoutPort: string): Promise<string | null> {
  const now = Date.now();
  const cached = customDomainCache.get(hostWithoutPort);
  if (cached && cached.expiresAt > now) {
    return cached.subdomain;
  }

  try {
    const lookupPromise = supabaseAdmin
      .from('profiles')
      .select('subdomain')
      .eq('custom_domain', hostWithoutPort)
      .not('custom_domain_verified_at', 'is', null)
      .is('deleted_at', null)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 1500)
    );

    const result = await Promise.race([lookupPromise, timeoutPromise]);
    const subdomain = typeof result.data?.subdomain === 'string' ? result.data.subdomain : null;
    customDomainCache.set(hostWithoutPort, { subdomain, expiresAt: now + CUSTOM_DOMAIN_TTL_MS });
    return subdomain;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets (never skip /api/* routes containing dots)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    (!pathname.startsWith('/api/') && pathname.includes('.') && !pathname.endsWith('.rsc'))
  ) {
    return NextResponse.next();
  }

  // ── Referral cookie: capture ?ref=CODE on any page ───────────────────────────
  // Set server-side so it's available immediately (before JS hydration).
  // Only set if not already set to avoid overwriting an existing referrer.
  const refParam = request.nextUrl.searchParams.get('ref')?.trim();
  const existingRefCookie = request.cookies.get('unool_ref')?.value?.trim();
  let refResponse: NextResponse | null = null;

  if (refParam && refParam.length >= 3 && refParam.length <= 32 && /^[A-Z0-9_-]+$/i.test(refParam) && !existingRefCookie) {
    // We'll apply this cookie to whatever response we return below
    refResponse = NextResponse.next();
    refResponse.cookies.set('unool_ref', refParam.toUpperCase(), {
      httpOnly: false,  // readable by client JS too
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  const copyRefCookies = (res: NextResponse) => {
    if (refResponse) {
      refResponse.cookies.getAll().forEach(({ name, value, ...opts }) =>
        res.cookies.set(name, value, opts)
      );
    }
    return res;
  };

  // Admin auth check - BEFORE other checks
  if (pathname.startsWith('/admin')) {
    if (isPublicAdminPath(pathname)) {
      return refResponse ?? NextResponse.next();
    }

    const isAdminAuthed = validateAdminAuth(request);
    if (!isAdminAuthed) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return copyRefCookies(NextResponse.redirect(loginUrl));
    }

    return refResponse ?? NextResponse.next();
  }

  // Host-based canonical redirect (www.unool.co -> unool.co), subdomain, and verified custom-domain routing
  const rawHost = (request.headers.get('host') || '').toLowerCase();
  const hostWithoutPort = rawHost.split(':')[0];

  if (
    hostWithoutPort === 'www.unool.co' &&
    (request.method === 'GET' || request.method === 'HEAD') &&
    !pathname.startsWith('/api/webhooks')
  ) {
    return copyRefCookies(
      NextResponse.redirect(
        new URL(`https://unool.co${pathname}${request.nextUrl.search}`),
        308
      )
    );
  }

  let hostSubdomain: string | null = null;

  if (hostWithoutPort.endsWith('.unool.co') && hostWithoutPort !== 'unool.co' && hostWithoutPort !== 'www.unool.co') {
    hostSubdomain = hostWithoutPort.replace('.unool.co', '');
  } else if (rawHost.includes('.localhost:')) {
    const match = rawHost.match(/^([^.]+)\.localhost:\d+$/);
    if (match) hostSubdomain = match[1];
  } else if (
    hostWithoutPort &&
    hostWithoutPort !== 'unool.co' &&
    hostWithoutPort !== 'www.unool.co' &&
    hostWithoutPort !== 'localhost' &&
    hostWithoutPort !== '127.0.0.1' &&
    !hostWithoutPort.endsWith('.workers.dev') &&
    !hostWithoutPort.endsWith('.vercel.app') &&
    !pathname.startsWith('/u/') &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/signin') &&
    !pathname.startsWith('/signup')
  ) {
    hostSubdomain = await resolveVerifiedCustomDomainSubdomain(hostWithoutPort);
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

  // Security: Strip all internal auth/workspace/impersonation headers from every incoming request
  // before any public-path or rewrite branch executes.
  const sanitizedHeaders = new Headers(request.headers);
  sanitizedHeaders.delete('x-user-id');
  sanitizedHeaders.delete('x-workspace-id');
  sanitizedHeaders.delete('x-plan-tier');
  sanitizedHeaders.delete('x-impersonating');
  sanitizedHeaders.delete('x-unool-internal-auth');

  const attachRefCookie = (res: NextResponse) => {
    if (refResponse) {
      refResponse.cookies.getAll().forEach(({ name, value, ...opts }) =>
        res.cookies.set(name, value, opts)
      );
    }
    return res;
  };

  // Handle CORS preflight strictly using allowlisted origins
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    const allowedOrigin = isOriginAllowed(origin);
    if (origin && !allowedOrigin) {
      return new NextResponse(null, { status: 403, headers: { Vary: 'Origin' } });
    }
    return applyApiCorsHeaders(request, new NextResponse(null, { status: 204 }));
  }

  // Public paths (still strip spoofed internal identity headers for /api/auth/* etc.)
  // /api/auth/platform/* (OAuth connect/callback) needs the signed-in identity, so it must go
  // through the identity-injection branch below instead of the public-path shortcut.
  if (!hostSubdomain && isPublicPath(pathname) && !pathname.startsWith('/api/auth/platform/')) {
    return applyApiCorsHeaders(
      request,
      attachRefCookie(NextResponse.next({ request: { headers: sanitizedHeaders } }))
    );
  }

  // Profile paths
  if (isProfilePath(pathname)) {
    return attachRefCookie(NextResponse.next());
  }

  // ── Protected Dashboard Routes ───────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const allCookies = request.cookies.getAll();
    const hasAuthCookie = allCookies.some(
      (c) =>
        c.name.startsWith('sb-') &&
        !c.name.startsWith('sb-your-project-') &&
        c.name.includes('-auth-token') &&
        c.value &&
        c.value.length > 5
    );

    if (!hasAuthCookie) {
      const signinUrl = new URL('/signin', request.url);
      // Only carry the pathname (plus safe referral param if present) so that OAuth
      // error params like ?error=unauthorized never resurface on the login page.
      signinUrl.searchParams.set('redirect', pathname);
      const effectiveRef = existingRefCookie || (refParam && /^[A-Z0-9_-]{3,32}$/i.test(refParam) ? refParam.toUpperCase() : '');
      if (effectiveRef) {
        signinUrl.searchParams.set('ref', effectiveRef);
      }
      const redirectResponse = copyRefCookies(NextResponse.redirect(signinUrl));
      redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      redirectResponse.headers.set('Pragma', 'no-cache');
      redirectResponse.headers.set('Expires', '0');
      return redirectResponse;
    }

    const identity = await resolveSignedIdentity(request);
    if (identity) {
      sanitizedHeaders.set('x-user-id', identity.userId);
      sanitizedHeaders.set('x-workspace-id', identity.workspaceId);
      if (identity.sig) {
        sanitizedHeaders.set(INTERNAL_AUTH_SIGNATURE_HEADER, identity.sig);
      }
    }

    return attachRefCookie(NextResponse.next({ request: { headers: sanitizedHeaders } }));
  }

  // ── Inject auth identity headers for API routes ──────────────────────────
  if (pathname.startsWith('/api/')) {
    if (!pathname.startsWith('/api/webhooks/') && !pathname.startsWith('/api/cron/')) {
      const identity = await resolveSignedIdentity(request);
      if (identity) {
        sanitizedHeaders.set('x-user-id', identity.userId);
        sanitizedHeaders.set('x-workspace-id', identity.workspaceId);
        if (identity.sig) {
          sanitizedHeaders.set(INTERNAL_AUTH_SIGNATURE_HEADER, identity.sig);
        }
      }
    }

    return applyApiCorsHeaders(
      request,
      attachRefCookie(NextResponse.next({ request: { headers: sanitizedHeaders } }))
    );
  }

  // For everything else, allow through (let page components handle auth)
  return refResponse ?? NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.html$).*)',
  ],
};
