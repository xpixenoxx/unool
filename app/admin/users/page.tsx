'use client';

import * as React from 'react';
import { Search, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, Shield, UserPlus, Loader2, Ban, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Box, Flex, Text, Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Avatar, AvatarImage, AvatarFallback } from '@/components/ui';
import { MotionBox, MotionStack, hoverLift, staggerContainer, staggerItem } from '@/components/ui/motion';

interface User {
  id: string;
  email: string;
  createdAt: string;
  workspaceCount: number;
  plan: string;
  suspended?: boolean;
}

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
}

function UserTable({ users, total, page, pageSize, totalPages, onPageChange, searchQuery, onSearch, loading }: UserTableProps) {
  const suspendUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to suspend user');
      // Refresh would happen via parent
    } catch (err) {
      console.error('Failed to suspend user:', err);
    }
  };

  const unsuspendUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/unsuspend`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to unsuspend user');
    } catch (err) {
      console.error('Failed to unsuspend user:', err);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete user');
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return (
    <Card variant="default" padding="none">
      <CardContent className="p-0">
        <Box className="overflow-x-auto">
          <table className="w-full" role="table">
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
                          <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`} alt={user.email} />
                          <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Text weight="medium" className="truncate">{user.email}</Text>
                          <Text size="xs" color="muted" className="font-mono truncate">{user.id}</Text>
                        </div>
                      </Flex>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" size="sm">{user.workspaceCount} workspace{user.workspaceCount !== 1 ? 's' : ''}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" size="sm">{user.plan}</Badge>
                    </td>
                    <td className="p-4">
                      {user.suspended ? (
                        <Badge variant="destructive" size="sm"><Ban className="mr-1 h-3 w-3" /> Suspended</Badge>
                      ) : (
                        <Badge variant="success" size="sm"><UserCheck className="mr-1 h-3 w-3" /> Active</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <Text size="sm" color="muted">{new Date(user.createdAt).toLocaleDateString()}</Text>
                    </td>
                    <td className="p-4 text-right">
                      <Flex gap={2} end>
                        {user.suspended ? (
                          <Button variant="ghost" size="icon" onClick={() => unsuspendUser(user.id)} title="Unsuspend">
                            <UserCheck className="h-4 w-4 text-success" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => suspendUser(user.id)} title="Suspend">
                            <Ban className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" asChild title="View Details">
                          <a href={`/admin/users/${user.id}`}><Edit className="h-4 w-4" /></a>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteUser(user.id)} title="Delete">
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
    </Card>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (searchQuery) params.append('search', searchQuery);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading && !users.length) {
    return (
      <MotionBox variant="fade">
        <Box className="space-y-6">
          <Flex between>
            <Box>
              <Text size="3xl" weight="bold">Users</Text>
              <Text color="muted">Manage all platform users</Text>
            </Box>
          </Flex>
          <Card variant="default" padding="lg">
            <CardContent className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        </Box>
      </MotionBox>
    );
  }

  return (
    <MotionBox variant="fade" className="space-y-6">
      <Flex between className="flex-wrap gap-4">
        <Box>
          <Text size="3xl" weight="bold">Users</Text>
          <Text color="muted">Manage all platform users and their access</Text>
        </Box>
        <Flex gap={3} className="items-center">
          <Input placeholder="Search users..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="w-80" />
          <Button asChild>
            <a href="/admin/users/new"><UserPlus className="mr-2 h-4 w-4" /> Add User</a>
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

      <MotionStack space={6} stagger={0.05}>
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
        />
      </MotionStack>
    </MotionBox>
  );
}