'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  Info,
  Loader2,
  RefreshCw,
  Share2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { EnrichedSignalPost } from '@/lib/analytics/signalEngine';
import { extractLeadHook } from '@/lib/analytics/postTelemetry';
import { PlatformBrandLogo, getPlatformConfig } from '@/components/dashboard/PlatformLogos';
import { supportsRemotePostDeletion } from '@/lib/platforms/deletionSupport';
import { getDraftRedirect } from '@/app/dashboard/signal/types';

interface SnapshotRow {
  id: string;
  platform: string;
  capturedAt: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  views: number | null;
  totalEngagements: number;
}

export interface DeletePostOptions {
  deleteFromPlatform?: boolean;
  variantId?: string;
}

export function PostInspectorDrawer({
  post,
  profileSubdomain,
  timezone,
  onClose,
  onDelete,
  onRefresh,
  onShareStory,
}: {
  post: EnrichedSignalPost | null;
  profileSubdomain?: string | null;
  timezone: string;
  onClose: () => void;
  onDelete: (postId: string, options?: DeletePostOptions) => Promise<boolean | void> | boolean | void;
  onRefresh: () => void;
  onShareStory?: (post: EnrichedSignalPost) => void;
}) {
  const [livePost, setLivePost] = useState<EnrichedSignalPost | null>(post);
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [syncingLive, setSyncingLive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [retryingVariantId, setRetryingVariantId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmPostDelete, setConfirmPostDelete] = useState(false);
  const [confirmVariantDeleteId, setConfirmVariantDeleteId] = useState<string | null>(null);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);

  useEffect(() => {
    setConfirmPostDelete(false);
    setConfirmVariantDeleteId(null);
    setLivePost(post);
    if (!post) return;
    let active = true;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);

    setLoadingSnapshots(true);
    fetch(`/api/signal/posts/${post.id}?tz=${encodeURIComponent(timezone)}`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(async res => {
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (data.post) {
          setLivePost(data.post);
        }
        if (Array.isArray(data.snapshots)) {
          setSnapshots(data.snapshots);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingSnapshots(false);
      });

    return () => {
      active = false;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [post, timezone, onClose]);

  const activePost = livePost ?? post;
  if (!activePost) return null;

  const handleRefreshLive = async () => {
    setSyncingLive(true);
    try {
      const res = await fetch(
        `/api/signal/posts/${activePost.id}?sync=true&tz=${encodeURIComponent(timezone)}`,
        { credentials: 'include', cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.post) setLivePost(data.post);
        if (Array.isArray(data.snapshots)) setSnapshots(data.snapshots);
        onRefresh();
      }
    } finally {
      setSyncingLive(false);
    }
  };

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleRetryVariant = async (variantId: string) => {
    setRetryingVariantId(variantId);
    try {
      const res = await fetch(`/api/publish/variants/${variantId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        onRefresh();
      }
    } finally {
      setRetryingVariantId(null);
    }
  };

  const hasLiveDeletableVariants = activePost.variants.some(
    v => v.status === 'published' && Boolean(v.platformPostId) && supportsRemotePostDeletion(v.canonicalPlatform)
  );

  const handleDelete = async (deleteFromPlatform = false) => {
    setDeleting(true);
    try {
      const ok = await onDelete(activePost.id, { deleteFromPlatform });
      if (ok !== false) {
        setConfirmPostDelete(false);
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteVariantLive = async (variantId: string) => {
    setDeletingVariantId(variantId);
    try {
      const ok = await onDelete(activePost.id, { deleteFromPlatform: true, variantId });
      if (ok !== false) {
        setConfirmVariantDeleteId(null);
        if (activePost.variants.length <= 1) {
          onClose();
        }
      }
    } finally {
      setDeletingVariantId(null);
    }
  };

  const draftNav = getDraftRedirect({
    id: activePost.id,
    content: activePost.content,
    status: activePost.status,
    hookType: activePost.hookType,
    wordCount: activePost.wordCount,
    hasMedia: activePost.hasMedia,
    createdAt: activePost.createdAt,
    updatedAt: activePost.createdAt,
    publishedAt: activePost.publishedAt,
    adaptationPromptVersion: activePost.aiOrigin === 'flightplan' ? 'schedule-engine-v1' : null,
    origin: activePost.originKind === 'flightplan' ? 'flightplan' : 'ai-composer',
    arcId: activePost.arcId,
    variants: [],
  });

  const tsDisplay = activePost.publishedAt || activePost.scheduledAt || activePost.createdAt;
  const formattedTs = tsDisplay ? format(new Date(tsDisplay), 'MMM d, yyyy · h:mm a') : '';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Post Detail Inspector"
    >
      <div
        className="w-full max-w-2xl bg-[#FAF9F6] h-full overflow-y-auto shadow-2xl border-l border-[#E8E0D4] p-5 sm:p-6 flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E8E0D4] pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: activePost.hookColor }}
              >
                {activePost.hookLabel}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-[#E8E0D4] text-[#57534E]">
                {activePost.wordCount} words · {activePost.contentFormat}
              </span>
              {activePost.hookScore > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                  Hook Score: {activePost.hookScore}/100
                </span>
              )}
              {activePost.isGoldenHour && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  <Flame className="w-3 h-3" /> Golden Hour ({activePost.goldenHourRemainingMin}m left)
                </span>
              )}
            </div>
            <p className="text-xs text-[#78716C] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {activePost.effectiveStatus.toUpperCase()} · {formattedTs}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activePost.effectiveStatus === 'published' && (
              <button
                type="button"
                onClick={handleRefreshLive}
                disabled={syncingLive}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-[#E8E0D4] text-xs font-medium text-[#1A1612] hover:border-[#C8613D] disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#C8613D] ${syncingLive ? 'animate-spin' : ''}`} />
                <span>{syncingLive ? 'Syncing…' : 'Sync Live'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Post Inspector"
              className="p-2 rounded-xl bg-white border border-[#E8E0D4] text-[#57534E] hover:text-[#1A1612]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary KPI Strip for Scoped Post */}
        {(() => {
          const showPostReactions =
            activePost.variants.length === 0 || activePost.variants.some(v => v.capability.supportedMetrics.likes);
          const summaryMetrics = [
            { label: 'Views', val: activePost.scopedEngagement.views !== null ? String(activePost.scopedEngagement.views) : 'N/A' },
            ...(showPostReactions
              ? [{ label: 'Reactions', val: String(activePost.scopedEngagement.likes) }]
              : []),
            { label: 'Comments', val: String(activePost.scopedEngagement.comments) },
            { label: 'Shares', val: String(activePost.scopedEngagement.shares) },
            { label: 'Saves/Clicks', val: String(activePost.scopedEngagement.saves + activePost.scopedEngagement.clicks) },
            {
              label: 'Eng. Rate',
              val: activePost.scopedEngagement.engagementRate !== null ? `${activePost.scopedEngagement.engagementRate}%` : 'N/A',
            },
          ];

          return (
            <div className={`grid grid-cols-3 ${showPostReactions ? 'sm:grid-cols-6' : 'sm:grid-cols-5'} gap-2`}>
              {summaryMetrics.map(m => (
                <div key={m.label} className="bg-white border border-[#E8E0D4] rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-medium text-[#78716C] uppercase">{m.label}</div>
                  <div className="text-sm font-bold text-[#1A1612] mt-0.5 tabular-nums">{m.val}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Master Copy */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[#57534E] uppercase tracking-wide">Master Post Copy</h4>
            <button
              type="button"
              onClick={() => copyText('master', activePost.content)}
              className="inline-flex items-center gap-1 text-xs text-[#C8613D] font-medium hover:underline"
            >
              {copiedId === 'master' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'master' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-sm text-[#1A1612] whitespace-pre-wrap leading-relaxed">{activePost.content}</p>
        </div>

        {/* Per-Variant Breakdown (All Accounts, Keyed by variant.id) */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-[#57534E] uppercase tracking-wide">
            Channel & Account Variants ({activePost.variants.length})
          </h4>
          {activePost.variants.map(v => {
            const cfg = getPlatformConfig(v.canonicalPlatform);
            return (
              <div key={v.id} className="bg-white border border-[#E8E0D4] rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PlatformBrandLogo platform={v.canonicalPlatform} className="w-5 h-5" />
                    <div>
                      <div className="text-xs font-semibold text-[#1A1612] flex items-center gap-1.5">
                        <span>{cfg?.name || v.capability.label}</span>
                        {v.accountLabel && (
                          <span className="text-[11px] font-normal text-[#78716C]">({v.accountLabel})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#78716C] flex items-center gap-2">
                        <span>Status: {v.status}</span>
                        <span>·</span>
                        <span>{v.capability.capabilitySummary}</span>
                        {v.lastSyncedAt && (
                          <>
                            <span>·</span>
                            <span>Synced {format(new Date(v.lastSyncedAt), 'MMM d, h:mm a')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.platformUrl ? (
                      <a
                        href={v.platformUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#C8613D] hover:underline"
                      >
                        <span>View live</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : v.status === 'published' ? (
                      <span className="text-[11px] text-[#78716C]">Published (permalink unavailable)</span>
                    ) : null}
                    {v.status === 'published' && v.platformPostId && supportsRemotePostDeletion(v.canonicalPlatform) && (
                      confirmVariantDeleteId === v.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={deletingVariantId === v.id}
                            onClick={() => handleDeleteVariantLive(v.id)}
                            className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-medium hover:bg-rose-700 disabled:opacity-50"
                          >
                            {deletingVariantId === v.id ? 'Deleting…' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            disabled={deletingVariantId === v.id}
                            onClick={() => setConfirmVariantDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-white border border-[#E8E0D4] text-[#57534E] text-[11px] font-medium hover:text-[#1A1612]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmVariantDeleteId(v.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium hover:bg-rose-100"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete from {cfg?.name || v.capability.label}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {v.error && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2 text-xs text-rose-800">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{v.error}</span>
                    </span>
                    {v.status === 'failed' && (
                      <button
                        type="button"
                        disabled={retryingVariantId === v.id}
                        onClick={() => handleRetryVariant(v.id)}
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-700 text-white text-[11px] font-medium hover:bg-rose-800 disabled:opacity-50"
                      >
                        {retryingVariantId === v.id ? 'Retrying…' : 'Retry'}
                      </button>
                    )}
                  </div>
                )}

                {v.syncStatus !== 'synced' && v.syncStatus !== 'unsupported' && v.syncError && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                    Sync notice ({v.syncStatus}): {v.syncError}
                  </div>
                )}

                <div className={`grid ${v.capability.supportedMetrics.likes ? 'grid-cols-5' : 'grid-cols-4'} gap-2 text-center bg-[#FAF7F2] rounded-xl p-2 text-xs`}>
                  <div>
                    <div className="text-[10px] text-[#78716C]">{v.capability.viewsLabel}</div>
                    <div className="font-semibold text-[#1A1612] tabular-nums">
                      {v.views !== null ? v.views : 'N/A'}
                    </div>
                  </div>
                  {v.capability.supportedMetrics.likes && (
                    <div>
                      <div className="text-[10px] text-[#78716C]">{v.capability.likesLabel}</div>
                      <div className="font-semibold text-[#1A1612] tabular-nums">
                        {v.likes}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] text-[#78716C]">{v.capability.commentsLabel}</div>
                    <div className="font-semibold text-[#1A1612] tabular-nums">
                      {v.capability.supportedMetrics.comments ? v.comments : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#78716C]">{v.capability.sharesLabel}</div>
                    <div className="font-semibold text-[#1A1612] tabular-nums">
                      {v.capability.supportedMetrics.shares ? v.shares : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#78716C]">ER</div>
                    <div className="font-semibold text-[#1A1612] tabular-nums">
                      {v.engagementRate !== null ? `${v.engagementRate}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                {Object.keys(v.rawExtras).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-[#57534E]">
                    {Object.entries(v.rawExtras).map(([k, val]) => (
                      <span key={k} className="px-2 py-0.5 rounded-lg bg-[#FAF7F2] border border-[#E8E0D4]">
                        {k}: <strong>{String(val)}</strong>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-[#78716C] flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{v.capability.apiLimitationNote}</span>
                </p>

                {v.adaptedContent && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium text-[#57534E] hover:text-[#1A1612]">
                      View adapted copy ({v.adaptedContent.length} chars)
                    </summary>
                    <p className="mt-2 p-2.5 rounded-xl bg-[#FAF7F2] text-[#1A1612] whitespace-pre-wrap">
                      {v.adaptedContent}
                    </p>
                  </details>
                )}
              </div>
            );
          })}
        </div>

        {/* Historical Snapshot Checkpoints */}
        {(loadingSnapshots || snapshots.length > 0) && (
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-semibold text-[#57534E] uppercase tracking-wide flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Metric Sync Checkpoints</span>
            </h4>
            {loadingSnapshots ? (
              <div className="text-xs text-[#78716C] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading recorded snapshots…
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {snapshots.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-[#F3EFE8] last:border-0">
                    <span className="text-[#57534E]">
                      {s.platform} · {format(new Date(s.capturedAt), 'MMM d, h:mm a')}
                    </span>
                    <span className="tabular-nums font-medium text-[#1A1612]">
                      {s.totalEngagements} eng {s.views !== null ? `· ${s.views} views` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cross-Module Actions Footer */}
        <div className="mt-auto pt-4 border-t border-[#E8E0D4] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {activePost.effectiveStatus === 'published' && (
              <Link
                href={`/dashboard/studio?hookStyle=${encodeURIComponent(activePost.hookType)}&winningHook=${encodeURIComponent(extractLeadHook(activePost.content))}&followUpPostId=${encodeURIComponent(activePost.id)}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#C8613D] text-white text-xs font-semibold hover:bg-[#B25332]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Write follow-up using this winning hook</span>
              </Link>
            )}
            <Link
              href={`/dashboard/composer?repurposePostId=${activePost.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1A1612] text-white text-xs font-medium hover:bg-[#332C25]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Repurpose in Studio</span>
            </Link>
            {activePost.effectiveStatus === 'draft' || activePost.effectiveStatus === 'scheduled' ? (
              <Link
                href={draftNav.href}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E8E0D4] text-[#1A1612] text-xs font-medium hover:border-[#C8613D]"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{draftNav.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : null}
            {profileSubdomain && activePost.effectiveStatus === 'published' && (
              <button
                type="button"
                onClick={() => onShareStory?.(activePost)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E8E0D4] text-[#1A1612] text-xs font-medium hover:border-[#C8613D]"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Story</span>
              </button>
            )}
          </div>
          {confirmPostDelete ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting…' : 'Delete Live & Remove'}</span>
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDelete(false)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E8E0D4] text-[#57534E] text-xs font-medium hover:text-[#1A1612] disabled:opacity-50"
              >
                <span>Remove from Unool Only</span>
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmPostDelete(false)}
                className="px-2.5 py-2 rounded-xl text-xs font-medium text-[#78716C] hover:text-[#1A1612]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                if (hasLiveDeletableVariants) {
                  setConfirmPostDelete(true);
                } else {
                  handleDelete(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium hover:bg-rose-100 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Deleting…' : 'Delete Post'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
