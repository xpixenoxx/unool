'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Transition } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Send,
  X,
  Linkedin,
  Twitter,
  MessageSquare,
  Facebook,
  MessageCircle,
  Instagram,
  Youtube,
  Image as ImageIcon,
  Cloud,
  Zap,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  ImagePlus,
  FileText,
  Heart,
  MessageCircle as CommentIcon,
  Repeat2,
  Share,
  Bookmark,
  BookmarkPlus,
  MoreHorizontal,
  ThumbsUp,
  Globe,
  Hash,
  Twitch,
  Dribbble,
  GraduationCap,
  Store,
  Gamepad2,
  Video,
  Mail,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  Home,
  Layers,
  Grid,
  X as XIcon,
  Bell,
  Settings,
  Search,
  Camera,
  Mic,
  MessageSquare as MessageSquareIcon,
  BookOpen,
  Users,
  Compass,
  Plus,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Flag,
  Copy,
  ExternalLink,
  RefreshCw as RefreshIcon,
  Briefcase,
  Play,
  Menu,
  Phone,
  Share2,
  Lightbulb,
  Radio,
  Sparkles,
  PenTool,
  Edit3,
  ArrowLeft,
  Trash2,
  Ticket,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { studioToast } from '@/components/dashboard/StudioToast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Box, Flex, Text, Display } from '@/components/ui/layout';
import { MotionBox, spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn, formatPlatformError } from '@/lib/utils';
// Note: Supabase browser client no longer needed for storage (using Cloudflare R2 via presigned PUT)
import { useUserContext } from '@/lib/hooks/use-user-context';
import { PLATFORM_LIMITS, getPlatformLimit } from '@/lib/config/platformLimits';
import { emitSignalStrip } from '../signal/SignalStrip';
import {
  PlatformMobilePreview,
  isPlatformDark,
  getPlatformBgColor,
  type SupportedPlatformType,
  PlatformBrandLogo,
} from '@/components/dashboard/previews/PlatformMobilePreview';
import { PlatformSVGs } from '@/components/dashboard/PlatformLogos';
import { HashtagEditor } from '@/components/dashboard/HashtagEditor';
import { StudioIdeaGenerator } from '@/components/dashboard/StudioIdeaGenerator';
import PostBrandMaterialsCard from '@/components/dashboard/PostBrandMaterialsCard';
import type { PlatformType, PlatformDraft, AdaptedPost, AdaptResponse, Profile, ComposerClientProps } from './types';
import { PLATFORM_CONFIG } from '@/lib/config/platformConfig';
import { useFeatureFlags } from '@/lib/hooks/use-feature-flags';



import { BrandIcons } from './BrandIcons';

/* ─────────────────────────────────────────────────────────────
   iPhone 16 Pro Live Mobile Preview Component
   ───────────────────────────────────────────────────────────── */

import { IPhonePreview, type IPhonePreviewProps } from './IPhonePreview';

/* ─────────────────────────────────────────────────────────────
   Main Composer Client
   ───────────────────────────────────────────────────────────── */

// ── In-Memory SWR Cache for 0ms Route Switching ──────────────────
let memoryComposerProfile: Profile | null = null;
let memoryComposerConnections: PlatformType[] | null = null;

