'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Trash2, AlertCircle,
  ImagePlus, X, Loader2, Send, Zap, AlertTriangle, ArrowUpRight, RotateCcw,
  Image as ImageIcon, PauseCircle, PlayCircle, Edit3, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, isToday, startOfDay, endOfWeek, addWeeks } from 'date-fns';
import { PlatformBrandLogo, type SupportedPlatformType } from '@/components/dashboard/previews/PlatformMobilePreview';
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
} from '@/components/flightplan/ui';
import { useModalImageUpload } from '@/hooks/flightplan';
import { FLIGHTPLAN_CONSTANTS, PLATFORM_CONFIG } from '@/types/flightplan';
import type { CanvasPost, CanvasPlatformVariant, PlatformType } from '@/types/flightplan';
import { B, PLATFORM_META, MOTION, SPACING, RADIUS, SHADOW } from './design-tokens';

interface ScheduledPostModalProps {
  post: CanvasPost | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onCancelled: () => void;
  onScheduleAnother?: (date: Date) => void;
}

const QUICK_PRESETS = [
  { label: 'In 5 mins', minutes: 5, icon: <Zap className="w-3 h-3" style={{ color: B.warning }} /> },
  { label: '+15m', minutes: 15, icon: null },
  { label: '+30m', minutes: 30, icon: null },
  { label: '+1h', minutes: 60, icon: null },
];

