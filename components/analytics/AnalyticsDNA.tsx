'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { RefreshCw, TrendingUp, Activity, BarChart3, Zap, Globe, Info, ArrowRight, Target, Layers, Award } from 'lucide-react';

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
  samples?: string[]; topPostSnippet?: string; hasRealData?: boolean;
};
type ResonanceData = {
  hasData: boolean; hasRealEngagement?: boolean; totalPosts: number; totalInteractions?: number;
  avgInteractionsPerPost?: number; topHook?: string; hookBreakdown: HookItem[];
  bestDay: { day: number; name: string; count: number; interactions?: number } | null;
  bestHour: { hour: number; label: string; count: number; interactions?: number } | null;
  dayDistribution?: number[]; dayEngagement?: number[];
  hourDistribution?: number[]; hourEngagement?: number[];
  avgWordCount?: number; mediaRatio?: number; mediaLift?: number;
  recommendations?: Array<{ id: string; title: string; desc: string; type: 'hook' | 'timing' | 'format' | 'growth' }>;
  recentPatternRows?: Array<{ interactions?: number }>;
};

const BG = '#FAF7F2';
const CARD = '#FFFFFF';
const BORDER = '#E8E0D4';
const TEXT_PRIMARY = '#3D2B1F';
const TEXT_MED = '#6B5744';
const TEXT_MUTED = '#8B7355';
const GOLD = '#C4A265';
const GOLD_BG = '#F5EDE0';

const HOOK_COLORS: Record<string, string> = {
  statement: '#B48C48', question: '#3B82F6', statistic: '#10B981',
  story: '#EC4899', contrarian: '#EF4444', framework: '#8B5CF6', unknown: '#9CA3AF',
};
const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C', linkedin: '#0A66C2', twitter: '#1DA1F2',
  facebook: '#1877F2', tiktok: '#555555', youtube: '#FF0000',
};

