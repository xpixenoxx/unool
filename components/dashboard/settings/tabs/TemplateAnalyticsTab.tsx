'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, Eye, Loader2, MousePointerClick, Users } from 'lucide-react';
import { getTemplateById } from '@/components/profile/templates/registry';
import { normalizeTemplateId } from '@/lib/profile/templateNormalization';
import { PCard, PCardBody, PCardHead, SectionHeading } from './shared';

interface TemplateAnalyticsTabProps {
  userId: string;
  workspaceId: string;
  currentTemplate: string;
}

interface AnalyticsSummaryPayload {
  summary?: {
    totalViews: number;
    uniqueVisitors: number;
    linkClicks: number;
    ctaClicks: number;
    ctr: number;
  };
}

export function TemplateAnalyticsTab({ currentTemplate }: TemplateAnalyticsTabProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsSummaryPayload | null>(null);

  const canonicalId = normalizeTemplateId(currentTemplate);
  const templateMeta = getTemplateById(canonicalId);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/profile/analytics?days=30', { credentials: 'include' });
        const json = await res.json().catch(() => null);
        if (active && res.ok && json) {
          setData(json as AnalyticsSummaryPayload);
        }
      } catch {
        // ignore transient errors
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={BarChart3}
        title="Profile Performance (30 Days)"
        subtitle="Live public profile metrics powered by /api/profile/analytics. Full breakdowns & inquiries live in the Profile Builder."
      />

      <PCard>
        <PCardHead>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active Theme: {templateMeta?.name || canonicalId}
            </p>
            <Link
              href="/dashboard/profile?tab=domain"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
            >
              Open Full Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </PCardHead>

        <PCardBody>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-6">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading 30-day profile metrics...
              </div>
            ) : summary ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-3">
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Views
                  </div>
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                    {summary.totalViews.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-3">
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Visitors
                  </div>
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                    {summary.uniqueVisitors.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-3">
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <MousePointerClick className="w-3 h-3" /> Clicks
                  </div>
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                    {(summary.linkClicks + summary.ctaClicks).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-3">
                  <div className="text-[11px] text-zinc-500">CTR</div>
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                    {summary.ctr.toFixed(1)}%
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-3">
                No analytics recorded yet. Claim a handle in the Profile Builder to start collecting visitor insights.
              </p>
            )}

            <div className="flex justify-end">
              <Link
                href="/dashboard/profile?tab=domain"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                View Top Links, Referrers &amp; Visitor Inquiries
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </PCardBody>
      </PCard>
    </div>
  );
}
