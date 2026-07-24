import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { config } from '@/lib/config/schema';

// GET /api/auth/impersonate/callback - Handle impersonation callback
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const impersonateId = searchParams.get('impersonate');

  if (!token) {
    return NextResponse.redirect(new URL('/admin/impersonate?error=invalid_token', request.url));
  }

  // Create response to set cookies
  const response = NextResponse.redirect(new URL('/dashboard', request.url));

  // Create Supabase client and set auth cookie
  const supabase = createServerClient(
    config.SUPABASE_URL,
    config.SUPABASE_ANON_KEY,
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

  // Set the session using the impersonation token
  const { data, error } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: '', // Not needed for magic link
  });

  if (error) {
    console.error('Failed to set impersonation session:', error);
    return NextResponse.redirect(new URL('/admin/impersonate?error=session_failed', request.url));
  }

  // Add impersonation indicator to cookie
  response.cookies.set('impersonating', impersonateId || 'true', {
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  // Set admin user cookie for reference
  response.cookies.set('impersonated_as', impersonateId || '', {
    path: '/',
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return response;
}