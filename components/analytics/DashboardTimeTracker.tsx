'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUserContext } from '@/lib/hooks/use-user-context';
import { getAccessToken } from '@/lib/supabase/browser';

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
  if (clean.startsWith('composer')) return 'studio';
  return 'overview';
}

interface DashboardTimeTrackerProps {
  userId?: string;
  workspaceId?: string;
}

/**
 * DashboardTimeTracker
 * Real-time active-time tracker for Unool dashboard sections.
 * Tracks active engagement time and flushes heartbeats:
 * - After first 5 seconds of active interaction (fast initial live sync)
 * - Every 10 seconds of ongoing active engagement
 * - Immediately on route transition (prevSection time)
 * - On tab hide or page unload
 */
export function DashboardTimeTracker({ userId: propUserId, workspaceId: propWorkspaceId }: DashboardTimeTrackerProps = {}) {
  const pathname = usePathname();

  // Safely retrieve user and workspace context
  let userContext: any = null;
  try {
    userContext = useUserContext();
  } catch {
    // Graceful fallback if rendered outside UserProvider
  }

  const effectiveUserId = propUserId || userContext?.user?.id;
  const effectiveWorkspaceId = propWorkspaceId || userContext?.workspace?.id;

  const userIdRef = useRef(effectiveUserId);
  const workspaceIdRef = useRef(effectiveWorkspaceId);

  useEffect(() => {
    userIdRef.current = effectiveUserId;
    workspaceIdRef.current = effectiveWorkspaceId;
  }, [effectiveUserId, effectiveWorkspaceId]);

  const currentSectionRef = useRef<string>(normalizeDashboardSection(pathname));
  const activeSecondsAccumulatorRef = useRef<number>(0);
  const lastActiveTimestampRef = useRef<number>(Date.now());
  const isUserActiveRef = useRef<boolean>(true);
  const hasFlushedOnceRef = useRef<boolean>(false);

  // Send accumulated seconds to the server with reliable fetch + credentials + bearer
  const flushTime = async (section: string, seconds: number) => {
    if (seconds <= 0) return;

    const activeUid = userIdRef.current || effectiveUserId;
    const activeWid = workspaceIdRef.current || effectiveWorkspaceId;

    const payload = JSON.stringify({
      section,
      durationSeconds: Math.min(seconds, 300),
      userId: activeUid,
      workspaceId: activeWid,
    });

    try {
      const token = await getAccessToken().catch(() => null);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (activeUid) {
        headers['x-user-id'] = activeUid;
      }

      await fetch('/api/analytics/time-spent', {
        method: 'POST',
        headers,
        body: payload,
        keepalive: true,
        credentials: 'include',
      });
      hasFlushedOnceRef.current = true;
    } catch {
      // Telemetry fallback via sendBeacon if fetch encounters network error
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/analytics/time-spent', blob);
        }
      } catch {
        // Silently swallow
      }
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

  // Route change: immediately flush previous section time and switch section
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

  // Periodic ticker and real-time heartbeat flush
  useEffect(() => {
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

      // Flush early on initial active arrival (5 seconds), then every 10 seconds
      const threshold = hasFlushedOnceRef.current ? 10 : 5;
      if (activeSecondsAccumulatorRef.current >= threshold) {
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
  }, [effectiveUserId, effectiveWorkspaceId]);

  return null;
}
