'use client';

import React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowUpRight, X, ExternalLink } from 'lucide-react';
import { PlatformBrandLogo } from '@/components/dashboard/PlatformLogos';

/* ═══════════════════════════════════════════════════════════════
   BESPOKE HANDCRAFTED TOAST INSIGNIAS (NON-GENERIC, NON-AI)
   ═══════════════════════════════════════════════════════════════ */

function StudioSuccessInsignia() {
  return (
    <div className="relative w-8 h-8 rounded-xl flex items-center justify-center bg-[#EBF5EE] border border-[#CDE5D5] shadow-2xs">
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#2E7D46]">
        {/* Fine quadrant ticks */}
        <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        {/* Soft perimeter circle */}
        <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.45" />
        {/* Precision geometric checkmark */}
        <path d="M8 12.2L10.6 14.8L16.2 9.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* Ambient micro emerald spark */}
      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#34A853] border border-white" />
    </div>
  );
}

function StudioAlertInsignia() {
  return (
    <div className="relative w-8 h-8 rounded-xl flex items-center justify-center bg-[#FBEDED] border border-[#F2D0CE] shadow-2xs">
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#B85450]">
        {/* Softened faceted shield boundary */}
        <path
          d="M12 2.5L19.5 5.5V12C19.5 16.5 16.2 20.4 12 21.5C7.8 20.4 4.5 16.5 4.5 12V5.5L12 2.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="currentColor"
          fillOpacity="0.08"
          strokeLinejoin="round"
        />
        {/* Tapered alert needle */}
        <line x1="12" y1="7.5" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Anchored focal node */}
        <circle cx="12" cy="16.5" r="1.2" fill="currentColor" />
      </svg>
      {/* Ambient micro rose warning dot */}
      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D9383A] border border-white" />
    </div>
  );
}

