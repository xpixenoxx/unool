'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  PlatformMobilePreview,
  isPlatformDark,
  getPlatformBgColor,
  PlatformBrandLogo,
} from '@/components/dashboard/previews/PlatformMobilePreview';
import { PLATFORM_CONFIG } from '@/lib/config/platformConfig';
import type { PlatformType, PlatformDraft } from './types';
import {
  Home,
  Search,
  Bookmark,
  Bell,
  Mail,
  Users,
  Plus,
  Briefcase,
  Play,
  Edit2,
  Heart,
  Zap,
  Layers,
  Compass,
  MessageSquare as MessageSquareIcon,
} from 'lucide-react';

export interface IPhonePreviewProps {
  content: string;
  media: { url: string; type: 'image' | 'video' | 'document' }[];
  previewPlatform: PlatformType;
  setPreviewPlatform: (p: PlatformType) => void;
  profileName: string;
  profileHeadline: string;
  avatarUrl?: string;
  connectedPlatforms?: PlatformType[];
  selectedPlatforms?: PlatformType[];
  drafts?: PlatformDraft[];
  effectiveScale?: number;
}

function IPhoneBottomNavBar({
  platform,
  avatarUrl,
  initials,
}: {
  platform: PlatformType;
  avatarUrl?: string;
  initials: string;
}) {
  const [activeTab, setActiveTab] = useState('home');
  const isDark = isPlatformDark(platform);

  const navBorder = isDark ? 'border-[#262626]' : 'border-[#EAEAEA]';
  const navBg = isDark ? 'bg-[#000000]' : 'bg-[#FFFFFF]';
  const iconMuted = isDark ? 'text-[#71767B]' : 'text-[#666666]';

  // Platform specific bottom navigation items
  const renderNavTabs = () => {
    switch (platform) {
      case 'x':
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'home' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Home className="w-5 h-5" strokeWidth={activeTab === 'home' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('search')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'search' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Search className="w-5 h-5" strokeWidth={activeTab === 'search' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('grok')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'grok' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Bookmark className="w-5 h-5" strokeWidth={activeTab === 'grok' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('bell')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'bell' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Bell className="w-5 h-5" strokeWidth={activeTab === 'bell' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('messages')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'messages' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Mail className="w-5 h-5" strokeWidth={activeTab === 'messages' ? 2.5 : 1.8} />
            </button>
          </>
        );

      case 'linkedin':
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'home' ? 'text-[#0A66C2]' : iconMuted)}>
              <Home className="w-4 h-4" strokeWidth={activeTab === 'home' ? 2.5 : 1.8} />
              <span className="text-[9px] font-semibold">Home</span>
            </button>
            <button type="button" onClick={() => setActiveTab('network')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'network' ? 'text-[#0A66C2]' : iconMuted)}>
              <Users className="w-4 h-4" strokeWidth={activeTab === 'network' ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">Network</span>
            </button>
            <button type="button" onClick={() => setActiveTab('post')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'post' ? 'text-[#0A66C2]' : iconMuted)}>
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[9px] font-medium">Post</span>
            </button>
            <button type="button" onClick={() => setActiveTab('notifs')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'notifs' ? 'text-[#0A66C2]' : iconMuted)}>
              <Bell className="w-4 h-4" strokeWidth={activeTab === 'notifs' ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">Notifs</span>
            </button>
            <button type="button" onClick={() => setActiveTab('jobs')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'jobs' ? 'text-[#0A66C2]' : iconMuted)}>
              <Briefcase className="w-4 h-4" strokeWidth={activeTab === 'jobs' ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">Jobs</span>
            </button>
          </>
        );

      case 'instagram':
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'home' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Home className="w-5 h-5" strokeWidth={activeTab === 'home' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('search')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'search' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Search className="w-5 h-5" strokeWidth={activeTab === 'search' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('create')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'create' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => setActiveTab('reels')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'reels' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Play className="w-5 h-5" strokeWidth={activeTab === 'reels' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('profile')} className="p-1 transition-transform active:scale-90">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-current" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-[9px] text-white font-bold flex items-center justify-center">
                  {initials[0] || 'U'}
                </div>
              )}
            </button>
          </>
        );

      case 'threads':
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'home' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Home className="w-5 h-5" strokeWidth={activeTab === 'home' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('search')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'search' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Search className="w-5 h-5" strokeWidth={activeTab === 'search' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('post')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'post' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Edit2 className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('activity')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'activity' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Heart className="w-5 h-5" strokeWidth={activeTab === 'activity' ? 2.5 : 1.8} />
            </button>
            <button type="button" onClick={() => setActiveTab('profile')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'profile' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Users className="w-5 h-5" strokeWidth={activeTab === 'profile' ? 2.5 : 1.8} />
            </button>
          </>
        );

      case 'youtube':
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'home' ? 'text-red-600' : iconMuted)}>
              <Home className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[9px] font-semibold">Home</span>
            </button>
            <button type="button" onClick={() => setActiveTab('shorts')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'shorts' ? 'text-red-600' : iconMuted)}>
              <Zap className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[9px] font-medium">Shorts</span>
            </button>
            <button type="button" onClick={() => setActiveTab('add')} className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-700 active:scale-95 text-white">
              <Plus className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => setActiveTab('subs')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'subs' ? 'text-red-600' : iconMuted)}>
              <Layers className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[9px] font-medium">Subs</span>
            </button>
            <button type="button" onClick={() => setActiveTab('you')} className={cn('flex flex-col items-center gap-0.5 transition-transform active:scale-90', activeTab === 'you' ? 'text-red-600' : iconMuted)}>
              <Users className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[9px] font-medium">You</span>
            </button>
          </>
        );

      case 'reddit':
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'home' ? 'text-[#FF4500]' : iconMuted)}>
              <Home className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('communities')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'communities' ? 'text-[#FF4500]' : iconMuted)}>
              <Compass className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('create')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'create' ? 'text-[#FF4500]' : iconMuted)}>
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => setActiveTab('chat')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'chat' ? 'text-[#FF4500]' : iconMuted)}>
              <MessageSquareIcon className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('inbox')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'inbox' ? 'text-[#FF4500]' : iconMuted)}>
              <Bell className="w-5 h-5" strokeWidth={2.2} />
            </button>
          </>
        );

      default:
        return (
          <>
            <button type="button" onClick={() => setActiveTab('home')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'home' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Home className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('explore')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'explore' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Compass className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('plus')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'plus' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => setActiveTab('bell')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'bell' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Bell className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <button type="button" onClick={() => setActiveTab('profile')} className={cn('p-2 transition-transform active:scale-90', activeTab === 'profile' ? (isDark ? 'text-white' : 'text-black') : iconMuted)}>
              <Users className="w-5 h-5" strokeWidth={2.2} />
            </button>
          </>
        );
    }
  };

  return (
    <div className={cn('relative w-full border-t px-3 pt-1.5 pb-0.5 flex items-center justify-around transition-colors duration-200', navBorder, navBg)}>
      {renderNavTabs()}
    </div>
  );
}

