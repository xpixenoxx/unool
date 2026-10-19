'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, ChevronRight, X, Loader2, Globe, Calendar, Target, TrendingUp, Lightbulb, Zap, AlertCircle, Info, Sparkles } from 'lucide-react';
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
  { id: 'whatChanged', question: 'What changed recently?', placeholder: 'New feature, milestone, pivot, hire, metric...', required: true },
  { id: 'whatWentWrong', question: 'What went wrong?', placeholder: 'Failed launch, churn spike, bug, competitor move...', required: false },
  { id: 'oneRealNumber', question: 'One real number that proves it', placeholder: '+$47k MRR, -23% churn, 12→3 min onboarding...', required: true },
];

const ARC_BEATS = ['Hook', 'Context', 'Challenge', 'Turning Point', 'Resolution', 'Proof', 'CTA'];

export function StoryIntake({ onGenerate, isGenerating, connectedPlatforms }: StoryIntakeProps) {
  const { draft, saveDraft, clearDraft, hasDraft } = useFlightPlanDraft();

  const [formData, setFormData] = useState<StoryIntakeData>({
    coreStory: '',
    whatChanged: '',
    whatWentWrong: '',
    oneRealNumber: '',
    weekStartDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    selectedPlatforms: connectedPlatforms.length > 0 ? connectedPlatforms : [],
    audienceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [activeFollowUp, setActiveFollowUp] = useState(0);
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [characterCounts, setCharacterCounts] = useState<Record<string, number>>({});

  // Initialize from draft
  useEffect(() => {
    if (draft && !formData.coreStory) {
      setFormData(prev => ({ ...prev, ...draft }));
      // Restore platform selection from draft or use connected
      if (draft.selectedPlatforms?.length) {
        setFormData(prev => ({ ...prev, selectedPlatforms: draft.selectedPlatforms }));
      }
    }
  }, [draft]);

  // Auto-save draft
  useEffect(() => {
    if (formData.coreStory || formData.whatChanged || formData.whatWentWrong || formData.oneRealNumber) {
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
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error on change
    if (validationErrors[field]) {
      setValidationErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  }, [validationErrors]);

  const togglePlatform = useCallback((platform: PlatformType) => {
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter(p => p !== platform)
        : [...prev.selectedPlatforms, platform],
    }));
  }, []);

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!formData.coreStory.trim()) errors.coreStory = 'Core story is required';
    if (!formData.whatChanged.trim()) errors.whatChanged = 'What changed is required';
    if (!formData.oneRealNumber.trim()) errors.oneRealNumber = 'A real number is required';
    if (formData.selectedPlatforms.length === 0) errors.selectedPlatforms = 'Select at least one platform';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      clearDraft();
      onGenerate(formData);
    }
  }, [validateForm, clearDraft, onGenerate, formData]);

  const allPlatforms = Object.keys(PLATFORM_META) as PlatformType[];
  const connectedSet = new Set(connectedPlatforms);

  const weekStart = startOfWeek(new Date(formData.weekStartDate), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {['Story', 'Follow-ups', 'Platforms', 'Schedule'].map((step, idx) => (
              <React.Fragment key={step}>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                  )}
                  style={{
                    backgroundColor: idx < 2 ? B.accentBg : B.cardBorder,
                    color: idx < 2 ? B.accentHover : B.textMuted,
                  }}
                >
                  {idx + 1}
                </div>
                {idx < 3 && (
                  <div
                    className="w-12 h-0.5 rounded"
                    style={{ backgroundColor: B.border }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Core Story */}
      <motion.div
        key="story"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={MOTION.spring.standard}
        className="space-y-4"
      >
        <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: B.accentBg, border: `1px solid ${B.accentBorder}` }}>
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

        <Textarea
          value={formData.coreStory}
          onChange={e => handleChange('coreStory', e.target.value)}
          rows={5}
          placeholder="We spent 18 months building for enterprise. Last month, we stripped it down to a $29/mo self-serve tool. 3 pilot customers became 47 in 3 weeks."
          className="resize-y rounded-xl text-sm"
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
        <div className="flex items-center justify-between text-xs" style={{ color: B.textMuted }}>
          <span>{characterCounts.coreStory || 0} characters</span>
          <span>Target: 200-500 chars</span>
        </div>
      </motion.div>

      {/* Step 2: Follow-up Questions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFollowUp}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={MOTION.spring.standard}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: B.successBg, border: `1px solid ${B.successBorder}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: B.successBorder }}>
              <Target className="w-5 h-5" style={{ color: B.success }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: B.text }}>Step 2 of 3: Follow-up Questions</h3>
              <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>
                Question {activeFollowUp + 1} of {FOLLOW_UP_QUESTIONS.length}
              </p>
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-2xl" style={{ backgroundColor: B.card, border: `1px solid ${B.border}` }}>
            <label className="block text-sm font-medium mb-2" style={{ color: B.text }}>
              {FOLLOW_UP_QUESTIONS[activeFollowUp].question}
            </label>
            <Textarea
              value={formData[FOLLOW_UP_QUESTIONS[activeFollowUp].id as keyof StoryIntakeData] as string}
              onChange={e => handleChange(FOLLOW_UP_QUESTIONS[activeFollowUp].id as keyof StoryIntakeData, e.target.value)}
              rows={4}
              placeholder={FOLLOW_UP_QUESTIONS[activeFollowUp].placeholder}
              className="resize-y rounded-xl text-sm"
              style={{
                backgroundColor: B.card,
                borderColor: validationErrors[FOLLOW_UP_QUESTIONS[activeFollowUp].id] ? B.danger : B.border,
                color: B.text,
              }}
              aria-invalid={!!validationErrors[FOLLOW_UP_QUESTIONS[activeFollowUp].id]}
            />
            {validationErrors[FOLLOW_UP_QUESTIONS[activeFollowUp].id] && (
              <p className="text-xs flex items-center gap-1" style={{ color: B.danger }}>
                <AlertCircle className="w-3 h-3" /> {validationErrors[FOLLOW_UP_QUESTIONS[activeFollowUp].id]}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveFollowUp(p => Math.max(0, p - 1))}
              disabled={activeFollowUp === 0}
              className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ borderColor: B.border, color: B.textSecondary, backgroundColor: B.card, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              {FOLLOW_UP_QUESTIONS.map((_, idx) => (
                <div
                  key={idx}
                  className={cn("w-2.5 h-2.5 rounded-full transition-colors")}
                  style={{ backgroundColor: idx === activeFollowUp ? B.accent : B.cardBorder }}
                />
              ))}
            </div>
            <button
              onClick={() => {
                if (activeFollowUp < FOLLOW_UP_QUESTIONS.length - 1) {
                  setActiveFollowUp(p => p + 1);
                } else {
                  setShowPlatformSelector(true);
                }
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ backgroundColor: B.accent, color: '#fff', boxShadow: `0 4px 16px ${B.accent}66`, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
            >
              {activeFollowUp < FOLLOW_UP_QUESTIONS.length - 1 ? 'Next →' : 'Choose Platforms →'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Step 3: Platform Selector */}
      <AnimatePresence>
        {showPlatformSelector && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={MOTION.spring.standard}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: B.infoBg, border: `1px solid ${B.infoBorder}` }}>
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

            <div className="space-y-3">
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

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium" style={{ color: B.textMuted }}>Available:</span>
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
              <label className="flex items-center gap-2 text-sm" style={{ color: B.text }}>
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

            {/* Week start date */}
            <div className="pt-4 border-t" style={{ borderColor: B.border }}>
              <label className="block text-sm font-medium mb-2" style={{ color: B.text }}>
                Week Starting (Monday)
              </label>
              <input
                type="date"
                value={formData.weekStartDate}
                onChange={e => handleChange('weekStartDate', e.target.value)}
                min={format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')}
                className="w-full max-w-xs px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: B.card, borderColor: B.border, color: B.text }}
              />
              <p className="text-xs mt-1" style={{ color: B.textMuted }}>
                {format(weekStart, 'EEEE, MMM d')} – {format(weekEnd, 'EEEE, MMM d, yyyy')}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={() => { setShowPlatformSelector(false); setActiveFollowUp(FOLLOW_UP_QUESTIONS.length - 1); }}
                className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: B.border, color: B.textSecondary, backgroundColor: B.card, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ backgroundColor: B.accent, color: '#fff', boxShadow: `0 4px 16px ${B.accent}66`, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? 'Generating…' : 'Generate Flight Plan'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}