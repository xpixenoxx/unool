'use client';

import * as React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateMeta } from '@/components/profile/templates/types';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Check, ArrowRight, Loader2, Eye, X, ChevronLeft, Sparkles } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   PERSONA DESIGN SYSTEM
   Each template gets a unique gradient, accent, and custom SVG icon.
   No emojis. Everything is crafted.
   ═══════════════════════════════════════════════════════════════ */

interface PersonaDesign {
  tagline: string;
  gradient: string;         // Card background gradient
  accent: string;           // Primary accent color
  accentSoft: string;       // Soft tint for backgrounds
  iconGradient: string;     // Gradient for the icon circle
  textColor: string;        // Card text color
  icon: React.FC<{ className?: string }>;
}

/* ─── Custom SVG Icons per Persona ─────────────────────────── */

const HeartFlameIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M12 21C8 17.5 4 14.5 4 10a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 4.5-4 7.5-8 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M12 13c1.5-2 3-3 3-4.5a2.5 2.5 0 0 0-3-2.45A2.5 2.5 0 0 0 9 8.5c0 1.5 1.5 2.5 3 4.5Z" fill="currentColor" opacity="0.3"/></svg>
);
const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="15" cy="7" r="1" fill="currentColor" opacity="0.4"/></svg>
);
const BoltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" fill="currentColor" opacity="0.15"/></svg>
);
const SirenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M12 2v4M4 10l2 1M18 10l2 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M7 20h10M8 16h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 16V12a3 3 0 0 1 6 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="9" r="1.5" fill="currentColor" opacity="0.4"/></svg>
);
const CrystalIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M12 2L3 9l9 13 9-13-9-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M3 9h18M12 2v20" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/><path d="M12 2L3 9l9 13" fill="currentColor" opacity="0.1"/></svg>
);
const SunHandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2v2M12 12v1M18.36 3.64l-1.41 1.41M5.05 3.64l1.41 1.41M20 8h-2M6 8H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M8 16c0-2 1.79-3 4-3s4 1 4 3v3a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-3Z" stroke="currentColor" strokeWidth="1.8"/></svg>
);
const PaletteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><circle cx="8" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="8" r="1.5" fill="currentColor" opacity="0.6"/><circle cx="16" cy="13" r="1.5" fill="currentColor" opacity="0.3"/><path d="M8 15a2 2 0 0 1 4 0c0 1.5-1 2-2 2s-2-.5-2-2Z" fill="currentColor"/></svg>
);
const GearIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
);
const DiscoBallIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M12 3v2M4.5 13H5M19 13h.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><ellipse cx="12" cy="13" rx="8" ry="3" stroke="currentColor" strokeWidth="1" opacity="0.3"/><ellipse cx="12" cy="13" rx="3" ry="8" stroke="currentColor" strokeWidth="1" opacity="0.3"/><path d="M10 5l4 1M9 21l2-1M15 21l-1-1" stroke="currentColor" strokeWidth="1" opacity="0.2"/></svg>
);
const HammerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M15 12l-8 8-2-2 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.5 5.5l4 4-3 3-4-4 3-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M18.5 9.5l2-2a1 1 0 0 0 0-1.41l-2.59-2.59a1 1 0 0 0-1.41 0l-2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
);
const TelescopeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M6 21l6-11M14 21l-2-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M20 4L8 12l2 3 12-6-2-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>
);
const FlameIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M12 22c4.42 0 7-3.13 7-7.5 0-4.37-4-8-7-12C9 6.5 5 10.13 5 14.5 5 18.87 7.58 22 12 22Z" stroke="currentColor" strokeWidth="1.8"/><path d="M12 22c2 0 3.5-1.5 3.5-3.75 0-2.25-2-4-3.5-6-1.5 2-3.5 3.75-3.5 6C8.5 20.5 10 22 12 22Z" fill="currentColor" opacity="0.2"/></svg>
);
const DiamondIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M12 2L2 9l10 13L22 9 12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M2 9h20" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/><path d="M8 2l-2 7 6 13" stroke="currentColor" strokeWidth="1" opacity="0.2"/><path d="M16 2l2 7-6 13" stroke="currentColor" strokeWidth="1" opacity="0.2"/></svg>
);
const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="13" r="1.5" fill="currentColor" opacity="0.3"/><path d="M8 6l1-3h6l1 3" stroke="currentColor" strokeWidth="1.6"/></svg>
);
const QuillIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M20 2C14 4 10 10 8 16l-4 5 3-1c4-2 8-4 13-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 16c2-1 4-3 6-6" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/></svg>
);

