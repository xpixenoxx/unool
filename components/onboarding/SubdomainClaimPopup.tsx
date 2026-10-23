'use client';

/**
 * SubdomainClaimPopup
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows 30 seconds after a new user's first dashboard load.
 * Lets them claim their yourname.unool.co subdomain without leaving the dashboard.
 *
 * Rules:
 * - Only shows once (localStorage key: unool_subdomain_claimed)
 * - Only shows if user does NOT already have a subdomain
 * - Shows after 30s on first visit OR immediately if user clicks "Claim subdomain" in the dashboard
 * - Dismissed state persisted so it never shows again after dismiss
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Check, X, ArrowRight, Loader2 } from 'lucide-react';
import './SubdomainClaimPopup.css';

// ── Constants ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'unool_subdomain_popup_dismissed';
const TRIGGER_DELAY_MS = 30_000; // 30 seconds
const CHECK_DEBOUNCE_MS = 500;

// ── Props ──────────────────────────────────────────────────────────────────────

interface SubdomainClaimPopupProps {
  /** Current workspace subdomain — if set, popup never shows */
  currentSubdomain?: string | null;
  /** If true, popup opens immediately regardless of timer (used by explicit "Claim" button) */
  forceOpen?: boolean;
  /** Called when the popup closes (dismissed or claimed) */
  onClose?: () => void;
  /** Called when subdomain is successfully claimed */
  onClaimed?: (subdomain: string) => void;
}

// ── Types ──────────────────────────────────────────────────────────────────────

type CheckResult = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
type ClaimState = 'idle' | 'claiming' | 'success' | 'error';

// ── Validation ─────────────────────────────────────────────────────────────────

const RESERVED = ['www', 'app', 'api', 'dashboard', 'admin', 'support', 'help', 'billing', 'mail', 'blog', 'docs', 'status', 'cdn', 'static', 'dev', 'staging'];

