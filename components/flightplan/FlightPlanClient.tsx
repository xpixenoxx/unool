'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { studioToast } from '@/components/dashboard/StudioToast';
import { StoryIntake } from './StoryIntake';
import { ReviewScreen } from './ReviewScreen';
import { WeekCanvas } from './WeekCanvas';
import { generateClientFallbackArc } from './fallbackArc';
import { useFlightPlanActions } from '@/hooks/flightplan';
import type { WeekArc, ViewMode, PlatformType, StoryIntakeData } from '@/types/flightplan';
import { B, MOTION } from './design-tokens';
import './flightplan.css';

interface FlightPlanInnerProps {
  userId: string;
  workspaceId: string;
}

function WritingWeekView() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1200);
    const t2 = setTimeout(() => setStep(2), 2600);
    const t3 = setTimeout(() => setStep(3), 4200);
    const t4 = setTimeout(() => setStep(4), 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--bd)',
          borderRadius: 20,
          padding: 24,
        }}
      >
        <h2>Plotting your flight plan</h2>
        <svg viewBox="0 0 600 120" style={{ width: '100%', marginTop: 14 }}>
          <path
            className="fp-draw"
            d="M10,100 C120,100 140,20 250,30 S380,100 470,60 S560,20 590,30"
          />
        </svg>
        <ol className="fp-steps">
          <li className={step >= 0 ? 'on' : ''}>
            Mapping narrative flight trajectory: Departure Hook, Cruising Altitude, Turbulence &amp; Pivot, Telemetry, Final Approach
          </li>
          <li className={step >= 1 ? 'on' : ''}>
            Synthesizing native platform copy for connected broadcast channels
          </li>
          <li className={step >= 2 ? 'on' : ''}>
            Computing optimal audience takeoff windows for each flight leg
          </li>
          <li className={step >= 3 ? 'on' : ''}>
            Calibrating tactical first-comment dispatch links (bypassing reach penalties)
          </li>
          <li className={step >= 4 ? 'on' : ''}>
            Finalizing pre-flight manifest and clearance tickets
          </li>
        </ol>
      </div>
    </div>
  );
}

// ── In-Memory SWR Cache for 0ms Route Switching ──────────────────
let memoryConnectedPlatforms: PlatformType[] | null = null;

function FlightPlanInner({ userId, workspaceId }: FlightPlanInnerProps) {
  const searchParams = useSearchParams();
  const targetPostId = searchParams?.get('postId') || null;
  const [view, setView] = useState<ViewMode>('canvas');
  const [arc, setArc] = useState<WeekArc | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPreviewOnly, setIsPreviewOnly] = useState(false);
  const [storyData, setStoryData] = useState<StoryIntakeData | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformType[]>(() => memoryConnectedPlatforms || []);
  const [isHoldActive] = useState(false);

  const [canvasWeekOffset, setCanvasWeekOffset] = useState<number>(0);
  const [showTourAfterSchedule, setShowTourAfterSchedule] = useState(false);

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
      await new Promise(r => setTimeout(r, 2600));

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
          studioToast.success(
            'Weekly flight plan scheduled! Connect social accounts in Settings whenever you are ready to publish automatically.'
          );
        } else {
          studioToast.success('Flight plan scheduled for 7 days across your channels.');
        }
        let targetOffset = 0;
        if (storyData?.weekStartDate) {
          const parts = storyData.weekStartDate.split('-').map(Number);
          if (parts.length === 3) {
            const scheduledStart = new Date(parts[0], parts[1] - 1, parts[2]);
            const now = new Date();
            const thisMonday = new Date(now);
            const dayOfWeek = now.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            thisMonday.setDate(thisMonday.getDate() + diffToMonday);
            thisMonday.setHours(0, 0, 0, 0);
            const diffDays = Math.round((scheduledStart.getTime() - thisMonday.getTime()) / (1000 * 60 * 60 * 24));
            targetOffset = Math.max(0, Math.min(1, Math.round(diffDays / 7)));
          }
        }

        setCanvasWeekOffset(targetOffset);
        setShowTourAfterSchedule(true);
        setView('canvas');
        setArc(null);
        loadCanvas(targetOffset);
      }
    } catch {
      // Error handled in hook
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <main className="fp-wrap">
      {/* ─── Top Header (.top) ─── */}
      <div className="fp-top">
        <div>
          <h1>
            Flight{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--ac)' }}>Plan</em>
          </h1>
        </div>

        <button
          type="button"
          className="fp-btn gold"
          onClick={() => {
            if (view === 'canvas') {
              setView('story');
            } else {
              setView('canvas');
              setArc(null);
            }
          }}
        >
          {view === 'canvas' ? '+ Plan new week' : 'Cancel and exit'}
        </button>
      </div>

      {/* ─── View Routing ─── */}
      <AnimatePresence mode="wait">
        {isGenerating && <WritingWeekView key="generating" />}

        {!isGenerating && view === 'story' && (
          <StoryIntake
            key="story"
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            connectedPlatforms={connectedPlatforms}
            onCancel={() => setView('canvas')}
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
          />
        )}

        {!isGenerating && view === 'canvas' && (
          <WeekCanvas
            key="canvas"
            workspaceId={workspaceId}
            targetPostId={targetPostId}
            onNewArc={() => setView('story')}
            initialWeekOffset={canvasWeekOffset}
            autoTour={showTourAfterSchedule}
            onTourComplete={() => setShowTourAfterSchedule(false)}
            isHoldActive={isHoldActive}
            connectedPlatforms={connectedPlatforms}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ─── Wrapper with Suspense ─── */
export default function FlightPlanClient({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: B.textMuted }} />
        </div>
      }
    >
      <FlightPlanInner userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}