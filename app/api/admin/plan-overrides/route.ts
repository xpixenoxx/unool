import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { listAllActiveOverrides, createOverride } from '@/lib/billing/overrides';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const sbAdmin = () => createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

/**
 * GET /api/admin/plan-overrides
 * List all active custom pricing overrides.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'plans');
  if (auth instanceof NextResponse) return auth;

  try {
    const overrides = await listAllActiveOverrides();
    return NextResponse.json(overrides);
  } catch (error) {
    console.error('Failed to list plan overrides:', error);
    return NextResponse.json({ error: 'Failed to list plan overrides' }, { status: 500 });
  }
}

/**
 * POST /api/admin/plan-overrides
 * Create a custom pricing override for a specific user/workspace.
 *
 * Body:
 *   userEmail: string          — search by email to find the user
 *   planId: string             — 'creator' | 'pro' | 'studio'
 *   customMonthlyInr?: number  — e.g. 69900 for ₹699 (paise)
 *   customYearlyInr?: number
 *   customAnnualMonthlyInr?: number
 *   customMonthlyUsd?: number  — e.g. 700 for $7.00 (cents)
 *   customYearlyUsd?: number
 *   note?: string              — admin note (reason for override)
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'plans');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const {
      userEmail,
      planId,
      customMonthlyInr,
      customYearlyInr,
      customAnnualMonthlyInr,
      customMonthlyUsd,
      customYearlyUsd,
      note,
    } = body;

    if (!userEmail || !planId) {
      return NextResponse.json(
        { error: 'userEmail and planId are required' },
        { status: 400 }
      );
    }

    if (!['creator', 'pro', 'studio'].includes(planId)) {
      return NextResponse.json(
        { error: 'Override only valid for paid plans: creator, pro, studio' },
        { status: 400 }
      );
    }

    // At least one custom price must be provided
    const hasPrices = [
      customMonthlyInr, customYearlyInr, customMonthlyUsd, customYearlyUsd,
    ].some((v) => typeof v === 'number' && v > 0);

    if (!hasPrices) {
      return NextResponse.json(
        { error: 'At least one custom price must be provided (and > 0)' },
        { status: 400 }
      );
    }

    // ── Look up user by email ────────────────────────────────
    const client = sbAdmin();
    const { data: { users }, error: listError } = await client.auth.admin.listUsers();
    if (listError) throw new Error('Failed to search users');

    const targetUser = users.find(
      (u) => u.email?.toLowerCase() === userEmail.toLowerCase().trim()
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: `No user found with email: ${userEmail}` },
        { status: 404 }
      );
    }

    // ── Look up their primary workspace ─────────────────────
    const { data: membership, error: wsError } = await client
      .from('workspace_members')
      .select('workspace_id, role, workspaces(id, name, owner_id)')
      .eq('user_id', targetUser.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (wsError || !membership) {
      return NextResponse.json(
        { error: `User ${userEmail} has no workspace. They need to sign up first.` },
        { status: 404 }
      );
    }

    const workspaceId = membership.workspace_id as string;
    const userName =
      targetUser.user_metadata?.full_name ||
      targetUser.user_metadata?.name ||
      null;

    // ── Create the override ──────────────────────────────────
    const override = await createOverride({
      workspaceId,
      userId: targetUser.id,
      userEmail: targetUser.email || userEmail,
      userName,
      planId,
      customMonthlyInr: typeof customMonthlyInr === 'number' ? customMonthlyInr : undefined,
      customYearlyInr: typeof customYearlyInr === 'number' ? customYearlyInr : undefined,
      customAnnualMonthlyInr: typeof customAnnualMonthlyInr === 'number' ? customAnnualMonthlyInr : undefined,
      customMonthlyUsd: typeof customMonthlyUsd === 'number' ? customMonthlyUsd : undefined,
      customYearlyUsd: typeof customYearlyUsd === 'number' ? customYearlyUsd : undefined,
      note,
      createdByAdminId: auth.admin.userId,
    });

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'plan_override_create',
      'user_plan_override',
      override.id,
      { userEmail, planId, customMonthlyInr, workspaceId }
    );

    return NextResponse.json(override, { status: 201 });
  } catch (error) {
    console.error('Failed to create plan override:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create override' },
      { status: 500 }
    );
  }
}

