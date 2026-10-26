'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { format, addDays, isToday, startOfDay } from 'date-fns';
import { BarcodeTicket } from './ui/BarcodeTicket';
import { HashtagInput } from './ui/HashtagInput';
import { ImageDropZone } from './ui/ImageDropZone';
import { PlatformBrandLogo } from '@/components/dashboard/PlatformLogos';
import { studioToast } from '@/components/dashboard/StudioToast';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { PLATFORM_CONFIG } from '@/types/flightplan';
import type { WeekArc, ArcPost, ArcPlatformDraft, PlatformType } from '@/types/flightplan';
import { COL, BEAT_COLORS, PLATFORM_META } from './design-tokens';

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
  const [arc, setArc] = useState<WeekArc>(() => {
    // Ensure all posts and platforms have default enabled & media structure
    return {
      ...initialArc,
      weekPosts: (initialArc.weekPosts || []).map(post => ({
        ...post,
        imageUrls: post.imageUrls || [],
        platforms: (post.platforms || []).map(p => ({
          ...p,
          enabled: p.enabled !== false,
          hashtags: p.hashtags || [],
          characterCount: p.content?.length || 0,
        })),
      })),
    };
  });

  const [activePlatformByPost, setActivePlatformByPost] = useState<Record<number, PlatformType>>({});
  const [isUploadingByDay, setIsUploadingByDay] = useState<Record<number, boolean>>({});
  const [isDraggingByDay, setIsDraggingByDay] = useState<Record<number, boolean>>({});

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

  // Nudge time by minutes (+/-)
  const handleNudgeTime = (dayIdx: number, addMins: number) => {
    setArc(prev => {
      const posts = [...prev.weekPosts];
      const target = { ...posts[dayIdx] };
      const currentMins = (target.scheduledHour || 18) * 60 + (target.scheduledMinute || 0);
      let newMins = (currentMins + addMins) % 1440;
      if (newMins < 0) newMins += 1440;

      const targetDay = dateOf(dayIdx);
      const now = new Date();
      if (isToday(targetDay)) {
        const candidateTime = new Date(targetDay);
        candidateTime.setHours(Math.floor(newMins / 60), newMins % 60, 0, 0);
        if (candidateTime.getTime() <= now.getTime()) {
          studioToast.generationFailed('Cannot schedule for a time that has already passed today.');
          return prev;
        }
      }

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

    const targetDay = dateOf(dayIdx);
    const now = new Date();
    if (isToday(targetDay)) {
      const candidateTime = new Date(targetDay);
      candidateTime.setHours(h, m, 0, 0);
      if (candidateTime.getTime() <= now.getTime()) {
        studioToast.generationFailed('Cannot schedule for a time that has already passed today.');
        return;
      }
    }

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
  const handleCaptionChange = (dayIdx: number, platform: PlatformType, newCaption: string) => {
    setArc(prev => {
      const posts = [...prev.weekPosts];
      const target = { ...posts[dayIdx] };

      target.platforms = target.platforms.map(p => {
        if (p.platform === platform) {
          return {
            ...p,
            content: newCaption,
            characterCount: newCaption.length,
          };
        }
        return p;
      });

      posts[dayIdx] = target;
      return { ...prev, weekPosts: posts };
    });
  };

  // Toggle platform enabled/included on a day
  const handleTogglePlatformEnabled = (dayIdx: number, platform: PlatformType) => {
    setArc(prev => {
      const posts = [...prev.weekPosts];
      const target = { ...posts[dayIdx] };

      target.platforms = target.platforms.map(p => {
        if (p.platform === platform) {
          const nextState = p.enabled === false;
          return {
            ...p,
            enabled: nextState,
          };
        }
        return p;
      });

      posts[dayIdx] = target;
      return { ...prev, weekPosts: posts };
    });
  };

  // Add hashtag to specific platform draft
  const handleAddHashtag = (dayIdx: number, platform: PlatformType, tag: string) => {
    const clean = tag.trim().replace(/^#+/, '');
    if (!clean) return;

    setArc(prev => {
      const posts = [...prev.weekPosts];
      const target = { ...posts[dayIdx] };

      target.platforms = target.platforms.map(p => {
        if (p.platform === platform) {
          const existing = p.hashtags || [];
          if (!existing.includes(clean)) {
            return { ...p, hashtags: [...existing, clean] };
          }
        }
        return p;
      });

      posts[dayIdx] = target;
      return { ...prev, weekPosts: posts };
    });
  };

  // Remove hashtag from specific platform draft
  const handleRemoveHashtag = (dayIdx: number, platform: PlatformType, tag: string) => {
    setArc(prev => {
      const posts = [...prev.weekPosts];
      const target = { ...posts[dayIdx] };

      target.platforms = target.platforms.map(p => {
        if (p.platform === platform) {
          return {
            ...p,
            hashtags: (p.hashtags || []).filter(t => t !== tag),
          };
        }
        return p;
      });

      posts[dayIdx] = target;
      return { ...prev, weekPosts: posts };
    });
  };

  // Toggle Auto First Comment for this day
  const handleToggleFirstComment = (dayIdx: number) => {
    setArc(prev => {
      const posts = [...prev.weekPosts];
      const target = { ...posts[dayIdx] };
      const hasAnyComment = target.platforms.some(p => Boolean(p.autoFirstComment));

      target.platforms = target.platforms.map(p => ({
        ...p,
        autoFirstComment: hasAnyComment ? null : 'Comment FLIGHT to get the full story breakdown.',
      }));

      posts[dayIdx] = target;
      return { ...prev, weekPosts: posts };
    });
  };

  // Handle image upload from file picker or drag-drop
  const handleImageUpload = async (dayIdx: number, files: FileList | File[]): Promise<void> => {
    if (!files || files.length === 0) return;
    setIsUploadingByDay(prev => ({ ...prev, [dayIdx]: true }));

    try {
      const fileArray = Array.from(files);
      const uploadedUrls: string[] = [];

      for (const file of fileArray) {
        if (typeof file === 'string') {
          uploadedUrls.push(file);
          continue;
        }

        // 1. Try server storage upload first
        let uploadSucceeded = false;
        try {
          const contentType = file.type || 'image/jpeg';
          const res = await fetch('/api/composer/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, contentType }),
          });
          const data = await res.json();
          if (res.ok && data.signedUrl) {
            const putRes = await fetch(data.signedUrl, {
              method: 'PUT',
              headers: { 'Content-Type': contentType },
              body: file,
            });
            if (putRes.ok && data.url) {
              uploadedUrls.push(data.url);
              uploadSucceeded = true;
            }
          }
        } catch {
          // Fall through to Data URI fallback
        }

        // 2. Fallback to base64 Data URI (safe for both browser render & Node.js sharp processing)
        if (!uploadSucceeded) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(dataUrl);
        }
      }

      setArc(prev => {
        const posts = [...prev.weekPosts];
        const target = { ...posts[dayIdx] };
        const existing = target.imageUrls || [];
        const updated = [...existing, ...uploadedUrls].slice(0, 10);

        target.imageUrls = updated;
        target.platforms = target.platforms.map(p => ({
          ...p,
          mediaUrls: updated.map(u => ({ url: u, type: 'image' as const })),
        }));

        posts[dayIdx] = target;
        return { ...prev, weekPosts: posts };
      });

      studioToast.success(`Added ${uploadedUrls.length} media file${uploadedUrls.length > 1 ? 's' : ''}`);
    } catch {
      studioToast.generationFailed('Failed to attach media file.');
    } finally {
      setIsUploadingByDay(prev => ({ ...prev, [dayIdx]: false }));
    }
  };

  // Remove individual image from post
  const handleRemoveImage = (dayIdx: number, imgIdx: number) => {
    setArc(prev => {
      const posts = [...prev.weekPosts];
      const target = { ...posts[dayIdx] };
      const updated = (target.imageUrls || []).filter((_, i) => i !== imgIdx);

      target.imageUrls = updated;
      target.platforms = target.platforms.map(p => ({
        ...p,
        mediaUrls: updated.map(u => ({ url: u, type: 'image' as const })),
      }));

      posts[dayIdx] = target;
      return { ...prev, weekPosts: posts };
    });
  };

  // Validation analysis
  const { overLimitCount, missingMediaCount } = useMemo(() => {
    let over = 0;
    let missing = 0;

    arc.weekPosts.forEach(p => {
      const enabledPlatforms = p.platforms.filter(plat => plat.enabled !== false);
      enabledPlatforms.forEach(plat => {
        const maxChars = PLATFORM_CONFIG[plat.platform as PlatformType]?.maxChars || 2200;
        if ((plat.content?.length || 0) > maxChars) {
          over++;
        }
      });

      // Instagram requires media
      const hasInstagram = enabledPlatforms.some(plat => plat.platform === 'instagram');
      if (hasInstagram && (!p.imageUrls || p.imageUrls.length === 0)) {
        missing++;
      }
    });

    return { overLimitCount: over, missingMediaCount: missing };
  }, [arc]);

  // Validation on Approval
  const handleApproveWithValidation = async () => {
    for (const post of arc.weekPosts) {
      for (const platform of post.platforms) {
        if (platform.enabled === false) continue;

        // Content safety guardrail check
        const guard = ContentGuard.validateSocialInput(platform.content, { route: 'flightplan/review' });
        if (!guard.safe) {
          studioToast.generationFailed(guard.violation.message, {
            platforms: [platform.platform],
            knowMoreUrl: '/terms',
          });
          return;
        }

        // Platform character limits check
        const config = PLATFORM_CONFIG[platform.platform as PlatformType];
        if (config && platform.content.length > config.maxChars) {
          studioToast.generationFailed(
            `Content for ${config.name} exceeds the character limit of ${config.maxChars} (${platform.content.length}/${config.maxChars}).`,
            { platforms: [platform.platform] }
          );
          return;
        }
      }
    }

    onApprove(arc);
  };

  const scrollToDay = (idx: number) => {
    const el = document.getElementById(`d${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ marginTop: 20 }}>
        <h2>Review your week</h2>
        <p className="fp-sub">
          Everything is written and timed. Review each day, attach photos or videos with drag &amp; drop, adjust
          hashtags, and include or exclude platforms before approving.
        </p>
      </div>

      {/* Sticky Day Navigation Bar (.fp-sbar) */}
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
          const isTodayPost = isToday(dayDate);

          const activePlat =
            activePlatformByPost[i] ||
            post.platforms.find(p => p.enabled !== false)?.platform ||
            post.platforms[0]?.platform ||
            'instagram';

          const currentDraft =
            post.platforms.find(p => p.platform === activePlat) || post.platforms[0];

          const isCurrentPlatformEnabled = currentDraft?.enabled !== false;
          const maxChars = PLATFORM_CONFIG[activePlat as PlatformType]?.maxChars || 2200;
          const caption = currentDraft?.content || '';
          const charCount = caption.length;
          const isOver = charCount > maxChars;
          const timeStr = getTimeString(post);

          // Check if time is in the past for today
          const postDateTime = new Date(dayDate);
          postDateTime.setHours(post.scheduledHour || 18, post.scheduledMinute || 0, 0, 0);
          const isPastTime = isTodayPost && postDateTime.getTime() <= now.getTime();

          const ticketId = `FP-${two(dayDate.getMonth() + 1)}${two(dayDate.getDate())}-D${i + 1}-${timeStr.replace(':', '')}`;
          const hasAutoComment = post.platforms.some(p => Boolean(p.autoFirstComment));

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

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
                  <h3 className="fp-big" style={{ color: c }}>
                    {post.arcBeat}
                  </h3>
                  {isPastTime && (
                    <span
                      style={{
                        background: 'var(--wabg)',
                        color: 'var(--now)',
                        border: '1px solid var(--bd)',
                        borderRadius: 999,
                        padding: '2px 9px',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      Time passed for today
                    </span>
                  )}
                </div>

                <p className="fp-sub" style={{ marginTop: 2 }}>
                  Why this day: {post.arcBeatReason}
                </p>

                {/* Platform Tabs Selector */}
                <div className="fp-chs" style={{ marginTop: 14 }}>
                  {post.platforms.map(p => {
                    const isTabActive = p.platform === activePlat;
                    const isEnabled = p.enabled !== false;
                    const meta = PLATFORM_META[p.platform];
                    return (
                      <button
                        key={p.platform}
                        type="button"
                        onClick={() =>
                          setActivePlatformByPost(prev => ({
                            ...prev,
                            [i]: p.platform,
                          }))
                        }
                        className={`fp-plat-tab ${isTabActive ? 'on' : ''} ${!isEnabled ? 'excluded' : ''}`}
                        title={
                          isEnabled
                            ? `${meta?.name || p.platform} (Included in this post)`
                            : `${meta?.name || p.platform} (Excluded / skipped for this post)`
                        }
                      >
                        <PlatformBrandLogo platform={p.platform as any} size={14} />
                        <span>{meta?.name || p.platform}</span>
                        {!isEnabled && (
                          <span style={{ fontSize: 10, textDecoration: 'none' }}>(Excluded)</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Platform Inclusion / Exclusion Toggle Bar */}
                <div className="fp-toggle-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PlatformBrandLogo platform={activePlat as any} size={15} />
                    <span style={{ fontWeight: 600, color: 'var(--tx)' }}>
                      Upload to {PLATFORM_CONFIG[activePlat as PlatformType]?.name || activePlat}:
                    </span>
                    <span style={{ color: isCurrentPlatformEnabled ? 'var(--tx2)' : 'var(--mu)', fontSize: 12.5 }}>
                      {isCurrentPlatformEnabled ? '• Included in Flight Plan' : '• Excluded / skipped for this day'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePlatformEnabled(i, activePlat)}
                    className={`fp-ch ${isCurrentPlatformEnabled ? 'on' : ''}`}
                    style={{
                      padding: '4px 12px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {isCurrentPlatformEnabled ? '✓ Included' : '✕ Excluded'}
                  </button>
                </div>

                {/* Excluded notice if disabled */}
                {!isCurrentPlatformEnabled && (
                  <div
                    style={{
                      background: 'var(--acbg)',
                      border: '1px dashed var(--bd)',
                      borderRadius: 10,
                      padding: '6px 12px',
                      fontSize: 12,
                      color: 'var(--tx2)',
                      marginBottom: 8,
                    }}
                  >
                    This day will not post to {PLATFORM_CONFIG[activePlat as PlatformType]?.name || activePlat}. Click “Included” above to re-enable.
                  </div>
                )}

                {/* Caption Editor */}
                <div className="fp-lb" style={{ marginTop: 10 }}>
                  <span>Post caption. This is what followers read.</span>
                  <span className={isOver ? 'fp-bad' : 'fp-ok'}>
                    {charCount} of {maxChars} characters
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={caption}
                  disabled={!isCurrentPlatformEnabled}
                  onChange={e => handleCaptionChange(i, activePlat, e.target.value)}
                  placeholder={`Post content for ${PLATFORM_CONFIG[activePlat as PlatformType]?.name || activePlat}...`}
                  style={{
                    opacity: isCurrentPlatformEnabled ? 1 : 0.6,
                    borderColor: isOver ? 'var(--bad)' : 'var(--bd)',
                  }}
                />

                {/* Hashtags Section */}
                <div style={{ marginTop: 12 }}>
                  <div className="fp-lb" style={{ marginTop: 0, marginBottom: 6 }}>
                    <span>Hashtags for {PLATFORM_CONFIG[activePlat as PlatformType]?.name || activePlat}</span>
                    <span>{(currentDraft?.hashtags || []).length} / 30 tags</span>
                  </div>
                  <HashtagInput
                    tags={currentDraft?.hashtags || []}
                    onAdd={tag => handleAddHashtag(i, activePlat, tag)}
                    onRemove={tag => handleRemoveHashtag(i, activePlat, tag)}
                    placeholder="add tag..."
                    maxTags={30}
                  />
                </div>
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
                  <em>Picked for your audience. Nudge time:</em>
                  <div className="fp-chs" style={{ marginTop: 4 }}>
                    {[5, 15, 30, 60].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        className="fp-ch"
                        onClick={() => handleNudgeTime(i, mins)}
                      >
                        +{mins < 60 ? `${mins}m` : '1h'}
                      </button>
                    ))}
                    {[-60, -5].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        className="fp-ch"
                        onClick={() => handleNudgeTime(i, mins)}
                      >
                        {mins === -60 ? '-1h' : '-5m'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photos or Video Drag-and-Drop Dropzone */}
                <div className="fp-fld">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Attached Media ({post.imageUrls?.length || 0} of 10)</span>
                    <span style={{ fontSize: 11, color: 'var(--mu)' }}>Images, videos, PDFs</span>
                  </div>

                  <ImageDropZone
                    images={post.imageUrls || []}
                    onUpload={files => handleImageUpload(i, files)}
                    onRemove={imgIdx => handleRemoveImage(i, imgIdx)}
                    maxImages={10}
                    isUploading={isUploadingByDay[i] || false}
                    isDragging={isDraggingByDay[i] || false}
                    setIsDragging={dragging => setIsDraggingByDay(prev => ({ ...prev, [i]: dragging }))}
                    compact={true}
                  />
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

      {/* Sticky Bottom Approval Bar (.fp-rbar) */}
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
            ? `${overLimitCount} caption${overLimitCount > 1 ? 's are' : ' is'} over the character limit.`
            : missingMediaCount > 0
            ? `${missingMediaCount} day${missingMediaCount > 1 ? 's' : ''} still need media for Instagram. You can approve now and add media later.`
            : 'Every day is ready for take-off.'}
        </span>

        <button
          type="button"
          className="fp-btn gold"
          disabled={isScheduling || overLimitCount > 0}
          onClick={handleApproveWithValidation}
        >
          {isScheduling ? 'Scheduling flight plan…' : 'Approve and schedule flight plan'}
        </button>
      </div>
    </div>
  );
}

export default ReviewScreen;