'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Zap, Target, TrendingUp, BarChart2, Clock, Calendar,
  Flame, RefreshCw, Compass, Activity, Eye, Share2,
  MessageCircle, Heart, BarChart3, Layers,
  HelpCircle, BookOpen, Type, FileText, ArrowRight, ChevronRight,
} from 'lucide-react';
import { getPlatformConfig } from '@/components/dashboard/PlatformLogos';

/* ── Types ─────────────────────────────────────────────────────────────────── */
type HookItem = {
  type: string;
  count: number;
  totalInteractions?: number;
  avgInteractions?: number;
  avgComments?: number;
  avgLikes?: number;
  avgShares?: number;
  performanceIndex?: number;
  samples?: string[];
  topPostSnippet?: string;
  hasRealData?: boolean;
};

type ResonanceData = {
  hasData: boolean;
  hasRealEngagement?: boolean;
  totalPosts: number;
  totalInteractions?: number;
  avgInteractionsPerPost?: number;
  totalViews?: number;
  topHook?: string;
  hookBreakdown: HookItem[];
  bestDay: { day: number; name: string; count: number; interactions?: number } | null;
  bestHour: { hour: number; label: string; count: number; interactions?: number } | null;
  dayDistribution?: number[];
  dayEngagement?: number[];
  hourDistribution?: number[];
  hourEngagement?: number[];
  avgWordCount?: number;
  mediaRatio?: number;
  mediaLift?: number;
  resonanceScore?: number;
  recommendations?: Array<{ id: string; title: string; desc: string; type: 'hook' | 'timing' | 'format' | 'growth' }>;
  recentPatternRows?: Array<{
    id?: string;
    contentSnippet?: string;
    hookType: string;
    wordCount: number;
    dayOfWeek: number;
    hourOfDay: number;
    hasMedia: boolean;
    publishedCount: number;
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    interactions?: number;
    hasRealData?: boolean;
  }>;
};

type PostVariant = {
  id: string;
  platform: string;
  status: string;
  engagement?: { likes: number; comments: number; shares: number; views: number; totalInteractions: number; hasRealData: boolean };
};

type SignalPost = {
  id: string;
  content: string;
  hookType: string | null;
  wordCount: number | null;
  hasMedia: boolean;
  createdAt: string;
  variants: PostVariant[];
  engagement?: { likes: number; comments: number; shares: number; views: number; total: number; hasRealData: boolean };
};

/* ── Hook metadata ─────────────────────────────────────────────────────────── */
const HOOK_META: Record<string, { label: string; color: string; accent: string; icon: React.ReactNode }> = {
  statement:  { label: 'Bold Statement',   color: '#B48C48', accent: 'rgba(180,140,72,0.12)',  icon: <Type className="w-3 h-3" /> },
  question:   { label: 'Curiosity Q',      color: '#3B82F6', accent: 'rgba(59,130,246,0.12)',  icon: <HelpCircle className="w-3 h-3" /> },
  statistic:  { label: 'Data Hook',        color: '#10B981', accent: 'rgba(16,185,129,0.12)',  icon: <BarChart3 className="w-3 h-3" /> },
  story:      { label: 'Personal Story',   color: '#EC4899', accent: 'rgba(236,72,153,0.12)',  icon: <BookOpen className="w-3 h-3" /> },
  contrarian: { label: 'Contrarian',       color: '#EF4444', accent: 'rgba(239,68,68,0.10)',   icon: <Flame className="w-3 h-3" /> },
  framework:  { label: 'Framework',        color: '#8B5CF6', accent: 'rgba(139,92,246,0.12)',  icon: <Layers className="w-3 h-3" /> },
  unknown:    { label: 'Standard',         color: '#6B7280', accent: 'rgba(107,114,128,0.08)', icon: <FileText className="w-3 h-3" /> },
};

