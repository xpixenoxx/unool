'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { FLIGHTPLAN_CONSTANTS } from '@/types/flightplan';
import type { UseTimeSelectorResult } from '@/types/flightplan';

interface TimeSelectorOptions {
  initialHour?: number;
  initialMinute?: number;
  isPastTime?: boolean;
  onChange?: (hour: number, minute: number) => void;
}

/**
 * Hook for hour/minute time selection with quick presets
 * Handles past-time disabling and quick preset buttons (+5m, +15m, +30m, +1h)
 */
export function useTimeSelector(options: TimeSelectorOptions = {}): UseTimeSelectorResult {
  const { initialHour = 9, initialMinute = 0, isPastTime = false, onChange } = options;

  const [hour, setHourState] = useState(initialHour);
  const [minute, setMinuteState] = useState(initialMinute);

  const setHour = useCallback((h: number) => {
    setHourState(h);
    onChange?.(h, minute);
  }, [minute, onChange]);

  const setMinute = useCallback((m: number) => {
    setMinuteState(m);
    onChange?.(hour, m);
  }, [hour, onChange]);

  // Quick presets: +5m, +15m, +30m, +1h from NOW (icon rendered in component)
  const quickPresets = useMemo(() => [
    { label: 'In 5 mins', minutes: 5, isPrimary: true },
    { label: '+15m', minutes: 15, isPrimary: false },
    { label: '+30m', minutes: 30, isPrimary: false },
    { label: '+1h', minutes: 60, isPrimary: false },
  ], []);

  const applyQuickPreset = useCallback((minutesFromNow: number) => {
    const now = new Date();
    const target = new Date(now.getTime() + minutesFromNow * 60 * 1000);
    // Round up to next 5-minute boundary for cleaner UX
    const roundedMinutes = Math.ceil(target.getMinutes() / 5) * 5;
    const newHour = target.getHours() + (roundedMinutes >= 60 ? 1 : 0);
    const newMinute = roundedMinutes % 60;

    setHourState(newHour);
    setMinuteState(newMinute);
    onChange?.(newHour, newMinute);
  }, [onChange]);

  // Compute if current selection is in the past (for today)
  const computedIsPastTime = useMemo(() => {
    if (!isPastTime) return false;
    const now = new Date();
    return hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes());
  }, [isPastTime, hour, minute]);

  // Generate minute options (0-59, plus current minute if not in 5-min increments)
  const minuteOptions = useMemo(() => {
    const base = Array.from({ length: 60 }, (_, m) => m);
    const currentMinute = minute;
    if (!base.includes(currentMinute)) {
      return [...base, currentMinute].sort((a, b) => a - b);
    }
    return base;
  }, [minute]);

  return {
    hour,
    minute,
    setHour,
    setMinute,
    quickPresets,
    applyQuickPreset,
    isPastTime: computedIsPastTime,
    minuteOptions,
  };
}

/**
 * Generate hour options with past-time disabling
 */
export function generateHourOptions(
  currentHour: number,
  isToday: boolean,
  now: Date = new Date()
): Array<{ value: number; label: string; disabled: boolean }> {
  return Array.from({ length: 24 }, (_, h) => {
    const isPastH = isToday && (h < now.getHours() || (h === now.getHours() && now.getMinutes() >= 59));
    return {
      value: h,
      label: `${h.toString().padStart(2, '0')}:00${isPastH ? ' (passed)' : ''}`,
      disabled: isPastH,
    };
  });
}

/**
 * Generate minute options with past-time disabling for current hour
 */
export function generateMinuteOptions(
  currentMinute: number,
  selectedHour: number,
  isToday: boolean,
  now: Date = new Date()
): Array<{ value: number; label: string; disabled: boolean }> {
  const baseMinutes = Array.from({ length: 60 }, (_, m) => m);
  const allMinutes = Array.from(new Set([...baseMinutes, currentMinute])).sort((a, b) => a - b);

  return allMinutes.map(m => {
    const isPastM = isToday && selectedHour === now.getHours() && m <= now.getMinutes();
    return {
      value: m,
      label: `${m.toString().padStart(2, '0')}${isPastM ? ' (passed)' : ''}`,
      disabled: isPastM,
    };
  });
}

/**
 * Stagger offsets for cascading posts
 */
export const STAGGER_OPTIONS = FLIGHTPLAN_CONSTANTS.STAGGER_OFFSETS.map(min => ({
  value: min,
  label: min === 0 ? 'Same time' : `+${min} min`,
}));

/**
 * Format time for display (HH:mm)
 */
export function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Parse time string (HH:mm) to hour/minute
 */
export function parseTime(timeStr: string): { hour: number; minute: number } | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}