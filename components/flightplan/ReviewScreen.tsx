'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, AlertCircle, CheckCircle,
  ImagePlus, X, Loader2, Send, Clock, Zap, Info, AlertTriangle, ArrowUpRight, RotateCcw,
  Image as ImageIcon, Check, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, isToday, startOfDay } from 'date-fns';
import { PlatformBrandLogo, type SupportedPlatformType } from '@/components/dashboard/previews/PlatformMobilePreview';
import { PlatformSVGs } from '@/components/dashboard/PlatformLogos';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { studioToast } from '@/components/dashboard/StudioToast';
import {
  ContentValidationBanner,
  PlatformTabs,
  TimeSelector,
  HashtagInput,
  ImageDropZone,
  AutoFirstComment,
  FirstCommentHint,
  StaggeredOffset,
} from '@/components/flightplan/ui';
import { useImageUpload } from '@/hooks/flightplan';
import { FLIGHTPLAN_CONSTANTS, PLATFORM_CONFIG } from '@/types/flightplan';
import type { WeekArc, ArcPost, ArcPlatformDraft, PlatformType } from '@/types/flightplan';
import { B, PLATFORM_META, BEAT_COLORS, MOTION, SPACING, RADIUS, SHADOW } from './design-tokens';

interface ReviewScreenProps {
  arc: WeekArc;
  weekStartDate: string;
  isPreviewOnly: boolean;
  onApprove: (arc: WeekArc) => void;
  onBack: () => void;
  isScheduling: boolean;
  activeStoryIndex: number;
  onStoryIndexChange: (idx: number) => void;
  onStoryHoverChange: (paused: boolean) => void;
}

const QUICK_PRESETS = [
  { label: 'In 5 mins', minutes: 5, icon: <Zap className="w-3 h-3" style={{ color: B.warning }} /> },
  { label: '+15m', minutes: 15, icon: null },
  { label: '+30m', minutes: 30, icon: null },
  { label: '+1h', minutes: 60, icon: null },
];

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return startOfWeek(new Date(), { weekStartsOn: 1 });
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d);
    }
  }
  return new Date(dateStr);
}

