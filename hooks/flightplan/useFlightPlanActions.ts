'use client';

import { useCallback, useRef } from 'react';
import { studioToast } from '@/components/dashboard/StudioToast';
import type {
  StoryIntakeData,
  WeekArc,
  CanvasPost,
  CanvasPlatformVariant,
  UpdateVariantRequest,
  UseFlightPlanActionsResult,
  GenerateArcRequest,
  ScheduleFlightPlanRequest,
} from '@/types/flightplan';
import { FLIGHTPLAN_CONSTANTS } from '@/types/flightplan';

const GENERATION_TIMEOUT = FLIGHTPLAN_CONSTANTS.GENERATION_TIMEOUT_MS;

/**
 * Generate idempotency key for scheduling
 */
function generateIdempotencyKey(): string {
  return `${FLIGHTPLAN_CONSTANTS.IDEMPOTENCY_KEY_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Hook for Flight Plan API actions with retry logic and error handling
 */
export function useFlightPlanActions(): UseFlightPlanActionsResult {
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (data: StoryIntakeData): Promise<WeekArc | null> => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Set up timeout
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, GENERATION_TIMEOUT);

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const request: GenerateArcRequest = {
        coreStory: data.coreStory,
        whatChanged: data.whatChanged,
        whatWentWrong: data.whatWentWrong,
        oneRealNumber: data.oneRealNumber,
        weekStartDate: data.weekStartDate,
        audienceTimezone: data.audienceTimezone || tz,
        selectedPlatforms: data.selectedPlatforms,
      };

      const res = await fetch('/api/composer/arc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      const json = await res.json();

      if (!res.ok) {
        studioToast.generationFailed(
          json.error || 'Failed to generate week plan. Please check your story input.',
          { knowMoreUrl: '/terms' }
        );
        return null;
      }

      return json.arc;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        studioToast.generationFailed(
          'Generation timed out (60s). Please try again with a simpler story.',
          { knowMoreUrl: '/terms' }
        );
      } else {
        studioToast.generationFailed(
          'An unexpected error occurred while generating your plan.',
          { knowMoreUrl: '/terms' }
        );
      }
      return null;
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  const approve = useCallback(async (arc: WeekArc, storyData: StoryIntakeData): Promise<boolean> => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const activePosts = arc.weekPosts
        .filter(p => !p.deleted)
        .filter(p => p.platforms.some(pf => pf.enabled !== false));

      if (activePosts.length === 0) {
        studioToast.generationFailed('No active posts to schedule.', { knowMoreUrl: '/terms' });
        return false;
      }

      const idempotencyKey = generateIdempotencyKey();

      const request: ScheduleFlightPlanRequest = {
        arcTitle: arc.arcTitle,
        coreStory: storyData.coreStory ?? '',
        storyType: arc.storyType,
        weekStartDate: storyData.weekStartDate,
        userTimezone: tz,
        scheduleMode: 'arc',
        posts: activePosts.map(p => {
          const allImages = p.imageUrls || (p.imageUrl ? [p.imageUrl] : []);
          const mediaObjects = allImages.map(u => ({ url: u, type: 'image' as const }));
          const enabledPlatforms = p.platforms.filter(pf => pf.enabled !== false);
          return {
            day: p.day,
            scheduledHour: p.scheduledHour,
            scheduledMinute: p.scheduledMinute,
            strategy: 'cascading',
            arcBeat: p.arcBeat,
            imageUrl: allImages[0] || null,
            imageUrls: allImages,
            platforms: enabledPlatforms.map(pf => ({
              platform: pf.platform,
              content: pf.content,
              hashtags: pf.hashtags,
              firstCommentHint: pf.firstCommentHint ?? null,
              autoFirstComment: pf.autoFirstComment ?? null,
              schedulingOffsetMinutes: pf.schedulingOffsetMinutes ?? 0,
              mediaUrls: mediaObjects,
            })),
          };
        }),
        idempotencyKey,
      };

      const res = await fetch('/api/composer/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        studioToast.generationFailed(
          json.error || 'Failed to schedule flight plan.',
          { knowMoreUrl: '/terms' }
        );
        return false;
      }

      studioToast.success('Flight Plan approved and scheduled successfully!');
      return true;
    } catch {
      studioToast.generationFailed('Failed to schedule flight plan. Please try again.', {
        knowMoreUrl: '/terms',
      });
      return false;
    }
  }, []);

  const loadCanvas = useCallback(async (weekOffset: number): Promise<CanvasPost[]> => {
    try {
      const weekStart = new Date();
      const monday = new Date(weekStart);
      monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1)); // Monday
      monday.setDate(monday.getDate() + weekOffset * 7);

      const res = await fetch(`/api/composer/schedule/week?weekStart=${monday.toISOString()}`);
      if (!res.ok) {
        throw new Error('Failed to load week');
      }

      const data = await res.json();
      return data.posts ?? [];
    } catch {
      studioToast.generationFailed('Failed to load weekly schedule.', { knowMoreUrl: '/terms' });
      return [];
    }
  }, []);

  const updateVariant = useCallback(async (
    variantId: string,
    data: UpdateVariantRequest
  ): Promise<CanvasPlatformVariant | null> => {
    try {
      // Validate with ContentGuard before sending
      const { ContentGuard } = await import('@/lib/ai/ContentGuard');
      const guard = ContentGuard.validateSocialInput(data.content, { route: 'flightplan/modal' });
      if (!guard.safe) {
        studioToast.generationFailed(guard.violation.message, {
          platforms: [variantId],
          knowMoreUrl: '/terms',
        });
        return null;
      }

      const res = await fetch(`/api/publish/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        studioToast.generationFailed(json.error || `Failed to update variant`, {
          knowMoreUrl: '/terms',
        });
        return null;
      }

      studioToast.success('Post variant updated successfully!');
      return json.variant;
    } catch {
      studioToast.generationFailed('Failed to save changes to post variant.', {
        knowMoreUrl: '/terms',
      });
      return null;
    }
  }, []);

  const reschedulePost = useCallback(async (
    postId: string,
    newDate: Date
  ): Promise<CanvasPost | null> => {
    try {
      if (newDate.getTime() <= Date.now()) {
        studioToast.generationFailed('Cannot schedule in the past.', { knowMoreUrl: '/terms' });
        return null;
      }

      const endOfNextWeek = new Date();
      endOfNextWeek.setDate(endOfNextWeek.getDate() + 14);
      if (newDate.getTime() > endOfNextWeek.getTime()) {
        studioToast.generationFailed('Cannot schedule more than 2 weeks out.', { knowMoreUrl: '/terms' });
        return null;
      }

      const res = await fetch(`/api/composer/schedule/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newScheduledAt: newDate.toISOString() }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        studioToast.generationFailed(errJson.error || 'Failed to reschedule post', {
          knowMoreUrl: '/terms',
        });
        return null;
      }

      const data = await res.json();
      studioToast.success('Post rescheduled successfully!');
      return data.post;
    } catch {
      studioToast.generationFailed('Failed to reschedule post.', { knowMoreUrl: '/terms' });
      return null;
    }
  }, []);

  const cancelPost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/composer/schedule/${postId}`, { method: 'DELETE' });
      if (!res.ok) {
        studioToast.generationFailed('Failed to cancel post.', { knowMoreUrl: '/terms' });
        return false;
      }
      studioToast.success('Post cancelled.');
      return true;
    } catch {
      studioToast.generationFailed('Failed to cancel post.', { knowMoreUrl: '/terms' });
      return false;
    }
  }, []);

  const holdQueue = useCallback(async (hold: boolean, hours: number = 3): Promise<boolean> => {
    try {
      const res = await fetch('/api/composer/schedule/hold', {
        method: hold ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: hold ? JSON.stringify({ holdHours: hours }) : undefined,
      });

      if (!res.ok) {
        studioToast.generationFailed(hold ? 'Failed to hold queue.' : 'Failed to release queue.', {
          knowMoreUrl: '/terms',
        });
        return false;
      }

      studioToast.success(hold ? `Queue held for ${hours} hours.` : 'Queue released.');
      return true;
    } catch {
      studioToast.generationFailed(hold ? 'Failed to hold queue.' : 'Failed to release queue.', {
        knowMoreUrl: '/terms',
      });
      return false;
    }
  }, []);

  return {
    generate,
    approve,
    loadCanvas,
    updateVariant,
    reschedulePost,
    cancelPost,
    holdQueue,
  };
}