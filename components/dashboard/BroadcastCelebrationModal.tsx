'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Radio,
  QrCode,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { PlatformBrandLogo, type SupportedPlatformType } from '@/components/dashboard/previews/PlatformMobilePreview';

interface PublishedChannel {
  platform: string;
  platformUrl?: string | null;
}

interface BroadcastCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string | null;
  subdomain?: string | null;
  publishedChannels: PublishedChannel[];
  successCount: number;
  onNavigateDashboard?: () => void;
}

export function BroadcastCelebrationModal({
  isOpen,
  onClose,
  shareUrl,
  subdomain,
  publishedChannels,
  successCount,
  onNavigateDashboard,
}: BroadcastCelebrationModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const cleanSubdomain = subdomain || 'preview';
  const displayUrl = shareUrl || `https://unool.co/u/${cleanSubdomain}?activity=1`;

  const shareText = `I just published a new story across platforms. Explore the full story and interactive recap on my One-Link:`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${displayUrl}`)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(displayUrl)}&text=${encodeURIComponent(shareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(displayUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(displayUrl)}`;

  const handleCopy = () => {
    if (!displayUrl) return;
    navigator.clipboard.writeText(displayUrl).then(() => {
      setCopied(true);
      toast.success('One-Link copied to clipboard');
      setTimeout(() => setCopied(false), 2400);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleNativeShare = () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      navigator.share({
        title: 'Check out my latest story',
        text: shareText,
        url: displayUrl,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  // Filter valid platform names for brand logos
  const validChannels = (publishedChannels || []).filter(c => c && c.platform);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="broadcast-celebration-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-scrollbar"
          style={{
            background: 'rgba(10, 8, 7, 0.78)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
          onClick={onClose}
        >
          {/* Main Card Container */}
          <motion.div
            key="broadcast-celebration-card"
            initial={{ scale: 0.94, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="relative w-full max-w-xl rounded-3xl overflow-hidden text-white my-auto shadow-2xl"
            style={{
              background: 'linear-gradient(155deg, rgba(26, 23, 20, 0.98) 0%, rgba(15, 13, 11, 0.99) 100%)',
              border: '1px solid rgba(196, 162, 101, 0.28)',
              boxShadow: '0 30px 90px -15px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Ambient Warm Golden Aura */}
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none opacity-25 blur-3xl"
              style={{ background: 'radial-gradient(circle, #C4A265 0%, #A68B52 50%, transparent 80%)' }}
            />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 p-5 sm:p-7 space-y-5">
              {/* ── 1. Top Milestone Badge & Header ── */}
              <div className="flex flex-col items-center text-center pt-1">
                {/* Radar Pulse Beacon */}
                <div className="relative mb-3 flex items-center justify-center">
                  <span className="absolute w-14 h-14 rounded-full bg-[#C4A265]/20 animate-ping opacity-60 pointer-events-none" />
                  <span className="absolute w-12 h-12 rounded-full bg-[#C4A265]/30 animate-pulse pointer-events-none" />
                  <div
                    className="relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #C4A265 0%, #8B7355 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Radio className="w-6 h-6 text-white stroke-[2.2]" />
                  </div>
                </div>

                {/* Status Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{successCount || validChannels.length || 1} Channel{((successCount || validChannels.length) !== 1) ? 's' : ''} Live & Synchronized</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white">
                  Story Broadcast Live
                </h2>
                <p className="text-xs sm:text-sm text-[#A89F91] max-w-md mt-1 leading-relaxed">
                  Your multi-platform story is live and synchronized. Your interactive One-Link is primed with automated recent-activity focus.
                </p>
              </div>

              {/* ── 2. Live Channels Verification Strip ── */}
              {validChannels.length > 0 && (
                <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-[10px] text-[#A89F91] font-mono uppercase tracking-wider mr-1">Active:</span>
                  {validChannels.map((ch, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white/90"
                    >
                      <PlatformBrandLogo platform={(ch.platform ? ch.platform.toLowerCase() : '') as SupportedPlatformType} size={14} />
                      <span className="font-semibold capitalize text-[11px]">{ch.platform}</span>
                      {ch.platformUrl && (
                        <a
                          href={ch.platformUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#C4A265] hover:text-white transition-colors ml-0.5"
                          title="View live post"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── 3. The One-Link VIP Pass Showcase ── */}
              <div
                className="relative rounded-2xl p-4 sm:p-4.5 border transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(38, 33, 28, 0.95) 0%, rgba(20, 18, 15, 0.98) 100%)',
                  borderColor: 'rgba(196, 162, 101, 0.35)',
                  boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-[#C4A265] mb-2 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C4A265]" />
                    Official One-Link Identity Pass
                  </span>
                  <span className="text-emerald-400 font-bold">Auto-Scroll Engaged</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                  {/* Clean Domain Showcase */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 flex-1 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    <span className="font-mono text-xs text-white truncate flex-1 font-medium">
                      {displayUrl}
                    </span>
                  </div>

                  {/* Actions: Copy & Live Preview */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md"
                      style={{
                        background: copied ? '#10B981' : 'linear-gradient(135deg, #C4A265 0%, #A68B52 100%)',
                        color: copied ? '#FFFFFF' : '#1A130B',
                      }}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 stroke-[2]" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={displayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-colors cursor-pointer"
                      title="Visit your public One-Link live in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowQr(!showQr)}
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-colors cursor-pointer ${
                        showQr ? 'bg-[#C4A265] text-[#1A130B] border-[#C4A265]' : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                      }`}
                      title="Toggle QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Optional QR Code Drawer */}
                <AnimatePresence>
                  {showQr && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pt-3 border-t border-white/10 mt-3 flex flex-col items-center gap-2"
                    >
                      <div className="p-3 bg-white rounded-xl shadow-inner">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(displayUrl)}`}
                          alt="QR Code to your One-Link"
                          className="w-32 h-32 object-contain"
                        />
                      </div>
                      <span className="text-[11px] text-[#A89F91]">Scan with your mobile camera to test recipient experience</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── 4. World-Class Curated Social Share Matrix ── */}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#A89F91] mb-2 px-0.5">
                  Instant Channel Broadcast
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* WhatsApp Card */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.12) 0%, rgba(18, 140, 126, 0.05) 100%)',
                      borderColor: 'rgba(37, 211, 102, 0.3)',
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center shrink-0 text-[#25D366] group-hover:scale-110 transition-transform">
                      <PlatformBrandLogo platform="whatsapp" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white leading-tight">WhatsApp</p>
                      <p className="text-[10px] text-[#A89F91] truncate">Direct chat & status</p>
                    </div>
                  </a>

                  {/* Telegram Card */}
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34, 158, 217, 0.12) 0%, rgba(14, 118, 168, 0.05) 100%)',
                      borderColor: 'rgba(34, 158, 217, 0.3)',
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#229ED9]/20 border border-[#229ED9]/30 flex items-center justify-center shrink-0 text-[#229ED9] group-hover:scale-110 transition-transform">
                      <PlatformBrandLogo platform="telegram" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white leading-tight">Telegram</p>
                      <p className="text-[10px] text-[#A89F91] truncate">Channels & groups</p>
                    </div>
                  </a>

                  {/* X (Twitter) Card */}
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white group-hover:scale-110 transition-transform">
                      <PlatformBrandLogo platform="x" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white leading-tight">X (Twitter)</p>
                      <p className="text-[10px] text-[#A89F91] truncate">Quote broadcast</p>
                    </div>
                  </a>

                  {/* LinkedIn Card */}
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(10, 102, 194, 0.12) 0%, rgba(5, 75, 145, 0.05) 100%)',
                      borderColor: 'rgba(10, 102, 194, 0.3)',
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#0A66C2]/20 border border-[#0A66C2]/30 flex items-center justify-center shrink-0 text-[#0A66C2] group-hover:scale-110 transition-transform">
                      <PlatformBrandLogo platform="linkedin" size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white leading-tight">LinkedIn</p>
                      <p className="text-[10px] text-[#A89F91] truncate">Professional network</p>
                    </div>
                  </a>
                </div>

                {/* System Native Share Button */}
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full mt-2.5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 hover:text-white transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>More Sharing Options (AirDrop, iMessage, Slack, Mail...)</span>
                </button>
              </div>

              {/* ── 5. Recipient Experience Callout ── */}
              <div className="rounded-2xl p-3 bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-[11px] text-[#A89F91] leading-relaxed">
                <span className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C4A265]" />
                </span>
                <span>
                  <strong>Interactive Audience Flow:</strong> When visitors tap your One-Link, they land on your verified public profile and auto-scroll directly to this story for instant engagement, with seamless access to your portfolio and links.
                </span>
              </div>

              {/* ── 6. Deflation-Free User Flow Controls ── */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#A89F91] hover:text-white transition-colors cursor-pointer"
                >
                  Keep Editing Drafts
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateDashboard) {
                      onNavigateDashboard();
                    } else if (typeof window !== 'undefined') {
                      window.location.href = '/dashboard';
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #C4A265 0%, #A68B52 100%)',
                    color: '#1A130B',
                  }}
                >
                  <span>Done & Return to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
