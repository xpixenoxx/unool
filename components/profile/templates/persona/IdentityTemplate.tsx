'use client';

import React from 'react';
import type { TemplateProps } from '@/components/profile/templates/types';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { ClubTemplate } from './ClubTemplate';
import { ClubTemplateV2 } from './ClubTemplateV2';
import { StudioTemplate } from './StudioTemplate';
export { ClubTemplate };
export { StudioTemplate };

// Individual templates
import { LoverTemplate } from './LoverTemplate';
import { LoneTemplate } from './LoneTemplate';
import { EnergyTemplate } from './EnergyTemplate';
// Startup templates
import { RebellionTemplate } from './RebellionTemplate';
import { VisionTemplate } from './VisionTemplate';
// Human templates
import { HumanTemplate } from './HumanTemplate';
// Agency templates
import { MachineTemplate } from './MachineTemplate';
// Entrepreneur templates
import { BuilderTemplate } from './BuilderTemplate';
import { VisionaryTemplate } from './VisionaryTemplate';
import { HustlerTemplate } from './HustlerTemplate';
// Influencer templates
import { AestheteTemplate } from './AestheteTemplate';
import { CreatorTemplate } from './CreatorTemplate';
import { VoiceTemplate } from './VoiceTemplate';

// A dynamic template that adjusts its vibe based on the selected identity template ID.
export function IdentityTemplate(props: TemplateProps & { templateId: string }) {
  const { templateId, profile } = props;
  const openToIntents: string[] = (profile as any).openTo || [];
  const recentActivity = (profile as any).recentActivity ?? null;
  const autoScroll: boolean = (profile as any).autoScroll ?? false;
  const accentColor: string | undefined = (profile as any).theme?.accentColor;

  // Templates with dark backgrounds need light-adjusted badge / activity styling
  const darkTemplates = ['lone', 'rebellion', 'the-builder', 'the-hustler', 'the-visionary', 'the-creator', 'the-studio'];
  const isDark = darkTemplates.includes(templateId);

  let content: React.ReactNode;
  switch (templateId) {
    // Individual
    case 'lover': content = <LoverTemplate {...props} />; break;
    case 'lone': content = <LoneTemplate {...props} />; break;
    case 'energy': content = <EnergyTemplate {...props} />; break;
    // Startup
    case 'rebellion': content = <RebellionTemplate {...props} />; break;
    case 'vision': content = <VisionTemplate {...props} />; break;
    case 'human': content = <HumanTemplate {...props} />; break;
    // Agency
    case 'the-machine': content = <MachineTemplate {...props} />; break;
    case 'the-club': content = <ClubTemplateV2 {...props} />; break;
    case 'the-studio': content = <StudioTemplate {...props} />; break;
    // Entrepreneur
    case 'the-builder': content = <BuilderTemplate {...props} />; break;
    case 'the-visionary': content = <VisionaryTemplate {...props} />; break;
    case 'the-hustler': content = <HustlerTemplate {...props} />; break;
    // Influencer
    case 'the-aesthete': content = <AestheteTemplate {...props} />; break;
    case 'the-creator': content = <CreatorTemplate {...props} />; break;
    case 'the-voice': content = <VoiceTemplate {...props} />; break;
    default: content = <LoneTemplate {...props} />; break;
  }

  if (!openToIntents || openToIntents.length === 0) {
    return <>{content}</>;
  }

  // Render template with floating Open To badges
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {content}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          padding: '8px 14px',
          borderRadius: 20,
          backgroundColor: isDark ? 'rgba(15, 15, 15, 0.85)' : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
          boxShadow: isDark
            ? '0 4px 24px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)'
            : '0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          maxWidth: '90vw',
        }}
      >
        <OpenToBadges intents={openToIntents} compact darkMode={isDark} />
      </div>
    </div>
  );
}