function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Info size={13} style={{ color: TEXT_MUTED, cursor: 'help', flexShrink: 0 }} />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', width: 224, padding: '9px 12px', background: '#2D1F14', color: '#FAF7F2', borderRadius: 10, fontSize: 11, lineHeight: 1.6, zIndex: 9999, fontWeight: 400, boxShadow: '0 8px 28px rgba(0,0,0,0.22)', pointerEvents: 'none' }}
          >
            {text}
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #2D1F14' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionHeader({ label, tip, sub }: { label: string; tip: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
        <InfoTip text={tip} />
      </div>
      {sub && <p style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function AnimCount({ value, prefix = '', suffix = '', size = 28, color = TEXT_PRIMARY }: { value: number; prefix?: string; suffix?: string; size?: number; color?: string }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    let raf: number;
    const t0 = Date.now();
    const tick = () => { const p = Math.min((Date.now() - t0) / 800, 1); setD(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span style={{ fontSize: size, fontWeight: 900, color, lineHeight: 1 }}>{prefix}{d >= 1000 ? ${String((d / 1000).toFixed(1))}k : d}{suffix}</span>;
}

function KPICard({ label, val, sub, tip, accent = false }: { label: string; val: React.ReactNode; sub: string; tip: string; accent?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: '14px 16px', borderRadius: 14, background: accent ? GOLD_BG : CARD, border: 1px solid , boxShadow: '0 1px 4px rgba(61,43,31,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
        <p style={{ fontSize: 9.5, fontWeight: 800, color: accent ? '#9A7235' : TEXT_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
        <InfoTip text={tip} />
      </div>
      {val}
      <p style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 4 }}>{sub}</p>
    </motion.div>
  );
}

function EngagementScatter({ posts }: { posts: SignalPost[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hov, setHov] = useState<{ x: number; y: number; post: SignalPost } | null>(null);
  const pp = useMemo(() => posts.filter(p => p.variants.some(v => v.status === 'published')).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).slice(-40), [posts]);
  const mxI = useMemo(() => Math.max(...pp.map(p => p.engagement?.total || 0), 1), [pp]);
  const mxV = useMemo(() => Math.max(...pp.map(p => p.engagement?.views || 0), 1), [pp]);
  const gc = useCallback((p: SignalPost, idx: number, W: number, H: number, PAD: number) => ({ cx: PAD + (idx / Math.max(pp.length - 1, 1)) * (W - PAD * 2), cy: H - PAD - ((p.engagement?.total || 0) / mxI) * (H - PAD * 2), r: 6 + ((p.engagement?.views || 0) / mxV) * 10 }), [pp, mxI, mxV]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pp.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr; ctx.scale(dpr, dpr);
    const LW = canvas.offsetWidth, LH = canvas.offsetHeight, PAD = 40;
    let raf: number, t0: number | null = null;
    const draw = (ts: number) => {
      if (!t0) t0 = ts;
      const ease = Math.min(1 - Math.pow(1 - Math.min((ts - t0) / 800, 1), 3), 1);
      ctx.clearRect(0, 0, LW, LH);
      ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = PAD + (i / 4) * (LH - PAD * 2);
        ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(LW - PAD, y); ctx.stroke();
        const val = Math.round((mxI / 4) * (4 - i));
        ctx.fillStyle = TEXT_MUTED; ctx.font = '500 9px Inter,system-ui'; ctx.textAlign = 'right';
        ctx.fillText(val > 999 ? ${String((val / 1000).toFixed(1))}k : String(val), PAD - 6, y + 3);
      }
      if (pp.length >= 3) {
        const coords = pp.map((p, i) => gc(p, i, LW, LH, PAD));
        const n = coords.length, sx = coords.reduce((s, c) => s + c.cx, 0), sy = coords.reduce((s, c) => s + c.cy, 0);
        const sxy = coords.reduce((s, c) => s + c.cx * c.cy, 0), sx2 = coords.reduce((s, c) => s + c.cx * c.cx, 0);
        const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx), inter = (sy - slope * sx) / n;
        const x1 = PAD, x2 = LW - PAD, up = slope < 0;
        ctx.strokeStyle = up ? '#16a34a' : '#dc2626'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(x1, slope * x1 + inter); ctx.lineTo(x2, slope * x2 + inter); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = up ? '#16a34a' : '#dc2626'; ctx.font = '700 9px Inter,system-ui'; ctx.textAlign = 'right';
        ctx.fillText(up ? 'GROWING' : 'PLATEAU', LW - PAD - 4, slope * x2 + inter - 7);
      }
      pp.forEach((post, idx) => {
        const { cx, cy, r } = gc(post, idx, LW, LH, PAD);
        const animCy = LH - PAD - (LH - PAD - cy) * ease;
        const color = HOOK_COLORS[post.hookType || 'unknown'] || '#9CA3AF';
        ctx.beginPath(); ctx.arc(cx, animCy, r * ease, 0, Math.PI * 2);
        ctx.fillStyle = post.engagement?.hasRealData ? ${color}CC : ${color}55; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, animCy, r * ease, 0, Math.PI * 2); ctx.stroke();
      });
      if (ease < 1) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [pp, gc, mxI]);

  const onMM = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || pp.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const LW = canvas.offsetWidth, LH = canvas.offsetHeight, PAD = 40;
    for (let i = pp.length - 1; i >= 0; i--) {
      const { cx, cy, r } = gc(pp[i], i, LW, LH, PAD);
      if (Math.hypot(mx - cx, my - cy) < r + 5) { setHov({ x: e.clientX, y: e.clientY, post: pp[i] }); return; }
    }
    setHov(null);
  }, [pp, gc]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 200, display: 'block', cursor: 'crosshair', borderRadius: 8, background: BG }} onMouseMove={onMM} onMouseLeave={() => setHov(null)} />
      {hov && (
        <div style={{ position: 'fixed', top: hov.y - 10, left: hov.x + 14, zIndex: 9999, background: CARD, border: 1px solid , borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 20px rgba(61,43,31,0.14)', fontSize: 11, pointerEvents: 'none', maxWidth: 200 }}>
          <p style={{ fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 2, textTransform: 'capitalize' }}>{hov.post.hookType || 'statement'} hook</p>
          <p style={{ color: TEXT_MED, marginBottom: 4 }}>{hov.post.content.slice(0, 55)}...</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontWeight: 700, color: TEXT_PRIMARY }}>{(hov.post.engagement?.total || 0).toLocaleString()} interactions</span>
            <span style={{ color: TEXT_MUTED }}>{(hov.post.engagement?.views || 0).toLocaleString()} views</span>
          </div>
        </div>
      )}
    </div>
  );
}

function HourBars({ hourEngagement, hourDistribution, hasReal }: { hourEngagement: number[]; hourDistribution: number[]; hasReal: boolean }) {
  const data = hasReal ? hourEngagement : hourDistribution;
  const max = Math.max(...data, 1);
  const labels = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 88 }}>
        {data.map((val, i) => { const pct = (val / max) * 100; return (<div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: '100%' }}><motion.div initial={{ height: 0 }} animate={{ height: ${pct}% }} transition={{ delay: i * 0.018, duration: 0.45, ease: 'easeOut' }} style={{ width: '100%', minHeight: val > 0 ? 2 : 0, background: pct > 60 ? GOLD : ${GOLD}44, borderRadius: '3px 3px 0 0' }} /></div>); })}
      </div>
      <div style={{ height: 1, background: BORDER, marginBottom: 5 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {labels.map(l => <span key={l} style={{ fontSize: 9, color: TEXT_MUTED, fontWeight: 500 }}>{l}</span>)}
      </div>
    </div>
  );
}

