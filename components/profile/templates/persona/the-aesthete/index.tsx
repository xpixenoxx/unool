'use client';

import { EditorialCardEngine } from '@/components/profile/templates/EditorialCardEngine';
import type { TemplateProps } from '@/components/profile/templates/types';

export function AestheteTemplate(props: TemplateProps) {
  return <EditorialCardEngine archetype="the-aesthete" {...props} />;
}
export default AestheteTemplate;
