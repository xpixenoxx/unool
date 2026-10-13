'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Send, Calendar, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Trash2, AlertCircle, CheckCircle,
  ImagePlus, X, Linkedin, Twitter, MessageSquare, Facebook, Instagram,
  Youtube, Cloud, Image as ImageIcon, Hash, Twitch, Dribbble,
  GraduationCap, Store, Gamepad2, Video, Zap, FileText, Globe, Mail,
  BookOpen, Code2, RotateCcw, ArrowRight, Info,
  PauseCircle, PlayCircle, Radio, Clock, Edit3, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, isToday, startOfDay, endOfWeek, addWeeks } from 'date-fns';

/* ─── Types ─── */

type PlatformType = 'linkedin' | 'x' | 'threads' | 'facebook' | 'instagram' | 'youtube' | 'pinterest' | 'bluesky' | 'mastodon' | 'slack' | 'twitch' | 'telegram' | 'discord' | 'skool' | 'whop' | 'kick' | 'vk' | 'warpcast' | 'mewe' | 'nostr' | 'medium' | 'lemmy' | 'listmonk' | 'hashnode' | 'devto';

const PLATFORM_CONFIG: Record<PlatformType, { icon: React.ElementType; name: string; maxChars: number; color: string }> = {
  linkedin: { icon: Linkedin, name: 'LinkedIn', maxChars: 3000, color: 'bg-blue-600' },
  x: { icon: Twitter, name: 'X (Twitter)', maxChars: 280, color: 'bg-gray-800' },
  threads: { icon: MessageSquare, name: 'Threads', maxChars: 500, color: 'bg-black' },
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
  skool: { icon: GraduationCap, name: 'Skool', maxChars: 10000, color: 'bg-[#E2AD44]' },
  whop: { icon: Store, name: 'Whop', maxChars: 10000, color: 'bg-[#FF5A00]' },
  kick: { icon: Gamepad2, name: 'Kick', maxChars: 10000, color: 'bg-[#53FC18]' },
  vk: { icon: Video, name: 'VK', maxChars: 4096, color: 'bg-[#0077FF]' },
  warpcast: { icon: Hash, name: 'Warpcast', maxChars: 320, color: 'bg-[#8A63D2]' },
  mewe: { icon: MessageSquare, name: 'MeWe', maxChars: 4000, color: 'bg-[#2F435E]' },
  nostr: { icon: Zap, name: 'Nostr', maxChars: 65535, color: 'bg-[#9B51E0]' },
  dribbble: { icon: Dribbble, name: 'Dribbble', maxChars: 250, color: 'bg-[#EA4C89]' },
  medium: { icon: FileText, name: 'Medium', maxChars: 100000, color: 'bg-black' },
  lemmy: { icon: Globe, name: 'Lemmy', maxChars: 10000, color: 'bg-[#00BC8C]' },
  listmonk: { icon: Mail, name: 'Listmonk', maxChars: 100000, color: 'bg-[#0045ff]' },
  hashnode: { icon: BookOpen, name: 'Hashnode', maxChars: 100000, color: 'bg-[#2962FF]' },
  devto: { icon: Code2, name: 'DEV.to', maxChars: 100000, color: 'bg-neutral-900 dark:bg-neutral-100' },
};

const PLATFORM_META: Record<string, { name: string; color: string; bg: string; icon: string }> = {
  linkedin:  { name: 'LinkedIn',  color: '#0A66C2', bg: '#E8F0FA', icon: 'in' },
  x:         { name: 'X',         color: '#000000', bg: '#F0F0F0', icon: '𝕏'  },
  threads:   { name: 'Threads',   color: '#1A1A1A', bg: '#F0F0F0', icon: '@'  },
  bluesky:   { name: 'Bluesky',   color: '#0085FF', bg: '#E6F3FF', icon: '🦋' },
  instagram: { name: 'Instagram', color: '#E1306C', bg: '#FDE8F0', icon: '▷'  },
  facebook:  { name: 'Facebook',  color: '#1877F2', bg: '#E8F0FE', icon: 'f'  },
  pinterest: { name: 'Pinterest', color: '#E60023', bg: '#FDE8E8', icon: 'P'  },
  youtube:   { name: 'YouTube',   color: '#FF0000', bg: '#FDE8E8', icon: '▶'  },
};

interface ArcPlatformDraft {
  platform: string;
  content: string;
  characterCount: number;
  hashtags: string[];
  firstCommentHint?: string | null;
  autoFirstComment?: string | null;
  schedulingOffsetMinutes?: number;
  enabled?: boolean;
}

interface ArcPost {
  day: number;
  dayLabel: string;
  arcBeat: string;
  arcBeatReason: string;
  scheduledHour: number;
  scheduledMinute: number;
  platforms: ArcPlatformDraft[];
  imageUrl?: string | null;
  imageUrls?: string[];
  deleted?: boolean;
}

interface WeekArc {
  arcTitle: string;
  storyType: string;
  storyTypeReason: string;
  weekPosts: ArcPost[];
}

interface CanvasPost {
  postId: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  scheduleStrategy: string;
  arcId: string | null;
  platforms: Array<{
    variantId: string;
    platform: string;
    content: string;
    status: string;
    scheduledAt: string | null;
    autoFirstComment: string | null;
    firstCommentHint?: string | null;
    mediaUrls?: Array<{ url: string; type?: string }>;
    hashtags?: string[];
    error: any;
  }>;
}

type ViewMode = 'story' | 'review' | 'canvas';

/* ─── Biscuit Design Tokens ─── */
const B = {
  bg: '#F7F3ED',
  card: '#FFFDF9',
  cardBorder: '#EDE7DD',
  cardShadow: '0 1px 3px rgba(61,43,31,0.06), 0 4px 12px rgba(61,43,31,0.04)',
  cardShadowHover: '0 2px 8px rgba(61,43,31,0.08), 0 8px 24px rgba(61,43,31,0.06)',
  text: '#3D2B1F',
  textSecondary: '#6B5744',
  textMuted: '#8B7355',
  accent: '#C4A265',
  accentDark: '#A68B52',
  accentBg: '#F5EFE2',
  accentBgHover: '#EDE5D3',
  success: '#4A8C5C',
  successBg: '#EBF5EE',
  info: '#5B7FA6',
  infoBg: '#EBF0F7',
  warning: '#C49B3C',
  warningBg: '#FBF5E6',
  danger: '#B85450',
  dangerBg: '#FBEDED',
  border: '#E8E0D4',
};

/* ─── Step indicator ─── */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="transition-all duration-300 rounded-full"
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            backgroundColor: i === current ? B.accent : i < current ? B.accentDark : B.border,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Platform badge (compact) ─── */
function PlatformBadge({ platform, size = 'sm' }: { platform: string; size?: 'sm' | 'md' }) {
  const meta = PLATFORM_META[platform];
  if (!meta) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-medium"
      style={{
        backgroundColor: meta.bg,
        color: meta.color,
        fontSize: size === 'sm' ? 11 : 13,
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        border: `1px solid ${meta.color}22`,
      }}
    >
      <span style={{ fontSize: size === 'sm' ? 10 : 12 }}>{meta.icon}</span>
      {meta.name}
    </span>
  );
}

