'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   STUDIO ONBOARDING CONFIGURATION
   All questions, options, copy, and icons in one single config.
   ───────────────────────────────────────────────────────────── */
export interface OnboardingConfig {
  q1: {
    title: string;
    subtitle: string;
    options: Array<{
      id: string;
      label: string;
      hint: string;
    }>;
  };
  q2: {
    byPersona: Record<
      string,
      {
        title: string;
        subtitle: string;
        options: string[];
        otherPlaceholder: string;
      }
    >;
  };
  q3: {
    title: string;
    subtitle: string;
    maxSelections: number;
    byPersona: Record<string, string[]>;
    defaultOptions: string[];
    otherPlaceholder: string;
  };
  q4: {
    title: string;
    subtitle: string;
    maxSelections: number;
    options: Array<{
      label: string;
      hint?: string;
    }>;
    otherPlaceholder: string;
  };
}

export const STUDIO_ONBOARDING_CONFIG: OnboardingConfig = {
  q1: {
    title: "Who's walking into the Studio?",
    subtitle: 'Pick the hat you wear most often so Studio knows how to assist you.',
    options: [
      { id: 'Founder', label: 'Founder', hint: 'Building a product or company' },
      { id: 'Business Owner', label: 'Business Owner', hint: 'Running commerce, store or services' },
      { id: 'Creator', label: 'Creator', hint: 'Crafting content, media or stories' },
      { id: 'Student', label: 'Student', hint: 'Learning, preparing & networking' },
      { id: 'Individual', label: 'Individual', hint: 'Sharing thoughts & personal journey' },
      { id: 'Other', label: 'Other', hint: 'Something uniquely yours' },
    ],
  },
  q2: {
    byPersona: {
      Founder: {
        title: 'What are you building?',
        subtitle: 'Select what best matches your startup or project.',
        options: [
          'Software or AI product',
          'Consumer brand',
          'Fintech/edtech/healthtech',
          'Agency or services',
          'App or marketplace',
          'Deep tech or hardware',
        ],
        otherPlaceholder: 'e.g. Climate tech, Web3, Biotech...',
      },
      'Business Owner': {
        title: 'What does your business sell?',
        subtitle: 'Select what best captures your products or services.',
        options: [
          'Food or cafe',
          'Fashion or beauty',
          'Local services',
          'Retail or online store',
          'Real estate or construction',
          'Coaching or education',
        ],
        otherPlaceholder: 'e.g. Fitness center, Law firm, Handcrafted gifts...',
      },
      Creator: {
        title: 'What do you make?',
        subtitle: 'Pick the space where you share your best work.',
        options: [
          'Tech and coding',
          'Lifestyle and vlogs',
          'Beauty and fashion',
          'Fitness and wellness',
          'Comedy and entertainment',
          'Explainers and education',
          'Gaming',
        ],
        otherPlaceholder: 'e.g. Music production, Animation, Photography...',
      },
      Student: {
        title: 'What are you studying?',
        subtitle: 'Select your field of focus or career ambition.',
        options: [
          'Engineering or tech',
          'Medical or sciences',
          'Commerce or business',
          'Design or arts',
          'Humanities',
          'Competitive exams',
        ],
        otherPlaceholder: 'e.g. Law, Architecture, Aviation...',
      },
      Individual: {
        title: "What's your day-to-day?",
        subtitle: 'What keeps you busy during the week?',
        options: [
          'Working professional',
          'Freelancer',
          'Job hunting',
          'Side hustler',
          'Personal brand',
          'Sharing life and hobbies',
        ],
        otherPlaceholder: 'e.g. Consultant, Remote worker, Researcher...',
      },
      Other: {
        title: "What's your primary focus?",
        subtitle: 'Tell us a bit about what you do or want to publish about.',
        options: [],
        otherPlaceholder: 'e.g. Community organizer, Independent writer...',
      },
    },
  },
  q3: {
    title: 'Who should stop scrolling for you?',
    subtitle: 'Pick up to 2 audiences who should see your posts first.',
    maxSelections: 2,
    byPersona: {
      Founder: [
        'Investors',
        'First customers',
        'Future teammates',
        'Fellow founders',
        'Industry leaders',
      ],
      'Business Owner': [
        'People in my city',
        'Online shoppers',
        'Other businesses',
        'Loyal regulars',
      ],
      Creator: [
        'Fellow creators',
        'Gen Z scrollers',
        'Brands who might collab',
        'Niche superfans',
        'Everyone',
      ],
      Student: [
        'Recruiters',
        'Classmates',
        'Mentors and professors',
        'Juniors',
        'The internet at large',
      ],
      Individual: [
        'Recruiters',
        'Clients',
        'Friends and followers',
        'Industry peers',
      ],
      Other: [
        'Recruiters',
        'Clients',
        'Friends and followers',
        'Industry peers',
      ],
    },
    defaultOptions: [
      'Recruiters',
      'Clients',
      'Friends and followers',
      'Industry peers',
    ],
    otherPlaceholder: 'e.g. Angel investors, Local founders, Design directors...',
  },
  q4: {
    title: "If your posts had a personality, they'd be...",
    subtitle: 'Pick up to 2 tones that reflect your authentic voice.',
    maxSelections: 2,
    options: [
      { label: 'Smooth', hint: 'Polished & effortless' },
      { label: 'Soft', hint: 'Warm, calm & human' },
      { label: 'Rebel', hint: 'Bold, provocative & unconventional' },
      { label: 'Witty', hint: 'Playful, sharp & quick-humored' },
      { label: 'Nerdy', hint: 'Deep-dive, data-rich & curious' },
      { label: 'Straight shooter', hint: 'Direct, clear & no fluff' },
      { label: 'Storyteller', hint: 'Narrative, emotive & immersive' },
    ],
    otherPlaceholder: 'e.g. Poetic, Motivational, Sarcastic...',
  },
};

