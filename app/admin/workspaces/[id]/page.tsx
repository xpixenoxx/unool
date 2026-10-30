'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Users,
  CreditCard,
  Share2,
  Trash2,
  ExternalLink,
  Edit,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Box,
  Flex,
  Text,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { MotionBox } from '@/components/ui/motion';
import { SectionGuide } from '@/components/admin/section-guide';

interface WorkspaceMember {
  id: string;
  userId: string;
  email: string;
  role: string;
  createdAt: string;
}

interface WorkspaceSubscription {
  id: string;
  plan_id: string;
  billing_cycle: string;
  status: string;
  amount_paise: number;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface PaymentOrder {
  id: string;
  cf_order_id: string;
  plan_id: string;
  billing_cycle: string;
  amount_paise: number;
  currency: string;
  status: string;
  payment_method: string | null;
  created_at: string;
}

interface PlatformConnection {
  id: string;
  platform: string;
  account_name: string | null;
  created_at: string;
}

interface WorkspaceDetail {
  id: string;
  name: string;
  plan: string;
  planStatus: string;
  planExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  members: WorkspaceMember[];
  subscription: WorkspaceSubscription | null;
  paymentOrders: PaymentOrder[];
  platformConnections: PlatformConnection[];
  totalPosts: number;
}

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

const PLAN_OPTIONS = [
  { id: 'spark', name: 'Spark (Free)' },
  { id: 'creator', name: 'Creator' },
  { id: 'pro', name: 'Pro' },
  { id: 'studio', name: 'Studio' },
];

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.id as string;

  const [workspace, setWorkspace] = React.useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Edit Plan Dialog state
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [newPlan, setNewPlan] = React.useState('');
  const [newStatus, setNewStatus] = React.useState('');
  const [newExpiresAt, setNewExpiresAt] = React.useState('');

