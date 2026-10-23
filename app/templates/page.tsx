import type { Metadata } from 'next';
import { TEMPLATE_REGISTRY } from '@/components/profile/templates/registry';
import type { TemplateMeta } from '@/components/profile/templates/types';
import { TemplatesGalleryClient } from './TemplatesGalleryClient';

export const metadata: Metadata = {
  title: 'Profile Templates — Unool | 16 Studio-Grade Creator Profiles',
  description:
    'Browse 16 studio-grade profile templates for creators, founders, agencies, and influencers. Parallax, 3D effects, magnetic hover, animated orbs. Your brand, your personality.',
  keywords: [
    'creator profile templates',
    'link in bio templates',
    'portfolio templates india',
    'instagram bio page design',
    'personal website templates',
    'creator website themes',
    'unool templates',
  ],
  openGraph: {
    title: '16 Studio-Grade Profile Templates — Unool',
    description: 'From The Lone (pure minimalism) to The Creator (full 3D). Pick your persona, launch your profile.',
    type: 'website',
  },
};

export default function TemplatesPage() {
  // TEMPLATE_REGISTRY is fully serializable — pass directly
  const templates: TemplateMeta[] = TEMPLATE_REGISTRY;
  return <TemplatesGalleryClient templates={templates} />;
}
