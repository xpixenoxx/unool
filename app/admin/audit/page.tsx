'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, User, Clock, Hash, FileText, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Box, Flex, Text, Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { MotionBox, MotionStack, hoverLift, fadeIn, slideUp } from '@/components/ui/motion';
import { useState, useEffect, useMemo } from 'react';

interface AdminAuditLog {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ipHash: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  permissions: Record<string, boolean>;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const actionColors: Record<string, string> = {
  admin_user_create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  admin_user_update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  admin_user_delete: 'bg-destructive/10 text-destructive dark:bg-destructive/30',
  plan_create: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  plan_update: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  plan_delete: 'bg-destructive/10 text-destructive dark:bg-destructive/30',
  workspace_plan_update: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  workspace_status_update: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  user_suspend: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  user_unsuspend: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

function formatAction(action: string): string {
  return action
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <Text size="sm" color="muted">Page {page} of {totalPages}</Text>
      <Flex gap={2}>
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Flex>
    </div>
  );
}

function LogTable({
  logs,
  loading,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  adminUsers,
}: {
  logs: AdminAuditLog[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  adminUsers: AdminUser[];
}) {
  const userMap = useMemo(() => new Map(adminUsers.map(u => [u.id, u])), [adminUsers]);

  const totalItems = logs.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedLogs = logs.slice(start, end);

  return (
    <Card variant="default" padding="none">
      <CardHeader className="px-6 py-4 border-b">
        <Flex between className="flex-wrap gap-4">
          <CardTitle>Audit Log</CardTitle>
          <Flex gap={3}>
            <Select value={String(pageSize)} onValueChange={v => { onPageSizeChange(Number(v)); onPageChange(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => {
              const csv = [
                ['ID', 'Action', 'Target Type', 'Target ID', 'Admin User', 'Date', 'IP Hash', 'Metadata'].join(','),
                ...paginatedLogs.map(log => [
                  log.id,
                  log.action,
                  log.targetType,
                  log.targetId || '',
                  userMap.get(log.adminUserId)?.email || 'Unknown',
                  log.createdAt,
                  log.ipHash || '',
                  JSON.stringify(log.metadata).replace(/"/g, '""'),
                ].join(','))
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }} title="Export CSV">
              <Download className="h-4 w-4" />
            </Button>
          </Flex>
        </Flex>
      </CardHeader>
      <CardContent className="p-0">
        <Box className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Target</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Admin</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">IP</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading && !paginatedLogs.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No audit log entries found</td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const admin = userMap.get(log.adminUserId);
                  return (
                    <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          size="sm"
                          className={actionColors[log.action] || 'bg-muted text-muted-foreground'}
                        >
                          {formatAction(log.action)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Flex align="center" gap={2} style={{ flexWrap: 'wrap' }}>
                          <Badge variant="secondary" size="sm">{log.targetType}</Badge>
                          {log.targetId && (
                            <Text size="sm" color="muted" className="font-mono truncate max-w-xs">{log.targetId}</Text>
                          )}
                        </Flex>
                      </td>
                      <td className="p-4">
                        <Flex align="center" gap={2}>
                          <User className="h-4 w-4 text-muted-foreground" />
                          <Text size="sm">{admin?.email || 'Unknown'}</Text>
                        </Flex>
                      </td>
                      <td className="p-4">
                        <Flex align="center" gap={2}>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Text size="sm" color="muted">{formatDate(log.createdAt)}</Text>
                        </Flex>
                      </td>
                      <td className="p-4">
                        <Flex align="center" gap={2}>
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <Text size="xs" color="muted" className="font-mono">{log.ipHash || 'N/A'}</Text>
                        </Flex>
                      </td>
                      <td className="p-4 text-right">
                        <Flex align="center" end gap={2}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(log.metadata, null, 2));
                              alert('Metadata copied to clipboard');
                            }}
                            title="Copy metadata"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Flex>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Box>
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </CardContent>
    </Card>
  );
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');

  const totalPages = Math.ceil(logs.length / pageSize);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsRes, usersRes] = await Promise.all([
        fetch('/api/admin/audit?limit=500', { credentials: 'include' }),
        fetch('/api/admin/users?pageSize=200', { credentials: 'include' }),
      ]);
      if (!logsRes.ok) throw new Error('Failed to fetch audit logs');
      if (!usersRes.ok) throw new Error('Failed to fetch admin users');
      const logsData = await logsRes.json();
      const usersData = await usersRes.json();
      setLogs(logsData || []);
      setAdminUsers(usersData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(log =>
      log.action.toLowerCase().includes(q) ||
      log.targetType.toLowerCase().includes(q) ||
      log.targetId?.toLowerCase().includes(q) ||
      JSON.stringify(log.metadata).toLowerCase().includes(q) ||
      log.ipHash?.toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  if (loading && !logs.length) {
    return (
      <MotionBox variant="fade">
        <Box className="space-y-6">
          <Flex between>
            <Box>
              <Text size="3xl" weight="bold">Audit Log</Text>
              <Text color="muted">Track all administrative actions</Text>
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
          <Text size="3xl" weight="bold">Audit Log</Text>
          <Text color="muted">Track all administrative actions across the platform</Text>
        </Box>
        <Flex gap={3} className="items-center">
          <Input
            placeholder="Search audit log..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-80"
          />
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <Loader2 className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </Flex>
      </Flex>

      {error && (
        <Card variant="error" padding="md">
          <CardContent className="flex items-center justify-between">
            <Text color="destructive">Error: {error}</Text>
            <Button variant="ghost" size="sm" onClick={fetchData}>Retry</Button>
          </CardContent>
        </Card>
      )}

      <LogTable
        logs={filteredLogs}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalPages={Math.ceil(filteredLogs.length / pageSize)}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        adminUsers={adminUsers}
      />
    </MotionBox>
  );
}