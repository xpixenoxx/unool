'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  ArrowRight,
  Check,
  X,
  BookOpen,
  Zap,
  List,
  Layers,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudioIdea, IdeaFormat, synthesizeFallbackIdeas } from '@/lib/ai/studioIdeas';
import { studioToast } from '@/components/dashboard/StudioToast';

import { StudioProfile } from '@/lib/config/studioOnboarding';

export interface StudioIdeaGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIdea: (idea: StudioIdea) => void;
  onOpenProfileModal?: () => void;
  hasCompletedProfile: boolean;
  studioProfile?: StudioProfile | null;
}

const LOADING_MESSAGES = [
  'Reviewing your Studio profile calibrations...',
  'Checking upcoming seasonal moments and timely hooks...',
  'Brainstorming unique angles blending your focus and interests...',
  'Polishing conversational hooks and relatable questions...',
];

const FORMAT_CONFIG: Record<
  IdeaFormat,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  story: {
    label: 'Story',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/20',
    icon: BookOpen,
  },
  'hot take': {
    label: 'Hot take',
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-500/20',
    icon: Zap,
  },
  'how-to': {
    label: 'How-to',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/20',
    icon: Check,
  },
  carousel: {
    label: 'Carousel',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/20',
    icon: Layers,
  },
  'behind-the-scenes': {
    label: 'Behind the scenes',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/20',
    icon: Eye,
  },
  'question to audience': {
    label: 'Question',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/20',
    icon: HelpCircle,
  },
  list: {
    label: 'List',
    bg: 'bg-teal-500/10 dark:bg-teal-500/20',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-500/20',
    icon: List,
  },
};

function getProfileSignature(p?: StudioProfile | null): string {
  if (!p) return '';
  return `${p.role || ''}|${p.businessStage || ''}|${p.businessDomain || p.doing || ''}|${p.workInterests || ''}|${p.audience || ''}`;
}

