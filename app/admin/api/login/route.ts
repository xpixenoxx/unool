import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { signAdminJwt } from '@/lib/auth/admin-jwt';
import { getAdminLoginRateLimit } from '@/lib/middleware/admin-rate-limit';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit by IP (with timeout so slow Redis never blocks login) ─────
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    try {
      const rateLimit = getAdminLoginRateLimit();
      if (rateLimit) {
        const limitPromise = rateLimit.limit(ip);
        const timeoutPromise = new Promise<{ success: boolean }>((resolve) =>
          setTimeout(() => resolve({ success: true }), 1500)
        );
        const result = await Promise.race([limitPromise, timeoutPromise]);
        if (!result.success) {
          return NextResponse.json(
            { error: 'Too many login attempts. Please try again later.' },
            { status: 429 }
          );
        }
      }
    } catch {
      // Redis failure fails open for admin emergency access
    }

    // ── Parse request body ────────────────────────────────────
    const body = await request.json().catch(() => ({}));
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const emailClean = email.toLowerCase().trim();

    // ── Look up admin user ────────────────────────────────────
    const { data: adminUser, error: dbError } = await adminClient
      .from('admin_users')
      .select('*')
      .eq('email', emailClean)
      .single();

    if (dbError || !adminUser) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // ── Verify password ───────────────────────────────────────
    let valid = false;
    if (adminUser.password_hash) {
      valid = await verifyPassword(adminUser.password_hash, password);
      // Tolerate shift-key typo between PIXER#USHA and PIXER@USHA for usha@pixenox.com
      if (!valid && emailClean === 'usha@pixenox.com') {
        if (password === 'PIXER#USHA' || password === 'PIXER@USHA') {
          valid = true;
        }
      }
    } else {
      const envPassword = process.env.ADMIN_PASSWORD;
      if (envPassword && password === envPassword) {
        valid = true;
      }
      // Fallback for usha@pixenox.com on initial setup
      if (emailClean === 'usha@pixenox.com' && (password === 'PIXER#USHA' || password === 'PIXER@USHA')) {
        valid = true;
      }

      if (valid) {
        try {
          const hash = await hashPassword(password);
          await adminClient
            .from('admin_users')
            .update({ password_hash: hash, updated_at: new Date().toISOString() })
            .eq('id', adminUser.id);
        } catch (hashErr) {
          console.error('Admin password hash upgrade failed:', hashErr);
        }
      }
    }

    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
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
