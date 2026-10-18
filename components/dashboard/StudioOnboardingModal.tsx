'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Check,
  CheckCircle,
  Lightbulb,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  STUDIO_ONBOARDING_QUESTIONS,
  DOING_BY_ROLE,
  StudioProfile,
  getRoleConfig,
} from '@/lib/config/studioOnboarding';

export interface StudioOnboardingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onComplete?: (profile: StudioProfile) => void;
  onGenerateIdeas?: () => void;
  userId?: string;
  forceOpen?: boolean;
  isRetake?: boolean;
  initialAnswers?: any;
}

interface DraftAnswers {
  role: string;
  businessStage: string;
  businessDomain: string;
  workInterests: string;
  doing: string;
  audience: string;
  tone: string;
  style: string;
  interests: string[];
}

export function StudioOnboardingModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onComplete,
  onGenerateIdeas,
  userId,
  forceOpen = false,
  isRetake = false,
  initialAnswers,
}: StudioOnboardingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1); // 1 to 7: questions, 8: All Set
  const otherInputId = useId();

  // Answer state
  const [answers, setAnswers] = useState<DraftAnswers>({
    role: '',
    businessStage: '',
    businessDomain: '',
    workInterests: '',
    doing: '',
    audience: '',
    tone: '',
    style: '',
    interests: [],
  });

  // "Other" text state per question
  const [isOtherSelected, setIsOtherSelected] = useState<boolean>(false);
  const [otherText, setOtherText] = useState<string>('');
  const otherInputRef = useRef<HTMLInputElement>(null);

  // Status & error states
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedProfile, setSavedProfile] = useState<StudioProfile | null>(null);

  const draftKey = userId ? `studio_onboarding_draft_${userId}` : 'studio_onboarding_draft';
  const completedKey = userId ? `studio_onboarding_completed_${userId}` : 'studio_onboarding_completed';

  // Mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync controlledIsOpen
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  // Load profile / check if onboarding is needed
  useEffect(() => {
    if (controlledIsOpen !== undefined || forceOpen || isRetake) {
      if (controlledIsOpen !== undefined) {
        setIsOpen(controlledIsOpen);
      } else {
        setIsOpen(true);
      }
      return;
    }

    let isSubscribed = true;

    async function checkStudioProfileStatus() {
      try {
        const res = await fetch('/api/studio/profile', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          if (!isSubscribed) return;

          if (data.isCompleted && data.profile) {
            try {
              localStorage.setItem(completedKey, 'true');
            } catch {}
            setIsOpen(false);
            return;
          }

          // Not completed yet -> Show onboarding
          setIsOpen(true);
          return;
        }
      } catch (err) {
        console.warn('Could not query /api/studio/profile:', err);
      }

      // Fallback to localStorage check
      try {
        const isDone = localStorage.getItem(completedKey) === 'true';
        if (!isDone) {
          setIsOpen(true);
        }
      } catch {}
    }

    checkStudioProfileStatus();

    return () => {
      isSubscribed = false;
    };
  }, [controlledIsOpen, forceOpen, isRetake, completedKey]);

  // Pre-fill initial answers if passed (or restore draft if starting fresh)
  useEffect(() => {
    if (initialAnswers) {
      // Normalize from both new and legacy shapes
      const mappedRole = initialAnswers.role || initialAnswers.persona || '';
      const mappedStage = initialAnswers.businessStage || '';
      const mappedDomain = initialAnswers.businessDomain || initialAnswers.doing || initialAnswers.focus || '';
      const mappedWorkInterests = initialAnswers.workInterests || '';
      const mappedDoing = initialAnswers.doing || mappedDomain;
      const mappedAudience =
        typeof initialAnswers.audience === 'string'
          ? initialAnswers.audience
          : Array.isArray(initialAnswers.audience)
          ? initialAnswers.audience[0] || ''
          : '';
      const mappedTone =
        typeof initialAnswers.tone === 'string'
          ? initialAnswers.tone
          : Array.isArray(initialAnswers.tone)
          ? initialAnswers.tone[0] || ''
          : '';
      const mappedStyle = initialAnswers.style || '';
      const mappedInterests = Array.isArray(initialAnswers.interests)
        ? initialAnswers.interests
        : Array.isArray(initialAnswers.extras)
        ? initialAnswers.extras
        : [];

      setAnswers({
        role: mappedRole,
        businessStage: mappedStage,
        businessDomain: mappedDomain,
        workInterests: mappedWorkInterests,
        doing: mappedDoing,
        audience: mappedAudience,
        tone: mappedTone,
        style: mappedStyle,
        interests: mappedInterests,
      });
      return;
    }

    // Try restoring draft from localStorage if not retaking
    if (!isRetake) {
      try {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === 'object') {
            if (parsed.answers) {
              setAnswers(parsed.answers);
            }
            if (parsed.step && parsed.step >= 1 && parsed.step <= 7) {
              setCurrentStep(parsed.step);
            }
          }
        }
      } catch {}
    }
  }, [initialAnswers, isRetake, draftKey]);

  // Persist draft to local storage on changes
  useEffect(() => {
    if (currentStep <= 7 && !savedProfile) {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            step: currentStep,
            answers,
          })
        );
      } catch {}
    }
  }, [currentStep, answers, draftKey, savedProfile]);

  // Keyboard navigation: Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (isRetake || savedProfile)) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isRetake, savedProfile]);

  // Focus other input when "Other" is toggled
  useEffect(() => {
    if (isOtherSelected && otherInputRef.current) {
      otherInputRef.current.focus();
    }
  }, [isOtherSelected, currentStep]);

  // Synchronize "Other" input state when navigating steps
  useEffect(() => {
    if (currentStep > 7) return;
    const question = STUDIO_ONBOARDING_QUESTIONS[currentStep - 1];
    if (!question) return;

    if (question.key === 'interests' || question.key === 'businessDomain') {
      setIsOtherSelected(false);
      setOtherText('');
      return;
    }

    const currentVal = (answers as any)[question.key] || '';
    const predefined = typeof question.options === 'function' ? question.options(answers) : question.options;

    if (currentVal && !predefined.includes(currentVal)) {
      setIsOtherSelected(true);
      setOtherText(currentVal);
    } else {
      setIsOtherSelected(false);
      setOtherText('');
    }
  }, [currentStep]);

  const handleClose = () => {
    setIsOpen(false);
    controlledOnClose?.();
  };

  // Step questions config
  const currentQuestionConfig = currentStep <= 7 ? STUDIO_ONBOARDING_QUESTIONS[currentStep - 1] : null;
  const currentRoleConfig = getRoleConfig(answers.role);

  const currentTitle = currentQuestionConfig
    ? typeof currentQuestionConfig.title === 'function'
      ? currentQuestionConfig.title(answers)
      : currentQuestionConfig.title
    : '';

  const currentOptions: readonly string[] = currentQuestionConfig
    ? typeof currentQuestionConfig.options === 'function'
      ? currentQuestionConfig.options(answers)
      : currentQuestionConfig.options
    : [];

  // Handle single-select option pick
  const handleSelectOption = (option: string) => {
    if (!currentQuestionConfig) return;

    const key = currentQuestionConfig.key;
    setAnswers((prev) => ({
      ...prev,
      [key]: option,
    }));

    setIsOtherSelected(false);
    setOtherText('');

    // Advance immediately on click with smooth micro-delay
    setTimeout(() => {
      goToNextStep();
    }, 120);
  };

  // Handle "Other" selection for single-select
  const handleSelectOther = () => {
    setIsOtherSelected(true);
  };

  // Handle confirming "Other" value
  const handleConfirmOther = () => {
    if (!currentQuestionConfig) return;
    const trimmed = otherText.trim().slice(0, 80);
    if (!trimmed) return;

    const key = currentQuestionConfig.key;
    setAnswers((prev) => ({
      ...prev,
      [key]: trimmed,
    }));

    goToNextStep();
  };

  // Handle multi-select toggle (for interests)
  const handleToggleInterest = (interest: string) => {
    setAnswers((prev) => {
      const exists = prev.interests.includes(interest);
      const updated = exists ? prev.interests.filter((i) => i !== interest) : [...prev.interests, interest];
      return {
        ...prev,
        interests: updated,
      };
    });
  };

  // Handle adding custom interest via Other
  const handleAddCustomInterest = () => {
    const trimmed = otherText.trim().slice(0, 80);
    if (!trimmed) return;

    if (!answers.interests.includes(trimmed)) {
      setAnswers((prev) => ({
        ...prev,
        interests: [...prev.interests, trimmed],
      }));
    }
    setOtherText('');
  };

  // Step Navigation
  const goToNextStep = () => {
    setSaveError(null);
    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === 7) {
      // Complete & Save
      saveStudioProfile();
    }
  };

  const handleSkipStep = () => {
    setSaveError(null);
    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === 7) {
      saveStudioProfile();
    }
  };

  const goToPreviousStep = () => {
    setSaveError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Save profile to database
  const saveStudioProfile = async () => {
    setIsSaving(true);
    setSaveError(null);

    const domain = (answers.businessDomain.trim() || answers.doing.trim() || 'Software/AI').slice(0, 80);
    const payload: StudioProfile = {
      role: (answers.role.trim() || 'Creator').slice(0, 80),
      businessStage: (answers.businessStage.trim() || 'Growing').slice(0, 80),
      businessDomain: domain,
      workInterests: answers.workInterests.trim() ? answers.workInterests.trim().slice(0, 120) : undefined,
      doing: domain,
      audience: (answers.audience.trim() || 'Followers in my niche').slice(0, 80),
      tone: (answers.tone.trim() || 'Conversational & candid').slice(0, 80),
      style: (answers.style.trim() || 'Short punchy lines').slice(0, 80),
      interests:
        answers.interests.length > 0
          ? answers.interests.map((i) => i.trim().slice(0, 80)).filter(Boolean)
          : ['General topics'],
      completedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/studio/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save studio profile');
      }

      // Success
      setSavedProfile(payload);
      try {
        localStorage.removeItem(draftKey);
        localStorage.setItem(completedKey, 'true');
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('studio-profile-updated', { detail: payload }));
      }

      onComplete?.(payload);
      setCurrentStep(8); // Show "You're all set"
    } catch (err) {
      console.error('Failed to save studio profile:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Completion handler for final screen
  const handleDone = () => {
    if (savedProfile) {
      onComplete?.(savedProfile);
    }
    handleClose();
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={isRetake || savedProfile ? handleClose : undefined}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-[#FCFAF7] dark:bg-zinc-900 border border-[#E8E0D4] dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
      >
        {/* Top Header & Progress Bar */}
        <div className="px-6 pt-6 pb-4 border-b border-[#EFE9DF] dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C4A265]" />
              <span className="text-xs font-semibold tracking-wider uppercase text-[#8B7355] dark:text-zinc-400">
                {currentStep <= 7 ? `Question ${currentStep} of 7` : 'Profile Complete'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {currentStep <= 7 && (
                <button
                  type="button"
                  onClick={handleSkipStep}
                  disabled={isSaving}
                  className="text-xs font-semibold text-[#8B7355] dark:text-zinc-400 hover:text-[#3D2B1F] dark:hover:text-zinc-200 px-2.5 py-1 rounded-lg hover:bg-[#F3ECE0] dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Skip
                </button>
              )}

              {/* Close button if retaking or finished */}
              {(isRetake || savedProfile) && (
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close modal"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-[#F3ECE0] dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar Indicator */}
          <div className="w-full bg-[#ECE4D8] dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-[#C4A265] h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (currentStep / 7) * 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <AnimatePresence mode="wait">
            {currentStep <= 7 ? (
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col space-y-6"
              >
                {/* Question Title */}
                <div>
                  <h2
                    id="studio-onboarding-title"
                    className="text-xl sm:text-2xl font-bold tracking-tight text-[#3D2B1F] dark:text-zinc-100"
                  >
                    {currentTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8B7355] dark:text-zinc-400 mt-1">
                    {currentQuestionConfig?.key === 'interests'
                      ? 'Select all that apply. Choose at least one to continue.'
                      : currentQuestionConfig?.key === 'businessDomain'
                      ? 'Pick your domain or type your own, then add what you love talking about.'
                      : 'Select one option or type your own.'}
                  </p>
                </div>

                {/* Single Select Questions (role, businessStage, audience, tone, style) */}
                {!currentQuestionConfig?.multiSelect && !currentQuestionConfig?.isCustomStep && (
                  <div className="space-y-4">
                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentOptions.map((option) => {
                        const isSelected = (answers as any)[currentQuestionConfig!.key] === option && !isOtherSelected;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleSelectOption(option)}
                            className={`group relative text-left px-4 py-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[#F2EADB] dark:bg-zinc-800 border-[#C4A265] text-[#3D2B1F] dark:text-zinc-100 shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border-[#E8E0D4] dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-[#C4A265]/60 hover:bg-[#FAF6EE] dark:hover:bg-zinc-800/60'
                            }`}
                          >
                            <span className="text-sm font-medium pr-2">{option}</span>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-[#C4A265] border-[#C4A265] text-white'
                                  : 'border-[#DACFBF] dark:border-zinc-700 group-hover:border-[#C4A265]'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}

                      {/* "Other" Option Card */}
                      <button
                        type="button"
                        onClick={handleSelectOther}
                        className={`text-left px-4 py-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between cursor-pointer ${
                          isOtherSelected
                            ? 'bg-[#F2EADB] dark:bg-zinc-800 border-[#C4A265] text-[#3D2B1F] dark:text-zinc-100 shadow-xs'
                            : 'bg-white dark:bg-zinc-900 border-[#E8E0D4] dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-[#C4A265]/60 hover:bg-[#FAF6EE] dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        <span className="text-sm font-medium">Other</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isOtherSelected
                              ? 'bg-[#C4A265] border-[#C4A265] text-white'
                              : 'border-[#DACFBF] dark:border-zinc-700'
                          }`}
                        >
                          {isOtherSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    </div>

                    {/* Inline "Other" Free-Text Input */}
                    {isOtherSelected && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-[#C4A265] shadow-xs space-y-3"
                      >
                        <label
                          htmlFor={otherInputId}
                          className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] dark:text-zinc-400"
                        >
                          Custom Answer (max 80 characters)
                        </label>
                        <div className="flex gap-2">
                          <input
                            id={otherInputId}
                            ref={otherInputRef}
                            type="text"
                            maxLength={80}
                            value={otherText}
                            onChange={(e) => setOtherText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleConfirmOther();
                              }
                            }}
                            placeholder="Type your own answer..."
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#DACFBF] dark:border-zinc-700 bg-[#FCFAF7] dark:bg-zinc-950 text-sm text-[#3D2B1F] dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#C4A265]"
                          />
                          <button
                            type="button"
                            onClick={handleConfirmOther}
                            disabled={!otherText.trim()}
                            className="px-4 py-2.5 rounded-xl bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-[#2C1F16] dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Save</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Question 3: Dynamic Domain & Focus Step */}
                {currentQuestionConfig?.key === 'businessDomain' && (
                  <div className="space-y-5">
                    {/* Quick-pick chips */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7355] dark:text-zinc-400">
                        Quick-pick options
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {currentOptions.map((domain) => {
                          const isSelected = answers.businessDomain === domain;
                          return (
                            <button
                              key={domain}
                              type="button"
                              onClick={() => {
                                setAnswers((prev) => ({
                                  ...prev,
                                  businessDomain: domain,
                                  doing: domain,
                                }));
                              }}
                              className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border-[#3D2B1F] dark:border-zinc-100 shadow-xs'
                                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-[#E8E0D4] dark:border-zinc-800 hover:border-[#C4A265] hover:bg-[#FAF6EE] dark:hover:bg-zinc-800'
                              }`}
                            >
                              <span>{domain}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            </button>
                          );
                        })}
                        {/* 'Other' chip */}
                        {(() => {
                          const isOther =
                            Boolean(answers.businessDomain) &&
                            !currentOptions.includes(answers.businessDomain);
                          return (
                            <button
                              key="Other-chip"
                              type="button"
                              onClick={() => {
                                const domainInput = document.getElementById('studio-domain-input');
                                domainInput?.focus();
                              }}
                              className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isOther
                                  ? 'bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border-[#3D2B1F] dark:border-zinc-100 shadow-xs'
                                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-[#E8E0D4] dark:border-zinc-800 hover:border-[#C4A265] hover:bg-[#FAF6EE] dark:hover:bg-zinc-800'
                              }`}
                            >
                              <span>Other</span>
                              {isOther && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Primary Free-Text Input */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="studio-domain-input"
                          className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] dark:text-zinc-400"
                        >
                          {currentRoleConfig.domainLabel}
                        </label>
                        <span className="text-[11px] text-[#8B7355]/80 dark:text-zinc-500">
                          {answers.businessDomain.length}/80
                        </span>
                      </div>
                      <input
                        id="studio-domain-input"
                        type="text"
                        maxLength={80}
                        value={answers.businessDomain}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnswers((prev) => ({
                            ...prev,
                            businessDomain: val,
                            doing: val,
                          }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && answers.businessDomain.trim()) {
                            e.preventDefault();
                            goToNextStep();
                          }
                        }}
                        placeholder={currentRoleConfig.domainPlaceholder}
                        className="w-full px-4 py-3 rounded-2xl border border-[#DACFBF] dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-[#3D2B1F] dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#C4A265]"
                      />
                    </div>

                    {/* Optional Second Field */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="studio-work-interests-input"
                          className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] dark:text-zinc-400"
                        >
                          {currentRoleConfig.workInterestsLabel} (optional)
                        </label>
                        <span className="text-[11px] text-[#8B7355]/80 dark:text-zinc-500">
                          {answers.workInterests.length}/120
                        </span>
                      </div>
                      <input
                        id="studio-work-interests-input"
                        type="text"
                        maxLength={120}
                        value={answers.workInterests}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnswers((prev) => ({
                            ...prev,
                            workInterests: val,
                          }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && answers.businessDomain.trim()) {
                            e.preventDefault();
                            goToNextStep();
                          }
                        }}
                        placeholder={currentRoleConfig.workInterestsPlaceholder}
                        className="w-full px-4 py-3 rounded-2xl border border-[#DACFBF] dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-[#3D2B1F] dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#C4A265]"
                      />
                      <p className="text-[11px] text-[#8B7355] dark:text-zinc-400">
                        Optional themes and topics the AI composer and idea generator will draw from.
                      </p>
                    </div>
                  </div>
                )}

                {/* Question 7 (Interests - Multi-Select) */}
                {currentQuestionConfig?.key === 'interests' && (
                  <div className="space-y-6">
                    {/* Chips Cloud */}
                    <div className="flex flex-wrap gap-2">
                      {currentOptions.map((interest) => {
                        const isSelected = answers.interests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => handleToggleInterest(interest)}
                            className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border-[#3D2B1F] dark:border-zinc-100 shadow-xs'
                                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-[#E8E0D4] dark:border-zinc-800 hover:border-[#C4A265] hover:bg-[#FAF6EE] dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span>{interest}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </button>
                        );
                      })}

                      {/* Render any custom added interests */}
                      {answers.interests
                        .filter((i) => !currentOptions.includes(i))
                        .map((customInterest) => (
                          <span
                            key={customInterest}
                            className="px-3.5 py-2 rounded-xl text-sm font-medium bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border border-[#3D2B1F] dark:border-zinc-100 shadow-xs flex items-center gap-1.5"
                          >
                            <span>{customInterest}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleInterest(customInterest)}
                              className="hover:opacity-75 cursor-pointer ml-1"
                              aria-label={`Remove ${customInterest}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                    </div>

                    {/* Add Custom Interest Input */}
                    <div className="pt-2">
                      <label
                        htmlFor={otherInputId}
                        className="block text-xs font-semibold uppercase tracking-wider text-[#8B7355] dark:text-zinc-400 mb-2"
                      >
                        Add other interest
                      </label>
                      <div className="flex gap-2">
                        <input
                          id={otherInputId}
                          type="text"
                          maxLength={80}
                          value={otherText}
                          onChange={(e) => setOtherText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomInterest();
                            }
                          }}
                          placeholder="Type an interest and press Add..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#DACFBF] dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-[#3D2B1F] dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#C4A265]"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomInterest}
                          disabled={!otherText.trim()}
                          className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-[#DACFBF] dark:border-zinc-700 text-[#3D2B1F] dark:text-zinc-100 text-sm font-semibold hover:bg-[#F5EFE2] dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save error display with retry */}
                {saveError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                      <span>{saveError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={saveStudioProfile}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Step 8: "You're all set" Final Screen */
              <motion.div
                key="step-complete"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col space-y-6 py-2"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#4A8C5C]/15 text-[#4A8C5C] border border-[#4A8C5C]/30 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#3D2B1F] dark:text-zinc-100">
                    You&apos;re all set
                  </h2>
                  <p className="text-sm text-[#8B7355] dark:text-zinc-400 max-w-md mx-auto">
                    Your Studio profile has been saved. We will use these calibrations to craft posts and ideas that
                    sound authentically like you.
                  </p>
                </div>

                {/* Summary Chips Grid */}
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-[#E8E0D4] dark:border-zinc-800 space-y-3.5 shadow-2xs">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] dark:text-zinc-400">
                    Your Studio Profile
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#FAF6EE] dark:bg-zinc-800/60 border border-[#EDE4D5] dark:border-zinc-800">
                      <span className="text-[#8B7355] dark:text-zinc-400 block mb-0.5 font-medium">Role</span>
                      <span className="font-semibold text-[#3D2B1F] dark:text-zinc-100">{savedProfile?.role || answers.role || '—'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF6EE] dark:bg-zinc-800/60 border border-[#EDE4D5] dark:border-zinc-800">
                      <span className="text-[#8B7355] dark:text-zinc-400 block mb-0.5 font-medium">{currentRoleConfig.stageTitle.replace(/\?$/, '')}</span>
                      <span className="font-semibold text-[#3D2B1F] dark:text-zinc-100">{savedProfile?.businessStage || answers.businessStage || 'Growing'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF6EE] dark:bg-zinc-800/60 border border-[#EDE4D5] dark:border-zinc-800">
                      <span className="text-[#8B7355] dark:text-zinc-400 block mb-0.5 font-medium">{currentRoleConfig.domainLabel}</span>
                      <span className="font-semibold text-[#3D2B1F] dark:text-zinc-100">{savedProfile?.businessDomain || savedProfile?.doing || answers.businessDomain || answers.doing || '—'}</span>
                    </div>

                    {Boolean(savedProfile?.workInterests || answers.workInterests) && (
                      <div className="p-2.5 rounded-xl bg-[#FAF6EE] dark:bg-zinc-800/60 border border-[#EDE4D5] dark:border-zinc-800">
                        <span className="text-[#8B7355] dark:text-zinc-400 block mb-0.5 font-medium">{currentRoleConfig.workInterestsLabel.replace(/\?$/, '')}</span>
                        <span className="font-semibold text-[#3D2B1F] dark:text-zinc-100">{savedProfile?.workInterests || answers.workInterests}</span>
                      </div>
                    )}

                    <div className="p-2.5 rounded-xl bg-[#FAF6EE] dark:bg-zinc-800/60 border border-[#EDE4D5] dark:border-zinc-800">
                      <span className="text-[#8B7355] dark:text-zinc-400 block mb-0.5 font-medium">{currentRoleConfig.audienceTitle.replace(/\?$/, '')}</span>
                      <span className="font-semibold text-[#3D2B1F] dark:text-zinc-100">{savedProfile?.audience || answers.audience || '—'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF6EE] dark:bg-zinc-800/60 border border-[#EDE4D5] dark:border-zinc-800">
                      <span className="text-[#8B7355] dark:text-zinc-400 block mb-0.5 font-medium">Voice Tone</span>
                      <span className="font-semibold text-[#3D2B1F] dark:text-zinc-100">{savedProfile?.tone || answers.tone || '—'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF6EE] dark:bg-zinc-800/60 border border-[#EDE4D5] dark:border-zinc-800">
                      <span className="text-[#8B7355] dark:text-zinc-400 block mb-0.5 font-medium">Reading Style</span>
                      <span className="font-semibold text-[#3D2B1F] dark:text-zinc-100">{savedProfile?.style || answers.style || '—'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF6EE] dark:bg-zinc-800/60 border border-[#EDE4D5] dark:border-zinc-800">
                      <span className="text-[#8B7355] dark:text-zinc-400 block mb-1 font-medium">Interests Outside Work</span>
                      <div className="flex flex-wrap gap-1">
                        {((savedProfile?.interests && savedProfile.interests.length > 0)
                          ? savedProfile.interests
                          : answers.interests
                        ).map((interest) => (
                          <span
                            key={interest}
                            className="px-2 py-0.5 rounded-md bg-[#3D2B1F]/10 dark:bg-zinc-700 text-[#3D2B1F] dark:text-zinc-200 text-[11px] font-medium"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Completion Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleDone();
                      onGenerateIdeas?.();
                    }}
                    className="flex-1 px-5 py-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-[#DACFBF] dark:border-zinc-700 text-[#3D2B1F] dark:text-zinc-100 hover:bg-[#FAF6EE] dark:hover:bg-zinc-700 font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lightbulb className="w-4 h-4 text-[#C4A265]" />
                    <span>Generate ideas</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDone}
                    className="flex-1 px-5 py-3.5 rounded-2xl bg-[#3D2B1F] hover:bg-[#2A1D15] dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Toolbar (Only for Questions 1 to 7) */}
        {currentStep <= 7 && (
          <div className="px-6 py-4 border-t border-[#EFE9DF] dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md flex items-center justify-between gap-3">
            {/* Back Button */}
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-[#DACFBF] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm font-semibold text-[#3D2B1F] dark:text-zinc-200 hover:bg-[#FAF6EE] dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkipStep}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#8B7355] dark:text-zinc-400 hover:text-[#3D2B1F] dark:hover:text-zinc-200 hover:bg-[#F3ECE0]/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40"
              >
                Skip
              </button>

              {/* Next / Continue Button */}
              {currentQuestionConfig?.key === 'interests' ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={answers.interests.length === 0 || isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs sm:text-sm font-semibold hover:bg-[#2C1F16] dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Save and finish</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : currentQuestionConfig?.key === 'businessDomain' ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!answers.businessDomain.trim() || isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs sm:text-sm font-semibold hover:bg-[#2C1F16] dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (answers as any)[currentQuestionConfig?.key || ''] ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-[#DACFBF] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm font-semibold text-[#3D2B1F] dark:text-zinc-200 hover:bg-[#FAF6EE] dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
export default StudioOnboardingModal;
