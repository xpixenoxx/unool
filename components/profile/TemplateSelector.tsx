'use client';

import React from 'react';
import { TEMPLATE_REGISTRY } from './templates/registry';
import { UnifiedTemplatePicker } from './builder/UnifiedTemplatePicker';

interface TemplateSelectorProps {
  selectedTemplate?: string;
  onSelect: (templateId: string) => void;
  className?: string;
  inline?: boolean;
  profileData?: any;
}

export function TemplateSelector({
  selectedTemplate = 'lone',
  onSelect,
  className,
  profileData,
}: TemplateSelectorProps) {
  return (
    <div className={className}>
      <UnifiedTemplatePicker
        templates={TEMPLATE_REGISTRY}
        selectedTemplate={selectedTemplate}
        profileData={profileData}
        onSelect={onSelect}
        compact={true}
      />
    </div>
  );
}

TemplateSelector.displayName = 'TemplateSelector';
