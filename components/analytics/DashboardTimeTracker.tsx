'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function normalizeDashboardSection(pathname: string): string {
  const clean = pathname.replace(/^\/dashboard\/?/, '').toLowerCase().trim();
  if (!clean) return 'overview';
  if (clean.startsWith('studio')) return 'studio';
  if (clean.startsWith('flightplan') || clean.startsWith('flight-plan')) return 'flightplan';
  if (clean.startsWith('signal')) return 'signal';
  if (clean.startsWith('automation')) return 'automation';
  if (clean.startsWith('unlock-gates') || clean.startsWith('follow-gates') || clean.startsWith('gates')) return 'unlock-gates';
  if (clean.startsWith('referral')) return 'referrals';
  if (clean.startsWith('profile')) return 'profile';
  if (clean.startsWith('billing')) return 'billing';
  if (clean.startsWith('setting')) return 'settings';
  if (clean.startsWith('composer')) return 'composer';
  return 'overview';
}

/**
 * DashboardTimeTracker
 * Lightweight active-time tracker for Unool dashboard sections.
 * Tracks active engagement time and flushes heartbeats every 20s or on route transition.
 */
export function DashboardTimeTracker({ workspaceId }: { workspaceId?: string }) {
  const pathname = usePathname();
  const currentSectionRef = useRef<string>(normalizeDashboardSection(pathname));
  const activeSecondsAccumulatorRef = useRef<number>(0);
  const lastActiveTimestampRef = useRef<number>(Date.now());
  const isUserActiveRef = useRef<boolean>(true);

  // Send accumulated seconds to the server
  const flushTime = (section: string, seconds: number) => {
    if (seconds <= 0) return;
    try {
      const payload = JSON.stringify({
        section,
        durationSeconds: Math.min(seconds, 300),
        workspaceId,
      });

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        const sent = navigator.sendBeacon('/api/analytics/time-spent', blob);
        if (!sent) {
          fetch('/api/analytics/time-spent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } else {
        fetch('/api/analytics/time-spent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking telemetry
    }
  };

  // Activity listeners to avoid counting idle time when user walks away
  useEffect(() => {
    const handleUserInteraction = () => {
      lastActiveTimestampRef.current = Date.now();
      isUserActiveRef.current = true;
    };

    window.addEventListener('mousemove', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('scroll', handleUserInteraction, { passive: true });
    window.addEventListener('click', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Route change: flush previous section time and start new section
  useEffect(() => {
    const nextSection = normalizeDashboardSection(pathname);
    const prevSection = currentSectionRef.current;

    if (nextSection !== prevSection) {
      const accrued = activeSecondsAccumulatorRef.current;
      if (accrued > 0) {
        flushTime(prevSection, accrued);
        activeSecondsAccumulatorRef.current = 0;
      }
      currentSectionRef.current = nextSection;
    }
  }, [pathname]);

  // Periodic ticker and heartbeat flush
  useEffect(() => {
    // 1-second interval checks active status and increments accumulator
    const tickInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        isUserActiveRef.current = false;
        return;
      }

      // Mark inactive if no input for > 2 minutes (120 seconds)
      const idleTimeMs = Date.now() - lastActiveTimestampRef.current;
      if (idleTimeMs > 120_000) {
        isUserActiveRef.current = false;
        return;
      }

      isUserActiveRef.current = true;
      activeSecondsAccumulatorRef.current += 1;

      // Flush every 20 seconds of active engagement
      if (activeSecondsAccumulatorRef.current >= 20) {
        const sec = activeSecondsAccumulatorRef.current;
        activeSecondsAccumulatorRef.current = 0;
        flushTime(currentSectionRef.current, sec);
      }
    }, 1000);

    // Flush on pagehide / visibilitychange to hidden
    const handleVisibilityChange = () => {
      if (document.hidden && activeSecondsAccumulatorRef.current > 0) {
        const sec = activeSecondsAccumulatorRef.current;
        activeSecondsAccumulatorRef.current = 0;
        flushTime(currentSectionRef.current, sec);
      }
    };

    const handlePageHide = () => {
      if (activeSecondsAccumulatorRef.current > 0) {
        const sec = activeSecondsAccumulatorRef.current;
        activeSecondsAccumulatorRef.current = 0;
        flushTime(currentSectionRef.current, sec);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      clearInterval(tickInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);

      if (activeSecondsAccumulatorRef.current > 0) {
        flushTime(currentSectionRef.current, activeSecondsAccumulatorRef.current);
        activeSecondsAccumulatorRef.current = 0;
      }
    };
  }, [workspaceId]);

  return null;
}

