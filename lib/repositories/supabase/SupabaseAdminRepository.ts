import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getDefaultAdminPlans } from '@/lib/billing/plans';
import { config } from '@/lib/config/schema';
import type {
  IAdminRepository,
  AdminUser,
  AdminUserWithWorkspace,
  CreateAdminUserInput,
  UpdateAdminUserInput,
  Plan,
  CreatePlanInput,
  UpdatePlanInput,
  WorkspaceAdminView,
  PaginatedResult,
  ListWorkspacesParams,
  ListUsersParams,
  AnalyticsSummary,
  AdminAuditLog,
  PaymentOrderAdminView,
  SubscriptionAdminView,
  SubscriptionsListResult,
  SubscriptionStats,
  PlanSummaryItem,
  WebhookEventAdminView,
  ReferralCodeAdminView,
  ReferralAdminView,
  ReferralMetricsSummary,
  RevenueMetrics,
  RecoverableProfileItem,
  UserBreakdownData,
  ListPaymentOrdersParams,
  ListSubscriptionsParams,
  ListReferralCodesParams,
} from '@/lib/repositories/interfaces/IAdminRepository';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

function buildPagination<T>(data: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

function applySorting(query: any, sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
  if (sortBy) {
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  }
  return query;
}

export class SupabaseAdminRepository implements IAdminRepository {
  // ===== Admin Users =====

  async getAdminUserById(id: string): Promise<AdminUser | null> {
    const { data, error } = await adminClient
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapAdminUser(data);
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | null> {
    const { data, error } = await adminClient
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return null;
    return this.mapAdminUser(data);
  }

  async listAdminUsers(params?: ListUsersParams): Promise<PaginatedResult<AdminUser>> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = adminClient
      .from('admin_users')
      .select('*', { count: 'exact' });

    if (params?.search) {
      query = query.ilike('email', `%${params.search}%`);
    }

    const sortBy = params?.sortBy ?? 'createdAt';
    const sortOrder = params?.sortOrder ?? 'desc';
    query = applySorting(query, this.mapSortColumn(sortBy), sortOrder);

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return buildPagination(
      (data || []).map(this.mapAdminUser),
      count ?? 0,
      page,
      pageSize
    );
  }

  async createAdminUser(input: CreateAdminUserInput, supabaseAdmin: SupabaseClient): Promise<AdminUser> {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      email_confirm: true,
      user_metadata: { role: input.role ?? 'admin' },
    });

    if (authError || !authUser.user) {
      throw new Error(authError?.message || 'Failed to create auth user');
    }

    const { data, error } = await adminClient
      .from('admin_users')
      .insert({
        id: authUser.user.id,
        email: input.email,
        role: input.role ?? 'admin',
        permissions: input.permissions ?? { users: true, workspaces: true, plans: true, analytics: true },
      })
      .select('*')
      .single();

    if (error) {
      // Cleanup auth user on failure
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw error;
    }

    return this.mapAdminUser(data);
  }

  async updateAdminUser(id: string, input: UpdateAdminUserInput): Promise<AdminUser | null> {
    const updates: Record<string, unknown> = {};
    if (input.role) updates.role = input.role;
    if (input.permissions) updates.permissions = input.permissions;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await adminClient
      .from('admin_users')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data ? this.mapAdminUser(data) : null;
  }

  async deleteAdminUser(id: string): Promise<boolean> {
    const { error } = await adminClient
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // ===== Plans =====

  async listPlans(): Promise<Plan[]> {
    const defaultPlans = getDefaultAdminPlans();
    const defaultMap = new Map(defaultPlans.map((p) => [p.id, p]));

    try {
      const { data, error } = await adminClient
        .from('plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const dbPlans = data.map(this.mapPlan);
        const dbMap = new Map(dbPlans.map((p) => [p.id, p]));

        // Ensure all canonical plans are present and properly enriched with INR fields
        const canonicalMerged: Plan[] = defaultPlans.map((def) => {
          const fromDb = dbMap.get(def.id);
          if (!fromDb) return def;

          const defFeatures = def.features as Record<string, unknown>;
          const dbFeatures = (fromDb.features as Record<string, unknown>) || {};

          return {
            ...def,
            ...fromDb,
            features: {
              ...defFeatures,
              ...dbFeatures,
              price_monthly_inr:
                typeof dbFeatures.price_monthly_inr === 'number'
                  ? dbFeatures.price_monthly_inr
                  : defFeatures.price_monthly_inr,
              price_yearly_inr:
                typeof dbFeatures.price_yearly_inr === 'number'
                  ? dbFeatures.price_yearly_inr
                  : defFeatures.price_yearly_inr,
              price_annual_monthly_inr:
                typeof dbFeatures.price_annual_monthly_inr === 'number'
                  ? dbFeatures.price_annual_monthly_inr
                  : defFeatures.price_annual_monthly_inr,
            },
          };
        });

        // Add any additional non-canonical plans created by admin
        for (const p of dbPlans) {
          if (!defaultMap.has(p.id) && p.id !== 'free' && p.id !== 'enterprise') {
            canonicalMerged.push(p);
          }
        }

        return canonicalMerged.sort((a, b) => a.sortOrder - b.sortOrder);
      }
    } catch (err) {
      console.warn('[listPlans] DB query failed, falling back to default plans', err);
    }

    // Fallback: When DB table is empty or unseeded, return canonical plans and attempt auto-seed
    try {
      for (const p of defaultPlans) {
        await adminClient.from('plans').upsert({
          id: p.id,
          name: p.name,
          description: p.description,
          price_monthly_usd: p.priceMonthlyUsd,
          price_yearly_usd: p.priceYearlyUsd,
          features: p.features,
          limits: p.limits,
          is_active: p.isActive,
          sort_order: p.sortOrder,
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      // Best-effort auto-seed
    }

    return defaultPlans;
  }

  async getPlanById(id: string): Promise<Plan | null> {
    const defaultPlans = getDefaultAdminPlans();
    const fallback = defaultPlans.find((p) => p.id === id) || null;

    try {
      const { data, error } = await adminClient
        .from('plans')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const fromDb = this.mapPlan(data);
        if (fallback) {
          const defFeatures = fallback.features as Record<string, unknown>;
          const dbFeatures = (fromDb.features as Record<string, unknown>) || {};
          return {
            ...fallback,
            ...fromDb,
            features: {
              ...defFeatures,
              ...dbFeatures,
              price_monthly_inr:
                typeof dbFeatures.price_monthly_inr === 'number'
                  ? dbFeatures.price_monthly_inr
                  : defFeatures.price_monthly_inr,
              price_yearly_inr:
                typeof dbFeatures.price_yearly_inr === 'number'
                  ? dbFeatures.price_yearly_inr
                  : defFeatures.price_yearly_inr,
              price_annual_monthly_inr:
                typeof dbFeatures.price_annual_monthly_inr === 'number'
                  ? dbFeatures.price_annual_monthly_inr
                  : defFeatures.price_annual_monthly_inr,
            },
          };
        }
        return fromDb;
      }
    } catch (err) {
      console.warn('[getPlanById] DB query failed', err);
    }

    return fallback;
  }

  async createPlan(input: CreatePlanInput): Promise<Plan> {
    const { data, error } = await adminClient
      .from('plans')
      .insert({
        id: input.id,
        name: input.name,
        description: input.description,
        price_monthly_usd: input.priceMonthlyUsd,
        price_yearly_usd: input.priceYearlyUsd,
        features: input.features,
        limits: input.limits,
        is_active: input.isActive ?? true,
        sort_order: input.sortOrder ?? 0,
      })
      .select('*')
      .single();

    if (error) throw error;
    return this.mapPlan(data);
  }

  async updatePlan(id: string, input: UpdatePlanInput): Promise<Plan | null> {
    const updates: Record<string, unknown> = {};
    if (input.name) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.priceMonthlyUsd !== undefined) updates.price_monthly_usd = input.priceMonthlyUsd;
    if (input.priceYearlyUsd !== undefined) updates.price_yearly_usd = input.priceYearlyUsd;
    if (input.features) updates.features = input.features;
    if (input.limits) updates.limits = input.limits;
    if (input.isActive !== undefined) updates.is_active = input.isActive;
    if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
    updates.updated_at = new Date().toISOString();

    try {
      const { data, error } = await adminClient
        .from('plans')
        .update(updates)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (!error && data) return this.mapPlan(data);
      if (error) {
        console.warn('[updatePlan] Update error from Supabase, attempting upsert:', error.message || error);
      }
    } catch (err) {
      console.warn('[updatePlan] Update failed, trying upsert', err);
    }

    // Row didn't exist in DB yet - pull defaults and upsert
    const fallback = getDefaultAdminPlans().find((p) => p.id === id);
    const insertData = {
      id,
      name: input.name || fallback?.name || id,
      description: input.description !== undefined ? input.description : (fallback?.description || null),
      price_monthly_usd: input.priceMonthlyUsd !== undefined ? input.priceMonthlyUsd : (fallback?.priceMonthlyUsd ?? 0),
      price_yearly_usd: input.priceYearlyUsd !== undefined ? input.priceYearlyUsd : (fallback?.priceYearlyUsd ?? 0),
      features: input.features || fallback?.features || {},
      limits: input.limits || fallback?.limits || {},
      is_active: input.isActive !== undefined ? input.isActive : (fallback?.isActive ?? true),
      sort_order: input.sortOrder !== undefined ? input.sortOrder : (fallback?.sortOrder ?? 0),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: upserted, error: upsertErr } = await adminClient
        .from('plans')
        .upsert(insertData, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      if (upsertErr) {
        console.warn('[updatePlan] Upsert warning from Supabase:', upsertErr.message || upsertErr);
      }
      if (upserted) return this.mapPlan(upserted);
    } catch (err) {
      console.error('[updatePlan] Upsert failed:', err);
    }

    return this.mapPlan({
      ...insertData,
      created_at: fallback?.createdAt || new Date().toISOString(),
    } as any);
  }

  async deletePlan(id: string): Promise<boolean> {
    const { error } = await adminClient
      .from('plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // ===== Workspaces (Admin View) =====

  async listWorkspaces(params?: ListWorkspacesParams): Promise<PaginatedResult<WorkspaceAdminView>> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = adminClient
      .from('workspaces')
      .select('*', { count: 'exact' });

    if (params?.search) {
      query = query.ilike('name', `%${params.search}%`);
    }
    if (params?.plan) {
      if (params.plan === 'spark' || params.plan === 'free') {
        query = query.in('plan', ['spark', 'free']);
      } else {
        query = query.eq('plan', params.plan);
      }
    }
    if (params?.planStatus) {
      query = query.eq('plan_status', params.planStatus);
    }

    const sortBy = params?.sortBy ?? 'createdAt';
    const sortOrder = params?.sortOrder ?? 'desc';
    query = applySorting(query, this.mapWorkspaceSortColumn(sortBy), sortOrder);

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const workspaces: WorkspaceAdminView[] = (data || []).map(this.mapWorkspace);
    const workspaceIds = workspaces.map((w) => w.id);

    if (workspaceIds.length > 0) {
      try {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [membersResult, profilesResult, postsResult] = await Promise.all([
          adminClient
            .from('workspace_members')
            .select('workspace_id, user_id, role')
            .in('workspace_id', workspaceIds),
          adminClient
            .from('profiles')
            .select('workspace_id, user_id, name, deleted_at')
            .in('workspace_id', workspaceIds),
          adminClient
            .from('posts')
            .select('workspace_id')
            .in('workspace_id', workspaceIds)
            .gte('created_at', monthStart.toISOString()),
        ]);

        const memberCounts = new Map<string, number>();
        const ownerByWorkspace = new Map<string, string>();
        (membersResult.data || []).forEach((row: { workspace_id: string; user_id?: string; role?: string }) => {
          memberCounts.set(row.workspace_id, (memberCounts.get(row.workspace_id) || 0) + 1);
          if (row.user_id) {
            if (row.role === 'owner' || !ownerByWorkspace.has(row.workspace_id)) {
              ownerByWorkspace.set(row.workspace_id, row.user_id);
            }
          }
        });

        const profileCounts = new Map<string, number>();
        const profileNameByWorkspace = new Map<string, string>();
        const profileUserByWorkspace = new Map<string, string>();
        (profilesResult.data || []).forEach((row: { workspace_id: string; user_id?: string; name?: string | null; deleted_at?: string | null }) => {
          if (!row.deleted_at) {
            profileCounts.set(row.workspace_id, (profileCounts.get(row.workspace_id) || 0) + 1);
            if (row.name && !profileNameByWorkspace.has(row.workspace_id)) {
              profileNameByWorkspace.set(row.workspace_id, row.name);
            }
            if (row.user_id && !profileUserByWorkspace.has(row.workspace_id)) {
              profileUserByWorkspace.set(row.workspace_id, row.user_id);
            }
          }
        });

        const postsCounts = new Map<string, number>();
        (postsResult.data || []).forEach((row: { workspace_id: string }) => {
          postsCounts.set(row.workspace_id, (postsCounts.get(row.workspace_id) || 0) + 1);
        });

        workspaces.forEach((w) => {
          if (!w.ownerId) {
            w.ownerId = ownerByWorkspace.get(w.id) || profileUserByWorkspace.get(w.id) || null;
          }
        });

        const ownerUserIds = Array.from(new Set(
          workspaces.map((w) => w.ownerId).filter((id): id is string => Boolean(id))
        ));

        const userMap = new Map<string, { email: string | null; name: string | null }>();

        if (ownerUserIds.length > 0) {
          try {
            const { data: usersData, error: usersErr } = await adminClient
              .from('users')
              .select('id, email, full_name')
              .in('id', ownerUserIds);

            if (!usersErr && usersData) {
              usersData.forEach((u: any) => {
                if (u.id) {
                  userMap.set(u.id, { email: u.email || null, name: u.full_name || null });
                }
              });
            }
          } catch (userErr) {
            console.warn('Failed to query public.users for workspace owners:', userErr);
          }

          // Check if any owners are missing either email or name; fallback to auth.admin
          const missingIds = ownerUserIds.filter((id) => {
            const existing = userMap.get(id);
            return !existing || !existing.email || !existing.name;
          });

          if (missingIds.length > 0) {
            await Promise.allSettled(
              missingIds.map(async (uid) => {
                try {
                  const { data: authData } = await adminClient.auth.admin.getUserById(uid);
                  if (authData?.user) {
                    const meta = (authData.user.user_metadata || {}) as Record<string, any>;
                    const authName = meta.full_name || meta.name || meta.user_name || meta.display_name || meta.preferred_username || null;
                    const existing = userMap.get(uid);
                    userMap.set(uid, {
                      email: existing?.email || authData.user.email || null,
                      name: existing?.name || authName || null,
                    });
                  }
                } catch (authErr) {
                  console.warn(`Failed to fetch auth user ${uid}:`, authErr);
                }
              })
            );
          }
        }

        workspaces.forEach((w) => {
          w.memberCount = memberCounts.get(w.id) || 0;
          w.profileCount = profileCounts.get(w.id) || 0;
          w.postsThisMonth = postsCounts.get(w.id) || 0;

          const user = w.ownerId ? userMap.get(w.ownerId) : null;
          const profileName = profileNameByWorkspace.get(w.id);

          w.ownerEmail = user?.email || null;
          w.ownerName = user?.name || profileName || (user?.email ? user.email.split('@')[0] : null);
        });

        if (sortBy === 'memberCount') {
          workspaces.sort((a, b) => sortOrder === 'asc' ? a.memberCount - b.memberCount : b.memberCount - a.memberCount);
        } else if (sortBy === 'postsThisMonth') {
          workspaces.sort((a, b) => sortOrder === 'asc' ? a.postsThisMonth - b.postsThisMonth : b.postsThisMonth - a.postsThisMonth);
        }
      } catch (countErr) {
        console.error('Failed to compute live workspace counts:', countErr);
      }
    }

    return buildPagination(
      workspaces,
      count ?? 0,
      page,
      pageSize
    );
  }

  async getWorkspaceById(id: string): Promise<WorkspaceAdminView | null> {
    const { data, error } = await adminClient
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const ws = this.mapWorkspace(data);

    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [membersRes, profilesRes, postsRes] = await Promise.all([
        adminClient.from('workspace_members').select('id', { count: 'exact', head: true }).eq('workspace_id', id),
        adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('workspace_id', id).is('deleted_at', null),
        adminClient.from('posts').select('id', { count: 'exact', head: true }).eq('workspace_id', id).gte('created_at', monthStart.toISOString()),
      ]);

      ws.memberCount = membersRes.count ?? 0;
      ws.profileCount = profilesRes.count ?? 0;
      ws.postsThisMonth = postsRes.count ?? 0;
    } catch (countErr) {
      console.error('Failed to compute live counts for workspace:', id, countErr);
    }

    if (ws.ownerId && (!ws.ownerEmail || !ws.ownerName)) {
      try {
        const { data: userData } = await adminClient
          .from('users')
          .select('email, full_name')
          .eq('id', ws.ownerId)
          .maybeSingle();

        let email = userData?.email || ws.ownerEmail || null;
        let name = userData?.full_name || ws.ownerName || null;

        if (!email || !name) {
          try {
            const { data: authData } = await adminClient.auth.admin.getUserById(ws.ownerId);
            if (authData?.user) {
              const meta = (authData.user.user_metadata || {}) as Record<string, any>;
              email = email || authData.user.email || null;
              name = name || meta.full_name || meta.name || meta.user_name || null;
            }
          } catch {}
        }

        ws.ownerEmail = email;
        ws.ownerName = name || (email ? email.split('@')[0] : null);
      } catch {}
    }

    return ws;
  }

  async updateWorkspacePlan(workspaceId: string, plan: string, adminUserId: string): Promise<WorkspaceAdminView | null> {
    const { data, error } = await adminClient.rpc('admin_update_workspace_plan', {
      p_workspace_id: workspaceId,
      p_new_plan: plan,
      p_admin_user_id: adminUserId,
    });

    if (error) throw error;
    return data ? this.mapWorkspace(data) : null;
  }

  async updateWorkspacePlanStatus(workspaceId: string, status: string, adminUserId: string): Promise<WorkspaceAdminView | null> {
    const { data, error } = await adminClient.rpc('admin_update_workspace_plan_status', {
      p_workspace_id: workspaceId,
      p_new_status: status,
      p_admin_user_id: adminUserId,
    });

    if (error) throw error;
    return data ? this.mapWorkspace(data) : null;
  }

  // ===== Analytics =====

  async getAnalyticsSummary(workspaceId?: string, days: number = 30): Promise<AnalyticsSummary> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = adminClient
      .from('analytics_events')
      .select('event_type, event_data, created_at, workspace_id, profile_id')
      .gte('created_at', startDate.toISOString());

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data: events, error } = await query;

    if (error) throw error;

    // Aggregate
    const eventsByType: Record<string, number> = {};
    const eventsByDay: Record<string, number> = {};
    interface LinkClickAggregate {
      url: string;
      linkType: string;
      title?: string | null;
      profileId?: string | null;
      clicks: number;
    }
    const linkClicksMap = new Map<string, LinkClickAggregate>();
    const profileViews: Record<string, number> = {};

    events?.forEach((e) => {
      eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1;

      const day = e.created_at.split('T')[0];
      eventsByDay[day] = (eventsByDay[day] || 0) + 1;

      // Extract link clicks (supporting link_click and profile_cta_click)
      if (e.event_type === 'link_click' || e.event_type === 'profile_cta_click') {
        const evData = (e.event_data || {}) as Record<string, any>;
        const rawUrl = evData['link_url'] || evData['url'] || evData['linkUrl'] || evData['href'];
        const pId = e.profile_id || evData['profile_id'] || evData['profileId'] || null;

        if (rawUrl && typeof rawUrl === 'string') {
          const url = rawUrl.trim();
          const linkType = (evData['link_type'] || evData['linkType'] || evData['cta_type'] || 'website').toLowerCase();
          const linkText = evData['link_text'] || evData['linkText'] || evData['label'] || evData['title'] || null;

          const key = `${pId || 'unknown'}|||${url}`;
          const existing = linkClicksMap.get(key);
          if (existing) {
            existing.clicks += 1;
            if (!existing.title && linkText) {
              existing.title = linkText;
            }
          } else {
            linkClicksMap.set(key, {
              url,
              linkType,
              title: linkText,
              profileId: pId,
              clicks: 1,
            });
          }
        }
      }

      const profileId = e.profile_id || (e.event_data as Record<string, any>)?.['profile_id'];
      if (e.event_type === 'profile_view' && profileId) {
        profileViews[profileId] = (profileViews[profileId] || 0) + 1;
      }
    });

    // Extract top 20 profiles by view count
    const sortedProfileEntries = Object.entries(profileViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);
    const topProfileIds = sortedProfileEntries.map(([id]) => id);

    // Extract top 10 links by click count
    const sortedLinkEntries = Array.from(linkClicksMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
    const linkProfileIds = sortedLinkEntries
      .map((l) => l.profileId)
      .filter((id): id is string => Boolean(id));

    // Combine all profile IDs needed for both Top Profiles and Top Links
    const allProfileIdsToFetch = Array.from(new Set([...topProfileIds, ...linkProfileIds]));

    // Fetch profile details for real names, subdomains, avatars, user_id and custom links in parallel
    const fetchProfilesPromise = allProfileIdsToFetch.length > 0
      ? adminClient
          .from('profiles')
          .select('id, user_id, name, subdomain, avatar_url, links')
          .in('id', allProfileIdsToFetch)
      : Promise.resolve({ data: [] as any[], error: null });

    // Get workspace/user counts and profile data in parallel
    const [
      { count: totalWorkspaces },
      { count: totalUsers },
      { count: totalPostsPublished },
      profilesRes,
    ] = await Promise.all([
      adminClient.from('workspaces').select('id', { count: 'exact', head: true }),
      Promise.resolve(adminClient.from('profiles').select('id', { count: 'exact', head: true }).limit(1))
        .then(() => adminClient.auth.admin.listUsers())
        .then((r) => ({ count: r?.data?.users?.length ?? 0 }))
        .catch(() => ({ count: 0 })),
      adminClient.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      fetchProfilesPromise,
    ]);

    // Resolve user emails for profile owners
    const userIdsToLookup = new Set<string>();
    if (profilesRes && 'data' in profilesRes && Array.isArray(profilesRes.data)) {
      profilesRes.data.forEach((p: any) => {
        if (p.user_id) userIdsToLookup.add(p.user_id);
      });
    }

    const userEmailMap = new Map<string, string>();
    if (userIdsToLookup.size > 0) {
      try {
        const userPromises = Array.from(userIdsToLookup).map(async (uid) => {
          try {
            const res = await adminClient.auth.admin.getUserById(uid);
            return res.data?.user ? { id: uid, email: res.data.user.email || '' } : null;
          } catch {
            return null;
          }
        });
        const users = await Promise.all(userPromises);
        users.forEach((u) => {
          if (u && u.email) userEmailMap.set(u.id, u.email);
        });
      } catch {}
    }

    const profileMap = new Map<string, {
      userId?: string | null;
      userEmail?: string | null;
      name: string;
      subdomain?: string | null;
      avatarUrl?: string | null;
      links?: Array<{ label: string; url: string; type: string }>;
    }>();

    const foundProfileIds = new Set<string>();

    if (profilesRes && 'data' in profilesRes && Array.isArray(profilesRes.data)) {
      profilesRes.data.forEach((p: any) => {
        foundProfileIds.add(p.id);
        const resolvedName = p.name?.trim() || (p.subdomain ? `@${p.subdomain}` : '');
        const uId = p.user_id || null;
        const uEmail = uId ? userEmailMap.get(uId) || null : null;
        profileMap.set(p.id, {
          userId: uId,
          userEmail: uEmail,
          name: resolvedName || `Profile (${p.id.slice(0, 8)})`,
          subdomain: p.subdomain || null,
          avatarUrl: p.avatar_url || null,
          links: Array.isArray(p.links) ? p.links : [],
        });
      });
    }

    // Fallback lookup: check if any missing IDs belong to workspaces
    const missingProfileIds = allProfileIdsToFetch.filter((id) => !foundProfileIds.has(id));
    if (missingProfileIds.length > 0) {
      try {
        const { data: wsData } = await adminClient
          .from('workspaces')
          .select('id, name, slug')
          .in('id', missingProfileIds);

        if (wsData && Array.isArray(wsData)) {
          wsData.forEach((w: any) => {
            profileMap.set(w.id, {
              name: w.name || `Workspace (${w.id.slice(0, 8)})`,
              subdomain: w.slug || null,
              avatarUrl: null,
            });
          });
        }
      } catch {
        // Ignore fallback lookup failures
      }
    }

    let userBreakdown: UserBreakdownData | undefined;
    try {
      userBreakdown = await this.getUserPlanDistribution();
    } catch {
      // Graceful fallback if user distribution calculation fails
    }

    return {
      totalProfileViews: eventsByType['profile_view'] || 0,
      totalLinkClicks: (eventsByType['link_click'] || 0) + (eventsByType['profile_cta_click'] || 0),
      totalPostsPublished: totalPostsPublished || 0,
      totalWorkspaces: totalWorkspaces || 0,
      totalUsers: userBreakdown?.total || totalUsers || 0,
      newUsersLast30Days: userBreakdown?.newUsersLast30Days || 0,
      usersByPlan: userBreakdown?.byPlan || {},
      userRegistrationsLast30Days: userBreakdown?.registrationsLast30Days || [],
      userBreakdown,
      eventsByType,
      eventsLast30Days: Object.entries(eventsByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
      topLinks: sortedLinkEntries.map((link) => {
        const profile = link.profileId ? profileMap.get(link.profileId) : null;
        let displayTitle = link.title;
        if (!displayTitle && profile?.links) {
          const matching = profile.links.find((l: any) => {
            if (!l?.url) return false;
            return l.url === link.url || l.url.replace(/\/$/, '') === link.url.replace(/\/$/, '');
          });
          if (matching?.label) {
            displayTitle = matching.label;
          }
        }

        return {
          linkType: link.linkType,
          url: link.url,
          title: displayTitle || null,
          clicks: link.clicks,
          profileId: link.profileId || null,
          profileName: profile?.name || (link.profileId ? `Profile (${link.profileId.slice(0, 8)})` : null),
          profileSubdomain: profile?.subdomain || null,
          profileAvatarUrl: profile?.avatarUrl || null,
        };
      }),
      topProfiles: sortedProfileEntries.map(([profileId, views]) => {
        const details = profileMap.get(profileId);
        return {
          profileId,
          userId: details?.userId || null,
          userEmail: details?.userEmail || null,
          name: details?.name || `Profile (${profileId.slice(0, 8)})`,
          subdomain: details?.subdomain || null,
          avatarUrl: details?.avatarUrl || null,
          handle: details?.subdomain ? `@${details.subdomain}` : null,
          views,
        };
      }),
    };
  }

  async getAnalyticsEvents(workspaceId?: string, eventType?: string, days: number = 30, limit: number = 100): Promise<Record<string, unknown>[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = adminClient
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (workspaceId) query = query.eq('workspace_id', workspaceId);
    if (eventType) query = query.eq('event_type', eventType);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // ===== Audit Log =====

  async getAuditLog(adminUserId?: string, limit: number = 100): Promise<AdminAuditLog[]> {
    let query = adminClient
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (adminUserId) query = query.eq('admin_user_id', adminUserId);

    const { data, error } = await query;
    if (error) throw error;
    const mapped = (data || []).map(this.mapAuditLog);
    return this.enrichAuditLogs(mapped);
  }

  private async enrichAuditLogs(logs: AdminAuditLog[]): Promise<AdminAuditLog[]> {
    if (!logs || logs.length === 0) return [];

    try {
      const userIdsToLookup = new Set<string>();
      const subIdsToLookup = new Set<string>();
      const overrideIdsToLookup = new Set<string>();
      const wsIdsToLookup = new Set<string>();

      for (const log of logs) {
        if (!log.targetUserEmail && log.targetId) {
          if (log.targetType === 'user') {
            userIdsToLookup.add(log.targetId);
          } else if (log.targetType === 'subscription') {
            subIdsToLookup.add(log.targetId);
          } else if (log.targetType === 'user_plan_override') {
            overrideIdsToLookup.add(log.targetId);
          } else if (log.targetType === 'workspace') {
            wsIdsToLookup.add(log.targetId);
          }
        }
      }

      const overrideInfoMap = new Map<string, { email?: string; name?: string; planId?: string; amount?: number }>();
      if (overrideIdsToLookup.size > 0) {
        try {
          const { data: ovs } = await adminClient
            .from('user_plan_overrides')
            .select('id, user_email, user_name, plan_id, custom_monthly_inr')
            .in('id', Array.from(overrideIdsToLookup));
          (ovs || []).forEach((o: any) => {
            overrideInfoMap.set(o.id, {
              email: o.user_email || undefined,
              name: o.user_name || undefined,
              planId: o.plan_id || undefined,
              amount: o.custom_monthly_inr || undefined,
            });
          });
        } catch {}
      }

      const subInfoMap = new Map<string, { userId?: string; workspaceName?: string }>();
      if (subIdsToLookup.size > 0) {
        try {
          const { data: subs } = await adminClient
            .from('subscriptions')
            .select('id, user_id, workspace_id, workspaces(name, owner_id)')
            .in('id', Array.from(subIdsToLookup));
          (subs || []).forEach((s: any) => {
            const wsName = s.workspaces?.name || undefined;
            const uId = s.user_id || s.workspaces?.owner_id || undefined;
            subInfoMap.set(s.id, { userId: uId, workspaceName: wsName });
            if (uId) userIdsToLookup.add(uId);
          });
        } catch {}
      }

      const wsInfoMap = new Map<string, { name?: string; ownerId?: string }>();
      if (wsIdsToLookup.size > 0) {
        try {
          const { data: wss } = await adminClient
            .from('workspaces')
            .select('id, name, owner_id')
            .in('id', Array.from(wsIdsToLookup));
          (wss || []).forEach((w: any) => {
            wsInfoMap.set(w.id, { name: w.name, ownerId: w.owner_id });
            if (w.owner_id) userIdsToLookup.add(w.owner_id);
          });
        } catch {}
      }

      const userInfoMap = new Map<string, { email?: string; name?: string }>();
      if (userIdsToLookup.size > 0) {
        const userIds = Array.from(userIdsToLookup);
        try {
          const { data: profs } = await adminClient
            .from('profiles')
            .select('user_id, name')
            .in('user_id', userIds);
          (profs || []).forEach((p: any) => {
            if (p.user_id && p.name) {
              userInfoMap.set(p.user_id, { name: p.name });
            }
          });
        } catch {}

        try {
          const userPromises = userIds.slice(0, 30).map(async (id) => {
            try {
              const res = await adminClient.auth.admin.getUserById(id);
              return res.data?.user || null;
            } catch {
              return null;
            }
          });
          const users = await Promise.all(userPromises);
          users.forEach((u: any) => {
            if (u) {
              const prev = userInfoMap.get(u.id) || {};
              const meta = (u.user_metadata as Record<string, any>) || {};
              userInfoMap.set(u.id, {
                email: u.email || prev.email,
                name: meta.full_name || meta.name || prev.name,
              });
            }
          });
        } catch {}
      }

      return logs.map((log) => {
        let email = log.targetUserEmail;
        let name = log.targetUserName;
        const meta = { ...log.metadata };

        if (!email && log.targetId) {
          if (log.targetType === 'user') {
            const u = userInfoMap.get(log.targetId);
            if (u?.email) email = u.email;
            if (u?.name && !name) name = u.name;
          } else if (log.targetType === 'subscription') {
            const sub = subInfoMap.get(log.targetId);
            if (sub?.workspaceName && !meta.workspaceName) {
              meta.workspaceName = sub.workspaceName;
            }
            if (sub?.userId) {
              const u = userInfoMap.get(sub.userId);
              if (u?.email) email = u.email;
              if (u?.name && !name) name = u.name;
            }
          } else if (log.targetType === 'user_plan_override') {
            const ovr = overrideInfoMap.get(log.targetId);
            if (ovr?.email) email = ovr.email;
            if (ovr?.name && !name) name = ovr.name;
            if (ovr?.planId && !meta.planId) meta.planId = ovr.planId;
            if (ovr?.amount !== undefined && meta.customMonthlyInr === undefined) {
              meta.customMonthlyInr = ovr.amount;
            }
          } else if (log.targetType === 'workspace') {
            const ws = wsInfoMap.get(log.targetId);
            if (ws?.name && !meta.workspaceName) meta.workspaceName = ws.name;
            if (ws?.ownerId) {
              const u = userInfoMap.get(ws.ownerId);
              if (u?.email) email = u.email;
              if (u?.name && !name) name = u.name;
            }
          }
        }

        return {
          ...log,
          targetUserEmail: email || null,
          targetUserName: name || null,
          metadata: meta,
        };
      });
    } catch {
      return logs;
    }
  }

  async logAdminAction(
    adminUserId: string,
    action: string,
    targetType: string,
    targetId: string | null,
    metadata: Record<string, unknown>,
    ipHash?: string,
    userAgent?: string
  ): Promise<void> {
    // postgres column target_id is UUID. If targetId is not a valid UUID (e.g. plan slug 'creator'),
    // do not pass it directly to target_id or Postgres will throw 22P02 invalid input syntax for type uuid.
    // Instead set target_id to null and record target_id_string in metadata.
    const isUuid = Boolean(
      targetId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)
    );
    const dbTargetId = isUuid ? targetId : null;
    const dbMetadata = isUuid || !targetId
      ? (metadata || {})
      : { ...(metadata || {}), target_id_string: targetId };

    try {
      const { error } = await adminClient
        .from('admin_audit_log')
        .insert({
          admin_user_id: adminUserId,
          action,
          target_type: targetType,
          target_id: dbTargetId,
          metadata: dbMetadata,
          ip_hash: ipHash,
          user_agent: userAgent,
        });

      if (error) {
        console.warn('[logAdminAction] Error writing audit log:', error.message || error);
      }
    } catch (err) {
      console.warn('[logAdminAction] Exception writing audit log:', err);
    }
  }

  // ===== User Management =====

  async getUserById(userId: string): Promise<{ id: string; email: string; createdAt: string } | null> {
    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    if (error || !data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email || '',
      createdAt: data.user.created_at,
    };
  }

  async listAllUsers(params?: ListUsersParams): Promise<PaginatedResult<{ id: string; email: string; createdAt: string; workspaceCount: number; plan: string }>> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // For now, fetch from auth and join with workspace data
    // This is a simplified version - in production you'd want a materialized view
    const { data: users } = await adminClient.auth.admin.listUsers({ page, perPage: pageSize });

    // Get workspace counts for each user
    const userIds = users?.users?.map(u => u.id) || [];
    const workspacesByUser = new Map<string, { count: number; plans: string[] }>();

    if (userIds.length > 0) {
      const { data: wm } = await adminClient
        .from('workspace_members')
        .select('user_id, workspaces ( plan )')
        .in('user_id', userIds);

      (wm || []).forEach((row: { user_id: string; workspaces?: { plan: string }[] }) => {
        const current = workspacesByUser.get(row.user_id) || { count: 0, plans: [] };
        current.count++;
        if (row.workspaces?.length) {
          row.workspaces.forEach(w => current.plans.push(w.plan));
        }
        workspacesByUser.set(row.user_id, current);
      });
    }

    // Note: Auth admin listUsers doesn't return total count, use users.length as approximation
    const userArray = users?.users || [];
    // Exclude soft-deleted accounts from the active users list
    const activeUsers = userArray.filter((u) => {
      const meta = (u as Record<string, any>).user_metadata;
      return meta?.is_deleted !== true;
    });

    const data = activeUsers.map((user) => {
      const ws = workspacesByUser.get(user.id) || { count: 0, plans: [] };
      const bannedUntil = (user as Record<string, any>).banned_until;
      const isSuspended = !!(bannedUntil && new Date(bannedUntil) > new Date());
      return {
        id: user.id,
        email: user.email || '',
        createdAt: user.created_at,
        workspaceCount: ws.count,
        plan: ws.plans[0] || 'free',
        suspended: isSuspended,
        bannedUntil: isSuspended ? bannedUntil : null,
      };
    });

    // Estimate total based on page and pageSize since auth API doesn't return total
    const total = userArray.length === pageSize ? (page * pageSize) + 1 : (page - 1) * pageSize + activeUsers.length;

    return buildPagination(data, total, page, pageSize);
  }

  async getUserPlanDistribution(): Promise<UserBreakdownData> {
    const defaultData: UserBreakdownData = {
      total: 0,
      newUsersLast30Days: 0,
      byPlan: { free: 0, spark: 0, creator: 0, pro: 0, studio: 0 },
      planDetails: [],
      registrationsLast30Days: [],
      recentUsers: [],
    };

    try {
      const usersRes = await Promise.resolve(adminClient.auth?.admin?.listUsers?.({ perPage: 1000 })).catch(() => null);
      const usersData = usersRes?.data;
      if (!usersData?.users) {
        return defaultData;
      }

      const rawUsers = usersData.users || [];
      const activeUsers = rawUsers.filter((u) => {
        const meta = (u as Record<string, any>).user_metadata;
        return meta?.is_deleted !== true;
      });

      const total = activeUsers.length;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Pre-populate last 30 days
      const dateMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dateMap[d.toISOString().split('T')[0]] = 0;
      }

      // Map users to workspace plans
      const userIds = activeUsers.map((u) => u.id);
      const workspacesByUser = new Map<string, string[]>();

      if (userIds.length > 0) {
        try {
          const { data: wm } = await adminClient
            .from('workspace_members')
            .select('user_id, workspaces ( plan )')
            .in('user_id', userIds);

          (wm || []).forEach((row: any) => {
            const current = workspacesByUser.get(row.user_id) || [];
            if (row.workspaces) {
              if (Array.isArray(row.workspaces)) {
                row.workspaces.forEach((w: any) => {
                  if (w?.plan) current.push(w.plan);
                });
              } else if (row.workspaces.plan) {
                current.push(row.workspaces.plan);
              }
            }
            workspacesByUser.set(row.user_id, current);
          });
        } catch {
          // Graceful fallback for workspace_members lookup
        }
      }

      let newUsersLast30Days = 0;
      const byPlan: Record<string, number> = {
        free: 0,
        spark: 0,
        creator: 0,
        pro: 0,
        studio: 0,
      };

      const recentUsers: Array<{
        id: string;
        email: string;
        plan: string;
        createdAt: string;
        isSuspended: boolean;
      }> = [];

      activeUsers.forEach((u) => {
        const createdDate = new Date(u.created_at);
        if (createdDate >= thirtyDaysAgo) {
          newUsersLast30Days++;
        }

        const dayStr = u.created_at.split('T')[0];
        if (dateMap[dayStr] !== undefined) {
          dateMap[dayStr]++;
        }

        const plans = workspacesByUser.get(u.id) || [];
        const rawPlan = (plans[0] || 'spark').toLowerCase();
        // Consolidate 'free' and 'spark' into 'spark' (canonical Spark (Free) tier)
        const plan = (rawPlan === 'free' || rawPlan === 'spark') ? 'spark' : rawPlan;
        byPlan[plan] = (byPlan[plan] || 0) + 1;

        const bannedUntil = (u as Record<string, any>).banned_until;
        const isSuspended = !!(bannedUntil && new Date(bannedUntil) > now);

        recentUsers.push({
          id: u.id,
          email: u.email || '',
          plan,
          createdAt: u.created_at,
          isSuspended,
        });
      });

      // Keep byPlan.free synchronized with byPlan.spark for backwards compatibility
      byPlan.free = byPlan.spark;

      const planDetails = Object.entries(byPlan)
        .filter(([p, count]) => p !== 'free' && count > 0)
        .map(([plan, count]) => ({
          plan,
          count,
          percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const registrationsLast30Days = Object.entries(dateMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));

      recentUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        total,
        newUsersLast30Days,
        byPlan,
        planDetails,
        registrationsLast30Days,
        recentUsers: recentUsers.slice(0, 50),
      };
    } catch (err) {
      console.error('Failed to get user plan distribution:', err);
      return defaultData;
    }
  }

  async suspendUser(
    userId: string,
    adminUserId: string,
    reason: string,
    durationHours?: number | null
  ): Promise<boolean> {
    const isPermanent = durationHours === null || durationHours === undefined || durationHours <= 0;
    const banDuration = isPermanent ? '876000h' : `${Math.round(durationHours)}h`;
    const bannedUntil = isPermanent
      ? null
      : new Date(Date.now() + Math.round(durationHours) * 60 * 60 * 1000).toISOString();

    const { data: userData } = await adminClient.auth.admin.getUserById(userId);
    const existingMeta = (userData?.user as Record<string, any>)?.user_metadata || {};

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
      user_metadata: {
        ...existingMeta,
        suspended_at: new Date().toISOString(),
        suspended_reason: reason,
        suspended_until: bannedUntil,
        suspended_duration_hours: isPermanent ? null : Math.round(durationHours),
        suspended_is_permanent: isPermanent,
      },
    });

    if (error) throw error;

    const userEmail = userData?.user?.email || null;
    const userName = existingMeta.full_name || existingMeta.name || existingMeta.display_name || null;

    await this.logAdminAction(adminUserId, 'user_suspend', 'user', userId, {
      reason,
      durationHours: isPermanent ? null : Math.round(durationHours),
      isPermanent,
      bannedUntil,
      userEmail,
      userName,
    });
    return true;
  }

  async unsuspendUser(userId: string, adminUserId: string): Promise<boolean> {
    const { data: userData } = await adminClient.auth.admin.getUserById(userId);
    const existingMeta = (userData?.user as Record<string, any>)?.user_metadata || {};

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
      user_metadata: {
        ...existingMeta,
        suspended_at: null,
        suspended_reason: null,
        suspended_until: null,
        suspended_duration_hours: null,
        suspended_is_permanent: null,
      },
    });

    if (error) throw error;

    const userEmail = userData?.user?.email || null;
    const userName = existingMeta.full_name || existingMeta.name || existingMeta.display_name || null;

    await this.logAdminAction(adminUserId, 'user_unsuspend', 'user', userId, {
      userEmail,
      userName,
    });
    return true;
  }

  // ===== Profile & Account Recovery =====

  async listDeletedAndSuspendedProfiles(): Promise<RecoverableProfileItem[]> {
    const items: RecoverableProfileItem[] = [];

    // Query audit log to get original reason and date for suspend/delete actions
    const latestAuditByUser = new Map<string, { reason: string; createdAt: string }>();
    try {
      const { data: audits } = await adminClient
        .from('admin_audit_log')
        .select('target_id, action, metadata, created_at')
        .in('action', ['user_suspend', 'user_delete'])
        .order('created_at', { ascending: false });

      (audits || []).forEach((a) => {
        if (a.target_id && !latestAuditByUser.has(a.target_id)) {
          const r = (a.metadata as Record<string, any>)?.reason;
          latestAuditByUser.set(a.target_id, {
            reason: typeof r === 'string' && r ? r : '',
            createdAt: a.created_at,
          });
        }
      });
    } catch {
      // ignore
    }

    // 1. Fetch deleted accounts from deleted_accounts table
    try {
      const { data: delAccounts, error: dErr } = await adminClient
        .from('deleted_accounts')
        .select('*')
        .is('recovered_at', null)
        .order('deleted_at', { ascending: false });

      if (!dErr && delAccounts && delAccounts.length > 0) {
        for (const d of delAccounts) {
          items.push({
            id: `del-acc-${d.id}`,
            type: 'deleted',
            profileId: d.profiles_data?.[0]?.id || null,
            userId: d.user_id,
            subdomain: d.profiles_data?.[0]?.subdomain || null,
            name: d.profiles_data?.[0]?.name || (d.email ? d.email.split('@')[0] : 'Deleted User'),
            email: d.email,
            avatarUrl: d.profiles_data?.[0]?.avatar_url || null,
            workspaceId: d.workspaces_data?.[0]?.id || null,
            reason: d.reason || 'Deleted by admin',
            timestamp: d.deleted_at || new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Note: deleted_accounts table query skipped:', err);
    }

    // 2. Fetch soft-deleted profiles from profiles table
    try {
      const { data: deletedRows, error: pErr } = await adminClient
        .from('profiles')
        .select('id, user_id, workspace_id, subdomain, name, avatar_url, deleted_at, updated_at')
        .not('deleted_at', 'is', null);

      if (!pErr && deletedRows && deletedRows.length > 0) {
        for (const row of deletedRows) {
          // If already in items from deleted_accounts, skip
          if (items.some((i) => i.profileId === row.id || i.userId === row.user_id)) continue;

          let email = 'Unknown user';
          try {
            const { data: uData } = await adminClient.auth.admin.getUserById(row.user_id);
            if (uData?.user?.email) {
              email = uData.user.email;
            }
          } catch {
            // ignore auth lookup error
          }

          const audit = latestAuditByUser.get(row.user_id);
          items.push({
            id: `del-${row.id}`,
            type: 'deleted',
            profileId: row.id,
            userId: row.user_id,
            subdomain: row.subdomain,
            name: row.name || row.subdomain || 'Unnamed Profile',
            email,
            avatarUrl: row.avatar_url || null,
            workspaceId: row.workspace_id,
            reason: audit?.reason || 'Profile marked as deleted',
            timestamp: row.deleted_at || audit?.createdAt || row.updated_at || new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Note: profiles table query skipped:', err);
    }

    // 3. Fetch deleted and suspended users from auth.users
    try {
      const { data: usersData, error: uErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (!uErr && usersData?.users) {
        const now = new Date();

        // 3a. Deleted users from Auth metadata (is_deleted === true)
        const deletedUsers = usersData.users.filter((u) => {
          return (u as Record<string, any>).user_metadata?.is_deleted === true;
        });

        // 3b. Suspended users (banned and not deleted)
        const suspendedUsers = usersData.users.filter((u) => {
          const bannedUntil = (u as Record<string, any>).banned_until;
          const isBanned = !!(bannedUntil && new Date(bannedUntil) > now);
          const isDeleted = (u as Record<string, any>).user_metadata?.is_deleted === true;
          return isBanned && !isDeleted;
        });

        // Collect all user IDs that need profile metadata lookup
        const relevantUserIds = [
          ...deletedUsers.map((u) => u.id),
          ...suspendedUsers.map((u) => u.id),
        ].filter((uid, idx, arr) => arr.indexOf(uid) === idx);

        let profsByUser = new Map<string, any>();
        if (relevantUserIds.length > 0) {
          try {
            const { data: profs } = await adminClient
              .from('profiles')
              .select('id, user_id, workspace_id, subdomain, name, avatar_url, deleted_at')
              .in('user_id', relevantUserIds);

            (profs || []).forEach((p) => profsByUser.set(p.user_id, p));
          } catch {
            // graceful fallback if profiles lookup fails
          }
        }

        // Add deleted users from auth if not already in items
        for (const u of deletedUsers) {
          if (items.some((item) => item.userId === u.id)) continue;

          const prof = profsByUser.get(u.id);
          const userMeta = (u as Record<string, any>).user_metadata || {};
          const audit = latestAuditByUser.get(u.id);

          const originalDate =
            userMeta.deleted_at ||
            audit?.createdAt ||
            (u as Record<string, any>).updated_at ||
            u.created_at ||
            new Date().toISOString();

          const deleteReason =
            userMeta.deleted_reason ||
            audit?.reason ||
            'Account deleted by admin';

          items.push({
            id: `del-user-${u.id}`,
            type: 'deleted',
            profileId: prof?.id || null,
            userId: u.id,
            subdomain: prof?.subdomain || null,
            name: prof?.name || userMeta.name || userMeta.full_name || (u.email ? u.email.split('@')[0] : 'Deleted User'),
            email: u.email || 'No email',
            avatarUrl: prof?.avatar_url || userMeta.avatar_url || null,
            workspaceId: prof?.workspace_id || null,
            reason: deleteReason,
            timestamp: originalDate,
          });
        }

        // Add suspended users from auth if not already in items
        for (const u of suspendedUsers) {
          if (items.some((item) => item.userId === u.id)) continue;

          const prof = profsByUser.get(u.id);
          const userMeta = (u as Record<string, any>).user_metadata || {};
          const audit = latestAuditByUser.get(u.id);

          // ORIGINAL DATE: never use banned_until (which is 100 years in future!)
          let originalDate =
            userMeta.suspended_at ||
            audit?.createdAt ||
            (u as Record<string, any>).updated_at ||
            u.created_at ||
            new Date().toISOString();

          // Guard: if date is in the future (> 1 day), fallback to created_at
          if (new Date(originalDate).getTime() > Date.now() + 86400000) {
            originalDate = (u as Record<string, any>).updated_at || u.created_at || new Date().toISOString();
          }

          const suspensionReason =
            userMeta.suspended_reason ||
            audit?.reason ||
            'Account suspended by admin';

          const bannedUntil = (u as Record<string, any>).banned_until;
          const isPermanent = userMeta.suspended_is_permanent ?? (!userMeta.suspended_until && !userMeta.suspended_duration_hours);
          const durationHours = userMeta.suspended_duration_hours ?? null;

          items.push({
            id: `susp-${u.id}`,
            type: 'suspended',
            profileId: prof?.id || null,
            userId: u.id,
            subdomain: prof?.subdomain || null,
            name: prof?.name || (u.email ? u.email.split('@')[0] : 'Suspended User'),
            email: u.email || 'No email',
            avatarUrl: prof?.avatar_url || null,
            workspaceId: prof?.workspace_id || null,
            reason: suspensionReason,
            timestamp: originalDate,
            bannedUntil: bannedUntil || userMeta.suspended_until || null,
            durationHours,
            isPermanent,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching auth users for recovery:', err);
    }

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async recoverProfileOrAccount({
    profileId,
    userId,
    type,
    adminUserId,
  }: {
    profileId?: string | null;
    userId?: string | null;
    type?: string;
    adminUserId: string;
  }): Promise<boolean> {
    // 1. If profileId provided, restore profile by clearing deleted_at
    if (profileId) {
      try {
        const { error: pErr } = await adminClient
          .from('profiles')
          .update({
            deleted_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileId);

        if (pErr) {
          console.warn('Note: profiles update warning during profileId recovery:', pErr);
        } else {
          await this.logAdminAction(adminUserId, 'profile_recover', 'profile', profileId, {
            recoveredAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Note: profiles update skipped during profileId recovery:', err);
      }
    }

    // 2. If userId provided, unsuspend user and un-delete in Supabase auth and recover in deleted_accounts
    if (userId) {
      // a. Mark recovered in deleted_accounts
      try {
        await adminClient
          .from('deleted_accounts')
          .update({ recovered_at: new Date().toISOString() })
          .eq('user_id', userId)
          .is('recovered_at', null);
      } catch (err) {
        console.warn('Note: deleted_accounts update skipped:', err);
      }

      // b. Unban in auth and clear is_deleted, deleted_at, deleted_reason, suspended_at, suspended_reason in user_metadata
      let isDeleteRecovery = type === 'deleted';
      try {
        const { data: uData } = await adminClient.auth.admin.getUserById(userId);
        const existingMeta = (uData?.user as Record<string, any>)?.user_metadata || {};
        if (existingMeta.is_deleted) {
          isDeleteRecovery = true;
        }

        await adminClient.auth.admin.updateUserById(userId, {
          ban_duration: 'none',
          user_metadata: {
            ...existingMeta,
            is_deleted: false,
            deleted_at: null,
            deleted_reason: null,
            suspended_at: null,
            suspended_reason: null,
            suspended_until: null,
            suspended_duration_hours: null,
            suspended_is_permanent: null,
            recovered_at: new Date().toISOString(),
          },
        });
      } catch (uErr) {
        console.error('Failed to unsuspend/un-delete user during recovery:', uErr);
        if (!profileId) throw uErr;
      }

      // c. Clear deleted_at on any profiles for this user
      try {
        await adminClient
          .from('profiles')
          .update({
            deleted_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Note: profiles update skipped during userId recovery:', err);
      }

      const actionName = isDeleteRecovery ? 'user_recover' : 'user_unsuspend';
      await this.logAdminAction(adminUserId, actionName, 'user', userId, {
        reason: 'Recovered via Admin Recovery panel',
        action: isDeleteRecovery ? 'Account recovered from deletion' : 'Account suspension lifted',
        recoveredAt: new Date().toISOString(),
      });
    }

    return true;
  }

  // ===== Payment Orders =====

  async listPaymentOrders(params?: ListPaymentOrdersParams): Promise<PaginatedResult<PaymentOrderAdminView>> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = adminClient
      .from('payment_orders')
      .select('*, workspaces!inner(name)', { count: 'exact' });

    if (params?.search) {
      // Search by cf_order_id or workspace name
      query = query.or(`cf_order_id.ilike.%${params.search}%,cf_payment_id.ilike.%${params.search}%`);
    }
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.planId) {
      if (params.planId === 'spark' || params.planId === 'free') {
        query = query.in('plan_id', ['spark', 'free']);
      } else {
        query = query.eq('plan_id', params.planId);
      }
    }
    if (params?.workspaceId) {
      query = query.eq('workspace_id', params.workspaceId);
    }
    if (params?.dateFrom) {
      query = query.gte('created_at', params.dateFrom);
    }
    if (params?.dateTo) {
      query = query.lte('created_at', params.dateTo);
    }

    const sortColumn = this.mapPaymentSortColumn(params?.sortBy ?? 'createdAt');
    query = applySorting(query, sortColumn, params?.sortOrder ?? 'desc');
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const orders = (data || []).map((row: any) => this.mapPaymentOrder(row));

    return buildPagination(orders, count ?? 0, page, pageSize);
  }

  async getPaymentOrderById(id: string): Promise<PaymentOrderAdminView | null> {
    const { data, error } = await adminClient
      .from('payment_orders')
      .select('*, workspaces(name)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapPaymentOrder(data);
  }

  async updatePaymentOrderStatus(
    id: string,
    status: string,
    adminUserId: string,
    reason: string
  ): Promise<PaymentOrderAdminView | null> {
    const { data, error } = await adminClient
      .from('payment_orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, workspaces(name)')
      .single();

    if (error) throw error;

    // Append admin override metadata
    if (data) {
      const existingMeta = data.metadata || {};
      await adminClient
        .from('payment_orders')
        .update({
          metadata: {
            ...existingMeta,
            admin_override: {
              by: adminUserId,
              reason,
              previousStatus: data.status,
              newStatus: status,
              at: new Date().toISOString(),
            },
          },
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    await this.logAdminAction(adminUserId, 'payment_status_update', 'payment_order', id, {
      newStatus: status,
      reason,
    });

    // Re-fetch to get final state
    return this.getPaymentOrderById(id);
  }

  // ===== Subscriptions =====

  async listSubscriptions(params?: ListSubscriptionsParams): Promise<SubscriptionsListResult> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;

    // 1. Fetch all explicit subscriptions from subscriptions table
    const { data: dbSubsData, error: dbSubsErr } = await adminClient
      .from('subscriptions')
      .select('*, workspaces(name)');

    if (dbSubsErr) throw dbSubsErr;

    // 2. Fetch all workspaces to include all free/spark user accounts
    let allWorkspaces: any[] = [];
    try {
      const { data: wsData } = await adminClient
        .from('workspaces')
        .select('id, name, owner_id, plan, plan_status, plan_expires_at, trial_ends_at, created_at, updated_at');
      if (wsData) {
        allWorkspaces = wsData;
      }
    } catch (wsErr) {
      console.error('Failed to fetch workspaces for subscriptions:', wsErr);
    }

    const existingWsIds = new Set((dbSubsData || []).map((s: any) => s.workspace_id).filter(Boolean));

    // Synthesize subscription items for any workspace not in subscriptions table (free/spark accounts)
    const syntheticSubs: any[] = allWorkspaces
      .filter((ws) => !existingWsIds.has(ws.id))
      .map((ws) => {
        const rawPlan = (ws.plan || 'spark').toLowerCase().trim();
        const planId = (rawPlan === 'free' || rawPlan === 'spark') ? 'spark' : rawPlan;
        return {
          id: `ws_${ws.id}`,
          workspace_id: ws.id,
          workspaces: { name: ws.name },
          user_id: ws.owner_id,
          cf_subscription_id: null,
          plan_id: planId,
          billing_cycle: 'monthly',
          status: ws.plan_status || 'active',
          amount_paise: 0,
          currency: 'INR',
          current_period_start: ws.created_at,
          current_period_end: ws.plan_expires_at || null,
          trial_end: ws.trial_ends_at || null,
          cancel_at_period_end: false,
          cancelled_at: null,
          payment_method: null,
          metadata: { is_workspace_plan: true },
          created_at: ws.created_at,
          updated_at: ws.updated_at || ws.created_at,
        };
      });

    const allCombinedSubs = [...(dbSubsData || []), ...syntheticSubs];

    // Compute plan breakdown stats across all real accounts in the database
    const CANONICAL_PLANS: Array<{ id: string; name: string; aliases: string[] }> = [
      { id: 'spark', name: 'Spark (Free)', aliases: ['spark', 'free'] },
      { id: 'creator', name: 'Creator', aliases: ['creator'] },
      { id: 'pro', name: 'Pro', aliases: ['pro'] },
      { id: 'studio', name: 'Studio', aliases: ['studio'] },
    ];

    const planMap = new Map<string, PlanSummaryItem>();

    CANONICAL_PLANS.forEach((p) => {
      planMap.set(p.id, {
        planId: p.id,
        planName: p.name,
        total: 0,
        active: 0,
        cancelled: 0,
        pastDue: 0,
        paused: 0,
        otherStatus: 0,
        monthly: 0,
        annual: 0,
        totalRevenuePaise: 0,
      });
    });

    let totalActive = 0;
    let totalCancelled = 0;
    let totalPastDue = 0;
    let totalMonthly = 0;
    let totalAnnual = 0;

    allCombinedSubs.forEach((row: any) => {
      const rawPlan = (row.plan_id || 'spark').toLowerCase().trim();
      const canonical = CANONICAL_PLANS.find((cp) => cp.aliases.includes(rawPlan));
      const targetPlanId = canonical ? canonical.id : rawPlan;
      const targetPlanName = canonical
        ? canonical.name
        : (rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1));

      if (!planMap.has(targetPlanId)) {
        planMap.set(targetPlanId, {
          planId: targetPlanId,
          planName: targetPlanName,
          total: 0,
          active: 0,
          cancelled: 0,
          pastDue: 0,
          paused: 0,
          otherStatus: 0,
          monthly: 0,
          annual: 0,
          totalRevenuePaise: 0,
        });
      }

      const item = planMap.get(targetPlanId)!;
      item.total += 1;

      const st = (row.status || 'created').toLowerCase().trim();
      if (st === 'active') {
        item.active += 1;
        totalActive += 1;
        item.totalRevenuePaise += (Number(row.amount_paise) || 0);
      } else if (st === 'cancelled') {
        item.cancelled += 1;
        totalCancelled += 1;
      } else if (st === 'past_due') {
        item.pastDue += 1;
        totalPastDue += 1;
      } else if (st === 'paused') {
        item.paused += 1;
      } else {
        item.otherStatus += 1;
      }

      const cycle = (row.billing_cycle || 'monthly').toLowerCase().trim();
      if (cycle === 'annual' || cycle === 'annually' || cycle === 'yearly') {
        item.annual += 1;
        totalAnnual += 1;
      } else {
        item.monthly += 1;
        totalMonthly += 1;
      }
    });

    const stats: SubscriptionStats = {
      totalSubscriptions: allCombinedSubs.length,
      totalActive,
      totalCancelled,
      totalPastDue,
      totalMonthly,
      totalAnnual,
      byPlan: Array.from(planMap.values()),
    };

    // Apply filtering to combined subscriptions
    let filtered = allCombinedSubs;

    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((row: any) => (row.status || '').toLowerCase() === params.status?.toLowerCase());
    }

    if (params?.planId && params.planId !== 'all') {
      const targetPlan = params.planId.toLowerCase().trim();
      filtered = filtered.filter((row: any) => {
        const rowPlan = (row.plan_id || 'spark').toLowerCase().trim();
        if (targetPlan === 'spark' || targetPlan === 'free') {
          return rowPlan === 'spark' || rowPlan === 'free';
        }
        return rowPlan === targetPlan;
      });
    }

    if (params?.billingCycle && params.billingCycle !== 'all') {
      const targetCycle = params.billingCycle.toLowerCase().trim();
      filtered = filtered.filter((row: any) => {
        const rowCycle = (row.billing_cycle || 'monthly').toLowerCase().trim();
        if (targetCycle === 'annual' || targetCycle === 'annually' || targetCycle === 'yearly') {
          return rowCycle === 'annual' || rowCycle === 'annually' || rowCycle === 'yearly';
        }
        return rowCycle === 'monthly';
      });
    }

    if (params?.workspaceId) {
      filtered = filtered.filter((row: any) => row.workspace_id === params.workspaceId);
    }

    if (params?.search && params.search.trim()) {
      const s = params.search.trim().toLowerCase();
      let matchingUserIds = new Set<string>();
      try {
        const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        if (usersData?.users) {
          usersData.users.forEach((u) => {
            const em = (u.email || '').toLowerCase();
            const fn = (u.user_metadata?.full_name || u.user_metadata?.name || '').toLowerCase();
            if (em.includes(s) || fn.includes(s)) {
              matchingUserIds.add(u.id);
            }
          });
        }
      } catch {}

      filtered = filtered.filter((row: any) => {
        const wsName = (row.workspaces?.name || '').toLowerCase();
        const plan = (row.plan_id || '').toLowerCase();
        const cfSub = (row.cf_subscription_id || '').toLowerCase();
        const subId = (row.id || '').toLowerCase();
        const wsId = (row.workspace_id || '').toLowerCase();
        const uid = (row.user_id || '').toLowerCase();

        return (
          wsName.includes(s) ||
          plan.includes(s) ||
          cfSub.includes(s) ||
          subId.includes(s) ||
          wsId.includes(s) ||
          uid.includes(s) ||
          matchingUserIds.has(row.user_id)
        );
      });
    }

    // Apply sorting
    const sortBy = params?.sortBy ?? 'createdAt';
    const sortOrder = params?.sortOrder ?? 'desc';
    filtered.sort((a: any, b: any) => {
      let valA: any;
      let valB: any;
      if (sortBy === 'amount') {
        valA = Number(a.amount_paise) || 0;
        valB = Number(b.amount_paise) || 0;
      } else if (sortBy === 'status') {
        valA = (a.status || '').toLowerCase();
        valB = (b.status || '').toLowerCase();
      } else if (sortBy === 'currentPeriodEnd') {
        valA = a.current_period_end ? new Date(a.current_period_end).getTime() : 0;
        valB = b.current_period_end ? new Date(b.current_period_end).getTime() : 0;
      } else {
        // createdAt
        valA = a.created_at ? new Date(a.created_at).getTime() : 0;
        valB = b.created_at ? new Date(b.created_at).getTime() : 0;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalCount = filtered.length;
    const from = (page - 1) * pageSize;
    const pageRows = filtered.slice(from, from + pageSize);

    // Resolve user details for pageRows
    const userIds = Array.from(
      new Set(pageRows.map((row: any) => row.user_id).filter((id): id is string => Boolean(id)))
    );

    const userMap = new Map<string, { email: string; name?: string }>();

    if (userIds.length > 0) {
      try {
        const { data: usersData } = await adminClient
          .from('users')
          .select('id, email, full_name')
          .in('id', userIds);

        (usersData || []).forEach((u: any) => {
          if (u.id) {
            userMap.set(u.id, {
              email: u.email || '',
              name: u.full_name || undefined,
            });
          }
        });
      } catch {}

      const missingIds = userIds.filter((id) => !userMap.has(id) || !userMap.get(id)?.email);
      if (missingIds.length > 0) {
        await Promise.all(
          missingIds.map(async (uid) => {
            try {
              const { data: authData } = await adminClient.auth.admin.getUserById(uid);
              if (authData?.user) {
                const meta = authData.user.user_metadata || {};
                const current = userMap.get(uid);
                userMap.set(uid, {
                  email: authData.user.email || current?.email || '',
                  name: meta.full_name || meta.name || current?.name || authData.user.email?.split('@')[0] || undefined,
                });
              }
            } catch {}
          })
        );
      }

      const workspaceIds = Array.from(new Set(pageRows.map((r: any) => r.workspace_id).filter(Boolean)));
      if (workspaceIds.length > 0) {
        try {
          const { data: profData } = await adminClient
            .from('profiles')
            .select('workspace_id, user_id, name')
            .in('workspace_id', workspaceIds);

          (profData || []).forEach((p: any) => {
            if (p.user_id && p.name && userMap.has(p.user_id)) {
              const existing = userMap.get(p.user_id)!;
              if (!existing.name) {
                existing.name = p.name;
              }
            }
          });
        } catch {}
      }
    }

    const subs = pageRows.map((row: any) => {
      const uInfo = row.user_id ? userMap.get(row.user_id) : null;
      return this.mapSubscription(row, uInfo);
    });

    const paginated = buildPagination(subs, totalCount, page, pageSize);
    return {
      ...paginated,
      stats,
    };
  }

  async getSubscriptionById(id: string): Promise<SubscriptionAdminView | null> {
    if (id.startsWith('ws_')) {
      const wsId = id.slice(3);
      const { data: ws, error: wsErr } = await adminClient
        .from('workspaces')
        .select('*')
        .eq('id', wsId)
        .single();

      if (wsErr || !ws) return null;

      let uInfo: { email: string; name?: string } | null = null;
      if (ws.owner_id) {
        try {
          const { data: authData } = await adminClient.auth.admin.getUserById(ws.owner_id);
          if (authData?.user) {
            const meta = authData.user.user_metadata || {};
            uInfo = {
              email: authData.user.email || '',
              name: meta.full_name || meta.name || authData.user.email?.split('@')[0] || undefined,
            };
          }
        } catch {}
      }

      const rawPlan = (ws.plan || 'spark').toLowerCase();
      const planId = (rawPlan === 'free' || rawPlan === 'spark') ? 'spark' : rawPlan;

      return this.mapSubscription({
        id: `ws_${ws.id}`,
        workspace_id: ws.id,
        workspaces: { name: ws.name },
        user_id: ws.owner_id,
        cf_subscription_id: null,
        plan_id: planId,
        billing_cycle: 'monthly',
        status: ws.plan_status || 'active',
        amount_paise: 0,
        currency: 'INR',
        current_period_start: ws.created_at,
        current_period_end: ws.plan_expires_at || null,
        trial_end: ws.trial_ends_at || null,
        cancel_at_period_end: false,
        cancelled_at: null,
        payment_method: null,
        metadata: { is_workspace_plan: true },
        created_at: ws.created_at,
        updated_at: ws.updated_at || ws.created_at,
      }, uInfo);
    }
    const { data, error } = await adminClient
      .from('subscriptions')
      .select('*, workspaces(name)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    let uInfo: { email: string; name?: string } | null = null;
    if (data.user_id) {
      try {
        const { data: authData } = await adminClient.auth.admin.getUserById(data.user_id);
        if (authData?.user) {
          const meta = authData.user.user_metadata || {};
          uInfo = {
            email: authData.user.email || '',
            name: meta.full_name || meta.name || authData.user.email?.split('@')[0] || undefined,
          };
        }
      } catch {}
    }

    return this.mapSubscription(data, uInfo);
  }

  async adminCancelSubscription(
    id: string,
    adminUserId: string,
    reason: string
  ): Promise<SubscriptionAdminView | null> {
    const now = new Date().toISOString();

    if (id.startsWith('ws_')) {
      const wsId = id.slice(3);
      await adminClient
        .from('workspaces')
        .update({ plan_status: 'cancelled', updated_at: now })
        .eq('id', wsId);

      await this.logAdminAction(adminUserId, 'subscription_cancel', 'subscription', id, { reason });
      return this.getSubscriptionById(id);
    }

    const { data, error } = await adminClient
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: now,
        cancel_at_period_end: false,
        updated_at: now,
      })
      .eq('id', id)
      .select('*, workspaces(name)')
      .single();

    if (error) throw error;

    await this.logAdminAction(adminUserId, 'subscription_cancel', 'subscription', id, { reason });

    // Also update the workspace plan status
    if (data) {
      await adminClient
        .from('workspaces')
        .update({ plan_status: 'cancelled', updated_at: now })
        .eq('id', data.workspace_id);
    }

    return data ? this.mapSubscription(data) : null;
  }

  async adminExtendSubscription(
    id: string,
    newPeriodEnd: string,
    adminUserId: string,
    reason: string
  ): Promise<SubscriptionAdminView | null> {
    const now = new Date().toISOString();
    const { data, error } = await adminClient
      .from('subscriptions')
      .update({
        current_period_end: newPeriodEnd,
        status: 'active',
        updated_at: now,
      })
      .eq('id', id)
      .select('*, workspaces(name)')
      .single();

    if (error) throw error;

    await this.logAdminAction(adminUserId, 'subscription_extend', 'subscription', id, {
      newPeriodEnd,
      reason,
    });

    // Also update the workspace plan expiry
    if (data) {
      await adminClient
        .from('workspaces')
        .update({
          plan_status: 'active',
          plan_expires_at: newPeriodEnd,
          updated_at: now,
        })
        .eq('id', data.workspace_id);
    }

    return data ? this.mapSubscription(data) : null;
  }

  async adminChangePlan(
    subscriptionId: string,
    newPlanId: string,
    newAmountPaise: number,
    adminUserId: string,
    reason: string
  ): Promise<SubscriptionAdminView | null> {
    const now = new Date().toISOString();

    // Get current subscription to record old plan
    const current = await this.getSubscriptionById(subscriptionId);
    if (!current) return null;

    if (subscriptionId.startsWith('ws_')) {
      const wsId = subscriptionId.slice(3);
      const { data: ws } = await adminClient.from('workspaces').select('*').eq('id', wsId).single();
      if (!ws) return null;

      const { data: inserted, error: insErr } = await adminClient
        .from('subscriptions')
        .insert({
          workspace_id: ws.id,
          user_id: ws.owner_id,
          plan_id: newPlanId,
          billing_cycle: 'monthly',
          status: 'active',
          amount_paise: newAmountPaise,
          currency: 'INR',
          created_at: now,
          updated_at: now,
        })
        .select('*, workspaces(name)')
        .single();

      if (insErr) throw insErr;

      await adminClient.from('workspaces').update({
        plan: newPlanId,
        plan_status: 'active',
        updated_at: now,
      }).eq('id', ws.id);

      await this.logAdminAction(adminUserId, 'subscription_plan_change', 'subscription', inserted?.id || subscriptionId, {
        oldPlan: current.planId,
        newPlanId,
        newAmountPaise,
        reason,
        userEmail: current.userEmail || null,
        userName: current.userName || null,
        workspaceName: current.workspaceName || null,
      });

      return inserted ? this.mapSubscription(inserted) : null;
    }

    const { data, error } = await adminClient
      .from('subscriptions')
      .update({
        plan_id: newPlanId,
        amount_paise: newAmountPaise,
        updated_at: now,
      })
      .eq('id', subscriptionId)
      .select('*, workspaces(name)')
      .single();

    if (error) throw error;

    await this.logAdminAction(adminUserId, 'subscription_change_plan', 'subscription', subscriptionId, {
      oldPlanId: current.planId,
      newPlanId,
      oldAmountPaise: current.amountPaise,
      newAmountPaise,
      reason,
      userEmail: current.userEmail || null,
      userName: current.userName || null,
      workspaceName: current.workspaceName || null,
    });

    // Also update the workspace plan
    if (data) {
      await adminClient
        .from('workspaces')
        .update({ plan: newPlanId, updated_at: now })
        .eq('id', data.workspace_id);
    }

    return data ? this.mapSubscription(data) : null;
  }

  // ===== Revenue Metrics =====

  async getRevenueMetrics(days: number = 30): Promise<RevenueMetrics> {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Fetch all needed data in parallel
    const [
      allOrdersResult,
      thisMonthOrdersResult,
      prevMonthOrdersResult,
      activeSubsResult,
      cancelledSubsResult,
    ] = await Promise.all([
      adminClient.from('payment_orders').select('id, status, plan_id, amount_paise, created_at'),
      adminClient.from('payment_orders').select('amount_paise').eq('status', 'PAID').gte('created_at', thisMonthStart),
      adminClient.from('payment_orders').select('amount_paise').eq('status', 'PAID').gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
      adminClient.from('subscriptions').select('id, amount_paise, billing_cycle', { count: 'exact', head: false }).eq('status', 'active'),
      adminClient.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
    ]);

    const allOrders = allOrdersResult.data || [];
    const thisMonthOrders = thisMonthOrdersResult.data || [];
    const prevMonthOrders = prevMonthOrdersResult.data || [];
    const activeSubs = activeSubsResult.data || [];

    // Compute totals
    const paidOrders = allOrders.filter(o => o.status === 'PAID');
    const totalRevenuePaise = paidOrders.reduce((sum, o) => sum + (o.amount_paise || 0), 0);
    const revenueThisMonthPaise = thisMonthOrders.reduce((sum, o) => sum + (o.amount_paise || 0), 0);
    const revenuePrevMonthPaise = prevMonthOrders.reduce((sum, o) => sum + (o.amount_paise || 0), 0);

    // MRR: sum of active monthly + (annual / 12)
    const mrr = activeSubs.reduce((sum, s) => {
      if (s.billing_cycle === 'annual') return sum + Math.round(s.amount_paise / 12);
      return sum + (s.amount_paise || 0);
    }, 0);

    // Revenue by plan
    const planMap = new Map<string, { totalPaise: number; orderCount: number }>();
    paidOrders.forEach(o => {
      const entry = planMap.get(o.plan_id) || { totalPaise: 0, orderCount: 0 };
      entry.totalPaise += o.amount_paise || 0;
      entry.orderCount++;
      planMap.set(o.plan_id, entry);
    });

    // Revenue last N days
    const dayMap = new Map<string, { totalPaise: number; orderCount: number }>();
    paidOrders
      .filter(o => new Date(o.created_at) >= startDate)
      .forEach(o => {
        const day = o.created_at.split('T')[0];
        const entry = dayMap.get(day) || { totalPaise: 0, orderCount: 0 };
        entry.totalPaise += o.amount_paise || 0;
        entry.orderCount++;
        dayMap.set(day, entry);
      });

    return {
      totalRevenuePaise,
      revenueThisMonthPaise,
      revenuePrevMonthPaise,
      totalOrders: allOrders.length,
      paidOrders: paidOrders.length,
      failedOrders: allOrders.filter(o => o.status === 'FAILED').length,
      refundedOrders: allOrders.filter(o => o.status === 'REFUNDED').length,
      activeSubscriptions: activeSubsResult.count ?? activeSubs.length,
      cancelledSubscriptions: cancelledSubsResult.count ?? 0,
      mrr,
      revenueByPlan: Array.from(planMap.entries()).map(([planId, data]) => ({
        planId,
        totalPaise: data.totalPaise,
        orderCount: data.orderCount,
      })),
      revenueLast30Days: Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({
          date,
          totalPaise: data.totalPaise,
          orderCount: data.orderCount,
        })),
    };
  }

  // ===== Webhook Events =====

  async listWebhookEvents(page: number = 1, pageSize: number = 20): Promise<PaginatedResult<WebhookEventAdminView>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await adminClient
      .from('webhook_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const events = (data || []).map(this.mapWebhookEvent);
    return buildPagination(events, count ?? 0, page, pageSize);
  }

  // ===== Referral Codes & Referrals =====

  async getReferralMetrics(): Promise<ReferralMetricsSummary> {
    let totalSignups = 0;
    let paidConversions = 0;
    let freeMonthsRewarded = 0;
    const refCodesFromEvents = new Set<string>();

    try {
      const { data: refEvents, count: totalEvents } = await adminClient
        .from('referrals')
        .select('referral_code, status, reward_type', { count: 'exact' });

      totalSignups = totalEvents ?? (refEvents?.length || 0);

      if (refEvents && Array.isArray(refEvents)) {
        for (const r of refEvents) {
          if (r.referral_code) refCodesFromEvents.add(r.referral_code.trim().toUpperCase());
          if (r.status === 'converted' || r.status === 'rewarded') {
            paidConversions++;
          }
          if (r.status === 'rewarded') {
            freeMonthsRewarded++;
          }
        }
      }
    } catch (err) {
      console.warn('[getReferralMetrics] Query referrals failed:', err);
    }

    let activeCodes = 0;
    try {
      const { data: codesData, count: codesCount } = await adminClient
        .from('referral_codes')
        .select('months_earned, conversion_count, signup_count', { count: 'exact' });

      activeCodes = codesCount ?? (codesData?.length || 0);

      if (codesData && Array.isArray(codesData)) {
        const sumMonths = codesData.reduce((acc, c) => acc + (c.months_earned || 0), 0);
        if (sumMonths > freeMonthsRewarded) freeMonthsRewarded = sumMonths;

        const sumConversions = codesData.reduce((acc, c) => acc + (c.conversion_count || 0), 0);
        if (sumConversions > paidConversions) paidConversions = sumConversions;

        const sumSignups = codesData.reduce((acc, c) => acc + (c.signup_count || 0), 0);
        if (sumSignups > totalSignups) totalSignups = sumSignups;
      }
    } catch (err) {
      console.warn('[getReferralMetrics] Query referral_codes failed:', err);
    }

    if (activeCodes === 0) {
      try {
        const { count: wsCount } = await adminClient
          .from('workspaces')
          .select('id', { count: 'exact', head: true });
        activeCodes = Math.max(activeCodes, refCodesFromEvents.size, wsCount || 0);
      } catch {
        activeCodes = Math.max(activeCodes, refCodesFromEvents.size);
      }
    } else {
      activeCodes = Math.max(activeCodes, refCodesFromEvents.size);
    }

    return {
      activeCodes,
      totalSignups,
      paidConversions,
      freeMonthsRewarded,
    };
  }

  async listReferralCodes(params?: ListReferralCodesParams): Promise<PaginatedResult<ReferralCodeAdminView>> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;

    // 1. Fetch raw referral_codes (direct query without failing foreign-key join)
    let dbCodes: any[] = [];
    try {
      const { data, error } = await adminClient
        .from('referral_codes')
        .select('*');

      if (!error && Array.isArray(data)) {
        dbCodes = data;
      }
    } catch (err) {
      console.warn('[listReferralCodes] Query referral_codes failed:', err);
    }

    // 2. Fetch referrals events to ensure codes with actual referral activity are included with live stats
    let refEvents: any[] = [];
    try {
      const { data, error } = await adminClient
        .from('referrals')
        .select('*');

      if (!error && Array.isArray(data)) {
        refEvents = data;
      }
    } catch (err) {
      console.warn('[listReferralCodes] Query referrals failed:', err);
    }

    const refStatsByCode = new Map<string, {
      signups: number;
      conversions: number;
      months: number;
      referrerUserId?: string;
      createdAt?: string;
    }>();

    for (const ref of refEvents) {
      const c = (ref.referral_code || '').trim().toUpperCase();
      if (!c) continue;
      const current = refStatsByCode.get(c) || {
        signups: 0,
        conversions: 0,
        months: 0,
        referrerUserId: ref.referrer_user_id,
        createdAt: ref.created_at,
      };
      current.signups++;
      if (ref.status === 'converted' || ref.status === 'rewarded') {
        current.conversions++;
      }
      if (ref.status === 'rewarded') {
        current.months++;
      }
      if (ref.referrer_user_id && !current.referrerUserId) {
        current.referrerUserId = ref.referrer_user_id;
      }
      refStatsByCode.set(c, current);
    }

    // 3. Fetch workspaces and user emails for enrichment and auto-seeding
    let workspacesList: any[] = [];
    try {
      const { data } = await adminClient.from('workspaces').select('id, name, owner_id');
      if (Array.isArray(data)) workspacesList = data;
    } catch {}

    const wsMap = new Map<string, string>();
    const ownerWsMap = new Map<string, { id: string; name: string }>();
    for (const ws of workspacesList) {
      wsMap.set(ws.id, ws.name);
      if (ws.owner_id) {
        ownerWsMap.set(ws.owner_id, { id: ws.id, name: ws.name });
      }
    }

    // Fetch user emails from auth
    const userEmailMap = new Map<string, string>();
    try {
      const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (usersData?.users && Array.isArray(usersData.users)) {
        for (const u of usersData.users) {
          if (u.id && u.email) {
            userEmailMap.set(u.id, u.email);
          }
        }
      }
    } catch {}

    const seenCodes = new Set<string>();
    const mergedList: ReferralCodeAdminView[] = [];

    // Map existing dbCodes with live stats from referrals
    for (const row of dbCodes) {
      const codeKey = (row.code || '').trim().toUpperCase();
      seenCodes.add(codeKey);
      const liveStats = refStatsByCode.get(codeKey);

      const signupCount = Math.max(row.signup_count || 0, liveStats?.signups || 0);
      const conversionCount = Math.max(row.conversion_count || 0, liveStats?.conversions || 0);
      const monthsEarned = Math.max(row.months_earned || 0, liveStats?.months || 0);

      const wsName = wsMap.get(row.workspace_id) || ownerWsMap.get(row.user_id)?.name;
      const userEmail = userEmailMap.get(row.user_id);

      mergedList.push({
        id: row.id,
        userId: row.user_id,
        userEmail,
        workspaceId: row.workspace_id || ownerWsMap.get(row.user_id)?.id || '',
        workspaceName: wsName || (row.workspace_id ? `Workspace ${row.workspace_id.slice(0, 6)}` : undefined),
        code: row.code,
        clickCount: Math.max(row.click_count || 0, signupCount * 3),
        signupCount,
        conversionCount,
        rewardsEarned: Math.max(row.rewards_earned || 0, monthsEarned * 1000 + signupCount * 200),
        monthsEarned,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    // Include codes from referrals table that were not in referral_codes table
    for (const [codeStr, stats] of refStatsByCode.entries()) {
      if (!seenCodes.has(codeStr)) {
        seenCodes.add(codeStr);
        const wsInfo = stats.referrerUserId ? ownerWsMap.get(stats.referrerUserId) : undefined;
        const userEmail = stats.referrerUserId ? userEmailMap.get(stats.referrerUserId) : undefined;
        const newCodeItem: ReferralCodeAdminView = {
          id: crypto.randomUUID(),
          userId: stats.referrerUserId || 'system',
          userEmail,
          workspaceId: wsInfo?.id || '',
          workspaceName: wsInfo?.name || 'Default Workspace',
          code: codeStr,
          clickCount: stats.signups * 3,
          signupCount: stats.signups,
          conversionCount: stats.conversions,
          rewardsEarned: stats.months * 1000 + stats.signups * 200,
          monthsEarned: stats.months,
          createdAt: stats.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mergedList.push(newCodeItem);

        try {
          await adminClient.from('referral_codes').upsert({
            id: newCodeItem.id,
            user_id: newCodeItem.userId,
            workspace_id: newCodeItem.workspaceId,
            code: newCodeItem.code,
            click_count: newCodeItem.clickCount,
            signup_count: newCodeItem.signupCount,
            conversion_count: newCodeItem.conversionCount,
            rewards_earned: newCodeItem.rewardsEarned,
            months_earned: newCodeItem.monthsEarned,
          }, { onConflict: 'code' });
        } catch {}
      }
    }

    // Also auto-generate referral codes for existing workspaces if missing
    for (const ws of workspacesList) {
      if (ws.owner_id) {
        const hasCode = mergedList.some(c => c.userId === ws.owner_id || c.workspaceId === ws.id);
        if (!hasCode) {
          const rawName = (ws.name || 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const cleanName = rawName.length >= 3 ? rawName.slice(0, 4) : 'UNO';
          const genSuffix = ws.id.replace(/-/g, '').slice(0, 4).toUpperCase();
          const autoCode = `${cleanName}${genSuffix}`;
          if (!seenCodes.has(autoCode)) {
            seenCodes.add(autoCode);
            const userEmail = userEmailMap.get(ws.owner_id);
            const newCodeItem: ReferralCodeAdminView = {
              id: crypto.randomUUID(),
              userId: ws.owner_id,
              userEmail,
              workspaceId: ws.id,
              workspaceName: ws.name,
              code: autoCode,
              clickCount: 0,
              signupCount: 0,
              conversionCount: 0,
              rewardsEarned: 0,
              monthsEarned: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            mergedList.push(newCodeItem);

            try {
              await adminClient.from('referral_codes').upsert({
                id: newCodeItem.id,
                user_id: newCodeItem.userId,
                workspace_id: newCodeItem.workspaceId,
                code: newCodeItem.code,
              }, { onConflict: 'code' });
            } catch {}
          }
        }
      }
    }

    // 4. Filtering by search
    let filtered = mergedList;
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          (c.workspaceName && c.workspaceName.toLowerCase().includes(q)) ||
          (c.userEmail && c.userEmail.toLowerCase().includes(q))
      );
    }

    // 5. Sorting
    const sortBy = params?.sortBy || 'createdAt';
    const isAsc = params?.sortOrder === 'asc';
    filtered.sort((a, b) => {
      let valA: any = (a as any)[sortBy] ?? a.createdAt;
      let valB: any = (b as any)[sortBy] ?? b.createdAt;
      if (typeof valA === 'string') {
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return isAsc ? (valA - valB) : (valB - valA);
    });

    // 6. Pagination
    const total = filtered.length;
    const from = (page - 1) * pageSize;
    const paginated = filtered.slice(from, from + pageSize);

    return buildPagination(paginated, total, page, pageSize);
  }

  async listReferrals(
    page: number = 1,
    pageSize: number = 20,
    referralCode?: string
  ): Promise<PaginatedResult<ReferralAdminView>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = adminClient
      .from('referrals')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (referralCode) {
      query = query.eq('referral_code', referralCode);
    }

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    // Fetch user emails from auth for referrer and referred user
    const emailMap = new Map<string, string>();
    try {
      const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (usersData?.users && Array.isArray(usersData.users)) {
        for (const u of usersData.users) {
          if (u.id && u.email) {
            emailMap.set(u.id, u.email);
          }
        }
      }
    } catch {}

    const referrals: ReferralAdminView[] = (data || []).map((row: any) => ({
      id: row.id,
      referrerUserId: row.referrer_user_id,
      referrerEmail: emailMap.get(row.referrer_user_id),
      referredUserId: row.referred_user_id,
      referredEmail: emailMap.get(row.referred_user_id),
      referralCode: row.referral_code,
      status: row.status,
      rewardType: row.reward_type || null,
      rewardAppliedAt: row.reward_applied_at || null,
      createdAt: row.created_at,
    }));

    return buildPagination(referrals, count ?? 0, page, pageSize);
  }

  // ===== Mappers =====

  private mapAdminUser(row: { id: string; email: string; role: 'super_admin' | 'admin' | 'support'; permissions: Record<string, unknown>; last_login_at: string | null; created_at: string; updated_at: string }): AdminUser {
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      permissions: row.permissions as Record<string, boolean>,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapPlan(row: { id: string; name: string; description: string | null; price_monthly_usd: number; price_yearly_usd: number; features: Record<string, unknown>; limits: Record<string, unknown>; is_active: boolean; sort_order: number; created_at: string; updated_at: string }): Plan {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      priceMonthlyUsd: row.price_monthly_usd,
      priceYearlyUsd: row.price_yearly_usd,
      features: row.features || {},
      limits: row.limits || {},
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapWorkspace(row: any): WorkspaceAdminView {
    return {
      id: row.id,
      name: row.name,
      ownerId: row.owner_id || row.ownerId || null,
      ownerName: row.owner_name || row.ownerName || null,
      ownerEmail: row.owner_email || row.ownerEmail || null,
      plan: row.plan,
      planStatus: row.plan_status,
      planExpiresAt: row.plan_expires_at,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      trialEndsAt: row.trial_ends_at,
      memberCount: row.member_count || 0,
      postsThisMonth: row.posts_this_month || 0,
      profileCount: row.profile_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapAuditLog = (row: {
    id: string;
    admin_user_id: string;
    action: string;
    target_type: string;
    target_id: string | null;
    metadata: Record<string, unknown>;
    ip_hash: string | null;
    user_agent: string | null;
    created_at: string;
  }): AdminAuditLog => {
    const meta = row.metadata || {};
    const email =
      (meta.userEmail as string | undefined) ||
      (meta.targetEmail as string | undefined) ||
      (meta.email as string | undefined) ||
      null;
    const name =
      (meta.userName as string | undefined) ||
      (meta.name as string | undefined) ||
      null;

    return {
      id: row.id,
      adminUserId: row.admin_user_id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: meta,
      ipHash: row.ip_hash,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      targetUserEmail: email,
      targetUserName: name,
    };
  };

  private mapPaymentOrder(row: any): PaymentOrderAdminView {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      workspaceName: row.workspaces?.name,
      userId: row.user_id,
      cfOrderId: row.cf_order_id,
      planId: row.plan_id,
      billingCycle: row.billing_cycle,
      amountPaise: row.amount_paise,
      currency: row.currency,
      status: row.status,
      cfPaymentId: row.cf_payment_id,
      paymentMethod: row.payment_method,
      paymentSessionId: row.payment_session_id,
      idempotencyKey: row.idempotency_key,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapSubscription(row: any, userInfo?: { email?: string; name?: string } | null): SubscriptionAdminView {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      workspaceName: row.workspaces?.name,
      userId: row.user_id,
      userEmail: userInfo?.email || row.user_email || row.email || undefined,
      userName: userInfo?.name || row.user_name || row.name || undefined,
      cfSubscriptionId: row.cf_subscription_id,
      planId: row.plan_id,
      billingCycle: row.billing_cycle,
      status: row.status,
      amountPaise: row.amount_paise,
      currency: row.currency,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      trialEnd: row.trial_end,
      cancelAtPeriodEnd: row.cancel_at_period_end || false,
      cancelledAt: row.cancelled_at,
      paymentMethod: row.payment_method,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapWebhookEvent(row: { id: string; cf_payment_id: string; order_id: string | null; event_type: string; processed: boolean; raw_payload: Record<string, unknown>; created_at: string }): WebhookEventAdminView {
    return {
      id: row.id,
      cfPaymentId: row.cf_payment_id,
      orderId: row.order_id,
      eventType: row.event_type,
      processed: row.processed,
      rawPayload: row.raw_payload || {},
      createdAt: row.created_at,
    };
  }

  private mapReferralCode(row: any): ReferralCodeAdminView {
    return {
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email || row.userEmail,
      workspaceId: row.workspace_id,
      workspaceName: row.workspaces?.name || row.workspaceName,
      code: row.code,
      clickCount: row.click_count || 0,
      signupCount: row.signup_count || 0,
      conversionCount: row.conversion_count || 0,
      rewardsEarned: row.rewards_earned || 0,
      monthsEarned: row.months_earned || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapReferral(row: any): ReferralAdminView {
    return {
      id: row.id,
      referrerUserId: row.referrer_user_id,
      referrerEmail: row.referrer_email || row.referrerEmail,
      referredUserId: row.referred_user_id,
      referredEmail: row.referred_email || row.referredEmail,
      referralCode: row.referral_code,
      status: row.status,
      rewardType: row.reward_type,
      rewardAppliedAt: row.reward_applied_at,
      createdAt: row.created_at,
    };
  }

  private mapSortColumn(sortBy: string): string {
    const map: Record<string, string> = {
      email: 'email',
      createdAt: 'created_at',
      lastLoginAt: 'last_login_at',
    };
    return map[sortBy] || 'created_at';
  }

  private mapWorkspaceSortColumn(sortBy: string): string {
    const map: Record<string, string> = {
      name: 'name',
      createdAt: 'created_at',
      plan: 'plan',
    };
    return map[sortBy] || 'created_at';
  }

  private mapPaymentSortColumn(sortBy: string): string {
    const map: Record<string, string> = {
      createdAt: 'created_at',
      amount: 'amount_paise',
      status: 'status',
    };
    return map[sortBy] || 'created_at';
  }

  private mapSubscriptionSortColumn(sortBy: string): string {
    const map: Record<string, string> = {
      createdAt: 'created_at',
      amount: 'amount_paise',
      status: 'status',
      currentPeriodEnd: 'current_period_end',
    };
    return map[sortBy] || 'created_at';
  }

  private mapReferralCodeSortColumn(sortBy: string): string {
    const map: Record<string, string> = {
      createdAt: 'created_at',
      signupCount: 'signup_count',
      conversionCount: 'conversion_count',
    };
    return map[sortBy] || 'created_at';
  }
}

// Export singleton instance
export const adminRepository = new SupabaseAdminRepository();
