'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { AutoFirstCommentProps } from '@/types/flightplan';
import { B, MOTION, SPACING, RADIUS, SHADOW } from '../design-tokens';

export function AutoFirstComment({ content, label = 'Auto first comment (posted 90s after)' }: AutoFirstCommentProps) {
  if (!content) return null;

  return (
    <div className={cn("rounded-xl p-3 border space-y-1 text-xs")} style={{ backgroundColor: B.accentBg, borderColor: B.accentBorder }}>
      <span className="font-semibold" style={{ color: B.accentHover }}>
        {label}
      </span>
      <p style={{ color: B.textSecondary }}>
        {content}
      </p>
    </div>
  );
}

export function FirstCommentHint({ content, label = 'Suggested first comment' }: AutoFirstCommentProps) {
  if (!content) return null;

  return (
    <div className={cn("rounded-xl p-3 border space-y-1 text-xs")} style={{ backgroundColor: B.infoBg, borderColor: B.infoBorder }}>
      <span className="font-semibold" style={{ color: B.info }}>
        {label}
      </span>
      <p style={{ color: B.textSecondary }}>
        {content}
      </p>
    </div>
  );
}

export function StaggeredOffset({ minutes }: { minutes: number }) {
  if (!minutes || minutes <= 0) return null;

  return (
    <div className="text-xs" style={{ color: B.textMuted }}>
      Staggered release: +{minutes} min after base time
    </div>
  );
}