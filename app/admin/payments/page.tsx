'use client';

import * as React from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, IndianRupee, CreditCard, TrendingUp, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Box, Flex, Text, Card, CardHeader, CardTitle, CardContent, Badge,
  Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea,
} from '@/components/ui';
import { MotionBox, hoverLift } from '@/components/ui/motion';
import { SectionGuide } from '@/components/admin/section-guide';
import { useState, useEffect, useCallback } from 'react';

interface PaymentOrder {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  userId: string;
  cfOrderId: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  amountPaise: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
  cfPaymentId: string | null;
  paymentMethod: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface RevenueMetrics {
  totalRevenuePaise: number;
  revenueThisMonthPaise: number;
  revenuePrevMonthPaise: number;
  totalOrders: number;
  paidOrders: number;
  failedOrders: number;
  refundedOrders: number;
  activeSubscriptions: number;
  mrr: number;
  revenueByPlan: Array<{ planId: string; totalPaise: number; orderCount: number }>;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  REFUNDED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

function formatAmount(paise: number, currency: string = 'INR'): string {
  const amount = paise / 100;
  if (currency === 'INR') return `₹${amount.toLocaleString('en-IN')}`;
  return `$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Status update dialog
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // Detail dialog
  const [detailOrder, setDetailOrder] = useState<PaymentOrder | null>(null);

  const fetchOrders = useCallback(async () => {
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

      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      setOrders(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const res = await fetch('/api/admin/payments/metrics?days=30');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus || !statusReason) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/payments/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: statusReason }),
      });
      if (res.ok) {
        setSelectedOrder(null);
        setNewStatus('');
        setStatusReason('');
        fetchOrders();
        fetchMetrics();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <MotionBox variant="fade">
        <Flex between className="items-center">
          <Box>
            <Flex align="center" gap={2}>
              <Text size="2xl" weight="bold" color="foreground">Payments & Revenue</Text>
              <SectionGuide
                title="Payments Overview"
                description="Live transaction dashboard integrated with Cashfree PG. All amounts are captured in Indian paise (divided by 100 for INR display). Every status change is recorded in the immutable audit log."
                example="Total Revenue: ₹1,48,500\nMRR: ₹45,200 (Active subscriptions)\nPAID orders grant automatic workspace plan upgrades."
              />
            </Flex>
            <Text size="sm" color="muted">Manage Cashfree payment orders, reconcile payments, and audit revenue</Text>
          </Box>
          <Button variant="outline" size="sm" onClick={() => { fetchOrders(); fetchMetrics(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </Flex>
      </MotionBox>

      {/* Revenue Metrics Cards */}
      {!metricsLoading && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MotionBox variant="fade" delay={0.05} {...hoverLift}>
            <Card>
              <CardContent className="pt-6">
                <Flex between className="items-start">
                  <Box>
                    <Flex align="center" gap={1.5}>
                      <Text size="sm" color="muted">Total Revenue</Text>
                      <SectionGuide
                        title="All-Time Revenue"
                        description="Cumulative sum of all settled Cashfree orders with PAID status."
                        example="₹2,45,000 from 182 successful payments"
                      />
                    </Flex>
                    <Text size="2xl" weight="bold" color="foreground">
                      {formatAmount(metrics.totalRevenuePaise)}
                    </Text>
                  </Box>
                  <Box className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                    <IndianRupee className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </Box>
                </Flex>
              </CardContent>
            </Card>
          </MotionBox>

          <MotionBox variant="fade" delay={0.1} {...hoverLift}>
            <Card>
              <CardContent className="pt-6">
                <Flex between className="items-start">
                  <Box>
                    <Flex align="center" gap={1.5}>
                      <Text size="sm" color="muted">This Month</Text>
                      <SectionGuide
                        title="Current Month Revenue"
                        description="Revenue collected from the 1st of the current month to today."
                        example="₹38,400 (vs ₹32,100 previous month)"
                      />
                    </Flex>
                    <Text size="2xl" weight="bold" color="foreground">
                      {formatAmount(metrics.revenueThisMonthPaise)}
                    </Text>
                    {metrics.revenuePrevMonthPaise > 0 && (
                      <Text size="xs" color="muted">
                        vs {formatAmount(metrics.revenuePrevMonthPaise)} last month
                      </Text>
                    )}
                  </Box>
                  <Box className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </Box>
                </Flex>
              </CardContent>
            </Card>
          </MotionBox>

          <MotionBox variant="fade" delay={0.15} {...hoverLift}>
            <Card>
              <CardContent className="pt-6">
                <Flex between className="items-start">
                  <Box>
                    <Flex align="center" gap={1.5}>
                      <Text size="sm" color="muted">MRR</Text>
                      <SectionGuide
                        title="Monthly Recurring Revenue"
                        description="Normalized recurring revenue normalized from active monthly and annualized subscription contracts."
                        example="₹45,200/mo across 42 active recurring subscribers"
                      />
                    </Flex>
                    <Text size="2xl" weight="bold" color="foreground">
                      {formatAmount(metrics.mrr)}
                    </Text>
                    <Text size="xs" color="muted">
                      {metrics.activeSubscriptions} active subs
                    </Text>
                  </Box>
                  <Box className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                    <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </Box>
                </Flex>
              </CardContent>
            </Card>
          </MotionBox>

          <MotionBox variant="fade" delay={0.2} {...hoverLift}>
            <Card>
              <CardContent className="pt-6">
                <Flex between className="items-start">
                  <Box>
                    <Flex align="center" gap={1.5}>
                      <Text size="sm" color="muted">Orders Health</Text>
                      <SectionGuide
                        title="Order Conversion"
                        description="Conversion ratio between attempted orders and successfully completed transactions."
                        example="142 paid / 160 total (12 failed, 6 refunded)"
                      />
                    </Flex>
                    <Text size="2xl" weight="bold" color="foreground">
                      {metrics.paidOrders} / {metrics.totalOrders}
                    </Text>
                    <Text size="xs" color="muted">
                      {metrics.failedOrders} failed · {metrics.refundedOrders} refunded
                    </Text>
                  </Box>
                  <Box className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </Box>
                </Flex>
              </CardContent>
            </Card>
          </MotionBox>
        </div>
      )}

      {/* Filters */}
      <MotionBox variant="fade" delay={0.1}>
        <Card>
          <CardContent className="pt-6">
            <Flex gap={3} className="flex-col sm:flex-row items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID or Cashfree payment ID..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Flex align="center" gap={2} className="w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <SectionGuide
                  title="Payment Statuses"
                  description="PENDING: Customer initiated checkout. PAID: Webhook verified payment. FAILED: Bank/UPI declined. EXPIRED: Session timed out (15 mins). REFUNDED: Returned to source."
                  example="Filter by 'PAID' to see confirmed customer transactions."
                />
              </Flex>
            </Flex>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Orders Table */}
      <MotionBox variant="fade" delay={0.15}>
        <Card>
          <CardHeader>
            <Flex between className="items-center">
              <Flex align="center" gap={2}>
                <CardTitle>Payment Orders</CardTitle>
                <SectionGuide
                  title="Orders Table & Actions"
                  description="Lists every payment session generated through Cashfree PG. Click the Eye icon to view detailed payment method, webhook metadata, and IDs. Click the Refresh icon to manually reconcile or force status updates."
                  example="Order: cf_ord_8f93...\nAmount: ₹499 (Creator Monthly)\nStatus: PAID (UPI - Google Pay)"
                />
              </Flex>
              <Text size="sm" color="muted">{total} total orders</Text>
            </Flex>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Flex centerX centerY className="py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </Flex>
            ) : orders.length === 0 ? (
              <Flex centerX centerY className="py-12">
                <Text color="muted">No payment orders found</Text>
              </Flex>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-2 font-medium text-muted-foreground">Order ID</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Workspace</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Plan</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Amount</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Method</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Date</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2">
                          <Text size="sm" className="font-mono truncate max-w-[120px]" title={order.cfOrderId}>
                            {order.cfOrderId}
                          </Text>
                        </td>
                        <td className="py-3 px-2">
                          <Text size="sm" className="truncate max-w-[140px]">
                            {order.workspaceName || order.workspaceId.slice(0, 8)}
                          </Text>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="capitalize">
                            {order.planId} · {order.billingCycle}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Text size="sm" weight="medium">
                            {formatAmount(order.amountPaise, order.currency)}
                          </Text>
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={cn('text-xs', statusColors[order.status])}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Text size="sm" color="muted">{order.paymentMethod || '—'}</Text>
                        </td>
                        <td className="py-3 px-2">
                          <Text size="xs" color="muted">{formatDate(order.createdAt)}</Text>
                        </td>
                        <td className="py-3 px-2">
                          <Flex gap={1}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDetailOrder(order)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setSelectedOrder(order); setNewStatus(order.status); }}
                              title="Change status"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
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
                <Text size="sm" color="muted">
                  Page {page} of {totalPages}
                </Text>
                <Flex gap={2}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Flex>
              </Flex>
            )}
          </CardContent>
        </Card>
      </MotionBox>

      {/* Status Update Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Status</DialogTitle>
            <DialogDescription>
              Change the status of order {selectedOrder?.cfOrderId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Text size="sm" weight="medium">Current Status</Text>
              <Badge className={cn('text-xs', statusColors[selectedOrder?.status || ''])}>
                {selectedOrder?.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <Text size="sm" weight="medium">New Status</Text>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Text size="sm" weight="medium">Reason *</Text>
              <Textarea
                placeholder="Why are you changing this status? (Required for audit log)"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} disabled={updating || !statusReason}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={(open) => { if (!open) setDetailOrder(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Order Details</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <Text color="muted">Order ID</Text>
                <Text className="font-mono text-xs break-all">{detailOrder.cfOrderId}</Text>

                <Text color="muted">Payment ID</Text>
                <Text className="font-mono text-xs break-all">{detailOrder.cfPaymentId || '—'}</Text>

                <Text color="muted">Workspace</Text>
                <Text>{detailOrder.workspaceName || detailOrder.workspaceId}</Text>

                <Text color="muted">Plan</Text>
                <Text className="capitalize">{detailOrder.planId} ({detailOrder.billingCycle})</Text>

                <Text color="muted">Amount</Text>
                <Text weight="medium">{formatAmount(detailOrder.amountPaise, detailOrder.currency)}</Text>

                <Text color="muted">Status</Text>
                <Badge className={cn('text-xs w-fit', statusColors[detailOrder.status])}>{detailOrder.status}</Badge>

                <Text color="muted">Method</Text>
                <Text>{detailOrder.paymentMethod || '—'}</Text>

                <Text color="muted">Created</Text>
                <Text>{formatDate(detailOrder.createdAt)}</Text>

                <Text color="muted">Updated</Text>
                <Text>{formatDate(detailOrder.updatedAt)}</Text>
              </div>

              {detailOrder.metadata && Object.keys(detailOrder.metadata).length > 0 && (
                <div className="pt-2 border-t">
                  <Text size="sm" weight="medium" className="mb-2">Metadata</Text>
                  <pre className="text-xs bg-muted rounded-lg p-3 overflow-auto max-h-40">
                    {JSON.stringify(detailOrder.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
