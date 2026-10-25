'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { BarcodeTicket } from './ui/BarcodeTicket';
import { studioToast } from '@/components/dashboard/StudioToast';
import type { WeekArc, ArcPost, ArcPlatformDraft, PlatformType } from '@/types/flightplan';
import { B, COL, BEAT_COLORS, PLATFORM_META } from './design-tokens';

interface ReviewScreenProps {
  arc: WeekArc;
  weekStartDate: string;
  isPreviewOnly: boolean;
  onApprove: (arc: WeekArc) => void;
  onBack: () => void;
  isScheduling: boolean;
  activeStoryIndex?: number;
  onStoryIndexChange?: (idx: number) => void;
  onStoryHoverChange?: (paused: boolean) => void;
}

const LIM = 2200;
const DN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const two = (n: number) => String(n).padStart(2, '0');

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
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
  arc: initialArc,
  weekStartDate,
  isPreviewOnly,
  onApprove,
  onBack,
  isScheduling,
}: ReviewScreenProps) {
  const [arc, setArc] = useState<WeekArc>(initialArc);
  const [activePlatformByPost, setActivePlatformByPost] = useState<Record<number, PlatformType>>({});

  const baseDate = useMemo(() => parseLocalDate(weekStartDate), [weekStartDate]);

  const dateOf = useCallback(
    (dayIndex: number) => {
      return addDays(baseDate, dayIndex);
    },
    [baseDate]
  );

  // Time format helper HH:MM
  const getTimeString = (post: ArcPost) => {
    return `${two(post.scheduledHour || 18)}:${two(post.scheduledMinute || 0)}`;
  };

  // Nudge time by minutes
  const handleNudgeTime = (dayIdx: number, addMins: number) => {
    setArc(prev => {
      const posts = [...prev.weekPosts];
      const target = { ...posts[dayIdx] };
      const currentMins = (target.scheduledHour || 18) * 60 + (target.scheduledMinute || 0);
      const newMins = (currentMins + addMins) % 1440;
      target.scheduledHour = Math.floor(newMins / 60);
      target.scheduledMinute = newMins % 60;
      posts[dayIdx] = target;
      return { ...prev, weekPosts: posts };
    });
  };

  // Set explicit time string "HH:MM"
  const handleTimeChange = (dayIdx: number, timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;

    setArc(prev => {
      const posts = [...prev.weekPosts];
      const target = { ...posts[dayIdx] };
      target.scheduledHour = h;
      target.scheduledMinute = m;
      posts[dayIdx] = target;
      return { ...prev, weekPosts: posts };
    });
  };

  // Update caption for active platform on a day
  const handleCaptionChange = (dayIdx: number, newCaption: string) => {
    setArc(prev => {
      const posts = [...prev.weekPosts];
      const target = { ...posts[dayIdx] };
      const activePlat = activePlatformByPost[dayIdx] || target.platforms[0]?.platform || 'instagram';

      const platforms = target.platforms.map(p => {
        if (p.platform === activePlat) {
          return {
            ...p,
            content: newCaption,
            characterCount: newCaption.length,
          };
        }
        return p;
      });

      target.platforms = platforms;
      posts[dayIdx] = target;
      return { ...prev, weekPosts: posts };
    });
  };

  // Toggle Auto First Comment
  const handleToggleFirstComment = (dayIdx: number) => {
    setArc(prev => {
      const posts = [...prev.weekPosts];
      const target = { ...posts[dayIdx] };
      const platforms = target.platforms.map(p => ({
        ...p,
        autoFirstComment: p.autoFirstComment ? null : 'Comment FLIGHT to get the full story breakdown.',
      }));
      target.platforms = platforms;
      posts[dayIdx] = target;
      return { ...prev, weekPosts: posts };
    });
  };

  // Handle image upload from file picker or drag-drop
  const handleImageUpload = (dayIdx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const names = Array.from(files).map(f => URL.createObjectURL(f));

    setArc(prev => {
      const posts = [...prev.weekPosts];
      const target = { ...posts[dayIdx] };
      const existing = target.imageUrls || [];
      const updated = [...existing, ...names].slice(0, 10);
      target.imageUrls = updated;

      target.platforms = target.platforms.map(p => ({
        ...p,
        mediaUrls: updated.map(u => ({ url: u, type: 'image' })),
      }));

      posts[dayIdx] = target;
      return { ...prev, weekPosts: posts };
    });

    studioToast.success(`Added ${files.length} media file${files.length > 1 ? 's' : ''}`);
  };

  // Check validation state
  const { overLimitCount, missingMediaCount } = useMemo(() => {
    let over = 0;
    let missing = 0;
    arc.weekPosts.forEach(p => {
      const activePlat = p.platforms[0];
      if (activePlat && (activePlat.content?.length || 0) > LIM) {
        over++;
      }
      if (!p.imageUrls || p.imageUrls.length === 0) {
        missing++;
      }
    });
    return { overLimitCount: over, missingMediaCount: missing };
  }, [arc]);

  const scrollToDay = (idx: number) => {
    const el = document.getElementById(`d${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ marginTop: 20 }}>
        <h2>Review your week</h2>
        <p className="fp-sub">
          Everything is already written and timed. Check each day, add a photo or video, then approve to schedule all seven posts.
        </p>
      </div>

      {/* Sticky Day Navigation Bar (.sbar) */}
      <div className="fp-sbar">
        {arc.weekPosts.map((post, i) => {
          const c = COL[i] || '#C0607A';
          return (
            <button
              key={post.day}
              type="button"
              onClick={() => scrollToDay(i)}
              style={{ ['--c' as any]: c }}
            >
              {DN[i]}
              <small>{post.arcBeat}</small>
            </button>
          );
        })}
      </div>

      {/* 7 Boarding Pass Day Articles */}
      <div className="space-y-5">
        {arc.weekPosts.map((post, i) => {
          const c = COL[i] || '#C0607A';
          const dayDate = dateOf(i);
          const activePlat = activePlatformByPost[i] || post.platforms[0]?.platform || 'instagram';
          const currentDraft = post.platforms.find(p => p.platform === activePlat) || post.platforms[0];
          const caption = currentDraft?.content || '';
          const charCount = caption.length;
          const isOver = charCount > LIM;
          const timeStr = getTimeString(post);

          const ticketId = `FP-${two(dayDate.getMonth() + 1)}${two(dayDate.getDate())}-D${i + 1}-${timeStr.replace(':', '')}`;
          const hasAutoComment = !!currentDraft?.autoFirstComment;

          return (
            <article
              key={post.day}
              id={`d${i}`}
              className="fp-tkt day"
              style={{ ['--c' as any]: c }}
            >
              {/* Left Main Section */}
              <div className="main">
                <div className="fp-air">
                  <span>
                    <i>✈</i> Day {i + 1} of 7
                  </span>
                  <span>{format(dayDate, 'EEEE d MMMM')}</span>
                </div>

                <h3 className="fp-big" style={{ color: c }}>
                  {post.arcBeat}
                </h3>
                <p className="fp-sub" style={{ marginTop: 2 }}>
                  Why this day: {post.arcBeatReason}
                </p>

                {/* Platform Tabs Selector */}
                {post.platforms.length > 1 && (
                  <div className="fp-chs" style={{ marginTop: 14 }}>
                    {post.platforms.map(p => (
                      <button
                        key={p.platform}
                        type="button"
                        onClick={() =>
                          setActivePlatformByPost(prev => ({
                            ...prev,
                            [i]: p.platform,
                          }))
                        }
                        className={`fp-ch ${p.platform === activePlat ? 'on' : ''}`}
                      >
                        {PLATFORM_META[p.platform]?.name || p.platform}
                      </button>
                    ))}
                  </div>
                )}

                {/* Caption Editor */}
                <div className="fp-lb" style={{ marginTop: 14 }}>
                  <span>Post caption. This is what followers read.</span>
                  <span className={isOver ? 'fp-bad' : 'fp-ok'}>
                    {charCount} of {LIM} characters
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={caption}
                  onChange={e => handleCaptionChange(i, e.target.value)}
                  placeholder="Post content..."
                />
              </div>

              {/* Right Stub Section */}
              <div className="stub">
                <div className="fp-fld">
                  <span>Goes live at</span>
                  <input
                    type="time"
                    value={timeStr}
                    onChange={e => handleTimeChange(i, e.target.value)}
                  />
                  <em>Picked for your audience. Nudge it later:</em>
                  <div className="fp-chs" style={{ marginTop: 4 }}>
                    {[5, 15, 30, 60].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        className="fp-ch"
                        onClick={() => handleNudgeTime(i, mins)}
                      >
                        +{mins < 60 ? `${mins} min` : '1 hour'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photos or Video Dropzone */}
                <div className="fp-fld">
                  <span>Photos or video ({post.imageUrls?.length || 0} of 10)</span>
                  <label className="fp-dz" style={{ ['--c' as any]: c }}>
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*,video/*"
                      onChange={e => handleImageUpload(i, e.target.files)}
                    />
                    {post.imageUrls && post.imageUrls.length > 0
                      ? post.imageUrls.map((url, imgIdx) => (
                          <em key={imgIdx}>Media {imgIdx + 1}</em>
                        ))
                      : '+ Tap to add, or drop files here'}
                  </label>
                </div>

                {/* Auto First Comment Switch */}
                <div className="fp-fld">
                  <div
                    className={`fp-sw ${hasAutoComment ? 'on' : ''}`}
                    role="switch"
                    tabIndex={0}
                    onClick={() => handleToggleFirstComment(i)}
                  >
                    <i />
                    <span>Auto first comment</span>
                  </div>
                  <em>Adds call-to-action link under the post.</em>
                </div>

                <BarcodeTicket code={ticketId} note="Updates with time" />
              </div>
            </article>
          );
        })}
      </div>

      {/* Sticky Bottom Approval Bar (.rbar) */}
      <div className="fp-rbar">
        <button
          type="button"
          className="fp-btn"
          onClick={onBack}
        >
          ← Back to story
        </button>

        <span>
          {overLimitCount > 0
            ? `${overLimitCount} caption${overLimitCount > 1 ? 's are' : ' is'} over the limit.`
            : missingMediaCount > 0
            ? `${missingMediaCount} day${missingMediaCount > 1 ? 's' : ''} still need media. You can approve now and add media later.`
            : 'Every day is ready.'}
        </span>

        <button
          type="button"
          className="fp-btn gold"
          disabled={isScheduling || overLimitCount > 0}
          onClick={() => onApprove(arc)}
        >
          {isScheduling ? 'Scheduling flight plan…' : 'Approve and schedule flight plan'}
        </button>
      </div>
    </div>
  );
}

export default ReviewScreen;