'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
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
function UnoolEmblem({ className = 'w-3.5 h-3.5', glow = false }: { className?: string; glow?: boolean }) {
  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {glow && (
        <span
          className="absolute inset-0 rounded-full blur-md bg-amber-400/35 scale-150 pointer-events-none"
          aria-hidden="true"
        />
      )}
      <svg
        viewBox="0 0 222 221"
        fill="currentColor"
        className="w-full h-full relative z-10 transition-transform duration-300"
        aria-hidden="true"
      >
        <path
          d="M 44 14 L 45 135 L 48 143 L 55 151 L 62 154 L 114 154 L 121 149 L 150 119 L 153 119 L 153 147 L 149 160 L 143 170 L 132 180 L 116 186 L 59 186 L 40 179 L 30 171 L 23 162 L 18 152 L 15 140 L 15 43 L 43 15 Z M 105 41 L 165 41 L 179 46 L 190 54 L 196 61 L 203 74 L 206 87 L 206 177 L 178 205 L 176 205 L 176 93 L 173 83 L 165 75 L 158 72 L 108 72 L 96 81 L 70 107 L 68 107 L 68 80 L 75 62 L 87 49 L 98 43 L 104 42 Z"
          fillRule="evenodd"
        />
      </svg>
    </span>
  );
}

// Interconnected creator platforms represented on Unool
const PLATFORM_CHIPS = [
  { name: 'Instagram', label: 'IG' },
  { name: 'LinkedIn', label: 'IN' },
  { name: 'X / Twitter', label: 'X' },
  { name: 'Threads', label: 'TH' },
  { name: 'YouTube', label: 'YT' },
  { name: 'Bluesky', label: 'BSKY' },
  { name: 'TikTok', label: 'TK' },
  { name: 'Substack', label: 'SUB' },
];

export function MadeWithUnoolCTA({ className, subdomain, hideBadge }: MadeWithUnoolCTAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // If user has badge removal perk or hideBadge is explicitly set
  if (hideBadge) {
    return null;
  }

  const referralQuery = subdomain ? `?ref=${encodeURIComponent(subdomain)}` : '';
  const signupUrl = `/signup${referralQuery}`;
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
    }, 240);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] pointer-events-auto select-none ${className || ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Unool Watermark"
    >
      {/* ═══ Precision Watermark Seal / Hallmark Badge ═══ */}
      <Link
        href={unoolHomeUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Made with UNOOL - Visit unool.co"
        className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full no-underline transition-all duration-300 shadow-xl overflow-hidden focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
        style={{
          background: 'linear-gradient(135deg, rgba(18, 20, 26, 0.78) 0%, rgba(9, 10, 14, 0.88) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 28px -4px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.16)',
        }}
      >
        {/* Subtle top specular shimmer hairline */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] opacity-60 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent)',
          }}
          aria-hidden="true"
        />

        {/* Ambient watermark glow on hover */}
        <div
          className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 30% 50%, rgba(196, 162, 101, 0.22), transparent 70%)',
          }}
          aria-hidden="true"
        />

        {/* Unool Geometric Monogram Mark */}
        <span className="relative z-10 flex items-center justify-center w-3.5 h-3.5 text-[#C4A265] group-hover:text-amber-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
          <UnoolEmblem className="w-3.5 h-3.5" glow={false} />
        </span>

        {/* Delicate hairline separator */}
        <span className="w-[1px] h-3 bg-white/15 relative z-10" aria-hidden="true" />

        {/* Watermark Bespoke Typography */}
        <div className="relative z-10 flex items-baseline gap-1.5">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-stone-300/80 font-medium">
            made with
          </span>
          <span
            className="font-[family-name:var(--font-syne)] font-extrabold text-[11px] tracking-[0.24em] uppercase text-white group-hover:text-amber-200 transition-colors"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            UNOOL
          </span>
        </div>

        {/* Luminous watermark hallmark beacon */}
        <span
          className="relative z-10 w-1.5 h-1.5 rounded-full bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.8)] group-hover:scale-125 transition-transform"
          aria-hidden="true"
        />
      </Link>

      {/* ═══ Popover Showcase Hallmark Card ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full right-0 mt-2.5 w-[290px] max-w-[calc(100vw-32px)]"
          >
            <div
              className="relative overflow-hidden rounded-2xl p-4 shadow-2xl border"
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

              {/* Close Button for touch accessibility */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 text-stone-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Close card"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Header: Unool Emblem Jewel + Identity */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-900/10 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(196,162,101,0.2)]">
                  <span className="w-4 h-4 text-[#C4A265]">
                    <UnoolEmblem className="w-4 h-4" glow={true} />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-[family-name:var(--font-syne)] font-extrabold text-[13px] tracking-[0.24em] text-white uppercase"
                      style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                    >
                      UNOOL
                    </span>
                    <span className="text-[8px] font-mono tracking-[0.16em] uppercase px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-200 border border-amber-400/30">
                      CREATOR OS
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 font-sans mt-0.5 leading-snug">
                    Unified presence &amp; audience growth
                  </p>
                </div>
              </div>

              {/* Multi-Platform Showcase */}
              <div className="mb-3.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-stone-400 mb-1.5 flex items-center justify-between">
                  <span>Connects 20+ Platforms</span>
                  <span className="text-amber-300/80">Automated</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {PLATFORM_CHIPS.map((chip) => (
                    <span
                      key={chip.name}
                      title={chip.name}
                      className="text-[9px] font-mono tracking-tight px-1.5 py-0.5 rounded bg-white/[0.06] text-stone-300 border border-white/[0.08]"
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Primary Call to Action */}
              <Link
                href={signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 no-underline shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #C4A265 0%, #A88748 100%)',
                  boxShadow: '0 4px 16px rgba(196, 162, 101, 0.35)',
                }}
              >
                <span className="text-xs font-semibold text-stone-950 tracking-tight whitespace-nowrap">
                  Create your free space
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-950 group-hover/btn:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary Link & Verification Hallmark */}
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
                <span className="text-stone-400 font-mono text-[8.5px] tracking-widest uppercase">
                  Official Watermark
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

