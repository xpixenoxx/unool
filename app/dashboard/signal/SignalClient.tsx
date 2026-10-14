'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink, RefreshCw, AlertCircle, CheckCircle, Clock, Zap,
  TrendingUp, BarChart2, Calendar, Sparkles, Pencil, Trash2, Loader2,
  FileText, Activity, Target, Flame, ArrowUpRight, Layers, Eye,
  Award, PieChart, Hash, Type, BarChart3, HelpCircle, Info,
  Share2, Search, Filter, Check, ChevronRight, ChevronDown,
  BookOpen, ShieldCheck, ArrowRight, Compass, Wand2
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

/* ─── Warm Biscuit Editorial Palette ────────────────────────────────────── */
const biscuit = {
  bg: '#F7F3ED',
  sidebar: '#F0EBE3',
  card: '#FFFDF9',
  cardHover: '#FAF7F2',
  accent: '#C4A265',
  accentLight: '#D4B87A',
  accentBg: '#F5EFE2',
  text: '#3D2B1F',
  textMuted: '#8B7355',
  textLight: '#A69279',
  activeBg: '#3D2B1F',
  activeFg: '#FAF7F2',
  border: '#E8E0D4',
  borderLight: '#F0EBE3',
  hoverBg: '#EDE7DD',
  emerald: '#2D6A4F',
  emeraldBg: '#E8F5E9',
  terracotta: '#C25E38',
  terracottaBg: '#FDF0EC',
};

/* ─── Real platform SVG logos & Brand Tokens ────────────────────────────── */
const PlatformLogos: Record<string, { logo: React.FC<{ size?: number }>; name: string; color: string; bg: string }> = {
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    bg: '#E8F0FA',
    logo: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2">
        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a1.66 1.66 0 000 1.14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
      </svg>
    ),
  },
  x: {
    name: 'X (Twitter)',
    color: '#000000',
    bg: '#F3F4F6',
    logo: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  threads: {
    name: 'Threads',
    color: '#000000',
    bg: '#F3F4F6',
    logo: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 192 192" fill="currentColor">
        <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.745C82.2364 44.745 70.1369 51.5765 63.5765 63.3545L75.2024 70.6031C80.0505 62.2784 88.2266 58.2497 97.222 58.2497C97.302 58.2497 97.3826 58.2497 97.4632 58.2504C108.311 58.3263 116.373 63.2067 121.072 72.5739C124.474 79.3627 125.795 87.5692 125.011 97.0684C118.716 93.8805 111.245 92.2816 103.087 92.2816C78.5459 92.2816 62.2275 105.888 63.285 126.383C63.8385 137.188 69.2854 146.683 78.4808 152.904C86.4024 158.267 96.3883 160.734 106.667 160.173C120.063 159.443 130.581 154.26 137.955 144.781C143.578 137.601 147.258 128.527 149.104 117.317C154.118 120.112 157.935 123.802 160.351 128.423C164.651 136.891 165.029 150.511 155.909 159.773C147.762 168.041 137.856 171.894 122.933 172.032C106.162 171.878 93.5498 167.049 85.2527 157.723C77.3733 148.852 73.2517 136.543 72.9765 121.148C73.2517 105.752 77.3733 93.4436 85.2527 84.573C93.5498 75.2477 106.162 70.4181 122.933 70.264Z" />
      </svg>
    ),
  },
  instagram: {
    name: 'Instagram',
    color: '#E1306C',
    bg: '#FDE8F0',
    logo: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <defs>
          <radialGradient id="sig-ig" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="50%" stopColor="#fd5949" />
            <stop offset="68%" stopColor="#d6249f" />
            <stop offset="100%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <path fill="url(#sig-ig)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  bluesky: {
    name: 'Bluesky',
    color: '#0085FF',
    bg: '#E6F3FF',
    logo: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 360 320" fill="#0085FF">
        <path d="M180 141.964C163.699 110.262 119.308 51.1817 78.0834 31.0445C38.4622 11.6012 1.01713 22.5943 1.01713 74.2913C1.01713 84.0502 6.28388 149.135 9.29108 160.994C21.6498 207.979 70.8174 219.185 115.124 212.405C175.154 202.921 256.555 190.651 180 141.964ZM180 141.964C196.301 110.262 240.692 51.1817 281.917 31.0445C321.538 11.6012 358.983 22.5943 358.983 74.2913C358.983 84.0502 353.716 149.135 350.709 160.994C338.35 207.979 289.183 219.185 244.876 212.405C184.846 202.921 103.445 190.651 180 141.964Z" />
        <path d="M180.026 194.895C180.026 194.895 133.738 210.527 118.981 242.765C109.649 263.297 112.956 295.538 155.77 301.622C169.285 303.566 185.24 302.805 199.999 299.375C214.747 295.949 228.248 288.741 237.019 277.879C250.534 261.146 247.888 225.469 232.975 212.205C218.076 198.953 180.026 194.895 180.026 194.895Z" />
      </svg>
    ),
  },
  whatsapp: {
    name: 'WhatsApp',
    color: '#25D366',
    bg: '#E8F8EE',
    logo: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    bg: '#E8F0FE',
    logo: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    bg: '#FEECEC',
    logo: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
};

