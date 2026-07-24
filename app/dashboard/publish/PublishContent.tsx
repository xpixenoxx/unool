'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Linkedin, Twitter, MessageSquare, CheckCircle, Edit, Send, AlertCircle, Sparkles, CircleCheckBig, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Flex, Box, Stack, Text, Display, Divider } from '@/components/ui/layout';
import { MotionBox, MotionStack, spring, stagger } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Platform = 'linkedin' | 'x' | 'threads';
type DraftStatus = 'draft' | 'published' | 'failed';

interface PostVariant {
  id: string;
  postId: string;
  platform: Platform;
  adaptedContent: string;
  mediaUrls: { url: string; type: 'image' | 'video'; alt?: string }[];
  characterCount: number;
  hashtagStrategy: string[];
  firstCommentHint: string | null;
  status: DraftStatus;
  error: { code: string; message: string; details?: Record<string, unknown> } | null;
  createdAt: string;
  updatedAt: string;
}

interface Post {
  id: string;
  profileId: string;
  workspaceId: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PlatformDraft {
  platform: Platform;
  content: string;
  characterCount: number;
  maxChars: number;
  hashtags: string[];
  mediaUrls: { url: string; type: 'image' | 'video'; alt?: string }[];
  status: DraftStatus;
  error?: string;
  variantId: string;
}

const PLATFORM_CONFIG: Record<Platform, { icon: React.ElementType; name: string; maxChars: number; color: string }> = {
  linkedin: { icon: Linkedin, name: 'LinkedIn', maxChars: 3000, color: 'bg-blue-600' },
  x: { icon: Twitter, name: 'X (Twitter)', maxChars: 280, color: 'bg-gray-800 dark:bg-gray-200' },
  threads: { icon: MessageSquare, name: 'Threads', maxChars: 500, color: 'bg-black dark:bg-white' },
};

function PublishContentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const postId = searchParams.get('postId');

  const [post, setPost] = useState<Post | null>(null);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<Record<string, { success: boolean; platformUrl?: string; error?: string }>>({});
  const springConfig: Transition = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.standard;

  const loadPost = useCallback(async () => {
    if (!postId) return;

    try {
      const res = await fetch(`/api/publish/${postId}`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Post not found');
          router.push('/dashboard/composer');
        } else {
          toast.error('Failed to load post');
        }
        return;
      }
      const data = await res.json();
      setPost(data.post);

      const initialDrafts: PlatformDraft[] = data.variants.map((v: PostVariant) => ({
        platform: v.platform,
        content: v.adaptedContent,
        characterCount: v.characterCount,
        maxChars: PLATFORM_CONFIG[v.platform].maxChars,
        hashtags: v.hashtagStrategy,
        mediaUrls: v.mediaUrls,
        status: v.status,
        error: v.error?.message,
        variantId: v.id,
      }));
      setDrafts(initialDrafts);
    } catch {
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId, router]);

  useEffect(() => {
    if (!postId) {
      toast.error('No post ID provided');
      router.push('/dashboard/composer');
      return;
    }
    loadPost();
  }, [postId, router, loadPost]);

  const updateDraft = (platform: Platform, content: string) => {
    setDrafts(d => d.map(d => d.platform === platform ? { ...d, content, characterCount: content.length } : d));
  };

