'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink, RefreshCw, AlertCircle, CheckCircle, Clock, Zap,
  TrendingUp, BarChart2, Calendar, Sparkles, Pencil, Trash2, Loader2,
  FileText, Activity, Target, Flame, ArrowUpRight, Layers, Eye,
  Award, PieChart, Hash, Type, BarChart3, HelpCircle, Info,
  Share2, Search, Filter, Check, ChevronRight, ChevronDown,
  BookOpen, ShieldCheck, ArrowRight, Compass, Wand2, Copy, Link2, X
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

import { PlatformLogos, getPlatformConfig } from '@/components/dashboard/PlatformLogos';

/* ── Types ─────────────────────────────────────────────────────────────────── */
type PostVariant = {
  id: string;
  platform: string;
  status: string;
  platformUrl: string | null;
  platformPostId: string | null;
  characterCount: number;
  error: any;
  createdAt: string;
  updatedAt: string;
};

type SignalPost = {
  id: string;
  content: string;
  status: string;
  hookType: string | null;
  wordCount: number | null;
  hasMedia: boolean;
  createdAt: string;
  publishedAt: string | null;
  variants: PostVariant[];
};

type ResonanceData = {
  hasData: boolean;
  totalPosts: number;
  hookBreakdown: Array<{
    type: string;
    count: number;
    avgSuccess: number;
    samples?: string[];
  }>;
  bestDay: { day: number; name: string; count: number } | null;
  bestHour: { hour: number; label: string; count: number } | null;
  dayDistribution?: number[];
  hourDistribution?: number[];
  avgWordCount?: number;
  mediaRatio?: number;
  resonanceScore?: number;
  recommendations?: Array<{
    id: string;
    title: string;
    desc: string;
    type: 'hook' | 'timing' | 'format' | 'growth';
  }>;
  recentPatternRows?: Array<{
    id?: string;
    contentSnippet?: string;
    hookType: string;
    wordCount: number;
    dayOfWeek: number;
    hourOfDay: number;
    hasMedia: boolean;
    successRate: number;
    publishedCount: number;
    totalPlatforms?: number;
    status?: string;
  }>;
};

/* ── Hook Archetype Metadata ───────────────────────────────────────────────── */
const HOOK_META: Record<string, { label: string; desc: string; icon: React.ReactNode; color: string; bg: string; text: string }> = {
  statement: {
    label: 'Bold Statement',
    desc: 'Uncompromising assertion that commands authority.',
    icon: <Type className="w-3.5 h-3.5" />,
    color: '#B48C48',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
  },
  question: {
    label: 'Curiosity Question',
    desc: 'Intriguing opener that compels the mind to search for an answer.',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    color: '#3B82F6',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
  },
  statistic: {
    label: 'Data / Statistic',
    desc: 'Hard metric or percentage that anchors intellectual credibility.',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    color: '#10B981',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
  },
  story: {
    label: 'Personal Narrative',
    desc: 'First-person journey creating emotional resonance and empathy.',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: '#EC4899',
    bg: 'bg-pink-50',
    text: 'text-pink-800',
  },
  contrarian: {
    label: 'Contrarian Angle',
    desc: 'Challenging conventional wisdom to disrupt crowded feeds.',
    icon: <Flame className="w-3.5 h-3.5" />,
    color: '#EF4444',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
  },
  framework: {
    label: 'Framework / Steps',
    desc: 'Systematized blueprint that inspires saves and bookmarks.',
    icon: <Layers className="w-3.5 h-3.5" />,
    color: '#8B5CF6',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
  },
  unknown: {
    label: 'Standard Dispatch',
    desc: 'Balanced conversational dispatch.',
    icon: <FileText className="w-3.5 h-3.5" />,
    color: '#6B7280',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
  },
};

function getPostAge(createdAt: string): 'active' | 'settling' | 'cooled' {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageMin = ageMs / 60000;
  if (ageMin < 60) return 'active';
  if (ageMin < 1440) return 'settling';
  return 'cooled';
}

function getGoldenHourRemaining(createdAt: string): number | null {
  const ageMin = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (ageMin >= 60) return null;
  return Math.max(1, Math.round(60 - ageMin));
}

function LiveIndicator() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  );
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = 0;
    const end = value;
    const duration = 700;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [value]);
  return <>{display}{suffix}</>;
}

