'use client';

import Link from 'next/link';
import { ArrowRight, Palette, Sparkles } from 'lucide-react';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import { getTemplateById } from '@/components/profile/templates/registry';
import { normalizeTemplateId } from '@/lib/profile/templateNormalization';
import { PCard, PCardBody, PCardHead, SectionHeading } from './shared';

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
  currentTemplate,
  profileData,
}: TemplatesTabProps) {
  const canonicalId = normalizeTemplateId(currentTemplate);
  const templateMeta = getTemplateById(canonicalId);

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Palette}
        title="Profile Design & Templates"
        subtitle="Template selection, contrast tuning, and typography live inside the Public Profile Builder."
      />

      <PCard>
        <PCardHead>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active Template Summary
            </p>
            <Link
              href="/dashboard/profile?tab=design"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
            >
              Open Design Builder <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </PCardHead>

        <PCardBody>
          <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {templateMeta?.name || canonicalId}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {templateMeta?.tagline || templateMeta?.description || 'Active public profile theme'}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/profile?tab=design"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Customize Theme &amp; Browse All 24
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {profileData && (
            <div
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950"
              style={{ height: '320px', transform: 'translateZ(0)' }}
            >
              <div className="h-full overflow-y-auto overflow-x-hidden pointer-events-none">
                <ProfilePreview templateId={canonicalId} profile={profileData} isPreview={true} />
              </div>
            </div>
          )}
          </div>
        </PCardBody>
      </PCard>
    </div>
  );
}
