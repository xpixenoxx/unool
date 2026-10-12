'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Sparkles, Send, Calendar, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Trash2, AlertCircle, CheckCircle,
  ImagePlus, X, Linkedin, Twitter, MessageSquare, Facebook, Instagram,
  Youtube, Cloud, Image as ImageIcon, Hash, Twitch, Dribbble,
  GraduationCap, Store, Gamepad2, Video, Zap, FileText, Globe, Mail,
  BookOpen, Code2, RotateCcw, ArrowRight, Info,
  PauseCircle, PlayCircle, Radio,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, isToday } from 'date-fns';

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

  const handleSubmit = () => {
    if (!coreStory.trim() || coreStory.trim().length < 20) {
      toast.error('Please write a bit more — describe what happened or your content idea (at least 20 chars).');
      return;
    }
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
          <Sparkles className="w-3 h-3" />
          15-Minute Content Sprint
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: B.text }}>
          What did you build, learn,<br />or ship this week?
        </h1>
        <p className="text-base" style={{ color: B.textMuted }}>
          One honest paragraph. Unool turns it into your entire week of content.
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
            Planning week of <strong>{format(new Date(targetMonday), 'MMMM d')}</strong> — {format(addDays(new Date(targetMonday), 6), 'MMMM d, yyyy')}
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
            <Sparkles className="w-5 h-5" />
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
  onApprove,
  onBack,
  isScheduling,
  isPreviewOnly,
}: {
  arc: WeekArc;
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
  const [usedImageUrls, setUsedImageUrls] = useState<Set<string>>(new Set());

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
    toast.success(`Day ${postIdx + 1} removed from Flight Plan`);
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
    setEditedArc(prev => {
      const updated = { ...prev };
      updated.weekPosts = [...prev.weekPosts];
      const post = { ...prev.weekPosts[postIdx] };
      post.scheduledHour = Math.min(20, Math.max(6, post.scheduledHour + delta));
      updated.weekPosts[postIdx] = post;
      return updated;
    });
  };

  /* ─── Image upload per day ─── */
  const handleDayImageUpload = async (postIdx: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only images are supported');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    try {
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
      if (!uploadRes.ok) throw new Error('Upload failed');

      if (usedImageUrls.has(data.url)) {
        toast.warning('This image is already used on another day. Consider using a different image for variety.');
      }

      setEditedArc(prev => ({
        ...prev,
        weekPosts: prev.weekPosts.map((p, i) =>
          i === postIdx ? { ...p, imageUrl: data.url } : p
        ),
      }));

      setUsedImageUrls(prev => new Set(prev).add(data.url));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const removeImage = (postIdx: number) => {
    setEditedArc(prev => ({
      ...prev,
      weekPosts: prev.weekPosts.map((p, i) =>
        i === postIdx ? { ...p, imageUrl: null } : p
      ),
    }));
  };

  const activePosts = editedArc.weekPosts.filter(p => !p.deleted);
  const totalVariants = activePosts.reduce((sum, p) => sum + p.platforms.length, 0);

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
          onClick={() => onApprove(editedArc)}
          disabled={isScheduling || activePosts.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
          style={{
            backgroundColor: B.accent,
            color: '#fff',
            boxShadow: `0 4px 16px ${B.accent}40`,
            opacity: isScheduling || activePosts.length === 0 ? 0.6 : 1,
          }}
        >
          {isScheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {isScheduling ? 'Scheduling…' : 'Approve & Schedule'}
        </button>
      </div>

      {isPreviewOnly && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl text-sm"
          style={{ backgroundColor: B.warningBg, border: `1px solid ${B.warning}44`, color: B.warning }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
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

      {/* Story type explanation */}
      <div className="flex items-start gap-3 p-4 rounded-xl text-sm"
        style={{ backgroundColor: B.infoBg, color: B.info }}>
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Why this arc shape?</strong> {editedArc.storyTypeReason}
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

            const isExpanded = expandedPost === postIdx;
            const currentPlatformIdx = activePlatformTab[postIdx] ?? 0;
            const currentPlatformDraft = post.platforms[currentPlatformIdx];
            const config = PLATFORM_CONFIG[currentPlatformDraft?.platform as PlatformType];
            const isOverLimit = currentPlatformDraft && config && currentPlatformDraft.characterCount > config.maxChars;

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
                    <div className="font-semibold text-sm truncate" style={{ color: B.text }}>{post.arcBeat}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: B.textMuted }}>{post.arcBeatReason}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.platforms.map(p => (
                        <PlatformBadge key={p.platform} platform={p.platform} />
                      ))}
                    </div>
                  </div>

                  {/* Image thumbnail */}
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border flex-shrink-0" style={{ borderColor: B.border }} />
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); moveTime(postIdx, -1); }}
                      className="p-1.5 rounded-lg hover:opacity-70 transition-opacity text-xs font-mono"
                      style={{ color: B.textMuted }}>-1h</button>
                    <button onClick={e => { e.stopPropagation(); moveTime(postIdx, 1); }}
                      className="p-1.5 rounded-lg hover:opacity-70 transition-opacity text-xs font-mono"
                      style={{ color: B.textMuted }}>+1h</button>
                    <button
                      onClick={e => { e.stopPropagation(); removePost(postIdx); }}
                      className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                      style={{ color: B.danger }}
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

                        {/* Image upload section */}
                        <div className="flex flex-wrap gap-4 pt-4">
                          <div>
                            <label className="text-xs font-semibold mb-1 block" style={{ color: B.textMuted }}>
                              Post Image
                            </label>
                            <div className="flex items-center gap-2">
                              {post.imageUrl ? (
                                <div className="relative">
                                  <img src={post.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border" style={{ borderColor: B.border }} />
                                  <button
                                    onClick={() => removeImage(postIdx)}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                    style={{ background: B.danger, color: '#fff' }}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => fileInputRefs.current[postIdx]?.click()}
                                  className="w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-0.5 transition-colors hover:border-solid"
                                  style={{ borderColor: B.border, color: B.textMuted }}
                                >
                                  <ImagePlus className="w-5 h-5" />
                                  <span className="text-[9px]">Upload</span>
                                </button>
                              )}
                              <input
                                ref={el => { fileInputRefs.current[postIdx] = el; }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) handleDayImageUpload(postIdx, f);
                                  e.target.value = '';
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Platform Tabs (from Flight Plan) */}
                        <div className="flex gap-1 p-1 rounded-xl" style={{ background: B.bg }}>
                          {post.platforms.map((p, pIdx) => {
                            const pcfg = PLATFORM_CONFIG[p.platform as PlatformType];
                            if (!pcfg) return null;
                            const Icn = pcfg.icon;
                            const isActive = currentPlatformIdx === pIdx;
                            return (
                              <button
                                key={p.platform}
                                onClick={() => setActivePlatformTab(prev => ({ ...prev, [postIdx]: pIdx }))}
                                className={cn(
                                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                  isActive ? 'shadow-sm' : ''
                                )}
                                style={isActive
                                  ? { background: B.card, color: B.text }
                                  : { color: B.textMuted }
                                }
                              >
                                <Icn className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{pcfg.name}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Content Editor for active platform */}
                        {currentPlatformDraft && (
                          <div className="space-y-3">
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
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Auto first comment */}
                            {currentPlatformDraft.autoFirstComment && (
                              <div className="rounded-xl p-3 border" style={{ background: B.bg, borderColor: B.border }}>
                                <p className="text-xs font-semibold mb-1" style={{ color: B.textMuted }}>
                                  💬 Auto first comment (posted 90s after)
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
                                  💬 Suggested first comment
                                </p>
                                <p className="text-sm" style={{ color: B.textSecondary }}>
                                  {currentPlatformDraft.firstCommentHint}
                                </p>
                              </div>
                            )}

                            {/* Cascading offset info */}
                            {currentPlatformDraft.schedulingOffsetMinutes && currentPlatformDraft.schedulingOffsetMinutes > 0 && (
                              <div className="text-xs" style={{ color: B.textMuted }}>
                                ⚡ Cascading: +{currentPlatformDraft.schedulingOffsetMinutes} min after base time
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
            onClick={() => onApprove(editedArc)}
            disabled={isScheduling}
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

/* ─── Step 3: Week Canvas ─── */
function WeekCanvas({
  workspaceId,
  onNewArc,
}: {
  workspaceId: string;
  onNewArc: () => void;
}) {
  const [posts, setPosts] = useState<CanvasPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [holdActive, setHoldActive] = useState(false);

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
        setPosts(data.posts ?? []);
      }
    } catch {
      toast.error('Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { loadCanvas(); }, [loadCanvas]);

  const handleCancel = async (postId: string) => {
    if (!confirm('Cancel this scheduled post?')) return;
    const res = await fetch(`/api/composer/schedule/${postId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Post cancelled');
      loadCanvas();
    } else {
      toast.error('Failed to cancel post');
    }
  };

  const handleHold = async () => {
    setIsHolding(true);
    try {
      if (holdActive) {
        const res = await fetch('/api/composer/schedule/hold', { method: 'DELETE' });
        if (res.ok) { setHoldActive(false); toast.success('Queue released — posts will go out on schedule'); }
      } else {
        const res = await fetch('/api/composer/schedule/hold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ holdHours: 3 }),
        });
        if (res.ok) { setHoldActive(true); toast.success('Queue held for 3 hours'); }
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
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="p-2 rounded-xl transition-all hover:opacity-70"
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
          <button onClick={() => setWeekOffset(w => w + 1)}
            className="p-2 rounded-xl transition-all hover:opacity-70"
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
          <button
            onClick={onNewArc}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: B.accent,
              color: '#fff',
              boxShadow: `0 4px 16px ${B.accent}40`,
            }}
          >
            <Sparkles className="w-4 h-4" />
            Plan New Week
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
              Plan your week in 15 minutes — one story, every platform.
            </p>
          </div>
          <button
            onClick={onNewArc}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: B.accent, color: '#fff', boxShadow: `0 4px 16px ${B.accent}40` }}
          >
            <Sparkles className="w-4 h-4" />
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
                      className="rounded-xl p-2.5 group relative"
                      style={{
                        backgroundColor: B.card,
                        border: `1px solid ${B.border}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-medium" style={{ color: B.textMuted }}>
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

                      <div className="flex flex-wrap gap-1 mt-1.5">
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

                      {/* Hover actions */}
                      {post.status === 'scheduled' && (
                        <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-1">
                          <button
                            onClick={() => handleCancel(post.postId)}
                            className="p-1 rounded-lg opacity-70 hover:opacity-100"
                            style={{ backgroundColor: B.dangerBg, color: B.danger }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to generate Flight Plan');
        return;
      }

      setIsPreviewOnly(!!json.isPreviewOnly);
      if (json.isPreviewOnly) {
        toast.info('Previewing Flight Plan — connect accounts in Settings to schedule live!');
      }

      setArc(json.arc);
      setView('review');
      toast.success(`Flight Plan generated — ${json.arc.weekPosts.length} posts ready for review`);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (approvedArc: WeekArc) => {
    if (isPreviewOnly) {
      toast.warning('Connect your platform accounts in Settings to schedule live posts.');
      return;
    }
    setIsScheduling(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const activePosts = approvedArc.weekPosts.filter(p => !p.deleted);

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
          posts: activePosts.map(p => ({
            day: p.day,
            scheduledHour: p.scheduledHour,
            scheduledMinute: p.scheduledMinute,
            strategy: 'cascading',
            arcBeat: p.arcBeat,
            imageUrl: p.imageUrl || null,
            platforms: p.platforms.map(pf => ({
              platform: pf.platform,
              content: pf.content,
              hashtags: pf.hashtags,
              firstCommentHint: pf.firstCommentHint,
              autoFirstComment: pf.autoFirstComment,
              schedulingOffsetMinutes: pf.schedulingOffsetMinutes ?? 0,
            })),
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to schedule');
        return;
      }

      toast.success(`Flight Plan scheduled — ${json.scheduledPosts?.length ?? 0} posts queued 🚀`);
      setView('canvas');
      setArc(null);
    } catch {
      toast.error('Something went wrong during scheduling.');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5" style={{ color: B.accent }} />
            <h1 className="text-2xl font-bold" style={{ color: B.text }}>Flight Plan</h1>
          </div>
          <p className="text-sm" style={{ color: B.textMuted }}>
            Plan your week of content in 15 minutes. One story, every platform, perfectly timed.
          </p>
        </div>
        {view === 'canvas' && (
          <button
            onClick={() => setView('story')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{ backgroundColor: B.accent, color: '#fff', boxShadow: `0 4px 16px ${B.accent}40` }}
          >
            <Sparkles className="w-4 h-4" />
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
