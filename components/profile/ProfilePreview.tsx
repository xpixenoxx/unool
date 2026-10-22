'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TemplateProps } from '@/components/profile/templates/types';
import { TemplateSkeleton, getSkeletonCategory } from '@/components/profile/templates/TemplateSkeletons';

// Map template IDs to their components for dynamic loading
// Each template is now in its own file for better code-splitting and maintainability
const templateComponents: Record<string, React.LazyExoticComponent<React.ComponentType<TemplateProps & { templateId: string }>>> = {
  // Individual
  'lover': React.lazy(() => import('@/components/profile/templates/persona/lover').then(m => ({ default: m.LoverTemplate }))),
  'lone': React.lazy(() => import('@/components/profile/templates/persona/lone').then(m => ({ default: m.LoneTemplate }))),
  'energy': React.lazy(() => import('@/components/profile/templates/persona/energy').then(m => ({ default: m.EnergyTemplate }))),
  // Startup
  'rebellion': React.lazy(() => import('@/components/profile/templates/persona/rebellion').then(m => ({ default: m.RebellionTemplate }))),
  'vision': React.lazy(() => import('@/components/profile/templates/persona/vision').then(m => ({ default: m.VisionTemplate }))),
  'human': React.lazy(() => import('@/components/profile/templates/persona/human').then(m => ({ default: m.HumanTemplate }))),
  // Agency
  'the-studio': React.lazy(() => import('@/components/profile/templates/persona/the-studio').then(m => ({ default: m.StudioTemplate }))),
  'the-machine': React.lazy(() => import('@/components/profile/templates/persona/the-machine').then(m => ({ default: m.MachineTemplate }))),
  'the-club': React.lazy(() => import('@/components/profile/templates/persona/the-club').then(m => ({ default: m.ClubTemplate }))),
  // Entrepreneur
  'the-builder': React.lazy(() => import('@/components/profile/templates/persona/the-builder').then(m => ({ default: m.BuilderTemplate }))),
  'the-visionary': React.lazy(() => import('@/components/profile/templates/persona/the-visionary').then(m => ({ default: m.VisionaryTemplate }))),
  'the-hustler': React.lazy(() => import('@/components/profile/templates/persona/the-hustler').then(m => ({ default: m.HustlerTemplate }))),
  // Influencer
  'the-aesthete': React.lazy(() => import('@/components/profile/templates/persona/the-aesthete').then(m => ({ default: m.AestheteTemplate }))),
  'the-creator': React.lazy(() => import('@/components/profile/templates/persona/the-creator').then(m => ({ default: m.CreatorTemplate }))),
  'the-voice': React.lazy(() => import('@/components/profile/templates/persona/the-voice').then(m => ({ default: m.VoiceTemplate }))),
};

interface ProfilePreviewProps {
  templateId: string;
  profile: any;
  isPreview?: boolean;
  className?: string;
  accentColor?: string;
  onLinkClick?: (link: any) => void;
}

interface TemplateWrapperProps extends TemplateProps {
  templateId: string;
}

function TemplateWrapper({ templateId, profile, accentColor, isPreview, onLinkClick }: TemplateWrapperProps) {
  // Normalize templateId: handle aliases with or without "the-" prefix, and fallback safely
  const resolvedTemplateId = templateComponents[templateId]
    ? templateId
    : (templateComponents[`the-${templateId}`]
      ? `the-${templateId}`
      : (templateId?.startsWith('the-') && templateComponents[templateId.replace(/^the-/, '')]
        ? templateId.replace(/^the-/, '')
        : 'lone'));

  const Component = templateComponents[resolvedTemplateId] || templateComponents['lone'];
  const effectiveTemplateId = templateComponents[resolvedTemplateId] ? resolvedTemplateId : 'lone';

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center min-h-[400px]">
        <p className="text-muted-foreground">Template "{templateId}" not found</p>
      </div>
    );
  }

  const skeletonCategory = getSkeletonCategory(effectiveTemplateId);

  return (
    <React.Suspense fallback={<TemplateSkeleton category={skeletonCategory} />}>
      <Component
        templateId={effectiveTemplateId}
        profile={profile}
        accentColor={accentColor}
        isPreview={isPreview}
        onLinkClick={onLinkClick}
      />
    </React.Suspense>
  );
}

export function ProfilePreview({
  templateId,
  profile,
  isPreview = false,
  className,
  accentColor,
  onLinkClick,
}: ProfilePreviewProps) {
  const [mounted, setMounted] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);
  const effectiveAccentColor = accentColor || profile?.theme?.accentColor || 'var(--color-primary)';

  React.useEffect(() => {
    setMounted(true);
    setLoadError(false);
  }, [templateId]);

  if (!mounted) {
    return (
      <div className={cn('flex items-center justify-center h-full min-h-[400px]', className)} role="status" aria-live="polite" aria-label="Loading template preview">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
        <span className="sr-only">Loading template preview...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center', className)} role="alert">
        <svg className="h-12 w-12 text-muted-foreground/50 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <p className="text-lg font-medium text-foreground mb-2">Failed to load template</p>
        <p className="text-muted-foreground text-sm mb-4">The template "{templateId}" could not be loaded. Please try again later.</p>
        <button
          onClick={() => { setLoadError(false); setMounted(false); }}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('w-full h-full min-h-[400px]', className)}
      style={{
        '--profile-accent': effectiveAccentColor,
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
      role="region"
      aria-label={`Template preview: ${templateId}`}
      onError={() => setLoadError(true)}
    >
      <TemplateWrapper
        templateId={templateId}
        profile={profile}
        accentColor={effectiveAccentColor}
        isPreview={isPreview}
        onLinkClick={onLinkClick || ((link) => {
          if (isPreview) {
            console.log('Preview link click:', link.label, link.url);
          }
        })}
      />
    </motion.div>
  );
}

ProfilePreview.displayName = 'ProfilePreview';