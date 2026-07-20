import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { config } from '@/lib/config/schema';

export async function POST() {
  const cookieStore = await cookies();
  const projectRef = config.SUPABASE_PROJECT_ID || 'local';

  // Clear Supabase auth cookies
  cookieStore.set(`sb-${projectRef}-auth-token`, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  cookieStore.set('dev-auth-bypass', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ success: true });
}