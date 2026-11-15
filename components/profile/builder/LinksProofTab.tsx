'use client';

import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Award,
  Calendar,
  Eye,
  EyeOff,
  Link2,
  Mail,
  MessageSquare,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { isSafeHref } from '@/lib/validation/profileSchemas';
import type { BuilderLink, BuilderProfileState, BuilderProofPoint, BuilderSectionVisibility } from './types';

interface LinksProofTabProps {
  profile: BuilderProfileState;
  onChange: (updater: (prev: BuilderProfileState) => BuilderProfileState) => void;
}

const LINK_CATEGORIES: Array<{ value: NonNullable<BuilderLink['category']>; label: string }> = [
  { value: 'primary', label: 'Primary CTA' },
  { value: 'work', label: 'Work / Portfolio' },
  { value: 'social', label: 'Social' },
  { value: 'writing', label: 'Writing / Press' },
  { value: 'resource', label: 'Resource' },
  { value: 'other', label: 'Other' },
];

const PROOF_TYPES = [
  { value: 'metric', label: 'Metric' },
  { value: 'customer', label: 'Customers' },
  { value: 'product', label: 'Product / Project' },
  { value: 'press', label: 'Press' },
  { value: 'funding', label: 'Funding' },
  { value: 'team', label: 'Team' },
];

const VISIBILITY_CONTROLS: Array<{
  key: keyof BuilderSectionVisibility;
  label: string;
  description: string;
}> = [
  { key: 'proofs', label: 'Proof & Highlights', description: 'Metrics, customers, press, and case studies.' },
  { key: 'openTo', label: 'Open To Intents', description: 'Availability badges for hiring, advisory, and coffee chats.' },
  { key: 'activity', label: 'Latest Broadcast', description: 'Most recent published Studio post card.' },
  { key: 'contactCta', label: 'Direct Contact Dock', description: 'Message modal trigger, vCard, and booking actions.' },
  { key: 'footerBadge', label: 'Show Unool Footer Badge', description: 'Hide on Creator plan or higher.' },
];

