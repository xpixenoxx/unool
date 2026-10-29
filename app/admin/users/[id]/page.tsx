'use client';

import * as React from 'react';
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
}

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

  const handleToggleSuspend = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const endpoint = user.isSuspended
        ? `/api/admin/users/${userId}/unsuspend`
        : `/api/admin/users/${userId}/suspend`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin toggle from user detail' }),
      });
      if (!res.ok) throw new Error('Action failed');
      await fetchUser();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/admin/users');
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
            <Button
              variant={user.isSuspended ? 'outline' : 'destructive'}
              size="sm"
              onClick={handleToggleSuspend}
              disabled={actionLoading}
            >
              {user.isSuspended ? (
                <>
                  <UserCheck className="mr-2 h-4 w-4 text-green-500" /> Unsuspend User
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" /> Suspend User
                </>
              )}
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
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </Badge>
                    )}
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
              <Gift className="h-4 w-4" /> Referral
            </TabsTrigger>
          </TabsList>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces">
            <Card>
              <CardHeader>
                <CardTitle>Workspaces</CardTitle>
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
                              <Badge variant="outline" className="capitalize">{ws.plan || 'free'}</Badge>
                            </td>
                            <td className="py-3 px-2">
                              <Badge className="capitalize">{ws.plan_status || 'active'}</Badge>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground text-xs">
                              {new Date(ws.joinedAt || ws.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <a href={`/admin/workspaces/${ws.id}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </a>
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
                <CardTitle>Payment History</CardTitle>
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
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>Referral performance and rewards</CardDescription>
              </CardHeader>
              <CardContent>
                {user.referralCode ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Box className="p-4 rounded-lg bg-muted/50 border">
                      <Text size="xs" color="muted">Referral Code</Text>
                      <Text size="lg" weight="bold" className="font-mono mt-1">{user.referralCode.code}</Text>
                    </Box>
                    <Box className="p-4 rounded-lg bg-muted/50 border">
                      <Text size="xs" color="muted">Total Clicks</Text>
                      <Text size="lg" weight="bold" className="mt-1">{user.referralCode.click_count}</Text>
                    </Box>
                    <Box className="p-4 rounded-lg bg-muted/50 border">
                      <Text size="xs" color="muted">Signups</Text>
                      <Text size="lg" weight="bold" className="mt-1">{user.referralCode.signup_count}</Text>
                    </Box>
                    <Box className="p-4 rounded-lg bg-muted/50 border">
                      <Text size="xs" color="muted">Conversions</Text>
                      <Text size="lg" weight="bold" className="mt-1">{user.referralCode.conversion_count}</Text>
                    </Box>
                  </div>
                ) : (
                  <Text color="muted" className="py-6 text-center">No referral code generated for this user</Text>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </MotionBox>
    </Box>
  );
}