  const fetchWorkspace = React.useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}`);
      if (!res.ok) throw new Error('Workspace not found');
      const data = await res.json();
      setWorkspace(data);
      setNewPlan(data.plan || 'spark');
      setNewStatus(data.planStatus || 'active');
      setNewExpiresAt(data.planExpiresAt ? data.planExpiresAt.split('T')[0] : '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspace');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  React.useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const handleUpdatePlan = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: newPlan,
          planStatus: newStatus,
          planExpiresAt: newExpiresAt ? new Date(newExpiresAt).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      setEditDialogOpen(false);
      await fetchWorkspace();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this workspace and all associated data?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/admin/workspaces');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex centerX centerY className="h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Flex>
    );
  }

  if (error || !workspace) {
    return (
      <Card variant="error" className="max-w-xl mx-auto my-12">
        <CardContent className="pt-6 text-center space-y-4">
          <Text size="lg" weight="semibold" color="destructive">
            {error || 'Workspace not found'}
          </Text>
          <Button variant="outline" onClick={() => router.push('/admin/workspaces')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workspaces
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box className="space-y-6">
      {/* Top Bar */}
      <MotionBox variant="fade">
        <Flex between className="items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/workspaces')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workspaces
          </Button>
          <Flex gap={2}>
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Modify Plan & Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={actionLoading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Flex>
        </Flex>
      </MotionBox>

      {/* Header Card */}
      <MotionBox variant="fade" delay={0.05}>
        <Card>
          <CardContent className="pt-6">
            <Flex between className="items-start flex-wrap gap-4">
              <Box>
                <Flex gap={2} className="items-center">
                  <Text size="2xl" weight="bold" color="foreground">
                    {workspace.name}
                  </Text>
                  <Badge variant="outline" className={cn('capitalize text-sm', planBadgeColors[workspace.plan] || '')}>
                    {workspace.plan}
                  </Badge>
                  <Badge
                    className={cn(
                      'capitalize text-xs',
                      workspace.planStatus === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    )}
                  >
                    {workspace.planStatus}
                  </Badge>
                  <SectionGuide
                    title="Workspace Identity & Plan"
                    description="Workspace overview and current subscription entitlements. Modifying the plan directly changes feature quotas (connected platforms, schedule queue depth, and member limits)."
                    example="Plan: Creator (₹799/mo)\nChannels: Up to 3 accounts\nPosts: 60 scheduled posts/mo"
                  />
                </Flex>
                <Text size="xs" color="muted" className="font-mono mt-1">
                  ID: {workspace.id}
                </Text>
              </Box>

              <Flex gap={6} className="text-sm">
                <div>
                  <Text size="xs" color="muted">Created</Text>
                  <Text weight="medium">
                    {new Date(workspace.createdAt).toLocaleDateString()}
                  </Text>
                </div>
                <div>
                  <Text size="xs" color="muted">Plan Expires</Text>
                  <Text weight="medium">
                    {workspace.planExpiresAt
                      ? new Date(workspace.planExpiresAt).toLocaleDateString()
                      : 'Never (Lifetime / Free)'}
                  </Text>
                </div>
                <div>
                  <Text size="xs" color="muted">Members</Text>
                  <Text weight="medium">{workspace.members.length}</Text>
                </div>
                <div>
                  <Text size="xs" color="muted">Posts</Text>
                  <Text weight="medium">{workspace.totalPosts}</Text>
                </div>
              </Flex>
            </Flex>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Tabs */}
      <MotionBox variant="fade" delay={0.1}>
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Members ({workspace.members.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Payments ({workspace.paymentOrders.length})
            </TabsTrigger>
            <TabsTrigger value="platforms" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" /> Platforms ({workspace.platformConnections.length})
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <Flex align="center" gap={2}>
                  <CardTitle>Team Members</CardTitle>
                  <SectionGuide
                    title="Workspace Team"
                    description="Users who have access to this workspace. Roles include OWNER (full billing & management), ADMIN (post & platform management), and MEMBER (content creation)."
                    example="Owner: priya@studio.com\nEditor: rohit@studio.com (joined 12 Oct 2026)"
                  />
                </Flex>
                <CardDescription>Users associated with this workspace</CardDescription>
              </CardHeader>
              <CardContent>
                {workspace.members.length === 0 ? (
                  <Text color="muted" className="py-6 text-center">No members found</Text>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-3 px-2 font-medium text-muted-foreground">User Email</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Role</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Joined</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workspace.members.map((m) => (
                          <tr key={m.id} className="border-b hover:bg-muted/40 transition-colors">
                            <td className="py-3 px-2">
                              <Text weight="medium">{m.email}</Text>
                              <Text size="xs" color="muted" className="font-mono">{m.userId}</Text>
                            </td>
                            <td className="py-3 px-2 capitalize">
                              <Badge variant="outline">{m.role}</Badge>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground text-xs">
                              {new Date(m.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/users/${m.userId}`} prefetch={true}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <Flex align="center" gap={2}>
                  <CardTitle>Payment Orders & Subscription</CardTitle>
                  <SectionGuide
                    title="Workspace Billing History"
                    description="All invoices, payment orders, and active recurring subscriptions linked directly to this workspace."
                    example="Active Subscription: Pro (Annual)\nLast Payment: ₹19,990 (PAID via UPI)"
                  />
                </Flex>
                <CardDescription>Billing history for this workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Active Subscription Box */}
                {workspace.subscription && (
                  <Box className="p-4 rounded-lg border bg-muted/30">
                    <Flex between className="items-center">
                      <Box>
                        <Text size="sm" weight="semibold">Active Subscription</Text>
                        <Text size="xs" color="muted" className="mt-1">
                          Plan: {workspace.subscription.plan_id} · Cycle: {workspace.subscription.billing_cycle}
                        </Text>
                        <Text size="xs" color="muted">
                          Current period ends: {workspace.subscription.current_period_end ? new Date(workspace.subscription.current_period_end).toLocaleDateString() : 'N/A'}
                        </Text>
                      </Box>
                      <Badge className="capitalize">{workspace.subscription.status}</Badge>
                    </Flex>
                  </Box>
                )}

                {workspace.paymentOrders.length === 0 ? (
                  <Text color="muted" className="py-4 text-center">No payment orders found</Text>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-3 px-2 font-medium text-muted-foreground">Order ID</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Plan</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Amount</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Status</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Method</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workspace.paymentOrders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-muted/40 transition-colors">
                            <td className="py-3 px-2 font-mono text-xs">{order.cf_order_id}</td>
                            <td className="py-3 px-2 capitalize">{order.plan_id} ({order.billing_cycle})</td>
                            <td className="py-3 px-2 font-medium">{formatAmount(order.amount_paise, order.currency)}</td>
                            <td className="py-3 px-2">
                              <Badge className="text-xs">{order.status}</Badge>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">{order.payment_method || '—'}</td>
                            <td className="py-3 px-2 text-muted-foreground text-xs">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platforms Tab */}
          <TabsContent value="platforms">
            <Card>
              <CardHeader>
                <Flex align="center" gap={2}>
                  <CardTitle>Connected Platforms</CardTitle>
                  <SectionGuide
                    title="Social Platform Integrations"
                    description="OAuth accounts connected to this workspace for automated publishing (LinkedIn, Twitter/X, Instagram, Facebook, Threads)."
                    example="Platform: linkedin\nAccount: @agency_official\nStatus: Connected"
                  />
                </Flex>
                <CardDescription>Social media accounts linked to this workspace</CardDescription>
              </CardHeader>
              <CardContent>
                {workspace.platformConnections.length === 0 ? (
                  <Text color="muted" className="py-6 text-center">No platform connections found</Text>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {workspace.platformConnections.map((conn) => (
                      <Box key={conn.id} className="p-4 rounded-lg border bg-muted/40">
                        <Flex between className="items-center">
                          <Text weight="medium" className="capitalize">{conn.platform}</Text>
                          <Badge variant="outline">Connected</Badge>
                        </Flex>
                        <Text size="sm" color="muted" className="mt-2 truncate">
                          {conn.account_name || 'Account Linked'}
                        </Text>
                        <Text size="xs" color="muted" className="mt-1">
                          Connected on {new Date(conn.created_at).toLocaleDateString()}
                        </Text>
                      </Box>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </MotionBox>

      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Workspace Plan & Status</DialogTitle>
            <DialogDescription>
              Directly override plan tier, status, or expiration for {workspace.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Tier</label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Expiration Date (optional)</label>
              <Input
                type="date"
                value={newExpiresAt}
                onChange={(e) => setNewExpiresAt(e.target.value)}
              />
              <Text size="xs" color="muted">
                Leave empty for no expiry (or perpetual plan).
              </Text>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
