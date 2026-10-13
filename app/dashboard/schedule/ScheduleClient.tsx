'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Calendar, Clock,
  CheckCircle, X, Loader2, AlertTriangle, Send, Zap,
  PauseCircle, PlayCircle, RotateCcw, Trash2, Edit3,
  ArrowRight, Info, Radio, Globe
import { cn } from '@/lib/utils';
import { useUserContext } from '@/lib/hooks/use-user-context';
import { format, addDays, startOfWeek, isToday, isTomorrow } from 'date-fns';

/* ─── Design tokens (matches Biscuit theme) ────────────────────────────── */
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

/* ─── Platform display configs ──────────────────────────────────────────── */
const PLATFORM_META: Record<string, { name: string; color: string; bg: string; icon: string }> = {
  linkedin:  { name: 'LinkedIn',  color: '#0A66C2', bg: '#E8F0FA', icon: 'in' },
  x:         { name: 'X',        color: '#000000', bg: '#F0F0F0', icon: '𝕏'  },
  threads:   { name: 'Threads',  color: '#1A1A1A', bg: '#F0F0F0', icon: '@'  },
  bluesky:   { name: 'Bluesky',  color: '#0085FF', bg: '#E6F3FF', icon: '🦋' },
  instagram: { name: 'Instagram',color: '#E1306C', bg: '#FDE8F0', icon: '▷'  },
  facebook:  { name: 'Facebook', color: '#1877F2', bg: '#E8F0FE', icon: 'f'  },
};

/* ─── Types ─────────────────────────────────────────────────────────────── */
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

/* ─── Step indicator ─────────────────────────────────────────────────────── */
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

/* ─── Platform badge ──────────────────────────────────────────────────────── */
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

