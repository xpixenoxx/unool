'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eye, Lock, Monitor, Search, Smartphone, Sparkles, X } from 'lucide-react';
import type { PublicProfile, TemplateMeta } from '@/components/profile/templates/types';
import { SPARK_FREE_TEMPLATE_IDS, TEMPLATE_REGISTRY } from '@/components/profile/templates/registry';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import { normalizeTemplateId } from '@/lib/profile/templateNormalization';

const PERSONA_SWATCHES: Record<string, { bg: string; fg: string; accent: string }> = {
  lone: { bg: '#0A0F1A', fg: '#F1F5F9', accent: '#3B82F6' },
  lover: { bg: '#FFF8F6', fg: '#2D1B1B', accent: '#E85D75' },
  energy: { bg: '#0C0C0E', fg: '#FAFAFA', accent: '#F59E0B' },
  rebellion: { bg: '#0B0609', fg: '#FAF5ED', accent: '#D4AF72' },
  vision: { bg: '#FAFAFC', fg: '#18182F', accent: '#C026D3' },
  human: { bg: '#F4EDDC', fg: '#181A18', accent: '#123040' },
  'the-machine': { bg: '#F0F9FF', fg: '#111827', accent: '#0D9488' },
  'the-club': { bg: '#050507', fg: '#F7F7F8', accent: '#E8FF00' },
  'the-builder': { bg: '#E8EEF2', fg: '#141B19', accent: '#1D6B68' },
  'the-visionary': { bg: '#0B0B10', fg: '#F6F4EF', accent: '#B89B5E' },
  'the-hustler': { bg: '#07130E', fg: '#ECFDF5', accent: '#10B981' },
  'the-aesthete': { bg: '#FAF7FF', fg: '#1F1635', accent: '#8B5CF6' },
  'the-creator': { bg: '#0A0A0D', fg: '#FAFAFA', accent: '#EC4899' },
  'the-voice': { bg: '#FFFDF7', fg: '#1C1917', accent: '#F97316' },
  'the-studio': { bg: '#06100E', fg: '#F5EFE2', accent: '#E6C875' },
  'the-stack': { bg: '#EAE6DE', fg: '#1A1816', accent: '#D95D39' },
  'the-bookshelf': { bg: '#14110F', fg: '#F4EAD7', accent: '#D9B86C' },
  'the-cube': { bg: '#F2EFE6', fg: '#1C1C1A', accent: '#2C5AA0' },
  'the-monolith': { bg: '#ECE8DE', fg: '#1A1A17', accent: '#1D3B2F' },
  'the-metro': { bg: '#F4F1EA', fg: '#1C1B19', accent: '#E5452B' },
  'the-noren': { bg: '#123432', fg: '#F3EFE6', accent: '#E0734F' },
  'the-desktop': { bg: '#4F8F8A', fg: '#111111', accent: '#1D2D5C' },
  'the-calendar': { bg: '#2D3A35', fg: '#1A1A18', accent: '#D94A38' },
  'the-bento': { bg: '#FAFAFA', fg: '#111827', accent: '#4F46E5' },
};

const CATEGORIES: Array<{ id: 'all' | TemplateMeta['category']; label: string }> = [
  { id: 'all', label: 'All (24)' },
  { id: 'individual', label: 'Individual' },
  { id: 'startup', label: 'Startup' },
  { id: 'agency', label: 'Agency' },
  { id: 'entrepreneur', label: 'Founder' },
  { id: 'influencer', label: 'Creator' },
];

export interface UnifiedTemplatePickerProps {
  templates?: TemplateMeta[];
  selectedTemplate: string;
  onSelect: (templateId: string) => void;
  profileData?: Partial<PublicProfile> & Record<string, unknown>;
  accentColor?: string;
  maxTemplatesAllowed?: number;
  compact?: boolean;
}

