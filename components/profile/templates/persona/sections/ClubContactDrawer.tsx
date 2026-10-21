'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClubMotion } from '../hooks/useClubMotion';
import { X, Mail, Download, Copy, Check, Loader2, AlertCircle, MessageSquare, Calendar } from 'lucide-react';

interface ClubContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    name: string;
    handle: string;
    email?: string;
    location?: string;
    calendlyUrl?: string;
  };
  onSubmit: (data: ClubContactFormData) => Promise<void>;
}

interface ClubContactFormData {
  name: string;
  email: string;
  company: string;
  projectType: string;
  budget: string;
  message: string;
}

const PROJECT_TYPES = [
  { value: 'brand', label: 'Brand Identity' },
  { value: 'digital', label: 'Digital Product' },
  { value: 'experience', label: 'Experience Design' },
  { value: 'editorial', label: 'Editorial Design' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'other', label: 'Other' },
];

const BUDGET_RANGES = [
  { value: 'under-25k', label: 'Under $25K' },
  { value: '25k-50k', label: '$25K - $50K' },
  { value: '50k-100k', label: '$50K - $100K' },
  { value: '100k-250k', label: '$100K - $250K' },
  { value: '250k+', label: '$250K+' },
  { value: 'discuss', label: 'Let\'s discuss' },
];