/* ─── Step 1: Story Intake ───────────────────────────────────────────────── */
function StoryIntake({
  onGenerate,
  isGenerating,
}: {
  onGenerate: (data: { coreStory: string; whatChanged: string; whatWentWrong: string; oneRealNumber: string; weekStartDate: string }) => void;
  isGenerating: boolean;
}) {
  const [coreStory, setCoreStory] = useState('');
  const [whatChanged, setWhatChanged] = useState('');
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [oneRealNumber, setOneRealNumber] = useState('');
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [weekTarget, setWeekTarget] = useState<'current' | 'next'>('current');

  // Compute target Monday (this week or next week)
  const targetMonday = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const target = weekTarget === 'next' ? addDays(monday, 7) : monday;
    return format(target, 'yyyy-MM-dd');
  }, [weekTarget]);

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

      {/* Week info & target selector */}
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
            Building your week arc…
          </>
        ) : (
          <>
            Plan My Week
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

/* ─── Step 2: Review Screen ──────────────────────────────────────────────── */
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
      weekPosts: prev.weekPosts.filter((_, i) => i !== postIdx),
    }));
    if (expandedPost >= postIdx && expandedPost > 0) setExpandedPost(expandedPost - 1);
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

  const totalVariants = editedArc.weekPosts.reduce((sum, p) => sum + p.platforms.length, 0);

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
            {editedArc.weekPosts.length} posts · {totalVariants} platform drafts
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize"
              style={{ backgroundColor: B.accentBg, color: B.accentDark }}>
              {editedArc.storyType}
            </span>
          </p>
        </div>
        <button
          onClick={() => onApprove(editedArc)}
          disabled={isScheduling || editedArc.weekPosts.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
          style={{
            backgroundColor: B.accent,
            color: '#fff',
            boxShadow: `0 4px 16px ${B.accent}40`,
            opacity: isScheduling || editedArc.weekPosts.length === 0 ? 0.6 : 1,
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

      {/* Story type explanation */}
      <div className="flex items-start gap-3 p-4 rounded-xl text-sm"
        style={{ backgroundColor: B.infoBg, color: B.info }}>
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Strategy note:</strong> {editedArc.storyTypeReason}
        </div>
      </div>

      {/* Post cards */}
      <div className="space-y-3">
        {editedArc.weekPosts.map((post, postIdx) => {
          const isExpanded = expandedPost === postIdx;
          return (
            <motion.div
              key={postIdx}
              layout
              className="rounded-2xl overflow-hidden cursor-pointer"
              style={{
                border: `1px solid ${isExpanded ? B.accent : B.border}`,
                backgroundColor: B.card,
                boxShadow: isExpanded ? `0 0 0 3px ${B.accent}18, ${B.cardShadow}` : B.cardShadow,
              }}
            >
              {/* Post header row */}
              <div
                className="flex items-center gap-4 p-4"
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
                  <ChevronRight
                    className="w-4 h-4 transition-transform"
                    style={{ color: B.textMuted, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  />
                </div>
              </div>

              {/* Expanded: platform drafts */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${B.border}` }}>
                      {post.platforms.map((platform, platformIdx) => {
                        const isEditing = editingContent?.postIdx === postIdx && editingContent?.platformIdx === platformIdx;
                        const meta = PLATFORM_META[platform.platform];
                        const limit = platform.platform === 'linkedin' ? 3000 : platform.platform === 'x' ? 280 : platform.platform === 'bluesky' ? 300 : 500;
                        const isOver = platform.characterCount > limit;

                        return (
                          <div key={platformIdx} className="rounded-xl p-4 space-y-2"
                            style={{ backgroundColor: B.bg, border: `1px solid ${B.border}` }}>
                            <div className="flex items-center justify-between">
                              <PlatformBadge platform={platform.platform} size="md" />
                              <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: isOver ? B.danger : B.textMuted }}>
                                  {platform.characterCount}/{limit}
                                </span>
                                <button
                                  onClick={() => setEditingContent(isEditing ? null : { postIdx, platformIdx })}
                                  className="p-1 rounded-lg transition-opacity hover:opacity-70"
                                  style={{ color: B.textMuted }}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {isEditing ? (
                              <textarea
                                value={platform.content}
                                onChange={e => updateContent(postIdx, platformIdx, e.target.value)}
                                className="w-full resize-none rounded-lg p-3 text-sm outline-none"
                                style={{
                                  backgroundColor: B.card,
                                  border: `1px solid ${meta?.color ?? B.border}`,
                                  color: B.text,
                                  minHeight: 120,
                                }}
                                autoFocus
                              />
                            ) : (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: B.textSecondary }}>
                                {platform.content}
                              </p>
                            )}

                            {platform.autoFirstComment && (
                              <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
                                style={{ backgroundColor: B.warningBg, color: B.warning }}>
                                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span>Link moved to auto-first-comment (posted 90s after): {platform.autoFirstComment}</span>
                              </div>
                            )}

                            {platform.schedulingOffsetMinutes && platform.schedulingOffsetMinutes > 0 && (
                              <div className="text-xs" style={{ color: B.textMuted }}>
                                Staggered release: +{platform.schedulingOffsetMinutes} min after base time
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom approve */}
      {editedArc.weekPosts.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl"
          style={{ backgroundColor: B.successBg, border: `1px solid ${B.success}33` }}>
          <div>
            <p className="font-semibold text-sm" style={{ color: B.success }}>
              {editedArc.weekPosts.length} posts, {totalVariants} platform variants ready
            </p>
            <p className="text-xs mt-0.5" style={{ color: B.success }}>
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
        </div>
      )}
    </motion.div>
  );
}

/* ─── Step 3: Week Canvas ────────────────────────────────────────────────── */
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
      // load error
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

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

  // Group posts by day
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
          <button
            onClick={onNewArc}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: B.accent,
              color: '#fff',
              boxShadow: `0 4px 16px ${B.accent}40`,
            }}
          >
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
              They won't be re-sent automatically — release the queue to resume.
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

/* ─── Main ScheduleClient ─────────────────────────────────────────────────── */
export default function ScheduleClient({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId: string;
}) {
  const { user } = useUserContext();
  const [view, setView] = useState<ViewMode>('canvas');
  const [arc, setArc] = useState<WeekArc | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPreviewOnly, setIsPreviewOnly] = useState(false);
  const [storyData, setStoryData] = useState<any>(null);

  const handleGenerate = async (data: any) => {
    setIsGenerating(true);
    setStoryData(data);

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch('/api/composer/arc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, audienceTimezone: tz }),
      });

      const json = await res.json();
      if (!res.ok) return;

      setIsPreviewOnly(!!json.isPreviewOnly);
      setArc(json.arc);
      setView('review');
    } catch {
      // generate error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (approvedArc: WeekArc) => {
    if (isPreviewOnly) return;
    setIsScheduling(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
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
          posts: approvedArc.weekPosts.map(p => ({
            day: p.day,
            scheduledHour: p.scheduledHour,
            scheduledMinute: p.scheduledMinute,
            strategy: 'cascading',
            arcBeat: p.arcBeat,
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

      if (!res.ok) return;

      setView('canvas');
      setArc(null);
    } catch {
      // schedule error
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
            Plan and schedule your weekly content across all connected platforms.
          </p>
        </div>
        {view === 'canvas' && (
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
