'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface MadeWithUnoolCTAProps {
  className?: string;
}

export function MadeWithUnoolCTA({ className }: MadeWithUnoolCTAProps) {
  const [isHovered, setIsHovered] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] pointer-events-auto select-none font-sans ${className || ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ═══ Main Badge / Tag ═══ */}
      <Link
        href="https://unool.co"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Made with unool - Visit unool.co"
        className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide text-stone-300 hover:text-white transition-all duration-300 no-underline shadow-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 19, 17, 0.88), rgba(14, 12, 11, 0.94))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(196, 162, 101, 0.15)',
        }}
      >
        {/* Subtle gold accent dot/icon */}
        <span className="flex items-center justify-center w-3 h-3 text-[#C4A265] group-hover:scale-110 transition-transform">
          <Sparkles className="w-2.5 h-2.5" />
        </span>

        {/* Text */}
        <span className="font-sans font-medium text-[11px] tracking-normal text-stone-200 group-hover:text-amber-100 transition-colors">
          made with <span className="font-semibold text-white group-hover:text-[#C4A265] transition-colors">unool</span>
        </span>
      </Link>

      {/* ═══ Popover Box on Hover: "create your page " ═══ */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full right-0 mt-2 min-w-[170px]"
          >
            <div
              className="relative overflow-hidden rounded-xl p-2.5 shadow-2xl border"
              style={{
                background: 'linear-gradient(145deg, rgba(26, 21, 18, 0.97), rgba(16, 13, 11, 0.98))',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderColor: 'rgba(196, 162, 101, 0.38)',
                boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Subtle top gold highlight */}
              <div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(196, 162, 101, 0.6), transparent)',
                }}
              />

              <Link
                href="/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#C4A265]/12 hover:bg-[#C4A265]/22 border border-[#C4A265]/30 hover:border-[#C4A265]/60 transition-all duration-200 no-underline"
              >
                <span className="text-xs font-semibold text-amber-100 group-hover/btn:text-white transition-colors tracking-tight whitespace-nowrap">
                  create your page{" "}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C4A265] group-hover/btn:text-amber-200 group-hover/btn:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
