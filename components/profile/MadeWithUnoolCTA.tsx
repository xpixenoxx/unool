'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ExternalLink, X } from 'lucide-react';

export interface MadeWithUnoolCTAProps {
  className?: string;
  subdomain?: string;
  hideBadge?: boolean;
}

/**
 * Authentic Unool Geometric Monogram Emblem
 * Exact vector geometry of the interlocking dual-ribbon Unool identity
 */
function UnoolEmblem({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 222 221"
      fill="currentColor"
      className={`shrink-0 transition-transform duration-300 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M 44 14 L 45 135 L 48 143 L 55 151 L 62 154 L 114 154 L 121 149 L 150 119 L 153 119 L 153 147 L 149 160 L 143 170 L 132 180 L 116 186 L 59 186 L 40 179 L 30 171 L 23 162 L 18 152 L 15 140 L 15 43 L 43 15 Z M 105 41 L 165 41 L 179 46 L 190 54 L 196 61 L 203 74 L 206 87 L 206 177 L 178 205 L 176 205 L 176 93 L 173 83 L 165 75 L 158 72 L 108 72 L 96 81 L 70 107 L 68 107 L 68 80 L 75 62 L 87 49 L 98 43 L 104 42 Z"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function MadeWithUnoolCTA({ className, subdomain, hideBadge }: MadeWithUnoolCTAProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [handle, setHandle] = useState('');
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // If user has badge removal perk or hideBadge is explicitly set
  if (hideBadge) {
    return null;
  }

  const referralQuery = subdomain ? `?ref=${encodeURIComponent(subdomain)}` : '';
  const unoolHomeUrl = `https://unool.co${referralQuery}`;

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 280);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    // Store desired handle in session for downstream onboarding
    if (cleanHandle) {
      try {
        sessionStorage.setItem('unool_desired_handle', cleanHandle);
      } catch {}
    }

    const queryParts: string[] = [];
    if (cleanHandle) queryParts.push(`claim=${encodeURIComponent(cleanHandle)}`);
    if (subdomain) queryParts.push(`ref=${encodeURIComponent(subdomain)}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    router.push(`/signup${queryString}`);
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] pointer-events-auto select-none ${className || ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Made with Unool"
    >
      {/* ═══ Minimalist Frosted Watermark Pill ═══ */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Made with UNOOL - Create your page"
        className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-left transition-all duration-300 shadow-xl overflow-hidden focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
        style={{
          background: 'linear-gradient(135deg, rgba(18, 20, 26, 0.78) 0%, rgba(9, 10, 14, 0.88) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.16)',
        }}
      >
        {/* Subtle top specular shimmer */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] opacity-50 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent)',
          }}
          aria-hidden="true"
        />

        {/* Unool Geometric Monogram Mark */}
        <span className="relative z-10 flex items-center justify-center w-3.5 h-3.5 text-[#C4A265] group-hover:text-amber-200 transition-all duration-300 group-hover:scale-105">
          <UnoolEmblem className="w-3.5 h-3.5" />
        </span>

        {/* Hairline separator */}
        <span className="w-[1px] h-3 bg-white/15 relative z-10" aria-hidden="true" />

        {/* Watermark Typography */}
        <div className="relative z-10 flex items-baseline gap-1.5">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-white/50 font-medium">
            made with
          </span>
          <span
            className="font-[family-name:var(--font-syne)] font-bold text-[11px] tracking-[0.22em] uppercase text-white group-hover:text-amber-100 transition-colors"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            UNOOL
          </span>
        </div>
      </button>

      {/* ═══ Lead Generation Card: Interactive Handle Claimer ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full right-0 mt-2.5 w-[300px] max-w-[calc(100vw-32px)]"
          >
            <div
              className="relative overflow-hidden rounded-2xl p-4 shadow-2xl border text-left"
              style={{
                background: 'linear-gradient(145deg, rgba(18, 20, 26, 0.96) 0%, rgba(10, 12, 16, 0.98) 100%)',
                backdropFilter: 'blur(30px) saturate(190%)',
                WebkitBackdropFilter: 'blur(30px) saturate(190%)',
                borderColor: 'rgba(196, 162, 101, 0.28)',
                boxShadow: '0 24px 50px -10px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.18)',
              }}
            >
              {/* Top gold refraction hairline */}
              <div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(196, 162, 101, 0.8) 50%, transparent)',
                }}
                aria-hidden="true"
              />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 text-stone-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Close card"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Header: Logo + Brand */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="w-4 h-4 text-[#C4A265] shrink-0">
                  <UnoolEmblem className="w-4 h-4" />
                </span>
                <span
                  className="font-[family-name:var(--font-syne)] font-bold text-xs tracking-[0.24em] text-white uppercase"
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  UNOOL
                </span>
              </div>

              {/* Hook & Subtitle */}
              <h3 className="text-sm font-semibold text-white tracking-tight leading-snug">
                Create a page like this
              </h3>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Your unified link, portfolio, and publishing hub.
              </p>

              {/* Interactive Handle Claim Form */}
              <form onSubmit={handleClaimSubmit} className="mt-3.5 space-y-2.5">
                <div className="relative flex items-center rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/15 focus-within:border-[#C4A265] focus-within:ring-1 focus-within:ring-[#C4A265] transition-all px-3 py-1.5">
                  <span className="text-xs font-mono text-stone-400 select-none shrink-0 font-medium">
                    unool.co/
                  </span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="yourname"
                    className="w-full py-1.5 pl-1 pr-2 text-xs bg-transparent text-white placeholder:text-stone-500 focus:outline-none font-mono tracking-tight"
                    maxLength={30}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-stone-950 transition-all duration-200 shadow-md hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #C4A265 0%, #A88748 100%)',
                    boxShadow: '0 4px 16px rgba(196, 162, 101, 0.25)',
                  }}
                >
                  <span>Claim your link</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-950" />
                </button>
              </form>

              {/* Micro Trust Line */}
              <p className="text-[10px] text-stone-400 text-center mt-2.5 tracking-tight font-sans">
                Free forever · Setup in 60 seconds
              </p>

              {/* Secondary Link to unool.co */}
              <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[10px]">
                <Link
                  href={unoolHomeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-400 hover:text-amber-200 flex items-center gap-1 transition-colors no-underline font-mono text-[9px] tracking-wider"
                >
                  <span>unool.co</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </Link>
                <Link
                  href={referralQuery ? `/signup${referralQuery}` : '/signup'}
                  className="text-stone-400 hover:text-white transition-colors no-underline font-sans text-[10px]"
                >
                  Sign up free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

