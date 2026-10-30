'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  UserPlus,
  Loader2,
  Ban,
  UserCheck,
} from 'lucide-react';

import {
  Box,
  Flex,
  Text,
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
} from '@/components/ui';
import { SectionGuide } from '@/components/admin/section-guide';
import { ActionReasonDialog } from '@/components/admin/action-reason-dialog';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  createdAt: string;
  workspaceCount: number;
  plan: string;
  suspended?: boolean;
}

const planBadgeColors: Record<string, string> = {
  spark: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  creator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  studio: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

interface UserTableProps {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

function UserTable({
  users,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  loading,
  onRefresh,
}: UserTableProps) {
  const [actionDialog, setActionDialog] = React.useState<{
    isOpen: boolean;
    actionType: 'suspend' | 'delete';
    user: User | null;
  }>({
    isOpen: false,
    actionType: 'suspend',
    user: null,
  });

  const handleDialogConfirm = async (reason: string) => {
    if (!actionDialog.user) return;
    const userId = actionDialog.user.id;

    if (actionDialog.actionType === 'suspend') {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Failed to suspend user');
    } else {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Failed to delete user');
    }
    onRefresh();
  };

  const unsuspendUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/unsuspend`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to unsuspend user');
      onRefresh();
    } catch (err) {
      console.error('Failed to unsuspend user:', err);
    }
  };

  return (
    <Card variant="default" padding="none">
      <CardContent className="p-0">
        <Box className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Workspaces</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Plan</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : 'No users found'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <Flex align="center" gap={3} className="min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`}
                            alt={user.email}
                          />
                          <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Text weight="medium" className="truncate">{user.email}</Text>
                          <Text size="xs" color="muted" className="font-mono truncate">{user.id}</Text>
                        </div>
                      </Flex>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" size="sm">
                        {user.workspaceCount} workspace{user.workspaceCount !== 1 ? 's' : ''}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" size="sm" className={cn('capitalize', planBadgeColors[user.plan] || '')}>
                        {user.plan}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {user.suspended ? (
                        <Badge variant="destructive" size="sm">
                          <Ban className="mr-1 h-3 w-3" /> Suspended
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" size="sm">
                          <UserCheck className="mr-1 h-3 w-3" /> Active
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <Text size="sm" color="muted">{new Date(user.createdAt).toLocaleDateString()}</Text>
                    </td>
                    <td className="p-4 text-right">
                      <Flex gap={2} end>
                        {user.suspended ? (
                          <Button variant="ghost" size="icon" onClick={() => unsuspendUser(user.id)} title="Unsuspend (restore login)">
                            <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setActionDialog({ isOpen: true, actionType: 'suspend', user })}
                            title="Suspend user account"
                          >
                            <Ban className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" asChild title="View Details">
                          <Link href={`/admin/users/${user.id}`} prefetch={true}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setActionDialog({ isOpen: true, actionType: 'delete', user })}
                          title="Move to Deleted & Recovery"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </Flex>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Box>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <Text size="sm" color="muted">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} users
            </Text>
            <Flex gap={2}>
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Flex>
          </div>
        )}
      </CardContent>

      {actionDialog.user && (
        <ActionReasonDialog
          isOpen={actionDialog.isOpen}
          onClose={() => setActionDialog({ isOpen: false, actionType: 'suspend', user: null })}
          onConfirm={handleDialogConfirm}
          actionType={actionDialog.actionType}
          targetEmail={actionDialog.user.email}
        />
      )}
    </Card>
  );
}

let cachedUsersData: { data: User[]; total: number } | null = null;

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<User[]>(cachedUsersData?.data || []);
  const [total, setTotal] = React.useState(cachedUsersData?.total || 0);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(!cachedUsersData);
  const [error, setError] = React.useState<string | null>(null);

  // Add User Dialog
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const totalPages = Math.ceil(total / pageSize);

  const fetchUsers = React.useCallback(async () => {
    if (!cachedUsersData) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (searchQuery) params.append('search', searchQuery);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.data || []);
      setTotal(data.total || 0);
      if (page === 1 && !searchQuery) {
        cachedUsersData = { data: data.data || [], total: data.total || 0 };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      alert('Valid email is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'platform',
          email: newEmail,
          password: newPassword || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create user');
      }
      setAddDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="space-y-6">
      <Flex between className="flex-wrap gap-4 items-center">
        <Box>
          <Flex align="center" gap={2}>
            <Text size="3xl" weight="bold">Platform Users</Text>
            <SectionGuide
              title="Users Directory"
              description="Displays all registered accounts in Supabase Auth. Admins can view individual user activity, provision new accounts with pre-verified status, suspend malicious actors, or inspect associated workspace memberships."
              example="User: user@example.com\nWorkspaces: 2 (1 owner, 1 member)\nPlan: creator"
            />
          </Flex>
          <Text color="muted">Manage platform users, investigate account health, and control login access</Text>
        </Box>
        <Flex gap={3} className="items-center">
          <Input
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-80"
          />
          <Button onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </Flex>
      </Flex>

      {error && (
        <Card variant="error" padding="md">
          <CardContent className="flex items-center justify-between">
            <Text color="destructive">Error: {error}</Text>
            <Button variant="ghost" size="sm" onClick={fetchUsers}>Retry</Button>
          </CardContent>
        </Card>
      )}

      <UserTable
        users={users}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setPage}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        loading={loading}
        onRefresh={fetchUsers}
      />

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Platform User</DialogTitle>
            <DialogDescription>
              Create a new user account with immediate email-confirmed status in Supabase Auth.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-user-email">Email Address *</Label>
              <Input
                id="create-user-email"
                type="email"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-user-password">Initial Password (optional)</Label>
              <Input
                id="create-user-password"
                type="password"
                placeholder="Leave blank to let user sign in via magic link"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