export function LinksProofTab({ profile, onChange }: LinksProofTabProps) {
  const handleAddLink = () => {
    const nextOrder = profile.links.length;
    onChange((prev) => ({
      ...prev,
      links: [
        ...prev.links,
        {
          id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label: '',
          url: 'https://',
          icon: null,
          category: 'work',
          isPrimary: false,
          badge: '',
          clicks: 0,
          order: nextOrder,
          isVisible: true,
        },
      ],
    }));
  };

  const handleUpdateLink = (index: number, patch: Partial<BuilderLink>) => {
    onChange((prev) => {
      const next = [...prev.links];
      next[index] = { ...next[index], ...patch };
      return { ...prev, links: next };
    });
  };

  const handleMoveLink = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= profile.links.length) return;
    onChange((prev) => {
      const next = [...prev.links];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return {
        ...prev,
        links: next.map((l, idx) => ({ ...l, order: idx })),
      };
    });
  };

  const handleDeleteLink = (index: number) => {
    onChange((prev) => ({
      ...prev,
      links: prev.links.filter((_, idx) => idx !== index).map((l, idx) => ({ ...l, order: idx })),
    }));
  };

  const handleAddProof = () => {
    onChange((prev) => ({
      ...prev,
      proofPoints: [
        ...prev.proofPoints,
        { id: `proof-${Date.now()}`, type: 'metric', value: '', url: '' },
      ],
    }));
  };

  const handleUpdateProof = (index: number, patch: Partial<BuilderProofPoint>) => {
    onChange((prev) => {
      const next = [...prev.proofPoints];
      next[index] = { ...next[index], ...patch };
      return { ...prev, proofPoints: next };
    });
  };

  const handleDeleteProof = (index: number) => {
    onChange((prev) => ({
      ...prev,
      proofPoints: prev.proofPoints.filter((_, idx) => idx !== index),
    }));
  };

  const toggleSectionVisibility = (key: keyof BuilderSectionVisibility) => {
    onChange((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        sectionVisibility: {
          ...prev.theme.sectionVisibility,
          [key]: !prev.theme.sectionVisibility[key],
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Links CRUD */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              Profile Links ({profile.links.length} / 30)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Reorder destinations, highlight primary actions, or hide links without deleting click stats.
            </p>
          </div>
          <button
            type="button"
            disabled={profile.links.length >= 30}
            onClick={handleAddLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add Link
          </button>
        </div>

        {profile.links.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No links yet. Add your portfolio, newsletter, GitHub, or booking link.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.links.map((link, idx) => {
              const urlValid = !link.url.trim() || link.url.trim() === 'https://' || isSafeHref(link.url, { allowMailto: true });
              return (
                <div
                  key={link.id || idx}
                  className={`rounded-xl border p-3.5 space-y-3 transition-opacity ${
                    link.isVisible
                      ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40'
                      : 'border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-100/50 dark:bg-zinc-900/20 opacity-65'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="flex-1">
                      <label htmlFor={`link-label-${idx}`} className="sr-only">
                        Link {idx + 1} label
                      </label>
                      <input
                        id={`link-label-${idx}`}
                        type="text"
                        maxLength={100}
                        value={link.label}
                        onChange={(e) => handleUpdateLink(idx, { label: e.target.value })}
                        placeholder="Link title (e.g. Case Studies)"
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                    <div className="flex-[1.4]">
                      <label htmlFor={`link-url-${idx}`} className="sr-only">
                        Link {idx + 1} URL
                      </label>
                      <input
                        id={`link-url-${idx}`}
                        type="url"
                        maxLength={2048}
                        value={link.url}
                        onChange={(e) => handleUpdateLink(idx, { url: e.target.value })}
                        placeholder="https://example.com"
                        className={`w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 ${
                          urlValid
                            ? 'border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900'
                            : 'border-red-400 focus:ring-red-500'
                        }`}
                      />
                    </div>
                  </div>

                  {!urlValid && (
                    <p className="text-[11px] text-red-600 dark:text-red-400">
                      Enter a valid https://, http://, or mailto: URL.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Link ${idx + 1} category`}
                        value={link.category || 'other'}
                        onChange={(e) => handleUpdateLink(idx, { category: e.target.value as BuilderLink['category'] })}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300"
                      >
                        {LINK_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        maxLength={32}
                        aria-label={`Link ${idx + 1} badge`}
                        value={link.badge || ''}
                        onChange={(e) => handleUpdateLink(idx, { badge: e.target.value })}
                        placeholder="Badge (optional)"
                        className="w-28 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300"
                      />

                      <button
                        type="button"
                        aria-pressed={Boolean(link.isPrimary)}
                        onClick={() => handleUpdateLink(idx, { isPrimary: !link.isPrimary })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          link.isPrimary
                            ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Star className="w-3 h-3" aria-hidden="true" />
                        Featured
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateLink(idx, { isVisible: !link.isVisible })}
                        aria-label={link.isVisible ? `Hide link ${idx + 1}` : `Show link ${idx + 1}`}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                      >
                        {link.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveLink(idx, -1)}
                        aria-label={`Move link ${idx + 1} up`}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === profile.links.length - 1}
                        onClick={() => handleMoveLink(idx, 1)}
                        aria-label={`Move link ${idx + 1} down`}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLink(idx)}
                        aria-label={`Delete link ${idx + 1}`}
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Proof Points */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              Proof & Social Validation ({profile.proofPoints.length} / 16)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Quantifiable outcomes, notable clients, funding milestones, or press citations.
            </p>
          </div>
          <button
            type="button"
            disabled={profile.proofPoints.length >= 16}
            onClick={handleAddProof}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add Proof
          </button>
        </div>

        {profile.proofPoints.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-5 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No proof points added yet. Add concrete metrics or customers to establish instant credibility.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.proofPoints.map((proof, idx) => (
              <div
                key={proof.id || idx}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-3.5 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <select
                    aria-label={`Proof point ${idx + 1} category`}
                    value={proof.type || 'metric'}
                    onChange={(e) => handleUpdateProof(idx, { type: e.target.value })}
                    className="sm:w-40 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200"
                  >
                    {PROOF_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    maxLength={240}
                    aria-label={`Proof point ${idx + 1} value`}
                    value={proof.value}
                    onChange={(e) => handleUpdateProof(idx, { value: e.target.value })}
                    placeholder="e.g. $4.2M ARR · 120k developers served"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteProof(idx)}
                    aria-label={`Delete proof point ${idx + 1}`}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 self-end sm:self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <input
                    type="url"
                    maxLength={2048}
                    aria-label={`Proof point ${idx + 1} reference URL`}
                    value={proof.url || ''}
                    onChange={(e) => handleUpdateProof(idx, { url: e.target.value })}
                    placeholder="Optional verification link (https://...)"
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contact Channels & Action CTAs */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Contact & Action Channels</h2>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label htmlFor="profile-email" className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                Contact Email
              </label>
              <input
                id="profile-email"
                type="email"
                maxLength={254}
                value={profile.email}
                onChange={(e) => onChange((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="hello@yourdomain.com"
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <label className="flex items-center gap-2 pt-5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={profile.showEmail}
                onChange={(e) => onChange((prev) => ({ ...prev, showEmail: e.target.checked }))}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Show email publicly
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-booking-url" className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                Booking / Calendar URL
              </label>
              <input
                id="profile-booking-url"
                type="url"
                maxLength={2048}
                value={profile.theme.bookingUrl || ''}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    theme: { ...prev.theme, bookingUrl: e.target.value },
                  }))
                }
                placeholder="https://cal.com/yourhandle"
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label htmlFor="profile-conversation-url" className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                Direct Chat / DM URL
              </label>
              <input
                id="profile-conversation-url"
                type="url"
                maxLength={2048}
                value={profile.theme.conversationUrl || ''}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    theme: { ...prev.theme, conversationUrl: e.target.value },
                  }))
                }
                placeholder="https://wa.me/... or Telegram / Discord"
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section Visibility Toggles */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Visible Profile Sections</h2>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {VISIBILITY_CONTROLS.map((ctrl) => {
            const enabled = profile.theme.sectionVisibility[ctrl.key];
            return (
              <div key={ctrl.key} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{ctrl.label}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{ctrl.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={ctrl.label}
                  onClick={() => toggleSectionVisibility(ctrl.key)}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                    enabled ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-950 transition-transform mt-0.5 ${
                      enabled ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