  const handlePublish = async () => {
    if (!postId || !post) return;

    const readyDrafts = drafts.filter(d => d.status === 'draft');
    if (readyDrafts.length === 0) {
      toast.error('No drafts ready to publish');
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postId, workspaceId: post.workspaceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Publish failed');
      }

      // Update draft statuses based on results
      const results: Record<string, { success: boolean; platformUrl?: string; error?: string }> = {};
      if (data.results) {
        for (const [platform, result] of Object.entries(data.results)) {
          const r = result as { success: boolean; platformUrl?: string; error?: string };
          results[platform] = r;
          if (r.success) {
            toast.success(`${platform}: Published`, { description: r.platformUrl });
          } else {
            toast.error(`${platform}: Failed`, { description: r.error });
          }
        }
      }
      setPublishResults(results);

      // Update local draft statuses
      setDrafts(d => d.map(d => {
        const result = results[d.platform];
        if (result) {
          return { ...d, status: result.success ? 'published' : 'failed', error: result.error };
        }
        return d;
      }));

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Publish failed';
      toast.error(errorMsg);
    } finally {
      setPublishing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <MotionBox className="space-y-8 max-w-4xl mx-auto px-4 py-8" variant="fade">
        <Flex between wrap gap={4}>
          <Box>
            <Display size="xl" weight="bold">Publish (One Click)</Display>
            <Text size="lg" color="muted">Write once. AI adapts. You approve. One click publishes everywhere.</Text>
          </Box>
          <Button disabled size="lg">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </Button>
        </Flex>
        <Card>
          <CardContent className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </MotionBox>
    );
  }

  // Post not found
  if (!post) {
    return (
      <MotionBox className="space-y-8 max-w-4xl mx-auto px-4 py-8" variant="fade">
        <Flex between wrap gap={4}>
          <Box>
            <Display size="xl" weight="bold">Publish (One Click)</Display>
            <Text size="lg" color="muted">Write once. AI adapts. You approve. One click publishes everywhere.</Text>
          </Box>
        </Flex>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <Text color="muted">Post not found. Create a new post to get started.</Text>
            <Button asChild className="mt-4">
              <Link href="/dashboard/composer">Create Post</Link>
            </Button>
          </CardContent>
        </Card>
      </MotionBox>
    );
  }

  return (
    <MotionBox className="space-y-8 max-w-4xl mx-auto px-4 py-8" variant="fade">
      {/* Header */}
      <Flex between wrap gap={4}>
        <Box>
          <Display size="xl" weight="bold">Publish (One Click)</Display>
          <Text size="lg" color="muted">Write once. AI adapts. You approve. One click publishes everywhere.</Text>
        </Box>
        <Button
          onClick={handlePublish}
          disabled={publishing || drafts.filter(d => d.status === 'draft').length === 0}
          size="lg"
        >
          <Send className="mr-2 h-4 w-4" />
          {publishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish All'
          )}
        </Button>
      </Flex>

      {/* Source Content (Read-only) */}
      <MotionBox variant="slide-up" delay={0.05}>
        <Card className="border-blue-500/20 bg-blue-500/5 dark:border-blue-500/10 dark:bg-blue-500/3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Original Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={post.content}
              className="min-h-[100px] bg-background"
              disabled
              rows={3}
            />
            <Text size="sm" color="muted" className="mt-2">This is your original input. Edit drafts below per platform.</Text>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Platform Drafts */}
      <MotionBox variant="slide-up" delay={0.1}>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Review & Edit ({drafts.filter(d => d.status === 'draft').length} ready)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Stack space={6}>
              {drafts.map((draft) => {
                const config = PLATFORM_CONFIG[draft.platform];
                const Icon = config.icon;
                const isOverLimit = draft.characterCount > draft.maxChars;
                const isPublished = draft.status === 'published';
                const isFailed = draft.status === 'failed';
                const result = publishResults[draft.platform];

                return (
                  <motion.div
                    key={draft.platform}
                    className={cn(
                      'border rounded-xl p-4',
                      isPublished && 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900',
                      isFailed && 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900',
                      (!isPublished && !isFailed) && 'bg-card'
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={springConfig}
                  >
                    <Flex between wrap gap={4} className="mb-4">
                      <Flex center gap={3}>
                        <span className={`p-2 rounded-lg ${config.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <Box>
                          <Text weight="semibold">{config.name}</Text>
                          <Text size="sm" color="muted">
                            {draft.characterCount}/{draft.maxChars} characters
                            {draft.hashtags.length > 0 && ` • ${draft.hashtags.length} hashtags`}
                          </Text>
                        </Box>
                      </Flex>
                      <Flex center gap={2}>
                        <Badge
                          variant={
                            isPublished ? 'default' :
                            isFailed ? 'destructive' :
                            draft.status === 'draft' ? 'outline' : 'secondary'
                          }
                        >
                          {isPublished && <CircleCheckBig className="mr-1 h-3 w-3" />}
                          {isPublished ? 'Published' : isFailed ? 'Failed' : draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
                        </Badge>
                        {result?.platformUrl && (
                          <a href={result.platformUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                            View Post
                          </a>
                        )}
                      </Flex>
                    </Flex>

                    {!isPublished && (
                      <Textarea
                        value={draft.content}
                        onChange={e => updateDraft(draft.platform, e.target.value)}
                        className={cn('min-h-[120px]', isOverLimit && 'border-destructive')}
                        rows={5}
                        disabled={isPublished || isFailed}
                        placeholder={isPublished ? 'Published — view on platform' : isFailed ? 'Publish failed' : 'Edit your draft'}
                      />
                    )}

                    {isOverLimit && (
                      <Text size="sm" color="destructive" className="mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Over character limit by {draft.characterCount - draft.maxChars} characters
                      </Text>
                    )}

                    {draft.error && (
                      <Text size="sm" color="destructive" className="mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {draft.error}
                      </Text>
                    )}

                    {draft.hashtags.length > 0 && (
                      <Flex wrap gap={1} className="mt-3">
                        {draft.hashtags.map(tag => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </Flex>
                    )}

                    {draft.mediaUrls.length > 0 && (
                      <Flex center gap={2} className="mt-3">
                        <Text size="sm" color="muted">Media: {draft.mediaUrls.map(m => m.url).join(', ')}</Text>
                      </Flex>
                    )}

                    {result && (
                      <Box className="mt-3 p-3 rounded-lg bg-muted flex items-center gap-2">
                        {result.success ? (
                          <>
                            <CircleCheckBig className="h-4 w-4 text-green-600" />
                            <Text size="sm" color="green-700 dark:text-green-300">Published successfully</Text>
                            {result.platformUrl && (
                              <a href={result.platformUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline ml-2">
                                View on {config.name}
                              </a>
                            )}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <Text size="sm" color="red-700 dark:text-red-300">Failed: {result.error || 'Unknown error'}</Text>
                          </>
                        )}
                      </Box>
                    )}

                    {!isPublished && !isFailed && (
                      <>
                        <Divider className="my-4" />
                        <Flex wrap gap={2}>
                          <Button variant="ghost" size="sm" disabled>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Editing...
                          </Button>
                          <Button variant="ghost" size="sm" disabled>
                            <Edit className="mr-1 h-3 w-3" />
                            Manual Edit
                          </Button>
                        </Flex>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Post Info */}
      <motion.details
        className="text-sm text-muted-foreground border-t pt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig}
      >
        <summary className="cursor-pointer">Post Details</summary>
        <Box className="mt-2 space-y-1 font-mono">
          <Flex gap={4} wrap><Text>Post ID:</Text> <Text>{post.id}</Text></Flex>
          <Flex gap={4} wrap><Text>Profile ID:</Text> <Text>{post.profileId}</Text></Flex>
          <Flex gap={4} wrap><Text>Workspace ID:</Text> <Text>{post.workspaceId}</Text></Flex>
          <Flex gap={4} wrap><Text>Created:</Text> <Text>{new Date(post.createdAt).toLocaleString()}</Text></Flex>
          <Flex gap={4} wrap><Text>Updated:</Text> <Text>{new Date(post.updatedAt).toLocaleString()}</Text></Flex>
        </Box>
      </motion.details>
    </MotionBox>
  );
}

export default function PublishContent() {
  return (
    <Suspense fallback={
      <MotionBox className="space-y-8 max-w-4xl mx-auto px-4 py-8" variant="fade">
        <Box className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </Box>
      </MotionBox>
    }>
      <PublishContentInner />
    </Suspense>
  );
}