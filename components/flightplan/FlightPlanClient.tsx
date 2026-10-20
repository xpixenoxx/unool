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
import { useFlightPlanActions } from '@/hooks/flightplan';
import { FLIGHTPLAN_CONSTANTS } from '@/types/flightplan';
import type { WeekArc, ViewMode, PlatformType, StoryIntakeData } from '@/types/flightplan';
import { B, PLATFORM_META, MOTION, SPACING, RADIUS, SHADOW } from './design-tokens';

interface FlightPlanInnerProps {
  userId: string;
  workspaceId: string;
}

function FlightPlanInner({ userId, workspaceId }: FlightPlanInnerProps) {
  const searchParams = useSearchParams();
  const targetPostId = searchParams?.get('postId') || null;
  const [view, setView] = useState<ViewMode>('canvas');
  const [arc, setArc] = useState<WeekArc | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling] = useState(false);
  const [isPreviewOnly, setIsPreviewOnly] = useState(false);
  const [storyData, setStoryData] = useState<StoryIntakeData | null>(null);
  const [postCount, setPostCount] = useState<number>(0);
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformType[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isStoryPaused, setIsStoryPaused] = useState<boolean>(false);
  const [signalDmEnabled, setSignalDmEnabled] = useState(false);

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
      .then(data => { if (data?.enabled) setSignalDmEnabled(true); })
      .catch(() => {});
  }, [workspaceId]);

  const handleGenerate = async (data: StoryIntakeData) => {
    setIsGenerating(true);
    setStoryData(data);

    try {
      const generatedArc = await generateArc(data);
      if (!generatedArc) return;

      // We need to determine isPreviewOnly from the API response
      // For now, we'll check if connectedPlatforms is empty
      setIsPreviewOnly(connectedPlatforms.length === 0);
      setArc(generatedArc);
      setView('review');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (approvedArc: WeekArc) => {
    if (isPreviewOnly) return;

    try {
      const success = await approveArc(approvedArc, storyData || { coreStory: '', whatChanged: '', whatWentWrong: '', oneRealNumber: '', weekStartDate: '', selectedPlatforms: [] });
      if (success) {
        setView('canvas');
        setArc(null);
        loadCanvas(0);
      }
    } catch {
      // Error handled in hook
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
          className="sticky top-3 z-30 flex items-start sm:items-center justify-between gap-4 p-3 rounded-2xl border backdrop-blur-md shadow-sm"
          style={{ backgroundColor: B.glass, borderColor: B.glassBorder }}
        >
          <InstagramStoryBar
            posts={arc.weekPosts.filter(p => !p.deleted)}
            currentIndex={activeStoryIndex}
            onSelectIndex={setActiveStoryIndex}
          />
          <button
            onClick={() => { setView('canvas'); setArc(null); }}
            className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg border hover:bg-black/5 transition-colors cursor-pointer mt-0.5 sm:mt-0 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: B.textMuted, borderColor: B.border, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
          >
            <X className="w-3 h-3" />
            Exit Review
          </button>
        </div>
      )}

      {/* Views */}
      <AnimatePresence mode="wait">
        {view === 'story' && (
          <StoryIntake
            key="story"
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            connectedPlatforms={connectedPlatforms}
          />
        )}
        {view === 'review' && arc && (
          <ReviewScreen
            key="review"
            arc={arc}
            weekStartDate={storyData?.weekStartDate || format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')}
            isPreviewOnly={isPreviewOnly}
            onApprove={handleApprove}
            onBack={() => setView('story')}
            isScheduling={isScheduling}
            activeStoryIndex={activeStoryIndex}
            onStoryIndexChange={setActiveStoryIndex}
            onStoryHoverChange={setIsStoryPaused}
          />
        )}
        {view === 'canvas' && (
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