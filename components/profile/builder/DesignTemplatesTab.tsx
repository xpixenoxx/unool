'use client';

import React from 'react';
import { Moon, Palette, ShieldCheck, Sparkles, Sun, Type } from 'lucide-react';
import { contrastRatio, normalizeHex } from '@/lib/profile/contrast';
import { UnifiedTemplatePicker } from './UnifiedTemplatePicker';
import {
  toPreviewPublicProfile,
  type AvatarStyleOption,
  type BuilderProfileState,
  type ColorModeOption,
  type FontPairingOption,
} from './types';

interface DesignTemplatesTabProps {
  profile: BuilderProfileState;
  claimedSubdomain: string;
  maxTemplatesAllowed?: number;
  onChange: (updater: (prev: BuilderProfileState) => BuilderProfileState) => void;
}

const ACCENT_SWATCHES = [
  '#2563EB', // Cobalt
  '#0D9488', // Deep Teal
  '#1D3B2F', // British Racing Green
  '#7C3AED', // Electric Violet
  '#B84215', // Burnt Terracotta
  '#C026D3', // Magenta Pulse
  '#D94A38', // Swiss Vermilion
  '#B89B5E', // Studio Gold
];

const COLOR_MODES: Array<{ id: ColorModeOption; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'auto', label: 'Template Default', icon: Sparkles },
  { id: 'light', label: 'Light Mode', icon: Sun },
  { id: 'dark', label: 'Dark Mode', icon: Moon },
];

const FONT_PAIRINGS: Array<{ id: FontPairingOption; label: string; sample: string; stackClass: string }> = [
  { id: 'grotesk', label: 'Modern Grotesk', sample: 'Clean Sans Interface', stackClass: 'font-sans' },
  { id: 'editorial', label: 'Editorial Serif', sample: 'High-Contrast Serif', stackClass: 'font-serif' },
  { id: 'classic', label: 'Classic Book', sample: 'Timeless Georgian Print', stackClass: 'font-serif' },
  { id: 'mono', label: 'Technical Mono', sample: 'SYS // SPECIFICATION', stackClass: 'font-mono' },
];

const AVATAR_STYLES: Array<{ id: AvatarStyleOption; label: string; radiusClass: string }> = [
  { id: 'circle', label: 'Circle', radiusClass: 'rounded-full' },
  { id: 'rounded', label: 'Rounded', radiusClass: 'rounded-xl' },
  { id: 'square', label: 'Square', radiusClass: 'rounded-none' },
];

export function DesignTemplatesTab({
  profile,
  claimedSubdomain,
  maxTemplatesAllowed = 24,
  onChange,
}: DesignTemplatesTabProps) {
  const safeAccent = normalizeHex(profile.theme.accentColor, '#2563EB');
  const contrastWhite = contrastRatio(safeAccent, '#FFFFFF');
  const contrastDark = contrastRatio(safeAccent, '#0F172A');
  const bestRatio = Math.max(contrastWhite, contrastDark);

  return (
    <div className="space-y-6">
      {/* Theme Tokens Customization */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              Design System Tokens
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Customize accent contrast, light/dark polarity, typography pairing, and portrait geometry across every template.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
              bestRatio >= 4.5
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            WCAG AA Auto-Adjusted ({bestRatio.toFixed(1)}:1 peak)
          </span>
        </div>

        {/* Accent Color Swatches + Custom Hex */}
        <div className="space-y-2">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Accent Color</span>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_SWATCHES.map((hex) => {
              const selected = safeAccent.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={hex}
                  type="button"
                  aria-label={`Select accent color ${hex}`}
                  aria-pressed={selected}
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      theme: { ...prev.theme, accentColor: hex },
                    }))
                  }
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    selected ? 'border-zinc-900 dark:border-white scale-110 ring-2 ring-zinc-900/20' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              );
            })}

            <div className="flex items-center gap-1.5 ml-1">
              <label htmlFor="accent-color-picker" className="sr-only">
                Pick custom accent hex color
              </label>
              <input
                id="accent-color-picker"
                type="color"
                value={safeAccent}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    theme: { ...prev.theme, accentColor: e.target.value },
                  }))
                }
                className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-200 dark:border-zinc-700 bg-transparent p-0.5"
              />
              <input
                type="text"
                aria-label="Accent hex code"
                value={profile.theme.accentColor}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    theme: { ...prev.theme, accentColor: e.target.value },
                  }))
                }
                placeholder="#2563EB"
                className="w-24 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Color Mode + Avatar Geometry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Surface Color Mode</span>
            <div className="grid grid-cols-3 gap-1.5">
              {COLOR_MODES.map((m) => {
                const Icon = m.icon;
                const active = profile.theme.colorMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      onChange((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, colorMode: m.id },
                      }))
                    }
                    className={`px-2.5 py-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                      active
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="text-[11px] truncate max-w-full">{m.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Portrait Frame Shape</span>
            <div className="grid grid-cols-3 gap-1.5">
              {AVATAR_STYLES.map((st) => {
                const active = profile.theme.avatarStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      onChange((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, avatarStyle: st.id },
                      }))
                    }
                    className={`px-2.5 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                      active
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 border border-current ${st.radiusClass}`} aria-hidden="true" />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Typography Pairing */}
        <div className="space-y-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <Type className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
            Typography Pairing
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FONT_PAIRINGS.map((fp) => {
              const active = profile.theme.fontPairing === fp.id;
              return (
                <button
                  key={fp.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      theme: { ...prev.theme, fontPairing: fp.id },
                    }))
                  }
                  className={`p-2.5 rounded-xl border text-left transition-colors ${
                    active
                      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <div className={`text-xs font-semibold ${fp.stackClass}`}>{fp.label}</div>
                  <div className={`text-[10px] opacity-75 truncate mt-0.5 ${fp.stackClass}`}>{fp.sample}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Unified 24-Template Gallery */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Choose Your Template</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Switch personas anytime — your bio, links, and proof points adapt automatically without data loss.
          </p>
        </div>

        <UnifiedTemplatePicker
          selectedTemplate={profile.theme.template}
          accentColor={safeAccent}
          profileData={toPreviewPublicProfile(profile, claimedSubdomain)}
          maxTemplatesAllowed={maxTemplatesAllowed}
          onSelect={(templateId) =>
            onChange((prev) => ({
              ...prev,
              theme: { ...prev.theme, template: templateId },
            }))
          }
        />
      </section>
    </div>
  );
}
