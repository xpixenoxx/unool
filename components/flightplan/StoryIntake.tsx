'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, X, Loader2, Globe, Calendar, Target, TrendingUp, Lightbulb, Zap, AlertCircle, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek } from 'date-fns';
import { PlatformBrandLogo, type SupportedPlatformType } from '@/components/dashboard/previews/PlatformMobilePreview';
import { useFlightPlanDraft } from '@/hooks/flightplan';
import { FLIGHTPLAN_CONSTANTS } from '@/types/flightplan';
import type { StoryIntakeData, PlatformType, FollowUpQuestion } from '@/types/flightplan';
import { B, PLATFORM_META, MOTION, SPACING, RADIUS } from './design-tokens';

interface StoryIntakeProps {
  onGenerate: (data: StoryIntakeData) => void;
  isGenerating: boolean;
  connectedPlatforms: PlatformType[];
}

const FOLLOW_UP_QUESTIONS: FollowUpQuestion[] = [
  { id: 'whatChanged', question: 'What changed recently?', placeholder: 'New feature, milestone, pivot, hire, metric...', required: false },
  { id: 'whatWentWrong', question: 'What was the challenge?', placeholder: 'The bottleneck, churn spike, bug, hard lesson...', required: false },
  { id: 'oneRealNumber', question: 'One real number that proves it', placeholder: '+$47k MRR, -23% churn, 12→3 min onboarding...', required: false },
];

const DEFAULT_SAMPLE = {
  coreStory: 'We spent 18 months building for enterprise. Last month, we stripped it down to a $29/mo self-serve tool. 3 pilot customers became 47 in 3 weeks.',
  whatChanged: 'Stripped enterprise tool down to a $29/mo self-serve plan',
  whatWentWrong: 'Enterprise sales took months with 35% signup drop-off',
  oneRealNumber: '3 pilot customers became 47 in 3 weeks',
};

const ALTERNATIVE_SAMPLE = {
  coreStory: 'Eight months ago we were chasing enterprise deals that took weeks to close. Then we noticed 35% of new accounts quit before ever publishing. We scrapped sales calls, built a $29 self-serve plan, and rebuilt onboarding around a single question.',
  whatChanged: 'Scrapped sales calls and launched $29 self-serve tier',
  whatWentWrong: '35% of new signups churned before publishing first post',
  oneRealNumber: '35% drop-off eliminated, onboarding cut to 3 minutes',
};

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d);
    }
  }
  return new Date(dateStr);
}

const ARC_BEATS = ['Hook', 'Context', 'Challenge', 'Turning Point', 'Resolution', 'Proof', 'CTA'];

