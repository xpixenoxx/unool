'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Flex } from '@/components/ui/layout';
import { Text, Heading } from '@/components/ui/typography';
import type { TemplateProps } from '@/components/profile/templates/types';

// Map template IDs to their components for dynamic loading
const templateComponents: Record<string, React.LazyExoticComponent<React.ComponentType<TemplateProps>>> = {
  // Essential
  'essential-minimal': React.lazy(() => import('@/components/profile/templates/essential/EssentialMinimal').then(m => ({ default: m.EssentialMinimalTemplate }))),
  'essential-light': React.lazy(() => import('@/components/profile/templates/essential/EssentialLight').then(m => ({ default: m.EssentialLightTemplate }))),
  'essential-standard': React.lazy(() => import('@/components/profile/templates/essential/EssentialStandard').then(m => ({ default: m.EssentialStandardTemplate }))),
  'essential-bold': React.lazy(() => import('@/components/profile/templates/essential/EssentialBold').then(m => ({ default: m.EssentialBoldTemplate }))),
  'essential-max': React.lazy(() => import('@/components/profile/templates/essential/EssentialMax').then(m => ({ default: m.EssentialMaxTemplate }))),
  // Professional
  'professional-minimal': React.lazy(() => import('@/components/profile/templates/professional/ProfessionalMinimal').then(m => ({ default: m.ProfessionalMinimalTemplate }))),
  'professional-light': React.lazy(() => import('@/components/profile/templates/professional/ProfessionalLight').then(m => ({ default: m.ProfessionalLightTemplate }))),
  'professional-standard': React.lazy(() => import('@/components/profile/templates/professional/ProfessionalStandard').then(m => ({ default: m.ProfessionalStandardTemplate }))),
  'professional-bold': React.lazy(() => import('@/components/profile/templates/professional/ProfessionalBold').then(m => ({ default: m.ProfessionalBoldTemplate }))),
  'professional-max': React.lazy(() => import('@/components/profile/templates/professional/ProfessionalMax').then(m => ({ default: m.ProfessionalMaxTemplate }))),
  // Creative
  'creative-minimal': React.lazy(() => import('@/components/profile/templates/creative/CreativeMinimal').then(m => ({ default: m.CreativeMinimalTemplate }))),
  'creative-light': React.lazy(() => import('@/components/profile/templates/creative/CreativeLight').then(m => ({ default: m.CreativeLightTemplate }))),
  'creative-standard': React.lazy(() => import('@/components/profile/templates/creative/CreativeStandard').then(m => ({ default: m.CreativeStandardTemplate }))),
  'creative-bold': React.lazy(() => import('@/components/profile/templates/creative/CreativeBold').then(m => ({ default: m.CreativeBoldTemplate }))),
  'creative-max': React.lazy(() => import('@/components/profile/templates/creative/CreativeMax').then(m => ({ default: m.CreativeMaxTemplate }))),
  // Technical
  'technical-minimal': React.lazy(() => import('@/components/profile/templates/technical/TechnicalMinimal').then(m => ({ default: m.TechnicalMinimalTemplate }))),
  'technical-light': React.lazy(() => import('@/components/profile/templates/technical/TechnicalLight').then(m => ({ default: m.TechnicalLightTemplate }))),
  'technical-standard': React.lazy(() => import('@/components/profile/templates/technical/TechnicalStandard').then(m => ({ default: m.TechnicalStandardTemplate }))),
  'technical-bold': React.lazy(() => import('@/components/profile/templates/technical/TechnicalBold').then(m => ({ default: m.TechnicalBoldTemplate }))),
  'technical-max': React.lazy(() => import('@/components/profile/templates/technical/TechnicalMax').then(m => ({ default: m.TechnicalMaxTemplate }))),
  // Social
  'social-minimal': React.lazy(() => import('@/components/profile/templates/social/SocialMinimal').then(m => ({ default: m.SocialMinimalTemplate }))),
  'social-light': React.lazy(() => import('@/components/profile/templates/social/SocialLight').then(m => ({ default: m.SocialLightTemplate }))),
  'social-standard': React.lazy(() => import('@/components/profile/templates/social/SocialStandard').then(m => ({ default: m.SocialStandardTemplate }))),
  'social-bold': React.lazy(() => import('@/components/profile/templates/social/SocialBold').then(m => ({ default: m.SocialBoldTemplate }))),
  'social-max': React.lazy(() => import('@/components/profile/templates/social/SocialMax').then(m => ({ default: m.SocialMaxTemplate }))),
};

interface ProfilePreviewProps {
  templateId: string;
  profile: any;
  isPreview?: boolean;
  className?: string;
}

interface TemplateWrapperProps extends TemplateProps {
  templateId: string;
}

function TemplateWrapper({ templateId, profile, accentColor, isPreview, onLinkClick }: TemplateWrapperProps) {
  const Component = templateComponents[templateId];

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <Text color="muted">Template "{templateId}" not found</Text>
      </div>
    );
  }

  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-full">
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
  className
}: ProfilePreviewProps) {
  const [mounted, setMounted] = React.useState(false);
  const accentColor = profile?.theme?.accentColor || 'var(--primary)';

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('w-full h-full', className)}
      style={{
        '--profile-accent': accentColor,
        fontFamily: 'var(--font-geist)',
      } as React.CSSProperties}
    >
      <TemplateWrapper
        templateId={templateId}
        profile={profile}
        accentColor={accentColor}
        isPreview={isPreview}
        onLinkClick={(link) => {
          if (isPreview) {
            console.log('Preview link click:', link.label, link.url);
          }
        }}
      />
    </motion.div>
  );
}

ProfilePreview.displayName = 'ProfilePreview';