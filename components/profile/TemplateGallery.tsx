'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateMeta } from '@/components/profile/templates/types';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import { Flex, Stack, Box } from '@/components/ui/layout';
import { Heading, Text, Overline } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { spring, slideUp } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { X, ChevronLeft, ChevronRight, Check, ArrowUpRight, Loader2 } from 'lucide-react';

interface TemplateGalleryProps {
  templates: TemplateMeta[];
  selectedTemplate: string;
  onSelect: (templateId: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
  profileData?: {
    name: string;
    headline: string;
    bio: string;
    avatarUrl: string;
    subdomain: string;
    links: Array<{ id: string; label: string; url: string; icon?: string; isVisible: boolean }>;
    proofs: Array<{ id: string; title: string; value?: string; icon?: string }>;
  };
  accentColor?: string;
}

interface TemplateCardProps {
  template: TemplateMeta;
  isSelected: boolean;
  onPreview: () => void;
  onSelect: () => void;
  previewImage: string;
}

const PERSONA_INFO: Record<string, { icon: string; tagline: string; color: string }> = {
  student: {
    icon: '🎓',
    tagline: 'Clean resume for students',
    color: 'oklch(0.6 0.18 260)',
  },
  founder: {
    icon: '🚀',
    tagline: 'Authority & metrics for founders',
    color: 'oklch(0.65 0.22 280)',
  },
  creator: {
    icon: '🎨',
    tagline: 'Feed-style for content creators',
    color: 'oklch(0.65 0.22 340)',
  },
  developer: {
    icon: '💻',
    tagline: 'Terminal/IDE for developers',
    color: 'oklch(0.65 0.18 150)',
  },
  minimalist: {
    icon: '⚡',
    tagline: 'Pure links, zero chrome',
    color: 'oklch(0.6 0.25 50)',
  },
  ngo: {
    icon: '🌱',
    tagline: 'Mission-driven with impact metrics',
    color: 'oklch(0.55 0.22 145)',
  },
  'premium-opaque': {
    icon: '💎',
    tagline: 'Dark premium with glassmorphism',
    color: 'oklch(0.75 0.18 85)',
  },
  'glossy-premium': {
    icon: '✨',
    tagline: 'Ultra-glossy reflective premium',
    color: 'oklch(0.8 0.18 300)',
  },
};

function TemplateCard({ template, isSelected, onPreview, onSelect, previewImage }: TemplateCardProps) {
  const reducedMotion = useReducedMotion();
  const persona = PERSONA_INFO[template.id] || PERSONA_INFO.student;
  const springConfig = reducedMotion ? { type: 'tween' as const, duration: 0.01 } : spring.gentle;

  return (
    <motion.div
      initial={reducedMotion ? {} : { opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springConfig as any}
      className="relative group"
    >
      <div className="relative rounded-2xl overflow-hidden border bg-card transition-all duration-300" style={{ borderColor: isSelected ? persona.color : 'var(--border)', boxShadow: isSelected ? `0 0 0 2px ${persona.color}40, 0 20px 40px -20px ${persona.color}30` : 'none' }}>
        {/* Preview Image */}
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          <img
            src={previewImage}
            alt={template.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          {/* Fallback gradient preview */}
          <div className="hidden absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${persona.color}15, ${persona.color}05)` }}>
            <span className="text-6xl">{persona.icon}</span>
          </div>
        </div>

        {/* Selected indicator overlay */}
        <AnimatePresence mode="wait">
          {isSelected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ background: `linear-gradient(135deg, ${persona.color}15, ${persona.color}05)` }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ ...spring.bouncy }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: persona.color, color: 'white' }}
              >
                <Check className="w-8 h-8" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="p-5 space-y-3">
          <Flex between className="items-start">
            <Stack space={1} align="start">
              <Flex gap={2} className="items-center">
                <span className="text-2xl" aria-hidden="true">{persona.icon}</span>
                <Heading as="h3" level={3} className="truncate max-w-[180px]" style={{ fontFamily: 'var(--font-sans)' }}>
                  {template.name}
                </Heading>
              </Flex>
              <Text size="sm" color="muted" className="max-w-[180px]" style={{ fontFamily: 'var(--font-sans)' }}>
                {persona.tagline}
              </Text>
            </Stack>
            <Badge variant={isSelected ? 'default' : 'secondary'} size="sm" className="shrink-0" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem' }}>
              {isSelected ? <Check className="w-3 h-3 mr-1" /> : ''} {isSelected ? 'Selected' : 'Preview'}
            </Badge>
          </Flex>

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <Flex gap={1.5} wrap className="mt-2">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" size="sm" className="gap-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', borderColor: `${persona.color}40` }}>
                  {tag}
                </Badge>
              ))}
            </Flex>
          )}

          {/* Action Buttons */}
          <Flex gap={2} className="pt-2">
            <Button
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={onSelect}
              disabled={isSelected}
              style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem' }}
            >
              {isSelected ? (
                <Flex gap={1.5} center>
                  <Check className="w-3.5 h-3.5" />
                  Using This Template
                </Flex>
              ) : (
                'Use This Template'
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10"
              onClick={onPreview}
              aria-label={`Preview ${template.name} template`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Flex>
        </div>
      </div>
    </motion.div>
  );
}

function PreviewOverlay({
  template,
  profileData,
  accentColor,
  onClose,
  onSelect,
  isOpen,
}: {
  template: TemplateMeta;
  profileData?: TemplateGalleryProps['profileData'];
  accentColor?: string;
  onClose: () => void;
  onSelect: () => void;
  isOpen: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const [isLoading, setIsLoading] = React.useState(true);
  const persona = PERSONA_INFO[template.id] || PERSONA_INFO.student;

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate template loading
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, template.id]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        // Focus trap would go here in production
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mockProfile = profileData || {
    name: 'Alex Chen',
    headline: 'Building the future of link-in-bio',
    bio: 'Full-stack developer passionate about clean code, great design, and developer experience. Currently working on Unool — the best link-in-bio platform.',
    avatarUrl: '',
    subdomain: 'alexchen',
    links: [
      { id: '1', label: 'GitHub', url: 'https://github.com', icon: '⌘', isVisible: true },
      { id: '2', label: 'Twitter', url: 'https://twitter.com', icon: '𝕏', isVisible: true },
      { id: '3', label: 'LinkedIn', url: 'https://linkedin.com', icon: 'in', isVisible: true },
      { id: '4', label: 'Portfolio', url: 'https://alexchen.dev', icon: '🌐', isVisible: true },
      { id: '5', label: 'Email', url: 'mailto:alex@alexchen.dev', icon: '✉️', isVisible: true },
    ],
    proofs: [
      { id: '1', title: 'Repositories', value: '42', icon: '📦' },
      { id: '2', title: 'Stars', value: '1.2k', icon: '⭐' },
      { id: '3', title: 'Followers', value: '847', icon: '👥' },
    ],
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0.01 : 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
      >
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl"
          style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--background)', backdropFilter: 'blur(8px)' }}>
            <Flex gap={3} align="center" className="min-w-0 flex-1">
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Back to templates" className="shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-0">
                <Overline className="uppercase tracking-wider" style={{ color: persona.color, fontFamily: 'var(--font-mono)', fontSize: '0.625rem' }}>
                  LIVE PREVIEW
                </Overline>
                <Heading id="preview-title" as="h2" level={2} className="truncate" style={{ fontFamily: 'var(--font-sans)' }}>
                  {template.name}
                </Heading>
              </div>
            </Flex>
            <Flex gap={2} align="center">
              <Button variant="outline" size="sm" onClick={onClose} className="hidden sm:flex" style={{ fontFamily: 'var(--font-sans)' }}>
                <X className="w-3.5 h-3.5 mr-1.5" />
                Close
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onSelect}
                className="shrink-0"
                style={{ fontFamily: 'var(--font-sans)', background: persona.color, borderColor: persona.color }}
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Use This Template
              </Button>
            </Flex>
          </div>

          {/* Mobile header */}
          <div className="sm:hidden sticky top-0 z-10 flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)', background: 'var(--background)', backdropFilter: 'blur(8px)' }}>
            <Flex gap={2} align="center">
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Back to templates">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Heading as="h2" level={3} className="truncate" style={{ fontFamily: 'var(--font-sans)' }}>
                {template.name}
              </Heading>
            </Flex>
            <Button variant="default" size="sm" onClick={onSelect} style={{ fontFamily: 'var(--font-sans)', background: persona.color, borderColor: persona.color }}>
              Use This
            </Button>
          </div>

          {/* Preview Content */}
          <div className="relative overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[calc(90vh-80px)]" style={{ background: 'var(--background)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]" style={{ background: 'var(--background)' }}>
                <Flex gap={3} align="center" center>
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: persona.color }} />
                  <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>
                    Loading preview...
                  </Text>
                </Flex>
              </div>
            ) : (
              <ProfilePreview
                templateId={template.id}
                profile={mockProfile}
                accentColor={accentColor || persona.color}
                isPreview={true}
                className="min-h-[400px]"
              />
            )}
          </div>

          {/* Bottom indicator on mobile */}
          <div className="sm:hidden sticky bottom-0 z-10 px-4 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--background)', backdropFilter: 'blur(8px)' }}>
            <Flex center gap={2} className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
              <span>Swipe down or press ESC to close</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-90 animate-bounce" style={{ color: 'var(--muted-foreground)' }} />
            </Flex>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
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

  const springConfig = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.gentle;

  const handlePreview = (template: TemplateMeta) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setTimeout(() => setPreviewTemplate(null), reducedMotion ? 0 : 200);
  };

  const handleSelectFromPreview = () => {
    if (previewTemplate) {
      onSelect(previewTemplate.id);
    }
    handleClosePreview();
  };

  const previewImages: Record<string, string> = {
    student: '/templates/previews/student.svg',
    founder: '/templates/previews/founder.svg',
    creator: '/templates/previews/creator.svg',
    developer: '/templates/previews/developer.svg',
    minimalist: '/templates/previews/minimalist.svg',
    ngo: '/templates/previews/ngo.svg',
    'premium-opaque': '/templates/previews/premium-opaque.svg',
    'glossy-premium': '/templates/previews/glossy-premium.svg',
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Gallery Grid */}
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.standard, delay: 0.1 }}
        className="w-full max-w-6xl mx-auto"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Stack space={1} align="start">
              <Overline className="uppercase tracking-wider" style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>
                Choose Your Template
              </Overline>
              <Heading as="h1" level={1} style={{ fontFamily: 'var(--font-display)' }}>
                Pick the style that matches your vibe
              </Heading>
            </Stack>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close template gallery">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Text size="lg" color="muted" className="max-w-2xl" style={{ fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
            Each template is designed for a specific persona. Preview live with your content before committing.
          </Text>
        </div>

        {/* Template Grid */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.3, delay: 0.2 }}
          className="grid gap-5"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gridAutoRows: '1fr',
          }}
        >
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.1 + index * 0.06 }}
            >
              <TemplateCard
                template={template}
                isSelected={selectedTemplate === template.id}
                onPreview={() => handlePreview(template)}
                onSelect={() => onSelect(template.id)}
                previewImage={previewImages[template.id] || previewImages.student}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Selected Template Summary */}
        {selectedTemplate && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.4 }}
            className="mt-8 p-4 rounded-xl border bg-card/50"
            style={{ borderColor: 'var(--border)' }}
          >
            <Flex between align="center" wrap gap={3}>
              <Flex gap={3} align="center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: PERSONA_INFO[selectedTemplate]?.color + '20' }}>
                  <span className="text-xl" aria-hidden="true">{PERSONA_INFO[selectedTemplate]?.icon || '✨'}</span>
                </div>
                <Stack space={0.5} align="start">
                  <Flex gap={2} align="center">
                    <Heading as="h3" level={3} style={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                      {templates.find(t => t.id === selectedTemplate)?.name || selectedTemplate}
                    </Heading>
                    <Badge variant="default" size="sm" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', background: PERSONA_INFO[selectedTemplate]?.color, borderColor: PERSONA_INFO[selectedTemplate]?.color }}>
                      SELECTED
                    </Badge>
                  </Flex>
                  <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>
                    {PERSONA_INFO[selectedTemplate]?.tagline || 'Your selected template'}
                  </Text>
                </Stack>
              </Flex>
              <Flex gap={2}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const t = templates.find(t => t.id === selectedTemplate);
                    if (t) {
                      setPreviewTemplate(t);
                      setIsPreviewOpen(true);
                    }
                  }}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  Preview Again
                </Button>
                <Button variant="secondary" size="sm" onClick={onClose} style={{ fontFamily: 'var(--font-sans)' }}>
                  <ChevronLeft className="w-3.5 h-3.5 mr-1.5" />
                  Change Template
                </Button>
              </Flex>
            </Flex>
          </motion.div>
        )}
      </motion.div>

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