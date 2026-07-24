'use client';

import * as React from 'react';
import { Search, ChevronLeft, ChevronRight, MoreVertical, Building2, Edit, Trash2, Users, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Box, Flex, Text, Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui';
import { MotionBox, MotionStack, hoverLift, staggerItem, fadeIn, slideUp } from '@/components/ui/motion';
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
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
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
    canceled: { variant: 'destructive', label: 'Canceled' },
    paused: { variant: 'outline', label: 'Paused' },
    free: { variant: 'outline', label: 'Free' },
  };
  const config = statusConfig[status] || { variant: 'outline', label: status };
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}

function WorkspaceTable({ workspaces, total, page, pageSize, totalPages, onPageChange, onSearch, searchQuery, loading }: WorkspaceTableProps) {
  return (
    <Card variant="default" padding="none">
      <CardHeader className="px-6 py-4 border-b">
        <Flex between>
          <CardTitle>All Workspaces</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/workspaces/new"><Plus className="mr-2 h-4 w-4" /> New Workspace</a>
          </Button>
        </Flex>
      </CardHeader>
      <CardContent className="p-0">
        {!loading && !workspaces.length ? (
          <Box className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <Text weight="medium">No workspaces found</Text>
            <Text size="sm" color="muted" className="mt-1">Get started by creating a workspace</Text>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <a href="/admin/workspaces/new">Create Workspace</a>
            </Button>
          </Box>
        ) : (
          <Box className="overflow-x-auto">
            <table className="w-full" role="table">
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
                    <td className="px-6 py-4">
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
                              <Edit className="mr-2 h-4 w-4" /> View Details
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`/admin/workspaces/${ws.id}/edit`}>
                              <Building2 className="mr-2 h-4 w-4" /> Edit Plan
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
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
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [planFilter, setPlanFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

  if (loading && !workspaces.length) {
    return (
      <MotionBox variant="fade">
        <Box className="space-y-6">
          <Flex between>
            <Box>
              <Text size="3xl" weight="bold">Workspaces</Text>
              <Text color="muted">Manage all workspaces and their subscriptions</Text>
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
          <Text size="3xl" weight="bold">Workspaces</Text>
          <Text color="muted">Manage all workspaces, plans, and subscriptions</Text>
        </Box>
        <Flex gap={3} className="items-center">
          <Input placeholder="Search workspaces..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="w-64" />
          <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }} className="rounded-md border border-input bg-background px-3 py-2 text-sm" style={{ width: 160 }}>
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-md border border-input bg-background px-3 py-2 text-sm" style={{ width: 160 }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
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

      <MotionStack space={6} stagger={0.05}>
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
        />
      </MotionStack>
    </MotionBox>
  );
}