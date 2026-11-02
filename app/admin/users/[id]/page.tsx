'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Building2,
  CreditCard,
  Gift,
  Ban,
  UserCheck,
  Trash2,
  ExternalLink,
} from 'lucide-react';

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
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui';
import { MotionBox } from '@/components/ui/motion';
import { SectionGuide } from '@/components/admin/section-guide';
import { ActionReasonDialog } from '@/components/admin/action-reason-dialog';
import { cn } from '@/lib/utils';

interface UserWorkspace {
  id: string;
  name: string;
  plan: string;
  plan_status: string;
  role: string;
  joinedAt: string;
  created_at: string;
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

interface ReferralCode {
  code: string;
  click_count: number;
  signup_count: number;
  conversion_count: number;
  rewards_earned: number;
  months_earned: number;
}

interface ReferredUser {
  id: string;
  referredUserId: string;
  referredEmail: string | null;
  referredName: string | null;
  referralCode: string;
  status: 'signed_up' | 'converted' | 'rewarded';
  currentPlan: string;
  planStatus: string;
  isPaid: boolean;
  rewardType: string | null;
  rewardAppliedAt: string | null;
  createdAt: string;
}

interface UserDetail {
  id: string;
  email: string;
  phone: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  isSuspended: boolean;
  bannedUntil: string | null;
  userMetadata: Record<string, unknown>;
  workspaces: UserWorkspace[];
  paymentOrders: PaymentOrder[];
  referralCode: ReferralCode | null;
  referrals?: ReferredUser[];
}

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

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [user, setUser] = React.useState<UserDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actionDialog, setActionDialog] = React.useState<{
    isOpen: boolean;
    actionType: 'suspend' | 'delete';
  }>({
    isOpen: false,
    actionType: 'suspend',
  });

  const fetchUser = React.useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error('User not found');
      const data = await res.json();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleUnsuspend = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/unsuspend`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Unsuspend failed');
      await fetchUser();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDialogConfirm = async (reason: string, durationHours?: number | null) => {
    if (!user) return;
    if (actionDialog.actionType === 'suspend') {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, durationHours }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to suspend user');
      }
      await fetchUser();
    } else {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete user');
      }
      router.push('/admin/users');
    }
  };

  if (loading) {
    return (
      <Flex centerX centerY className="h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Flex>
    );
  }

  if (error || !user) {
    return (
      <Card variant="error" className="max-w-xl mx-auto my-12">
        <CardContent className="pt-6 text-center space-y-4">
          <Text size="lg" weight="semibold" color="destructive">
            {error || 'User not found'}
          </Text>
          <Button variant="outline" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
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
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
          <Flex gap={2}>
            {user.isSuspended ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnsuspend}
                disabled={actionLoading}
              >
                <UserCheck className="mr-2 h-4 w-4 text-green-500" /> Unsuspend User
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setActionDialog({ isOpen: true, actionType: 'suspend' })}
                disabled={actionLoading}
              >
                <Ban className="mr-2 h-4 w-4" /> Suspend User
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionDialog({ isOpen: true, actionType: 'delete' })}
              disabled={actionLoading}
              className="text-destructive hover:text-destructive"
              title="Delete account (move to recovery)"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </Flex>
        </Flex>
      </MotionBox>

      {/* Header Profile Card */}
      <MotionBox variant="fade" delay={0.05}>
        <Card>
          <CardContent className="pt-6">
            <Flex between className="items-start flex-wrap gap-4">
              <Flex gap={4} className="items-center">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`}
                    alt={user.email}
                  />
                  <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Box>
                  <Flex gap={2} className="items-center">
                    <Text size="xl" weight="bold" color="foreground">
                      {user.email}
                    </Text>
                    {user.isSuspended ? (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="destructive">Suspended</Badge>
                        {user.bannedUntil && new Date(user.bannedUntil).getFullYear() < 2090 && (
                          <Badge variant="outline" className="text-zinc-600 dark:text-zinc-400 font-normal text-xs">
                            until {new Date(user.bannedUntil).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </Badge>
                    )}
                    <SectionGuide
                      title="User Identity & Status"
                      description="User account profile directly sourced from Supabase Auth auth.users table. Suspending sets a temporary 24-hour ban until timestamp, preventing password or magic link sign-ins."
                      example="Status: Active\nWorkspaces: 2\nLast sign-in: 28 Oct 2026"
                    />
                  </Flex>
                  <Text size="xs" color="muted" className="font-mono mt-1">
                    ID: {user.id}
                  </Text>
                </Box>
              </Flex>

              <Flex gap={6} className="text-sm">
                <div>
                  <Text size="xs" color="muted">Joined</Text>
                  <Text weight="medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                </div>
                <div>
                  <Text size="xs" color="muted">Last Sign In</Text>
                  <Text weight="medium">
                    {user.lastSignInAt
                      ? new Date(user.lastSignInAt).toLocaleDateString()
                      : 'Never'}
                  </Text>
                </div>
                <div>
                  <Text size="xs" color="muted">Workspaces</Text>
                  <Text weight="medium">{user.workspaces.length}</Text>
                </div>
              </Flex>
            </Flex>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Tabs */}
      <MotionBox variant="fade" delay={0.1}>
        <Tabs defaultValue="workspaces" className="space-y-4">
          <TabsList>
            <TabsTrigger value="workspaces" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Workspaces ({user.workspaces.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Payments ({user.paymentOrders.length})
            </TabsTrigger>
            <TabsTrigger value="referral" className="flex items-center gap-2">
              <Gift className="h-4 w-4" /> Referral ({user.referrals?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces">
            <Card>
              <CardHeader>
                <Flex align="center" gap={2}>
                  <CardTitle>Workspaces</CardTitle>
                  <SectionGuide
                    title="User Workspaces"
                    description="Workspaces where this user has membership (as owner, admin, or member). Click the link icon on the right to navigate directly to the workspace administration view."
                    example="Workspace: Pixel Studios\nRole: Owner\nPlan: Creator (Active)"
                  />
                </Flex>
                <CardDescription>Workspaces where this user has membership</CardDescription>
              </CardHeader>
              <CardContent>
                {user.workspaces.length === 0 ? (
                  <Text color="muted" className="py-6 text-center">No workspaces found</Text>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-3 px-2 font-medium text-muted-foreground">Workspace Name</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Role</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Plan</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Status</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Joined</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.workspaces.map((ws) => (
                          <tr key={ws.id} className="border-b hover:bg-muted/40 transition-colors">
                            <td className="py-3 px-2 font-medium">{ws.name}</td>
                            <td className="py-3 px-2 capitalize">{ws.role}</td>
                            <td className="py-3 px-2">
                              <Badge variant="outline" className={cn('capitalize', planBadgeColors[ws.plan] || '')}>
                                {(ws.plan === 'free' || ws.plan === 'spark') ? 'Spark (Free)' : (ws.plan || 'Spark (Free)')}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">
                              <Badge className="capitalize">{ws.plan_status || 'active'}</Badge>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground text-xs">
                              {new Date(ws.joinedAt || ws.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/workspaces/${ws.id}`} prefetch={true}>
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
                  <CardTitle>Payment History</CardTitle>
                  <SectionGuide
                    title="User Payments"
                    description="Individual checkout sessions initiated by this user across all their workspaces."
                    example="cf_ord_901a...\nPlan: Pro (Annual)\nAmount: ₹19,990 (Paid via Credit Card)"
                  />
                </Flex>
                <CardDescription>Recent payment orders for this user</CardDescription>
              </CardHeader>
              <CardContent>
                {user.paymentOrders.length === 0 ? (
                  <Text color="muted" className="py-6 text-center">No payment orders found</Text>
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
                        {user.paymentOrders.map((order) => (
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

          {/* Referral Tab */}
          <TabsContent value="referral">
            <Card>
              <CardHeader>
                <Flex align="center" gap={2}>
                  <CardTitle>Referral Program</CardTitle>
                  <SectionGuide
                    title="User Referral Stats"
                    description="Tracks clicks, signups, and paid conversions generated through this user's unique referral link."
                    example="Code: USHA2026\nClicks: 140\nSignups: 22\nPaid conversions: 4"
                  />
                </Flex>
                <CardDescription>Referral performance and rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {user.referralCode ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Box className="p-4 rounded-lg bg-muted/50 border">
                        <Text size="xs" color="muted">Referral Code</Text>
                        <Text size="lg" weight="bold" className="font-mono mt-1 text-primary">{user.referralCode.code}</Text>
                        <Text size="xs" color="muted" className="mt-1 truncate">/signup?ref={user.referralCode.code}</Text>
                      </Box>
                      <Box className="p-4 rounded-lg bg-muted/50 border">
                        <Text size="xs" color="muted">Total Clicks</Text>
                        <Text size="lg" weight="bold" className="mt-1">{user.referralCode.click_count}</Text>
                        <Text size="xs" color="muted" className="mt-1">Link visits (opened link)</Text>
                      </Box>
                      <Box className="p-4 rounded-lg bg-muted/50 border">
                        <Text size="xs" color="muted">Signups</Text>
                        <Text size="lg" weight="bold" className="mt-1">{user.referralCode.signup_count}</Text>
                        <Text size="xs" color="muted" className="mt-1">Registered accounts</Text>
                      </Box>
                      <Box className="p-4 rounded-lg bg-muted/50 border">
                        <Text size="xs" color="muted">Conversions</Text>
                        <Text size="lg" weight="bold" className="mt-1 text-green-600 dark:text-green-400">{user.referralCode.conversion_count}</Text>
                        <Text size="xs" color="muted" className="mt-1">Paid plans (Creator/Pro/Studio)</Text>
                      </Box>
                    </div>

                    {/* Detailed Referred Users Table */}
                    <Box className="pt-2">
                      <Flex align="center" between className="mb-3">
                        <Text weight="semibold" size="sm">Referred Users ({user.referrals?.length || 0})</Text>
                      </Flex>
                      {(!user.referrals || user.referrals.length === 0) ? (
                        <Box className="py-8 text-center border rounded-lg bg-muted/20">
                          <Gift className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                          <Text weight="medium">No referred users yet</Text>
                          <Text size="xs" color="muted" className="mt-1 max-w-md mx-auto">
                            When visitors create an account via this user&apos;s referral link (ref: {user.referralCode.code}), their account details, plan tier, and paid conversion status will appear here.
                          </Text>
                        </Box>
                      ) : (
                        <div className="overflow-x-auto border rounded-lg">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50 text-left">
                                <th className="py-3 px-3 font-medium text-muted-foreground">Referred User</th>
                                <th className="py-3 px-3 font-medium text-muted-foreground">Current Plan</th>
                                <th className="py-3 px-3 font-medium text-muted-foreground">Conversion Status</th>
                                <th className="py-3 px-3 font-medium text-muted-foreground">Signed Up</th>
                                <th className="py-3 px-3 font-medium text-muted-foreground text-right">View Profile</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {user.referrals.map((ref) => (
                                <tr key={ref.id} className="hover:bg-muted/40 transition-colors">
                                  <td className="py-3 px-3">
                                    <Flex align="center" gap={2} className="min-w-0">
                                      <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${ref.referredEmail || ref.referredUserId}`} alt={ref.referredEmail || ''} />
                                        <AvatarFallback>{(ref.referredName || ref.referredEmail || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <Box className="min-w-0">
                                        <Text weight="medium" size="sm" className="truncate">
                                          {ref.referredName || ref.referredEmail?.split('@')[0] || 'User'}
                                        </Text>
                                        {ref.referredEmail && (
                                          <Text size="xs" color="muted" className="truncate block">
                                            {ref.referredEmail}
                                          </Text>
                                        )}
                                      </Box>
                                    </Flex>
                                  </td>
                                  <td className="py-3 px-3">
                                    <Badge variant="outline" className={cn('capitalize', planBadgeColors[ref.currentPlan] || '')}>
                                      {(ref.currentPlan === 'free' || ref.currentPlan === 'spark') ? 'Spark (Free)' : (ref.currentPlan.charAt(0).toUpperCase() + ref.currentPlan.slice(1))}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-3">
                                    {ref.isPaid ? (
                                      <Badge variant="success" className="text-xs">
                                        Converted ({ref.currentPlan.toUpperCase()})
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs text-muted-foreground">
                                        Signed Up (Free)
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-xs text-muted-foreground">
                                    {new Date(ref.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                      <Link href={`/admin/users/${ref.referredUserId}`} prefetch={true} title="View user details">
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
                    </Box>
                  </>
                ) : (
                  <Text color="muted" className="py-6 text-center">No referral code generated for this user</Text>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </MotionBox>
      {user && (
        <ActionReasonDialog
          isOpen={actionDialog.isOpen}
          onClose={() => setActionDialog((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={handleDialogConfirm}
          actionType={actionDialog.actionType}
          targetEmail={user.email}
        />
      )}
    </Box>
  );
}
