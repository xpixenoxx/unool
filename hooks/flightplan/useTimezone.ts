'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { UseTimezoneResult } from '@/types/flightplan';

// Comprehensive list of IANA timezones with user-friendly labels
const TIMEZONE_DATA: Array<{ value: string; label: string; offset: string }> = [
  // Americas
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00/-07:00' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00/-06:00' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00/-05:00' },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00/-04:00' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: '-09:00/-08:00' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)', offset: '-10:00' },
  { value: 'America/Toronto', label: 'Toronto (ET)', offset: '-05:00/-04:00' },
  { value: 'America/Vancouver', label: 'Vancouver (PT)', offset: '-08:00/-07:00' },
  { value: 'America/Mexico_City', label: 'Mexico City (CT)', offset: '-06:00/-05:00' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', offset: '-03:00' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)', offset: '-03:00' },
  { value: 'America/St_Johns', label: 'Newfoundland (NT)', offset: '-03:30/-02:30' },

  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: '+00:00/+01:00' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: '+01:00/+02:00' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', offset: '+01:00/+02:00' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)', offset: '+01:00/+02:00' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)', offset: '+01:00/+02:00' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)', offset: '+01:00/+02:00' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)', offset: '+01:00/+02:00' },
  { value: 'Europe/Warsaw', label: 'Warsaw (CET/CEST)', offset: '+01:00/+02:00' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: '+03:00' },
  { value: 'Europe/Istanbul', label: 'Istanbul (TRT)', offset: '+03:00' },

  // Africa
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', offset: '+02:00' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)', offset: '+01:00' },
  { value: 'Africa/Cairo', label: 'Cairo (EET)', offset: '+02:00' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', offset: '+03:00' },

  // Asia
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+04:00' },
  { value: 'Asia/Kolkata', label: 'Mumbai (IST)', offset: '+05:30' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)', offset: '+07:00' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: '+08:00' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)', offset: '+09:00' },

  // Oceania
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', offset: '+10:00/+11:00' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)', offset: '+10:00/+11:00' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)', offset: '+10:00' },
  { value: 'Australia/Perth', label: 'Perth (AWST)', offset: '+08:00' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)', offset: '+12:00/+13:00' },

  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
];

/**
 * Hook for timezone selection and management
 * Provides IANA timezone list, current timezone detection, and offset formatting
 */
export function useTimezone(): UseTimezoneResult {
  const [timezone, setTimezone] = useState<string>(() => {
    // Default to browser timezone
    if (typeof window !== 'undefined') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return 'UTC';
  });

  const currentOffset = useMemo(() => {
    try {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'shortOffset',
      });
      const parts = fmt.formatToParts(now);
      const offsetPart = parts.find(p => p.type === 'timeZoneName');
      return offsetPart?.value || '+00:00';
    } catch {
      return '+00:00';
    }
  }, [timezone]);

  const currentLabel = useMemo(() => {
    const found = TIMEZONE_DATA.find(tz => tz.value === timezone);
    return found?.label || timezone;
  }, [timezone]);

  const allTimezones = useMemo(() => TIMEZONE_DATA, []);

  const changeTimezone = useCallback((tz: string) => {
    if (TIMEZONE_DATA.some(t => t.value === tz)) {
      setTimezone(tz);
    }
  }, []);

  // Detect browser timezone on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (TIMEZONE_DATA.some(t => t.value === detected)) {
        setTimezone(detected);
      }
    }
  }, []);

  return {
    timezone,
    setTimezone: changeTimezone,
    offset: currentOffset,
    label: currentLabel,
    allTimezones,
  };
}

/**
 * Get timezone offset string for a specific date (handles DST)
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'shortOffset',
    });
    const parts = fmt.formatToParts(date);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart?.value || '+00:00';
  } catch {
    return '+00:00';
  }
}

/**
 * Convert local time in a timezone to UTC ISO string
 */
export function localToUtc(
  date: Date,
  hour: number,
  minute: number,
  timezone: string
): string {
  const localDate = new Date(date);
  localDate.setHours(hour, minute, 0, 0);

  // Get the offset at that specific date/time
  const offsetStr = getTimezoneOffset(timezone, localDate);
  const offsetMatch = offsetStr.match(/([+-])(\d{2}):?(\d{2})?/);

  if (offsetMatch) {
    const sign = offsetMatch[1] === '+' ? -1 : 1;
    const hours = parseInt(offsetMatch[2], 10);
    const minutes = parseInt(offsetMatch[3] || '0', 10);
    const offsetMs = sign * (hours * 60 + minutes) * 60 * 1000;
    return new Date(localDate.getTime() + offsetMs).toISOString();
  }

  return localDate.toISOString();
}

/**
 * Convert UTC ISO string to local time components in a timezone
 */
export function utcToLocal(utcString: string, timezone: string): { hour: number; minute: number; date: Date } {
  const date = new Date(utcString);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  return { hour, minute, date };
}