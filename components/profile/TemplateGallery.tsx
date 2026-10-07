'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateMeta } from '@/components/profile/templates/types';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Check, X, ChevronLeft, Sparkles, Eye } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   CATEGORIES
   ═══════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { id: 'individual',   label: 'Individual' },
  { id: 'startup',      label: 'Startup' },
  { id: 'agency',       label: 'Agency' },
  { id: 'entrepreneur', label: 'Entrepreneur' },
  { id: 'influencer',   label: 'Influencer' },
];

/* ═══════════════════════════════════════════════════════════════
   LIVE PREVIEW CARD
   Renders the actual template at a miniature scale inside a
   framed container so users can SEE their profile in each style.
   ═══════════════════════════════════════════════════════════════ */

const PREVIEW_WIDTH = 1280;
const PREVIEW_HEIGHT = 800;

function LivePreviewCard({
  template,
  isSelected,
  onSelect,
  onPreview,
  profileData,
  accentColor,
  index,
}: {
  template: TemplateMeta;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  profileData: any;
  accentColor?: string;
  index: number;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.25);
  const reducedMotion = useReducedMotion();

  // Calculate scale to fit the preview into the container
  React.useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setScale(containerWidth / PREVIEW_WIDTH);
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      initial={reducedMotion ? {} : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: index * 0.05 }}
      className="group flex flex-col"
    >
      {/* Preview Frame */}
      <div
        ref={containerRef}
        onClick={onPreview}
        className={cn(
          "relative w-full rounded-xl overflow-hidden cursor-pointer transition-all duration-300",
          isSelected
            ? "ring-[3px] ring-offset-2 shadow-lg"
            : "ring-1 hover:ring-2 hover:shadow-md"
        )}
        style={{
          aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}`,
          ringColor: isSelected ? '#C4A265' : undefined,
          borderColor: isSelected ? '#C4A265' : '#E8E0D4',
          ['--tw-ring-color' as any]: isSelected ? '#C4A265' : '#D4CBC0',
          ['--tw-ring-offset-color' as any]: '#F7F3ED',
        }}
      >
        {/* Scaled-down live template render */}
        <div
          style={{
            width: PREVIEW_WIDTH,
            height: PREVIEW_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <ProfilePreview
            templateId={template.id}
            profile={profileData}
            accentColor={accentColor}
            isPreview={true}
          />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2"
          >
            <span
              className="px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-1.5"
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              Full Preview
            </span>
          </motion.div>
        </div>

        {/* Selected badge */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: '#C4A265' }}
          >
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </div>

      {/* Card footer — name + action */}
      <div className="flex items-center justify-between mt-3 px-0.5">
        <div className="min-w-0">
          <h4
            className="text-sm font-semibold truncate"
            style={{ color: '#3D2B1F' }}
          >
            {template.name}
          </h4>
          <p
            className="text-[11px] truncate mt-0.5"
            style={{ color: '#8B7355' }}
          >
            {template.description?.split('.')[0]}
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={cn(
            "shrink-0 ml-3 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
            isSelected
              ? "text-white shadow-sm"
              : "hover:shadow-sm active:scale-95"
          )}
          style={{
            backgroundColor: isSelected ? '#C4A265' : '#F5EFE2',
            color: isSelected ? '#fff' : '#6B5744',
          }}
        >
          {isSelected ? 'Active' : 'Use This'}
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PREVIEW OVERLAY — Full-screen immersive template preview
   ═══════════════════════════════════════════════════════════════ */

function PreviewOverlay({
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
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 300);
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0.01 : 0.2 }}
        className="fixed inset-0 z-[100]"
        style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(24px)' }}
        onClick={onClose}
      >
        {/* Floating top bar */}
        <motion.div
          initial={reducedMotion ? {} : { y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-3"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white/70" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-white">{template.name}</h2>
              <p className="text-[11px] text-white/40">{template.description?.split('.')[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:bg-white/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #C4A265, #A68B52)',
                boxShadow: '0 4px 20px rgba(196,162,101,0.35)',
              }}
            >
              <Sparkles className="w-4 h-4" />
              Use This Template
            </button>
          </div>
        </motion.div>

        {/* Full preview */}
        <motion.div
          initial={reducedMotion ? {} : { scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={reducedMotion ? {} : { scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 250 }}
          className="w-full h-full overflow-y-auto pt-14"
          onClick={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
                <p className="text-xs text-white/30">Rendering preview...</p>
              </div>
            </div>
          ) : (
            <ProfilePreview
              templateId={template.id}
              profile={profileData || {
                name: 'Your Name', headline: 'Your headline',
                bio: 'Preview of your profile with this template.',
                avatarUrl: '', subdomain: 'preview', links: [], proofs: [], openTo: [],
              }}
              accentColor={accentColor}
              isPreview={true}
              className="min-h-screen"
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

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
  const [activeCategory, setActiveCategory] = React.useState(() => {
    // Start on the category of the currently selected template
    const current = templates.find(t => t.id === selectedTemplate);
    return current?.category || 'individual';
  });

  const handlePreview = (template: TemplateMeta) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setTimeout(() => setPreviewTemplate(null), reducedMotion ? 0 : 200);
  };

  const handleSelectFromPreview = () => {
    if (previewTemplate) onSelect(previewTemplate.id);
    handleClosePreview();
  };

  const filteredTemplates = templates.filter(t => t.category === activeCategory);

  // Build the preview profile data with proper shape for templates
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
    seo: { title: profileData?.name || 'Profile', description: profileData?.headline || '', image: null },
  }), [profileData, accentColor]);

  if (!isOpen) return null;

  return (
    <>
      <div className="space-y-5">
        {/* Category pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            const count = templates.filter(t => t.category === cat.id).length;
            const hasActiveTemplate = templates.some(t => t.category === cat.id && t.id === selectedTemplate);

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200",
                  isActive ? "shadow-sm" : "hover:opacity-80"
                )}
                style={{
                  backgroundColor: isActive ? '#3D2B1F' : '#F0EBE3',
                  color: isActive ? '#FFFDF9' : '#8B7355',
                }}
              >
                {cat.label}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
                    color: isActive ? 'rgba(255,255,255,0.7)' : '#A69279',
                  }}
                >
                  {count}
                </span>
                {hasActiveTemplate && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#C4A265' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Template grid with live previews */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {filteredTemplates.map((template, i) => (
              <LivePreviewCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate === template.id}
                onSelect={() => onSelect(template.id)}
                onPreview={() => handlePreview(template)}
                profileData={{ ...previewProfile, theme: { ...previewProfile.theme, template: template.id } }}
                accentColor={accentColor}
                index={i}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Full-screen preview overlay */}
      <PreviewOverlay
        template={previewTemplate}
        profileData={previewProfile}
        accentColor={accentColor}
        onClose={handleClosePreview}
        onSelect={handleSelectFromPreview}
        isOpen={isPreviewOpen}
      />
    </>
  );
}

export default TemplateGallery;