function validateSlug(s: string): string | null {
  if (s.length < 2) return 'At least 2 characters';
  if (s.length > 32) return 'Maximum 32 characters';
  if (!/^[a-z0-9-]+$/.test(s)) return 'Only lowercase letters, numbers, and hyphens';
  if (s.startsWith('-') || s.endsWith('-')) return 'Cannot start or end with a hyphen';
  if (s.includes('--')) return 'Cannot have consecutive hyphens';
  if (RESERVED.includes(s)) return 'This subdomain is reserved';
  return null;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SubdomainClaimPopup({
  currentSubdomain,
  forceOpen = false,
  onClose,
  onClaimed,
}: SubdomainClaimPopupProps) {
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState('');
  const [checkResult, setCheckResult] = useState<CheckResult>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [claimState, setClaimState] = useState<ClaimState>('idle');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimedSubdomain, setClaimedSubdomain] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Show logic ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // Never show if user already has a subdomain
    if (currentSubdomain) return;

    // Never show if already dismissed
    if (!forceOpen && typeof localStorage !== 'undefined') {
      if (localStorage.getItem(STORAGE_KEY)) return;
    }

    if (forceOpen) {
      setVisible(true);
      return;
    }

    const timer = setTimeout(() => setVisible(true), TRIGGER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [currentSubdomain, forceOpen]);

  // Focus input when popup opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  // ── Close ──────────────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, '1');
    }
    setVisible(false);
    onClose?.();
  }, [onClose]);

  // ── Input change + availability check ──────────────────────────────────────

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setInput(raw);
    setCheckResult('idle');
    setClaimError(null);

    const err = validateSlug(raw);
    setValidationError(err);
    if (err || !raw) return;

    // Debounced availability check
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCheckResult('checking');
      try {
        const res = await fetch(`/api/subdomains/check?subdomain=${encodeURIComponent(raw)}`);
        const data = await res.json() as { available?: boolean };
        setCheckResult(data.available ? 'available' : 'taken');
      } catch {
        setCheckResult('idle');
      }
    }, CHECK_DEBOUNCE_MS);
  }, []);

  // ── Claim ──────────────────────────────────────────────────────────────────

  const handleClaim = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || validationError || checkResult !== 'available') return;

    setClaimState('claiming');
    setClaimError(null);

    try {
      const res = await fetch('/api/subdomains/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain: input }),
      });
      const data = await res.json() as { success?: boolean; subdomain?: string; error?: string };

      if (!res.ok || !data.success) {
        setClaimState('error');
        setClaimError(data.error ?? 'Failed to claim subdomain. Try another name.');
        return;
      }

      setClaimState('success');
      setClaimedSubdomain(data.subdomain ?? input);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, '1');
      }
      onClaimed?.(data.subdomain ?? input);
    } catch {
      setClaimState('error');
      setClaimError('Network error. Please try again.');
    }
  }, [input, validationError, checkResult, onClaimed]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="sdp-backdrop"
        onClick={claimState !== 'success' ? handleClose : undefined}
        aria-hidden="true"
      />

      {/* Popup */}
      <div
        className="sdp-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sdp-title"
      >
        {/* Close button (not shown on success) */}
        {claimState !== 'success' && (
          <button
            className="sdp-close"
            onClick={handleClose}
            aria-label="Close"
            id="sdp-close-btn"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {claimState === 'success' ? (
          // ── SUCCESS STATE ────────────────────────────────────────────────────
          <div className="sdp-success">
            <div className="sdp-success-icon">🎉</div>
            <h2 className="sdp-success-title">You're live!</h2>
            <p className="sdp-success-subdomain">
              <a
                href={`https://${claimedSubdomain}.unool.co`}
                target="_blank"
                rel="noopener noreferrer"
                className="sdp-success-link"
                id="sdp-profile-link"
              >
                {claimedSubdomain}.unool.co
              </a>
            </p>
            <p className="sdp-success-hint">
              Your public profile is live. Share it everywhere.
            </p>
            <button
              className="sdp-success-btn"
              onClick={handleClose}
              id="sdp-success-close"
            >
              Go to my dashboard →
            </button>
          </div>
        ) : (
          // ── CLAIM FORM ───────────────────────────────────────────────────────
          <>
            <div className="sdp-header">
              <div className="sdp-header-icon">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="sdp-title" id="sdp-title">Claim your Unool profile</h2>
                <p className="sdp-subtitle">Get yourname.unool.co — free, permanent, yours.</p>
              </div>
            </div>

            <form className="sdp-form" onSubmit={handleClaim} id="sdp-claim-form">
              {/* Input row */}
              <div className="sdp-input-wrap">
                <div className={`sdp-input-row ${checkResult === 'available' ? 'sdp-input-row--valid' : ''} ${(checkResult === 'taken' || validationError) ? 'sdp-input-row--invalid' : ''}`}>
                  <input
                    ref={inputRef}
                    id="sdp-subdomain-input"
                    className="sdp-input"
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="yourname"
                    maxLength={32}
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Choose your subdomain"
                  />
                  <span className="sdp-input-suffix">.unool.co</span>
                </div>

                {/* Check indicator */}
                <div className="sdp-check-indicator">
                  {checkResult === 'checking' && (
                    <span className="sdp-check--checking">
                      <Loader2 className="h-3.5 w-3.5 sdp-spin" /> Checking…
                    </span>
                  )}
                  {checkResult === 'available' && (
                    <span className="sdp-check--available">
                      <Check className="h-3.5 w-3.5" /> Available!
                    </span>
                  )}
                  {checkResult === 'taken' && (
                    <span className="sdp-check--taken">
                      <X className="h-3.5 w-3.5" /> Already taken
                    </span>
                  )}
                  {validationError && (
                    <span className="sdp-check--taken">{validationError}</span>
                  )}
                </div>
              </div>

              {/* Claim error */}
              {claimError && (
                <p className="sdp-claim-error" role="alert">{claimError}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                id="sdp-submit-btn"
                className="sdp-submit"
                disabled={!input || !!validationError || checkResult !== 'available' || claimState === 'claiming'}
              >
                {claimState === 'claiming' ? (
                  <><Loader2 className="h-4 w-4 sdp-spin" /> Claiming…</>
                ) : (
                  <>Claim my profile <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            {/* Trust signals */}
            <div className="sdp-trust">
              <span className="sdp-trust-item"><Check className="h-3 w-3" /> Free forever</span>
              <span className="sdp-trust-item"><Check className="h-3 w-3" /> No credit card</span>
              <span className="sdp-trust-item"><Check className="h-3 w-3" /> Yours permanently</span>
            </div>

            <button
              className="sdp-skip"
              onClick={handleClose}
              id="sdp-skip-btn"
            >
              Skip for now
            </button>
          </>
        )}
      </div>
    </>
  );
}