/* ─── Step 1: Story Intake ─── */
function StoryIntake({
  onGenerate,
  isGenerating,
  connectedPlatforms,
}: {
  onGenerate: (data: { coreStory: string; whatChanged: string; whatWentWrong: string; oneRealNumber: string; weekStartDate: string; selectedPlatforms: PlatformType[] }) => void;
  isGenerating: boolean;
  connectedPlatforms: PlatformType[];
}) {
  const [coreStory, setCoreStory] = useState('');
  const [whatChanged, setWhatChanged] = useState('');
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [oneRealNumber, setOneRealNumber] = useState('');
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [weekTarget, setWeekTarget] = useState<'current' | 'next'>('current');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([]);

  const targetMonday = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const target = weekTarget === 'next' ? addDays(monday, 7) : monday;
    return format(target, 'yyyy-MM-dd');
  }, [weekTarget]);

  const togglePlatform = (p: PlatformType) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const [storyError, setStoryError] = useState('');

  const handleSubmit = () => {
    if (!coreStory.trim() || coreStory.trim().length < 20) {
      setStoryError('Please write at least 20 characters describing your idea or update.');
      return;
    }
    setStoryError('');
    onGenerate({
      coreStory,
      whatChanged,
      whatWentWrong,
      oneRealNumber,
      weekStartDate: targetMonday,
      selectedPlatforms,
    });
  };

  const charCount = coreStory.length;
  const isReady = charCount >= 20;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3"
          style={{ backgroundColor: B.accentBg, color: B.accentDark }}>
          Weekly Content Plan
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: B.text }}>
          What did you build, learn,<br />or ship this week?
        </h1>
        <p className="text-base" style={{ color: B.textMuted }}>
          Outline your core update. We&apos;ll adapt it into scheduled posts across your platforms.
        </p>
      </div>

      {/* Main story input */}
      <div
        className="rounded-2xl p-1"
        style={{
          background: `linear-gradient(135deg, ${B.accent}33, ${B.border})`,
          boxShadow: B.cardShadow,
        }}
      >
        <div className="rounded-xl p-5" style={{ backgroundColor: B.card }}>
          <textarea
            value={coreStory}
            onChange={e => {
              setCoreStory(e.target.value);
              if (!followUpOpen && e.target.value.length > 50) setFollowUpOpen(true);
            }}
            placeholder="e.g. We spent four days debugging a race condition in our webhook ingestion queue. It was dropping 3% of events under heavy traffic. We fixed it by moving to an async worker queue, cutting event loss to zero..."
            className="w-full resize-none outline-none text-base leading-relaxed bg-transparent"
            style={{ color: B.text, minHeight: 160, caretColor: B.accent }}
            rows={7}
          />
          <div className="flex items-center justify-between mt-3 pt-3"
            style={{ borderTop: `1px solid ${B.border}` }}>
            <span className="text-xs" style={{ color: charCount >= 20 ? B.textMuted : B.warning }}>
              {charCount} characters {charCount < 20 ? `— ${20 - charCount} more to go` : '· ready'}
            </span>
            {storyError && (
              <p className="text-xs text-red-600 font-medium">{storyError}</p>
            )}
            <div className="flex items-center gap-2">
              {isReady && !followUpOpen && (
                <button
                  onClick={() => setFollowUpOpen(true)}
                  className="text-xs underline"
                  style={{ color: B.textMuted }}
                >
                  + Add context
                </button>
              )}
              <div className="w-2 h-2 rounded-full transition-colors"
                style={{ backgroundColor: isReady ? B.success : B.border }} />
            </div>
          </div>
        </div>
      </div>

      {/* Follow-up questions */}
      <AnimatePresence>
        {followUpOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <p className="text-xs font-medium" style={{ color: B.textMuted }}>
              Optional — add specifics to make your drafts sharper:
            </p>
            {[
              { label: 'What specifically changed?', value: whatChanged, set: setWhatChanged, placeholder: 'e.g. We moved from Redis pub/sub to a dedicated worker queue with retry logic' },
              { label: 'What went wrong first?', value: whatWentWrong, set: setWhatWentWrong, placeholder: 'e.g. Our initial fix using a mutex made things worse under load' },
              { label: 'One real number', value: oneRealNumber, set: setOneRealNumber, placeholder: 'e.g. Event loss dropped from 3% to 0.002%, latency went from 340ms to 18ms' },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-medium mb-1" style={{ color: B.textSecondary }}>
                  {label}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-shadow"
                  style={{
                    backgroundColor: B.card,
                    border: `1px solid ${B.border}`,
                    color: B.text,
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = B.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${B.accent}22`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Platform selector */}
      {connectedPlatforms.length > 0 && (
        <div
          className="rounded-2xl border p-4 space-y-3"
          style={{ background: B.card, borderColor: B.cardBorder }}
        >
          <label className="text-sm font-semibold block" style={{ color: B.text }}>
            Platforms
            <span className="font-normal ml-1" style={{ color: B.textMuted }}>
              (leave empty for all connected)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {connectedPlatforms.map(p => {
              const cfg = PLATFORM_CONFIG[p];
              const Icon = cfg.icon;
              const isSelected = selectedPlatforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border',
                    isSelected ? 'shadow-sm' : 'hover:shadow-sm'
                  )}
                  style={isSelected
                    ? { background: B.accentBg, borderColor: B.accent, color: B.text }
                    : { borderColor: B.border, color: B.textMuted }
                  }
                >
                  <Icon className="w-4 h-4" />
                  {cfg.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Week target selector */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 rounded-xl text-sm"
        style={{ backgroundColor: B.infoBg, color: B.info }}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>
            {weekTarget === 'current' && (new Date().getDay() + 6) % 7 > 0 ? (
              <>
                Planning from <strong>Today ({format(new Date(), 'MMMM d')})</strong> — {format(addDays(new Date(targetMonday), 6), 'MMMM d, yyyy')}
              </>
            ) : (
              <>
                Planning week of <strong>{format(new Date(targetMonday), 'MMMM d')}</strong> — {format(addDays(new Date(targetMonday), 6), 'MMMM d, yyyy')}
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-white/70 p-0.5 rounded-lg border border-blue-200/50">
          <button
            type="button"
            onClick={() => setWeekTarget('current')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              weekTarget === 'current' ? 'bg-white shadow-sm text-blue-900' : 'text-blue-700/70 hover:text-blue-900'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setWeekTarget('next')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              weekTarget === 'next' ? 'bg-white shadow-sm text-blue-900' : 'text-blue-700/70 hover:text-blue-900'
            }`}
          >
            Next Week
          </button>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleSubmit}
        disabled={!isReady || isGenerating}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-base transition-all duration-200"
        style={{
          backgroundColor: isReady && !isGenerating ? B.accent : B.border,
          color: isReady && !isGenerating ? '#fff' : B.textMuted,
          boxShadow: isReady && !isGenerating ? `0 4px 20px ${B.accent}40` : 'none',
          cursor: isReady && !isGenerating ? 'pointer' : 'not-allowed',
        }}
        onMouseEnter={e => { if (isReady && !isGenerating) e.currentTarget.style.backgroundColor = B.accentDark; }}
        onMouseLeave={e => { if (isReady && !isGenerating) e.currentTarget.style.backgroundColor = B.accent; }}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Building your Flight Plan…
          </>
        ) : (
          <>
            Generate Flight Plan
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="text-center text-xs" style={{ color: B.textMuted }}>
        You review and approve everything before anything goes live.
      </p>
    </motion.div>
  );
}

/* ─── Step 2: Review Screen ─── */
function ReviewScreen({
  arc,
  weekStartDate,
  onApprove,
  onBack,
  isScheduling,
  isPreviewOnly,
}: {
  arc: WeekArc;
  weekStartDate?: string;
  onApprove: (arc: WeekArc) => void;
  onBack: () => void;
  isScheduling: boolean;
  isPreviewOnly?: boolean;
}) {
  const [editedArc, setEditedArc] = useState<WeekArc>(arc);
  const [expandedPost, setExpandedPost] = useState<number>(0);
  const [editingContent, setEditingContent] = useState<{ postIdx: number; platformIdx: number } | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<Record<number, number>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [isUploadingImage, setIsUploadingImage] = useState<Record<number, boolean>>({});
  const [isDraggingPost, setIsDraggingPost] = useState<Record<number, boolean>>({});

  // Auto-adjust past times on initial mount if target week is current week
  useEffect(() => {
    const now = new Date();
    const monday = weekStartDate ? new Date(weekStartDate) : startOfWeek(now, { weekStartsOn: 1 });
    let adjustedCount = 0;

    setEditedArc(prev => {
      let hasChanges = false;
      const updatedPosts = prev.weekPosts.map(p => {
        if (p.deleted) return p;
        const targetDay = addDays(monday, p.day);
        const postDateTime = new Date(targetDay);
        postDateTime.setHours(p.scheduledHour, p.scheduledMinute, 0, 0);

        if (postDateTime.getTime() <= now.getTime()) {
          hasChanges = true;
          adjustedCount++;
          if (targetDay.getTime() < startOfDay(now).getTime()) {
            // Day has already passed (e.g. yesterday Monday): shift to today or next future day
            const todayDay = (now.getDay() + 6) % 7; // Monday = 0
            const safeHour = Math.min(23, now.getHours() + 1);
            return {
              ...p,
              day: todayDay,
              dayLabel: format(now, 'EEEE'),
              scheduledHour: safeHour,
            };
          } else {
            const safeHour = Math.min(23, now.getHours() + 1);
            return { ...p, scheduledHour: safeHour };
          }
        }
        return p;
      });

      if (!hasChanges) return prev;
      return { ...prev, weekPosts: updatedPosts };
    });
  }, [weekStartDate]);

  const togglePlatformEnabled = (postIdx: number, platformIdx: number) => {
    setEditedArc(prev => {
      const updated = { ...prev };
      updated.weekPosts = [...prev.weekPosts];
      const post = { ...prev.weekPosts[postIdx] };
      post.platforms = [...post.platforms];
      const current = post.platforms[platformIdx];
      const isCurrentlyEnabled = current.enabled !== false;
      post.platforms[platformIdx] = {
        ...current,
        enabled: !isCurrentlyEnabled,
      };
      updated.weekPosts[postIdx] = post;
      return updated;
    });
  };

  const updateContent = (postIdx: number, platformIdx: number, newContent: string) => {
    setEditedArc(prev => {
      const updated = { ...prev };
      updated.weekPosts = [...prev.weekPosts];
      updated.weekPosts[postIdx] = { ...prev.weekPosts[postIdx] };
      updated.weekPosts[postIdx].platforms = [...prev.weekPosts[postIdx].platforms];
      updated.weekPosts[postIdx].platforms[platformIdx] = {
        ...prev.weekPosts[postIdx].platforms[platformIdx],
        content: newContent,
        characterCount: newContent.length,
      };
      return updated;
    });
  };

  const removePost = (postIdx: number) => {
    setEditedArc(prev => ({
      ...prev,
      weekPosts: prev.weekPosts.map((p, i) =>
        i === postIdx ? { ...p, deleted: true } : p
      ),
    }));
  };

  const restorePost = (postIdx: number) => {
    setEditedArc(prev => ({
      ...prev,
      weekPosts: prev.weekPosts.map((p, i) =>
        i === postIdx ? { ...p, deleted: false } : p
      ),
    }));
  };

  const moveTime = (postIdx: number, delta: number) => {
    const now = new Date();
    const monday = weekStartDate ? new Date(weekStartDate) : startOfWeek(now, { weekStartsOn: 1 });
    const targetDay = addDays(monday, editedArc.weekPosts[postIdx].day);

    setEditedArc(prev => {
      const updated = { ...prev };
      updated.weekPosts = [...prev.weekPosts];
      const post = { ...prev.weekPosts[postIdx] };

      // 24-hour cycle: 0 to 23
      const newHour = (post.scheduledHour + delta + 24) % 24;
      const postDateTime = new Date(targetDay);
      postDateTime.setHours(newHour, post.scheduledMinute, 0, 0);

      if (postDateTime.getTime() <= now.getTime()) {
        return prev;
      }

      post.scheduledHour = newHour;
      updated.weekPosts[postIdx] = post;
      return updated;
    });
  };

  const setPostHour = (postIdx: number, hour: number) => {
    const now = new Date();
    const monday = weekStartDate ? new Date(weekStartDate) : startOfWeek(now, { weekStartsOn: 1 });
    const targetDay = addDays(monday, editedArc.weekPosts[postIdx].day);
    const postDateTime = new Date(targetDay);
    postDateTime.setHours(hour, editedArc.weekPosts[postIdx].scheduledMinute, 0, 0);

    if (postDateTime.getTime() <= now.getTime()) {
      return;
    }

    setEditedArc(prev => {
      const updated = { ...prev };
      updated.weekPosts = [...prev.weekPosts];
      const post = { ...prev.weekPosts[postIdx], scheduledHour: Math.min(23, Math.max(0, hour)) };
      updated.weekPosts[postIdx] = post;
      return updated;
    });
  };

  /* ─── Image upload per day (multiple images supported) ─── */
  const handleDayImageUpload = async (postIdx: number, files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 10 * 1024 * 1024) return;
    }

    setIsUploadingImage(prev => ({ ...prev, [postIdx]: true }));

    try {
      const uploadedUrls: string[] = [];
      for (const file of fileArray) {
        const res = await fetch('/api/composer/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        const uploadRes = await fetch(data.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!uploadRes.ok) throw new Error('Upload to storage failed');

        uploadedUrls.push(data.url);
      }

      setEditedArc(prev => {
        const updated = { ...prev };
        updated.weekPosts = [...prev.weekPosts];
        const post = { ...prev.weekPosts[postIdx] };
        const existing = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
        const combined = [...existing, ...uploadedUrls];
        post.imageUrls = combined;
        post.imageUrl = combined[0] || null;
        updated.weekPosts[postIdx] = post;
        return updated;
      });

      // images successfully added to post
    } catch {
      // upload error handled silently
    } finally {
      setIsUploadingImage(prev => ({ ...prev, [postIdx]: false }));
    }
  };

  const removeImage = (postIdx: number, imgIdx: number) => {
    setEditedArc(prev => {
      const updated = { ...prev };
      updated.weekPosts = [...prev.weekPosts];
      const post = { ...prev.weekPosts[postIdx] };
      const existing = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
      const filtered = existing.filter((_, idx) => idx !== imgIdx);
      post.imageUrls = filtered;
      post.imageUrl = filtered[0] || null;
      updated.weekPosts[postIdx] = post;
      return updated;
    });
  };

  const handleApproveWithValidation = () => {
    const now = new Date();
    const monday = weekStartDate ? new Date(weekStartDate) : startOfWeek(now, { weekStartsOn: 1 });

    // Validate that every active post has at least one platform selected
    for (let i = 0; i < editedArc.weekPosts.length; i++) {
      const p = editedArc.weekPosts[i];
      if (p.deleted) continue;
      const enabledPlatforms = p.platforms.filter(pf => pf.enabled !== false);
      if (enabledPlatforms.length === 0) {
        setExpandedPost(i);
        return;
      }
    }

    let hasPastPost = false;
    const validatedPosts = editedArc.weekPosts.map(p => {
      if (p.deleted) return p;
      const targetDay = addDays(monday, p.day);
      const postDateTime = new Date(targetDay);
      postDateTime.setHours(p.scheduledHour, p.scheduledMinute, 0, 0);

      if (postDateTime.getTime() <= now.getTime()) {
        hasPastPost = true;
        if (targetDay.getTime() < startOfDay(now).getTime()) {
          const todayDay = (now.getDay() + 6) % 7;
          return {
            ...p,
            day: todayDay,
            dayLabel: format(now, 'EEEE'),
            scheduledHour: Math.min(23, now.getHours() + 1),
          };
        } else {
          return { ...p, scheduledHour: Math.min(23, now.getHours() + 1) };
        }
      }
      return p;
    });

    if (hasPastPost) {
      const updatedArc = { ...editedArc, weekPosts: validatedPosts };
      setEditedArc(updatedArc);
      onApprove(updatedArc);
      return;
    }

    onApprove(editedArc);
  };

  const activePosts = editedArc.weekPosts.filter(p => !p.deleted);
  const totalVariants = activePosts.reduce(
    (sum, p) => sum + p.platforms.filter(pf => pf.enabled !== false).length,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm mb-3"
            style={{ color: B.textMuted }}
          >
            <ChevronLeft className="w-4 h-4" />
            Edit story
          </button>
          <h2 className="text-2xl font-bold" style={{ color: B.text }}>{editedArc.arcTitle}</h2>
          <p className="text-sm mt-1" style={{ color: B.textMuted }}>
            {activePosts.length} posts · {totalVariants} platform drafts
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize"
              style={{ backgroundColor: B.accentBg, color: B.accentDark }}>
              {editedArc.storyType}
            </span>
          </p>
        </div>
        <button
          onClick={handleApproveWithValidation}
          disabled={isScheduling || activePosts.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
          style={{
            backgroundColor: B.accent,
            color: '#fff',
            boxShadow: `0 4px 16px ${B.accent}40`,
            opacity: isScheduling || activePosts.length === 0 ? 0.6 : 1,
          }}
        >
          {isScheduling && <Loader2 className="w-4 h-4 animate-spin" />}
          {isScheduling ? 'Scheduling…' : 'Approve & Schedule'}
        </button>
      </div>

      {isPreviewOnly && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl text-sm"
          style={{ backgroundColor: B.warningBg, border: `1px solid ${B.warning}44`, color: B.warning }}>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Preview Mode:</strong> You haven&apos;t connected platforms yet. You can review and copy these drafts now, or connect accounts in Settings to schedule them automatically.
            </span>
          </div>
          <a
            href="/dashboard/settings"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-800 shadow-sm border border-gray-200 hover:bg-gray-50 flex-shrink-0"
          >
            Connect Accounts
          </a>
        </div>
      )}

      {/* Strategy note */}
      <div className="flex items-start gap-3 p-4 rounded-xl text-sm"
        style={{ backgroundColor: B.infoBg, color: B.info }}>
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Strategy note:</strong> {editedArc.storyTypeReason}
        </div>
      </div>

      {/* Post cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {editedArc.weekPosts.map((post, postIdx) => {
            if (post.deleted) {
              return (
                <motion.div
                  key={postIdx}
                  initial={{ opacity: 1, height: 'auto' }}
                  animate={{ opacity: 0.5, height: 'auto' }}
                  className="rounded-2xl border border-dashed p-4 flex items-center justify-between"
                  style={{ borderColor: B.border, background: B.bg }}
                >
                  <span className="text-sm" style={{ color: B.textMuted }}>
                    {post.dayLabel} — {post.arcBeat} — removed
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => restorePost(postIdx)}
                    className="gap-1 text-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </Button>
                </motion.div>
              );
            }

            const now = new Date();
            const monday = weekStartDate ? new Date(weekStartDate) : startOfWeek(now, { weekStartsOn: 1 });
            const targetDay = addDays(monday, post.day);
            const isTodayPost = isToday(targetDay);
            const postDateTime = new Date(targetDay);
            postDateTime.setHours(post.scheduledHour, post.scheduledMinute, 0, 0);
            const isPastTime = postDateTime.getTime() <= now.getTime();

            const isExpanded = expandedPost === postIdx;
            const currentPlatformIdx = activePlatformTab[postIdx] ?? 0;
            const currentPlatformDraft = post.platforms[currentPlatformIdx];
            const config = PLATFORM_CONFIG[currentPlatformDraft?.platform as PlatformType];
            const isOverLimit = currentPlatformDraft && config && currentPlatformDraft.characterCount > config.maxChars;
            const postImages = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);

            return (
              <motion.div
                key={postIdx}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ delay: postIdx * 0.03, duration: 0.2 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  border: `1px solid ${isExpanded ? B.accent : B.border}`,
                  backgroundColor: B.card,
                  boxShadow: isExpanded ? `0 0 0 3px ${B.accent}18, ${B.cardShadow}` : B.cardShadow,
                }}
              >
                {/* Post header row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedPost(isExpanded ? -1 : postIdx)}
                >
                  {/* Day badge */}
                  <div className="flex-shrink-0 text-center w-14">
                    <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: B.textMuted }}>
                      {post.dayLabel.slice(0, 3)}
                    </div>
                    <div className="text-2xl font-bold leading-none mt-0.5" style={{ color: B.text }}>
                      {post.scheduledHour.toString().padStart(2, '0')}
                      <span className="text-base font-normal">:{post.scheduledMinute.toString().padStart(2, '0')}</span>
                    </div>
                  </div>

                  {/* Arc beat */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate" style={{ color: B.text }}>{post.arcBeat}</span>
                      {isPastTime && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {targetDay.getTime() < startOfDay(now).getTime() ? 'Past day' : 'Time passed'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: B.textMuted }}>{post.arcBeatReason}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {post.platforms.map((p, pIdx) => {
                        const meta = PLATFORM_META[p.platform];
                        if (!meta) return null;
                        const isEnabled = p.enabled !== false;
                        return (
                          <button
                            key={p.platform}
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              togglePlatformEnabled(postIdx, pIdx);
                            }}
                            title={isEnabled ? `Click to exclude ${meta.name}` : `Click to include ${meta.name}`}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full text-xs font-medium transition-all cursor-pointer border px-2 py-0.5",
                              isEnabled
                                ? "hover:scale-105 shadow-xs"
                                : "opacity-40 hover:opacity-75 border-dashed line-through"
                            )}
                            style={{
                              backgroundColor: isEnabled ? meta.bg : B.bg,
                              color: isEnabled ? meta.color : B.textMuted,
                              borderColor: isEnabled ? `${meta.color}33` : B.border,
                            }}
                          >
                            <span style={{ fontSize: 11 }}>{meta.icon}</span>
                            <span>{meta.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Image thumbnails preview in row */}
                  {postImages.length > 0 && (
                    <div className="relative flex-shrink-0">
                      <img src={postImages[0]} alt="" className="w-9 h-9 rounded-lg object-cover border" style={{ borderColor: B.border }} />
                      {postImages.length > 1 && (
                        <span className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded-full bg-black/75 text-white">
                          +{postImages.length - 1}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); moveTime(postIdx, -1); }}
                      className="p-1.5 rounded-lg hover:opacity-70 transition-opacity text-xs font-mono"
                      style={{ color: B.textMuted }}
                      title="Move 1 hour earlier"
                    >
                      -1h
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); moveTime(postIdx, 1); }}
                      className="p-1.5 rounded-lg hover:opacity-70 transition-opacity text-xs font-mono"
                      style={{ color: B.textMuted }}
                      title="Move 1 hour later"
                    >
                      +1h
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); removePost(postIdx); }}
                      className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                      style={{ color: B.danger }}
                      title="Remove day"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" style={{ color: B.textMuted }} />
                    ) : (
                      <ChevronDown className="w-4 h-4" style={{ color: B.textMuted }} />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: B.border }}>

                        {/* 24-Hour Time Selector & Past Alert */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pt-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" style={{ color: B.accent }} />
                            <span className="text-xs font-semibold" style={{ color: B.text }}>Schedule Hour (24h):</span>
                            <select
                              value={post.scheduledHour}
                              onChange={e => setPostHour(postIdx, parseInt(e.target.value, 10))}
                              className="text-xs font-mono font-medium px-2 py-1 rounded-lg border bg-transparent"
                              style={{ borderColor: B.border, color: B.text }}
                            >
                              {Array.from({ length: 24 }, (_, h) => {
                                const isPastH = isTodayPost && h <= now.getHours();
                                return (
                                  <option key={h} value={h} disabled={isPastH}>
                                    {h.toString().padStart(2, '0')}:00 {isPastH ? '(passed)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {isPastTime && (
                            <button
                              onClick={() => setPostHour(postIdx, Math.min(23, now.getHours() + 1))}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors"
                            >
                              Set to next upcoming hour ({Math.min(23, now.getHours() + 1)}:00)
                            </button>
                          )}
                        </div>

                        {/* Multiple Image upload section */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: B.textMuted }}>
                              <ImageIcon className="w-3.5 h-3.5" />
                              Post Images ({postImages.length})
                            </label>
                            <span className="text-[11px]" style={{ color: B.textMuted }}>
                              Upload multiple images (up to 10)
                            </span>
                          </div>

                          <div
                            onDragOver={e => { e.preventDefault(); setIsDraggingPost(prev => ({ ...prev, [postIdx]: true })); }}
                            onDragLeave={e => { e.preventDefault(); setIsDraggingPost(prev => ({ ...prev, [postIdx]: false })); }}
                            onDrop={e => {
                              e.preventDefault();
                              setIsDraggingPost(prev => ({ ...prev, [postIdx]: false }));
                              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                handleDayImageUpload(postIdx, e.dataTransfer.files);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-2.5 flex-wrap p-2 rounded-xl transition-all border border-dashed",
                              isDraggingPost[postIdx] ? "border-amber-500 bg-amber-500/10" : "border-transparent"
                            )}
                          >
                            {postImages.map((imgUrl, imgIdx) => (
                              <div key={imgIdx} className="relative group/img w-16 h-16 rounded-xl overflow-hidden border shadow-xs" style={{ borderColor: B.border }}>
                                <img
                                  src={imgUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(postIdx, imgIdx)}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white"
                                  title="Remove image"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}

                            {postImages.length < 10 && (
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[postIdx]?.click()}
                                disabled={isUploadingImage[postIdx]}
                                className="w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-0.5 transition-all hover:border-solid hover:opacity-80 disabled:opacity-50"
                                style={{ borderColor: B.border, color: B.textMuted, backgroundColor: B.bg }}
                              >
                                {isUploadingImage[postIdx] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <ImagePlus className="w-4 h-4" />
                                    <span className="text-[9px] font-medium">Add Image</span>
                                  </>
                                )}
                              </button>
                            )}

                            <input
                              ref={el => { fileInputRefs.current[postIdx] = el; }}
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const files = e.target.files;
                                if (files && files.length > 0) handleDayImageUpload(postIdx, files);
                                e.target.value = '';
                              }}
                            />
                          </div>
                        </div>

                        {/* Platform Tabs (from Flight Plan) */}
                        <div className="flex gap-1 p-1 rounded-xl" style={{ background: B.bg }}>
                          {post.platforms.map((p, pIdx) => {
                            const pcfg = PLATFORM_CONFIG[p.platform as PlatformType];
                            if (!pcfg) return null;
                            const Icn = pcfg.icon;
                            const isActive = currentPlatformIdx === pIdx;
                            const isPlatformEnabled = p.enabled !== false;
                            return (
                              <button
                                key={p.platform}
                                onClick={() => setActivePlatformTab(prev => ({ ...prev, [postIdx]: pIdx }))}
                                className={cn(
                                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                  isActive ? 'shadow-sm' : '',
                                  !isPlatformEnabled ? 'opacity-50' : ''
                                )}
                                style={isActive
                                  ? { background: B.card, color: isPlatformEnabled ? B.text : B.textMuted }
                                  : { color: B.textMuted }
                                }
                              >
                                <Icn className="w-3.5 h-3.5" />
                                <span className={cn('hidden sm:inline', !isPlatformEnabled && 'line-through')}>{pcfg.name}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Upload toggle bar for currently selected platform */}
                        {currentPlatformDraft && (
                          <div
                            className="flex items-center justify-between p-2.5 rounded-xl border transition-colors text-xs"
                            style={{
                              backgroundColor: currentPlatformDraft.enabled !== false ? B.card : B.bg,
                              borderColor: B.border,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold" style={{ color: B.text }}>
                                Upload to {PLATFORM_CONFIG[currentPlatformDraft.platform as PlatformType]?.name || currentPlatformDraft.platform}:
                              </span>
                              <span style={{ color: currentPlatformDraft.enabled !== false ? B.success : B.textMuted }}>
                                {currentPlatformDraft.enabled !== false ? '• Included in Flight Plan' : '• Excluded / skipped for this day'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => togglePlatformEnabled(postIdx, currentPlatformIdx)}
                              className={cn(
                                "px-3 py-1 rounded-lg font-semibold transition-all border text-xs flex items-center gap-1.5 cursor-pointer",
                                currentPlatformDraft.enabled !== false
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                  : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                              )}
                            >
                              {currentPlatformDraft.enabled !== false ? (
                                <span>Included</span>
                              ) : (
                                <span>Excluded</span>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Content Editor for active platform */}
                        {currentPlatformDraft && (
                          <div className={cn("space-y-3", currentPlatformDraft.enabled === false && "opacity-60")}>
                            <Textarea
                              value={currentPlatformDraft.content}
                              onChange={e => updateContent(postIdx, currentPlatformIdx, e.target.value)}
                              rows={6}
                              className="resize-y rounded-xl text-sm"
                              style={{ borderColor: B.border, background: B.bg }}
                            />

                            {/* Stats bar */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3 text-xs" style={{ color: B.textMuted }}>
                                <span className={isOverLimit ? 'text-red-500 font-semibold' : ''}>
                                  {currentPlatformDraft.characterCount}/{config?.maxChars || '?'} chars
                                </span>
                                {currentPlatformDraft.hashtags.length > 0 && (
                                  <span>{currentPlatformDraft.hashtags.length} hashtags</span>
                                )}
                                {currentPlatformDraft.autoFirstComment && (
                                  <span className="italic">Has auto first comment</span>
                                )}
                              </div>
                            </div>

                            {/* Hashtags */}
                            {currentPlatformDraft.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {currentPlatformDraft.hashtags.map(tag => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded-md text-xs font-medium"
                                    style={{ background: B.accentBg, color: B.accentDark }}
                                  >
                                    #{tag.replace(/^#+/, '')}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Auto first comment */}
                            {currentPlatformDraft.autoFirstComment && (
                              <div className="rounded-xl p-3 border" style={{ background: B.bg, borderColor: B.border }}>
                                <p className="text-xs font-semibold mb-1" style={{ color: B.textMuted }}>
                                  Auto first comment (posted 90s after)
                                </p>
                                <p className="text-sm" style={{ color: B.textSecondary }}>
                                  {currentPlatformDraft.autoFirstComment}
                                </p>
                              </div>
                            )}

                            {/* First comment hint */}
                            {currentPlatformDraft.firstCommentHint && (
                              <div className="rounded-xl p-3 border" style={{ background: B.bg, borderColor: B.border }}>
                                <p className="text-xs font-semibold mb-1" style={{ color: B.textMuted }}>
                                  Suggested first comment
                                </p>
                                <p className="text-sm" style={{ color: B.textSecondary }}>
                                  {currentPlatformDraft.firstCommentHint}
                                </p>
                              </div>
                            )}

                            {/* Cascading offset info */}
                            {currentPlatformDraft.schedulingOffsetMinutes && currentPlatformDraft.schedulingOffsetMinutes > 0 && (
                              <div className="text-xs" style={{ color: B.textMuted }}>
                                Staggered release: +{currentPlatformDraft.schedulingOffsetMinutes} min after base time
                              </div>
                            )}

                            {isOverLimit && (
                              <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2" style={{ background: B.dangerBg, color: B.danger }}>
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                Over limit by {currentPlatformDraft.characterCount - (config?.maxChars || 0)} characters
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom approve */}
      {activePosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 rounded-2xl border p-4 flex items-center justify-between shadow-xl backdrop-blur-sm"
          style={{ background: `${B.card}ee`, borderColor: B.cardBorder }}
        >
          <div>
            <p className="font-semibold text-sm" style={{ color: B.success }}>
              {activePosts.length} posts, {totalVariants} platform variants ready
            </p>
            <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>
              Nothing goes live without your approval
            </p>
          </div>
          <button
            onClick={handleApproveWithValidation}
            disabled={isScheduling || activePosts.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ backgroundColor: B.success, color: '#fff', boxShadow: `0 4px 16px ${B.success}40` }}
          >
            {isScheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isScheduling ? 'Scheduling…' : 'Schedule All'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── Scheduled Post Details & Edit Modal ─── */
function ScheduledPostModal({
  post,
  isOpen,
  onClose,
  onUpdated,
  onCancelled,
}: {
  post: CanvasPost | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onCancelled: () => void;
}) {
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [editedHashtags, setEditedHashtags] = useState<Record<string, string[]>>({});
  const [editedMediaUrls, setEditedMediaUrls] = useState<Record<string, Array<{ url: string; type?: string }>>>({});
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showRescheduleInput, setShowRescheduleInput] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isModalDragging, setIsModalDragging] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const maxDateTime = useMemo(() => {
    const nextSunday = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
    return format(nextSunday, "yyyy-MM-dd'T'23:59");
  }, []);

  useEffect(() => {
    if (post) {
      setConfirmCancel(false);
      setActiveVariantIndex(0);
      const contentMap: Record<string, string> = {};
      const hashtagsMap: Record<string, string[]> = {};
      const mediaMap: Record<string, Array<{ url: string; type?: string }>> = {};
      post.platforms.forEach(p => {
        contentMap[p.variantId] = p.content;
        hashtagsMap[p.variantId] = p.hashtags ?? [];
        mediaMap[p.variantId] = p.mediaUrls ? [...p.mediaUrls] : [];
      });
      setEditedContent(contentMap);
      setEditedHashtags(hashtagsMap);
      setEditedMediaUrls(mediaMap);
      if (post.scheduledAt) {
        const d = new Date(post.scheduledAt);
        const pad = (n: number) => String(n).padStart(2, '0');
        const localFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setRescheduleTime(localFormatted);
      }
      setShowRescheduleInput(false);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const currentVariant = post.platforms[activeVariantIndex] || post.platforms[0];
  if (!currentVariant) return null;

  const isPublished = post.status === 'published';
  const currentContent = editedContent[currentVariant.variantId] ?? currentVariant.content;
  const currentTags = editedHashtags[currentVariant.variantId] ?? currentVariant.hashtags ?? [];
  const currentMedia = editedMediaUrls[currentVariant.variantId] ?? currentVariant.mediaUrls ?? [];

  const variantsWithChanges = post.platforms.filter(p => {
    const c = editedContent[p.variantId] ?? p.content;
    const t = editedHashtags[p.variantId] ?? p.hashtags ?? [];
    const m = editedMediaUrls[p.variantId] ?? p.mediaUrls ?? [];
    return (
      c !== p.content ||
      JSON.stringify(t) !== JSON.stringify(p.hashtags ?? []) ||
      JSON.stringify(m) !== JSON.stringify(p.mediaUrls ?? [])
    );
  });
  const hasChanges = variantsWithChanges.length > 0;

  const platformMeta = PLATFORM_META[currentVariant.platform] || {
    name: currentVariant.platform,
    color: '#666',
    bg: '#F0F0F0',
    icon: '•',
  };

  const handleUploadModalMedia = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 10 * 1024 * 1024) return;
    }

    setIsUploadingMedia(true);

    try {
      const uploadedMedia: Array<{ url: string; type: string }> = [];
      for (const file of fileArray) {
        const res = await fetch('/api/composer/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        const uploadRes = await fetch(data.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!uploadRes.ok) throw new Error('Upload to storage failed');

        uploadedMedia.push({ url: data.url, type: 'image' });
      }

      setEditedMediaUrls(prev => {
        const existing = prev[currentVariant.variantId] ?? currentVariant.mediaUrls ?? [];
        return {
          ...prev,
          [currentVariant.variantId]: [...existing, ...uploadedMedia],
        };
      });

      // modal images successfully attached
    } catch {
      // upload error handled silently
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleRemoveModalMedia = (index: number) => {
    setEditedMediaUrls(prev => {
      const existing = prev[currentVariant.variantId] ?? currentVariant.mediaUrls ?? [];
      return {
        ...prev,
        [currentVariant.variantId]: existing.filter((_, idx) => idx !== index),
      };
    });
  };

  const handleApplyMediaToAllVariants = () => {
    setEditedMediaUrls(prev => {
      const nextMap = { ...prev };
      post.platforms.forEach(p => {
        nextMap[p.variantId] = [...currentMedia];
      });
      return nextMap;
    });
  };

  const handleSaveVariant = async () => {
    if (variantsWithChanges.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      for (const v of variantsWithChanges) {
        const c = editedContent[v.variantId] ?? v.content;
        const t = editedHashtags[v.variantId] ?? v.hashtags ?? [];
        const m = editedMediaUrls[v.variantId] ?? v.mediaUrls ?? [];
        const res = await fetch(`/api/publish/variants/${v.variantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: c,
            hashtags: t,
            mediaUrls: m,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to update ${v.platform}`);
        }
        v.content = c;
        v.hashtags = t;
        v.mediaUrls = m;
      }

      onUpdated();
    } catch {
      // handle save error
    } finally {
      setIsSaving(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleTime) return;
    const targetDate = new Date(rescheduleTime);
    if (isNaN(targetDate.getTime()) || targetDate.getTime() <= Date.now()) return;
    const endOfNextWeek = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
    if (targetDate.getTime() > endOfNextWeek.getTime()) return;

    setIsRescheduling(true);
    try {
      const res = await fetch(`/api/composer/schedule/${post.postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newScheduledAt: targetDate.toISOString() }),
      });
      if (!res.ok) return;
      post.scheduledAt = targetDate.toISOString();
      setShowRescheduleInput(false);
      onUpdated();
    } catch {
      // reschedule error handled
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleCancelPost = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/composer/schedule/${post.postId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onCancelled();
        onClose();
      }
    } catch {
      // cancel error handled
    } finally {
      setIsCancelling(false);
    }
  };

  const addTag = () => {
    const clean = newTag.trim().replace(/^#/, '');
    if (!clean || currentTags.includes(clean)) return;
    setEditedHashtags(prev => ({
      ...prev,
      [currentVariant.variantId]: [...currentTags, clean],
    }));
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setEditedHashtags(prev => ({
      ...prev,
      [currentVariant.variantId]: currentTags.filter(t => t !== tagToRemove),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border"
        style={{ backgroundColor: B.card, borderColor: B.border }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: B.border }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: B.accentBg }}>
              <Calendar className="w-5 h-5" style={{ color: B.accentDark }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base" style={{ color: B.text }}>
                  Scheduled Post
                </h3>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: post.status === 'scheduled' ? B.infoBg : B.successBg,
                    color: post.status === 'scheduled' ? B.info : B.success,
                  }}
                >
                  {post.status}
                </span>
              </div>
              <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: B.textMuted }}>
                <Clock className="w-3.5 h-3.5" />
                {post.scheduledAt
                  ? format(new Date(post.scheduledAt), 'EEEE, MMM d, yyyy • h:mm a')
                  : 'Not scheduled'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
            style={{ color: B.textMuted }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Reschedule Control Card */}
          <div
            className="p-3.5 rounded-xl border space-y-3"
            style={{ backgroundColor: B.bg, borderColor: B.border }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: B.text }}>
                <Clock className="w-4 h-4" style={{ color: B.accent }} />
                <span>Scheduled Time:</span>
                <span className="font-mono font-normal">
                  {post.scheduledAt ? format(new Date(post.scheduledAt), 'MMM d, yyyy @ h:mm a') : '--'}
                </span>
              </div>
              <button
                onClick={() => setShowRescheduleInput(prev => !prev)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors hover:opacity-80"
                style={{ backgroundColor: B.card, border: `1px solid ${B.border}`, color: B.accentDark }}
              >
                {showRescheduleInput ? 'Cancel' : 'Change Time'}
              </button>
            </div>

            {showRescheduleInput && (
              <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: `${B.border}80` }}>
                <input
                  type="datetime-local"
                  value={rescheduleTime}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  max={maxDateTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border flex-1"
                  style={{ backgroundColor: B.card, borderColor: B.border, color: B.text }}
                />
                <button
                  onClick={handleReschedule}
                  disabled={isRescheduling}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: B.accent }}
                >
                  {isRescheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Reschedule
                </button>
              </div>
            )}
          </div>

          {/* Platform Variant Tabs */}
          <div>
            <label className="text-xs font-semibold block mb-2" style={{ color: B.textMuted }}>
              PLATFORM VARIANTS ({post.platforms.length})
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {post.platforms.map((v, idx) => {
                const meta = PLATFORM_META[v.platform] || { name: v.platform, color: '#666', bg: '#F0F0F0', icon: '•' };
                const isSelected = idx === activeVariantIndex;
                const hasPendingEdit = editedContent[v.variantId] && editedContent[v.variantId] !== v.content;
                return (
                  <button
                    key={v.variantId}
                    onClick={() => setActiveVariantIndex(idx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isSelected ? meta.bg : B.bg,
                      color: isSelected ? meta.color : B.textMuted,
                      border: `1.5px solid ${isSelected ? meta.color : B.border}`,
                      boxShadow: isSelected ? `0 2px 8px ${meta.color}25` : 'none',
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.name}</span>
                    {hasPendingEdit && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold" style={{ color: B.text }}>
                {platformMeta.name} Content
              </label>
              <span className="text-[11px] font-mono" style={{ color: B.textMuted }}>
                {currentContent.length} chars
              </span>
            </div>
            <textarea
              rows={6}
              value={currentContent}
              onChange={e => setEditedContent(prev => ({
                ...prev,
                [currentVariant.variantId]: e.target.value,
              }))}
              className="w-full text-sm p-3 rounded-xl border focus:outline-none transition-all leading-relaxed"
              style={{
                backgroundColor: B.card,
                borderColor: B.border,
                color: B.text,
              }}
              placeholder={`Write content for ${platformMeta.name}...`}
            />
          </div>

          {/* Hashtags Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block" style={{ color: B.text }}>
              Hashtags
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {currentTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: B.bg, color: B.accentDark, border: `1px solid ${B.border}` }}
                >
                  #{tag.replace(/^#+/, '')}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="add tag..."
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  className="text-xs px-2.5 py-1 rounded-lg border focus:outline-none w-24"
                  style={{ backgroundColor: B.card, borderColor: B.border, color: B.text }}
                />
                <button
                  onClick={addTag}
                  className="p-1 rounded-lg text-xs font-semibold hover:opacity-80"
                  style={{ backgroundColor: B.accentBg, color: B.accentDark }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Attached Media Section (Upload & Manage images for scheduled posts) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: B.text }}>
                <ImageIcon className="w-3.5 h-3.5" style={{ color: B.accent }} />
                Attached Images ({currentMedia.length})
              </label>
              <div className="flex items-center gap-2">
                {post.platforms.length > 1 && currentMedia.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyMediaToAllVariants}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: B.accentBg, color: B.accentDark }}
                    title="Copy these images to all other platform variants of this post"
                  >
                    Apply to all platforms
                  </button>
                )}
                <input
                  ref={modalFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleUploadModalMedia(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => modalFileInputRef.current?.click()}
                  disabled={isUploadingMedia || isPublished}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: B.accent, color: '#fff' }}
                >
                  {isUploadingMedia ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ImagePlus className="w-3 h-3" />
                  )}
                  Add Images
                </button>
              </div>
            </div>

            {currentMedia.length > 0 ? (
              <div
                onDragOver={e => { e.preventDefault(); setIsModalDragging(true); }}
                onDragLeave={e => { e.preventDefault(); setIsModalDragging(false); }}
                onDrop={e => {
                  e.preventDefault();
                  setIsModalDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleUploadModalMedia(e.dataTransfer.files);
                  }
                }}
                className={cn(
                  "flex flex-wrap gap-2.5 p-2 rounded-xl border transition-colors",
                  isModalDragging ? "border-amber-500 bg-amber-500/10" : ""
                )}
                style={{ backgroundColor: B.bg, borderColor: isModalDragging ? undefined : B.border }}
              >
                {currentMedia.map((m, i) => (
                  <div
                    key={i}
                    className="w-20 h-20 rounded-xl overflow-hidden border relative group shadow-xs"
                    style={{ borderColor: B.border }}
                  >
                    <img src={m.url} alt={`Attached ${i + 1}`} className="w-full h-full object-cover" />
                    {!isPublished && (
                      <button
                        type="button"
                        onClick={() => handleRemoveModalMedia(i)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {currentMedia.length < 10 && !isPublished && (
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    disabled={isUploadingMedia}
                    className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ borderColor: B.border, color: B.textMuted, backgroundColor: B.card }}
                  >
                    {isUploadingMedia ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="w-4 h-4" />
                        <span className="text-[10px]">Add</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={() => !isPublished && modalFileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsModalDragging(true); }}
                onDragLeave={e => { e.preventDefault(); setIsModalDragging(false); }}
                onDrop={e => {
                  e.preventDefault();
                  setIsModalDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleUploadModalMedia(e.dataTransfer.files);
                  }
                }}
                className={cn(
                  "p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-center transition-colors",
                  isModalDragging ? "border-amber-500 bg-amber-500/10" : "",
                  !isPublished && "cursor-pointer hover:opacity-80"
                )}
                style={{ backgroundColor: B.bg, borderColor: isModalDragging ? undefined : B.border }}
              >
                <ImagePlus className="w-5 h-5" style={{ color: B.textMuted }} />
                <span className="text-xs font-medium" style={{ color: B.text }}>
                  No images attached yet
                </span>
                <span className="text-[11px]" style={{ color: B.textMuted }}>
                  Drop images here or click to browse (PNG, JPG, WebP)
                </span>
              </div>
            )}
          </div>

          {/* Auto First Comment */}
          {currentVariant.autoFirstComment && (
            <div className="p-3 rounded-xl border space-y-1 text-xs" style={{ backgroundColor: B.bg, borderColor: B.border }}>
              <span className="font-semibold" style={{ color: B.accentDark }}>Auto First Comment:</span>
              <p style={{ color: B.textSecondary }}>{currentVariant.autoFirstComment}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex items-center justify-between gap-3 bg-neutral-50/50" style={{ borderColor: B.border }}>
          {confirmCancel ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelPost}
                disabled={isCancelling}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirm Cancel
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-500 hover:bg-neutral-100 transition-colors"
              >
                Keep Post
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmCancel(true)}
              disabled={isCancelling}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Cancel Post
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium border hover:bg-neutral-100 transition-colors"
              style={{ borderColor: B.border, color: B.textMuted }}
            >
              Close
            </button>
            <button
              onClick={handleSaveVariant}
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity disabled:opacity-50 shadow-sm"
              style={{ backgroundColor: B.accent }}
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {hasChanges
                ? (variantsWithChanges.length > 1 ? `Save Changes (${variantsWithChanges.length})` : 'Save Changes')
                : 'Saved'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Week Canvas ─── */
function WeekCanvas({
  workspaceId,
  onNewArc,
  onPostCountChange,
}: {
  workspaceId: string;
  onNewArc: () => void;
  onPostCountChange?: (count: number) => void;
}) {
  const [posts, setPosts] = useState<CanvasPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [holdActive, setHoldActive] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CanvasPost | null>(null);

  const weekStart = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(monday, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const loadCanvas = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/composer/schedule/week?weekStart=${weekStart.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        const loadedPosts: CanvasPost[] = data.posts ?? [];
        setPosts(loadedPosts);
        onPostCountChange?.(loadedPosts.length);
      }
    } catch {
      // load canvas error
    } finally {
      setIsLoading(false);
    }
  }, [weekStart, onPostCountChange]);

  useEffect(() => { loadCanvas(); }, [loadCanvas]);

  const handleCancel = async (postId: string) => {
    const res = await fetch(`/api/composer/schedule/${postId}`, { method: 'DELETE' });
    if (res.ok) {
      loadCanvas();
    }
  };

  const handleHold = async () => {
    setIsHolding(true);
    try {
      if (holdActive) {
        const res = await fetch('/api/composer/schedule/hold', { method: 'DELETE' });
        if (res.ok) { setHoldActive(false); }
      } else {
        const res = await fetch('/api/composer/schedule/hold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ holdHours: 3 }),
        });
        if (res.ok) { setHoldActive(true); }
      }
    } finally {
      setIsHolding(false);
    }
  };

  const postsByDay = useMemo(() => {
    const map = new Map<string, CanvasPost[]>();
    for (const post of posts) {
      if (!post.scheduledAt) continue;
      const day = format(new Date(post.scheduledAt), 'yyyy-MM-dd');
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(post);
    }
    return map;
  }, [posts]);

  const statusColor = (status: string) => {
    if (status === 'published') return B.success;
    if (status === 'failed') return B.danger;
    if (status === 'scheduled') return B.info;
    return B.textMuted;
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
            disabled={weekOffset <= 0}
            className="p-2 rounded-xl transition-all hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: B.card, border: `1px solid ${B.border}`, color: B.textMuted }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="font-semibold text-sm" style={{ color: B.text }}>
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </p>
            <p className="text-xs" style={{ color: B.textMuted }}>
              {posts.length} posts scheduled
            </p>
          </div>
          <button onClick={() => setWeekOffset(w => Math.min(1, w + 1))}
            disabled={weekOffset >= 1}
            className="p-2 rounded-xl transition-all hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: B.card, border: `1px solid ${B.border}`, color: B.textMuted }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleHold}
            disabled={isHolding}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: holdActive ? B.warningBg : B.card,
              border: `1px solid ${holdActive ? B.warning : B.border}`,
              color: holdActive ? B.warning : B.textMuted,
            }}
          >
            {isHolding ? <Loader2 className="w-4 h-4 animate-spin" /> :
              holdActive ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
            {holdActive ? 'Release Queue' : 'Hold My Queue'}
          </button>
        </div>
      </div>

      {/* Hold banner */}
      <AnimatePresence>
        {holdActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: B.warningBg, border: `1px solid ${B.warning}44`, color: B.warning }}
          >
            <PauseCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Queue is held.</strong> Scheduled posts in the next 3 hours will be skipped.
              They won&apos;t be re-sent automatically — release the queue to resume.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: B.accent }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ backgroundColor: B.accentBg }}>
            <Calendar className="w-8 h-8" style={{ color: B.accent }} />
          </div>
          <div>
            <p className="font-semibold text-lg" style={{ color: B.text }}>Nothing scheduled yet</p>
            <p className="text-sm mt-1" style={{ color: B.textMuted }}>
              Schedule your story across all connected platforms.
            </p>
          </div>
          <button
            onClick={onNewArc}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: B.accent, color: '#fff', boxShadow: `0 4px 16px ${B.accent}40` }}
          >
            Plan My Week
          </button>
        </div>
      ) : (
        /* 7-day grid */
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayPosts = postsByDay.get(dayKey) ?? [];
            const isNow = isToday(day);

            return (
              <div key={dayKey} className="space-y-2">
                {/* Day header */}
                <div className="text-center pb-2" style={{ borderBottom: `1px solid ${B.border}` }}>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: B.textMuted }}>
                    {format(day, 'EEE')}
                  </p>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-1 text-sm font-bold"
                    style={{
                      backgroundColor: isNow ? B.accent : 'transparent',
                      color: isNow ? '#fff' : B.text,
                    }}
                  >
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Post cards for this day */}
                <div className="space-y-1.5 min-h-[80px]">
                  {dayPosts.map(post => (
                    <motion.div
                      key={post.postId}
                      layout
                      onClick={() => setSelectedPost(post)}
                      className="rounded-xl p-2.5 group relative transition-all hover:scale-[1.02]"
                      style={{
                        backgroundColor: B.card,
                        border: `1px solid ${B.border}`,
                        cursor: 'pointer',
                        boxShadow: B.cardShadow,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-medium flex items-center gap-1" style={{ color: B.textMuted }}>
                          <Clock className="w-3 h-3" />
                          {post.scheduledAt ? format(new Date(post.scheduledAt), 'HH:mm') : '--:--'}
                        </span>
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: statusColor(post.status) }}
                        />
                      </div>

                      <p className="text-xs leading-snug line-clamp-2" style={{ color: B.textSecondary }}>
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1.5" style={{ borderTop: `1px solid ${B.border}50` }}>
                        <div className="flex flex-wrap gap-1">
                          {post.platforms.slice(0, 3).map(v => {
                            const meta = PLATFORM_META[v.platform];
                            return meta ? (
                              <span
                                key={v.variantId}
                                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{ backgroundColor: meta.bg, color: meta.color }}
                              >
                                {meta.name.slice(0, 2)}
                              </span>
                            ) : null;
                          })}
                          {post.platforms.length > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: B.border, color: B.textMuted }}>
                              +{post.platforms.length - 3}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: B.accentDark }}>
                          <Edit3 className="w-2.5 h-2.5" />
                          Edit
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scheduled Post Detail & Edit Modal */}
      <ScheduledPostModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onUpdated={loadCanvas}
        onCancelled={loadCanvas}
      />
    </div>
  );
}

/* ─── Main FlightPlanClient ─── */
function FlightPlanInner({ userId, workspaceId }: { userId: string; workspaceId: string }) {
  const [view, setView] = useState<ViewMode>('canvas');
  const [arc, setArc] = useState<WeekArc | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPreviewOnly, setIsPreviewOnly] = useState(false);
  const [storyData, setStoryData] = useState<any>(null);
  const [postCount, setPostCount] = useState<number>(0);
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformType[]>([]);

  // Load connected platforms
  useEffect(() => {
    async function loadConnections() {
      try {
        const res = await fetch('/api/platform/connections', { credentials: 'include' });
        const data = await res.json();
        if (data.connections) {
          const active = Object.values(data.connections)
            .filter((c: any) => c.status === 'connected')
            .map((c: any) => c.platform as PlatformType);
          setConnectedPlatforms(active);
        }
      } catch { /* silent */ }
    }
    loadConnections();
  }, []);

  const handleGenerate = async (data: any) => {
    setIsGenerating(true);
    setStoryData(data);

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch('/api/composer/arc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coreStory: data.coreStory,
          whatChanged: data.whatChanged,
          whatWentWrong: data.whatWentWrong,
          oneRealNumber: data.oneRealNumber,
          weekStartDate: data.weekStartDate,
          audienceTimezone: tz,
          selectedPlatforms: data.selectedPlatforms,
        }),
      });

      const json = await res.json();
      if (!res.ok) return;

      setIsPreviewOnly(!!json.isPreviewOnly);
      setArc(json.arc);
      setView('review');
    } catch {
      // generation error handled
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (approvedArc: WeekArc) => {
    if (isPreviewOnly) return;
    setIsScheduling(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const activePosts = approvedArc.weekPosts
        .filter(p => !p.deleted)
        .filter(p => p.platforms.some(pf => pf.enabled !== false));

      if (activePosts.length === 0) return;

      const res = await fetch('/api/composer/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arcTitle: approvedArc.arcTitle,
          coreStory: storyData?.coreStory ?? '',
          storyType: approvedArc.storyType,
          weekStartDate: storyData?.weekStartDate,
          userTimezone: tz,
          scheduleMode: 'arc',
          posts: activePosts.map(p => {
            const allImages = p.imageUrls || (p.imageUrl ? [p.imageUrl] : []);
            const mediaObjects = allImages.map(u => ({ url: u, type: 'image' }));
            const enabledPlatforms = p.platforms.filter(pf => pf.enabled !== false);
            return {
              day: p.day,
              scheduledHour: p.scheduledHour,
              scheduledMinute: p.scheduledMinute,
              strategy: 'cascading',
              arcBeat: p.arcBeat,
              imageUrl: allImages[0] || null,
              imageUrls: allImages,
              platforms: enabledPlatforms.map(pf => ({
                platform: pf.platform,
                content: pf.content,
                hashtags: pf.hashtags,
                firstCommentHint: pf.firstCommentHint,
                autoFirstComment: pf.autoFirstComment,
                schedulingOffsetMinutes: pf.schedulingOffsetMinutes ?? 0,
                mediaUrls: mediaObjects,
              })),
            };
          }),
        }),
      });

      if (!res.ok) return;

      setView('canvas');
      setArc(null);
    } catch {
      // schedule error handled
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: B.text }}>Flight Plan</h1>
          <p className="text-sm" style={{ color: B.textMuted }}>
            Plan and schedule your weekly content across all connected platforms.
          </p>
        </div>
        {view === 'canvas' && postCount > 0 && (
          <button
            onClick={() => setView('story')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{ backgroundColor: B.accent, color: '#fff', boxShadow: `0 4px 16px ${B.accent}40` }}
          >
            Plan New Week
          </button>
        )}
      </div>

      {/* Step dots for story → review flow */}
      {(view === 'story' || view === 'review') && (
        <div className="flex items-center justify-between">
          <StepDots current={view === 'story' ? 0 : 1} total={2} />
          <button
            onClick={() => { setView('canvas'); setArc(null); }}
            className="text-sm flex items-center gap-1"
            style={{ color: B.textMuted }}
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
      )}

      {/* Views */}
      <AnimatePresence mode="wait">
        {view === 'story' && (
          <StoryIntake
            key="story"
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            connectedPlatforms={connectedPlatforms}
          />
        )}
        {view === 'review' && arc && (
          <ReviewScreen
            key="review"
            arc={arc}
            weekStartDate={storyData?.weekStartDate}
            isPreviewOnly={isPreviewOnly}
            onApprove={handleApprove}
            onBack={() => setView('story')}
            isScheduling={isScheduling}
          />
        )}
        {view === 'canvas' && (
          <WeekCanvas
            key="canvas"
            workspaceId={workspaceId}
            onNewArc={() => setView('story')}
            onPostCountChange={setPostCount}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Wrapper with Suspense ─── */
export default function FlightPlanClient({ userId, workspaceId }: { userId: string; workspaceId: string }) {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: B.textMuted }} />
      </div>
    }>
      <FlightPlanInner userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}
