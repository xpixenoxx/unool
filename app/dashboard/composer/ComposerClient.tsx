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
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Box, Flex, Text, Display } from '@/components/ui/layout';
import { MotionBox, spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useUserContext } from '@/lib/hooks/use-user-context';

type PlatformType = 'linkedin' | 'x' | 'threads' | 'facebook' | 'whatsapp' | 'instagram' | 'youtube' | 'pinterest' | 'bluesky';

const PLATFORM_CONFIG: Record<PlatformType, { icon: React.ElementType; name: string; maxChars: number; color: string }> = {
  linkedin: { icon: Linkedin, name: 'LinkedIn', maxChars: 3000, color: 'bg-blue-600' },
  x: { icon: Twitter, name: 'X (Twitter)', maxChars: 280, color: 'bg-gray-800 dark:bg-gray-200' },
  threads: { icon: MessageSquare, name: 'Threads', maxChars: 500, color: 'bg-black dark:bg-white' },
  facebook: { icon: Facebook, name: 'Facebook', maxChars: 63206, color: 'bg-blue-600' },
  whatsapp: { icon: MessageCircle, name: 'WhatsApp', maxChars: 1024, color: 'bg-green-600' },
  instagram: { icon: Instagram, name: 'Instagram', maxChars: 2200, color: 'bg-pink-600' },
  youtube: { icon: Youtube, name: 'YouTube', maxChars: 5000, color: 'bg-red-600' },
  pinterest: { icon: ImageIcon, name: 'Pinterest', maxChars: 500, color: 'bg-red-600' },
  bluesky: { icon: Cloud, name: 'Bluesky', maxChars: 300, color: 'bg-blue-400' },
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
  connectedPlatforms,
}: {
  content: string;
  media: { url: string; type: 'image' | 'video' | 'document' }[];
  previewPlatform: PlatformType;
  setPreviewPlatform: (p: PlatformType) => void;
  profileName: string;
  profileHeadline: string;
  avatarUrl?: string;
  connectedPlatforms: PlatformType[];
}) {
  const previewablePlatforms: PlatformType[] = ['linkedin', 'x', 'instagram', 'facebook', 'threads'];
  const activePreviews = previewablePlatforms.filter(p => connectedPlatforms.includes(p));
  const platformsToShow = activePreviews.length > 0 ? activePreviews : previewablePlatforms.slice(0, 3);

  const now = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }, []);

  const displayContent = content || 'Start typing to see your post come alive...';
  const isEmpty = !content.trim();
  const initials = profileName ? profileName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Platform switcher pills */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(61,43,31,0.06)' }}>
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
                  ? 'bg-white shadow-sm text-[#3D2B1F]'
                  : 'text-[#8B7355] hover:text-[#3D2B1F]'
              )}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden xl:inline">{cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* iPhone Frame */}
      <div className="relative" style={{ width: 300 }}>
        {/* Outer phone shell */}
        <div
          className="relative rounded-[44px] p-[3px] shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #2A2A2E, #1A1A1E, #0A0A0E)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 2px 4px rgba(255,255,255,0.1) inset',
          }}
        >
          {/* Inner bezel */}
          <div
            className="relative rounded-[42px] overflow-hidden"
            style={{
              background: '#000',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset',
            }}
          >
            {/* Screen area */}
            <div
              className="relative rounded-[40px] overflow-hidden"
              style={{
                background: previewPlatform === 'x' ? '#000' : '#FFFFFF',
                minHeight: 580,
                maxHeight: 580,
              }}
            >
              {/* Status Bar */}
              <div
                className="flex items-center justify-between px-7 pt-3 pb-1"
                style={{
                  color: previewPlatform === 'x' ? '#fff' : '#000',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                }}
              >
                <span style={{ letterSpacing: 0.5 }}>{now}</span>
                {/* Dynamic Island */}
                <div
                  className="absolute left-1/2 top-2.5 -translate-x-1/2 rounded-full"
                  style={{
                    width: 90,
                    height: 25,
                    background: '#000',
                    borderRadius: 20,
                  }}
                />
                <div className="flex items-center gap-1">
                  {/* Signal */}
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
                    <rect x="0" y="8" width="3" height="4" rx="0.5" opacity="1"/>
                    <rect x="4.5" y="5" width="3" height="7" rx="0.5" opacity="1"/>
                    <rect x="9" y="2" width="3" height="10" rx="0.5" opacity="1"/>
                    <rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.3"/>
                  </svg>
                  {/* WiFi */}
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
                    <path d="M8 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM3.5 7.5C5 6 6.5 5.5 8 5.5s3 .5 4.5 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    <path d="M1 4.5c2.5-2.5 4.5-3 7-3s4.5.5 7 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                  {/* Battery */}
                  <div className="flex items-center">
                    <div style={{ width: 22, height: 10, borderRadius: 3, border: `1.5px solid currentColor`, padding: 1.5 }}>
                      <div style={{ width: '70%', height: '100%', borderRadius: 1, background: 'currentColor' }} />
                    </div>
                    <div style={{ width: 1.5, height: 4, background: 'currentColor', borderRadius: '0 1px 1px 0', marginLeft: 0.5 }} />
                  </div>
                </div>
              </div>

              {/* Platform-specific content */}
              <div className="overflow-y-auto" style={{ maxHeight: 530, scrollbarWidth: 'none' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={previewPlatform}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
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
        </div>

        {/* Subtle phone reflection */}
        <div
          className="absolute inset-0 rounded-[44px] pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-xs" style={{ color: '#8B7355' }}>
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
    <div className="mt-2">
      {videos.length > 0 && (
        <video src={videos[0].url} className="w-full rounded-sm object-cover" style={{ maxHeight: 180 }} muted playsInline />
      )}
      {images.length === 1 && (
        <img src={images[0].url} alt="" className="w-full rounded-sm object-cover" style={{ maxHeight: 200 }} />
      )}
      {images.length > 1 && (
        <div className="grid grid-cols-2 gap-0.5">
          {images.slice(0, 4).map((img, i) => (
            <div key={i} className="relative">
              <img src={img.url} alt="" className="w-full object-cover" style={{ height: 100 }} />
              {i === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-sm">
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

function LinkedInPreview({ content, isEmpty, media, profileName, profileHeadline, initials, avatarUrl }: PreviewProps) {
  const truncated = content.length > 200 ? content.slice(0, 200) + '...' : content;
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      {/* LinkedIn Header Bar */}
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #E8E8E8' }}>
        <Linkedin className="w-5 h-5" style={{ color: '#0A66C2' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#191919' }}>Feed</span>
        <MessageCircle className="w-4 h-4" style={{ color: '#666' }} />
      </div>

      {/* Post Card */}
      <div className="px-3 py-3">
        <div className="bg-white rounded-lg" style={{ border: '1px solid #E8E8E8' }}>
          {/* Author */}
          <div className="flex items-start gap-2.5 p-3 pb-2">
            <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={44} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, fontWeight: 600, color: '#191919', lineHeight: 1.3 }}>{profileName || 'Your Name'}</p>
              <p style={{ fontSize: 11, color: '#666', lineHeight: 1.3 }} className="truncate">
                {profileHeadline || 'Your headline'}
              </p>
              <p style={{ fontSize: 11, color: '#999', lineHeight: 1.4 }}>Just now · <Globe className="w-2.5 h-2.5 inline" /></p>
            </div>
            <MoreHorizontal className="w-4 h-4 flex-shrink-0" style={{ color: '#666' }} />
          </div>

          {/* Content */}
          <div className="px-3 pb-2">
            <p
              style={{
                fontSize: 13,
                color: isEmpty ? '#999' : '#191919',
                lineHeight: 1.5,
                fontStyle: isEmpty ? 'italic' : 'normal',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {truncated}
              {content.length > 200 && <span style={{ color: '#0A66C2', fontWeight: 500 }}> ...see more</span>}
            </p>
          </div>

          <MediaPreviewArea media={media} />

          {/* Engagement bar */}
          <div className="px-3 py-1.5 flex items-center justify-between" style={{ borderTop: '1px solid #E8E8E8' }}>
            <div className="flex items-center gap-0.5">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <ThumbsUp className="w-2.5 h-2.5 text-white" />
              </div>
              <span style={{ fontSize: 11, color: '#666' }}>24</span>
            </div>
            <span style={{ fontSize: 11, color: '#666' }}>3 comments · 1 repost</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-4 gap-0 px-1 py-1" style={{ borderTop: '1px solid #E8E8E8' }}>
            {[
              { icon: ThumbsUp, label: 'Like' },
              { icon: CommentIcon, label: 'Comment' },
              { icon: Repeat2, label: 'Repost' },
              { icon: Send, label: 'Send' },
            ].map(({ icon: Icon, label }) => (
              <button key={label} className="flex flex-col items-center py-1.5 rounded" style={{ color: '#666' }}>
                <Icon className="w-4 h-4" />
                <span style={{ fontSize: 10, marginTop: 1 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function XPreview({ content, isEmpty, media, profileName, initials, avatarUrl }: PreviewProps) {
  const charCount = content.length;
  const isOverLimit = charCount > 280;
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', background: '#000', color: '#E7E9EA', minHeight: 530 }}>
      {/* X Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #2F3336' }}>
        <Twitter className="w-5 h-5" style={{ color: '#E7E9EA' }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#E7E9EA' }}>Home</span>
        <Sparkles className="w-4 h-4" style={{ color: '#E7E9EA' }} />
      </div>

      {/* Post */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #2F3336' }}>
        <div className="flex gap-2.5">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={38} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 14, fontWeight: 700, color: '#E7E9EA' }}>{profileName || 'Your Name'}</span>
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#1D9BF0">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
              </svg>
            </div>
            <p style={{ fontSize: 12, color: '#71767B', marginTop: -1 }}>@{(profileName || 'username').toLowerCase().replace(/\s+/g, '')} · just now</p>

            <p
              className="mt-2"
              style={{
                fontSize: 14,
                color: isEmpty ? '#71767B' : '#E7E9EA',
                lineHeight: 1.45,
                fontStyle: isEmpty ? 'italic' : 'normal',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {content.length > 280 ? content.slice(0, 280) : content || 'Start typing to see your post come alive...'}
            </p>

            {isOverLimit && (
              <p style={{ fontSize: 11, color: '#F4212E', marginTop: 4 }}>
                {charCount}/280 · {charCount - 280} over limit
              </p>
            )}

            {media.filter(m => m.type === 'image').length > 0 && (
              <div className="mt-2 rounded-2xl overflow-hidden" style={{ border: '1px solid #2F3336' }}>
                {media.filter(m => m.type === 'image').length === 1 ? (
                  <img src={media.filter(m => m.type === 'image')[0].url} alt="" className="w-full object-cover" style={{ maxHeight: 170 }} />
                ) : (
                  <div className="grid grid-cols-2 gap-0.5">
                    {media.filter(m => m.type === 'image').slice(0, 4).map((img, i) => (
                      <img key={i} src={img.url} alt="" className="w-full object-cover" style={{ height: 85 }} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-3 pr-4">
              {[
                { icon: CommentIcon, count: '2' },
                { icon: Repeat2, count: '5' },
                { icon: Heart, count: '18' },
                { icon: Bookmark, count: '' },
                { icon: Share, count: '' },
              ].map(({ icon: Icon, count }, i) => (
                <button key={i} className="flex items-center gap-1" style={{ color: '#71767B' }}>
                  <Icon className="w-3.5 h-3.5" />
                  {count && <span style={{ fontSize: 11 }}>{count}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstagramPreview({ content, isEmpty, media, profileName, initials, avatarUrl }: PreviewProps) {
  const hasImage = media.some(m => m.type === 'image');
  const truncated = content.length > 120 ? content.slice(0, 120) + '...' : content;
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      {/* Instagram Header */}
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #EFEFEF' }}>
        <span style={{ fontSize: 20, fontFamily: "'Billabong', cursive", fontWeight: 400, color: '#262626', fontStyle: 'italic' }}>Instagram</span>
        <div className="flex items-center gap-4">
          <Heart className="w-5 h-5" style={{ color: '#262626' }} />
          <MessageCircle className="w-5 h-5" style={{ color: '#262626' }} />
        </div>
      </div>

      {/* Post */}
      <div>
        {/* Author header */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className="rounded-full p-[2px]" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
            <div className="rounded-full p-[1.5px] bg-white">
              <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={30} />
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#262626' }}>{(profileName || 'username').toLowerCase().replace(/\s+/g, '_')}</span>
          <MoreHorizontal className="w-4 h-4 ml-auto" style={{ color: '#262626' }} />
        </div>

        {/* Image area */}
        {hasImage ? (
          <img src={media.find(m => m.type === 'image')!.url} alt="" className="w-full object-cover" style={{ height: 260 }} />
        ) : (
          <div className="w-full flex items-center justify-center" style={{ height: 260, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="text-center text-white/90">
              <ImageIcon className="w-8 h-8 mx-auto mb-1" />
              <p style={{ fontSize: 11 }}>Add media to preview</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-4">
            <Heart className="w-5 h-5" style={{ color: '#262626' }} />
            <CommentIcon className="w-5 h-5" style={{ color: '#262626' }} />
            <Send className="w-5 h-5" style={{ color: '#262626' }} />
          </div>
          <Bookmark className="w-5 h-5" style={{ color: '#262626' }} />
        </div>

        {/* Likes & Caption */}
        <div className="px-3 pb-3">
          <p style={{ fontSize: 13, fontWeight: 600, color: '#262626' }}>142 likes</p>
          <p className="mt-0.5" style={{ fontSize: 13, color: '#262626', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600 }}>{(profileName || 'username').toLowerCase().replace(/\s+/g, '_')}</span>{' '}
            <span style={{ color: isEmpty ? '#999' : '#262626', fontStyle: isEmpty ? 'italic' : 'normal' }}>
              {truncated}
            </span>
          </p>
          <p className="mt-1" style={{ fontSize: 11, color: '#999' }}>View all 8 comments</p>
          <p className="mt-0.5" style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>Just now</p>
        </div>
      </div>
    </div>
  );
}

function FacebookPreview({ content, isEmpty, media, profileName, initials, avatarUrl }: PreviewProps) {
  const truncated = content.length > 180 ? content.slice(0, 180) + '...' : content;
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', background: '#F0F2F5', minHeight: 530 }}>
      {/* Facebook Header */}
      <div className="flex items-center justify-between px-4 py-2" style={{ background: '#fff', borderBottom: '1px solid #E4E6E9' }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#1877F2' }}>facebook</span>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#E4E6E9' }}>
            <MessageCircle className="w-3.5 h-3.5" style={{ color: '#050505' }} />
          </div>
        </div>
      </div>

      {/* Post Card */}
      <div className="m-2 rounded-lg bg-white" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
        {/* Author */}
        <div className="flex items-start gap-2.5 p-3 pb-2">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={38} />
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 600, color: '#050505' }}>{profileName || 'Your Name'}</p>
            <div className="flex items-center gap-1">
              <p style={{ fontSize: 11, color: '#65676B' }}>Just now · </p>
              <Globe className="w-2.5 h-2.5" style={{ color: '#65676B' }} />
            </div>
          </div>
          <MoreHorizontal className="w-5 h-5" style={{ color: '#65676B' }} />
        </div>

        {/* Content */}
        <div className="px-3 pb-2">
          <p style={{
            fontSize: 14,
            color: isEmpty ? '#999' : '#050505',
            lineHeight: 1.45,
            fontStyle: isEmpty ? 'italic' : 'normal',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {truncated}
            {content.length > 180 && <span style={{ color: '#385898', fontWeight: 500 }}> See more</span>}
          </p>
        </div>

        <MediaPreviewArea media={media} />

        {/* Reactions bar */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-0.5">
            <div className="flex -space-x-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center z-20"><ThumbsUp className="w-2.5 h-2.5 text-white" /></div>
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center z-10"><Heart className="w-2.5 h-2.5 text-white" /></div>
            </div>
            <span style={{ fontSize: 12, color: '#65676B', marginLeft: 4 }}>32</span>
          </div>
          <span style={{ fontSize: 12, color: '#65676B' }}>5 comments · 2 shares</span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-0 mx-3 py-1" style={{ borderTop: '1px solid #E4E6E9' }}>
          {[
            { icon: ThumbsUp, label: 'Like' },
            { icon: CommentIcon, label: 'Comment' },
            { icon: Share, label: 'Share' },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="flex items-center justify-center gap-1 py-2 rounded-md" style={{ color: '#65676B' }}>
              <Icon className="w-4 h-4" />
              <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThreadsPreview({ content, isEmpty, media, profileName, initials, avatarUrl }: PreviewProps) {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      {/* Threads Header */}
      <div className="flex items-center justify-center px-4 py-2.5" style={{ borderBottom: '1px solid #E8E8E8' }}>
        <svg width="24" height="24" viewBox="0 0 192 192" fill="#000">
          <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.745C82.2364 44.745 70.1369 51.5765 63.5765 63.3545L75.2024 70.6031C80.0505 62.2784 88.2266 58.2497 97.222 58.2497C97.302 58.2497 97.3826 58.2497 97.4632 58.2504C108.311 58.3263 116.373 63.2067 121.072 72.5739C124.474 79.3627 125.795 87.5692 125.011 97.0684C118.716 93.8805 111.245 92.2816 103.087 92.2816C78.5459 92.2816 62.2275 105.888 63.285 126.383C63.8385 137.188 69.2854 146.683 78.4808 152.904C86.4024 158.267 96.3883 160.734 106.667 160.173C120.063 159.443 130.581 154.26 137.955 144.781C143.578 137.601 147.258 128.527 149.104 117.317C154.118 120.112 157.935 123.802 160.351 128.423C164.651 136.891 165.029 150.511 155.909 159.773C147.762 168.041 137.856 171.894 122.933 172.032C106.162 171.878 93.5498 167.049 85.2527 157.723C77.3733 148.852 73.2517 136.543 72.9765 121.148C73.2517 105.752 77.3733 93.4436 85.2527 84.573C93.5498 75.2477 106.162 70.4181 122.933 70.264C139.816 70.4181 152.644 75.2875 161.236 84.7373C165.466 89.3904 168.706 95.0589 170.903 101.563L183.633 97.9203C180.923 89.7579 176.821 82.6426 171.367 76.7063C160.517 64.8941 145.434 58.8403 126.39 58.5728L126.354 58.5711L122.933 56.7619C122.933 56.7619 122.933 56.7619 122.933 56.7619L122.933 56.7619C106.327 56.9183 93.7367 61.6821 85.1474 70.7775L85.0559 70.877L84.968 70.9794C75.9692 81.3197 71.2972 95.2072 71.0024 112.63L71 112.738V112.845C71.0024 121.42 71.0024 121.42 71.0024 121.42" />
        </svg>
      </div>

      {/* Post */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #E8E8E8' }}>
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-2">
            <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={36} />
            <div className="w-[2px] flex-1 bg-gray-200 rounded-full" />
          </div>
          <div className="flex-1 min-w-0 pb-3">
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 14, fontWeight: 600, color: '#000' }}>{(profileName || 'username').toLowerCase().replace(/\s+/g, '')}</span>
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#0095F6">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z" />
                <path d="M9.64 15.72l-3.16-3.16 1.41-1.41 1.75 1.75 4.67-4.67 1.41 1.41-6.08 6.08z" fill="white" />
              </svg>
              <span style={{ fontSize: 12, color: '#999' }}>· now</span>
            </div>

            <p
              className="mt-1.5"
              style={{
                fontSize: 14,
                color: isEmpty ? '#999' : '#000',
                lineHeight: 1.45,
                fontStyle: isEmpty ? 'italic' : 'normal',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {content.length > 200 ? content.slice(0, 200) + '...' : content || 'Start typing to see your post come alive...'}
            </p>

            {media.filter(m => m.type === 'image').length > 0 && (
              <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid #EFEFEF' }}>
                <img src={media.filter(m => m.type === 'image')[0].url} alt="" className="w-full object-cover" style={{ maxHeight: 160 }} />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-3">
              {[Heart, CommentIcon, Repeat2, Send].map((Icon, i) => (
                <button key={i}>
                  <Icon className="w-4 h-4" style={{ color: '#999' }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1 pl-12">
          <span style={{ fontSize: 12, color: '#999' }}>12 replies · 48 likes</span>
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
  const [media, setMedia] = useState<{url: string; type: 'image' | 'video' | 'document'}[]>([]);
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

      const sizeLimitMB = isVideo || isPdf ? 50 : 5;
      if (file.size > sizeLimitMB * 1024 * 1024) {
        toast.error(`${file.name}: File must be less than ${sizeLimitMB}MB`);
        continue;
      }

      validFilesToUpload.push(file);
    }

    if (validFilesToUpload.length === 0) return;

    setIsUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const newMediaItems: { url: string; type: 'image' | 'video' | 'document' }[] = [];
      
      for (const file of validFilesToUpload) {
        const res = await fetch('/api/composer/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        
        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .uploadToSignedUrl(data.path, data.token, file);

        if (uploadError) {
          throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
        }
        
        newMediaItems.push({ url: data.url, type: data.type });
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

  const generateDrafts = async (useSelectedOnly: boolean = false) => {
    if (!sourceContent.trim() || !profile) {
      toast.error('Please complete your profile first in the Presence tab');
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
          selectedPlatforms: useSelectedOnly ? selectedPlatforms : connectedPlatforms
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
          selectedPlatforms: useSelectedOnly ? selectedPlatforms : connectedPlatforms
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
          return (
            <label key={platform} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded-md transition-colors border border-transparent hover:border-border">
              <Checkbox 
                checked={isSelected} 
                onCheckedChange={() => togglePlatform(platform)} 
              />
              <span className={cn('p-1 rounded-md text-white', cfg.color)}>
                <Icon className="w-3 h-3" />
              </span>
              {cfg.name}
            </label>
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
