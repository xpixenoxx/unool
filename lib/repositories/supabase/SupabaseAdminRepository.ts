import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
  AdminAuditLog
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

function applyFilters(query: any, filters: Record<string, any>) {
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key.endsWith('_search')) {
        const column = key.replace('_search', '');
        query = query.ilike(column, `%${value}%`);
      } else {
        query = query.eq(key, value);
      }
    }
  });
  return query;
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
    const { data, error } = await adminClient
      .from('plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapPlan);
  }

  async getPlanById(id: string): Promise<Plan | null> {
    const { data, error } = await adminClient
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapPlan(data);
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

    const { data, error } = await adminClient
      .from('plans')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data ? this.mapPlan(data) : null;
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
      .from('workspace_admin_view')
      .select('*', { count: 'exact' });

    if (params?.search) {
      query = query.ilike('name', `%${params.search}%`);
    }
    if (params?.plan) {
      query = query.eq('plan', params.plan);
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

    return buildPagination(
      (data || []).map(this.mapWorkspace),
      count ?? 0,
      page,
      pageSize
    );
  }

  async getWorkspaceById(id: string): Promise<WorkspaceAdminView | null> {
    const { data, error } = await adminClient
      .from('workspace_admin_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapWorkspace(data);
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
    const linkClicks: Record<string, number> = {};
    const profileViews: Record<string, number> = {};

    events?.forEach((e) => {
      eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1;

      const day = e.created_at.split('T')[0];
      eventsByDay[day] = (eventsByDay[day] || 0) + 1;

      if (e.event_type === 'link_click' && e.event_data?.['url']) {
        const key = `${e.event_data['link_type'] || 'unknown'}:${e.event_data['url']}`;
        linkClicks[key] = (linkClicks[key] || 0) + 1;
      }
      if (e.event_type === 'profile_view' && e.profile_id) {
        profileViews[e.profile_id] = (profileViews[e.profile_id] || 0) + 1;
      }
    });

    // Get workspace/user counts
    const [{ count: totalWorkspaces }, { count: totalUsers }, { count: totalPostsPublished }] = await Promise.all([
      adminClient.from('workspaces').select('id', { count: 'exact', head: true }),
      adminClient.from('profiles').select('id', { count: 'exact', head: true }).limit(1).then(() => adminClient.auth.admin.listUsers()).then(r => ({ count: r.data.users.length })),
      adminClient.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ]);

    return {
      totalProfileViews: eventsByType['profile_view'] || 0,
      totalLinkClicks: eventsByType['link_click'] || 0,
      totalPostsPublished: totalPostsPublished || 0,
      totalWorkspaces: totalWorkspaces || 0,
      totalUsers: totalUsers || 0,
      eventsByType,
      eventsLast30Days: Object.entries(eventsByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
      topLinks: Object.entries(linkClicks)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([key, clicks]) => {
          const [linkType, url] = key.split(':');
          return { linkType, url, clicks };
        }),
      topProfiles: Object.entries(profileViews)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([profileId, views]) => ({ profileId, name: 'Profile', views })),
    };
  }

  async getAnalyticsEvents(workspaceId?: string, eventType?: string, days: number = 30, limit: number = 100): Promise<any[]> {
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
    return (data || []).map(this.mapAuditLog);
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
    const { error } = await adminClient
      .from('admin_audit_log')
      .insert({
        admin_user_id: adminUserId,
        action,
        target_type: targetType,
        target_id: targetId,
        metadata,
        ip_hash: ipHash,
        user_agent: userAgent,
      });

    if (error) throw error;
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

      wm?.forEach((row: any) => {
        const current = workspacesByUser.get(row.user_id) || { count: 0, plans: [] };
        current.count++;
        if (row.workspaces?.plan) current.plans.push(row.workspaces.plan);
        workspacesByUser.set(row.user_id, current);
      });
    }

    const data = (users?.users || []).map((user) => {
      const ws = workspacesByUser.get(user.id) || { count: 0, plans: [] };
      return {
        id: user.id,
        email: user.email || '',
        createdAt: user.created_at,
        workspaceCount: ws.count,
        plan: ws.plans[0] || 'free',
      };
    });

    return buildPagination(data, users?.total || 0, page, pageSize);
  }

  async suspendUser(userId: string, adminUserId: string, reason: string): Promise<boolean> {
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: '876000h', // ~100 years
    });

    if (error) throw error;

    await this.logAdminAction(adminUserId, 'user_suspend', 'user', userId, { reason });
    return true;
  }

  async unsuspendUser(userId: string, adminUserId: string): Promise<boolean> {
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    });

    if (error) throw error;

    await this.logAdminAction(adminUserId, 'user_unsuspend', 'user', userId, {});
    return true;
  }

  // ===== Mappers =====

  private mapAdminUser(row: any): AdminUser {
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      permissions: row.permissions || {},
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapPlan(row: any): Plan {
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

  private mapAuditLog(row: any): AdminAuditLog {
    return {
      id: row.id,
      adminUserId: row.admin_user_id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: row.metadata || {},
      ipHash: row.ip_hash,
      userAgent: row.user_agent,
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
      memberCount: 'member_count',
      postsThisMonth: 'posts_this_month',
    };
    return map[sortBy] || 'created_at';
  }
}

// Export singleton instance
export const adminRepository = new SupabaseAdminRepository();