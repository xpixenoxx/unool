'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Zap } from 'lucide-react';
import type { TimeSelectorProps } from '@/types/flightplan';
import { FLIGHTPLAN_CONSTANTS } from '@/types/flightplan';
import { B, MOTION, SPACING, RADIUS, SHADOW } from '../design-tokens';

interface TimeSelectorInternalProps extends TimeSelectorProps {
  minuteOptions?: number[];
}

export function TimeSelector({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  isPastTime,
  quickPresets,
  onQuickPreset,
  disabled,
  minuteOptions,
}: TimeSelectorInternalProps) {
  const baseMinutes = Array.from({ length: 60 }, (_, m) => m);
  const options = minuteOptions && minuteOptions.length > 0
    ? minuteOptions
    : Array.from(new Set([...baseMinutes, minute])).sort((a, b) => a - b);

  const defaultPresets = React.useMemo(() => [
    { label: 'In 5 mins', minutes: 5, isPrimary: true },
    { label: '+15m', minutes: 15, isPrimary: false },
    { label: '+30m', minutes: 30, isPrimary: false },
    { label: '+1h', minutes: 60, isPrimary: false },
  ], []);

  const presets = quickPresets || defaultPresets;

  const handleQuickPreset = (minutes: number) => {
    onQuickPreset?.(minutes);
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Clock className="w-4 h-4" style={{ color: B.accent }} />
        <span className="text-xs font-semibold" style={{ color: B.text }}>Schedule Time:</span>

        {/* Dual Hour : Minute selectors */}
        <div className="flex items-center gap-1">
          <select
            value={hour}
            onChange={e => onHourChange(parseInt(e.target.value, 10))}
            disabled={disabled}
            className={cn(
              "text-xs font-mono font-medium px-2 py-1 rounded-lg border bg-transparent cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            )}
            style={{ borderColor: B.border, color: B.text, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
            aria-label="Schedule hour"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option
                key={h}
                value={h}
                disabled={isPastTime && h < new Date().getHours()}
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              >
                {h.toString().padStart(2, '0')}:00
              </option>
            ))}
          </select>
          <span className="text-xs font-bold font-mono" style={{ color: B.textMuted }}>:</span>
          <select
            value={minute}
            onChange={e => onMinuteChange(parseInt(e.target.value, 10))}
            disabled={disabled}
            className={cn(
              "text-xs font-mono font-medium px-2 py-1 rounded-lg border bg-transparent cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            )}
            style={{ borderColor: B.border, color: B.text, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
            aria-label="Schedule minute"
          >
            {options.map(m => (
              <option
                key={m}
                value={m}
                disabled={isPastTime && hour === new Date().getHours() && m <= new Date().getMinutes()}
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              >
                {m.toString().padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1 flex-wrap">
          {presets.map((preset, idx) => (
            <button
              key={preset.minutes}
              type="button"
              onClick={() => handleQuickPreset(preset.minutes)}
              disabled={disabled}
              className={cn(
                "text-[11px] font-medium px-2 py-1 rounded-md border transition-colors transition-transform hover:opacity-85 active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs",
                disabled && "opacity-50 cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              )}
              style={preset.isPrimary
                ? { borderColor: B.accentHover, backgroundColor: B.accentBg, color: B.accentHover, focusRingColor: B.accentHover, focusRingOffsetColor: B.card }
                : { borderColor: 'transparent', backgroundColor: 'transparent', color: B.textSecondary, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
              title={`Schedule ${preset.label.toLowerCase()} from current time`}
            >
              {preset.isPrimary && <Zap className="w-3 h-3" style={{ color: B.accentHover }} />}
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Past time warning with quick reschedule */}
      {isPastTime && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleQuickPreset(5)}
            disabled={disabled}
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            )}
            style={{ backgroundColor: B.successBg, color: B.success, borderColor: B.successBorder, focusRingColor: B.success, focusRingOffsetColor: B.card }}
          >
            <Zap className="w-3 h-3" style={{ color: B.success }} />
            Reschedule to in 5 mins
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(60)}
            disabled={disabled}
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            )}
            style={{ backgroundColor: B.warningBg, color: B.warning, borderColor: B.warningBorder, focusRingColor: B.warning, focusRingOffsetColor: B.card }}
          >
            Next hour
          </button>
        </div>
      )}
    </div>
  );
}