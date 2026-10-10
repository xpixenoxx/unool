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
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Box, Flex, Text, Display } from '@/components/ui/layout';
import { MotionBox, spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
// Note: Supabase browser client no longer needed for storage (using Cloudflare R2 via presigned PUT)
import { useUserContext } from '@/lib/hooks/use-user-context';
import { PLATFORM_LIMITS } from '@/lib/config/platformLimits';

type PlatformType = 'linkedin' | 'x' | 'threads' | 'facebook' | 'instagram' | 'youtube' | 'pinterest' | 'bluesky' | 'mastodon' | 'slack' | 'twitch' | 'telegram' | 'discord' | 'dribbble' | 'skool' | 'whop' | 'kick' | 'vk';

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
  vk: { icon: Video, name: 'VK', maxChars: 4096, color: 'bg-[#0077FF]' },
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
   iPhone Live Preview Component
   ───────────────────────────────────────────────────────────── */

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
}: {
  content: string;
  media: { url: string; type: 'image' | 'video' | 'document' }[];
  previewPlatform: PlatformType;
  setPreviewPlatform: (p: PlatformType) => void;
  profileName: string;
  profileHeadline: string;
  avatarUrl?: string;
  connectedPlatforms: PlatformType[];
  selectedPlatforms: PlatformType[];
}) {
  const previewablePlatforms: PlatformType[] = ['linkedin', 'x', 'instagram', 'facebook', 'threads'];
  const activePreviews = previewablePlatforms.filter(p => selectedPlatforms.length > 0 ? selectedPlatforms.includes(p) : connectedPlatforms.includes(p));
  const platformsToShow = activePreviews.length > 0 ? activePreviews : previewablePlatforms.slice(0, 3);

  const now = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }, []);

  const displayContent = content || 'Start typing to see your post come alive...';
  const isEmpty = !content.trim();
  const initials = profileName ? profileName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Platform switcher pills */}
      <div className="flex gap-1 p-1 rounded-2xl shadow-sm border border-[#E8E0D4] bg-[#FFFDF9]/60 backdrop-blur-sm">
        {platformsToShow.map(p => {
          const cfg = PLATFORM_CONFIG[p];
          const Icon = cfg.icon;
          const isActive = previewPlatform === p;
          return (
            <button
              key={p}
              onClick={() => setPreviewPlatform(p)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-white shadow-sm text-[#3D2B1F] border border-[#E8E0D4]'
                  : 'text-[#8B7355] hover:text-[#3D2B1F] border border-transparent'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Realistic iPhone Mockup */}
      <div className="relative" style={{ width: 320, height: 650 }}>
        
        {/* Hardware Buttons */}
        <div className="absolute -left-1 top-24 w-1.5 h-7 bg-[#B8B8B8] rounded-l-md shadow-inner" style={{ boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.5)' }} />
        <div className="absolute -left-1 top-36 w-1.5 h-12 bg-[#B8B8B8] rounded-l-md shadow-inner" style={{ boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.5)' }} />
        <div className="absolute -left-1 top-52 w-1.5 h-12 bg-[#B8B8B8] rounded-l-md shadow-inner" style={{ boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.5)' }} />
        <div className="absolute -right-1 top-40 w-1.5 h-16 bg-[#B8B8B8] rounded-r-md shadow-inner" style={{ boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.5)' }} />

        {/* Outer phone shell */}
        <div
          className="relative w-full h-full rounded-[55px] p-[3px] shadow-2xl z-10"
          style={{
            background: 'linear-gradient(135deg, #A8B1B8, #4D5257, #1C1E20, #4D5257, #A8B1B8)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.1) inset, 0 4px 6px rgba(255,255,255,0.2) inset',
          }}
        >
          {/* Inner bezel */}
          <div
            className="relative w-full h-full rounded-[52px] overflow-hidden p-[8px]"
            style={{
              background: '#000',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset',
            }}
          >
            {/* Screen area */}
            <div
              className="relative w-full h-full rounded-[44px] overflow-hidden"
              style={{
                background: previewPlatform === 'x' ? '#000' : '#FFFFFF',
              }}
            >
              {/* Status Bar */}
              <div
                className="flex items-center justify-between px-7 pt-4 pb-1"
                style={{
                  color: previewPlatform === 'x' ? '#fff' : '#000',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                }}
              >
                <span style={{ letterSpacing: 0.5 }}>{now}</span>
                
                {/* Dynamic Island */}
                <div
                  className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full flex items-center justify-end px-2"
                  style={{
                    width: 100,
                    height: 30,
                    background: '#000',
                    borderRadius: 20,
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-[#1c1c1e] shadow-inner" style={{ boxShadow: 'inset 0 0 2px rgba(255,255,255,0.2)' }} />
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Signal */}
                  <svg width="17" height="12" viewBox="0 0 16 12" fill="currentColor">
                    <rect x="0" y="8" width="3" height="4" rx="1" opacity="1"/>
                    <rect x="4.5" y="5" width="3" height="7" rx="1" opacity="1"/>
                    <rect x="9" y="2" width="3" height="10" rx="1" opacity="1"/>
                    <rect x="13.5" y="0" width="3" height="12" rx="1" opacity="0.3"/>
                  </svg>
                  {/* WiFi */}
                  <svg width="17" height="12" viewBox="0 0 16 12" fill="currentColor">
                    <path d="M8 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM3.5 7.5C5 6 6.5 5.5 8 5.5s3 .5 4.5 2" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                    <path d="M1 4.5c2.5-2.5 4.5-3 7-3s4.5.5 7 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                  </svg>
                  {/* Battery */}
                  <div className="flex items-center">
                    <div style={{ width: 24, height: 11.5, borderRadius: 3.5, border: `1.5px solid currentColor`, padding: 1.5 }}>
                      <div style={{ width: '70%', height: '100%', borderRadius: 1.5, background: 'currentColor' }} />
                    </div>
                    <div style={{ width: 1.5, height: 4, background: 'currentColor', borderRadius: '0 1px 1px 0', marginLeft: 0.5 }} />
                  </div>
                </div>
              </div>

              {/* Platform-specific content scrollable area */}
              <div className="overflow-y-auto h-[calc(100%-40px)] w-full no-scrollbar">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={previewPlatform}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                  >
                    {previewPlatform === 'linkedin' && (
                      <LinkedInPreview
                        content={displayContent}
                        isEmpty={isEmpty}
                        media={media}
                        profileName={profileName}
                        profileHeadline={profileHeadline}
                        initials={initials}
                        avatarUrl={avatarUrl}
                      />
                    )}
                    {previewPlatform === 'x' && (
                      <XPreview
                        content={displayContent}
                        isEmpty={isEmpty}
                        media={media}
                        profileName={profileName}
                        initials={initials}
                        avatarUrl={avatarUrl}
                      />
                    )}
                    {previewPlatform === 'instagram' && (
                      <InstagramPreview
                        content={displayContent}
                        isEmpty={isEmpty}
                        media={media}
                        profileName={profileName}
                        initials={initials}
                        avatarUrl={avatarUrl}
                      />
                    )}
                    {previewPlatform === 'facebook' && (
                      <FacebookPreview
                        content={displayContent}
                        isEmpty={isEmpty}
                        media={media}
                        profileName={profileName}
                        initials={initials}
                        avatarUrl={avatarUrl}
                      />
                    )}
                    {previewPlatform === 'threads' && (
                      <ThreadsPreview
                        content={displayContent}
                        isEmpty={isEmpty}
                        media={media}
                        profileName={profileName}
                        initials={initials}
                        avatarUrl={avatarUrl}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* Subtle phone reflection */}
          <div
            className="absolute inset-0 rounded-[55px] pointer-events-none z-20"
            style={{
              background: 'linear-gradient(110deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.04) 100%)',
            }}
          />
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#8B7355' }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        Live preview · Updates as you type
      </div>
    </div>
  );
}

/* ─── Platform Preview Sub-Components ──────────────────────── */

interface PreviewProps {
  content: string;
  isEmpty: boolean;
  media: { url: string; type: 'image' | 'video' | 'document' }[];
  profileName: string;
  profileHeadline?: string;
  initials: string;
  avatarUrl?: string;
}

function AvatarCircle({ initials, avatarUrl, size = 40, className = '' }: { initials: string; avatarUrl?: string; size?: number; className?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className={cn('rounded-full object-cover', className)} style={{ width: size, height: size }} />;
  }
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-semibold text-white', className)}
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #C4A265, #8B7355)', fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function MediaPreviewArea({ media }: { media: PreviewProps['media'] }) {
  const images = media.filter(m => m.type === 'image');
  const videos = media.filter(m => m.type === 'video');

  if (images.length === 0 && videos.length === 0) return null;

  return (
    <div className="mt-2.5">
      {videos.length > 0 && (
        <video src={videos[0].url} className="w-full rounded-sm object-cover bg-black" style={{ maxHeight: 220 }} muted playsInline />
      )}
      {images.length === 1 && (
        <img src={images[0].url} alt="" className="w-full rounded-sm object-cover" style={{ maxHeight: 260 }} />
      )}
      {images.length > 1 && (
        <div className="grid grid-cols-2 gap-0.5">
          {images.slice(0, 4).map((img, i) => (
            <div key={i} className="relative aspect-square">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              {i === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-xl">
                  +{images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpandableText({ content, maxLength, isEmpty, color, highlightColor }: { content: string, maxLength: number, isEmpty: boolean, color: string, highlightColor: string }) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = content.length > maxLength && !expanded;
  const displayContent = shouldTruncate ? content.slice(0, maxLength) + '...' : content;

  return (
    <p
      className="cursor-pointer"
      onClick={() => setExpanded(!expanded)}
      style={{
        fontSize: 14,
        color: isEmpty ? '#999' : color,
        lineHeight: 1.5,
        fontStyle: isEmpty ? 'italic' : 'normal',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {displayContent}
      {shouldTruncate && <span style={{ color: highlightColor, fontWeight: 500 }}> see more</span>}
    </p>
  );
}

function LinkedInPreview({ content, isEmpty, media, profileName, profileHeadline, initials, avatarUrl }: PreviewProps) {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      {/* LinkedIn Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #EBEBEB' }}>
        <div className="w-6 h-6"><BrandIcons.LinkedIn /></div>
        <div className="flex-1 px-4 relative">
          <div className="w-full h-8 bg-[#EEF3F8] rounded-md flex items-center px-3 gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#666"><path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path></svg>
            <span style={{ fontSize: 13, color: '#666' }}>Search</span>
          </div>
        </div>
        <MessageCircle className="w-6 h-6" style={{ color: '#666' }} />
      </div>

      {/* Post Card */}
      <div className="bg-white my-2" style={{ borderTop: '8px solid #EBEBEB', borderBottom: '8px solid #EBEBEB' }}>
        {/* Author */}
        <div className="flex items-start gap-2.5 px-4 pt-3 pb-2">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={48} />
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 14, fontWeight: 600, color: '#000', lineHeight: 1.3 }}>{profileName || 'Your Name'}</p>
            <p style={{ fontSize: 12, color: '#666666', lineHeight: 1.3 }} className="truncate">
              {profileHeadline || 'Your headline'}
            </p>
            <p style={{ fontSize: 12, color: '#666666', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Just now · <Globe className="w-3 h-3" />
            </p>
          </div>
          <MoreHorizontal className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: '#666' }} />
        </div>

        {/* Content */}
        <div className="px-4 pb-2">
          <ExpandableText content={content} maxLength={180} isEmpty={isEmpty} color="#000" highlightColor="#666666" />
        </div>

        <MediaPreviewArea media={media} />

        {/* Engagement bar */}
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-[#0A66C2] flex items-center justify-center">
              <ThumbsUp className="w-2.5 h-2.5 text-white" />
            </div>
            <span style={{ fontSize: 12, color: '#666666' }}>24</span>
          </div>
          <span style={{ fontSize: 12, color: '#666666' }}>3 comments · 1 repost</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-2 py-1" style={{ borderTop: '1px solid #EBEBEB' }}>
          {[
            { icon: ThumbsUp, label: 'Like' },
            { icon: CommentIcon, label: 'Comment' },
            { icon: Repeat2, label: 'Repost' },
            { icon: Send, label: 'Send' },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="flex-1 flex flex-col items-center justify-center py-2 rounded-md hover:bg-[#F3F2EF]" style={{ color: '#666666' }}>
              <Icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function XPreview({ content, isEmpty, media, profileName, initials, avatarUrl }: PreviewProps) {
  const charCount = content.length;
  const isOverLimit = charCount > 280;
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', background: '#000', color: '#E7E9EA', minHeight: 600 }}>
      {/* X Header */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-black/80 backdrop-blur-md z-10">
        <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={30} />
        <div className="w-6 h-6"><BrandIcons.X /></div>
        <div className="w-8" /> {/* Placeholder for balance */}
      </div>

      <div className="flex" style={{ borderBottom: '1px solid #2F3336' }}>
        <div className="flex-1 text-center py-3 font-bold relative">
          For you
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1D9BF0] rounded-full" />
        </div>
        <div className="flex-1 text-center py-3 font-medium text-[#71767B]">
          Following
        </div>
      </div>

      {/* Post */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #2F3336' }}>
        <div className="flex gap-3">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={40} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 overflow-hidden">
              <span style={{ fontSize: 15, fontWeight: 700, color: '#E7E9EA' }} className="truncate">{profileName || 'Your Name'}</span>
              <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="#1D9BF0">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
              </svg>
              <span style={{ fontSize: 15, color: '#71767B' }} className="truncate">
                @{profileName || 'username'}
              </span>
              <span style={{ fontSize: 15, color: '#71767B' }}>· 1m</span>
              <MoreHorizontal className="w-4 h-4 ml-auto text-[#71767B]" />
            </div>

            <p
              className="mt-1"
              style={{
                fontSize: 15,
                color: isEmpty ? '#71767B' : '#E7E9EA',
                lineHeight: 1.35,
                fontStyle: isEmpty ? 'italic' : 'normal',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {content.length > 280 ? content.slice(0, 280) : content || 'Start typing to see your post come alive...'}
            </p>

            {isOverLimit && (
              <p style={{ fontSize: 13, color: '#F4212E', marginTop: 6, fontWeight: 500 }}>
                {charCount}/280 · {charCount - 280} over limit
              </p>
            )}

            {media.filter(m => m.type === 'image').length > 0 && (
              <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: '1px solid #2F3336' }}>
                {media.filter(m => m.type === 'image').length === 1 ? (
                  <img src={media.filter(m => m.type === 'image')[0].url} alt="" className="w-full object-cover" style={{ maxHeight: 280 }} />
                ) : (
                  <div className="grid grid-cols-2 gap-0.5">
                    {media.filter(m => m.type === 'image').slice(0, 4).map((img, i) => (
                      <div key={i} className="aspect-square relative">
                         <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-3 text-[#71767B]">
              {[
                { icon: CommentIcon, count: '2' },
                { icon: Repeat2, count: '5' },
                { icon: Heart, count: '18' },
                { icon: Bookmark, count: '' },
                { icon: Share, count: '' },
              ].map(({ icon: Icon, count }, i) => (
                <button key={i} className="flex items-center gap-1.5 hover:text-[#1D9BF0] transition-colors group">
                  <div className="p-2 rounded-full group-hover:bg-[#1D9BF0]/10 -m-2">
                    <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                  </div>
                  {count && <span style={{ fontSize: 13 }}>{count}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const IgHeart = () => <svg aria-label="Like" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.174 1.8 1.174 2.634 0a4.212 4.212 0 0 1 3.275-1.941Z" stroke="currentColor" strokeWidth="2" fill="none" /></svg>;
const IgComment = () => <svg aria-label="Comment" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"/></svg>;
const IgShare = () => <svg aria-label="Share Post" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"/><polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"/></svg>;
const IgBookmark = () => <svg aria-label="Save" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><polygon fill="none" points="20 21 12 13.44 4 21 4 3 20 3 20 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>;

function InstagramPreview({ content, isEmpty, media, profileName, initials, avatarUrl }: PreviewProps) {
  const hasImage = media.some(m => m.type === 'image');
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', minHeight: 600 }}>
      {/* Instagram Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #EFEFEF' }}>
        <div className="flex items-center h-[30px]"><BrandIcons.InstagramText /></div>
        <div className="flex items-center gap-5">
          <IgHeart />
          <IgShare />
        </div>
      </div>

      {/* Post */}
      <div>
        {/* Author header */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="rounded-full p-[2px]" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
            <div className="rounded-full p-[2px] bg-white">
              <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={30} />
            </div>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#000' }}>{profileName || 'username'}</span>
          <MoreHorizontal className="w-5 h-5 ml-auto" style={{ color: '#000' }} />
        </div>

        {/* Image area */}
        {hasImage ? (
          <img src={media.find(m => m.type === 'image')!.url} alt="" className="w-full object-cover aspect-square" />
        ) : (
          <div className="w-full flex items-center justify-center aspect-square" style={{ background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' }}>
            <div className="text-center text-gray-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p style={{ fontSize: 14, fontWeight: 500 }}>Add media for Instagram</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-4">
            <IgHeart />
            <IgComment />
            <IgShare />
          </div>
          <IgBookmark />
        </div>

        {/* Likes & Caption */}
        <div className="px-3 pb-4">
          <p style={{ fontSize: 14, fontWeight: 600, color: '#000' }}>142 likes</p>
          <div className="mt-1 flex items-start gap-1">
            <span style={{ fontSize: 14, fontWeight: 600, color: '#000', whiteSpace: 'nowrap' }}>
              {profileName || 'username'}
            </span>
            <div style={{ flex: 1, paddingLeft: '4px' }}>
              <ExpandableText content={content} maxLength={90} isEmpty={isEmpty} color="#000" highlightColor="#999" />
            </div>
          </div>
          <p className="mt-1.5" style={{ fontSize: 14, color: '#737373' }}>View all 8 comments</p>
          <p className="mt-1" style={{ fontSize: 10, color: '#737373', textTransform: 'uppercase' }}>12 minutes ago</p>
        </div>
      </div>
    </div>
  );
}

function FacebookPreview({ content, isEmpty, media, profileName, initials, avatarUrl }: PreviewProps) {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', background: '#C9CCD1', minHeight: 600 }}>
      {/* Facebook Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white" style={{ borderBottom: '1px solid #E4E6E9' }}>
        <div className="w-7 h-7"><BrandIcons.Facebook /></div>
        <div className="flex items-center gap-2">
          <div className="w-[36px] h-[36px] rounded-full bg-[#E4E6E9] flex items-center justify-center">
             <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
          </div>
          <div className="w-[36px] h-[36px] rounded-full bg-[#E4E6E9] flex items-center justify-center">
            <svg viewBox="0 0 28 28" width="20" height="20" fill="currentColor"><path d="M14 2.042c-6.76 0-12 4.952-12 11.64S6.824 24 12.69 24c1.47 0 2.87-.275 4.12-.767.146-.057.306-.066.457-.027l2.844.757c.307.082.593-.19.526-.5l-.65-2.923a1.137 1.137 0 01.196-.922C21.6 18.093 22.5 16.035 22.5 13.682c0-6.688-4.74-11.64-11.5-11.64z"/></svg>
          </div>
        </div>
      </div>

      {/* Post Card */}
      <div className="mt-2 bg-white pb-2 shadow-sm">
        {/* Author */}
        <div className="flex items-start gap-2.5 p-3 pb-2">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={40} />
          <div className="flex-1">
            <p style={{ fontSize: 15, fontWeight: 600, color: '#050505', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {profileName || 'Your Name'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#0866FF"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <p style={{ fontSize: 13, color: '#65676B' }}>Just now · </p>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#65676B"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </div>
          </div>
          <MoreHorizontal className="w-5 h-5 text-[#65676B]" />
        </div>

        {/* Content */}
        <div className="px-4 pb-3 pt-1">
          <ExpandableText content={content} maxLength={150} isEmpty={isEmpty} color="#050505" highlightColor="#050505" />
        </div>

        {/* Only full width media for FB */}
        {media.filter(m => m.type === 'image' || m.type === 'video').length > 0 && (
          <div className="w-full">
            {media[0].type === 'video' ? (
              <video src={media[0].url} className="w-full object-cover max-h-[300px]" muted playsInline />
            ) : (
              <img src={media[0].url} alt="" className="w-full object-cover max-h-[300px]" />
            )}
          </div>
        )}

        {/* Reactions bar */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Facebook_like_thumb.png/1024px-Facebook_like_thumb.png" alt="Like" className="w-5 h-5 rounded-full ring-2 ring-white z-20 object-cover" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Love_Heart_symbol.svg/1024px-Love_Heart_symbol.svg.png" alt="Love" className="w-5 h-5 rounded-full ring-2 ring-white z-10 object-cover bg-[#ED4C5C]" />
            </div>
            <span style={{ fontSize: 13, color: '#65676B' }}>32</span>
          </div>
          <span style={{ fontSize: 13, color: '#65676B' }}>5 comments · 2 shares</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mx-3 py-1" style={{ borderTop: '1px solid #CED0D4' }}>
          {[
            { icon: ThumbsUp, label: 'Like' },
            { icon: CommentIcon, label: 'Comment' },
            { icon: Share, label: 'Share' },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md hover:bg-[#F0F2F5]" style={{ color: '#65676B' }}>
              <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThreadsPreview({ content, isEmpty, media, profileName, initials, avatarUrl }: PreviewProps) {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', background: '#101010', color: '#F3F5F7', minHeight: 600 }}>
      {/* Threads Header */}
      <div className="flex items-center justify-center px-4 py-3" style={{ borderBottom: '1px solid #333638' }}>
        <div className="w-8 h-8"><BrandIcons.Threads /></div>
      </div>

      {/* Post */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #333638' }}>
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={36} />
            <div className="w-[2px] flex-1 bg-[#333638] rounded-full my-2 min-h-[40px]" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 15, fontWeight: 600, color: '#F3F5F7' }}>{(profileName || 'username').toLowerCase().replace(/\s+/g, '')}</span>
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#0095F6">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z" />
                <path d="M9.64 15.72l-3.16-3.16 1.41-1.41 1.75 1.75 4.67-4.67 1.41 1.41-6.08 6.08z" fill="white" />
              </svg>
              <div className="flex-1" />
              <span style={{ fontSize: 14, color: '#777777' }}>1m</span>
              <MoreHorizontal className="w-5 h-5 ml-2 text-[#777777]" />
            </div>

            <p
              className="mt-1"
              style={{
                fontSize: 15,
                color: isEmpty ? '#777777' : '#F3F5F7',
                lineHeight: 1.4,
                fontStyle: isEmpty ? 'italic' : 'normal',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {content.length > 300 ? content.slice(0, 300) + '...' : content || 'Start a thread...'}
            </p>

            {media.filter(m => m.type === 'image').length > 0 && (
              <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: '1px solid #333638' }}>
                <img src={media.filter(m => m.type === 'image')[0].url} alt="" className="w-full object-cover" style={{ maxHeight: 220 }} />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-3 mb-1">
              {[Heart, CommentIcon, Repeat2, Send].map((Icon, i) => (
                <button key={i}>
                  <Icon className="w-5 h-5" style={{ color: '#F3F5F7' }} strokeWidth={2} />
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-1.5 mt-2">
              <span style={{ fontSize: 14, color: '#777777' }}>12 replies</span>
              <span style={{ fontSize: 14, color: '#777777' }}>·</span>
              <span style={{ fontSize: 14, color: '#777777' }}>48 likes</span>
            </div>
          </div>
        </div>
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
  const springConfig: Transition = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.snappy;

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
          .map((c: any) => c.platform as PlatformType);
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
        toast.error(`${file.name}: Only image, video, and PDF files are supported`);
        continue;
      }

      if (isImage) {
        if (currentImages >= 5) {
          toast.error(`Cannot add ${file.name}: You can only upload up to 5 images`);
          continue;
        }
        currentImages++;
      } else if (isVideo) {
        if (currentVideos >= 1) {
          toast.error(`Cannot add ${file.name}: You can only upload up to 1 video`);
          continue;
        }
        currentVideos++;
      } else if (isPdf) {
        if (currentPdfs >= 1) {
          toast.error(`Cannot add ${file.name}: You can only upload up to 1 PDF`);
          continue;
        }
        currentPdfs++;
      }

      const sizeLimitMB = isVideo ? 5000 : isPdf ? 50 : 10; // Allow large video uploads generally
      if (file.size > sizeLimitMB * 1024 * 1024) {
        toast.error(`${file.name}: File must be less than ${sizeLimitMB}MB`);
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
          toast.success(`${type === 'document' ? 'PDF document' : type === 'video' ? 'Video' : 'Image'} uploaded successfully`);
        } else {
          toast.success(`${newMediaItems.length} files uploaded successfully`);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
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

  const getValidPlatformsForMedia = (platforms: PlatformType[]) => {
    return platforms.filter(platform => {
      const limit = PLATFORM_LIMITS[platform] || { maxVideoSizeMB: 5000, maxImageSizeMB: 50 };
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
      toast.error('Please complete your profile first in the Presence tab');
      return;
    }

    const platformsToUse = getValidPlatformsForMedia(useSelectedOnly ? selectedPlatforms : connectedPlatforms);
    if (platformsToUse.length === 0) {
      toast.error('No platforms selected or all selected platforms reject this media size.');
      return;
    }

    setPlanError(null);
    setGeneratingType(useSelectedOnly ? 'selected' : 'all');
    setDrafts(d => d.map(d => ({ ...d, status: 'generating' })));

    try {
      const res = await fetch('/api/composer/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          content: sourceContent, 
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

      const platforms = Object.keys(data.variants) as PlatformType[];
      if (platforms.length > 0) {
        setActiveTab(platforms[0]);
        // Also update preview to show the first generated platform
        setPreviewPlatform(platforms[0]);
      }
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

      toast.success(`Generated drafts for ${platforms.length} platforms`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate drafts';
      toast.error(errorMsg);
      setDrafts(d => d.map(d => ({ ...d, status: 'error', error: errorMsg })));
    } finally {
      setGeneratingType(null);
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

  const handleDirectBroadcast = async (useSelectedOnly: boolean = false) => {
    if (!quickContent.trim() || !profile) {
      toast.error('Please complete your profile first');
      return;
    }

    const platformsToUse = getValidPlatformsForMedia(useSelectedOnly ? selectedPlatforms : connectedPlatforms);
    if (platformsToUse.length === 0) {
      toast.error('No platforms selected or all selected platforms reject this media size.');
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
          const limit = PLATFORM_LIMITS[platform] || { maxVideoSizeMB: 5000, maxImageSizeMB: 50 };
          
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
                <PlatformSelector />
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
                    className={cn("min-h-[140px] resize-none", isDragging && "bg-transparent border-dashed border-primary")}
                    rows={6}
                  />
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
                          <Badge variant="secondary" className="text-xs">{readyCount} of 3 ready</Badge>
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
                                  onClick={() => generateDrafts()}
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
        />
      </div>
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
