'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
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
  CheckCircle,
  Loader2,
  Sparkles,
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
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import { studioToast } from '@/components/dashboard/StudioToast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Box, Flex, Text, Display } from '@/components/ui/layout';
import { MotionBox, spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
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
import { HashtagEditor } from '@/components/dashboard/HashtagEditor';
import { StudioOnboardingModal } from '@/components/dashboard/StudioOnboardingModal';

type PlatformType = SupportedPlatformType;

const PLATFORM_CONFIG: Record<PlatformType, { icon: React.ElementType; name: string; maxChars: number; color: string }> = {
  linkedin: { icon: Linkedin, name: 'LinkedIn', maxChars: 3000, color: 'bg-blue-600' },
  x: { icon: Twitter, name: 'X (Twitter)', maxChars: 280, color: 'bg-gray-800 dark:bg-gray-200' },
  threads: { icon: MessageSquare, name: 'Threads', maxChars: 500, color: 'bg-black dark:bg-white' },
  facebook: { icon: Facebook, name: 'Facebook', maxChars: 63206, color: 'bg-blue-600' },
  instagram: { icon: Instagram, name: 'Instagram', maxChars: 2200, color: 'bg-pink-600' },
  youtube: { icon: Youtube, name: 'YouTube', maxChars: 5000, color: 'bg-red-600' },
  pinterest: { icon: ImageIcon, name: 'Pinterest', maxChars: 500, color: 'bg-red-600' },
  bluesky: { icon: Cloud, name: 'Bluesky', maxChars: 300, color: 'bg-blue-400' },
  mastodon: { icon: Globe, name: 'Mastodon', maxChars: 500, color: 'bg-purple-600' },
  slack: { icon: Hash, name: 'Slack', maxChars: 40000, color: 'bg-[#4A154B]' },
  twitch: { icon: Twitch, name: 'Twitch', maxChars: 500, color: 'bg-[#9146FF]' },
  telegram: { icon: Send, name: 'Telegram', maxChars: 4096, color: 'bg-[#229ED9]' },
  discord: { icon: Hash, name: 'Discord', maxChars: 2000, color: 'bg-[#5865F2]' },
  dribbble: { icon: Dribbble, name: 'Dribbble', maxChars: 250, color: 'bg-[#EA4C89]' },
  skool: { icon: GraduationCap, name: 'Skool', maxChars: 10000, color: 'bg-[#E2AD44]' },
  whop: { icon: Store, name: 'Whop', maxChars: 10000, color: 'bg-[#FF5A00]' },
  kick: { icon: Gamepad2, name: 'Kick', maxChars: 10000, color: 'bg-[#53FC18]' },
  warpcast: { icon: Hash, name: 'Farcaster', maxChars: 320, color: 'bg-[#8A63D2]' },
  mewe: { icon: MessageSquare, name: 'MeWe', maxChars: 4000, color: 'bg-[#2F435E]' },
  nostr: { icon: Zap, name: 'Nostr', maxChars: 65535, color: 'bg-[#9B51E0]' },
  medium: { icon: FileText, name: 'Medium', maxChars: 100000, color: 'bg-black' },
  lemmy: { icon: Globe, name: 'Lemmy', maxChars: 10000, color: 'bg-[#00BC8C]' },
  listmonk: { icon: Mail, name: 'Listmonk', maxChars: 100000, color: 'bg-[#0045ff]' },
  reddit: { icon: Globe, name: 'Reddit', maxChars: 40000, color: 'bg-[#FF4500]' },
  hashnode: { icon: FileText, name: 'Hashnode', maxChars: 100000, color: 'bg-[#2962FF]' },
  devto: { icon: FileText, name: 'DEV.to', maxChars: 100000, color: 'bg-[#090909]' },
  twitter: { icon: Twitter, name: 'X (Twitter)', maxChars: 280, color: 'bg-gray-800 dark:bg-gray-200' },
  whatsapp: { icon: MessageSquare, name: 'WhatsApp', maxChars: 4096, color: 'bg-green-600' },
};

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
  onboardingAnswers?: any;
  studioProfile?: any;
}

interface ComposerClientProps {
  userId: string;
  workspaceId: string;
}

/* ─────────────────────────────────────────────────────────────
   Brand Icons (Real SVGs)
   ───────────────────────────────────────────────────────────── */

