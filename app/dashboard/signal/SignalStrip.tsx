'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { PlatformLogos, getPlatformConfig } from '@/components/dashboard/PlatformLogos';

export type SignalStripPost = {
  postId: string;
  content: string;
  platforms: Array<{
    platform: string;
    status: 'pending' | 'published' | 'failed';
    platformUrl?: string;
  }>;
};

// Global event bus for Signal Strip
const SIGNAL_STRIP_EVENT = 'signal-strip-publish';

export function emitSignalStrip(data: SignalStripPost) {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`unool_publishing_${data.postId}`, JSON.stringify({
        postId: data.postId,
        content: data.content,
        timestamp: Date.now(),
        platforms: data.platforms,
      }));
    } catch {}
    window.dispatchEvent(new CustomEvent(SIGNAL_STRIP_EVENT, { detail: data }));
  }
}

export function SignalStrip() {
  const [visible, setVisible] = useState(false);
  const [post, setPost] = useState<SignalStripPost | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSub() {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.profile?.subdomain) {
            setSubdomain(data.profile.subdomain);
            return;
          }
        }
      } catch {}
      try {
        const ctxRes = await fetch('/api/user/context', { credentials: 'include' });
        if (ctxRes.ok) {
          const ctxData = await ctxRes.json();
          if (ctxData?.profile?.subdomain) {
            setSubdomain(ctxData.profile.subdomain);
          }
        }
      } catch {}
    }
    fetchSub();
  }, []);

  const handleEvent = useCallback((e: Event) => {
    const data = (e as CustomEvent<SignalStripPost>).detail;
    setPost(data);
    setVisible(true);
    setDismissed(false);
  }, []);

  useEffect(() => {
    window.addEventListener(SIGNAL_STRIP_EVENT, handleEvent);
    return () => window.removeEventListener(SIGNAL_STRIP_EVENT, handleEvent);
  }, [handleEvent]);

  // Poll for status updates if we have a pending post
  useEffect(() => {
    if (!post || !visible) return;
    const allDone = post.platforms.every(p => p.status === 'published' || p.status === 'failed');
    if (allDone) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/publish/${post.postId}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const updatedPlatforms = post.platforms.map(p => {
          const variant = (data.variants || []).find((v: any) => v.platform === p.platform);
          if (!variant) return p;
          return {
            ...p,
            status: variant.status === 'published' ? 'published' as const
                  : variant.status === 'failed' ? 'failed' as const
                  : 'pending' as const,
            platformUrl: variant.platformUrl || variant.platform_url || p.platformUrl,
          };
        });
        setPost(prev => prev ? { ...prev, platforms: updatedPlatforms } : prev);
        const allCompleted = updatedPlatforms.every(p => p.status === 'published' || p.status === 'failed');
        if (allCompleted && typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem(`unool_publishing_${post.postId}`);
          } catch {}
          window.dispatchEvent(new CustomEvent('signal-posts-updated', { detail: { postId: post.postId } }));
        }
      } catch {
        // silent
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [post, visible]);

  // Auto-dismiss 30s after all confirmed
  useEffect(() => {
    if (!post || !visible) return;
    const allDone = post.platforms.every(p => p.status !== 'pending');
    if (!allDone) return;
    const t = setTimeout(() => setVisible(false), 30000);
    return () => clearTimeout(t);
  }, [post, visible]);

  if (!post) return null;

  const allDone = post.platforms.every(p => p.status !== 'pending');
  const anyFailed = post.platforms.some(p => p.status === 'failed');
  const allPublished = post.platforms.every(p => p.status === 'published');
  const hasAnyLive = post.platforms.some(p => p.status === 'published' || !!p.platformUrl);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://unool.co';
  const oneLink = subdomain ? `${origin}/u/${subdomain}?activity=1` : `${origin}?activity=1`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Hey! Just published my latest story across platforms. Pick your favourite to view & support:\n\n👉 ${oneLink}\n\nThanks! ❤️`
  )}`;

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-2xl pointer-events-auto"
          style={{ willChange: 'transform' }}
        >
          <div
            className="relative overflow-hidden flex items-center gap-3 sm:gap-3.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-[0_20px_50px_rgba(20,15,10,0.45),0_0_0_1px_rgba(196,162,101,0.25)] border border-[#C4A265]/40"
            style={{
              background: 'linear-gradient(135deg, rgba(28, 22, 17, 0.97) 0%, rgba(38, 29, 22, 0.97) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* Top architectural hairline glow */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: allPublished
                  ? 'linear-gradient(90deg, transparent, #22c55e, transparent)'
                  : anyFailed && allDone
                  ? 'linear-gradient(90deg, transparent, #f43f5e, transparent)'
                  : 'linear-gradient(90deg, transparent, #C4A265, #E5C77A, transparent)',
              }}
            />

            {/* Status indicator pill */}
            <div className="flex-shrink-0">
              {allPublished ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Published</span>
                </span>
              ) : anyFailed && allDone ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  <span>Attention</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#C4A265]/20 text-[#E5C77A] border border-[#C4A265]/40 shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5C77A] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E5C77A]" />
                  </span>
                  <span>Publishing</span>
                </span>
              )}
            </div>

            {/* Post preview text */}
            <p className="text-xs sm:text-[13px] font-medium text-[#FAF7F2] truncate flex-1 min-w-0" title={post.content}>
              <span className="text-[#C5B498] font-normal">
                {post.content.slice(0, 52)}{post.content.length > 52 ? '…' : ''}
              </span>
            </p>

            {/* Platform badges with micro-status indicators */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {post.platforms.map((p) => {
                const cfg = getPlatformConfig(p.platform);
                const Logo = cfg.logo;
                const isPending = p.status === 'pending';
                const isFailed = p.status === 'failed';
                const isPub = p.status === 'published';

                return (
                  <div key={p.platform} className="relative">
                    {p.platformUrl ? (
                      <a
                        href={p.platformUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Live on ${cfg.name} · Click to view`}
                        className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-white shadow-xs border border-white/40 hover:scale-110 hover:border-[#E5C77A] transition-all cursor-pointer"
                      >
                        <Logo className="w-4 h-4" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 border border-[#1C1611]" />
                      </a>
                    ) : (
                      <div
                        className={`relative flex items-center justify-center w-7 h-7 rounded-lg border transition-all ${
                          isFailed
                            ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                            : 'bg-white shadow-xs border-white/30'
                        }`}
                        title={isFailed ? `Failed on ${cfg.name}` : isPub ? `Published on ${cfg.name}` : `Publishing to ${cfg.name}...`}
                      >
                        <Logo className="w-4 h-4" />
                        {isPending ? (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 border border-[#1C1611]" />
                          </span>
                        ) : isPub ? (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 border border-[#1C1611]" />
                        ) : (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 border border-[#1C1611]" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* WhatsApp Share Button */}
            {hasAnyLive && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Share One Link to WhatsApp"
                className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer bg-gradient-to-r from-[#1EA952] to-[#128C7E] border border-emerald-400/30"
              >
                <PlatformLogos.whatsapp.logo className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}

            {/* Signal link button */}
            <Link
              href="/dashboard/signal"
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#FAF7F2] bg-white/10 hover:bg-white/15 border border-[#C4A265]/40 hover:border-[#E5C77A] transition-all shadow-2xs group"
              title="Open Signal workspace"
            >
              <span>Signal</span>
              <ExternalLink className="w-3 h-3 text-[#E5C77A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            {/* Dismiss */}
            <button
              onClick={() => { setDismissed(true); setVisible(false); }}
              className="flex-shrink-0 p-1 rounded-lg text-[#A89886] hover:text-[#FAF7F2] hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss notification"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
