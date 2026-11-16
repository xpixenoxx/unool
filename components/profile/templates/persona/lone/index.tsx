'use client';

import { EditorialCardEngine } from '@/components/profile/templates/EditorialCardEngine';
import type { TemplateProps } from '@/components/profile/templates/types';

export function LoneTemplate(props: TemplateProps) {
  return <EditorialCardEngine archetype="lone" {...props} />;
}
export default LoneTemplate;
