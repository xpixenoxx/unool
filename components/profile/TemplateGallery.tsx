'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateMeta } from '@/components/profile/templates/types';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Check, X, Sparkles, Maximize2, Eye, LayoutTemplate } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   CATEGORIES & PERSONAS
   ═══════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { id: 'individual',    label: 'Individual' },
  { id: 'startup',       label: 'Startup' },
  { id: 'agency',        label: 'Agency' },
  { id: 'entrepreneur',  label: 'Entrepreneur' },
  { id: 'influencer',    label: 'Influencer' },
];

const PERSONA_INFO: Record<string, { label: string; desc: string }> = {
  lover:          { label: 'The Lover', desc: 'Romantic, emotional, expressive' },
  lone:           { label: 'The Lone', desc: 'Minimal, mysterious, cinematic' },
  energy:         { label: 'The Energy', desc: 'Bold, ambitious, high-energy' },
  rebellion:      { label: 'The Rebellion', desc: 'Disruptive, rebellious, premium' },
  vision:         { label: 'The Vision', desc: 'Futuristic, visionary, elegant' },
  human:          { label: 'The Human', desc: 'Warm, empathetic, people-first' },
  'the-studio':   { label: 'The Studio', desc: 'Clean, refined, design-led' },
  'the-machine':  { label: 'The Machine', desc: 'Data-driven, performance-focused' },
  'the-club':     { label: 'The Club', desc: 'Cultural, vibrant, community' },
  'the-builder':  { label: 'The Builder', desc: 'Practical, grounded, builder' },
  'the-visionary':{ label: 'The Visionary', desc: 'Cinematic, grand, forward-thinking' },
  'the-hustler':  { label: 'The Hustler', desc: 'Fast-paced, scrappy, energetic' },
  'the-aesthete': { label: 'The Aesthete', desc: 'Luxurious, elegant, tasteful' },
  'the-creator':  { label: 'The Creator', desc: 'Creative, visual, content-first' },
  'the-voice':    { label: 'The Voice', desc: 'Authoritative, articulate, clean' },
};

/* ═══════════════════════════════════════════════════════════════
   LIVE RENDER — Scales the actual template into a frame
   ═══════════════════════════════════════════════════════════════ */

const RENDER_W = 1280;
const RENDER_H = 800;

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
  const [scale, setScale] = React.useState(0.5);

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
   FULLSCREEN PREVIEW
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
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
              <X className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">{template.name}</h2>
              <p className="text-sm text-white/50">{PERSONA_INFO[template.id]?.desc}</p>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onSelect(); }}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white hover:brightness-110 transition-all"
            style={{ background: 'linear-gradient(135deg, #C4A265, #A68B52)', boxShadow: '0 4px 20px rgba(196,162,101,0.4)' }}
          >
            <Sparkles className="w-4 h-4" /> Use This Template
          </button>
        </div>

        {/* Full template render */}
        <div className="w-full h-full overflow-y-auto pt-20" onClick={e => e.stopPropagation()}>
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
   TEMPLATE GALLERY — Split View Layout
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
  const [fsOpen, setFsOpen] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState(() => {
    const cur = templates.find(t => t.id === selectedTemplate);
    return cur?.category || 'individual';
  });
  
  const filteredTemplates = templates.filter(t => t.category === activeCategory);
  const [previewTemplateId, setPreviewTemplateId] = React.useState<string>(() => {
    return filteredTemplates.find(t => t.id === selectedTemplate)?.id || filteredTemplates[0]?.id;
  });

  // Keep preview in sync if category changes
  React.useEffect(() => {
    const valid = filteredTemplates.find(t => t.id === previewTemplateId);
    if (!valid && filteredTemplates.length > 0) {
      setPreviewTemplateId(filteredTemplates[0].id);
    }
  }, [activeCategory, filteredTemplates, previewTemplateId]);

  const activeTemplate = templates.find(t => t.id === previewTemplateId) || filteredTemplates[0];

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

  if (!isOpen || !activeTemplate) return null;

  const isSelected = selectedTemplate === activeTemplate.id;

  return (
    <>
      <div className="flex flex-col h-full space-y-4">
        
        {/* ── Category Pills (Top) ── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map(cat => {
            const count = templates.filter(t => t.category === cat.id).length;
            if (count === 0) return null;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200",
                  isActive ? "bg-[#3D2B1F] text-[#FFFDF9] shadow-md" : "bg-[#F0EBE3] text-[#8B7355] hover:bg-[#E8E0D4]"
                )}
              >
                {cat.label}
                <span className="ml-2 opacity-60 font-normal">{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Split View ── */}
        <div className="flex flex-col lg:flex-row gap-6 h-[600px] bg-[#FAF7F2] rounded-3xl p-4 border border-[#E8E0D4] shadow-inner">
          
          {/* Left Column: Template List */}
          <div className="w-full lg:w-[280px] flex flex-col gap-2 overflow-y-auto no-scrollbar pr-2 pb-2">
            <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2 ml-2">
              Select a design
            </h3>
            {filteredTemplates.map((t) => {
              const isViewing = t.id === previewTemplateId;
              const isApplied = t.id === selectedTemplate;
              const info = PERSONA_INFO[t.id] || { label: t.name, desc: t.description };

              return (
                <button
                  key={t.id}
                  onClick={() => setPreviewTemplateId(t.id)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-2xl transition-all duration-200 border",
                    isViewing 
                      ? "bg-white border-[#C4A265] shadow-[0_4px_20px_rgba(196,162,101,0.15)] ring-1 ring-[#C4A265]/50" 
                      : "bg-transparent border-transparent hover:bg-white/60"
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-bold text-[#3D2B1F]">{info.label}</span>
                    {isApplied && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#C4A265]">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8B7355] leading-tight pr-4">
                    {info.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Large Live Preview */}
          <div className="flex-1 relative bg-white rounded-2xl border border-[#E8E0D4] overflow-hidden flex flex-col shadow-sm">
            
            {/* Top Bar inside the preview area */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E0D4] bg-[#FFFDF9] z-10">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-[#C4A265]" />
                <h4 className="text-sm font-bold text-[#3D2B1F]">
                  {activeTemplate.name}
                </h4>
                {isSelected && (
                  <span className="ml-2 text-[10px] font-bold text-[#C4A265] bg-[#C4A265]/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    Currently Applied
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setFsOpen(true)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#F0EBE3] text-[#8B7355] hover:bg-[#E8E0D4] hover:text-[#3D2B1F] transition-colors"
                  title="Full Screen Preview"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelect(activeTemplate.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    isSelected
                      ? "bg-[#3D2B1F] text-white opacity-50 cursor-not-allowed"
                      : "bg-[#C4A265] text-white hover:brightness-110 shadow-md shadow-[#C4A265]/20"
                  )}
                  disabled={isSelected}
                >
                  {isSelected ? 'Applied' : 'Apply Design'}
                </button>
              </div>
            </div>

            {/* The actual live render */}
            <div className="flex-1 relative bg-[#F7F3ED] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTemplate.id}
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <LiveRender
                    templateId={activeTemplate.id}
                    profileData={previewProfile}
                    accentColor={accentColor}
                    className="w-full h-full"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            
          </div>

        </div>
      </div>

      <FullscreenPreview
        template={activeTemplate}
        profileData={previewProfile}
        accentColor={accentColor}
        onClose={() => setFsOpen(false)}
        onSelect={() => { onSelect(activeTemplate.id); setFsOpen(false); }}
        isOpen={fsOpen}
      />
    </>
  );
}

export default TemplateGallery;