'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import OtpVerifyForm from '@/components/auth/OtpVerifyForm';

type Stage = 'form' | 'otp';

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage]       = useState<Stage>('form');
  const [nextResendAt, setNextResendAt] = useState<string>();
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  // ── Password + OTP path ─────────────────────────────────────────────────────
  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!email.includes('@')) { setShowTooltip(true); setApiError('Enter a valid email address.'); return; }
    if (!password)            { setApiError('Password is required.'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/signin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.message || 'Invalid email or password.');
      } else {
        setNextResendAt(data.nextResendAt);
        setStage('otp');
      }
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = (redirectTo?: string) => {
    // The OTP verify route sets the cookies and passes back the redirectTo
    router.push(redirectTo || '/dashboard');
  };

  return (
    <div className="min-h-screen bg-white relative flex flex-col items-center pt-16 font-sans">
      {/* Home link */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8">
        <Link href="/" className="flex items-center gap-2 text-[15px] text-zinc-700 hover:text-black transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
      </div>

      <div className="w-full max-w-[440px] px-4">
        {/* Toggle */}
        <div className="mx-auto flex w-fit p-1 bg-zinc-100 rounded-md mb-8">
          <Link href="/signin" className="px-5 py-1.5 text-[15px] font-medium rounded bg-[#68d391] text-white shadow-sm ring-1 ring-black/5">
            Sign In
          </Link>
          <Link href="/signup" className="px-5 py-1.5 text-[15px] font-medium rounded text-zinc-500 hover:text-zinc-700 transition-colors">
            Sign Up
          </Link>
        </div>

        {/* ── FORM STAGE ──────────────────────────────────────────────────── */}
        {stage === 'form' && (
          <>
            <h1 className="text-[32px] font-bold text-center text-[#2d3748] tracking-tight mb-8">
              Sign In to Unool
            </h1>

            {/* Google */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-[#edf2f7] hover:bg-[#e2e8f0]
                         text-[#4a5568] font-semibold py-3 rounded text-[15px] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign-In with Google
            </button>

            <div className="relative flex items-center py-7">
              <div className="flex-grow border-t border-zinc-200" />
              <span className="flex-shrink-0 mx-4 text-xs font-medium tracking-wide text-zinc-400 uppercase">OR</span>
              <div className="flex-grow border-t border-zinc-200" />
            </div>

            {/* Form */}
            <form onSubmit={handlePassword} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  placeholder="tom@cruise.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setShowTooltip(false); setApiError(''); }}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded border border-zinc-200 focus:outline-none focus:border-[#68d391]
                             focus:ring-1 focus:ring-[#68d391] text-[15px] placeholder:text-zinc-400 bg-white disabled:opacity-60"
                />
                {showTooltip && !email && (
                  <div className="absolute -bottom-10 left-12 z-10 bg-white border border-zinc-200 rounded shadow-lg px-3 py-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-white border-t border-l border-zinc-200 absolute -top-[5px] left-8 rotate-45" />
                    <div className="w-4 h-4 bg-[#e85c27] flex items-center justify-center rounded-sm">
                      <span className="text-white text-xs font-bold leading-none">!</span>
                    </div>
                    <span className="text-[13px] text-zinc-700">Please fill out this field.</span>
                  </div>
                )}
              </div>

              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setApiError(''); }}
                disabled={loading}
                className="w-full px-4 py-3 rounded border border-zinc-200 focus:outline-none focus:border-[#68d391]
                           focus:ring-1 focus:ring-[#68d391] text-[15px] placeholder:text-zinc-300 bg-white disabled:opacity-60"
              />

              {/* Captcha placeholder */}
              <div className="invisible flex items-center justify-between border border-zinc-200 rounded p-2
                              mx-auto w-[300px] bg-[#f9fafb] mt-5 mb-6 shadow-sm" aria-hidden="true">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-zinc-300 rounded bg-white shadow-inner ml-1" />
                  <span className="text-[14px] text-zinc-700">Verify you are human</span>
                </div>
              </div>

              {/* API error */}
              {apiError && (
                <div className="flex items-start gap-2 text-red-600 text-[13px] bg-red-50 border border-red-100
                                rounded-lg px-3 py-2 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#68d391] hover:bg-[#5bb87d] disabled:opacity-70 disabled:cursor-not-allowed
                           text-white py-3 rounded font-semibold text-[15px] transition-colors shadow-sm
                           flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Sign In'}
              </button>
            </form>
          </>
        )}

        {/* ── OTP STAGE ───────────────────────────────────────────────────── */}
        {stage === 'otp' && (
          <OtpVerifyForm
            email={email}
            purpose="signin"
            verifyUrl="/api/auth/signin/verify-otp"
            onSuccess={handleOtpSuccess}
            onBack={() => { setStage('form'); setApiError(''); }}
            nextResendAt={nextResendAt}
          />
        )}
      </div>

      {/* Footer */}
      {stage === 'form' && (
        <div className="mt-16 text-center">
          <Link href="/forgot-password" className="text-[14px] text-zinc-500 hover:text-zinc-700 transition-colors">
            Forgot your password?
          </Link>
        </div>
      )}

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 w-[52px] h-[52px] bg-white rounded-full
                      shadow-[0_4px_14px_rgba(0,0,0,0.1)] border border-zinc-100 flex items-center
                      justify-center cursor-pointer hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-shadow">
        <MessageSquare className="w-[22px] h-[22px] text-zinc-600 fill-zinc-600" />
      </div>
    </div>
  );
}
