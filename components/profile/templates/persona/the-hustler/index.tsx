'use client';

import { EditorialCardEngine } from '@/components/profile/templates/EditorialCardEngine';
import type { TemplateProps } from '@/components/profile/templates/types';

export function HustlerTemplate(props: TemplateProps) {
  return <EditorialCardEngine archetype="the-hustler" {...props} />;
}
export default HustlerTemplate;
