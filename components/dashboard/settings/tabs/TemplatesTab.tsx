'use client';

import { useState } from 'react';
import { Palette, MousePointerClick, Sparkles } from 'lucide-react';
import { TemplateSelector } from '@/components/profile/TemplateSelector';
import { SectionHeading, PCard, PCardHead, PCardBody, LoadingSkeleton } from './shared';

interface TemplatesTabProps {
  userId: string;
  workspaceId: string;
  currentTemplate: string;
  onTemplateChange: (templateId: string) => Promise<void>;
  profileData?: {
    name: string;
    headline: string;
    bio: string;
    subdomain: string;
    avatarUrl: string;
    links: Array<{ id: string; label: string; url: string; icon?: string; clicks?: number; order?: number; isVisible?: boolean }>;
    proofs: Array<{ id: string; title: string; value: string }>;
  };
}

export function TemplatesTab({
  userId,
  workspaceId,
  currentTemplate,
  onTemplateChange,
  profileData,
}: TemplatesTabProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const [savedTemplate, setSavedTemplate] = useState<string | null>(null);

  const handleSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleSave = async () => {
    if (selectedTemplate === savedTemplate) return;

    setIsSaving(true);
    try {
      await onTemplateChange(selectedTemplate);
      setSavedTemplate(selectedTemplate);
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Palette}
        title="Templates & Design"
        subtitle="Choose a beautiful theme for your public profile. Preview live before applying."
      />

      <PCard>
        <PCardHead>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Profile Theme
          </p>
        </PCardHead>
        <PCardBody>
          {/* Current Selection */}
          {savedTemplate && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                      {savedTemplate} Applied
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Your public profile is using this template
                    </p>
                  </div>
                </div>
                {selectedTemplate !== savedTemplate && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Template Selector with Live Preview */}
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onSelect={handleSelect}
            inline={true}
            profileData={profileData || {
              id: 'preview',
              subdomain: 'preview',
              name: 'Preview User',
              headline: 'Preview your template',
              bio: 'This is a live preview of how your profile will look.',
              avatarUrl: '',
              links: [
                { id: '1', label: 'Twitter', url: 'https://twitter.com', icon: 'twitter', clicks: 0, order: 0, isVisible: true },
                { id: '2', label: 'GitHub', url: 'https://github.com', icon: 'github', clicks: 0, order: 1, isVisible: true },
                { id: '3', label: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin', clicks: 0, order: 2, isVisible: true },
              ],
              proofs: [],
              theme: { template: selectedTemplate, preset: '', accentColor: '', customCss: null },
              socialHandles: {},
              seo: { title: '', description: '', image: null },
            }}
          />

          {/* Help Text */}
          <div className="mt-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#3D2B1F] dark:text-zinc-100">
                  How it works
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hover over any template card to see a live preview on the right. Click a template to select it,
                  then click "Save Changes" to apply it to your public profile. Changes take effect immediately.
                </p>
              </div>
            </div>
          </div>
        </PCardBody>
      </PCard>
    </div>
  );
}