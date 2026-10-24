import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { config } from '@/lib/config/schema';
import { isDevAuthEnabled } from '@/lib/auth/dev/bypass';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Development auth bypass cookie
    const devCookie = request.cookies.get('dev-auth-bypass')?.value;
    if (devCookie === 'true') {
      return NextResponse.json(
        { authenticated: true, redirectTo: '/dashboard' },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        }
      );
    }

    // 2. Injected headers from middleware.ts
    const headerUserId = request.headers.get('x-user-id');
    if (headerUserId) {
      return NextResponse.json(
        { authenticated: true, redirectTo: '/dashboard', userId: headerUserId },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        }
      );
    }

    // 3. Check for presence of Supabase auth cookie directly
    const allCookies = request.cookies.getAll();
    const authCookie = allCookies.find(
      (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token') && c.value && c.value.length > 20
    );

    if (authCookie) {
      try {
        const decoded = decodeURIComponent(authCookie.value);
        if (decoded.includes('access_token') || decoded.includes('user')) {
          return NextResponse.json(
            { authenticated: true, redirectTo: '/dashboard' },
            {
              status: 200,
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
              },
            }
          );
        }
      } catch {
        // Fall through to server client check
      }
    }

    // 4. Verify session with Supabase server client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || config.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || config.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        return NextResponse.json(
          { authenticated: true, redirectTo: '/dashboard', userId: user.id },
          {
            status: 200,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            },
          }
        );
      }
    }

    // 5. Visitor is not authenticated (guest / non-user)
    return NextResponse.json(
      { authenticated: false, redirectTo: '/' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (error) {
    // If any error occurs during check, treat as unauthenticated
    return NextResponse.json(
      { authenticated: false, redirectTo: '/' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  }
}