/* ── Main Signal Client ─────────────────────────────────────────────────────── */
export function SignalClient() {
  const [posts, setPosts] = useState<SignalPost[]>([]);
  const [resonance, setResonance] = useState<ResonanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'feed' | 'dna'>('feed');
  const [profileSubdomain, setProfileSubdomain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'active' | 'draft' | 'failed'>('all');
  const [showDNAInfo, setShowDNAInfo] = useState(true);
  const [automationStats, setAutomationStats] = useState<{
    enabled: boolean;
    todayComments: number;
    todayDms: number;
    hotLeads: number;
    pendingFlagged: number;
  } | null>(null);

  useEffect(() => {
    async function fetchSub() {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.profile?.subdomain) {
            setProfileSubdomain(data.profile.subdomain);
            return;
          }
        }
      } catch {}
      try {
        const ctxRes = await fetch('/api/user/context', { credentials: 'include' });
        if (ctxRes.ok) {
          const ctxData = await ctxRes.json();
          if (ctxData?.profile?.subdomain) {
            setProfileSubdomain(ctxData.profile.subdomain);
          }
        }
      } catch {}
    }
    fetchSub();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [postsRes, resonanceRes] = await Promise.all([
        fetch('/api/signal/posts', { credentials: 'include' }),
        fetch('/api/signal/resonance', { credentials: 'include' }),
      ]);
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts || []);
      }
      if (resonanceRes.ok) {
        const data = await resonanceRes.json();
        setResonance(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Fetch automation stats for the metrics card (best-effort) ─────────────────
  useEffect(() => {
    const fetchAutomationStats = async () => {
      try {
        // Get workspace from user context
        const ctxRes = await fetch('/api/user/context', { credentials: 'include' });
        if (!ctxRes.ok) return;
        const ctxData = await ctxRes.json();
        const workspaceId = ctxData?.workspace?.id;
        if (!workspaceId) return;

        // Check if automation is enabled
        const [configRes, commentsRes, flaggedRes] = await Promise.all([
          fetch(`/api/instagram/automation?workspaceId=${workspaceId}`, { credentials: 'include' }),
          fetch(`/api/instagram/comments?workspaceId=${workspaceId}&limit=100`, { credentials: 'include' }),
          fetch(`/api/instagram/flagged?workspaceId=${workspaceId}&status=pending`, { credentials: 'include' }),
        ]);

        if (!configRes.ok) return;
        const config = await configRes.json();
        if (!config.enabled) {
          setAutomationStats(null);
          return;
        }

        // Build today's stats from comment logs
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let todayComments = 0;
        let todayDms = 0;
        let hotLeads = 0;

        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          for (const c of (commentsData.comments || [])) {
            const createdAt = new Date(c.created_at);
            if (createdAt >= today) {
              todayComments++;
              if (c.dm_sent) todayDms++;
              if ((c.lead_score || 0) >= 2) hotLeads++;
            }
          }
        }

        let pendingFlagged = 0;
        if (flaggedRes.ok) {
          const flaggedData = await flaggedRes.json();
          pendingFlagged = flaggedData.statusCounts?.pending || 0;
        }

        setAutomationStats({ enabled: true, todayComments, todayDms, hotLeads, pendingFlagged });
      } catch {
        // Non-critical — hide card silently
      }
    };
    fetchAutomationStats();
  }, []);


  // Poll every 3 seconds only if any active post has actively pending in-flight publishing
  useEffect(() => {
    const hasPending = posts.some(p =>
      p.variants.some(v => v.status === 'pending')
    );
    if (!hasPending) return;
    const t = setInterval(loadData, 3000);
    return () => clearInterval(t);
  }, [posts, loadData]);

  // Filtered posts for feed
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Status filter
      if (filterStatus === 'published') {
        if (!post.variants.some(v => v.status === 'published')) return false;
      } else if (filterStatus === 'active') {
        if (getPostAge(post.createdAt) !== 'active' || !post.variants.some(v => v.status === 'published')) return false;
      } else if (filterStatus === 'draft') {
        const isDraft = post.status === 'draft' || !post.variants.some(v => v.status === 'published');
        if (!isDraft) return false;
      } else if (filterStatus === 'failed') {
        if (!post.variants.some(v => v.status === 'failed')) return false;
      }

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = post.content.toLowerCase().includes(q);
        const matchesPlatform = post.variants.some(v => v.platform.toLowerCase().includes(q));
        const matchesHook = post.hookType?.toLowerCase().includes(q);
        if (!matchesContent && !matchesPlatform && !matchesHook) return false;
      }

      return true;
    });
  }, [posts, filterStatus, searchQuery]);

  // Live overview metrics
  const liveStats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter(p => p.variants.some(v => v.status === 'published')).length;
    const active = posts.filter(p => getPostAge(p.createdAt) === 'active' && p.variants.some(v => v.status === 'published')).length;
    const platformReach = new Set(posts.flatMap(p => p.variants.filter(v => v.status === 'published').map(v => v.platform))).size;
    const totalVariants = posts.flatMap(p => p.variants).length;
    const liveVariants = posts.flatMap(p => p.variants.filter(v => v.status === 'published')).length;
    const deliveryRate = totalVariants > 0 ? Math.round((liveVariants / totalVariants) * 100) : 100;

    return { total, published, active, platformReach, deliveryRate };
  }, [posts]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </motion.div>
          <p className="text-sm text-gray-400 font-medium">Loading Signal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* ── Editorial Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-extrabold text-[#3D2B1F] tracking-tight font-serif">Signal</h1>
            {liveStats.active > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDF0EC] text-[#C25E38] border border-[#C25E38]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                {liveStats.active} in Golden Hour
              </span>
            )}
          </div>
          <p className="text-sm text-[#8B7355] mt-1">Your posts, live. Where they go, what they build.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#F0EBE3] rounded-xl border border-[#E5DFD5]">
          <button
            onClick={() => setTab('feed')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'feed'
                ? 'bg-white text-[#3D2B1F] shadow-sm'
                : 'text-[#8B7355] hover:text-[#3D2B1F]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Feed</span>
            {posts.length > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#F5EFE2] text-[#3D2B1F] font-bold">
                {posts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('dna')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'dna'
                ? 'bg-white text-[#3D2B1F] shadow-sm'
                : 'text-[#8B7355] hover:text-[#3D2B1F]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#C4A265]" />
            <span>Post DNA</span>
          </button>
          <Link
            href="/dashboard/schedule"
            className="px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 text-[#8B7355] hover:text-[#3D2B1F] hover:bg-[#EDE7DD]"
            title="View or plan upcoming scheduled posts"
          >
            <Calendar className="w-3.5 h-3.5 text-[#C4A265]" />
            <span>Flight Plan</span>
          </Link>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Feed Tab ──────────────────────────────────────────────────── */}
        {tab === 'feed' && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {/* ── SignalDM Automation Metrics Card ── */}
            {automationStats && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(236,72,153,0.05) 100%)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: 16,
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>⚡</span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#7c3aed' }}>SignalDM</span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 600, color: '#22c55e',
                      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                      borderRadius: 20, padding: '1px 8px'
                    }}>ACTIVE</span>
                  </div>
                  <Link
                    href="/dashboard/automation"
                    style={{
                      fontSize: 12, fontWeight: 600, color: '#8b5cf6',
                      textDecoration: 'none',
                      padding: '4px 12px',
                      borderRadius: 8,
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.2)',
                    }}
                  >
                    Manage →
                  </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Comments today', value: automationStats.todayComments, color: '#3b82f6' },
                    { label: 'DMs sent today', value: automationStats.todayDms, color: '#8b5cf6' },
                    { label: 'Hot leads', value: automationStats.hotLeads, color: '#f97316' },
                    { label: 'Pending review', value: automationStats.pendingFlagged, color: automationStats.pendingFlagged > 0 ? '#ef4444' : '#9ca3af' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.6)' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
                      <div style={{ fontSize: 10.5, color: '#6b7280', marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick stats strip */}
            {posts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Dispatches', value: liveStats.total, icon: <Layers className="w-4 h-4 text-[#C4A265]" /> },
                  { label: 'Live Posts', value: liveStats.published, icon: <CheckCircle className="w-4 h-4 text-emerald-600" /> },
                  { label: 'Golden Hour', value: liveStats.active, icon: <Flame className="w-4 h-4 text-orange-600" /> },
                  { label: 'Network Reach', value: liveStats.platformReach, suffix: ' nets', icon: <Target className="w-4 h-4 text-indigo-600" /> },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl p-4 border border-[#E8E0D4] shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8B7355] uppercase tracking-wider mb-1">
                      {stat.icon}
                      <span>{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-[#3D2B1F]">
                      <AnimatedNumber value={stat.value} suffix={stat.suffix || ''} />
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Filter and Search Bar */}
            {posts.length > 0 && (
              <div className="bg-white rounded-2xl p-3 border border-[#E8E0D4] flex items-center justify-between gap-3 flex-wrap shadow-xs">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-[#A69279]" />
                  <input
                    type="text"
                    placeholder="Search posts by content, hook, or network…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-none outline-none bg-transparent text-sm text-[#3D2B1F] placeholder-[#A69279] w-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-[#8B7355] hover:text-[#3D2B1F] cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'published', label: 'Live' },
                    { id: 'active', label: 'Golden Hour' },
                    { id: 'draft', label: 'Drafts' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterStatus(f.id as any)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                        filterStatus === f.id
                          ? 'bg-[#3D2B1F] text-white border-[#3D2B1F]'
                          : 'bg-white text-[#8B7355] border-[#E8E0D4] hover:bg-[#F7F3ED]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                  <button
                    onClick={loadData}
                    className="p-1.5 rounded-lg border border-[#E8E0D4] bg-[#FAF7F2] text-[#8B7355] hover:text-[#3D2B1F] cursor-pointer"
                    title="Refresh feed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Post feed list */}
            {posts.length === 0 ? (
              <EmptyState />
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#E8E0D4] p-12 text-center">
                <Search className="w-8 h-8 text-[#A69279] mx-auto mb-2" />
                <h3 className="font-bold text-[#3D2B1F] mb-1">No matching dispatches found</h3>
                <p className="text-sm text-[#8B7355] mb-4">Try clearing filters or searching for different keywords.</p>
                <button
                  onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                  className="px-4 py-1.5 rounded-xl border border-[#E8E0D4] bg-[#FAF7F2] text-xs font-bold text-[#3D2B1F] cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (() => {
              const mostRecentPublishedPostId = posts.find(p => p.variants.some(v => v.status === 'published'))?.id;
              return (
                <div className="space-y-4">
                  {filteredPosts.map((post, i) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      delay={i * 0.04}
                      onRefresh={loadData}
                      onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                      profileSubdomain={profileSubdomain}
                      isMostRecentPublished={post.id === mostRecentPublishedPostId}
                    />
                  ))}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* ── Post DNA Tab ──────────────────────────────────────────────── */}
        {tab === 'dna' && (
          <motion.div
            key="dna"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {/* Educational "Why Post DNA?" Card */}
            <AnimatePresence>
              {showDNAInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-br from-white to-[#FAF5ED] rounded-2xl border border-[#E8E0D4] p-5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F5EFE2] flex items-center justify-center text-[#C4A265]">
                        <Wand2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-[#3D2B1F]">What is Post DNA & Why Does It Matter?</h2>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#C4A265] text-white tracking-wider">
                            Content Intelligence
                          </span>
                        </div>
                        <p className="text-xs text-[#8B7355] mt-0.5">Your algorithmic fingerprint across social networks.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDNAInfo(false)}
                      className="text-xs font-semibold text-[#A69279] hover:text-[#3D2B1F] cursor-pointer"
                    >
                      Hide
                    </button>
                  </div>

                  <p className="text-xs text-[#3D2B1F] leading-relaxed mb-3">
                    Social algorithms on LinkedIn, X, Threads, and Bluesky evaluate <strong>structural patterns</strong>:
                    opening hook styles, character pacing, visual density, and release windows. Post DNA decodes your real
                    broadcasts to reveal what stops the scroll so you never post blind again.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#F0EBE3]">
                    {[
                      { icon: <Zap className="w-3.5 h-3.5 text-amber-500" />, title: '1. Hook Style', desc: 'The 3-second dropoff trigger' },
                      { icon: <Clock className="w-3.5 h-3.5 text-blue-500" />, title: '2. Golden Hour', desc: '60-min viral velocity testing' },
                      { icon: <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />, title: '3. Density', desc: 'Word count pacing for dwell time' },
                      { icon: <Target className="w-3.5 h-3.5 text-purple-500" />, title: '4. Synergy', desc: 'Cross-platform audience footprint' },
                    ].map((item) => (
                      <div key={item.title} className="bg-white/80 rounded-xl p-2.5 border border-[#F0EBE3]">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#3D2B1F] mb-0.5">
                          {item.icon}
                          <span>{item.title}</span>
                        </div>
                        <p className="text-[11px] text-[#8B7355]">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showDNAInfo && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDNAInfo(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C4A265] bg-white border border-[#E8E0D4] px-3 py-1.5 rounded-xl cursor-pointer hover:bg-[#FAF7F2]"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>How Post DNA works</span>
                </button>
              </div>
            )}

            <DNAView resonance={resonance} posts={posts} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Post Card ──────────────────────────────────────────────────────────────── */
function PostCard({
  post,
  delay,
  onRefresh,
  onDelete,
  profileSubdomain,
  isMostRecentPublished = false,
}: {
  post: SignalPost;
  delay: number;
  onRefresh: () => void;
  onDelete?: (postId: string) => void;
  profileSubdomain?: string | null;
  isMostRecentPublished?: boolean;
}) {
  const age = getPostAge(post.createdAt);
  const goldenRemaining = getGoldenHourRemaining(post.createdAt);
  const publishedVariants = post.variants.filter(v => v.status === 'published');
  const pendingVariants = post.variants.filter(v => v.status === 'draft' || v.status === 'pending');
  const failedVariants = post.variants.filter(v => v.status === 'failed');
  const isDraft = post.status === 'draft' || publishedVariants.length === 0;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const hookMeta = HOOK_META[post.hookType || ''] || HOOK_META.statement;

  const shareOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://unool.co';
  const shareUrl = `${shareOrigin}/u/${profileSubdomain || 'preview'}?activity=1`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Hey! Check out my latest story across platforms. Pick your favourite to view & support:\n\n👉 ${shareUrl}\n\nThanks! ❤️`
  )}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/publish/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const fallbackRes = await fetch(`/api/signal/posts?postId=${post.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to remove draft');
        }
      }
      toast.success('Draft removed completely');
      onDelete?.(post.id);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove draft');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22 }}
      className="bg-white rounded-2xl border overflow-hidden transition-all shadow-xs"
      style={{
        borderColor: isDraft ? '#fed7aa' : age === 'active' ? '#fbbf24' : age === 'settling' ? '#e5e7eb' : '#f3f4f6',
        boxShadow: isDraft
          ? '0 1px 6px #f9731610'
          : age === 'active'
          ? '0 0 0 1px #fbbf2420, 0 4px 24px #fbbf2415'
          : '0 1px 4px #0000000a',
      }}
    >
      {/* Active Golden Hour glowing top strip */}
      {age === 'active' && !isDraft && (
        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 animate-pulse" />
      )}

      {/* Card header: age badge + time */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isDraft ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              Draft Dispatch
            </span>
          ) : age === 'active' ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <LiveIndicator />
              Active — {goldenRemaining}m left in golden hour
            </span>
          ) : age === 'settling' ? (
            <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              Settling (Active 24h)
            </span>
          ) : (
            <span className="text-xs text-gray-400">{format(new Date(post.createdAt), 'MMM d, h:mm a')}</span>
          )}

          {post.hookType && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${hookMeta.bg} ${hookMeta.text}`}>
              {hookMeta.icon}
              <span>{hookMeta.label}</span>
            </span>
          )}
        </div>

        {age !== 'cooled' && (
          <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
        )}
      </div>

      {/* Content preview */}
      <p className="px-5 py-2 text-[15px] text-[#3D2B1F] leading-relaxed line-clamp-3">
        {post.content}
      </p>

      {/* Platform status row */}
      {post.variants.length > 0 && (
        <div className="px-5 py-3 flex flex-wrap gap-2 border-t border-gray-50 bg-[#FAF7F2]/50">
          {post.variants.map(variant => {
            const cfg = getPlatformConfig(variant.platform);
            const Logo = cfg.logo;
            const isLive = variant.status === 'published';
            const isPending = variant.status === 'draft' || variant.status === 'pending';
            const isFailed = variant.status === 'failed';

            return (
              <div key={variant.id}>
                {isLive && variant.platformUrl ? (
                  <a
                    href={variant.platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 transition-colors group cursor-pointer"
                    style={{ borderColor: cfg.color ? `${cfg.color}30` : '#e5e7eb' }}
                    title={`View on ${cfg.name}`}
                  >
                    <Logo size={16} />
                    <span className="text-xs font-medium text-gray-700">{cfg.name}</span>
                    <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </a>
                ) : (
                  <motion.div
                    animate={isPending ? { opacity: [1, 0.5, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                      isFailed ? 'bg-red-50 border-red-200 cursor-pointer hover:bg-red-100 transition-colors' : 'bg-gray-50 border-gray-200'
                    }`}
                    onClick={isFailed ? () => toast.error(`${cfg.name} Failed`, { description: variant.error?.message || 'Publishing failed. Check platform requirements or reconnect account.' }) : undefined}
                    title={isFailed ? `${variant.error?.message || 'Failed'} (Click to view)` : `Publishing to ${cfg.name}...`}
                  >
                    <Logo size={16} />
                    <span className={`text-xs font-medium ${isFailed ? 'text-red-600' : 'text-gray-500'}`}>
                      {cfg.name}
                    </span>
                    {isFailed && <AlertCircle className="w-3 h-3 text-red-500" />}
                    {isPending && <span className="text-[10px] text-gray-400 ml-0.5">sending…</span>}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Inline failed variants banner */}
      {failedVariants.length > 0 && (
        <div className="px-5 py-2.5 bg-red-50/70 border-t border-red-100 flex flex-col gap-1.5 text-xs text-red-700">
          {failedVariants.map(fv => (
            <div key={fv.id} className="flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{getPlatformConfig(fv.platform).name}:</span>{' '}
                <span>{fv.error?.message || 'Publishing failed. Please reconnect account or verify permissions.'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary footer */}
      <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between gap-3 text-xs text-gray-500 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {publishedVariants.length > 0 && (
            <span className="text-green-600 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {publishedVariants.length} live
            </span>
          )}
          {pendingVariants.length > 0 && (
            <span className="text-amber-600 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {pendingVariants.length} pending
            </span>
          )}
          {failedVariants.length > 0 && (
            <span className="text-red-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {failedVariants.length} failed
            </span>
          )}
          <span className="text-gray-400">
            {post.wordCount || post.content.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>

        {/* Action buttons for drafts: Review & edit, Remove */}
        {isDraft ? (
          <div className="flex items-center gap-2 ml-auto">
            <Link
              href={`/dashboard/publish?postId=${post.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-black transition-colors shadow-xs cursor-pointer"
              title="Review, edit, and publish this draft"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Review & edit</span>
            </Link>

            {confirmDelete ? (
              <div className="inline-flex items-center gap-1.5 bg-red-50/90 px-2.5 py-1 rounded-xl border border-red-200">
                <span className="text-[11px] text-red-700 font-medium">Remove?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                  className="px-1.5 py-0.5 rounded-lg text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors cursor-pointer"
                title="Remove this draft completely"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        ) : (
          publishedVariants.length > 0 && (
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-black transition-all shadow-sm ml-auto cursor-pointer"
              title="Share this story"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Story</span>
            </button>
          )
        )}
      </div>

      {/* Share Modal Window */}
      {showShareModal && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6 relative"
            >
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Share Story</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Share this post across your network or copy the link directly.
              </p>

              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Universal Activity Link
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 font-mono">
                  <Link2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate flex-1 select-all">{shareUrl}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-600" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Link'}</span>
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-black transition-colors shadow-sm cursor-pointer"
                >
                  {PlatformLogos.whatsapp && <PlatformLogos.whatsapp.logo size={15} />}
                  <span>Share on WhatsApp</span>
                </a>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}

/* ── Post DNA / Advanced Resonance View ─────────────────────────────────────── */
function DNAView({ resonance, posts }: { resonance: ResonanceData | null; posts: SignalPost[] }) {
  if (!resonance) {
    return (
      <div className="py-16 text-center text-gray-400">
        <Sparkles className="w-8 h-8 mx-auto mb-3 text-amber-500 animate-spin" />
        <p className="text-sm font-medium">Analyzing your Post DNA patterns…</p>
      </div>
    );
  }

  if (!resonance.hasData || resonance.totalPosts === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-[#E8E0D4] p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F0EBE3] flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-[#C4A265]" />
        </div>
        <h3 className="font-bold text-[#3D2B1F] mb-1">Building Your Post DNA</h3>
        <p className="text-sm text-[#8B7355] max-w-sm mx-auto mb-5 leading-relaxed">
          Post DNA decodes your content patterns across social algorithms. Once you broadcast your first story
          from Studio or queue a dispatch in Flight Plan, your genetic intelligence engine will automatically unlock.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard/composer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3D2B1F] text-white text-sm font-semibold hover:bg-black transition-colors"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard/schedule"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5EFE2] text-[#3D2B1F] border border-[#E8E0D4] text-sm font-semibold hover:bg-[#EDE7DD] transition-colors"
          >
            <Calendar className="w-4 h-4 text-[#C4A265]" />
            <span>Plan My Week</span>
          </Link>
        </div>
      </div>
    );
  }

  const patternRows = resonance.recentPatternRows || [];
  const avgWords = resonance.avgWordCount || (patternRows.length > 0
    ? Math.round(patternRows.reduce((s, r) => s + r.wordCount, 0) / patternRows.length)
    : 0);
  const mediaRatio = resonance.mediaRatio !== undefined
    ? resonance.mediaRatio
    : (patternRows.length > 0 ? Math.round((patternRows.filter(r => r.hasMedia).length / patternRows.length) * 100) : 0);
  const resonanceScore = resonance.resonanceScore || Math.min(Math.round((resonance.totalPosts * 12) + 40), 96);

  // Platform distribution
  const platformCounts: Record<string, number> = {};
  posts.forEach(p => {
    p.variants.filter(v => v.status === 'published').forEach(v => {
      platformCounts[v.platform] = (platformCounts[v.platform] || 0) + 1;
    });
  });
  const topPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);

  // Days heatmap
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayDistribution = resonance.dayDistribution || new Array(7).fill(0);
  if (!resonance.dayDistribution && patternRows.length > 0) {
    patternRows.forEach(r => { dayDistribution[r.dayOfWeek]++; });
  }
  const maxDay = Math.max(...dayDistribution, 1);

  // Hours distribution
  const hourDistribution = resonance.hourDistribution || new Array(24).fill(0);
  if (!resonance.hourDistribution && patternRows.length > 0) {
    patternRows.forEach(r => { hourDistribution[r.hourOfDay]++; });
  }
  const maxHour = Math.max(...hourDistribution, 1);

  // Word length breakdown
  const wcBuckets = [
    { label: 'Micro (<50w)', min: 0, max: 49, count: 0 },
    { label: 'Sweet-spot (50–120w)', min: 50, max: 120, count: 0 },
    { label: 'Thought (120–250w)', min: 121, max: 250, count: 0 },
    { label: 'Deep (250w+)', min: 251, max: Infinity, count: 0 },
  ];
  patternRows.forEach(r => {
    const bucket = wcBuckets.find(b => r.wordCount >= b.min && r.wordCount <= b.max);
    if (bucket) bucket.count++;
  });
  const maxWc = Math.max(...wcBuckets.map(b => b.count), 1);

  const tierName = resonanceScore >= 80 ? 'Authority Architect' : resonanceScore >= 50 ? 'Ascending Catalyst' : 'Emerging Voice';

  return (
    <div className="space-y-4">
      {/* ── Content Resonance Score ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E0D4] p-5 shadow-xs">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#C4A265]" />
              <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Content Resonance Index</p>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-extrabold text-[#3D2B1F] tracking-tight">
                <AnimatedNumber value={resonanceScore} suffix="/100" />
              </p>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#F5EFE2] text-[#3D2B1F] border border-[#E8E0D4]">
                {tierName}
              </span>
            </div>
            <p className="text-xs text-[#8B7355] mt-1">Based on hook variety, delivery rate, pacing, and network spread.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center min-w-[220px]">
            <div className="bg-[#FAF7F2] rounded-xl p-2.5 border border-[#E8E0D4]">
              <span className="text-[10px] uppercase font-bold text-[#8B7355]">Analyzed</span>
              <p className="text-lg font-bold text-[#3D2B1F]">{resonance.totalPosts} posts</p>
            </div>
            <div className="bg-[#FAF7F2] rounded-xl p-2.5 border border-[#E8E0D4]">
              <span className="text-[10px] uppercase font-bold text-[#8B7355]">Avg Length</span>
              <p className="text-lg font-bold text-[#3D2B1F]">{avgWords}w</p>
            </div>
            <div className="bg-[#FAF7F2] rounded-xl p-2.5 border border-[#E8E0D4]">
              <span className="text-[10px] uppercase font-bold text-[#8B7355]">Media Rate</span>
              <p className="text-lg font-bold text-[#3D2B1F]">{mediaRatio}%</p>
            </div>
            <div className="bg-[#FAF7F2] rounded-xl p-2.5 border border-[#E8E0D4]">
              <span className="text-[10px] uppercase font-bold text-[#8B7355]">Top Hook</span>
              <p className="text-lg font-bold text-[#3D2B1F] capitalize truncate">
                {resonance.hookBreakdown[0]?.type || 'Statement'}
              </p>
            </div>
          </div>
        </div>

        <div className="h-2 bg-[#F0EBE3] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${resonanceScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-[#C4A265] to-[#C25E38]"
          />
        </div>
      </div>

      {/* ── Hook Archetype Spectrum ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E0D4] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-bold text-[#3D2B1F]">Hook Archetype Performance</p>
          </div>
          <span className="text-xs text-[#8B7355] font-medium">
            {resonance.hookBreakdown.length} / 6 Styles Tracked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {['statement', 'question', 'statistic', 'story', 'contrarian', 'framework'].map(hookKey => {
            const meta = HOOK_META[hookKey];
            const breakdownItem = resonance.hookBreakdown.find(b => b.type === hookKey);
            const isUsed = Boolean(breakdownItem && breakdownItem.count > 0);
            const count = breakdownItem?.count || 0;
            const pct = resonance.totalPosts > 0 ? Math.round((count / resonance.totalPosts) * 100) : 0;
            const sample = breakdownItem?.samples?.[0];

            return (
              <div
                key={hookKey}
                className={`p-3.5 rounded-xl border transition-all ${
                  isUsed ? 'bg-white border-[#E8E0D4]' : 'bg-[#FAF7F2]/60 border-dashed border-[#E8E0D4] opacity-65'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg ${meta.bg} ${meta.text} flex items-center justify-center`}>
                      {meta.icon}
                    </span>
                    <span className="text-xs font-bold text-[#3D2B1F]">{meta.label}</span>
                  </div>
                  {isUsed ? (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${meta.bg} ${meta.text}`}>
                      {count} ({pct}%)
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#A69279]">Untapped</span>
                  )}
                </div>

                <p className="text-[11px] text-[#8B7355] mb-2 leading-relaxed">{meta.desc}</p>

                {isUsed && sample ? (
                  <p className="text-[11px] italic text-[#3D2B1F] truncate bg-[#F7F3ED] px-2 py-1 rounded-md border-l-2 border-[#C4A265]">
                    “{sample}…”
                  </p>
                ) : (
                  <p className="text-[10px] text-[#C4A265] font-semibold">
                    💡 Tip: Try this opener in your next dispatch
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Best Timing ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resonance.bestDay && (
          <div className="bg-white rounded-2xl border border-[#E8E0D4] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Most Active Day</p>
            </div>
            <p className="text-3xl font-extrabold text-[#3D2B1F]">{resonance.bestDay.name}</p>
            <p className="text-xs text-[#8B7355] mt-0.5 mb-3">{resonance.bestDay.count} posts published</p>

            {/* 7-day visual mini-bars */}
            <div className="flex items-end gap-1.5 h-12">
              {dayNames.map((d, i) => {
                const count = dayDistribution[i] || 0;
                const hPct = count > 0 ? (count / maxDay) * 100 : 10;
                const isBest = resonance.bestDay?.day === i;
                return (
                  <div key={d} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className={`w-full rounded-xs transition-all ${isBest ? 'bg-[#C4A265]' : count > 0 ? 'bg-[#D4B87A]' : 'bg-[#F0EBE3]'}`}
                      style={{ height: `${hPct}%` }}
                      title={`${d}: ${count} posts`}
                    />
                    <span className={`text-[9px] ${isBest ? 'font-bold text-[#3D2B1F]' : 'text-gray-400'}`}>{d}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {resonance.bestHour && (
          <div className="bg-white rounded-2xl border border-[#E8E0D4] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Most Active Time</p>
            </div>
            <p className="text-3xl font-extrabold text-[#3D2B1F]">{resonance.bestHour.label}</p>
            <p className="text-xs text-[#8B7355] mt-0.5 mb-3">{resonance.bestHour.count} posts published</p>

            {/* 24-hr horizon bar */}
            <div className="flex items-end gap-0.5 h-12">
              {Array.from({ length: 18 }, (_, i) => i + 6).map(h => {
                const count = hourDistribution[h % 24] || 0;
                const intensity = count / maxHour;
                const isBest = resonance.bestHour?.hour === (h % 24);
                return (
                  <div
                    key={h}
                    className={`flex-1 rounded-xs ${isBest ? 'bg-purple-600' : count > 0 ? 'bg-purple-300' : 'bg-[#F0EBE3]'}`}
                    style={{ height: `${Math.max(intensity * 100, 10)}%` }}
                    title={`${h % 12 || 12}${h >= 12 ? 'pm' : 'am'}: ${count} posts`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-[#A69279] mt-1">
              <span>6am</span>
              <span>12pm</span>
              <span>11pm</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Pacing Spectrum & Platform Reach ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Word length */}
        <div className="bg-white rounded-2xl border border-[#E8E0D4] p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-4 h-4 text-[#C4A265]" />
            <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Length & Pacing Spectrum</p>
          </div>
          <div className="space-y-2.5">
            {wcBuckets.map(b => {
              const pct = (b.count / maxWc) * 100;
              return (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#3D2B1F]">{b.label}</span>
                    <span className="font-bold text-[#8B7355]">{b.count} posts</span>
                  </div>
                  <div className="h-1.5 bg-[#F0EBE3] rounded-full overflow-hidden">
                    <div className="h-full bg-[#C4A265] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform reach */}
        <div className="bg-white rounded-2xl border border-[#E8E0D4] p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Network Distribution</p>
          </div>
          <div className="space-y-2.5">
            {topPlatforms.length > 0 ? (
              topPlatforms.map(([platform, count]) => {
                const cfg = getPlatformConfig(platform);
                const Logo = cfg.logo;
                const maxP = topPlatforms[0][1];
                const pct = (count / maxP) * 100;

                return (
                  <div key={platform}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <Logo size={14} />
                        <span className="font-medium text-[#3D2B1F]">{cfg.name}</span>
                      </div>
                      <span className="font-bold text-[#8B7355]">{count} live</span>
                    </div>
                    <div className="h-1.5 bg-[#F0EBE3] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: cfg.color || '#3D2B1F' }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">No variant data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Strategic Recommendations ─────────────────────────────────── */}
      {resonance.recommendations && resonance.recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E0D4] p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-4 h-4 text-[#C4A265]" />
            <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Algorithmic Content Prescriptions</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {resonance.recommendations.map(rec => (
              <div key={rec.id} className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E0D4] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#3D2B1F] mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C4A265]" />
                    <span>{rec.title}</span>
                  </div>
                  <p className="text-xs text-[#8B7355] leading-relaxed mb-3">{rec.desc}</p>
                </div>
                <Link
                  href="/dashboard/composer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#C4A265] hover:text-[#3D2B1F]"
                >
                  <span>Apply in Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center pb-2">
        Built directly from your actual publish history. Every post you dispatch refines your Post DNA.
      </p>
    </div>
  );
}

/* ── Empty State ────────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-[#E8E0D4] p-16 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#F0EBE3] flex items-center justify-center">
        <Activity className="w-6 h-6 text-[#C4A265]" />
      </div>
      <h3 className="font-bold text-[#3D2B1F] mb-1 text-lg">No Signal dispatches yet</h3>
      <p className="text-sm text-[#8B7355] mb-5 max-w-sm mx-auto">
        Broadcast simultaneously to LinkedIn, X, Threads, Bluesky and Instagram in one click.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/dashboard/composer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3D2B1F] text-white text-sm font-semibold hover:bg-black transition-colors"
        >
          Open Studio
        </Link>
        <Link
          href="/dashboard/schedule"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5EFE2] text-[#3D2B1F] border border-[#E8E0D4] text-sm font-semibold hover:bg-[#EDE7DD] transition-colors"
        >
          <Calendar className="w-4 h-4 text-[#C4A265]" />
          Plan My Week
        </Link>
      </div>
    </div>
  );
}
