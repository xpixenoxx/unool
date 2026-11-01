'use client';

import * as React from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, RefreshCw, Eye, XCircle, CalendarPlus, ArrowUpDown, Layers, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Box, Flex, Text, Card, CardHeader, CardTitle, CardContent, Badge,
  Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea,
} from '@/components/ui';
import { MotionBox } from '@/components/ui/motion';
import { SectionGuide } from '@/components/admin/section-guide';
import { useState, useEffect, useCallback } from 'react';

interface PlanSummaryItem {
  planId: string;
  planName: string;
  total: number;
  active: number;
  cancelled: number;
  pastDue: number;
  paused: number;
  otherStatus: number;
  monthly: number;
  annual: number;
  totalRevenuePaise: number;
}

interface SubscriptionStats {
  totalSubscriptions: number;
  totalActive: number;
  totalCancelled: number;
  totalPastDue: number;
  totalMonthly: number;
  totalAnnual: number;
  byPlan: PlanSummaryItem[];
}

interface Subscription {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  cfSubscriptionId: string | null;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  status: string;
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

const statusColors: Record<string, string> = {
  created: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  authorized: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  past_due: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500',
};

const planBadgeColors: Record<string, string> = {
  spark: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  creator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  studio: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function formatAmount(paise: number, currency: string = 'INR'): string {
  const amount = paise / 100;
  if (currency === 'INR') return `₹${amount.toLocaleString('en-IN')}`;
  return `$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const PLAN_OPTIONS = [
  { id: 'spark', name: 'Spark (Free)', amountPaise: 0 },
  { id: 'creator', name: 'Creator', amountPaise: 79900 },
  { id: 'pro', name: 'Pro', amountPaise: 199900 },
  { id: 'studio', name: 'Studio', amountPaise: 499900 },
];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Action dialogs
  const [actionSub, setActionSub] = useState<Subscription | null>(null);
  const [actionType, setActionType] = useState<'cancel' | 'extend' | 'change_plan' | 'view' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [newPeriodEnd, setNewPeriodEnd] = useState('');
  const [newPlanId, setNewPlanId] = useState('');
  const [newAmountPaise, setNewAmountPaise] = useState(0);
  const [updating, setUpdating] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (planFilter !== 'all') params.set('planId', planFilter);

      const res = await fetch(`/api/admin/subscriptions?${params}`);
      const data = await res.json();
      setSubscriptions(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, planFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const openAction = (sub: Subscription, type: 'cancel' | 'extend' | 'change_plan' | 'view') => {
    setActionSub(sub);
    setActionType(type);
    setActionReason('');
    setNewPeriodEnd('');
    setNewPlanId(sub.planId);
    const planOption = PLAN_OPTIONS.find(p => p.id === sub.planId);
    setNewAmountPaise(planOption?.amountPaise ?? sub.amountPaise);
  };

  const handleAction = async () => {
    if (!actionSub || !actionType || actionType === 'view') return;
    if (!actionReason) return;
    setUpdating(true);
    try {
      const body: Record<string, unknown> = {
        action: actionType,
        reason: actionReason,
      };
      if (actionType === 'extend') body.newPeriodEnd = newPeriodEnd;
      if (actionType === 'change_plan') {
        body.newPlanId = newPlanId;
        body.newAmountPaise = newAmountPaise;
      }

      const res = await fetch(`/api/admin/subscriptions/${actionSub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        closeDialog();
        fetchSubscriptions();
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setUpdating(false);
    }
  };

  const closeDialog = () => {
    setActionSub(null);
    setActionType(null);
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <MotionBox variant="fade">
        <Flex between className="items-center">
          <Box>
            <Flex align="center" gap={2}>
              <Text size="2xl" weight="bold" color="foreground">Subscriptions</Text>
              <SectionGuide
                title="Subscriptions Management"
                description="Controls workspace billing contracts and recurring access limits. Admins can extend subscription periods as goodwill gestures, upgrade/downgrade plan tiers immediately, or cancel subscriptions on demand."
                example="Active subscription: Creator (Monthly)\nCurrent Period End: 15 Nov 2026\nAction: Extend to 30 Nov 2026 without charging customer."
              />
            </Flex>
            <Text size="sm" color="muted">Manage user subscriptions — cancel, extend, or change plans</Text>
          </Box>
          <Button variant="outline" size="sm" onClick={fetchSubscriptions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </Flex>
      </MotionBox>

      {/* Subscription Plans Breakdown */}
      <MotionBox variant="fade" delay={0.03}>
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <Flex between className="items-center flex-wrap gap-2">
              <Flex align="center" gap={2}>
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Subscription Plans Breakdown
                  </CardTitle>
                  <Text size="xs" color="muted">
                    Subscribers, active vs. cancelled status, and monthly vs. annual billing per plan
                  </Text>
                </div>
                <SectionGuide
                  title="Subscription Plans Breakdown"
                  description="Real-time aggregation across all workspace subscriptions in database. Click any plan card to filter the table below."
                  example="Studio: Total: 5 | Active: 5, Cancelled: 0 | Monthly: 3, Annually: 2"
                />
              </Flex>

              {planFilter !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setPlanFilter('all'); setPage(1); }}
                  className="text-xs h-7 px-2.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                >
                  <Filter className="h-3 w-3 mr-1.5" />
                  Clear Filter (Filtering: {stats?.byPlan.find(p => p.planId === planFilter)?.planName || planFilter})
                </Button>
              )}
            </Flex>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Top Aggregate Summary KPI Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div className="rounded-lg border bg-card p-3 shadow-none">
                <Text size="xs" color="muted" weight="medium">Total Subscriptions</Text>
                <Text size="xl" weight="bold" className="mt-0.5 text-foreground">
                  {stats?.totalSubscriptions ?? total}
                </Text>
              </div>
              <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 p-3">
                <Text size="xs" className="text-emerald-700 dark:text-emerald-400" weight="medium">Total Active</Text>
                <Text size="xl" weight="bold" className="mt-0.5 text-emerald-700 dark:text-emerald-300">
                  {stats?.totalActive ?? 0}
                </Text>
              </div>
              <div className="rounded-lg border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40 p-3">
                <Text size="xs" className="text-rose-700 dark:text-rose-400" weight="medium">Total Cancelled</Text>
                <Text size="xl" weight="bold" className="mt-0.5 text-rose-700 dark:text-rose-300">
                  {stats?.totalCancelled ?? 0}
                </Text>
              </div>
              <div className="rounded-lg border bg-sky-50/50 dark:bg-sky-950/20 border-sky-200/60 dark:border-sky-900/40 p-3">
                <Text size="xs" className="text-sky-700 dark:text-sky-400" weight="medium">Total Monthly</Text>
                <Text size="xl" weight="bold" className="mt-0.5 text-sky-700 dark:text-sky-300">
                  {stats?.totalMonthly ?? 0}
                </Text>
              </div>
              <div className="rounded-lg border bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/40 p-3">
                <Text size="xs" className="text-purple-700 dark:text-purple-400" weight="medium">Total Annual</Text>
                <Text size="xl" weight="bold" className="mt-0.5 text-purple-700 dark:text-purple-300">
                  {stats?.totalAnnual ?? 0}
                </Text>
              </div>
            </div>

