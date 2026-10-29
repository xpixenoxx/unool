'use client';

import * as React from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Box,
  Flex,
  Text,
  Card,
  CardHeader,
  CardTitle,
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
} from '@/components/ui';
import { MotionBox } from '@/components/ui/motion';
import { SectionGuide } from '@/components/admin/section-guide';

interface PostItem {
  id: string;
  workspaceId: string;
  workspaceName: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  publishing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function ContentModerationPage() {
  const [posts, setPosts] = React.useState<PostItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Preview Dialog
  const [previewPost, setPreviewPost] = React.useState<PostItem | null>(null);

  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/content?${params}`);
      const data = await res.json();
      setPosts(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post? This removes it permanently from the queue and publishing history.')) return;
    try {
      const res = await fetch(`/api/admin/content?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post');
      if (previewPost?.id === id) setPreviewPost(null);
      await fetchPosts();
    } catch {
      alert('Delete failed');
    }
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <MotionBox variant="fade">
        <Flex between className="items-center">
          <Box>
            <Flex align="center" gap={2}>
              <Text size="2xl" weight="bold" color="foreground">
                Content Moderation
              </Text>
              <SectionGuide
                title="Content Moderation"
                description="Global overview of all posts drafted, queued, or dispatched across all customer workspaces. Allows super admins to inspect flagged content, preview post formatting, and purge abusive or policy-violating posts."
                example="Search keywords (e.g., 'crypto', 'giveaway') to audit suspicious posts before scheduled publication."
              />
            </Flex>
            <Text size="sm" color="muted">
              Inspect and moderate posts across all workspaces
            </Text>
          </Box>
          <Button variant="outline" size="sm" onClick={fetchPosts}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </Flex>
      </MotionBox>

      {/* Filters */}
      <MotionBox variant="fade" delay={0.05}>
        <Card>
          <CardContent className="pt-6">
            <Flex gap={3} className="flex-col sm:flex-row items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search post text..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Flex align="center" gap={2} className="w-full sm:w-auto">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <SectionGuide
                  title="Post Statuses"
                  description="SCHEDULED: Queued in BullMQ for future delivery.\nPUBLISHED: Successfully broadcast to social networks.\nFAILED: Rejected by provider API (e.g. token expired, rate limit).\nDRAFT: Incomplete post."
                  example="Filter by 'failed' to troubleshoot client OAuth issues."
                />
              </Flex>
            </Flex>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Posts Table */}
      <MotionBox variant="fade" delay={0.1}>
        <Card>
          <CardHeader>
            <Flex between className="items-center">
              <Flex align="center" gap={2}>
                <CardTitle>Posts ({total})</CardTitle>
                <SectionGuide
                  title="Post Actions"
                  description="Eye icon opens full markdown/rich-text preview with exact schedule timestamp. Trash icon permanently removes post from database."
                  example="Click Eye to inspect full copy and hashtags of long-form posts."
                />
              </Flex>
              <Text size="sm" color="muted">
                Page {page} of {totalPages}
              </Text>
            </Flex>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Flex centerX centerY className="py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </Flex>
            ) : posts.length === 0 ? (
              <Flex centerX centerY className="py-12">
                <Text color="muted">No posts found</Text>
              </Flex>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-2 font-medium text-muted-foreground">Post Content</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Workspace</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Date</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-2 max-w-md">
                          <Text size="sm" className="line-clamp-2">
                            {post.content || <span className="italic text-muted-foreground">No text</span>}
                          </Text>
                        </td>
                        <td className="py-3 px-2">
                          <Text size="sm" weight="medium" className="truncate max-w-[140px]">
                            {post.workspaceName}
                          </Text>
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={cn('text-xs capitalize', statusColors[post.status])}>
                            {post.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-xs text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Flex gap={1} end>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewPost(post)}
                              title="View full post"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(post.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete post"
                            >
                              <Trash2 className="h-4 w-4" />
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
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
                </Text>
                <Flex gap={2}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Preview Dialog */}
      <Dialog open={!!previewPost} onOpenChange={(open) => { if (!open) setPreviewPost(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post Preview</DialogTitle>
            <DialogDescription>
              Workspace: {previewPost?.workspaceName} · Status: {previewPost?.status}
            </DialogDescription>
          </DialogHeader>
          {previewPost && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-lg bg-muted/40 border">
                <Text size="sm" className="whitespace-pre-wrap">
                  {previewPost.content || 'No text content'}
                </Text>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t pt-3">
                <div>
                  <Text weight="medium" color="foreground">Created</Text>
                  <Text>{new Date(previewPost.createdAt).toLocaleString()}</Text>
                </div>
                {previewPost.scheduledAt && (
                  <div>
                    <Text weight="medium" color="foreground">Scheduled For</Text>
                    <Text>{new Date(previewPost.scheduledAt).toLocaleString()}</Text>
                  </div>
                )}
                {previewPost.publishedAt && (
                  <div>
                    <Text weight="medium" color="foreground">Published At</Text>
                    <Text>{new Date(previewPost.publishedAt).toLocaleString()}</Text>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewPost(null)}>Close</Button>
            {previewPost && (
              <Button
                variant="destructive"
                onClick={() => handleDelete(previewPost.id)}
              >
                Delete Post
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
