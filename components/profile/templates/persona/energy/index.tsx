'use client';

import { EditorialCardEngine } from '@/components/profile/templates/EditorialCardEngine';
import type { TemplateProps } from '@/components/profile/templates/types';

export function EnergyTemplate(props: TemplateProps) {
  return <EditorialCardEngine archetype="energy" {...props} />;
}
export default EnergyTemplate;
