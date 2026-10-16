'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  RefreshCw, TrendingUp, Activity, CheckCircle, AlertCircle,
  ShieldCheck, ArrowRight, BarChart3, Zap, Globe, Lock, Unlock,
} from 'lucide-react';
import { getPlatformConfig } from '@/components/dashboard/PlatformLogos';

type PostVariant = {
  id: string; platform: string; status: string;
  engagement?: { likes: number; comments: number; shares: number; views: number; totalInteractions: number; hasRealData: boolean };
};
type SignalPost = {
  id: string; content: string; hookType: string | null; wordCount: number | null;
  hasMedia: boolean; createdAt: string; variants: PostVariant[];
  engagement?: { likes: number; comments: number; shares: number; views: number; total: number; hasRealData: boolean };
};
type HookItem = {
  type: string; count: number; totalInteractions?: number; avgInteractions?: number;
  avgComments?: number; avgLikes?: number; avgShares?: number; performanceIndex?: number;
  samples?: string[]; topPostSnippet?: string; hasRealData?: boolean;
};
type ResonanceData = {
  hasData: boolean; hasRealEngagement?: boolean; totalPosts: number; totalInteractions?: number;
  avgInteractionsPerPost?: number; totalViews?: number; topHook?: string; hookBreakdown: HookItem[];
  bestDay: { day: number; name: string; count: number; interactions?: number } | null;
  bestHour: { hour: number; label: string; count: number; interactions?: number } | null;
  dayDistribution?: number[]; dayEngagement?: number[];
  hourDistribution?: number[]; hourEngagement?: number[];
  avgWordCount?: number; mediaRatio?: number; mediaLift?: number; resonanceScore?: number;
  recommendations?: Array<{ id: string; title: string; desc: string; type: 'hook' | 'timing' | 'format' | 'growth' }>;
  recentPatternRows?: Array<{
    id?: string; contentSnippet?: string; hookType: string; wordCount: number;
    dayOfWeek: number; hourOfDay: number; hasMedia: boolean; publishedCount: number;
    likes?: number; comments?: number; shares?: number; views?: number; interactions?: number; hasRealData?: boolean;
  }>;
};

const HOOK_COLORS: Record<string, string> = {
  statement: '#B48C48', question: '#3B82F6', statistic: '#10B981',
  story: '#EC4899', contrarian: '#EF4444', framework: '#8B5CF6', unknown: '#6B7280',
};

// ── CHART 1: Engagement Scatter (Growth tab) ──────────────────────────────
function EngagementScatter({ posts }: { posts: SignalPost[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<{ x: number; y: number; post: SignalPost } | null>(null);
  const animRef = useRef<number>(0);
  const progressRef = useRef(0);

  const plotPosts = useMemo(() =>
    posts.filter(p => p.variants.some(v => v.status === 'published'))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-40), [posts]);

  const maxInteractions = useMemo(() => Math.max(...plotPosts.map(p => p.engagement?.total || 0), 1), [plotPosts]);
  const maxViews = useMemo(() => Math.max(...plotPosts.map(p => p.engagement?.views || 0), 1), [plotPosts]);

  const getCoords = useCallback((p: SignalPost, idx: number, W: number, H: number, PAD: number) => ({
    cx: PAD + (idx / Math.max(plotPosts.length - 1, 1)) * (W - PAD * 2),
    cy: H - PAD - ((p.engagement?.total || 0) / maxInteractions) * (H - PAD * 2),
    r: 5 + ((p.engagement?.views || 0) / maxViews) * 12,
  }), [plotPosts, maxInteractions, maxViews]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || plotPosts.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const LW = canvas.offsetWidth, LH = canvas.offsetHeight, PAD = 36;
    let t0: number | null = null;
    function draw(ts: number) {
      if (!t0) t0 = ts;
      const prog = Math.min((ts - t0) / 900, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      progressRef.current = ease;
      ctx.clearRect(0, 0, LW, LH);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = PAD + (i / 4) * (LH - PAD * 2);
        ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(LW - PAD, y); ctx.stroke();
        const val = Math.round((maxInteractions / 4) * (4 - i));
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.font = '500 9px Inter,system-ui,sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(val > 999 ? `${(val/1000).toFixed(1)}k` : String(val), PAD - 4, y + 3);
      }
      if (plotPosts.length >= 3) {
        const coords = plotPosts.map((p, i) => getCoords(p, i, LW, LH, PAD));
        const n = coords.length;
        const sx = coords.reduce((s, c) => s + c.cx, 0), sy = coords.reduce((s, c) => s + c.cy, 0);
        const sxy = coords.reduce((s, c) => s + c.cx * c.cy, 0), sx2 = coords.reduce((s, c) => s + c.cx * c.cx, 0);
        const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
        const inter = (sy - slope * sx) / n;
        const x1 = PAD, x2 = LW - PAD, y1 = slope * x1 + inter, y2 = slope * x2 + inter;
        const up = slope < 0;
        const g = ctx.createLinearGradient(x1, 0, x2, 0);
        g.addColorStop(0, `rgba(${up ? '16,185,129' : '239,68,68'},0.1)`);
        g.addColorStop(1, `rgba(${up ? '16,185,129' : '239,68,68'},0.35)`);
        ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = up ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.7)';
        ctx.font = '700 9px Inter,system-ui,sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(up ? '↑ GROWTH TREND' : '↓ PLATEAU', x2 - 88, y2 - 8);
      }
      plotPosts.forEach((post, idx) => {
        const { cx, cy, r } = getCoords(post, idx, LW, LH, PAD);
        const animCy = LH - PAD - (LH - PAD - cy) * ease;
        const color = HOOK_COLORS[post.hookType || 'unknown'] || '#6B7280';
        if (post.engagement?.hasRealData && (post.engagement?.total || 0) > 0) {
          const gl = ctx.createRadialGradient(cx, animCy, 0, cx, animCy, r * 2.5);
          gl.addColorStop(0, `${color}40`); gl.addColorStop(1, `${color}00`);
          ctx.beginPath(); ctx.arc(cx, animCy, r * 2.5, 0, Math.PI * 2); ctx.fillStyle = gl; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(cx, animCy, r * ease, 0, Math.PI * 2);
        ctx.fillStyle = post.engagement?.hasRealData ? color : `${color}55`; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.stroke();
      });
      if (prog < 1) animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [plotPosts, maxInteractions, maxViews, getCoords]);

  const onMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c || progressRef.current < 0.5) { setHovered(null); return; }
    const r = c.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    let found: typeof hovered = null;
    plotPosts.forEach((p, i) => {
      const { cx, cy, r: pr } = getCoords(p, i, c.offsetWidth, c.offsetHeight, 36);
      if (Math.hypot(mx - cx, my - cy) < pr + 6) found = { x: cx, y: cy, post: p };
    });
    setHovered(found);
  }, [plotPosts, getCoords]);

  if (!plotPosts.length) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Publish posts to see trajectory</div>;
  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} onMouseMove={onMove} onMouseLeave={() => setHovered(null)} style={{ width: '100%', height: 200, cursor: 'crosshair', borderRadius: 8 }} />
      {hovered && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ position: 'absolute', left: Math.min(hovered.x + 10, 200), top: hovered.y - 40, background: 'rgba(15,10,8,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px', pointerEvents: 'none', zIndex: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 3 }}>{hovered.post.content.slice(0, 45)}…</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>{hovered.post.engagement?.total || 0} interactions · {hovered.post.engagement?.views || 0} views</p>
        </motion.div>
      )}
    </div>
  );
}