const BrandIcons = {
  LinkedIn: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="#0A66C2">
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a1.66 1.66 0 000 1.14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </svg>
  ),
  Facebook: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
    </svg>
  ),
  InstagramText: () => (
    <div className="flex items-center gap-1.5" style={{ color: '#000' }}>
      <span style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>Instagram</span>
    </div>
  ),
  Threads: () => (
    <svg viewBox="0 0 192 192" width="100%" height="100%" fill="currentColor">
      <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.745C82.2364 44.745 70.1369 51.5765 63.5765 63.3545L75.2024 70.6031C80.0505 62.2784 88.2266 58.2497 97.222 58.2497C97.302 58.2497 97.3826 58.2497 97.4632 58.2504C108.311 58.3263 116.373 63.2067 121.072 72.5739C124.474 79.3627 125.795 87.5692 125.011 97.0684C118.716 93.8805 111.245 92.2816 103.087 92.2816C78.5459 92.2816 62.2275 105.888 63.285 126.383C63.8385 137.188 69.2854 146.683 78.4808 152.904C86.4024 158.267 96.3883 160.734 106.667 160.173C120.063 159.443 130.581 154.26 137.955 144.781C143.578 137.601 147.258 128.527 149.104 117.317C154.118 120.112 157.935 123.802 160.351 128.423C164.651 136.891 165.029 150.511 155.909 159.773C147.762 168.041 137.856 171.894 122.933 172.032C106.162 171.878 93.5498 167.049 85.2527 157.723C77.3733 148.852 73.2517 136.543 72.9765 121.148C73.2517 105.752 77.3733 93.4436 85.2527 84.573C93.5498 75.2477 106.162 70.4181 122.933 70.264C139.816 70.4181 152.644 75.2875 161.236 84.7373C165.466 89.3904 168.706 95.0589 170.903 101.563L183.633 97.9203C180.923 89.7579 176.821 82.6426 171.367 76.7063C160.517 64.8941 145.434 58.8403 126.39 58.5728L126.354 58.5711L122.933 56.7619C122.933 56.7619 122.933 56.7619 122.933 56.7619L122.933 56.7619C106.327 56.9183 93.7367 61.6821 85.1474 70.7775L85.0559 70.877L84.968 70.9794C75.9692 81.3197 71.2972 95.2072 71.0024 112.63L71 112.738V112.845C71.0024 121.42 71.0024 121.42 71.0024 121.42" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────
   iPhone 16 Pro Live Mobile Preview Component
   ───────────────────────────────────────────────────────────── */

interface IPhonePreviewProps {
  content: string;
  media: { url: string; type: 'image' | 'video' | 'document' }[];
  previewPlatform: PlatformType;
  setPreviewPlatform: (p: PlatformType) => void;
  profileName: string;
  profileHeadline: string;
  avatarUrl?: string;
  connectedPlatforms?: PlatformType[];
  selectedPlatforms?: PlatformType[];
  drafts?: PlatformDraft[];
}

function IPhoneBottomNavBar({
  platform,
  avatarUrl,
  initials,
}: {
  platform: PlatformType;
  avatarUrl?: string;
  initials: string;
}) {
  const [activeTab, setActiveTab] = useState('home');
  const isDark = isPlatformDark(platform);

  const navBorder = isDark ? 'border-[#262626]' : 'border-[#EAEAEA]';
  const navBg = isDark ? 'bg-[#000000]/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md';
  const iconMuted = isDark ? 'text-[#71767B]' : 'text-[#666666]';

  // Platform specific bottom navigation items
  const renderNavTabs = () => {
    switch (platform) {
      case 'x':
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'home' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Home className="w-5 h-5" strokeWidth={activeTab === 'home' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('search')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'search' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Search className="w-5 h-5" strokeWidth={activeTab === 'search' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('grok')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'grok' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Sparkles className="w-5 h-5" strokeWidth={activeTab === 'grok' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('bell')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'bell' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Bell className="w-5 h-5" strokeWidth={activeTab === 'bell' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('messages')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'messages' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Mail className="w-5 h-5" strokeWidth={activeTab === 'messages' ? 2.5 : 1.8} />
            </button>
          </>
        );

      case 'linkedin':
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'home' ? 'text-[#0A66C2]' : iconMuted)}>
              <Home className="w-4 h-4" strokeWidth={activeTab === 'home' ? 2.5 : 1.8} />
              <span className="text-[9px] font-semibold">Home</span>
            </button>
            <button type="button" onClick={() => setActiveTab('network')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'network' ? 'text-[#0A66C2]' : iconMuted)}>
              <Users className="w-4 h-4" strokeWidth={activeTab === 'network' ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">Network</span>
            </button>
            <button type="button" onClick={() => setActiveTab('post')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'post' ? 'text-[#0A66C2]' : iconMuted)}>
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[9px] font-medium">Post</span>
            </button>
            <button type="button" onClick={() => setActiveTab('notifs')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'notifs' ? 'text-[#0A66C2]' : iconMuted)}>
              <Bell className="w-4 h-4" strokeWidth={activeTab === 'notifs' ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">Notifs</span>
            </button>
            <button type="button" onClick={() => setActiveTab('jobs')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'jobs' ? 'text-[#0A66C2]' : iconMuted)}>
              <Briefcase className="w-4 h-4" strokeWidth={activeTab === 'jobs' ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">Jobs</span>
            </button>
          </>
        );

      case 'instagram':
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'home' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Home className="w-5 h-5" strokeWidth={activeTab === 'home' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('search')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'search' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Search className="w-5 h-5" strokeWidth={activeTab === 'search' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('create')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'create' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => setActiveTab('reels')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'reels' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Play className="w-5 h-5" strokeWidth={activeTab === 'reels' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('profile')} className="p-1 transition-transform active:scale-90">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-current" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-[9px] text-white font-bold flex items-center justify-center">
                  {initials[0] || 'U'}
                </div>
              )}
            </button>
          </>
        );

      case 'threads':
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'home' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Home className="w-5 h-5" strokeWidth={activeTab === 'home' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('search')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'search' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Search className="w-5 h-5" strokeWidth={activeTab === 'search' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('post')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'post' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Edit2 className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('activity')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'activity' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Heart className="w-5 h-5" strokeWidth={activeTab === 'activity' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('profile')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'profile' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Users className="w-5 h-5" strokeWidth={activeTab === 'profile' ? 2.5 : 1.8} />
            </button>
          </>
        );

      case 'youtube':
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'home' ? 'text-red-600' : iconMuted)}>
              <Home className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[9px] font-semibold">Home</span>
            </button>
            <button type="button" onClick={() => setActiveTab('shorts')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'shorts' ? 'text-red-600' : iconMuted)}>
              <Zap className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[9px] font-medium">Shorts</span>
            </button>
            <button type="button" onClick={() => setActiveTab('add')} className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-700 active:scale-95 text-white">
              <Plus className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => setActiveTab('subs')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'subs' ? 'text-red-600' : iconMuted)}>
              <Layers className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[9px] font-medium">Subs</span>
            </button>
            <button type="button" onClick={() => setActiveTab('you')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'you' ? 'text-red-600' : iconMuted)}>
              <Users className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[9px] font-medium">You</span>
            </button>
          </>
        );

      case 'reddit':
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'home' ? 'text-[#FF4500]' : iconMuted)}>
              <Home className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('communities')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'communities' ? 'text-[#FF4500]' : iconMuted)}>
              <Compass className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('create')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'create' ? 'text-[#FF4500]' : iconMuted)}>
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => setActiveTab('chat')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'chat' ? 'text-[#FF4500]' : iconMuted)}>
              <MessageSquareIcon className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('inbox')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'inbox' ? 'text-[#FF4500]' : iconMuted)}>
              <Bell className="w-5 h-5" strokeWidth={2.2} />
            </button>
          </>
        );

      default:
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'home' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Home className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('explore')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'explore' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Compass className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('plus')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'plus' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => setActiveTab('bell')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'bell' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Bell className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('profile')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'profile' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Users className="w-5 h-5" strokeWidth={2.2} />
            </button>
          </>
        );
    }
  };

  return (
    <div className={cn('relative w-full border-t px-3 pt-1.5 pb-0.5 flex items-center justify-around z-20 transition-colors duration-200', navBorder, navBg)}>
      {renderNavTabs()}
    </div>
  );
}

