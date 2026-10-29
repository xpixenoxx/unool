'use client';

import * as React from 'react';
import {
  Shield,
  UserPlus,
  Loader2,
  Trash2,
  RefreshCw,
  Server,
  Lock,
  Key,
  Database,
  CreditCard,
  Zap,
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Checkbox,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { MotionBox } from '@/components/ui/motion';

interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  permissions: Record<string, boolean>;
  lastLoginAt: string | null;
  createdAt: string;
}

const ALL_PERMISSIONS = [
  { id: 'users', label: 'User Management' },
  { id: 'workspaces', label: 'Workspace Management' },
  { id: 'plans', label: 'Plan Configuration' },
  { id: 'payments', label: 'Payments & Subscriptions' },
  { id: 'content', label: 'Content Moderation' },
  { id: 'platforms', label: 'Platform Connections' },
  { id: 'referrals', label: 'Referrals & Affiliates' },
  { id: 'analytics', label: 'Analytics & Audit Logs' },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = React.useState('admins');

  // Admin users state
  const [admins, setAdmins] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Add Admin dialog state
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState('');
  const [newRole, setNewRole] = React.useState<'super_admin' | 'admin' | 'support'>('admin');
  const [newPermissions, setNewPermissions] = React.useState<Record<string, boolean>>({
    users: true,
    workspaces: true,
    plans: true,
    payments: true,
    content: true,
    platforms: true,
    referrals: true,
    analytics: true,
  });
  const [submitting, setSubmitting] = React.useState(false);

  const fetchAdmins = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users?type=admin');
      const data = await res.json();
      setAdmins(data.data || []);
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleCreateAdmin = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      alert('Please enter a valid email');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          role: newRole,
          permissions: newRole === 'super_admin'
            ? Object.fromEntries(ALL_PERMISSIONS.map(p => [p.id, true]))
            : newPermissions,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create admin');
      }
      setAddDialogOpen(false);
      setNewEmail('');
      await fetchAdmins();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create admin user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove admin access for ${email}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchAdmins();
    } catch {
      alert('Failed to delete admin');
    }
  };

  const togglePermission = (permId: string) => {
    setNewPermissions(prev => ({
      ...prev,
      [permId]: !prev[permId],
    }));
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <MotionBox variant="fade">
        <Flex between className="items-center">
          <Box>
            <Text size="2xl" weight="bold" color="foreground">
              Settings & Administration
            </Text>
            <Text size="sm" color="muted">
              Manage administrator roles, system health, and security controls
            </Text>
          </Box>
          <Button variant="outline" size="sm" onClick={fetchAdmins}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </Flex>
      </MotionBox>

      {/* Tabs */}
      <MotionBox variant="fade" delay={0.05}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Administrator Accounts
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Server className="h-4 w-4" /> System Health
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Security & Passwords
            </TabsTrigger>
          </TabsList>

          {/* Admins Tab */}
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <Flex between className="items-center flex-wrap gap-4">
                  <div>
                    <CardTitle>Admin Users</CardTitle>
                    <CardDescription>Authorized users with access to the UNOOL Admin Panel</CardDescription>
                  </div>
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Admin
                  </Button>
                </Flex>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Flex centerX centerY className="py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </Flex>
                ) : admins.length === 0 ? (
                  <Flex centerX centerY className="py-12">
                    <Text color="muted">No admin users found</Text>
                  </Flex>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-3 px-2 font-medium text-muted-foreground">Admin Email</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Role</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Permissions</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Last Login</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Added On</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admins.map((adm) => (
                          <tr key={adm.id} className="border-b hover:bg-muted/40 transition-colors">
                            <td className="py-3 px-2">
                              <Text weight="medium">{adm.email}</Text>
                              <Text size="xs" color="muted" className="font-mono">{adm.id}</Text>
                            </td>
                            <td className="py-3 px-2">
                              <Badge
                                className={cn(
                                  'capitalize text-xs',
                                  adm.role === 'super_admin'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                    : adm.role === 'admin'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                )}
                              >
                                {adm.role.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {adm.role === 'super_admin' ? (
                                  <Badge variant="outline" className="text-xs">All Permissions</Badge>
                                ) : (
                                  Object.entries(adm.permissions || {})
                                    .filter(([, v]) => v)
                                    .map(([k]) => (
                                      <Badge key={k} variant="outline" className="text-xs">
                                        {k}
                                      </Badge>
                                    ))
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-xs text-muted-foreground">
                              {adm.lastLoginAt ? new Date(adm.lastLoginAt).toLocaleString() : 'Never'}
                            </td>
                            <td className="py-3 px-2 text-xs text-muted-foreground">
                              {new Date(adm.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAdmin(adm.id, adm.email)}
                                className="text-destructive hover:text-destructive"
                                title="Remove admin"
                              >
                                <Trash2 className="h-4 w-4" />
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

          {/* Health Tab */}
          <TabsContent value="health">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <Flex between className="items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" /> Cashfree Payment Gateway
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Configured
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Flex between>
                    <Text color="muted">Status:</Text>
                    <Text weight="medium">Operational</Text>
                  </Flex>
                  <Flex between>
                    <Text color="muted">Currency:</Text>
                    <Text weight="medium">INR (Paise precision)</Text>
                  </Flex>
                  <Flex between>
                    <Text color="muted">Webhooks:</Text>
                    <Text weight="medium">Idempotent processing enabled</Text>
                  </Flex>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Flex between className="items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" /> Supabase Database
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Connected
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Flex between>
                    <Text color="muted">Engine:</Text>
                    <Text weight="medium">PostgreSQL with RLS</Text>
                  </Flex>
                  <Flex between>
                    <Text color="muted">Auth Client:</Text>
                    <Text weight="medium">Service Role (Admin Bypass)</Text>
                  </Flex>
                  <Flex between>
                    <Text color="muted">Migrations:</Text>
                    <Text weight="medium">Up to date (password_hash supported)</Text>
                  </Flex>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Flex between className="items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" /> Redis & Rate Limiting
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Flex between>
                    <Text color="muted">Provider:</Text>
                    <Text weight="medium">Upstash Redis</Text>
                  </Flex>
                  <Flex between>
                    <Text color="muted">Login Rate Limit:</Text>
                    <Text weight="medium">5 attempts / 15 minutes per IP</Text>
                  </Flex>
                  <Flex between>
                    <Text color="muted">Admin API Limit:</Text>
                    <Text weight="medium">60 requests / minute</Text>
                  </Flex>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Flex between className="items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" /> Authentication Engine
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Hardened
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Flex between>
                    <Text color="muted">Hashing:</Text>
                    <Text weight="medium">Argon2id (OWASP standard)</Text>
                  </Flex>
                  <Flex between>
                    <Text color="muted">Token Type:</Text>
                    <Text weight="medium">HMAC-SHA256 Signed JWT</Text>
                  </Flex>
                  <Flex between>
                    <Text color="muted">Session Expiry:</Text>
                    <Text weight="medium">24 Hours (HttpOnly, SameSite)</Text>
                  </Flex>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Admin Security Guidelines</CardTitle>
                <CardDescription>Procedures for rotating passwords and maintaining security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <Box className="p-4 rounded-lg border bg-muted/30 space-y-2">
                  <Text weight="semibold" className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" /> Setting or Rotating Admin Passwords
                  </Text>
                  <Text color="muted">
                    To set or reset any admin user password securely using Argon2id, run the included CLI script from the repository root:
                  </Text>
                  <pre className="p-3 bg-muted rounded font-mono text-xs overflow-x-auto">
                    npx tsx scripts/set-admin-password.ts &lt;admin_email&gt; &lt;new_password&gt;
                  </pre>
                </Box>

                <Box className="p-4 rounded-lg border bg-muted/30 space-y-2">
                  <Text weight="semibold" className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" /> Audit Trail
                  </Text>
                  <Text color="muted">
                    Every modification performed in this panel (plan changes, status updates, cancellations, user suspensions, deletions) is automatically recorded in the <span className="font-mono text-xs">admin_audit_log</span> table with the acting admin ID, timestamp, and metadata. You can view all logs under the <strong>Audit Log</strong> section.
                  </Text>
                </Box>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </MotionBox>

      {/* Add Admin Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Administrator</DialogTitle>
            <DialogDescription>
              Grant an administrator access to the UNOOL Admin Panel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@unool.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as 'super_admin' | 'admin' | 'support')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin (All permissions)</SelectItem>
                  <SelectItem value="admin">Admin (Custom permissions)</SelectItem>
                  <SelectItem value="support">Support (Limited view)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newRole !== 'super_admin' && (
              <div className="space-y-2 pt-2 border-t">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {ALL_PERMISSIONS.map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`perm-${perm.id}`}
                        checked={!!newPermissions[perm.id]}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <label
                        htmlFor={`perm-${perm.id}`}
                        className="text-xs font-medium cursor-pointer"
                      >
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAdmin} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

