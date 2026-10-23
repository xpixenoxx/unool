'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl"
          style={{ willChange: 'transform' }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderColor: allPublished ? '#16a34a44' : anyFailed ? '#ef444444' : '#e5e7eb',
            }}
          >
            {/* Status indicator */}
            <div className="flex-shrink-0">
              {allPublished ? (
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              ) : anyFailed && allDone ? (
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="w-2.5 h-2.5 rounded-full bg-amber-400"
                />
              )}
            </div>

            {/* Post preview */}
            <p className="text-sm font-medium text-gray-800 truncate flex-1 min-w-0">
              {allPublished ? 'Published' : allDone ? 'Finished' : 'Publishing'}&nbsp;—&nbsp;
              <span className="text-gray-500 font-normal">
                {post.content.slice(0, 45)}{post.content.length > 45 ? '…' : ''}
              </span>
            </p>

            {/* Platform pills */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {post.platforms.map((p) => {
                const cfg = getPlatformConfig(p.platform);
                const Logo = cfg.logo;
                return (
                  <div key={p.platform} className="relative">
                    {p.platformUrl ? (
                      <a
                        href={p.platformUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`View on ${cfg.name}`}
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border border-gray-100 hover:scale-110 transition-transform"
                      >
                        <Logo className="w-4 h-4" />
                      </a>
                    ) : (
                      <motion.div
                        animate={p.status === 'pending' ? { opacity: [1, 0.4, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className={`flex items-center justify-center w-7 h-7 rounded-full border ${
                          p.status === 'failed' ? 'bg-red-50 border-red-200' : 
                          p.status === 'published' ? 'bg-green-50 border-green-200' :
                          'bg-gray-50 border-gray-200'
                        }`}
                        title={p.status === 'failed' ? `Failed on ${cfg.name}` : cfg.name}
                      >
                        <Logo className="w-4 h-4" />
                      </motion.div>
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
                title="Share One Link to WhatsApp (auto-scrolls to recent activity)"
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer bg-gray-900 hover:bg-black"
              >
                <PlatformLogos.whatsapp.logo className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Signal link */}
            <Link
              href="/dashboard/signal"
              className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              Signal
              <ExternalLink className="w-3 h-3" />
            </Link>

            {/* Dismiss */}
            <button
              onClick={() => { setDismissed(true); setVisible(false); }}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