/* ─── Hook Archetype Metadata ───────────────────────────────────────────── */
const HOOK_META: Record<string, { label: string; desc: string; icon: React.ReactNode; color: string; bg: string }> = {
  statement: {
    label: 'Bold Statement',
    desc: 'Uncompromising declaration or thesis that commands authority.',
    icon: <Type className="w-3.5 h-3.5" />,
    color: '#B48C48',
    bg: '#FBF7EE',
  },
  question: {
    label: 'Curiosity Question',
    desc: 'Intriguing opener that compels the mind to seek an answer.',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  statistic: {
    label: 'Data / Statistic',
    desc: 'Hard metric or multiple that anchors intellectual credibility.',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    color: '#10B981',
    bg: '#ECFDF5',
  },
  story: {
    label: 'Personal Narrative',
    desc: 'Vulnerable first-person narrative driving empathy & connection.',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: '#EC4899',
    bg: '#FDF2F8',
  },
  contrarian: {
    label: 'Contrarian Angle',
    desc: 'Direct challenge to common dogmas that halts feed scrolling.',
    icon: <Flame className="w-3.5 h-3.5" />,
    color: '#EF4444',
    bg: '#FEF2F2',
  },
  framework: {
    label: 'Framework / Step-by-Step',
    desc: 'Systematized blueprint that inspires immediate saving & bookmarking.',
    icon: <Layers className="w-3.5 h-3.5" />,
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  unknown: {
    label: 'Standard Dispatch',
    desc: 'Balanced conversational dispatch.',
    icon: <FileText className="w-3.5 h-3.5" />,
    color: '#8B7355',
    bg: '#F7F3ED',
  },
};

/* ─── Types ─────────────────────────────────────────────────────────────── */
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

/* ─── Main Signal Client ─────────────────────────────────────────────────── */
export function SignalClient() {
  const [posts, setPosts] = useState<SignalPost[]>([]);
  const [resonance, setResonance] = useState<ResonanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'feed' | 'dna'>('feed');
  const [profileSubdomain, setProfileSubdomain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'active' | 'draft' | 'failed'>('all');
  const [showDNAInfo, setShowDNAInfo] = useState(true);

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

  // Dynamic poll if active pending variants exist
  useEffect(() => {
    const hasPending = posts.some(p => p.variants.some(v => v.status === 'pending'));
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
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              border: `3px solid ${biscuit.border}`,
              borderTopColor: biscuit.accent,
            }}
          />
          <p style={{ fontSize: 13, color: biscuit.textMuted, fontWeight: 500, letterSpacing: '0.04em' }}>
            Syncing Signal dispatch feed…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 64px', position: 'relative' }}>
      {/* ── Editorial Header ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ marginBottom: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: biscuit.activeBg,
                color: biscuit.activeFg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(61,43,31,0.15)',
              }}>
                <Activity className="w-5 h-5" style={{ color: biscuit.accentLight }} />
              </div>
              <h1 style={{
                fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em',
                color: biscuit.text, fontFamily: 'var(--font-syne), serif',
              }}>
                Signal
              </h1>
              {liveStats.active > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 20,
                  background: biscuit.terracottaBg,
                  color: biscuit.terracotta,
                  border: `1px solid ${biscuit.terracotta}30`,
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
                }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                  </span>
                  {liveStats.active} in Golden Hour
                </span>
              )}
            </div>
            <p style={{ fontSize: 14, color: biscuit.textMuted, marginLeft: 48, lineHeight: 1.4 }}>
              Real-time cross-platform broadcast feed and algorithmic content genetic breakdown.
            </p>
          </div>

          {/* Segmented Control / Tab Switcher */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: biscuit.sidebar,
            borderRadius: 14, padding: 3,
            border: `1px solid ${biscuit.border}`,
            position: 'relative',
          }}>
            <button
              onClick={() => setTab('feed')}
              style={{
                position: 'relative',
                padding: '8px 18px', fontSize: 13, fontWeight: 700,
                borderRadius: 11, border: 'none', cursor: 'pointer',
                background: tab === 'feed' ? biscuit.card : 'transparent',
                color: tab === 'feed' ? biscuit.text : biscuit.textMuted,
                boxShadow: tab === 'feed' ? '0 1px 4px rgba(61,43,31,0.08)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              <Eye className="w-4 h-4" style={{ color: tab === 'feed' ? biscuit.accent : biscuit.textLight }} />
              <span>Broadcast Feed</span>
              {posts.length > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 10,
                  background: tab === 'feed' ? biscuit.accentBg : 'rgba(0,0,0,0.05)',
                  color: tab === 'feed' ? biscuit.text : biscuit.textMuted,
                }}>
                  {posts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setTab('dna')}
              style={{
                position: 'relative',
                padding: '8px 18px', fontSize: 13, fontWeight: 700,
                borderRadius: 11, border: 'none', cursor: 'pointer',
                background: tab === 'dna' ? biscuit.card : 'transparent',
                color: tab === 'dna' ? biscuit.text : biscuit.textMuted,
                boxShadow: tab === 'dna' ? '0 1px 4px rgba(61,43,31,0.08)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: tab === 'dna' ? biscuit.accent : biscuit.textLight }} />
              <span>Post DNA</span>
              <span style={{
                fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                padding: '2px 6px', borderRadius: 8,
                background: tab === 'dna' ? biscuit.accent : biscuit.accentBg,
                color: tab === 'dna' ? '#fff' : biscuit.textMuted,
                letterSpacing: '0.04em',
              }}>
                Intelligence
              </span>
            </button>

            <Link
              href="/dashboard/flightplan"
              style={{
                position: 'relative',
                padding: '8px 18px', fontSize: 13, fontWeight: 700,
                borderRadius: 11, textDecoration: 'none',
                color: biscuit.textMuted,
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
              title="Plan your weekly content schedule"
            >
              <Calendar className="w-4 h-4" style={{ color: biscuit.accent }} />
              <span>Flight Plan</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Tab Views ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {tab === 'feed' && (
          <motion.div
            key="feed-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Quick Stats Strip */}
            {posts.length > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
                marginBottom: 20,
              }}>
                {[
                  { label: 'Dispatches', value: liveStats.total, icon: <Layers className="w-4 h-4" />, color: biscuit.accent },
                  { label: 'Live Posts', value: liveStats.published, icon: <CheckCircle className="w-4 h-4" />, color: biscuit.emerald },
                  { label: 'Golden Hour', value: liveStats.active, icon: <Flame className="w-4 h-4" />, color: biscuit.terracotta },
                  { label: 'Reach Breadth', value: liveStats.platformReach, suffix: ' nets', icon: <Target className="w-4 h-4" />, color: '#6366F1' },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      background: biscuit.card,
                      borderRadius: 16, padding: '14px 16px',
                      border: `1px solid ${biscuit.border}`,
                      boxShadow: '0 2px 8px rgba(61,43,31,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ color: item.color }}>{item.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: biscuit.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {item.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 24, fontWeight: 800, color: biscuit.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      <AnimatedNumber value={item.value} suffix={item.suffix || ''} />
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Filter & Search Bar */}
            {posts.length > 0 && (
              <div style={{
                background: biscuit.card,
                borderRadius: 16, padding: '10px 14px',
                border: `1px solid ${biscuit.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                flexWrap: 'wrap', marginBottom: 20,
                boxShadow: '0 1px 4px rgba(61,43,31,0.02)',
              }}>
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
                  <Search className="w-4 h-4" style={{ color: biscuit.textLight }} />
                  <input
                    type="text"
                    placeholder="Search posts by content, hook, or platform…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none', outline: 'none', background: 'transparent',
                      fontSize: 13, color: biscuit.text, width: '100%',
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{ fontSize: 11, color: biscuit.textMuted, border: 'none', background: 'transparent', cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Status Filter Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'published', label: 'Live' },
                    { id: 'active', label: 'Active Golden' },
                    { id: 'draft', label: 'Drafts' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFilterStatus(f.id as any)}
                      style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        border: filterStatus === f.id ? `1px solid ${biscuit.text}` : `1px solid ${biscuit.border}`,
                        background: filterStatus === f.id ? biscuit.activeBg : biscuit.card,
                        color: filterStatus === f.id ? biscuit.activeFg : biscuit.textMuted,
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                  <button
                    onClick={loadData}
                    style={{
                      padding: '5px 10px', borderRadius: 10, border: `1px solid ${biscuit.border}`,
                      background: biscuit.cardHover, color: biscuit.textMuted, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                    }}
                    title="Refresh data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Post Feed List */}
            {posts.length === 0 ? (
              <EmptyState />
            ) : filteredPosts.length === 0 ? (
              <div style={{
                background: biscuit.card, borderRadius: 20, border: `1px dashed ${biscuit.border}`,
                padding: '48px 24px', textAlign: 'center',
              }}>
                <Search className="w-8 h-8" style={{ color: biscuit.textLight, margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: biscuit.text, marginBottom: 4 }}>
                  No matching dispatches found
                </h3>
                <p style={{ fontSize: 13, color: biscuit.textMuted, marginBottom: 16 }}>
                  Try adjusting your search terms or filters.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                  style={{
                    padding: '6px 16px', borderRadius: 10, border: `1px solid ${biscuit.border}`,
                    background: biscuit.cardHover, fontSize: 12, fontWeight: 600, color: biscuit.text,
                    cursor: 'pointer',
                  }}
                >
                  Reset filters
                </button>
              </div>
            ) : (() => {
              const mostRecentPublishedId = posts.find(p => p.variants.some(v => v.status === 'published'))?.id;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {filteredPosts.map((post, idx) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      delay={idx * 0.04}
                      onRefresh={loadData}
                      onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                      profileSubdomain={profileSubdomain}
                      isMostRecentPublished={post.id === mostRecentPublishedId}
                    />
                  ))}
                </div>
              );
            })()}
          </motion.div>
        )}

        {tab === 'dna' && (
          <motion.div
            key="dna-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* ── Educational "Why Post DNA?" Hero Card ───────────────────── */}
            <AnimatePresence>
              {showDNAInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF5ED 100%)',
                    borderRadius: 20, border: `1px solid ${biscuit.border}`,
                    padding: '24px 24px 20px', marginBottom: 20,
                    boxShadow: '0 4px 16px rgba(61,43,31,0.04)',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: biscuit.accentBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Wand2 className="w-5 h-5" style={{ color: biscuit.accent }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h2 style={{ fontSize: 16, fontWeight: 800, color: biscuit.text, letterSpacing: '-0.01em' }}>
                            What is Post DNA & Why Does It Matter?
                          </h2>
                          <span style={{
                            fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                            padding: '2px 8px', borderRadius: 10,
                            background: biscuit.accent, color: '#fff', letterSpacing: '0.04em',
                          }}>
                            Algorithmic Intelligence
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: biscuit.textMuted, marginTop: 2 }}>
                          Your unique content genetic code across social algorithms.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowDNAInfo(false)}
                      style={{
                        padding: '4px 8px', borderRadius: 8, border: 'none',
                        background: 'transparent', color: biscuit.textLight, cursor: 'pointer',
                        fontSize: 12, fontWeight: 600,
                      }}
                      title="Dismiss explanation"
                    >
                      Hide
                    </button>
                  </div>

                  <p style={{ fontSize: 13.5, color: biscuit.text, lineHeight: 1.6, marginBottom: 18 }}>
                    Social algorithms on LinkedIn, X, Threads, and Bluesky don’t read content like humans—they evaluate
                    <strong> structural DNA</strong>: opening hook triggers, word pacing, media multiplier, and release cadence.
                    Post DNA monitors every story you dispatch, decodes which styles stop the scroll, and tells you exactly
                    how to engineer higher reach without posting blind.
                  </p>

                  {/* 4 Pillars Grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
                    paddingTop: 12, borderTop: `1px solid ${biscuit.borderLight}`,
                  }}>
                    {[
                      { icon: <Zap className="w-4 h-4" style={{ color: '#F59E0B' }} />, title: '1. Hook Archetype', desc: 'The first sentence trigger that decides 3-sec dropoff.' },
                      { icon: <Clock className="w-4 h-4" style={{ color: '#3B82F6' }} />, title: '2. Golden Hour', desc: 'First 60 minutes when algorithms test your engagement velocity.' },
                      { icon: <BarChart2 className="w-4 h-4" style={{ color: '#10B981' }} />, title: '3. Density & Pacing', desc: 'Word count rhythm and punchiness for dwell time.' },
                      { icon: <Target className="w-4 h-4" style={{ color: '#8B5CF6' }} />, title: '4. Network Synergy', desc: 'Optimal distribution across all your connected profiles.' },
                    ].map(p => (
                      <div key={p.title} style={{
                        background: biscuit.card, borderRadius: 12, padding: '10px 12px',
                        border: `1px solid ${biscuit.borderLight}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          {p.icon}
                          <span style={{ fontSize: 11, fontWeight: 700, color: biscuit.text }}>{p.title}</span>
                        </div>
                        <p style={{ fontSize: 11, color: biscuit.textMuted, lineHeight: 1.4 }}>{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showDNAInfo && (
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDNAInfo(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 600, color: biscuit.accent,
                    background: biscuit.card, border: `1px solid ${biscuit.border}`,
                    padding: '6px 14px', borderRadius: 12, cursor: 'pointer',
                  }}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>How Post DNA works</span>
                </button>
              </div>
            )}

            {/* ── DNA Intelligence View ─────────────────────────────────── */}
            <DNAView resonance={resonance} posts={posts} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Post Card Component ────────────────────────────────────────────────── */
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
  const [isHovered, setIsHovered] = useState(false);

  const hookMeta = HOOK_META[post.hookType || ''] || HOOK_META.statement;

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

  const cardBorder = isDraft
    ? `1px solid ${biscuit.border}`
    : age === 'active'
    ? `1px solid ${biscuit.terracotta}60`
    : `1px solid ${biscuit.border}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: biscuit.card,
        borderRadius: 20,
        border: cardBorder,
        overflow: 'hidden',
        boxShadow: age === 'active'
          ? '0 4px 20px rgba(194,94,56,0.1), 0 1px 3px rgba(61,43,31,0.04)'
          : isHovered
          ? '0 6px 20px rgba(61,43,31,0.06)'
          : '0 2px 8px rgba(61,43,31,0.03)',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Active Golden Hour glowing top strip */}
      {age === 'active' && !isDraft && (
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg, #C25E38, #C4A265, #E5A93C, #C25E38)',
          backgroundSize: '200% 100%',
        }} />
      )}

      {/* Card Header */}
      <div style={{
        padding: '16px 20px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isDraft ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700,
              padding: '4px 10px', borderRadius: 20,
              background: biscuit.accentBg, color: biscuit.textMuted,
              border: `1px solid ${biscuit.border}`,
            }}>
              <FileText className="w-3.5 h-3.5" style={{ color: biscuit.accent }} />
              Draft Dispatch
            </span>
          ) : age === 'active' ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700,
              padding: '4px 12px', borderRadius: 20,
              background: biscuit.terracottaBg, color: biscuit.terracotta,
              border: `1px solid ${biscuit.terracotta}40`,
            }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              Golden Hour — {goldenRemaining}m remaining
            </span>
          ) : age === 'settling' ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 600,
              padding: '4px 10px', borderRadius: 20,
              background: '#EFF6FF', color: '#1D4ED8',
              border: '1px solid #BFDBFE',
            }}>
              <Clock className="w-3 h-3" />
              Settling (Active 24h)
            </span>
          ) : (
            <span style={{ fontSize: 12, color: biscuit.textLight, fontWeight: 500 }}>
              {format(new Date(post.createdAt), 'MMM d, yyyy · h:mm a')}
            </span>
          )}

          {/* Hook Badge */}
          {post.hookType && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 600,
              padding: '3px 9px', borderRadius: 16,
              background: hookMeta.bg, color: hookMeta.color,
              border: `1px solid ${hookMeta.color}25`,
            }}>
              {hookMeta.icon}
              <span>{hookMeta.label}</span>
            </span>
          )}
        </div>

        {age !== 'cooled' && (
          <span style={{ fontSize: 12, color: biscuit.textLight, fontWeight: 500 }}>
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Content Body */}
      <p style={{
        padding: '6px 20px 14px', fontSize: 14.5, color: biscuit.text,
        lineHeight: 1.6, whiteSpace: 'pre-wrap',
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {post.content}
      </p>

      {/* Platform Variants Row */}
      {post.variants.length > 0 && (
        <div style={{
          padding: '12px 20px',
          background: biscuit.cardHover,
          borderTop: `1px solid ${biscuit.borderLight}`,
          display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: biscuit.textLight, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>
            Networks:
          </span>
          {post.variants.map(variant => {
            const cfg = PlatformLogos[variant.platform];
            const Logo = cfg?.logo;
            const isLive = variant.status === 'published';
            const isPending = variant.status === 'draft' || variant.status === 'pending';
            const isFailed = variant.status === 'failed';

            if (isLive && variant.platformUrl) {
              return (
                <a
                  key={variant.id}
                  href={variant.platformUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 12,
                    background: biscuit.card,
                    border: `1px solid ${biscuit.border}`,
                    textDecoration: 'none',
                    fontSize: 12, fontWeight: 600, color: biscuit.text,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = cfg?.color || biscuit.text;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = biscuit.border;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                  title={`View live on ${cfg?.name || variant.platform}`}
                >
                  {Logo && <Logo size={15} />}
                  <span>{cfg?.name || variant.platform}</span>
                  <ExternalLink className="w-3 h-3" style={{ color: biscuit.textLight }} />
                </a>
              );
            }

            return (
              <div
                key={variant.id}
                onClick={isFailed ? () => toast.error(`${cfg?.name || variant.platform} Failed`, { description: variant.error?.message || 'Verification error or platform connection issue.' }) : undefined}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 12,
                  background: isFailed ? '#FEF2F2' : biscuit.card,
                  border: isFailed ? '1px solid #FECACA' : `1px solid ${biscuit.borderLight}`,
                  fontSize: 12, fontWeight: 600,
                  color: isFailed ? '#DC2626' : biscuit.textMuted,
                  cursor: isFailed ? 'pointer' : 'default',
                }}
              >
                {Logo && <Logo size={15} />}
                <span>{cfg?.name || variant.platform}</span>
                {isFailed && <AlertCircle className="w-3 h-3" style={{ color: '#EF4444' }} />}
                {isPending && <span style={{ fontSize: 10, color: biscuit.textLight }}>(queue)</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Failure Diagnostic Banner */}
      {failedVariants.length > 0 && (
        <div style={{
          padding: '10px 20px', background: '#FEF2F2', borderTop: '1px solid #FECACA',
          fontSize: 12, color: '#B91C1C', display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {failedVariants.map(fv => (
            <div key={fv.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#EF4444' }} />
              <span>
                <strong>{PlatformLogos[fv.platform]?.name || fv.platform}:</strong>{' '}
                {fv.error?.message || 'Delivery failed. Reconnect your account in Settings.'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Card Footer Actions */}
      <div style={{
        padding: '12px 20px',
        background: biscuit.card,
        borderTop: `1px solid ${biscuit.borderLight}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {publishedVariants.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: biscuit.emerald }}>
              <CheckCircle className="w-3.5 h-3.5" />
              {publishedVariants.length} live
            </span>
          )}
          {pendingVariants.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: biscuit.accent }}>
              <Clock className="w-3.5 h-3.5" />
              {pendingVariants.length} pending
            </span>
          )}
          {failedVariants.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#DC2626' }}>
              <AlertCircle className="w-3.5 h-3.5" />
              {failedVariants.length} failed
            </span>
          )}
          <span style={{ fontSize: 11, color: biscuit.textLight }}>
            {post.wordCount || post.content.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {isDraft ? (
            <>
              <Link
                href={`/dashboard/publish?postId=${post.id}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 12,
                  fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  background: biscuit.activeBg, color: biscuit.activeFg,
                  boxShadow: '0 2px 6px rgba(61,43,31,0.15)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Review & Publish</span>
              </Link>

              {confirmDelete ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    style={{
                      padding: '5px 10px', borderRadius: 8, border: 'none',
                      background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{
                      padding: '5px 8px', borderRadius: 8, border: 'none',
                      background: 'transparent', color: biscuit.textMuted, fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    padding: '6px 12px', borderRadius: 12,
                    background: '#FEF2F2', border: '1px solid #FECACA',
                    color: '#DC2626', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}
                  title="Delete draft dispatch"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </>
          ) : (
            isMostRecentPublished && (
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Check out my latest story across platforms:\n\n👉 ${
                    typeof window !== 'undefined' ? window.location.origin : 'https://unool.co'
                  }/u/${profileSubdomain || 'preview'}?activity=1\n\nThanks! ❤️`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 12,
                  background: '#25D366', color: '#fff',
                  fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(37,211,102,0.25)',
                }}
                title="Share One Link to WhatsApp"
              >
                <PlatformLogos.whatsapp.logo size={14} />
                <span>Share Story</span>
              </a>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Post DNA View / Advanced Intelligence Dashboard ─────────────────────── */
function DNAView({ resonance, posts }: { resonance: ResonanceData | null; posts: SignalPost[] }) {
  if (!resonance) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Sparkles className="w-8 h-8 animate-spin" style={{ color: biscuit.accent, margin: '0 auto 12px' }} />
        <p style={{ fontSize: 14, color: biscuit.textMuted, fontWeight: 500 }}>
          Decoding content DNA metrics…
        </p>
      </div>
    );
  }

  // If user has 0 posts published, show rich interactive preview onboarding
  if (!resonance.hasData || resonance.totalPosts === 0) {
    return <DNAOnboarding />;
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

  // Hours mini-chart
  const hourDistribution = resonance.hourDistribution || new Array(24).fill(0);
  if (!resonance.hourDistribution && patternRows.length > 0) {
    patternRows.forEach(r => { hourDistribution[r.hourOfDay]++; });
  }
  const maxHour = Math.max(...hourDistribution, 1);

  // Word length breakdown
  const wcBuckets = [
    { label: 'Micro (<50w)', min: 0, max: 49, count: 0, tag: 'Punchy' },
    { label: 'Sweet-spot (50–120w)', min: 50, max: 120, count: 0, tag: 'High Dwell' },
    { label: 'Thought (120–250w)', min: 121, max: 250, count: 0, tag: 'Authority' },
    { label: 'Deep (250w+)', min: 251, max: Infinity, count: 0, tag: 'Newsletter' },
  ];
  patternRows.forEach(r => {
    const bucket = wcBuckets.find(b => r.wordCount >= b.min && r.wordCount <= b.max);
    if (bucket) bucket.count++;
  });
  const maxWc = Math.max(...wcBuckets.map(b => b.count), 1);

  // Streak
  const publishDates = new Set(
    posts.filter(p => p.variants.some(v => v.status === 'published')).map(p => format(new Date(p.createdAt), 'yyyy-MM-dd'))
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (publishDates.has(format(d, 'yyyy-MM-dd'))) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Tier classification based on score
  const tierName = resonanceScore >= 80 ? 'Authority Architect' : resonanceScore >= 50 ? 'Ascending Catalyst' : 'Emerging Voice';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Hero DNA Score Card ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          background: biscuit.card,
          borderRadius: 24, padding: '28px 24px',
          border: `1px solid ${biscuit.border}`,
          boxShadow: '0 4px 20px rgba(61,43,31,0.04)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Sparkles className="w-4 h-4" style={{ color: biscuit.accent }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: biscuit.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Content Resonance Index
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h2 style={{
                fontSize: 48, fontWeight: 800, color: biscuit.text,
                letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'var(--font-syne), serif',
              }}>
                <AnimatedNumber value={resonanceScore} suffix="/100" />
              </h2>
              <span style={{
                fontSize: 12, fontWeight: 700,
                padding: '4px 12px', borderRadius: 20,
                background: biscuit.accentBg, color: biscuit.text,
                border: `1px solid ${biscuit.border}`,
              }}>
                {tierName}
              </span>
            </div>
            <p style={{ fontSize: 13, color: biscuit.textMuted, marginTop: 6 }}>
              Composite score calculated from your hook variety, delivery reliability, word pacing, and network spread.
            </p>
          </div>

          {/* Quick Metrics Quartet */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, minWidth: 260 }}>
            <div style={{ background: biscuit.cardHover, borderRadius: 14, padding: '12px 14px', border: `1px solid ${biscuit.borderLight}` }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: biscuit.textLight, textTransform: 'uppercase' }}>Analyzed</span>
              <p style={{ fontSize: 20, fontWeight: 800, color: biscuit.text, marginTop: 2 }}>{resonance.totalPosts} posts</p>
            </div>
            <div style={{ background: biscuit.cardHover, borderRadius: 14, padding: '12px 14px', border: `1px solid ${biscuit.borderLight}` }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: biscuit.textLight, textTransform: 'uppercase' }}>Avg Pacing</span>
              <p style={{ fontSize: 20, fontWeight: 800, color: biscuit.text, marginTop: 2 }}>{avgWords} words</p>
            </div>
            <div style={{ background: biscuit.cardHover, borderRadius: 14, padding: '12px 14px', border: `1px solid ${biscuit.borderLight}` }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: biscuit.textLight, textTransform: 'uppercase' }}>Media Rate</span>
              <p style={{ fontSize: 20, fontWeight: 800, color: biscuit.text, marginTop: 2 }}>{mediaRatio}%</p>
            </div>
            <div style={{ background: biscuit.cardHover, borderRadius: 14, padding: '12px 14px', border: `1px solid ${biscuit.borderLight}` }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: biscuit.textLight, textTransform: 'uppercase' }}>Cadence</span>
              <p style={{ fontSize: 20, fontWeight: 800, color: biscuit.text, marginTop: 2 }}>{streak}d streak</p>
            </div>
          </div>
        </div>

        {/* Resonance Bar */}
        <div style={{ height: 8, background: biscuit.sidebar, borderRadius: 100, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${resonanceScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              height: '100%', borderRadius: 100,
              background: `linear-gradient(90deg, ${biscuit.accent}, #E5A93C, ${biscuit.terracotta})`,
            }}
          />
        </div>
      </motion.div>

      {/* ── Hook Archetypes: The 6 Pillars of Engagement ─────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        style={{
          background: biscuit.card, borderRadius: 24, padding: '24px',
          border: `1px solid ${biscuit.border}`,
          boxShadow: '0 2px 12px rgba(61,43,31,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: biscuit.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap className="w-4 h-4" style={{ color: biscuit.accent }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: biscuit.text }}>
                Hook Archetype Spectrum
              </h3>
            </div>
            <p style={{ fontSize: 13, color: biscuit.textMuted, marginTop: 2 }}>
              The opening 3-second triggers detected in your content library.
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: biscuit.textLight }}>
            {resonance.hookBreakdown.length} / 6 Archetypes Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {['statement', 'question', 'statistic', 'story', 'contrarian', 'framework'].map((hookKey) => {
            const meta = HOOK_META[hookKey];
            const breakdownItem = resonance.hookBreakdown.find(b => b.type === hookKey);
            const isUsed = Boolean(breakdownItem && breakdownItem.count > 0);
            const count = breakdownItem?.count || 0;
            const pctOfTotal = resonance.totalPosts > 0 ? Math.round((count / resonance.totalPosts) * 100) : 0;
            const sampleSnippet = breakdownItem?.samples?.[0];

            return (
              <div
                key={hookKey}
                style={{
                  background: isUsed ? biscuit.card : biscuit.cardHover,
                  borderRadius: 16, padding: '16px',
                  border: isUsed ? `1px solid ${biscuit.border}` : `1px dashed ${biscuit.borderLight}`,
                  opacity: isUsed ? 1 : 0.65,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: meta.bg, color: meta.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {meta.icon}
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: biscuit.text }}>
                        {meta.label}
                      </span>
                    </div>

                    {isUsed ? (
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        padding: '2px 8px', borderRadius: 10,
                        background: meta.bg, color: meta.color,
                      }}>
                        {count} posts ({pctOfTotal}%)
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: biscuit.textLight, fontWeight: 500 }}>
                        Untapped
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: 12, color: biscuit.textMuted, lineHeight: 1.45, marginBottom: 10 }}>
                    {meta.desc}
                  </p>
                </div>

                {isUsed && sampleSnippet ? (
                  <div style={{
                    fontSize: 11.5, color: biscuit.text, fontStyle: 'italic',
                    background: biscuit.sidebar, borderRadius: 8, padding: '6px 10px',
                    borderLeft: `3px solid ${meta.color}`,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    “{sampleSnippet}…”
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: biscuit.accent, fontWeight: 600 }}>
                    💡 Pro tip: Try this style in your next Studio post
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Timing & Launch Windows ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Peak Day Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          style={{
            background: biscuit.card, borderRadius: 24, padding: '24px',
            border: `1px solid ${biscuit.border}`,
            boxShadow: '0 2px 12px rgba(61,43,31,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Calendar className="w-4 h-4" style={{ color: '#2563EB' }} />
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: biscuit.text }}>
                Peak Day of Week
              </h4>
              <p style={{ fontSize: 12, color: biscuit.textMuted }}>
                {resonance.bestDay ? `${resonance.bestDay.name} (${resonance.bestDay.count} posts)` : 'Tracking patterns…'}
              </p>
            </div>
          </div>

          {/* 7-Day Visual Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90, marginBottom: 10 }}>
            {dayNames.map((name, idx) => {
              const count = dayDistribution[idx] || 0;
              const heightPct = count > 0 ? (count / maxDay) * 100 : 8;
              const isBest = resonance.bestDay?.day === idx;

              return (
                <div key={name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.6, delay: 0.2 + idx * 0.05 }}
                    style={{
                      width: '100%', borderRadius: '6px 6px 2px 2px',
                      background: isBest
                        ? `linear-gradient(180deg, ${biscuit.accent}, ${biscuit.accentLight})`
                        : count > 0 ? biscuit.border : biscuit.sidebar,
                      boxShadow: isBest ? '0 2px 8px rgba(196,162,101,0.3)' : 'none',
                    }}
                    title={`${name}: ${count} posts`}
                  />
                  <span style={{ fontSize: 10, fontWeight: isBest ? 800 : 600, color: isBest ? biscuit.text : biscuit.textLight }}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Peak Hour Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          style={{
            background: biscuit.card, borderRadius: 24, padding: '24px',
            border: `1px solid ${biscuit.border}`,
            boxShadow: '0 2px 12px rgba(61,43,31,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock className="w-4 h-4" style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: biscuit.text }}>
                Peak Launch Hour
              </h4>
              <p style={{ fontSize: 12, color: biscuit.textMuted }}>
                {resonance.bestHour ? `${resonance.bestHour.label} (${resonance.bestHour.count} posts)` : 'Tracking times…'}
              </p>
            </div>
          </div>

          {/* 24-Hour Horizon Graph (6am to 11pm) */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 90, marginBottom: 10 }}>
            {Array.from({ length: 18 }, (_, i) => i + 6).map(h => {
              const count = hourDistribution[h % 24] || 0;
              const intensity = count / maxHour;
              const isBest = resonance.bestHour?.hour === (h % 24);

              return (
                <div key={h} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(intensity * 100, 8)}%` }}
                    transition={{ duration: 0.5, delay: 0.2 + (h - 6) * 0.02 }}
                    style={{
                      width: '100%', borderRadius: 2,
                      background: isBest ? '#7C3AED' : count > 0 ? '#C4B5FD' : biscuit.sidebar,
                    }}
                    title={`${h % 12 || 12}${h >= 12 ? 'pm' : 'am'}: ${count} posts`}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: biscuit.textLight }}>
            <span>6:00 AM</span>
            <span>12:00 PM</span>
            <span>11:00 PM</span>
          </div>
        </motion.div>
      </div>

      {/* ── Content Pacing & Platform Matrix ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Word Count Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          style={{
            background: biscuit.card, borderRadius: 24, padding: '24px',
            border: `1px solid ${biscuit.border}`,
            boxShadow: '0 2px 12px rgba(61,43,31,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: biscuit.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Type className="w-4 h-4" style={{ color: biscuit.accent }} />
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: biscuit.text }}>
                Length & Pacing Spectrum
              </h4>
              <p style={{ fontSize: 12, color: biscuit.textMuted }}>
                Average: {avgWords} words per post
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {wcBuckets.map(b => {
              const pct = (b.count / maxWc) * 100;
              return (
                <div key={b.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: biscuit.text }}>{b.label}</span>
                    <span style={{ color: biscuit.textMuted }}>{b.count} posts</span>
                  </div>
                  <div style={{ height: 6, background: biscuit.sidebar, borderRadius: 100, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                      style={{ height: '100%', background: biscuit.accent, borderRadius: 100 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Platform Synergy */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          style={{
            background: biscuit.card, borderRadius: 24, padding: '24px',
            border: `1px solid ${biscuit.border}`,
            boxShadow: '0 2px 12px rgba(61,43,31,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Target className="w-4 h-4" style={{ color: biscuit.emerald }} />
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: biscuit.text }}>
                Platform Footprint
              </h4>
              <p style={{ fontSize: 12, color: biscuit.textMuted }}>
                Cross-channel distribution volume
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topPlatforms.length > 0 ? (
              topPlatforms.map(([platform, count]) => {
                const cfg = PlatformLogos[platform];
                const Logo = cfg?.logo;
                const maxP = topPlatforms[0][1];
                const pct = (count / maxP) * 100;

                return (
                  <div key={platform}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {Logo && <Logo size={14} />}
                        <span style={{ fontSize: 12, fontWeight: 600, color: biscuit.text }}>{cfg?.name || platform}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: biscuit.text }}>{count} live</span>
                    </div>
                    <div style={{ height: 6, background: biscuit.sidebar, borderRadius: 100, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                        style={{ height: '100%', background: cfg?.color || biscuit.text, borderRadius: 100 }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: 13, color: biscuit.textLight, textAlign: 'center', padding: '20px 0' }}>
                No cross-platform variant data yet.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Actionable AI Prescriptions ──────────────────────────────── */}
      {resonance.recommendations && resonance.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.35 }}
          style={{
            background: biscuit.card, borderRadius: 24, padding: '24px',
            border: `1px solid ${biscuit.border}`,
            boxShadow: '0 2px 12px rgba(61,43,31,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: biscuit.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Compass className="w-4 h-4" style={{ color: biscuit.accent }} />
            </div>
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: biscuit.text }}>
                Content Strategy Prescriptions
              </h4>
              <p style={{ fontSize: 12, color: biscuit.textMuted }}>
                Direct suggestions generated from your real delivery statistics.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {resonance.recommendations.map(rec => (
              <div
                key={rec.id}
                style={{
                  background: biscuit.cardHover, borderRadius: 16, padding: '16px',
                  border: `1px solid ${biscuit.borderLight}`,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: biscuit.accent }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: biscuit.text }}>
                      {rec.title}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: biscuit.textMuted, lineHeight: 1.5 }}>
                    {rec.desc}
                  </p>
                </div>

                <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${biscuit.borderLight}` }}>
                  <Link
                    href="/dashboard/composer"
                    style={{
                      fontSize: 11, fontWeight: 700, color: biscuit.accent,
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <span>Apply in Studio</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── DNA Onboarding State ───────────────────────────────────────────────── */
function DNAOnboarding() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        background: biscuit.card,
        borderRadius: 24, border: `2px dashed ${biscuit.border}`,
        padding: '56px 32px', textAlign: 'center',
      }}
    >
      <div style={{
        width: 60, height: 60, borderRadius: 20, margin: '0 auto 20px',
        background: biscuit.activeBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(61,43,31,0.2)',
      }}>
        <Sparkles className="w-7 h-7" style={{ color: biscuit.accentLight }} />
      </div>

      <h3 style={{
        fontSize: 24, fontWeight: 800, color: biscuit.text,
        marginBottom: 8, letterSpacing: '-0.02em', fontFamily: 'var(--font-syne), serif',
      }}>
        Initialize Your Post DNA
      </h3>
      <p style={{ fontSize: 14, color: biscuit.textMuted, maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.6 }}>
        Post DNA decodes your content patterns across social algorithms. Once you broadcast your first story
        from Studio or queue a dispatch in Flight Plan, your genetic intelligence engine will automatically unlock.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        <Link
          href="/dashboard/composer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 22px', borderRadius: 12,
            background: biscuit.activeBg, color: biscuit.activeFg,
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(61,43,31,0.2)',
          }}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Broadcast From Studio</span>
        </Link>
        <Link
          href="/dashboard/flightplan"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 22px', borderRadius: 12,
            background: biscuit.card, color: biscuit.text,
            border: `1px solid ${biscuit.border}`,
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}
        >
          <Calendar className="w-4 h-4" style={{ color: biscuit.accent }} />
          <span>Plan In Flight Plan</span>
        </Link>
      </div>
    </motion.div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        background: biscuit.card, borderRadius: 24,
        border: `2px dashed ${biscuit.border}`,
        padding: '56px 32px', textAlign: 'center',
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 18, margin: '0 auto 16px',
        background: biscuit.sidebar,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Activity className="w-7 h-7" style={{ color: biscuit.accent }} />
      </div>

      <h3 style={{ fontSize: 20, fontWeight: 800, color: biscuit.text, marginBottom: 6 }}>
        No Signal dispatches yet
      </h3>
      <p style={{ fontSize: 14, color: biscuit.textMuted, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5 }}>
        Broadcast simultaneously to LinkedIn, X, Threads, Bluesky and Instagram in one click.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        <Link
          href="/dashboard/composer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 22px', borderRadius: 12,
            background: biscuit.activeBg, color: biscuit.activeFg,
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}
        >
          <span>Open Studio</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
