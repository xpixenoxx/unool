'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ArcPost } from '@/types/flightplan';
import { B, MOTION, SPACING, RADIUS, SHADOW } from './design-tokens';

interface InstagramStoryBarProps {
  posts: ArcPost[];
  currentIndex: number;
  onSelectIndex: (idx: number) => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  durationMs?: number;
}

export function InstagramStoryBar({
  posts,
  currentIndex,
  onSelectIndex,
  isPaused = false,
  onTogglePause,
  durationMs = 5000,
}: InstagramStoryBarProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance progress when not paused
  useEffect(() => {
    if (isPaused || posts.length === 0) return;

    progressIntervalRef.current = setInterval(() => {
      setScrollProgress(prev => {
        const next = prev + (100 / (posts.length * (durationMs / 100)));
        if (next >= 100) {
          if (onTogglePause) onTogglePause();
          return 100;
        }
        return next;
      });
    }, 50);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPaused, posts.length, durationMs, onTogglePause]);

  // Track page scroll and map progress across the post items
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (posts.length === 0) return;

          const firstEl = document.getElementById('arc-post-0');
          const lastEl = document.getElementById(`arc-post-${posts.length - 1}`);

          if (firstEl && lastEl) {
            const headerOffset = 140;
            const firstRect = firstEl.getBoundingClientRect();
            const lastRect = lastEl.getBoundingClientRect();

            const start = firstRect.top - headerOffset;
            const end = lastRect.bottom - headerOffset;
            const viewportHeight = window.innerHeight;

            const progress = Math.max(0, Math.min(100,
              ((viewportHeight - start) / (end - start + viewportHeight)) * 100
            ));

            setScrollProgress(progress);
          }
        });
        ticking = true;
        setTimeout(() => { ticking = false; }, 16);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [posts.length]);

  if (posts.length === 0) return null;

  return (
    <div className="w-full">
      {/* Progress bar segments */}
      <div className="flex items-center gap-1.5 h-1.5" role="progressbar" aria-valuenow={Math.round(scrollProgress)} aria-valuemin={0} aria-valuemax={100} aria-label="Story progress">
        {posts.map((_, idx) => (
          <motion.div
            key={idx}
            className="flex-1 h-full rounded-full overflow-hidden relative"
            style={{ backgroundColor: B.border }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: idx < currentIndex ? 1 : idx === currentIndex ? scrollProgress / 100 : 0 }}
            transition={{ duration: idx === currentIndex ? MOTION.duration.fast : MOTION.duration.normal, ease: MOTION.easing.easeOut }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: B.accent, transformOrigin: 'left center' }}
            />
          </motion.div>
        ))}
      </div>

      {/* Clickable story indicators */}
      <div className="flex items-center justify-center gap-2 mt-2" role="tablist" aria-label="Story posts">
        {posts.map((post, idx) => (
          <button
            key={post.day}
            onClick={() => onSelectIndex(idx)}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 transition-transform transition-opacity",
              idx === currentIndex ? "scale-110" : "opacity-60 hover:opacity-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            )}
            role="tab"
            aria-selected={idx === currentIndex}
            aria-label={`${post.dayLabel} - ${post.arcBeat}`}
            style={{ focusRingColor: B.accent, focusRingOffsetColor: B.card }}
          >
            <motion.div
              className="w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm"
              style={{
                borderColor: idx === currentIndex ? B.accent : B.border,
                backgroundColor: idx === currentIndex ? B.card : B.bgElevated,
              }}
              animate={{ boxShadow: idx === currentIndex ? `0 0 0 4px ${B.accent}40` : 'none' }}
              transition={{ duration: MOTION.duration.fast }}
            >
              <span className="text-[10px] font-bold" style={{ color: idx === currentIndex ? B.accent : B.textMuted }}>
                {post.dayLabel.slice(0, 1)}
              </span>
            </motion.div>
            <span className="text-[10px] font-medium truncate w-16 text-center" style={{ color: B.textSecondary }}>
              {post.arcBeat}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}