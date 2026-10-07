'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateMeta } from '@/components/profile/templates/types';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Check, ChevronLeft, ChevronRight, X, Sparkles, Eye, Maximize2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   CATEGORIES
   ═══════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { id: 'individual',    label: 'Individual' },
  { id: 'startup',       label: 'Startup' },
  { id: 'agency',        label: 'Agency' },
  { id: 'entrepreneur',  label: 'Entrepreneur' },
  { id: 'influencer',    label: 'Influencer' },
];

/* ═══════════════════════════════════════════════════════════════
   PERSONA — Short one-liner per template for the spotlight
   ═══════════════════════════════════════════════════════════════ */

const PERSONA_LABELS: Record<string, string> = {
  lover:          'Romantic, emotional, expressive',
  lone:           'Minimal, mysterious, cinematic',
  energy:         'Bold, ambitious, high-energy',
  rebellion:      'Disruptive, rebellious, premium',
  vision:         'Futuristic, visionary, elegant',
  human:          'Warm, empathetic, people-first',
  'the-studio':   'Clean, refined, design-led',
  'the-machine':  'Data-driven, performance-focused',
  'the-club':     'Cultural, vibrant, community',
  'the-builder':  'Practical, grounded, builder',
  'the-visionary':'Cinematic, grand, forward-thinking',
  'the-hustler':  'Fast-paced, scrappy, energetic',
  'the-aesthete': 'Luxurious, elegant, tasteful',
  'the-creator':  'Creative, visual, content-first',
  'the-voice':    'Authoritative, articulate, clean',
};

/* ═══════════════════════════════════════════════════════════════
   LIVE RENDER — Scales the actual template into a frame
   ═══════════════════════════════════════════════════════════════ */

const RENDER_W = 1440;
const RENDER_H = 900;

