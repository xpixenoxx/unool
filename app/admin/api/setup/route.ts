/**
 * POST /admin/api/setup
 *
 * One-time admin account setup / password reset endpoint.
 *
 * Flow:
 *  1. Check ADMIN_SETUP_KEY env var is set and matches the request body key.
 *  2. Look up (or create) a Supabase auth user for the given email.
 *  3. Look up (or create) the admin_users row.
 *  4. Hash and store the new password.
 *
 * This endpoint is protected by ADMIN_SETUP_KEY — set it to a long random secret
 * in Vercel env vars. After use, you can disable it by removing the env var.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { hashPassword } from '@/lib/auth/password';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: NextRequest) {
  try {
    const setupKey = process.env.ADMIN_SETUP_KEY;
    if (!setupKey) {
      return NextResponse.json(
        { error: 'Setup is disabled. Set ADMIN_SETUP_KEY env var to enable.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { key, email, password, role = 'super_admin' } = body as {
      key?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    if (!key || key !== setupKey) {
      return NextResponse.json({ error: 'Invalid setup key' }, { status: 401 });
    }
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // ── Step 1: Get or create Supabase auth user ───────────────
    const { data: userList } = await adminClient.auth.admin.listUsers();
    let authUser = userList?.users?.find((u) => u.email === emailLower);

    if (!authUser) {
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email: emailLower,
        email_confirm: true,
        user_metadata: { role },
      });
      if (createErr || !created.user) {
        return NextResponse.json(
          { error: `Failed to create auth user: ${createErr?.message}` },
          { status: 500 }
        );
      }
      authUser = created.user;
    }

    // ── Step 2: Hash the new password ─────────────────────────
    const passwordHash = await hashPassword(password);

    // ── Step 3: Upsert admin_users row ────────────────────────
    const { error: upsertErr } = await adminClient
      .from('admin_users')
      .upsert(
        {
          id: authUser.id,
          email: emailLower,
          role,
          permissions: {
            users: true,
            workspaces: true,
            plans: true,
            analytics: true,
            referrals: true,
            payments: true,
            subscriptions: true,
            audit: true,
            content: true,
            platforms: true,
          },
          password_hash: passwordHash,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (upsertErr) {
      return NextResponse.json(
        { error: `Failed to upsert admin user: ${upsertErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Admin account for ${emailLower} is ready. You can now log in.`,
      email: emailLower,
      role,
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json({ error: 'Setup failed. Check server logs.' }, { status: 500 });
  }
}

