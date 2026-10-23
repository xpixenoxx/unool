'use client';

import Link from 'next/link';
import { Check, X, ArrowRight, Sparkles } from 'lucide-react';
import './switch-from.css';

interface PainPoint { icon: string; title: string; desc: string; }
interface Gain { icon: string; title: string; desc: string; }
interface ComparisonRow { feature: string; from: boolean | string; unool: boolean | string; }

interface SwitchFromProps {
  from: string;
  fromDisplayName: string;
  fromMonthlyPrice: string;
  fromPlanName: string;
  headline: string;
  subheadline: string;
  painPoints: PainPoint[];
  gains: Gain[];
  testimonialQuote: string;
  testimonialAuthor: string;
  comparisonRows: ComparisonRow[];
}

export function SwitchFromPageClient(props: SwitchFromProps) {
  const {
    fromDisplayName, fromMonthlyPrice, fromPlanName,
    headline, subheadline, painPoints, gains,
    testimonialQuote, testimonialAuthor, comparisonRows,
  } = props;

  const renderVal = (val: boolean | string, isUnool = false) => {
    if (val === true) return <Check className={`sf-icon-check ${isUnool ? 'sf-icon-check--unool' : ''}`} />;
    if (val === false) return <X className="sf-icon-x" />;
    if (typeof val === 'string') {
      // Price string or "partial"
      if (val === 'partial') return <span className="sf-partial">Partial</span>;
      return <span className={isUnool ? 'sf-price--winner' : 'sf-price'}>{val}</span>;
    }
    return null;
  };

  return (
    <div className="sf-root">
      {/* Nav */}
      <nav className="sf-nav">
        <Link href="/" className="sf-logo">unool</Link>
        <div className="sf-nav-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/signup" className="sf-nav-cta">Start free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="sf-hero">
        <div className="sf-hero-badge">
          <Sparkles className="h-3.5 w-3.5" />
          Switching from {fromDisplayName}? You save {fromMonthlyPrice} every month.
        </div>
        <h1 className="sf-hero-title">{headline}</h1>
        <p className="sf-hero-sub">{subheadline}</p>
        <div className="sf-hero-actions">
          <Link href="/signup" className="sf-hero-cta" id={`switch-from-${props.from}-cta`}>
            Start free — no credit card <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className="sf-hero-secondary">Compare all plans →</Link>
        </div>
      </section>

      {/* Pain points */}
      <section className="sf-pains-section">
        <h2 className="sf-section-title">Why creators leave {fromDisplayName}</h2>
        <div className="sf-pains-grid">
          {painPoints.map((p) => (
            <div key={p.title} className="sf-pain-card">
              <div className="sf-pain-icon">{p.icon}</div>
              <h3 className="sf-pain-title">{p.title}</h3>
              <p className="sf-pain-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gains */}
      <section className="sf-gains-section">
        <h2 className="sf-section-title">What you get with Unool</h2>
        <div className="sf-gains-grid">
          {gains.map((g) => (
            <div key={g.title} className="sf-gain-card">
              <div className="sf-gain-icon">{g.icon}</div>
              <div>
                <h3 className="sf-gain-title">{g.title}</h3>
                <p className="sf-gain-desc">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="sf-compare-section">
        <h2 className="sf-section-title">{fromDisplayName} vs Unool — side by side</h2>
        <div className="sf-compare-wrap">
          <table className="sf-compare-table">
            <thead>
              <tr>
                <th className="sf-th sf-th--feature">Feature</th>
                <th className="sf-th">{fromPlanName}</th>
                <th className="sf-th sf-th--unool">Unool Creator (₹799)</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="sf-compare-row">
                  <td className="sf-td sf-td--feature">{row.feature}</td>
                  <td className="sf-td">{renderVal(row.from)}</td>
                  <td className="sf-td sf-td--unool">{renderVal(row.unool, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Testimonial */}
      <section className="sf-testimonial-section">
        <blockquote className="sf-testimonial">
          <p className="sf-testimonial-quote">"{testimonialQuote}"</p>
          <cite className="sf-testimonial-author">— {testimonialAuthor}</cite>
        </blockquote>
      </section>

      {/* How to switch */}
      <section className="sf-steps-section">
        <h2 className="sf-section-title">Switch in 3 steps</h2>
        <div className="sf-steps">
          {[
            { num: '1', title: 'Sign up free', desc: 'Create your Unool account. No credit card. Starts with 14-day full Pro trial.' },
            { num: '2', title: 'Claim your subdomain', desc: 'yourname.unool.co — or connect your custom domain on Pro.' },
            { num: '3', title: 'Connect Instagram', desc: 'Link your Instagram Business account. Your automations go live instantly.' },
          ].map((step) => (
            <div key={step.num} className="sf-step">
              <div className="sf-step-num">{step.num}</div>
              <div>
                <h3 className="sf-step-title">{step.title}</h3>
                <p className="sf-step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="sf-bottom-cta">
        <h2 className="sf-bottom-title">
          Ready to switch from {fromDisplayName}?
        </h2>
        <p className="sf-bottom-sub">
          Start free. No credit card. 14-day full Pro trial. Cancel anytime.
        </p>
        <Link href="/signup" className="sf-bottom-btn" id={`switch-bottom-cta-${props.from}`}>
          Get started free →
        </Link>
        <p className="sf-bottom-price">
          Then ₹799/mo · or ₹666/mo billed annually
        </p>
      </section>

      {/* Footer */}
      <footer className="sf-footer">
        <p>© 2026 Pixenox Solutions · Prathipadu, Kakinada, AP</p>
        <div className="sf-footer-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