function IPhonePreview({
  content,
  media,
  previewPlatform,
  setPreviewPlatform,
  profileName,
  profileHeadline,
  avatarUrl,
  connectedPlatforms = [],
  selectedPlatforms = [],
  drafts = [],
}: IPhonePreviewProps) {
  const allPlatforms: PlatformType[] = [
    'linkedin', 'x', 'threads', 'instagram', 'facebook', 'youtube', 'pinterest',
    'bluesky', 'mastodon', 'dribbble', 'telegram', 'discord', 'slack', 'reddit',
    'twitch', 'kick', 'medium', 'devto', 'hashnode', 'listmonk', 'warpcast',
    'nostr', 'skool', 'whop', 'mewe', 'lemmy'
  ];

  const [viewAll, setViewAll] = useState(false);
  const [islandExpanded, setIslandExpanded] = useState(false);

  const activePreviews = useMemo(() => {
    if (viewAll) return allPlatforms;
    if (selectedPlatforms.length > 0) return selectedPlatforms;
    if (connectedPlatforms.length > 0) return connectedPlatforms;
    return allPlatforms;
  }, [viewAll, selectedPlatforms, connectedPlatforms, allPlatforms]);

  const platformsToShow = activePreviews.length > 0 ? activePreviews : allPlatforms;

  // Auto-switch preview platform if current one is not in platformsToShow
  useEffect(() => {
    if (platformsToShow.length > 0 && !platformsToShow.includes(previewPlatform)) {
      setPreviewPlatform(platformsToShow[0]);
    }
  }, [platformsToShow, previewPlatform, setPreviewPlatform]);

  const now = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }, []);

  const displayContent = content || 'Start typing to see your post come alive...';
  const isEmpty = !content.trim();
  const initials = profileName ? profileName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';
  const isDark = isPlatformDark(previewPlatform);
  const bgColor = getPlatformBgColor(previewPlatform);

  const cfg = PLATFORM_CONFIG[previewPlatform];
  const charLimit = cfg?.maxChars ?? 1000;
  const charCount = content.length;
  const isOverLimit = charCount > charLimit;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* ── Top App Switcher Dock ─────────────────────────── */}
      <div className="flex flex-col items-center gap-2 w-full max-w-[340px]">
        <div className="flex items-center justify-between w-full px-2 text-[11px] text-[#8B7355] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[#3D2B1F]">iPhone 16 Pro Preview</span>
          </div>
          <button
            type="button"
            onClick={() => setViewAll(!viewAll)}
            className="hover:text-[#3D2B1F] underline text-[11px] cursor-pointer transition-colors"
          >
            {viewAll ? 'Active Platforms' : 'All 26 Apps'}
          </button>
        </div>

        {/* App Dock Squircle Carousel */}
        <div className="flex gap-2 p-1.5 rounded-2xl shadow-sm border border-[#E8E0D4] bg-[#FFFDF9]/90 backdrop-blur-md w-full overflow-x-auto no-scrollbar scroll-smooth">
          {platformsToShow.map(p => {
            const pCfg = PLATFORM_CONFIG[p];
            const isActive = previewPlatform === p;
            const draft = drafts.find(d => d.platform === p);
            const isReady = draft?.status === 'ready';
            const isGenerating = draft?.status === 'generating';
            const isError = draft?.status === 'error';
            const isDraftOverLimit = (draft?.characterCount ?? 0) > (pCfg?.maxChars ?? 1000);

            return (
              <button
                key={p}
                type="button"
                onClick={() => setPreviewPlatform(p)}
                className={cn(
                  'relative group flex flex-col items-center gap-1 p-1 rounded-xl transition-all duration-200 flex-shrink-0 cursor-pointer',
                  isActive
                    ? 'scale-105'
                    : 'opacity-70 hover:opacity-100 hover:scale-100'
                )}
                title={isError ? `${pCfg?.name || p}: Adaptation unavailable (review Terms of Service)` : pCfg?.name || p}
              >
                {/* Squircle App Icon */}
                <div
                  className={cn(
                    'relative w-9 h-9 rounded-[10px] flex items-center justify-center shadow-sm transition-all duration-200 overflow-hidden',
                    isActive
                      ? 'ring-2 ring-[#C4A265] ring-offset-1 shadow-md'
                      : 'border border-black/5 hover:shadow'
                  )}
                  style={{
                    background: isPlatformDark(p)
                      ? 'linear-gradient(135deg, #1C1E20 0%, #000000 100%)'
                      : 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)',
                  }}
                >
                  <PlatformBrandLogo platform={p} size={18} />

                  {/* Status Indicator Badge */}
                  {isGenerating && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white animate-spin flex items-center justify-center text-[7px] text-white" />
                  )}
                  {isReady && !isDraftOverLimit && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                  )}
                  {(isError || isDraftOverLimit) && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
                  )}
                </div>

                <span
                  className={cn(
                    'text-[10px] max-w-[42px] truncate leading-tight tracking-tight',
                    isActive ? 'font-bold text-[#3D2B1F]' : 'font-medium text-[#8B7355]'
                  )}
                >
                  {pCfg?.name?.split(' ')[0] || p}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Realistic iPhone 16 Pro Chassis ───────────────── */}
      <div className="relative select-none" style={{ width: 326, height: 660 }}>
        {/* Hardware Buttons - Left: Action Button + Volume Up/Down */}
        <div
          className="absolute -left-[5px] top-24 w-[5px] h-6 rounded-l-md"
          style={{
            background: 'linear-gradient(to right, #6E747B, #9CA3AF, #6E747B)',
            boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.5)',
          }}
        />
        <div
          className="absolute -left-[5px] top-36 w-[5px] h-12 rounded-l-md"
          style={{
            background: 'linear-gradient(to right, #6E747B, #9CA3AF, #6E747B)',
            boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.5)',
          }}
        />
        <div
          className="absolute -left-[5px] top-52 w-[5px] h-12 rounded-l-md"
          style={{
            background: 'linear-gradient(to right, #6E747B, #9CA3AF, #6E747B)',
            boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.5)',
          }}
        />

        {/* Hardware Button - Right: Power / Side Button */}
        <div
          className="absolute -right-[5px] top-38 w-[5px] h-16 rounded-r-md"
          style={{
            background: 'linear-gradient(to left, #6E747B, #9CA3AF, #6E747B)',
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.5)',
          }}
        />

        {/* Outer Titanium Rim */}
        <div
          className="relative w-full h-full rounded-[54px] p-[3.5px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)] z-10 transition-shadow duration-300"
          style={{
            background: 'linear-gradient(135deg, #A8B1B8 0%, #52575C 30%, #1C1E20 50%, #52575C 70%, #8A929A 100%)',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5), inset 0 0 0 1.5px rgba(255,255,255,0.2), inset 0 2px 4px rgba(255,255,255,0.3)',
          }}
        >
          {/* Inner Display Bezel */}
          <div
            className="relative w-full h-full rounded-[50px] overflow-hidden p-[8px]"
            style={{
              background: '#090A0B',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            {/* Screen Area with Platform-matched background */}
            <div
              className="relative w-full h-full rounded-[42px] overflow-hidden flex flex-col justify-between transition-colors duration-300"
              style={{
                background: bgColor,
              }}
            >
              {/* ── Status Bar & Dynamic Island ── */}
              <div
                className="relative flex items-center justify-between px-6 pt-3 pb-1 z-30"
                style={{
                  color: isDark ? '#FFFFFF' : '#000000',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                }}
              >
                <span className="tracking-tight text-[12px] pl-1 font-semibold">{now}</span>

                {/* Interactive Dynamic Island */}
                <button
                  type="button"
                  onClick={() => setIslandExpanded(!islandExpanded)}
                  className="absolute left-1/2 top-2.5 -translate-x-1/2 flex items-center justify-between px-2.5 transition-all duration-300 cursor-pointer shadow-lg select-none"
                  style={{
                    width: islandExpanded ? 190 : 108,
                    height: 28,
                    background: '#000000',
                    borderRadius: 20,
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
                  }}
                  title="Dynamic Island: Click to inspect live status"
                >
                  {/* Left: Mini Platform Logo */}
                  <div className="flex items-center gap-1.5">
                    <PlatformBrandLogo platform={previewPlatform} size={13} className="text-white flex-shrink-0" />
                    {islandExpanded && (
                      <span className="text-[10px] font-semibold text-white truncate max-w-[75px]">
                        {cfg?.name?.split(' ')[0] || previewPlatform}
                      </span>
                    )}
                  </div>

                  {/* Camera / Sensor Dot */}
                  {!islandExpanded && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#111214] shadow-inner border border-white/10" />
                  )}

                  {/* Right: Live Character Counter / State */}
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        'text-[10px] font-mono tracking-tight font-bold',
                        isOverLimit ? 'text-rose-400' : 'text-emerald-400'
                      )}
                    >
                      {charCount > 0 ? (isOverLimit ? `+${charCount - charLimit}` : `${charCount}`) : '●'}
                    </span>
                  </div>
                </button>

                {/* Right: Cellular / Wi-Fi / Battery */}
                <div className="flex items-center gap-1.5 pr-1">
                  <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor">
                    <rect x="0" y="8" width="2.8" height="4" rx="0.8" opacity="1" />
                    <rect x="4.2" y="5" width="2.8" height="7" rx="0.8" opacity="1" />
                    <rect x="8.4" y="2" width="2.8" height="10" rx="0.8" opacity="1" />
                    <rect x="12.6" y="0" width="2.8" height="12" rx="0.8" opacity="0.3" />
                  </svg>
                  <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor">
                    <path d="M8 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM3.5 7.5C5 6 6.5 5.5 8 5.5s3 .5 4.5 2" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    <path d="M1 4.5c2.5-2.5 4.5-3 7-3s4.5.5 7 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                  </svg>
                  <div className="flex items-center">
                    <div style={{ width: 22, height: 11, borderRadius: 3, border: '1.4px solid currentColor', padding: 1.2 }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(15, (charCount / charLimit) * 100))}%`,
                          height: '100%',
                          borderRadius: 1.2,
                          background: isOverLimit ? '#EF4444' : 'currentColor',
                        }}
                      />
                    </div>
                    <div style={{ width: 1.2, height: 3.5, background: 'currentColor', borderRadius: '0 1px 1px 0', marginLeft: 0.5 }} />
                  </div>
                </div>
              </div>

              {/* ── Scrollable Feed Canvas ── */}
              <div className="flex-1 overflow-y-auto w-full no-scrollbar overscroll-contain">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={previewPlatform}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="w-full"
                  >
                    <PlatformMobilePreview
                      platform={previewPlatform}
                      content={displayContent}
                      isEmpty={isEmpty}
                      media={media}
                      profileName={profileName}
                      profileHeadline={profileHeadline}
                      initials={initials}
                      avatarUrl={avatarUrl}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ── Native App Bottom Navigation Bar ── */}
              <IPhoneBottomNavBar
                platform={previewPlatform}
                avatarUrl={avatarUrl}
                initials={initials}
              />

              {/* ── iOS Home Indicator Bar ── */}
              <div className="w-full pb-1 pt-0.5 flex justify-center z-30" style={{ background: isDark ? '#000000' : '#FFFFFF' }}>
                <div
                  className="w-32 h-1 rounded-full transition-colors duration-200"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Glare Glass Reflection */}
          <div
            className="absolute inset-0 rounded-[54px] pointer-events-none z-40"
            style={{
              background: 'linear-gradient(115deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 35%, rgba(255,255,255,0) 65%, rgba(255,255,255,0.05) 100%)',
            }}
          />
        </div>
      </div>

      {/* Live Sync Status Pill */}
      <div className="flex items-center gap-2 text-xs font-medium text-[#8B7355] mt-0.5">
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>Pixel-perfect {cfg?.name} client preview</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Composer Client
   ───────────────────────────────────────────────────────────── */

export function ComposerClient({ userId, workspaceId }: ComposerClientProps) {
  const reducedMotion = useReducedMotion();
  const { user, profile: userCtxProfile } = useUserContext();
  const [sourceContent, setSourceContent] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [mode, setMode] = useState<'ai' | 'quick'>('ai');
  const [broadcastingType, setBroadcastingType] = useState<'selected' | 'all' | null>(null);
  const isBroadcasting = broadcastingType !== null;
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [generatingType, setGeneratingType] = useState<'selected' | 'all' | null>(null);
  const isGenerating = generatingType !== null;
  const [postId, setPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PlatformType>('linkedin');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [media, setMedia] = useState<{url: string; type: 'image' | 'video' | 'document'; sizeInBytes?: number}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformType[]>([]);
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
  // ── SignalDM automation badge state ─────────────────────────────────────────
  const [signalDmEnabled, setSignalDmEnabled] = useState(false);
  // ── Hook Scorer + Humanizer state ───────────────────────────────────────────
  const [hookScore, setHookScore] = useState<{ score: number; grade: string; suggestion: string | null; slopWords: string[] } | null>(null);
  const [humanizingPlatform, setHumanizingPlatform] = useState<PlatformType | null>(null);
  const [isHumanizingAll, setIsHumanizingAll] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const springConfig: Transition = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.snappy;

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
        setConnectedPlatforms(active);
        setSelectedPlatforms([]);
      }
    } catch {
      // Ignore
    }
  }, []);

  const togglePlatform = (platform: PlatformType) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
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
          onboardingAnswers: data.profile.onboardingAnswers || null,
          studioProfile: data.profile.studioProfile || null,
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
    loadConnections();
  }, [loadProfile, loadConnections]);

  // ── Fetch SignalDM automation status (non-blocking, best-effort) ─────────────
  useEffect(() => {
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
  }, []);

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

    const targetPlatforms = useSelectedOnly ? selectedPlatforms : connectedPlatforms;

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
          onboardingAnswers: profile.onboardingAnswers || undefined
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

    const readyDrafts = drafts.filter(d => d.status === 'ready');
    if (readyDrafts.length === 0) {
      studioToast.error('No drafts ready to publish');
      return;
    }

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
    }
  };

  const handleScheduleSubmit = async () => {
    const readyDrafts = drafts.filter(d => d.status === 'ready');
    if (readyDrafts.length === 0) {
      studioToast.error('No drafts ready to schedule');
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

    const targetPlatforms = useSelectedOnly ? selectedPlatforms : connectedPlatforms;
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

    try {
      const res = await fetch('/api/composer/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          content: quickContent, 
          profileId: profile.id, 
          mediaItems: media,
          selectedPlatforms: platformsToUse
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

  const readyCount = drafts.filter(d => d.status === 'ready').length;

  const PlatformSelector = () => (
    <div className="mb-4 space-y-2">
      <p className="text-sm font-medium">Select Platforms:</p>
      <div className="flex flex-wrap gap-3">
        {connectedPlatforms.map(platform => {
          const cfg = PLATFORM_CONFIG[platform];
          const Icon = cfg.icon;
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
            <div key={platform} className="group relative flex flex-col items-start gap-1">
              <label className={cn("flex items-center gap-2 text-sm p-1.5 rounded-md transition-colors border",
                  warningMsg ? "opacity-50 cursor-not-allowed border-transparent" : "cursor-pointer hover:bg-muted/50 border-transparent hover:border-border"
                )}>
                <Checkbox 
                  checked={isSelected && !warningMsg} 
                  disabled={!!warningMsg}
                  onCheckedChange={() => !warningMsg && togglePlatform(platform)} 
                />
                <span className={cn('p-1 rounded-md text-white', cfg.color, warningMsg ? 'grayscale' : '')}>
                  <Icon className="w-3 h-3" />
                </span>
                {cfg.name}
              </label>
              {warningMsg && (
                <div className="absolute top-full left-0 mt-1 hidden group-hover:block z-10 w-48 text-xs bg-black text-white p-2 rounded shadow-lg">
                  {warningMsg}
                </div>
              )}
            </div>
          );
        })}
        {connectedPlatforms.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No platforms connected. Please connect platforms in Settings.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex gap-8 items-start max-w-[1400px] mx-auto px-4 py-8">
      {/* ───── Left Panel: Composer Form ───── */}
      <div className="flex-1 min-w-0 space-y-6" style={{ maxWidth: 680 }}>
        {/* Header */}
        <div className="pb-4 border-b border-border flex items-start justify-between flex-wrap gap-3">
          <div>
            <Display size="xl" weight="bold">Composer</Display>
            <Text size="sm" color="muted" className="mt-1">
              Write once. AI adapts. You review. One click publishes everywhere.
            </Text>
          </div>
          <Link
            href="/dashboard/schedule"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Plan Entire Week (Flight Plan)
          </Link>
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

        {/* Profile context bar - Premium Identity Card */}
        <AnimatePresence mode="wait">
          {profileLoading && (
            <MotionBox key="loading" variant="fade">
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#EDE7DD] bg-white/80 backdrop-blur-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[#C4A265]" />
                <span className="text-sm text-[#8B7355] font-medium">Loading your profile&hellip;</span>
                <div className="flex-1 h-4 bg-gradient-to-r from-[#EDE7DD] via-[#F5EFE2] to-[#EDE7DD] rounded-full animate-pulse ml-4" />
              </div>
            </MotionBox>
          )}
          {profile && !profileLoading && (
            <MotionBox key="profile" variant="slide-up">
              <div className="relative group overflow-hidden rounded-2xl border border-[#EDE7DD] bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#D4B87A]/50"
                style={{
                  background: 'linear-gradient(135deg, #FFFDF9 0%, #FEFBF5 50%, #FFFDF9 100%)',
                  boxShadow: '0 2px 8px rgba(61,43,31,0.04), 0 0 0 1px rgba(196,162,101,0.06) inset',
                }}
              >
                {/* Subtle top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C4A265] via-[#D4B87A] to-[#C4A265] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex items-center justify-between flex-wrap gap-4 px-5 py-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Avatar with status ring */}
                    <div className="relative flex-shrink-0">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-[#EDE7DD] shadow-sm"
                        style={{ boxShadow: '0 2px 8px rgba(61,43,31,0.08)' }}>
                        {user?.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt={profile.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-sm"
                            style={{ 
                              background: 'linear-gradient(135deg, #C4A265 0%, #D4B87A 100%)',
                              color: '#3D2B1F'
                            }}
                          >
                            {profile.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      {/* Active indicator */}
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm"
                        style={{ boxShadow: '0 0 0 2px rgba(34,197,94,0.2)' }}
                      />
                    </div>
                    
                    {/* Profile info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-semibold text-[#3D2B1F] truncate pr-2">
                          {profile.name}
                        </p>
                        {profile.company && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                            style={{ 
                              background: 'linear-gradient(135deg, #F5EFE2 0%, #EDE7DD 100%)',
                              color: '#C4A265',
                              border: '1px solid #E8E0D4'
                            }}
                          >
                            {profile.company}
                          </span>
                        )}
                      </div>
                      {(profile.headline || profile.role) && (
                        <p className="mt-1 text-sm truncate leading-relaxed" style={{ color: '#6B5744' }}>
                          {profile.headline || profile.role}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Edit action with hover reveal */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild 
                      className="group relative px-3 py-1.5 text-[#8B7355] hover:text-[#3D2B1F] hover:bg-[#F5EFE2] transition-all duration-200 rounded-lg border border-transparent hover:border-[#E8E0D4]"
                    >
                      <Link href="/dashboard/presence">
                        <span className="flex items-center gap-1.5 font-medium text-sm">
                          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit
                        </span>
                      </Link>
                    </Button>
                    
                    {/* Quick stats hint */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(196,162,101,0.08)', border: '1px solid rgba(196,162,101,0.15)' }}
                    >
                      <span className="text-[11px] font-semibold text-[#C4A265]">Ready</span>
                      <span className="text-[11px] text-[#8B7355]">to compose</span>
                    </div>
                  </div>
                </div>
                
                {/* Subtle bottom detail */}
                <div className="absolute bottom-0 left-1/4 right-1/4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(90deg, transparent, #D4B87A, transparent)' }} />
              </div>
            </MotionBox>
          )}

          {/* Studio Voice Calibrations Strip */}
          {profile && !profileLoading && (
            <MotionBox key="voice-profile" variant="slide-up">
              <div
                className="overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs px-4 py-3 flex items-center justify-between flex-wrap gap-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(196,162,101,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-[#C4A265]/15 text-[#C4A265] border border-[#C4A265]/30 flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {profile.studioProfile?.role || profile.onboardingAnswers?.persona || 'Studio Persona'}
                      </span>
                      {(profile.studioProfile?.doing || profile.onboardingAnswers?.focus) && (
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                          • {profile.studioProfile?.doing || profile.onboardingAnswers?.focus}
                        </span>
                      )}
                      {(profile.studioProfile?.tone || (Array.isArray(profile.onboardingAnswers?.tone) && profile.onboardingAnswers.tone.length > 0)) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C4A265]/10 text-[#C4A265] border border-[#C4A265]/20">
                          {profile.studioProfile?.tone || profile.onboardingAnswers?.tone?.slice(0, 2).join(' & ')}
                        </span>
                      )}
                      {profile.studioProfile?.style && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#8B7355]/10 text-[#8B7355] dark:text-zinc-400 border border-[#8B7355]/20">
                          {profile.studioProfile.style}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                      {profile.studioProfile
                        ? `Audience: ${profile.studioProfile.audience} · ${(profile.studioProfile.interests || []).length} outside-work interests`
                        : profile.onboardingAnswers
                        ? `${(profile.onboardingAnswers.extras || []).length} active guardrails calibrating AI adaptations`
                        : 'Calibrate your voice archetype, target audience, and content style'}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="h-8 text-xs font-semibold px-3 bg-white dark:bg-zinc-800 hover:bg-[#F5EFE2] dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-[#8B7355] dark:text-zinc-200 hover:text-[#3D2B1F] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C4A265]" />
                  <span>Edit Studio profile</span>
                </Button>
              </div>
            </MotionBox>
          )}
          {!profile && !profileLoading && (
            <MotionBox key="no-profile" variant="slide-up">
              <div className="relative group overflow-hidden rounded-2xl border border-[#FDE68A]/60 bg-gradient-to-r from-[#FFFCF0] to-[#FFFDF9] shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#FCD34D]/80"
                style={{ boxShadow: '0 2px 8px rgba(251,191,36,0.08)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FCD34D] via-[#FDE68A] to-[#FCD34D]" />
                
                <div className="flex items-center justify-between flex-wrap gap-4 px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' }}
                    >
                      <AlertTriangle className="w-5 h-5 text-[#B45309]" />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border-2 border-[#FDE68A] flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#B45309]">+</span>
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-base font-semibold text-[#78350F]">Profile not set up</p>
                      <p className="mt-0.5 text-sm text-[#A16207]">Create your profile to unlock AI-powered composition</p>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    asChild 
                    className="group relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                    style={{ 
                      background: 'linear-gradient(135deg, #C4A265 0%, #D4B87A 100%)',
                      color: '#3D2B1F',
                      boxShadow: '0 2px 8px rgba(196,162,101,0.3)'
                    }}
                  >
                    <Link href="/dashboard/presence">
                      <span className="flex items-center gap-1.5">
                        Set Up Profile
                        <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </Button>
                </div>
              </div>
            </MotionBox>
          )}
        </AnimatePresence>

        {/* ── SignalDM Active Badge ── */}
        {signalDmEnabled && connectedPlatforms.includes('instagram' as PlatformType) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.06) 100%)',
              border: '1px solid rgba(139,92,246,0.2)',
              marginBottom: 4,
            }}
          >
            <Zap className="w-4 h-4 text-violet-600 shrink-0" />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#7c3aed' }}>SignalDM Active</span>
              <span style={{ fontSize: 12, color: '#8b7355', marginLeft: 6 }}>
                Instagram comments on this post will be auto-handled by AI
              </span>
            </div>
            <a
              href="/dashboard/automation"
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: '#8b5cf6',
                textDecoration: 'none',
                padding: '3px 10px',
                borderRadius: 8,
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              Configure →
            </a>
          </div>
        )}

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
                <PlatformSelector />
                <Textarea
                  placeholder="What do you want to share? Drag and drop an image here, or type your exact text."
                  value={quickContent}
                  onChange={e => setQuickContent(e.target.value)}
                  className={cn("min-h-[140px] resize-none select-text", isDragging && "bg-transparent border-dashed border-primary")}
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDirectBroadcast(true)}
                      disabled={isBroadcasting || !quickContent.trim() || !profile || selectedPlatforms.length === 0}
                    >
                      {broadcastingType === 'selected' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Publish to Selected
                    </Button>
                    <Button
                      onClick={() => handleDirectBroadcast(false)}
                      disabled={isBroadcasting || !quickContent.trim() || !profile || connectedPlatforms.length === 0}
                    >
                      {broadcastingType === 'all' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Publish to All
                    </Button>
                  </div>
                </div>
                
                {/* Media Upload (Quick Broadcast) */}
                <div className="pt-2">
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="media-upload-quick"
                      className="hidden"
                      accept="image/*,video/*,application/pdf"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      multiple
                    />
                    <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('media-upload-quick')?.click()} disabled={isUploading}>
                      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                      Add Media
                    </Button>
                    {media.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {media.map((m, i) => (
                          <div key={i} className="relative inline-block">
                            {m.type === 'document' ? (
                              <div className="h-16 w-16 bg-muted rounded-md border flex flex-col items-center justify-center">
                                <FileText className="h-6 w-6 text-primary" />
                                <span className="text-[10px] mt-1 text-muted-foreground">PDF</span>
                              </div>
                            ) : m.type === 'video' ? (
                              <video src={m.url} className="h-16 w-16 object-cover rounded-md border" muted />
                            ) : (
                              <img src={m.url} alt="Upload preview" className="h-16 w-16 object-cover rounded-md border" />
                            )}
                            <button
                              onClick={() => setMedia(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-2 -right-2 bg-background border rounded-full p-0.5 hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
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
                  <PlatformSelector />
                  <Textarea
                    placeholder="e.g. 'Just launched v2 of our product...' (Drag and drop media here to attach it!)"
                    value={sourceContent}
                    onChange={e => setSourceContent(e.target.value)}
                    className={cn("min-h-[140px] resize-none select-text", isDragging && "bg-transparent border-dashed border-primary")}
                    rows={6}
                  />

                  {/* ── Hook Score Panel ─────────────────────────────────── */}
                  {hookScore && (
                    <div className={cn(
                      'flex items-start gap-3 px-3 py-2.5 rounded-lg text-xs border transition-all',
                      hookScore.grade === 'STRONG' && 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30',
                      hookScore.grade === 'OK'     && 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30',
                      hookScore.grade === 'WEAK'   && 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30',
                      hookScore.grade === 'FAIL'   && 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
                    )}>
                      <div className="flex-shrink-0 mt-0.5">
                        <span className={cn(
                          'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                          hookScore.grade === 'STRONG' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                          hookScore.grade === 'OK'     && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                          hookScore.grade === 'WEAK'   && 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
                          hookScore.grade === 'FAIL'   && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                        )}>
                          {hookScore.score}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            'font-semibold uppercase tracking-wide text-[11px]',
                            hookScore.grade === 'STRONG' && 'text-green-700 dark:text-green-400',
                            hookScore.grade === 'OK'     && 'text-yellow-700 dark:text-yellow-400',
                            hookScore.grade === 'WEAK'   && 'text-orange-700 dark:text-orange-400',
                            hookScore.grade === 'FAIL'   && 'text-red-700 dark:text-red-400',
                          )}>Hook · {hookScore.grade}</span>
                          {hookScore.slopWords.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              Slop: {hookScore.slopWords.slice(0,2).join(', ')}
                            </span>
                          )}
                        </div>
                        {hookScore.suggestion && (
                          <p className="text-muted-foreground mt-0.5 leading-snug">{hookScore.suggestion}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {sourceContent.length} characters
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => generateDrafts(true)}
                        disabled={isGenerating || !sourceContent.trim() || !profile || selectedPlatforms.length === 0}
                      >
                        {generatingType === 'selected' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Draft for Selected
                      </Button>
                      <Button
                        onClick={() => generateDrafts(false)}
                        disabled={isGenerating || !sourceContent.trim() || !profile || connectedPlatforms.length === 0}
                      >
                        {generatingType === 'all' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Draft for All
                      </Button>
                    </div>
                  </div>

                  {/* Media Upload (AI Composer) */}
                  <div className="pt-2">
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="media-upload-ai"
                        className="hidden"
                        accept="image/*,video/*,application/pdf"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        multiple
                      />
                      <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('media-upload-ai')?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                        Add Media
                      </Button>
                      {media.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {media.map((m, i) => (
                            <div key={i} className="relative inline-block">
                              {m.type === 'document' ? (
                                <div className="h-16 w-16 bg-muted rounded-md border flex flex-col items-center justify-center">
                                  <FileText className="h-6 w-6 text-primary" />
                                  <span className="text-[10px] mt-1 text-muted-foreground">PDF</span>
                                </div>
                              ) : m.type === 'video' ? (
                                <video src={m.url} className="h-16 w-16 object-cover rounded-md border" muted />
                              ) : (
                                <img src={m.url} alt="Upload preview" className="h-16 w-16 object-cover rounded-md border" />
                              )}
                              <button
                                onClick={() => setMedia(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute -top-2 -right-2 bg-background border rounded-full p-0.5 hover:bg-muted"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
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
                          <Badge variant="secondary" className="text-xs">{readyCount} of {drafts.length} ready</Badge>
                        )}
                      </div>
                      <Text size="sm" color="muted">
                        Each platform draft is independently editable. Tweak before publishing.
                      </Text>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={activeTab} onValueChange={(value: string) => { setActiveTab(value as PlatformType); setPreviewPlatform(value as PlatformType); }}>
                        <TabsList className="w-full mb-4 flex-wrap h-auto">
                          {drafts.map(draft => {
                            const platform = draft.platform;
                            const cfg = PLATFORM_CONFIG[platform];
                            const Icon = cfg.icon;
                            return (
                              <TabsTrigger key={platform} value={platform} className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2">
                                <span className={cn('p-1 rounded-md text-white', cfg.color)}>
                                  <Icon className="w-3 h-3" />
                                </span>
                                <span className="hidden sm:inline text-xs font-medium">{cfg.name}</span>
                                {draft.status === 'generating' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                                {draft.status === 'ready' && <CheckCircle className="h-3 w-3 text-green-500" />}
                                {draft.status === 'error' && <X className="h-3 w-3 text-destructive" />}
                              </TabsTrigger>
                            );
                          })}
                        </TabsList>

                        {drafts.map(draft => {
                          const platform = draft.platform;
                          const cfg = PLATFORM_CONFIG[platform];
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
                                        {draft && (draft.hashtags?.length ?? 0) > 0 && ` · ${draft.hashtags.length} ${draft.hashtags.length === 1 ? 'hashtag' : 'hashtags'}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {draft?.status === 'ready' && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleHumanizeDraft(platform)}
                                        disabled={humanizingPlatform === platform || !draft?.content?.trim()}
                                        title={`Humanize and remove AI slop for ${cfg.name}`}
                                        className="h-7 text-xs flex items-center gap-1.5 px-2.5 bg-background hover:bg-muted border-border font-medium cursor-pointer"
                                      >
                                        {humanizingPlatform === platform ? (
                                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                        ) : (
                                          <Sparkles className="w-3 h-3 text-amber-500" />
                                        )}
                                        De-Slop
                                      </Button>
                                    )}
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
                                        <p className="font-semibold text-xs text-[#9E2A2B] leading-tight">{draft.error}</p>
                                        <p className="text-[11px] text-[#8B7355] mt-0.5">Could not generate draft for this network. Review criteria or retry.</p>
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
                                    'min-h-[160px] resize-none font-mono text-sm select-text',
                                    isOverLimit && 'border-destructive focus-visible:ring-destructive',
                                    draft?.status !== 'ready' && 'opacity-60 cursor-not-allowed'
                                  )}
                                  rows={7}
                                  readOnly={draft?.status !== 'ready'}
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

                                {draft && (
                                  <HashtagEditor
                                    hashtags={draft.hashtags || []}
                                    onAdd={(tag) => addHashtag(platform, tag)}
                                    onRemove={(tag) => removeHashtag(platform, tag)}
                                    editable={draft.status === 'ready'}
                                  />
                                )}

                                {draft?.firstCommentHint && (
                                  <div className="mt-2 p-3 bg-muted/60 rounded-lg text-xs">
                                    <span className="font-semibold text-foreground">First comment idea: </span>
                                    <span className="text-muted-foreground">{draft.firstCommentHint}</span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => generateDrafts()}
                                    disabled={isGenerating || draft?.status === 'generating'}
                                    className="text-xs h-7"
                                  >
                                    <RefreshCw className="mr-1 h-3 w-3" />
                                    Regenerate all drafts
                                  </Button>

                                  {readyCount > 1 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleHumanizeAllDrafts()}
                                      disabled={isHumanizingAll || drafts.every(d => d.status !== 'ready')}
                                      className="text-xs h-7 flex items-center gap-1.5 cursor-pointer"
                                      title="Humanize and remove AI slop across all ready platform drafts"
                                    >
                                      {isHumanizingAll ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                      ) : (
                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                      )}
                                      De-Slop all drafts
                                    </Button>
                                  )}
                                </div>
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setScheduleDialogOpen(true)}
                        disabled={isGenerating || isSchedulingPost}
                        className="bg-white border-green-300 text-green-900 hover:bg-green-100/50"
                      >
                        <Clock className="mr-2 h-4 w-4 text-amber-600" />
                        Schedule
                      </Button>
                      <Button onClick={handlePublish} disabled={isGenerating || isSchedulingPost}>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Publish All
                      </Button>
                    </div>
                  </div>
                </MotionBox>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* ───── Right Panel: iPhone Live Preview ───── */}
      <div className="hidden lg:block sticky top-8 flex-shrink-0" style={{ width: 340 }}>
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
        />
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

      <StudioOnboardingModal
        userId={userId}
        isOpen={isVoiceModalOpen ? true : undefined}
        onClose={() => setIsVoiceModalOpen(false)}
        forceOpen={isVoiceModalOpen}
        isRetake={isVoiceModalOpen}
        initialAnswers={profile?.studioProfile || profile?.onboardingAnswers}
        onComplete={(newProfile) => {
          setProfile(prev => prev ? {
            ...prev,
            studioProfile: newProfile,
            onboardingAnswers: {
              persona: newProfile.role,
              focus: newProfile.doing,
              audience: [newProfile.audience],
              tone: [newProfile.tone],
              custom: {
                style: newProfile.style,
                interests: Array.isArray(newProfile.interests) ? newProfile.interests.join(', ') : '',
              },
            },
          } : null);
          setIsVoiceModalOpen(false);
        }}
      />
    </div>
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




