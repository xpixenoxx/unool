'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { StoryIntakeData, UseFlightPlanDraftResult } from '@/types/flightplan';
import { FLIGHTPLAN_CONSTANTS } from '@/types/flightplan';

const STORAGE_KEY = FLIGHTPLAN_CONSTANTS.DRAFT_STORAGE_KEY;
const DEBOUNCE_MS = FLIGHTPLAN_CONSTANTS.AUTO_SAVE_DEBOUNCE_MS;

/**
 * Hook for managing Flight Plan story intake draft persistence
 * Auto-saves to localStorage with debouncing, restores on mount
 */
export function useFlightPlanDraft(): UseFlightPlanDraftResult {
  const [draft, setDraft] = useState<StoryIntakeData | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  // Load draft on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoryIntakeData & { _meta?: { savedAt: number } };
        if (parsed.coreStory || parsed.whatChanged || parsed.whatWentWrong || parsed.oneRealNumber) {
          setDraft(parsed);
          setHasDraft(true);
          setLastSaved(parsed._meta?.savedAt ?? Date.now());
        }
      }
    } catch {
      // Corrupted or invalid draft - ignore
    }
  }, []);

  // Debounced save function
  const saveDraft = useCallback((data: Partial<StoryIntakeData>) => {
    setDraft(prev => {
      const merged = { ...prev, ...data } as StoryIntakeData;
      // Don't save empty drafts
      if (!merged.coreStory && !merged.whatChanged && !merged.whatWentWrong && !merged.oneRealNumber) {
        return prev;
      }

      // Debounce the actual localStorage write
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        try {
          const toStore = {
            ...merged,
            _meta: { savedAt: Date.now() },
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
          setLastSaved(Date.now());
          setHasDraft(true);
        } catch (e) {
          // localStorage full or unavailable - silent fail
          console.warn('[FlightPlan] Draft save failed:', e);
        }
      }, DEBOUNCE_MS);

      return merged;
    });
  }, []);

  // Clear draft (on successful generation)
  const clearDraft = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setDraft(null);
    setHasDraft(false);
    setLastSaved(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    draft,
    saveDraft,
    clearDraft,
    hasDraft,
    lastSaved,
  };
}