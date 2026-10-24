'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, ChevronRight, Loader2, Calendar, Clock, PauseCircle, PlayCircle,
  Trash2, MoreHorizontal, Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, isToday, endOfWeek, addWeeks } from 'date-fns';
import { PlatformBrandLogo, type SupportedPlatformType } from '@/components/dashboard/previews/PlatformMobilePreview';
import { ScheduledPostModal } from './ScheduledPostModal';
import { useFlightPlanActions } from '@/hooks/flightplan';
import { FLIGHTPLAN_CONSTANTS } from '@/types/flightplan';
import type { CanvasPost } from '@/types/flightplan';
import { B, PLATFORM_META, BEAT_COLORS, MOTION, SPACING, RADIUS, SHADOW } from './design-tokens';

interface WeekCanvasProps {
  workspaceId: string;
  targetPostId?: string | null;
  onNewArc: () => void;
  onPostCountChange?: (count: number) => void;
}

// ── In-Memory SWR Cache for 0ms Route Switching ──────────────────
const memoryCanvasPostsByWeek = new Map<number, CanvasPost[]>();

export function WeekCanvas({
  workspaceId,
  targetPostId,
  onNewArc,
  onPostCountChange,
}: WeekCanvasProps) {
  const [posts, setPosts] = useState<CanvasPost[]>(() => memoryCanvasPostsByWeek.get(0) || []);
  const [isLoading, setIsLoading] = useState(() => !memoryCanvasPostsByWeek.has(0));
  const [weekOffset, setWeekOffset] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [holdActive, setHoldActive] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CanvasPost | null>(null);
  const [hasOpenedTargetPost, setHasOpenedTargetPost] = useState(false);
  const [selectedMobileDay, setSelectedMobileDay] = useState<string | null>(null);

  const { loadCanvas, holdQueue, cancelPost } = useFlightPlanActions();

  const weekStart = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(monday, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const loadWeekCanvas = useCallback(async () => {
    // Only show loading if we don't have this week cached in memory
    if (!memoryCanvasPostsByWeek.has(weekOffset)) {
      setIsLoading(true);
    }
    try {
      const loadedPosts = await loadCanvas(weekOffset);
      memoryCanvasPostsByWeek.set(weekOffset, loadedPosts);
      setPosts(loadedPosts);
      onPostCountChange?.(loadedPosts.length);
    } catch {
      // Error handled in hook
    } finally {
      setIsLoading(false);
    }
  }, [weekOffset, loadCanvas, onPostCountChange]);

  useEffect(() => { loadWeekCanvas(); }, [loadWeekCanvas]);

  // If targetPostId is present in URL, find or fetch it and auto-open it in ScheduledPostModal
  useEffect(() => {
    if (!targetPostId || hasOpenedTargetPost) return;

    // Check if post is already present in loaded week posts
    const existing = posts.find(p => p.postId === targetPostId);
    if (existing) {
      setSelectedPost(existing);
      setHasOpenedTargetPost(true);
      return;
    }

    // Otherwise fetch post directly from /api/publish/[postId]
    let isCancelled = false;
    async function fetchTargetPost() {
      try {
        const res = await fetch(`/api/publish/${targetPostId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isCancelled || !data?.post) return;

        const p = data.post;
        const variants = data.variants || [];

        const targetCanvasPost: CanvasPost = {
          postId: p.id,
          content: p.content,
          status: p.status,
          scheduledAt: p.scheduledAt || null,
          scheduleStrategy: p.scheduleStrategy || 'simultaneous',
          arcId: p.arcId || null,
          platforms: variants.map((v: any) => ({
            variantId: v.id,
            platform: v.platform,
            content: v.adaptedContent || v.content || '',
            status: v.status,
            scheduledAt: v.scheduledAt || null,
            autoFirstComment: v.autoFirstComment || null,
            firstCommentHint: v.firstCommentHint || null,
            mediaUrls: v.mediaUrls || [],
            hashtags: v.hashtagStrategy || [],
            error: v.error,
          })),
        };

        if (targetCanvasPost.scheduledAt) {
          const postDate = new Date(targetCanvasPost.scheduledAt);
          const currentMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
          const postMonday = startOfWeek(postDate, { weekStartsOn: 1 });
          const diffDays = Math.round((postMonday.getTime() - currentMonday.getTime()) / (1000 * 60 * 60 * 24));
          const offset = Math.round(diffDays / 7);
          if (offset >= 0 && offset <= 1) {
            setWeekOffset(offset);
          }
        }

        setSelectedPost(targetCanvasPost);
        setHasOpenedTargetPost(true);
      } catch {
        // silent
      }
    }

    fetchTargetPost();
    return () => { isCancelled = true; };
  }, [targetPostId, posts, hasOpenedTargetPost]);

  const handleCancel = useCallback(async (postId: string) => {
    const confirmed = window.confirm('Delete this scheduled post?');
    if (!confirmed) return;

    // Optimistically remove from state so the card vanishes immediately without screen flicker
    setPosts(prev => prev.filter(p => p.postId !== postId));
    if (selectedPost?.postId === postId) {
      setSelectedPost(null);
    }

    try {
      const success = await cancelPost(postId);
      if (success) {
        const loadedPosts = await loadCanvas(weekOffset);
        setPosts(loadedPosts);
        onPostCountChange?.(loadedPosts.length);
      } else {
        loadWeekCanvas();
      }
    } catch {
      loadWeekCanvas();
    }
  }, [cancelPost, loadCanvas, weekOffset, selectedPost, onPostCountChange, loadWeekCanvas]);

  const handleHold = useCallback(async () => {
    setIsHolding(true);
    try {
      const success = await holdQueue(!holdActive, 3);
      if (success) {
        setHoldActive(!holdActive);
      }
    } finally {
      setIsHolding(false);
    }
  }, [holdActive, holdQueue]);

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

  const scheduledCount = useMemo(() => posts.filter(p => p.status === 'scheduled').length, [posts]);
  const publishedCount = useMemo(() => posts.filter(p => p.status === 'published').length, [posts]);
  const uniquePlatformsCount = useMemo(() => {
    const s = new Set<string>();
    posts.forEach(p => p.platforms.forEach(v => s.add(v.platform)));
    return s.size || 1;
  }, [posts]);

  const nextPost = useMemo(() => {
    const unpub = posts
      .filter(p => p.status === 'scheduled' && p.scheduledAt)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0];
    if (!unpub || !unpub.scheduledAt) return null;
    const d = new Date(unpub.scheduledAt);
    const platform = unpub.platforms[0]?.platform || 'instagram';
    const meta = PLATFORM_META[platform];
    return {
      platformName: meta?.name || platform,
      dayLabel: format(d, 'EEE'),
      timeFormatted: format(d, 'h:mm a'),
    };
  }, [posts]);

  const statusColor = (status: string) => {
    if (status === 'published') return B.success;
    if (status === 'failed') return B.danger;
    if (status === 'scheduled') return B.info;
    return B.textMuted;
  };

  return (
    <div className="space-y-6">
      {/* ─── Toolbar (matches reference .bar .wk .cnt) ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {/* Week Selector Pill */}
          <div
            className="flex items-center gap-1 p-1 rounded-full border shadow-xs"
            style={{ backgroundColor: B.card, borderColor: B.border }}
          >
            <button
              onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
              disabled={weekOffset <= 0}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: B.textSecondary }}
              aria-label="Previous week"
            >
              ‹
            </button>
            <span className="px-3 text-xs sm:text-sm font-semibold text-center min-w-[130px] sm:min-w-[150px]" style={{ color: B.text }}>
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => setWeekOffset(w => Math.min(1, w + 1))}
              disabled={weekOffset >= 1}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: B.textSecondary }}
              aria-label="Next week"
            >
              ›
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={() => {
              setWeekOffset(0);
              const todayKey = format(new Date(), 'yyyy-MM-dd');
              setSelectedMobileDay(todayKey);
            }}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors hover:bg-black/5"
            style={{
              backgroundColor: weekOffset === 0 ? B.accentBg : B.card,
              borderColor: weekOffset === 0 ? B.accentBorder : B.border,
              color: weekOffset === 0 ? B.accentHover : B.textSecondary,
            }}
          >
            Today
          </button>

          {/* Hold Queue Toggle Button */}
          <button
            onClick={handleHold}
            disabled={isHolding}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{
              backgroundColor: holdActive ? B.warningBg : B.card,
              borderColor: holdActive ? B.warningBorder : B.border,
              color: holdActive ? B.warning : B.textSecondary,
            }}
          >
            {isHolding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>⏸</span>}
            <span>{holdActive ? 'Queue Held' : 'Hold my queue'}</span>
          </button>
        </div>

        {/* Counter Summary */}
        <div className="text-xs font-medium ml-auto" style={{ color: B.textMuted }}>
          {scheduledCount} scheduled · {publishedCount} published · {uniquePlatformsCount} platform{uniquePlatformsCount === 1 ? '' : 's'}
        </div>
      </div>

      {/* Hold banner */}
      <AnimatePresence>
        {holdActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={MOTION.spring.standard}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
            style={{ backgroundColor: B.warningBg, border: `1px solid ${B.warningBorder}`, color: B.text }}
          >
            <PauseCircle className="w-4 h-4 flex-shrink-0" style={{ color: B.warning }} />
            <span className="flex-1">
              <strong>Queue is held.</strong> Scheduled posts are paused until you release the queue.
            </span>
            <button
              onClick={handleHold}
              className="px-3 py-1 rounded-full text-xs font-semibold border bg-white shadow-xs"
              style={{ color: B.warning, borderColor: B.warningBorder }}
            >
              Release queue
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Hero Arc Ribbon Banner (matches .hero .arc .rib in reference) ─── */}
      <div
        className="rounded-2xl p-5 shadow-lg relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #3D2B1F 0%, #4E3828 100%)',
          boxShadow: '0 10px 30px rgba(61,43,31,0.18)',
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <span className="font-bold text-base tracking-tight" style={{ color: '#E8D9B5' }}>
            Weekly Narrative Arc · 5-Beat Engine
          </span>
          <div className="text-xs" style={{ color: '#D9C9A6' }}>
            {holdActive ? (
              <span className="font-semibold text-amber-300">⏸ Queue paused</span>
            ) : nextPost ? (
              <span>
                Next up <b className="text-white font-semibold">{nextPost.platformName}</b> · {nextPost.dayLabel} {nextPost.timeFormatted}
              </span>
            ) : (
              <span>All posts queued</span>
            )}
          </div>
        </div>

        {/* 7-Day Connected Arc Dots Ribbon */}
        <div className="relative pt-3 hidden sm:block">
          {/* Continuous gradient connector bar */}
          <div
            className="absolute left-[7.14%] w-[57.2%] top-[22px] h-[3px] rounded-full z-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, #C4A265, #B8794B, #C0554F, #4A9C62, #9A6B8E)',
            }}
          />

          <div className="grid grid-cols-7 gap-2 relative z-10">
            {weekDays.map((day, idx) => {
              const beats = ['Hook', 'Context', 'Challenge', 'Proof', 'CTA'];
              const beat = idx < 5 ? beats[idx] : null;
              const beatColor = beat ? BEAT_COLORS[beat] : null;

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 text-center">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{
                      backgroundColor: beatColor ? beatColor : '#3D2B1F',
                      border: beatColor ? `2px solid ${beatColor}` : '2px dashed #6f5b44',
                      boxShadow: beatColor ? `0 0 0 4px ${beatColor}35` : 'none',
                    }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: beatColor || '#8d7a5f' }}
                  >
                    {beat || 'Rest'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[#A8917A]">
                    {format(day, 'EEE')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: B.accent, color: '#fff', boxShadow: `0 4px 16px ${B.accentGlow}` }}
          >
            Plan My Week
          </button>
        </div>
      ) : (
        <>
          {/* ─── Mobile: Horizontal Day-Tab Strip (matches reference .strip) ─── */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:hidden" style={{ scrollbarWidth: 'none' }}>
            {weekDays.map(day => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const count = postsByDay.get(dayKey)?.length ?? 0;
              const isNow = isToday(day);
              const isSel = (selectedMobileDay || format(new Date(), 'yyyy-MM-dd')) === dayKey;
              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => setSelectedMobileDay(dayKey)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[68px] px-3 py-2.5 rounded-2xl transition-all text-xs font-medium focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    backgroundColor: isSel ? B.accentBg : B.card,
                    color: isSel ? B.accentHover : B.text,
                    border: `1.5px solid ${isSel ? B.accent : B.border}`,
                    boxShadow: isSel ? `0 4px 12px ${B.accentGlow}` : B.cardShadow,
                  }}
                >
                  <span className="uppercase tracking-wider text-[10px] font-semibold" style={{ color: isSel ? B.accentHover : B.textMuted }}>
                    {format(day, 'EEE')}
                  </span>
                  <span className="font-bold text-lg" style={{ color: isSel ? B.accentHover : B.text }}>
                    {format(day, 'd')}
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: B.accentHover }}>
                    {count} post{count === 1 ? '' : 's'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ─── Mobile: Selected-Day Posts (matches reference .mday) ─── */}
          <div className="md:hidden space-y-2.5">
            {(() => {
              const activeDayKey = selectedMobileDay || format(new Date(), 'yyyy-MM-dd');
              const activePosts = postsByDay.get(activeDayKey) ?? [];
              const dayIndex = weekDays.findIndex(d => format(d, 'yyyy-MM-dd') === activeDayKey);
              const beatName = dayIndex >= 0 && dayIndex < 5 ? ['Hook', 'Context', 'Challenge', 'Proof', 'CTA'][dayIndex] : null;
              const beatColor = beatName ? BEAT_COLORS[beatName] : B.accent;

              if (activePosts.length === 0) {
                return (
                  <div
                    className="text-center py-10 px-4 rounded-2xl border border-dashed text-sm"
                    style={{ borderColor: B.border, color: B.textSecondary, backgroundColor: B.card }}
                  >
                    <p className="font-medium">Nothing scheduled for this day.</p>
                    <button
                      type="button"
                      onClick={onNewArc}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors"
                      style={{ backgroundColor: B.accentBg, borderColor: B.accentBorder, color: B.accentHover }}
                    >
                      + Add post
                    </button>
                  </div>
                );
              }

              return (
                <>
                  {activePosts.map(post => {
                    const isPub = post.status === 'published';
                    return (
                      <div
                        key={post.postId}
                        onClick={() => setSelectedPost(post)}
                        className="p-3.5 rounded-2xl transition-all cursor-pointer"
                        style={{
                          backgroundColor: B.card,
                          border: `1px solid ${B.border}`,
                          borderLeft: `4px solid ${beatColor}`,
                          boxShadow: B.cardShadow,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono font-semibold" style={{ color: B.textSecondary }}>
                            {post.scheduledAt ? format(new Date(post.scheduledAt), 'h:mm a') : '--:--'}
                          </span>
                          {isPub ? (
                            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: B.successBg, color: B.success }}>
                              ✓ Published
                            </span>
                          ) : beatName ? (
                            <span
                              className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ backgroundColor: `${beatColor}18`, color: beatColor, border: `1px solid ${beatColor}40` }}
                            >
                              {beatName}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: B.text }}>
                          {post.content}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5">
                          <div className="flex gap-1">
                            {post.platforms.slice(0, 4).map(v => (
                              <span
                                key={v.variantId}
                                className="w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: PLATFORM_META[v.platform]?.bg || B.accentBg }}
                              >
                                <PlatformBrandLogo platform={v.platform as SupportedPlatformType} size={11} />
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-semibold" style={{ color: B.accentHover }}>
                            Edit →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={onNewArc}
                    className="w-full py-2.5 rounded-xl border border-dashed text-xs font-semibold transition-all hover:bg-black/5"
                    style={{ borderColor: B.border, color: B.textMuted }}
                  >
                    + Add post
                  </button>
                </>
              );
            })()}
          </div>

          {/* ─── Desktop: 7-Day Grid (matches reference .grid .col .post .add) ─── */}
          <div className="hidden md:grid md:grid-cols-7 gap-3 items-stretch">
            {weekDays.map((day, dayIndex) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayPosts = postsByDay.get(dayKey) ?? [];
              const isNow = isToday(day);
              const beatName = dayIndex < 5 ? ['Hook', 'Context', 'Challenge', 'Proof', 'CTA'][dayIndex] : null;
              const beatColor = beatName ? BEAT_COLORS[beatName] : B.accent;

              return (
                <div
                  key={dayKey}
                  className={cn(
                    "rounded-2xl p-2.5 min-h-[380px] flex flex-col gap-2 transition-all",
                    isNow ? "ring-2" : ""
                  )}
                  style={{
                    backgroundColor: isNow ? B.accentBg : B.card,
                    border: `1px solid ${isNow ? B.accent : B.border}`,
                    boxShadow: isNow ? `inset 0 3px 0 ${B.accent}, ${B.cardShadow}` : B.cardShadow,
                  }}
                >
                  {/* Day header */}
                  <div
                    className="flex justify-between items-baseline px-1 pt-0.5 pb-2 border-b"
                    style={{ borderColor: isNow ? B.accentBorder : B.border }}
                  >
                    <span className="text-xs font-semibold" style={{ color: isNow ? B.accentHover : B.textMuted }}>
                      {format(day, 'EEE')}{isNow ? ' · Today' : ''}
                    </span>
                    <span className="text-xl font-bold tracking-tight" style={{ color: isNow ? B.accentHover : B.text }}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Post cards list */}
                  <div className="flex-1 space-y-2">
                    {dayPosts.map(post => {
                      const isPub = post.status === 'published';

                      return (
                        <motion.div
                          key={post.postId}
                          layout
                          onClick={() => setSelectedPost(post)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPost(post); }}}
                          tabIndex={0}
                          role="button"
                          className="rounded-xl p-2.5 group relative transition-all hover:shadow-md cursor-pointer overflow-hidden"
                          style={{
                            backgroundColor: B.card,
                            border: `1px solid ${B.border}`,
                            borderLeft: `4px solid ${beatColor}`,
                            boxShadow: B.cardShadow,
                          }}
                        >
                          {/* Top row: Platform logos, time, status pill */}
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <div className="flex items-center gap-1">
                              {post.platforms.slice(0, 2).map(v => (
                                <span
                                  key={v.variantId}
                                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: PLATFORM_META[v.platform]?.bg || B.accentBg }}
                                  title={PLATFORM_META[v.platform]?.name || v.platform}
                                >
                                  <PlatformBrandLogo platform={v.platform as SupportedPlatformType} size={10} />
                                </span>
                              ))}
                            </div>
                            <span className="font-mono text-[11px] font-semibold" style={{ color: B.textSecondary }}>
                              {post.scheduledAt ? format(new Date(post.scheduledAt), 'h:mm a') : '--:--'}
                            </span>
                            {isPub ? (
                              <span
                                className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-0.5"
                                style={{ backgroundColor: B.successBg, color: B.success, border: `1px solid ${B.successBorder}` }}
                              >
                                ✓ Published
                              </span>
                            ) : beatName ? (
                              <span
                                className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                                style={{
                                  backgroundColor: `${beatColor}18`,
                                  color: beatColor,
                                  border: `1px solid ${beatColor}40`,
                                }}
                              >
                                {beatName}
                              </span>
                            ) : null}
                          </div>

                          {/* Post text snippet */}
                          <p className="text-xs leading-snug line-clamp-2" style={{ color: B.text }}>
                            {post.content}
                          </p>

                          {/* Quick Actions on hover */}
                          {!isPub && (
                            <div
                              className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t opacity-0 group-hover:opacity-100 transition-opacity w-full overflow-hidden"
                              style={{ borderColor: `${B.border}80` }}
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedPost(post)}
                                className="inline-flex items-center gap-0.5 text-[10px] font-semibold hover:underline transition-colors py-0.5"
                                style={{ color: B.accentHover }}
                                title="Edit post"
                              >
                                <Edit3 className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedPost(post)}
                                className="inline-flex items-center gap-0.5 text-[10px] font-semibold hover:underline transition-colors py-0.5"
                                style={{ color: B.textSecondary }}
                                title="Reschedule post"
                              >
                                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>Time</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancel(post.postId)}
                                className="inline-flex items-center gap-0.5 text-[10px] font-semibold hover:underline transition-colors py-0.5 ml-auto"
                                style={{ color: B.danger }}
                                title="Delete post"
                              >
                                <Trash2 className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* + Add post button at bottom of day column */}
                  <button
                    type="button"
                    onClick={onNewArc}
                    className="w-full min-h-[44px] rounded-xl border border-dashed flex items-center justify-center text-xs font-semibold transition-all opacity-40 hover:opacity-100 hover:border-solid hover:bg-black/5 mt-auto"
                    style={{
                      borderColor: B.border,
                      color: B.textMuted,
                    }}
                  >
                    + Add post
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Scheduled Post Detail & Edit Modal */}
      <ScheduledPostModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onUpdated={loadWeekCanvas}
        onCancelled={loadWeekCanvas}
      />
    </div>
  );
}