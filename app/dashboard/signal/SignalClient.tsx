'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle, Clock, Zap, TrendingUp, BarChart2, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';

// ── Real platform SVG logos ──────────────────────────────────────────────────

const PlatformLogos: Record<string, { logo: React.FC<{ size?: number }>; name: string; color: string }> = {
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    logo: ({ size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2">
        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a1.66 1.66 0 000 1.14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
      </svg>
    ),
  },
  x: {
    name: 'X',
    color: '#000000',
    logo: ({ size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  threads: {
    name: 'Threads',
    color: '#000000',
    logo: ({ size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 192 192" fill="currentColor">
        <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.745C82.2364 44.745 70.1369 51.5765 63.5765 63.3545L75.2024 70.6031C80.0505 62.2784 88.2266 58.2497 97.222 58.2497C97.302 58.2497 97.3826 58.2497 97.4632 58.2504C108.311 58.3263 116.373 63.2067 121.072 72.5739C124.474 79.3627 125.795 87.5692 125.011 97.0684C118.716 93.8805 111.245 92.2816 103.087 92.2816C78.5459 92.2816 62.2275 105.888 63.285 126.383C63.8385 137.188 69.2854 146.683 78.4808 152.904C86.4024 158.267 96.3883 160.734 106.667 160.173C120.063 159.443 130.581 154.26 137.955 144.781C143.578 137.601 147.258 128.527 149.104 117.317C154.118 120.112 157.935 123.802 160.351 128.423C164.651 136.891 165.029 150.511 155.909 159.773C147.762 168.041 137.856 171.894 122.933 172.032C106.162 171.878 93.5498 167.049 85.2527 157.723C77.3733 148.852 73.2517 136.543 72.9765 121.148C73.2517 105.752 77.3733 93.4436 85.2527 84.573C93.5498 75.2477 106.162 70.4181 122.933 70.264Z" />
      </svg>
    ),
  },
  instagram: {
    name: 'Instagram',
    color: '#E1306C',
    logo: ({ size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <defs>
          <radialGradient id="ig-rg" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="50%" stopColor="#fd5949" />
            <stop offset="68%" stopColor="#d6249f" />
            <stop offset="100%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <path fill="url(#ig-rg)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    logo: ({ size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  bluesky: {
    name: 'Bluesky',
    color: '#0085ff',
    logo: ({ size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 360 320" fill="#0085ff">
        <path d="M180 141.964C163.699 110.262 119.308 51.1817 78.0834 31.0445C38.4622 11.6012 1.01713 22.5943 1.01713 74.2913C1.01713 84.0502 6.28388 149.135 9.29108 160.994C21.6498 207.979 70.8174 219.185 115.124 212.405C175.154 202.921 256.555 190.651 180 141.964ZM180 141.964C196.301 110.262 240.692 51.1817 281.917 31.0445C321.538 11.6012 358.983 22.5943 358.983 74.2913C358.983 84.0502 353.716 149.135 350.709 160.994C338.35 207.979 289.183 219.185 244.876 212.405C184.846 202.921 103.445 190.651 180 141.964Z" />
        <path d="M180.026 194.895C180.026 194.895 133.738 210.527 118.981 242.765C109.649 263.297 112.956 295.538 155.77 301.622C169.285 303.566 185.24 302.805 199.999 299.375C214.747 295.949 228.248 288.741 237.019 277.879C250.534 261.146 247.888 225.469 232.975 212.205C218.076 198.953 180.026 194.895 180.026 194.895Z" />
      </svg>
    ),
  },
  whatsapp: {
    name: 'WhatsApp',
    color: '#25D366',
    logo: ({ size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    logo: ({ size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
};

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
  hookBreakdown: Array<{ type: string; count: number; avgSuccess: number }>;
  bestDay: { day: number; name: string; count: number } | null;
  bestHour: { hour: number; label: string; count: number } | null;
};

const HOOK_LABELS: Record<string, string> = {
  question: 'Question hook',
  statement: 'Statement hook',
  statistic: 'Statistic / number hook',
  story: 'Story / personal hook',
  unknown: 'Other',
};

const HOOK_COLORS: Record<string, string> = {
  question: '#6366f1',
  statement: '#0ea5e9',
  statistic: '#f59e0b',
  story: '#ec4899',
  unknown: '#9ca3af',
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
  return Math.round(60 - ageMin);
}

function LiveIndicator() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
    </span>
  );
}

export function SignalClient() {
  const [posts, setPosts] = useState<SignalPost[]>([]);
  const [resonance, setResonance] = useState<ResonanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'feed' | 'dna'>('feed');

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

  // Poll every 3 seconds if any active post has pending variants
  useEffect(() => {
    const hasPending = posts.some(p =>
      getPostAge(p.createdAt) === 'active' &&
      p.variants.some(v => v.status === 'draft' || v.status === 'pending')
    );
    if (!hasPending) return;
    const t = setInterval(loadData, 3000);
    return () => clearInterval(t);
  }, [posts, loadData]);

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
          <p className="text-sm text-gray-400">Loading Signal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Signal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your posts, live. Where they go, what they build.</p>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setTab('feed')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              tab === 'feed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setTab('dna')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              tab === 'dna' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Post DNA
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'feed' && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {posts.length === 0 ? (
              <EmptyState />
            ) : (
              posts.map((post, i) => (
                <PostCard key={post.id} post={post} delay={i * 0.05} onRefresh={loadData} />
              ))
            )}
          </motion.div>
        )}

        {tab === 'dna' && (
          <motion.div
            key="dna"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <DNAView resonance={resonance} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, delay, onRefresh }: { post: SignalPost; delay: number; onRefresh: () => void }) {
  const age = getPostAge(post.createdAt);
  const goldenRemaining = getGoldenHourRemaining(post.createdAt);
  const publishedVariants = post.variants.filter(v => v.status === 'published');
  const pendingVariants = post.variants.filter(v => v.status === 'draft' || v.status === 'pending');
  const failedVariants = post.variants.filter(v => v.status === 'failed');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22 }}
      className="bg-white rounded-2xl border overflow-hidden"
      style={{
        borderColor: age === 'active' ? '#fbbf24' : age === 'settling' ? '#e5e7eb' : '#f3f4f6',
        boxShadow: age === 'active' ? '0 0 0 1px #fbbf2420, 0 4px 24px #fbbf2415' : '0 1px 4px #0000000a',
      }}
    >
      {/* Card header: age badge + time */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {age === 'active' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <LiveIndicator />
              Active — {goldenRemaining}m left in golden hour
            </span>
          )}
          {age === 'settling' && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              <Clock className="w-3 h-3" />
              Settling
            </span>
          )}
          {age === 'cooled' && (
            <span className="text-xs text-gray-400">{format(new Date(post.createdAt), 'MMM d, h:mm a')}</span>
          )}
        </div>
        {age !== 'cooled' && (
          <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
        )}
      </div>

      {/* Content preview */}
      <p className="px-5 py-2 text-[15px] text-gray-800 leading-relaxed line-clamp-3">
        {post.content}
      </p>

      {/* Platform status row */}
      {post.variants.length > 0 && (
        <div className="px-5 py-3 flex flex-wrap gap-2 border-t border-gray-50">
          {post.variants.map(variant => {
            const cfg = PlatformLogos[variant.platform];
            const Logo = cfg?.logo;
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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 transition-colors group"
                    style={{ borderColor: cfg?.color ? `${cfg.color}30` : '#e5e7eb' }}
                    title={`View on ${cfg?.name || variant.platform}`}
                  >
                    {Logo && <Logo size={16} />}
                    <span className="text-xs font-medium text-gray-700">{cfg?.name || variant.platform}</span>
                    <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </a>
                ) : (
                  <motion.div
                    animate={isPending ? { opacity: [1, 0.5, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                      isFailed ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}
                    title={isFailed ? (variant.error?.message || 'Failed') : `Publishing to ${cfg?.name}...`}
                  >
                    {Logo && <Logo size={16} />}
                    <span className={`text-xs font-medium ${isFailed ? 'text-red-600' : 'text-gray-500'}`}>
                      {cfg?.name || variant.platform}
                    </span>
                    {isFailed && <AlertCircle className="w-3 h-3 text-red-400" />}
                    {isPending && <span className="text-[10px] text-gray-400 ml-0.5">sending…</span>}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary footer */}
      <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
        {publishedVariants.length > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-3.5 h-3.5" />
            {publishedVariants.length} live
          </span>
        )}
        {pendingVariants.length > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            {pendingVariants.length} pending
          </span>
        )}
        {failedVariants.length > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {failedVariants.length} failed
          </span>
        )}
        {post.hookType && (
          <span className="ml-auto capitalize flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {HOOK_LABELS[post.hookType] || post.hookType}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Post DNA / Resonance View ────────────────────────────────────────────────

function DNAView({ resonance }: { resonance: ResonanceData | null }) {
  if (!resonance) {
    return (
      <div className="py-16 text-center text-gray-400">
        <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Loading your Post DNA...</p>
      </div>
    );
  }

  if (!resonance.hasData || resonance.totalPosts < 3) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
        <TrendingUp className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <h3 className="font-semibold text-gray-700 mb-1">Building your Post DNA</h3>
        <p className="text-sm text-gray-400 max-w-xs mx-auto">
          Publish at least 3 posts and Signal will start showing you which content patterns work best for you — from your own data, not benchmarks.
        </p>
        <div className="mt-4 text-xs text-gray-400">
          {resonance.totalPosts} / 3 posts published
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total posts */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Based on your last {resonance.totalPosts} published posts</p>

        {/* Hook type breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            Hook type performance
          </p>
          {resonance.hookBreakdown.map((item, i) => (
            <div key={item.type} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{HOOK_LABELS[item.type] || item.type}</span>
                <span className="font-semibold text-gray-800">{item.avgSuccess}% delivery rate · {item.count} posts</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.avgSuccess}%` }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: HOOK_COLORS[item.type] || '#9ca3af' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best timing */}
      <div className="grid grid-cols-2 gap-3">
        {resonance.bestDay && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Most active day</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{resonance.bestDay.name.slice(0, 3)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{resonance.bestDay.count} posts</p>
          </div>
        )}
        {resonance.bestHour && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Most active time</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{resonance.bestHour.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{resonance.bestHour.count} posts</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center pb-4">
        This is built from your actual publish history, not generic benchmarks.
        Every post you publish makes this more accurate.
      </p>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
        <Zap className="w-6 h-6 text-gray-300" />
      </div>
      <h3 className="font-semibold text-gray-700 mb-1">No posts yet</h3>
      <p className="text-sm text-gray-400 mb-5">Publish your first post from the Studio and it will appear here instantly.</p>
      <Link
        href="/dashboard/composer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        Open Studio
      </Link>
    </div>
  );
}
