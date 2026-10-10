'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Linkedin, Twitter, MessageSquare, CheckCircle, Edit, Send, AlertCircle, Sparkles, CircleCheckBig, X, ExternalLink, Facebook, Youtube, Instagram, Cloud, MessageCircle, Image as ImageIcon, Send as SendIcon, Eye, Twitch, Hash, Dribbble, GraduationCap, Store, Gamepad2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Flex, Box, Stack, Text, Display, Divider } from '@/components/ui/layout';
import { MotionBox, MotionStack, spring, stagger } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PlatformPreview } from './PlatformPreview';

type Platform = 'linkedin' | 'x' | 'threads' | 'manual' | 'facebook' | 'instagram' | 'youtube' | 'pinterest' | 'bluesky' | 'slack' | 'mastodon' | 'twitch' | 'telegram' | 'discord' | 'dribbble' | 'skool' | 'whop' | 'kick' | 'vk';
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
  platformUrl: string | null;
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
  platformUrl?: string | null;
  variantId: string;
}

const PLATFORM_CONFIG: Record<Platform, { icon: React.ElementType; name: string; maxChars: number; color: string }> = {
  linkedin: { icon: Linkedin, name: 'LinkedIn', maxChars: 3000, color: 'bg-blue-600' },
  x: { icon: Twitter, name: 'X (Twitter)', maxChars: 280, color: 'bg-gray-800 dark:bg-gray-200' },
  threads: { icon: MessageSquare, name: 'Threads', maxChars: 500, color: 'bg-black dark:bg-white' },
  facebook: { icon: Facebook, name: 'Facebook', maxChars: 63206, color: 'bg-blue-600' },
  instagram: { icon: Instagram, name: 'Instagram', maxChars: 2200, color: 'bg-pink-600' },
  youtube: { icon: Youtube, name: 'YouTube', maxChars: 5000, color: 'bg-red-600' },
  pinterest: { icon: ImageIcon, name: 'Pinterest', maxChars: 500, color: 'bg-red-600' },
  bluesky: { icon: Cloud, name: 'Bluesky', maxChars: 300, color: 'bg-blue-400' },
  mastodon: { icon: Cloud, name: 'Mastodon', maxChars: 500, color: 'bg-purple-600' },
  slack: { icon: MessageSquare, name: 'Slack', maxChars: 40000, color: 'bg-[#4A154B]' },
  twitch: { icon: Twitch, name: 'Twitch', maxChars: 500, color: 'bg-[#9146FF]' },
  telegram: { icon: Send, name: 'Telegram', maxChars: 4096, color: 'bg-[#229ED9]' },
  discord: { icon: Hash, name: 'Discord', maxChars: 2000, color: 'bg-[#5865F2]' },
  dribbble: { icon: Dribbble, name: 'Dribbble', maxChars: 250, color: 'bg-[#EA4C89]' },
  skool: { icon: GraduationCap, name: 'Skool', maxChars: 10000, color: 'bg-[#E2AD44]' },
  whop: { icon: Store, name: 'Whop', maxChars: 10000, color: 'bg-[#FF5A00]' },
  kick: { icon: Gamepad2, name: 'Kick', maxChars: 10000, color: 'bg-[#53FC18]' },
  vk: { icon: Video, name: 'VK', maxChars: 4096, color: 'bg-[#0077FF]' },
  manual: { icon: SendIcon, name: 'Manual', maxChars: 10000, color: 'bg-gray-500' },
};

interface PublishClientProps {
  userId: string;
  workspaceId: string;
}