            {/* Individual Plan Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(stats?.byPlan || [
                { planId: 'spark', planName: 'Spark (Free)', total: 0, active: 0, cancelled: 0, pastDue: 0, paused: 0, otherStatus: 0, monthly: 0, annual: 0, totalRevenuePaise: 0 },
                { planId: 'creator', planName: 'Creator', total: 0, active: 0, cancelled: 0, pastDue: 0, paused: 0, otherStatus: 0, monthly: 0, annual: 0, totalRevenuePaise: 0 },
                { planId: 'pro', planName: 'Pro', total: 0, active: 0, cancelled: 0, pastDue: 0, paused: 0, otherStatus: 0, monthly: 0, annual: 0, totalRevenuePaise: 0 },
                { planId: 'studio', planName: 'Studio', total: 0, active: 0, cancelled: 0, pastDue: 0, paused: 0, otherStatus: 0, monthly: 0, annual: 0, totalRevenuePaise: 0 },
              ]).map((plan) => {
                const isSelected = planFilter === plan.planId;
                const tierBorder =
                  plan.planId === 'studio'
                    ? 'border-amber-300/80 dark:border-amber-700/60 hover:border-amber-500'
                    : plan.planId === 'pro'
                    ? 'border-purple-300/80 dark:border-purple-700/60 hover:border-purple-500'
                    : plan.planId === 'creator'
                    ? 'border-blue-300/80 dark:border-blue-700/60 hover:border-blue-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400';

                return (
                  <div
                    key={plan.planId}
                    onClick={() => {
                      setPlanFilter((prev) => (prev === plan.planId ? 'all' : plan.planId));
                      setPage(1);
                    }}
                    className={cn(
                      'group rounded-xl border p-4 cursor-pointer transition-all bg-card hover:shadow-md select-none flex flex-col justify-between',
                      tierBorder,
                      isSelected && 'ring-2 ring-indigo-500 border-indigo-500 dark:border-indigo-400 bg-indigo-50/15 dark:bg-indigo-950/20 shadow-sm'
                    )}
                  >
                    <div>
                      {/* Top row: Plan Name Badge & Total count */}
                      <Flex between className="items-start mb-3">
                        <div>
                          <Badge
                            variant="outline"
                            className={cn('text-xs capitalize font-semibold px-2.5 py-0.5', planBadgeColors[plan.planId] || '')}
                          >
                            {plan.planName}
                          </Badge>
                          <Text size="xs" color="muted" className="mt-1 block text-[11px]">
                            {isSelected ? '✓ Filter active' : 'Click to filter'}
                          </Text>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">Total</span>
                          <span className="text-2xl font-bold tracking-tight text-foreground">{plan.total}</span>
                        </div>
                      </Flex>

