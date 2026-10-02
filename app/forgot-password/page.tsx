'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

const C = {
  oxblood: '#3A0B1A',
  mahogany: '#5C1A1A',
  terracotta: '#8C2A25',
  clay: '#C84B31',
  sand: '#D4B896',
  cream: '#FFF9F2',
  ink: '#1A0A05',
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState<'request' | 'otp' | 'success'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (stage === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 600);
      setCooldown(300); // 5 minutes
    }
  }, [stage]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 429) {
        setError(data.message || 'Failed to request reset.');
      } 
      // In both success or failure (except rate-limit), we advance to conceal user existence
      setStage('otp');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setError('');
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((ch, idx) => { next[idx] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verifyAndUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length < 6) { setError('Please enter 6-digit OTP.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/reset-password/verify-and-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid code.');
      } else {
        setStage('success');
        setTimeout(() => router.push('/signin'), 3000);
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // UI structure mimics `signin` feed aesthetic
  return (
    <div 
      className="min-h-screen w-full flex justify-center font-sans text-white selection:bg-[#C84B31]"
      style={{ background: `linear-gradient(180deg, ${C.oxblood} 0%, ${C.terracotta} 40%, ${C.sand} 80%, ${C.cream} 100%)` }}
    >
      <div className="w-full max-w-7xl flex h-screen overflow-hidden">
        
        {/* Left Sidebar (Nav) */}
        <div className="hidden sm:flex flex-col w-[80px] lg:w-[275px] shrink-0 border-r border-white/10 p-4">
          <Link href="/" className="flex items-center gap-4 p-3 hover:bg-white/5 w-fit rounded-full transition-colors mb-4 group">
            <ArrowLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden lg:block text-xl font-bold">Back to Site</span>
          </Link>
        </div>

        {/* Center Feed */}
        <div className="flex-1 w-full max-w-[600px] border-r border-white/10 flex flex-col h-full overflow-y-auto no-scrollbar relative bg-black/40 backdrop-blur-md">
          {/* Header */}
          <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 p-4 flex gap-8">
            <Link href="/signin" className="text-[15px] font-bold text-white/50 hover:text-white transition-colors pb-2">
              Sign In
            </Link>
            <div className="text-[15px] font-bold relative pb-2 text-white">
              Reset Password
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-[#C84B31]" />
            </div>
          </div>

          <div className="p-4 sm:p-6 pb-32">
            
            {/* Post 1: Unool Reset Request */}
            <div className="relative z-10 w-full mb-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold z-10 relative shadow-inner" style={{ background: `linear-gradient(135deg, ${C.clay}, ${C.terracotta})` }}>
                    U
                  </div>
                  {/* Thread line connecting to next post */}
                  <AnimatePresence>
                    {(stage === 'otp' || stage === 'success') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: '100%', opacity: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="w-0.5 mt-2 flex-grow rounded-full bg-white/20"
                      />
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[15px]">Unool</span>
                    <span className="text-[15px] text-white/50 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-white fill-[#C84B31]" /> @unool
                    </span>
                    <span className="text-[15px] text-white/40 ml-auto">now</span>
                  </div>
                  
                  <p className="text-[15px] leading-relaxed mb-4 text-white/90">
                    Forgot your password? 🧐 <br/>
                    No worries. Reply with your email address and we'll send a code to reset it.
                  </p>

                  <AnimatePresence mode="wait">
                    {stage === 'request' && (
                      <motion.form
                        key="request-form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleRequest}
                        className="rounded-2xl border border-white/20 bg-white/5 p-1 backdrop-blur-md overflow-hidden"
                      >
                        <div className="flex flex-col">
                          <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            disabled={loading}
                            className="w-full bg-transparent border-none focus:ring-0 text-[15px] p-4 placeholder:text-white/40 text-white outline-none disabled:opacity-50"
                          />
                        </div>
                        
                        {error && (
                          <p className="text-red-400 text-sm px-4 pb-2 font-medium">{error}</p>
                        )}

                        <div className="flex items-center justify-between p-3 bg-white/5 border-t border-white/10">
                          <Link href="/signin" className="text-sm font-semibold hover:underline text-[#C84B31]">
                            Back to Sign In
                          </Link>
                          
                          <button
                            type="submit"
                            disabled={loading || !email}
                            className="px-6 py-2 rounded-full font-bold text-[14px] text-white flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 bg-white text-black hover:bg-white/90"
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'Send Code'} <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Post 2: OTP and New Password */}
            <AnimatePresence>
              {(stage === 'otp' || stage === 'success') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="relative z-10 w-full"
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold z-10 shadow-inner" style={{ background: `linear-gradient(135deg, ${C.clay}, ${C.terracotta})` }}>
                        U
                      </div>
                    </div>
                    
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[15px]">Unool</span>
                        <span className="text-[15px] text-white/50 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-white fill-[#C84B31]" /> @unool
                        </span>
                      </div>
                      
                      <p className="text-[15px] leading-relaxed mb-4 text-white/90">
                        Check your inbox. We sent a 6-digit code. Enter it below along with your fresh password! 🔒
                      </p>

                      <div className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-md">
                        {stage === 'success' ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            className="mt-2 p-6 rounded-2xl border border-green-500/50 bg-green-500/10 flex flex-col items-center justify-center text-center gap-3"
                          >
                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                            <h3 className="text-xl font-bold text-green-400">Password Updated!</h3>
                            <p className="text-sm text-green-400/80">Taking you back to Sign In...</p>
                          </motion.div>
                        ) : (
                          <form onSubmit={verifyAndUpdate}>
                            <div className="flex justify-between gap-2 mb-4">
                              {otp.map((digit, i) => (
                                <input
                                  key={i}
                                  ref={(el) => { otpRefs.current[i] = el; }}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  value={digit}
                                  onChange={(e) => handleOtpChange(i, e.target.value)}
                                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                  onPaste={i === 0 ? handleOtpPaste : undefined}
                                  disabled={loading}
                                  className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border transition-all duration-200 outline-none bg-black/50 text-white
                                    ${digit ? 'border-[#C84B31] shadow-[0_0_15px_rgba(200,75,49,0.3)]' : 'border-white/20'}
                                    focus:border-[#C84B31] focus:ring-1 focus:ring-[#C84B31]
                                  `}
                                />
                              ))}
                            </div>

                            <input
                              type="password"
                              placeholder="New Password (min 8 chars)"
                              value={password}
                              onChange={(e) => { setPassword(e.target.value); setError(''); }}
                              disabled={loading}
                              className="w-full mt-2 mb-2 bg-black/50 border border-white/20 rounded-xl focus:border-[#C84B31] focus:ring-1 focus:ring-[#C84B31] text-[15px] p-4 placeholder:text-white/40 text-white outline-none disabled:opacity-50 transition-all duration-200"
                            />

                            {error && (
                              <p className="text-red-400 text-sm mt-2 font-medium text-center">{error}</p>
                            )}
                            
                            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                              <span className="text-sm font-medium text-white/50">
                                {cooldown > 0 ? `Code expires in ${cooldown}s` : 'Code expired'}
                              </span>
                              
                              <button
                                type="submit"
                                disabled={loading || otp.join('').length < 6 || password.length < 8}
                                className="w-full sm:w-auto px-8 py-2.5 rounded-full font-bold text-[14px] text-black bg-white flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 hover:bg-white/90"
                              >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>

                      {stage !== 'success' && (
                        <button onClick={() => { setStage('request'); setOtp(['','','','','','']); setError(''); setPassword(''); }} className="text-sm font-semibold mt-4 text-white/50 hover:text-white transition-colors">
                          ← Try another email
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar (Trending/Info) */}
        <div className="hidden lg:flex flex-col w-[350px] shrink-0 p-6 pl-8">
          <div className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">Security first.</h2>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              We encrypt your credentials heavily to keep your accounts secure. Resetting your password securely helps maintain that safety.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
