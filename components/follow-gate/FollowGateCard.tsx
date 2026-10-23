'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { UnlockedContent } from '@/lib/follow-gate/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface GateMeta {
  id: string;
  title: string;
  description: string | null;
  igUsername: string;
  ctaText: string;
  thumbnailUrl: string | null;
  unlockCount: number;
}

type GateState = 'idle' | 'loading' | 'waiting' | 'checking' | 'unlocked' | 'error';

interface FollowGateCardProps {
  gateId: string;
  /** Optional pre-loaded gate metadata — skips the public API fetch */
  gateMeta?: GateMeta;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const INSTAGRAM_BASE = 'https://instagram.com';
const POLL_INTERVAL_MS = 5_000;
const MAX_POLLS = 36; // 3 minutes total polling window

// ── Component ──────────────────────────────────────────────────────────────────

export function FollowGateCard({ gateId, gateMeta: initialMeta }: FollowGateCardProps) {
  const [gate, setGate] = useState<GateMeta | null>(initialMeta ?? null);
  const [state, setState] = useState<GateState>('idle');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [unlockedContent, setUnlockedContent] = useState<UnlockedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load gate meta if not provided ──────────────────────────────────────────

  useEffect(() => {
    if (initialMeta) return;
    let cancelled = false;
    fetch(`/api/follow-gate/public?gateId=${gateId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.id) setGate(data as GateMeta);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load gate');
      });
    return () => { cancelled = true; };
  }, [gateId, initialMeta]);

  // ── Create session & open IG ─────────────────────────────────────────────────

  const handleFollowClick = useCallback(async () => {
    if (!gate) return;
    setState('loading');
    setError(null);

    try {
      const res = await fetch(`/api/follow-gate/${gateId}/session`, { method: 'POST' });
      const data = await res.json() as { sessionToken?: string; error?: string };

      if (!res.ok || !data.sessionToken) {
        setError(data.error ?? 'Failed to create session');
        setState('error');
        return;
      }

      setSessionToken(data.sessionToken);

      // Open Instagram profile in new tab
      window.open(`${INSTAGRAM_BASE}/${gate.igUsername}`, '_blank', 'noopener,noreferrer');

      setState('waiting');
    } catch {
      setError('Network error. Please try again.');
      setState('error');
    }
  }, [gate, gateId]);

  // ── "I followed" button — start polling ──────────────────────────────────────

  const handleCheckClick = useCallback(() => {
    if (!sessionToken) return;
    setState('checking');
    pollCount.current = 0;
    startPolling(sessionToken);
  }, [sessionToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poll for verification ────────────────────────────────────────────────────

  const checkFollowStatus = useCallback(async (token: string) => {
    try {
      const url = `/api/follow-gate/${gateId}/check?sessionToken=${token}`;
      const res = await fetch(url);
      const data = await res.json() as {
        followVerified: boolean;
        unlockedContent?: UnlockedContent;
        error?: string;
      };

      if (data.followVerified && data.unlockedContent) {
        stopPolling();
        setUnlockedContent(data.unlockedContent);
        setState('unlocked');
        return true;
      }

      pollCount.current += 1;
      if (pollCount.current >= MAX_POLLS) {
        stopPolling();
        setState('waiting');
        setError('Follow not detected yet. Make sure you followed @' + gate?.igUsername + ' and try again.');
      }
    } catch {
      // Non-fatal — keep polling
    }
    return false;
  }, [gateId, gate]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const startPolling = useCallback((token: string) => {
    stopPolling();
    // Immediate check
    checkFollowStatus(token);
    pollTimer.current = setInterval(() => checkFollowStatus(token), POLL_INTERVAL_MS);
  }, [checkFollowStatus, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!gate && !error) {
    return (
      <div className="follow-gate-card follow-gate-card--skeleton" aria-busy="true">
        <div className="follow-gate-skeleton-line" style={{ width: '60%' }} />
        <div className="follow-gate-skeleton-line" style={{ width: '80%' }} />
        <div className="follow-gate-skeleton-btn" />
      </div>
    );
  }

  if (error && state === 'error' && !gate) {
    return (
      <div className="follow-gate-card follow-gate-card--error">
        <p className="follow-gate-error-text">{error}</p>
      </div>
    );
  }

  if (state === 'unlocked' && unlockedContent) {
    return <UnlockedView content={unlockedContent} gate={gate!} />;
  }

  return (
    <div className="follow-gate-card" role="region" aria-label={`Follow gate: ${gate?.title}`}>
      {/* Thumbnail */}
      {gate?.thumbnailUrl && (
        <div className="follow-gate-thumb-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gate.thumbnailUrl}
            alt={gate.title}
            className="follow-gate-thumb"
          />
          <div className="follow-gate-thumb-overlay">
            <LockIcon />
          </div>
        </div>
      )}

      {!gate?.thumbnailUrl && (
        <div className="follow-gate-lock-hero">
          <LockIcon size={40} />
        </div>
      )}

      {/* Info */}
      <div className="follow-gate-body">
        <h3 className="follow-gate-title">{gate?.title}</h3>
        {gate?.description && (
          <p className="follow-gate-description">{gate.description}</p>
        )}
        {(gate?.unlockCount ?? 0) > 0 && (
          <p className="follow-gate-social-proof">
            🔓 {gate!.unlockCount.toLocaleString()} people have unlocked this
          </p>
        )}

        {/* Error notice */}
        {error && (
          <p className="follow-gate-error-notice" role="alert">{error}</p>
        )}

        {/* CTA buttons */}
        {(state === 'idle' || state === 'error') && (
          <button
            id={`follow-gate-cta-${gateId}`}
            className="follow-gate-btn follow-gate-btn--primary"
            onClick={handleFollowClick}
          >
            <InstagramIcon />
            {gate?.ctaText ?? 'Follow to unlock'}
          </button>
        )}

        {state === 'loading' && (
          <button className="follow-gate-btn follow-gate-btn--primary" disabled>
            <Spinner /> Opening Instagram…
          </button>
        )}

        {state === 'waiting' && (
          <div className="follow-gate-waiting-group">
            <p className="follow-gate-step-hint">
              1. Follow <strong>@{gate?.igUsername}</strong> on Instagram
            </p>
            <p className="follow-gate-step-hint">
              2. Come back here and tap the button below
            </p>
            <button
              id={`follow-gate-confirm-${gateId}`}
              className="follow-gate-btn follow-gate-btn--confirm"
              onClick={handleCheckClick}
            >
              ✓ I followed @{gate?.igUsername}
            </button>
            <button
              className="follow-gate-btn follow-gate-btn--ghost"
              onClick={handleFollowClick}
            >
              <InstagramIcon /> Reopen Instagram
            </button>
          </div>
        )}

        {state === 'checking' && (
          <div className="follow-gate-checking">
            <Spinner />
            <span>Verifying your follow…</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Unlocked view ──────────────────────────────────────────────────────────────

function UnlockedView({ content, gate }: { content: UnlockedContent; gate: GateMeta }) {
  return (
    <div className="follow-gate-card follow-gate-card--unlocked" role="region" aria-live="polite">
      <div className="follow-gate-unlock-icon">🎉</div>
      <h3 className="follow-gate-title">You're in!</h3>
      <p className="follow-gate-description">
        Thanks for following <strong>@{gate.igUsername}</strong>.
      </p>

      {content.type === 'link' && content.url && (
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="follow-gate-btn follow-gate-btn--primary"
          id={`follow-gate-unlocked-link-${gate.id}`}
        >
          {content.label || 'Open link'}
        </a>
      )}

      {content.type === 'file' && content.url && (
        <a
          href={content.url}
          download
          className="follow-gate-btn follow-gate-btn--primary"
          id={`follow-gate-unlocked-download-${gate.id}`}
        >
          ⬇ {content.label || 'Download file'}
        </a>
      )}

      {content.type === 'coupon' && content.text && (
        <div className="follow-gate-coupon">
          <p className="follow-gate-coupon-label">{content.label}</p>
          <code
            className="follow-gate-coupon-code"
            onClick={() => navigator.clipboard?.writeText(content.text!)}
            title="Click to copy"
          >
            {content.text}
          </code>
          <p className="follow-gate-coupon-hint">Tap to copy</p>
          {content.expiresAt && (
            <p className="follow-gate-coupon-expiry">
              Expires: {new Date(content.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {content.type === 'message' && content.text && (
        <div className="follow-gate-message-box">
          <p>{content.text}</p>
        </div>
      )}

      {content.type === 'video' && content.url && (
        <video
          src={content.url}
          controls
          className="follow-gate-video"
          title={content.label}
        />
      )}
    </div>
  );
}

// ── Small SVG Icons ────────────────────────────────────────────────────────────

function LockIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="follow-gate-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