const PERSONA_DESIGN: Record<string, PersonaDesign> = {
  lover: {
    tagline: 'I create from emotion.',
    gradient: 'linear-gradient(145deg, #FFF5F7 0%, #FFE8ED 50%, #FDD8E0 100%)',
    accent: '#E8456B',
    accentSoft: '#FFF0F3',
    iconGradient: 'linear-gradient(135deg, #FF6B8A, #E8456B)',
    textColor: '#4A1523',
    icon: HeartFlameIcon,
  },
  lone: {
    tagline: 'I move quietly and build my own world.',
    gradient: 'linear-gradient(145deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
    accent: '#7C8CFF',
    accentSoft: '#1E2340',
    iconGradient: 'linear-gradient(135deg, #7C8CFF, #5C6BC0)',
    textColor: '#E0E4FF',
    icon: MoonIcon,
  },
  energy: {
    tagline: 'Discipline. Ambition. Growth.',
    gradient: 'linear-gradient(145deg, #1C1917 0%, #292524 50%, #1C1917 100%)',
    accent: '#EF4444',
    accentSoft: '#2D1F1F',
    iconGradient: 'linear-gradient(135deg, #FF4D4D, #DC2626)',
    textColor: '#FAFAF9',
    icon: BoltIcon,
  },
  rebellion: {
    tagline: 'We challenge the industry.',
    gradient: 'linear-gradient(145deg, #0A0A0A 0%, #1A0A0A 50%, #0A0A0A 100%)',
    accent: '#FF3333',
    accentSoft: '#1F0A0A',
    iconGradient: 'linear-gradient(135deg, #FF4444, #CC0000)',
    textColor: '#FFFFFF',
    icon: SirenIcon,
  },
  vision: {
    tagline: "We're building what's next.",
    gradient: 'linear-gradient(145deg, #0C0A1D 0%, #1A1145 50%, #0C0A1D 100%)',
    accent: '#818CF8',
    accentSoft: '#1A1640',
    iconGradient: 'linear-gradient(135deg, #A5B4FC, #6366F1)',
    textColor: '#E0E7FF',
    icon: CrystalIcon,
  },
  human: {
    tagline: 'People are the product.',
    gradient: 'linear-gradient(145deg, #FFFBF0 0%, #FFF3D6 50%, #FFEABD 100%)',
    accent: '#D97706',
    accentSoft: '#FFF8EB',
    iconGradient: 'linear-gradient(135deg, #FBBF24, #D97706)',
    textColor: '#451A03',
    icon: SunHandIcon,
  },
  'the-studio': {
    tagline: 'We create beautiful things.',
    gradient: 'linear-gradient(145deg, #FAFAFA 0%, #F5F5F5 50%, #EEEEEE 100%)',
    accent: '#18181B',
    accentSoft: '#F4F4F5',
    iconGradient: 'linear-gradient(135deg, #3F3F46, #18181B)',
    textColor: '#18181B',
    icon: PaletteIcon,
  },
  'the-machine': {
    tagline: 'Performance is everything.',
    gradient: 'linear-gradient(145deg, #052E16 0%, #064E3B 50%, #052E16 100%)',
    accent: '#34D399',
    accentSoft: '#0D3D2E',
    iconGradient: 'linear-gradient(135deg, #6EE7B7, #10B981)',
    textColor: '#D1FAE5',
    icon: GearIcon,
  },
  'the-club': {
    tagline: 'We shape culture.',
    gradient: 'linear-gradient(145deg, #1A0026 0%, #2D004D 50%, #1A0026 100%)',
    accent: '#E879F9',
    accentSoft: '#2D0040',
    iconGradient: 'linear-gradient(135deg, #F0ABFC, #C026D3)',
    textColor: '#FAE8FF',
    icon: DiscoBallIcon,
  },
  'the-builder': {
    tagline: 'I build every day.',
    gradient: 'linear-gradient(145deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
    accent: '#475569',
    accentSoft: '#F1F5F9',
    iconGradient: 'linear-gradient(135deg, #64748B, #475569)',
    textColor: '#1E293B',
    icon: HammerIcon,
  },
  'the-visionary': {
    tagline: "I see what's next.",
    gradient: 'linear-gradient(145deg, #0C0C0C 0%, #1A1A1A 50%, #0C0C0C 100%)',
    accent: '#F5C542',
    accentSoft: '#1F1A0A',
    iconGradient: 'linear-gradient(135deg, #FDE68A, #F59E0B)',
    textColor: '#FEFCE8',
    icon: TelescopeIcon,
  },
  'the-hustler': {
    tagline: 'I move fast.',
    gradient: 'linear-gradient(145deg, #1C1210 0%, #2A1810 50%, #1C1210 100%)',
    accent: '#F97316',
    accentSoft: '#2D1A0A',
    iconGradient: 'linear-gradient(135deg, #FB923C, #EA580C)',
    textColor: '#FFF7ED',
    icon: FlameIcon,
  },
  'the-aesthete': {
    tagline: 'My world is my canvas.',
    gradient: 'linear-gradient(145deg, #FAF5EF 0%, #F5EBE0 50%, #EDDFCF 100%)',
    accent: '#92734A',
    accentSoft: '#F5EFE6',
    iconGradient: 'linear-gradient(135deg, #C4A265, #92734A)',
    textColor: '#3D2B1F',
    icon: DiamondIcon,
  },
  'the-creator': {
    tagline: 'I turn ideas into content.',
    gradient: 'linear-gradient(145deg, #0F0A1E 0%, #1E1340 50%, #0F0A1E 100%)',
    accent: '#A78BFA',
    accentSoft: '#1A1035',
    iconGradient: 'linear-gradient(135deg, #C4B5FD, #7C3AED)',
    textColor: '#EDE9FE',
    icon: CameraIcon,
  },
  'the-voice': {
    tagline: 'I have something to say.',
    gradient: 'linear-gradient(145deg, #F9FAFB 0%, #F3F4F6 50%, #E5E7EB 100%)',
    accent: '#374151',
    accentSoft: '#F3F4F6',
    iconGradient: 'linear-gradient(135deg, #6B7280, #374151)',
    textColor: '#111827',
    icon: QuillIcon,
  },
};

