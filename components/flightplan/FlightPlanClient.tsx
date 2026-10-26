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
    const t1 = setTimeout(() => setStep(1), 1150);
    const t2 = setTimeout(() => setStep(2), 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
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
        <h2>Plotting your week</h2>
        <svg viewBox="0 0 600 120" style={{ width: '100%', marginTop: 14 }}>
          <path
            className="fp-draw"
            d="M10,100 C120,100 140,20 250,30 S380,100 470,60 S560,20 590,30"
          />
        </svg>
        <ol className="fp-steps">
          <li className={step >= 0 ? 'on' : ''}>
            Structuring the weekly beats: Hook, Context, Challenge, Proof, CTA
          </li>
          <li className={step >= 1 ? 'on' : ''}>
            Tailoring the copy for your channels
          </li>
          <li className={step >= 2 ? 'on' : ''}>
            Choosing the best publishing time for each day
          </li>
        </ol>
      </div>
    </div>
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
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformType[]>(() => memoryConnectedPlatforms || []);
  const [signalDmEnabled, setSignalDmEnabled] = useState(() => memorySignalDmEnabled ?? true);
  const [isHoldActive, setIsHoldActive] = useState(false);

  const [canvasWeekOffset, setCanvasWeekOffset] = useState<number>(0);

  const { generate: generateArc, approve: approveArc, loadCanvas, holdQueue } = useFlightPlanActions();

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

  // Check SignalDM automation status
  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/instagram/automation?workspaceId=${workspaceId}`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data && typeof data.enabled === 'boolean') {
          memorySignalDmEnabled = data.enabled;
          setSignalDmEnabled(data.enabled);
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  const handleToggleHold = async () => {
    try {
      const nextHold = !isHoldActive;
      const ok = await holdQueue(nextHold, 3);
      if (ok) {
        setIsHoldActive(nextHold);
        studioToast.info(nextHold ? 'Queue held. Scheduled posts paused.' : 'Queue released.');
      }
    } catch {
      studioToast.error('Failed to toggle queue hold.');
    }
  };

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
          <p className="fp-sub">
            One story, seven days. Tell us the turning point and we’ll plot the week across your channels.
          </p>
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

      {/* ─── Switches Row (.row) ─── */}
      <div className="fp-row">
        <div
          className={`fp-sw ${signalDmEnabled ? 'on' : ''}`}
          role="switch"
          aria-checked={signalDmEnabled}
          tabIndex={0}
          onClick={() => {
            const next = !signalDmEnabled;
            setSignalDmEnabled(next);
            studioToast.info(
              next ? 'SignalDM is on' : 'SignalDM paused. Comments won’t start conversations.'
            );
          }}
        >
          <i />
          <span>
            <b>SignalDM is on</b> – comments on scheduled posts start an AI conversation
          </span>
        </div>

        <div
          className={`fp-sw amber ${isHoldActive ? 'on' : ''}`}
          role="switch"
          aria-checked={isHoldActive}
          tabIndex={0}
          onClick={handleToggleHold}
        >
          <i />
          <span>{isHoldActive ? 'Queue held' : 'Hold my queue'}</span>
        </div>
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