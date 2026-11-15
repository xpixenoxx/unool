'use client';

import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Lock, Maximize2, Monitor, Smartphone, X } from 'lucide-react';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import type { BuilderProfileState } from './types';
import { toPreviewPublicProfile } from './types';

interface LivePreviewPaneProps {
  profile: BuilderProfileState;
  claimedSubdomain: string;
  liveUrl: string | null;
  onCopyUrl: () => void;
  copied: boolean;
}

export function LivePreviewPane({
  profile,
  claimedSubdomain,
  liveUrl,
  onCopyUrl,
  copied,
}: LivePreviewPaneProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('mobile');
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreen]);

  const previewProfile = toPreviewPublicProfile(profile, claimedSubdomain);
  const displayDomain = profile.customDomain && profile.customDomainVerifiedAt
    ? profile.customDomain
    : claimedSubdomain
      ? `${claimedSubdomain}.unool.co`
      : 'your-handle.unool.co';

  return (
    <>
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col">
        {/* Browser Chrome Header */}
        <div className="px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                claimedSubdomain
                  ? profile.visibility === 'private'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                  : 'bg-zinc-400'
              }`}
              aria-hidden="true"
            />
            <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate flex items-center gap-1">
              {profile.visibility === 'private' && <Lock className="w-3 h-3 shrink-0 text-amber-500" aria-hidden="true" />}
              {displayDomain}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div
              className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-0.5"
              role="group"
              aria-label="Preview viewport width"
            >
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                aria-label="Mobile 390px preview"
                aria-pressed={viewport === 'mobile'}
                className={`p-1.5 rounded-md transition-colors ${
                  viewport === 'mobile'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                aria-label="Desktop preview"
                aria-pressed={viewport === 'desktop'}
                className={`p-1.5 rounded-md transition-colors ${
                  viewport === 'desktop'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {liveUrl && (
              <>
                <button
                  type="button"
                  onClick={onCopyUrl}
                  aria-label="Copy profile link"
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open live public profile"
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </>
            )}

            <button
              type="button"
              onClick={() => setFullscreen(true)}
              aria-label="Expand fullscreen preview"
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Live Canvas Frame (transform creates containing block so fixed headers stay scoped) */}
        <div className="bg-zinc-100 dark:bg-zinc-900 p-3 sm:p-4 flex justify-center">
          <div
            className={`relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto overflow-x-hidden shadow-inner transition-all duration-200 ${
              viewport === 'mobile' ? 'w-[390px] max-w-full' : 'w-full'
            }`}
            style={{
              height: 'min(74vh, 680px)',
              transform: 'translateZ(0)',
            }}
          >
            <ProfilePreview
              profile={previewProfile}
              templateId={profile.theme.template}
              accentColor={profile.theme.accentColor}
              isPreview={true}
            />
          </div>
        </div>

        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>
            Template: <strong className="text-zinc-800 dark:text-zinc-200 font-medium">{profile.theme.template}</strong>
          </span>
          <span>
            Visibility: <strong className="capitalize text-zinc-800 dark:text-zinc-200 font-medium">{profile.visibility}</strong>
          </span>
        </div>
      </div>

      {/* Fullscreen Live Preview Modal */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen profile preview"
        >
          <div className="px-5 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{profile.name || 'Live Profile Preview'}</span>
              <span className="text-xs font-mono text-zinc-400">{displayDomain}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewport(viewport === 'mobile' ? 'desktop' : 'mobile')}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-medium hover:bg-zinc-800 transition-colors"
              >
                Switch to {viewport === 'mobile' ? 'Desktop' : 'Mobile (390px)'}
              </button>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                aria-label="Close fullscreen preview"
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center">
            <div
              className={`bg-white dark:bg-zinc-950 rounded-xl overflow-y-auto overflow-x-hidden shadow-2xl ${
                viewport === 'mobile' ? 'w-[390px] max-w-full' : 'w-full max-w-6xl'
              }`}
              style={{ transform: 'translateZ(0)' }}
            >
              <ProfilePreview
                profile={previewProfile}
                templateId={profile.theme.template}
                accentColor={profile.theme.accentColor}
                isPreview={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