export function ReviewScreen({
  arc,
  weekStartDate,
  isPreviewOnly,
  onApprove,
  onBack,
  isScheduling,
  activeStoryIndex,
  onStoryIndexChange,
  onStoryHoverChange,
}: ReviewScreenProps) {
  const sanitizeArcContent = useCallback((rawArc: WeekArc): WeekArc => ({
    ...rawArc,
    weekPosts: rawArc.weekPosts.map(post => ({
      ...post,
      platforms: post.platforms.map(pf => {
        const config = PLATFORM_CONFIG[pf.platform as PlatformType];
        let content = pf.content || '';
        if (config && content.length > config.maxChars) {
          const maxAllowed = config.maxChars - 3;
          const trimmed = content.slice(0, maxAllowed);
          const lastSpace = trimmed.lastIndexOf(' ');
          content = (lastSpace > config.maxChars * 0.8 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
          if (content.length > config.maxChars) {
            content = content.slice(0, config.maxChars);
          }
        }
        return {
          ...pf,
          content,
          characterCount: content.length,
        };
      }),
    })),
  }), []);

  const [editedArc, setEditedArc] = useState<WeekArc>(() => sanitizeArcContent(arc));
  const [expandedPost, setExpandedPost] = useState<number>(-1);
  const [activePlatformTab, setActivePlatformTab] = useState<Record<number, number>>({});
  const [isDraggingPost, setIsDraggingPost] = useState<Record<number, boolean>>({});
  const [isUploadingImage, setIsUploadingImage] = useState<Record<number, boolean>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Sync with prop changes
  useEffect(() => {
    setEditedArc(sanitizeArcContent(arc));
  }, [arc, sanitizeArcContent]);

  const activePosts = useMemo(() => editedArc.weekPosts.filter(p => !p.deleted), [editedArc]);

  const handleImageUpload = useCallback(async (postIdx: number, urls: string[]) => {
    setEditedArc(prev => ({
      ...prev,
      weekPosts: prev.weekPosts.map((post, idx) =>
        idx === postIdx ? { ...post, imageUrls: [...(post.imageUrls || []), ...urls] } : post
      ),
    }));
  }, []);

  const { upload: handleDayImageUpload, isUploading: uploadStates, isDragging: dragStates, setIsDragging: setDragState, registerFileInput } = useImageUpload(handleImageUpload);

  // Merge upload states
  const mergedIsUploading = useMemo(() => ({ ...isUploadingImage, ...uploadStates }), [isUploadingImage, uploadStates]);
  const mergedIsDragging = useMemo(() => ({ ...isDraggingPost, ...dragStates }), [isDraggingPost, dragStates]);

  const updateContent = useCallback((postIdx: number, platformIdx: number, content: string) => {
    setEditedArc(prev => ({
      ...prev,
      weekPosts: prev.weekPosts.map((post, idx) =>
        idx === postIdx
          ? {
              ...post,
              platforms: post.platforms.map((pf, pIdx) =>
                pIdx === platformIdx ? { ...pf, content, characterCount: content.length } : pf
              ),
            }
          : post
      ),
    }));
  }, []);

  const setPostHour = useCallback((postIdx: number, hour: number) => {
    setEditedArc(prev => ({
      ...prev,
      weekPosts: prev.weekPosts.map((post, idx) =>
        idx === postIdx ? { ...post, scheduledHour: hour } : post
      ),
    }));
  }, []);

  const setPostMinute = useCallback((postIdx: number, minute: number) => {
    setEditedArc(prev => ({
      ...prev,
      weekPosts: prev.weekPosts.map((post, idx) =>
        idx === postIdx ? { ...post, scheduledMinute: minute } : post
      ),
    }));
  }, []);

  const setPostToQuickTime = useCallback((postIdx: number, minutesFromNow: number) => {
    const now = new Date();
    const target = new Date(now.getTime() + minutesFromNow * 60 * 1000);
    const roundedMinutes = Math.ceil(target.getMinutes() / 5) * 5;
    const newHour = target.getHours() + (roundedMinutes >= 60 ? 1 : 0);
    const newMinute = roundedMinutes % 60;
    setPostHour(postIdx, newHour);
    setPostMinute(postIdx, newMinute);
  }, [setPostHour, setPostMinute]);

  const moveTime = useCallback((postIdx: number, minutes: number) => {
    const post = editedArc.weekPosts[postIdx];
    if (!post) return;
    const date = new Date();
    date.setHours(post.scheduledHour, post.scheduledMinute, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    setPostHour(postIdx, date.getHours());
    setPostMinute(postIdx, date.getMinutes());
  }, [editedArc, setPostHour, setPostMinute]);

  const togglePlatformEnabled = useCallback((postIdx: number, platformIdx: number) => {
    setEditedArc(prev => ({
      ...prev,
      weekPosts: prev.weekPosts.map((post, idx) =>
        idx === postIdx
          ? {
              ...post,
              platforms: post.platforms.map((pf, pIdx) =>
                pIdx === platformIdx ? { ...pf, enabled: pf.enabled === false } : pf
              ),
            }
          : post
      ),
    }));
  }, []);

  const removePost = useCallback((postIdx: number) => {
    setEditedArc(prev => ({
      ...prev,
      weekPosts: prev.weekPosts.map((post, idx) =>
        idx === postIdx ? { ...post, deleted: true } : post
      ),
    }));
  }, []);

  const restorePost = useCallback((postIdx: number) => {
    setEditedArc(prev => ({
      ...prev,
      weekPosts: prev.weekPosts.map((post, idx) =>
        idx === postIdx ? { ...post, deleted: false } : post
      ),
    }));
  }, []);

  const removeImage = useCallback((postIdx: number, imageIdx: number) => {
    setEditedArc(prev => ({
      ...prev,
      weekPosts: prev.weekPosts.map((post, idx) =>
        idx === postIdx
          ? { ...post, imageUrls: post.imageUrls?.filter((_, i) => i !== imageIdx) || [] }
          : post
      ),
    }));
  }, []);

  const handleApproveWithValidation = useCallback(async () => {
    // Validate all content before approving
    for (const post of activePosts) {
      for (const platform of post.platforms) {
        if (platform.enabled === false) continue;
        const guard = ContentGuard.validateSocialInput(platform.content, { route: 'flightplan/review' });
        if (!guard.safe) {
          studioToast.generationFailed(guard.violation.message, {
            platforms: [platform.platform],
            knowMoreUrl: '/terms',
          });
          return;
        }
        const config = PLATFORM_CONFIG[platform.platform as PlatformType];
        if (config && platform.characterCount > config.maxChars) {
          studioToast.generationFailed(`Content for ${config.name} exceeds the maximum character limit of ${config.maxChars} (${platform.characterCount}/${config.maxChars}). Please shorten before scheduling.`, {
            platforms: [platform.platform],
            knowMoreUrl: '/terms',
          });
          return;
        }
      }
    }

    // Ensure no post is scheduled in the past at approval time
    const now = new Date();
    const updatedWeekPosts = editedArc.weekPosts.map(post => {
      if (post.deleted) return post;
      const targetDay = addDays(scheduleStartDate, post.day);
      const postDateTime = new Date(targetDay);
      postDateTime.setHours(post.scheduledHour, post.scheduledMinute, 0, 0);
      if (postDateTime.getTime() <= now.getTime()) {
        const nextHour = Math.min(23, now.getHours() + 1);
        return { ...post, scheduledHour: nextHour, scheduledMinute: 0 };
      }
      return post;
    });

    onApprove({ ...editedArc, weekPosts: updatedWeekPosts });
  }, [activePosts, editedArc, onApprove, scheduleStartDate]);

  const totalVariants = activePosts.reduce((sum, post) =>
    sum + post.platforms.filter(p => p.enabled !== false).length, 0);

  const scheduleStartDate = weekStartDate ? parseLocalDate(weekStartDate) : new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={MOTION.spring.standard}
      className="space-y-6"
    >
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: B.textMuted, backgroundColor: B.card, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold" style={{ color: B.text }}>{editedArc.arcTitle}</h2>
            <p className="text-sm" style={{ color: B.textMuted }}>{editedArc.storyType} • {activePosts.length} days • {totalVariants} variants</p>
          </div>
        </div>
      </div>

      {/* Preview mode banner */}
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
            style={{
              backgroundColor: B.card,
              color: B.text,
              border: `1px solid ${B.border}`,
              boxShadow: B.cardShadow,
            }}
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
                  transition={MOTION.spring.standard}
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

            const targetDay = addDays(scheduleStartDate, post.day);
            const isTodayPost = isToday(targetDay);
            const postDateTime = new Date(targetDay);
            postDateTime.setHours(post.scheduledHour, post.scheduledMinute, 0, 0);
            const now = new Date();
            const isPastTime = postDateTime.getTime() <= now.getTime();
            const baseMinutes = Array.from({ length: 60 }, (_, m) => m);
            const minuteOptions = Array.from(new Set([...baseMinutes, post.scheduledMinute])).sort((a, b) => a - b);

            const isExpanded = expandedPost === postIdx;
            const currentPlatformIdx = activePlatformTab[postIdx] ?? 0;
            const currentPlatformDraft = post.platforms[currentPlatformIdx];
            const config = PLATFORM_CONFIG[currentPlatformDraft?.platform as PlatformType];
            const isOverLimit = currentPlatformDraft && config && currentPlatformDraft.characterCount > config.maxChars;
            const platformGuardResult = currentPlatformDraft?.content
              ? ContentGuard.validateSocialInput(currentPlatformDraft.content, { route: 'flightplan/review' })
              : null;
            const isPlatformBlocked = platformGuardResult && !platformGuardResult.safe;
            const postImages = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);

            return (
              <motion.div
                key={postIdx}
                id={`arc-post-${postIdx}`}
                onMouseEnter={() => onStoryHoverChange?.(true)}
                onMouseLeave={() => onStoryHoverChange?.(false)}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ delay: postIdx * MOTION.stagger.fast, ...MOTION.spring.standard }}
                className="rounded-2xl overflow-hidden"
                style={{
                  border: `1px solid ${isExpanded ? B.accent : B.border}`,
                  borderLeft: `4px solid ${BEAT_COLORS[post.arcBeat] || B.accent}`,
                  backgroundColor: B.card,
                  boxShadow: isExpanded ? `0 0 0 3px ${B.accent}18, ${B.cardShadow}` : B.cardShadow,
                }}
              >
                {/* Post header row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ focusRingColor: B.accent, focusRingOffsetColor: B.card }}
                  onClick={() => {
                    setExpandedPost(isExpanded ? -1 : postIdx);
                    onStoryIndexChange?.(postIdx);
                  }}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedPost(isExpanded ? -1 : postIdx); onStoryIndexChange?.(postIdx); }}}
                  role="button"
                  aria-expanded={isExpanded}
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
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{
                            backgroundColor: B.warningBg,
                            color: B.warning,
                            border: `1px solid ${B.warningBorder}`,
                          }}
                        >
                          <AlertCircle className="w-3 h-3" style={{ color: B.warning }} />
                          {targetDay.getTime() < startOfDay(now).getTime() ? 'Past day' : 'Time passed'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: B.textMuted }}>{post.arcBeatReason}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {post.platforms.map((p, pIdx) => {
                        const meta = PLATFORM_META[p.platform] || { name: p.platform, color: '#666', bg: '#1A1815' };
                        const isEnabled = p.enabled !== false;
                        return (
                          <button
                            key={p.platform}
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              togglePlatformEnabled(postIdx, pIdx);
                            }}
                            title={isEnabled ? `Included: ${meta.name} (click to exclude)` : `Excluded: ${meta.name} (click to include)`}
                            className={cn(
                              "inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors transition-transform cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                              isEnabled
                                ? "hover:scale-110 shadow-xs"
                                : "opacity-35 hover:opacity-65 border-dashed grayscale"
                            )}
                            style={{
                              backgroundColor: isEnabled ? meta.bg : B.bg,
                              borderColor: isEnabled ? `${meta.color}40` : B.border,
                              focusRingColor: isEnabled ? meta.color : B.accent,
                              focusRingOffsetColor: B.card,
                            }}
                          >
                            <PlatformBrandLogo platform={p.platform as SupportedPlatformType} size={15} />
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
                      onClick={e => { e.stopPropagation(); moveTime(postIdx, -60); }}
                      className="p-1.5 rounded-lg hover:opacity-70 transition-opacity text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{ color: B.textMuted, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
                      title="Move 1 hour earlier"
                    >
                      -1h
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); moveTime(postIdx, 60); }}
                      className="p-1.5 rounded-lg hover:opacity-70 transition-opacity text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{ color: B.textMuted, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
                      title="Move 1 hour later"
                    >
                      +1h
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); moveTime(postIdx, -1); }}
                      className="p-1.5 rounded-lg hover:opacity-70 transition-opacity text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{ color: B.textMuted, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
                      title="Move 1 minute earlier"
                    >
                      -1m
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); moveTime(postIdx, 1); }}
                      className="p-1.5 rounded-lg hover:opacity-70 transition-opacity text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{ color: B.textMuted, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
                      title="Move 1 minute later"
                    >
                      +1m
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); removePost(postIdx); }}
                      className="p-1.5 rounded-lg transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{ color: B.danger, focusRingColor: B.danger, focusRingOffsetColor: B.card }}
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
                      transition={MOTION.spring.standard}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: B.border }}>
                        {/* Time Selector, Quick Presets & Past Alert */}
                        <TimeSelector
                          hour={post.scheduledHour}
                          minute={post.scheduledMinute}
                          onHourChange={h => setPostHour(postIdx, h)}
                          onMinuteChange={m => setPostMinute(postIdx, m)}
                          isPastTime={isPastTime}
                          quickPresets={QUICK_PRESETS}
                          onQuickPreset={m => setPostToQuickTime(postIdx, m)}
                        />

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

                          <ImageDropZone
                            images={postImages}
                            onUpload={files => handleDayImageUpload(files, postIdx)}
                            onRemove={idx => removeImage(postIdx, idx)}
                            maxImages={10}
                            isUploading={mergedIsUploading[postIdx]}
                            isDragging={mergedIsDragging[postIdx]}
                            setIsDragging={dragging => setDragState(postIdx, dragging)}
                            fileInputRef={React.createRef<HTMLInputElement>()}
                            ref={el => { if (el) registerFileInput?.(postIdx, el); }}
                          />
                        </div>

                        {/* Platform Tabs */}
                        <PlatformTabs
                          platforms={post.platforms}
                          activeIndex={currentPlatformIdx}
                          onChange={idx => setActivePlatformTab(prev => ({ ...prev, [postIdx]: idx }))}
                          enabledMap={post.platforms.reduce((acc, p, i) => ({ ...acc, [i]: p.enabled !== false }), {})}
                          onToggleEnabled={idx => togglePlatformEnabled(postIdx, idx)}
                        />

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
                                "px-3 py-1 rounded-lg font-semibold transition-colors border text-xs flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                              )}
                              style={
                                currentPlatformDraft.enabled !== false
                                  ? {
                                      backgroundColor: B.successBg,
                                      color: B.success,
                                      borderColor: B.successBorder,
                                      focusRingColor: B.success,
                                      focusRingOffsetColor: B.card,
                                  }
                                  : {
                                      backgroundColor: B.cardBorder,
                                      color: B.textMuted,
                                      borderColor: B.border,
                                      focusRingColor: B.accent,
                                      focusRingOffsetColor: B.card,
                                  }
                              }
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

                            {/* Alert Banner for Unacceptable / Ungeneratable Content or Over Limit */}
                            <ContentValidationBanner
                              isBlocked={Boolean(isPlatformBlocked)}
                              isOverLimit={isOverLimit}
                              violationMessage={!platformGuardResult?.safe ? platformGuardResult?.violation.message : undefined}
                              platformName={PLATFORM_CONFIG[currentPlatformDraft.platform as PlatformType]?.name || currentPlatformDraft.platform}
                              currentCount={currentPlatformDraft.characterCount}
                              maxChars={config?.maxChars}
                            />

                            {/* Stats bar */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3 text-xs" style={{ color: B.textMuted }}>
                                <span
                                  className={isOverLimit ? 'font-semibold' : ''}
                                  style={isOverLimit ? { color: B.danger } : {}}
                                >
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
                            <AutoFirstComment content={currentPlatformDraft.autoFirstComment || ''} />
                            <FirstCommentHint content={currentPlatformDraft.firstCommentHint || ''} />
                            <StaggeredOffset minutes={currentPlatformDraft.schedulingOffsetMinutes || 0} />

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
          transition={MOTION.spring.standard}
          className="sticky bottom-4 rounded-2xl border p-4 flex items-center justify-between shadow-xl backdrop-blur-sm"
          style={{ backgroundColor: `${B.card}ee`, borderColor: B.cardBorder }}
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: B.success, color: '#fff', boxShadow: `0 4px 16px ${B.success}40`, focusRingColor: B.success, focusRingOffsetColor: B.card }}
          >
            {isScheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isScheduling ? 'Scheduling…' : 'Schedule All'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}