/* ─── Interactive Section Info Mark & Popover Guide ─────────────────────── */
function SectionInfoTooltip({
  title,
  subtitle,
  bullets,
  example,
}: {
  title: string;
  subtitle: string;
  bullets: Array<{ bold: string; text: string }>;
  example?: { bad: string; good: string };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 220);
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={`Guide: ${title}`}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2"
        style={{
          backgroundColor: isOpen ? B.accentBg : B.card,
          borderColor: isOpen ? B.accent : B.border,
          color: isOpen ? B.accentHover : B.textSecondary,
          boxShadow: isOpen ? `0 0 0 2px ${B.accentGlow}` : 'none',
        }}
      >
        <Info className="w-3.5 h-3.5" style={{ color: B.accentHover }} />
        <span>How it works</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-80 sm:w-96 p-4 rounded-2xl border shadow-xl z-50 text-left"
            style={{
              backgroundColor: B.card,
              borderColor: B.accentBorder,
              boxShadow: '0 12px 32px rgba(61,43,31,0.18)',
            }}
          >
            <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b" style={{ borderColor: B.border }}>
              <div>
                <h4 className="font-semibold text-xs text-stone-900">{title}</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                aria-label="Close guide"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <ul className="space-y-2 text-xs text-stone-700 mb-3">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>
                    <strong className="text-stone-900 font-semibold">{b.bold}:</strong> {b.text}
                  </span>
                </li>
              ))}
            </ul>

            {example && (
              <div className="rounded-xl p-2.5 text-[11px] space-y-1.5 border" style={{ backgroundColor: B.accentBg, borderColor: B.accentBorder }}>
                <div className="text-red-700">
                  <span className="font-semibold">✕ Avoid:</span> {example.bad}
                </div>
                <div className="text-emerald-800">
                  <span className="font-semibold">✓ Try:</span> {example.good}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StoryIntake({ onGenerate, isGenerating, connectedPlatforms }: StoryIntakeProps) {
  const { draft, saveDraft, clearDraft, hasDraft } = useFlightPlanDraft();
  const userEditedRef = React.useRef(false);

  const [formData, setFormData] = useState<StoryIntakeData>(() => ({
    coreStory: '',
    whatChanged: '',
    whatWentWrong: '',
    oneRealNumber: '',
    weekStartDate: format(new Date(), 'yyyy-MM-dd'),
    selectedPlatforms: connectedPlatforms.length > 0 ? connectedPlatforms : (['instagram', 'facebook', 'linkedin', 'threads', 'x'] as PlatformType[]),
    audienceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }));

  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0); // 0=CoreStory 1=Insights 2=Platforms
  const [activeFollowUp, setActiveFollowUp] = useState(0);
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [characterCounts, setCharacterCounts] = useState<Record<string, number>>(() => ({
    coreStory: 0,
    whatChanged: 0,
    whatWentWrong: 0,
    oneRealNumber: 0,
  }));

  // Initialize from draft if present and user has not typed yet
  useEffect(() => {
    if (draft && !userEditedRef.current) {
      // Purge legacy hardcoded sample text
      if (
        draft.coreStory?.includes('We spent 18 months building for enterprise') ||
        draft.coreStory?.includes('Eight months ago we were chasing enterprise deals')
      ) {
        clearDraft();
        return;
      }
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const validStartDate = draft.weekStartDate && draft.weekStartDate >= todayStr
        ? draft.weekStartDate
        : todayStr;
      setFormData(prev => ({ ...prev, ...draft, weekStartDate: validStartDate }));
      if (draft.selectedPlatforms?.length) {
        setFormData(prev => ({ ...prev, selectedPlatforms: draft.selectedPlatforms }));
      }
    }
  }, [draft, clearDraft]);

  // Keep selectedPlatforms aligned with connectedPlatforms if user hasn't made custom selection
  useEffect(() => {
    if (connectedPlatforms.length > 0 && !draft?.selectedPlatforms?.length && !userEditedRef.current) {
      setFormData(prev => ({ ...prev, selectedPlatforms: connectedPlatforms }));
    }
  }, [connectedPlatforms, draft]);

  // Auto-save draft only when user has actively edited
  useEffect(() => {
    if (userEditedRef.current && (formData.coreStory || formData.whatChanged || formData.whatWentWrong || formData.oneRealNumber)) {
      saveDraft(formData);
    }
  }, [formData, saveDraft]);

  // Character count tracking
  useEffect(() => {
    const counts: Record<string, number> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        counts[key] = value.length;
      }
    });
    setCharacterCounts(counts);
  }, [formData]);

  const handleChange = useCallback((field: keyof StoryIntakeData, value: string | PlatformType[] | string) => {
    userEditedRef.current = true;
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error on change
    if (validationErrors[field]) {
      setValidationErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  }, [validationErrors]);

  const togglePlatform = useCallback((platform: PlatformType) => {
    userEditedRef.current = true;
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter(p => p !== platform)
        : [...prev.selectedPlatforms, platform],
    }));
  }, []);

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!formData.coreStory.trim()) {
      errors.coreStory = 'Core story is required';
      setActiveStep(0);
      setValidationErrors(errors);
      return false;
    }
    setValidationErrors(errors);
    return true;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (!formData.coreStory.trim()) {
      setValidationErrors({ coreStory: 'Core story is required' });
      setActiveStep(0);
      return;
    }
    const finalPlatforms = formData.selectedPlatforms.length > 0
      ? formData.selectedPlatforms
      : (['instagram', 'facebook', 'linkedin', 'threads', 'x'] as PlatformType[]);

    const finalData: StoryIntakeData = {
      ...formData,
      selectedPlatforms: finalPlatforms,
      weekStartDate: formData.weekStartDate && formData.weekStartDate >= format(new Date(), 'yyyy-MM-dd')
        ? formData.weekStartDate
        : format(new Date(), 'yyyy-MM-dd'),
    };

    clearDraft();
    onGenerate(finalData);
  }, [clearDraft, onGenerate, formData]);

  const allPlatforms = Object.keys(PLATFORM_META) as PlatformType[];
  const connectedSet = new Set(connectedPlatforms);

  const scheduleStartDate = useMemo(() => parseLocalDate(formData.weekStartDate), [formData.weekStartDate]);
  const scheduleEndDate = useMemo(() => addDays(scheduleStartDate, 6), [scheduleStartDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* ─── Unified 3-step breadcrumb stepper ─────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        {(['Core story', 'Guided insights', 'Channels \u0026 cadence'] as const).map((label, idx) => {
          const done   = activeStep > idx;
          const active = activeStep === idx;
          const canClick = idx === 0 || !!formData.coreStory.trim();
          return (
            <div key={label} className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canClick}
                onClick={() => { if (canClick) setActiveStep(idx as 0 | 1 | 2); }}
                className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ focusRingColor: B.accent, focusRingOffsetColor: B.bg } as React.CSSProperties}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 flex-shrink-0"
                  style={{
                    backgroundColor: done ? B.accent : active ? B.accentBg : B.cardBorder,
                    color:           done ? '#fff'   : active ? B.accent  : B.textMuted,
                    border:          active ? `2px solid ${B.accent}` : done ? '2px solid transparent' : `2px solid ${B.border}`,
                    boxShadow:       active ? `0 0 0 3px ${B.accentGlow}` : 'none',
                  }}
                >
                  {idx + 1}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: active ? B.text : done ? B.textSecondary : B.textMuted }}
                >
                  {label}
                </span>
              </button>
              {idx < 2 && (
                <div
                  className="w-8 h-0.5 rounded-full transition-colors duration-300"
                  style={{ backgroundColor: done ? B.accent : B.border }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Step 1: Core Story ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeStep === 0 && (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={MOTION.spring.standard}
            className="space-y-4"
          >
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl flex-wrap sm:flex-nowrap" style={{ backgroundColor: B.accentBg, border: `1px solid ${B.accentBorder}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: B.accentBorder }}>
              <Lightbulb className="w-5 h-5" style={{ color: B.accentHover }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: B.text }}>Step 1 of 3: Your Core Story</h3>
              <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>
                One paragraph. The moment everything shifted. No marketing speak.
              </p>
            </div>
          </div>
          <SectionInfoTooltip
            title="Writing Your Core Story"
            subtitle="The 3-part founder narrative formula that drives high engagement"
            bullets={[
              { bold: 'The Catalyst', text: 'Start with what shifted: a pivot, customer realization, bug, or unexpected hurdle.' },
              { bold: 'The Friction', text: 'Be transparent about what was hard or almost broke. Vulnerability builds instant credibility.' },
              { bold: 'The Proof', text: 'Anchor your turnaround with a real number, date, or tangible result (e.g., 3 to 47 customers).' },
            ]}
            example={{
              bad: '"Excited to announce our new self-serve tier! Check our website to learn more."',
              good: '"We spent 18 months chasing enterprise deals. Last month we stripped it to $29/mo self-serve. 3 pilot customers became 47 in 3 weeks."',
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Textarea
            value={formData.coreStory}
            onChange={e => handleChange('coreStory', e.target.value)}
            rows={6}
            placeholder={"Describe the core turning point of your week here...\n\nSuggested structure to guide you:\n• What happened or shifted? (e.g. launched, pivoted, or hit a wall)\n• What was the bottleneck or hard lesson learned?\n• What was the proof or outcome? (e.g. 3 pilot customers became 47 in 3 weeks)\n\nTip: Write naturally like talking to a fellow founder. Or click an example starter below →"}
            className="resize-y rounded-xl text-sm placeholder:text-[#A69279]/65 placeholder:font-normal leading-relaxed p-4"
            style={{
              backgroundColor: B.card,
              borderColor: validationErrors.coreStory ? B.danger : B.border,
              color: B.text,
            }}
            aria-invalid={!!validationErrors.coreStory}
            aria-describedby={validationErrors.coreStory ? 'coreStory-error' : undefined}
          />
          {validationErrors.coreStory && (
            <p id="coreStory-error" className="text-xs flex items-center gap-1" style={{ color: B.danger }}>
              <AlertCircle className="w-3 h-3" /> {validationErrors.coreStory}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs flex-wrap gap-2" style={{ color: B.textMuted }}>
          <div className="flex items-center gap-2">
            <span className="font-medium" style={{ color: characterCounts.coreStory ? B.text : B.textMuted }}>
              {characterCounts.coreStory || 0} characters
            </span>
            <span>•</span>
            <span style={{
              color: (characterCounts.coreStory || 0) >= 80 && (characterCounts.coreStory || 0) <= 600
                ? B.success
                : B.textMuted
            }}>
              {(characterCounts.coreStory || 0) >= 80 && (characterCounts.coreStory || 0) <= 600
                ? 'Good length for narrative arc'
                : 'Target: 150–500 chars'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium" style={{ color: B.textMuted }}>Load an example:</span>
            <button
              type="button"
              onClick={() => {
                userEditedRef.current = true;
                setFormData(prev => ({
                  ...prev,
                  coreStory: DEFAULT_SAMPLE.coreStory,
                  whatChanged: DEFAULT_SAMPLE.whatChanged,
                  whatWentWrong: DEFAULT_SAMPLE.whatWentWrong,
                  oneRealNumber: DEFAULT_SAMPLE.oneRealNumber,
                }));
              }}
              className="text-xs font-semibold hover:underline px-2 py-0.5 rounded-lg border transition-colors"
              style={{ backgroundColor: B.accentBg, borderColor: B.border, color: B.accentHover }}
            >
              Enterprise pivot ($29/mo)
            </button>
            <button
              type="button"
              onClick={() => {
                userEditedRef.current = true;
                setFormData(prev => ({
                  ...prev,
                  coreStory: ALTERNATIVE_SAMPLE.coreStory,
                  whatChanged: ALTERNATIVE_SAMPLE.whatChanged,
                  whatWentWrong: ALTERNATIVE_SAMPLE.whatWentWrong,
                  oneRealNumber: ALTERNATIVE_SAMPLE.oneRealNumber,
                }));
              }}
              className="text-xs font-semibold hover:underline px-2 py-0.5 rounded-lg border transition-colors"
              style={{ backgroundColor: B.accentBg, borderColor: B.border, color: B.accentHover }}
            >
              Onboarding shift
            </button>
            {formData.coreStory ? (
              <button
                type="button"
                onClick={() => {
                  userEditedRef.current = true;
                  setFormData(prev => ({
                    ...prev,
                    coreStory: '',
                    whatChanged: '',
                    whatWentWrong: '',
                    oneRealNumber: '',
                  }));
                }}
                className="text-xs font-medium hover:underline text-stone-500 hover:text-stone-700 ml-1"
              >
                Clear text
              </button>
            ) : null}
          </div>
        </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (!formData.coreStory.trim()) {
                  setValidationErrors(v => ({ ...v, coreStory: 'Core story is required' }));
                  return;
                }
                setValidationErrors(v => { const n = { ...v }; delete n.coreStory; return n; });
                setActiveStep(2);
              }}
              className="text-xs font-semibold hover:underline px-2 py-1"
              style={{ color: B.textSecondary }}
            >
              Skip directly to channels →
            </button>

            <button
              onClick={() => {
                if (!formData.coreStory.trim()) {
                  setValidationErrors(v => ({ ...v, coreStory: 'Core story is required' }));
                  return;
                }
                setValidationErrors(v => { const n = { ...v }; delete n.coreStory; return n; });
                setActiveStep(1);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: formData.coreStory.trim() ? B.accent : B.cardBorder,
                color: formData.coreStory.trim() ? '#fff' : B.textMuted,
                boxShadow: formData.coreStory.trim() ? `0 4px 16px ${B.accentGlow}` : 'none',
                cursor: formData.coreStory.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Continue to Guided Insights
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          </motion.div>
        )}

        {/* ─── Step 2: Guided Insights (Unified All 3 Questions) ───── */}
        {activeStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={MOTION.spring.standard}
            className="space-y-5"
          >
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl flex-wrap sm:flex-nowrap" style={{ backgroundColor: B.successBg, border: `1px solid ${B.successBorder}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: B.successBorder }}>
                  <Target className="w-5 h-5" style={{ color: B.success }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: B.text }}>Step 2 of 3: Add a Few Details</h3>
                  <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>
                    Specifics make the posts sound like you. Skip any you do not have.
                  </p>
                </div>
              </div>
              <SectionInfoTooltip
                title="Guided Insights & Calibration"
                subtitle="Why specific details make AI sound authentically like you"
                bullets={[
                  { bold: 'Authentic Voice', text: 'Specific metrics, pivots, and challenges prevent AI from sounding generic or robotic.' },
                  { bold: 'Platform Adaptation', text: 'Each detail is adapted into a distinct format across LinkedIn, X, Threads, and Instagram.' },
                  { bold: 'Optional', text: 'Fill in whatever you recall, or skip ahead directly to channel selection.' },
                ]}
              />
            </div>

            {/* Q0: What changed */}
            <div className="space-y-2 p-4 rounded-2xl" style={{ backgroundColor: B.card, border: `1px solid ${B.border}` }}>
              <label className="block text-sm font-semibold" style={{ color: B.text }}>
                What changed recently?
              </label>
              <p className="text-xs" style={{ color: B.textMuted }}>A milestone, a release, a pivot, or a shift in a metric.</p>
              <Textarea
                value={formData.whatChanged || ''}
                onChange={e => handleChange('whatChanged', e.target.value)}
                rows={2}
                placeholder="New feature, milestone, pivot, hire, metric..."
                className="resize-y rounded-xl text-sm placeholder:text-[#A69279]/60 placeholder:italic placeholder:font-normal"
                style={{ backgroundColor: B.card, borderColor: B.border, color: B.text }}
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-medium" style={{ color: B.textMuted }}>Suggestions:</span>
                {['Launched a $29 plan', 'Dropped sales calls', 'Rebuilt self-serve onboarding'].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChange('whatChanged', chip)}
                    className="px-2.5 py-1 rounded-full text-xs border transition-colors hover:border-amber-400"
                    style={{ backgroundColor: B.accentBg, borderColor: B.border, color: B.textSecondary }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Q1: What was the challenge */}
            <div className="space-y-2 p-4 rounded-2xl" style={{ backgroundColor: B.card, border: `1px solid ${B.border}` }}>
              <label className="block text-sm font-semibold" style={{ color: B.text }}>
                What was the challenge?
              </label>
              <p className="text-xs" style={{ color: B.textMuted }}>The bottleneck, the obstacle or the hard lesson.</p>
              <Textarea
                value={formData.whatWentWrong || ''}
                onChange={e => handleChange('whatWentWrong', e.target.value)}
                rows={2}
                placeholder="The bottleneck, churn spike, bug, hard lesson..."
                className="resize-y rounded-xl text-sm placeholder:text-[#A69279]/60 placeholder:italic placeholder:font-normal"
                style={{ backgroundColor: B.card, borderColor: B.border, color: B.text }}
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-medium" style={{ color: B.textMuted }}>Suggestions:</span>
                {['Onboarding took 3 weeks', '35% of users quit before posting', 'Enterprise deals had too much drag'].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChange('whatWentWrong', chip)}
                    className="px-2.5 py-1 rounded-full text-xs border transition-colors hover:border-amber-400"
                    style={{ backgroundColor: B.accentBg, borderColor: B.border, color: B.textSecondary }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: One real number */}
            <div className="space-y-2 p-4 rounded-2xl" style={{ backgroundColor: B.card, border: `1px solid ${B.border}` }}>
              <label className="block text-sm font-semibold" style={{ color: B.text }}>
                One real number that proves it
              </label>
              <p className="text-xs" style={{ color: B.textMuted }}>Something you can point to that proves traction or change.</p>
              <Textarea
                value={formData.oneRealNumber || ''}
                onChange={e => handleChange('oneRealNumber', e.target.value)}
                rows={2}
                placeholder="+$47k MRR, -23% churn, 12→3 min onboarding..."
                className="resize-y rounded-xl text-sm placeholder:text-[#A69279]/60 placeholder:italic placeholder:font-normal"
                style={{ backgroundColor: B.card, borderColor: B.border, color: B.text }}
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-medium" style={{ color: B.textMuted }}>Suggestions:</span>
                {['+47 customers in 3 weeks', '-35% churn', 'Onboarding cut from 3 weeks to 3 minutes'].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChange('oneRealNumber', chip)}
                    className="px-2.5 py-1 rounded-full text-xs border transition-colors hover:border-amber-400"
                    style={{ backgroundColor: B.accentBg, borderColor: B.border, color: B.textSecondary }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveStep(0)}
                className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: B.border, color: B.textSecondary, backgroundColor: B.card, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
              >
                ← Back to story
              </button>
              <button
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ backgroundColor: B.accent, color: '#fff', boxShadow: `0 4px 16px ${B.accentGlow}`, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
              >
                Next: channels and cadence →
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Step 3: Channels & Cadence ─────────────────────────── */}
        {activeStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={MOTION.spring.standard}
            className="space-y-4"
          >
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl flex-wrap sm:flex-nowrap" style={{ backgroundColor: B.infoBg, border: `1px solid ${B.infoBorder}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: B.infoBorder }}>
                  <Globe className="w-5 h-5" style={{ color: B.info }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: B.text }}>Step 3 of 3: Choose Platforms</h3>
                  <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>
                    Select where this story goes live. {connectedPlatforms.length} connected, {allPlatforms.length} total available.
                  </p>
                </div>
              </div>
              <SectionInfoTooltip
                title="Channels & Cadence"
                subtitle="How Flight Plan coordinates your multi-platform schedule"
                bullets={[
                  { bold: 'Cascading Timing', text: 'Each post publishes at peak attention hours for each specific network.' },
                  { bold: 'Native Formatting', text: 'Carousels for Instagram, threads for X, long-form insights for LinkedIn, and clean snippets for Threads.' },
                  { bold: 'SignalDM Integration', text: 'Comments on scheduled Instagram/Facebook posts automatically trigger AI DM flows.' },
                ]}
              />
            </div>

            <div className="space-y-3">
              {connectedPlatforms.length === 0 && (
                <div
                  className="p-3 rounded-xl border text-xs flex items-center justify-between gap-3"
                  style={{ backgroundColor: B.accentBg, borderColor: B.accentBorder, color: B.textSecondary }}
                >
                  <span>
                    No social channels connected yet. Select any platforms below to preview your generated weekly plan, or connect accounts in Settings.
                  </span>
                  <a
                    href="/dashboard/settings"
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: B.card, borderColor: B.border, color: B.text }}
                  >
                    Settings →
                  </a>
                </div>
              )}

              {connectedPlatforms.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium" style={{ color: B.textMuted }}>Connected:</span>
                  {connectedPlatforms.map(p => {
                    const meta = PLATFORM_META[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors transition-transform border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                          formData.selectedPlatforms.includes(p)
                            ? "shadow-sm"
                            : "opacity-50 hover:opacity-75"
                        )}
                        style={{
                          backgroundColor: formData.selectedPlatforms.includes(p) ? meta.bg : B.bgElevated,
                          borderColor: formData.selectedPlatforms.includes(p) ? `${meta.color}40` : B.border,
                          color: formData.selectedPlatforms.includes(p) ? meta.color : B.textMuted,
                          focusRingColor: formData.selectedPlatforms.includes(p) ? meta.color : B.accent,
                          focusRingOffsetColor: B.card,
                        }}
                      >
                        <PlatformBrandLogo platform={p as SupportedPlatformType} size={14} />
                        <span className="hidden sm:inline">{meta.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium" style={{ color: B.textMuted }}>
                  {connectedPlatforms.length > 0 ? 'Available:' : 'Platforms to plan for:'}
                </span>
                {allPlatforms.filter(p => !connectedSet.has(p)).map(p => {
                  const meta = PLATFORM_META[p];
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors transition-transform border",
                        formData.selectedPlatforms.includes(p)
                          ? "shadow-sm"
                          : "opacity-50 hover:opacity-75 border-dashed"
                      )}
                      style={{
                        backgroundColor: formData.selectedPlatforms.includes(p) ? meta.bg : B.bgElevated,
                        borderColor: formData.selectedPlatforms.includes(p) ? `${meta.color}40` : B.border,
                        color: formData.selectedPlatforms.includes(p) ? meta.color : B.textMuted,
                      }}
                    >
                      <PlatformBrandLogo platform={p as SupportedPlatformType} size={14} />
                      <span className="hidden sm:inline">{meta.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.selectedPlatforms.length === 0 && (
              <p className="text-xs flex items-center gap-1" style={{ color: B.danger }}>
                <AlertCircle className="w-3 h-3" /> Select at least one platform
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: B.text }}>
                <input
                  type="checkbox"
                  checked={formData.selectedPlatforms.length === allPlatforms.length}
                  onChange={e => {
                    if (e.target.checked) {
                      handleChange('selectedPlatforms', allPlatforms);
                    } else {
                      handleChange('selectedPlatforms', []);
                    }
                  }}
                  className="w-4 h-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ borderColor: B.border, color: B.accent, accentColor: B.accent, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
                />
                Select all {allPlatforms.length} platforms
              </label>
            </div>

            {/* Schedule start date */}
            <div className="pt-4 border-t" style={{ borderColor: B.border }}>
              <label className="block text-sm font-medium mb-2" style={{ color: B.text }}>
                Start scheduling from
              </label>
              <input
                type="date"
                value={formData.weekStartDate}
                onChange={e => handleChange('weekStartDate', e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full max-w-xs px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: B.card, borderColor: B.border, color: B.text, colorScheme: 'light' }}
              />
              <p className="text-xs mt-1" style={{ color: B.textMuted }}>
                {format(scheduleStartDate, 'EEEE, MMM d')} – {format(scheduleEndDate, 'EEEE, MMM d, yyyy')}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: B.border, color: B.textSecondary, backgroundColor: B.card, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ backgroundColor: B.accent, color: '#fff', boxShadow: `0 4px 16px ${B.accentGlow}` }}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? 'Generating…' : 'Generate Flight Plan ✨'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}