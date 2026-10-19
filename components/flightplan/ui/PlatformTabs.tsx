'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { PlatformBrandLogo, type SupportedPlatformType } from '@/components/dashboard/previews/PlatformMobilePreview';
import type { PlatformTabsProps, PlatformDraft } from '@/types/flightplan';
import { B, MOTION, SPACING, RADIUS, SHADOW } from '../design-tokens';

export function PlatformTabs({
  platforms,
  activeIndex,
  onChange,
  enabledMap,
  onToggleEnabled,
  compact = false,
}: PlatformTabsProps) {
  if (!platforms || platforms.length === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-xl",
        compact ? "px-1 py-0.5" : ""
      )}
      style={{ backgroundColor: B.bgElevated }}
      role="tablist"
      aria-label="Platform variants"
    >
      {platforms.map((p, idx) => {
        const isActive = idx === activeIndex;
        const isEnabled = enabledMap?.[idx] !== false && p.enabled !== false;

        return (
          <button
            key={p.variantId || p.platform || idx}
            onClick={() => onChange(idx)}
            onContextMenu={onToggleEnabled ? e => { e.preventDefault(); onToggleEnabled(idx); } : undefined}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors transition-transform',
              isActive ? 'shadow-sm' : '',
              !isEnabled ? 'opacity-50' : '',
              compact ? 'px-2 py-1 text-[10px]' : '',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
            )}
            style={isActive
              ? { backgroundColor: B.card, color: isEnabled ? B.text : B.textMuted, focusRingColor: B.accent, focusRingOffsetColor: B.card }
              : { color: B.textMuted, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${p.variantId || p.platform || idx}`}
            id={`tab-${p.variantId || p.platform || idx}`}
            title={isEnabled
              ? `Active: ${p.platform} (right-click to disable)`
              : `Disabled: ${p.platform} (right-click to enable)`}
          >
            <PlatformBrandLogo platform={p.platform as SupportedPlatformType} size={compact ? 12 : 14} />
            {!compact && <span className={cn('hidden sm:inline', !isEnabled && 'line-through')}>
              {p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}
            </span>}
          </button>
        );
      })}
    </div>
  );
}