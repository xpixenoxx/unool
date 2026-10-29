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

// ===== Payment & Subscription Types =====

export interface PaymentOrderAdminView {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  userId: string;
  userEmail?: string;
  cfOrderId: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  amountPaise: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
  cfPaymentId: string | null;
  paymentMethod: string | null;
  paymentSessionId: string | null;
  idempotencyKey: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionAdminView {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  userId: string;
  userEmail?: string;
  cfSubscriptionId: string | null;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  status: 'created' | 'authorized' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';
  amountPaise: number;
  currency: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  paymentMethod: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEventAdminView {
  id: string;
  cfPaymentId: string;
  orderId: string | null;
  eventType: string;
  processed: boolean;
  rawPayload: Record<string, unknown>;
  createdAt: string;
}

export interface ReferralCodeAdminView {
  id: string;
  userId: string;
  userEmail?: string;
  workspaceId: string;
  workspaceName?: string;
  code: string;
  clickCount: number;
  signupCount: number;
  conversionCount: number;
  rewardsEarned: number;
  monthsEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralAdminView {
  id: string;
  referrerUserId: string;
  referrerEmail?: string;
  referredUserId: string;
  referredEmail?: string;
  referralCode: string;
  status: 'signed_up' | 'converted' | 'rewarded';
  rewardType: string | null;
  rewardAppliedAt: string | null;
  createdAt: string;
}

export interface RevenueMetrics {
  totalRevenuePaise: number;
  revenueThisMonthPaise: number;
  revenuePrevMonthPaise: number;
  totalOrders: number;
  paidOrders: number;
  failedOrders: number;
  refundedOrders: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  mrr: number; // Monthly Recurring Revenue in paise
  revenueByPlan: Array<{ planId: string; totalPaise: number; orderCount: number }>;
  revenueLast30Days: Array<{ date: string; totalPaise: number; orderCount: number }>;
}

export interface ListPaymentOrdersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  planId?: string;
  workspaceId?: string;
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface ListSubscriptionsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  planId?: string;
  workspaceId?: string;
  sortBy?: 'createdAt' | 'amount' | 'status' | 'currentPeriodEnd';
  sortOrder?: 'asc' | 'desc';
}

export interface ListReferralCodesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'createdAt' | 'signupCount' | 'conversionCount';
  sortOrder?: 'asc' | 'desc';
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
  getAnalyticsEvents(workspaceId?: string, eventType?: string, days?: number, limit?: number): Promise<Record<string, unknown>[]>;

  // Audit Log
  getAuditLog(adminUserId?: string, limit?: number): Promise<AdminAuditLog[]>;
  logAdminAction(adminUserId: string, action: string, targetType: string, targetId: string | null, metadata: Record<string, unknown>, ipHash?: string, userAgent?: string): Promise<void>;

  // User Management
  getUserById(userId: string): Promise<{ id: string; email: string; createdAt: string } | null>;
  listAllUsers(params?: ListUsersParams): Promise<PaginatedResult<{ id: string; email: string; createdAt: string; workspaceCount: number; plan: string }>>;
  suspendUser(userId: string, adminUserId: string, reason: string): Promise<boolean>;
  unsuspendUser(userId: string, adminUserId: string): Promise<boolean>;

  // Payment Orders
  listPaymentOrders(params?: ListPaymentOrdersParams): Promise<PaginatedResult<PaymentOrderAdminView>>;
  getPaymentOrderById(id: string): Promise<PaymentOrderAdminView | null>;
  updatePaymentOrderStatus(id: string, status: string, adminUserId: string, reason: string): Promise<PaymentOrderAdminView | null>;

  // Subscriptions
  listSubscriptions(params?: ListSubscriptionsParams): Promise<PaginatedResult<SubscriptionAdminView>>;
  getSubscriptionById(id: string): Promise<SubscriptionAdminView | null>;
  adminCancelSubscription(id: string, adminUserId: string, reason: string): Promise<SubscriptionAdminView | null>;
  adminExtendSubscription(id: string, newPeriodEnd: string, adminUserId: string, reason: string): Promise<SubscriptionAdminView | null>;
  adminChangePlan(subscriptionId: string, newPlanId: string, newAmountPaise: number, adminUserId: string, reason: string): Promise<SubscriptionAdminView | null>;

  // Revenue Metrics
  getRevenueMetrics(days?: number): Promise<RevenueMetrics>;

  // Webhook Events
  listWebhookEvents(page?: number, pageSize?: number): Promise<PaginatedResult<WebhookEventAdminView>>;

  // Referral Codes & Referrals
  listReferralCodes(params?: ListReferralCodesParams): Promise<PaginatedResult<ReferralCodeAdminView>>;
  listReferrals(page?: number, pageSize?: number, referralCode?: string): Promise<PaginatedResult<ReferralAdminView>>;
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
  }): Promise<Record<string, unknown>[]>;

  getSummary(params: {
    workspaceId?: string;
    days?: number;
  }): Promise<AnalyticsSummary>;
}
