'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, Send, AlertTriangle,
  Check, Layers, Loader2, Hash, Sparkles
} from 'lucide-react';
import { format, isToday, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { studioToast } from '@/components/dashboard/StudioToast';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import type { PlatformType } from '@/types/flightplan';
import { PLATFORM_CONFIG } from '@/types/flightplan';
import { PLATFORM_META } from './design-tokens';

interface ScheduleNewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void;
  targetDate: Date;
  connectedPlatforms?: PlatformType[];
}

const DEFAULT_PLATFORMS: PlatformType[] = ['bluesky', 'x', 'linkedin', 'instagram'];

function getDefaultTimeForDate(targetDate: Date): string {
  const d = new Date(targetDate);
  const now = new Date();
  if (isToday(d)) {
    // If today, set to now + 30 mins, rounded up to next 5 minutes
    const future = new Date(now.getTime() + 30 * 60 * 1000);
    future.setMinutes(Math.ceil(future.getMinutes() / 5) * 5, 0, 0);
    d.setHours(future.getHours(), future.getMinutes(), 0, 0);
  } else {
    d.setHours(18, 0, 0, 0);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleNewPostModal({
  isOpen,
  onClose,
  onScheduled,
  targetDate,
  connectedPlatforms,
}: ScheduleNewPostModalProps) {
  const availablePlatforms = useMemo(() => {
    if (connectedPlatforms && connectedPlatforms.length > 0) {
      return connectedPlatforms;
    }
    return DEFAULT_PLATFORMS;
  }, [connectedPlatforms]);

  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([]);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [content, setContent] = useState('');
  const [strategy, setStrategy] = useState<'cascading' | 'simultaneous'>('simultaneous');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingFromIdea, setIsGeneratingFromIdea] = useState(false);

  // Initialize modal state on open or targetDate change
  useEffect(() => {
    if (isOpen) {
      setScheduledTime(getDefaultTimeForDate(targetDate));
      setSelectedPlatforms(availablePlatforms.slice(0, 3));
      setContent('');
      setHashtags([]);
      setNewTagInput('');
    }
  }, [isOpen, targetDate, availablePlatforms]);

  // Allowed scheduling boundary: ongoing week and upcoming week
  const allowedBounds = useMemo(() => {
    const now = new Date();
    const mondayThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endOfUpcoming = endOfWeek(addWeeks(mondayThisWeek, 1), { weekStartsOn: 1 });
    return { min: now, max: endOfUpcoming };
  }, []);

  const timeValidation = useMemo(() => {
    if (!scheduledTime) return { valid: false, error: 'Please choose a date and time.' };
    const t = new Date(scheduledTime);
    if (isNaN(t.getTime())) return { valid: false, error: 'Invalid date/time.' };
    if (t.getTime() <= Date.now()) {
      return { valid: false, error: 'Cannot schedule posts for past dates or past time periods.' };
    }
    if (t.getTime() > allowedBounds.max.getTime()) {
      return { valid: false, error: 'Posts can only be scheduled for the ongoing week and the upcoming week.' };
    }
    return { valid: true, error: null };
  }, [scheduledTime, allowedBounds]);

  const togglePlatform = (p: PlatformType) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(p)) {
        if (prev.length === 1) {
          studioToast.error('At least one platform must be selected.');
          return prev;
        }
        return prev.filter(x => x !== p);
      }
      return [...prev, p];
    });
  };

  const handleAddTag = () => {
    const clean = newTagInput.trim().replace(/^#+/, '');
    if (!clean) return;
    if (!hashtags.includes(clean)) {
      setHashtags(prev => [...prev, clean]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  // Content guard validation
  const guardResult = useMemo(() => {
    if (!content.trim()) return null;
    return ContentGuard.validateSocialInput(content, { route: 'flightplan/schedule-new' });
  }, [content]);

  // Shortest platform maxChars limit among selected platforms
  const minPlatformLimit = useMemo(() => {
    let min = 3000;
    for (const p of selectedPlatforms) {
      const cfg = PLATFORM_CONFIG[p];
      if (cfg && cfg.maxChars < min) min = cfg.maxChars;
    }
    return min;
  }, [selectedPlatforms]);

  const isOverCharLimit = content.length > minPlatformLimit;

  const handleGenerateFromIdea = async () => {
    if (!content.trim()) {
      studioToast.error('Please type a rough idea, hook, or notes first.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      studioToast.error('Please select at least one channel first.');
      return;
    }
    setIsGeneratingFromIdea(true);
    try {
      const res = await fetch('/api/composer/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          selectedPlatforms,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate post copy');
      }
      const firstAdapted = data.adaptedPosts?.[0]?.content
        || (data.adaptedPosts && typeof data.adaptedPosts === 'object' && (Object.values(data.adaptedPosts)[0] as any)?.content)
        || data.posts?.[0]?.content;

      if (firstAdapted) {
        setContent(firstAdapted);
        studioToast.success('Generated full post copy from your idea!');
        const extracted = (firstAdapted.match(/#[a-zA-Z0-9_]+/g) || []).map((t: string) => t.slice(1));
        if (extracted.length > 0) {
          setHashtags(prev => Array.from(new Set([...prev, ...extracted])));
        }
      } else {
        studioToast.error('Could not generate content from this idea. Please add a bit more detail.');
      }
    } catch (err) {
      studioToast.error(err instanceof Error ? err.message : 'Failed to generate from idea');
    } finally {
      setIsGeneratingFromIdea(false);
    }
  };

  const handleScheduleSubmit = async () => {
    if (!content.trim()) {
      studioToast.error('Please write some content for your post.');
      return;
    }
    if (!timeValidation.valid) {
      studioToast.error(timeValidation.error || 'Please choose a valid future time.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      studioToast.error('Please select at least one platform.');
      return;
    }
    if (isOverCharLimit) {
      studioToast.error(`Content exceeds the character limit of ${minPlatformLimit} for the selected platform.`);
      return;
    }
    if (guardResult && !guardResult.safe) {
      studioToast.error(guardResult.violation.message || 'Content flagged by content guard.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetTimeDate = new Date(scheduledTime);
      const res = await fetch('/api/composer/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scheduleMode: 'single',
          posts: [{
            scheduledAt: targetTimeDate.toISOString(),
            strategy,
            platforms: selectedPlatforms.map(platform => ({
              platform,
              content: content.trim(),
              hashtags,
              mediaUrls: [],
            })),
          }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule post');
      }

      studioToast.success(
        `Post scheduled for ${format(targetTimeDate, 'EEEE d MMM')} at ${format(targetTimeDate, 'h:mm a')}!`
      );
      onScheduled();
      onClose();
    } catch (err) {
      studioToast.error(err instanceof Error ? err.message : 'Failed to schedule post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#FCF8F3] text-[#2A1A1D] rounded-2xl shadow-2xl border border-[#E3D6C9] w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#E3D6C9] flex items-center justify-between bg-[#F7F0E8]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6B1F33]" />
                <h3 className="text-base font-bold text-[#2A1A1D]" style={{ fontFamily: '"Fraunces", Georgia, serif' }}>
                  Schedule Flight • {format(targetDate, 'EEEE d MMMM')}
                </h3>
              </div>
              <p className="text-xs text-[#7A666A] mt-0.5">
                {isToday(targetDate)
                  ? 'Schedule another post for today. It will join your live dispatches.'
                  : 'Add a new dispatch to this day. You can schedule multiple posts for the week.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-4">
            {/* Platforms Selection */}
            <div>
              <label className="text-xs font-semibold block text-[#4A3238] uppercase tracking-wider mb-2">
                Channels to Broadcast
              </label>
              <div className="flex flex-wrap gap-2">
                {availablePlatforms.map(p => {
                  const meta = PLATFORM_META[p] || { name: p, color: '#6B1F33' };
                  const isSelected = selectedPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#6B1F33] text-white shadow-xs'
                          : 'bg-white border border-[#E3D6C9] text-stone-600 hover:border-[#6B1F33]'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isSelected ? '#FCF8F3' : meta.color }}
                      />
                      <span>{meta.name}</span>
                      {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time Picker */}
            <div className="bg-white p-3.5 rounded-xl border border-[#E3D6C9] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#4A3238] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#6B1F33]" />
                  <span>Departure Time</span>
                </label>
                {isToday(targetDate) && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#B85450]/15 text-[#B85450] px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </div>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                min={format(new Date(Date.now() + 60000), "yyyy-MM-dd'T'HH:mm")}
                max={format(allowedBounds.max, "yyyy-MM-dd'T'23:59")}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-[#E3D6C9] bg-[#FAF6F0] focus:outline-none focus:border-[#6B1F33]"
              />
              {!timeValidation.valid && (
                <p className="text-[11px] text-[#B85450] font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{timeValidation.error}</span>
                </p>
              )}
            </div>

            {/* Publishing Strategy */}
            <div className="bg-white p-3.5 rounded-xl border border-[#E3D6C9] space-y-2">
              <label className="text-xs font-bold text-[#4A3238] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#6B1F33]" />
                <span>Publishing Flow</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStrategy('simultaneous')}
                  className={`p-2.5 rounded-lg text-left text-xs transition-all border cursor-pointer ${
                    strategy === 'simultaneous'
                      ? 'border-[#6B1F33] bg-[#6B1F33]/5 font-semibold text-[#6B1F33]'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1">
                    <span>Simultaneous</span>
                    <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 rounded-full font-normal">
                      Instant
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 block mt-0.5 leading-snug">
                    All channels go live at the exact same minute
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStrategy('cascading')}
                  className={`p-2.5 rounded-lg text-left text-xs transition-all border cursor-pointer ${
                    strategy === 'cascading'
                      ? 'border-[#6B1F33] bg-[#6B1F33]/5 font-semibold text-[#6B1F33]'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1">
                    <span>Cascading</span>
                    <span className="text-[9px] bg-[#6B1F33] text-white px-1.5 py-0.2 rounded-full font-normal">
                      Anti-spam
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 block mt-0.5 leading-snug">
                    Staggered offset across networks (0m, +45m, +120m)
                  </span>
                </button>
              </div>
            </div>

            {/* Content Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#4A3238]">
                  Post Copy
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!content.trim() || isGeneratingFromIdea}
                    onClick={handleGenerateFromIdea}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#6B1F33] text-white hover:bg-[#521727] disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                    title="Type an idea and let AI generate complete engaging post copy"
                  >
                    {isGeneratingFromIdea ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating copy…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>✨ Generate from idea</span>
                      </>
                    )}
                  </button>
                  <span className={`text-[11px] font-mono ${isOverCharLimit ? 'text-red-600 font-bold' : 'text-stone-400'}`}>
                    {content.length} / {minPlatformLimit} chars
                  </span>
                </div>
              </div>
              <textarea
                rows={5}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Type your idea or notes here (e.g. 'We launched our new feature and saw 300 signups'). Then click '✨ Generate from idea' above to create full post copy..."
                className="w-full text-sm p-3 rounded-xl border border-[#E3D6C9] bg-white focus:outline-none focus:border-[#6B1F33] leading-relaxed"
              />
              <p className="text-[10.5px] text-stone-400">
                Tip: Enter a rough idea and click <b className="text-stone-600">✨ Generate from idea</b> to craft polished copy tailored for your selected channels.
              </p>
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4A3238] flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-[#6B1F33]" />
                <span>Hashtags</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add hashtag (e.g. startup)..."
                  className="flex-1 text-xs p-2 rounded-lg border border-[#E3D6C9] bg-white focus:outline-none focus:border-[#6B1F33]"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#E3D6C9] hover:bg-[#d8c7b8] text-[#2A1A1D] transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {hashtags.map(t => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-[#E3D6C9] text-stone-700"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-stone-400 hover:text-stone-700 cursor-pointer ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#E3D6C9] bg-[#F7F0E8] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-[#E3D6C9] text-stone-600 bg-white hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleScheduleSubmit}
              disabled={isSubmitting || !timeValidation.valid || !content.trim() || isOverCharLimit}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#6B1F33] text-white hover:bg-[#521727] transition-all disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling Flight...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Schedule Post</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
