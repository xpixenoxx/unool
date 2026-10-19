'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import type { ContentValidationBannerProps } from '@/types/flightplan';
import { cn } from '@/lib/utils';
import { B, MOTION } from '../design-tokens';

export function ContentValidationBanner({
  isBlocked,
  isOverLimit,
  violationMessage,
  platformName,
  currentCount,
  maxChars,
  onKnowMore,
}: ContentValidationBannerProps) {
  if (!isBlocked && !isOverLimit) return null;

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={MOTION.spring.snappy}
      className={cn(
        "rounded-xl p-3 border flex items-start justify-between gap-3 text-xs"
      )}
      style={{
        backgroundColor: B.dangerBg,
        borderColor: B.dangerBorder,
        boxShadow: `0 4px 14px -2px ${B.danger}1A`,
      }}
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: B.dangerBg, border: `1px solid ${B.dangerBorder}`, color: B.danger }}>
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: B.danger }} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
            )} style={{ backgroundColor: B.dangerBg, color: B.danger }}>
              {isBlocked ? 'Safety Violation' : 'Character Cap'}
            </span>
          </div>
          <p className="text-xs font-semibold leading-snug truncate" style={{ color: B.text }}>
            {isBlocked
              ? violationMessage
              : `Content exceeds ${platformName || 'this platform'}'s character limit (${currentCount}/${maxChars}).`}
          </p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: B.textMuted }}>
            {isBlocked
              ? 'This content cannot be scheduled under our acceptable use policies.'
              : 'Please shorten your text before approving the flight plan.'}
          </p>
        </div>
      </div>
      <a
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => { e.preventDefault(); onKnowMore?.(); window.open('/terms', '_blank'); }}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold",
          "transition-colors flex-shrink-0 shadow-2xs group",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        )}
        style={{ color: B.text, backgroundColor: B.cardHover, border: `1px solid ${B.border}`, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
        title="Review terms of service and content criteria"
      >
        <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="1.75" style={{ color: B.accent }}>
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeOpacity="0.8" />
          <line x1="8" y1="7.5" x2="8" y2="11.5" stroke="currentColor" strokeLinecap="round" />
          <circle cx="8" cy="4.5" r="0.85" fill="currentColor" stroke="none" />
        </svg>
        <span>Know more</span>
        <ArrowUpRight className="w-2.5 h-2.5 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </a>
    </motion.div>
  );
}