export function PublishClientInner({ userId, workspaceId }: PublishClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const postId = searchParams.get('postId');

  const [post, setPost] = useState<Post | null>(null);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<Record<string, { success: boolean; platformUrl?: string; error?: string }>>({});
  const [previewMode, setPreviewMode] = useState<Record<string, boolean>>({});
  const springConfig: Transition = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.standard;

  const loadPost = useCallback(async (isPolling = false) => {
    if (!postId) return;

    try {
      const res = await fetch(`/api/publish/${postId}`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404 && !isPolling) {
          toast.error('Post not found');
          router.push('/dashboard/composer');
        } else if (!isPolling) {
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
        platformUrl: v.platformUrl,
        variantId: v.id,
      }));
      setDrafts(initialDrafts);
    } catch {
      if (!isPolling) toast.error('Failed to load post');
    } finally {
      if (!isPolling) setLoading(false);
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

  // Poll for background publish updates if any variant is still in 'draft' state
  useEffect(() => {
    const hasPendingDrafts = drafts.some(d => d.status === 'draft');
    if (!hasPendingDrafts || publishing) return;

    const intervalId = setInterval(() => {
      loadPost(true);
    }, 1500);

    return () => clearInterval(intervalId);
  }, [drafts, publishing, loadPost]);

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

      setDrafts(d => d.map(d => {
        const result = results[d.platform];
        if (result) {
          return {
            ...d,
            status: result.success ? 'published' as DraftStatus : 'failed' as DraftStatus,
            error: result.error,
            platformUrl: result.platformUrl || d.platformUrl,
          };
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
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Review & Edit ({drafts.filter(d => d.status === 'draft').length} ready)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </Flex>
                    </Flex>

                    {/* Preview / Edit toggle */}
                    {isPublished ? (
                      <PlatformPreview
                        platform={draft.platform}
                        content={draft.content}
                        mediaUrls={draft.mediaUrls}
                      />
                    ) : (
                      <>
                        {/* Toggle buttons */}
                        <Flex gap={1} className="mb-2">
                          <Button
                            variant={!previewMode[draft.platform] ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setPreviewMode(p => ({ ...p, [draft.platform]: false }))}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant={previewMode[draft.platform] ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setPreviewMode(p => ({ ...p, [draft.platform]: true }))}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            Preview
                          </Button>
                        </Flex>

                        {previewMode[draft.platform] ? (
                          <PlatformPreview
                            platform={draft.platform}
                            content={draft.content}
                            mediaUrls={draft.mediaUrls}
                          />
                        ) : (
                          <Textarea
                            value={draft.content}
                            onChange={e => updateDraft(draft.platform, e.target.value)}
                            className={cn('min-h-[120px]', isOverLimit && 'border-destructive')}
                            rows={5}
                            disabled={isFailed}
                            placeholder={isFailed ? 'Publish failed' : 'Edit your draft'}
                          />
                        )}
                      </>
                    )}

                    {isOverLimit && (
                      <Text size="sm" color="destructive" className="mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Over character limit by {draft.characterCount - draft.maxChars} characters
                      </Text>
                    )}

                    {draft.hashtags.length > 0 && (
                      <Flex wrap gap={1} className="mt-3">
                        {draft.hashtags.map(tag => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </Flex>
                    )}

                    {/* Display success with View Live button */}
                    {(result?.success || (isPublished && !result)) && (
                      <Box className="mt-3 p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-900/50">
                        <Flex between center>
                          <Flex center gap={2}>
                            <CircleCheckBig className="h-4 w-4 text-green-600" />
                            <Text size="sm" className="text-green-700 dark:text-green-300">Published successfully</Text>
                          </Flex>
                          {(result?.platformUrl || draft.platformUrl) && (
                            <a
                              href={result?.platformUrl || draft.platformUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View Live
                            </a>
                          )}
                        </Flex>
                      </Box>
                    )}

                    {/* Display failure */}
                    {(!result?.success && (result?.error || draft.error)) && (
                      <Box className="mt-3 p-3 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-900/50 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <Text size="sm" className="text-red-700 dark:text-red-300">Failed: {result?.error || draft.error}</Text>
                      </Box>
                    )}

                    {!isPublished && !isFailed && (
                      <>
                        <Divider className="my-4" />
                        <Flex wrap gap={2}>
                          <Button variant="ghost" size="sm" disabled>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Ready to publish
                          </Button>
                        </Flex>
                      </>
                    )}
                  </motion.div>
                );
              })}
        </div>
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

export default function PublishClientWrapper({ userId, workspaceId }: PublishClientProps) {
  return (
    <Suspense fallback={
      <MotionBox className="space-y-8 max-w-4xl mx-auto px-4 py-8" variant="fade">
        <Box className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </Box>
      </MotionBox>
    }>
      <PublishClientInner userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}