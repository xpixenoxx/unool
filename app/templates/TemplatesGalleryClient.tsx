'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { ArrowRight, Zap, Star, Layers } from 'lucide-react';
import type { TemplateMeta } from '@/components/profile/templates/types';
import './templates.css';

// ── Category config ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all', label: 'All templates', count: 16 },
  { id: 'individual', label: 'Individual' },
  { id: 'influencer', label: 'Influencer' },
  { id: 'entrepreneur', label: 'Entrepreneur' },
  { id: 'startup', label: 'Startup' },
  { id: 'agency', label: 'Agency' },
];

const INTENSITY_LABELS: Record<string, { label: string; color: string }> = {
  'ultra-light': { label: 'Ultra Light', color: '#64748b' },
  'minimal':     { label: 'Minimal', color: '#475569' },
  'light':       { label: 'Light', color: '#6366f1' },
  'standard':    { label: 'Standard', color: '#8b5cf6' },
  'bold':        { label: 'Bold', color: '#f59e0b' },
  'max':         { label: 'Max', color: '#ef4444' },
};

// Feature badges
const getFeatureBadges = (features: TemplateMeta['features']): string[] => {
  const badges: string[] = [];
  if (features.has3DBackground) badges.push('3D');
  if (features.hasParallax) badges.push('Parallax');
  if (features.hasMagneticHover) badges.push('Magnetic');
  if (features.hasAnimatedOrbs) badges.push('Orbs');
  if (features.hasGradientText) badges.push('Gradient');
  if (features.supportsVideoBackground) badges.push('Video BG');
  if (features.hasTiltCards) badges.push('Tilt');
  return badges;
};

// ── Component ──────────────────────────────────────────────────────────────────

export function TemplatesGalleryClient({ templates }: { templates: TemplateMeta[] }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() =>
    activeCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === activeCategory),
    [templates, activeCategory]
  );

  return (
    <div className="tg-root">
      {/* Nav */}
      <nav className="tg-nav">
        <Link href="/" className="tg-logo">unool</Link>
        <div className="tg-nav-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/signup" className="tg-nav-cta">Start free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="tg-hero">
        <div className="tg-hero-badge">
          <Layers className="h-3.5 w-3.5" />
          16 studio-grade templates · Free on every plan
        </div>
        <h1 className="tg-hero-title">
          Your brand.<br />
          <span className="tg-hero-accent">Your personality.</span>
        </h1>
        <p className="tg-hero-subtitle">
          Not a button list. Not a generic theme. A full profile that feels like a custom-built premium website.
          Pick your persona, launch in minutes.
        </p>
        <div className="tg-hero-stats">
          <div className="tg-stat"><span>16</span>Unique templates</div>
          <div className="tg-stat-divider" />
          <div className="tg-stat"><span>6</span>Creator categories</div>
          <div className="tg-stat-divider" />
          <div className="tg-stat"><span>3D</span>Effects on Pro</div>
        </div>
      </section>

      {/* Category filter */}
      <div className="tg-filter-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            id={`filter-${cat.id}`}
            className={`tg-filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
            {cat.count && <span className="tg-filter-count">{cat.count}</span>}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="tg-grid">
        {filtered.map((template) => {
          const intensity = INTENSITY_LABELS[template.intensity] ?? { label: template.intensity, color: '#6366f1' };
          const badges = getFeatureBadges(template.features);
          const isHovered = hoveredId === template.id;

          return (
            <div
              key={template.id}
              className={`tg-card ${isHovered ? 'tg-card--hovered' : ''}`}
              onMouseEnter={() => setHoveredId(template.id)}
              onMouseLeave={() => setHoveredId(null)}
              id={`template-card-${template.id}`}
            >
              {/* Thumbnail preview area */}
              <div className="tg-card-preview">
                <div className="tg-card-preview-bg" style={{
                  background: `linear-gradient(135deg, ${intensity.color}18, ${intensity.color}08)`,
                  borderColor: `${intensity.color}20`,
                }}>
                  <div className="tg-card-preview-icon">{template.icon}</div>
                  <div className="tg-card-preview-tagline">{template.tagline}</div>
                  {/* Simulated profile UI dots */}
                  <div className="tg-card-mockup">
                    <div className="tg-mockup-bar" style={{ width: '60%', background: `${intensity.color}40` }} />
                    <div className="tg-mockup-bar" style={{ width: '80%', background: `${intensity.color}25` }} />
                    <div className="tg-mockup-bar" style={{ width: '45%', background: `${intensity.color}20` }} />
                    <div className="tg-mockup-links">
                      {[0,1,2].map(i => (
                        <div key={i} className="tg-mockup-link" style={{ background: `${intensity.color}30` }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Intensity badge */}
                <div className="tg-intensity-badge" style={{ color: intensity.color, borderColor: `${intensity.color}40`, background: `${intensity.color}10` }}>
                  {intensity.label}
                </div>

                {/* Feature badges on hover */}
                {isHovered && badges.length > 0 && (
                  <div className="tg-feature-badges">
                    {badges.map((b) => (
                      <span key={b} className="tg-feature-badge">{b}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card info */}
              <div className="tg-card-body">
                <div className="tg-card-header">
                  <h2 className="tg-card-name">{template.name}</h2>
                  <span className="tg-card-category">{template.category}</span>
                </div>
                <p className="tg-card-description">{template.description}</p>
                <div className="tg-card-tags">
                  {template.tags.map((tag) => (
                    <span key={tag} className="tg-tag">#{tag}</span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="tg-card-footer">
                <Link
                  href={`/signup?template=${template.id}`}
                  className="tg-card-cta"
                  id={`use-template-${template.id}`}
                >
                  Use this template <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Why Unool templates */}
      <section className="tg-why-section">
        <h2 className="tg-why-title">Not Linktree. Not Beacons. Something different.</h2>
        <div className="tg-why-grid">
          {[
            {
              icon: '🎨',
              title: 'Persona-driven design',
              desc: 'Each template is built around a creator archetype — not just colors and fonts. The Energy is different from The Lone at every pixel level.',
            },
            {
              icon: '⚡',
              title: 'Real effects — not decorations',
              desc: 'Parallax, magnetic hover, 3D backgrounds, animated orbs — these are interaction-layer features that make visitors feel like they\'re on a custom site.',
            },
            {
              icon: '🚀',
              title: 'Included in every plan',
              desc: 'Spark (free) gets 5 templates. Creator+ gets all 16. No upsell-per-template nonsense.',
            },
            {
              icon: '🏷️',
              title: 'Zero "Made with X" badge on paid',
              desc: 'Creator plan and above removes the Unool badge entirely. Your profile is 100% yours.',
            },
          ].map((why) => (
            <div key={why.title} className="tg-why-card">
              <div className="tg-why-icon">{why.icon}</div>
              <h3 className="tg-why-card-title">{why.title}</h3>
              <p className="tg-why-card-desc">{why.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="tg-bottom-cta">
        <Star className="h-8 w-8 tg-cta-star" />
        <h2 className="tg-cta-title">Start with any template. Free.</h2>
        <p className="tg-cta-sub">14-day full Pro trial. No credit card. Downgrade to Spark (free) anytime.</p>
        <div className="tg-cta-actions">
          <Link href="/signup" className="tg-cta-primary" id="templates-signup-cta">
            Pick a template and start →
          </Link>
          <Link href="/pricing" className="tg-cta-secondary">See pricing</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="tg-footer">
        <p>© 2026 Pixenox Solutions</p>
        <div className="tg-footer-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
