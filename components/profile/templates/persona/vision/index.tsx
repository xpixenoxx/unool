'use client';

import { EditorialCardEngine } from '@/components/profile/templates/EditorialCardEngine';
import type { TemplateProps } from '@/components/profile/templates/types';

export function VisionTemplate(props: TemplateProps) {
  return <EditorialCardEngine archetype="vision" {...props} />;
}
export default VisionTemplate;
