'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { TodayIntelligencePayload } from '@/lib/services/automation/todayIntelligence';

interface TodayCommandCenterProps {
  workspaceId: string;
}

export function TodayCommandCenter({ workspaceId }: TodayCommandCenterProps) {
  const [data, setData] = useState<TodayIntelligencePayload | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [replayNotice, setReplayNotice] = useState<string | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const loadIntel = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/automation/intelligence?workspaceId=${encodeURIComponent(workspaceId)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Non-blocking overview widget
    }
  }, [workspaceId]);

  useEffect(() => {
    loadIntel();
    const interval = setInterval(loadIntel, 60_000);
    return () => clearInterval(interval);
  }, [loadIntel]);

  // Live Supabase Realtime pulse updates on new comments, DMs, or leads
  useEffect(() => {
    if (!workspaceId) return;
    let channel: any = null;
    (async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
        const sb = getSupabaseBrowserClient();
        channel = sb
          .channel(`today-pulse-${workspaceId}`)
          .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'workspace_contacts', filter: `workspace_id=eq.${workspaceId}` }, () => loadIntel())
          .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'tracked_link_clicks', filter: `workspace_id=eq.${workspaceId}` }, () => loadIntel())
          .subscribe();
      } catch {
        // Realtime optional
      }
    })();
    return () => {
      if (channel) {
        import('@/lib/supabase/browser')
          .then(({ getSupabaseBrowserClient }) => getSupabaseBrowserClient().removeChannel(channel))
          .catch(() => {});
      }
    };
  }, [workspaceId, loadIntel]);

  const replayDeadLetters = async () => {
    setReplaying(true);
    try {
      const res = await fetch('/api/automation/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, action: 'replay_dead_letters' }),
      });
      if (res.ok) {
        const j = await res.json();
        setReplayNotice(`Re-queued ${j.replayed} failed job(s) for delivery.`);
        loadIntel();
      }
    } finally {
      setReplaying(false);
    }
  };

  if (!data) return null;

  const { todayPulse, surge, momentum, nextBestActions, expiringHotLeads, demandRadar, watchdog, recentWins } = data;
  const shareSummary = `This week with Unool SignalDM: ${todayPulse.repliesSentToday + todayPulse.dmsSentToday} replies & DMs today, ${todayPulse.leadsCapturedToday} leads captured, ${todayPulse.estimatedHoursSaved7d}h saved, Momentum Score ${momentum.score}/100 (${momentum.label}).`;

  return (
    <section
      aria-label="Today Command Center"
      className="rounded-2xl border border-[#E4D9C8] bg-white p-4 sm:p-5 space-y-4 shadow-2xs"
    >
      {/* Surge Alert Banner */}
      {surge.isSurging && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="text-xs sm:text-sm font-semibold text-amber-900">
            Viral Surge Detected ({surge.multiplier}x normal pace — {surge.lastHourComments} comments in the last hour)
          </div>
          <Link
            href="/dashboard/automation?tab=campaigns"
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#3D2B1F] text-white hover:opacity-90"
          >
            Check Active Campaigns →
          </Link>
        </div>
      )}

      {/* Watchdog Health Strip */}
      {!watchdog.healthy && watchdog.warnings.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-rose-900 font-medium">
            <strong>Watchdog:</strong> {watchdog.warnings[0]}
          </div>
          {watchdog.deadLetterCount > 0 && (
            <button
              type="button"
              disabled={replaying}
              onClick={replayDeadLetters}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-700 text-white hover:bg-rose-800 cursor-pointer"
            >
              {replaying ? 'Replaying...' : `Replay ${watchdog.deadLetterCount} Failed Job(s)`}
            </button>
          )}
        </div>
      )}
      {replayNotice && (
        <div role="status" aria-live="polite" className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {replayNotice}
        </div>
      )}

      {/* Header + Momentum Score */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B7355]">
            Today Command Center · Live Pulse
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#3D2B1F] mt-0.5">
            {momentum.label} Momentum — {momentum.score}/100
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FAF4E8] text-[#8B6914] border border-[#E8D9B8]">
            {momentum.streakDays}d active streak · {todayPulse.estimatedHoursSaved7d}h saved (7d)
          </span>
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E4D9C8] text-[#3D2B1F] hover:bg-[#FAF7F2] cursor-pointer"
          >
            Share Win Card
          </button>
        </div>
      </div>

      {/* Live Pulse KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { label: 'Replies Today', val: todayPulse.repliesSentToday, accent: 'text-[#3D2B1F]' },
          { label: 'DMs Sent', val: todayPulse.dmsSentToday, accent: 'text-[#6D28D9]' },
          { label: 'Leads Captured', val: todayPulse.leadsCapturedToday, accent: 'text-[#047857]' },
          { label: 'Tracked Clicks', val: todayPulse.clicksToday, accent: 'text-[#C8613D]' },
          { label: 'Follow Unlocks', val: todayPulse.followUnlocksToday, accent: 'text-[#1D4ED8]' },
          { label: 'AI Stops (Safe)', val: todayPulse.aiQualityStopsToday, accent: 'text-[#B45309]' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-[#FAF7F2] border border-[#EDE5D8] p-2.5">
            <div className="text-[11px] text-[#78716C]">{kpi.label}</div>
            <div className={`text-lg font-extrabold tabular-nums mt-0.5 ${kpi.accent}`}>{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* Next-Best-Actions + Expiring 24h Hot Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#8B7355]">
            Next Best Actions
          </div>
          {nextBestActions.length === 0 ? (
            <div className="rounded-xl border border-[#EDE5D8] bg-[#FAF7F2] p-3 text-xs text-[#6E5A48]">
              Everything is running smoothly. Open SignalDM Campaigns to test a new Reel playbook.
            </div>
          ) : (
            nextBestActions.map((act) => (
              <div
                key={act.id}
                className="rounded-xl border border-[#E8E0D4] bg-[#FAF7F2]/60 p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#3D2B1F]">{act.title}</span>
                    {act.metricBadge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {act.metricBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-[#6E5A48] mt-0.5">{act.subtitle}</p>
                </div>
                <Link
                  href={act.href}
                  className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#3D2B1F] text-white hover:opacity-90"
                >
                  {act.ctaLabel}
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Audience Demand Radar + Expiring Hot Leads */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#8B7355]">
            {expiringHotLeads.length > 0 ? 'Expiring 24h Hot Leads' : 'Audience Demand Radar (What to Post Next)'}
          </div>
          {expiringHotLeads.length > 0 ? (
            expiringHotLeads.slice(0, 3).map((lead) => (
              <div
                key={lead.contactId}
                className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-[#3D2B1F]">
                    @{lead.username} {lead.isVip ? '· VIP' : ''} · Intent {lead.intentScore}/100
                  </div>
                  <div className="text-[11px] text-amber-900 mt-0.5">
                    {lead.hoursRemaining}h left in Meta 24h DM reply window{lead.email ? ` · ${lead.email}` : ''}
                  </div>
                </div>
                <Link
                  href="/dashboard/automation?tab=leads"
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-amber-700 text-white"
                >
                  Reply Now
                </Link>
              </div>
            ))
          ) : demandRadar.length > 0 ? (
            demandRadar.slice(0, 3).map((cluster) => (
              <div
                key={cluster.id}
                className="rounded-xl border border-[#E8E0D4] bg-[#FAF7F2]/60 p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#3D2B1F]">
                    {cluster.topic} <span className="text-[#C8613D]">({cluster.count} asks)</span>
                  </div>
                  <div className="text-[11px] text-[#6E5A48] truncate mt-0.5">
                    Hook: &ldquo;{cluster.suggestedPostHook}&rdquo;
                  </div>
                </div>
                <Link
                  href={`/dashboard/composer?prompt=${encodeURIComponent(cluster.suggestedPostHook)}&keyword=${encodeURIComponent(cluster.suggestedKeyword)}`}
                  className="shrink-0 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-[#3D2B1F] text-[#3D2B1F] hover:bg-[#3D2B1F] hover:text-white"
                >
                  Draft Post
                </Link>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-[#EDE5D8] bg-[#FAF7F2] p-3 text-xs text-[#6E5A48]">
              As comments and DMs arrive, Demand Radar clusters your audience&apos;s top recurring questions into 1-click Studio post ideas.
            </div>
          )}
        </div>
      </div>

      {/* Recent Wins Micro-Proof Strip */}
      {recentWins.length > 0 && (
        <div className="pt-2 border-t border-[#F0EAE0] flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B7355]">Recent Wins:</span>
          {recentWins.slice(0, 3).map((w) => (
            <span
              key={w.id}
              className="text-[11.5px] px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8E0D4] text-[#3D2B1F]"
            >
              {w.label}
            </span>
          ))}
        </div>
      )}

      {/* Native Accessible <dialog> Milestone Share Card */}
      <dialog
        ref={dialogRef}
        aria-labelledby="milestone-dialog-title"
        className="rounded-2xl border border-[#E4D9C8] bg-[#FAF7F2] p-6 max-w-md w-[92vw] shadow-xl backdrop:bg-black/40"
      >
        <h3 id="milestone-dialog-title" className="text-lg font-bold text-[#3D2B1F]">
          Unool Weekly Win Card
        </h3>
        <div className="mt-3 rounded-xl bg-gradient-to-br from-[#3D2B1F] to-[#231811] text-white p-5 space-y-3">
          <div className="text-[11px] uppercase tracking-widest text-[#E6C78A]">SignalDM Momentum</div>
          <div className="text-3xl font-extrabold">{momentum.score} / 100</div>
          <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-white/15">
            <div><div className="text-white/60">Replies/DMs</div><div className="font-bold text-base">{todayPulse.repliesSentToday + todayPulse.dmsSentToday}</div></div>
            <div><div className="text-white/60">Leads</div><div className="font-bold text-base">{todayPulse.leadsCapturedToday}</div></div>
            <div><div className="text-white/60">Hours Saved</div><div className="font-bold text-base">{todayPulse.estimatedHoursSaved7d}h</div></div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(shareSummary);
              setCopiedCard(true);
              setTimeout(() => setCopiedCard(false), 2000);
            }}
            className="text-xs font-bold px-3.5 py-2 rounded-lg bg-[#3D2B1F] text-white cursor-pointer"
          >
            {copiedCard ? 'Copied Summary!' : 'Copy Share Caption'}
          </button>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-xs font-semibold px-3.5 py-2 rounded-lg border border-[#D8CCB8] text-[#3D2B1F] cursor-pointer"
          >
            Close
          </button>
        </div>
      </dialog>
    </section>
  );
}
