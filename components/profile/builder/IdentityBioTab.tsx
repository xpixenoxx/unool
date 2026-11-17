'use client';

import React, { useRef, useState } from 'react';
import {
  Briefcase,
  Building2,
  Clock,
  Globe,
  Loader2,
  MapPin,
  Sparkles,
  Trash2,
  Upload,
  User,
  Wand2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { OpenToSelector } from '@/components/profile/OpenToBadges';
import type { BuilderProfileState } from './types';

interface StudioProfileContext {
  role?: string;
  businessDomain?: string;
  doing?: string;
  audience?: string;
  tone?: string;
}

interface IdentityBioTabProps {
  profile: BuilderProfileState;
  studioProfile: StudioProfileContext | null;
  onChange: (updater: (prev: BuilderProfileState) => BuilderProfileState) => void;
}

const AVAILABILITY_PRESETS = [
  'Open to advisory',
  'Taking Q2 clients',
  'Open to roles',
  'Limited availability',
];

const MAGIC_STEPS = [
  'Fetching source page metadata...',
  'Extracting role, highlights & proof...',
  'Structuring bio & verified links...',
];

export function IdentityBioTab({ profile, studioProfile, onChange }: IdentityBioTabProps) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [magicStep, setMagicStep] = useState(0);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleMagicExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = sourceUrl.trim();
    if (!raw) return;

    const normalizedUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    setExtractError(null);
    setGenerating(true);
    setMagicStep(0);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const t1 = setTimeout(() => setMagicStep(1), 900);
    const t2 = setTimeout(() => setMagicStep(2), 2000);

    try {
      let res = await fetch('/api/profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (!res.ok) {
        res = await fetch('/api/profile/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify({ url: normalizedUrl }),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.profile) {
        throw new Error(data.error || 'Could not extract details from that URL');
      }

      const ext = data.profile;
      onChange((prev) => ({
        ...prev,
        name: ext.name || prev.name,
        headline: ext.headline || prev.headline,
        bio: ext.bio || prev.bio,
        role: ext.role || prev.role,
        company: ext.company || prev.company,
        links: Array.isArray(ext.links) && ext.links.length > 0
          ? ext.links.map((l: any, idx: number) => ({
              id: l.id || `ext-link-${Date.now()}-${idx}`,
              label: String(l.label || ''),
              url: String(l.url || ''),
              icon: l.icon || null,
              type: l.type,
              category: l.category || 'other',
              clicks: 0,
              order: idx,
              isVisible: true,
            }))
          : prev.links,
        proofPoints: Array.isArray(ext.proofPoints) && ext.proofPoints.length > 0
          ? ext.proofPoints.map((p: any, idx: number) => ({
              id: `ext-proof-${Date.now()}-${idx}`,
              type: String(p.type || 'metric'),
              value: String(p.value || ''),
              url: p.url ? String(p.url) : '',
            }))
          : prev.proofPoints,
      }));

      toast.success('Profile details autofilled');
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Autofill failed';
      setExtractError(msg);
      toast.error(msg);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setGenerating(false);
    }
  };

  const handleSyncFromStudio = () => {
    if (!studioProfile) return;
    const derivedRole = studioProfile.role || '';
    const derivedDomain = studioProfile.businessDomain || studioProfile.doing || '';
    const derivedHeadline = derivedRole && derivedDomain
      ? `${derivedRole} — ${derivedDomain}`
      : derivedRole || derivedDomain;

    onChange((prev) => ({
      ...prev,
      role: prev.role.trim() || derivedRole,
      headline: prev.headline.trim() || derivedHeadline,
      bio: prev.bio.trim() || (derivedDomain
        ? `${derivedRole ? `${derivedRole} focused on ` : ''}${derivedDomain}${studioProfile.audience ? ` for ${studioProfile.audience}` : ''}.`
        : prev.bio),
    }));
    toast.success('Synced empty fields from Studio AI context');
  };

  const uploadAvatarFile = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, WebP, or GIF image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar image must be smaller than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to upload avatar');
      }
      onChange((prev) => ({ ...prev, avatarUrl: data.url }));
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setRemovingAvatar(true);
    try {
      await fetch('/api/profile/avatar', {
        method: 'DELETE',
        credentials: 'include',
      });
      onChange((prev) => ({ ...prev, avatarUrl: '' }));
      toast.success('Avatar removed');
    } catch {
      toast.error('Could not remove avatar');
    } finally {
      setRemovingAvatar(false);
    }
  };

  const handleDetectTimezone = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        onChange((prev) => ({ ...prev, timezone: tz }));
        toast.success(`Timezone set to ${tz}`);
      }
    } catch {
      toast.error('Could not detect browser timezone');
    }
  };

  const avatarRadius =
    profile.theme.avatarStyle === 'square'
      ? 'rounded-xl'
      : profile.theme.avatarStyle === 'rounded'
        ? 'rounded-2xl'
        : 'rounded-full';

  return (
    <div className="space-y-6">
      {/* AI Autofill & Studio Context Sync */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
              Smart Profile Autofill
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Import your name, bio, links, and proof points from your personal website, GitHub, or portfolio URL.
            </p>
          </div>

          {studioProfile && (studioProfile.role || studioProfile.doing || studioProfile.businessDomain) && (
            <button
              type="button"
              onClick={handleSyncFromStudio}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              Fill empty fields from Studio AI
            </button>
          )}
        </div>

        <form onSubmit={handleMagicExtract} className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="autofill-url-input" className="sr-only">
            Website or profile URL to autofill from
          </label>
          <input
            id="autofill-url-input"
            type="text"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://yourdomain.com or github.com/username"
            disabled={generating}
            className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
          {generating ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 inline-flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              disabled={!sourceUrl.trim()}
              className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity inline-flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Autofill
            </button>
          )}
        </form>

        {generating && (
          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300" role="status" aria-live="polite">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" aria-hidden="true" />
            <span>{MAGIC_STEPS[magicStep]}</span>
          </div>
        )}

        {extractError && (
          <p className="text-xs text-red-600 dark:text-red-400" role="alert">
            {extractError}
          </p>
        )}
      </section>

      {/* Avatar Upload */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Profile Photo</h2>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) uploadAvatarFile(dropped);
          }}
          className={`flex flex-wrap items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-colors ${
            dragActive
              ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div
            className={`w-16 h-16 ${avatarRadius} bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center shrink-0`}
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name || 'Avatar preview'} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-zinc-400" aria-hidden="true" />
            )}
          </div>

          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
              Drag & drop a portrait photo, or choose a file
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              JPG, PNG, WebP or GIF up to 5MB.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const chosen = e.target.files?.[0];
                  if (chosen) uploadAvatarFile(chosen);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50"
              >
                {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploadingAvatar ? 'Uploading...' : profile.avatarUrl ? 'Replace Photo' : 'Upload Photo'}
              </button>

              {profile.avatarUrl && (
                <button
                  type="button"
                  disabled={removingAvatar}
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Core Identity Form */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Core Identity & Positioning</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-name" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Display Name
            </label>
            <input
              id="profile-name"
              type="text"
              maxLength={120}
              value={profile.name}
              onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Maya Lin"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          <div>
            <label htmlFor="profile-headline" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Headline
            </label>
            <input
              id="profile-headline"
              type="text"
              maxLength={220}
              value={profile.headline}
              onChange={(e) => onChange((prev) => ({ ...prev, headline: e.target.value }))}
              placeholder="Design Engineer building fast web tools"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          <div>
            <label htmlFor="profile-role" className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <Briefcase className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
              Role / Title
            </label>
            <input
              id="profile-role"
              type="text"
              maxLength={120}
              value={profile.role}
              onChange={(e) => onChange((prev) => ({ ...prev, role: e.target.value }))}
              placeholder="Principal Architect"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          <div>
            <label htmlFor="profile-company" className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
              Company / Studio
            </label>
            <input
              id="profile-company"
              type="text"
              maxLength={120}
              value={profile.company}
              onChange={(e) => onChange((prev) => ({ ...prev, company: e.target.value }))}
              placeholder="Atelier Labs"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          <div>
            <label htmlFor="profile-location" className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
              Location
            </label>
            <input
              id="profile-location"
              type="text"
              maxLength={120}
              value={profile.location}
              onChange={(e) => onChange((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="San Francisco, CA"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="profile-timezone" className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <Globe className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                Timezone
              </label>
              <button
                type="button"
                onClick={handleDetectTimezone}
                className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:underline"
              >
                Auto-detect
              </button>
            </div>
            <input
              id="profile-timezone"
              type="text"
              maxLength={64}
              value={profile.timezone}
              onChange={(e) => onChange((prev) => ({ ...prev, timezone: e.target.value }))}
              placeholder="America/Los_Angeles"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>
        </div>

        {/* Availability Badge */}
        <div>
          <label htmlFor="profile-availability" className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
            Availability Status Badge
          </label>
          <input
            id="profile-availability"
            type="text"
            maxLength={64}
            value={profile.availabilityBadge}
            onChange={(e) => onChange((prev) => ({ ...prev, availabilityBadge: e.target.value }))}
            placeholder="e.g. Available for Q2 advisory"
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {AVAILABILITY_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, availabilityBadge: preset }))}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                  profile.availabilityBadge === preset
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="profile-bio" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              About / Bio
            </label>
            <span className="text-[11px] font-mono text-zinc-400">
              {profile.bio.length} / 3000
            </span>
          </div>
          <textarea
            id="profile-bio"
            rows={4}
            maxLength={3000}
            value={profile.bio}
            onChange={(e) => onChange((prev) => ({ ...prev, bio: e.target.value }))}
            placeholder="Share what you're building, who you help, and what visitors should know first."
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-y"
          />
        </div>
      </section>

      {/* Open To Intents */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
        <OpenToSelector
          selected={profile.openTo}
          onChange={(intents) => onChange((prev) => ({ ...prev, openTo: intents }))}
          colors={{
            bg: 'transparent',
            card: '#ffffff',
            border: '#e4e4e7',
            text: '#18181b',
            textMuted: '#71717a',
            accent: '#18181b',
            accentBg: '#f4f4f5',
          }}
        />
      </section>
    </div>
  );
}