function DayBars({ dayEngagement, dayDistribution, hasReal }: { dayEngagement: number[]; dayDistribution: number[]; hasReal: boolean }) {
  const data = hasReal ? dayEngagement : dayDistribution;
  const max = Math.max(...data, 1);
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
      {data.map((val, i) => { const pct = val / max; const isTop = pct > 0.7; return (<div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}><div style={{ height: 64, width: '100%', display: 'flex', alignItems: 'flex-end' }}><motion.div initial={{ height: 0 }} animate={{ height: ${pct * 100}% }} transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }} style={{ width: '100%', minHeight: val > 0 ? 3 : 0, background: isTop ? linear-gradient(180deg,,#D4A855) : ${GOLD}38, borderRadius: '4px 4px 0 0' }} /></div><span style={{ fontSize: 9.5, fontWeight: isTop ? 800 : 500, color: isTop ? TEXT_PRIMARY : TEXT_MUTED }}>{DAYS[i]}</span></div>); })}
    </div>
  );
}

function PlatformBreakdown({ posts }: { posts: SignalPost[] }) {
  const data = useMemo(() => {
    const map: Record<string, { interactions: number; posts: number; hasReal: boolean; views: number }> = {};
    for (const post of posts) {
      for (const v of post.variants) {
        if (v.status !== 'published') continue;
        const p = v.platform.toLowerCase();
        if (!map[p]) map[p] = { interactions: 0, posts: 0, hasReal: false, views: 0 };
        map[p].posts++;
        if (v.engagement) { map[p].interactions += v.engagement.totalInteractions || 0; map[p].views += v.engagement.views || 0; if (v.engagement.hasRealData) map[p].hasReal = true; }
      }
    }
    return Object.entries(map).map(([platform, d]) => ({ platform, ...d })).sort((a, b) => b.interactions - a.interactions);
  }, [posts]);
  const maxI = Math.max(...data.map(d => d.interactions), 1);
  if (data.length === 0) return <p style={{ textAlign: 'center', padding: '20px 0', color: TEXT_MUTED, fontSize: 12 }}>No platform data yet.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((row, i) => {
        const color = PLATFORM_COLORS[row.platform] || GOLD;
        return (
          <motion.div key={row.platform} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: ${color}14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 12, fontWeight: 800, color }}>{row.platform[0].toUpperCase()}</span></div>
                <div><p style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, textTransform: 'capitalize' }}>{row.platform}</p><p style={{ fontSize: 10, color: TEXT_MUTED }}>{row.posts} posts{row.hasReal ? ' · live' : ''}</p></div>
              </div>
              <div style={{ textAlign: 'right' }}><p style={{ fontSize: 15, fontWeight: 900, color: TEXT_PRIMARY }}>{row.interactions.toLocaleString()}</p><p style={{ fontSize: 10, color: TEXT_MUTED }}>{row.views.toLocaleString()} views</p></div>
            </div>
            <div style={{ height: 5, background: BORDER, borderRadius: 4, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: ${(row.interactions / maxI) * 100}% }} transition={{ delay: i * 0.06 + 0.2, duration: 0.55, ease: 'easeOut' }} style={{ height: '100%', background: linear-gradient(90deg,88,), borderRadius: 4 }} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function EffortMatrix({ posts, avgWordCount }: { posts: SignalPost[]; avgWordCount: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hov, setHov] = useState<{ x: number; y: number; snippet: string; wc: number; int: number } | null>(null);
  const pts = useMemo(() => posts.filter(p => p.variants.some(v => v.status === 'published') && (p.wordCount || 0) > 0).map(p => ({ wc: p.wordCount || 0, int: p.engagement?.total || 0, hasReal: !!p.engagement?.hasRealData, snippet: p.content.slice(0, 55) })), [posts]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pts.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr; ctx.scale(dpr, dpr);
    const W = canvas.offsetWidth, H = canvas.offsetHeight, PAD = 38;
    const mxW = Math.max(...pts.map(p => p.wc), 1), mxI = Math.max(...pts.map(p => p.int), 1);
    const midX = PAD + (avgWordCount / mxW) * (W - PAD * 2), midY = H / 2;
    ctx.clearRect(0, 0, W, H);
    const quads = [{ x: PAD, y: PAD, w: midX - PAD, h: midY - PAD, fill: '#F0FDF4', label: 'Quick Wins', tc: '#15803d' }, { x: midX, y: PAD, w: W - midX - PAD, h: midY - PAD, fill: '#FFFBEB', label: 'Deep Value', tc: '#92400e' }, { x: PAD, y: midY, w: midX - PAD, h: H - midY - PAD, fill: '#F9FAFB', label: 'Warm Up', tc: '#6b7280' }, { x: midX, y: midY, w: W - midX - PAD, h: H - midY - PAD, fill: '#FFF1F2', label: 'Wasted Effort', tc: '#be123c' }];
    quads.forEach(q => { ctx.fillStyle = q.fill; ctx.fillRect(q.x, q.y, q.w, q.h); ctx.fillStyle = q.tc; ctx.font = '600 9px Inter,system-ui'; ctx.textAlign = 'center'; ctx.fillText(q.label, q.x + q.w / 2, q.y + 14); });
    ctx.strokeStyle = '#D1C4B0'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(midX, PAD); ctx.lineTo(midX, H - PAD); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, midY); ctx.lineTo(W - PAD, midY); ctx.stroke();
    ctx.setLineDash([]);
    pts.forEach(p => {
      const cx = PAD + (p.wc / mxW) * (W - PAD * 2), cy = H - PAD - (p.int / mxI) * (H - PAD * 2);
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fillStyle = p.hasReal ? '#C4A265' : '#C4A26566'; ctx.fill();
      ctx.strokeStyle = '#9A7235'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.fillStyle = TEXT_MUTED; ctx.font = '500 9px Inter,system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Shorter', PAD + 24, H - 5); ctx.fillText('Longer', W - PAD - 24, H - 5);
  }, [pts, avgWordCount]);
  const onMM = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || pts.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const W = canvas.offsetWidth, H = canvas.offsetHeight, PAD = 38;
    const mxW = Math.max(...pts.map(p => p.wc), 1), mxI = Math.max(...pts.map(p => p.int), 1);
    for (const p of pts) {
      const cx = PAD + (p.wc / mxW) * (W - PAD * 2), cy = H - PAD - (p.int / mxI) * (H - PAD * 2);
      if (Math.hypot(mx - cx, my - cy) < 9) { setHov({ x: e.clientX, y: e.clientY, snippet: p.snippet, wc: p.wc, int: p.int }); return; }
    }
    setHov(null);
  }, [pts]);
  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 200, display: 'block', cursor: 'crosshair', borderRadius: 8 }} onMouseMove={onMM} onMouseLeave={() => setHov(null)} />
      {hov && (<div style={{ position: 'fixed', top: hov.y - 8, left: hov.x + 14, zIndex: 9999, background: CARD, border: 1px solid , borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 20px rgba(61,43,31,0.14)', fontSize: 11, pointerEvents: 'none', maxWidth: 200 }}><p style={{ fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 3 }}>{hov.snippet}...</p><p style={{ color: TEXT_MED }}>{hov.wc} words / {hov.int} interactions</p></div>)}
    </div>
  );
}

function HookRanking({ hooks, avgInteractions }: { hooks: HookItem[]; avgInteractions: number }) {
  const ranked = [...hooks].sort((a, b) => (b.avgInteractions || 0) - (a.avgInteractions || 0));
  const maxAvg = Math.max(...ranked.map(h => h.avgInteractions || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {ranked.map((h, i) => {
        const avg = h.avgInteractions || 0, color = HOOK_COLORS[h.type] || '#9CA3AF';
        const vsBase = avgInteractions > 0 ? Math.round(((avg - avgInteractions) / avgInteractions) * 100) : 0;
        return (
          <motion.div key={h.type} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, textTransform: 'capitalize' }}>{h.type}</span>
                <span style={{ fontSize: 10, color: TEXT_MUTED }}>{h.count} posts</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: vsBase > 0 ? '#15803d' : vsBase < -10 ? '#be123c' : TEXT_MUTED, background: vsBase > 0 ? '#F0FDF4' : vsBase < -10 ? '#FFF1F2' : BG, border: 1px solid  }}>{vsBase > 0 ? '+' : ''}{vsBase}% vs avg</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: TEXT_PRIMARY, minWidth: 36, textAlign: 'right' }}>{avg.toFixed(1)}</span>
              </div>
            </div>
            <div style={{ height: 5, background: BORDER, borderRadius: 4, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: ${(avg / maxAvg) * 100}% }} transition={{ delay: i * 0.07 + 0.15, duration: 0.6, ease: 'easeOut' }} style={{ height: '100%', background: linear-gradient(90deg,88,), borderRadius: 4 }} />
            </div>
            {h.topPostSnippet && <p style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 3, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{h.topPostSnippet.slice(0, 64)}"</p>}
          </motion.div>
        );
      })}
    </div>
  );
}