export function StudioIdeaGenerator({
  isOpen,
  onClose,
  onSelectIdea,
  onOpenProfileModal,
  hasCompletedProfile,
  studioProfile,
}: StudioIdeaGeneratorProps) {
  const [ideas, setIdeas] = useState<StudioIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [batchNumber, setBatchNumber] = useState(1);
  const [shownTitles, setShownTitles] = useState<string[]>([]);
  const [error, setError] = useState<{ message: string; isProfileMissing?: boolean } | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const hasLoadedRef = useRef(false);
  const generatedForSignatureRef = useRef<string>('');
  const studioProfileRef = useRef<StudioProfile | null | undefined>(studioProfile);

  // Keep studioProfileRef in sync with latest prop
  useEffect(() => {
    studioProfileRef.current = studioProfile;
  }, [studioProfile]);

  const currentSignature = getProfileSignature(studioProfile);

  // Rotate loading message while loading
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Fetch ideas from endpoint
  const fetchIdeas = useCallback(
    async (accumulatedTitles: string[], targetBatch: number, overrideProfile?: StudioProfile) => {
      const activeProfile = overrideProfile || studioProfileRef.current || {
        role: 'Founder & Creator',
        businessStage: 'Building & Growing',
        businessDomain: 'Product & Tech',
        doing: 'Building and sharing lessons',
        workInterests: 'Product development, engineering, growth',
        audience: 'Builders, founders, creators, and peers',
        tone: 'Authentic, concise, punchy',
        completedAt: new Date().toISOString(),
      };

      setIsLoading(true);
      setError(null);
      setSelectedTitle(null);

      try {
        const res = await fetch('/api/studio/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            alreadyShown: accumulatedTitles.slice(-15),
            studioProfile: activeProfile,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          if (res.status === 429) {
            setError({
              message: 'Rate limit reached: up to 20 batches of ideas per hour. Please try again later.',
            });
            return;
          }

          throw new Error(data?.error || 'Failed to generate ideas');
        }

        const newIdeas: StudioIdea[] = Array.isArray(data?.ideas) ? data.ideas : [];
        if (newIdeas.length === 0) {
          throw new Error('No ideas were returned');
        }

        setIdeas(newIdeas);
        setBatchNumber(targetBatch);

        // Track shown titles
        const newTitles = newIdeas.map((i) => i.title);
        setShownTitles((prev) => Array.from(new Set([...prev, ...newTitles])));
      } catch (err) {
        console.warn('Idea generation server error, generating tailored contextual ideas:', err);
        const fallbacks = synthesizeFallbackIdeas(activeProfile, accumulatedTitles);
        setIdeas(fallbacks);
        setBatchNumber(targetBatch);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // When studioProfile changes to a new persona:
  useEffect(() => {
    if (!studioProfile) return;

    if (generatedForSignatureRef.current && generatedForSignatureRef.current !== currentSignature) {
      // Instantly clear stale ideas from previous persona
      setIdeas([]);
      setBatchNumber(1);
      setShownTitles([]);
      setSelectedTitle(null);
      hasLoadedRef.current = false;

      // If open, regenerate immediately for the new persona
      if (isOpen) {
        hasLoadedRef.current = true;
        generatedForSignatureRef.current = currentSignature;
        fetchIdeas([], 1, studioProfile);
      }
    }
  }, [currentSignature, isOpen, studioProfile, fetchIdeas]);

  // Initial load when opened
  useEffect(() => {
    if (isOpen) {
      if (!hasLoadedRef.current || (currentSignature && generatedForSignatureRef.current !== currentSignature)) {
        hasLoadedRef.current = true;
        generatedForSignatureRef.current = currentSignature;
        fetchIdeas(shownTitles, 1, studioProfile || undefined);
      }
    }
  }, [isOpen, currentSignature, studioProfile, fetchIdeas, shownTitles]);

  // Global listener for 'studio-profile-updated' event for instant zero-delay updates
  useEffect(() => {
    const handleGlobalProfileUpdate = (e: any) => {
      const updatedProfile = e?.detail as StudioProfile | undefined;
      if (!updatedProfile) return;

      studioProfileRef.current = updatedProfile;
      const newSig = getProfileSignature(updatedProfile);

      if (newSig && newSig !== generatedForSignatureRef.current) {
        setIdeas([]);
        setBatchNumber(1);
        setShownTitles([]);
        setSelectedTitle(null);
        hasLoadedRef.current = false;

        if (isOpen) {
          hasLoadedRef.current = true;
          generatedForSignatureRef.current = newSig;
          fetchIdeas([], 1, updatedProfile);
        }
      }
    };

    window.addEventListener('studio-profile-updated', handleGlobalProfileUpdate);
    return () => {
      window.removeEventListener('studio-profile-updated', handleGlobalProfileUpdate);
    };
  }, [isOpen, fetchIdeas]);

  // If user opened with incomplete profile, immediately show nudge
  useEffect(() => {
    if (isOpen && !hasCompletedProfile) {
      setError({
        message: 'Complete your Studio profile to generate tailored ideas based on your voice and focus.',
        isProfileMissing: true,
      });
    }
  }, [isOpen, hasCompletedProfile]);

  const handleNextBatch = () => {
    fetchIdeas(shownTitles, batchNumber + 1);
  };

  const handleSelect = (idea: StudioIdea) => {
    setSelectedTitle(idea.title);
    onSelectIdea(idea);
    studioToast.success(`Idea selected: "${idea.title}"`);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden mb-5"
    >
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FCFAF7] dark:bg-zinc-900 border border-[#E8E0D4] dark:border-zinc-800 shadow-sm transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-[#EFE9DF] dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#C4A265]/15 text-[#C4A265] border border-[#C4A265]/30 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#3D2B1F] dark:text-zinc-100">
                  Studio Idea Generator
                </h3>
                {!isLoading && ideas.length > 0 && !error && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[#F2EADB] dark:bg-zinc-800 text-[#8B7355] dark:text-zinc-300 border border-[#E2D6C5] dark:border-zinc-700">
                    Batch {batchNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8B7355] dark:text-zinc-400">
                Personalized topic angles blending your focus, interests, and upcoming moments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLoading && ideas.length > 0 && (
              <button
                type="button"
                onClick={() => fetchIdeas(shownTitles, batchNumber + 1)}
                title="Generate new batch of ideas"
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#8B7355] hover:text-[#3D2B1F] dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-[#F3ECE0] dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New batch</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close ideas generator"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-[#F3ECE0] dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Empty / Initial State */}
        {!isLoading && !error && ideas.length === 0 && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#C4A265]/15 text-[#C4A265] flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#3D2B1F] dark:text-zinc-200">
                Ready to inspire your next post
              </p>
              <p className="text-xs text-[#8B7355] dark:text-zinc-400 mt-0.5">
                Generate tailored ideas blending your focus, interests, and trending hooks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchIdeas([], 1)}
              className="px-4 py-2 rounded-xl bg-[#C4A265] hover:bg-[#B39155] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Generate 3 Ideas ✨</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#DACFBF] dark:border-zinc-700 border-t-[#C4A265] animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-[#3D2B1F] dark:text-zinc-200">
                Crafting fresh post ideas
              </p>
              <p className="text-xs text-[#8B7355] dark:text-zinc-400 max-w-sm transition-all duration-300 min-h-[1.5rem]">
                {LOADING_MESSAGES[loadingMsgIndex]}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-zinc-800 dark:text-zinc-200 space-y-3 my-2">
            <div className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#C49B3C] shrink-0 mt-1.5 inline-block" aria-hidden="true" />
              <p className="text-xs sm:text-sm leading-relaxed">{error.message}</p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {error.isProfileMissing ? (
                <Link
                  href="/dashboard/settings?tab=persona"
                  className="px-3.5 py-1.5 rounded-lg bg-[#3D2B1F] hover:bg-[#2A1D15] dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Configure in Settings</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => fetchIdeas(shownTitles, batchNumber)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#3D2B1F] hover:bg-[#2A1D15] dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Ideas Grid */}
        {!isLoading && !error && ideas.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ideas.map((idea, idx) => {
                const isSelected = selectedTitle === idea.title;
                const fmt = FORMAT_CONFIG[idea.format] || FORMAT_CONFIG.story;
                const IconComponent = fmt.icon;

                return (
                  <button
                    key={`${idea.title}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(idea)}
                    className={`group relative text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#C4A265] ${
                      isSelected
                        ? 'bg-[#F2EADB] dark:bg-zinc-800 border-[#C4A265] shadow-xs ring-1 ring-[#C4A265]'
                        : 'bg-white dark:bg-zinc-950/70 border-[#E8E0D4] dark:border-zinc-800 hover:border-[#C4A265]/70 hover:bg-[#FAF6EE] dark:hover:bg-zinc-800/60 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Format Badge & Checkbox */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${fmt.bg} ${fmt.text} ${fmt.border}`}
                        >
                          <IconComponent className="w-3 h-3" />
                          <span>{fmt.label}</span>
                        </span>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#C4A265] border-[#C4A265] text-white'
                              : 'border-[#DACFBF] dark:border-zinc-700 group-hover:border-[#C4A265]'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Plain Title */}
                      <h4 className="text-sm font-bold text-[#3D2B1F] dark:text-zinc-100 group-hover:text-[#2A1D15] leading-snug">
                        {idea.title}
                      </h4>

                      {/* Hook in Quotation Marks */}
                      <div className="p-2.5 rounded-lg bg-[#FAF6EE] dark:bg-zinc-900/90 border border-[#EFE5D6] dark:border-zinc-800 text-xs text-[#3D2B1F] dark:text-zinc-200 italic font-medium leading-relaxed">
                        &ldquo;{idea.hook}&rdquo;
                      </div>
                    </div>

                    {/* Why It Works Line */}
                    <div className="mt-3 pt-2.5 border-t border-[#F0E8DC] dark:border-zinc-800 text-[11px] text-[#8B7355] dark:text-zinc-400">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">Why it works: </span>
                      <span>{idea.why_it_works}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#EFE9DF] dark:border-zinc-800">
              <span className="text-xs text-[#8B7355] dark:text-zinc-400 order-2 sm:order-1">
                Tap any idea to use it in your post draft.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                <button
                  type="button"
                  onClick={handleNextBatch}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-[#FAF6EE] dark:hover:bg-zinc-700 border border-[#DACFBF] dark:border-zinc-700 text-xs font-semibold text-[#3D2B1F] dark:text-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>None of these, 3 more</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
export default StudioIdeaGenerator;
