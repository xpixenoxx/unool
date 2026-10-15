'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Check,
  X,
  Sparkles,
  Layers,
  Cpu,
  TrendingUp,
  Terminal,
  Compass,
  Feather,
  Sliders,
  Target,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   STUDIO ONBOARDING CONFIGURATION
   Modern, high-signal publishing archetypes, domains, audiences,
   voice signatures, and architectural guardrails (Zero emojis).
   ───────────────────────────────────────────────────────────── */
export interface OnboardingConfig {
  q1: {
    title: string;
    subtitle: string;
    options: Array<{
      id: string;
      label: string;
      sub: string;
      hint: string;
      iconType: 'cpu' | 'trending' | 'terminal' | 'compass' | 'feather' | 'sliders';
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
    byPersona?: Record<string, string[]>;
    defaultOptions: Array<{
      id: string;
      label: string;
      hint: string;
    }>;
    otherPlaceholder: string;
  };
  q4: {
    title: string;
    subtitle: string;
    maxSelections: number;
    options: Array<{
      label: string;
      sub: string;
      hint: string;
    }>;
    otherPlaceholder: string;
  };
  q5: {
    title: string;
    subtitle: string;
    categories: Array<{
      id: string;
      label: string;
      chips: string[];
    }>;
    chips: string[];
    recommendedDefaults: string[];
    otherPlaceholder: string;
  };
}

export const STUDIO_ONBOARDING_CONFIG: OnboardingConfig = {
  q1: {
    title: 'Define your publishing archetype',
    subtitle: 'Select the strategic lens that guides your thinking, perspectives, and authority across networks.',
    options: [
      {
        id: 'Venture Architect',
        label: 'Venture Architect',
        sub: 'Founding, engineering & scaling',
        hint: 'Scaling products from zero to one, shipping AI architectures, bootstrapping, and venture execution',
        iconType: 'cpu',
      },
      {
        id: 'Growth Operator',
        label: 'Growth Operator',
        sub: 'Systems, distribution & revenue',
        hint: 'Growth loops, client engines, acquisition mechanics, agency craft, and commerce operations',
        iconType: 'trending',
      },
      {
        id: 'Domain Authority',
        label: 'Domain Authority',
        sub: 'Technical depth & tradecraft',
        hint: 'Deep system teardowns, software architecture, developer tooling, and applied engineering',
        iconType: 'terminal',
      },
      {
        id: 'Market Strategist',
        label: 'Market Strategist',
        sub: 'Macro shifts & industry foresight',
        hint: 'Executive perspectives, market analysis, venture capital theses, governance, and business models',
        iconType: 'compass',
      },
      {
        id: 'Cultural Essayist',
        label: 'Cultural Essayist',
        sub: 'Essays, philosophy & human craft',
        hint: 'Human psychology, intentional living, mental models, creative writing, and cultural critique',
        iconType: 'feather',
      },
      {
        id: 'Bespoke Archetype',
        label: 'Bespoke Archetype',
        sub: 'Custom creative stance',
        hint: 'Define your own unique signature publishing identity and specialized mission',
        iconType: 'sliders',
      },
    ],
  },
  q2: {
    byPersona: {
      'Venture Architect': {
        title: 'What is your venture frontier?',
        subtitle: 'Select the primary space where you are building products or technical systems.',
        options: [
          'Autonomous AI & Agentic Systems',
          'Vertical SaaS & Enterprise Platforms',
          'Fintech, Web3 & Digital Infrastructure',
          'Developer Tooling & Cloud Platforms',
          'Consumer Products & Social Networks',
          'Hardware, Robotics & Deep Tech',
        ],
        otherPlaceholder: 'e.g. Climate Tech, Quantum Computing, Spatial Computing...',
      },
      'Growth Operator': {
        title: 'What engine do you operate?',
        subtitle: 'Select your primary growth, commerce, or client advisory engine.',
        options: [
          'Performance Marketing & Funnel Architecture',
          'Client Advisory & High-Ticket Services',
          'Omnichannel Commerce & Direct-to-Consumer',
          'Media Studio & High-Output Production',
          'Executive Coaching & Cohort Programs',
          'Product-Led Growth & Retention Systems',
        ],
        otherPlaceholder: 'e.g. Retained Search, Boutique Agency, Fractional Leadership...',
      },
      'Domain Authority': {
        title: 'What is your technical craft?',
        subtitle: 'Select the core discipline where your insights carry deep signal.',
        options: [
          'Distributed Cloud Systems & Microservices',
          'AI Engineering, LLMs & Latent Space',
          'Frontend Engineering, Motion & UI Craft',
          'Cybersecurity, Zero Trust & Cryptography',
          'Open-Source Protocols & Applied Mathematics',
          'Mobile Engineering & Native Platforms',
        ],
        otherPlaceholder: 'e.g. Database Internals, Compiler Design, Embedded Firmware...',
      },
      'Market Strategist': {
        title: 'Where do you deliver strategic foresight?',
        subtitle: 'Select your primary industry lens or advisory domain.',
        options: [
          'Corporate Strategy & Market Disruption',
          'Venture Capital, Syndicates & Dealflow',
          'Geopolitical Tech & Macroeconomic Trends',
          'Organizational Velocity & Elite Talent',
          'AI Ethics, Governance & Public Policy',
          'Mergers, Acquisitions & Enterprise Scaling',
        ],
        otherPlaceholder: 'e.g. Healthcare Innovation, Supply Chain Logistics, Defense Tech...',
      },
      'Cultural Essayist': {
        title: 'What themes anchor your writing?',
        subtitle: 'Select the conceptual territory you explore through your content.',
        options: [
          'Mental Models & First-Principles Decisions',
          'Human Optimization, Longevity & Health',
          'Creative Craft, Visual Media & Storytelling',
          'Modern Work, Solopreneurship & Autonomy',
          'Societal Shifts, Technology & Psychology',
          'Personal Finance, Wealth Philosophy & Freedom',
        ],
        otherPlaceholder: 'e.g. Architecture & Space, Film Critique, Digital Minimalism...',
      },
      'Bespoke Archetype': {
        title: 'Define your publishing territory',
        subtitle: 'Describe the core focus and domain of your content.',
        options: [],
        otherPlaceholder: 'e.g. Investigative Tech Journalism, Independent Research, Climate Intelligence...',
      },
      // Backwards-compatible mappings for legacy personas
      Founder: {
        title: 'What are you building?',
        subtitle: 'Select the category that best matches your venture.',
        options: [
          'Autonomous AI & Agentic Systems',
          'Vertical SaaS & Enterprise Platforms',
          'Fintech, Web3 & Digital Infrastructure',
          'Developer Tooling & Cloud Platforms',
          'Consumer Products & Social Networks',
          'Hardware, Robotics & Deep Tech',
        ],
        otherPlaceholder: 'e.g. Climate Tech, Quantum Computing...',
      },
      'Business Owner': {
        title: 'What engine do you operate?',
        subtitle: 'Select your primary commercial or services engine.',
        options: [
          'Performance Marketing & Funnel Architecture',
          'Client Advisory & High-Ticket Services',
          'Omnichannel Commerce & Direct-to-Consumer',
          'Media Studio & High-Output Production',
          'Executive Coaching & Cohort Programs',
          'Product-Led Growth & Retention Systems',
        ],
        otherPlaceholder: 'e.g. Boutique Agency, Retail Group...',
      },
      Creator: {
        title: 'What is your core discipline?',
        subtitle: 'Pick the space where you share your best work.',
        options: [
          'Technical Teardowns & Tutorials',
          'Cultural Commentary & Media Essays',
          'Design, Aesthetics & Visual Systems',
          'Performance, Longevity & Wellness',
          'Macro Markets, Tech & Finance',
          'Creative Storytelling & Media',
        ],
        otherPlaceholder: 'e.g. Music Production, Film Analysis...',
      },
      Student: {
        title: 'What is your focus area?',
        subtitle: 'Select your field of deep study or career ambition.',
        options: [
          'Computer Science & Machine Learning',
          'Biomedical Sciences & Health Tech',
          'Quantitative Finance & Economics',
          'Design Systems & Interaction Architecture',
          'Applied Physics & Hardware',
          'Law, Ethics & Policy',
        ],
        otherPlaceholder: 'e.g. Aerospace, Computational Biology...',
      },
      Individual: {
        title: 'What is your primary territory?',
        subtitle: 'What captures your professional and intellectual energy?',
        options: [
          'Technical Building & Open Source',
          'Strategic Consulting & Advisory',
          'Creative Writing & Essays',
          'Industry Analysis & Frameworks',
          'Career Evolution & Skill Mastery',
          'Side Ventures & Digital Products',
        ],
        otherPlaceholder: 'e.g. Research Fellow, Independent Operator...',
      },
      Other: {
        title: 'What is your primary focus?',
        subtitle: 'Describe what you do or want to publish about.',
        options: [],
        otherPlaceholder: 'e.g. Community Builder, Independent Thinker...',
      },
    },
  },
  q3: {
    title: 'Who should stop scrolling for your posts?',
    subtitle: 'Select up to 2 high-leverage circles your content is engineered to influence.',
    maxSelections: 2,
    defaultOptions: [
      {
        id: 'Early Adopters & Tech Builders',
        label: 'Early Adopters & Tech Builders',
        hint: 'Engineers, builders, and power users who test, champion, and adopt new tools',
      },
      {
        id: 'Angel Investors & Venture Capitalists',
        label: 'Angel Investors & Venture Capitalists',
        hint: 'Partners, scouts, and angels evaluating category-defining teams and traction',
      },
      {
        id: 'Enterprise Decision-Makers & Buyers',
        label: 'Enterprise Decision-Makers & Buyers',
        hint: 'VPs, Directors, and founders holding departmental procurement and sign-off budgets',
      },
      {
        id: 'High-Caliber Operators & Future Teammates',
        label: 'High-Caliber Operators & Future Teammates',
        hint: 'Top-tier talent looking for ambitious missions, culture, and high velocity',
      },
      {
        id: 'Ambitious Peers & Industry Insiders',
        label: 'Ambitious Peers & Industry Insiders',
        hint: 'Fellow founders, operators, and creators swapping tactical battle-tested playbooks',
      },
      {
        id: 'Curious Intellectuals & Avid Readers',
        label: 'Curious Intellectuals & Avid Readers',
        hint: 'Discerning readers hungry for rigorous analysis, fresh perspectives, and deep signal',
      },
    ],
    otherPlaceholder: 'e.g. Chief Technology Officers, Seed Founders, Design Directors...',
  },
  q4: {
    title: 'What is your signature voice cadence?',
    subtitle: 'Select up to 2 rhetorical tones that define how your posts read, resonate, and hook.',
    maxSelections: 2,
    options: [
      {
        label: 'The Provocative Contrarian',
        sub: 'Bold & questioning',
        hint: 'Challenges consensus, dismantles industry clichés, and takes high-conviction counter-intuitive stances',
      },
      {
        label: 'The Pragmatic Operator',
        sub: 'Tactical & rigorous',
        hint: 'Zero fluff, actionable playbooks, concrete numbers, clear frameworks, and immediate utility',
      },
      {
        label: 'The Rigorous Scholar',
        sub: 'Analytical & research-backed',
        hint: 'Methodical teardowns, deep citations, intellectual rigor, and high signal-to-noise ratio',
      },
      {
        label: 'The Cinematic Storyteller',
        sub: 'Narrative & emotive',
        hint: 'Compelling hooks, personal vulnerability, suspenseful narrative pacing, and cinematic arcs',
      },
      {
        label: 'The Sharp Minimalist',
        sub: 'Dense & punchy',
        hint: 'Razor-sharp stanzas, high idea-per-word density, pithy one-liners, and poetic precision',
      },
      {
        label: 'The Candid Insider',
        sub: 'Transparent & warm',
        hint: 'Behind-closed-doors transparency, unvarnished lessons, peer-level warmth, and direct candor',
      },
      {
        label: 'The Visionary Futurist',
        sub: 'Expansive & thesis-driven',
        hint: 'Horizon-scanning, macro predictions, technological optimism, and bold future roadmaps',
      },
    ],
    otherPlaceholder: 'e.g. Sarcastic Satirist, Executive Mentor, Poetic Philosopher...',
  },
  q5: {
    title: 'Set your publishing guardrails',
    subtitle: 'Curate non-negotiable styling directives and formatting constraints applied to every AI draft.',
    categories: [
      {
        id: 'structure',
        label: 'Structure & Hooks',
        chips: [
          'Hook in the opening line',
          'Single-sentence punchy paragraphs',
          'Use structured bullet points',
          'Thought-provoking closing question',
          'Clear tactical takeaway at the end',
          'Include real-world case studies',
        ],
      },
      {
        id: 'tone',
        label: 'Tone & Style',
        chips: [
          'Strictly no corporate buzzwords',
          'No generic filler phrases',
          'High signal-to-noise ratio',
          'Ground statements in metrics and data',
          'Write in first-person active voice',
          'Conversational yet authoritative',
          'Eliminate exclamation marks',
          'Skip hype words like delve or game-changer',
        ],
      },
      {
        id: 'cadence',
        label: 'Cadence & Length',
        chips: [
          'Keep drafts compact and concise',
          'Expand into long-form micro-essays',
          'Rhythmic stanza breaks',
          'Pithy one-line summaries',
        ],
      },
      {
        id: 'directives',
        label: 'Directives & CTAs',
        chips: [
          'Never use emojis',
          'Include 2-3 targeted discovery hashtags',
          'Strictly zero hashtags',
          'Include subtle call-to-action',
          'Encourage thoughtful debate in comments',
          'Mention brand or project when relevant',
        ],
      },
    ],
    chips: [
      'Hook in the opening line',
      'Single-sentence punchy paragraphs',
      'Use structured bullet points',
      'Thought-provoking closing question',
      'Clear tactical takeaway at the end',
      'Include real-world case studies',
      'Strictly no corporate buzzwords',
      'No generic filler phrases',
      'High signal-to-noise ratio',
      'Ground statements in metrics and data',
      'Write in first-person active voice',
      'Conversational yet authoritative',
      'Eliminate exclamation marks',
      'Skip hype words like delve or game-changer',
      'Keep drafts compact and concise',
      'Expand into long-form micro-essays',
      'Rhythmic stanza breaks',
      'Pithy one-line summaries',
      'Never use emojis',
      'Include 2-3 targeted discovery hashtags',
      'Strictly zero hashtags',
      'Include subtle call-to-action',
      'Encourage thoughtful debate in comments',
      'Mention brand or project when relevant',
    ],
    recommendedDefaults: [
      'Hook in the opening line',
      'Strictly no corporate buzzwords',
      'High signal-to-noise ratio',
      'Never use emojis',
      'Thought-provoking closing question',
    ],
    otherPlaceholder: 'Additional bespoke notes or guidelines for your voice',
  },
};

/* ─────────────────────────────────────────────────────────────
   HELPER ICON COMPONENT
   ───────────────────────────────────────────────────────────── */
function ArchetypeIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'cpu':
      return <Cpu className={className} />;
    case 'trending':
      return <TrendingUp className={className} />;
    case 'terminal':
      return <Terminal className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'feather':
      return <Feather className={className} />;
    case 'sliders':
    default:
      return <Sliders className={className} />;
  }
}

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
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Stored answers
  const [persona, setPersona] = useState<string>('');
  const [focus, setFocus] = useState<string>('');
  const [audience, setAudience] = useState<string[]>([]);
  const [tone, setTone] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);

  // "Other" text inputs
  const [q1OtherText, setQ1OtherText] = useState('');
  const [q1ShowOtherInput, setQ1ShowOtherInput] = useState(false);

  const [q2OtherText, setQ2OtherText] = useState('');
  const [q2ShowOtherInput, setQ2ShowOtherInput] = useState(false);

  const [q3OtherText, setQ3OtherText] = useState('');
  const [q3ShowOtherInput, setQ3ShowOtherInput] = useState(false);

  const [q4OtherText, setQ4OtherText] = useState('');
  const [q4ShowOtherInput, setQ4ShowOtherInput] = useState(false);

  const [q5OtherText, setQ5OtherText] = useState('');
  const [q5FilterCategory, setQ5FilterCategory] = useState<string>('all');
  const [q5SearchQuery, setQ5SearchQuery] = useState('');

  // Feedback states
  const [isFinishing, setIsFinishing] = useState(false);

  // Toggle chip in Q5 multi-select
  const toggleExtraChip = (chip: string) => {
    setExtras((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleApplyRecommended = () => {
    setExtras((prev) => {
      const merged = new Set([...prev, ...STUDIO_ONBOARDING_CONFIG.q5.recommendedDefaults]);
      return Array.from(merged);
    });
  };

  const handleClearExtras = () => {
    setExtras([]);
  };

  // Sync controlledIsOpen
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  // Escape key handling
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        controlledOnClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
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
      if (Array.isArray(initialAnswers.extras)) setExtras(initialAnswers.extras);
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
        if (initialAnswers.custom.extras_text) {
          setQ5OtherText(initialAnswers.custom.extras_text);
        }
      }
    }
  }, [initialAnswers]);

  // Fallback preload for retake flow if initialAnswers was not provided
  useEffect(() => {
    if (isRetake && (!initialAnswers || !initialAnswers.persona)) {
      fetch('/api/profile/onboarding', { credentials: 'include', cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          const a = data.answers || data.onboarding_answers;
          if (a) {
            if (a.persona) setPersona(a.persona);
            if (a.focus) setFocus(a.focus);
            if (Array.isArray(a.audience)) setAudience(a.audience);
            if (Array.isArray(a.tone)) setTone(a.tone);
            if (Array.isArray(a.extras)) setExtras(a.extras);
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
              if (a.custom.extras_text) {
                setQ5OtherText(a.custom.extras_text);
              }
            }
          }
        })
        .catch((err) => console.warn('Could not preload answers for retake:', err));
    }
  }, [isRetake, initialAnswers]);

  // Initialize and check database onboarding status
  useEffect(() => {
    setMounted(true);

    if (controlledIsOpen !== undefined || forceOpen || isRetake) {
      if (controlledIsOpen !== undefined) {
        setIsOpen(controlledIsOpen);
      } else {
        setIsOpen(true);
      }
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
            setIsOpen(true);
          }

          if (data.answers || data.onboarding_answers) {
            const a = data.answers || data.onboarding_answers;
            if (a.persona) setPersona(a.persona);
            if (a.focus) setFocus(a.focus);
            if (Array.isArray(a.audience)) setAudience(a.audience);
            if (Array.isArray(a.tone)) setTone(a.tone);
            if (Array.isArray(a.extras)) setExtras(a.extras);
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
              if (a.custom.extras_text) {
                setQ5OtherText(a.custom.extras_text);
              }
            }
          }
          return;
        }
      } catch (err) {
        console.warn('Could not query /api/profile/onboarding, falling back to local storage:', err);
      }

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
    if (persona === 'Bespoke Archetype' && q1OtherText.trim()) {
      customObj.persona = q1OtherText.trim();
    }
    if ((focus === 'Other' || persona === 'Bespoke Archetype' || persona === 'Other') && q2OtherText.trim()) {
      customObj.focus = q2OtherText.trim();
    }
    if (q3ShowOtherInput && q3OtherText.trim()) {
      customObj.audience = q3OtherText.trim();
    }
    if (q4ShowOtherInput && q4OtherText.trim()) {
      customObj.tone = q4OtherText.trim();
    }
    if (q5OtherText.trim()) {
      customObj.extras_text = q5OtherText.trim();
    }

    const finalPersona =
      (persona === 'Bespoke Archetype' || persona === 'Other') && q1OtherText.trim()
        ? q1OtherText.trim()
        : persona || 'Venture Architect';

    const finalFocus =
      (focus === 'Other' || persona === 'Bespoke Archetype' || persona === 'Other') && q2OtherText.trim()
        ? q2OtherText.trim()
        : focus || 'Autonomous AI & Agentic Systems';

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
      audience: finalAudience.length > 0 ? finalAudience : ['Early Adopters & Tech Builders'],
      tone: finalTone.length > 0 ? finalTone : ['The Pragmatic Operator'],
      extras: extras,
      custom: customObj,
    };

    markCompleted();

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

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleSkipStep = () => {
    if (step < 5) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5);
    } else {
      handleFinish();
    }
  };

  /* ─────────────────────────────────────────────────────────────
     Q1 Handlers (Archetype)
     ───────────────────────────────────────────────────────────── */
  const handleSelectQ1 = (id: string) => {
    if (id === 'Bespoke Archetype' || id === 'Other') {
      setPersona('Bespoke Archetype');
      setQ1ShowOtherInput(true);
      return;
    }

    setPersona(id);
    setQ1ShowOtherInput(false);
    setTimeout(() => {
      setStep(2);
    }, 220);
  };

  const handleContinueQ1Other = () => {
    if (!q1OtherText.trim()) return;
    setPersona(q1OtherText.trim());
    setStep(2);
  };

  /* ─────────────────────────────────────────────────────────────
     Q2 Handlers (Territory / Domain)
     ───────────────────────────────────────────────────────────── */
  const currentQ2Config =
    STUDIO_ONBOARDING_CONFIG.q2.byPersona[persona] ||
    STUDIO_ONBOARDING_CONFIG.q2.byPersona['Venture Architect'] ||
    STUDIO_ONBOARDING_CONFIG.q2.byPersona['Bespoke Archetype'];

  const handleSelectQ2 = (option: string) => {
    if (option === 'Other') {
      setFocus('Other');
      setQ2ShowOtherInput(true);
      return;
    }

    setFocus(option);
    setQ2ShowOtherInput(false);
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
     Q3 Handlers (Audience - Multi-select max 2)
     ───────────────────────────────────────────────────────────── */
  const toggleQ3Option = (optId: string) => {
    setAudience((prev) => {
      if (prev.includes(optId)) {
        return prev.filter((item) => item !== optId);
      }
      if (prev.length >= STUDIO_ONBOARDING_CONFIG.q3.maxSelections) {
        return [prev[1], optId];
      }
      return [...prev, optId];
    });
  };

  const toggleQ3Other = () => {
    setQ3ShowOtherInput((prev) => !prev);
  };

  const canContinueQ3 = audience.length > 0 || (q3ShowOtherInput && q3OtherText.trim().length > 0);

  /* ─────────────────────────────────────────────────────────────
     Q4 Handlers (Voice Signature - Multi-select max 2)
     ───────────────────────────────────────────────────────────── */
  const toggleQ4Option = (label: string) => {
    setTone((prev) => {
      if (prev.includes(label)) {
        return prev.filter((item) => item !== label);
      }
      if (prev.length >= STUDIO_ONBOARDING_CONFIG.q4.maxSelections) {
        return [prev[1], label];
      }
      return [...prev, label];
    });
  };

  const toggleQ4Other = () => {
    setQ4ShowOtherInput((prev) => !prev);
  };

  const canContinueQ4 = tone.length > 0 || (q4ShowOtherInput && q4OtherText.trim().length > 0);

  /* ─────────────────────────────────────────────────────────────
     Filtered Q5 Chips
     ───────────────────────────────────────────────────────────── */
  const visibleQ5Chips = useMemo(() => {
    let chipsList: string[] = [];
    if (q5FilterCategory === 'all') {
      chipsList = STUDIO_ONBOARDING_CONFIG.q5.chips;
    } else {
      const cat = STUDIO_ONBOARDING_CONFIG.q5.categories.find((c) => c.id === q5FilterCategory);
      chipsList = cat ? cat.chips : STUDIO_ONBOARDING_CONFIG.q5.chips;
    }

    if (!q5SearchQuery.trim()) return chipsList;
    const q = q5SearchQuery.toLowerCase();
    return chipsList.filter((chip) => chip.toLowerCase().includes(q));
  }, [q5FilterCategory, q5SearchQuery]);

  // Stepper titles
  const stepTitles = [
    { num: 1, label: 'Identity' },
    { num: 2, label: 'Territory' },
    { num: 3, label: 'Audience' },
    { num: 4, label: 'Voice' },
    { num: 5, label: 'Guardrails' },
  ];

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            setIsOpen(false);
            controlledOnClose?.();
          }
        }}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#121215] text-zinc-900 dark:text-zinc-100 rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col max-h-[92vh] overflow-hidden"
          style={{
            boxShadow: '0 24px 70px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(196, 162, 101, 0.15)',
          }}
        >
          {/* Header Bar */}
          <div className="px-6 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#C4A265] animate-pulse" />
                  <span className="text-xs font-bold tracking-wider uppercase text-[#C4A265]">
                    Studio Voice Calibrator
                  </span>
                </div>
              )}
            </div>

            {/* Stepper Navigation Pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              {stepTitles.map((st) => {
                const isCurrent = step === st.num;
                const isDone = step > st.num;
                return (
                  <button
                    key={st.num}
                    type="button"
                    onClick={() => {
                      if (isDone || isCurrent) setStep(st.num as 1 | 2 | 3 | 4 | 5);
                    }}
                    disabled={!isDone && !isCurrent}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      isCurrent
                        ? 'bg-[#C4A265]/15 text-[#C4A265] border border-[#C4A265]/40 font-semibold'
                        : isDone
                        ? 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700 cursor-pointer'
                        : 'text-zinc-400 dark:text-zinc-600 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <span>{st.num}.</span>
                    <span>{st.label}</span>
                    {isDone && <Check className="w-3 h-3 text-[#C4A265]" />}
                  </button>
                );
              })}
            </div>

            {/* Actions: Skip / Close */}
            <div className="flex items-center gap-3">
              <span className="sm:hidden text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                {step}/5
              </span>

              {isRetake ? (
                <button
                  type="button"
                  onClick={handleSkipStep}
                  className="text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-4"
                >
                  Skip step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-4"
                >
                  Skip for now
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  controlledOnClose?.();
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-zinc-100 dark:bg-zinc-800/50 h-1">
            <motion.div
              className="h-1 bg-gradient-to-r from-[#C4A265] via-[#D4B87A] to-[#C4A265]"
              initial={{ width: `${((step - 1) / 5) * 100}%` }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Body Content Area */}
          <div className="px-6 py-6 sm:px-8 overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              {/* ── QUESTION 1: PUBLISHING IDENTITY ─────────────────── */}
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
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {STUDIO_ONBOARDING_CONFIG.q1.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      {STUDIO_ONBOARDING_CONFIG.q1.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STUDIO_ONBOARDING_CONFIG.q1.options.map((opt) => {
                      const isSelected = persona === opt.id || (opt.id === 'Bespoke Archetype' && q1ShowOtherInput);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectQ1(opt.id)}
                          className={`group text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 relative overflow-hidden ${
                            isSelected
                              ? 'bg-[#C4A265]/10 border-[#C4A265] text-zinc-950 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                              : 'bg-zinc-50/70 hover:bg-zinc-100/90 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/70 border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div
                            className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#C4A265] text-white shadow-sm'
                                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700 group-hover:text-[#C4A265]'
                            }`}
                          >
                            <ArchetypeIcon type={opt.iconType} className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-sm leading-tight text-zinc-900 dark:text-zinc-100">
                                {opt.label}
                              </p>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#C4A265] stroke-[3]" />}
                            </div>
                            <p className="text-[11px] font-medium text-[#C4A265] dark:text-[#D4B87A] mt-0.5">
                              {opt.sub}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {opt.hint}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bespoke / Custom input for Q1 */}
                  {q1ShowOtherInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={q1OtherText}
                          onChange={(e) => setQ1OtherText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleContinueQ1Other();
                          }}
                          autoFocus
                          placeholder="e.g. AI Researcher, Investigative Tech Journalist, Venture Partner..."
                          className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C4A265]"
                        />
                        <button
                          type="button"
                          onClick={handleContinueQ1Other}
                          disabled={!q1OtherText.trim()}
                          className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black dark:bg-[#C4A265] dark:hover:bg-[#b39255] text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                        >
                          <span>Confirm</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ── QUESTION 2: TERRITORY & DOMAIN ─────────────────── */}
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
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {currentQ2Config.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      {currentQ2Config.subtitle}
                    </p>
                  </div>

                  {persona === 'Bespoke Archetype' || currentQ2Config.options.length === 0 ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Describe your core industry, product category, or domain of authority:
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
                        className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C4A265]"
                      />
                      <button
                        type="button"
                        onClick={handleContinueQ2Other}
                        disabled={!q2OtherText.trim()}
                        className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-black dark:bg-[#C4A265] dark:hover:bg-[#b39255] text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentQ2Config.options.map((opt) => {
                          const isSelected = focus === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectQ2(opt)}
                              className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                isSelected
                                  ? 'bg-[#C4A265]/10 border-[#C4A265] text-zinc-950 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                                  : 'bg-zinc-50/70 hover:bg-zinc-100/90 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/70 border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                              }`}
                            >
                              <span className="font-semibold text-xs sm:text-sm leading-snug">{opt}</span>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-[#C4A265] shrink-0" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                              )}
                            </button>
                          );
                        })}

                        {/* "Other" option card */}
                        <button
                          type="button"
                          onClick={() => handleSelectQ2('Other')}
                          className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                            focus === 'Other' || q2ShowOtherInput
                              ? 'bg-[#C4A265]/10 border-[#C4A265] text-zinc-950 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                              : 'bg-zinc-50/70 hover:bg-zinc-100/90 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/70 border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-xs sm:text-sm leading-snug">Custom Territory</span>
                            <p className="text-[10px] text-zinc-400 mt-0.5">Specify your specialized sector</p>
                          </div>
                          <Sliders className="w-4 h-4 text-zinc-400 shrink-0" />
                        </button>
                      </div>

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
                            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C4A265]"
                          />
                          <button
                            type="button"
                            onClick={handleContinueQ2Other}
                            disabled={!q2OtherText.trim()}
                            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black dark:bg-[#C4A265] dark:hover:bg-[#b39255] text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <span>Continue</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* ── QUESTION 3: TARGET AUDIENCE CIRCLES ─────────────── */}
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
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {STUDIO_ONBOARDING_CONFIG.q3.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {STUDIO_ONBOARDING_CONFIG.q3.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      {audience.length + (q3ShowOtherInput && q3OtherText.trim() ? 1 : 0)} / 2
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STUDIO_ONBOARDING_CONFIG.q3.defaultOptions.map((opt) => {
                      const isSelected = audience.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleQ3Option(opt.id)}
                          className={`group text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-[#C4A265]/10 border-[#C4A265] text-zinc-950 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                              : 'bg-zinc-50/70 hover:bg-zinc-100/90 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/70 border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-1">
                            <p className="font-semibold text-xs sm:text-sm leading-tight text-zinc-900 dark:text-zinc-100">
                              {opt.label}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {opt.hint}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#C4A265] text-white'
                                : 'border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}

                    {/* Custom Circle Card */}
                    <button
                      type="button"
                      onClick={toggleQ3Other}
                      className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                        q3ShowOtherInput
                          ? 'bg-[#C4A265]/10 border-[#C4A265] text-zinc-950 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                          : 'bg-zinc-50/70 hover:bg-zinc-100/90 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/70 border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs sm:text-sm leading-tight text-zinc-900 dark:text-zinc-100">
                          Custom Audience
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                          Define a specialized target niche
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          q3ShowOtherInput
                            ? 'bg-[#C4A265] text-white'
                            : 'border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                        }`}
                      >
                        {q3ShowOtherInput && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  </div>

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
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C4A265]"
                      />
                    </motion.div>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    {isRetake && (
                      <button
                        type="button"
                        onClick={handleSkipStep}
                        className="w-1/3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Skip
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      disabled={!canContinueQ3}
                      className={`${
                        isRetake ? 'w-2/3' : 'w-full'
                      } py-3 rounded-xl bg-zinc-900 hover:bg-black dark:bg-[#C4A265] dark:hover:bg-[#b39255] text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm`}
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── QUESTION 4: VOICE SIGNATURE CADENCE ────────────── */}
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
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {STUDIO_ONBOARDING_CONFIG.q4.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {STUDIO_ONBOARDING_CONFIG.q4.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      {tone.length + (q4ShowOtherInput && q4OtherText.trim() ? 1 : 0)} / 2
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STUDIO_ONBOARDING_CONFIG.q4.options.map((opt) => {
                      const isSelected = tone.includes(opt.label);
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => toggleQ4Option(opt.label)}
                          className={`group text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-[#C4A265]/10 border-[#C4A265] text-zinc-950 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                              : 'bg-zinc-50/70 hover:bg-zinc-100/90 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/70 border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-1">
                            <p className="font-semibold text-xs sm:text-sm leading-tight text-zinc-900 dark:text-zinc-100">
                              {opt.label}
                            </p>
                            <p className="text-[10px] font-medium text-[#C4A265] dark:text-[#D4B87A] mt-0.5">
                              {opt.sub}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {opt.hint}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#C4A265] text-white'
                                : 'border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}

                    {/* Custom Voice Card */}
                    <button
                      type="button"
                      onClick={toggleQ4Other}
                      className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                        q4ShowOtherInput
                          ? 'bg-[#C4A265]/10 border-[#C4A265] text-zinc-950 dark:text-white shadow-sm ring-1 ring-[#C4A265]'
                          : 'bg-zinc-50/70 hover:bg-zinc-100/90 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/70 border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs sm:text-sm leading-tight text-zinc-900 dark:text-zinc-100">
                          Custom Voice
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                          Describe your bespoke writing style
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          q4ShowOtherInput
                            ? 'bg-[#C4A265] text-white'
                            : 'border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                        }`}
                      >
                        {q4ShowOtherInput && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  </div>

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
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C4A265]"
                      />
                    </motion.div>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    {isRetake && (
                      <button
                        type="button"
                        onClick={handleSkipStep}
                        className="w-1/3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Skip
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStep(5)}
                      disabled={!canContinueQ4}
                      className={`${
                        isRetake ? 'w-2/3' : 'w-full'
                      } py-3 rounded-xl bg-zinc-900 hover:bg-black dark:bg-[#C4A265] dark:hover:bg-[#b39255] text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm`}
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── QUESTION 5: PUBLISHING GUARDRAILS ───────────────── */}
              {step === 5 && (
                <motion.div
                  key="step-5"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {STUDIO_ONBOARDING_CONFIG.q5.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {STUDIO_ONBOARDING_CONFIG.q5.subtitle}
                      </p>
                    </div>
                    {extras.length > 0 && (
                      <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#C4A265]/15 text-[#C4A265] border border-[#C4A265]/30">
                        {extras.length} active
                      </span>
                    )}
                  </div>

                  {/* Category Filter Tabs & Quick Actions */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setQ5FilterCategory('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          q5FilterCategory === 'all'
                            ? 'bg-zinc-900 text-white dark:bg-[#C4A265] dark:text-zinc-900 font-semibold'
                            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                        }`}
                      >
                        All Rules
                      </button>
                      {STUDIO_ONBOARDING_CONFIG.q5.categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setQ5FilterCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            q5FilterCategory === cat.id
                              ? 'bg-zinc-900 text-white dark:bg-[#C4A265] dark:text-zinc-900 font-semibold'
                              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleApplyRecommended}
                        className="text-[11px] font-semibold text-[#C4A265] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Recommended preset</span>
                      </button>
                      {extras.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearExtras}
                          className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chips Grid */}
                  <div className="flex flex-wrap gap-2 pt-1 max-h-[30vh] overflow-y-auto pr-1">
                    {visibleQ5Chips.map((chip) => {
                      const isSelected = extras.includes(chip);
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => toggleExtraChip(chip)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-zinc-900 text-white dark:bg-[#C4A265] dark:text-zinc-950 border-zinc-900 dark:border-[#C4A265] shadow-sm font-semibold'
                              : 'bg-white hover:bg-zinc-100/80 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          )}
                          <span>{chip}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bespoke instructions textarea */}
                  <div className="pt-1">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {STUDIO_ONBOARDING_CONFIG.q5.otherPlaceholder}
                    </label>
                    <textarea
                      value={q5OtherText}
                      onChange={(e) => setQ5OtherText(e.target.value)}
                      rows={2}
                      placeholder="e.g. Frame lessons through real experiments, mention our product when sharing workflows, keep tone candid..."
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#C4A265] resize-none"
                    />
                  </div>

                  {/* Action row */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={isFinishing}
                      className="w-1/4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={isFinishing}
                      className="w-1/4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={isFinishing}
                      className="w-1/2 py-3 rounded-xl bg-[#C4A265] hover:bg-[#b09055] text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      {isFinishing ? (
                        <span>{isRetake ? 'Updating Voice...' : 'Calibrating Studio...'}</span>
                      ) : (
                        <span>{isRetake ? 'Save Calibrations' : 'Activate Studio Voice'}</span>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic Real-Time Voice Signature Ribbon Footer */}
          <div className="px-6 py-2.5 bg-zinc-50 dark:bg-zinc-900/70 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 overflow-x-auto gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Active Profile:</span>
              <span className="text-[#C4A265] font-medium">{persona || 'Archetype pending'}</span>
            </div>
            {focus && (
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span>{focus}</span>
              </div>
            )}
            {tone.length > 0 && (
              <div className="hidden md:flex items-center gap-1 shrink-0">
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">{tone.join(', ')}</span>
              </div>
            )}
            {extras.length > 0 && (
              <div className="hidden lg:flex items-center gap-1 shrink-0">
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span>{extras.length} guardrails</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
