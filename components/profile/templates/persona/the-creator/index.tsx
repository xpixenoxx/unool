'use client';

import { EditorialCardEngine } from '@/components/profile/templates/EditorialCardEngine';
import type { TemplateProps } from '@/components/profile/templates/types';

export function CreatorTemplate(props: TemplateProps) {
  return <EditorialCardEngine archetype="the-creator" {...props} />;
}
export default CreatorTemplate;