export function IPhonePreview({
  content,
  media,
  previewPlatform,
  setPreviewPlatform,
  profileName,
  profileHeadline,
  avatarUrl,
  connectedPlatforms = [],
  selectedPlatforms = [],
  drafts = [],
  effectiveScale = 0.72,
}: IPhonePreviewProps) {
  const [islandExpanded, setIslandExpanded] = useState(false);

  const platformsToShow = useMemo(() => {
    return connectedPlatforms;
  }, [connectedPlatforms]);

  // Auto-switch preview platform if current one is not in platformsToShow
  useEffect(() => {
    if (platformsToShow.length > 0 && !platformsToShow.includes(previewPlatform)) {
      setPreviewPlatform(platformsToShow[0]);
    }
  }, [platformsToShow, previewPlatform, setPreviewPlatform]);

  const now = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }, []);

  const displayContent = content || 'Start typing to see your post come alive...';
  const isEmpty = !content.trim();
  const initials = profileName ? profileName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';
  const isDark = isPlatformDark(previewPlatform);
  const bgColor = getPlatformBgColor(previewPlatform);

  const cfg = PLATFORM_CONFIG[previewPlatform];
  const charLimit = cfg?.maxChars ?? 1000;
  const charCount = content.length;
  const isOverLimit = charCount > charLimit;

  const previewWidth = Math.round(326 * effectiveScale);
  const previewHeight = Math.round(660 * effectiveScale);

  return (
    <div className="flex flex-col items-center gap-2.5" style={{ width: previewWidth }}>
      {/* ── Top Header Row ─────────────────────────── */}
      <div className="flex items-center justify-between w-full px-1 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[#3D2B1F] font-semibold text-xs">iPhone 16 Pro Preview</span>
        </div>
      </div>

      {/* ── Horizontal Bar Along Upper Edge of Mobile (Image 2) ── */}
      {platformsToShow.length > 0 ? (
        <div className="flex gap-2 p-2 rounded-2xl shadow-xs border border-[#E8E0D4] bg-[#FFFDF9]/95 backdrop-blur-md w-full overflow-x-auto no-scrollbar scroll-smooth">
          {platformsToShow.map(p => {
            const pCfg = PLATFORM_CONFIG[p];
            const isActive = previewPlatform === p;
            const draft = drafts.find(d => d.platform === p);
            const isReady = draft?.status === 'ready';
            const isGenerating = draft?.status === 'generating';
            const isError = draft?.status === 'error';
            const isDraftOverLimit = (draft?.characterCount ?? 0) > (pCfg?.maxChars ?? 1000);

            return (
              <button
                key={p}
                type="button"
                onClick={() => setPreviewPlatform(p)}
                className={cn(
                  'relative group flex flex-col items-center gap-1 p-1 rounded-xl transition-all duration-200 flex-shrink-0 cursor-pointer',
                  isActive
                    ? 'scale-105'
                    : 'opacity-70 hover:opacity-100 hover:scale-100'
                )}
                title={isError ? `${pCfg?.name || p}: Adaptation unavailable (review Terms of Service)` : pCfg?.name || p}
              >
                {/* Squircle App Icon Container */}
                <div
                  className={cn(
                    'relative w-10 h-10 rounded-[12px] flex items-center justify-center transition-all duration-200 overflow-hidden',
                    isActive
                      ? 'ring-2 ring-[#C4A265] ring-offset-2 scale-105 shadow-md bg-white'
                      : 'hover:scale-105 hover:shadow-xs'
                  )}
                >
                  <PlatformBrandLogo platform={p} size={30} />

                  {/* Status Indicator Badge */}
                  {isGenerating && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white animate-spin flex items-center justify-center text-[7px] text-white" />
                  )}
                  {isReady && !isDraftOverLimit && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                  )}
                  {(isError || isDraftOverLimit) && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
                  )}
                </div>

                <span
                  className={cn(
                    'text-[10px] max-w-[44px] truncate leading-tight tracking-tight',
                    isActive ? 'font-bold text-[#3D2B1F]' : 'font-medium text-[#8B7355]'
                  )}
                >
                  {pCfg?.name?.split(' ')[0] || p}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center py-2.5 px-3 rounded-2xl shadow-xs border border-[#E8E0D4] bg-[#FFFDF9]/95 text-center w-full">
          <span className="text-[11px] font-medium text-[#8B7355]">
            No connected platforms to preview
          </span>
        </div>
      )}

      {/* ── Realistic iPhone 16 Pro Chassis ───────────────── */}
      <div
        className="flex justify-center transition-all duration-300 relative"
        style={{
          width: previewWidth,
          height: previewHeight,
        }}
      >
        <div
          className="relative select-none origin-top transition-transform duration-300 flex-shrink-0"
          style={{
            width: 326,
            height: 660,
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'top center',
          }}
        >
        {/* Hardware Buttons - Left: Volume Up/Down */}
        <div
          className="absolute -left-[5px] top-36 w-[5px] h-12 rounded-l-md"
          style={{
            background: 'linear-gradient(to right, #6E747B, #9CA3AF, #6E747B)',
            boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.5)',
          }}
        />
        <div
          className="absolute -left-[5px] top-52 w-[5px] h-12 rounded-l-md"
          style={{
            background: 'linear-gradient(to right, #6E747B, #9CA3AF, #6E747B)',
            boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.5)',
          }}
        />

        {/* Hardware Button - Right: Power / Side Button */}
        <div
          className="absolute -right-[5px] top-40 w-[5px] h-16 rounded-r-md"
          style={{
            background: 'linear-gradient(to left, #6E747B, #9CA3AF, #6E747B)',
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.5)',
          }}
        />

        {/* Outer Titanium Rim */}
        <div
          className="relative w-full h-full rounded-[54px] overflow-hidden p-[3.5px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)] z-10 transition-shadow duration-300"
          style={{
            background: 'linear-gradient(135deg, #A8B1B8 0%, #52575C 30%, #1C1E20 50%, #52575C 70%, #8A929A 100%)',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5), inset 0 0 0 1.5px rgba(255,255,255,0.2), inset 0 2px 4px rgba(255,255,255,0.3)',
            clipPath: 'inset(0px round 54px)',
            WebkitClipPath: 'inset(0px round 54px)',
          }}
        >
          {/* Inner Display Bezel */}
          <div
            className="relative w-full h-full rounded-[50px] overflow-hidden p-[8px]"
            style={{
              background: '#090A0B',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
              clipPath: 'inset(0px round 50px)',
              WebkitClipPath: 'inset(0px round 50px)',
              WebkitMaskImage: '-webkit-radial-gradient(white, black)',
              maskImage: 'radial-gradient(white, black)',
              isolation: 'isolate',
            }}
          >
            {/* Screen Area with Platform-matched background */}
            <div
              className="relative w-full h-full rounded-[42px] overflow-hidden flex flex-col justify-between transition-colors duration-300"
              style={{
                background: bgColor,
                clipPath: 'inset(0px round 42px)',
                WebkitClipPath: 'inset(0px round 42px)',
                WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                maskImage: 'radial-gradient(white, black)',
                isolation: 'isolate',
                transform: 'translateZ(0)',
              }}
            >
              {/* ── Status Bar & Dynamic Island ── */}
              <div
                className="relative flex items-center justify-between px-6 pt-3 pb-1 z-30"
                style={{
                  color: isDark ? '#FFFFFF' : '#000000',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                }}
              >
                <span className="tracking-tight text-[12px] pl-1 font-semibold">{now}</span>

                {/* Interactive Dynamic Island */}
                <button
                  type="button"
                  onClick={() => setIslandExpanded(!islandExpanded)}
                  className="absolute left-1/2 top-2.5 -translate-x-1/2 flex items-center justify-between px-2.5 transition-all duration-300 cursor-pointer shadow-lg select-none"
                  style={{
                    width: islandExpanded ? 190 : 108,
                    height: 28,
                    background: '#000000',
                    borderRadius: 20,
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
                  }}
                  title="Dynamic Island: Click to inspect live status"
                >
                  {/* Left: Mini Platform Logo */}
                  <div className="flex items-center gap-1.5">
                    <PlatformBrandLogo platform={previewPlatform} size={13} className="text-white flex-shrink-0" />
                    {islandExpanded && (
                      <span className="text-[10px] font-semibold text-white truncate max-w-[75px]">
                        {cfg?.name?.split(' ')[0] || previewPlatform}
                      </span>
                    )}
                  </div>

                  {/* Camera / Sensor Dot */}
                  {!islandExpanded && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#111214] shadow-inner border border-white/10" />
                  )}

                  {/* Right: Live Character Counter / State */}
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        'text-[10px] font-mono tracking-tight font-bold',
                        isOverLimit ? 'text-rose-400' : 'text-emerald-400'
                      )}
                    >
                      {charCount > 0 ? (isOverLimit ? `+${charCount - charLimit}` : `${charCount}`) : '●'}
                    </span>
                  </div>
                </button>

                {/* Right: Cellular / Wi-Fi / Battery */}
                <div className="flex items-center gap-1.5 pr-1">
                  <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor">
                    <rect x="0" y="8" width="2.8" height="4" rx="0.8" opacity="1" />
                    <rect x="4.2" y="5" width="2.8" height="7" rx="0.8" opacity="1" />
                    <rect x="8.4" y="2" width="2.8" height="10" rx="0.8" opacity="1" />
                    <rect x="12.6" y="0" width="2.8" height="12" rx="0.8" opacity="0.3" />
                  </svg>
                  <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor">
                    <path d="M8 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM3.5 7.5C5 6 6.5 5.5 8 5.5s3 .5 4.5 2" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    <path d="M1 4.5c2.5-2.5 4.5-3 7-3s4.5.5 7 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                  </svg>
                  <div className="flex items-center">
                    <div style={{ width: 22, height: 11, borderRadius: 3, border: '1.4px solid currentColor', padding: 1.2 }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(15, (charCount / charLimit) * 100))}%`,
                          height: '100%',
                          borderRadius: 1.2,
                          background: isOverLimit ? '#EF4444' : 'currentColor',
                        }}
                      />
                    </div>
                    <div style={{ width: 1.2, height: 3.5, background: 'currentColor', borderRadius: '0 1px 1px 0', marginLeft: 0.5 }} />
                  </div>
                </div>
              </div>

              {/* ── Scrollable Feed Canvas ── */}
              <div className="flex-1 overflow-y-auto w-full no-scrollbar overscroll-contain">
                {platformsToShow.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center select-none">
                    <div className="w-14 h-14 rounded-2xl bg-[#F4EFE6] border border-[#E8DEC8] flex items-center justify-center mb-3.5 shadow-2xs">
                      <PlatformBrandLogo platform="linkedin" size={26} className="opacity-40 grayscale" />
                    </div>
                    <p className="text-sm font-bold text-[#231C16]">No connected platforms</p>
                    <p className="text-xs text-[#7A6B5D] mt-1.5 leading-relaxed">
                      Connect your social accounts in Dashboard to see live mobile previews and publish everywhere.
                    </p>
                    <a
                      href="/dashboard"
                      className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#231C16] text-white text-xs font-semibold hover:bg-black transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect Accounts</span>
                    </a>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={previewPlatform}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="w-full"
                    >
                      <PlatformMobilePreview
                        platform={previewPlatform}
                        content={displayContent}
                        isEmpty={isEmpty}
                        media={media}
                        profileName={profileName}
                        profileHeadline={profileHeadline}
                        initials={initials}
                        avatarUrl={avatarUrl}
                      />
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* ── Native App Bottom Navigation & Home Indicator ── */}
              <div
                className="w-full rounded-b-[42px] overflow-hidden flex flex-col shrink-0"
                style={{
                  clipPath: 'inset(0 round 0 0 42px 42px)',
                  WebkitClipPath: 'inset(0 round 0 0 42px 42px)',
                }}
              >
                <IPhoneBottomNavBar
                  platform={previewPlatform}
                  avatarUrl={avatarUrl}
                  initials={initials}
                />

                {/* ── iOS Home Indicator Bar ── */}
                <div
                  className="w-full pb-1.5 pt-0.5 flex justify-center rounded-b-[42px]"
                  style={{ background: isDark ? '#000000' : '#FFFFFF' }}
                >
                  <div
                    className="w-32 h-1 rounded-full transition-colors duration-200"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Glare Glass Reflection */}
          <div
            className="absolute inset-0 rounded-[54px] pointer-events-none z-40 overflow-hidden"
            style={{
              background: 'linear-gradient(115deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 35%, rgba(255,255,255,0) 65%, rgba(255,255,255,0.05) 100%)',
              clipPath: 'inset(0px round 54px)',
              WebkitClipPath: 'inset(0px round 54px)',
            }}
          />
        </div>
      </div>
      </div>

      {/* Live Sync Status Pill */}
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-[#8B7355]">
        <span className={cn("flex h-1.5 w-1.5 rounded-full", platformsToShow.length > 0 ? "bg-emerald-500" : "bg-amber-500")} />
        <span>
          {platformsToShow.length > 0
            ? `Pixel-perfect ${cfg?.name || previewPlatform} client preview`
            : 'Connect an account to enable live preview'}
        </span>
      </div>
    </div>
  );
}