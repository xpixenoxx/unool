'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Linkedin, Twitter, MessageSquare, CheckCircle, Edit, Send, AlertCircle, Sparkles, CircleCheckBig } from 'lucide-react';
import { toast } from 'sonner';

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
  x: { icon: Twitter, name: 'X (Twitter)', maxChars: 280, color: 'bg-gray-800' },
  threads: { icon: MessageSquare, name: 'Threads', maxChars: 500, color: 'bg-black' },
};

function PublishPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const postId = searchParams.get('postId');

  const [post, setPost] = useState<Post | null>(null);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<Record<string, { success: boolean; platformUrl?: string; error?: string }>>({});

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

  if (loading) {
    return (
      <div className="space-y-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Publish (One Click)</h1>
            <p className="text-muted-foreground">Write once. AI adapts. You approve. One click publishes everywhere.</p>
          </div>
          <Button disabled size="lg"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</Button>
        </div>
        <Card><CardContent className="min-h-[300px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Publish (One Click)</h1>
            <p className="text-muted-foreground">Write once. AI adapts. You approve. One click publishes everywhere.</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Post not found. Create a new post to get started.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/composer">Create Post</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Publish (One Click)</h1>
          <p className="text-muted-foreground">Write once. AI adapts. You approve. One click publishes everywhere.</p>
        </div>
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
      </div>

      {/* Source Content (Read-only) */}
      <Card className="border-blue-200 bg-blue-50/30">
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
          <p className="text-sm text-muted-foreground mt-2">This is your original input. Edit drafts below per platform.</p>
        </CardContent>
      </Card>

      {/* Platform Drafts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Review & Edit ({drafts.filter(d => d.status === 'draft').length} ready)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {drafts.map((draft) => {
              const config = PLATFORM_CONFIG[draft.platform];
              const Icon = config.icon;
              const isOverLimit = draft.characterCount > draft.maxChars;
              const isPublished = draft.status === 'published';
              const isFailed = draft.status === 'failed';
              const result = publishResults[draft.platform];

              return (
                <div key={draft.platform} className={`border rounded-xl p-4 ${isPublished ? 'bg-green-50 border-green-200' : isFailed ? 'bg-red-50 border-red-200' : 'bg-card'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-lg ${config.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold">{config.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {draft.characterCount}/{draft.maxChars} characters
                          {draft.hashtags.length > 0 && ` • ${draft.hashtags.length} hashtags`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                    </div>
                  </div>

                  {!isPublished && (
                    <Textarea
                      value={draft.content}
                      onChange={e => updateDraft(draft.platform, e.target.value)}
                      className={`min-h-[120px] ${isOverLimit ? 'border-destructive' : ''}`}
                      rows={5}
                      disabled={isPublished || isFailed}
                      placeholder={isPublished ? 'Published — view on platform' : isFailed ? 'Publish failed' : 'Edit your draft'}
                    />
                  )}

                  {isOverLimit && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Over character limit by {draft.characterCount - draft.maxChars} characters
                    </p>
                  )}

                  {draft.error && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {draft.error}
                    </p>
                  )}

                  {draft.hashtags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {draft.hashtags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  {draft.mediaUrls.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Media: {draft.mediaUrls.map(m => m.url).join(', ')}</span>
                    </div>
                  )}

                  {result && (
                    <div className="mt-3 p-3 rounded-lg bg-muted flex items-center gap-2">
                      {result.success ? (
                        <>
                          <CircleCheckBig className="h-4 w-4 text-green-600" />
                          <span className="text-green-700">Published successfully</span>
                          {result.platformUrl && (
                            <a href={result.platformUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline ml-2">
                              View on {config.name}
                            </a>
                          )}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-700">Failed: {result.error || 'Unknown error'}</span>
                        </>
                      )}
                    </div>
                  )}

                  {!isPublished && !isFailed && (
                    <Separator className="my-4" />
                  )}

                  {!isPublished && !isFailed && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { /* accept draft - already editable */ }}>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Editing...
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { /* manual edit - already editing */ }}>
                        <Edit className="mr-1 h-3 w-3" />
                        Manual Edit
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Post Info */}
      <details className="text-sm text-muted-foreground border-t pt-4">
        <summary className="cursor-pointer">Post Details</summary>
        <div className="mt-2 space-y-1 font-mono">
          <div>Post ID: {post.id}</div>
          <div>Profile ID: {post.profileId}</div>
          <div>Workspace ID: {post.workspaceId}</div>
          <div>Created: {new Date(post.createdAt).toLocaleString()}</div>
          <div>Updated: {new Date(post.updatedAt).toLocaleString()}</div>
        </div>
      </details>
    </div>
  );
}

export default function PublishPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Publish (One Click)</h1>
            <p className="text-muted-foreground">Write once. AI adapts. You approve. One click publishes everywhere.</p>
          </div>
          <Button disabled size="lg"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</Button>
        </div>
        <Card><CardContent className="min-h-[300px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>
      </div>
    }>
      <PublishPageContent />
    </Suspense>
  );
}