'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { PlatformBrandLogo, type SupportedPlatformType } from '@/components/dashboard/previews/PlatformMobilePreview';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { studioToast } from '@/components/dashboard/StudioToast';
import { StoryIntake } from './StoryIntake';
import { ReviewScreen } from './ReviewScreen';
import { InstagramStoryBar } from './InstagramStoryBar';
import { WeekCanvas } from './WeekCanvas';
import { generateClientFallbackArc } from './fallbackArc';
import { useFlightPlanActions } from '@/hooks/flightplan';
import { FLIGHTPLAN_CONSTANTS } from '@/types/flightplan';
import type { WeekArc, ViewMode, PlatformType, StoryIntakeData } from '@/types/flightplan';
import { B, PLATFORM_META, MOTION, SPACING, RADIUS, SHADOW } from './design-tokens';

interface FlightPlanInnerProps {
  userId: string;
  workspaceId: string;
}

function WritingWeekView({ platforms = [] }: { platforms?: PlatformType[] }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const safePlatforms = Array.isArray(platforms) ? platforms : [];
  const platNames = safePlatforms.length > 0
    ? safePlatforms.map(p => PLATFORM_META[p]?.name || p).join(', ')
    : 'Instagram, Facebook, LinkedIn, Threads, X';

  const steps = [
    'Structuring the weekly beats: hook, context, challenge, proof, call to action',
    `Tailoring copy for ${platNames}`,
    'Choosing the best publishing times',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={MOTION.spring.standard}
      className="max-w-xl mx-auto py-12 px-6"
    >
      <div
        className="rounded-3xl p-8 sm:p-12 text-center border relative overflow-hidden"
        style={{
          backgroundColor: B.card,
          borderColor: B.cardBorder,
          boxShadow: SHADOW.lg,
        }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto mb-6 animate-spin"
          style={{
            border: `3px solid ${B.accentBorder}`,
            borderTopColor: B.accent,
            boxShadow: `0 0 0 8px ${B.accentGlow}`,
          }}
        />

        <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: B.text }}>
          Writing your week
        </h2>
        <p className="text-sm mb-8" style={{ color: B.textSecondary }}>
          Synthesizing your turning point into 5 platform-tailored narrative beats.
        </p>

        <ul className="space-y-3.5 text-left max-w-md mx-auto">
          {steps.map((text, idx) => {
            const isDone = step > idx;
            const isCurrent = step === idx;
            return (
              <li
                key={text}
                className="flex items-center gap-3 text-sm transition-colors duration-300"
                style={{
                  color: isCurrent ? B.text : isDone ? B.textSecondary : B.textMuted,
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-300"
                  style={{
                    backgroundColor: isDone ? B.accent : isCurrent ? B.accentBg : B.cardBorder,
                    color: isDone ? '#2A1D12' : isCurrent ? B.accent : B.textMuted,
                    border: isCurrent ? `2px solid ${B.accent}` : isDone ? 'none' : `1.5px solid ${B.border}`,
                    boxShadow: isCurrent ? `0 0 0 3px ${B.accentGlow}` : 'none',
                  }}
                >
                  {idx + 1}
                </div>
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}

// ── In-Memory SWR Cache for 0ms Route Switching ──────────────────
let memoryConnectedPlatforms: PlatformType[] | null = null;
let memorySignalDmEnabled: boolean | null = null;

function FlightPlanInner({ userId, workspaceId }: FlightPlanInnerProps) {
  const searchParams = useSearchParams();
  const targetPostId = searchParams?.get('postId') || null;
  const [view, setView] = useState<ViewMode>('canvas');
  const [arc, setArc] = useState<WeekArc | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPreviewOnly, setIsPreviewOnly] = useState(false);
  const [storyData, setStoryData] = useState<StoryIntakeData | null>(null);
  const [postCount, setPostCount] = useState<number>(0);
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformType[]>(() => memoryConnectedPlatforms || []);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isStoryPaused, setIsStoryPaused] = useState<boolean>(false);
  const [signalDmEnabled, setSignalDmEnabled] = useState(() => memorySignalDmEnabled ?? false);

  const { generate: generateArc, approve: approveArc, loadCanvas } = useFlightPlanActions();

  // Load connected platforms
  useEffect(() => {
    async function loadConnections() {
      try {
        const res = await fetch('/api/platform/connections', { credentials: 'include' });
        const data = await res.json();
        if (data.connections) {
          const active = Object.values(data.connections)
            .filter((c: any) => c.status === 'connected')
            .map((c: any) => c.platform as PlatformType);
          memoryConnectedPlatforms = active;
          setConnectedPlatforms(active);
        }
      } catch {
        // silent
      }
    }
    loadConnections();
  }, []);

  // Check SignalDM automation status (best-effort, non-blocking)
  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/instagram/automation?workspaceId=${workspaceId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.enabled) {
          memorySignalDmEnabled = true;
          setSignalDmEnabled(true);
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  const handleGenerate = async (data: StoryIntakeData) => {
    setIsGenerating(true);
    setStoryData(data);

    try {
      let generatedArc: WeekArc | null = null;
      try {
        generatedArc = await generateArc(data);
      } catch (err) {
        console.warn('Backend generateArc threw error, using client synthesis fallback:', err);
      }

      // Resilient fallback: If backend returned null, errored, or timed out, synthesize directly
      if (!generatedArc) {
        generatedArc = generateClientFallbackArc(data);
      }

      // Brief animation time so user sees the 3-step checklist
      await new Promise(r => setTimeout(r, 1200));

      setIsPreviewOnly(connectedPlatforms.length === 0);
      setArc(generatedArc);
      setView('review');
    } catch (err) {
      console.error('Generation caught exception:', err);
      const fallback = generateClientFallbackArc(data);
      setArc(fallback);
      setView('review');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (approvedArc: WeekArc) => {
    setIsScheduling(true);
    try {
      const success = await approveArc(
        approvedArc,
        storyData || {
          coreStory: '',
          whatChanged: '',
          whatWentWrong: '',
          oneRealNumber: '',
          weekStartDate: format(new Date(), 'yyyy-MM-dd'),
          selectedPlatforms: [],
        }
      );
      if (success) {
        if (isPreviewOnly) {
          studioToast.success('Weekly flight plan scheduled! Connect social accounts in Settings whenever you are ready to publish automatically.');
        }
        setView('canvas');
        setArc(null);
        loadCanvas(0);
      }
    } catch {
      // Error handled in hook
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-0 space-y-6 min-h-screen" style={{ color: B.text }}>
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: B.text }}>Flight Plan</h1>
          <p className="text-sm mt-0.5" style={{ color: B.textSecondary }}>
            Plan and schedule your weekly narrative across all connected channels.
          </p>
        </div>
        {view === 'canvas' ? (
          <button
            onClick={() => setView('story')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: `linear-gradient(180deg, #DFBE7A 0%, ${B.accent} 100%)`,
              color: '#2A1D12',
              border: `1px solid ${B.accentHover}`,
              boxShadow: `0 1px 0 rgba(255,255,255,0.5) inset, 0 4px 12px ${B.accentGlow}`,
            }}
          >
            + Plan new week
          </button>
        ) : (
          <button
            onClick={() => { setView('canvas'); setArc(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: B.card,
              borderColor: B.border,
              color: B.textSecondary,
            }}
          >
            Cancel and exit
          </button>
        )}
      </div>

      {/* SignalDM Active Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION.spring.standard}
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border flex-wrap text-sm"
        style={{
          backgroundColor: B.accentBg,
          borderColor: B.accentBorder,
          color: B.textSecondary,
        }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            backgroundColor: B.success,
            boxShadow: `0 0 0 4px ${B.success}33`,
          }}
        />
        <span className="flex-1">
          <strong style={{ color: B.text }}>SignalDM is on.</strong> Comments on your scheduled Instagram and Facebook posts get AI conversation flows automatically.
        </span>
        <a
          href="/dashboard/automation"
          className="text-xs font-semibold ml-auto underline underline-offset-4 transition-opacity hover:opacity-80"
          style={{ color: B.accentHover }}
        >
          Manage automation
        </a>
      </motion.div>

      {/* Story intake manages its own unified 3-step breadcrumb — no duplicate bar here */}

      {view === 'review' && arc && (
        <div
          className="sticky top-3 z-30 p-3 rounded-2xl border backdrop-blur-md shadow-sm"
          style={{ backgroundColor: B.glass, borderColor: B.glassBorder }}
        >
          <InstagramStoryBar
            posts={(arc?.weekPosts || []).filter(p => !p.deleted)}
            currentIndex={activeStoryIndex}
            onSelectIndex={(idx) => {
              setActiveStoryIndex(idx);
              const el = document.getElementById(`arc-post-${idx}`);
              if (el) {
                const headerOffset = 110;
                const elementPosition = el.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            }}
          />
        </div>
      )}

      {/* Views */}
      <AnimatePresence mode="wait">
        {isGenerating && (
          <WritingWeekView
            key="generating"
            platforms={storyData?.selectedPlatforms || connectedPlatforms || []}
          />
        )}
        {!isGenerating && view === 'story' && (
          <StoryIntake
            key="story"
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            connectedPlatforms={connectedPlatforms}
          />
        )}
        {!isGenerating && view === 'review' && arc && (
          <ReviewScreen
            key="review"
            arc={arc}
            weekStartDate={storyData?.weekStartDate || format(new Date(), 'yyyy-MM-dd')}
            isPreviewOnly={isPreviewOnly}
            onApprove={handleApprove}
            onBack={() => setView('story')}
            isScheduling={isScheduling}
            activeStoryIndex={activeStoryIndex}
            onStoryIndexChange={setActiveStoryIndex}
            onStoryHoverChange={setIsStoryPaused}
          />
        )}
        {!isGenerating && view === 'canvas' && (
          <WeekCanvas
            key="canvas"
            workspaceId={workspaceId}
            targetPostId={targetPostId}
            onNewArc={() => setView('story')}
            onPostCountChange={setPostCount}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Wrapper with Suspense ─── */
export default function FlightPlanClient({ userId, workspaceId }: { userId: string; workspaceId: string }) {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: B.textMuted }} />
      </div>
    }>
      <FlightPlanInner userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}