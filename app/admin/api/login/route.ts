import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { signAdminJwt } from '@/lib/auth/admin-jwt';
import { getAdminLoginRateLimit } from '@/lib/middleware/admin-rate-limit';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit by IP ──────────────────────────────────────
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = getAdminLoginRateLimit();
    if (rateLimit) {
      const { success } = await rateLimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // ── Parse request body ────────────────────────────────────
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // ── Look up admin user ────────────────────────────────────
    const { data: adminUser, error: dbError } = await adminClient
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (dbError || !adminUser) {
      // Generic error message to prevent email enumeration
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // ── Verify password ───────────────────────────────────────
    // If password_hash exists in DB, verify with argon2
    // Otherwise, fall back to ADMIN_PASSWORD env variable for initial setup
    if (adminUser.password_hash) {
      const argon2 = await import('argon2');
      const valid = await argon2.verify(adminUser.password_hash, password);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    } else {
      // Temporary fallback for initial setup before password is hashed
      const envPassword = process.env.ADMIN_PASSWORD;
      if (!envPassword || password !== envPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    // ── Check if account is active ────────────────────────────
    if (adminUser.is_active === false) {
      return NextResponse.json(
        { error: 'Account is disabled. Contact a super admin.' },
        { status: 403 }
      );
    }

    // ── Update last login timestamp ───────────────────────────
    await adminClient
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminUser.id);

    // ── Sign JWT and set cookie ───────────────────────────────
    const token = signAdminJwt({
      adminId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      permissions: adminUser.permissions || {},
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
    });

    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours (matches JWT expiry)
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