export function ClubContactDrawer({ isOpen, onClose, profile, onSubmit }: ClubContactDrawerProps) {
  const { fadeInUp, prefersReduced } = useClubMotion();
  const [formData, setFormData] = useState<ClubContactFormData>({
    name: '', email: '', company: '', projectType: '', budget: '', message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    firstInputRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', email: '', company: '', projectType: '', budget: '', message: '' });
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      await onSubmit(formData);
      setStatus('success');
      // Auto-close after success
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        .club-drawer-overlay {
          position: fixed;
          inset: 0;
          z-index: 1300;
          background: oklch(0 0 0 / 0.6);
          backdrop-filter: blur(8px);
        }
        .club-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 480px;
          max-width: 100vw;
          z-index: 1400;
          background: linear-gradient(145deg, oklch(0.09 0.02 240) 0%, oklch(0.06 0.01 240) 100%);
          border-left: 1px solid oklch(0.25 0.02 240 / 0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        @media (max-width: 640px) { .club-drawer { width: 100%; } }
        .club-drawer-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: var(--space-6);
          border-bottom: 1px solid oklch(0.25 0.02 240 / 0.3);
          flex-shrink: 0;
        }
        .club-drawer-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
          background: linear-gradient(135deg, oklch(0.65 0.22 200), oklch(0.55 0.28 100));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .club-drawer-close {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          background: transparent;
          border: 1px solid oklch(0.25 0.02 240 / 0.3);
          color: oklch(0.75 0.02 240);
          cursor: pointer;
          transition: all 200ms ease;
        }
        .club-drawer-close:hover {
          background: oklch(0.65 0.22 200 / 0.1);
          border-color: oklch(0.65 0.22 200);
          color: oklch(0.65 0.22 200);
        }
        .club-drawer-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-6);
        }
        .club-drawer-form { display: flex; flex-direction: column; gap: var(--space-4); }
        .club-form-group { display: flex; flex-direction: column; gap: var(--space-1); }
        .club-form-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          font-size: var(--club-text-mono);
          color: oklch(0.85 0.02 240);
        }
        .club-form-input, .club-form-select, .club-form-textarea {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          background: oklch(0.06 0.01 240 / 0.5);
          border: 1px solid oklch(0.25 0.02 240 / 0.3);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: var(--club-text-body);
          color: oklch(0.98 0 0);
          outline: none;
          transition: all 200ms ease;
        }
        .club-form-input::placeholder, .club-form-textarea::placeholder { color: oklch(0.45 0.02 240); }
        .club-form-input:focus, .club-form-select:focus, .club-form-textarea:focus {
          border-color: oklch(0.65 0.22 200);
          box-shadow: 0 0 0 3px oklch(0.65 0.22 200 / 0.2);
        }
        .club-form-select { cursor: pointer; }
        .club-form-textarea { min-height: 120px; resize: vertical; }
        .club-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
        @media (max-width: 480px) { .club-form-row { grid-template-columns: 1fr; } }
        .club-form-error {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: var(--club-text-mono);
          color: oklch(0.58 0.22 25);
        }
        .club-form-actions { display: flex; gap: var(--space-3); margin-top: var(--space-2); }
        .club-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-6);
          border-radius: var(--radius-lg);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: var(--club-text-body);
          cursor: pointer;
          transition: all 200ms ease;
          border: none;
        }
        .club-btn-primary {
          flex: 1;
          background: linear-gradient(135deg, oklch(0.65 0.22 200), oklch(0.55 0.28 100));
          color: oklch(0.03 0.02 240);
        }
        .club-btn-primary:hover:not(:disabled) {
          box-shadow: 0 8px 24px -4px oklch(0.65 0.22 200 / 0.4);
          transform: translateY(-2px);
        }
        .club-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .club-btn-secondary {
          background: transparent;
          border: 1px solid oklch(0.65 0.22 200 / 0.3);
          color: oklch(0.65 0.22 200);
        }
        .club-btn-secondary:hover { background: oklch(0.65 0.22 200 / 0.1); border-color: oklch(0.65 0.22 200); }
        .club-btn-ghost {
          background: transparent;
          color: oklch(0.75 0.02 240);
        }
        .club-btn-ghost:hover { color: oklch(0.98 0 0); }
        .club-success-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-8);
          text-align: center;
        }
        .club-success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, oklch(0.55 0.28 100), oklch(0.65 0.25 280));
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-4);
        }
        .club-success-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
          color: oklch(0.98 0 0);
          margin: 0 0 var(--space-2);
        }
        .club-success-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: var(--club-text-body);
          color: oklch(0.75 0.02 240);
          margin: 0;
        }
        .club-calendly-section {
          margin-top: var(--space-8);
          padding-top: var(--space-6);
          border-top: 1px solid oklch(0.25 0.02 240 / 0.3);
        }
        .club-calendly-title {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: var(--club-text-body);
          color: oklch(0.85 0.02 240);
          margin: 0 0 var(--space-3);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .club-calendly-frame {
          width: 100%;
          height: 400px;
          border: none;
          border-radius: var(--radius-lg);
          background: oklch(0.06 0.01 240);
        }
      `}</style>

      <AnimatePresence>
        <motion.div
          className="club-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          ref={drawerRef}
          className="club-drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        >
          <div className="club-drawer-header">
            <h2 className="club-drawer-title">Book a Session</h2>
            <button className="club-drawer-close" onClick={onClose} aria-label="Close drawer">
              <X size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="club-drawer-content">
            {status === 'success' ? (
              <div className="club-success-state">
                <div className="club-success-icon">
                  <Check size={28} strokeWidth={2.5} color="oklch(0.03 0.02 240)" />
                </div>
                <h3 className="club-success-title">Request Sent!</h3>
                <p className="club-success-text">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="club-drawer-form" noValidate>
                <div className="club-form-group">
                  <label htmlFor="name" className="club-form-label">Your Name</label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    id="name"
                    name="name"
                    className="club-form-input"
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={status === 'submitting'}
                  />
                </div>

                <div className="club-form-group">
                  <label htmlFor="email" className="club-form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="club-form-input"
                    placeholder="jane@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={status === 'submitting'}
                  />
                </div>

                <div className="club-form-group">
                  <label htmlFor="company" className="club-form-label">Company (Optional)</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    className="club-form-input"
                    placeholder="Acme Inc."
                    value={formData.company}
                    onChange={handleChange}
                    disabled={status === 'submitting'}
                  />
                </div>

                <div className="club-form-row">
                  <div className="club-form-group">
                    <label htmlFor="projectType" className="club-form-label">Project Type</label>
                    <select
                      id="projectType"
                      name="projectType"
                      className="club-form-select"
                      value={formData.projectType}
                      onChange={handleChange}
                      required
                      disabled={status === 'submitting'}
                    >
                      <option value="">Select type</option>
                      {PROJECT_TYPES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="club-form-group">
                    <label htmlFor="budget" className="club-form-label">Budget Range</label>
                    <select
                      id="budget"
                      name="budget"
                      className="club-form-select"
                      value={formData.budget}
                      onChange={handleChange}
                      required
                      disabled={status === 'submitting'}
                    >
                      <option value="">Select range</option>
                      {BUDGET_RANGES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="club-form-group">
                  <label htmlFor="message" className="club-form-label">Tell us about your project</label>
                  <textarea
                    id="message"
                    name="message"
                    className="club-form-textarea"
                    placeholder="What are you building? What are your goals? Timeline?"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    disabled={status === 'submitting'}
                  />
                </div>

                {status === 'error' && (
                  <div className="club-form-error" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <AlertCircle size={16} strokeWidth={2} aria-hidden="true" />
                    {errorMessage}
                  </div>
                )}

                <div className="club-form-actions">
                  <button
                    type="submit"
                    className="club-btn club-btn-primary"
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 size={18} strokeWidth={2} className="animate-spin" aria-hidden="true" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail size={18} strokeWidth={2} aria-hidden="true" />
                        Send Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {profile.calendlyUrl && (
              <div className="club-calendly-section">
                <h3 className="club-calendly-title">
                  <Calendar size={18} strokeWidth={2} aria-hidden="true" />
                  Or book directly
                </h3>
                <iframe
                  className="club-calendly-frame"
                  src={profile.calendlyUrl}
                  title="Calendly Scheduler"
                />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}