'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateMeta } from '@/components/profile/templates/types';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import { Flex, Stack, Box } from '@/components/ui/layout';
import { Heading, Text, Overline } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { spring } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { X, ChevronLeft, ChevronRight, Check, ArrowUpRight, Loader2 } from 'lucide-react';

interface TemplateGalleryProps {
  templates: TemplateMeta[];
  selectedTemplate: string;
  onSelect: (templateId: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
  profileData?: any;
  accentColor?: string;
}

const PERSONA_INFO: Record<string, { icon: string; tagline: string; color: string }> = {
  lover: { icon: '❤️', tagline: 'I create from emotion.', color: '#FF7A9A' }, // Soft rose/pink
  lone: { icon: '🌑', tagline: 'I move quietly and build my own world.', color: '#333333' }, // Charcoal
  energy: { icon: '⚡', tagline: 'Discipline. Ambition. Growth.', color: '#FF3B30' }, // Bold red
  
  rebellion: { icon: '🚨', tagline: 'We challenge the industry.', color: '#D92D20' }, // Strong red
  vision: { icon: '🔮', tagline: 'We\'re building what\'s next.', color: '#444CE7' }, // Electric blue
  human: { icon: '🫶', tagline: 'People are the product.', color: '#F79009' }, // Warm yellow/orange
  
  'the-studio': { icon: '🎨', tagline: 'We create beautiful things.', color: '#101828' }, // Minimal black
  'the-machine': { icon: '📊', tagline: 'Performance is everything.', color: '#039855' }, // Precision green
  'the-club': { icon: '🪩', tagline: 'We shape culture.', color: '#E82EE5' }, // Hot pink
  
  'the-builder': { icon: '🔨', tagline: 'I build every day.', color: '#475467' }, // Practical gray
  'the-visionary': { icon: '🔭', tagline: 'I see what\'s next.', color: '#1D2939' }, // Deep cinematic
  'the-hustler': { icon: '🔥', tagline: 'I move fast.', color: '#FF6928' }, // Energetic orange
  
  'the-aesthete': { icon: '✦', tagline: 'My world is my canvas.', color: '#D2B48C' }, // Crean/Tan luxury
  'the-creator': { icon: '🎬', tagline: 'I turn ideas into content.', color: '#7A5AF8' }, // Vibrant purple
  'the-voice': { icon: '✍️', tagline: 'I have something to say.', color: '#344054' }, // Authoritative slate
};

const CATEGORIES = [
  { id: 'individual', title: 'INDIVIDUAL', question: 'What describes you?' },
  { id: 'startup', title: 'STARTUP', question: 'What defines your company?' },
  { id: 'agency', title: 'AGENCY', question: 'What is your agency’s DNA?' },
  { id: 'entrepreneur', title: 'ENTREPRENEUR', question: 'How do you build?' },
  { id: 'influencer', title: 'INFLUENCER', question: 'What is your platform?' }
];

function TemplateCard({ template, isSelected, onPreview, onSelect }: any) {
  const reducedMotion = useReducedMotion();
  const persona = PERSONA_INFO[template.id] || PERSONA_INFO.lover;
  const springConfig = reducedMotion ? { type: 'tween' as const, duration: 0.01 } : spring.gentle;

  return (
    <motion.div
      initial={reducedMotion ? {} : { opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springConfig as any}
      className={cn(
        "relative rounded-2xl overflow-hidden border bg-card transition-all duration-300 cursor-pointer h-full flex flex-col justify-between p-6",
        isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/30 hover:bg-muted/30"
      )}
      onClick={onPreview}
    >
      <Box className="space-y-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-background shadow-sm border" style={{ borderColor: `${persona.color}30` }}>
          <span className="text-2xl" aria-hidden="true">{persona.icon}</span>
        </div>
        <Stack space={1}>
          <Heading as="h3" level={3} className="text-xl" style={{ fontFamily: 'var(--font-sans)', color: persona.color }}>
            {template.name}
          </Heading>
          <Text size="base" className="font-medium">
            "{persona.tagline}"
          </Text>
          <Text size="sm" color="muted" className="mt-2 line-clamp-3 leading-relaxed">
            {template.description}
          </Text>
        </Stack>
      </Box>
      
      <Flex gap={2} className="pt-6 mt-auto">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          disabled={isSelected}
        >
          {isSelected ? (
            <Flex gap={1.5} center><Check className="w-4 h-4" /> Selected</Flex>
          ) : (
            'Commit to Style'
          )}
        </Button>
      </Flex>
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
}: any) {
  const reducedMotion = useReducedMotion();
  const [isLoading, setIsLoading] = React.useState(true);
  const persona = PERSONA_INFO[template.id] || PERSONA_INFO.lover;

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, template.id]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
      >
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
          style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--background)', backdropFilter: 'blur(8px)' }}>
            <Flex gap={3} align="center" className="min-w-0 flex-1">
              <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0 -ml-2">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0">
                <Flex gap={2} align="center">
                  <span className="text-xl">{persona.icon}</span>
                  <Heading id="preview-title" as="h2" level={2} className="truncate" style={{ fontFamily: 'var(--font-sans)' }}>
                    {template.name}
                  </Heading>
                </Flex>
                <Text size="sm" color="muted">"{persona.tagline}"</Text>
              </div>
            </Flex>
            <Flex gap={3} align="center">
              <Button variant="outline" size="sm" onClick={onClose} className="hidden sm:flex">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onSelect}
                className="shrink-0"
              >
                <Check className="w-4 h-4 mr-2" />
                Use This Identity
              </Button>
            </Flex>
          </div>

          {/* Preview Content */}
          <div className="relative flex-1 overflow-y-auto" style={{ background: 'var(--background)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-[500px]" style={{ background: 'var(--background)' }}>
                <Flex gap={3} align="center" center>
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: persona.color }} />
                  <Text size="sm" color="muted">Drafting preview...</Text>
                </Flex>
              </div>
            ) : (
              <div className="h-[70vh] min-h-[500px]">
                 {/* Since ProfilePreview is complicated and needs the exact template code, we will render it fully here. 
                     If the specific template component isn't fully created yet in TemplateProvider, this gracefully falls back. */}
                 <ProfilePreview
                    templateId={template.id}
                    profile={profileData || {
                      name: 'Damon', headline: 'Exploring the art of the possible', bio: 'Creating beautiful digital experiences for the modern world.', avatarUrl: '', subdomain: 'damon', links: [], proofs: []
                    }}
                    accentColor={accentColor || persona.color}
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

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.standard, delay: 0.1 }}
        className="w-full max-w-5xl mx-auto py-8"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <div className="mb-16 text-center">
          <Heading as="h1" level={1} className="text-5xl tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            What kind of creator are you?
          </Heading>
          <Text size="lg" color="muted" className="max-w-2xl mx-auto">
            Your identity is more than a color palette. Choose the template that matches your personality, mindset, and creative vision.
          </Text>
        </div>

        <Stack space={16}>
          {CATEGORIES.map(category => {
            const categoryTemplates = templates.filter(t => t.category === category.id);
            if (categoryTemplates.length === 0) return null;
            
            return (
              <Box key={category.id} className="space-y-6">
                <div className="border-b pb-4">
                  <Overline className="text-primary font-bold tracking-widest text-xs mb-1">
                    {category.title}
                  </Overline>
                  <Heading as="h3" level={3} className="text-2xl text-muted-foreground">
                    {category.question}
                  </Heading>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {categoryTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplate === template.id}
                      onPreview={() => handlePreview(template)}
                      onSelect={() => onSelect(template.id)}
                    />
                  ))}
                </div>
              </Box>
            );
          })}
        </Stack>
      </motion.div>

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