function PlatformIntelligence({ posts }: { posts: SignalPost[] }) {
  const igPosts = posts.filter(p => p.variants.some(v => v.platform === 'instagram' && v.status === 'published'));
  const liPosts = posts.filter(p => p.variants.some(v => v.platform === 'linkedin' && v.status === 'published'));
  const igInt = igPosts.reduce((s, p) => s + (p.engagement?.total || 0), 0);
  const liInt = liPosts.reduce((s, p) => s + (p.engagement?.total || 0), 0);
  const igViews = igPosts.reduce((s, p) => s + (p.engagement?.views || 0), 0);
  const liViews = liPosts.reduce((s, p) => s + (p.engagement?.views || 0), 0);
  const bestHook = (platform: string) => {
    const ppts = posts.filter(p => p.variants.some(v => v.platform === platform && v.status === 'published'));
    const hm: Record<string, number> = {};
    ppts.forEach(p => { const h = p.hookType || 'statement'; hm[h] = (hm[h] || 0) + (p.engagement?.total || 0); });
    const best = Object.entries(hm).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : 'none yet';
  };
  const platforms = [
    { id: 'instagram', label: 'Instagram', color: '#E1306C', posts: igPosts.length, int: igInt, views: igViews, avg: igPosts.length > 0 ? (igInt / igPosts.length).toFixed(1) : 'n/a', hook: bestHook('instagram'), tip: 'Visual-first platform. Short captions with strong hooks and media drive algorithmic amplification. Comments and saves are the primary ranking signals.' },
    { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', posts: liPosts.length, int: liInt, views: liViews, avg: liPosts.length > 0 ? (liInt / liPosts.length).toFixed(1) : 'n/a', hook: bestHook('linkedin'), tip: 'Professional network. Long-form stories and framework posts drive the highest dwell time. Comments signal topical authority to the LinkedIn feed algorithm.' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {platforms.map((p, pi) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.08 }}
            style={{ padding: 16, borderRadius: 14, background: CARD, border: 1px solid , boxShadow: '0 1px 4px rgba(61,43,31,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: ${p.color}12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: p.color }}>{p.label[0]}</span>
              </div>
              <div style={{ flex: 1 }}><p style={{ fontSize: 13, fontWeight: 800, color: TEXT_PRIMARY }}>{p.label}</p><p style={{ fontSize: 10, color: TEXT_MUTED }}>{p.posts} posts published</p></div>
              <InfoTip text={p.tip} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{ label: 'Total Interactions', val: p.int.toLocaleString() }, { label: 'Avg Per Post', val: p.avg }, { label: 'Total Views', val: p.views.toLocaleString() }, { label: 'Best Hook', val: p.hook, cap: true }].map(item => (
                <div key={item.label} style={{ padding: '9px 10px', borderRadius: 10, background: BG, border: 1px solid  }}>
                  <p style={{ fontSize: 8.5, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 900, color: TEXT_PRIMARY, textTransform: item.cap ? 'capitalize' : 'none' }}>{item.val}</p>
                </div>
              ))}
            </div>
            {p.posts === 0 && <p style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 10, textAlign: 'center' }}>No posts published to {p.label} yet.</p>}
          </motion.div>
        ))}
      </div>
      <div style={{ padding: '16px 18px', borderRadius: 14, background: CARD, border: 1px solid  }}>
        <SectionHeader label="All Platforms — Interaction Breakdown" tip="Total interactions per platform across all published posts, ranked by business value." />
        <PlatformBreakdown posts={posts} />
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        style={{ padding: '14px 16px', borderRadius: 14, background: '#FFF7F8', border: '1px solid #FBD5DC' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#E1306C' }}>IG</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#9B1C3E', letterSpacing: '0.04em', marginBottom: 2 }}>INSTAGRAM GRAPH API STATUS</p>
            <p style={{ fontSize: 10.5, color: '#C0516B', lineHeight: 1.55 }}>
              {igPosts.length > 0 && igInt > 0 ? Live engagement active.  posts,  interactions synced. : igPosts.length > 0 ? ${igPosts.length} IG posts found. Connect Business account to sync live engagement. : 'Connect your Instagram Business account to enable real-time comment sync and live analytics.'}
            </p>
          </div>
          <InfoTip text="Instagram Graph API requires a Business or Creator account. Unool syncs likes, comments, reach, and impressions once connected. Comment automation requires instagram_manage_comments approval from Meta App Review." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
          {[{ label: 'Comment Sync', val: igInt > 0 ? 'Active' : 'Pending' }, { label: 'IG Posts', val: String(igPosts.length) }, { label: 'LinkedIn Posts', val: String(liPosts.length) }].map(item => (
            <div key={item.label} style={{ padding: '8px 10px', borderRadius: 10, background: 'white', border: '1px solid #FBD5DC' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#9B1C3E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: 900, color: TEXT_PRIMARY }}>{item.val}</p>
            </div>
          ))}
        </div>
        <Link href="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#E1306C', textDecoration: 'none' }}>Connect Social Accounts <ArrowRight size={11} /></Link>
      </motion.div>
    </div>
  );
}

export function AnalyticsDNA({ resonance, posts, onSync, isSyncing = false }: { resonance: ResonanceData | null; posts: SignalPost[]; onSync?: () => void; isSyncing?: boolean }) {
  const [tab, setTab] = useState<'growth' | 'audience' | 'roi' | 'platforms'>('growth');

  if (!resonance || !resonance.hasData || resonance.totalPosts === 0) {
    return (
      <div style={{ padding: '52px 24px', textAlign: 'center', background: CARD, borderRadius: 20, border: 1px solid , boxShadow: '0 1px 6px rgba(61,43,31,0.06)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: GOLD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Activity size={24} style={{ color: GOLD }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 8 }}>Analytics Engine Ready</h3>
        <p style={{ fontSize: 13, color: TEXT_MUTED, maxWidth: 340, margin: '0 auto 24px', lineHeight: 1.65 }}>Publish your first post. Each dispatch builds real business intelligence — growth curves, ROI matrix, platform breakdown, and audience timing.</p>
        <Link href="/dashboard/composer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, background: GOLD, color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
          Open Studio <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const totalI = resonance.totalInteractions || 0;
  const avgI = resonance.avgInteractionsPerPost || 0;
  const hasReal = !!resonance.hasRealEngagement;
  const dayEng = resonance.dayEngagement || new Array(7).fill(0);
  const dayDist = resonance.dayDistribution || new Array(7).fill(0);
  const hourEng = resonance.hourEngagement || new Array(24).fill(0);
  const hourDist = resonance.hourDistribution || new Array(24).fill(0);
  const mediaLift = resonance.mediaLift || 0;
  const rows = resonance.recentPatternRows || [];
  const half = Math.floor(rows.length / 2);
  const f1 = rows.slice(0, half).reduce((s, r) => s + (r.interactions || 0), 0) / Math.max(half, 1);
  const f2 = rows.slice(half).reduce((s, r) => s + (r.interactions || 0), 0) / Math.max(half, 1);
  const mDelta = f1 > 0 ? Math.round(((f2 - f1) / f1) * 100) : 0;

  const TABS = [
    { id: 'growth' as const, label: 'Growth', icon: <TrendingUp size={13} /> },
    { id: 'audience' as const, label: 'Audience', icon: <Globe size={13} /> },
    { id: 'roi' as const, label: 'Content ROI', icon: <BarChart3 size={13} /> },
    { id: 'platforms' as const, label: 'Platforms', icon: <Layers size={13} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Inter,system-ui,sans-serif' }}>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26 }}
        style={{ borderRadius: 18, background: CARD, border: 1px solid , padding: '20px 22px', boxShadow: '0 1px 6px rgba(61,43,31,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Analytics Lab</p>
              {hasReal ? <span style={{ fontSize: 9, fontWeight: 700, color: '#15803d', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1px 8px', borderRadius: 20 }}>Live Data</span> : <span style={{ fontSize: 9, fontWeight: 600, color: TEXT_MUTED, background: BG, border: 1px solid , padding: '1px 8px', borderRadius: 20 }}>Algorithmic</span>}
              <InfoTip text={hasReal ? 'Live engagement pulled directly from Instagram and LinkedIn APIs — every number is real.' : 'Connect Instagram Business and LinkedIn to unlock real-time sync. Currently showing pattern estimates.'} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: TEXT_PRIMARY, lineHeight: 1.1 }}>Business Intelligence</h2>
          </div>
          {onSync && <button onClick={onSync} disabled={isSyncing} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: isSyncing ? TEXT_MUTED : TEXT_PRIMARY, background: GOLD_BG, border: '1px solid #E8C98B', padding: '7px 16px', borderRadius: 20, cursor: isSyncing ? 'default' : 'pointer', transition: 'all 0.15s' }}><RefreshCw size={12} />{isSyncing ? 'Syncing...' : 'Sync Live'}</button>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <KPICard label="Total Interactions" accent val={<AnimCount value={totalI} color={GOLD} size={26} />} sub={cross  posts} tip="Total likes + comments + shares across all platforms for all published posts." />
          <KPICard label="Avg Per Post" val={<AnimCount value={Math.round(avgI)} color={TEXT_PRIMARY} size={26} />} sub={hasReal ? 'live from platform' : 'estimated'} tip="Average engagement per published post. Higher = stronger content-market fit with your audience." />
          <KPICard label="Momentum" val={<span style={{ fontSize: 26, fontWeight: 900, color: mDelta >= 0 ? '#15803d' : '#be123c', lineHeight: 1 }}>{mDelta >= 0 ? '+' : ''}{mDelta}%</span>} sub="recent vs earlier posts" tip="Compares your recent posts avg interactions against your older posts. Positive = your content is improving." />
          <KPICard label="Media Lift" val={<AnimCount value={Math.abs(mediaLift)} prefix={mediaLift > 0 ? '+' : ''} suffix="%" color={mediaLift > 0 ? '#15803d' : TEXT_MUTED} size={26} />} sub={mediaLift > 0 ? 'visuals beat text-only' : 'add media to unlock'} tip="How much more engagement posts with images or video get vs text-only. Calculated from your actual published content." />
        </div>
      </motion.div>

      <div style={{ display: 'flex', gap: 2, padding: 4, background: '#F0EBE3', borderRadius: 14, border: 1px solid  }}>
        {TABS.map(t => (<button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: tab === t.id ? '#FFFFFF' : 'transparent', color: tab === t.id ? TEXT_PRIMARY : TEXT_MUTED, boxShadow: tab === t.id ? '0 1px 4px rgba(61,43,31,0.08)' : 'none' }}>{t.icon}{t.label}</button>))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'growth' && (
          <motion.div key="growth" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ borderRadius: 16, background: CARD, border: 1px solid , padding: '18px 20px', boxShadow: '0 1px 4px rgba(61,43,31,0.05)' }}>
              <SectionHeader label="Engagement Trajectory" tip="Each dot = one published post. Size = views. Color = hook type. Dashed trend line (green = growing, red = plateau). Hover any dot for details." sub="Timeline left to right — see how your engagement evolves post by post." />
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                {Object.entries(HOOK_COLORS).slice(0, 5).map(([type, color]) => (<div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} /><span style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'capitalize' }}>{type}</span></div>))}
              </div>
              <EngagementScatter posts={posts} />
            </div>
            {resonance.recommendations && resonance.recommendations.length > 0 && (
              <div style={{ borderRadius: 16, background: CARD, border: 1px solid , padding: '18px 20px', boxShadow: '0 1px 4px rgba(61,43,31,0.05)' }}>
                <SectionHeader label="AI Prescriptions" tip="Built from your actual post patterns, hook performance, and real engagement signals — not generic advice." sub="Specific actions to improve your next post." />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {resonance.recommendations.map((rec, i) => {
                    const tc: Record<string, string> = { hook: '#8B5CF6', timing: '#3B82F6', format: '#10B981', growth: GOLD };
                    const c = tc[rec.type] || GOLD;
                    return (
                      <motion.div key={rec.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, background: BG, border: 1px solid  }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: ${c}14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}><Zap size={13} style={{ color: c }} /></div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <p style={{ fontSize: 12, fontWeight: 800, color: TEXT_PRIMARY }}>{rec.title}</p>
                            <span style={{ fontSize: 9, fontWeight: 700, color: c, background: ${c}12, padding: '1px 6px', borderRadius: 10, textTransform: 'uppercase' }}>{rec.type}</span>
                          </div>
                          <p style={{ fontSize: 11.5, color: TEXT_MED, lineHeight: 1.6 }}>{rec.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'audience' && (
          <motion.div key="audience" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ borderRadius: 16, background: CARD, border: 1px solid , padding: '18px 20px', boxShadow: '0 1px 4px rgba(61,43,31,0.05)' }}>
              <SectionHeader label="24-Hour Activity Window" tip="Bars show engagement density per 3-hour slot. Taller = more activity at that hour. Schedule your best content at peak windows." sub="When your audience engages most — schedule flagship posts here." />
              <HourBars hourEngagement={hourEng} hourDistribution={hourDist} hasReal={hasReal} />
              {resonance.bestHour && (<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 12px', borderRadius: 10, background: GOLD_BG, border: '1px solid #E8C98B' }}><Award size={13} style={{ color: GOLD }} /><p style={{ fontSize: 11.5, color: TEXT_PRIMARY, fontWeight: 700 }}>Peak window: <span style={{ color: GOLD }}>{resonance.bestHour.label}</span>{resonance.bestHour.interactions ?  ·  interactions : ''}</p></div>)}
            </div>
            <div style={{ borderRadius: 16, background: CARD, border: 1px solid , padding: '18px 20px', boxShadow: '0 1px 4px rgba(61,43,31,0.05)' }}>
              <SectionHeader label="Day-of-Week Performance" tip="Your engagement split by weekday. Gold bars = your strongest days. Schedule high-effort content on these days." sub="Your audience is most active on highlighted days." />
              <DayBars dayEngagement={dayEng} dayDistribution={dayDist} hasReal={hasReal} />
              {resonance.bestDay && (<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 12px', borderRadius: 10, background: GOLD_BG, border: '1px solid #E8C98B' }}><Target size={13} style={{ color: GOLD }} /><p style={{ fontSize: 11.5, color: TEXT_PRIMARY, fontWeight: 700 }}>Peak day: <span style={{ color: GOLD }}>{resonance.bestDay.name}</span>{resonance.bestDay.interactions ?  ·  total interactions : ''}</p></div>)}
            </div>
            <div style={{ borderRadius: 16, background: CARD, border: 1px solid , padding: '18px 20px', boxShadow: '0 1px 4px rgba(61,43,31,0.05)' }}>
              <SectionHeader label="Media vs Text-Only" tip="Compare engagement between posts with images/video vs pure text. Media Lift = how much more interactions you get when adding a visual." />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { label: 'Media Ratio', val: ${resonance.mediaRatio || 0}%, sub: 'posts include media', tip: 'Percentage of your published posts that include an image, video, or carousel.' },
                  { label: 'Media Lift', val: mediaLift > 0 ? +% : mediaLift < 0 ? ${mediaLift}% : 'n/a', sub: 'vs text-only posts', tip: 'How much more engagement posts with media get vs text-only. Positive = visuals help you win.' },
                  { label: 'Avg Word Count', val: String(resonance.avgWordCount || 0), sub: 'words per post', tip: 'Average words across all published posts. Identifies whether you lean short-punchy or long-form.' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '12px 14px', borderRadius: 12, background: BG, border: 1px solid  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{item.label}</p>
                      <InfoTip text={item.tip} />
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 900, color: TEXT_PRIMARY, lineHeight: 1 }}>{item.val}</p>
                    <p style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 3 }}>{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'roi' && (
          <motion.div key="roi" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ borderRadius: 16, background: CARD, border: 1px solid , padding: '18px 20px', boxShadow: '0 1px 4px rgba(61,43,31,0.05)' }}>
              <SectionHeader label="Effort x Return Matrix" tip="X-axis = word count (writing effort). Y-axis = interactions (engagement return). Top-left = Quick Wins (short + high engagement). Bottom-right = Wasted Effort. Hover any dot." sub="Find your highest ROI content format — where to put your energy." />
              <EffortMatrix posts={posts} avgWordCount={resonance.avgWordCount || 100} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                {[{ label: 'Quick Wins', desc: 'Short + high engagement. Your goldmine.', color: '#15803d', bg: '#F0FDF4' }, { label: 'Deep Value', desc: 'Long + high engagement. Authority content.', color: '#92400e', bg: '#FFFBEB' }, { label: 'Warm Up', desc: 'Short + low engagement. Build frequency.', color: TEXT_MUTED, bg: BG }, { label: 'Wasted Effort', desc: 'Long + low engagement. Cut or repurpose.', color: '#be123c', bg: '#FFF1F2' }].map(q => (
                  <div key={q.label} style={{ padding: '9px 11px', borderRadius: 10, background: q.bg, border: 1px solid  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: q.color, marginBottom: 2 }}>{q.label}</p>
                    <p style={{ fontSize: 10, color: TEXT_MUTED, lineHeight: 1.45 }}>{q.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: 16, background: CARD, border: 1px solid , padding: '18px 20px', boxShadow: '0 1px 4px rgba(61,43,31,0.05)' }}>
              <SectionHeader label="Hook ROI Ranking" tip="Each hook type ranked by average interactions per post. Green badge = above your channel average. Top-performing post snippet shown per hook." sub="Use your top hook more — it is your proven signal." />
              <HookRanking hooks={resonance.hookBreakdown} avgInteractions={avgI} />
            </div>
          </motion.div>
        )}

        {tab === 'platforms' && (
          <motion.div key="platforms" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
            <PlatformIntelligence posts={posts} />
          </motion.div>
        )}
      </AnimatePresence>

      <p style={{ fontSize: 9.5, color: TEXT_MUTED, textAlign: 'center', paddingBottom: 2 }}>
        Analytics Lab · Business outcomes · Instagram and LinkedIn Graph API
      </p>
    </div>
  );
}
