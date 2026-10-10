'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

// Real SVG logos for each platform — no generic icons
const PlatformLogos: Record<string, React.FC<{ className?: string }>> = {
  linkedin: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a1.66 1.66 0 000 1.14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
    </svg>
  ),
  x: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  threads: ({ className }) => (
    <svg className={className} viewBox="0 0 192 192" fill="currentColor">
      <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.745C82.2364 44.745 70.1369 51.5765 63.5765 63.3545L75.2024 70.6031C80.0505 62.2784 88.2266 58.2497 97.222 58.2497C97.302 58.2497 97.3826 58.2497 97.4632 58.2504C108.311 58.3263 116.373 63.2067 121.072 72.5739C124.474 79.3627 125.795 87.5692 125.011 97.0684C118.716 93.8805 111.245 92.2816 103.087 92.2816C78.5459 92.2816 62.2275 105.888 63.285 126.383C63.8385 137.188 69.2854 146.683 78.4808 152.904C86.4024 158.267 96.3883 160.734 106.667 160.173C120.063 159.443 130.581 154.26 137.955 144.781C143.578 137.601 147.258 128.527 149.104 117.317C154.118 120.112 157.935 123.802 160.351 128.423C164.651 136.891 165.029 150.511 155.909 159.773C147.762 168.041 137.856 171.894 122.933 172.032C106.162 171.878 93.5498 167.049 85.2527 157.723C77.3733 148.852 73.2517 136.543 72.9765 121.148C73.2517 105.752 77.3733 93.4436 85.2527 84.573C93.5498 75.2477 106.162 70.4181 122.933 70.264C139.816 70.4181 152.644 75.2875 161.236 84.7373C165.466 89.3904 168.706 95.0589 170.903 101.563L183.633 97.9203C180.923 89.7579 176.821 82.6426 171.367 76.7063C160.517 64.8941 145.434 58.8403 126.39 58.5728L126.354 58.5711Z" />
    </svg>
  ),
  instagram: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24">
      <defs>
        <radialGradient id="sig-ig-g" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="10%" stopColor="#fdf497" />
          <stop offset="50%" stopColor="#fd5949" />
          <stop offset="68%" stopColor="#d6249f" />
          <stop offset="100%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <path fill="url(#sig-ig-g)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  facebook: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  bluesky: ({ className }) => (
    <svg className={className} viewBox="0 0 360 320" fill="#0085ff">
      <path d="M180 141.964C163.699 110.262 119.308 51.1817 78.0834 31.0445C38.4622 11.6012 1.01713 22.5943 1.01713 74.2913C1.01713 84.0502 6.28388 149.135 9.29108 160.994C21.6498 207.979 70.8174 219.185 115.124 212.405C175.154 202.921 256.555 190.651 180 141.964ZM180 141.964C196.301 110.262 240.692 51.1817 281.917 31.0445C321.538 11.6012 358.983 22.5943 358.983 74.2913C358.983 84.0502 353.716 149.135 350.709 160.994C338.35 207.979 289.183 219.185 244.876 212.405C184.846 202.921 103.445 190.651 180 141.964Z" />
      <path d="M180.026 194.895C180.026 194.895 133.738 210.527 118.981 242.765C109.649 263.297 112.956 295.538 155.77 301.622C169.285 303.566 185.24 302.805 199.999 299.375C214.747 295.949 228.248 288.741 237.019 277.879C250.534 261.146 247.888 225.469 232.975 212.205C218.076 198.953 180.026 194.895 180.026 194.895Z" />
    </svg>
  ),
  whatsapp: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  youtube: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#FF0000">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  pinterest: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#E60023">
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  ),
};

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
    window.dispatchEvent(new CustomEvent(SIGNAL_STRIP_EVENT, { detail: data }));
  }
}

export function SignalStrip() {
  const [visible, setVisible] = useState(false);
  const [post, setPost] = useState<SignalStripPost | null>(null);
  const [dismissed, setDismissed] = useState(false);

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
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : anyFailed && allDone ? (
                <XCircle className="w-5 h-5 text-red-500" />
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
                const Logo = PlatformLogos[p.platform];
                return (
                  <div key={p.platform} className="relative">
                    {p.platformUrl ? (
                      <a
                        href={p.platformUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`View on ${p.platform}`}
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border border-gray-100 hover:scale-110 transition-transform"
                      >
                        {Logo ? <Logo className="w-4 h-4" /> : <span className="text-xs">{p.platform[0].toUpperCase()}</span>}
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
                        title={p.status === 'failed' ? `Failed on ${p.platform}` : p.platform}
                      >
                        {Logo ? <Logo className="w-4 h-4" /> : <span className="text-xs">{p.platform[0].toUpperCase()}</span>}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

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
