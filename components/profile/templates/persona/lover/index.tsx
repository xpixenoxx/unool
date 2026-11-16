'use client';

import { EditorialCardEngine } from '@/components/profile/templates/EditorialCardEngine';
import type { TemplateProps } from '@/components/profile/templates/types';

export function LoverTemplate(props: TemplateProps) {
  return <EditorialCardEngine archetype="lover" {...props} />;
}
export default LoverTemplate;
