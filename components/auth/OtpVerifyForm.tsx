'use client';

/**
 * components/auth/OtpVerifyForm.tsx
 *
 * Reusable 6-digit OTP entry form with:
 *  - Auto-advance on digit entry
 *  - Backspace moves to previous box
 *  - Paste support
 *  - Countdown timer to resend cooldown
 *  - Up to 5 attempt errors shown
 *  - Expired / max-attempts handling
 */

import {
  useState, useRef, useEffect,
  KeyboardEvent, ClipboardEvent, useCallback,
} from 'react';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export type OtpPurpose = 'signup' | 'signin';

interface OtpVerifyFormProps {
  email:       string;
  purpose:     OtpPurpose;
  verifyUrl:   string;          // POST endpoint for verification
  onSuccess:   (redirectTo?: string) => void;
  onBack:      () => void;
  nextResendAt?: string;        // ISO string – when resend is allowed
}

const MAX_RESEND_WAIT = 60; // seconds

export default function OtpVerifyForm({
  email, purpose, verifyUrl, onSuccess, onBack, nextResendAt,
}: OtpVerifyFormProps) {
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown]           = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialise countdown from `nextResendAt`
  useEffect(() => {
    if (!nextResendAt) return;
    const diff = Math.ceil((new Date(nextResendAt).getTime() - Date.now()) / 1000);
    if (diff > 0) setCooldown(Math.min(diff, MAX_RESEND_WAIT));
  }, [nextResendAt]);

  // Countdown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Auto-focus first box
  useEffect(() => { setTimeout(() => otpRefs.current[0]?.focus(), 100); }, []);

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next  = [...otp];
    next[i]     = digit;
    setOtp(next);
    setError('');
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next   = [...otp];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const token = otp.join('');
    if (token.length < 6) { setError('Please enter all 6 digits.'); return; }

    setLoading(true);
    try {
      const res  = await fetch(verifyUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, otp: token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid code.');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } else {
        // If the server returned session tokens, set them in the browser Supabase client.
        // This ensures getSession() works for subsequent authenticated API calls.
        if (data.session?.access_token && data.session?.refresh_token) {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
        setSuccess(data.message || 'Verified!');
        setTimeout(() => onSuccess(data.redirectTo), 1200);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [otp, email, verifyUrl, onSuccess]);

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    setError('');
    setResendLoading(true);
    try {
      const res  = await fetch('/api/auth/resend-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, purpose }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Could not resend code.');
      } else {
        setOtp(['', '', '', '', '', '']);
        setCooldown(MAX_RESEND_WAIT);
        setSuccess('New code sent!');
        setTimeout(() => setSuccess(''), 3000);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const filled = otp.join('').length === 6;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[#68d391]/10 rounded-full mb-4">
          <span className="text-[28px]">📧</span>
        </div>
        <h2 className="text-[24px] font-bold text-[#2d3748] mb-2">Check your email</h2>
        <p className="text-[14px] text-zinc-500 leading-relaxed">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-zinc-700">{email}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} noValidate>
        {/* OTP boxes */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              disabled={loading || !!success}
              aria-label={`Digit ${i + 1}`}
              className={`
                w-12 h-14 text-center text-[22px] font-bold rounded-lg border-2
                transition-all duration-150 bg-white text-[#2d3748]
                focus:outline-none focus:border-[#68d391] focus:ring-2 focus:ring-[#68d391]/20
                disabled:opacity-50
                ${digit ? 'border-[#68d391]' : 'border-zinc-200'}
              `}
            />
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-2 text-red-600 text-[13px] bg-red-50 border border-red-100
                          rounded-lg px-3 py-2 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-green-600 text-[13px] bg-green-50 border border-green-100
                          rounded-lg px-3 py-2 mb-4 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !filled || !!success}
          className="w-full bg-[#68d391] hover:bg-[#5bb87d] disabled:opacity-60 disabled:cursor-not-allowed
                     text-white py-3 rounded-lg font-semibold text-[15px] transition-colors shadow-sm
                     flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
            : 'Verify Code'}
        </button>
      </form>

      {/* Resend & back */}
      <div className="flex flex-col items-center gap-2 text-[13px] text-zinc-500">
        <div className="flex items-center gap-1">
          <span>Didn't get a code?</span>
          {cooldown > 0 ? (
            <span className="text-zinc-400">
              Resend in <span className="font-semibold text-zinc-600 tabular-nums">{cooldown}s</span>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-[#4299e1] hover:underline font-semibold disabled:opacity-50 flex items-center gap-1"
            >
              {resendLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
              Resend
            </button>
          )}
        </div>
        <button
          onClick={onBack}
          disabled={loading}
          className="text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-40"
        >
          ← Go back
        </button>
      </div>
    </div>
  );
}
