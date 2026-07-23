import type { SupabaseClient } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  permissions: Record<string, boolean>;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserWithWorkspace extends AdminUser {
  workspaces: Array<{
    id: string;
    name: string;
    plan: string;
    planStatus: string;
  }>;
}

export interface CreateAdminUserInput {
  email: string;
  role?: 'super_admin' | 'admin' | 'support';
  permissions?: Record<string, boolean>;
}

export interface UpdateAdminUserInput {
  role?: 'super_admin' | 'admin' | 'support';
  permissions?: Record<string, boolean>;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  features: Record<string, unknown>;
  limits: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanInput {
  id: string;
  name: string;
  description?: string;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  features: Record<string, unknown>;
  limits: Record<string, unknown>;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  priceMonthlyUsd?: number;
  priceYearlyUsd?: number;
  features?: Record<string, unknown>;
  limits?: Record<string, unknown>;
  isActive?: boolean;
  sortOrder?: number;
}

export interface WorkspaceAdminView {
  id: string;
  name: string;
  plan: string;
  planStatus: string;
  planExpiresAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
  memberCount: number;
  postsThisMonth: number;
  profileCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListWorkspacesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  plan?: string;
  planStatus?: string;
  sortBy?: 'name' | 'createdAt' | 'plan' | 'memberCount' | 'postsThisMonth';
  sortOrder?: 'asc' | 'desc';
}

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  plan?: string;
  sortBy?: 'email' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AnalyticsSummary {
  totalProfileViews: number;
  totalLinkClicks: number;
  totalPostsPublished: number;
  totalWorkspaces: number;
  totalUsers: number;
  eventsByType: Record<string, number>;
  eventsLast30Days: Array<{ date: string; count: number }>;
  topLinks: Array<{ linkType: string; url: string; clicks: number }>;
  topProfiles: Array<{ profileId: string; name: string; views: number }>;
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ipHash: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface IAdminRepository {
  // Admin Users
  getAdminUserById(id: string): Promise<AdminUser | null>;
  getAdminUserByEmail(email: string): Promise<AdminUser | null>;
  listAdminUsers(params?: ListUsersParams): Promise<PaginatedResult<AdminUser>>;
  createAdminUser(input: CreateAdminUserInput, supabaseAdmin: SupabaseClient): Promise<AdminUser>;
  updateAdminUser(id: string, input: UpdateAdminUserInput): Promise<AdminUser | null>;
  deleteAdminUser(id: string): Promise<boolean>;

  // Plans
  listPlans(): Promise<Plan[]>;
  getPlanById(id: string): Promise<Plan | null>;
  createPlan(input: CreatePlanInput): Promise<Plan>;
  updatePlan(id: string, input: UpdatePlanInput): Promise<Plan | null>;
  deletePlan(id: string): Promise<boolean>;

  // Workspaces (admin view)
  listWorkspaces(params?: ListWorkspacesParams): Promise<PaginatedResult<WorkspaceAdminView>>;
  getWorkspaceById(id: string): Promise<WorkspaceAdminView | null>;
  updateWorkspacePlan(workspaceId: string, plan: string, adminUserId: string): Promise<WorkspaceAdminView | null>;
  updateWorkspacePlanStatus(workspaceId: string, status: string, adminUserId: string): Promise<WorkspaceAdminView | null>;

  // Analytics
  getAnalyticsSummary(workspaceId?: string, days?: number): Promise<AnalyticsSummary>;
  getAnalyticsEvents(workspaceId?: string, eventType?: string, days?: number, limit?: number): Promise<any[]>;

  // Audit Log
  getAuditLog(adminUserId?: string, limit?: number): Promise<AdminAuditLog[]>;
  logAdminAction(adminUserId: string, action: string, targetType: string, targetId: string | null, metadata: Record<string, unknown>, ipHash?: string, userAgent?: string): Promise<void>;

  // User Impersonation / Management
  getUserById(userId: string): Promise<{ id: string; email: string; createdAt: string } | null>;
  listAllUsers(params?: ListUsersParams): Promise<PaginatedResult<{ id: string; email: string; createdAt: string; workspaceCount: number; plan: string }>>;
  suspendUser(userId: string, adminUserId: string, reason: string): Promise<boolean>;
  unsuspendUser(userId: string, adminUserId: string): Promise<boolean>;
}

export interface IAnalyticsRepository {
  trackEvent(event: {
    workspaceId: string;
    userId?: string;
    profileId?: string;
    eventType: 'profile_view' | 'link_click' | 'post_publish' | 'post_view' | 'profile_cta_click' | 'subdomain_claim';
    eventData?: Record<string, unknown>;
    referrer?: string;
    userAgent?: string;
    ipHash?: string;
    sessionId?: string;
  }): Promise<void>;

  getEvents(params: {
    workspaceId?: string;
    profileId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<any[]>;

  getSummary(params: {
    workspaceId?: string;
    days?: number;
  }): Promise<AnalyticsSummary>;
}