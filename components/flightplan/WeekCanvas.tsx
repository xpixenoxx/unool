'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { ScheduledPostModal } from './ScheduledPostModal';
import { ScheduleNewPostModal } from './ScheduleNewPostModal';
import { BarcodeTicket } from './ui/BarcodeTicket';
import { useFlightPlanActions } from '@/hooks/flightplan';
import { studioToast } from '@/components/dashboard/StudioToast';
import type { CanvasPost, PlatformType } from '@/types/flightplan';
import { B, COL, BEAT_COLORS, PLATFORM_META } from './design-tokens';

interface WeekCanvasProps {
  workspaceId: string;
  targetPostId?: string | null;
  onNewArc: () => void;
  onPostCountChange?: (count: number) => void;
  initialWeekOffset?: number;
  autoTour?: boolean;
  onTourComplete?: () => void;
  isHoldActive?: boolean;
  connectedPlatforms?: PlatformType[];
}

const BEATS = [
  'Departure Hook',
  'Cruising Altitude',
  'Turbulence & Pivot',
  'Flight Telemetry',
  'Final Approach',
  'Open Frequency',
  'Next Horizon',
];
const SUBS = [
  'The take-off disruption',
  'The backstory & context',
  'The breakthrough challenge',
  'Evidence, numbers & proof',
  'The direct conversion call',
  'Weekend audience dialogue',
  'The next voyage ahead',
];
const TEN = [55, 28, 78, 58, 92, 45, 70];
const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function catmull(p: number[][]): string[] {
  const s: string[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(i - 1, 0)];
    const b = p[i];
    const c = p[i + 1];
    const d = p[Math.min(i + 2, p.length - 1)];
    s.push(
      `C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (d[0] - b[0]) / 6},${c[1] - (d[1] - b[1]) / 6} ${c[0]},${c[1]}`
    );
  }
  return s;
}

const two = (n: number) => String(n).padStart(2, '0');

function getLivePlatformUrl(v: {
  platform: string;
  platformUrl?: string | null;
  platformPostId?: string | null;
}): string {
  if (v.platformUrl && typeof v.platformUrl === 'string' && v.platformUrl.trim().startsWith('http')) {
    return v.platformUrl.trim();
  }

  const rawId = v.platformPostId?.trim() || '';
  const p = v.platform?.toLowerCase() || '';

  switch (p) {
    case 'linkedin':
      return rawId ? `https://www.linkedin.com/feed/update/${rawId}` : 'https://www.linkedin.com/feed/';
    case 'x':
    case 'twitter':
      return rawId ? `https://x.com/i/status/${rawId}` : 'https://x.com';
    case 'bluesky':
      if (rawId.startsWith('http')) return rawId;
      if (rawId.includes('/')) return `https://bsky.app/profile/${rawId}`;
      return rawId ? `https://bsky.app/profile/${rawId}` : 'https://bsky.app';
    case 'facebook':
      return rawId ? `https://www.facebook.com/${rawId}` : 'https://www.facebook.com';
    case 'instagram':
      return rawId ? `https://www.instagram.com/p/${rawId}/` : 'https://www.instagram.com';
    case 'threads':
      return rawId ? `https://www.threads.net/post/${rawId}` : 'https://www.threads.net';
    case 'pinterest':
      return rawId ? `https://www.pinterest.com/pin/${rawId}/` : 'https://www.pinterest.com';
    case 'youtube':
      return rawId ? `https://www.youtube.com/watch?v=${rawId}` : 'https://www.youtube.com';
    case 'mastodon':
      return rawId.startsWith('http') ? rawId : 'https://mastodon.social';
    case 'reddit':
      return rawId ? `https://www.reddit.com/comments/${rawId}` : 'https://www.reddit.com';
    case 'discord':
      return rawId.startsWith('http') ? rawId : 'https://discord.com/app';
    case 'slack':
      return rawId.startsWith('http') ? rawId : 'https://slack.com';
    case 'devto':
      return rawId ? `https://dev.to/articles/${rawId}` : 'https://dev.to';
    case 'medium':
      return rawId.startsWith('http') ? rawId : 'https://medium.com';
    case 'hashnode':
      return rawId.startsWith('http') ? rawId : 'https://hashnode.com';
    case 'twitch':
      return rawId ? `https://twitch.tv/${rawId}` : 'https://twitch.tv';
    case 'dribbble':
      return rawId ? `https://dribbble.com/shots/${rawId}` : 'https://dribbble.com';
    default:
      return 'https://unool.co/dashboard';
  }
}

// Fixed star coordinates for reproducible starfield
const STARS = Array.from({ length: 46 }, (_, i) => ({
  cx: ((i * 137 + 45) % 960) + 20,
  cy: ((i * 83 + 27) % 280) + 15,
  r: (((i * 17) % 13) / 10 + 0.3).toFixed(1),
  opacity: (((i * 23) % 50) / 100 + 0.15).toFixed(2),
}));