function ScheduledPostModalContent({
  post,
  isOpen,
  onClose,
  onUpdated,
  onCancelled,
  onScheduleAnother,
}: ScheduledPostModalProps & { post: CanvasPost }) {
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
  const [currentScheduledAt, setCurrentScheduledAt] = useState<string | null>(post.scheduledAt || null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const minDateTime = useMemo(() => {
    return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  }, []);

  const maxDateTime = useMemo(() => {
    const mondayThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const nextSunday = endOfWeek(addWeeks(mondayThisWeek, 1), { weekStartsOn: 1 });
    return format(nextSunday, "yyyy-MM-dd'T'23:59");
  }, []);

  useEffect(() => {
    if (post) {
      setConfirmCancel(false);
      setActiveVariantIndex(0);
      setCurrentScheduledAt(post.scheduledAt || null);
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
        setShowRescheduleInput(false);
      } else {
        const d = new Date(Date.now() + 10 * 60 * 1000);
        d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
        const pad = (n: number) => String(n).padStart(2, '0');
        const localFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setRescheduleTime(localFormatted);
        setShowRescheduleInput(true);
      }
    }
  }, [post]);

  const currentVariant = (post.platforms && post.platforms[activeVariantIndex]) || (post.platforms && post.platforms[0]) || {
    variantId: 'default',
    platform: 'instagram' as PlatformType,
    content: post.content || '',
    status: post.status,
    mediaUrls: [],
    hashtags: [],
  };

  const isPublished = post.status === 'published' || (post.platforms && post.platforms.some(p => p.status === 'published'));
  const currentContent = editedContent[currentVariant.variantId] ?? currentVariant.content;
  const currentTags = editedHashtags[currentVariant.variantId] ?? currentVariant.hashtags ?? [];
  const currentMedia = editedMediaUrls[currentVariant.variantId] ?? currentVariant.mediaUrls ?? [];

  const variantsWithChanges = (post.platforms || []).filter(p => {
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
    bg: '#1A1815',
    icon: '•',
  };

  const modalVariantConfig = PLATFORM_CONFIG[currentVariant.platform as PlatformType];
  const modalGuardResult = useMemo(() => {
    if (!currentContent) return null;
    return ContentGuard.validateSocialInput(currentContent, { route: 'flightplan/modal' });
  }, [currentContent]);
  const isModalContentBlocked = modalGuardResult && !modalGuardResult.safe;
  const isModalOverLimit = modalVariantConfig && currentContent.length > modalVariantConfig.maxChars;

  const { upload: handleUploadModalMedia, isUploading, isDragging, setIsDragging, fileInputRef: modalFileInputRefHook } = useModalImageUpload(
    useCallback((variantId: string, media: Array<{ url: string; type: string }>) => {
      setEditedMediaUrls(prev => {
        const existing = prev[variantId] ?? currentVariant.mediaUrls ?? [];
        return { ...prev, [variantId]: [...existing, ...media] };
      });
    }, [])
  );

  // Sync modalFileInputRef
  useEffect(() => {
    modalFileInputRefHook.current = modalFileInputRef.current;
  }, [modalFileInputRefHook, modalFileInputRef]);

  const handleRemoveModalMedia = useCallback((index: number) => {
    setEditedMediaUrls(prev => {
      const existing = prev[currentVariant.variantId] ?? currentVariant.mediaUrls ?? [];
      return {
        ...prev,
        [currentVariant.variantId]: existing.filter((_, idx) => idx !== index),
      };
    });
  }, [currentVariant.variantId, currentVariant.mediaUrls]);

  const handleApplyMediaToAllVariants = useCallback(() => {
    setEditedMediaUrls(prev => {
      const nextMap = { ...prev };
      post.platforms.forEach(p => {
        nextMap[p.variantId] = [...currentMedia];
      });
      return nextMap;
    });
  }, [post.platforms, currentMedia]);

  const handleSaveVariant = useCallback(async () => {
    if (variantsWithChanges.length === 0) return;

    // Check ContentGuard on each changed variant before saving
    for (const v of variantsWithChanges) {
      const c = editedContent[v.variantId] ?? v.content;
      const guard = ContentGuard.validateSocialInput(c, { route: 'flightplan/modal' });
      if (!guard.safe) {
        studioToast.generationFailed(guard.violation.message, {
          platforms: [v.platform],
          knowMoreUrl: '/terms',
        });
        return;
      }
      const cfg = PLATFORM_CONFIG[v.platform as PlatformType];
      if (cfg && c.length > cfg.maxChars) {
        studioToast.generationFailed(`Content for ${cfg.name} exceeds the character limit of ${cfg.maxChars}.`, {
          platforms: [v.platform],
          knowMoreUrl: '/terms',
        });
        return;
      }
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
          body: JSON.stringify({ content: c, hashtags: t, mediaUrls: m }),
        });
        const data = await res.json();
        if (!res.ok) {
          studioToast.generationFailed(data.error || `Failed to update ${v.platform}`, {
            platforms: [v.platform],
            knowMoreUrl: '/terms',
          });
          return;
        }
        v.content = c;
        v.hashtags = t;
        v.mediaUrls = m;
      }

      studioToast.success('Post variants updated successfully!');
      onUpdated();
    } catch {
      studioToast.generationFailed('Failed to save changes to post variants.', {
        knowMoreUrl: '/terms',
      });
    } finally {
      setIsSaving(false);
    }
  }, [variantsWithChanges, editedContent, editedHashtags, editedMediaUrls, onUpdated]);

  const handleReschedule = useCallback(async () => {
    if (!rescheduleTime) {
      studioToast.error('Please choose a date and time.');
      return;
    }
    const targetDate = new Date(rescheduleTime);
    if (isNaN(targetDate.getTime())) {
      studioToast.error('Please choose a valid date and time.');
      return;
    }
    if (targetDate.getTime() <= Date.now()) {
      studioToast.error('Cannot schedule posts for past dates or past time periods.');
      return;
    }
    const mondayThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const endOfUpcomingWeek = endOfWeek(addWeeks(mondayThisWeek, 1), { weekStartsOn: 1 });
    if (targetDate.getTime() > endOfUpcomingWeek.getTime()) {
      studioToast.error('Posts can only be scheduled for the ongoing week and the upcoming week.');
      return;
    }

    const isFirstSchedule = !currentScheduledAt;
    setIsRescheduling(true);
    try {
      const res = await fetch(`/api/composer/schedule/${post.postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newScheduledAt: targetDate.toISOString() }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        studioToast.error(errJson.error || 'Failed to schedule post');
        return;
      }
      post.scheduledAt = targetDate.toISOString();
      post.status = 'scheduled';
      setCurrentScheduledAt(targetDate.toISOString());
      setShowRescheduleInput(false);
      studioToast.success(isFirstSchedule ? 'Post scheduled successfully!' : 'Post rescheduled successfully!');
      onUpdated();
    } catch {
      studioToast.error('Failed to schedule post');
    } finally {
      setIsRescheduling(false);
    }
  }, [rescheduleTime, post, currentScheduledAt, onUpdated]);

  const handleCancelPost = useCallback(async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/composer/schedule/${post.postId}`, { method: 'DELETE' });
      if (res.ok) {
        onCancelled();
        onClose();
      }
    } catch {
      // cancel error handled
    } finally {
      setIsCancelling(false);
    }
  }, [confirmCancel, post.postId, onCancelled, onClose]);

  const addTag = useCallback((tagToAdd?: string) => {
    const raw = typeof tagToAdd === 'string' ? tagToAdd : newTag;
    const clean = raw.trim().replace(/^#+/, '');
    if (!clean || currentTags.includes(clean)) return;
    setEditedHashtags(prev => ({
      ...prev,
      [currentVariant.variantId]: [...currentTags, clean],
    }));
    setNewTag('');
  }, [newTag, currentTags, currentVariant.variantId]);

  const removeTag = useCallback((tagToRemove: string) => {
    setEditedHashtags(prev => ({
      ...prev,
      [currentVariant.variantId]: currentTags.filter(t => t !== tagToRemove),
    }));
  }, [currentTags, currentVariant.variantId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={MOTION.spring.gentle}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 20 }}
        transition={MOTION.spring.standard}
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
                  {isPublished ? 'Flight Log • Touched Down' : currentScheduledAt ? 'Scheduled Post' : 'Review & Schedule Post'}
                </h3>
                <span
                  className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: isPublished ? '#E5EDE6' : post.status === 'scheduled' ? B.infoBg : B.warningBg,
                    color: isPublished ? '#2D4C34' : post.status === 'scheduled' ? B.info : B.warning,
                    border: isPublished ? '1px solid #CADACD' : undefined,
                  }}
                >
                  {isPublished ? 'Landed, live' : post.status === 'scheduled' ? 'Cleared for take-off' : 'Awaiting clearance'}
                </span>
              </div>
              <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: B.textMuted }}>
                <Clock className="w-3.5 h-3.5" />
                {isPublished
                  ? (currentScheduledAt ? `Touched down on ${format(new Date(currentScheduledAt), 'EEEE, MMM d, yyyy • h:mm a')}` : 'Touched down live on social channels')
                  : currentScheduledAt
                  ? `Goes live on ${format(new Date(currentScheduledAt), 'EEEE, MMM d, yyyy • h:mm a')}`
                  : 'Awaiting clearance • Ready to review and schedule'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: B.textMuted, backgroundColor: B.card, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
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
                <Clock className="w-4 h-4" style={{ color: isPublished ? '#4D6B53' : B.accent }} />
                <span>{isPublished ? 'Landed at:' : currentScheduledAt ? 'Scheduled Time:' : 'Choose Schedule Time:'}</span>
                <span className="font-mono font-normal">
                  {currentScheduledAt
                    ? format(new Date(currentScheduledAt), 'MMM d, yyyy @ h:mm a')
                    : isPublished
                    ? 'Landed'
                    : 'Not scheduled yet'}
                </span>
              </div>
              {!isPublished && (
                <button
                  onClick={() => setShowRescheduleInput(prev => !prev)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors hover:opacity-80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ backgroundColor: B.card, border: `1px solid ${B.border}`, color: B.accentDark, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
                >
                  {showRescheduleInput ? 'Cancel' : (currentScheduledAt ? 'Change Time' : 'Set Schedule')}
                </button>
              )}
              {isPublished && (
                <span
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-md"
                  style={{ backgroundColor: '#E5EDE6', color: '#2D4C34', border: '1px solid #CADACD' }}
                >
                  Landed, live
                </span>
              )}
            </div>

            {!isPublished && showRescheduleInput && (
              <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: `${B.border}80` }}>
                <input
                  type="datetime-local"
                  value={rescheduleTime}
                  min={minDateTime}
                  max={maxDateTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border flex-1"
                  style={{ backgroundColor: B.card, borderColor: B.border, color: B.text }}
                />
                <button
                  onClick={handleReschedule}
                  disabled={isRescheduling}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ backgroundColor: B.accent, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
                >
                  {isRescheduling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {currentScheduledAt ? 'Reschedule' : 'Schedule Post'}
                </button>
              </div>
            )}
          </div>

          {/* Platform Variant Tabs */}
          <div>
            <label className="text-xs font-semibold block mb-2" style={{ color: B.textMuted }}>
              PLATFORM VARIANTS ({post.platforms.length})
            </label>
            <PlatformTabs
              platforms={post.platforms.map(p => ({
                variantId: p.variantId,
                platform: p.platform,
                content: editedContent[p.variantId] ?? p.content,
                characterCount: (editedContent[p.variantId] ?? p.content).length,
                hashtags: editedHashtags[p.variantId] ?? p.hashtags ?? [],
                enabled: true,
              }))}
              activeIndex={activeVariantIndex}
              onChange={setActiveVariantIndex}
              compact
            />
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
              readOnly={isPublished}
              onChange={e => {
                if (isPublished) return;
                setEditedContent(prev => ({
                  ...prev,
                  [currentVariant.variantId]: e.target.value,
                }));
              }}
              className={cn(
                "w-full text-sm p-3 rounded-xl border focus:outline-none transition-colors leading-relaxed",
                isPublished ? "opacity-85 cursor-default resize-none" : "focus-visible:ring-2 focus-visible:ring-offset-2"
              )}
              style={{
                backgroundColor: B.card,
                borderColor: B.border,
                color: B.text,
                focusRingColor: B.accent,
                focusRingOffsetColor: B.card,
              }}
              placeholder={`Write content for ${platformMeta.name}...`}
            />

            {/* Modal Alert Banner for Safety Violation or Character Limit */}
            {!isPublished && (
              <ContentValidationBanner
                isBlocked={Boolean(isModalContentBlocked)}
                isOverLimit={isModalOverLimit}
                violationMessage={!modalGuardResult?.safe ? modalGuardResult?.violation.message : undefined}
                platformName={platformMeta.name}
                currentCount={currentContent.length}
                maxChars={modalVariantConfig?.maxChars}
              />
            )}
          </div>

          {/* Hashtags Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block" style={{ color: B.text }}>
              Hashtags
            </label>
            {isPublished ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {currentTags.length > 0 ? (
                  currentTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: B.cardHover,
                        color: B.textSecondary,
                        border: `1px solid ${B.border}`,
                      }}
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs" style={{ color: B.textMuted }}>No hashtags</span>
                )}
              </div>
            ) : (
              <HashtagInput
                tags={currentTags}
                onAdd={addTag}
                onRemove={removeTag}
                placeholder="add tag..."
                inputRef={React.createRef<HTMLInputElement>()}
              />
            )}
          </div>

          {/* Attached Media Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: B.text }}>
                <ImageIcon className="w-3.5 h-3.5" style={{ color: B.accent }} />
                Attached Media ({currentMedia.length})
              </label>
              {!isPublished && (
                <div className="flex items-center gap-2">
                  {post.platforms.length > 1 && currentMedia.length > 0 && (
                    <button
                      type="button"
                      onClick={handleApplyMediaToAllVariants}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{ backgroundColor: B.accentBg, color: B.accentDark, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
                      title="Copy these images to all other platform variants of this post"
                    >
                      Apply to all platforms
                    </button>
                  )}
                  <ImageDropZone
                    images={currentMedia.map(m => m.url)}
                    onUpload={files => handleUploadModalMedia(files, currentVariant.variantId)}
                    onRemove={handleRemoveModalMedia}
                    maxImages={10}
                    isUploading={isUploading}
                    isDragging={isDragging}
                    setIsDragging={setIsDragging}
                    fileInputRef={modalFileInputRef}
                    compact={true}
                  />
                </div>
              )}
            </div>

            {isPublished && (
              <div className="flex flex-wrap gap-2 pt-1">
                {currentMedia.length > 0 ? (
                  currentMedia.map((m, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border"
                      style={{ borderColor: B.border }}
                    >
                      <img src={m.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))
                ) : (
                  <span className="text-xs" style={{ color: B.textMuted }}>No media attached</span>
                )}
              </div>
            )}
          </div>

          {/* Auto First Comment */}
          <AutoFirstComment content={currentVariant.autoFirstComment || ''} />
          <FirstCommentHint content={currentVariant.firstCommentHint || ''} />
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex items-center justify-between gap-3" style={{ backgroundColor: B.bg, borderColor: B.border }}>
          {isPublished ? (
            <>
              <div className="text-xs flex items-center gap-2" style={{ color: B.textMuted }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#4D6B53' }} />
                <span>This post touched down on your channels. Live posts cannot be edited or deleted.</span>
              </div>
              <div className="flex items-center gap-2">
                {onScheduleAnother && (
                  <button
                    onClick={() => {
                      const d = post.scheduledAt ? new Date(post.scheduledAt) : new Date();
                      onClose();
                      onScheduleAnother(d);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity shadow-sm flex items-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: B.accent }}
                  >
                    + Schedule another post
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer"
                  style={{ borderColor: B.border, color: B.textMuted, backgroundColor: B.card }}
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              {confirmCancel ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelPost}
                    disabled={isCancelling}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ backgroundColor: B.danger, boxShadow: `0 2px 8px ${B.danger}40`, focusRingColor: B.danger, focusRingOffsetColor: B.card }}
                  >
                    {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Confirm Cancel
                  </button>
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ color: B.textMuted, backgroundColor: B.card, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
                  >
                    Keep Post
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmCancel(true)}
                  disabled={isCancelling}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ color: B.danger, backgroundColor: B.dangerBg, focusRingColor: B.danger, focusRingOffsetColor: B.card }}
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: B.danger }} />
                  Cancel Post
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ borderColor: B.border, color: B.textMuted, backgroundColor: B.card, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
                >
                  Close
                </button>
                <button
                  onClick={handleSaveVariant}
                  disabled={isSaving || !hasChanges}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ backgroundColor: B.accent, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {hasChanges
                    ? (variantsWithChanges.length > 1 ? `Save Changes (${variantsWithChanges.length})` : 'Save Changes')
                    : 'Saved'}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ScheduledPostModal(props: ScheduledPostModalProps) {
  if (!props.isOpen || !props.post) return null;
  return <ScheduledPostModalContent key={props.post.postId} {...props} post={props.post} />;
}