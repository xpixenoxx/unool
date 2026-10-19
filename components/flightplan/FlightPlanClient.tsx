'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Send, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { PlatformBrandLogo, type SupportedPlatformType } from '@/components/dashboard/previews/PlatformMobilePreview';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { studioToast } from '@/components/dashboard/StudioToast';
import { StoryIntake } from './StoryIntake';
import { ReviewScreen } from './ReviewScreen';
import { WeekCanvas } from './WeekCanvas';
import { InstagramStoryBar } from './InstagramStoryBar';
import { StepDots } from './StepDots';
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
    <div className="max-w-4xl mx-auto space-y-6 min-h-screen" style={{ backgroundColor: B.bg, color: B.text }}>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: B.text }}>Flight Plan</h1>
          <p className="text-sm" style={{ color: B.textMuted }}>
            Plan and schedule your weekly content across all connected platforms.
          </p>
        </div>
        {view === 'canvas' && postCount > 0 && (
          <button
            onClick={() => setView('story')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: B.accent, color: '#fff', boxShadow: `0 4px 16px ${B.accent}40`, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
          >
            Plan New Week
          </button>
        )}
      </div>

      {/* SignalDM Active Banner */}
      {signalDmEnabled && connectedPlatforms.includes('instagram' as PlatformType) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.spring.standard}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{
            backgroundColor: B.accentBg,
            borderColor: B.accentBorder,
          }}
        >
          <span className="text-lg">⚡</span>
          <div className="flex-1 text-sm" style={{ color: B.textSecondary }}>
            <span className="font-bold" style={{ color: B.accent }}>SignalDM Active</span>
            <span className="ml-2">Instagram comments on your scheduled posts will be auto-handled by AI</span>
          </div>
          <a
            href="/dashboard/automation"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: B.card,
              color: B.accent,
              border: `1px solid ${B.accentBorder}`,
              focusRingColor: B.accent,
              focusRingOffsetColor: B.card,
            }}
          >
            Manage →
          </a>
        </motion.div>
      )}

      {/* Step indicator / Instagram-style story line for story → review flow */}
      {view === 'story' && (
        <div className="flex items-center justify-between">
          <StepDots current={0} total={2} />
          <button
            onClick={() => { setView('canvas'); setArc(null); }}
            className="text-sm flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: B.textMuted, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
      )}

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