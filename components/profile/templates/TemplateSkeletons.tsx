'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TemplateSkeletonProps {
  category: 'individual' | 'startup' | 'agency' | 'entrepreneur' | 'influencer';
  className?: string;
}

/**
 * Category-specific loading skeletons that match the visual style
 * of each template category for perceived performance.
 */
export function TemplateSkeleton({ category, className }: TemplateSkeletonProps) {
  const skeletonStyles = {
    individual: (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-6 w-64 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-32 w-full bg-muted rounded-lg animate-pulse" />
          <div className="h-32 w-full bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
        </div>
      </div>
    ),
    startup: (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-56 bg-muted rounded animate-pulse" />
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 w-full bg-muted rounded-lg animate-pulse" />
          <div className="h-24 w-full bg-muted rounded-lg animate-pulse" />
          <div className="h-24 w-full bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="h-48 w-full bg-muted rounded-xl animate-pulse" />
      </div>
    ),
    agency: (
      <div className="space-y-8">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="h-20 w-full bg-muted rounded-lg animate-pulse" />
          <div className="h-20 w-full bg-muted rounded-lg animate-pulse" />
          <div className="h-20 w-full bg-muted rounded-lg animate-pulse" />
          <div className="h-20 w-full bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        </div>
      </div>
    ),
    entrepreneur: (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-32 w-full bg-muted rounded-xl animate-pulse" />
        <div className="flex flex-wrap gap-4">
          <div className="h-24 w-48 bg-muted rounded-lg animate-pulse flex-1 min-w-[200px]" />
          <div className="h-24 w-48 bg-muted rounded-lg animate-pulse flex-1 min-w-[200px]" />
          <div className="h-24 w-48 bg-muted rounded-lg animate-pulse flex-1 min-w-[200px]" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
        </div>
      </div>
    ),
    influencer: (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="aspect-video bg-muted rounded-xl animate-pulse" />
          <div className="aspect-video bg-muted rounded-xl animate-pulse" />
          <div className="aspect-video bg-muted rounded-xl animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="h-10 w-28 bg-muted rounded-full animate-pulse" />
          <div className="h-10 w-28 bg-muted rounded-full animate-pulse" />
          <div className="h-10 w-28 bg-muted rounded-full animate-pulse" />
          <div className="h-10 w-28 bg-muted rounded-full animate-pulse" />
          <div className="h-10 w-28 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
    ),
  };

  return (
    <div className={cn('flex items-center justify-center h-full min-h-[400px] p-8', className)}>
      {skeletonStyles[category]}
    </div>
  );
}

/**
 * Get skeleton category from template ID
 */
export function getSkeletonCategory(templateId: string): TemplateSkeletonProps['category'] {
  const individualTemplates = ['lover', 'lone', 'energy'];
  const startupTemplates = ['rebellion', 'vision', 'human'];
  const agencyTemplates = ['the-studio', 'the-machine', 'the-club'];
  const entrepreneurTemplates = ['the-builder', 'the-visionary', 'the-hustler'];
  const influencerTemplates = ['the-aesthete', 'the-creator', 'the-voice'];

  if (individualTemplates.includes(templateId)) return 'individual';
  if (startupTemplates.includes(templateId)) return 'startup';
  if (agencyTemplates.includes(templateId)) return 'agency';
  if (entrepreneurTemplates.includes(templateId)) return 'entrepreneur';
  if (influencerTemplates.includes(templateId)) return 'influencer';
  return 'individual'; // default fallback
}