/* ─────────────────────────────────────────────────────────────
   COMPONENT INTERFACE
   ───────────────────────────────────────────────────────────── */
export interface StudioOnboardingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onComplete?: (answers: any) => void;
  userId?: string;
  forceOpen?: boolean;
  isRetake?: boolean;
  initialAnswers?: any;
}

export function StudioOnboardingModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onComplete,
  userId,
  forceOpen = false,
  isRetake = false,
  initialAnswers,
}: StudioOnboardingModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Stored answers
  const [persona, setPersona] = useState<string>('');
  const [focus, setFocus] = useState<string>('');
  const [audience, setAudience] = useState<string[]>([]);
  const [tone, setTone] = useState<string[]>([]);

  // "Other" text inputs
  const [q1OtherText, setQ1OtherText] = useState('');
  const [q1ShowOtherInput, setQ1ShowOtherInput] = useState(false);

  const [q2OtherText, setQ2OtherText] = useState('');
  const [q2ShowOtherInput, setQ2ShowOtherInput] = useState(false);

  const [q3OtherText, setQ3OtherText] = useState('');
  const [q3ShowOtherInput, setQ3ShowOtherInput] = useState(false);

  const [q4OtherText, setQ4OtherText] = useState('');
  const [q4ShowOtherInput, setQ4ShowOtherInput] = useState(false);

  // Feedback states
  const [isFinishing, setIsFinishing] = useState(false);

  // Sync controlledIsOpen
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  // Click outside and escape key handling
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        controlledOnClose?.();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        controlledOnClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, controlledOnClose]);

  // Preload initialAnswers if provided
  useEffect(() => {
    if (initialAnswers) {
      if (initialAnswers.persona) setPersona(initialAnswers.persona);
      if (initialAnswers.focus) setFocus(initialAnswers.focus);
      if (Array.isArray(initialAnswers.audience)) setAudience(initialAnswers.audience);
      if (Array.isArray(initialAnswers.tone)) setTone(initialAnswers.tone);
      if (initialAnswers.custom) {
        if (initialAnswers.custom.persona) {
          setQ1OtherText(initialAnswers.custom.persona);
          setQ1ShowOtherInput(true);
        }
        if (initialAnswers.custom.focus) {
          setQ2OtherText(initialAnswers.custom.focus);
          setQ2ShowOtherInput(true);
        }
        if (initialAnswers.custom.audience) {
          setQ3OtherText(initialAnswers.custom.audience);
          setQ3ShowOtherInput(true);
        }
        if (initialAnswers.custom.tone) {
          setQ4OtherText(initialAnswers.custom.tone);
          setQ4ShowOtherInput(true);
        }
      }
    }
  }, [initialAnswers]);

  // Initialize and check database onboarding status
  useEffect(() => {
    setMounted(true);

    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
      if (!isRetake) return;
    }

    if (forceOpen && !isRetake) {
      setIsOpen(true);
      return;
    }

    let isSubscribed = true;

    async function checkDatabaseOnboarding() {
      try {
        const res = await fetch('/api/profile/onboarding', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          if (!isSubscribed) return;

          if (data.onboarding_completed || data.onboardingCompleted) {
            markCompleted();
            setIsOpen(false);
          } else {
            // Not completed in database: show onboarding
            setIsOpen(true);
          }

          // Preload previous answers if available (for editing later in settings)
          if (data.answers || data.onboarding_answers) {
            const a = data.answers || data.onboarding_answers;
            if (a.persona) setPersona(a.persona);
            if (a.focus) setFocus(a.focus);
            if (Array.isArray(a.audience)) setAudience(a.audience);
            if (Array.isArray(a.tone)) setTone(a.tone);
            if (a.custom) {
              if (a.custom.persona) {
                setQ1OtherText(a.custom.persona);
                setQ1ShowOtherInput(true);
              }
              if (a.custom.focus) {
                setQ2OtherText(a.custom.focus);
                setQ2ShowOtherInput(true);
              }
              if (a.custom.audience) {
                setQ3OtherText(a.custom.audience);
                setQ3ShowOtherInput(true);
              }
              if (a.custom.tone) {
                setQ4OtherText(a.custom.tone);
                setQ4ShowOtherInput(true);
              }
            }
          }
          return;
        }
      } catch (err) {
        console.warn('Could not query /api/profile/onboarding, falling back to local state:', err);
      }

      // LocalStorage fallback if network / fetch fails
      try {
        const storageKey = userId
          ? `studio_onboarding_completed_${userId}`
          : 'studio_onboarding_completed';
        const hasCompleted = localStorage.getItem(storageKey);
        if (!hasCompleted && isSubscribed) {
          setIsOpen(true);
        }
      } catch {
        if (isSubscribed) setIsOpen(true);
      }
    }

    checkDatabaseOnboarding();

    // Allow re-opening for QA / settings editing via custom event
    const handleReopen = () => {
      setStep(1);
      setIsOpen(true);
    };
    window.addEventListener('open-studio-onboarding', handleReopen);
    return () => {
      isSubscribed = false;
      window.removeEventListener('open-studio-onboarding', handleReopen);
    };
  }, [controlledIsOpen, forceOpen, userId]);

  const markCompleted = () => {
    try {
      const storageKey = userId
        ? `studio_onboarding_completed_${userId}`
        : 'studio_onboarding_completed';
      localStorage.setItem(storageKey, 'true');
      localStorage.setItem('studio_onboarding_completed', 'true');
    } catch {
      // Ignore storage errors
    }
  };

  const handleSkip = async () => {
    markCompleted();
    setIsOpen(false);
    controlledOnClose?.();

    // Persist skipped status to database
    try {
      await fetch('/api/profile/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          onboarding_completed: true,
          skipped: true,
        }),
      });
    } catch (err) {
      console.warn('Failed to save skipped onboarding status to profile:', err);
    }
  };

  const handleFinish = async () => {
    setIsFinishing(true);

    const customObj: Record<string, string> = {};
    if (persona === 'Other' && q1OtherText.trim()) {
      customObj.persona = q1OtherText.trim();
    }
    if ((focus === 'Other' || persona === 'Other') && q2OtherText.trim()) {
      customObj.focus = q2OtherText.trim();
    }
    if (q3ShowOtherInput && q3OtherText.trim()) {
      customObj.audience = q3OtherText.trim();
    }
    if (q4ShowOtherInput && q4OtherText.trim()) {
      customObj.tone = q4OtherText.trim();
    }

    // Determine final values
    const finalPersona =
      persona === 'Other' && q1OtherText.trim() ? q1OtherText.trim() : persona;
    const finalFocus =
      (focus === 'Other' || persona === 'Other') && q2OtherText.trim()
        ? q2OtherText.trim()
        : focus;

    const finalAudience = [...audience];
    if (q3ShowOtherInput && q3OtherText.trim() && !finalAudience.includes(q3OtherText.trim())) {
      finalAudience.push(q3OtherText.trim());
    }

    const finalTone = [...tone];
    if (q4ShowOtherInput && q4OtherText.trim() && !finalTone.includes(q4OtherText.trim())) {
      finalTone.push(q4OtherText.trim());
    }

    const finalPayload = {
      persona: finalPersona,
      focus: finalFocus,
      audience: finalAudience,
      tone: finalTone,
      custom: customObj,
    };

    // Log the answers exactly as specified
    console.log(finalPayload);

    markCompleted();

    // Persist answers and completed flag to user profile in database
    try {
      await fetch('/api/profile/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          onboarding_completed: true,
          answers: finalPayload,
        }),
      });
    } catch (err) {
      console.error('Failed to save onboarding answers to database:', err);
    }

    setTimeout(() => {
      setIsFinishing(false);
      setIsOpen(false);
      controlledOnClose?.();
      onComplete?.(finalPayload);
    }, 400);
  };

  // Back button handler
  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  // Skip step handler for retake flow
  const handleSkipStep = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    } else {
      handleFinish();
    }
  };

  /* ─────────────────────────────────────────────────────────────
     Q1 Handlers (Single-Select: auto-advance)
     ───────────────────────────────────────────────────────────── */
  const handleSelectQ1 = (id: string) => {
    if (id === 'Other') {
      setPersona('Other');
      setQ1ShowOtherInput(true);
      return;
    }

    setPersona(id);
    setQ1ShowOtherInput(false);
    // Auto-advance after brief visual feedback
    setTimeout(() => {
      setStep(2);
    }, 220);
  };

  const handleContinueQ1Other = () => {
    if (!q1OtherText.trim()) return;
    setPersona('Other');
    setStep(2);
  };

  /* ─────────────────────────────────────────────────────────────
     Q2 Handlers (Single-Select: auto-advance)
     ───────────────────────────────────────────────────────────── */
  const currentQ2Config =
    STUDIO_ONBOARDING_CONFIG.q2.byPersona[persona] ||
    STUDIO_ONBOARDING_CONFIG.q2.byPersona['Other'];

  const handleSelectQ2 = (option: string) => {
    if (option === 'Other') {
      setFocus('Other');
      setQ2ShowOtherInput(true);
      return;
    }

    setFocus(option);
    setQ2ShowOtherInput(false);
    // Auto-advance after brief visual feedback
    setTimeout(() => {
      setStep(3);
    }, 220);
  };

  const handleContinueQ2Other = () => {
    if (!q2OtherText.trim()) return;
    setFocus(q2OtherText.trim());
    setStep(3);
  };

  /* ─────────────────────────────────────────────────────────────
     Q3 Handlers (Multi-Select: max 2, Continue button)
     ───────────────────────────────────────────────────────────── */
  const currentQ3Options =
    STUDIO_ONBOARDING_CONFIG.q3.byPersona[persona] ||
    STUDIO_ONBOARDING_CONFIG.q3.defaultOptions;

  const toggleQ3Option = (opt: string) => {
    setAudience((prev) => {
      if (prev.includes(opt)) {
        return prev.filter((item) => item !== opt);
      }
      if (prev.length >= STUDIO_ONBOARDING_CONFIG.q3.maxSelections) {
        // Replace oldest or cap at max
        return [prev[1], opt];
      }
      return [...prev, opt];
    });
  };

  const toggleQ3Other = () => {
    setQ3ShowOtherInput((prev) => !prev);
  };

  const canContinueQ3 = audience.length > 0 || (q3ShowOtherInput && q3OtherText.trim().length > 0);

  /* ─────────────────────────────────────────────────────────────
     Q4 Handlers (Multi-Select: max 2, Continue button)
     ───────────────────────────────────────────────────────────── */
  const toggleQ4Option = (label: string) => {
    setTone((prev) => {
      if (prev.includes(label)) {
        return prev.filter((item) => item !== label);
      }
      if (prev.length >= STUDIO_ONBOARDING_CONFIG.q4.maxSelections) {
        // Replace oldest or cap at max
        return [prev[1], label];
      }
      return [...prev, label];
    });
  };

  const toggleQ4Other = () => {
    setQ4ShowOtherInput((prev) => !prev);
  };

  const canContinueQ4 = tone.length > 0 || (q4ShowOtherInput && q4OtherText.trim().length > 0);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsOpen(false);
            controlledOnClose?.();
          }
        }}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-white dark:bg-[#18181b] text-gray-900 dark:text-zinc-100 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden"
          style={{
            boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Header Bar */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1.5 -ml-1 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Previous question"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase text-[#C4A265]">
                  <span>Studio Welcome</span>
                </div>
              )}
            </div>

            {/* Step & Skip link */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500">
                Step {step} of 4
              </span>
              {isRetake ? (
                <button
                  type="button"
                  onClick={handleSkipStep}
                  className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer underline decoration-gray-300 dark:decoration-zinc-700 underline-offset-4"
                >
                  Skip this step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer underline decoration-gray-300 dark:decoration-zinc-700 underline-offset-4"
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 dark:bg-zinc-800/80 h-1">
            <motion.div
              className="h-1 bg-[#C4A265]"
              initial={{ width: `${((step - 1) / 4) * 100}%` }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Body Content Area */}
          <div className="px-6 py-6 sm:px-8 overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              {/* ── QUESTION 1 ─────────────────────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                      {STUDIO_ONBOARDING_CONFIG.q1.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
                      {STUDIO_ONBOARDING_CONFIG.q1.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STUDIO_ONBOARDING_CONFIG.q1.options.map((opt) => {
                      const isSelected = persona === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectQ1(opt.id)}
                          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                            isSelected
                              ? 'bg-[#C4A265]/10 border-[#C4A265] text-gray-900 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                              : 'bg-gray-50/70 hover:bg-gray-100/90 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 border-gray-200/70 dark:border-zinc-800 text-gray-800 dark:text-zinc-200'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-tight">{opt.label}</p>
                            <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
                              {opt.hint}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* "Other" Text input for Q1 */}
                  {q1ShowOtherInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2 flex flex-col sm:flex-row gap-2"
                    >
                      <input
                        type="text"
                        value={q1OtherText}
                        onChange={(e) => setQ1OtherText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleContinueQ1Other();
                        }}
                        autoFocus
                        placeholder="Tell us who you are (e.g. Researcher, Filmmaker)..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C4A265]"
                      />
                      <button
                        type="button"
                        onClick={handleContinueQ1Other}
                        disabled={!q1OtherText.trim()}
                        className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-[#C4A265] dark:hover:bg-[#b39255] text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}

                  {isRetake && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSkipStep}
                        className="text-xs font-semibold text-[#C4A265] hover:underline cursor-pointer"
                      >
                        Skip this step &rarr;
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── QUESTION 2 ─────────────────────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                      {currentQ2Config.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
                      {currentQ2Config.subtitle}
                    </p>
                  </div>

                  {/* If Q1 was "Other", show direct text input for Q2 */}
                  {persona === 'Other' || currentQ2Config.options.length === 0 ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400">
                        Describe what you build, sell or share:
                      </label>
                      <input
                        type="text"
                        value={q2OtherText}
                        onChange={(e) => setQ2OtherText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleContinueQ2Other();
                        }}
                        autoFocus
                        placeholder={currentQ2Config.otherPlaceholder}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C4A265]"
                      />
                      <button
                        type="button"
                        onClick={handleContinueQ2Other}
                        disabled={!q2OtherText.trim()}
                        className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black dark:bg-[#C4A265] dark:hover:bg-[#b39255] text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentQ2Config.options.map((opt) => {
                          const isSelected = focus === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectQ2(opt)}
                              className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-[#C4A265]/10 border-[#C4A265] text-gray-900 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                                  : 'bg-gray-50/70 hover:bg-gray-100/90 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 border-gray-200/70 dark:border-zinc-800 text-gray-800 dark:text-zinc-200'
                              }`}
                            >
                              <span className="font-semibold text-xs sm:text-sm">{opt}</span>
                            </button>
                          );
                        })}

                        {/* "Other" option button */}
                        <button
                          type="button"
                          onClick={() => handleSelectQ2('Other')}
                          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            focus === 'Other'
                              ? 'bg-[#C4A265]/10 border-[#C4A265] text-gray-900 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                              : 'bg-gray-50/70 hover:bg-gray-100/90 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 border-gray-200/70 dark:border-zinc-800 text-gray-800 dark:text-zinc-200'
                          }`}
                        >
                          <span className="font-semibold text-xs sm:text-sm">Other</span>
                          <span className="text-xs text-gray-400">custom</span>
                        </button>
                      </div>

                      {/* "Other" Text input */}
                      {q2ShowOtherInput && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="pt-2 flex flex-col sm:flex-row gap-2"
                        >
                          <input
                            type="text"
                            value={q2OtherText}
                            onChange={(e) => setQ2OtherText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleContinueQ2Other();
                            }}
                            autoFocus
                            placeholder={currentQ2Config.otherPlaceholder}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C4A265]"
                          />
                          <button
                            type="button"
                            onClick={handleContinueQ2Other}
                            disabled={!q2OtherText.trim()}
                            className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-[#C4A265] dark:hover:bg-[#b39255] text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <span>Continue</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      )}
                    </>
                  )}

                  {isRetake && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSkipStep}
                        className="text-xs font-semibold text-[#C4A265] hover:underline cursor-pointer"
                      >
                        Skip this step &rarr;
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── QUESTION 3 ─────────────────────────────────────── */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                        {STUDIO_ONBOARDING_CONFIG.q3.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
                        {STUDIO_ONBOARDING_CONFIG.q3.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                      {audience.length + (q3ShowOtherInput && q3OtherText.trim() ? 1 : 0)} / 2
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentQ3Options.map((opt) => {
                      const isSelected = audience.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleQ3Option(opt)}
                          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-[#C4A265]/10 border-[#C4A265] text-gray-900 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                              : 'bg-gray-50/70 hover:bg-gray-100/90 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 border-gray-200/70 dark:border-zinc-800 text-gray-800 dark:text-zinc-200'
                          }`}
                        >
                          <span className="font-semibold text-xs sm:text-sm">{opt}</span>
                        </button>
                      );
                    })}

                    {/* "Other" Option Card */}
                    <button
                      type="button"
                      onClick={toggleQ3Other}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        q3ShowOtherInput
                          ? 'bg-[#C4A265]/10 border-[#C4A265] text-gray-900 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                          : 'bg-gray-50/70 hover:bg-gray-100/90 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 border-gray-200/70 dark:border-zinc-800 text-gray-800 dark:text-zinc-200'
                      }`}
                    >
                      <span className="font-semibold text-xs sm:text-sm">Other</span>
                      <span className="text-xs text-gray-400">custom</span>
                    </button>
                  </div>

                  {/* "Other" text input for Q3 */}
                  {q3ShowOtherInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-1"
                    >
                      <input
                        type="text"
                        value={q3OtherText}
                        onChange={(e) => setQ3OtherText(e.target.value)}
                        autoFocus
                        placeholder={STUDIO_ONBOARDING_CONFIG.q3.otherPlaceholder}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C4A265]"
                      />
                    </motion.div>
                  )}

                  {/* Continue Button for Q3 */}
                  <div className="pt-2 flex items-center gap-3">
                    {isRetake && (
                      <button
                        type="button"
                        onClick={handleSkipStep}
                        className="w-1/3 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Skip
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      disabled={!canContinueQ3}
                      className={`${isRetake ? 'w-2/3' : 'w-full'} py-3 rounded-xl bg-gray-900 hover:bg-black dark:bg-[#C4A265] dark:hover:bg-[#b39255] text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm`}
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── QUESTION 4 ─────────────────────────────────────── */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                        {STUDIO_ONBOARDING_CONFIG.q4.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
                        {STUDIO_ONBOARDING_CONFIG.q4.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                      {tone.length + (q4ShowOtherInput && q4OtherText.trim() ? 1 : 0)} / 2
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STUDIO_ONBOARDING_CONFIG.q4.options.map((opt) => {
                      const isSelected = tone.includes(opt.label);
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => toggleQ4Option(opt.label)}
                          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-[#C4A265]/10 border-[#C4A265] text-gray-900 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                              : 'bg-gray-50/70 hover:bg-gray-100/90 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 border-gray-200/70 dark:border-zinc-800 text-gray-800 dark:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div>
                              <p className="font-semibold text-xs sm:text-sm leading-tight">{opt.label}</p>
                              {opt.hint && (
                                <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">
                                  {opt.hint}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {/* "Other" Option Card */}
                    <button
                      type="button"
                      onClick={toggleQ4Other}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        q4ShowOtherInput
                          ? 'bg-[#C4A265]/10 border-[#C4A265] text-gray-900 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                          : 'bg-gray-50/70 hover:bg-gray-100/90 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 border-gray-200/70 dark:border-zinc-800 text-gray-800 dark:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div>
                          <p className="font-semibold text-xs sm:text-sm leading-tight">Other</p>
                          <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">
                            Custom voice
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">custom</span>
                    </button>
                  </div>

                  {/* "Other" text input for Q4 */}
                  {q4ShowOtherInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-1"
                    >
                      <input
                        type="text"
                        value={q4OtherText}
                        onChange={(e) => setQ4OtherText(e.target.value)}
                        autoFocus
                        placeholder={STUDIO_ONBOARDING_CONFIG.q4.otherPlaceholder}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C4A265]"
                      />
                    </motion.div>
                  )}

                  {/* Finish / Continue Button for Q4 */}
                  <div className="pt-2 flex items-center gap-3">
                    {isRetake && (
                      <button
                        type="button"
                        onClick={handleSkipStep}
                        disabled={isFinishing}
                        className="w-1/3 py-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Skip
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={!canContinueQ4 || isFinishing}
                      className={`${isRetake ? 'w-2/3' : 'w-full'} py-3.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-[#C4A265] dark:hover:bg-[#b39255] text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg`}
                    >
                      {isFinishing ? (
                        <span>{isRetake ? 'Updating...' : 'Entering Studio...'}</span>
                      ) : (
                        <span>{isRetake ? 'Update' : 'Enter Studio'}</span>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
