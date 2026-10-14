'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, RefreshCw, Zap, TrendingUp, BarChart2, Calendar, Sparkles, Pencil, Trash2, Loader2, FileText, Share2, Copy, Link2, X } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

import { PlatformLogos, getPlatformConfig } from '@/components/dashboard/PlatformLogos';


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
  const [profileSubdomain, setProfileSubdomain] = useState<string | null>(null);

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

  // Poll every 3 seconds only if any active post has actively pending in-flight publishing
  useEffect(() => {
    const hasPending = posts.some(p =>
      p.variants.some(v => v.status === 'pending')
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
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
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
          <Link
            href="/dashboard/schedule"
            className="px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
            title="View or plan upcoming scheduled posts"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            Flight Plan
          </Link>
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
            ) : (() => {
              const mostRecentPublishedPostId = posts.find(p => p.variants.some(v => v.status === 'published'))?.id;
              return posts.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  delay={i * 0.05}
                  onRefresh={loadData}
                  onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                  profileSubdomain={profileSubdomain}
                  isMostRecentPublished={post.id === mostRecentPublishedPostId}
                />
              ));
            })()}
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
      className="bg-white rounded-2xl border overflow-hidden"
      style={{
        borderColor: isDraft ? '#fed7aa' : age === 'active' ? '#fbbf24' : age === 'settling' ? '#e5e7eb' : '#f3f4f6',
        boxShadow: isDraft
          ? '0 1px 6px #f9731610'
          : age === 'active'
          ? '0 0 0 1px #fbbf2420, 0 4px 24px #fbbf2415'
          : '0 1px 4px #0000000a',
      }}
    >
      {/* Card header: age badge + time */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {isDraft ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              Draft
            </span>
          ) : age === 'active' ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <LiveIndicator />
              Active — {goldenRemaining}m left in golden hour
            </span>
          ) : age === 'settling' ? (
            <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              Settling
            </span>
          ) : (
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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 transition-colors group"
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
                    onClick={isFailed ? () => toast.error(`${cfg.name} Failed`, { description: variant.error?.message || 'Failed to publish. Check platform requirements or reconnect account.' }) : undefined}
                    title={isFailed ? `${variant.error?.message || 'Failed'} (Click to view)` : `Publishing to ${cfg.name}...`}
                  >
                    <Logo size={16} />
                    <span className={`text-xs font-medium ${isFailed ? 'text-red-600' : 'text-gray-500'}`}>
                      {cfg.name}
                    </span>
                    
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
            <span className="text-green-600 font-medium">
              {publishedVariants.length} live
            </span>
          )}
          {pendingVariants.length > 0 && (
            <span className="text-amber-600 font-medium">
              {pendingVariants.length} pending
            </span>
          )}
          {failedVariants.length > 0 && (
            <span className="text-red-500 font-medium">
              {failedVariants.length} failed
            </span>
          )}
          {post.hookType && (
            <span className="capitalize flex items-center gap-1 text-gray-400">
              <Sparkles className="w-3 h-3" />
              {HOOK_LABELS[post.hookType] || post.hookType}
            </span>
          )}
        </div>

        {/* Action buttons for drafts: Review & edit, Remove */}
        {isDraft && (
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
        )}

        {publishedVariants.length > 0 && (
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-black transition-all shadow-sm ml-auto cursor-pointer"
            title="Share this story"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        )}

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
                <h3 className="text-base font-bold text-gray-900">Share</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Share this post across your network or copy the link directly.
              </p>

              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Link
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 font-mono">
                  <Link2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate flex-1 select-all">{shareUrl}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* 1) Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-600" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Link'}</span>
                </button>

                {/* 2) Share on WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-black transition-colors shadow-sm cursor-pointer"
                >
                  <PlatformLogos.whatsapp.logo size={15} />
                  <span>Share on WhatsApp</span>
                </a>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
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
            <div className="mb-2">
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
      <p className="text-sm text-gray-400 mb-5">Broadcast from Studio or plan your entire week in 15 minutes with Flight Plan.</p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/dashboard/composer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Open Studio
        </Link>
        <Link
          href="/dashboard/schedule"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-sm font-medium hover:bg-amber-100 transition-colors"
        >
          <Calendar className="w-4 h-4 text-amber-700" />
          Plan My Week
        </Link>
      </div>
    </div>
  );
}