export function UnifiedTemplatePicker({
  templates = TEMPLATE_REGISTRY,
  selectedTemplate,
  onSelect,
  profileData,
  accentColor,
  maxTemplatesAllowed = 24,
  compact = false,
}: UnifiedTemplatePickerProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | TemplateMeta['category']>('all');
  const [toneFilter, setToneFilter] = useState<'all' | 'minimal' | 'bold'>('all');
  const [modalTemplateId, setModalTemplateId] = useState<string | null>(null);
  const [modalViewport, setModalViewport] = useState<'desktop' | 'mobile'>('desktop');
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const canonicalSelected = normalizeTemplateId(selectedTemplate);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (category !== 'all' && t.category !== category) return false;
      if (toneFilter === 'minimal' && !['minimal', 'light'].includes(t.intensity)) return false;
      if (toneFilter === 'bold' && !['bold', 'max'].includes(t.intensity)) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.tagline || '').toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [templates, category, toneFilter, search]);

  useEffect(() => {
    if (!modalTemplateId) return;
    closeBtnRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalTemplateId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalTemplateId]);

  const modalMeta = useMemo(
    () => (modalTemplateId ? templates.find((t) => t.id === modalTemplateId) || null : null),
    [modalTemplateId, templates]
  );

  const safePreviewProfile = useMemo<PublicProfile>(
    () =>
      ({
        id: 'preview',
        subdomain: 'preview',
        name: 'Maya Lin',
        headline: 'Design Engineer & Product Architect',
        bio: 'Designing high-craft tools and resilient web systems.',
        avatarUrl: '',
        links: [
          { id: '1', label: 'Work & Portfolio', url: 'https://example.com', icon: null, clicks: 0, order: 0, isVisible: true, isPrimary: true },
          { id: '2', label: 'GitHub', url: 'https://github.com', icon: null, clicks: 0, order: 1, isVisible: true },
        ],
        proofs: [
          { id: 'p1', type: 'metric', title: 'Impact', value: '120k Users', description: null, icon: null, order: 0 },
        ],
        theme: {
          template: modalTemplateId || canonicalSelected,
          preset: 'minimal',
          accentColor: accentColor || '#2563EB',
          customCss: null,
        },
        socialHandles: {},
        seo: { title: 'Preview', description: '', image: null },
        ...(profileData || {}),
      }) as PublicProfile,
    [profileData, modalTemplateId, canonicalSelected, accentColor]
  );

  return (
    <div className="space-y-4">
      {/* Search + Category & Intensity Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <label htmlFor="template-search" className="sr-only">
              Search templates by style, tag, or vibe
            </label>
            <input
              id="template-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates (e.g. brutalist, editorial, dark, bento)..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <select
            aria-label="Filter by intensity"
            value={toneFilter}
            onChange={(e) => setToneFilter(e.target.value as 'all' | 'minimal' | 'bold')}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-200"
          >
            <option value="all">All Intensities</option>
            <option value="minimal">Minimal & Light</option>
            <option value="bold">Bold & Expressive</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Template categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              aria-pressed={category === cat.id}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === cat.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">No templates match &ldquo;{search}&rdquo;</p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategory('all');
              setToneFilter('all');
            }}
            className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 underline"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className={`grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
          {filtered.map((meta) => {
            const isSelected = canonicalSelected === meta.id;
            const isFree = SPARK_FREE_TEMPLATE_IDS.has(meta.id);
            const isLocked = maxTemplatesAllowed < 16 && !isFree;
            const swatch = PERSONA_SWATCHES[meta.id] || { bg: '#FFFFFF', fg: '#111827', accent: '#2563EB' };

            return (
              <div
                key={meta.id}
                className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-3 transition-all ${
                  isSelected
                    ? 'border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900/10 dark:ring-zinc-100/20 bg-zinc-50/70 dark:bg-zinc-900/60'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* Visual Specimen Strip */}
                <div className="space-y-2.5">
                  <div
                    className="h-20 rounded-xl p-3 flex flex-col justify-between border border-black/10 relative overflow-hidden"
                    style={{ backgroundColor: swatch.bg, color: swatch.fg }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: swatch.accent, color: '#FFFFFF' }}
                      >
                        <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                        {meta.preset}
                      </span>
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium">
                          <Lock className="w-2.5 h-2.5" aria-hidden="true" />
                          Pro
                        </span>
                      ) : isSelected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold">
                          <Check className="w-2.5 h-2.5" aria-hidden="true" />
                          Active
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-bold tracking-tight truncate">{meta.name}</span>
                      <span className="text-[10px] opacity-80 capitalize shrink-0">{meta.intensity}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                      {meta.tagline || meta.description}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelect(meta.id)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {isSelected ? 'Selected' : isLocked ? 'Try (Creator+)' : 'Apply Theme'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTemplateId(meta.id)}
                    aria-label={`Preview ${meta.name} live`}
                    className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Template Inspection Modal */}
      {modalTemplateId && modalMeta && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={`Live preview of ${modalMeta.name}`}
        >
          <div className="px-5 py-3 bg-zinc-950 border-b border-zinc-800 text-white flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">{modalMeta.name}</h3>
              <p className="text-[11px] text-zinc-400">{modalMeta.tagline || modalMeta.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalViewport('desktop')}
                className={`p-1.5 rounded-lg border ${
                  modalViewport === 'desktop' ? 'border-white bg-zinc-800' : 'border-zinc-700 text-zinc-400'
                }`}
                aria-label="Desktop preview"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setModalViewport('mobile')}
                className={`p-1.5 rounded-lg border ${
                  modalViewport === 'mobile' ? 'border-white bg-zinc-800' : 'border-zinc-700 text-zinc-400'
                }`}
                aria-label="Mobile 390px preview"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelect(modalMeta.id);
                  setModalTemplateId(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:opacity-90"
              >
                Apply {modalMeta.name}
              </button>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setModalTemplateId(null)}
                aria-label="Close template preview modal"
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center">
            <div
              className={`bg-white dark:bg-zinc-950 rounded-xl overflow-y-auto overflow-x-hidden shadow-2xl ${
                modalViewport === 'mobile' ? 'w-[390px] max-w-full' : 'w-full max-w-6xl'
              }`}
              style={{ transform: 'translateZ(0)' }}
            >
              <ProfilePreview
                profile={safePreviewProfile}
                templateId={modalMeta.id}
                accentColor={accentColor}
                isPreview={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
