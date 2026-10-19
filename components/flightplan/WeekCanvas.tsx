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
import { B, PLATFORM_META, MOTION, SPACING, RADIUS, SHADOW } from './design-tokens';

interface WeekCanvasProps {
  workspaceId: string;
  targetPostId?: string | null;
  onNewArc: () => void;
  onPostCountChange?: (count: number) => void;
}

export function WeekCanvas({
  workspaceId,
  targetPostId,
  onNewArc,
  onPostCountChange,
}: WeekCanvasProps) {
  const [posts, setPosts] = useState<CanvasPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [holdActive, setHoldActive] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CanvasPost | null>(null);
  const [hasOpenedTargetPost, setHasOpenedTargetPost] = useState(false);

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
    setIsLoading(true);
    try {
      const loadedPosts = await loadCanvas(weekOffset);
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
    const success = await cancelPost(postId);
    if (success) {
      loadWeekCanvas();
    }
  }, [cancelPost, loadWeekCanvas]);

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
          <button
            onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
            disabled={weekOffset <= 0}
            className="p-2 rounded-xl transition-opacity disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: B.card, border: `1px solid ${B.border}`, color: B.textMuted, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
          >
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
          <button
            onClick={() => setWeekOffset(w => Math.min(1, w + 1))}
            disabled={weekOffset >= 1}
            className="p-2 rounded-xl transition-opacity disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: B.card, border: `1px solid ${B.border}`, color: B.textMuted, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleHold}
            disabled={isHolding}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: holdActive ? B.warningBg : B.card,
              border: `1px solid ${holdActive ? B.warning : B.border}`,
              color: holdActive ? B.warning : B.textMuted,
              focusRingColor: holdActive ? B.warning : B.accent,
              focusRingOffsetColor: B.card,
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
            transition={MOTION.spring.standard}
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: B.accent, color: '#fff', boxShadow: `0 4px 16px ${B.accent}40`, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
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
            const count = dayPosts.length;
            const isCompact = count >= FLIGHTPLAN_CONSTANTS.COMPACT_THRESHOLD;
            const isUltraCompact = count >= FLIGHTPLAN_CONSTANTS.ULTRA_COMPACT_THRESHOLD;

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

                {/* Post cards for this day with auto-shrink when > 3 posts */}
                <div className={cn(
                  "min-h-[80px]",
                  isUltraCompact ? "space-y-1" : isCompact ? "space-y-1" : "space-y-1.5"
                )}>
                  {dayPosts.map(post => (
                    <motion.div
                      key={post.postId}
                      layout
                      onClick={() => setSelectedPost(post)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPost(post); }}}
                      tabIndex={0}
                      role="button"
                      className={cn(
                        "rounded-xl group relative transition-transform hover:scale-[1.02] hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                        isUltraCompact
                          ? "p-1.5"
                          : isCompact
                          ? "p-2"
                          : "p-2.5"
                      )}
                      style={{
                        backgroundColor: B.card,
                        border: `1px solid ${B.border}`,
                        cursor: 'pointer',
                        boxShadow: B.cardShadow,
                        focusRingColor: B.accent,
                        focusRingOffsetColor: B.card,
                      }}
                    >
                      <div className={cn("flex items-center justify-between", isUltraCompact ? "mb-0.5" : isCompact ? "mb-1" : "mb-1.5")}>
                        <span
                          className={cn(
                            "font-mono font-medium flex items-center gap-1",
                            isUltraCompact ? "text-[10px]" : "text-xs"
                          )}
                          style={{ color: B.textMuted }}
                        >
                          <Clock className={isUltraCompact ? "w-2.5 h-2.5" : "w-3 h-3"} />
                          {post.scheduledAt ? format(new Date(post.scheduledAt), 'HH:mm') : '--:--'}
                        </span>
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: statusColor(post.status) }}
                        />
                      </div>

                      <p
                        className={cn(
                          "leading-snug",
                          isUltraCompact
                            ? "text-[10px] truncate"
                            : isCompact
                            ? "text-[11px] line-clamp-1"
                            : "text-xs line-clamp-2"
                        )}
                        style={{ color: B.textSecondary }}
                        title={post.content}
                      >
                        {post.content}
                      </p>

                      <div
                        className={cn(
                          "flex items-center justify-between",
                          isUltraCompact ? "mt-1 pt-1" : isCompact ? "mt-1.5 pt-1" : "mt-2 pt-1.5"
                        )}
                        style={{ borderTop: `1px solid ${B.border}50` }}
                      >
                        <div className="flex items-center flex-wrap gap-1">
                          {post.platforms.slice(0, isUltraCompact ? 2 : 3).map(v => {
                            const meta = PLATFORM_META[v.platform];
                            return (
                              <span
                                key={v.variantId}
                                className={cn(
                                  "inline-flex items-center justify-center rounded-full p-0.5 shadow-2xs transition-transform hover:scale-110",
                                  isUltraCompact ? "w-4 h-4" : "w-5 h-5"
                                )}
                                style={{ backgroundColor: meta?.bg || B.card }}
                                title={meta?.name || v.platform}
                              >
                                <PlatformBrandLogo
                                  platform={v.platform as SupportedPlatformType}
                                  size={isUltraCompact ? 10 : 12}
                                />
                              </span>
                            );
                          })}
                          {post.platforms.length > (isUltraCompact ? 2 : 3) && (
                            <span
                              className={cn(
                                "rounded-full font-medium leading-none flex items-center justify-center",
                                isUltraCompact ? "text-[8px] px-1 py-0.5" : "text-[9px] px-1.5 py-0.5"
                              )}
                              style={{ backgroundColor: B.border, color: B.textMuted }}
                            >
                              +{post.platforms.length - (isUltraCompact ? 2 : 3)}
                            </span>
                          )}
                        </div>

                        {!isUltraCompact && (
                          <span
                            className="text-[10px] font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: B.accentDark }}
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            Edit
                          </span>
                        )}
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
        onUpdated={loadWeekCanvas}
        onCancelled={loadWeekCanvas}
      />
    </div>
  );
}