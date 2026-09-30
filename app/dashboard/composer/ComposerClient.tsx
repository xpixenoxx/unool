'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Transition } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  Loader2,
  Sparkles,
  Send,
  X,
  Linkedin,
  Twitter,
  MessageSquare,
  Zap,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  ImagePlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Box, Flex, Text, Display } from '@/components/ui/layout';
import { MotionBox, spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

const PLATFORM_CONFIG: Record<PlatformType, { icon: React.ElementType; name: string; maxChars: number; color: string }> = {
  linkedin: { icon: Linkedin, name: 'LinkedIn', maxChars: 3000, color: 'bg-blue-600' },
  x: { icon: Twitter, name: 'X (Twitter)', maxChars: 280, color: 'bg-gray-800 dark:bg-gray-200' },
  threads: { icon: MessageSquare, name: 'Threads', maxChars: 500, color: 'bg-black dark:bg-white' },
};

type PlatformType = 'linkedin' | 'x' | 'threads';

interface PlatformDraft {
  platform: PlatformType;
  content: string;
  characterCount: number;
  hashtags: string[];
  firstCommentHint?: string;
  status: 'idle' | 'generating' | 'ready' | 'error';
  error?: string;
}

interface AdaptedPost {
  content: string;
  characterCount: number;
  hashtags: string[];
  firstCommentHint?: string;
}

interface AdaptResponse {
  postId: string;
  variants: Record<PlatformType, AdaptedPost>;
  results?: Record<string, { success: boolean; platformUrl?: string; error?: string }>;
}

interface Profile {
  id: string;
  name: string;
  headline: string;
  bio: string;
  role: string;
  company: string;
}

interface ComposerClientProps {
  userId: string;
  workspaceId: string;
}

export function ComposerClient({ userId, workspaceId }: ComposerClientProps) {
  const reducedMotion = useReducedMotion();
  const [sourceContent, setSourceContent] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [mode, setMode] = useState<'ai' | 'quick'>('ai');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([
    { platform: 'linkedin', content: '', characterCount: 0, hashtags: [], status: 'idle' },
    { platform: 'x', content: '', characterCount: 0, hashtags: [], status: 'idle' },
    { platform: 'threads', content: '', characterCount: 0, hashtags: [], status: 'idle' },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PlatformType>('linkedin');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [media, setMedia] = useState<{url: string; type: 'image' | 'video'} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const springConfig: Transition = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.snappy;

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Only image and video files are supported');
      return;
    }
    
    const sizeLimitMB = isVideo ? 50 : 5;
    if (file.size > sizeLimitMB * 1024 * 1024) {
      toast.error(`${isVideo ? 'Video' : 'Image'} must be less than ${sizeLimitMB}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/composer/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setMedia({ url: data.url, type: data.type });
      toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      const data = await res.json();
      if (data.profile) {
        setProfile({
          id: data.profile.id,
          name: data.profile.name || '',
          headline: data.profile.headline || '',
          bio: data.profile.bio || '',
          role: data.profile.role || '',
          company: data.profile.company || '',
        });
      }
    } catch {
      // Ignore — profile might not exist yet
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const generateDrafts = async () => {
    if (!sourceContent.trim() || !profile) {
      toast.error('Please complete your profile first in the Presence tab');
      return;
    }

    setPlanError(null);
    setIsGenerating(true);
    setDrafts(d => d.map(d => ({ ...d, status: 'generating' })));

    try {
      const res = await fetch('/api/composer/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: sourceContent, profileId: profile.id, mediaUrl: media?.url, mediaType: media?.type }),
      });

      const data: AdaptResponse = await res.json();

      if (!res.ok) {
        const errorData = data as { error?: string; code?: string };
        if (res.status === 403) {
          setPlanError(errorData.error || 'Your current plan does not allow this action.');
          setDrafts(d => d.map(d => ({ ...d, status: 'idle' })));
          return;
        }
        throw new Error(errorData.error || 'Failed to generate drafts');
      }

      setPostId(data.postId);

      const platforms: PlatformType[] = ['linkedin', 'x', 'threads'];
      setDrafts(platforms.map(platform => {
        const result = data.variants[platform];
        return {
          platform,
          content: result?.content ?? '',
          characterCount: result?.characterCount ?? 0,
          hashtags: result?.hashtags ?? [],
          firstCommentHint: result?.firstCommentHint,
          status: result ? ('ready' as const) : ('error' as const),
        };
      }));

      toast.success('Generated drafts for 3 platforms');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate drafts';
      toast.error(errorMsg);
      setDrafts(d => d.map(d => ({ ...d, status: 'error', error: errorMsg })));
    } finally {
      setIsGenerating(false);
    }
  };

  const updateDraft = (platform: PlatformType, content: string) => {
    setDrafts(d => d.map(item =>
      item.platform === platform ? { ...item, content, characterCount: content.length } : item
    ));
  };

  const handlePublish = async () => {
    if (!postId) return;

    const readyDrafts = drafts.filter(d => d.status === 'ready');
    if (readyDrafts.length === 0) {
      toast.error('No drafts ready to publish');
      return;
    }

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postId, workspaceId: profile?.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorData = data as { error?: string; code?: string };
        if (res.status === 403) {
          setPlanError(errorData.error || 'Your current plan does not allow publishing.');
          return;
        }
        throw new Error(data.error || 'Publish failed');
      }

      toast.success('Published successfully!');

      const results = (data as AdaptResponse).results;
      if (results) {
        for (const [platform, result] of Object.entries(results)) {
          if (result.success) {
            toast.success(`${platform}: Published`, { description: result.platformUrl });
          } else {
            toast.error(`${platform}: Failed`, { description: result.error });
          }
        }
      }

      window.location.href = `/dashboard/publish?postId=${postId}`;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Publish failed';
      toast.error(errorMsg);
    }
  };

  const handleDirectBroadcast = async () => {
    if (!quickContent.trim() || !profile) {
      toast.error('Please complete your profile first');
      return;
    }

    setPlanError(null);
    setIsBroadcasting(true);

    try {
      const res = await fetch('/api/composer/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: quickContent, profileId: profile.id, mediaUrl: media?.url, mediaType: media?.type }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorData = data as { error?: string; code?: string };
        if (res.status === 403) {
          setPlanError(errorData.error || 'Your current plan does not allow publishing.');
          return;
        }
        throw new Error(data.error || 'Broadcast failed');
      }

      toast.success('Broadcast published successfully!');

      const results = data.results;
      if (results) {
        for (const [platform, result] of Object.entries(results)) {
          if ((result as any).success) {
            toast.success(`${platform}: Published`);
          } else {
            toast.error(`${platform}: Failed`, { description: (result as any).error });
          }
        }
      }

      setQuickContent('');
      window.location.href = `/dashboard/publish?postId=${data.postId}`;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Broadcast failed';
      toast.error(errorMsg);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const readyCount = drafts.filter(d => d.status === 'ready').length;

  return (
    <Box className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="pb-4 border-b border-border">
        <Display size="xl" weight="bold">Composer</Display>
        <Text size="sm" color="muted" className="mt-1">
          Write once. AI adapts. You review. One click publishes everywhere.
        </Text>
      </div>

      {/* Plan error banner */}
      <AnimatePresence>
        {planError && (
          <MotionBox key="plan-error" variant="slide-up">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Plan Limit Reached</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 mt-1">
                <span>{planError}</span>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" asChild>
                    <Link href="/dashboard/settings/billing">Upgrade Plan</Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPlanError(null)}>
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Profile context bar */}
      <AnimatePresence mode="wait">
        {profileLoading && (
          <MotionBox key="loading" variant="fade">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading profile...</span>
            </div>
          </MotionBox>
        )}
        {profile && !profileLoading && (
          <MotionBox key="profile" variant="slide-up">
            <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-200 truncate">
                  Using profile: <strong>{profile.name}</strong>
                  {profile.headline && (
                    <span className="text-green-700 dark:text-green-300 ml-1">— {profile.headline}</span>
                  )}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="flex-shrink-0 text-green-700 dark:text-green-300">
                <Link href="/dashboard/presence">Edit Profile</Link>
              </Button>
            </div>
          </MotionBox>
        )}
        {!profile && !profileLoading && (
          <MotionBox key="no-profile" variant="slide-up">
            <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  No profile found. Set up your profile to continue.
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/dashboard/presence">Set Up Profile</Link>
              </Button>
            </div>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Mode toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-border bg-muted/50 p-1 gap-1">
          <button
            onClick={() => setMode('ai')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              mode === 'ai'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="w-4 h-4" />
            AI Composer
          </button>
          <button
            onClick={() => setMode('quick')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              mode === 'quick'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Zap className="w-4 h-4" />
            Quick Broadcast
          </button>
        </div>
      </div>

      {/* Quick Broadcast */}
      {mode === 'quick' && (
        <MotionBox variant="slide-up" delay={0.05}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-primary" />
                Quick Broadcast
              </CardTitle>
              <Text size="sm" color="muted">
                Publish identical content to all connected platforms instantly — no AI adaptation.
              </Text>
            </CardHeader>
            <CardContent 
              className={cn("space-y-4 transition-colors", isDragging && "bg-muted/50 rounded-lg")}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Textarea
                placeholder="What do you want to share? Drag and drop an image here, or type your exact text."
                value={quickContent}
                onChange={e => setQuickContent(e.target.value)}
                className={cn("min-h-[140px] resize-none", isDragging && "bg-transparent border-dashed border-primary")}
                rows={6}
              />
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className={cn(
                  'text-sm tabular-nums',
                  quickContent.length > 280 ? 'text-destructive font-medium' : 'text-muted-foreground'
                )}>
                  {quickContent.length} characters
                  {quickContent.length > 280 && ' · exceeds X/Twitter limit (280)'}
                </span>
                <Button
                  onClick={handleDirectBroadcast}
                  disabled={isBroadcasting || !quickContent.trim() || !profile}
                >
                  {isBroadcasting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Publish to All Platforms
                    </>
                  )}
                </Button>
              </div>
              
              {/* Media Upload (Quick Broadcast) */}
              <div className="pt-2">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="media-upload-quick"
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('media-upload-quick')?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                    Add Media
                  </Button>
                  {media && (
                    <div className="relative inline-block">
                      {media.type === 'video' ? (
                        <video src={media.url} className="h-16 w-16 object-cover rounded-md border" muted />
                      ) : (
                        <img src={media.url} alt="Upload preview" className="h-16 w-16 object-cover rounded-md border" />
                      )}
                      <button
                        onClick={() => setMedia(null)}
                        className="absolute -top-2 -right-2 bg-background border rounded-full p-0.5 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionBox>
      )}

      {/* AI Composer */}
      {mode === 'ai' && (
        <>
          {/* Step 1 */}
          <MotionBox variant="slide-up" delay={0.05}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">1</span>
                  <CardTitle className="text-base">Write Your Idea</CardTitle>
                </div>
                <Text size="sm" color="muted">
                  Describe what you want to share. AI will adapt it perfectly for each platform.
                </Text>
              </CardHeader>
              <CardContent 
                className={cn("space-y-4 transition-colors", isDragging && "bg-muted/50 rounded-lg")}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Textarea
                  placeholder="e.g. 'Just launched v2 of our product...' (Drag and drop media here to attach it!)"
                  value={sourceContent}
                  onChange={e => setSourceContent(e.target.value)}
                  className={cn("min-h-[140px] resize-none", isDragging && "bg-transparent border-dashed border-primary")}
                  rows={6}
                />
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {sourceContent.length} characters
                  </span>
                  <Button
                    onClick={generateDrafts}
                    disabled={isGenerating || !sourceContent.trim() || !profile}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adapting for 3 platforms...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Platform Drafts
                      </>
                    )}
                  </Button>
                </div>

                {/* Media Upload (AI Composer) */}
                <div className="pt-2">
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="media-upload-ai"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('media-upload-ai')?.click()} disabled={isUploading}>
                      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                      Add Media
                    </Button>
                    {media && (
                      <div className="relative inline-block">
                        {media.type === 'video' ? (
                          <video src={media.url} className="h-16 w-16 object-cover rounded-md border" muted />
                        ) : (
                          <img src={media.url} alt="Upload preview" className="h-16 w-16 object-cover rounded-md border" />
                        )}
                        <button
                          onClick={() => setMedia(null)}
                          className="absolute -top-2 -right-2 bg-background border rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionBox>

          {/* Step 2 — Platform Drafts */}
          <AnimatePresence mode="wait">
            {drafts.some(d => d.status !== 'idle') && (
              <MotionBox key="drafts" variant="slide-up" delay={0.1}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">2</span>
                        <CardTitle className="text-base">Review & Edit Drafts</CardTitle>
                      </div>
                      {readyCount > 0 && (
                        <Badge variant="secondary" className="text-xs">{readyCount} of 3 ready</Badge>
                      )}
                    </div>
                    <Text size="sm" color="muted">
                      Each platform draft is independently editable. Tweak before publishing.
                    </Text>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as PlatformType)}>
                      <TabsList className="w-full mb-4">
                        {(['linkedin', 'x', 'threads'] as const).map(platform => {
                          const cfg = PLATFORM_CONFIG[platform];
                          const draft = drafts.find(d => d.platform === platform);
                          const Icon = cfg.icon;
                          return (
                            <TabsTrigger key={platform} value={platform} className="flex-1 flex items-center justify-center gap-1.5">
                              <span className={cn('p-1 rounded-md text-white', cfg.color)}>
                                <Icon className="w-3 h-3" />
                              </span>
                              <span className="hidden sm:inline text-xs font-medium">{cfg.name}</span>
                              {draft?.status === 'generating' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                              {draft?.status === 'ready' && <CheckCircle className="h-3 w-3 text-green-500" />}
                              {draft?.status === 'error' && <X className="h-3 w-3 text-destructive" />}
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>

                      {(['linkedin', 'x', 'threads'] as PlatformType[]).map(platform => {
                        const cfg = PLATFORM_CONFIG[platform];
                        const draft = drafts.find(d => d.platform === platform);
                        const isOverLimit = draft && draft.characterCount > cfg.maxChars;

                        return (
                          <TabsContent key={platform} value={platform} className="space-y-3 mt-0">
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={springConfig}
                            >
                              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={cn('p-1.5 rounded-lg text-white', cfg.color)}>
                                    <cfg.icon className="h-4 w-4" />
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold leading-tight">{cfg.name}</p>
                                    <p className={cn(
                                      'text-xs tabular-nums',
                                      isOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground'
                                    )}>
                                      {draft?.characterCount ?? 0} / {cfg.maxChars} chars
                                      {draft && draft.hashtags.length > 0 && ` · ${draft.hashtags.length} hashtags`}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  {draft?.status === 'generating' && <Badge variant="secondary">Generating…</Badge>}
                                  {draft?.status === 'ready' && (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200">
                                      Ready
                                    </Badge>
                                  )}
                                  {draft?.status === 'error' && <Badge variant="destructive">Error</Badge>}
                                </div>
                              </div>

                              {draft?.error && (
                                <Alert variant="destructive" className="mb-3">
                                  <AlertDescription>{draft.error}</AlertDescription>
                                </Alert>
                              )}

                              <Textarea
                                value={draft?.content ?? ''}
                                onChange={e => updateDraft(platform, e.target.value)}
                                className={cn(
                                  'min-h-[160px] resize-none font-mono text-sm',
                                  isOverLimit && 'border-destructive focus-visible:ring-destructive'
                                )}
                                rows={7}
                                disabled={draft?.status !== 'ready'}
                                placeholder={
                                  draft?.status === 'generating' ? 'Generating your draft…' :
                                  draft?.status === 'idle' ? 'Click "Generate Platform Drafts" to start' :
                                  'Your adapted content will appear here'
                                }
                              />

                              {isOverLimit && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                  <X className="h-3 w-3" />
                                  {draft!.characterCount - cfg.maxChars} characters over the {cfg.name} limit — please trim
                                </p>
                              )}

                              {draft && draft.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {draft.hashtags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                  ))}
                                </div>
                              )}

                              {draft?.firstCommentHint && (
                                <div className="mt-2 p-3 bg-muted/60 rounded-lg text-xs">
                                  <span className="font-semibold text-foreground">First comment idea: </span>
                                  <span className="text-muted-foreground">{draft.firstCommentHint}</span>
                                </div>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={generateDrafts}
                                disabled={isGenerating || draft?.status === 'generating'}
                                className="mt-1 text-xs h-7"
                              >
                                <RefreshCw className="mr-1 h-3 w-3" />
                                Regenerate all drafts
                              </Button>
                            </motion.div>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  </CardContent>
                </Card>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Step 3 — Publish bar */}
          <AnimatePresence mode="wait">
            {readyCount > 0 && (
              <MotionBox key="publish" variant="slide-up" delay={0.1}>
                <div className="flex items-center justify-between flex-wrap gap-4 px-5 py-4 rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800 dark:text-green-200">Ready to Publish</p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        {readyCount} platform draft{readyCount > 1 ? 's' : ''} reviewed and ready
                      </p>
                    </div>
                  </div>
                  <Button onClick={handlePublish} disabled={isGenerating}>
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Publish All
                  </Button>
                </div>
              </MotionBox>
            )}
          </AnimatePresence>
        </>
      )}
    </Box>
  );
}

export default function ComposerClientWrapper({ userId, workspaceId }: ComposerClientProps) {
  return (
    <Suspense fallback={
      <Box className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="pb-4 border-b border-border">
          <Display size="xl" weight="bold">Composer</Display>
          <Text size="sm" color="muted" className="mt-1">Write once. AI adapts. You review. One click publishes everywhere.</Text>
        </div>
        <Card>
          <CardContent className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </Box>
    }>
      <ComposerClient userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}