                      {/* Status row: Active / Cancelled */}
                      <div className="space-y-2 pt-2.5 border-t border-border/70">
                        <div>
                          <Text size="xs" color="muted" className="text-[11px] font-medium mb-1 block">
                            Status:
                          </Text>
                          <Flex gap={1.5} wrap className="text-xs">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              active: <strong className="font-semibold">{plan.active}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              cancelled: <strong className="font-semibold">{plan.cancelled}</strong>
                            </span>
                            {plan.pastDue > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                                past due: <strong className="font-semibold">{plan.pastDue}</strong>
                              </span>
                            )}
                          </Flex>
                        </div>

                        {/* Billing cycle: Monthly / Annually */}
                        <div>
                          <Text size="xs" color="muted" className="text-[11px] font-medium mb-1 block">
                            Billing Cycle:
                          </Text>
                          <Flex gap={1.5} wrap className="text-xs">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40">
                              monthly: <strong className="font-semibold">{plan.monthly}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                              annually: <strong className="font-semibold">{plan.annual}</strong>
                            </span>
                          </Flex>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Filters */}
      <MotionBox variant="fade" delay={0.05}>
        <Card>
          <CardContent className="pt-6">
            <Flex gap={3} className="flex-col sm:flex-row items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user email, name, user ID, subscription ID, or plan..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Flex align="center" gap={2} className="w-full sm:w-auto flex-wrap">
                <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="spark">Spark (Free)</SelectItem>
                    <SelectItem value="creator">Creator</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    {stats?.byPlan
                      .filter(p => !['spark', 'free', 'creator', 'pro', 'studio'].includes(p.planId))
                      .map(p => (
                        <SelectItem key={p.planId} value={p.planId}>
                          {p.planName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="authorized">Authorized</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <SectionGuide
                  title="Subscription Lifecycle"
                  description="ACTIVE: Currently recurring & features unlocked. PAST_DUE: Payment failed, grace period active. PAUSED: Customer voluntarily frozen. CANCELLED: Terminated, falls back to Spark free tier."
                  example="Filter by 'past_due' to identify accounts at risk of churning."
                />
              </Flex>
            </Flex>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Subscriptions Table */}
      <MotionBox variant="fade" delay={0.1}>
        <Card>
          <CardHeader>
            <Flex between className="items-center">
              <Flex align="center" gap={2}>
                <CardTitle>All Subscriptions</CardTitle>
                <SectionGuide
                  title="Row Actions"
                  description="Eye: View full subscription metadata and cycle dates.\nCalendar+: Extend period end date by N days (goodwill credit).\nArrows: Change plan tier (immediate entitlement adjust).\nX: Cancel subscription immediately."
                  example="Click Calendar+ to extend an active subscriber's billing date by 14 days."
                />
              </Flex>
              <Flex align="center" gap={2}>
                <Text size="sm" color="muted">
                  {total} total
                  {planFilter !== 'all' ? ` · Plan: ${stats?.byPlan.find(p => p.planId === planFilter)?.planName || planFilter}` : ''}
                  {statusFilter !== 'all' ? ` · Status: ${statusFilter}` : ''}
                </Text>
                {(planFilter !== 'all' || statusFilter !== 'all' || search) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setPlanFilter('all');
                      setStatusFilter('all');
                      setSearch('');
                      setPage(1);
                    }}
                  >
                    Reset filters
                  </Button>
                )}
              </Flex>
            </Flex>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Flex centerX centerY className="py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </Flex>
            ) : subscriptions.length === 0 ? (
              <Flex centerX centerY className="py-12">
                <Text color="muted">No subscriptions found</Text>
              </Flex>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-3 font-medium text-muted-foreground">User / Customer</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground">Workspace</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Plan</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Amount</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Period End</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Created</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => {
                      const displayName = sub.userName || (sub.userEmail ? sub.userEmail.split('@')[0] : 'User');
                      const email = sub.userEmail || '';
                      const initial = (sub.userName || sub.userEmail || 'U').charAt(0).toUpperCase();

                      return (
                        <tr key={sub.id} className="border-b hover:bg-muted/50 transition-colors">
                          {/* User / Customer: Real Name, Email, and User ID */}
                          <td className="py-3 px-3">
                            <Flex align="center" gap={2.5} className="min-w-0 max-w-[260px]">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-sm">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <Text size="sm" weight="semibold" className="truncate text-foreground block">
                                  {displayName}
                                </Text>
                                {email ? (
                                  <Text size="xs" color="muted" className="truncate block font-mono text-[11px]" title={email}>
                                    {email}
                                  </Text>
                                ) : null}
                                <Text size="xs" color="muted" className="truncate block font-mono text-[10px] text-muted-foreground/75" title={`User ID: ${sub.userId}`}>
                                  ID: {sub.userId ? `${sub.userId.slice(0, 8)}...` : '—'}
                                </Text>
                              </div>
                            </Flex>
                          </td>

                          {/* Workspace: Name & Workspace ID */}
                          <td className="py-3 px-3">
                            <div className="min-w-0 max-w-[150px]">
                              <Text size="sm" weight="medium" className="truncate text-foreground block" title={sub.workspaceName || sub.workspaceId}>
                                {sub.workspaceName || 'My Workspace'}
                              </Text>
                              <Text size="xs" color="muted" className="font-mono text-[10px] text-muted-foreground/75 truncate block" title={`Workspace ID: ${sub.workspaceId}`}>
                                {sub.workspaceId ? `${sub.workspaceId.slice(0, 8)}...` : '—'}
                              </Text>
                            </div>
                          </td>

                          <td className="py-3 px-2">
                            <Badge variant="outline" className={cn('capitalize', planBadgeColors[sub.planId] || '')}>
                              {(sub.planId === 'free' || sub.planId === 'spark' ? 'Spark (Free)' : sub.planId)} · {sub.billingCycle}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <Text size="sm" weight="medium">
                              {formatAmount(sub.amountPaise, sub.currency)}
                            </Text>
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={cn('text-xs', statusColors[sub.status] || '')}>
                              {sub.status.replace('_', ' ')}
                            </Badge>
                            {sub.cancelAtPeriodEnd && (
                              <Text size="xs" color="muted" className="mt-1 block">cancels at end</Text>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <Text size="xs" color="muted">{formatDate(sub.currentPeriodEnd)}</Text>
                          </td>
                          <td className="py-3 px-2">
                            <Text size="xs" color="muted">{formatDate(sub.createdAt)}</Text>
                          </td>
                          <td className="py-3 px-2">
                            <Flex gap={1}>
                              <Button variant="ghost" size="icon" onClick={() => openAction(sub, 'view')} title="View details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {sub.status === 'active' && (
                                <>
                                  <Button variant="ghost" size="icon" onClick={() => openAction(sub, 'extend')} title="Extend subscription">
                                    <CalendarPlus className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => openAction(sub, 'change_plan')} title="Change plan">
                                    <ArrowUpDown className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => openAction(sub, 'cancel')} title="Cancel subscription" className="text-destructive hover:text-destructive">
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </Flex>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Flex between className="items-center mt-4 pt-4 border-t">
                <Text size="sm" color="muted">Page {page} of {totalPages}</Text>
                <Flex gap={2}>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Flex>
              </Flex>
            )}
          </CardContent>
        </Card>
      </MotionBox>

      {/* View Detail Dialog */}
      <Dialog open={actionType === 'view' && !!actionSub} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {actionSub && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <Text color="muted">Customer Name</Text>
                <Text weight="medium">{actionSub.userName || '—'}</Text>

                <Text color="muted">Customer Email</Text>
                <Text className="font-mono text-xs">{actionSub.userEmail || '—'}</Text>

                <Text color="muted">User ID</Text>
                <Text className="font-mono text-xs break-all">{actionSub.userId}</Text>

                <Text color="muted">Workspace</Text>
                <Text>{actionSub.workspaceName || 'My Workspace'}</Text>

                <Text color="muted">Workspace ID</Text>
                <Text className="font-mono text-xs break-all">{actionSub.workspaceId}</Text>

                <Text color="muted">CF Subscription ID</Text>
                <Text className="font-mono text-xs break-all">{actionSub.cfSubscriptionId || '—'}</Text>

                <Text color="muted">Plan</Text>
                <Text className="capitalize">{actionSub.planId} ({actionSub.billingCycle})</Text>

                <Text color="muted">Amount</Text>
                <Text weight="medium">{formatAmount(actionSub.amountPaise, actionSub.currency)}</Text>

                <Text color="muted">Status</Text>
                <Badge className={cn('text-xs w-fit', statusColors[actionSub.status])}>{actionSub.status}</Badge>

                <Text color="muted">Period Start</Text>
                <Text>{formatDate(actionSub.currentPeriodStart)}</Text>

                <Text color="muted">Period End</Text>
                <Text>{formatDate(actionSub.currentPeriodEnd)}</Text>

                <Text color="muted">Trial End</Text>
                <Text>{formatDate(actionSub.trialEnd)}</Text>

                <Text color="muted">Cancel at Period End</Text>
                <Text>{actionSub.cancelAtPeriodEnd ? 'Yes' : 'No'}</Text>

                <Text color="muted">Cancelled At</Text>
                <Text>{formatDate(actionSub.cancelledAt)}</Text>

                <Text color="muted">Payment Method</Text>
                <Text>{actionSub.paymentMethod || '—'}</Text>

                <Text color="muted">Created</Text>
                <Text>{formatDate(actionSub.createdAt)}</Text>
              </div>

              {actionSub.metadata && Object.keys(actionSub.metadata).length > 0 && (
                <div className="pt-2 border-t">
                  <Text size="sm" weight="medium" className="mb-2">Metadata</Text>
                  <pre className="text-xs bg-muted rounded-lg p-3 overflow-auto max-h-40">
                    {JSON.stringify(actionSub.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={actionType === 'cancel' && !!actionSub} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Cancel the subscription for {actionSub?.userName || actionSub?.userEmail || actionSub?.workspaceName || 'this customer'}. This will immediately set the status to cancelled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Text size="sm" weight="medium">Reason *</Text>
              <Textarea
                placeholder="Why are you cancelling this subscription? (Logged to audit)"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Back</Button>
            <Button variant="destructive" onClick={handleAction} disabled={updating || !actionReason}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={actionType === 'extend' && !!actionSub} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
            <DialogDescription>
              Extend the billing period for {actionSub?.workspaceName || 'this workspace'}.
              Current period ends: {formatDate(actionSub?.currentPeriodEnd || null)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Text size="sm" weight="medium">New Period End Date *</Text>
              <Input
                type="date"
                value={newPeriodEnd}
                onChange={(e) => setNewPeriodEnd(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Text size="sm" weight="medium">Reason *</Text>
              <Textarea
                placeholder="Why are you extending this subscription? (e.g. Customer support goodwill)"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleAction} disabled={updating || !actionReason || !newPeriodEnd}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Extend Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={actionType === 'change_plan' && !!actionSub} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Change the plan for {actionSub?.workspaceName || 'this workspace'}.
              Current plan: {actionSub?.planId} ({formatAmount(actionSub?.amountPaise || 0)})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Text size="sm" weight="medium">New Plan *</Text>
              <Select
                value={newPlanId}
                onValueChange={(v) => {
                  setNewPlanId(v);
                  const opt = PLAN_OPTIONS.find(p => p.id === v);
                  if (opt) setNewAmountPaise(opt.amountPaise);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {formatAmount(p.amountPaise)}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Text size="sm" weight="medium">Amount (paise)</Text>
              <Input
                type="number"
                value={newAmountPaise}
                onChange={(e) => setNewAmountPaise(parseInt(e.target.value) || 0)}
              />
              <Text size="xs" color="muted">
                = {formatAmount(newAmountPaise)} — Override if needed (e.g. custom discount)
              </Text>
            </div>
            <div className="space-y-2">
              <Text size="sm" weight="medium">Reason *</Text>
              <Textarea
                placeholder="Why are you changing this plan?"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleAction} disabled={updating || !actionReason || !newPlanId}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Change Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