export function WeekCanvas({
  workspaceId,
  targetPostId,
  onNewArc,
  onPostCountChange,
  initialWeekOffset = 0,
  autoTour = false,
  onTourComplete,
  isHoldActive = false,
  connectedPlatforms,
}: WeekCanvasProps) {
  const [posts, setPosts] = useState<CanvasPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(initialWeekOffset);

  useEffect(() => {
    if (typeof initialWeekOffset === 'number' && initialWeekOffset !== weekOffset) {
      setWeekOffset(initialWeekOffset);
    }
  }, [initialWeekOffset]);
  const [sel, setSel] = useState<number>(() => {
    const day = (new Date().getDay() + 6) % 7;
    return day;
  });
  const [selectedPost, setSelectedPost] = useState<CanvasPost | null>(null);
  const [selectedPostIndexByDay, setSelectedPostIndexByDay] = useState<Record<number, number>>({});
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [newPostModalDate, setNewPostModalDate] = useState<Date>(() => new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const openedTargetPostIdRef = useRef<string | null>(null);
  const isFetchingTargetRef = useRef<string | null>(null);

  useEffect(() => {
    setIsContentExpanded(false);
  }, [sel, selectedPostIndexByDay]);

  const { loadCanvas, holdQueue, cancelPost } = useFlightPlanActions();

  // SVG Flight Map animation refs
  const mapSvgRef = useRef<SVGSVGElement | null>(null);
  const paPathRef = useRef<SVGPathElement | null>(null);
  const ppPathRef = useRef<SVGPathElement | null>(null);
  const mkGroupRef = useRef<SVGGElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tourIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentLengthRef = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const weekStart = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(monday, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const loadWeekCanvas = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedPosts = await loadCanvas(weekOffset);
      setPosts(loadedPosts || []);
      onPostCountChange?.(loadedPosts?.length || 0);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [weekOffset, loadCanvas, onPostCountChange]);

  useEffect(() => {
    loadWeekCanvas();
  }, [loadWeekCanvas]);

  // Target post auto-open (supports both currently scheduled posts and unscheduled/draft posts)
  useEffect(() => {
    if (!targetPostId) return;
    if (openedTargetPostIdRef.current === targetPostId) return;

    // 1. Check if already loaded in current week's posts
    const existing = posts.find(p => p.postId === targetPostId);
    if (existing) {
      openedTargetPostIdRef.current = targetPostId;
      setSelectedPost(existing);
      return;
    }

    // 2. Check sessionStorage for instant pre-cached post (0ms modal open)
    try {
      if (typeof window !== 'undefined') {
        const cachedRaw = sessionStorage.getItem(`unool_edit_post_${targetPostId}`);
        if (cachedRaw) {
          const cachedPost = JSON.parse(cachedRaw) as CanvasPost;
          if (cachedPost && cachedPost.postId === targetPostId) {
            openedTargetPostIdRef.current = targetPostId;
            setSelectedPost(cachedPost);
            if (cachedPost.scheduledAt) {
              const postDate = new Date(cachedPost.scheduledAt);
              const now = new Date();
              const mondayThisWeek = startOfWeek(now, { weekStartsOn: 1 });
              const mondayPostWeek = startOfWeek(postDate, { weekStartsOn: 1 });
              const diffWeeks = Math.round(
                (mondayPostWeek.getTime() - mondayThisWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)
              );
              if (diffWeeks >= 0 && diffWeeks <= 1) {
                setWeekOffset(diffWeeks);
              }
              const dayIndex = (postDate.getDay() + 6) % 7;
              setSel(dayIndex);
            }
          }
        }
      }
    } catch {
      // ignore
    }

    // 3. Immediately fetch directly from API in parallel (do NOT wait for loadWeekCanvas or isLoading)
    if (isFetchingTargetRef.current === targetPostId) return;
    isFetchingTargetRef.current = targetPostId;

    let cancelled = false;
    const fetchTargetPost = async () => {
      try {
        const res = await fetch(`/api/composer/schedule/${targetPostId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.post && !cancelled) {
            const p: CanvasPost = data.post;
            openedTargetPostIdRef.current = targetPostId;

            // If post has a scheduledAt date, align weekOffset and day
            if (p.scheduledAt) {
              const postDate = new Date(p.scheduledAt);
              const now = new Date();
              const mondayThisWeek = startOfWeek(now, { weekStartsOn: 1 });
              const mondayPostWeek = startOfWeek(postDate, { weekStartsOn: 1 });
              const diffWeeks = Math.round(
                (mondayPostWeek.getTime() - mondayThisWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)
              );
              if (diffWeeks >= 0 && diffWeeks <= 1) {
                setWeekOffset(diffWeeks);
              }
              const dayIndex = (postDate.getDay() + 6) % 7;
              setSel(dayIndex);
            }

            // Merge into local posts state
            setPosts(prev => {
              if (prev.some(item => item.postId === p.postId)) return prev;
              return [...prev, p];
            });

            // Open the review & edit modal
            setSelectedPost(p);
          }
        }
      } catch (err) {
        console.error('Failed to load target post for Flight Plan:', err);
      } finally {
        if (!cancelled) {
          isFetchingTargetRef.current = null;
        }
      }
    };
    fetchTargetPost();
    return () => {
      cancelled = true;
      isFetchingTargetRef.current = null;
    };
  }, [targetPostId, posts]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, CanvasPost[]>();
    for (const post of posts) {
      if (!post.scheduledAt) continue;
      const day = format(new Date(post.scheduledAt), 'yyyy-MM-dd');
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(post);
    }
    // Sort posts chronologically within each day
    for (const [, dayPosts] of map.entries()) {
      dayPosts.sort((a, b) => {
        const timeA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const timeB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return timeA - timeB;
      });
    }
    return map;
  }, [posts]);

  const scheduledCount = useMemo(() => posts.filter(p => p.status === 'scheduled').length, [posts]);
  const publishedCount = useMemo(
    () => posts.filter(p => p.status === 'published' || p.platforms.some(v => v.status === 'published')).length,
    [posts]
  );
  const uniquePlatformsCount = useMemo(() => {
    const s = new Set<string>();
    posts.forEach(p => p.platforms.forEach(v => s.add(v.platform)));
    return s.size || 1;
  }, [posts]);

  // Catmull points & curve (compact vertical height)
  const points = useMemo(() => {
    return BEATS.map((_, i) => [80 + i * 140, 136 - TEN[i] * 0.75]);
  }, []);

  const splineD = useMemo(() => {
    const s = catmull(points);
    return 'M' + points[0].join(',') + s.join('');
  }, [points]);

  // Max peak index
  const peakIdx = useMemo(() => {
    return TEN.reduce((maxI, t, i) => (t > TEN[maxI] ? i : maxI), 0);
  }, []);

  // Update airplane position along the curve
  const placeAirplane = useCallback((targetLength: number, totalLength: number) => {
    const pa = paPathRef.current;
    const mk = mkGroupRef.current;
    const pp = ppPathRef.current;
    if (!pa || !mk) return;

    const q = pa.getPointAtLength(targetLength);
    const r = pa.getPointAtLength(Math.min(targetLength + 4, totalLength));
    const o = pa.getPointAtLength(Math.max(targetLength - 4, 0));
    const angle = (Math.atan2(r.y - o.y, r.x - o.x) * 180) / Math.PI;

    mk.setAttribute('transform', `translate(${q.x},${q.y}) rotate(${angle})`);

    if (pp) {
      pp.style.strokeDasharray = `${totalLength}`;
      pp.style.strokeDashoffset = `${totalLength - targetLength}`;
    }
  }, []);

  // Compute exact arc-length along the Catmull curve for node index (0..6)
  const getNodeLength = useCallback((index: number, total: number, path: SVGPathElement): number => {
    if (index <= 0) return 0;
    if (index >= 6) return total;
    const targetX = points[index][0];
    let low = 0;
    let high = total;
    for (let iter = 0; iter < 16; iter++) {
      const mid = (low + high) / 2;
      const pt = path.getPointAtLength(mid);
      if (pt.x < targetX) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return (low + high) / 2;
  }, [points]);

  // Smooth flight animation to day index using requestAnimationFrame
  const flyToDay = useCallback((targetIndex: number, duration = 650) => {
    const pa = paPathRef.current;
    if (!pa) return;
    const total = pa.getTotalLength();
    const targetLength = getNodeLength(targetIndex, total, pa);

    if (currentLengthRef.current === null) {
      currentLengthRef.current = targetLength;
      placeAirplane(targetLength, total);
      return;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const startLength = currentLengthRef.current;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic easeInOut for natural acceleration & deceleration
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const current = startLength + (targetLength - startLength) * ease;
      currentLengthRef.current = current;
      placeAirplane(current, total);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, [getNodeLength, placeAirplane]);

  useEffect(() => {
    flyToDay(sel);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [sel, flyToDay]);

  // Post-Scheduling Tour: tour through each day (0..6), then return and settle on today's post
  useEffect(() => {
    if (!autoTour) return;

    setIsPlaying(true);
    setSel(0);
    studioToast.info('Taking you on a tour through your scheduled week...');

    let curStep = 0;
    const interval = setInterval(() => {
      curStep++;
      if (curStep <= 6) {
        setSel(curStep);
      } else {
        clearInterval(interval);
        tourIntervalRef.current = null;
        setIsPlaying(false);

        // Tour finished: smoothly return to current day's post!
        const todayDayIndex = (new Date().getDay() + 6) % 7;
        setTimeout(() => {
          setSel(todayDayIndex);
          studioToast.success('Tour complete! Centered on today.');
          onTourComplete?.();
        }, 800);
      }
    }, 1500);

    tourIntervalRef.current = interval;

    return () => {
      clearInterval(interval);
      tourIntervalRef.current = null;
    };
  }, [autoTour, onTourComplete]);

  // Play Timeline auto-stepper
  const togglePlayTimeline = () => {
    if (isPlaying) {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
      if (tourIntervalRef.current) clearInterval(tourIntervalRef.current);
      tourIntervalRef.current = null;
      setIsPlaying(false);
      onTourComplete?.();
      return;
    }

    setIsPlaying(true);
    setSel(0);

    let curStep = 0;
    playIntervalRef.current = setInterval(() => {
      curStep++;
      if (curStep <= 6) {
        setSel(curStep);
      } else {
        if (playIntervalRef.current) clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
        setIsPlaying(false);
      }
    }, 1500);
  };

  const handleDaySelect = (i: number) => {
    if (isPlaying) {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
      if (tourIntervalRef.current) clearInterval(tourIntervalRef.current);
      tourIntervalRef.current = null;
      setIsPlaying(false);
      onTourComplete?.();
    }
    setSel(i);
  };

  // Stage pointer ambient radial glow
  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  // Selected day data
  const selDate = weekDays[sel] || new Date();
  const selDateKey = format(selDate, 'yyyy-MM-dd');
  const selDayPosts = useMemo(() => postsByDay.get(selDateKey) || [], [postsByDay, selDateKey]);
  const activePostIndex = selectedPostIndexByDay[sel] ?? 0;
  const selPost = selDayPosts[activePostIndex] || selDayPosts[0] || null;
  const isSelScheduled = !!selPost;
  const isSelPublished = !!selPost && (selPost.status === 'published' || selPost.platforms?.some(p => p.status === 'published'));
  const isSelFailed = !!selPost && (selPost.status === 'failed' || selPost.platforms?.some(p => p.status === 'failed' || !!p.error));
  const isSelGrounded = !isSelPublished && !isSelFailed && isHoldActive;
  const isSelDraft = !!selPost && (selPost.status === 'draft' || (!selPost.scheduledAt && !isSelPublished));
  const selColor = COL[sel] || '#C0607A';
  const selBeat = BEATS[sel] || 'Hook';
  const selSub = SUBS[sel] || 'The disruption';

  const formattedPlatforms = useMemo(() => {
    if (!selPost?.platforms?.length) return 'your channels';
    const names = selPost.platforms.map(p => PLATFORM_META[p.platform]?.name || p.platform);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  }, [selPost]);

  const scheduledTimeFormatted = useMemo(() => {
    if (!selPost?.scheduledAt) return '18:00';
    try {
      const d = new Date(selPost.scheduledAt);
      const h = d.getHours();
      const m = d.getMinutes();
      return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
    } catch {
      return '18:00';
    }
  }, [selPost]);

  const liveVariants = useMemo(() => {
    if (!selPost) return [];
    const published = (selPost.platforms || []).filter(p => p.status === 'published' || isSelPublished);
    return published.length > 0 ? published : (selPost.platforms || []);
  }, [selPost, isSelPublished]);

  const ticketId = useMemo(() => {
    const d = selDate;
    const timeStr = selPost?.scheduledAt
      ? format(new Date(selPost.scheduledAt), 'HHmm')
      : '1800';
    return isSelScheduled
      ? `FP-${two(d.getMonth() + 1)}${two(d.getDate())}-D${sel + 1}-${timeStr}`
      : 'FP-OPEN-SKY';
  }, [selDate, sel, selPost, isSelScheduled]);


  const handleUnschedulePost = async () => {
    if (!selPost) return;
    if (isSelPublished) {
      studioToast.error('Cannot delete a post that has already been published.');
      return;
    }
    const confirmed = window.confirm('Delete this scheduled flight plan post?');
    if (!confirmed) return;

    try {
      const ok = await cancelPost(selPost.postId);
      if (ok) {
        studioToast.success('Post removed from flight plan.');
        loadWeekCanvas();
      }
    } catch {
      studioToast.error('Failed to cancel post.');
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Navigation Row (#nav) ─── */}
      <div className="fp-row" id="nav">
        <button
          className="fp-btn"
          onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
          disabled={weekOffset <= 0}
          aria-label="Previous week"
        >
          ‹
        </button>
        <b style={{ minWidth: 160, textAlign: 'center', fontFamily: '"Fraunces", Georgia, serif', fontSize: 16 }}>
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </b>
        <button
          className="fp-btn"
          onClick={() => setWeekOffset(w => Math.min(1, w + 1))}
          disabled={weekOffset >= 1}
          aria-label="Next week"
        >
          ›
        </button>
        <button
          className="fp-btn"
          onClick={() => {
            setWeekOffset(0);
            setSel((new Date().getDay() + 6) % 7);
          }}
        >
          This week
        </button>
        <span className="sp" />
        <span className="fp-stat">
          <b>{scheduledCount}</b> scheduled, <b>{publishedCount}</b> landed, <b>{uniquePlatformsCount}</b> platform
          {uniquePlatformsCount === 1 ? '' : 's'}
        </span>
      </div>

      {/* ─── Week Calendar Strip (.cal) ─── */}
      {posts.length > 0 && (
        <section className="fp-cal" aria-label="Week calendar">
          <div className="fp-cin">
            <div className="fp-dhs">
              {DN.map((name, i) => {
                const dayDate = weekDays[i];
                const isDayToday = isToday(dayDate);
                const isDaySel = i === sel;
                return (
                  <button
                    key={name}
                    className={`fp-dh ${isDaySel ? 'sel' : ''} ${isDayToday ? 'td' : ''}`}
                    onClick={() => handleDaySelect(i)}
                  >
                    {name.toUpperCase()}
                  </button>
                );
              })}
            </div>

            <div className="fp-cg">
              {DN.map((name, i) => {
                const dayDate = weekDays[i];
                const dayKey = format(dayDate, 'yyyy-MM-dd');
                const dayPosts = postsByDay.get(dayKey) || [];
                const isDayToday = isToday(dayDate);
                const isDaySel = i === sel;
                const pColor = COL[i] || '#C0607A';

                return (
                  <div
                    key={name}
                    className={`fp-ce ${isDaySel ? 'sel' : ''}`}
                    onClick={() => {
                      handleDaySelect(i);
                      if (dayPosts[0]) {
                        setSelectedPost(dayPosts[0]);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${name} ${dayDate.getDate()}`}
                  >
                    <div className="fp-ce-top">
                      <span className="fp-dn">
                        {dayDate.getDate()} {MN[dayDate.getMonth()]}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {dayPosts.length > 1 && (
                          <span className="fp-post-count-badge">
                            {dayPosts.length} posts
                          </span>
                        )}
                        {isDayToday && <span className="fp-today-badge">Today</span>}
                      </div>
                    </div>

                    {dayPosts.length === 0 ? (
                      <div className="fp-empty-day">
                        <span style={{ fontSize: 11, color: 'var(--mu)' }}>Open sky</span>
                        <button
                          type="button"
                          className="fp-add-post-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDaySelect(i);
                            setNewPostModalDate(dayDate);
                            setIsNewPostModalOpen(true);
                          }}
                        >
                          + Schedule
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="fp-day-posts-list">
                          {dayPosts.map((post, postIdx) => {
                            const isPostPublished = post.status === 'published' || post.platforms.some(p => p.status === 'published');
                            const isPostFailed = post.status === 'failed' || post.platforms.some(p => p.status === 'failed' || !!p.error);
                            const isPostGrounded = !isPostPublished && !isPostFailed && isHoldActive;
                            const statusLabel = isPostPublished
                              ? 'Landed'
                              : isPostFailed
                              ? 'Diverted'
                              : isPostGrounded
                              ? 'Grounded'
                              : post.status === 'scheduled'
                              ? 'Scheduled'
                              : 'Draft';

                            return (
                              <div
                                key={post.postId || postIdx}
                                className="fp-day-post-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDaySelect(i);
                                  setSelectedPostIndexByDay(prev => ({ ...prev, [i]: postIdx }));
                                  setSelectedPost(post);
                                }}
                                title="Click to view & edit post"
                              >
                                <span className="fp-cp s" style={{ ['--c' as any]: pColor }}>
                                  <i />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {post.arcBeat || (dayPosts.length > 1 ? `${BEATS[i]} #${postIdx + 1}` : BEATS[i])}
                                  </span>
                                </span>
                                <span className="fp-ct">
                                  {format(new Date(post.scheduledAt || dayDate), 'h:mm a')} ·{' '}
                                  {PLATFORM_META[post.platforms[0]?.platform]?.name || 'Social'}
                                </span>
                                <span className="fp-ct">
                                  {statusLabel}
                                  {post.platforms[0]?.mediaUrls?.length
                                    ? ` · ${post.platforms[0].mediaUrls.length} media`
                                    : ' · text only'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          className="fp-add-post-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDaySelect(i);
                            setNewPostModalDate(dayDate);
                            setIsNewPostModalOpen(true);
                          }}
                          title="Schedule another post for this day"
                        >
                          + Add post
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Starfield Flight Stage (.stage) ─── */}
      <section className="fp-stage" ref={stageRef} onPointerMove={handleStagePointerMove}>
        <div className="fp-sh">
          <div>
            <h2>The story arc, in flight</h2>
            <p>Height is story tension. Click a day, or press play to watch the week unfold.</p>
          </div>

          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="fp-btn"
              onClick={togglePlayTimeline}
              style={{
                background: 'rgba(246, 233, 226, 0.08)',
                color: 'var(--star)',
                borderColor: 'rgba(246, 233, 226, 0.2)',
              }}
            >
              {isPlaying ? '■ Stop' : '▶ Play timeline'}
            </button>
            <div className="fp-tc">
              <small>Master air timecode</small>
              <b>
                00:0{sel + 1}:00 <span>/ 00:07:00</span>
              </b>
            </div>
          </div>
        </div>

        {/* SVG Flight Map */}
        <div className="fp-mapw">
          <svg id="fp-map" ref={mapSvgRef} viewBox="0 0 1000 180" role="group" aria-label="Seven day flight path">
            <defs>
              <linearGradient id="fp-g" x1="0" x2="1">
                <stop offset="0" style={{ stopColor: 'var(--p1)' }} />
                <stop offset="0.5" style={{ stopColor: 'var(--p2)' }} />
                <stop offset="1" style={{ stopColor: 'var(--p3)' }} />
              </linearGradient>
            </defs>

            {/* Starfield */}
            {STARS.map((s, idx) => (
              <circle
                key={idx}
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                fill="#F6EDE6"
                opacity={s.opacity}
              />
            ))}

            {/* Peak of the week annotation */}
            <text
              x={peakIdx >= 5 ? points[peakIdx][0] - 30 : points[peakIdx][0] + 30}
              y={points[peakIdx][1] + 6}
              textAnchor={peakIdx >= 5 ? 'end' : 'start'}
              className="fp-hw"
              transform={`rotate(-5 ${points[peakIdx][0]} ${points[peakIdx][1]})`}
            >
              {peakIdx >= 5 ? 'peak of the week →' : '← peak of the week'}
            </text>

            {/* Tension Labels */}
            <text x="10" y="30" className="fp-dy">
              Climax
            </text>
            <text x="10" y="152" className="fp-dy">
              Calm
            </text>

            {/* Spline paths */}
            <path id="fp-pa" ref={paPathRef} className="fp-pa" d={splineD} />
            <path id="fp-pp" ref={ppPathRef} className="fp-pp" d={splineD} />

            {/* Day nodes */}
            {BEATS.map((beat, i) => {
              const [x, y] = points[i];
              const c = COL[i];
              const isTodayDay = isToday(weekDays[i]);
              const isSelected = i === sel;
              const hasPost = !!postsByDay.get(format(weekDays[i], 'yyyy-MM-dd'))?.[0];
              const nodeLabel = hasPost ? '✓' : `${i + 1}`;

              return (
                <g
                  key={beat}
                  className={`fp-nd ${isSelected ? 'sel' : ''} ${isTodayDay ? 'today' : ''}`}
                  onClick={() => handleDaySelect(i)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${beat}, ${format(weekDays[i], 'EEE d')}`}
                >
                  <line
                    x1={x}
                    y1={y + 14}
                    x2={x}
                    y2={150}
                    stroke={c}
                    strokeOpacity={0.25}
                    strokeDasharray="3 5"
                  />
                  <text x={x} y="166" textAnchor="middle" className="fp-dy">
                    00:0{i + 1}:00
                  </text>
                  {isTodayDay && <circle className="pl" cx={x} cy={y} r={16} stroke={c} />}
                  <circle className="ring" cx={x} cy={y} r={26} stroke={c} />
                  <circle
                    className="core"
                    cx={x}
                    cy={y}
                    r={15}
                    fill={hasPost ? c : '#24070F'}
                    stroke={c}
                  />
                  <text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight={800}
                    fill={hasPost ? '#24070F' : '#F6EDE6'}
                  >
                    {nodeLabel}
                  </text>
                  <text x={x} y={y - 36} textAnchor="middle" className="fp-dy">
                    {format(weekDays[i], 'EEE d')}
                  </text>
                  <text x={x} y={y - 20} textAnchor="middle" className="fp-nm" fill={c}>
                    {beat}
                  </text>
                </g>
              );
            })}

            {/* Airplane marker */}
            <g id="fp-mk" ref={mkGroupRef}>
              <polygon
                points="16,0 -11,-9 -5,0 -11,9"
                fill="#FFF6DE"
                strokeWidth={2}
                style={{
                  stroke: 'var(--glow)',
                  filter: 'drop-shadow(0 0 9px var(--glow))',
                }}
              />
            </g>
          </svg>

          {/* Empty state overlay */}
          {posts.length === 0 && (
            <div className="fp-empty">
              <p>Nothing in flight this week. Give us one story and we’ll plot all seven days.</p>
              <button className="fp-btn gold" onClick={onNewArc}>
                + Plan new week
              </button>
            </div>
          )}
        </div>

        {/* Sub-beat Reel */}
        <div className="fp-reel">
          {BEATS.map((beat, i) => {
            const hasPost = (postsByDay.get(format(weekDays[i], 'yyyy-MM-dd'))?.length ?? 0) > 0;
            const isSelected = i === sel;
            return (
              <button
                key={beat}
                className={`fp-rb ${isSelected ? 'sel' : ''}`}
                onClick={() => handleDaySelect(i)}
                style={{
                  ['--c' as any]: COL[i],
                  ['--w' as any]: hasPost ? '100%' : '0%',
                }}
              >
                {beat}
                <small>{SUBS[i]}</small>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Boarding Pass Ticket (#ck / .tkt) ─── */}
      <div id="ck">
        {/* Multiple Dispatches Switcher for this Day */}
        {isSelScheduled && selDayPosts.length > 1 && (
          <div className="fp-dispatches-bar">
            <span className="fp-dispatches-title">Dispatches ({selDayPosts.length}):</span>
            {selDayPosts.map((p, idx) => {
              const isPActive = (selPost?.postId === p.postId);
              const pTime = p.scheduledAt ? format(new Date(p.scheduledAt), 'h:mm a') : '';
              const isPPublished = p.status === 'published' || p.platforms?.some(v => v.status === 'published');
              return (
                <button
                  key={p.postId || idx}
                  type="button"
                  className={`fp-dispatch-tab ${isPActive ? 'active' : ''}`}
                  onClick={() => setSelectedPostIndexByDay(prev => ({ ...prev, [sel]: idx }))}
                >
                  Flight {idx + 1}: {pTime} ({isPPublished ? 'Landed' : 'Scheduled'})
                </button>
              );
            })}
          </div>
        )}

        {!isSelScheduled ? (
          <div className="fp-tkt has-header-band" style={{ ['--c' as any]: selColor }}>
            <div className="fp-tkt-header-band">
              <div className="fp-tkt-brand">
                <span className="fp-airline-logo">✈ UNOOL AIRWAYS</span>
                <span className="fp-flight-type">FLIGHT LOG // OPEN SKY</span>
              </div>
              <div className="fp-flight-meta-pills">
                <span className="fp-meta-pill">SECTOR: <b>0{sel + 1}/07</b></span>
                <span className="fp-meta-pill">GATE: <b>G0{sel + 1}</b></span>
                <span className="fp-meta-pill stub-pill">DISPATCH STUB</span>
              </div>
            </div>
            <div className="main">
              <div className="fp-air">
                <span>
                  <i>✈</i> FLIGHT LOG // SECTOR 0{sel + 1} — OPEN SKY
                </span>
                <span>{format(selDate, 'EEEE d MMMM')}</span>
              </div>
              <h3 className="fp-big">Nothing planned for this day</h3>
              <p className="fp-sub">
                Give us one story. We write a post for every day of the week, pick the best times, and let you review it all
                before anything goes out.
              </p>
            </div>
            <div className="stub">
              <div className="fp-stub-header">
                <span>PASSENGER STUB</span>
                <span>LEG 0{sel + 1}</span>
              </div>
              <div className="fp-fld">
                <span>NEXT DISPATCH ACTION</span>
                <b>Schedule or plan</b>
                <em>Plan a new week or schedule a single dispatch.</em>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="fp-btn gold"
                  onClick={() => {
                    setNewPostModalDate(selDate);
                    setIsNewPostModalOpen(true);
                  }}
                >
                  + Schedule post for this day
                </button>
                <button className="fp-btn" onClick={onNewArc}>
                  + Plan new week
                </button>
              </div>
              <BarcodeTicket code="FP-OPEN-SKY" note="No post yet" />
            </div>
          </div>
        ) : (
          <div className="fp-tkt has-header-band" style={{ ['--c' as any]: selColor }}>
            <div className="fp-tkt-header-band">
              <div className="fp-tkt-brand">
                <span className="fp-airline-logo">✈ UNOOL AIRWAYS</span>
                <span className="fp-flight-type">{isSelPublished ? 'FLIGHT LOG // LANDED' : 'BOARDING PASS // FLIGHT READY'}</span>
              </div>
              <div className="fp-flight-meta-pills">
                <span className="fp-meta-pill">FLIGHT: <b>FP-0{sel + 1}</b></span>
                <span className="fp-meta-pill">GATE: <b>G0{sel + 1}</b></span>
                <span className="fp-meta-pill">SEAT: <b>0{sel + 1}A</b></span>
                <span className="fp-meta-pill stub-pill">{isSelPublished ? 'RECEIPT' : 'COUPON'}</span>
              </div>
            </div>
            {/* Stamp: Touched down / Diverted / Grounded / Awaiting clearance / Cleared for take-off */}
            {isSelPublished ? (
              <div className="fp-stamp touched-down">✓ Touched down</div>
            ) : isSelFailed ? (
              <div className="fp-stamp diverted">Diverted</div>
            ) : isSelGrounded ? (
              <div className="fp-stamp grounded">Grounded</div>
            ) : isSelDraft ? (
              <div className="fp-stamp on-the-ground">Awaiting clearance</div>
            ) : (
              <div className="fp-stamp">Cleared for take-off</div>
            )}

            <div className="main">
              <div className="fp-air">
                <span>
                  <i>✈</i> {isSelPublished ? `FLIGHT LOG // SECTOR 0${sel + 1}` : `BOARDING PASS // FLIGHT LEG 0${sel + 1}`}
                </span>
                <span>{format(selDate, 'EEEE d MMMM')}</span>
              </div>
              <h3 className="fp-big" style={{ color: selColor }}>
                {selBeat}
              </h3>
              <p className="fp-sub" style={{ marginTop: 2 }}>
                {selSub}
              </p>
              <p className="fp-line">
                {isSelPublished ? (
                  <>
                    This post touched down on <b>{format(selDate, 'EEEE d MMMM')} at {scheduledTimeFormatted}</b> on{' '}
                    {formattedPlatforms}.
                  </>
                ) : isSelGrounded ? (
                  <>
                    This post is grounded on <b>{format(selDate, 'EEEE d MMMM')} at {scheduledTimeFormatted}</b> while queue hold is on.
                  </>
                ) : isSelFailed ? (
                  <>
                    This post was diverted on <b>{format(selDate, 'EEEE d MMMM')} at {scheduledTimeFormatted}</b> on{' '}
                    {formattedPlatforms}.
                  </>
                ) : (
                  <>
                    This post goes live on <b>{format(selDate, 'EEEE d MMMM')} at {scheduledTimeFormatted}</b> on{' '}
                    {formattedPlatforms}.
                  </>
                )}
              </p>

              <div className="fp-lb" style={{ marginTop: 14 }}>
                <span>DISPATCH MANIFEST // AUDIENCE VIEW</span>
                <span>{selPost.content.length} characters</span>
              </div>

              <div className="fp-pv">
                <i />
                <div>
                  <b>unool</b>
                  <p>
                    {selPost.content.length > 200 && !isContentExpanded
                      ? `${selPost.content.slice(0, 190).trim()}…`
                      : selPost.content}
                  </p>
                  {selPost.content.length > 200 && (
                    <button
                      type="button"
                      className="fp-view-more-btn"
                      onClick={() => setIsContentExpanded(prev => !prev)}
                    >
                      {isContentExpanded ? 'View less -' : 'View more +'}
                    </button>
                  )}
                  <small>
                    {format(selDate, 'EEE d')} at {scheduledTimeFormatted}
                  </small>
                </div>
              </div>
            </div>

            <div className="stub">
              <div className="fp-stub-header">
                <span>BOARDING PASS // STUB</span>
                <span className="fp-stub-badge">FLIGHT FP-0{sel + 1}</span>
              </div>
              <div className="fp-fld">
                <span>
                  {isSelPublished
                    ? 'TOUCHDOWN TIME'
                    : isSelGrounded
                    ? 'GROUNDED AT'
                    : isSelFailed
                    ? 'DIVERTED AT'
                    : 'SCHEDULED DEPARTURE'}
                </span>
                <b>{scheduledTimeFormatted}</b>
                <em>
                  {format(selDate, 'EEE d MMM')}.{' '}
                  {isSelPublished
                    ? 'Live on your channels.'
                    : isSelGrounded
                    ? 'Grounded, queue on hold.'
                    : isSelFailed
                    ? 'Publishing diverted. Needs attention.'
                    : 'Optimal time for audience takeoff.'}
                </em>
              </div>
              <div className="fp-fld">
                <span>FLIGHT STATUS</span>
                {isSelPublished ? (
                  <span className="fp-chip landed">Landed, live</span>
                ) : isSelGrounded ? (
                  <span className="fp-chip grounded">Grounded, queue on hold</span>
                ) : isSelFailed ? (
                  <span className="fp-chip diverted">Diverted, needs attention</span>
                ) : isSelDraft ? (
                  <span className="fp-chip awaiting">Awaiting clearance</span>
                ) : (
                  <span className="fp-chip ok">Cleared for take-off</span>
                )}
              </div>
              <div className="fp-fld">
                <span>CARGO / VISUAL MEDIA</span>
                <b>
                  {selPost.platforms[0]?.mediaUrls?.length
                    ? `${selPost.platforms[0].mediaUrls.length} media attached`
                    : 'None attached'}
                </b>
                <em>
                  {selPost.platforms[0]?.mediaUrls?.length
                    ? 'Manifest payload verified.'
                    : 'Visual cargo recommended for reach.'}
                </em>
              </div>
              <div className="fp-fld">
                <span>AUTO FIRST COMMENT</span>
                <b>{selPost.platforms[0]?.autoFirstComment ? 'Active (CTA Link)' : 'Standby / None'}</b>
                <em>
                  {selPost.platforms[0]?.autoFirstComment
                    ? 'Pinned CTA link dispatched 90s after touchdown.'
                    : 'Direct link omitted to preserve reach.'}
                </em>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {isSelPublished ? (
                  <>
                    <button
                      type="button"
                      className="fp-btn"
                      onClick={() => {
                        const targetUrl = liveVariants[0]
                          ? getLivePlatformUrl(liveVariants[0])
                          : 'https://unool.co/dashboard';
                        window.open(targetUrl, '_blank', 'noopener,noreferrer');
                      }}
                      title="Open post directly on the platform"
                    >
                      See it live ↗
                    </button>
                    {liveVariants.length > 1 && (
                      <div className="fp-live-links-wrap">
                        {liveVariants.map((lp) => {
                          const meta = PLATFORM_META[lp.platform];
                          const url = getLivePlatformUrl(lp);
                          return (
                            <a
                              key={lp.variantId || lp.platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="fp-platform-live-btn"
                              title={`Open live post on ${meta?.name || lp.platform}`}
                            >
                              <span>{meta?.name || lp.platform}</span>
                              <span style={{ fontSize: 10, opacity: 0.7 }}>↗</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      className="fp-btn"
                      onClick={() => setSelectedPost(selPost)}
                    >
                      Edit this dispatch
                    </button>
                    <button
                      className="fp-btn"
                      onClick={handleUnschedulePost}
                    >
                      Delete post
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="fp-btn gold"
                  onClick={() => {
                    setNewPostModalDate(selDate);
                    setIsNewPostModalOpen(true);
                  }}
                  title={isToday(selDate) ? 'Schedule another dispatch for today' : 'Schedule another dispatch for this day'}
                >
                  + Schedule another post
                </button>
              </div>

              <BarcodeTicket
                code={ticketId}
                note={isSelPublished ? 'Landed ticket' : isSelGrounded ? 'Grounded ticket' : 'Scheduled ticket'}
              />
            </div>
          </div>
        )}
      </div>

      {/* Scheduled Post Inspection / Edit Modal (Preserved feature) */}
      {selectedPost && (
        <ScheduledPostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => {
            setSelectedPost(null);
            if (typeof window !== 'undefined' && window.location.search.includes('postId=')) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
          onUpdated={() => {
            loadWeekCanvas();
            setSelectedPost(null);
            if (typeof window !== 'undefined' && window.location.search.includes('postId=')) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
          onCancelled={() => {
            loadWeekCanvas();
            setSelectedPost(null);
            if (typeof window !== 'undefined' && window.location.search.includes('postId=')) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
          onScheduleAnother={(d) => {
            setNewPostModalDate(d);
            setIsNewPostModalOpen(true);
          }}
        />
      )}

      {/* Schedule New Post Modal for Day/Week */}
      {isNewPostModalOpen && (
        <ScheduleNewPostModal
          isOpen={isNewPostModalOpen}
          targetDate={newPostModalDate}
          connectedPlatforms={connectedPlatforms}
          onClose={() => setIsNewPostModalOpen(false)}
          onScheduled={() => {
            loadWeekCanvas();
            setIsNewPostModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default WeekCanvas;