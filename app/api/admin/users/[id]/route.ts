import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { config } from '@/lib/config/schema';
import { supabaseAdmin } from '@/lib/supabase/admin';



// GET /api/admin/users/[id] - Get single platform user with full details (or admin user if requested)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'admin') {
      const adminUser = await adminRepository.getAdminUserById(id);
      if (!adminUser) {
        return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
      }
      return NextResponse.json(adminUser);
    }

    // Try fetching platform user from Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);

    if (userError || !userData?.user) {
      // Fallback: check if it's an admin user
      const adminUser = await adminRepository.getAdminUserById(id);
      if (adminUser) return NextResponse.json(adminUser);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userData.user;

    // Parallel fetch related details: workspaces, payment orders, referral code
    const [workspacesRes, paymentsRes, referralCodeRes] = await Promise.all([
      supabaseAdmin
        .from('workspace_members')
        .select('role, created_at, workspaces(*)')
        .eq('user_id', id),
      supabaseAdmin
        .from('payment_orders')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('referral_codes')
        .select('*')
        .eq('user_id', id)
        .maybeSingle(),
    ]);

    interface MemberRow {
      role: string;
      created_at: string;
      workspaces?: Record<string, unknown> | null;
    }

    const workspaces = ((workspacesRes.data || []) as unknown as MemberRow[]).map((m) => ({
      role: m.role,
      joinedAt: m.created_at,
      ...(m.workspaces || {}),
    }));

    let codeRow = referralCodeRes.data;

    // If user has no referral code row, auto-generate one for them
    if (!codeRow) {
      try {
        const { getOrCreateReferralCode } = await import('@/lib/referrals/service');
        const displayName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'USER';
        const firstWsId = (workspaces[0] as any)?.id || id;
        const generated = await getOrCreateReferralCode(id, firstWsId, displayName);
        if (generated) {
          codeRow = {
            id: generated.id,
            user_id: generated.userId,
            workspace_id: generated.workspaceId,
            code: generated.code,
            click_count: generated.clickCount,
            signup_count: generated.signupCount,
            conversion_count: generated.conversionCount,
            rewards_earned: generated.rewardsEarned,
            months_earned: generated.monthsEarned,
            created_at: generated.createdAt,
            updated_at: generated.updatedAt,
          };
        }
      } catch (genErr) {
        console.warn('Auto-generate referral code error:', genErr);
      }
    }

    const userReferralCode = codeRow?.code ? (codeRow.code as string).trim().toUpperCase() : null;
    let referralsList: any[] = [];

    try {
      let refQuery = supabaseAdmin.from('referrals').select('*');
      if (userReferralCode) {
        refQuery = refQuery.or(`referrer_user_id.eq.${id},referral_code.eq.${userReferralCode}`);
      } else {
        refQuery = refQuery.eq('referrer_user_id', id);
      }
      const { data: dbRefs, error: refErr } = await refQuery.order('created_at', { ascending: false });
      if (!refErr && Array.isArray(dbRefs)) {
        referralsList = dbRefs;
      }
    } catch (refFetchErr) {
      console.warn('Failed to fetch user referrals:', refFetchErr);
    }

    // Check for any referred users registered via user_metadata who might have missed the referrals table
    if (userReferralCode) {
      try {
        const { data: allAuthUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        if (allAuthUsers?.users && Array.isArray(allAuthUsers.users)) {
          const existingReferredIds = new Set(referralsList.map((r) => r.referred_user_id));
          for (const u of allAuthUsers.users) {
            if (u.id === id) continue; // Skip self
            const metaCode = ((u.user_metadata?.referral_code || u.user_metadata?.ref || '') as string).trim().toUpperCase();
            if (metaCode && metaCode === userReferralCode && !existingReferredIds.has(u.id)) {
              try {
                const { data: insertedRef } = await supabaseAdmin
                  .from('referrals')
                  .insert({
                    referrer_user_id: id,
                    referred_user_id: u.id,
                    referral_code: userReferralCode,
                    status: 'signed_up',
                    created_at: u.created_at,
                  })
                  .select('*')
                  .single();

                if (insertedRef) {
                  referralsList.unshift(insertedRef);
                  existingReferredIds.add(u.id);
                }
              } catch (insErr) {
                console.warn('Failed to auto-insert missing referral record:', insErr);
              }
            }
          }
        }
      } catch (scanErr) {
        console.warn('Failed to scan auth users for referral match:', scanErr);
      }
    }

    // Resolve referred users' details (email, name, workspace plan)
    const referredUserIds = Array.from(new Set(referralsList.map((r) => r.referred_user_id).filter(Boolean)));
    const referredUserMap = new Map<string, { email: string | null; name: string | null; plan: string; planStatus: string }>();

    if (referredUserIds.length > 0) {
      try {
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name')
          .in('id', referredUserIds);

        (usersData || []).forEach((u: any) => {
          referredUserMap.set(u.id, {
            email: u.email || null,
            name: u.full_name || null,
            plan: 'spark',
            planStatus: 'active',
          });
        });
      } catch {}

      const missingUserIds = referredUserIds.filter((uid) => !referredUserMap.has(uid) || !referredUserMap.get(uid)?.email);
      if (missingUserIds.length > 0) {
        await Promise.allSettled(
          missingUserIds.map(async (uid) => {
            try {
              const { data: authData } = await supabaseAdmin.auth.admin.getUserById(uid);
              if (authData?.user) {
                const meta = (authData.user.user_metadata || {}) as Record<string, any>;
                const existing = referredUserMap.get(uid);
                referredUserMap.set(uid, {
                  email: existing?.email || authData.user.email || null,
                  name: existing?.name || meta.full_name || meta.name || null,
                  plan: existing?.plan || 'spark',
                  planStatus: existing?.planStatus || 'active',
                });
              }
            } catch {}
          })
        );
      }

      // Check current workspace plans for paid conversions (creator, pro, studio)
      try {
        const { data: memberRows } = await supabaseAdmin
          .from('workspace_members')
          .select('user_id, workspaces(plan, plan_status)')
          .in('user_id', referredUserIds);

        (memberRows || []).forEach((m: any) => {
          if (m.user_id && m.workspaces) {
            const current = referredUserMap.get(m.user_id);
            const wsPlan = (m.workspaces.plan || '').toLowerCase();
            const wsStatus = m.workspaces.plan_status || 'active';
            const isPaidPlan = wsPlan === 'creator' || wsPlan === 'pro' || wsPlan === 'studio';
            if (current) {
              if (isPaidPlan || current.plan === 'spark' || current.plan === 'free') {
                current.plan = wsPlan || 'spark';
                current.planStatus = wsStatus;
              }
            }
          }
        });
      } catch (wsErr) {
        console.warn('Failed to query referred workspaces for plans:', wsErr);
      }
    }

    let paidConversionsCount = 0;
    const enrichedReferrals = referralsList.map((ref) => {
      const uInfo = referredUserMap.get(ref.referred_user_id);
      const plan = uInfo?.plan || 'spark';
      const isPaid = plan === 'creator' || plan === 'pro' || plan === 'studio' || ref.status === 'converted' || ref.status === 'rewarded';
      if (isPaid) paidConversionsCount++;

      // If they converted to paid in reality, update referral record if still signed_up
      if (isPaid && ref.status === 'signed_up') {
        Promise.resolve(
          supabaseAdmin
            .from('referrals')
            .update({
              status: 'converted',
              reward_type: 'free_month_credits',
              reward_applied_at: new Date().toISOString(),
            })
            .eq('id', ref.id)
        ).catch(() => {});
      }

      return {
        id: ref.id,
        referredUserId: ref.referred_user_id,
        referredEmail: uInfo?.email || null,
        referredName: uInfo?.name || (uInfo?.email ? uInfo.email.split('@')[0] : null),
        referralCode: ref.referral_code,
        status: (isPaid && ref.status === 'signed_up' ? 'converted' : ref.status) as 'signed_up' | 'converted' | 'rewarded',
        currentPlan: plan,
        planStatus: uInfo?.planStatus || 'active',
        isPaid,
        rewardType: ref.reward_type || (isPaid ? 'free_month_credits' : 'signup_credits'),
        rewardAppliedAt: ref.reward_applied_at || null,
        createdAt: ref.created_at,
      };
    });

    const totalSignups = enrichedReferrals.length;
    const liveClickCount = codeRow ? Math.max(Number(codeRow.click_count) || 0, totalSignups) : totalSignups;
    const liveSignupCount = codeRow ? Math.max(Number(codeRow.signup_count) || 0, totalSignups) : totalSignups;
    const liveConversionCount = codeRow ? Math.max(Number(codeRow.conversion_count) || 0, paidConversionsCount) : paidConversionsCount;

    // Sync referral_codes row if counts are higher
    if (codeRow && (liveClickCount > (codeRow.click_count || 0) || liveSignupCount > (codeRow.signup_count || 0) || liveConversionCount > (codeRow.conversion_count || 0))) {
      Promise.resolve(
        supabaseAdmin
          .from('referral_codes')
          .update({
            click_count: liveClickCount,
            signup_count: liveSignupCount,
            conversion_count: liveConversionCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', codeRow.id)
      ).catch(() => {});
    }

    const finalReferralCode = codeRow ? {
      ...codeRow,
      click_count: liveClickCount,
      signup_count: liveSignupCount,
      conversion_count: liveConversionCount,
    } : null;

    const bannedUntilStr = (user as { banned_until?: string | null }).banned_until;
    const isSuspended = !!(bannedUntilStr && new Date(bannedUntilStr) > new Date());

    return NextResponse.json({
      id: user.id,
      email: user.email || '',
      phone: user.phone || null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at || null,
      isSuspended,
      bannedUntil: bannedUntilStr || null,
      userMetadata: user.user_metadata || {},
      appMetadata: user.app_metadata || {},
      workspaces,
      paymentOrders: paymentsRes.data || [],
      referralCode: finalReferralCode,
      referrals: enrichedReferrals,
    });
  } catch (error) {
    console.error('Failed to get user details:', error);
    return NextResponse.json({ error: 'Failed to get user details' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Update user (admin user role/permissions or platform user metadata)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { role, permissions, userMetadata, email } = body;

    // If role or permissions provided, try admin user update first
    if (role !== undefined || permissions !== undefined) {
      if (id === auth.admin.userId && role && role !== 'super_admin') {
        return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
      }

      const adminUser = await adminRepository.updateAdminUser(id, { role, permissions });
      if (adminUser) {
        await adminRepository.logAdminAction(
          auth.admin.userId,
          'admin_user_update',
          'admin_user',
          id,
          { role, permissions }
        );
        return NextResponse.json(adminUser);
      }
    }

    // Otherwise, update platform auth user
    const updatePayload: Record<string, unknown> = {};
    if (email) updatePayload.email = email;
    if (userMetadata) updatePayload.user_metadata = userMetadata;

    const { data: updated, error } = await supabaseAdmin.auth.admin.updateUserById(id, updatePayload);
    if (error) throw error;

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'user_update',
      'user',
      id,
      updatePayload
    );

    return NextResponse.json({ success: true, user: updated.user });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Soft-delete user and archive to deleted_accounts table
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    // Prevent self-deletion if current admin
    if (id === auth.admin.userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = (body?.reason as string) || 'Deleted by admin';

    // 1. Fetch user data before archiving
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(id);
    if (!userData?.user) {
      // Try admin_users
      const success = await adminRepository.deleteAdminUser(id);
      if (!success) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      await adminRepository.logAdminAction(auth.admin.userId, 'user_delete', 'user', id, { reason });
      return NextResponse.json({ success: true });
    }

    const { data: userProfiles } = await supabaseAdmin.from('profiles').select('*').eq('user_id', id);
    const { data: userMemberships } = await supabaseAdmin.from('workspace_members').select('*').eq('user_id', id);
    const { data: userWorkspaces } = await supabaseAdmin.from('workspaces').select('*').eq('owner_id', id);

    // 2. Insert into deleted_accounts table
    try {
      await supabaseAdmin.from('deleted_accounts').insert({
        user_id: id,
        email: userData.user.email || 'unknown',
        reason,
        deleted_by: auth.admin.userId,
        user_data: userData.user,
        profiles_data: userProfiles || [],
        workspaces_data: userWorkspaces || [],
        workspace_members_data: userMemberships || [],
        deleted_at: new Date().toISOString(),
      });
    } catch (insertErr) {
      console.warn('Note: deleted_accounts table insert warning:', insertErr);
    }

    // 3. Soft-delete profiles by setting deleted_at
    try {
      await supabaseAdmin
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', id);
    } catch (profErr) {
      console.warn('Note: profiles table update warning:', profErr);
    }

    // 4. Ban the user and flag in metadata so active queries exclude them
    const existingMeta = userData.user.user_metadata || {};
    await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: '876000h',
      user_metadata: {
        ...existingMeta,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_reason: reason,
      },
    });

    // 5. Sign out active sessions
    await supabaseAdmin.auth.admin.signOut(id).catch(() => {});

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'user_delete',
      'user',
      id,
      { reason }
    );

    return NextResponse.json({ success: true, message: 'Account archived to deleted_accounts table' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
