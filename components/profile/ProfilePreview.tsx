'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TemplateProps } from '@/components/profile/templates/types';

// Map template IDs to their components for dynamic loading
const templateComponents: Record<string, React.LazyExoticComponent<React.ComponentType<TemplateProps & { templateId: string }>>> = {
  // Individual
  'lover': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  'lone': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  'energy': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  // Startup
  'rebellion': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  'vision': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  'human': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  // Agency
  'the-studio': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  'the-machine': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  'the-club': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  // Entrepreneur
  'the-builder': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  'the-visionary': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  'the-hustler': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  // Influencer
  'the-aesthete': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  'the-creator': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
  'the-voice': React.lazy(() => import('@/components/profile/templates/persona/IdentityTemplate').then(m => ({ default: m.IdentityTemplate }))),
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
  const Component = templateComponents[templateId];

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center min-h-[400px]">
        <p className="text-muted-foreground">Template "{templateId}" not found</p>
      </div>
    );
  }

  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <Component
        templateId={templateId}
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
  const effectiveAccentColor = accentColor || profile?.theme?.accentColor || 'var(--color-primary)';

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('flex items-center justify-center h-full min-h-[400px]', className)}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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