/* ═══════════════════════════════════════════════════════════════
   CATEGORY DESIGN
   ═══════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { id: 'individual', title: 'Individual',  subtitle: 'For the self-made', question: 'What drives you?' },
  { id: 'startup',    title: 'Startup',     subtitle: 'For the venture',   question: 'What defines your company?' },
  { id: 'agency',     title: 'Agency',      subtitle: 'For the team',      question: "What is your agency's DNA?" },
  { id: 'entrepreneur', title: 'Entrepreneur', subtitle: 'For the builder', question: 'How do you build?' },
  { id: 'influencer', title: 'Influencer',  subtitle: 'For the voice',     question: 'What is your platform?' },
];

/* ═══════════════════════════════════════════════════════════════
   TILT CARD — 3D perspective effect on hover
   ═══════════════════════════════════════════════════════════════ */

function TiltCard({ children, className, style, onClick, disabled }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reducedMotion = useReducedMotion();

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reducedMotion || disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        ...style,
        rotateX: reducedMotion ? 0 : rotateX,
        rotateY: reducedMotion ? 0 : rotateY,
        transformPerspective: 800,
        transformStyle: 'preserve-3d',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE CARD — Individual template selection card
   ═══════════════════════════════════════════════════════════════ */

function TemplateCard({
  template,
  isSelected,
  onPreview,
  onSelect,
  index,
}: {
  template: TemplateMeta;
  isSelected: boolean;
  onPreview: () => void;
  onSelect: () => void;
  index: number;
}) {
  const design = PERSONA_DESIGN[template.id] || PERSONA_DESIGN.lover;
  const Icon = design.icon;
  const isDark = design.textColor.startsWith('#F') || design.textColor.startsWith('#E') || design.textColor.startsWith('#D') || design.textColor === '#FFFFFF';

  return (
    <TiltCard
      onClick={onPreview}
      className="group relative cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24, delay: index * 0.06 }}
        className="relative rounded-[20px] overflow-hidden h-full"
        style={{
          background: design.gradient,
          border: isSelected ? `2px solid ${design.accent}` : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: isSelected
            ? `0 0 0 3px ${design.accent}30, 0 8px 32px ${design.accent}20`
            : `0 2px 12px rgba(0,0,0,0.06)`,
        }}
      >
        {/* Shimmer overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${design.accent}08 45%, ${design.accent}15 50%, ${design.accent}08 55%, transparent 60%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s ease-in-out infinite',
          }}
        />

        <div className="relative p-6 flex flex-col h-full min-h-[240px]">
          {/* Icon + Name */}
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: design.iconGradient }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: design.accent }}
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </div>

          {/* Template name */}
          <h3
            className="text-lg font-bold tracking-tight mb-1"
            style={{ color: design.textColor }}
          >
            {template.name}
          </h3>

          {/* Tagline */}
          <p
            className="text-sm font-medium mb-3 leading-relaxed"
            style={{ color: design.accent, opacity: 0.9 }}
          >
            "{design.tagline}"
          </p>

          {/* Description */}
          <p
            className="text-xs leading-relaxed line-clamp-2 mb-auto"
            style={{ color: design.textColor, opacity: 0.55 }}
          >
            {template.description}
          </p>

          {/* Action area */}
          <div className="flex items-center gap-2 mt-5 pt-4" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` }}>
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              className="flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 opacity-70 group-hover:opacity-100"
              style={{ color: design.textColor }}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>

            <div className="flex-1" />

            <button
              onClick={(e) => { e.stopPropagation(); if (!isSelected) onSelect(); }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5",
                isSelected ? "scale-100" : "group-hover:scale-[1.02] active:scale-95"
              )}
              style={{
                background: isSelected ? design.accent : `${design.accent}18`,
                color: isSelected ? '#fff' : design.accent,
                boxShadow: isSelected ? `0 2px 12px ${design.accent}40` : 'none',
              }}
            >
              {isSelected ? (
                <>
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Active
                </>
              ) : (
                <>
                  Use This
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </TiltCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PREVIEW OVERLAY — Full-screen template preview
   ═══════════════════════════════════════════════════════════════ */

function PreviewOverlay({
  template,
  profileData,
  accentColor,
  onClose,
  onSelect,
  isOpen,
}: any) {
  const reducedMotion = useReducedMotion();
  const [isLoading, setIsLoading] = React.useState(true);
  const design = PERSONA_DESIGN[template?.id] || PERSONA_DESIGN.lover;

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, template?.id]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !template) return null;

  const Icon = design.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0.01 : 0.25 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(20px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reducedMotion ? {} : { opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl flex flex-col mx-4"
          style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <ChevronLeft className="w-5 h-5 text-zinc-400" />
              </button>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: design.iconGradient }}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white truncate">{template.name}</h2>
                <p className="text-xs text-zinc-500 truncate">"{design.tagline}"</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
              <button
                onClick={onSelect}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110"
                style={{ background: design.iconGradient, boxShadow: `0 2px 16px ${design.accent}40` }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Use This Identity
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="relative flex-1 overflow-y-auto" style={{ background: '#050505' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-[500px]">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse"
                    style={{ background: design.iconGradient }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs text-zinc-600">Rendering preview...</p>
                </div>
              </div>
            ) : (
              <div className="h-[75vh] min-h-[500px]">
                <ProfilePreview
                  templateId={template.id}
                  profile={profileData || {
                    name: 'Your Name', headline: 'Your headline goes here',
                    bio: 'This is a live preview of how your profile will look with this template.',
                    avatarUrl: '', subdomain: 'preview', links: [], proofs: [], openTo: [],
                  }}
                  accentColor={accentColor || design.accent}
                  isPreview={true}
                  className="h-full w-full"
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CATEGORY TAB BAR — Horizontal scrollable category filter
   ═══════════════════════════════════════════════════════════════ */

function CategoryTabs({
  activeCategory,
  onChange,
  templates,
  selectedTemplate,
  colors,
}: {
  activeCategory: string;
  onChange: (id: string) => void;
  templates: TemplateMeta[];
  selectedTemplate: string;
  colors: { text: string; textMuted: string; border: string; accent: string; bg: string };
}) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto no-scrollbar" style={{ backgroundColor: `${colors.bg}` }}>
      {CATEGORIES.map(cat => {
        const isActive = activeCategory === cat.id;
        const count = templates.filter(t => t.category === cat.id).length;
        const hasSelected = templates.some(t => t.category === cat.id && t.id === selectedTemplate);

        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200",
              isActive ? "shadow-sm" : "hover:opacity-80"
            )}
            style={{
              backgroundColor: isActive ? colors.accent + '12' : 'transparent',
              color: isActive ? colors.text : colors.textMuted,
              border: isActive ? `1px solid ${colors.accent}25` : '1px solid transparent',
            }}
          >
            {cat.title}
            <span
              className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
              style={{
                backgroundColor: isActive ? colors.accent + '15' : colors.border + '60',
                color: isActive ? colors.accent : colors.textMuted,
              }}
            >
              {count}
            </span>
            {hasSelected && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: colors.accent }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHIMMER ANIMATION
   ═══════════════════════════════════════════════════════════════ */

const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE GALLERY — Main export
   ═══════════════════════════════════════════════════════════════ */

interface TemplateGalleryProps {
  templates: TemplateMeta[];
  selectedTemplate: string;
  onSelect: (templateId: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
  profileData?: any;
  accentColor?: string;
}

export function TemplateGallery({
  templates,
  selectedTemplate,
  onSelect,
  onClose,
  isOpen = true,
  profileData,
  accentColor,
}: TemplateGalleryProps) {
  const reducedMotion = useReducedMotion();
  const [previewTemplate, setPreviewTemplate] = React.useState<TemplateMeta | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState('individual');

  // Biscuit design system colors (matching PresenceClient)
  const B = {
    bg: '#F7F3ED',
    card: '#FFFDF9',
    text: '#3D2B1F',
    textMuted: '#8B7355',
    accent: '#C4A265',
    border: '#E8E0D4',
  };

  const handlePreview = (template: TemplateMeta) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setTimeout(() => setPreviewTemplate(null), reducedMotion ? 0 : 250);
  };

  const handleSelectFromPreview = () => {
    if (previewTemplate) onSelect(previewTemplate.id);
    handleClosePreview();
  };

  const filteredTemplates = templates.filter(t => t.category === activeCategory);

  if (!isOpen) return null;

  return (
    <>
      <style>{shimmerKeyframes}</style>

      <div className="space-y-5">
        {/* Category Tabs */}
        <CategoryTabs
          activeCategory={activeCategory}
          onChange={setActiveCategory}
          templates={templates}
          selectedTemplate={selectedTemplate}
          colors={B}
        />

        {/* Category Header */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-lg font-bold" style={{ color: B.text }}>
              {CATEGORIES.find(c => c.id === activeCategory)?.question}
            </p>
            <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>
              {CATEGORIES.find(c => c.id === activeCategory)?.subtitle} · {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} available
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Template Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredTemplates.map((template, i) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate === template.id}
                onPreview={() => handlePreview(template)}
                onSelect={() => onSelect(template.id)}
                index={i}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Preview Overlay */}
      {previewTemplate && (
        <PreviewOverlay
          template={previewTemplate}
          profileData={profileData}
          accentColor={accentColor}
          onClose={handleClosePreview}
          onSelect={handleSelectFromPreview}
          isOpen={isPreviewOpen}
        />
      )}
    </>
  );
}

export default TemplateGallery;