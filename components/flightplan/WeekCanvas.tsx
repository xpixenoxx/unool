'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { ScheduledPostModal } from './ScheduledPostModal';
import { BarcodeTicket } from './ui/BarcodeTicket';
import { useFlightPlanActions } from '@/hooks/flightplan';
import { studioToast } from '@/components/dashboard/StudioToast';
import type { CanvasPost } from '@/types/flightplan';
import { B, COL, BEAT_COLORS, PLATFORM_META } from './design-tokens';

interface WeekCanvasProps {
  workspaceId: string;
  targetPostId?: string | null;
  onNewArc: () => void;
  onPostCountChange?: (count: number) => void;
}

const BEATS = ['Hook', 'Context', 'Challenge', 'Proof', 'CTA', 'Community', 'Horizon'];
const SUBS = [
  'The disruption',
  'The backstory',
  'The breakthrough',
  'Evidence and data',
  'The direct call',
  'Weekend dialogue',
  'The next chapter',
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
}: WeekCanvasProps) {
  const [posts, setPosts] = useState<CanvasPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [sel, setSel] = useState<number>(() => {
    const day = (new Date().getDay() + 6) % 7;
    return day;
  });
  const [selectedPost, setSelectedPost] = useState<CanvasPost | null>(null);
  const [hasOpenedTargetPost, setHasOpenedTargetPost] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const { loadCanvas, holdQueue, cancelPost } = useFlightPlanActions();

  // SVG Flight Map animation refs
  const mapSvgRef = useRef<SVGSVGElement | null>(null);
  const paPathRef = useRef<SVGPathElement | null>(null);
  const ppPathRef = useRef<SVGPathElement | null>(null);
  const mkGroupRef = useRef<SVGGElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
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

  // Target post auto-open
  useEffect(() => {
    if (!targetPostId || hasOpenedTargetPost) return;
    const existing = posts.find(p => p.postId === targetPostId);
    if (existing) {
      setSelectedPost(existing);
      setHasOpenedTargetPost(true);
    }
  }, [targetPostId, posts, hasOpenedTargetPost]);

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

  // Catmull points & curve
  const points = useMemo(() => {
    return BEATS.map((_, i) => [80 + i * 140, 330 - TEN[i] * 2.6]);
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
    const r = pa.getPointAtLength(Math.min(targetLength + 3, totalLength));
    const o = pa.getPointAtLength(Math.max(targetLength - 3, 0));
    const angle = (Math.atan2(r.y - o.y, r.x - o.x) * 180) / Math.PI;

    mk.setAttribute('transform', `translate(${q.x},${q.y}) rotate(${angle})`);

    if (pp) {
      pp.style.strokeDasharray = `${totalLength}`;
      pp.style.strokeDashoffset = `${totalLength - targetLength}`;
    }
  }, []);

  // Fly animation to day index
  const flyToDay = useCallback((targetIndex: number) => {
    const pa = paPathRef.current;
    if (!pa) return;
    const total = pa.getTotalLength();
    const targetRatio = targetIndex / 6;
    const targetLength = total * targetRatio;

    placeAirplane(targetLength, total);
  }, [placeAirplane]);

  useEffect(() => {
    flyToDay(sel);
  }, [sel, flyToDay]);

  // Play Timeline auto-stepper
  const togglePlayTimeline = () => {
    if (isPlaying) {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
      setIsPlaying(false);
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
      setIsPlaying(false);
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
  const selPost = postsByDay.get(selDateKey)?.[0] || null;
  const isSelScheduled = !!selPost;
  const selColor = COL[sel] || '#C0607A';
  const selBeat = BEATS[sel] || 'Hook';
  const selSub = SUBS[sel] || 'The disruption';

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

  const ticketId = useMemo(() => {
    const d = selDate;
    const timeStr = selPost?.scheduledAt
      ? format(new Date(selPost.scheduledAt), 'HHmm')
      : '1800';
    return isSelScheduled
      ? `FP-${two(d.getMonth() + 1)}${two(d.getDate())}-D${sel + 1}-${timeStr}`
      : 'FP-OPEN-SKY';
  }, [selDate, sel, selPost, isSelScheduled]);

  // Current real-time line position percentage (0–100%)
  const nowPercent = useMemo(() => {
    const n = new Date();
    return (((n.getHours() * 60 + n.getMinutes()) / 1440) * 100).toFixed(1);
  }, []);

  const handleUnschedulePost = async () => {
    if (!selPost) return;
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
          <b>{scheduledCount}</b> scheduled, <b>{publishedCount}</b> published, <b>{uniquePlatformsCount}</b> platform
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
                const dayPost = postsByDay.get(dayKey)?.[0];
                const isDayToday = isToday(dayDate);
                const isDaySel = i === sel;
                const pColor = COL[i] || '#C0607A';

                return (
                  <div
                    key={name}
                    className={`fp-ce ${isDaySel ? 'sel' : ''}`}
                    onClick={() => handleDaySelect(i)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${name} ${dayDate.getDate()}`}
                  >
                    <span className="fp-dn">
                      {dayDate.getDate()} {MN[dayDate.getMonth()]}
                    </span>

                    {dayPost && (
                      <>
                        <span className="fp-cp s" style={{ ['--c' as any]: pColor }}>
                          <i />
                          {dayPost.scheduleStrategy || BEATS[i]}
                        </span>
                        <span className="fp-ct">
                          {format(new Date(dayPost.scheduledAt || dayDate), 'h:mm a')} ·{' '}
                          {PLATFORM_META[dayPost.platforms[0]?.platform]?.name || 'Social'}
                        </span>
                        <span className="fp-ct">
                          {dayPost.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                          {dayPost.platforms[0]?.mediaUrls?.length
                            ? ` · ${dayPost.platforms[0].mediaUrls.length} media`
                            : ' · text only'}
                        </span>
                      </>
                    )}

                    {isDayToday && (
                      <div className="fp-now" style={{ ['--t' as any]: `${nowPercent}%` }}>
                        <b>now</b>
                      </div>
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
          <svg id="fp-map" ref={mapSvgRef} viewBox="0 0 1000 400" role="group" aria-label="Seven day flight path">
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
            <text x="10" y="82" className="fp-dy">
              Climax
            </text>
            <text x="10" y="338" className="fp-dy">
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
                    y1={y + 16}
                    x2={x}
                    y2={352}
                    stroke={c}
                    strokeOpacity={0.25}
                    strokeDasharray="3 5"
                  />
                  <text x={x} y="372" textAnchor="middle" className="fp-dy">
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
                  <text x={x} y={y - 48} textAnchor="middle" className="fp-dy">
                    {format(weekDays[i], 'EEE d')}
                  </text>
                  <text x={x} y={y - 31} textAnchor="middle" className="fp-nm" fill={c}>
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
            const hasPost = !!postsByDay.get(format(weekDays[i], 'yyyy-MM-dd'))?.[0];
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
        {!isSelScheduled ? (
          <div className="fp-tkt" style={{ ['--c' as any]: selColor }}>
            <div className="main">
              <div className="fp-air">
                <span>
                  <i>✈</i> Open sky
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
              <div className="fp-fld">
                <span>Next step</span>
                <b>Plan your week</b>
                <em>It takes about a minute.</em>
              </div>
              <button className="fp-btn gold" onClick={onNewArc}>
                + Plan new week
              </button>
              <BarcodeTicket code="FP-OPEN-SKY" note="No post yet" />
            </div>
          </div>
        ) : (
          <div className="fp-tkt" style={{ ['--c' as any]: selColor }}>
            <div className="fp-stamp">Cleared for take-off</div>
            <div className="main">
              <div className="fp-air">
                <span>
                  <i>✈</i> Boarding pass, day {sel + 1} of 7
                </span>
                <span>{format(selDate, 'EEEE d MMMM')}</span>
              </div>
              <h3 className="fp-big" style={{ color: selColor }}>
                {selPost.scheduleStrategy || selBeat}
              </h3>
              <p className="fp-sub" style={{ marginTop: 2 }}>
                {selSub}
              </p>
              <p className="fp-line">
                This post goes live on <b>{format(selDate, 'EEEE d MMMM')} at {scheduledTimeFormatted}</b> on{' '}
                {selPost.platforms.map(p => PLATFORM_META[p.platform]?.name || p.platform).join(', ')}.
              </p>

              <div className="fp-lb" style={{ marginTop: 14 }}>
                <span>What your followers will read</span>
                <span>{selPost.content.length} characters</span>
              </div>

              <div className="fp-pv">
                <i />
                <div>
                  <b>unool</b>
                  <p>{selPost.content}</p>
                  <small>
                    {format(selDate, 'EEE d')} at {scheduledTimeFormatted}
                  </small>
                </div>
              </div>
            </div>

            <div className="stub">
              <div className="fp-fld">
                <span>Goes live</span>
                <b>{scheduledTimeFormatted}</b>
                <em>
                  {format(selDate, 'EEE d MMM')}. Time picked for your audience.
                </em>
              </div>
              <div className="fp-fld">
                <span>Status</span>
                <span className="fp-chip ok">Scheduled</span>
              </div>
              <div className="fp-fld">
                <span>Photos or video</span>
                <b>
                  {selPost.platforms[0]?.mediaUrls?.length
                    ? `${selPost.platforms[0].mediaUrls.length} added`
                    : 'None yet'}
                </b>
                <em>
                  {selPost.platforms[0]?.mediaUrls?.length
                    ? 'Ready for publishing.'
                    : 'At least one media item recommended.'}
                </em>
              </div>
              <div className="fp-fld">
                <span>Auto first comment</span>
                <b>{selPost.platforms[0]?.autoFirstComment ? 'On' : 'Off'}</b>
                <em>
                  {selPost.platforms[0]?.autoFirstComment
                    ? 'Adds conversation link in first comment.'
                    : 'Nothing is added under your post.'}
                </em>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="fp-btn"
                  onClick={() => setSelectedPost(selPost)}
                >
                  Edit this day
                </button>
                <button
                  className="fp-btn"
                  onClick={handleUnschedulePost}
                >
                  Delete post
                </button>
              </div>

              <BarcodeTicket code={ticketId} note="Scheduled ticket" />
            </div>
          </div>
        )}
      </div>

      {/* Scheduled Post Inspection / Edit Modal (Preserved feature) */}
      {selectedPost && (
        <ScheduledPostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdated={loadWeekCanvas}
          onCancelled={() => {
            setSelectedPost(null);
            loadWeekCanvas();
          }}
        />
      )}
    </div>
  );
}

export default WeekCanvas;