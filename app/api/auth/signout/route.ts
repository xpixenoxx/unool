import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { config } from '@/lib/config/schema';

export async function POST() {
  const cookieStore = await cookies();

  try {
    const supabase = createServerClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    });

    await supabase.auth.signOut();
  } catch (err) {
    console.warn('[SignOut] Supabase signOut error:', err);
  }

  // Explicitly wipe all auth session cookies
  cookieStore.getAll().forEach((c) => {
    if (c.name.startsWith('sb-') || c.name === 'dev-auth-bypass' || c.name === 'admin_session') {
      try {
        cookieStore.set(c.name, '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        });
      } catch {
        // Ignore
      }
    }
  });

  const response = NextResponse.json({ success: true });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}