function LiveRender({
  templateId,
  profileData,
  accentColor,
  className,
}: {
  templateId: string;
  profileData: any;
  accentColor?: string;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.28);

  React.useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setScale(containerRef.current.offsetWidth / RENDER_W);
      }
    };
    update();
    const obs = new ResizeObserver(update);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: `${RENDER_W} / ${RENDER_H}` }}
    >
      <div
        style={{
          width: RENDER_W,
          height: RENDER_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      >
        <ProfilePreview
          templateId={templateId}
          profile={{ ...profileData, theme: { ...profileData.theme, template: templateId } }}
          accentColor={accentColor}
          isPreview={true}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THUMBNAIL STRIP — Small clickable thumbnails below spotlight
   ═══════════════════════════════════════════════════════════════ */

function ThumbnailStrip({
  templates,
  activeIndex,
  onSelect,
  selectedTemplate,
  profileData,
  accentColor,
}: {
  templates: TemplateMeta[];
  activeIndex: number;
  onSelect: (idx: number) => void;
  selectedTemplate: string;
  profileData: any;
  accentColor?: string;
}) {
  return (
    <div className="flex gap-2.5 justify-center mt-5">
      {templates.map((t, i) => {
        const isActive = i === activeIndex;
        const isChosen = t.id === selectedTemplate;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(i)}
            className={cn(
              "relative rounded-lg overflow-hidden transition-all duration-200 border-2",
              isActive
                ? "border-[#C4A265] shadow-md scale-105"
                : "border-transparent hover:border-[#E8E0D4] opacity-60 hover:opacity-90"
            )}
            style={{ width: 72, height: 45 }}
          >
            <LiveRender
              templateId={t.id}
              profileData={profileData}
              accentColor={accentColor}
            />
            {isChosen && (
              <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C4A265' }}>
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FULLSCREEN PREVIEW — Immersive full-screen view
   ═══════════════════════════════════════════════════════════════ */

function FullscreenPreview({
  template,
  profileData,
  accentColor,
  onClose,
  onSelect,
  isOpen,
}: {
  template: TemplateMeta | null;
  profileData: any;
  accentColor?: string;
  onClose: () => void;
  onSelect: () => void;
  isOpen: boolean;
}) {
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', fn);
      document.body.style.overflow = 'hidden';
    }
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen || !template) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.2 }}
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(24px)' }}
        onClick={onClose}
      >
        {/* Top bar */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-3"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white/60" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-white">{template.name}</h2>
              <p className="text-[11px] text-white/35">{PERSONA_LABELS[template.id]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:bg-white/5">
              <X className="w-3.5 h-3.5" /> Close
            </button>
            <button
              onClick={e => { e.stopPropagation(); onSelect(); }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:brightness-110 transition-all"
              style={{ background: 'linear-gradient(135deg, #C4A265, #A68B52)', boxShadow: '0 4px 20px rgba(196,162,101,0.4)' }}
            >
              <Sparkles className="w-4 h-4" /> Use This Template
            </button>
          </div>
        </div>

        {/* Full template render */}
        <div className="w-full h-full overflow-y-auto pt-14" onClick={e => e.stopPropagation()}>
          <ProfilePreview
            templateId={template.id}
            profile={{ ...profileData, theme: { ...profileData.theme, template: template.id } }}
            accentColor={accentColor}
            isPreview={true}
            className="min-h-screen"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE GALLERY — Spotlight Carousel
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
  isOpen = true,
  profileData,
  accentColor,
}: TemplateGalleryProps) {
  const reducedMotion = useReducedMotion();

  // Fullscreen preview state
  const [fsTemplate, setFsTemplate] = React.useState<TemplateMeta | null>(null);
  const [fsOpen, setFsOpen] = React.useState(false);

  // Active category
  const [activeCategory, setActiveCategory] = React.useState(() => {
    const cur = templates.find(t => t.id === selectedTemplate);
    return cur?.category || 'individual';
  });

  // Spotlight index within category
  const filteredTemplates = templates.filter(t => t.category === activeCategory);
  const [spotlightIdx, setSpotlightIdx] = React.useState(() => {
    const idx = filteredTemplates.findIndex(t => t.id === selectedTemplate);
    return idx >= 0 ? idx : 0;
  });

  // When category changes, reset spotlight
  React.useEffect(() => {
    const filtered = templates.filter(t => t.category === activeCategory);
    const idx = filtered.findIndex(t => t.id === selectedTemplate);
    setSpotlightIdx(idx >= 0 ? idx : 0);
  }, [activeCategory, selectedTemplate, templates]);

  // Direction for slide animation
  const [direction, setDirection] = React.useState(0);

  const spotlightTemplate = filteredTemplates[spotlightIdx] || filteredTemplates[0];
  const isSpotlightSelected = spotlightTemplate?.id === selectedTemplate;

  const navigate = (dir: number) => {
    setDirection(dir);
    setSpotlightIdx(prev => {
      const next = prev + dir;
      if (next < 0) return filteredTemplates.length - 1;
      if (next >= filteredTemplates.length) return 0;
      return next;
    });
  };

  // Profile data for previews
  const previewProfile = React.useMemo(() => ({
    id: 'preview',
    subdomain: profileData?.subdomain || 'preview',
    name: profileData?.name || 'Your Name',
    headline: profileData?.headline || 'Your headline goes here',
    bio: profileData?.bio || 'This is a preview of your profile.',
    role: profileData?.role || '',
    company: profileData?.company || '',
    avatarUrl: profileData?.avatarUrl || '',
    links: profileData?.links || [],
    proofs: profileData?.proofs || [],
    openTo: profileData?.openTo || [],
    theme: { template: '', preset: 'minimal', accentColor: accentColor || '#C4A265', customCss: null },
    socialHandles: profileData?.socialHandles || {},
    seo: { title: profileData?.name || 'Profile', description: '', image: null },
  }), [profileData, accentColor]);

  // Keyboard navigation
  React.useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (fsOpen) return;
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'Enter' && spotlightTemplate) onSelect(spotlightTemplate.id);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [fsOpen, spotlightIdx, filteredTemplates, spotlightTemplate]);

  if (!isOpen || !spotlightTemplate) return null;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.96,
    }),
  };

  return (
    <>
      <div className="space-y-4">
        {/* ── Category Tabs ── */}
        <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto no-scrollbar" style={{ backgroundColor: '#F0EBE3' }}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            const count = templates.filter(t => t.category === cat.id).length;
            if (count === 0) return null;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200",
                  isActive ? "shadow-sm" : "hover:opacity-75"
                )}
                style={{
                  backgroundColor: isActive ? '#3D2B1F' : 'transparent',
                  color: isActive ? '#FFFDF9' : '#8B7355',
                }}
              >
                {cat.label}
                <span
                  className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : '#E8E0D4',
                    color: isActive ? 'rgba(255,255,255,0.6)' : '#A69279',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Spotlight Carousel ── */}
        <div className="relative">
          {/* Main preview frame */}
          <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E0D4', backgroundColor: '#FAF7F2' }}>
            {/* Navigation arrows */}
            {filteredTemplates.length > 1 && (
              <>
                <button
                  onClick={() => navigate(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: 'rgba(255,253,249,0.85)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: '#3D2B1F' }} />
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: 'rgba(255,253,249,0.85)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: '#3D2B1F' }} />
                </button>
              </>
            )}

            {/* Selected badge */}
            {isSpotlightSelected && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: '#C4A265', boxShadow: '0 2px 12px rgba(196,162,101,0.4)' }}
              >
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                Active Template
              </motion.div>
            )}

            {/* Fullscreen button */}
            <button
              onClick={() => { setFsTemplate(spotlightTemplate); setFsOpen(true); }}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{
                backgroundColor: 'rgba(255,253,249,0.8)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              <Maximize2 className="w-3.5 h-3.5" style={{ color: '#3D2B1F' }} />
            </button>

            {/* The live preview — animated slide transition */}
            <div className="relative" style={{ minHeight: 300 }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={spotlightTemplate.id}
                  custom={direction}
                  variants={reducedMotion ? {} : slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <LiveRender
                    templateId={spotlightTemplate.id}
                    profileData={previewProfile}
                    accentColor={accentColor}
                    className="rounded-2xl"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Template info + action bar ── */}
          <div className="flex items-center justify-between mt-4 px-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold" style={{ color: '#3D2B1F' }}>
                  {spotlightTemplate.name}
                </h4>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0EBE3', color: '#8B7355' }}>
                  {spotlightIdx + 1} / {filteredTemplates.length}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#8B7355' }}>
                {PERSONA_LABELS[spotlightTemplate.id] || spotlightTemplate.description?.split('.')[0]}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-4">
              <button
                onClick={() => { setFsTemplate(spotlightTemplate); setFsOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:shadow-sm active:scale-95"
                style={{ color: '#6B5744', backgroundColor: '#F5EFE2' }}
              >
                <Eye className="w-3.5 h-3.5" />
                Full View
              </button>

              <button
                onClick={() => onSelect(spotlightTemplate.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                  isSpotlightSelected
                    ? "text-white"
                    : "hover:shadow-md active:scale-95"
                )}
                style={{
                  backgroundColor: isSpotlightSelected ? '#C4A265' : '#3D2B1F',
                  color: '#fff',
                  boxShadow: isSpotlightSelected ? '0 2px 12px rgba(196,162,101,0.35)' : undefined,
                }}
              >
                {isSpotlightSelected ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Active
                  </>
                ) : (
                  'Use This'
                )}
              </button>
            </div>
          </div>

          {/* ── Thumbnail strip ── */}
          {filteredTemplates.length > 1 && (
            <ThumbnailStrip
              templates={filteredTemplates}
              activeIndex={spotlightIdx}
              onSelect={(idx) => { setDirection(idx > spotlightIdx ? 1 : -1); setSpotlightIdx(idx); }}
              selectedTemplate={selectedTemplate}
              profileData={previewProfile}
              accentColor={accentColor}
            />
          )}
        </div>
      </div>

      {/* Fullscreen overlay */}
      <FullscreenPreview
        template={fsTemplate}
        profileData={previewProfile}
        accentColor={accentColor}
        onClose={() => { setFsOpen(false); setTimeout(() => setFsTemplate(null), 200); }}
        onSelect={() => { if (fsTemplate) onSelect(fsTemplate.id); setFsOpen(false); }}
        isOpen={fsOpen}
      />
    </>
  );
}

export default TemplateGallery;