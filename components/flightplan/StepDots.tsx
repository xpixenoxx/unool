'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { B, MOTION, SPACING, RADIUS, SHADOW } from './design-tokens';

interface StepDotsProps {
  current: number;
  total: number;
  labels?: string[];
}

export function StepDots({ current, total, labels }: StepDotsProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, idx) => (
        <React.Fragment key={idx}>
          <div
            className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors")}
            style={
              idx < current
                ? { backgroundColor: B.accentBg, color: B.accentHover }
                : idx === current
                ? { backgroundColor: B.accent, color: '#fff' }
                : { backgroundColor: B.cardBorder, color: B.textMuted }
            }
          >
            {idx + 1}
          </div>
          {idx < total - 1 && (
            <div
              className={cn("w-12 h-0.5 rounded transition-colors")}
              style={{ backgroundColor: idx < current ? B.accentBorder : B.border }}
            />
          )}
        </React.Fragment>
      ))}
      {labels && (
        <div className="flex items-center gap-1 ml-2">
          {labels.map((label, idx) => (
            <span
              key={idx}
              className="text-xs font-medium hidden sm:block"
              style={{ color: idx <= current ? B.accentHover : B.textMuted }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}