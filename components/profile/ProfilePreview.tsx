'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TemplateProps } from '@/components/profile/templates/types';

// Map template IDs to their components for dynamic loading (8 persona-driven templates)
const templateComponents: Record<string, React.LazyExoticComponent<React.ComponentType<TemplateProps>>> = {
  // New persona-driven templates
  'student': React.lazy(() => import('@/components/profile/templates/persona/StudentTemplate').then(m => ({ default: m.StudentTemplate }))),
  'founder': React.lazy(() => import('@/components/profile/templates/persona/FounderTemplate').then(m => ({ default: m.FounderTemplate }))),
  'creator': React.lazy(() => import('@/components/profile/templates/persona/CreatorTemplate').then(m => ({ default: m.CreatorTemplate }))),
  'developer': React.lazy(() => import('@/components/profile/templates/persona/DeveloperTemplate').then(m => ({ default: m.DeveloperTemplate }))),
  'minimalist': React.lazy(() => import('@/components/profile/templates/persona/MinimalistTemplate').then(m => ({ default: m.MinimalistTemplate }))),
  'ngo': React.lazy(() => import('@/components/profile/templates/persona/NGOTemplate').then(m => ({ default: m.NGOTemplate }))),
  'premium-opaque': React.lazy(() => import('@/components/profile/templates/persona/PremiumOpaqueTemplate').then(m => ({ default: m.PremiumOpaqueTemplate }))),
  'glossy-premium': React.lazy(() => import('@/components/profile/templates/persona/GlossyPremiumTemplate').then(m => ({ default: m.GlossyPremiumTemplate }))),
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