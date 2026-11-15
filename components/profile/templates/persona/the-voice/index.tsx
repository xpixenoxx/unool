'use client';

import { EditorialCardEngine } from '@/components/profile/templates/EditorialCardEngine';
import type { TemplateProps } from '@/components/profile/templates/types';

export function VoiceTemplate(props: TemplateProps) {
  return <EditorialCardEngine archetype="the-voice" {...props} />;
}
export default VoiceTemplate;