export function ComposerClient({ userId, workspaceId }: ComposerClientProps) {
  const { flags: featureFlags } = useFeatureFlags();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlMode = searchParams?.get('mode') || null;
  const targetPostId = searchParams?.get('postId') || null;
  const hasLoadedTargetPost = useRef<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const reducedMotion = useReducedMotion();
  const { user, profile: userCtxProfile } = useUserContext();
  const [sourceContent, setSourceContent] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [mode, setMode] = useState<'ai' | 'quick'>(() => {
    if (urlMode === 'quick') return 'quick';
    return 'ai';
  });

  useEffect(() => {
    if (urlMode === 'quick') {
      setMode('quick');
    } else if (urlMode === 'ai') {
      setMode('ai');
    }
  }, [urlMode]);
  const [broadcastingType, setBroadcastingType] = useState<'selected' | 'all' | null>(null);
  const isBroadcasting = broadcastingType !== null;
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [generatingType, setGeneratingType] = useState<'selected' | 'all' | null>(null);
  const isGenerating = generatingType !== null;
  const [isPublishing, setIsPublishing] = useState(false);
  const reviewSectionRef = useRef<HTMLDivElement | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PlatformType>('linkedin');
  const [profile, setProfile] = useState<Profile | null>(() => memoryComposerProfile);
  const [profileLoading, setProfileLoading] = useState(() => !memoryComposerProfile);
  const [planError, setPlanError] = useState<string | null>(null);
  const [media, setMedia] = useState<{url: string; type: 'image' | 'video' | 'document'; sizeInBytes?: number}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformType[]>(() => memoryComposerConnections || []);
  const [connectionsLoading, setConnectionsLoading] = useState<boolean>(() => memoryComposerConnections === null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([]);
  const [previewPlatform, setPreviewPlatform] = useState<PlatformType>('linkedin');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [scheduleStrategy, setScheduleStrategy] = useState<'cascading' | 'simultaneous'>('cascading');
  const [isSchedulingPost, setIsSchedulingPost] = useState(false);

  // ── Auto-Fit Mobile Preview Scaling (Fits screen without scrolling) ──
  const [effectiveScale, setEffectiveScale] = useState<number>(0.74);

  useEffect(() => {
    const calculateFit = () => {
      if (typeof window === 'undefined') return;
      // Viewport height minus header & composer top offsets (~230px)
      const available = window.innerHeight - 230;
      const fit = Math.max(0.60, Math.min(0.78, Math.round((available / 660) * 100) / 100));
      setEffectiveScale(fit);
    };

    calculateFit();
    window.addEventListener('resize', calculateFit);
    return () => window.removeEventListener('resize', calculateFit);
  }, [featureFlags.automationEnabled]);
  // ── SignalDM automation badge state ─────────────────────────────────────────
  const [signalDmEnabled, setSignalDmEnabled] = useState(false);
  // ── Hook Scorer + Humanizer state ───────────────────────────────────────────
  const [hookScore, setHookScore] = useState<{ score: number; grade: string; suggestion: string | null; slopWords: string[] } | null>(null);
  const [humanizingPlatform, setHumanizingPlatform] = useState<PlatformType | null>(null);
  const [isHumanizingAll, setIsHumanizingAll] = useState(false);
  const [personalizeWithProfile, setPersonalizeWithProfile] = useState(true);
  const [isIdeaGeneratorOpen, setIsIdeaGeneratorOpen] = useState(false);
  const [attachedBrandSlug, setAttachedBrandSlug] = useState<string | null>(null);
  const [attachedBrandUrl, setAttachedBrandUrl] = useState<string | null>(null);
  const springConfig: Transition = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.snappy;

  // ── Auto-load draft if targetPostId is passed in URL ─────────────────────────
  useEffect(() => {
    if (!targetPostId || hasLoadedTargetPost.current === targetPostId) return;

    let isMounted = true;
    async function fetchTargetDraft() {
      try {
        const res = await fetch(`/api/publish/${targetPostId}`, { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 404) {
            studioToast.error('Draft not found');
          }
          return;
        }
        const data = await res.json();
        if (!isMounted || !data?.post) return;

        hasLoadedTargetPost.current = targetPostId;
        const targetPost = data.post;
        const variants = data.variants || [];

        // Check whether post originated from direct-broadcast (Quick Broadcast) or AI Composer
        const isQuick = urlMode === 'quick' || targetPost.origin === 'quick-broadcast' || targetPost.adaptationPromptVersion === 'direct-broadcast';

        setPostId(targetPost.id);

        // Normalize media if present across any variants
        const collectedMedia: { url: string; type: 'image' | 'video' | 'document'; sizeInBytes?: number }[] = [];
        for (const v of variants) {
          if (Array.isArray(v.mediaUrls)) {
            for (const m of v.mediaUrls) {
              if (m?.url && !collectedMedia.some(existing => existing.url === m.url)) {
                collectedMedia.push({
                  url: m.url,
                  type: (m.type || (/\.(mp4|mov|webm)$/i.test(m.url) ? 'video' : /\.(pdf|ppt|pptx)$/i.test(m.url) ? 'document' : 'image')) as any,
                });
              }
            }
          }
        }
        if (collectedMedia.length > 0) {
          setMedia(collectedMedia);
        }

        // Set selected platforms from variants (deduplicated)
        const postPlatforms: PlatformType[] = Array.from(new Set<PlatformType>(variants.map((v: any) => v.platform as PlatformType)));
        if (postPlatforms.length > 0) {
          setSelectedPlatforms(postPlatforms);
        }

        if (isQuick) {
          setMode('quick');
          setQuickContent(targetPost.content || '');
          studioToast.info('Loaded draft into Quick Broadcast');
        } else {
          setMode('ai');
          setSourceContent(targetPost.content || '');

          // Deduplicate variants by platform in case DB has multiple variant records for the same platform
          const seenPlatforms = new Set<string>();
          const uniqueVariants = variants.filter((v: any) => {
            if (seenPlatforms.has(v.platform)) return false;
            seenPlatforms.add(v.platform);
            return true;
          });

          const loadedDrafts: PlatformDraft[] = uniqueVariants.map((v: any) => ({
            platform: v.platform as PlatformType,
            content: v.adaptedContent || '',
            characterCount: typeof v.characterCount === 'number' ? v.characterCount : (v.adaptedContent || '').length,
            hashtags: Array.isArray(v.hashtagStrategy) ? v.hashtagStrategy : [],
            firstCommentHint: v.firstCommentHint || undefined,
            status: (v.status === 'failed' ? 'error' : 'ready') as 'ready' | 'error',
            error: v.status === 'failed' ? formatPlatformError(v.error?.message) : undefined,
          }));

          setDrafts(loadedDrafts);
          if (loadedDrafts.length > 0) {
            setActiveTab(loadedDrafts[0].platform);
            setPreviewPlatform(loadedDrafts[0].platform);
            setTimeout(() => {
              reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 250);
          }
          studioToast.info('Loaded draft into AI Composer');
        }
      } catch (err) {
        console.error('Failed to load target draft into composer:', err);
      }
    }

    fetchTargetDraft();

    return () => {
      isMounted = false;
    };
  }, [targetPostId, urlMode]);
  

  // ── Save post as draft in Signal and clear composer to start fresh ─────────
  const handleSaveDraftAndClear = async () => {
    const currentContent = mode === 'quick' ? quickContent : sourceContent;
    const hasAnyContent = Boolean(currentContent.trim() || drafts.length > 0 || media.length > 0);

    if (!hasAnyContent && !postId) {
      setPostId(null);
      setSourceContent('');
      setQuickContent('');
      setDrafts([]);
      setMedia([]);
      hasLoadedTargetPost.current = null;
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/dashboard/studio');
      }
      studioToast.info('Composer cleared');
      return;
    }

    setIsSavingDraft(true);
    try {
      const res = await fetch('/api/composer/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          postId: postId || undefined,
          content: currentContent || (drafts[0]?.content ?? ''),
          mode,
          drafts: drafts.filter(d => d.status === 'ready' || d.status === 'idle').map(d => ({
            platform: d.platform,
            content: d.content,
            hashtags: d.hashtags,
            firstCommentHint: d.firstCommentHint,
          })),
          mediaItems: media,
          selectedPlatforms,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save draft');
      }

      studioToast.success('Saved as draft in Signal! Composer ready for your next post.');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('signal-posts-updated'));
      }

      // Clear post details right away so the user can create a new post
      setPostId(null);
      setSourceContent('');
      setQuickContent('');
      setDrafts([]);
      setMedia([]);
      hasLoadedTargetPost.current = null;
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/dashboard/studio');
      }
    } catch (err) {
      studioToast.error(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // ── Effective Studio Profile for AI ideas & persona ─────────────────────────
  const effectiveStudioProfile = useMemo(() => {
    if (profile?.studioProfile && profile.studioProfile.role) {
      return profile.studioProfile;
    }
    const role = profile?.role || (profile?.onboardingAnswers as any)?.persona || 'Founder & Creator';
    const domain = profile?.company || profile?.headline || 'Product & Tech';
    return {
      role,
      businessStage: 'Building & Growing',
      businessDomain: domain,
      doing: profile?.headline || `Building and scaling in ${domain}`,
      workInterests: 'Product development, engineering, growth, leadership',
      audience: 'Builders, founders, creators, and professionals',
      tone: 'Authentic, punchy, conversational',
      completedAt: new Date().toISOString(),
    };
  }, [profile]);

  // ── Debounced hook scorer ────────────────────────────────────────────────────
  // Runs 600ms after the user stops typing, no AI call — pure deterministic.
  useEffect(() => {
    if (!sourceContent.trim()) { setHookScore(null); return; }
    const timer = setTimeout(async () => {
      try {
        const firstLine = sourceContent.split('\n')[0]?.trim() ?? '';
        if (!firstLine) return;
        const res = await fetch('/api/composer/hook-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hooks: [firstLine], platform: previewPlatform }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const top = data.ranked?.[0];
        if (top) {
          setHookScore({
            score: top.breakdown.totalScore,
            grade: top.breakdown.grade,
            suggestion: top.suggestions?.[0] ?? null,
            slopWords: top.breakdown.slopWords ?? [],
          });
        }
      } catch { /* silent — non-critical */ }
    }, 600);
    return () => clearTimeout(timer);
  }, [sourceContent, previewPlatform]);

  // ── One-click humanizer ──────────────────────────────────────────────────────
  const handleHumanizeDraft = useCallback(async (platform: PlatformType) => {
    const targetDraft = drafts.find(d => d.platform === platform);
    if (!targetDraft || !targetDraft.content.trim()) return;

    setHumanizingPlatform(platform);
    try {
      const res = await fetch('/api/composer/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: targetDraft.content, platform }),
      });
      const data = await res.json();
      if (data.humanized) {
        updateDraft(platform, data.humanized);
        const platformName = PLATFORM_CONFIG[platform]?.name || platform;
        if (data.changeCount > 0) {
          studioToast.success(`De-slopped ${platformName}: Rewritten in human expert voice · Score ${data.panelScore}/100`, { platforms: [platform] });
        } else {
          studioToast.info(`${platformName} draft is already clean · Score ${data.panelScore}/100`, { platforms: [platform] });
        }
      }
    } catch {
      studioToast.error('Failed to de-slop draft');
    } finally {
      setHumanizingPlatform(null);
    }
  }, [drafts]);

  const handleHumanizeAllDrafts = useCallback(async () => {
    const readyDrafts = drafts.filter(d => d.status === 'ready' && d.content.trim());
    if (readyDrafts.length === 0) return;

    setIsHumanizingAll(true);
    let totalChanges = 0;
    try {
      await Promise.all(
        readyDrafts.map(async (d) => {
          try {
            const res = await fetch('/api/composer/humanize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ content: d.content, platform: d.platform }),
            });
            const data = await res.json();
            if (data.humanized) {
              updateDraft(d.platform, data.humanized);
              totalChanges += data.changeCount || 0;
            }
          } catch {
            // ignore individual failure
          }
        })
      );
      studioToast.success(`De-slopped all drafts: Rewritten in human expert voice across ${readyDrafts.length} platforms`, {
        platforms: readyDrafts.map(d => d.platform),
      });
    } catch {
      studioToast.error('Failed to de-slop all drafts');
    } finally {
      setIsHumanizingAll(false);
    }
  }, [drafts]);

  // Determine the live content for preview based on mode
  const liveContent = mode === 'ai'
    ? (drafts.find(d => d.platform === previewPlatform && d.status === 'ready')?.content || sourceContent)
    : quickContent;

  const loadConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/platform/connections', { credentials: 'include' });
      const data = await res.json();
      if (data.connections) {
        const active = Object.values(data.connections)
          .filter((c: any) => c.status === 'connected')
          .map((c: any) => c.platform as PlatformType)
          // Only include platforms that have an AI adaptation spec in the composer
          .filter((p: PlatformType) => p in PLATFORM_CONFIG);
        memoryComposerConnections = active;
        setConnectedPlatforms(active);
        setSelectedPlatforms(prev => prev.filter(p => active.includes(p)));
        if (active.length > 0) {
          setPreviewPlatform(prev => (active.includes(prev) ? prev : active[0]));
          setActiveTab(prev => (active.includes(prev) ? prev : active[0]));
        }
      } else {
        memoryComposerConnections = [];
        setConnectedPlatforms([]);
        setSelectedPlatforms([]);
      }
    } catch {
      // Ignore
    } finally {
      setConnectionsLoading(false);
    }
  }, [featureFlags.automationEnabled]);

  const togglePlatform = (platform: PlatformType) => {
    if (!connectedPlatforms.includes(platform)) return;
    setSelectedPlatforms(prev => {
      const willSelect = !prev.includes(platform);
      if (willSelect) {
        setPreviewPlatform(platform);
        return [...prev, platform];
      }
      return prev.filter(p => p !== platform);
    });
  };

  const processFiles = async (files: File[]) => {
    let currentImages = media.filter(m => m.type === 'image').length;
    let currentVideos = media.filter(m => m.type === 'video').length;
    let currentPdfs = media.filter(m => m.type === 'document').length;

    const validFilesToUpload: File[] = [];

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isVideo && !isPdf) {
        studioToast.error(`${file.name}: Only image, video, and PDF files are supported`);
        continue;
      }

      if (isImage) {
        if (currentImages >= 5) {
          studioToast.error(`Cannot add ${file.name}: You can only upload up to 5 images`);
          continue;
        }
        currentImages++;
      } else if (isVideo) {
        if (currentVideos >= 1) {
          studioToast.error(`Cannot add ${file.name}: You can only upload up to 1 video`);
          continue;
        }
        currentVideos++;
      } else if (isPdf) {
        if (currentPdfs >= 1) {
          studioToast.error(`Cannot add ${file.name}: You can only upload up to 1 PDF`);
          continue;
        }
        currentPdfs++;
      }

      const sizeLimitMB = isVideo ? 5000 : isPdf ? 50 : 10; // Allow large video uploads generally
      if (file.size > sizeLimitMB * 1024 * 1024) {
        studioToast.error(`${file.name}: File must be less than ${sizeLimitMB}MB`);
        continue;
      }

      validFilesToUpload.push(file);
    }

    if (validFilesToUpload.length === 0) return;

    setIsUploading(true);
    try {
      const newMediaItems: { url: string; type: 'image' | 'video' | 'document'; sizeInBytes?: number }[] = [];
      
      for (const file of validFilesToUpload) {
        // Step 1: Ask server to generate a presigned R2 PUT URL
        const res = await fetch('/api/composer/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        
        // Step 2: PUT the file directly to Cloudflare R2 using the presigned URL
        const uploadRes = await fetch(data.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed for ${file.name}: ${uploadRes.statusText}`);
        }
        
        newMediaItems.push({ url: data.url, type: data.type, sizeInBytes: file.size });
      }
      
      if (newMediaItems.length > 0) {
        setMedia(prev => [...prev, ...newMediaItems]);
        if (newMediaItems.length === 1) {
          const type = newMediaItems[0].type;
          studioToast.success(`${type === 'document' ? 'PDF document' : type === 'video' ? 'Video' : 'Image'} uploaded successfully`);
        } else {
          studioToast.success(`${newMediaItems.length} files uploaded successfully`);
        }
      }
    } catch (err) {
      studioToast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      e.preventDefault();
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.profile) {
        const loadedProf: Profile = {
          id: data.profile.id,
          name: data.profile.name || '',
          headline: data.profile.headline || '',
          bio: data.profile.bio || '',
          role: data.profile.role || '',
          company: data.profile.company || '',
          onboardingAnswers: data.profile.onboardingAnswers || null,
          studioProfile: data.profile.studioProfile || null,
        };
        memoryComposerProfile = loadedProf;
        setProfile(loadedProf);
      }
    } catch {
      // Ignore — profile might not exist yet
    } finally {
      setProfileLoading(false);
    }
  }, [featureFlags.automationEnabled]);

  useEffect(() => {
    loadProfile();
    loadConnections();

    const handleProfileUpdate = (e: any) => {
      const updatedStudioProfile = e?.detail;
      if (updatedStudioProfile) {
        setProfile((prev) => ({
          id: prev?.id || '',
          name: prev?.name || '',
          headline: prev?.headline || '',
          bio: prev?.bio || '',
          role: updatedStudioProfile.role || prev?.role || '',
          company: prev?.company || '',
          onboardingAnswers: {
            persona: updatedStudioProfile.role,
            focus: updatedStudioProfile.businessDomain || updatedStudioProfile.doing,
            audience: [updatedStudioProfile.audience],
            tone: [updatedStudioProfile.tone],
          },
          studioProfile: updatedStudioProfile,
        }));
      }
      loadProfile();
    };

    const handleFocus = () => {
      loadProfile();
      loadConnections();
    };

    window.addEventListener('studio-profile-updated', handleProfileUpdate);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('studio-profile-updated', handleProfileUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadProfile, loadConnections]);

  // ── Fetch SignalDM automation status (non-blocking, best-effort) ─────────────
  useEffect(() => {
    if (!featureFlags.automationEnabled) {
      setSignalDmEnabled(false);
      return;
    }
    const checkSignalDm = async () => {
      try {
        const res = await fetch(`/api/instagram/automation?workspaceId=${workspaceId}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setSignalDmEnabled(data?.enabled === true);
      } catch {
        // Non-critical — ignore
      }
    };
    checkSignalDm();
  }, [featureFlags.automationEnabled]);

  const getValidPlatformsForMedia = (platforms: PlatformType[]) => {
    return platforms.filter(platform => {
      const limit = getPlatformLimit(platform);
      if (limit.requiresMedia && media.length === 0) {
        return false;
      }
      for (const m of media) {
        if (!m.sizeInBytes) continue;
        if (m.type === 'video' && m.sizeInBytes > limit.maxVideoSizeMB * 1024 * 1024) return false;
        if (m.type === 'image' && m.sizeInBytes > limit.maxImageSizeMB * 1024 * 1024) return false;
      }
      return true;
    });
  };

  const generateDrafts = async (useSelectedOnly: boolean = false) => {
    if (!sourceContent.trim() || !profile) {
      studioToast.error('Please complete your profile first in the Presence tab');
      return;
    }

    // "Draft for All" generates for every connected platform.
    // "Draft for Selected" generates for only the user-checked platforms.
    if (useSelectedOnly && selectedPlatforms.length === 0) {
      studioToast.error('Please select at least one platform first.');
      return;
    }

    const targetPlatforms = (useSelectedOnly ? selectedPlatforms : connectedPlatforms)
      .filter(p => connectedPlatforms.includes(p));

    if (targetPlatforms.length === 0) {
      studioToast.error(
        useSelectedOnly
          ? 'Please select at least one connected platform.'
          : 'No connected platforms found. Please connect your accounts first.'
      );
      return;
    }

    const skippedPlatforms = targetPlatforms.filter(p => getPlatformLimit(p)?.requiresMedia && media.length === 0);
    if (skippedPlatforms.length > 0) {
      studioToast.info(
        `${skippedPlatforms.map(p => PLATFORM_CONFIG[p]?.name || p).join(', ')} require(s) an image/video to publish. Attach media to include them.`
      );
    }

    const platformsToUse = getValidPlatformsForMedia(targetPlatforms);
    if (platformsToUse.length === 0) {
      studioToast.generationFailed('No platforms selected or all selected platforms reject this media.', {
        platforms: targetPlatforms,
        knowMoreUrl: '/terms',
      });
      return;
    }

    setPlanError(null);
    setGeneratingType(useSelectedOnly ? 'selected' : 'all');
    // Pre-populate drafts for all requested platforms in 'generating' state
    setDrafts(platformsToUse.map(platform => ({
      platform,
      content: '',
      characterCount: 0,
      hashtags: [],
      status: 'generating' as const,
    })));
    setActiveTab(platformsToUse[0]);
    setPreviewPlatform(platformsToUse[0]);

    try {
      const res = await fetch('/api/composer/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          content: sourceContent, 
          profileId: profile.id, 
          mediaItems: media,
          selectedPlatforms: platformsToUse,
          disablePersonalization: !personalizeWithProfile,
          studioProfile: profile.studioProfile || null,
        }),
      });

      let data;
      const responseText = await res.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        if (!res.ok) {
          throw new Error(`Server error (${res.status}): The request took too long or failed unexpectedly.`);
        }
        throw new Error('Invalid response from server');
      }

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

      // Build drafts for ALL requested platforms — succeeded ones as 'ready', any that
      // were excluded by the API (failed on the server) as 'error' so they show in the UI.
      const succeededPlatforms = Object.keys(data.variants) as PlatformType[];
      const failedPlatforms = platformsToUse.filter(p => !succeededPlatforms.includes(p));

      const allDrafts = [
        ...succeededPlatforms.map(platform => {
          const result = data.variants[platform];
          return {
            platform,
            content: result?.content ?? '',
            characterCount: result?.characterCount ?? 0,
            hashtags: result?.hashtags ?? [],
            firstCommentHint: result?.firstCommentHint,
            status: 'ready' as const,
          };
        }),
        ...failedPlatforms.map(platform => ({
          platform,
          content: '',
          characterCount: 0,
          hashtags: [] as string[],
          firstCommentHint: undefined,
          status: 'error' as const,
          error: 'AI adaptation failed for this platform',
        })),
      ];

      if (allDrafts.length > 0) {
        setActiveTab(allDrafts[0].platform);
        setPreviewPlatform(allDrafts[0].platform);
      }
      setDrafts(allDrafts);

      // Auto-scroll to Review & Edit Drafts section so user immediately sees generated content
      setTimeout(() => {
        reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);

      if (failedPlatforms.length > 0) {
        studioToast.success(
          `Drafts ready for ${succeededPlatforms.length} platform${succeededPlatforms.length !== 1 ? 's' : ''}. ${failedPlatforms.length} failed — check the error tab${failedPlatforms.length !== 1 ? 's' : ''}.`,
          { platforms: succeededPlatforms }
        );
      } else {
        studioToast.success(
          `Generated drafts for all ${succeededPlatforms.length} platform${succeededPlatforms.length !== 1 ? 's' : ''}!`,
          { platforms: succeededPlatforms }
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate drafts';
      // Post isn't possible to generate: render bespoke popup with "Know more" symbol linking to /terms
      studioToast.generationFailed(errorMsg, {
        platforms: platformsToUse,
        knowMoreUrl: '/terms',
      });
      setDrafts(d => d.map(d => ({ ...d, status: 'error', error: errorMsg })));
    } finally {
      setGeneratingType(null);
    }
  };

  const retrySingleDraft = async (platform: PlatformType) => {
    if (!sourceContent.trim() || !profile) return;
    setDrafts(prev => prev.map(d => d.platform === platform ? { ...d, status: 'generating' as const, error: undefined } : d));
    try {
      const res = await fetch('/api/composer/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: sourceContent,
          profileId: profile.id,
          mediaItems: media,
          selectedPlatforms: [platform],
          postId,
          onboardingAnswers: profile.onboardingAnswers || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.variants?.[platform]) {
        throw new Error(data.error || 'Retry failed');
      }
      if (data.postId && !postId) {
        setPostId(data.postId);
      }
      const v = data.variants[platform];
      setDrafts(prev => prev.map(d => d.platform === platform ? {
        platform,
        content: v.content ?? '',
        characterCount: v.characterCount ?? 0,
        hashtags: v.hashtags ?? [],
        firstCommentHint: v.firstCommentHint,
        status: 'ready' as const,
      } : d));
      studioToast.success(`Generated draft for ${PLATFORM_CONFIG[platform]?.name || platform}!`, {
        platforms: [platform],
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Retry failed';
      setDrafts(prev => prev.map(d => d.platform === platform ? {
        ...d,
        status: 'error' as const,
        error: errorMsg,
      } : d));
      studioToast.generationFailed(`Retry failed for ${PLATFORM_CONFIG[platform]?.name || platform}: ${errorMsg}`, {
        platforms: [platform],
        knowMoreUrl: '/terms',
      });
    }
  };

  const updateDraft = (platform: PlatformType, content: string) => {
    setDrafts(d => d.map(item =>
      item.platform === platform ? { ...item, content, characterCount: content.length } : item
    ));
  };

  const addHashtag = (platform: PlatformType, rawTag: string) => {
    const tagsToAdd = rawTag
      .split(/[\s,]+/)
      .map(t => t.trim().replace(/^#+/, ''))
      .filter(Boolean)
      .map(t => `#${t}`);

    if (tagsToAdd.length === 0) return;

    setDrafts(prev => prev.map(item => {
      if (item.platform !== platform) return item;
      const current = item.hashtags || [];
      const lowerExisting = new Set(current.map(t => t.toLowerCase()));
      const uniqueNew = tagsToAdd.filter(t => !lowerExisting.has(t.toLowerCase()));
      if (uniqueNew.length === 0) return item;
      return {
        ...item,
        hashtags: [...current, ...uniqueNew],
      };
    }));
  };

  const removeHashtag = (platform: PlatformType, tagToRemove: string) => {
    setDrafts(prev => prev.map(item =>
      item.platform === platform
        ? { ...item, hashtags: (item.hashtags || []).filter(t => t !== tagToRemove) }
        : item
    ));
  };

  const handlePublish = async () => {
    if (!postId) return;

    const readyDrafts = drafts.filter(d => d.status === 'ready' && connectedPlatforms.includes(d.platform));
    if (readyDrafts.length === 0) {
      studioToast.error('No drafts ready to publish for your connected platforms');
      return;
    }

    if (postId) {
      studioToast.info(`Publishing draft directly across ${readyDrafts.length} platform${readyDrafts.length > 1 ? 's' : ''}...`);
    }

    setIsPublishing(true);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          postId,
          workspaceId,
          mediaItems: media,
          drafts: readyDrafts.map(d => ({
            platform: d.platform,
            content: d.content,
            hashtags: d.hashtags,
          })),
        }),
      });

      let data;
      const responseText = await res.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        if (!res.ok) {
          throw new Error(`Server error (${res.status}): The request took too long or failed unexpectedly.`);
        }
        throw new Error('Invalid response from server');
      }

      if (!res.ok) {
        const errorData = data as { error?: string; code?: string };
        if (res.status === 403) {
          setPlanError(errorData.error || 'Your current plan does not allow publishing.');
          return;
        }
        throw new Error(data.error || 'Publish failed');
      }

      studioToast.success('Published successfully!', {
        platforms: readyDrafts.map(d => d.platform),
      });

      const results = (data as AdaptResponse).results;
      if (results) {
        for (const [platform, result] of Object.entries(results)) {
          if (result.success) {
            studioToast.success(`${platform}: Published`, { description: result.platformUrl, platforms: [platform] });
          } else {
            studioToast.error(`${platform}: Failed`, { description: result.error, platforms: [platform] });
          }
        }
      }

      // Fire the SignalStrip with pending state so it monitors live publishing progress
      emitSignalStrip({
        postId,
        content: sourceContent,
        platforms: readyDrafts.map(d => ({
          platform: d.platform,
          status: 'pending',
        })),
      });

      // Clear drafts
      setDrafts([]);
      setSourceContent('');
      setPostId(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Publish failed';
      studioToast.error(errorMsg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleScheduleSubmit = async () => {
    const readyDrafts = drafts.filter(d => d.status === 'ready' && connectedPlatforms.includes(d.platform));
    if (readyDrafts.length === 0) {
      studioToast.error('No drafts ready to schedule for your connected platforms');
      return;
    }

    setIsSchedulingPost(true);
    try {
      const scheduledDateObj = new Date(scheduleDate);
      if (isNaN(scheduledDateObj.getTime()) || scheduledDateObj.getTime() <= Date.now()) {
        studioToast.error('Please choose a time in the future');
        setIsSchedulingPost(false);
        return;
      }

      const res = await fetch('/api/composer/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scheduleMode: 'single',
          posts: [{
            postId: postId || undefined,
            scheduledAt: scheduledDateObj.toISOString(),
            strategy: scheduleStrategy,
            platforms: readyDrafts.map(d => ({
              platform: d.platform,
              content: d.content,
              hashtags: d.hashtags,
              firstCommentHint: d.firstCommentHint,
              mediaUrls: media.map(m => ({ url: m.url, type: m.type })),
            })),
          }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule post');
      }

      studioToast.success(`Post scheduled for ${scheduledDateObj.toLocaleDateString()} at ${scheduledDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, {
        platforms: readyDrafts.map(d => d.platform),
      });
      setScheduleDialogOpen(false);
      setDrafts([]);
      setSourceContent('');
      setPostId(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Scheduling failed';
      studioToast.error(errorMsg);
    } finally {
      setIsSchedulingPost(false);
    }
  };

  const handleDirectBroadcast = async (useSelectedOnly: boolean = false) => {
    if (!quickContent.trim() || !profile) {
      studioToast.error('Please complete your profile first');
      return;
    }

    if (useSelectedOnly && selectedPlatforms.length === 0) {
      studioToast.error('Please select at least one platform first.');
      return;
    }

    const targetPlatforms = (useSelectedOnly ? selectedPlatforms : connectedPlatforms)
      .filter(p => connectedPlatforms.includes(p));

    if (targetPlatforms.length === 0) {
      studioToast.error(
        useSelectedOnly
          ? 'Please select at least one connected platform.'
          : 'No connected platforms found. Please connect your accounts first.'
      );
      return;
    }
    const skippedPlatforms = targetPlatforms.filter(p => getPlatformLimit(p)?.requiresMedia && media.length === 0);
    if (skippedPlatforms.length > 0) {
      studioToast.info(
        `${skippedPlatforms.map(p => PLATFORM_CONFIG[p]?.name || p).join(', ')} require(s) an image/video to publish. Attach media to include them.`
      );
    }

    const platformsToUse = getValidPlatformsForMedia(targetPlatforms);
    if (platformsToUse.length === 0) {
      studioToast.generationFailed('No platforms selected or all selected platforms reject this media.', {
        platforms: targetPlatforms,
        knowMoreUrl: '/terms',
      });
      return;
    }

    setPlanError(null);
    setBroadcastingType(useSelectedOnly ? 'selected' : 'all');

    if (postId) {
      studioToast.info(`Publishing draft directly to ${platformsToUse.length} platform${platformsToUse.length > 1 ? 's' : ''}...`);
    }

    try {
      const res = await fetch('/api/composer/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          content: quickContent, 
          profileId: profile.id, 
          mediaItems: media,
          selectedPlatforms: platformsToUse,
          studioProfile: profile.studioProfile || null,
          postId: postId || undefined,
        }),
      });

      let data;
      const responseText = await res.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        if (!res.ok) {
          throw new Error(`Server error (${res.status}): The request took too long or failed unexpectedly. Please try again with a smaller file or wait a moment.`);
        }
        throw new Error('Invalid response from server');
      }

      if (!res.ok) {
        const errorData = data as { error?: string; code?: string };
        if (res.status === 403) {
          setPlanError(errorData.error || 'Your current plan does not allow publishing.');
          return;
        }
        throw new Error(data.error || 'Broadcast failed');
      }

      studioToast.success('Broadcast published successfully!', {
        platforms: platformsToUse,
      });

      const results = (data as any)?.results;
      if (results) {
        for (const [platform, result] of Object.entries(results)) {
          if ((result as any).success) {
            studioToast.success(`${platform}: Published`, { platforms: [platform] });
          } else {
            studioToast.error(`${platform}: Failed`, { description: (result as any).error, platforms: [platform] });
          }
        }
      }

      emitSignalStrip({
        postId: data.postId,
        content: quickContent,
        platforms: platformsToUse.map(platform => ({
          platform,
          status: 'pending',
        })),
      });

      setQuickContent('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Broadcast failed';
      studioToast.error(errorMsg);
    } finally {
      setBroadcastingType(null);
    }
  };

  const readyCount = drafts.filter(d => d.status === 'ready' && connectedPlatforms.includes(d.platform)).length;

  const PlatformSelector = () => {
    const platformsToDisplay: PlatformType[] = connectedPlatforms;

    if (connectionsLoading) {
      return (
        <div className="mb-4 space-y-2.5">
          <p className="text-sm font-bold text-[#231C16]">Select Platforms:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {[1, 2, 3, 4].map(idx => (
              <div
                key={idx}
                className="h-11 rounded-xl border border-[#E8DEC8] bg-[#FAF8F5] animate-pulse"
              />
            ))}
          </div>
        </div>
      );
    }

    if (platformsToDisplay.length === 0) {
      return (
        <div className="mb-4 space-y-2.5">
          <p className="text-sm font-bold text-[#231C16]">Select Platforms:</p>
          <div className="rounded-2xl border border-dashed border-[#E8DEC8] bg-[#FFFDF9] p-4 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div>
                <p className="text-xs font-bold text-[#231C16]">No connected platforms yet</p>
                <p className="text-[11px] text-[#7A6B5D] mt-0.5">
                  Connect your social accounts to select, preview, and broadcast across your networks.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#231C16] hover:bg-black text-white text-xs font-semibold transition-all shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Connect Platforms</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const allSelected = platformsToDisplay.length > 0 && platformsToDisplay.every(p => selectedPlatforms.includes(p));

    return (
      <div className="mb-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#231C16]">Select Platforms:</p>
          {platformsToDisplay.length > 1 && (
            <button
              type="button"
              onClick={() => {
                if (allSelected) {
                  setSelectedPlatforms([]);
                } else {
                  setSelectedPlatforms([...platformsToDisplay]);
                }
              }}
              className="text-[11px] font-semibold text-[#8B7355] hover:text-[#231C16] transition-colors cursor-pointer"
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {platformsToDisplay.map(platform => {
            const cfg = PLATFORM_CONFIG[platform] || { name: platform, icon: PlatformSVGs[platform] || Linkedin, maxChars: 3000, color: 'bg-blue-600' };
            const isSelected = selectedPlatforms.includes(platform);
            const limit = getPlatformLimit(platform);
            
            let warningMsg: string | null = null;
            for (const m of media) {
              if (!m.sizeInBytes) continue;
              if (m.type === 'video' && m.sizeInBytes > limit.maxVideoSizeMB * 1024 * 1024) {
                warningMsg = `File too large for ${cfg.name} (${limit.maxVideoSizeMB}MB max)`;
              } else if (m.type === 'image' && m.sizeInBytes > limit.maxImageSizeMB * 1024 * 1024) {
                warningMsg = `Image too large for ${cfg.name} (${limit.maxImageSizeMB}MB max)`;
              }
            }

            return (
              <div
                key={platform}
                onClick={() => !warningMsg && togglePlatform(platform)}
                className={cn(
                  "relative group flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none overflow-hidden",
                  warningMsg
                    ? "opacity-50 cursor-not-allowed bg-white border-[#E8DEC8]"
                    : isSelected
                    ? "bg-[#FAF6EE] border-[#C4A265] shadow-2xs"
                    : "bg-white border-[#E8DEC8] hover:border-[#C4A265] hover:bg-[#FAF7F2]"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('flex items-center justify-center shrink-0 drop-shadow-xs', warningMsg ? 'grayscale opacity-50' : '')}>
                    <PlatformBrandLogo platform={platform} size={18} />
                  </span>
                  <span className="font-semibold text-xs text-[#231C16] truncate">{cfg.name}</span>
                </div>
                <div
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
                    isSelected
                      ? "bg-[#231C16] border-[#231C16] text-white"
                      : "border-[#C5B8A5] bg-white"
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                {isSelected && (
                  <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#22C55E] rounded-full" />
                )}
                {warningMsg && (
                  <div className="absolute top-full left-0 mt-1 hidden group-hover:block z-10 w-48 text-xs bg-black text-white p-2 rounded shadow-lg">
                    {warningMsg}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 -m-4 sm:-m-6 lg:-m-6 bg-[#FAF8F5]"
    >
      <div className="max-w-[1240px] mx-auto space-y-6">
        {/* Top Header */}
        <div className="pb-2">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-[#604E38] via-[#8A6740] to-[#9F83A3] bg-clip-text text-transparent select-none">
                Studio
              </h1>
              <div className="h-[3.5px] w-[110px] rounded-full bg-gradient-to-r from-[#B48850] via-[#C99C62] to-[#8B5CF6] mt-2 mb-3" />
              <p className="text-sm sm:text-base text-[#382B1F] font-normal leading-relaxed">
                Write once. AI adapts. You review. One click publishes everywhere.
              </p>
            </div>
            <Link
              href="/dashboard/flightplan"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#FAF3E7] hover:bg-[#F3EAD9] text-[#785E3A] border border-[#E8DEC8] transition-all shadow-2xs shrink-0"
            >
              <Calendar className="w-3.5 h-3.5 text-[#785E3A]" />
              <span>Schedule a week</span>
            </Link>
          </div>
          <div className="border-b border-[#EADFC9] mt-6" />
        </div>

        {/* Active Draft Review Header Banner */}
        <AnimatePresence>
          {postId && (
            <motion.div
              key="draft-review-banner"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              className="w-full relative overflow-hidden flex items-center justify-between px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#FAF6EE] via-[#FFFDF9] to-[#F5EFE4] dark:from-[#211A14] dark:via-[#261F18] dark:to-[#1C1610] border border-[#E0D5BE] dark:border-[#3E3225] shadow-[0_4px_20px_rgba(61,43,31,0.06)] flex-wrap gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#F0E6D2] dark:bg-[#2D2319] border border-[#D8C7A5] dark:border-[#4B3B2B] flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4 text-[#C4A265]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#2D2319] dark:text-[#FAF7F2] tracking-tight">
                      Staged from Signal
                    </span>
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-[#EDE4CF] dark:bg-[#34291F] text-[#63481D] dark:text-[#D4C3A3] px-2.5 py-0.5 rounded-full border border-[#DCCEB2] dark:border-[#463728]">
                      {mode === 'quick' ? 'Direct Broadcast' : 'AI Adapted Draft'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#C4A265]/15 text-[#8A6726] dark:text-[#E5C77A] border border-[#C4A265]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C4A265] animate-pulse" />
                      Live Staged
                    </span>
                  </div>
                  <p className="text-xs text-[#8B7355] dark:text-[#A89886] mt-0.5 font-medium">
                    Content is staged from your Signal queue. You can publish directly or fine-tune adaptations per platform below.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => {
                    setPostId(null);
                    setSourceContent('');
                    setQuickContent('');
                    setDrafts([]);
                    setMedia([]);
                    hasLoadedTargetPost.current = null;
                    if (typeof window !== 'undefined') {
                      window.history.replaceState({}, '', '/dashboard/studio');
                    }
                    studioToast.info('Composer cleared for fresh post');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#8B7355] hover:text-[#2D2319] dark:text-[#A89886] dark:hover:text-[#FAF7F2] bg-white/70 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 border border-[#DCCEB2] dark:border-[#463728] transition-all cursor-pointer"
                  title="Clear staged post and start a fresh draft"
                >
                  Clear &amp; Start Fresh
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plan error banner */}
        <AnimatePresence>
          {planError && (
            <MotionBox key="plan-error" variant="slide-up" className="w-full">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Plan Limit Reached</AlertTitle>
                <AlertDescription className="flex flex-col gap-3 mt-1">
                  <span>{planError}</span>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" asChild>
                      <Link href="/dashboard/billing">Upgrade Plan</Link>
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

        {/* Profile context bar - Premium Identity Card (Extended full-width to right end, Image 1) */}
        <AnimatePresence mode="wait">
          {profileLoading && (
            <MotionBox key="loading" variant="fade" className="w-full">
              <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#EDE7DD] bg-white/80 backdrop-blur-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[#C4A265]" />
                <span className="text-sm text-[#8B7355] font-medium">Loading your profile&hellip;</span>
                <div className="flex-1 h-4 bg-gradient-to-r from-[#EDE7DD] via-[#F5EFE2] to-[#EDE7DD] rounded-full animate-pulse ml-4" />
              </div>
            </MotionBox>
          )}
          {profile && !profileLoading && (
            <MotionBox key="profile" variant="slide-up" className="w-full">
              <div className="w-full bg-white rounded-3xl border border-[#EADBBD] shadow-[0_2px_12px_rgba(61,43,31,0.03)] px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Avatar with green active status dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#65554B] text-white flex items-center justify-center font-bold text-lg shadow-xs select-none">
                      {user?.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={profile.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span>{profile.name?.charAt(0).toUpperCase() || 'V'}</span>
                      )}
                    </div>
                    {/* Active indicator dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-white shadow-xs" />
                  </div>
                  
                  {/* Profile info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-bold text-[#231C16] truncate">
                        {profile.name || user?.fullName || 'usha'}
                      </p>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#EFE7D8] text-[#735A42] border border-[#E2D6C2]">
                        {profile.company || 'AVADIKA SOLUTIONS'}
                      </span>
                    </div>
                    <p className="text-xs text-[#735A42] mt-0.5 font-normal">
                      {profile.headline || profile.role || 'Professional'}
                    </p>
                  </div>
                </div>
                
                {/* Edit action */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link
                    href="/dashboard/profile"
                    className="text-xs font-semibold text-[#231C16] hover:underline px-2 py-1 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </MotionBox>
          )}

          {!profile && !profileLoading && (
            <MotionBox key="no-profile" variant="slide-up" className="w-full">
              <div className="w-full bg-white rounded-3xl border border-[#EADBBD] shadow-[0_2px_12px_rgba(61,43,31,0.03)] px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#65554B] text-white flex items-center justify-center font-bold text-lg shrink-0">
                    <span>V</span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#231C16]">usha</p>
                    <p className="text-xs text-[#735A42]">Professional</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/dashboard/profile" className="text-xs font-semibold text-[#231C16] hover:underline px-2 py-1">
                    Edit
                  </Link>
                </div>
              </div>
            </MotionBox>
          )}
        </AnimatePresence>

        {/* ── SignalDM Active Badge ── */}
        {featureFlags.automationEnabled && signalDmEnabled && (
          <div className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#FBF9FE] border border-[#E9DEFA] flex-wrap gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-[#7C3AED]">SignalDM Active</span>
              <span className="text-xs text-[#5D4734]">
                Instagram comments on this post will be auto-handled by AI
              </span>
            </div>
            <a
              href="/dashboard/automation"
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#EDE7FD] text-[#7C3AED] border border-[#DDD0FA] hover:bg-[#E4DAFC] transition-all whitespace-nowrap"
            >
              Configure →
            </a>
          </div>
        )}

        {/* Mode Selector Cards (Side-by-Side Cards, Image 1 & 2) */}
        <div className="space-y-6" style={{ maxWidth: 840 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={cn(
                "p-5 rounded-2xl text-left transition-all cursor-pointer relative",
                mode === 'ai'
                  ? "bg-white border-2 border-[#8B5CF6] shadow-[0_4px_20px_rgba(139,92,246,0.08)]"
                  : "bg-white/80 hover:bg-white border border-[#EADBBD]"
              )}
            >
              <p className="text-base font-bold text-[#231C16]">AI Composer</p>
              <p className="text-xs text-[#735A42] mt-1">
                AI will adapt it perfectly for each platform.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('quick')}
              className={cn(
                "p-5 rounded-2xl text-left transition-all cursor-pointer relative",
                mode === 'quick'
                  ? "bg-white border-2 border-[#E05344] shadow-[0_8px_24px_rgba(224,83,68,0.15)]"
                  : "bg-white/80 hover:bg-white border border-[#EADBBD]"
              )}
            >
              <p className="text-base font-bold text-[#231C16]">Quick Broadcast</p>
              <p className="text-xs text-[#735A42] mt-1">
                Publish identical content instantly — no AI adaptation.
              </p>
            </button>
          </div>
        </div>

        {/* ───── Editor & Preview Row (Preview placed directly beside Editor) ───── */}
        <div className="flex gap-8 items-start">
          {/* Left Column: Editor Cards */}
          <div className="flex-1 min-w-0 space-y-6" style={{ maxWidth: 840 }}>
        {/* Quick Broadcast (Screenshots 1 & 2) */}
        {mode === 'quick' && (
          <MotionBox variant="slide-up" delay={0.05}>
            <div
              className={cn(
                "rounded-3xl border border-[#EADBBD] border-t-[4px] border-t-[#E05344] bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(61,43,31,0.03)] space-y-5 transition-colors",
                isDragging && "bg-[#FAF7F2] border-dashed border-[#E05344]"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-5 h-5 text-[#E05344] fill-[#E05344]" />
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#231C16]">
                      Quick Broadcast
                    </h2>
                  </div>
                  <p className="text-sm text-[#7A6B5D] mt-1 font-normal">
                    Publish identical content to all connected platforms instantly — no AI adaptation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIdeaGeneratorOpen((prev) => !prev)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0",
                    isIdeaGeneratorOpen
                      ? "bg-gradient-to-r from-[#C4A265] to-[#B48850] text-white border border-[#B48850] shadow-[0_2px_8px_rgba(196,162,101,0.25)]"
                      : "bg-gradient-to-r from-[#FDF8EE] via-[#FAF1D6] to-[#F5E6BA] text-[#7A5816] border border-[#D4AF37] hover:border-[#B48850] hover:from-[#FAF0D0] hover:to-[#F0DDAC] shadow-[0_2px_8px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  <span className="text-sm">💡</span>
                  <span>{isIdeaGeneratorOpen ? 'Hide ideas' : 'Generate ideas'}</span>
                </button>
              </div>

              {/* Active Studio Persona Banner (Image 1) */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#FAF6EE] border border-[#EADBBD] text-xs text-[#231C16]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#231C16]">Active Persona:</span>
                  <span className="text-[#231C16]">
                    {profile?.studioProfile?.role || 'Creator'}
                  </span>
                </div>
                <Link
                  href="/dashboard/settings?tab=persona"
                  className="font-bold text-[#231C16] underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  Edit Persona
                </Link>
              </div>

              {/* Interactive Studio Idea Generator for Quick Broadcast */}
              <StudioIdeaGenerator
                isOpen={isIdeaGeneratorOpen}
                onClose={() => setIsIdeaGeneratorOpen(false)}
                hasCompletedProfile={true}
                studioProfile={effectiveStudioProfile}
                onSelectIdea={(idea) => {
                  const formattedIdea = idea.hook ? `${idea.hook}\n\n${idea.title}` : idea.title;
                  setQuickContent(formattedIdea);
                }}
              />

              {/* 4-Column Platform Selector */}
              <PlatformSelector />

              {/* Textarea */}
              <Textarea
                placeholder="What do you want to share? Drag and drop an image here, or type your exact text."
                value={quickContent}
                onChange={e => setQuickContent(e.target.value)}
                className={cn(
                  "min-h-[160px] resize-y select-text rounded-2xl border border-[#D8CEBE] p-4 font-mono text-sm text-[#231C16] bg-white focus-visible:ring-1 focus-visible:ring-[#E05344] focus-visible:border-[#E05344]",
                  isDragging && "bg-transparent border-dashed border-[#E05344]"
                )}
                rows={7}
              />

              {/* Quick Broadcast Footer Action Bar */}
              <div className="pt-3 space-y-3">
                {/* Upper Row: Add Media & Previews on left, Character counter on right */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="file"
                      id="media-upload-quick"
                      className="hidden"
                      accept="image/*,video/*,application/pdf"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      multiple
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('media-upload-quick')?.click()}
                      disabled={isUploading}
                      className="h-9 px-3.5 rounded-xl border border-[#231C16] bg-white text-xs font-semibold text-[#231C16] hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5 text-[#231C16]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      )}
                      <span>Add Media</span>
                    </button>

                    {media.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {media.map((m, i) => (
                          <div key={i} className="relative inline-block">
                            {m.type === 'document' ? (
                              <div className="h-14 w-14 bg-[#FAF6EE] rounded-xl border border-[#EADBBD] flex flex-col items-center justify-center">
                                <FileText className="h-5 w-5 text-[#8C6D46]" />
                                <span className="text-[10px] mt-0.5 font-bold text-[#8C6D46]">PDF</span>
                              </div>
                            ) : m.type === 'video' ? (
                              <video src={m.url} className="h-14 w-14 object-cover rounded-xl border border-[#EADBBD]" muted />
                            ) : (
                              <img src={m.url} alt="Upload preview" className="h-14 w-14 object-cover rounded-xl border border-[#EADBBD]" />
                            )}
                            <button
                              type="button"
                              onClick={() => setMedia(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-1.5 -right-1.5 bg-[#1C1611] text-white rounded-full p-0.5 shadow-sm hover:bg-black"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className={cn(
                    'text-sm tabular-nums text-[#7A6B5D] font-medium',
                    quickContent.length > 280 && 'text-destructive font-semibold'
                  )}>
                    {quickContent.length} characters
                    {quickContent.length > 280 && ' · exceeds X/Twitter limit (280)'}
                  </span>
                </div>

                {/* Lower Row: Action buttons moved down (aligned right) */}
                <div className="flex items-center justify-end gap-2.5 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={handleSaveDraftAndClear}
                    disabled={isSavingDraft}
                    className="h-10 px-4 rounded-xl border border-[#231C16] bg-white text-xs font-semibold text-[#231C16] hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="Save this post as a draft in Signal and clear composer to create a new one"
                  >
                    {isSavingDraft ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Ticket className="w-3.5 h-3.5 text-[#E05344] fill-[#E05344]/15" />
                    )}
                    <span>Save as draft &amp; clear</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectBroadcast(true)}
                    disabled={isBroadcasting || !quickContent.trim() || !profile || selectedPlatforms.length === 0 || connectedPlatforms.length === 0}
                    className="h-10 px-4 rounded-xl border border-[#231C16] bg-white text-xs font-semibold text-[#231C16] hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {broadcastingType === 'selected' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-[#231C16] fill-[#231C16]" />
                    )}
                    <span>Publish to Selected</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectBroadcast(false)}
                    disabled={isBroadcasting || !quickContent.trim() || !profile || connectedPlatforms.length === 0}
                    className="h-10 px-4 rounded-xl bg-[#1C1611] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {broadcastingType === 'all' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-white fill-white" />
                    )}
                    <span>Publish to All</span>
                  </button>
                </div>
              </div>

              {/* Brand Materials Page Card for Quick Broadcast (Image 2) */}
              {featureFlags.automationEnabled && (
                <div className="pt-2">
                  <PostBrandMaterialsCard
                    workspaceId={workspaceId}
                    subdomain={(profile as any)?.subdomain || (user as any)?.subdomain || 'user'}
                    postContent={quickContent}
                    attachedSlug={attachedBrandSlug}
                    onAttachPage={(slug, url) => {
                      setAttachedBrandSlug(slug);
                      setAttachedBrandUrl(url);
                    }}
                    onInsertLinkIntoDraft={(url) => {
                      setQuickContent(prev => prev ? `${prev}\n\n${url}` : url);
                      toast.success('Brand page link added to post draft!');
                    }}
                  />
                </div>
              )}
            </div>
          </MotionBox>
        )}

        {/* AI Composer */}
        {mode === 'ai' && (
          <>
            {/* Step 1 */}
            <MotionBox variant="slide-up" delay={0.05}>
              <div className="bg-white rounded-3xl border border-[#EADBBD] shadow-[0_2px_12px_rgba(61,43,31,0.03)] p-6 sm:p-7 relative overflow-hidden">
                {/* Top purple accent line (Image 2) */}
                <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#8B5CF6]" />

                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-4 pb-2">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#231C16]">Write Your Idea</h2>
                      <p className="text-xs sm:text-sm text-[#735A42] mt-0.5">
                        Describe what you want to share. AI will adapt it perfectly for each platform.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsIdeaGeneratorOpen(prev => !prev)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0",
                      isIdeaGeneratorOpen
                        ? "bg-gradient-to-r from-[#C4A265] to-[#B48850] text-white border border-[#B48850] shadow-[0_2px_8px_rgba(196,162,101,0.25)]"
                        : "bg-gradient-to-r from-[#FDF8EE] via-[#FAF1D6] to-[#F5E6BA] text-[#7A5816] border border-[#D4AF37] hover:border-[#B48850] hover:from-[#FAF0D0] hover:to-[#F0DDAC] shadow-[0_2px_8px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    <span className="text-sm">💡</span>
                    <span>{isIdeaGeneratorOpen ? 'Hide ideas' : 'Generate ideas'}</span>
                  </button>
                </div>

                {/* Persona box (Image 2) */}
                <div className="rounded-2xl bg-[#FAF6EE] border border-[#EADBBD] px-4 py-3 flex items-center justify-between flex-wrap gap-2 my-4">
                  <span className="text-xs sm:text-sm font-bold text-[#231C16]">
                    Personalized with Studio profile
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard/settings?tab=persona"
                      className="text-xs font-bold text-[#231C16] underline underline-offset-2 hover:opacity-80"
                    >
                      Edit Persona
                    </Link>
                    <span className="text-xs font-medium text-[#735A42]">
                      {personalizeWithProfile ? 'Active' : 'Paused'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={personalizeWithProfile}
                      onClick={() => setPersonalizeWithProfile(prev => !prev)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                        personalizeWithProfile ? "bg-[#B8874E]" : "bg-zinc-300 dark:bg-zinc-700"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                          personalizeWithProfile ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Interactive Studio Idea Generator */}
                <StudioIdeaGenerator
                  isOpen={isIdeaGeneratorOpen}
                  onClose={() => setIsIdeaGeneratorOpen(false)}
                  hasCompletedProfile={true}
                  studioProfile={effectiveStudioProfile}
                  onSelectIdea={(idea) => {
                    const formattedIdea = idea.hook ? `${idea.hook}\n\n${idea.title}` : idea.title;
                    setSourceContent(formattedIdea);
                  }}
                />

                <PlatformSelector />

                <Textarea
                  placeholder="e.g. 'Just launched v2 of our product...' (Drag and drop media here to attach it!)"
                  value={sourceContent}
                  onChange={e => setSourceContent(e.target.value)}
                  className={cn(
                    "w-full rounded-2xl border border-[#D8CEBE] p-4 text-sm text-[#231C16] bg-white placeholder-[#A69279] focus:outline-none focus:border-[#C4A265] resize-none min-h-[140px] leading-relaxed select-text mt-2",
                    isDragging && "bg-transparent border-dashed border-primary"
                  )}
                  rows={6}
                />

                {/* Hook Score Widget (Image 3) */}
                {hookScore && (
                  <div className="rounded-2xl bg-[#FFF9F3] border border-[#FDE5D2] p-4 flex items-center gap-4 mt-3 shadow-2xs">
                    <div className="relative flex items-center justify-center shrink-0 w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 44 44">
                        <circle cx="22" cy="22" r="18" fill="none" stroke="#FEE8D8" strokeWidth="3" />
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          fill="none"
                          stroke={hookScore.grade === 'STRONG' ? '#16A34A' : hookScore.grade === 'OK' ? '#CA8A04' : '#EA580C'}
                          strokeWidth="3.5"
                          strokeDasharray={113}
                          strokeDashoffset={113 - (113 * Math.min(hookScore.score, 100)) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-sm font-bold text-[#231C16]">{hookScore.score}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-xs font-bold uppercase tracking-wide",
                        hookScore.grade === 'STRONG' ? "text-[#16A34A]" : hookScore.grade === 'OK' ? "text-[#CA8A04]" : "text-[#C2410C]"
                      )}>
                        HOOK · {hookScore.grade}
                      </p>
                      <p className="text-xs text-[#3D2B1F] mt-0.5 leading-snug">
                        {hookScore.suggestion || 'Add a specific number, timeframe, or named entity. Vague claims are invisible.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 1 Footer Action Bar (Image 3) */}
                <div className="pt-3 space-y-3">
                  {/* Upper Row: Add Media (moved up) & Character count */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        type="file"
                        id="media-upload-ai"
                        className="hidden"
                        accept="image/*,video/*,application/pdf"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        multiple
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('media-upload-ai')?.click()}
                        disabled={isUploading}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#231C16] border border-[#231C16] hover:bg-[#FAF7F2] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all disabled:opacity-50"
                      >
                        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5 text-[#231C16]" />}
                        <span>Add Media</span>
                      </button>
                      {media.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {media.map((m, i) => (
                            <div key={i} className="relative inline-block">
                              {m.type === 'document' ? (
                                <div className="h-14 w-14 bg-[#FAF7F2] rounded-xl border border-[#EADBBD] flex flex-col items-center justify-center">
                                  <FileText className="h-5 w-5 text-[#735A42]" />
                                  <span className="text-[9px] mt-0.5 text-[#735A42]">PDF</span>
                                </div>
                              ) : m.type === 'video' ? (
                                <video src={m.url} className="h-14 w-14 object-cover rounded-xl border border-[#EADBBD]" muted />
                              ) : (
                                <img src={m.url} alt="Upload preview" className="h-14 w-14 object-cover rounded-xl border border-[#EADBBD]" />
                              )}
                              <button
                                type="button"
                                onClick={() => setMedia(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full p-0.5 hover:bg-zinc-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[#735A42] font-medium">
                      {sourceContent.length} characters
                    </span>
                  </div>

                  {/* Lower Row: Draft Selected & Draft All (moved down) */}
                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => generateDrafts(true)}
                      disabled={isGenerating || !sourceContent.trim() || !profile || selectedPlatforms.length === 0 || connectedPlatforms.length === 0}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#231C16] border border-[#231C16] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer shadow-2xs transition-all disabled:opacity-50"
                    >
                      {generatingType === 'selected' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-[#231C16]" />
                      )}
                      <span>Draft Selected</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => generateDrafts(false)}
                      disabled={isGenerating || !sourceContent.trim() || !profile || connectedPlatforms.length === 0}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1C1611] text-white hover:bg-[#2D2319] flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
                    >
                      {generatingType === 'all' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-white" />
                      )}
                      <span>Draft All</span>
                    </button>
                  </div>
                </div>
              </div>
            </MotionBox>

            {/* Brand Materials Page for this Post (Image 4) */}
            {featureFlags.automationEnabled && (
              <div className="pt-1">
                <PostBrandMaterialsCard
                  workspaceId={workspaceId}
                  subdomain={(profile as any)?.subdomain || (user as any)?.subdomain || 'user'}
                  postContent={sourceContent}
                  attachedSlug={attachedBrandSlug}
                  onAttachPage={(slug, url) => {
                    setAttachedBrandSlug(slug);
                    setAttachedBrandUrl(url);
                  }}
                  onInsertLinkIntoDraft={(url) => {
                    setSourceContent(prev => prev ? `${prev}\n\n${url}` : url);
                    toast.success('Brand page link added to post draft!');
                  }}
                />
              </div>
            )}

            {/* Step 2 — Platform Drafts */}
            <div ref={reviewSectionRef} id="review-and-edit-section" className="scroll-mt-24">
              <AnimatePresence mode="wait">
                {drafts.some(d => d.status !== 'idle') && (
                  <MotionBox key="drafts" variant="slide-up" delay={0.1}>
                    <div className="rounded-3xl border border-[#EADBBD] bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(61,43,31,0.03)] my-4">
                      {/* Step 2 Header */}
                      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1A140E] text-white text-xs font-bold flex-shrink-0">
                            2
                          </span>
                          <h2 className="text-xl font-bold tracking-tight text-[#231C16]">
                            Review &amp; Edit Drafts
                          </h2>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {readyCount > 0 && (
                            <span className="text-sm font-semibold text-[#16A34A]">
                              {readyCount} of {drafts.length} ready
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={handleSaveDraftAndClear}
                            disabled={isSavingDraft}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#231C16] bg-white text-xs font-semibold text-[#231C16] hover:bg-[#FAF7F2] transition-colors cursor-pointer shadow-2xs"
                            title="Save this draft in Signal and clear composer to create a new post"
                          >
                            {isSavingDraft ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Ticket className="w-3.5 h-3.5 text-[#E05344] fill-[#E05344]/15" />
                            )}
                            <span>Save as draft &amp; clear</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-[#7A6B5D] mb-5">
                        Each platform draft is independently editable. Tweak before publishing, or publish directly as-is.
                      </p>

                      <Tabs
                        value={activeTab}
                        onValueChange={(value: string) => {
                          setActiveTab(value as PlatformType);
                          setPreviewPlatform(value as PlatformType);
                        }}
                      >
                        {/* Platform Pills Tabs Bar matching Screenshot 4 */}
                        <TabsList className="w-full mb-5 flex-wrap h-auto bg-transparent p-0 gap-2 justify-start border-none">
                          {drafts.map(draft => {
                            const platform = draft.platform;
                            const cfg = PLATFORM_CONFIG[platform];
                            const isActive = activeTab === platform;
                            return (
                              <TabsTrigger
                                key={platform}
                                value={platform}
                                className={cn(
                                  "inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer",
                                  isActive
                                    ? "bg-white text-[#231C16] border border-[#EADBBD] shadow-[0_2px_8px_rgba(61,43,31,0.06)]"
                                    : "bg-transparent text-[#6B5A4B] hover:text-[#231C16] hover:bg-[#FAF6EE] border border-transparent"
                                )}
                              >
                                <span className="flex items-center justify-center flex-shrink-0">
                                  <PlatformBrandLogo platform={platform} size={18} />
                                </span>
                                <span>{cfg.name}</span>
                                {draft.status === 'generating' && (
                                  <Loader2 className="h-3 w-3 animate-spin text-[#8B5CF6]" />
                                )}
                                {draft.status === 'ready' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
                                )}
                                {draft.status === 'error' && (
                                  <X className="h-3 w-3 text-destructive" />
                                )}
                              </TabsTrigger>
                            );
                          })}
                        </TabsList>

                        {drafts.map(draft => {
                          const platform = draft.platform;
                          const cfg = PLATFORM_CONFIG[platform];
                          const isOverLimit = draft && draft.characterCount > cfg.maxChars;

                          return (
                            <TabsContent key={platform} value={platform} className="space-y-4 mt-0">
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={springConfig}
                              >
                                {/* Draft header row */}
                                <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center flex-shrink-0">
                                      <PlatformBrandLogo platform={platform} size={36} />
                                    </span>
                                    <div>
                                      <p className="text-base font-bold text-[#231C16] leading-tight">
                                        {cfg.name}
                                      </p>
                                      <p
                                        className={cn(
                                          'text-xs tabular-nums mt-0.5',
                                          isOverLimit ? 'text-destructive font-medium' : 'text-[#7A6B5D]'
                                        )}
                                      >
                                        {draft?.characterCount ?? 0} / {cfg.maxChars} chars
                                        {draft && (draft.hashtags?.length ?? 0) >= 0 &&
                                          ` · ${draft.hashtags?.length ?? 0} ${draft.hashtags?.length === 1 ? 'hashtag' : 'hashtags'}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    {draft?.status === 'ready' && (
                                      <button
                                        type="button"
                                        onClick={() => handleHumanizeDraft(platform)}
                                        disabled={humanizingPlatform === platform || !draft?.content?.trim()}
                                        title={`Humanize and remove AI slop for ${cfg.name}`}
                                        className="h-8 px-3.5 rounded-xl border border-[#231C16] bg-white text-xs font-semibold text-[#231C16] hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                      >
                                        {humanizingPlatform === platform ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8B5CF6]" />
                                        ) : (
                                          <PenTool className="w-3.5 h-3.5 text-[#231C16]" />
                                        )}
                                        <span>De-Slop</span>
                                      </button>
                                    )}
                                    {draft?.status === 'generating' && (
                                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
                                        Generating…
                                      </span>
                                    )}
                                    {draft?.status === 'ready' && (
                                      <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#E8F8EE] text-[#16A34A]">
                                        Ready
                                      </span>
                                    )}
                                    {draft?.status === 'error' && (
                                      <Badge variant="destructive">Error</Badge>
                                    )}
                                  </div>
                                </div>

                                {draft?.error && (
                                  <div
                                    className="mb-3 p-3.5 rounded-2xl border flex items-center justify-between gap-3 flex-wrap shadow-2xs"
                                    style={{
                                      backgroundColor: '#FFFDFB',
                                      borderColor: '#F2DEDE',
                                    }}
                                  >
                                    <div className="flex items-center gap-2.5 text-sm">
                                      <div className="w-7 h-7 rounded-xl bg-[#FBEDED] border border-[#F2D0CE] flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="w-3.5 h-3.5 text-[#B85450]" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-xs text-[#9E2A2B] leading-tight">
                                          {formatPlatformError(draft.error)}
                                        </p>
                                        <p className="text-[11px] text-[#8B7355] mt-0.5">
                                          {/duplicate/i.test(draft.error)
                                            ? 'Please edit the wording slightly so LinkedIn accepts the update.'
                                            : 'Could not publish draft to this network. Review criteria, edit content, or reconnect account.'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-auto">
                                      <Link
                                        href="/terms"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2D2319] text-[#FAF7F2] hover:bg-[#433527] transition-all cursor-pointer shadow-2xs group"
                                        title="Review Terms of Service & acceptable use policies"
                                      >
                                        <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-[#C4A265]" stroke="currentColor" strokeWidth="1.75">
                                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeOpacity="0.8" />
                                          <line x1="8" y1="7.5" x2="8" y2="11.5" stroke="currentColor" strokeLinecap="round" />
                                          <circle cx="8" cy="4.5" r="0.85" fill="currentColor" stroke="none" />
                                        </svg>
                                        <span>Know more</span>
                                        <ArrowUpRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                      </Link>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex items-center gap-1.5 h-7 text-xs bg-white hover:bg-muted text-foreground flex-shrink-0 border-[#E8E0D4] rounded-xl"
                                        onClick={() => retrySingleDraft(platform)}
                                      >
                                        <RefreshCw className="h-3 w-3" />
                                        Retry
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                <Textarea
                                  value={draft?.content ?? ''}
                                  onChange={e => updateDraft(platform, e.target.value)}
                                  className={cn(
                                    'min-h-[160px] resize-y font-mono text-sm select-text rounded-2xl border border-[#D8CEBE] p-4 text-[#231C16] bg-white focus-visible:ring-1 focus-visible:ring-[#8B5CF6] focus-visible:border-[#8B5CF6]',
                                    isOverLimit && 'border-destructive focus-visible:ring-destructive',
                                    draft?.status !== 'ready' && 'opacity-60 cursor-not-allowed'
                                  )}
                                  rows={7}
                                  readOnly={draft?.status !== 'ready'}
                                  placeholder={
                                    draft?.status === 'generating'
                                      ? 'Generating your draft…'
                                      : draft?.status === 'idle'
                                      ? 'Click "Generate Platform Drafts" to start'
                                      : 'Your adapted content will appear here'
                                  }
                                />

                                {isOverLimit && (
                                  <p className="text-xs text-destructive flex items-center gap-1">
                                    <X className="h-3 w-3" />
                                    {draft!.characterCount - cfg.maxChars} characters over the {cfg.name} limit — please trim
                                  </p>
                                )}

                                {draft && (
                                  <HashtagEditor
                                    hashtags={draft.hashtags || []}
                                    onAdd={(tag) => addHashtag(platform, tag)}
                                    onRemove={(tag) => removeHashtag(platform, tag)}
                                    editable={draft.status === 'ready'}
                                  />
                                )}

                                {/* First comment idea container matching Screenshot 5 */}
                                <div className="mt-3 p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#EADBBD] text-xs text-[#231C16]">
                                  <span className="font-bold text-[#231C16]">First comment idea: </span>
                                  <span className="text-[#6B5A4B]">
                                    {draft?.firstCommentHint || 'Drop your link here and invite questions in the comments.'}
                                  </span>
                                </div>

                                {/* Step 2 footer actions matching Screenshot 5 */}
                                <div className="flex items-center justify-between flex-wrap gap-2 pt-3">
                                  <button
                                    type="button"
                                    onClick={() => generateDrafts()}
                                    disabled={isGenerating || draft?.status === 'generating'}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#231C16] hover:text-black transition-colors cursor-pointer py-1"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    <span>Regenerate all drafts</span>
                                  </button>

                                  {readyCount > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleHumanizeAllDrafts()}
                                      disabled={isHumanizingAll || drafts.every(d => d.status !== 'ready')}
                                      className="h-8 px-3.5 rounded-xl border border-[#231C16] bg-white text-xs font-semibold text-[#231C16] hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                      title="Humanize and remove AI slop across all ready platform drafts"
                                    >
                                      {isHumanizingAll ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8B5CF6]" />
                                      ) : (
                                        <PenTool className="w-3.5 h-3.5 text-[#231C16]" />
                                      )}
                                      <span>De-Slop all drafts</span>
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            </TabsContent>
                          );
                        })}
                      </Tabs>
                    </div>
                  </MotionBox>
                )}
              </AnimatePresence>
            </div>

            {/* Step 3 — Publish bar matching Screenshot 5 */}
            <AnimatePresence mode="wait">
              {readyCount > 0 && (
                <MotionBox key="publish" variant="slide-up" delay={0.1}>
                  <div className="rounded-3xl border border-[#EADBBD] bg-[#FAF6EE] p-6 sm:p-7 shadow-[0_4px_24px_rgba(61,43,31,0.03)] my-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1A140E] text-white text-xs font-bold flex-shrink-0">
                          3
                        </span>
                        <h2 className="text-xl font-bold tracking-tight text-[#231C16]">
                          Ready to Publish
                        </h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-[#EADBBD] text-[#735A42]">
                          STAGED &amp; PRIMED
                        </span>
                      </div>
                      <p className="text-xs text-[#7A6B5D] mt-1 font-medium">
                        {readyCount} platform draft{readyCount > 1 ? 's' : ''} ready to publish · edits optional
                      </p>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSaveDraftAndClear}
                          disabled={isGenerating || isSchedulingPost || isPublishing || isSavingDraft}
                          className="h-10 px-4 rounded-xl border border-[#D8CEBE] bg-white text-xs font-semibold text-[#231C16] hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
                          title="Save draft in Signal and clear composer to start a new post"
                        >
                          {isSavingDraft ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Ticket className="w-3.5 h-3.5 text-[#E05344] fill-[#E05344]/15" />
                          )}
                          <span>Save as draft &amp; clear</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setScheduleDialogOpen(true)}
                          disabled={isGenerating || isSchedulingPost || isPublishing}
                          className="h-10 px-4 rounded-xl border border-[#D8CEBE] bg-white text-xs font-semibold text-[#231C16] hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
                        >
                          <Clock className="w-3.5 h-3.5 text-[#231C16]" />
                          <span>Schedule</span>
                        </button>
                      </div>

                      {/* Publish CTA Button */}
                      <button
                        type="button"
                        onClick={handlePublish}
                        disabled={isGenerating || isSchedulingPost || isPublishing}
                        className="h-10 px-6 rounded-xl bg-[#1C1611] hover:bg-[#2D2319] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPublishing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : (
                          <Send className="w-3.5 h-3.5 text-white" />
                        )}
                        <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
                      </button>
                    </div>
                  </div>
                </MotionBox>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* ───── Right Panel: iPhone Live Preview (directly beside Write an Idea) ───── */}
      <div
        className="hidden lg:block sticky top-6 flex-shrink-0 transition-all duration-300"
        style={{ width: Math.round(326 * effectiveScale) }}
      >
        <IPhonePreview
          content={liveContent}
          media={media}
          previewPlatform={previewPlatform}
          setPreviewPlatform={setPreviewPlatform}
          profileName={profile?.name || user?.fullName || ''}
          profileHeadline={profile?.headline || ''}
          avatarUrl={user?.avatarUrl}
          connectedPlatforms={connectedPlatforms}
          selectedPlatforms={selectedPlatforms}
          drafts={drafts}
          effectiveScale={effectiveScale}
        />
      </div>
      </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[440px] bg-[#FFFDF9] border border-[#EDE7DD]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#3D2B1F] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#C4A265]" />
              Schedule Broadcast
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5744] mb-1.5">
                Target Date & Time (Your Local Time)
              </label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#EDE7DD] bg-white text-sm outline-none focus:border-[#C4A265]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5744] mb-1.5">
                Publishing Strategy
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleStrategy('cascading')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    scheduleStrategy === 'cascading'
                      ? 'border-[#C4A265] bg-[#F5EFE2] shadow-sm'
                      : 'border-[#EDE7DD] bg-white hover:bg-gray-50'
                  }`}
                >
                  <p className="text-xs font-bold text-[#3D2B1F] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#C4A265]" />
                    <span>Cascading</span>
                  </p>
                  <p className="text-[11px] text-[#6B5744] mt-0.5">Stagger platforms by 5-15m for maximum reach</p>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleStrategy('simultaneous')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    scheduleStrategy === 'simultaneous'
                      ? 'border-[#C4A265] bg-[#F5EFE2] shadow-sm'
                      : 'border-[#EDE7DD] bg-white hover:bg-gray-50'
                  }`}
                >
                  <p className="text-xs font-bold text-[#3D2B1F]">Simultaneous</p>
                  <p className="text-[11px] text-[#6B5744] mt-0.5">Publish all platforms at the exact same minute</p>
                </button>
              </div>
            </div>

            <p className="text-xs text-[#8B7355] bg-[#F5EFE2] p-3 rounded-xl">
              Queued via Unool Flight Engine with automatic retry & QStash background delivery.
            </p>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setScheduleDialogOpen(false)} disabled={isSchedulingPost}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleScheduleSubmit}
              disabled={isSchedulingPost}
              className="bg-[#C4A265] hover:bg-[#A68B52] text-white font-semibold"
            >
              {isSchedulingPost ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Scheduling…
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Schedule Post
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudioSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <style>{`
        @keyframes biscuitPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
      <div className="pb-4 border-b border-[#E8E0D4] space-y-2">
        <div className="w-28 h-8 rounded-lg bg-[#EDE7DD] animate-[biscuitPulse_1.5s_ease-in-out_infinite]" />
        <div className="w-80 h-4 rounded-md bg-[#FAF7F2] animate-[biscuitPulse_1.5s_ease-in-out_infinite]" />
      </div>

      {/* Mode switcher tabs skeleton */}
      <div className="flex gap-2 p-1 rounded-xl bg-[#EDE7DD]/60 w-fit">
        <div className="w-28 h-8 rounded-lg bg-[#FFFDF9]" />
        <div className="w-28 h-8 rounded-lg bg-transparent" />
      </div>

      {/* Editor card skeleton */}
      <div className="rounded-2xl border border-[#E8E0D4] bg-[#FFFDF9] p-6 shadow-sm space-y-4">
        <div className="w-48 h-4 rounded bg-[#FAF7F2] animate-[biscuitPulse_1.5s_ease-in-out_infinite]" />
        <div className="w-full h-36 rounded-xl bg-[#FAF7F2] border border-[#EDE7DD] animate-[biscuitPulse_1.5s_ease-in-out_infinite]" />
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EDE7DD]" />
            <div className="w-8 h-8 rounded-lg bg-[#EDE7DD]" />
          </div>
          <div className="w-32 h-10 rounded-xl bg-[#C4A265]/30 animate-[biscuitPulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

export default function ComposerClientWrapper({ userId, workspaceId }: ComposerClientProps) {
  return (
    <Suspense fallback={<StudioSkeleton />}>
      <ComposerClient userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}



