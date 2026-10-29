'use client';

import * as React from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, RefreshCw, Eye, XCircle, CalendarPlus, ArrowUpDown } from 'lucide-react';
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

interface Subscription {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  userId: string;
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

      const res = await fetch(`/api/admin/subscriptions?${params}`);
      const data = await res.json();
      setSubscriptions(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

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

      {/* Filters */}
      <MotionBox variant="fade" delay={0.05}>
        <Card>
          <CardContent className="pt-6">
            <Flex gap={3} className="flex-col sm:flex-row items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by subscription ID, workspace, or plan..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Flex align="center" gap={2} className="w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[180px]">
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
              <Text size="sm" color="muted">{total} total</Text>
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
                      <th className="py-3 px-2 font-medium text-muted-foreground">Workspace</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Plan</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Amount</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Period End</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Created</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2">
                          <Text size="sm" className="truncate max-w-[160px]" title={sub.workspaceName || sub.workspaceId}>
                            {sub.workspaceName || sub.workspaceId.slice(0, 8)}
                          </Text>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className={cn('capitalize', planBadgeColors[sub.planId] || '')}>
                            {sub.planId} · {sub.billingCycle}
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
                    ))}
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
                <Text color="muted">Workspace</Text>
                <Text>{actionSub.workspaceName || actionSub.workspaceId}</Text>

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
              Cancel the subscription for {actionSub?.workspaceName || 'this workspace'}. This will immediately set the status to cancelled.
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
