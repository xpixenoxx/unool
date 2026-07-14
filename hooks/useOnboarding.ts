'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { OnboardingChecklist, OnboardingStep } from '@/lib/onboarding/types';

export interface UseOnboardingOptions {
  workspaceId: string;
  userId: string;
  autoFetch?: boolean;
}

export function useOnboarding({ workspaceId, userId, autoFetch = true }: UseOnboardingOptions) {
  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [nextStep, setNextStep] = useState<OnboardingStep | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Request counter to handle race conditions on rapid step completion
  const requestCounter = useRef(0);

  const fetchChecklist = useCallback(async () => {
    if (!workspaceId || !userId) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/onboarding?workspaceId=${workspaceId}`, {
        headers: { 'x-user-id': userId },
      });

      if (!response.ok) throw new Error('Failed to fetch checklist');

      const data = await response.json();
      setChecklist(data.checklist);
      setProgress(data.progress);
      setNextStep(data.nextStep);
      setIsComplete(data.isComplete);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load onboarding');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userId]);

  useEffect(() => {
    if (autoFetch) fetchChecklist();
  }, [autoFetch, fetchChecklist]);

  const completeStep = useCallback(async (stepId: string, metadata?: Record<string, unknown>) => {
    if (!workspaceId || !userId) return;

    // Increment counter to track this request
    const currentRequestId = ++requestCounter.current;

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ workspaceId, stepId, metadata }),
      });

      if (!response.ok) throw new Error('Failed to complete step');

      const data = await response.json();

      // Only update state if this is still the latest request
      if (currentRequestId === requestCounter.current) {
        setChecklist(data.checklist);
        setProgress(data.progress);
        setNextStep(data.nextStep);
        setIsComplete(data.isComplete);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete step');
    }
  }, [workspaceId, userId]);

  const reset = useCallback(async () => {
    if (!workspaceId || !userId) return;

    try {
      const response = await fetch(`/api/onboarding?workspaceId=${workspaceId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });

      if (!response.ok) throw new Error('Failed to reset');

      await fetchChecklist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset onboarding');
    }
  }, [workspaceId, userId, fetchChecklist]);

  return {
    checklist,
    loading,
    error,
    progress,
    nextStep,
    isComplete,
    completeStep,
    refetch: fetchChecklist,
    reset,
  };
}