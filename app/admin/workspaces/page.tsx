'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Building2,
  Edit,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';

import {
  Box,
  Flex,
  Text,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

import { useState, useEffect } from 'react';

interface Workspace {
  id: string;
  name: string;
  plan: string;
  planStatus: string;
  planExpiresAt: string | null;
  memberCount: number;
  postsThisMonth: number;
  profileCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceTableProps {
  workspaces: Workspace[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  loading: boolean;
  onRefresh: () => void;
  onOpenCreate: () => void;
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    spark: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    creator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    studio: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return (
    <Badge variant="outline" className={colors[plan] || 'bg-muted text-muted-foreground'} size="sm">
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </Badge>
  );
}

function PlanStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'destructive' | 'outline'; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    trialing: { variant: 'default', label: 'Trial' },
    past_due: { variant: 'warning', label: 'Past Due' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
    canceled: { variant: 'destructive', label: 'Cancelled' },
    paused: { variant: 'outline', label: 'Paused' },
  };
  const config = statusConfig[status] || { variant: 'outline', label: status };
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}

function WorkspaceTable({
  workspaces,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  loading,
  onRefresh,
  onOpenCreate,
}: WorkspaceTableProps) {
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete workspace "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/workspaces/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      onRefresh();
    } catch {
      alert('Failed to delete workspace');
    }
  };

  return (
    <Card variant="default" padding="none">
      <CardHeader className="px-6 py-4 border-b">
        <Flex between>
          <CardTitle>All Workspaces</CardTitle>
          <Button variant="outline" size="sm" onClick={onOpenCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Workspace
          </Button>
        </Flex>
      </CardHeader>
      <CardContent className="p-0">
        {!loading && !workspaces.length ? (
          <Box className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <Text weight="medium">No workspaces found</Text>
            <Text size="sm" color="muted" className="mt-1">Get started by creating a workspace</Text>
            <Button variant="outline" size="sm" className="mt-3" onClick={onOpenCreate}>
              Create Workspace
            </Button>
          </Box>
        ) : (
          <Box className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workspace</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Posts/Month</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profiles</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workspaces.map((ws) => (
                  <tr key={ws.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <Box>
                        <Text weight="medium" className="truncate max-w-xs">{ws.name}</Text>
                        <Text size="xs" color="muted" className="font-mono">{ws.id.substring(0, 8)}...</Text>
                      </Box>
                    </td>
                    <td className="px-6 py-4"><PlanBadge plan={ws.plan} /></td>
                    <td className="px-6 py-4"><PlanStatusBadge status={ws.planStatus} /></td>
                    <td className="px-6 py-4"><Badge variant="outline" size="sm">{ws.memberCount}</Badge></td>
                    <td className="px-6 py-4"><Text size="sm">{ws.postsThisMonth}</Text></td>
                    <td className="px-6 py-4"><Text size="sm">{ws.profileCount}</Text></td>
                    <td className="px-6 py-4"><Text size="sm" color="muted">{new Date(ws.createdAt).toLocaleDateString()}</Text></td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={`/admin/workspaces/${ws.id}`}>
                              <Edit className="mr-2 h-4 w-4" /> View Details & Plan
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(ws.id, ws.name)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <Text size="sm" color="muted">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} workspaces
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

export default function AdminWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Workspace Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsPlan, setNewWsPlan] = useState('spark');
  const [newWsOwner, setNewWsOwner] = useState('');
  const [creating, setCreating] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  const fetchWorkspaces = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (searchQuery) params.append('search', searchQuery);
      if (planFilter) params.append('plan', planFilter);
      if (statusFilter) params.append('planStatus', statusFilter);
      const res = await fetch(`/api/admin/workspaces?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch workspaces');
      const data = await res.json();
      setWorkspaces(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, planFilter, statusFilter]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreateWorkspace = async () => {
    if (!newWsName.trim()) {
      alert('Workspace name is required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWsName.trim(),
          plan: newWsPlan,
          ownerEmail: newWsOwner.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create workspace');
      }
      setCreateDialogOpen(false);
      setNewWsName('');
      setNewWsOwner('');
      await fetchWorkspaces();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box className="space-y-6">
      <Flex between className="flex-wrap gap-4">
        <Box>
          <Text size="3xl" weight="bold">Workspaces</Text>
          <Text color="muted">Manage all workspaces, plans, and subscriptions</Text>
        </Box>
        <Flex gap={3} className="items-center flex-wrap">
          <Input
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-60"
          />
          <Select value={planFilter || 'all'} onValueChange={(v) => { setPlanFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="spark">Spark (Free)</SelectItem>
              <SelectItem value="creator">Creator</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trialing">Trialing</SelectItem>
              <SelectItem value="past_due">Past Due</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Workspace
          </Button>
        </Flex>
      </Flex>

      {error && (
        <Card variant="error" padding="md">
          <CardContent className="flex items-center justify-between">
            <Text color="destructive">Error: {error}</Text>
            <Button variant="ghost" size="sm" onClick={fetchWorkspaces}>Retry</Button>
          </CardContent>
        </Card>
      )}

      <WorkspaceTable
        workspaces={workspaces}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setPage}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        loading={loading}
        onRefresh={fetchWorkspaces}
        onOpenCreate={() => setCreateDialogOpen(true)}
      />

      {/* Create Workspace Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Provision a new workspace and assign an initial plan tier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Workspace Name *</Label>
              <Input
                id="ws-name"
                placeholder="Acme Media Co."
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-plan">Plan Tier</Label>
              <Select value={newWsPlan} onValueChange={setNewWsPlan}>
                <SelectTrigger id="ws-plan">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spark">Spark (Free)</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-owner">Owner User Email (optional)</Label>
              <Input
                id="ws-owner"
                type="email"
                placeholder="user@example.com"
                value={newWsOwner}
                onChange={(e) => setNewWsOwner(e.target.value)}
              />
              <Text size="xs" color="muted">
                If the user exists, they will be granted Owner role in this workspace.
              </Text>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateWorkspace} disabled={creating || !newWsName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
