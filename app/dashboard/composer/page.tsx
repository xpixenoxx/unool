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
import { CheckCircle, Loader2, Sparkles, Send, X, Linkedin, Twitter, MessageSquare, ArrowRight, Zap, Shield, Edit2, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Box, Flex, Text, Display } from '@/components/ui/layout';
import { MotionBox, spring, stagger } from '@/components/ui/motion';
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

export default function ComposerPage() {
  const reducedMotion = useReducedMotion();
  const [sourceContent, setSourceContent] = useState('');
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
  const springConfig: Transition = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.snappy;

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
      // Ignore - profile might not exist yet
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

    setIsGenerating(true);
    setDrafts(d => d.map(d => ({ ...d, status: 'generating' })));

    try {
      const res = await fetch('/api/composer/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: sourceContent, profileId: profile.id }),
      });

      const data: AdaptResponse = await res.json();

      if (!res.ok) {
        const errorData = data as { error?: string };
        throw new Error(errorData.error || 'Failed to generate drafts');
      }

      setPostId(data.postId);

      const platforms: PlatformType[] = ['linkedin', 'x', 'threads'];
      setDrafts(platforms.map(platform => {
        const result = data.variants[platform];
        return {
          platform,
          content: result.content,
          characterCount: result.characterCount,
          hashtags: result.hashtags,
          firstCommentHint: result.firstCommentHint,
          status: 'ready' as const,
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

  return (
    <Box className="space-y-8 max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <Flex between wrap gap={4}>
        <Box>
          <Display size="xl" weight="bold">Composer</Display>
          <Text size="lg" color="muted">Write once. AI adapts. You review. One click publishes everywhere.</Text>
        </Box>
        <Button
          onClick={handlePublish}
          disabled={isGenerating || !postId || !drafts.some(d => d.status === 'ready')}
          size="lg"
        >
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Publish All
        </Button>
      </Flex>

      {/* Profile Context */}
      <AnimatePresence mode="wait">
        {profileLoading && (
          <MotionBox key="loading" variant="fade">
            <Text size="sm" color="muted">Loading profile...</Text>
          </MotionBox>
        )}
        {profile && !profileLoading && (
          <MotionBox key="profile" variant="slide-up">
            <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
              <CardContent>
                <Flex center gap={3} wrap className="py-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <Text size="sm" color="green-800 dark:text-green-200" className="flex-1">
                    Using profile: <strong>{profile.name}</strong> — {profile.headline}
                  </Text>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/presence">Edit Profile</Link>
                  </Button>
                </Flex>
              </CardContent>
            </Card>
          </MotionBox>
        )}
        {!profile && !profileLoading && (
          <MotionBox key="no-profile" variant="slide-up">
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20">
              <CardContent>
                <Flex center gap={3} wrap className="py-2">
                  <Text size="sm" color="yellow-800 dark:text-yellow-200" className="flex-1">
                    No profile found. Complete your profile in the{' '}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/presence">Presence</Link>
                    </Button>{' '}
                    tab first.
                  </Text>
                </Flex>
              </CardContent>
            </Card>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Step 1: Source Input */}
      <MotionBox variant="slide-up" delay={0.1}>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Step 1: Write Your Idea
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What do you want to share? e.g., 'Just launched v2 of our product with new AI features...'"
              value={sourceContent}
              onChange={e => setSourceContent(e.target.value)}
              className="min-h-[120px]"
              rows={4}
            />
            <Text size="sm" color="muted">{sourceContent.length} characters</Text>
            <Button
              onClick={generateDrafts}
              disabled={isGenerating || !sourceContent.trim() || !profile}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adapting for 3 Platforms...
                </>
              ) : (
                'Generate Platform Drafts'
              )}
            </Button>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Step 2: Platform Drafts */}
      <AnimatePresence mode="wait">
        {drafts.some(d => d.status !== 'idle') && (
          <MotionBox key="drafts" variant="slide-up" delay={0.15}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Step 2: Review & Edit ({drafts.filter(d => d.status === 'ready').length} ready)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as PlatformType)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    {(['linkedin', 'x', 'threads'] as const).map(platform => {
                      const config = PLATFORM_CONFIG[platform];
                      const draft = drafts.find(d => d.platform === platform);
                      const Icon = config.icon;
                      return (
                        <TabsTrigger key={platform} value={platform} className="flex items-center justify-center gap-2">
                          <span className={`p-1.5 rounded-lg ${config.color} text-white`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="text-sm font-medium">{config.name}</span>
                          {draft?.status === 'generating' && (
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          )}
                          {draft?.status === 'ready' && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                          {draft?.status === 'error' && (
                            <X className="h-3 w-3 text-destructive" />
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {(['linkedin', 'x', 'threads'] as PlatformType[]).map(platform => {
                    const config = PLATFORM_CONFIG[platform];
                    const draft = drafts.find(d => d.platform === platform);
                    const Icon = config.icon;
                    const isOverLimit = draft && draft.characterCount > config.maxChars;

                    return (
                      <TabsContent key={platform} value={platform} className="mt-4 space-y-4">
                        <motion.div
                          className="border rounded-xl p-4 bg-card"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={springConfig}
                        >
                          <Flex between wrap gap={2} className="mb-4">
                            <Flex center gap={3}>
                              <span className={`p-2 rounded-lg ${config.color} text-white`}>
                                <Icon className="h-5 w-5" />
                              </span>
                              <Box>
                                <Text weight="semibold">{config.name}</Text>
                                <Text size="sm" color="muted">
                                  {draft?.characterCount ?? 0}/{config.maxChars} characters
                                  {draft && draft.hashtags.length > 0 && ` • ${draft.hashtags.length} hashtags`}
                                </Text>
                              </Box>
                            </Flex>
                            <Flex center gap={2}>
                              {draft && (
                                <>
                                  {draft.status === 'generating' && <Badge variant="secondary">Generating...</Badge>}
                                  {draft.status === 'ready' && <Badge variant="default">Ready</Badge>}
                                  {draft.status === 'error' && <Badge variant="destructive">Error</Badge>}
                                </>
                              )}
                            </Flex>
                          </Flex>

                          {draft?.error && (
                            <Alert variant="destructive" className="mb-4">
                              <AlertDescription>{draft.error}</AlertDescription>
                            </Alert>
                          )}

                          <Textarea
                            value={draft?.content ?? ''}
                            onChange={e => updateDraft(platform, e.target.value)}
                            className={cn('min-h-[120px]', isOverLimit && 'border-destructive')}
                            rows={5}
                            disabled={draft?.status !== 'ready'}
                            placeholder={
                              draft?.status === 'generating' ? 'Generating...' :
                              draft?.status === 'idle' ? 'Generate drafts first' :
                              'Your adapted content will appear here'
                            }
                          />

                          {draft && isOverLimit && (
                            <Text size="sm" color="destructive" className="mt-2 flex items-center gap-1">
                              <X className="h-3 w-3" />
                              Over character limit by {draft.characterCount - config.maxChars} characters
                            </Text>
                          )}

                          {draft && draft.hashtags.length > 0 && (
                            <Flex wrap gap={1} className="mt-3">
                              {draft.hashtags.map(tag => (
                                <Badge key={tag} variant="outline">{tag}</Badge>
                              ))}
                            </Flex>
                          )}

                          {draft && draft.firstCommentHint && (
                            <Box className="mt-3 p-3 bg-muted rounded-lg text-sm">
                              <Text weight="semibold">First comment hint:</Text>{' '}
                              {draft.firstCommentHint}
                            </Box>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={generateDrafts}
                            disabled={draft?.status !== 'ready'}
                            className="mt-2 w-full sm:w-auto"
                          >
                            <Sparkles className="mr-1 h-3 w-3" />
                            Regenerate
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

      {/* Step 3: Publish */}
      <AnimatePresence mode="wait">
        {drafts.some(d => d.status === 'ready') && (
          <MotionBox key="publish" variant="slide-up" delay={0.2}>
            <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
              <CardContent className="pt-6">
                <Flex between wrap gap={4}>
                  <Flex center gap={3}>
                    <Box className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </Box>
                    <Box>
                      <Text weight="semibold" color="green-800 dark:text-green-200">Ready to Publish</Text>
                      <Text size="sm" color="green-700 dark:text-green-300">
                        {drafts.filter(d => d.status === 'ready').length} platform drafts reviewed and ready
                      </Text>
                    </Box>
                  </Flex>
                  <Button size="lg" onClick={handlePublish} disabled={isGenerating} className="w-full sm:w-auto">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Publish All
                  </Button>
                </Flex>
              </CardContent>
            </Card>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}