'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Mail, MessageSquare, Send, X } from 'lucide-react';
import { pickReadableText } from '@/lib/profile/contrast';

export interface ProfileContactModalProps {
  open: boolean;
  onClose: () => void;
  profileName: string;
  subdomain?: string;
  accentColor: string;
  isDark: boolean;
  bookingUrl?: string | null;
  conversationUrl?: string | null;
  showEmail?: boolean;
  email?: string | null;
  isPreview?: boolean;
}

export function ProfileContactModal({
  open,
  onClose,
  profileName,
  subdomain,
  accentColor,
  isDark,
  bookingUrl,
  conversationUrl,
  showEmail,
  email,
  isPreview = false,
}: ProfileContactModalProps) {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  const surfaceBg = isDark ? '#111827' : '#FFFFFF';
  const surfaceText = isDark ? '#F8FAFC' : '#0F172A';
  const mutedText = isDark ? '#CBD5E1' : '#475569';
  const borderCol = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.14)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC';
  const btnText = pickReadableText(accentColor, '#FFFFFF', '#0F172A');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isPreview) {
      setSubmitted(true);
      return;
    }

    if (!subdomain) {
      setError('Claim a public handle first so visitors can send messages here.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/profile/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          senderName: senderName.trim(),
          senderEmail: senderEmail.trim(),
          message: message.trim(),
          website,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Could not send message. Please check your details.');
        return;
      }

      setSubmitted(true);
      setSenderName('');
      setSenderEmail('');
      setMessage('');
    } catch {
      setError('Network error while sending message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(2, 6, 23, 0.72)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-contact-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{
          backgroundColor: surfaceBg,
          color: surfaceText,
          border: `1px solid ${borderCol}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="profile-contact-title" className="text-lg font-bold tracking-tight">
              Get in touch with {profileName}
            </h2>
            <p className="text-xs mt-1" style={{ color: mutedText }}>
              {isPreview
                ? 'Live preview mode — visitors can send leads directly from your public page.'
                : 'Send a direct inquiry or pick a quick contact channel below.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact dialog"
            className="rounded-lg p-1.5 transition-colors hover:opacity-80"
            style={{ border: `1px solid ${borderCol}`, color: mutedText }}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {(bookingUrl || conversationUrl || (showEmail && email)) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {bookingUrl && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold no-underline transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: accentColor,
                  color: btnText,
                }}
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Book a call</span>
              </a>
            )}
            {conversationUrl && (
              <a
                href={conversationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold no-underline transition-colors"
                style={{
                  border: `1px solid ${borderCol}`,
                  color: surfaceText,
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Direct chat</span>
              </a>
            )}
            {showEmail && email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold no-underline transition-colors"
                style={{
                  border: `1px solid ${borderCol}`,
                  color: surfaceText,
                }}
              >
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{email}</span>
              </a>
            )}
          </div>
        )}

        {submitted ? (
          <div
            className="rounded-xl p-4 text-center space-y-2"
            style={{ backgroundColor: inputBg, border: `1px solid ${borderCol}` }}
          >
            <CheckCircle2 className="w-7 h-7 mx-auto" style={{ color: '#22C55E' }} aria-hidden="true" />
            <p className="text-sm font-semibold">Message delivered</p>
            <p className="text-xs" style={{ color: mutedText }}>
              {isPreview
                ? 'In production, this saves to your inbox and notifies your email.'
                : `${profileName} will receive your note shortly.`}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold"
              style={{ backgroundColor: accentColor, color: btnText }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Hidden honeypot for spam bots */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="contact-name" className="block text-xs font-medium mb-1">
                Your name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: inputBg,
                  color: surfaceText,
                  border: `1px solid ${borderCol}`,
                }}
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-medium mb-1">
                Email address
              </label>
              <input
                id="contact-email"
                type="email"
                required
                maxLength={254}
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: inputBg,
                  color: surfaceText,
                  border: `1px solid ${borderCol}`,
                }}
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-medium mb-1">
                Message
              </label>
              <textarea
                id="contact-message"
                required
                minLength={5}
                maxLength={2000}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share a quick note about your project, timeline, or question..."
                className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
                style={{
                  backgroundColor: inputBg,
                  color: surfaceText,
                  border: `1px solid ${borderCol}`,
                }}
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium" style={{ color: isDark ? '#FCA5A5' : '#DC2626' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-95 disabled:opacity-60"
              style={{ backgroundColor: accentColor, color: btnText }}
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{submitting ? 'Sending...' : 'Send message'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