function StudioInfoInsignia() {
  return (
    <div className="relative w-8 h-8 rounded-xl flex items-center justify-center bg-[#FAF4EB] border border-[#EADBCA] shadow-2xs">
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#C4A265]">
        {/* Compass diamond with aperture */}
        <rect x="5" y="5" width="14" height="14" rx="4" transform="rotate(45 12 12)" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.65" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="0.75" fill="currentColor" />
      </svg>
      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#C4A265] border border-white" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STUDIO TOAST CARD (BESPOKE EDITORIAL UI)
   ═══════════════════════════════════════════════════════════════ */

export interface StudioToastProps {
  id: string | number;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  description?: string;
  platforms?: string[];
  knowMoreUrl?: string;
  knowMoreLabel?: string;
}

export function StudioToastCard({
  id,
  type,
  title,
  message,
  description,
  platforms,
  knowMoreUrl,
  knowMoreLabel = 'Know more',
}: StudioToastProps) {
  const isError = type === 'error';
  const isSuccess = type === 'success';

  return (
    <div
      role="alert"
      className="relative w-full max-w-[420px] rounded-2xl p-4 border overflow-hidden backdrop-blur-xl transition-all select-none"
      style={{
        backgroundColor: isError ? '#FFFDFB' : isSuccess ? '#FBFCFA' : '#FAF8F5',
        borderColor: isError ? '#F2DEDE' : isSuccess ? '#D8EADF' : '#EADBCA',
        boxShadow: isError
          ? '0 16px 36px -6px rgba(184, 84, 80, 0.16), 0 4px 12px -2px rgba(45, 35, 25, 0.05)'
          : isSuccess
          ? '0 16px 36px -6px rgba(46, 125, 70, 0.14), 0 4px 12px -2px rgba(45, 35, 25, 0.05)'
          : '0 16px 36px -6px rgba(196, 162, 101, 0.16), 0 4px 12px -2px rgba(45, 35, 25, 0.05)',
      }}
    >
      {/* Architectural ambient gradient crown */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: isError
            ? 'linear-gradient(90deg, #B85450 0%, #E07A5F 50%, #B85450 100%)'
            : isSuccess
            ? 'linear-gradient(90deg, #4A8C5C 0%, #81C784 50%, #4A8C5C 100%)'
            : 'linear-gradient(90deg, #C4A265 0%, #E5C98E 50%, #C4A265 100%)',
        }}
      />

      <div className="flex items-start gap-3.5 pt-0.5">
        {/* Custom insignia */}
        <div className="flex-shrink-0 mt-0.5">
          {isError ? <StudioAlertInsignia /> : isSuccess ? <StudioSuccessInsignia /> : <StudioInfoInsignia />}
        </div>

        {/* Content body */}
        <div className="flex-1 min-w-0 pr-6">
          {/* Eyebrow status chip */}
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: isError ? '#FDE8E8' : isSuccess ? '#EBF5EE' : '#F7EFE2',
                color: isError ? '#9E2A2B' : isSuccess ? '#226D3B' : '#8B6B35',
              }}
            >
              {title || (isError ? 'Notice' : isSuccess ? 'Studio Ready' : 'Studio Info')}
            </span>

            {/* In-header Know More shortcut when URL provided */}
            {knowMoreUrl && (
              <a
                href={knowMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-[#8C2A25] hover:underline inline-flex items-center gap-0.5 transition-colors"
                title="Review terms of service and content criteria"
              >
                <span>Terms</span>
                <ArrowUpRight className="w-2.5 h-2.5 opacity-70" />
              </a>
            )}
          </div>

          {/* Primary message */}
          <p className="text-sm font-semibold leading-snug" style={{ color: '#2D2319' }}>
            {message}
          </p>

          {/* Optional secondary description */}
          {description && (
            <p className="text-xs text-[#8B7355] mt-1 leading-normal">
              {description}
            </p>
          )}

          {/* Platform chips (if applicable) */}
          {platforms && platforms.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
              {platforms.map(p => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border shadow-2xs"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E8E0D4',
                    color: '#3D2B1F',
                  }}
                >
                  <PlatformBrandLogo platform={p} size={13} />
                  <span className="capitalize">{p}</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isSuccess ? '#34A853' : '#D9383A' }}
                  />
                </span>
              ))}
            </div>
          )}

          {/* Dedicated "Know More" action banner when generation is blocked */}
          {knowMoreUrl && (
            <div className="mt-3 pt-2.5 flex items-center justify-between gap-3 border-t border-black/5">
              <span className="text-[11px] text-[#8B7355] leading-tight">
                Review acceptable use & platform criteria
              </span>
              <a
                href={knowMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs group flex-shrink-0"
                style={{
                  backgroundColor: '#2D2319',
                  color: '#FAF7F2',
                }}
              >
                {/* Handcrafted Know More glyph */}
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-[#C4A265]" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeOpacity="0.8" />
                  <line x1="8" y1="7.5" x2="8" y2="11.5" stroke="currentColor" strokeLinecap="round" />
                  <circle cx="8" cy="4.5" r="0.85" fill="currentColor" stroke="none" />
                </svg>
                <span>{knowMoreLabel}</span>
                <ArrowUpRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          )}
        </div>

        {/* Minimalist dismiss button */}
        <button
          type="button"
          onClick={() => toast.dismiss(id)}
          className="absolute top-3 right-3 p-1 rounded-lg text-[#8B7355] hover:text-[#2D2319] hover:bg-black/5 transition-colors cursor-pointer"
          title="Dismiss notification"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STUDIO TOAST CONTROLLER API
   ═══════════════════════════════════════════════════════════════ */

export interface StudioToastOptions {
  title?: string;
  description?: string;
  platforms?: string[];
  knowMoreUrl?: string;
  knowMoreLabel?: string;
  duration?: number;
}

export const studioToast = {
  /**
   * Success notification in Studio (e.g., "Generated drafts for all 2 platforms!")
   */
  success: (message: string, options?: StudioToastOptions) => {
    return toast.custom(
      id => (
        <StudioToastCard
          id={id}
          type="success"
          title={options?.title || 'Drafts Ready'}
          message={message}
          description={options?.description}
          platforms={options?.platforms}
          knowMoreUrl={options?.knowMoreUrl}
        />
      ),
      { duration: options?.duration ?? 5000 }
    );
  },

  /**
   * Generation failure notification with "Know more" symbol linking to /terms
   */
  generationFailed: (message: string, options?: StudioToastOptions) => {
    return toast.custom(
      id => (
        <StudioToastCard
          id={id}
          type="error"
          title={options?.title || 'Generation Notice'}
          message={message}
          description={options?.description}
          platforms={options?.platforms}
          knowMoreUrl={options?.knowMoreUrl || '/terms'}
          knowMoreLabel={options?.knowMoreLabel || 'Know more'}
        />
      ),
      { duration: options?.duration ?? 8000 }
    );
  },

  /**
   * Error notification with automatic "Know more" symbol redirecting to /terms
   * if post generation or adaptation is prevented
   */
  error: (message: string, options?: StudioToastOptions) => {
    const isGenerationRelated =
      /adapt|generat|platform|draft|limit|safety|policy|criteria|prevented|reject/i.test(message);
    const knowMoreUrl = options?.knowMoreUrl || (isGenerationRelated ? '/terms' : undefined);

    return toast.custom(
      id => (
        <StudioToastCard
          id={id}
          type="error"
          title={options?.title || (isGenerationRelated ? 'Generation Notice' : 'Studio Error')}
          message={message}
          description={options?.description}
          platforms={options?.platforms}
          knowMoreUrl={knowMoreUrl}
          knowMoreLabel={options?.knowMoreLabel || 'Know more'}
        />
      ),
      { duration: options?.duration ?? 7000 }
    );
  },

  /**
   * Informational notification (e.g. de-slop updates, hints)
   */
  info: (message: string, options?: StudioToastOptions) => {
    return toast.custom(
      id => (
        <StudioToastCard
          id={id}
          type="info"
          title={options?.title || 'Studio Note'}
          message={message}
          description={options?.description}
          platforms={options?.platforms}
          knowMoreUrl={options?.knowMoreUrl}
        />
      ),
      { duration: options?.duration ?? 4500 }
    );
  },
};