// ── CHART 2: ROI Waterfall ──────────────────────────────────────────────────
function ROIWaterfall({ posts }: { posts: SignalPost[] }) {
  const data = useMemo(() => {
    const map: Record<string, { posts: number; interactions: number; likes: number; comments: number; shares: number }> = {};
    posts.forEach(p => p.variants.filter(v => v.status === 'published').forEach(v => {
      if (!map[v.platform]) map[v.platform] = { posts: 0, interactions: 0, likes: 0, comments: 0, shares: 0 };
      map[v.platform].posts++;
      if (v.engagement) { map[v.platform].interactions += v.engagement.totalInteractions || 0; map[v.platform].likes += v.engagement.likes || 0; map[v.platform].comments += v.engagement.comments || 0; map[v.platform].shares += v.engagement.shares || 0; }
    }));
    return Object.entries(map).sort((a, b) => b[1].interactions - a[1].interactions).slice(0, 6);
  }, [posts]);
  const maxVal = Math.max(...data.map(([, d]) => d.interactions), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {!data.length && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', padding: '24px 0' }}>No published variants yet</p>}
      {data.map(([platform, d], i) => {
        const cfg = getPlatformConfig(platform); const Logo = cfg.logo;
        return (
          <motion.div key={platform} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
            style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Logo size={16} /><span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{cfg.name}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{d.posts} posts</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{d.posts > 0 ? Math.round(d.interactions / d.posts) : 0}/post</span><span style={{ fontSize: 11, fontWeight: 700, color: cfg.color || '#C4A265' }}>{d.interactions.toLocaleString()}</span></div>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${(d.interactions / maxVal) * 100}%` }} transition={{ delay: i * 0.07 + 0.2, duration: 0.7, ease: 'easeOut' }} style={{ height: '100%', background: `linear-gradient(90deg,${cfg.color || '#C4A265'}88,${cfg.color || '#C4A265'})`, borderRadius: 3 }} />
            </div>
            {d.interactions > 0 && <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>{d.likes > 0 && <span style={{ fontSize: 10, color: 'rgba(239,68,68,0.8)' }}>❤ {d.likes.toLocaleString()}</span>}{d.comments > 0 && <span style={{ fontSize: 10, color: 'rgba(59,130,246,0.8)' }}>💬 {d.comments.toLocaleString()}</span>}{d.shares > 0 && <span style={{ fontSize: 10, color: 'rgba(16,185,129,0.8)' }}>↗ {d.shares.toLocaleString()}</span>}</div>}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── CHART 3: Pulse Clock (Audience tab) ────────────────────────────────────
function PulseClock({ hourEngagement, hourDistribution, hasReal }: { hourEngagement: number[]; hourDistribution: number[]; hasReal: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const data = useMemo(() => { const raw = hasReal && hourEngagement.some(v => v > 0) ? hourEngagement : hourDistribution; const mx = Math.max(...raw, 1); return raw.map(v => v / mx); }, [hourEngagement, hourDistribution, hasReal]);
  const peak = useMemo(() => data.indexOf(Math.max(...data)), [data]);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!; const DPR = devicePixelRatio || 1; const S = 220;
    canvas.width = S * DPR; canvas.height = S * DPR; ctx.scale(DPR, DPR);
    const cx = S / 2, cy = S / 2; const t0 = Date.now();
    const fmt = (h: number) => h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    function frame() {
      const t = (Date.now() - t0) / 1000; const prog = Math.min(t / 0.9, 1); const ease = 1 - Math.pow(1 - prog, 3);
      ctx.clearRect(0, 0, S, S);
      const SLICE = (Math.PI * 2) / 24, IN = 55, OUT = 90;
      data.forEach((val, h) => {
        const sa = (h / 24) * Math.PI * 2 - Math.PI / 2, ea = sa + SLICE - 0.025;
        const ar = IN + (OUT - IN) * val * ease, isPeak = h === peak;
        if (isPeak && ease > 0.5) {
          const g = ctx.createRadialGradient(cx, cy, IN, cx, cy, OUT + 18);
          g.addColorStop(0, 'rgba(196,162,101,0)'); g.addColorStop(0.5, `rgba(196,162,101,${0.18*ease})`); g.addColorStop(1, 'rgba(196,162,101,0)');
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, OUT + 18, sa, ea); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
        }
        const alpha = val > 0.01 ? 0.12 + val * 0.78 : 0.06;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, ar, sa, ea); ctx.closePath();
        ctx.fillStyle = `${isPeak ? 'rgba(196,162,101,' : val > 0.6 ? 'rgba(194,94,56,' : 'rgba(99,130,180,'}${alpha * ease})`; ctx.fill();
      });
      const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, IN);
      ig.addColorStop(0, 'rgba(30,18,12,1)'); ig.addColorStop(1, 'rgba(22,14,8,1)');
      ctx.beginPath(); ctx.arc(cx, cy, IN, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();
      [0, 6, 12, 18].forEach(h => {
        const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = '600 9px Inter,system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(h === 0 ? '12a' : h === 6 ? '6a' : h === 12 ? '12p' : '6p', cx + 102 * Math.cos(a), cy + 102 * Math.sin(a));
      });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '800 14px Inter,system-ui,sans-serif'; ctx.fillText('PEAK', cx, cy - 8);
      ctx.fillStyle = 'rgba(196,162,101,0.95)'; ctx.font = '700 12px Inter,system-ui,sans-serif'; ctx.fillText(fmt(peak), cx, cy + 8);
      if (prog < 1) { const sa = prog * Math.PI * 2 - Math.PI / 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + (IN - 8) * Math.cos(sa), cy + (IN - 8) * Math.sin(sa)); ctx.strokeStyle = 'rgba(196,162,101,0.5)'; ctx.lineWidth = 1; ctx.stroke(); }
      if (prog < 1 || t < 3) animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [data, peak]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <canvas ref={canvasRef} style={{ width: 220, height: 220 }} />
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>{hasReal ? 'Colored by live interaction density' : 'Colored by publish frequency'}</p>
    </div>
  );
}

// ── CHART 4: Network Gravity Bubbles ────────────────────────────────────────
function NetworkBubbles({ posts }: { posts: SignalPost[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const platforms = useMemo(() => {
    const map: Record<string, { posts: number; interactions: number; color: string; name: string }> = {};
    posts.forEach(p => p.variants.filter(v => v.status === 'published').forEach(v => {
      const cfg = getPlatformConfig(v.platform);
      if (!map[v.platform]) map[v.platform] = { posts: 0, interactions: 0, color: cfg.color || '#6B7280', name: cfg.name };
      map[v.platform].posts++;
      if (v.engagement) map[v.platform].interactions += v.engagement.totalInteractions || 0;
    }));
    return Object.entries(map).map(([key, val]) => ({ key, ...val }));
  }, [posts]);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || !platforms.length) return;
    const ctx = canvas.getContext('2d')!; const DPR = devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * DPR; canvas.height = canvas.offsetHeight * DPR; ctx.scale(DPR, DPR);
    const LW = canvas.offsetWidth, LH = canvas.offsetHeight;
    const maxI = Math.max(...platforms.map(p => p.interactions), 1);
    const bubbles = platforms.map((p, i) => {
      const r = 22 + (p.interactions / maxI) * 38, angle = (i / platforms.length) * Math.PI * 2, orbitR = Math.min(LW, LH) * 0.28;
      return { ...p, r, x: LW / 2 + orbitR * Math.cos(angle), y: LH / 2 + orbitR * Math.sin(angle), vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, phase: Math.random() * Math.PI * 2 };
    });
    const t0 = Date.now();
    function frame() {
      const t = (Date.now() - t0) / 1000, entered = Math.min(t / 0.7, 1), ease = 1 - Math.pow(1 - entered, 3);
      ctx.clearRect(0, 0, LW, LH);
      for (let i = 0; i < bubbles.length; i++) for (let j = i + 1; j < bubbles.length; j++) {
        const dist = Math.hypot(bubbles[i].x - bubbles[j].x, bubbles[i].y - bubbles[j].y);
        if (dist < 160) { ctx.beginPath(); ctx.moveTo(bubbles[i].x, bubbles[i].y); ctx.lineTo(bubbles[j].x, bubbles[j].y); ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / 160) * 0.06 * ease})`; ctx.lineWidth = 1; ctx.stroke(); }
      }
      bubbles.forEach((b, i) => {
        b.x += b.vx + Math.sin(t * 0.5 + b.phase) * 0.3; b.y += b.vy + Math.cos(t * 0.4 + b.phase) * 0.3;
        const mg = b.r + 8;
        if (b.x < mg || b.x > LW - mg) b.vx *= -1; if (b.y < mg || b.y > LH - mg) b.vy *= -1;
        b.x = Math.max(mg, Math.min(LW - mg, b.x)); b.y = Math.max(mg, Math.min(LH - mg, b.y));
        const ar = b.r * ease, pulse = 1 + 0.04 * Math.sin(t * 1.8 + i);
        const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, ar * 2 * pulse);
        gl.addColorStop(0, `${b.color}30`); gl.addColorStop(1, `${b.color}00`);
        ctx.beginPath(); ctx.arc(b.x, b.y, ar * 2 * pulse, 0, Math.PI * 2); ctx.fillStyle = gl; ctx.fill();
        const gr = ctx.createRadialGradient(b.x - ar * 0.3, b.y - ar * 0.3, 0, b.x, b.y, ar * pulse);
        gr.addColorStop(0, `${b.color}DD`); gr.addColorStop(1, `${b.color}66`);
        ctx.beginPath(); ctx.arc(b.x, b.y, ar * pulse, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
        ctx.strokeStyle = `${b.color}44`; ctx.lineWidth = 1.5; ctx.stroke();
        if (ar > 15) {
          ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = `700 ${Math.max(9, Math.min(11, ar / 3.5))}px Inter,system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(b.name.length > 6 ? b.name.slice(0, 5) : b.name, b.x, b.y - 5);
          ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '600 8px Inter,system-ui,sans-serif';
          ctx.fillText(b.interactions > 0 ? b.interactions.toLocaleString() : `${b.posts}p`, b.x, b.y + 7);
        }
      });
      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [platforms]);
  if (!platforms.length) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Publish to networks to see gravity map</div>;
  return <canvas ref={canvasRef} style={{ width: '100%', height: 200, borderRadius: 8 }} />;
}

// ── CHART 5: Effort x Return Matrix ────────────────────────────────────────
function EffortReturnMatrix({ posts, avgWordCount }: { posts: SignalPost[]; avgWordCount: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<{ x: number; y: number; post: SignalPost } | null>(null);
  const plotData = useMemo(() => posts.filter(p => p.variants.some(v => v.status === 'published')).map(p => ({ post: p, words: p.wordCount || p.content.split(/\s+/).filter(Boolean).length, interactions: p.engagement?.total || 0 })).filter(d => d.words > 0), [posts]);
  const maxW = useMemo(() => Math.max(...plotData.map(d => d.words), 1), [plotData]);
  const maxI = useMemo(() => Math.max(...plotData.map(d => d.interactions), 1), [plotData]);
  const midW = avgWordCount || maxW / 2;
  const midI = useMemo(() => plotData.reduce((s, d) => s + d.interactions, 0) / Math.max(plotData.length, 1), [plotData]);
  const gc = useCallback((d: { words: number; interactions: number }, W: number, H: number, PAD: number) => ({ cx: PAD + (d.words / maxW) * (W - PAD * 2), cy: H - PAD - (d.interactions / maxI) * (H - PAD * 2) }), [maxW, maxI]);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || !plotData.length) return;
    const ctx = canvas.getContext('2d')!; const DPR = devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * DPR; canvas.height = canvas.offsetHeight * DPR; ctx.scale(DPR, DPR);
    const LW = canvas.offsetWidth, LH = canvas.offsetHeight, PAD = 32;
    ctx.clearRect(0, 0, LW, LH);
    const mcx = PAD + (midW / maxW) * (LW - PAD * 2), mcy = LH - PAD - (midI / maxI) * (LH - PAD * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(mcx, PAD); ctx.lineTo(mcx, LH - PAD); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, mcy); ctx.lineTo(LW - PAD, mcy); ctx.stroke(); ctx.setLineDash([]);
    [{ x: PAD + 4, y: PAD + 12, text: '✦ QUICK WINS', color: 'rgba(16,185,129,0.5)' }, { x: mcx + 6, y: PAD + 12, text: 'DEEP VALUE', color: 'rgba(196,162,101,0.5)' }, { x: PAD + 4, y: LH - PAD - 6, text: 'WARM UP', color: 'rgba(255,255,255,0.2)' }, { x: mcx + 6, y: LH - PAD - 6, text: 'WASTED EFFORT', color: 'rgba(239,68,68,0.35)' }].forEach(l => { ctx.fillStyle = l.color; ctx.font = '700 8px Inter,system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.fillText(l.text, l.x, l.y); });
    plotData.forEach(d => {
      const { cx, cy } = gc(d, LW, LH, PAD); const color = HOOK_COLORS[d.post.hookType || 'unknown'] || '#6B7280';
      if (d.words < midW && d.interactions > midI) { const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14); gl.addColorStop(0, 'rgba(16,185,129,0.3)'); gl.addColorStop(1, 'rgba(16,185,129,0)'); ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fillStyle = gl; ctx.fill(); }
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = '500 8.5px Inter,system-ui,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('← Shorter', PAD + 30, LH - 6); ctx.fillText('Longer →', LW - PAD - 30, LH - 6);
    ctx.save(); ctx.translate(10, LH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('↑ More engagement', 0, 0); ctx.restore();
  }, [plotData, midW, midI, maxW, maxI, gc]);
  const onMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; if (!c) { setHovered(null); return; }
    const r = c.getBoundingClientRect(); const mx = e.clientX - r.left, my = e.clientY - r.top;
    let found: typeof hovered = null;
    plotData.forEach(d => { const { cx, cy } = gc(d, c.offsetWidth, c.offsetHeight, 32); if (Math.hypot(mx - cx, my - cy) < 10) found = { x: cx, y: cy, post: d.post }; });
    setHovered(found);
  }, [plotData, gc]);
  if (!plotData.length) return <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Publish posts to populate matrix</div>;
  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} onMouseMove={onMove} onMouseLeave={() => setHovered(null)} style={{ width: '100%', height: 220, cursor: 'crosshair', borderRadius: 8 }} />
      {hovered && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ position: 'absolute', left: Math.min(hovered.x + 10, 220), top: hovered.y - 36, background: 'rgba(15,10,8,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '7px 11px', pointerEvents: 'none', zIndex: 10 }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: 'white', marginBottom: 2 }}>{hovered.post.content.slice(0, 50)}…</p>
          <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.5)' }}>{hovered.post.wordCount || 0}w · {hovered.post.engagement?.total || 0} interactions</p>
        </motion.div>
      )}
    </div>
  );
}

// ── CHART 6: Day Radial Strip ───────────────────────────────────────────────
function DayRadialStrip({ dayEngagement, dayDistribution, hasReal }: { dayEngagement: number[]; dayDistribution: number[]; hasReal: boolean }) {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = hasReal && dayEngagement.some(v => v > 0) ? dayEngagement : dayDistribution;
  const max = Math.max(...data, 1), peak = data.indexOf(Math.max(...data));
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
      {DAYS.map((day, i) => {
        const pct = data[i] / max, isPeak = i === peak;
        const color = isPeak ? '#C4A265' : pct > 0.6 ? '#C25E38' : pct > 0.3 ? '#3B82F6' : 'rgba(255,255,255,0.15)';
        return (
          <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
              style={{ width: '100%', height: Math.max(Math.round(pct * 80), 4), background: `linear-gradient(180deg,${color},${color}55)`, borderRadius: '4px 4px 2px 2px', boxShadow: isPeak ? `0 0 10px ${color}50` : 'none', transformOrigin: 'bottom' }} />
            <span style={{ fontSize: 9, fontWeight: isPeak ? 800 : 500, color: isPeak ? '#C4A265' : 'rgba(255,255,255,0.3)' }}>{day}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── CHART 7: Hook ROI Ranking ───────────────────────────────────────────────
function HookROIRanking({ hooks, avgInteractions }: { hooks: HookItem[]; avgInteractions: number }) {
  const LABELS: Record<string, string> = { statement: 'Bold Statement', question: 'Curiosity Q', statistic: 'Data Hook', story: 'Personal Story', contrarian: 'Contrarian', framework: 'Framework', unknown: 'Standard' };
  const ranked = useMemo(() => [...hooks].filter(h => h.count > 0).sort((a, b) => (b.avgInteractions || 0) - (a.avgInteractions || 0)), [hooks]);
  const maxAvg = Math.max(...ranked.map(h => h.avgInteractions || 0), 1);
  if (!ranked.length) return <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '16px 0' }}>No hook data yet</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ranked.map((h, i) => {
        const color = HOOK_COLORS[h.type] || '#6B7280', avg = h.avgInteractions || 0;
        const vsBase = avgInteractions > 0 ? Math.round(((avg - avgInteractions) / avgInteractions) * 100) : 0;
        return (
          <motion.div key={h.type} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            style={{ padding: '12px 14px', borderRadius: 12, background: i === 0 ? `${color}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? `${color}30` : 'rgba(255,255,255,0.06)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}18`, fontSize: 11, fontWeight: 900, color }}>{i + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{LABELS[h.type] || h.type}</span>
                {i === 0 && <span style={{ fontSize: 8.5, fontWeight: 800, color, background: `${color}18`, padding: '1px 6px', borderRadius: 10 }}>TOP ROI</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{h.count} posts</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1.5px 7px', borderRadius: 20, color: vsBase > 0 ? '#10B981' : vsBase < -10 ? '#EF4444' : 'rgba(255,255,255,0.4)', background: vsBase > 0 ? 'rgba(16,185,129,0.1)' : vsBase < -10 ? 'rgba(239,68,68,0.08)' : 'transparent' }}>{vsBase > 0 ? '+' : ''}{vsBase}% vs avg</span>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{avg.toFixed(1)} avg</span>
              </div>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${(avg / maxAvg) * 100}%` }} transition={{ delay: i * 0.06 + 0.2, duration: 0.65, ease: 'easeOut' }} style={{ height: '100%', background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)' }}>Cumulative: <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{(avg * h.count).toLocaleString()} interactions</span></p>
              {h.topPostSnippet && <p style={{ fontSize: 9, color: `${color}80`, fontStyle: 'italic', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{h.topPostSnippet.slice(0, 50)}"</p>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── META PERMISSION BOARD ───────────────────────────────────────────────────
const META_PERMS = [
  { scope: 'instagram_basic', label: 'Instagram Basic', desc: 'Read profile, media, and bio data', required: true, cat: 'content' },
  { scope: 'instagram_content_publish', label: 'Content Publish', desc: 'Schedule and publish posts, reels, stories', required: true, cat: 'content' },
  { scope: 'instagram_manage_comments', label: 'Manage Comments', desc: 'Read, reply, delete post comments', required: true, cat: 'engagement' },
  { scope: 'instagram_manage_insights', label: 'Manage Insights', desc: 'Reach, impressions, engagement metrics', required: true, cat: 'insights' },
  { scope: 'pages_messaging', label: 'Pages Messaging', desc: 'Send/receive DMs via Page inbox', required: true, cat: 'messaging' },
  { scope: 'pages_read_engagement', label: 'Pages Engagement', desc: 'Read likes, comments, page reactions', required: true, cat: 'engagement' },
  { scope: 'instagram_manage_messages', label: 'Instagram DMs', desc: 'Full Instagram Direct Message access', required: true, cat: 'messaging' },
  { scope: 'pages_manage_posts', label: 'Manage FB Posts', desc: 'Publish and manage Facebook Page posts', required: false, cat: 'content' },
  { scope: 'webhooks', label: 'Webhooks', desc: 'Real-time comment and DM notifications', required: true, cat: 'engagement' },
  { scope: 'pages_show_list', label: 'Pages List', desc: 'Access connected Facebook Pages', required: false, cat: 'content' },
] as const;
const CAT_COLORS: Record<string, string> = { content: '#3B82F6', engagement: '#10B981', messaging: '#8B5CF6', insights: '#F59E0B' };

function MetaPermissionBoard({ autoEnabled }: { autoEnabled: boolean }) {
  const [cat, setCat] = useState<string | null>(null);
  const perms = cat ? META_PERMS.filter(p => p.cat === cat) : META_PERMS;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '14px 18px', borderRadius: 14, background: autoEnabled ? 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.06))' : 'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.05))', border: `1px solid ${autoEnabled ? 'rgba(16,185,129,0.28)' : 'rgba(239,68,68,0.25)'}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        {autoEnabled ? <CheckCircle size={20} style={{ color: '#10B981', flexShrink: 0 }} /> : <AlertCircle size={20} style={{ color: '#EF4444', flexShrink: 0 }} />}
        <div>
          <p style={{ fontSize: 12.5, fontWeight: 800, color: autoEnabled ? '#10B981' : '#EF4444', marginBottom: 2 }}>{autoEnabled ? 'SignalDM Automation Active — Meta Permissions Operational' : 'Meta App Review Required'}</p>
          <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{autoEnabled ? 'Your Instagram account is authorized. Webhook events, comment replies, and DM flows are live.' : 'Connect your Instagram Business account and submit for Meta App Review to unlock comment management and DM automation.'}</p>
        </div>
      </motion.div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(['content', 'engagement', 'messaging', 'insights'] as const).map(c => (
          <button key={c} onClick={() => setCat(cat === c ? null : c)}
            style={{ padding: '4px 12px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', border: `1px solid ${CAT_COLORS[c]}40`, background: cat === c ? `${CAT_COLORS[c]}22` : 'rgba(255,255,255,0.04)', color: cat === c ? CAT_COLORS[c] : 'rgba(255,255,255,0.45)', transition: 'all 0.15s' }}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 8 }}>
        {perms.map((perm, i) => {
          const cc = CAT_COLORS[perm.cat], granted = autoEnabled || perm.scope === 'instagram_basic';
          return (
            <motion.div key={perm.scope} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ padding: '11px 13px', borderRadius: 11, background: granted ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${granted ? `${cc}25` : 'rgba(255,255,255,0.07)'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, marginTop: 1, background: granted ? `${cc}18` : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {granted ? <CheckCircle size={13} style={{ color: cc }} /> : perm.required ? <Lock size={13} style={{ color: 'rgba(239,68,68,0.7)' }} /> : <Unlock size={13} style={{ color: 'rgba(255,255,255,0.25)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: granted ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}>{perm.label}</span>
                    {perm.required && <span style={{ fontSize: 8.5, fontWeight: 700, color: cc, background: `${cc}18`, padding: '1px 5px', borderRadius: 10 }}>REQUIRED</span>}
                  </div>
                  <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1.45 }}>{perm.desc}</p>
                  <p style={{ fontSize: 8.5, fontFamily: 'monospace', color: `${cc}70`, marginTop: 3 }}>{perm.scope}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Zap size={15} style={{ color: '#8B5CF6' }} />
          <p style={{ fontSize: 11, fontWeight: 800, color: '#8B5CF6', letterSpacing: '0.04em' }}>META APP REVIEW — SCREEN RECORDING CHECKLIST</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            { step: '1', text: 'Show Instagram Business account connected in Settings → Social Accounts', done: true },
            { step: '2', text: 'Navigate to Automation → demonstrate comment auto-reply triggering', done: autoEnabled },
            { step: '3', text: 'Show DM escalation flow: comment triggers → DM sent → lead captured', done: autoEnabled },
            { step: '4', text: 'Open Analytics → show real engagement metrics pulled from Instagram Graph API', done: true },
            { step: '5', text: 'Show Webhook subscription status and live event receipt in server logs', done: autoEnabled },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: item.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${item.done ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: item.done ? '#10B981' : 'rgba(255,255,255,0.35)' }}>
                {item.done ? '✓' : item.step}
              </div>
              <p style={{ fontSize: 11, color: item.done ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)', lineHeight: 1.5, paddingTop: 2 }}>{item.text}</p>
            </div>
          ))}
        </div>
        <Link href="/dashboard/automation" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, fontWeight: 700, color: '#8B5CF6', textDecoration: 'none', padding: '6px 14px', borderRadius: 8, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.22)' }}>
          Open Automation Dashboard <ArrowRight size={12} />
        </Link>
      </motion.div>
    </div>
  );
}

// ── Animated Counter ────────────────────────────────────────────────────────
function AnimCount({ value, prefix = '', suffix = '', color = 'white', size = 26 }: { value: number; prefix?: string; suffix?: string; color?: string; size?: number }) {
  const [d, setD] = useState(0);
  useEffect(() => { const t0 = Date.now(), tick = () => { const p = Math.min((Date.now() - t0) / 800, 1), e = 1 - Math.pow(1 - p, 3); setD(Math.round(value * e)); if (p < 1) requestAnimationFrame(tick); }; tick(); }, [value]);
  return <span style={{ fontSize: size, fontWeight: 900, color, lineHeight: 1 }}>{prefix}{d >= 1000 ? `${(d/1000).toFixed(1)}k` : d}{suffix}</span>;
}

// ── MAIN EXPORT ─────────────────────────────────────────────────────────────
export function AnalyticsDNA({ resonance, posts, onSync, isSyncing = false }: { resonance: ResonanceData | null; posts: SignalPost[]; onSync?: () => void; isSyncing?: boolean }) {
  const [tab, setTab] = useState<'growth' | 'audience' | 'roi' | 'meta'>('growth');
  const [autoEnabled, setAutoEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/user/context', { credentials: 'include' });
        if (!r.ok) return;
        const { workspace } = await r.json();
        if (!workspace?.id) return;
        const cr = await fetch(`/api/instagram/automation?workspaceId=${workspace.id}`, { credentials: 'include' });
        if (cr.ok) { const cfg = await cr.json(); setAutoEnabled(!!cfg.enabled); }
      } catch { /* best-effort */ }
    })();
  }, []);

  if (!resonance || !resonance.hasData || resonance.totalPosts === 0) {
    return (
      <div style={{ padding: '52px 24px', textAlign: 'center', background: 'linear-gradient(135deg,#0F0A08,#1A0F0A)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(196,162,101,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <Activity size={24} style={{ color: '#C4A265' }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 8 }}>Analytics Engine Initializing</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', maxWidth: 340, margin: '0 auto 24px', lineHeight: 1.65 }}>Publish your first post. Each dispatch feeds real business intelligence — growth curves, ROI matrix, platform gravity, and Meta compliance proof.</p>
        <Link href="/dashboard/composer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, background: '#C4A265', color: '#1A0F0A', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
          Open Studio <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const totalI = resonance.totalInteractions || 0;
  const avgI = resonance.avgInteractionsPerPost || 0;
  const hasReal = !!resonance.hasRealEngagement;
  const dayDist = resonance.dayDistribution || new Array(7).fill(0);
  const dayEng = resonance.dayEngagement || new Array(7).fill(0);
  const hourDist = resonance.hourDistribution || new Array(24).fill(0);
  const hourEng = resonance.hourEngagement || new Array(24).fill(0);
  const mediaLift = resonance.mediaLift || 0;
  const rows = resonance.recentPatternRows || [];
  const half = Math.floor(rows.length / 2);
  const f1 = rows.slice(0, half).reduce((s, r) => s + (r.interactions || 0), 0) / Math.max(half, 1);
  const f2 = rows.slice(half).reduce((s, r) => s + (r.interactions || 0), 0) / Math.max(half, 1);
  const mDelta = f1 > 0 ? Math.round(((f2 - f1) / f1) * 100) : 0;
  const mPos = mDelta >= 0;

  const TABS = [{ id: 'growth' as const, label: 'Growth', icon: <TrendingUp size={13} /> }, { id: 'audience' as const, label: 'Audience', icon: <Globe size={13} /> }, { id: 'roi' as const, label: 'Content ROI', icon: <BarChart3 size={13} /> }, { id: 'meta' as const, label: 'Meta Review', icon: <ShieldCheck size={13} /> }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'Inter,system-ui,sans-serif' }}>

      {/* Dark Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        style={{ borderRadius: 20, background: 'linear-gradient(135deg,#0F0A08,#1C1008,#0F0A08)', border: '1px solid rgba(255,255,255,0.07)', padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(196,162,101,0.7)', letterSpacing: '0.12em' }}>BUSINESS INTELLIGENCE</p>
              {hasReal ? <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', padding: '1px 8px', borderRadius: 20 }}>● LIVE DATA</span> : <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '1px 8px', borderRadius: 20 }}>ALGORITHMIC</span>}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginTop: 4, lineHeight: 1.1 }}>Analytics Lab</h2>
          </div>
          {onSync && <button onClick={onSync} disabled={isSyncing} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: isSyncing ? 'rgba(255,255,255,0.3)' : '#C4A265', background: 'rgba(196,162,101,0.08)', border: '1px solid rgba(196,162,101,0.2)', padding: '6px 14px', borderRadius: 20, cursor: isSyncing ? 'default' : 'pointer' }}>
            <RefreshCw size={12} />{isSyncing ? 'Syncing…' : 'Sync Live'}
          </button>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { label: 'TOTAL INTERACTIONS', val: <AnimCount value={totalI} color="#C4A265" size={26} />, sub: `across ${resonance.totalPosts} posts` },
            { label: 'AVG PER POST', val: <AnimCount value={avgI} color="white" size={26} />, sub: hasReal ? 'live from platform' : 'estimated' },
            { label: 'MOMENTUM', val: <span style={{ fontSize: 26, fontWeight: 900, color: mPos ? '#10B981' : '#EF4444', lineHeight: 1 }}>{mPos ? '+' : ''}{mDelta}%</span>, sub: 'recent vs earlier posts' },
            { label: 'MEDIA LIFT', val: <AnimCount value={Math.abs(mediaLift)} prefix={mediaLift > 0 ? '+' : ''} suffix="%" color={mediaLift > 0 ? '#10B981' : 'rgba(255,255,255,0.4)'} size={26} />, sub: mediaLift > 0 ? 'posts with visuals' : 'add media to unlock' },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 8.5, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: 6 }}>{kpi.label}</p>
              {kpi.val}
              <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{kpi.sub}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 3, padding: 4, background: 'rgba(15,10,8,0.95)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: tab === t.id ? 'rgba(196,162,101,0.14)' : 'transparent', color: tab === t.id ? '#C4A265' : 'rgba(255,255,255,0.35)' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {tab === 'growth' && (
          <motion.div key="growth" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ borderRadius: 16, background: '#0F0A08', border: '1px solid rgba(255,255,255,0.07)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div><p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(196,162,101,0.7)', letterSpacing: '0.07em', marginBottom: 3 }}>ENGAGEMENT TRAJECTORY</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Each dot = one post. Size = views. Color = hook type. Dashed = trend.</p></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>{Object.entries(HOOK_COLORS).slice(0, 4).map(([type, color]) => (<div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} /><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize' }}>{type}</span></div>))}</div>
              </div>
              <EngagementScatter posts={posts} />
            </div>
            <div style={{ borderRadius: 16, background: '#0F0A08', border: '1px solid rgba(255,255,255,0.07)', padding: '18px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(196,162,101,0.7)', letterSpacing: '0.07em', marginBottom: 4 }}>PLATFORM ROI BREAKDOWN</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Net interactions per network — sorted by total business value delivered</p>
              <ROIWaterfall posts={posts} />
            </div>
          </motion.div>
        )}

        {tab === 'audience' && (
          <motion.div key="audience" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, borderRadius: 16, background: '#0F0A08', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(196,162,101,0.7)', letterSpacing: '0.07em', marginBottom: 10 }}>AUDIENCE PULSE CLOCK</p>
                <PulseClock hourEngagement={hourEng} hourDistribution={hourDist} hasReal={hasReal} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div><p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(196,162,101,0.7)', letterSpacing: '0.07em', marginBottom: 10 }}>DAY-OF-WEEK ACTIVITY</p><DayRadialStrip dayEngagement={dayEng} dayDistribution={dayDist} hasReal={hasReal} /></div>
                {resonance.bestDay && resonance.bestHour && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: '#3B82F6', letterSpacing: '0.06em', marginBottom: 3 }}>PEAK DAY</p>
                      <p style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{resonance.bestDay.name}</p>
                      <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)' }}>{resonance.bestDay.interactions ? `${resonance.bestDay.interactions} interactions` : `${resonance.bestDay.count} posts`}</p>
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.06em', marginBottom: 3 }}>PEAK WINDOW</p>
                      <p style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{resonance.bestHour.label}</p>
                      <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)' }}>{resonance.bestHour.interactions ? `${resonance.bestHour.interactions} interactions` : `${resonance.bestHour.count} posts`}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ borderRadius: 16, background: '#0F0A08', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(196,162,101,0.7)', letterSpacing: '0.07em', marginBottom: 4 }}>NETWORK GRAVITY MAP</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Bubbles sized by total interactions. Lines = cross-network overlap.</p>
              <NetworkBubbles posts={posts} />
            </div>
          </motion.div>
        )}

        {tab === 'roi' && (
          <motion.div key="roi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ borderRadius: 16, background: '#0F0A08', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(196,162,101,0.7)', letterSpacing: '0.07em', marginBottom: 4 }}>EFFORT × RETURN MATRIX</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>X = word count (effort), Y = interactions (return). Top-left = highest ROI.</p>
              <EffortReturnMatrix posts={posts} avgWordCount={resonance.avgWordCount || 100} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                {[{ label: '✦ Quick Wins', desc: 'Short + high engagement. Your goldmine.', color: '#10B981' }, { label: 'Deep Value', desc: 'Long + high engagement. Authority content.', color: '#C4A265' }, { label: 'Warm Up', desc: 'Short + low engagement. Build frequency.', color: 'rgba(255,255,255,0.3)' }, { label: 'Wasted Effort', desc: 'Long + low engagement. Cut or repurpose.', color: '#EF4444' }].map(q => (
                  <div key={q.label} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: q.color, marginBottom: 2 }}>{q.label}</p>
                    <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1.45 }}>{q.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: 16, background: '#0F0A08', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(196,162,101,0.7)', letterSpacing: '0.07em', marginBottom: 4 }}>HOOK ROI RANKING</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Ranked by average interactions per post. Cumulative business value shown.</p>
              <HookROIRanking hooks={resonance.hookBreakdown} avgInteractions={avgI} />
            </div>
          </motion.div>
        )}

        {tab === 'meta' && (
          <motion.div key="meta" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            style={{ borderRadius: 16, background: '#0F0A08', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <ShieldCheck size={18} style={{ color: '#8B5CF6' }} />
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(139,92,246,0.8)', letterSpacing: '0.07em' }}>META APP REVIEW</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Permission status, webhook health, and video recording checklist for Meta approval</p>
              </div>
            </div>
            <MetaPermissionBoard autoEnabled={autoEnabled} />
          </motion.div>
        )}

      </AnimatePresence>

      <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.18)', textAlign: 'center', paddingBottom: 2 }}>
        Analytics Lab · Business outcomes layer · Distinct from Post DNA (content pattern analysis)
      </p>
    </div>
  );
}