/* ── 3D Resonance Orb (Canvas) ─────────────────────────────────────────────── */
function ResonanceOrb({ score, hasReal }: { score: number; hasReal: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const t = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width = 200, H = c.height = 200;
    const cx = W / 2, cy = H / 2, R = 72;
    const rgb = score >= 80 ? '194,94,56' : score >= 50 ? '196,162,101' : '139,115,85';

    function frame() {
      t.current += 0.022;
      ctx.clearRect(0, 0, W, H);

      // Pulse rings
      for (let i = 3; i >= 1; i--) {
        const pr = R + 12 * i + 5 * Math.sin(t.current * 0.9 + i);
        const a = (0.055 - i * 0.012) * (0.5 + 0.5 * Math.sin(t.current * 1.1 + i));
        ctx.beginPath();
        ctx.arc(cx, cy, pr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb},${a})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Core gradient
      const g = ctx.createRadialGradient(cx - 18, cy - 20, 6, cx, cy, R);
      g.addColorStop(0, `rgba(${rgb},0.95)`);
      g.addColorStop(0.5, `rgba(${rgb},0.68)`);
      g.addColorStop(0.8, `rgba(${rgb},0.35)`);
      g.addColorStop(1, `rgba(${rgb},0.06)`);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      // Specular
      const sp = ctx.createRadialGradient(cx - 24, cy - 26, 0, cx - 16, cy - 16, 30);
      sp.addColorStop(0, 'rgba(255,255,255,0.52)');
      sp.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = sp;
      ctx.fill();

      // Wave fill (score level)
      const fillLevel = (score / 100) * (R * 2) - R;
      for (let x = cx - R; x <= cx + R; x += 2.5) {
        const ang = Math.acos(Math.max(-1, Math.min(1, (x - cx) / R)));
        const yBot = cy + R * Math.sin(ang);
        const yFill = cy + fillLevel + 6 * Math.sin((x - cx) * 0.07 + t.current * 2.2);
        if (yFill < yBot) {
          ctx.beginPath();
          ctx.moveTo(x, yFill);
          ctx.lineTo(x, yBot);
          ctx.strokeStyle = 'rgba(255,255,255,0.055)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      // Score text
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 34px Inter, system-ui, sans-serif';
      ctx.fillText(`${score}`, cx, cy - 5);
      ctx.font = '500 10px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.fillText('/100', cx, cy + 16);
      ctx.font = '700 8px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(hasReal ? '● LIVE' : 'BASELINE', cx, cy + 30);

      // Orbit dots
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + t.current * 0.38;
        const or = R + 16;
        const dotA = 0.28 + 0.5 * Math.sin(a + t.current);
        ctx.beginPath();
        ctx.arc(cx + or * Math.cos(a), cy + or * Math.sin(a), 2.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${dotA})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(frame);
    }

    frame();
    return () => cancelAnimationFrame(animRef.current);
  }, [score, hasReal]);

  return <canvas ref={canvasRef} style={{ width: 200, height: 200 }} />;
}

/* ── Hook Radar (SVG) ──────────────────────────────────────────────────────── */
function HookRadar({ hooks }: { hooks: HookItem[] }) {
  const KEYS = ['statement', 'question', 'statistic', 'story', 'contrarian', 'framework'];
  const W = 230, H = 230, cx = W / 2, cy = H / 2, R = 85;

  const vals = KEYS.map(k => {
    const it = hooks.find(h => h.type === k);
    const p = it?.performanceIndex ?? (it?.count ? 55 : 0);
    return Math.min(p, 200) / 200;
  });

  const pts = (r: number) => KEYS.map((_, i) => {
    const a = (i / KEYS.length) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  const dataPts = KEYS.map((_, i) => {
    const a = (i / KEYS.length) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + vals[i] * R * Math.cos(a), y: cy + vals[i] * R * Math.sin(a) };
  });

  const lblPts = pts(R + 22);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={pts(f * R).map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(61,43,31,0.07)" strokeWidth={1} />
      ))}
      {pts(R).map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(61,43,31,0.07)" strokeWidth={1} />)}
      <motion.polygon
        points={dataPts.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(196,162,101,0.2)"
        stroke="#C4A265"
        strokeWidth={2}
        strokeLinejoin="round"
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {dataPts.map((p, i) => {
        const m = HOOK_META[KEYS[i]] || HOOK_META.unknown;
        return (
          <motion.circle key={i} cx={p.x} cy={p.y} r={vals[i] > 0 ? 5 : 2.5}
            fill={vals[i] > 0 ? m.color : '#E8E0D4'} stroke="white" strokeWidth={1.5}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25 + i * 0.09, type: 'spring', stiffness: 360 }}
          />
        );
      })}
      {lblPts.map((p, i) => {
        const m = HOOK_META[KEYS[i]] || HOOK_META.unknown;
        const it = hooks.find(h => h.type === KEYS[i]);
        return (
          <g key={i}>
            <text x={p.x} y={p.y - 3} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={it?.count ? m.color : '#A69279'}>
              {m.label.toUpperCase()}
            </text>
            {it?.count ? (
              <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize={9} fill="#8B7355">{it.count}×</text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/* ── 7×24 Heatmap ──────────────────────────────────────────────────────────── */
function Heatmap({ dayDist, dayEng, hourDist, hourEng, hasReal }: {
  dayDist: number[]; dayEng: number[];
  hourDist: number[]; hourEng: number[];
  hasReal: boolean;
}) {
  const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const total = dayDist.reduce((a, b) => a + b, 0) || 1;

  const matrix = Array.from({ length: 7 }, (_, d) =>
    HOURS.map(h => {
      const dw = dayDist[d] / total;
      const hw = (hourDist[h] || 0) / total;
      return hasReal ? ((dayEng[d] || 0) + (hourEng[h] || 0)) / 2 : dw * hw * 200;
    })
  );

  const maxV = Math.max(...matrix.flat(), 0.001);
  let bd = 0, bh = 0, bv = 0;
  matrix.forEach((row, d) => row.forEach((v, h) => { if (v > bv) { bv = v; bd = d; bh = h; } }));

  const col = (v: number) => {
    const t = v / maxV;
    if (t < 0.001) return 'rgba(240,235,227,0.45)';
    if (t < 0.3) return `rgba(196,162,101,${0.14 + t * 0.38})`;
    if (t < 0.7) return `rgba(194,94,56,${0.3 + t * 0.42})`;
    return `rgba(194,94,56,${0.68 + t * 0.28})`;
  };

  const fh = (h: number) => h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;

  return (
    <div>
      <div style={{ display: 'flex', gap: 4 }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5, paddingTop: 14, paddingRight: 2 }}>
          {DAYS.map(d => (
            <div key={d} style={{ height: 13, fontSize: 8.5, color: '#A69279', fontWeight: 600, textAlign: 'right', width: 14, lineHeight: '13px' }}>
              {d}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Hour labels — show every 3 */}
          <div style={{ display: 'flex', gap: 1.5, marginBottom: 2.5 }}>
            {HOURS.map(h => (
              <div key={h} style={{ flex: 1, fontSize: 7.5, color: h % 3 === 0 ? '#A69279' : 'transparent', textAlign: 'center', minWidth: 0 }}>
                {fh(h)}
              </div>
            ))}
          </div>
          {/* Cells */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {matrix.map((row, d) => (
              <div key={d} style={{ display: 'flex', gap: 1.5 }}>
                {row.map((v, h) => {
                  const isBest = d === bd && h === bh && bv > 0;
                  return (
                    <motion.div
                      key={h}
                      title={`${DAYS[d]} ${fh(h)}: ${hasReal ? Math.round(v) + ' interactions' : Math.round((v / maxV) * 100) + '% density'}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (d * 24 + h) * 0.0015, duration: 0.2 }}
                      style={{
                        flex: 1, height: 13, borderRadius: 2,
                        backgroundColor: col(v),
                        border: isBest ? '1px solid rgba(194,94,56,0.7)' : 'none',
                        boxShadow: isBest ? '0 0 5px rgba(194,94,56,0.45)' : 'none',
                        minWidth: 0, cursor: 'default',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 8.5, color: '#A69279' }}>Low</span>
          {[0.08, 0.28, 0.52, 0.78, 1].map(t => (
            <div key={t} style={{ width: 12, height: 7, borderRadius: 2, backgroundColor: col(t * maxV) }} />
          ))}
          <span style={{ fontSize: 8.5, color: '#A69279' }}>High</span>
        </div>
        {bv > 0 && (
          <span style={{ fontSize: 9, color: '#8B7355', fontWeight: 700 }}>
            ★ {DAYS[bd]} {fh(bh)} — your peak window
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Hook Perf Bar ─────────────────────────────────────────────────────────── */
function HookBar({ item, baseline, isTop, rank }: { item: HookItem; baseline: number; isTop: boolean; rank: number }) {
  const m = HOOK_META[item.type] || HOOK_META.unknown;
  const perf = item.performanceIndex ?? (item.avgInteractions && baseline > 0 ? Math.round((item.avgInteractions / baseline) * 100) : 100);
  const delta = perf - 100;
  const barW = Math.min(perf, 250) / 250 * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.065, duration: 0.3 }}
      style={{
        padding: '10px 12px', borderRadius: 12,
        border: isTop ? `1px solid ${m.color}35` : '1px solid rgba(232,224,212,0.6)',
        background: isTop ? m.accent : 'rgba(250,247,242,0.5)',
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
            {m.icon}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#3D2B1F' }}>{m.label}</span>
          {isTop && (
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.04em', padding: '1px 5px', borderRadius: 20, backgroundColor: `${m.color}18`, color: m.color }}>
              ★ WINNER
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {(item.avgInteractions || 0) > 0 && (
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1.5px 7px', borderRadius: 20, backgroundColor: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
              🔥 {item.avgInteractions?.toFixed(0)} avg
            </span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1.5px 6px', borderRadius: 20,
            color: delta > 0 ? '#10B981' : delta < -10 ? '#EF4444' : '#8B7355',
            backgroundColor: delta > 0 ? 'rgba(16,185,129,0.1)' : delta < -10 ? 'rgba(239,68,68,0.08)' : 'transparent',
          }}>
            {delta > 0 ? '+' : ''}{delta}%
          </span>
          <span style={{ fontSize: 10, color: '#A69279' }}>{item.count} posts</span>
        </div>
      </div>
      <div style={{ height: 4.5, backgroundColor: 'rgba(240,235,227,0.8)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barW}%` }}
          transition={{ delay: rank * 0.065 + 0.18, duration: 0.65, ease: 'easeOut' }}
          style={{ height: '100%', backgroundColor: m.color, borderRadius: 3 }}
        />
      </div>
      {item.topPostSnippet && (
        <p style={{ fontSize: 10, color: '#8B7355', marginTop: 7, padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 6, borderLeft: `2px solid ${m.color}`, fontStyle: 'italic', lineHeight: 1.5 }}>
          "{item.topPostSnippet.slice(0, 85)}…"
        </p>
      )}
    </motion.div>
  );
}

/* ── "Why This Post Won" ───────────────────────────────────────────────────── */
function WinnerCard({ posts, resonance }: { posts: SignalPost[]; resonance: ResonanceData }) {
  const top = useMemo(() => {
    return posts
      .filter(p => p.engagement?.hasRealData && p.engagement.total > 0)
      .sort((a, b) => (b.engagement?.total || 0) - (a.engagement?.total || 0))[0] || null;
  }, [posts]);

  if (!top || !resonance.hasRealEngagement) return null;

  const avg = resonance.avgInteractionsPerPost || 0;
  const total = top.engagement?.total || 0;
  const lift = avg > 0 ? Math.round(((total - avg) / avg) * 100) : 0;
  const hookType = top.hookType || 'statement';
  const m = HOOK_META[hookType] || HOOK_META.statement;
  const postWords = top.wordCount || top.content.split(/\s+/).filter(Boolean).length;
  const avgWords = resonance.avgWordCount || 100;
  const publishDay = new Date(top.createdAt).getDay();
  const publishHour = new Date(top.createdAt).getHours();

  const reasons: string[] = [];
  if (top.hasMedia && (resonance.mediaLift || 0) > 10) reasons.push(`Had media — +${resonance.mediaLift}% lift vs text-only`);
  if (postWords < avgWords * 0.72) reasons.push(`${Math.round(((avgWords - postWords) / avgWords) * 100)}% shorter than your average`);
  else if (postWords > avgWords * 1.3) reasons.push(`${Math.round(((postWords - avgWords) / avgWords) * 100)}% longer — deep-dive format`);
  if (resonance.topHook === hookType) reasons.push(`Used your highest-performing hook: ${m.label}`);
  if (resonance.bestDay?.day === publishDay) reasons.push(`Posted on your peak day (${resonance.bestDay.name})`);
  if (resonance.bestHour?.hour === publishHour) reasons.push(`Hit your peak window (${resonance.bestHour.label})`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38 }}
      style={{
        borderRadius: 16, border: '1px solid rgba(196,162,101,0.38)',
        background: 'linear-gradient(135deg, #FFFDF5 0%, #FAF7F2 100%)',
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(194,94,56,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Flame className="w-4 h-4" style={{ color: '#C25E38' }} />
        </div>
        <div>
          <p style={{ fontSize: 10.5, fontWeight: 800, color: '#C25E38', letterSpacing: '0.06em' }}>WHY THIS POST WON</p>
          <p style={{ fontSize: 9.5, color: '#8B7355' }}>Your top-performing dispatch — decoded by data</p>
        </div>
        {lift > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 20 }}>
            +{lift}% vs avg
          </span>
        )}
      </div>

      <p style={{
        fontSize: 13, color: '#3D2B1F', lineHeight: 1.55,
        borderLeft: `3px solid ${m.color}`, paddingLeft: 12, marginBottom: 14,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {top.content}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        {(top.engagement?.likes || 0) > 0 && <span style={{ fontSize: 11, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}><Heart className="w-3.5 h-3.5" />{top.engagement!.likes}</span>}
        {(top.engagement?.comments || 0) > 0 && <span style={{ fontSize: 11, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle className="w-3.5 h-3.5" />{top.engagement!.comments}</span>}
        {(top.engagement?.shares || 0) > 0 && <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}><Share2 className="w-3.5 h-3.5" />{top.engagement!.shares}</span>}
        {(top.engagement?.views || 0) > 0 && <span style={{ fontSize: 11, color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: 4 }}><Eye className="w-3.5 h-3.5" />{top.engagement!.views}</span>}
      </div>

      {reasons.length > 0 && (
        <div>
          <p style={{ fontSize: 9.5, fontWeight: 700, color: '#8B7355', letterSpacing: '0.05em', marginBottom: 7 }}>DECODED PATTERNS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {reasons.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.09 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.72)', border: '1px solid rgba(232,224,212,0.75)' }}
              >
                <span style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(196,162,101,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 8.5, color: '#C4A265', fontWeight: 800 }}>{i + 1}</span>
                </span>
                <span style={{ fontSize: 11, color: '#3D2B1F' }}>{r}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ── Metric Tile ───────────────────────────────────────────────────────────── */
function MetricTile({ label, value, suffix = '', subtext, icon, color = '#C4A265', delay = 0 }: {
  label: string; value: string | number; suffix?: string;
  subtext?: string; icon: React.ReactNode; color?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(61,43,31,0.11)' }}
      style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(232,224,212,0.8)', background: 'white', cursor: 'default' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: 9, fontWeight: 700, color: '#8B7355', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 800, color: '#3D2B1F', lineHeight: 1.1 }}>
        {value}<span style={{ fontSize: 11, fontWeight: 600, color: '#8B7355' }}>{suffix}</span>
      </p>
      {subtext && <p style={{ fontSize: 9.5, color: '#A69279', marginTop: 3 }}>{subtext}</p>}
    </motion.div>
  );
}

/* ── Platform Grid ─────────────────────────────────────────────────────────── */
function PlatformGrid({ posts }: { posts: SignalPost[] }) {
  const data = useMemo(() => {
    const map: Record<string, { posts: number; interactions: number; likes: number; comments: number; shares: number }> = {};
    posts.forEach(p => {
      p.variants.filter(v => v.status === 'published').forEach(v => {
        if (!map[v.platform]) map[v.platform] = { posts: 0, interactions: 0, likes: 0, comments: 0, shares: 0 };
        map[v.platform].posts++;
        if (v.engagement) {
          map[v.platform].interactions += v.engagement.totalInteractions || 0;
          map[v.platform].likes += v.engagement.likes || 0;
          map[v.platform].comments += v.engagement.comments || 0;
          map[v.platform].shares += v.engagement.shares || 0;
        }
      });
    });
    return Object.entries(map).sort((a, b) => b[1].interactions - a[1].interactions);
  }, [posts]);

  const maxI = Math.max(...data.map(([, d]) => d.interactions), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map(([platform, d], i) => {
        const cfg = getPlatformConfig(platform);
        const Logo = cfg.logo;
        return (
          <motion.div
            key={platform}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(232,224,212,0.7)', background: 'white' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Logo size={18} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3D2B1F' }}>{cfg.name}</span>
                <span style={{ fontSize: 10, color: '#8B7355' }}>{d.posts} posts</span>
              </div>
              {d.interactions > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#F97316' }}>🔥 {d.interactions.toLocaleString()}</span>
              )}
            </div>
            <div style={{ height: 4, backgroundColor: 'rgba(240,235,227,0.8)', borderRadius: 2, overflow: 'hidden', marginBottom: 7 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(d.interactions / maxI) * 100}%` }}
                transition={{ delay: i * 0.07 + 0.18, duration: 0.55, ease: 'easeOut' }}
                style={{ height: '100%', backgroundColor: cfg.color || '#3D2B1F', borderRadius: 2 }}
              />
            </div>
            {d.interactions > 0 && (
              <div style={{ display: 'flex', gap: 10 }}>
                {d.likes > 0 && <span style={{ fontSize: 10, color: '#EF4444' }}>❤ {d.likes}</span>}
                {d.comments > 0 && <span style={{ fontSize: 10, color: '#3B82F6' }}>💬 {d.comments}</span>}
                {d.shares > 0 && <span style={{ fontSize: 10, color: '#10B981' }}>↗ {d.shares}</span>}
              </div>
            )}
          </motion.div>
        );
      })}
      {data.length === 0 && (
        <p style={{ textAlign: 'center', color: '#A69279', fontSize: 12, padding: '24px 0' }}>No published variants yet</p>
      )}
    </div>
  );
}

/* ── SVG Sparkline ─────────────────────────────────────────────────────────── */
function Sparkline({ data, color = '#C4A265', h = 38 }: { data: number[]; color?: string; h?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const W = 300;
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: h - (v / max) * (h - 4) - 2 }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const cid = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={cid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${W} ${h} L 0 ${h} Z`} fill={`url(#${cid})`} />
      <motion.path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
      />
    </svg>
  );
}

/* ── Main AnalyticsDNA ─────────────────────────────────────────────────────── */
export function AnalyticsDNA({
  resonance,
  posts,
  onSync,
  isSyncing = false,
}: {
  resonance: ResonanceData | null;
  posts: SignalPost[];
  onSync?: () => void;
  isSyncing?: boolean;
}) {
  const [tab, setTab] = useState<'overview' | 'hooks' | 'timing' | 'platforms'>('overview');

  if (!resonance || !resonance.hasData || resonance.totalPosts === 0) {
    return (
      <div style={{ padding: '52px 24px', textAlign: 'center', border: '1px dashed rgba(232,224,212,0.8)', borderRadius: 20, background: 'white' }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(196,162,101,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Activity className="w-6 h-6" style={{ color: '#C4A265' }} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#3D2B1F', marginBottom: 8 }}>Analytics Engine Warming Up</h3>
        <p style={{ fontSize: 13, color: '#8B7355', maxWidth: 320, margin: '0 auto 24px', lineHeight: 1.65 }}>
          Publish your first post from Studio. Every dispatch trains your analytics — hook performance, optimal timing, and live engagement all unlock automatically.
        </p>
        <Link href="/dashboard/composer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, backgroundColor: '#3D2B1F', color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Open Studio <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const score = resonance.resonanceScore || 0;
  const tier = score >= 80 ? 'Authority Architect' : score >= 50 ? 'Ascending Catalyst' : 'Emerging Voice';
  const dayDist = resonance.dayDistribution || new Array(7).fill(0);
  const dayEng = resonance.dayEngagement || new Array(7).fill(0);
  const hourDist = resonance.hourDistribution || new Array(24).fill(0);
  const hourEng = resonance.hourEngagement || new Array(24).fill(0);
  const avgInteractions = resonance.avgInteractionsPerPost || 0;
  const topHook = resonance.hookBreakdown[0];
  const rows = resonance.recentPatternRows || [];
  const velocitySeries = rows.slice(0, 30).map(r => r.interactions || 0).reverse();

  const TABS = [
    { id: 'overview' as const, label: 'Overview', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'hooks' as const, label: 'Hook DNA', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'timing' as const, label: 'Timing', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'platforms' as const, label: 'Platforms', icon: <Target className="w-3.5 h-3.5" /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Hero Row ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        style={{
          borderRadius: 20, border: '1px solid rgba(232,224,212,0.8)',
          background: 'linear-gradient(135deg, #FFFDF7 0%, #FAF4EA 100%)',
          padding: '22px', display: 'grid',
          gridTemplateColumns: 'auto 1fr', gap: 22, alignItems: 'center',
        }}
      >
        {/* Orb */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <ResonanceOrb score={score} hasReal={!!resonance.hasRealEngagement} />
          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 10.5, fontWeight: 700,
                color: isSyncing ? '#A69279' : '#3D2B1F',
                backgroundColor: 'white', border: '1px solid rgba(232,224,212,0.8)',
                padding: '4px 12px', borderRadius: 20, cursor: isSyncing ? 'default' : 'pointer',
              }}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} style={{ color: '#C4A265' }} />
              {isSyncing ? 'Syncing…' : 'Sync Live'}
            </button>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#8B7355', letterSpacing: '0.07em', marginBottom: 4 }}>CONTENT RESONANCE INDEX</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#3D2B1F', lineHeight: 1 }}>{tier}</span>
              {resonance.hasRealEngagement ? (
                <span style={{ fontSize: 9.5, fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.28)', padding: '2px 9px', borderRadius: 20 }}>
                  ● Live Analytics Active
                </span>
              ) : (
                <span style={{ fontSize: 9.5, fontWeight: 600, color: '#8B7355', backgroundColor: 'rgba(139,115,85,0.1)', padding: '2px 9px', borderRadius: 20 }}>
                  Algorithmic Baseline
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: '#8B7355', marginTop: 6, lineHeight: 1.55 }}>
              {resonance.hasRealEngagement
                ? 'Scored from live audience interactions, hook performance, media lift, and multi-network spread.'
                : 'Scored from hook variety, publishing consistency, delivery rate, and multi-platform coverage.'}
            </p>
          </div>

          {/* 4 KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
            {[
              { label: resonance.hasRealEngagement ? 'Reactions' : 'Posts', value: resonance.hasRealEngagement ? (resonance.totalInteractions || 0).toLocaleString() : String(resonance.totalPosts), color: '#C25E38' },
              { label: resonance.hasRealEngagement ? 'Avg/Post' : 'Avg Words', value: resonance.hasRealEngagement ? `${avgInteractions}` : `${resonance.avgWordCount || 0}w`, color: '#C4A265' },
              { label: (resonance.mediaLift || 0) > 0 ? 'Media Lift' : 'Media Rate', value: (resonance.mediaLift || 0) > 0 ? `+${resonance.mediaLift}%` : `${resonance.mediaRatio || 0}%`, color: '#10B981' },
              { label: 'Top Hook', value: topHook?.type || 'statement', color: HOOK_META[topHook?.type || 'statement']?.color || '#C4A265' },
            ].map((kpi, i) => (
              <div key={i} style={{ padding: '7px 8px', borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.68)', border: '1px solid rgba(232,224,212,0.55)', textAlign: 'center' }}>
                <p style={{ fontSize: 8.5, fontWeight: 700, color: '#A69279', letterSpacing: '0.05em', marginBottom: 2 }}>{kpi.label.toUpperCase()}</p>
                <p style={{ fontSize: 13.5, fontWeight: 800, color: kpi.color, lineHeight: 1, textTransform: 'capitalize' }}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Tab Bar ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, padding: 4, backgroundColor: 'rgba(240,235,227,0.8)', borderRadius: 14, border: '1px solid rgba(229,223,213,0.75)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '7px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all 0.14s',
              backgroundColor: tab === t.id ? 'white' : 'transparent',
              color: tab === t.id ? '#3D2B1F' : '#8B7355',
              boxShadow: tab === t.id ? '0 1px 5px rgba(61,43,31,0.09)' : 'none',
            }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <motion.div key="ov" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 9 }}>
              <MetricTile label="Total Posts" value={resonance.totalPosts} icon={<BarChart2 className="w-4 h-4" />} color="#3D2B1F" />
              <MetricTile label="Total Interactions" value={(resonance.totalInteractions || 0).toLocaleString()} subtext={resonance.hasRealEngagement ? 'live from platform' : 'sync for real data'} icon={<Flame className="w-4 h-4" />} color="#C25E38" delay={0.05} />
              <MetricTile label="Peak Day" value={resonance.bestDay?.name || '—'} subtext={resonance.bestDay?.interactions ? `${resonance.bestDay.interactions} interactions` : `${resonance.bestDay?.count || 0} posts`} icon={<Calendar className="w-4 h-4" />} color="#3B82F6" delay={0.1} />
              <MetricTile label="Peak Window" value={resonance.bestHour?.label || '—'} subtext={resonance.bestHour?.interactions ? `${resonance.bestHour.interactions} interactions` : `${resonance.bestHour?.count || 0} posts`} icon={<Clock className="w-4 h-4" />} color="#8B5CF6" delay={0.15} />
            </div>

            <WinnerCard posts={posts} resonance={resonance} />

            {/* Velocity strip */}
            {velocitySeries.length >= 3 && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(250,247,242,0.8)', border: '1px solid rgba(232,224,212,0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: '#8B7355', letterSpacing: '0.05em' }}>POST VELOCITY</span>
                  <span style={{ fontSize: 9.5, color: '#A69279' }}>Last {velocitySeries.length} dispatches</span>
                </div>
                <Sparkline data={velocitySeries} color="#C4A265" h={36} />
              </div>
            )}

            {/* Prescriptions */}
            {(resonance.recommendations?.length || 0) > 0 && (
              <div style={{ borderRadius: 16, border: '1px solid rgba(232,224,212,0.8)', backgroundColor: 'white', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Compass className="w-4 h-4" style={{ color: '#C4A265' }} />
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#8B7355', letterSpacing: '0.06em' }}>ALGORITHMIC PRESCRIPTIONS</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
                  {resonance.recommendations!.map((rec, i) => {
                    const cols = { hook: '#C4A265', timing: '#3B82F6', format: '#8B5CF6', growth: '#10B981' };
                    const icons = { hook: <Zap className="w-3 h-3" />, timing: <Clock className="w-3 h-3" />, format: <Layers className="w-3 h-3" />, growth: <TrendingUp className="w-3 h-3" /> };
                    return (
                      <motion.div key={rec.id} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
                        style={{ padding: '13px', borderRadius: 12, backgroundColor: 'rgba(250,247,242,0.8)', border: '1px solid rgba(232,224,212,0.7)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                          <span style={{ color: cols[rec.type] }}>{icons[rec.type]}</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#3D2B1F' }}>{rec.title}</span>
                        </div>
                        <p style={{ fontSize: 10.5, color: '#8B7355', lineHeight: 1.55, marginBottom: 9 }}>{rec.desc}</p>
                        <Link href="/dashboard/composer" style={{ fontSize: 10.5, fontWeight: 700, color: '#C4A265', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                          Apply in Studio <ChevronRight className="w-3 h-3" />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── HOOK DNA ─────────────────────────────────────────────── */}
        {tab === 'hooks' && (
          <motion.div key="hooks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderRadius: 16, border: '1px solid rgba(232,224,212,0.8)', backgroundColor: 'white', padding: '20px', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#8B7355', letterSpacing: '0.06em', marginBottom: 6 }}>ARCHETYPE RADAR</p>
                <p style={{ fontSize: 11, color: '#A69279', lineHeight: 1.55, marginBottom: 10 }}>Each axis = performance vs your baseline. 100 = average, 150 = 50% above.</p>
                <HookRadar hooks={resonance.hookBreakdown} />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#8B7355', letterSpacing: '0.06em', marginBottom: 10 }}>PERFORMANCE BREAKDOWN</p>
                {['statement', 'question', 'statistic', 'story', 'contrarian', 'framework'].map((key, i) => {
                  const item = resonance.hookBreakdown.find(h => h.type === key) || { type: key, count: 0, avgInteractions: 0, performanceIndex: 0 };
                  return (
                    <HookBar key={key} item={item as HookItem} baseline={avgInteractions} isTop={key === resonance.topHook} rank={i} />
                  );
                })}
              </div>
            </div>

            {/* Top sample snippets per hook */}
            {resonance.hookBreakdown.filter(h => h.topPostSnippet && h.count > 0).slice(0, 3).map((item, i) => {
              const m = HOOK_META[item.type] || HOOK_META.unknown;
              return (
                <motion.div key={item.type} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  style={{ padding: '12px 16px', borderRadius: 12, border: `1px solid ${m.color}22`, backgroundColor: m.accent }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                    <span style={{ color: m.color }}>{m.icon}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: m.color }}>{m.label.toUpperCase()}</span>
                    <span style={{ fontSize: 10, color: '#8B7355' }}>— best performing post</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#3D2B1F', fontStyle: 'italic', lineHeight: 1.6, borderLeft: `2px solid ${m.color}`, paddingLeft: 10 }}>
                    "{item.topPostSnippet?.slice(0, 140)}…"
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── TIMING ───────────────────────────────────────────────── */}
        {tab === 'timing' && (
          <motion.div key="timing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Heatmap */}
            <div style={{ borderRadius: 16, border: '1px solid rgba(232,224,212,0.8)', backgroundColor: 'white', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#8B7355', letterSpacing: '0.06em' }}>7×24 ENGAGEMENT HEATMAP</p>
                  <p style={{ fontSize: 10.5, color: '#A69279', marginTop: 2 }}>
                    {resonance.hasRealEngagement ? 'Colored by real audience interaction density' : 'Colored by publishing frequency'}
                  </p>
                </div>
              </div>
              <Heatmap dayDist={dayDist} dayEng={dayEng} hourDist={hourDist} hourEng={hourEng} hasReal={!!resonance.hasRealEngagement} />
            </div>

            {/* Best day + hour */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {resonance.bestDay && (
                <div style={{ padding: '18px', borderRadius: 14, border: '1px solid rgba(59,130,246,0.22)', backgroundColor: 'rgba(59,130,246,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <Calendar className="w-4 h-4" style={{ color: '#3B82F6' }} />
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: '#3B82F6', letterSpacing: '0.05em' }}>PEAK DAY</span>
                  </div>
                  <p style={{ fontSize: 27, fontWeight: 900, color: '#3D2B1F' }}>{resonance.bestDay.name}</p>
                  <p style={{ fontSize: 10.5, color: '#8B7355', marginTop: 5 }}>
                    {resonance.bestDay.interactions ? `${resonance.bestDay.interactions} total interactions` : `${resonance.bestDay.count} posts published`}
                  </p>
                </div>
              )}
              {resonance.bestHour && (
                <div style={{ padding: '18px', borderRadius: 14, border: '1px solid rgba(139,92,246,0.22)', backgroundColor: 'rgba(139,92,246,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <Clock className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.05em' }}>PEAK WINDOW</span>
                  </div>
                  <p style={{ fontSize: 27, fontWeight: 900, color: '#3D2B1F' }}>{resonance.bestHour.label}</p>
                  <p style={{ fontSize: 10.5, color: '#8B7355', marginTop: 5 }}>
                    {resonance.bestHour.interactions ? `${resonance.bestHour.interactions} total interactions` : `${resonance.bestHour.count} posts in this window`}
                  </p>
                </div>
              )}
            </div>

            {/* Word count pacing */}
            <div style={{ borderRadius: 14, border: '1px solid rgba(232,224,212,0.8)', backgroundColor: 'white', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Type className="w-4 h-4" style={{ color: '#C4A265' }} />
                <p style={{ fontSize: 10, fontWeight: 800, color: '#8B7355', letterSpacing: '0.06em' }}>LENGTH & PACING SPECTRUM</p>
              </div>
              {(() => {
                const buckets = [
                  { label: 'Micro burst', range: '<50w', min: 0, max: 49, count: 0, color: '#EC4899' },
                  { label: 'Sweet spot', range: '50–120w', min: 50, max: 120, count: 0, color: '#10B981' },
                  { label: 'Thought piece', range: '120–250w', min: 121, max: 250, count: 0, color: '#3B82F6' },
                  { label: 'Deep dive', range: '250w+', min: 251, max: Infinity, count: 0, color: '#8B5CF6' },
                ];
                rows.forEach(r => { const b = buckets.find(bk => r.wordCount >= bk.min && r.wordCount <= bk.max); if (b) b.count++; });
                const maxC = Math.max(...buckets.map(b => b.count), 1);
                return buckets.map((b, i) => (
                  <div key={b.label} style={{ marginBottom: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#3D2B1F' }}>{b.label}</span>
                      <span style={{ fontSize: 10.5, color: '#8B7355' }}>{b.range} — {b.count} posts</span>
                    </div>
                    <div style={{ height: 5.5, backgroundColor: 'rgba(240,235,227,0.8)', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(b.count / maxC) * 100}%` }}
                        transition={{ delay: i * 0.09 + 0.18, duration: 0.55, ease: 'easeOut' }}
                        style={{ height: '100%', backgroundColor: b.color, borderRadius: 3 }}
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </motion.div>
        )}

        {/* ── PLATFORMS ────────────────────────────────────────────── */}
        {tab === 'platforms' && (
          <motion.div key="platforms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ borderRadius: 16, border: '1px solid rgba(232,224,212,0.8)', backgroundColor: 'white', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Target className="w-4 h-4" style={{ color: '#10B981' }} />
                <p style={{ fontSize: 10, fontWeight: 800, color: '#8B7355', letterSpacing: '0.06em' }}>NETWORK DISTRIBUTION & ENGAGEMENT</p>
              </div>
              <PlatformGrid posts={posts} />
            </div>

            {/* Media lift card */}
            <div style={{
              borderRadius: 14,
              border: `1px solid ${(resonance.mediaLift || 0) > 0 ? 'rgba(16,185,129,0.28)' : 'rgba(232,224,212,0.8)'}`,
              backgroundColor: (resonance.mediaLift || 0) > 0 ? 'rgba(16,185,129,0.04)' : 'rgba(250,247,242,0.8)',
              padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center',
            }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#8B7355', letterSpacing: '0.05em', marginBottom: 4 }}>MEDIA MULTIPLIER</p>
                <p style={{ fontSize: 36, fontWeight: 900, color: (resonance.mediaLift || 0) > 0 ? '#10B981' : '#3D2B1F', lineHeight: 1 }}>
                  {(resonance.mediaLift || 0) > 0 ? `+${resonance.mediaLift}%` : `${resonance.mediaRatio || 0}%`}
                </p>
                <p style={{ fontSize: 11, color: '#8B7355', marginTop: 6, lineHeight: 1.55 }}>
                  {(resonance.mediaLift || 0) > 0
                    ? `Posts with media get ${resonance.mediaLift}% more interactions than text-only.`
                    : `${resonance.mediaRatio || 0}% of posts include visual media. Add visuals to unlock +40-65% engagement.`}
                </p>
              </div>
              {/* Donut */}
              <svg width={88} height={88} viewBox="0 0 88 88">
                <circle cx={44} cy={44} r={34} fill="none" stroke="rgba(240,235,227,0.8)" strokeWidth={12} />
                <motion.circle
                  cx={44} cy={44} r={34}
                  fill="none"
                  stroke={(resonance.mediaLift || 0) > 0 ? '#10B981' : '#C4A265'}
                  strokeWidth={12} strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - (resonance.mediaRatio || 0) / 100) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '44px 44px' }}
                />
                <text x={44} y={41} textAnchor="middle" fontSize={14} fontWeight={800} fill="#3D2B1F">{resonance.mediaRatio || 0}%</text>
                <text x={44} y={53} textAnchor="middle" fontSize={7.5} fill="#8B7355">with media</text>
              </svg>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <p style={{ fontSize: 9.5, color: '#A69279', textAlign: 'center', paddingBottom: 4 }}>
        Built from your actual publish history. Every dispatch refines your Post DNA.
      </p>
    </div>
  );
}
