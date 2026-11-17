'use client';

import React from 'react';
import type { TemplateMeta } from './templates/types';
import { TEMPLATE_REGISTRY } from './templates/registry';
import { UnifiedTemplatePicker } from './builder/UnifiedTemplatePicker';

interface TemplateGalleryProps {
  templates?: TemplateMeta[];
  selectedTemplate: string;
  onSelect: (templateId: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
  profileData?: any;
  accentColor?: string;
}

export function TemplateGallery({
  templates = TEMPLATE_REGISTRY,
  selectedTemplate,
  onSelect,
  onClose,
  profileData,
  accentColor,
}: TemplateGalleryProps) {
  return (
    <UnifiedTemplatePicker
      templates={templates}
      selectedTemplate={selectedTemplate}
      profileData={profileData}
      accentColor={accentColor}
      onSelect={(templateId) => {
        onSelect(templateId);
        onClose?.();
      }}
    />
  );
}

export default TemplateGallery;
