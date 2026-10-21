'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { TemplateProps } from '@/components/profile/templates/types';
import { getTemplateById } from '@/components/profile/templates/registry';
import { motion } from 'framer-motion';
import { Menu, BadgeCheck, ArrowRight, Bookmark, Send, Quote, Github, Linkedin, Instagram, ExternalLink, Users, Link as LinkIcon, Eye } from 'lucide-react';
import { OpenToBadges } from '@/components/profile/OpenToBadges';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { ClubTemplate } from './ClubTemplate';
import { ClubTemplateV2 } from './ClubTemplateV2';
import { StudioTemplate } from './StudioTemplate';
import { SocialIcon, getSocialSvgPath, renderSocialOrIcon, normalizeSocialPlatform } from '@/components/profile/SocialBrandIcons';
export { ClubTemplate };
export { StudioTemplate };

// --- 01 INDIVIDUAL --- //

function LoverTemplate({ profile, accentColor }: any) {
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => {
      setToastVisible(false);
    }, 2200);
    setToastTimer(timer);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('hello@example.com');
    showToast('Copied: hello@example.com');
  };

  const downloadVCard = () => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${profile.name};;;;\nFN:${profile.name}\nORG:${profile.company || ''}\nTITLE:${profile.role || ''}\nURL:${typeof window !== 'undefined' ? window.location.origin : ''}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name?.replace(/\s+/g, '_') || 'Contact'}.vcf`;
    a.click();
    showToast('Contact vCard saved!');
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=IBM+Plex+Mono:wght@500;600&display=swap');

    .lover-template-container {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .lover-template-container .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }

    .lover-template-container .font-mono-tag {
      font-family: 'IBM Plex Mono', monospace;
    }

    .lover-template-container .clay-surface {
      background: #FFFDF9;
      border-radius: 26px;
      box-shadow: 
        0 8px 24px rgba(42, 23, 16, 0.08),
        0 1px 3px rgba(42, 23, 16, 0.04),
        inset 1.5px 1.5px 3px rgba(255, 255, 255, 1),
        inset -1.5px -2px 4px rgba(180, 140, 115, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.95);
    }

    .lover-template-container .clay-card {
      background: #FFFDF9;
      border-radius: 18px;
      box-shadow: 
        0 4px 14px rgba(42, 23, 16, 0.06),
        inset 1.5px 1.5px 2px rgba(255, 255, 255, 1),
        inset -1px -1px 3px rgba(180, 140, 115, 0.09);
      border: 1px solid rgba(255, 255, 255, 0.9);
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .lover-template-container .clay-card:active {
      transform: scale(0.985);
      box-shadow: inset 1.5px 1.5px 3px rgba(42, 23, 16, 0.1);
    }

    .lover-template-container .clay-btn-accent {
      background: linear-gradient(135deg, #CF5628 0%, #B34115 100%);
      color: #FFFFFF;
      min-height: 44px;
      border-radius: 9999px;
      box-shadow: 
        0 4px 14px rgba(190, 70, 25, 0.32),
        inset 1.5px 1.5px 2px rgba(255, 220, 200, 0.5),
        inset -1.5px -2px 3px rgba(0, 0, 0, 0.25);
      transition: all 0.15s ease;
    }
    .lover-template-container .clay-btn-accent:active {
      transform: scale(0.96);
    }

    .lover-template-container .accent-badge { 
      background: #F5E6DC; 
      color: #A64522; 
      border-color: #E9D1C3; 
    }
  `;

  return (
    <div className="lover-template-container bg-transparent text-[#26160F] p-4 sm:p-8 antialiased flex flex-col items-center justify-start min-h-[100dvh] w-full relative">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="w-full max-w-[400px] bg-[#FAF5F0] border border-[#2A1710]/15 rounded-[32px] p-5 shadow-xl relative flex flex-col overflow-hidden transition-all duration-300">
        
        {/* Top Status Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2A1710]/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CF5628] animate-pulse"></span>
            <span className="font-mono-tag text-xs font-bold text-[#2A1710] uppercase tracking-wider">
              {profile.role || 'PROFESSIONAL'} • {profile.company || 'INDEPENDENT'}
            </span>
          </div>
          <span className="font-mono-tag text-xs font-bold accent-badge px-2.5 py-0.5 rounded-full border">
            @{profile.subdomain || 'user'}
          </span>
        </div>

        {/* Avatar & Identity */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative mb-3">
            <div className="w-[76px] h-[76px] rounded-full p-1 bg-white shadow-md flex items-center justify-center border border-stone-200">
              <img 
                src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                alt={profile.name || 'User'} 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#2A1710] text-[#FFFDF9] flex items-center justify-center font-bold text-[10px] shadow-sm border border-white">
              ✓
            </div>
          </div>

          <h1 className="font-extrabold text-2xl text-[#2A1710] tracking-tight leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {profile.name}
          </h1>

          <p className="text-xs font-semibold text-[#CF5628] mt-1 font-mono-tag uppercase tracking-wide">
            {profile.headline}
          </p>

          {profile.bio && (
            <p className="text-xs text-stone-600 font-medium leading-relaxed mt-2.5 max-w-[320px] bg-[#FFFDF9] p-3 rounded-2xl border border-white/80 shadow-sm">
              "{profile.bio}"
            </p>
          )}
        </div>

        {/* Verified Proof Points */}
        {profile.proofs && profile.proofs.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {profile.proofs.slice(0,3).map((proof: any, i: number) => (
              <div key={i} className="clay-card p-3 flex flex-col items-center justify-center text-center">
                <span className={`text-base font-extrabold ${i === 1 ? 'text-[#CF5628]' : 'text-[#2A1710]'}`}>{proof.value}</span>
                <span className="text-[11px] text-stone-500 font-mono-tag">{proof.title || proof.type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Links */}
        {profile.links && profile.links.length > 0 && (
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#2A1710] uppercase tracking-wider font-mono-tag">
                Official Links
              </span>
              <span className="text-[11px] text-stone-500 font-medium">Verified Profiles</span>
            </div>

            {profile.links.map((link: any, i: number) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer" className="clay-card p-3.5 flex items-center justify-between no-underline block active:scale-95 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i % 3 === 0 ? 'bg-[#F6EDE8] text-[#2A1710]' : i % 3 === 1 ? 'bg-[#FAF0E6] text-[#8C4F35]' : 'bg-[#FCECE9] text-[#CF5628]'}`}>
                    <SocialIcon label={link.label} url={link.url} icon={link.icon} className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2A1710]">{link.label}</h4>
                    <p className="text-[11px] text-stone-500 truncate max-w-[150px]">{link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}</p>
                  </div>
                </div>
                <span className="text-stone-400 font-bold text-xs pr-1">↗</span>
              </a>
            ))}
          </div>
        )}

        {/* RECENT SOCIAL ACTIVITY */}
        <RecentActivitySection
          activity={profile.recentActivity}
          variant="lover"
          autoScroll={profile.autoScroll}
        />

        {/* Quick Action Bar */}
        <div className="flex items-center gap-2">
          <a
            href={profile.email ? `mailto:${profile.email}` : '#'}
            onClick={(e) => {
              if (!profile.email) {
                e.preventDefault();
                showToast('No contact email available');
              }
            }}
            className="clay-btn-accent flex-1 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
          >
            <span>✉️</span> Get in Touch
          </a>
          <button onClick={downloadVCard} className="clay-card px-4 py-2.5 text-xs font-bold text-[#2A1710] flex items-center justify-center gap-1.5 shrink-0">
            <span>💾</span> Save Contact
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#2A1710]/10 flex items-center justify-between text-[11px] text-stone-400 font-mono-tag">
          <span>{profile.subdomain}.unool.co</span>
          <span className="text-[#2A1710] font-bold">Unool</span>
        </div>

      </div>

      {/* Toast */}
      <div className={`fixed bottom-6 px-4 py-2 bg-[#2A1710] text-[#FFFDF9] text-xs font-mono-tag rounded-full shadow-2xl transition-all duration-200 z-50 ${toastVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {toastMsg}
      </div>
    </div>
  );
}

function LoneTemplate({ profile, onLinkClick }: any) {
  const rawName = (profile?.name || '').trim();
  const nameParts = rawName ? rawName.split(/\s+/) : [];
  const firstName = nameParts[0] || profile?.subdomain || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const links = profile?.links || [];
  const stats = profile?.proofs || profile?.proofPoints || [];

  const downloadVCard = () => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${profile?.name || ''};;;;\nFN:${profile?.name || ''}\nEMAIL:${profile?.email || ''}\nORG:${profile?.company || ''}\nTITLE:${profile?.role || profile?.headline || ''}\nURL:${typeof window !== 'undefined' ? window.location.origin : ''}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile?.name?.replace(/\s+/g, '_') || 'Contact'}.vcf`;
    a.click();
  };
  
  // Recent activity is handled natively via profile.recentActivity

  const getStatIcon = (index: number) => {
    if (index === 0) return <Users size={16} className="mb-2 text-[#F4EFE7]/80" />;
    if (index === 1) return <LinkIcon size={16} className="mb-2 text-[#111318]" />;
    return <Eye size={16} className="mb-2 text-[#F4EFE7]/80" />;
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'github': return Github;
      case 'linkedin': return Linkedin;
      case 'instagram': return Instagram;
      default: return ExternalLink;
    }
  };

  return (
    <div 
      className="relative min-h-[100dvh] w-full text-[#F4EFE7] overflow-hidden font-sans"
      style={{ 
        backgroundColor: '#08090C',
        backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Subtle radial glow background to prevent pure flat black, adjusted for glass visibility */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_rgba(18,61,255,0.15)_0%,_rgba(8,9,12,0)_70%)] pointer-events-none" />
      <div className="absolute bottom-0 right-[-200px] w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(244,239,231,0.03)_0%,_rgba(8,9,12,0)_60%)] pointer-events-none" />

      {/* Increased padding and gaps to enhance whitespace as a design element */}
      <div className="relative z-10 h-full w-full max-w-[420px] mx-auto px-6 py-12 flex flex-col gap-10 min-h-[100dvh]">
        
        {/* Menu Button */}
        <div className="absolute top-10 right-6 z-20">
          <button className="h-10 w-10 rounded-full border border-white/10 bg-[#111318]/50 flex items-center justify-center backdrop-blur-md transition-colors hover:bg-white/10">
            <Menu size={18} className="text-[#F4EFE7]" />
          </button>
        </div>

        {/* Top Header */}
        <header className="flex justify-between items-end relative w-full mt-4">
          <div className="flex flex-col z-10 pb-2">
            <h1 className="font-bold tracking-tight leading-[1.05]">
              <span className="text-[#F4EFE7] block font-serif font-black" style={{ fontSize: '3.2rem' }}>{firstName}</span>
              {lastName ? (
                <span className="block font-serif font-black" style={{ color: '#123DFF', fontSize: '3.2rem' }}>{lastName}</span>
              ) : null}
            </h1>
            {(profile?.role || profile?.headline) && (
              <p className="text-[#9296A0] text-[10px] tracking-[0.4em] uppercase mt-4 font-medium">
                {profile.role || profile.headline}
              </p>
            )}
          </div>
          
          <div className="relative z-10 mr-2 mb-2">
            <div 
              className="w-[100px] h-[100px] rounded-full border border-[#F4EFE7]/30 shadow-[0_0_25px_rgba(18,61,255,0.2)] relative p-1 backdrop-blur-md"
              style={{ background: 'rgba(18, 61, 255, 0.05)' }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-[#111318] flex items-center justify-center border border-[#123DFF]/20">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#101B3A] to-[#111318] flex items-center justify-center font-serif text-2xl font-bold text-[#F4EFE7]/40">
                    {firstName ? firstName.charAt(0).toUpperCase() : ''}
                  </div>
                )}
              </div>
              <div className="absolute bottom-[6px] right-[2px] h-3.5 w-3.5 bg-[#123DFF] rounded-full border-[2px] border-[#08090C] shadow-[0_0_8px_rgba(18,61,255,0.8)]" />
            </div>
          </div>
        </header>

        {/* Bio / Quote Section (LEVEL 1 GLASS) */}
        {(profile?.bio || profile?.headline) && (
          <div 
            className="rounded-[24px] overflow-hidden relative shadow-[0_12px_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]"
            style={{ 
              transform: 'skewX(-20deg)',
              background: 'linear-gradient(rgba(15, 17, 21, 0.75), rgba(15, 17, 21, 0.85)), url("https://images.unsplash.com/photo-1549880338-65dd4bc83f06?q=80&w=600&auto=format&fit=crop")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.16)'
            }}
          >
            {/* Subtle cobalt highlight on edge */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#123DFF]/40 to-transparent" />
            
            <div 
              className="p-7 py-8 flex gap-4 items-start relative z-10"
              style={{ transform: 'skewX(20deg)' }}
            >
              <Quote size={24} className="text-[#F4EFE7] shrink-0 fill-current opacity-80 mt-1" />
              <p className="text-[#F4EFE7]/90 text-[14px] leading-relaxed pr-2 font-medium">
                {profile?.bio || profile?.headline}
              </p>
            </div>
          </div>
        )}

        {/* Stats Section (LEVEL 2 GLASS) */}
        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {stats.slice(0, 3).map((stat: any, i: number) => {
              const isMiddle = i === 1;
              const isThird = i === 2;
              
              let glassBg = 'linear-gradient(rgba(20, 23, 30, 0.6), rgba(20, 23, 30, 0.8)), url("https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=600&auto=format&fit=crop")'; 
              let borderCol = 'rgba(255, 255, 255, 0.15)';
              
              if (isMiddle) {
                glassBg = 'linear-gradient(rgba(244, 239, 231, 0.85), rgba(244, 239, 231, 0.95)), url("https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=600&auto=format&fit=crop")'; 
                borderCol = 'rgba(255, 255, 255, 0.4)';
              } else if (isThird) {
                glassBg = 'linear-gradient(rgba(16, 27, 58, 0.7), rgba(16, 27, 58, 0.85)), url("https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?q=80&w=600&auto=format&fit=crop")'; 
                borderCol = 'rgba(18, 61, 255, 0.2)';
              }

              return (
                <div 
                  key={i} 
                  className={`rounded-[20px] overflow-hidden relative shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]`}
                  style={{ 
                    transform: 'skewX(-20deg)',
                    background: glassBg,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: `1px solid ${borderCol}`
                  }}
                >
                  <div 
                    className={`p-4 py-5 flex flex-col items-center justify-center text-center relative z-10 ${isMiddle ? 'text-[#111318]' : 'text-[#F4EFE7]'}`}
                    style={{ transform: 'skewX(20deg)' }}
                  >
                    {getStatIcon(i)}
                    <span className="text-[20px] font-bold font-serif leading-none tracking-wide mt-1">{stat.value}</span>
                    <span className={`text-[10px] mt-1.5 capitalize ${isMiddle ? 'text-[#111318]/70 font-medium' : 'text-[#9296A0]'}`}>
                      {stat.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Official Links Section (LEVEL 1 GLASS) */}
        {links.filter((l: any) => l.isVisible !== false).length > 0 && (
          <section className="flex flex-col gap-5 mt-2">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-[#9296A0] px-2 mb-1 font-medium">
              <span>Official Links</span>
              <div className="flex items-center gap-1.5 capitalize tracking-normal text-[#123DFF] text-[11px]">
                Verified Profiles
                <BadgeCheck size={14} className="text-[#123DFF] fill-[#123DFF] text-[#08090C]" />
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {links.filter((l: any) => l.isVisible !== false).map((link: any, i: number) => {
                const IconComponent = getIconComponent(link.icon);
                const platformKey = normalizeSocialPlatform(link.label, link.url, link.icon);
                
                let glassBg = 'linear-gradient(rgba(22, 25, 34, 0.7), rgba(22, 25, 34, 0.8)), url("https://images.unsplash.com/photo-1549880338-65dd4bc83f06?q=80&w=600&auto=format&fit=crop")';
                let iconBgStyle = 'bg-[#08090C] text-[#F4EFE7] border border-white/10';
                let textPrimary = 'text-[#F4EFE7]';
                let textSecondary = 'text-[#9296A0]';
                let arrowBg = 'bg-white/10 text-white border border-white/5';
                
                if (platformKey === 'linkedin') {
                  glassBg = 'linear-gradient(rgba(18, 61, 255, 0.2), rgba(10, 20, 50, 0.7)), url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop")'; 
                  iconBgStyle = 'bg-[#123DFF] text-white shadow-[0_0_15px_rgba(18,61,255,0.4)]';
                  arrowBg = 'bg-[#123DFF]/20 text-[#123DFF] border border-[#123DFF]/30';
                } else if (platformKey === 'instagram') {
                  glassBg = 'linear-gradient(rgba(244, 239, 231, 0.75), rgba(220, 200, 180, 0.85)), url("https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=600&auto=format&fit=crop")'; 
                  iconBgStyle = 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-[0_0_15px_rgba(220,39,67,0.3)]';
                  arrowBg = 'bg-black/10 text-black border border-black/10';
                  textPrimary = 'text-[#2A1710]';
                  textSecondary = 'text-[#2A1710]/70';
                } else if (platformKey === 'github') {
                  glassBg = 'linear-gradient(rgba(16, 27, 58, 0.5), rgba(10, 15, 30, 0.7)), url("https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=600&auto=format&fit=crop")'; 
                  iconBgStyle = 'bg-[#111318] text-[#F4EFE7] border border-white/15 shadow-[0_0_10px_rgba(0,0,0,0.5)]';
                  arrowBg = 'bg-[#111318]/50 text-white border border-white/10';
                } else if (platformKey === 'leetcode') {
                  glassBg = 'linear-gradient(rgba(30, 25, 15, 0.6), rgba(15, 12, 8, 0.8)), url("https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop")'; 
                  iconBgStyle = 'bg-[#FFA116] text-[#1A1A1A] shadow-[0_0_15px_rgba(255,161,22,0.4)]';
                  arrowBg = 'bg-[#FFA116]/20 text-[#FFA116] border border-[#FFA116]/30';
                }
                
                return (
                  <a 
                    key={link.id || i} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => {
                      if (onLinkClick) {
                        e.preventDefault();
                        onLinkClick(link);
                      }
                    }}
                    className="group rounded-[22px] overflow-hidden relative block hover:scale-[1.01] transition-transform shadow-[0_12px_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
                    style={{ 
                      transform: 'skewX(-20deg)',
                      background: glassBg,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.16)'
                    }}
                  >
                    {/* Inner highlight */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] to-transparent pointer-events-none" />
                    
                    <div 
                      className="p-4 pr-5 flex items-center gap-4 relative z-10"
                      style={{ transform: 'skewX(20deg)' }}
                    >
                      <div className={`w-[50px] h-[50px] rounded-[16px] flex items-center justify-center shrink-0 backdrop-blur-md ${iconBgStyle}`}>
                        <SocialIcon label={link.label} url={link.url} icon={link.icon} className="w-5 h-5 fill-current" />
                      </div>
                      
                      <div className={`flex-1 flex flex-col justify-center`}>
                        <h3 className={`font-semibold text-[15px] truncate max-w-[160px] tracking-wide ${textPrimary}`}>{link.label}</h3>
                        <p className={`text-[11px] truncate max-w-[160px] mt-0.5 ${textSecondary}`}>
                          {link.url.replace(/^https?:\/\//, '')}
                        </p>
                      </div>
                      
                      <div className={`h-[34px] w-[34px] rounded-full flex items-center justify-center shrink-0 ml-2 transition-transform group-hover:translate-x-1 backdrop-blur-md ${arrowBg}`}>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Activity Section */}
        <RecentActivitySection
          activity={profile.recentActivity}
          variant="lone"
          autoScroll={profile.autoScroll}
        />

        {/* Bottom Actions */}
        <div className="flex gap-4 mt-8 mb-6">
          <a 
            href={profile?.email ? `mailto:${profile.email}` : '#'}
            className="flex-[1.2] rounded-[20px] text-white overflow-hidden shadow-[0_12px_25px_rgba(18,61,255,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:opacity-90 transition-opacity relative block"
            style={{ 
              transform: 'skewX(-20deg)',
              background: 'linear-gradient(135deg, rgba(30, 80, 255, 0.95), rgba(10, 40, 200, 0.95))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(100,150,255,0.4)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#123DFF] to-transparent opacity-50 pointer-events-none" />
            <div className="p-4 flex items-center justify-between px-6 relative z-10" style={{ transform: 'skewX(20deg)' }}>
              <Send size={16} className="opacity-90" />
              <span className="font-semibold text-[13px] tracking-wide">Get in Touch</span>
              <ArrowRight size={16} />
            </div>
          </a>
          
          <button 
            onClick={downloadVCard}
            className="flex-1 rounded-[20px] text-[#F4EFE7] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-white/5 transition-colors relative"
            style={{ 
              transform: 'skewX(-20deg)',
              background: 'rgba(25, 28, 35, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
            <div className="p-4 flex items-center justify-center gap-2 relative z-10" style={{ transform: 'skewX(20deg)' }}>
              <Bookmark size={15} className="opacity-80" />
              <span className="font-semibold text-[13px] tracking-wide">Save Contact</span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <footer className="flex justify-between items-center text-[#9296A0] text-[10px] px-2 mt-auto mb-2 uppercase tracking-widest">
          <span>{profile?.subdomain ? `${profile.subdomain}.unool.co` : ''}</span>
          <span className="font-serif tracking-widest opacity-80 text-[#F4EFE7]">Unool</span>
        </footer>
      </div>
    </div>
  );
}

function EnergyTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#CCFF00';
  return (
    <div className="min-h-screen w-full bg-black text-white p-6 md:p-12 overflow-hidden" style={{ fontFamily: 'Impact, sans-serif' }}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-end">
        <div className="flex-1 space-y-4 uppercase">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-16 h-4" style={{ backgroundColor: accent, transform: 'skewX(-20deg)' }} />
             <span className="text-2xl tracking-widest opacity-80" style={{ fontFamily: 'var(--font-sans)' }}>System Active</span>
          </div>
          <h1 className="text-7xl md:text-9xl leading-none tracking-tighter" style={{ WebkitTextStroke: '2px white', color: 'transparent' }}>
            {profile.name}
          </h1>
          <h2 className="text-4xl md:text-6xl" style={{ color: accent }}>{profile.headline}</h2>
          <p className="text-lg md:text-xl font-bold tracking-widest opacity-80 max-w-lg mt-8" style={{ fontFamily: 'var(--font-sans)' }}>{profile.bio}</p>
        </div>
        
        <div className="w-full md:w-1/3 space-y-3">
          {profile.links?.map((link: any, i: number) => (
            <a key={i} href={link.url} className="group block relative w-full overflow-hidden bg-[#111] p-6 transition-all hover:pl-8 rounded-sm" style={{ borderLeft: `8px solid ${accent}`}}>
              <div className="relative z-10 flex items-center justify-between uppercase text-xl md:text-2xl tracking-wider">
                <span className="flex items-center gap-3">
                  <SocialIcon label={link.label} url={link.url} icon={link.icon} className="w-6 h-6 fill-current shrink-0" />
                  <span>{link.label}</span>
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">►</span>
              </div>
            </a>
          ))}
          <a
            href={profile.email ? `mailto:${profile.email}` : '#'}
            className="group block relative w-full overflow-hidden p-6 transition-all hover:pl-8 rounded-sm text-black font-black"
            style={{ backgroundColor: accent, borderLeft: '8px solid white' }}
          >
            <div className="relative z-10 flex justify-between uppercase text-xl md:text-2xl tracking-wider">
              <span>Get in Touch</span>
              <span className="group-hover:translate-x-1 transition-transform">✉</span>
            </div>
          </a>
          <RecentActivitySection
            activity={profile.recentActivity}
            variant="energy"
            accentColor={accent}
            autoScroll={profile.autoScroll}
          />
        </div>
      </div>
    </div>
  );
}

// --- 02 STARTUP --- //

function RebellionTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#C8102E';
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -18;
    setTilt({ x, y });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const getLinkSubtitle = (label: string) => {
    const l = label?.toLowerCase() || '';
    if (l.includes('youtube')) return 'Watch';
    if (l.includes('hackerrank') || l.includes('leetcode')) return 'Solve';
    if (l.includes('github') || l.includes('gitlab')) return 'Build';
    if (l.includes('instagram')) return 'Follow';
    if (l.includes('twitter') || l.includes('x.com')) return 'Follow';
    if (l.includes('linkedin')) return 'Connect';
    if (l.includes('discord')) return 'Join';
    if (l.includes('twitch')) return 'Stream';
    if (l.includes('telegram')) return 'Join';
    if (l.includes('tiktok')) return 'Watch';
    return 'Visit';
  };

  const getLinkIcon = (label: string, url?: string) => {
    return <SocialIcon label={label} url={url} className="w-5 h-5 fill-current" />;
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700;900&display=swap');

    /* ── RESET & ROOT ── */
    .reb-wrap *, .reb-wrap *::before, .reb-wrap *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .reb-wrap a { text-decoration: none; }

    .reb-wrap {
      --crimson:   ${accent};
      --crimson-l: color-mix(in srgb, ${accent} 70%, #fff);
      --gold:      #C9993A;
      --gold-l:    #E8C97A;
      --gold-pale: rgba(201, 153, 58, 0.18);
      --ivory:     #FEFAF3;
      --parchment: #F8F1E4;
      --parchment2:#F2E8D6;
      --blush:     #FAF0EE;
      --text:      #2C1810;
      --text-2:    #6B4C3B;
      --text-3:    #9E7B68;
      --serif:     'Playfair Display', Georgia, serif;
      --royal:     'Cinzel', 'Times New Roman', serif;
      --sans:      'Inter', -apple-system, sans-serif;
      --radius:    20px;
      --shadow-gold: 0 8px 40px rgba(201, 153, 58, 0.18);
      --shadow-crim: 0 8px 40px rgba(200, 16, 46, 0.12);

      font-family: var(--sans);
      background: #E8E0D5;
      padding: clamp(20px, 4vw, 48px);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    /* ── AMBIENT BACKGROUND ORBS ── */
    .reb-orb {
      position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
      filter: blur(60px); opacity: 0.55;
    }
    .reb-orb-1 {
      width: 500px; height: 500px; top: -100px; right: -100px;
      background: radial-gradient(circle, rgba(200,16,46,0.12), transparent 70%);
      animation: reb-drift1 18s ease-in-out infinite;
    }
    .reb-orb-2 {
      width: 600px; height: 600px; bottom: -150px; left: -100px;
      background: radial-gradient(circle, rgba(201,153,58,0.1), transparent 70%);
      animation: reb-drift2 22s ease-in-out infinite;
    }
    .reb-orb-3 {
      width: 300px; height: 300px; top: 40%; left: 30%;
      background: radial-gradient(circle, rgba(255, 220, 180, 0.2), transparent 70%);
      animation: reb-drift1 14s ease-in-out infinite reverse;
    }
    @keyframes reb-drift1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-40px) scale(1.05)} }
    @keyframes reb-drift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(1.08)} }

    /* ── MAIN FRAME ── */
    .reb-frame {
      max-width: 1280px; margin: 0 auto;
      padding: clamp(24px, 5vw, 48px);
      position: relative; z-index: 1;
      background: radial-gradient(ellipse 120% 80% at 50% 0%, #FFF8EE 0%, #FBF3E3 35%, #F6EAD5 65%, #F0E0C5 100%);
      border-radius: 32px;
      box-shadow: 0 24px 80px rgba(110, 70, 50, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(201,153,58,0.25);
      overflow: hidden;
    }

    /* ── HEADER ── */
    .reb-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 40px;
    }
    .reb-logo {
      display: inline-flex; align-items: center; gap: 10px;
      font-family: var(--royal); font-size: 0.85rem; font-weight: 600;
      letter-spacing: 3px; text-transform: uppercase;
      color: var(--gold);
      padding: 10px 22px; border: 1.5px solid rgba(201,153,58,0.4);
      border-radius: 50px;
      background: linear-gradient(135deg, rgba(255,248,235,0.9), rgba(242,232,214,0.9));
      backdrop-filter: blur(12px);
      box-shadow: 0 2px 16px rgba(201,153,58,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .reb-logo:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(201,153,58,0.2); }
    .reb-crown-icon {
      font-size: 1rem; line-height: 1;
      filter: drop-shadow(0 1px 2px rgba(201,153,58,0.5));
    }
    .reb-nav-right {
      display: flex; align-items: center; gap: 20px;
    }
    .reb-tagline {
      font-family: var(--serif); font-style: italic;
      font-size: 0.95rem; color: var(--text-3); letter-spacing: 0.3px;
    }
    .reb-year {
      font-family: var(--royal); font-size: 0.72rem; letter-spacing: 2px;
      text-transform: uppercase; color: var(--text-3);
      padding: 6px 14px; border: 1px solid rgba(110,70,50,0.15);
      border-radius: 30px;
    }

    /* ── HERO ── */
    .reb-hero {
      display: flex; flex-wrap: wrap; justify-content: center;
      gap: 20px; align-items: center; min-height: 480px;
      margin-bottom: 40px;
    }
    .reb-hero-left { 
      flex: 0 1 500px; min-width: 300px;
      padding-right: 0; 
      transform: translateY(-90px); /* Moved even further up per user request */
    }

    /* Giant Name */
    .reb-name {
      font-family: var(--serif); font-weight: 900;
      font-size: clamp(4.5rem, 11vw, 9.5rem); line-height: 0.88;
      letter-spacing: -3px; text-transform: lowercase;
      background: linear-gradient(145deg, var(--crimson) 0%, #A00020 25%, var(--gold) 55%, #E8C97A 75%, var(--crimson) 100%);
      background-size: 200% 200%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: reb-shimmer-name 6s ease-in-out infinite;
      position: relative;
    }
    @keyframes reb-shimmer-name {
      0%,100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    /* Role */
    .reb-role-row {
      display: flex; align-items: center; gap: 16px; margin: 4px 0 24px;
    }
    .reb-role-gem {
      width: 10px; height: 10px; border-radius: 50%;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      box-shadow: 0 0 10px rgba(200,16,46,0.35);
      flex-shrink: 0;
    }
    .reb-role {
      font-family: var(--serif); font-style: italic; font-weight: 500;
      font-size: clamp(1.3rem, 2.5vw, 1.8rem);
      color: var(--crimson);
    }
    .reb-bio {
      font-size: 1.05rem; line-height: 1.75; color: var(--text-2);
      max-width: 440px; font-weight: 400;
    }

    /* ── HERO RIGHT — 3D TILT CARD ── */
    .reb-card-3d-wrap {
      flex: 0 0 420px; max-width: 100%;
      perspective: 1200px; cursor: pointer; position: relative;
    }
    .reb-card-3d {
      width: 100%; aspect-ratio: 0.72;
      border-radius: 28px; position: relative; overflow: visible;
      transition: transform 0.12s ease-out;
      will-change: transform;
    }

    /* Card inner face */
    .reb-card-face {
      width: 100%; height: 100%; border-radius: 28px; overflow: hidden;
      background: linear-gradient(160deg, rgba(255,248,235,0.95) 0%, rgba(242,232,214,0.9) 60%, rgba(248,240,228,0.85) 100%);
      border: 1.5px solid rgba(201,153,58,0.3);
      box-shadow: 0 20px 80px rgba(200,16,46,0.1), 0 8px 30px rgba(201,153,58,0.12), inset 0 1px 0 rgba(255,255,255,0.7);
      backdrop-filter: blur(20px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0; padding: 40px 32px;
      position: relative;
    }

    /* Shimmer sweep on card */
    .reb-card-face::before {
      content: ""; position: absolute; inset: 0; border-radius: 28px;
      background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
      background-size: 200% 100%; background-position: -100% 0;
      animation: reb-card-shimmer 4s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes reb-card-shimmer {
      0% { background-position: -100% 0; }
      60%, 100% { background-position: 200% 0; }
    }

    /* Gold border frame accent */
    .reb-card-face::after {
      content: ""; position: absolute; inset: 10px; border-radius: 20px;
      border: 1px solid rgba(201,153,58,0.2);
      pointer-events: none;
    }

    /* Avatar ring */
    .reb-avatar-ring {
      width: 140px; height: 140px; border-radius: 50%; position: relative;
      margin-bottom: 24px; flex-shrink: 0;
    }
    .reb-avatar-ring::before {
      content: ""; position: absolute; inset: -5px; border-radius: 50%;
      background: conic-gradient(from 0deg, var(--crimson), var(--gold), #fff, var(--crimson));
      animation: reb-ring-spin 8s linear infinite;
      z-index: -1;
    }
    @keyframes reb-ring-spin { to { transform: rotate(360deg); } }
    .reb-avatar-ring::after {
      content: ""; position: absolute; inset: -8px; border-radius: 50%;
      background: conic-gradient(from 180deg, rgba(200,16,46,0.15), rgba(201,153,58,0.15), transparent, rgba(200,16,46,0.15));
      animation: reb-ring-spin 12s linear infinite reverse;
      z-index: -2;
    }
    .reb-avatar-img {
      width: 140px; height: 140px; border-radius: 50%; object-fit: cover;
      border: 3px solid rgba(255,255,255,0.8);
      box-shadow: 0 8px 24px rgba(200,16,46,0.15);
    }
    .reb-avatar-placeholder {
      width: 140px; height: 140px; border-radius: 50%;
      background: linear-gradient(145deg, rgba(200,16,46,0.08) 0%, rgba(201,153,58,0.12) 100%);
      border: 3px solid rgba(255,255,255,0.8);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--serif); font-size: 3.5rem; font-weight: 700;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }

    .reb-card-name {
      font-family: var(--royal); font-size: 1.35rem; font-weight: 700;
      letter-spacing: 2px; text-transform: uppercase; color: var(--text);
      text-align: center; margin-bottom: 6px;
    }
    .reb-card-title {
      font-family: var(--serif); font-style: italic;
      font-size: 1rem; color: var(--crimson); text-align: center;
      margin-bottom: 24px;
    }

    /* Floating stat pills on the card */
    .reb-stat-row {
      display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
    }
    .reb-stat {
      display: flex; flex-direction: column; align-items: center;
      padding: 10px 18px; border-radius: 14px;
      background: rgba(255,248,235,0.8);
      border: 1px solid rgba(201,153,58,0.25);
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 12px rgba(201,153,58,0.08);
      min-width: 72px;
      transition: transform 0.2s;
    }
    .reb-stat:hover { transform: translateY(-3px); }
    .reb-stat strong {
      font-family: var(--royal); font-size: 1.1rem; font-weight: 700;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .reb-stat span {
      font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px;
      color: var(--text-3); margin-top: 2px;
    }

    /* ── 3D FLOATING DECORATIVE ELEMENTS ── */
    /* These are positioned RELATIVE to the hero section, not the viewport */
    .reb-deco-container {
      position: absolute; inset: 0; pointer-events: none; overflow: visible; z-index: 0;
    }


    /* Floating crown — above hero card */
    .reb-float-crown {
      position: absolute; top: -36px; right: 168px;
      font-size: 2.2rem; line-height: 1;
      animation: reb-float-crown 6s ease-in-out infinite;
      filter: drop-shadow(0 4px 12px rgba(201,153,58,0.45));
    }
    @keyframes reb-float-crown { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.05)} }

    /* Floating sparkle star — left mid */
    .reb-sparkle {
      position: absolute;
      animation: reb-twinkle 2.5s ease-in-out infinite;
      font-style: normal;
    }
    .reb-sparkle-1 { top: 15%; left: 46%; font-size: 1.1rem; color: var(--gold); animation-delay: 0s; }
    .reb-sparkle-2 { bottom: 18%; left: 48%; font-size: 0.75rem; color: var(--crimson); opacity: 0.6; animation-delay: 1.2s; }
    @keyframes reb-twinkle { 0%,100%{opacity:0.3; transform:scale(0.7) rotate(0deg)} 50%{opacity:1; transform:scale(1.2) rotate(15deg)} }

    /* Floating orb small — top left corner */
    .reb-float-orb {
      position: absolute; border-radius: 50%;
      background: radial-gradient(circle, var(--gold-pale) 0%, transparent 70%);
      animation: reb-pulse-orb 5s ease-in-out infinite;
    }
    .reb-float-orb-a { width: 80px; height: 80px; top: 5%; left: 2%; animation-delay: 0s; }
    .reb-float-orb-b { width: 48px; height: 48px; bottom: 12%; right: 36%; animation-delay: 2s; }
    @keyframes reb-pulse-orb { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.25);opacity:1} }



    /* ── MARQUEE RIBBON ── */
    .reb-ribbon-wrap {
      margin: 52px 0; overflow: hidden; position: relative;
    }
    .reb-ribbon {
      padding: 20px 0;
      background: linear-gradient(90deg,
        rgba(200,16,46,0.04) 0%,
        rgba(201,153,58,0.1) 25%,
        rgba(200,16,46,0.07) 50%,
        rgba(201,153,58,0.1) 75%,
        rgba(200,16,46,0.04) 100%);
      border-top: 1px solid rgba(201,153,58,0.2);
      border-bottom: 1px solid rgba(201,153,58,0.2);
      white-space: nowrap; overflow: hidden;
    }
    .reb-ribbon-track {
      display: inline-block;
      animation: reb-marquee 28s linear infinite;
      font-family: var(--royal); font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
      font-size: clamp(0.9rem, 1.5vw, 1.15rem); color: var(--crimson);
    }
    .reb-ribbon-track span { padding: 0 24px; }
    .reb-ribbon-sep { color: var(--gold); font-style: normal; opacity: 0.7; }
    @keyframes reb-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

    /* ── LINK CARDS ── */
    .reb-section-label {
      display: flex; align-items: center; gap: 16px; margin-bottom: 28px;
    }
    .reb-section-label h2 {
      font-family: var(--royal); font-size: 0.8rem; letter-spacing: 4px;
      text-transform: uppercase; color: var(--text-3); font-weight: 400;
    }
    .reb-section-label::after {
      content: ""; flex: 1; height: 1px;
      background: linear-gradient(90deg, rgba(201,153,58,0.3), transparent);
    }

    .reb-links-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 18px;
      perspective: 1200px;
    }
    .reb-link-card {
      display: block; position: relative; overflow: hidden;
      padding: 28px 24px 24px;
      border-radius: 22px;
      background: linear-gradient(145deg, rgba(255,252,246,0.95) 0%, rgba(248,240,226,0.9) 100%);
      border: 1.5px solid rgba(201,153,58,0.2);
      color: var(--text); text-decoration: none;
      transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s, border-color 0.4s;
      box-shadow: 0 4px 20px rgba(201,153,58,0.06);
      transform-style: preserve-3d;
    }
    .reb-link-card::before {
      /* shimmer sweep */
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.5) 50%, transparent 65%);
      background-size: 200% 100%; background-position: -100% 0;
      transition: background-position 0.6s;
    }
    .reb-link-card:hover::before { background-position: 150% 0; }
    .reb-link-card:hover {
      transform: translateY(-8px) scale(1.03) rotateX(8deg) rotateY(-4deg);
      box-shadow: 0 24px 48px rgba(200,16,46,0.15), 0 12px 24px rgba(201,153,58,0.2);
      border-color: rgba(201,153,58,0.45);
    }
    /* Colored top accent line */
    .reb-link-card::after {
      content: ""; position: absolute; top: 0; left: 20px; right: 20px; height: 2px;
      background: linear-gradient(90deg, var(--crimson), var(--gold));
      border-radius: 0 0 4px 4px;
      opacity: 0; transition: opacity 0.3s;
    }
    .reb-link-card:hover::after { opacity: 1; }

    .reb-link-icon-wrap {
      width: 44px; height: 44px; border-radius: 14px; margin-bottom: 16px;
      background: linear-gradient(135deg, rgba(200,16,46,0.08), rgba(201,153,58,0.1));
      border: 1px solid rgba(201,153,58,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 700; color: var(--crimson);
      font-family: var(--royal);
      transition: background 0.3s, transform 0.3s;
      transform: translateZ(25px);
    }
    .reb-link-card:hover .reb-link-icon-wrap {
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      color: #fff; transform: scale(1.1) rotate(-4deg) translateZ(30px);
    }
    .reb-link-title {
      font-family: var(--serif); font-size: 1.45rem; font-weight: 700;
      color: var(--text); margin-bottom: 4px; line-height: 1.2;
      transform: translateZ(20px);
    }
    .reb-link-sub {
      font-size: 0.82rem; color: var(--text-3); font-weight: 500;
      text-transform: uppercase; letter-spacing: 1px;
      transform: translateZ(15px);
    }
    .reb-link-arrow {
      position: absolute; bottom: 22px; right: 22px;
      width: 30px; height: 30px; border-radius: 50%;
      border: 1.5px solid rgba(201,153,58,0.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; color: var(--text-3);
      transition: all 0.3s;
      transform: translateZ(20px);
    }
    .reb-link-card:hover .reb-link-arrow {
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      border-color: transparent; color: #fff;
      transform: rotate(45deg) translateZ(25px);
    }

    /* ── CTA SECTION ── */
    .reb-cta-section {
      margin-top: 64px; padding: 60px;
      border-radius: 32px; position: relative; overflow: hidden;
      background: linear-gradient(135deg,
        rgba(200,16,46,0.06) 0%,
        rgba(248,240,226,0.8) 30%,
        rgba(201,153,58,0.08) 60%,
        rgba(248,240,226,0.9) 100%);
      border: 1.5px solid rgba(201,153,58,0.25);
      box-shadow: 0 8px 60px rgba(200,16,46,0.06), inset 0 1px 0 rgba(255,255,255,0.7);
    }
    /* Decorative corner crests */
    .reb-cta-crest {
      position: absolute; font-size: 5rem; line-height: 1; opacity: 0.04;
      pointer-events: none; font-family: var(--serif); color: var(--crimson);
    }
    .reb-cta-crest-tl { top: -10px; left: 20px; }
    .reb-cta-crest-br { bottom: -10px; right: 20px; transform: rotate(180deg); }

    .reb-cta-inner {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 32px; position: relative; z-index: 1;
    }
    .reb-cta-left h2 {
      font-family: var(--serif); font-weight: 900; font-style: italic;
      font-size: clamp(2rem, 4vw, 3.2rem); line-height: 1.1;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      margin-bottom: 12px;
    }
    .reb-cta-left p {
      color: var(--text-2); font-size: 1rem; max-width: 380px;
    }
    .reb-cta-btn {
      display: inline-flex; align-items: center; gap: 14px;
      padding: 18px 40px; border-radius: 50px;
      background: linear-gradient(135deg, var(--crimson) 0%, #A00020 50%, #8A001A 100%);
      color: #fff; font-family: var(--royal); font-weight: 600;
      font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase;
      box-shadow: 0 8px 32px rgba(200,16,46,0.3), 0 2px 8px rgba(200,16,46,0.2), inset 0 1px 0 rgba(255,255,255,0.15);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
      position: relative; overflow: hidden;
    }
    .reb-cta-btn::before {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
      background-size: 200% 100%; background-position: -100% 0;
      transition: background-position 0.5s;
    }
    .reb-cta-btn:hover::before { background-position: 150% 0; }
    .reb-cta-btn:hover {
      transform: translateY(-4px) scale(1.03);
      box-shadow: 0 16px 48px rgba(200,16,46,0.38), 0 4px 16px rgba(200,16,46,0.2);
    }
    .reb-cta-btn-icon { font-size: 1.1rem; transition: transform 0.3s; }
    .reb-cta-btn:hover .reb-cta-btn-icon { transform: translateX(4px); }

    /* Gold secondary button */
    .reb-cta-btn-sec {
      display: inline-flex; align-items: center; gap: 12px;
      padding: 18px 36px; border-radius: 50px;
      background: transparent; color: var(--gold);
      font-family: var(--royal); font-weight: 600; font-size: 0.9rem;
      letter-spacing: 2px; text-transform: uppercase;
      border: 1.5px solid rgba(201,153,58,0.45);
      transition: all 0.3s;
    }
    .reb-cta-btn-sec:hover {
      background: rgba(201,153,58,0.08);
      border-color: var(--gold); transform: translateY(-3px);
    }
    .reb-cta-buttons { display: flex; flex-wrap: wrap; gap: 14px; }

    /* ── FOOTER LINE ── */
    .reb-footer {
      margin-top: 48px; padding-top: 24px;
      border-top: 1px solid rgba(201,153,58,0.2);
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 16px;
    }
    .reb-footer-brand {
      font-family: var(--royal); font-size: 0.72rem; letter-spacing: 3px;
      text-transform: uppercase; color: var(--text-3);
    }
    .reb-footer-dots {
      display: flex; gap: 8px; align-items: center;
    }
    .reb-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      animation: reb-dot-pulse 2.5s ease-in-out infinite;
    }
    .reb-dot:nth-child(2) { animation-delay: 0.4s; opacity: 0.6; }
    .reb-dot:nth-child(3) { animation-delay: 0.8s; opacity: 0.35; }
    @keyframes reb-dot-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.5)} }

    /* ── RESPONSIVE ── */
    @media (max-width: 1024px) {
      .reb-hero { flex-direction: column; gap: 40px; text-align: center; }
      .reb-hero-left { padding-right: 0; margin-bottom: 24px; display: flex; flex-direction: column; align-items: center; order: 2; transform: none; }
      .reb-bio { text-align: center; margin: 0 auto; }
      .reb-card-3d-wrap { max-width: 380px; margin: 0 auto; width: 100%; order: 1; }
      .reb-float-crown, .reb-sparkle, .reb-float-orb { display: none; }
    }
    @media (max-width: 640px) {
      .reb-wrap { padding: 36px 16px; }
      .reb-frame { padding: 24px 20px; border-radius: 24px; }
      .reb-header { flex-direction: column; gap: 20px; margin-bottom: 40px; }
      .reb-nav-right { gap: 10px; width: 100%; justify-content: center; }
      .reb-year { display: none; }
      .reb-name { font-size: clamp(3.2rem, 12vw, 4.5rem); line-height: 0.95; }
      .reb-role-row { flex-wrap: wrap; justify-content: center; margin: 8px 0 20px; }
      .reb-role { font-size: 1.2rem; text-align: center; }
      .reb-card-3d { aspect-ratio: auto; min-height: 400px; }
      .reb-card-face { padding: 32px 20px; }
      .reb-stat-row { gap: 8px; }
      .reb-links-grid { grid-template-columns: 1fr; } /* Stack links fully on mobile */
      .reb-link-card { padding: 24px 20px 20px; }
      .reb-cta-section { padding: 40px 24px; text-align: center; }
      .reb-cta-inner { flex-direction: column; align-items: center; gap: 24px; }
      .reb-cta-left p { text-align: center; margin: 0 auto; }
      .reb-cta-buttons { justify-content: center; width: 100%; flex-direction: column; }
      .reb-cta-btn, .reb-cta-btn-sec { width: 100%; justify-content: center; }
      .reb-footer { flex-direction: column; text-align: center; gap: 20px; }
    }
  `;

  return (
    <div className="reb-wrap">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="reb-frame">

        {/* Ambient background orbs (moved inside frame so they are contained) */}
        <div className="reb-orb reb-orb-1" />
        <div className="reb-orb reb-orb-2" />
        <div className="reb-orb reb-orb-3" />

        {/* ── HEADER ── */}
        <header className="reb-header">
          <a className="reb-logo" href="#top">
            <span className="reb-crown-icon">♛</span>
            The Rebellion
          </a>
          <div className="reb-nav-right">
            <span className="reb-tagline">We challenge the industry.</span>
            <span className="reb-year">Est. 2026</span>
          </div>
        </header>

        {/* ── HERO ── */}
        <section
          id="top"
          className="reb-hero"
          style={{ position: 'relative' }}
        >
          {/* Decorative floating elements — absolutely positioned within hero */}
          <div className="reb-deco-container" aria-hidden="true">
            {/* Floating crown above arch */}
            <div className="reb-float-crown">♛</div>
            {/* Sparkle stars */}
            <span className="reb-sparkle reb-sparkle-1">✦</span>
            <span className="reb-sparkle reb-sparkle-2">✦</span>
            {/* Ambient orbs */}
            <div className="reb-float-orb reb-float-orb-a" />
            <div className="reb-float-orb reb-float-orb-b" />

          </div>

          {/* LEFT — Text content */}
          <div className="reb-hero-left">
            <h1 className="reb-name">{profile.name}</h1>
            <div className="reb-role-row">
              <div className="reb-role-gem" />
              <span className="reb-role">{profile.headline}</span>
            </div>
            <p className="reb-bio">{profile.bio}</p>
          </div>

          {/* RIGHT — 3D Tilt Card */}
          <div
            className="reb-card-3d-wrap"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={cardRef}
          >
            <div
              className="reb-card-3d"
              style={{ transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}
            >
              <div className="reb-card-face">
                {/* Avatar */}
                <div className="reb-avatar-ring">
                  {profile.avatarUrl ? (
                    <img className="reb-avatar-img" src={profile.avatarUrl} alt={profile.name} />
                  ) : (
                    <div className="reb-avatar-placeholder">{profile.name?.[0] || 'R'}</div>
                  )}
                </div>

                <div className="reb-card-name">{profile.name}</div>
                <div className="reb-card-title">{profile.headline}</div>

                {/* Stat bubbles — uses user's actual proof points */}
                {profile.proofs && profile.proofs.length > 0 ? (
                  <div className="reb-stat-row">
                    {profile.proofs.slice(0, 3).map((proof: any, i: number) => (
                      <div key={i} className="reb-stat">
                        <strong>{proof.value}</strong>
                        <span>{proof.title || proof.type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="reb-stat-row">
                    {profile.role && (
                      <div className="reb-stat">
                        <strong>{profile.role}</strong>
                        <span>Role</span>
                      </div>
                    )}
                    {profile.company && (
                      <div className="reb-stat">
                        <strong>{profile.company}</strong>
                        <span>Company</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE RIBBON ── */}
        <div className="reb-ribbon-wrap">
          <div className="reb-ribbon">
            <div className="reb-ribbon-track">
              <span>Crowned in Defiance</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Architects of the New Reign</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Forging Empires from Echoes</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Sovereignty in Motion</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>The Throne of Innovation</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Crowned in Defiance</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Architects of the New Reign</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Forging Empires from Echoes</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Sovereignty in Motion</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>The Throne of Innovation</span><span className="reb-ribbon-sep"> ✦ </span>
            </div>
          </div>
        </div>

        {/* ── LINKS ── */}
        {profile.links && profile.links.length > 0 && (
          <>
            <div className="reb-section-label">
              <h2>Connect &amp; Explore</h2>
            </div>

            <nav className="reb-links-grid">
              {profile.links.map((link: any, i: number) => (
                <a
                  key={i}
                  className="reb-link-card"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="reb-link-icon-wrap">
                    {getLinkIcon(link.label || link.platform, link.url)}
                  </div>
                  <div className="reb-link-title">{link.label || link.platform}</div>
                  <div className="reb-link-sub">{getLinkSubtitle(link.label || link.platform)}</div>
                  <div className="reb-link-arrow">↗</div>
                </a>
              ))}
            </nav>
          </>
        )}

        {/* ── BIO SECTION (when no links, fill space with bio) ── */}
        {(!profile.links || profile.links.length === 0) && profile.bio && (
          <>
            <div className="reb-section-label">
              <h2>About</h2>
            </div>
            <div style={{
              padding: '32px',
              borderRadius: '22px',
              background: 'linear-gradient(145deg, rgba(255,252,246,0.95), rgba(248,240,226,0.9))',
              border: '1.5px solid rgba(201,153,58,0.2)',
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: '1.15rem',
              lineHeight: '1.9',
              color: 'var(--text-2)',
              maxWidth: '640px',
            }}>
              "{profile.bio}"
            </div>
          </>
        )}

        <RecentActivitySection
          activity={profile.recentActivity}
          variant="rebellion"
          accentColor={accent}
          autoScroll={profile.autoScroll}
        />

        {/* ── CTA SECTION ── */}
        {(profile.links?.length > 0 || profile.email) && (
          <section className="reb-cta-section">
            <span className="reb-cta-crest reb-cta-crest-tl">♛</span>
            <span className="reb-cta-crest reb-cta-crest-br">♛</span>
            <div className="reb-cta-inner">
              <div className="reb-cta-left">
                <h2>Start Something Extraordinary.</h2>
                <p>Join the rebellion — challenge convention, redefine the rules, and build something that matters.</p>
              </div>
              <div className="reb-cta-buttons">
                <a
                  className="reb-cta-btn"
                  href={profile.email ? `mailto:${profile.email}` : (profile.links?.[0]?.url || '#')}
                >
                  Get in Touch — Work with {profile.name?.split(' ')[0] || 'Us'}
                  <span className="reb-cta-btn-icon">→</span>
                </a>
                {profile.links?.[0] && profile.email && (
                  <a className="reb-cta-btn-sec" href={profile.links[0].url} target="_blank" rel="noopener noreferrer">
                    ♛ &nbsp;Follow
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER ── */}
        <footer className="reb-footer">
          <span className="reb-footer-brand">The Rebellion · {profile.name} · 2026</span>
          <div className="reb-footer-dots">
            <div className="reb-dot" />
            <div className="reb-dot" />
            <div className="reb-dot" />
          </div>
        </footer>

      </div>
    </div>
  );
}


function VisionTemplate({ profile }: any) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouse({ x, y });
  };

  const handleMouseLeave = () => {
    setMouse({ x: 0, y: 0 });
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');

    .vision-wrap {
      --color1: #FF007A; /* Neon Pink */
      --color1-rgb: 255, 0, 122;
      --color2: #7928CA; /* Electric Purple */
      --color2-rgb: 121, 40, 202;
      --bg: #FAFAFC;
      
      font-family: 'Rajdhani', sans-serif;
      background: var(--bg);
      
      /* Holographic mesh background */
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(var(--color1-rgb), 0.12) 0%, transparent 60%),
        radial-gradient(circle at 90% 80%, rgba(var(--color2-rgb), 0.15) 0%, transparent 60%);
      color: #1a1a2e;
      min-height: 100vh;
      overflow: hidden;
      position: relative;
      perspective: 1200px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }

    /* Subdued grid */
    .vision-grid {
      position: absolute;
      width: 200vw; height: 200vh;
      top: -50%; left: -50%;
      background-image: 
        radial-gradient(rgba(var(--blue-rgb), 0.05) 2px, transparent 2px);
      background-size: 40px 40px;
      animation: vision-grid-move 60s linear infinite;
      z-index: 0;
      pointer-events: none;
      opacity: 0.8;
    }
    @keyframes vision-grid-move {
      0% { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(100px) rotate(5deg); }
    }

    /* Ambient Glows */
    .vision-glow {
      position: absolute;
      width: 700px; height: 700px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(var(--color1-rgb), 0.35) 0%, rgba(var(--color2-rgb), 0.15) 50%, transparent 70%);
      opacity: 0.3;
      filter: blur(90px);
      z-index: 0;
      pointer-events: none;
      transition: transform 0.4s ease-out;
    }

    /* Main Container */
    .vision-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1100px;
      transform-style: preserve-3d;
      transition: transform 0.2s ease-out;
    }

    /* Holographic UI Card */
    .vision-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 28px;
      padding: 60px;
      box-shadow: 
        0 30px 60px rgba(0, 0, 0, 0.03),
        inset 0 0 0 1px rgba(255, 255, 255, 0.8),
        inset 0 0 20px rgba(255, 255, 255, 0.5);
      transform-style: preserve-3d;
      position: relative;
      overflow: hidden;
    }

    /* Iridescent Foil Shimmer Effect */
    .vision-card::before {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(115deg, 
        transparent 20%, 
        rgba(var(--color1-rgb), 0.15) 30%, 
        rgba(255, 255, 255, 0.6) 40%, 
        rgba(var(--color2-rgb), 0.15) 50%, 
        transparent 60%
      );
      background-size: 300% 300%;
      animation: holo-shimmer 7s ease-in-out infinite alternate;
      pointer-events: none;
      z-index: 2;
      mix-blend-mode: color-dodge;
    }
    @keyframes holo-shimmer {
      0% { background-position: 100% 100%; }
      100% { background-position: 0% 0%; }
    }

    /* Tech Accents - Softened to small dots */
    .vision-corner {
      position: absolute;
      width: 8px; height: 8px;
      background: var(--color1);
      border-radius: 50%;
      opacity: 0.3;
      z-index: 3;
    }
    .vision-corner-tl { top: 30px; left: 30px; }
    .vision-corner-tr { top: 30px; right: 30px; }
    .vision-corner-bl { bottom: 30px; left: 30px; }
    .vision-corner-br { bottom: 30px; right: 30px; }

    /* Layout inside card */
    .vision-inner {
      display: flex;
      gap: 60px;
      transform: translateZ(40px);
      transform-style: preserve-3d;
      position: relative;
      z-index: 10;
    }
    @media (max-width: 860px) {
      .vision-inner { flex-direction: column; text-align: center; gap: 40px; }
      .vision-card { padding: 40px 24px; border-radius: 32px; }
      .vision-avatar-wrap { margin: 0 auto; }
    }

    /* Fluid Avatar Rings */
    .vision-avatar-wrap {
      position: relative;
      width: 180px; height: 180px;
      flex-shrink: 0;
      transform-style: preserve-3d;
      transform: translateZ(60px);
    }
    .vision-avatar {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #fff;
      box-shadow: 
        0 15px 35px rgba(var(--color1-rgb), 0.2),
        inset 0 0 0 2px rgba(var(--color2-rgb), 0.1);
      position: relative;
      z-index: 5;
    }
    .vision-ring {
      position: absolute;
      inset: -15px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent, rgba(var(--color1-rgb), 0.25), transparent);
      animation: vision-spin-ring 8s linear infinite;
      z-index: -1;
      filter: blur(4px);
    }
    .vision-ring-2 {
      position: absolute;
      inset: -30px;
      border-radius: 50%;
      background: conic-gradient(from 180deg, transparent, rgba(var(--color2-rgb), 0.2), transparent);
      animation: vision-spin-ring 12s linear infinite reverse;
      z-index: -2;
      filter: blur(6px);
    }
    .vision-ring-3 { display: none; }
    @keyframes vision-spin-ring {
      to { transform: rotate(360deg); }
    }

    /* Text */
    .vision-content {
      flex: 1;
      transform-style: preserve-3d;
    }
    .vision-name {
      font-family: 'Orbitron', sans-serif;
      font-size: clamp(2.5rem, 5vw, 4.8rem);
      font-weight: 900;
      letter-spacing: -1px;
      text-transform: uppercase;
      background: linear-gradient(135deg, var(--color2), var(--color1));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
      transform: translateZ(50px);
      line-height: 1.1;
    }
    .vision-role {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--color2);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 24px;
      display: inline-block;
      padding: 8px 24px;
      background: rgba(255,255,255,0.4);
      backdrop-filter: blur(4px);
      border-radius: 30px;
      border: 1px solid rgba(255,255,255,0.6);
      box-shadow: 0 8px 20px -5px rgba(var(--color2-rgb), 0.1);
      transform: translateZ(40px);
    }
    .vision-bio {
      font-size: 1.15rem;
      line-height: 1.8;
      color: #555577;
      max-width: 600px;
      font-weight: 500;
      transform: translateZ(30px);
    }

    /* Data Points - Clean Pills */
    .vision-data {
      display: flex;
      gap: 16px;
      margin-top: 40px;
      transform: translateZ(35px);
      flex-wrap: wrap;
    }
    .vision-data-box {
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      padding: 16px 24px;
      border-radius: 12px;
      min-width: 140px;
      position: relative;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
      box-shadow: 
        0 10px 25px -5px rgba(var(--color2-rgb), 0.05),
        inset 0 4px 10px rgba(255, 255, 255, 1);
    }
    .vision-data-box:hover {
      box-shadow: 
        0 20px 40px -10px rgba(var(--color1-rgb), 0.15),
        inset 0 4px 10px rgba(255, 255, 255, 1);
      transform: translateY(-8px) scale(1.02);
      border-color: rgba(var(--color1-rgb), 0.4);
    }
    .vision-data-val {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.8rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--color2), var(--color1));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .vision-data-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--color1);
      opacity: 0.9;
      margin-top: 6px;
      font-weight: 700;
    }
    .vision-data-box::before { display: none; } /* Removed old scanning line */

    /* Links Grid - Soft UI */
    .vision-links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
      margin-top: 50px;
      transform: translateZ(45px);
    }
    .vision-link {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2));
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 12px;
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #1a1a2e;
      font-family: 'Orbitron', sans-serif;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-decoration: none;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 
        0 8px 20px -4px rgba(var(--color2-rgb), 0.05),
        inset 0 3px 8px rgba(255, 255, 255, 1);
    }
    .vision-link:hover {
      background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4));
      transform: translateY(-5px);
      box-shadow: 
        0 15px 30px -8px rgba(var(--color1-rgb), 0.2),
        inset 0 3px 8px rgba(255, 255, 255, 1);
      color: var(--color2);
      border-color: rgba(var(--color2-rgb), 0.5);
    }
    .vision-link::after {
      content: ""; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
      transition: left 0.6s ease;
      mix-blend-mode: overlay;
    }
    .vision-link:hover::after {
      left: 100%;
    }
    .vision-link-arrow {
      color: var(--color1);
      font-size: 1.4rem;
      transition: transform 0.3s;
    }
    .vision-link:hover .vision-link-arrow {
      transform: translateX(5px) scale(1.1);
    }

    .vision-conversation-btn {
      display: inline-block;
      margin-top: 30px;
      padding: 16px 36px;
      background: linear-gradient(135deg, var(--color1), var(--color2));
      color: #fff;
      font-family: 'Orbitron', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-radius: 50px;
      text-decoration: none;
      box-shadow: 0 10px 30px rgba(var(--color1-rgb), 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .vision-conversation-btn:hover {
      transform: translateY(-5px) scale(1.02);
      box-shadow: 0 20px 40px rgba(var(--color2-rgb), 0.4);
    }

    /* Floating Holographic Geometric shapes */
    .vision-float-shape {
      position: absolute;
      transform-style: preserve-3d;
      pointer-events: none;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(var(--color1-rgb),0.15), rgba(var(--color2-rgb),0.15));
      box-shadow: 
        0 10px 30px rgba(var(--color1-rgb),0.1),
        inset 0 5px 15px rgba(255,255,255,1);
      backdrop-filter: blur(10px) saturate(150%);
    }
    .v-shape-1 {
      top: -40px; right: -20px;
      width: 100px; height: 100px;
      border: 2px solid rgba(var(--color1-rgb), 0.4);
      border-radius: 20px;
      animation: vision-spin-3d 15s ease-in-out infinite alternate;
    }
    .v-shape-2 {
      bottom: -40px; left: -20px;
      width: 80px; height: 80px;
      border: 2px dashed rgba(var(--color2-rgb), 0.5);
      animation: vision-spin-3d 20s ease-in-out infinite alternate-reverse;
    }
    @keyframes vision-spin-3d {
      0% { transform: translateY(0) scale(1) rotate(0deg); }
      100% { transform: translateY(-20px) scale(1.05) rotate(30deg); }
    }

    /* Scanning line */
    .vision-scanline { display: none; }
  `;

  return (
    <div 
      className="vision-wrap" 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      <div className="vision-grid" />
      <div 
        className="vision-glow" 
        style={{ transform: `translate(${mouse.x * 200}px, ${mouse.y * 200}px)` }} 
      />

      <div 
        className="vision-container"
        style={{ 
          transform: `rotateY(${mouse.x * 12}deg) rotateX(${mouse.y * -12}deg)` 
        }}
      >
        <div className="vision-float-shape v-shape-1" />
        <div className="vision-float-shape v-shape-2" />
        
        <div className="vision-card">
          <div className="vision-scanline" />
          <div className="vision-corner vision-corner-tl" />
          <div className="vision-corner vision-corner-tr" />
          <div className="vision-corner vision-corner-bl" />
          <div className="vision-corner vision-corner-br" />

          <div className="vision-inner">
            {/* 3D Avatar */}
            <div className="vision-avatar-wrap">
              <div className="vision-ring" />
              <div className="vision-ring-2" />
              <div className="vision-ring-3" />
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="vision-avatar" />
              ) : (
                <div className="vision-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: '#FF3366', background: 'rgba(255,51,102,0.1)', fontFamily: 'Orbitron' }}>
                  {profile.name?.charAt(0) || 'V'}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="vision-content">
              <h1 className="vision-name">{profile.name}</h1>
              <div className="vision-role">{profile.headline}</div>
              <p className="vision-bio">{profile.bio}</p>

              {/* Get in Touch CTA */}
              <a 
                href={profile.email ? `mailto:${profile.email}` : '#'}
                className="vision-conversation-btn"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}
              >
                <span>✉</span> Get in Touch
              </a>

              {/* Conversation Button */}
              {(profile.theme as any)?.conversationUrl && (
                <a 
                  href={(profile.theme as any).conversationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vision-conversation-btn"
                >
                  Start a Conversation
                </a>
              )}

              {/* Dynamic Stats/Proofs */}
              {profile.proofs && profile.proofs.length > 0 ? (
                <div className="vision-data">
                  {profile.proofs.slice(0, 3).map((proof: any, i: number) => (
                    <div key={i} className="vision-data-box">
                      <div className="vision-data-val">{proof.value}</div>
                      <div className="vision-data-label">{proof.title || proof.type}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="vision-data">
                  {profile.role && (
                    <div className="vision-data-box">
                      <div className="vision-data-val">ROLE</div>
                      <div className="vision-data-label">{profile.role}</div>
                    </div>
                  )}
                  {profile.company && (
                    <div className="vision-data-box">
                      <div className="vision-data-val">ORG</div>
                      <div className="vision-data-label">{profile.company}</div>
                    </div>
                  )}
                  {profile.location && (
                    <div className="vision-data-box">
                      <div className="vision-data-val">LOC</div>
                      <div className="vision-data-label">{profile.location}</div>
                    </div>
                  )}
                </div>
              )}

              <RecentActivitySection
                activity={profile.recentActivity}
                variant="vision"
                autoScroll={profile.autoScroll}
              />

              {/* Links */}
              {profile.links && profile.links.length > 0 && (
                <div className="vision-links">
                  {profile.links.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer" className="vision-link flex items-center justify-between">
                      <span className="flex items-center gap-2.5">
                        <SocialIcon label={link.label} url={link.url} icon={link.icon} className="w-4 h-4 fill-current shrink-0" />
                        <span>{link.label}</span>
                      </span>
                      <span className="vision-link-arrow">↗</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 02 HUMAN --- //

function HumanTemplate({ profile, accentColor }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => setToastVisible(false), 2200);
    setToastTimer(timer);
  };

  const handleContact = () => {
    if (profile.email) {
      window.location.href = `mailto:${profile.email}`;
    } else {
      showToast('Contact email not available.');
    }
  };

  const downloadVCard = () => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${profile.name || ''};;;;\nFN:${profile.name || ''}\nORG:${profile.company || ''}\nTITLE:${profile.role || profile.headline || ''}\nURL:${typeof window !== 'undefined' ? window.location.origin : ''}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name?.replace(/\s+/g, '_') || 'Contact'}.vcf`;
    a.click();
    showToast('Contact saved!');
  };

  const getIcon = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'github': return <Github size={20} />;
      case 'linkedin': return <Linkedin size={20} />;
      case 'instagram': return <Instagram size={20} />;
      default: return <ExternalLink size={20} />;
    }
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

    .human-theme {
      font-family: 'DM Sans', sans-serif;
      background-color: #123040;
      color: #F4EDDC;
    }
    .human-theme .font-serif {
      font-family: 'Playfair Display', serif;
    }
    
    .human-texture {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 50;
      opacity: 0.05;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    }

    .human-blob-bg-1 {
      position: absolute;
      top: -10%; left: -10%;
      width: 70vw; height: 70vw;
      max-width: 800px; max-height: 800px;
      background-color: #E2B746;
      border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%;
      opacity: 0.05;
      pointer-events: none;
      z-index: 0;
    }

    .human-img-mask {
      border-radius: 42% 58% 35% 65% / 55% 45% 60% 40%;
    }

    .human-img-bg {
      border-radius: 50% 50% 45% 55% / 40% 60% 45% 55%;
      background-color: #E2B746;
    }
    
    .human-bio-surface {
      background-color: #EFE4CC;
      border-radius: 40px 100px 40px 100px / 80px 40px 80px 40px;
    }

    .human-metric-1 {
      background-color: #E2B746;
      color: #1B1D1B;
      border-radius: 30px 40px 30px 40px / 40px 30px 40px 30px;
    }
    .human-metric-2 {
      background-color: #A5AE89;
      color: #1B1D1B;
      border-radius: 40px 30px 40px 30px / 30px 40px 30px 40px;
    }
    .human-metric-3 {
      background-color: #BE5B42;
      color: #F4EDDC;
      border-radius: 35px 35px 35px 35px / 45px 45px 25px 25px;
    }
    
    .human-social-link {
      border-radius: 30px 12px 30px 12px / 20px 30px 20px 30px;
      transition: all 0.25s ease;
    }
    .human-social-link:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
      border-radius: 16px 24px 16px 24px / 24px 16px 24px 16px;
    }
    .human-social-link:active {
      transform: translateY(1px);
    }
    
    .human-footer-shape-1 {
      border-radius: 140px 20px 0 0 / 100px 40px 0 0;
    }
    .human-footer-shape-2 {
      border-radius: 40px 140px 0 0 / 20px 100px 0 0;
    }
    .human-footer-shape-3 {
      border-radius: 50% 50% 0 0 / 100px 100px 0 0;
    }
  `;

  return (
    <div className="w-full min-h-[100dvh] flex flex-col items-center justify-start bg-[#0a161e] p-[clamp(24px,6vw,64px)]">
      <div 
        className="human-theme w-full relative flex-1 max-w-[1440px] overflow-hidden antialiased flex flex-col shadow-2xl"
        style={{ borderRadius: 'clamp(24px, 5vw, 48px)' }}
      >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="human-texture" />
      <div className="human-blob-bg-1" />

      {/* Navigation & Header */}
      <nav className="relative z-20 w-full p-8 md:p-12 flex justify-between items-start max-w-[1400px] mx-auto">
        <div className="flex flex-col select-none">
          <span className="font-serif font-bold text-2xl md:text-3xl text-[#F4EDDC] leading-[0.8] mb-3 uppercase tracking-widest">
            THE<br/>{profile.company ? profile.company.substring(0,10) : 'HUMAN'}
          </span>
          <span className="font-sans text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-[#AEA997] leading-[1.6] max-w-[150px] font-bold">
            People are<br/>the product.
          </span>
        </div>
        <button 
          onClick={() => setMenuOpen(true)}
          className="w-14 h-14 flex flex-col items-end justify-start gap-[8px] hover:opacity-70 transition-opacity focus:outline-none pt-2 pr-2"
          aria-label="Open menu"
        >
          <div className="w-10 h-[2px] bg-[#F4EDDC]"></div>
          <div className="w-10 h-[2px] bg-[#F4EDDC]"></div>
        </button>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 w-full flex-1 pb-16">
        
        {/* Hero Section */}
        <section className="relative w-full max-w-[1300px] mx-auto px-6 mt-0 md:mt-12 flex flex-col lg:flex-row items-center lg:items-stretch justify-end min-h-[auto] lg:min-h-[500px]">
          
          {/* Text Content (Overlapping) */}
          <div className="w-full lg:w-3/5 flex flex-col z-20 lg:absolute lg:left-8 lg:top-1/2 lg:-translate-y-1/2 mt-6 lg:mt-0 text-center lg:text-left order-2 lg:order-1">
            <span className="font-serif italic text-[#F4EDDC] text-lg sm:text-xl md:text-2xl opacity-90 block mb-1 lg:mb-2">
              @{profile.subdomain || 'identity'}
            </span>
            <h1 className="font-serif text-[#F4EDDC] text-[clamp(3.5rem,14vw,6rem)] lg:text-[8.5rem] leading-[0.9] tracking-tight mb-2 lg:mb-4 drop-shadow-md lg:drop-shadow-none">
              {profile.name}
            </h1>
            <h2 className="font-sans text-[#AEA997] text-lg sm:text-2xl md:text-3xl font-light tracking-wide max-w-2xl mx-auto lg:mx-0">
              {profile.headline || profile.role || 'Professional Profile'}
            </h2>
          </div>

          {/* Image Content */}
          <div className="w-full lg:w-[55%] relative flex justify-center lg:justify-end order-1 lg:order-2 mt-4 lg:mt-0">
            <div className="w-[min(70vw,280px)] h-[min(80vw,320px)] sm:w-[420px] sm:h-[480px] lg:w-[540px] lg:h-[600px] relative z-10 mx-auto lg:mr-0">
               <div className="absolute inset-0 human-img-bg scale-110 -translate-x-6 -translate-y-8 lg:-translate-x-12 lg:-translate-y-12 opacity-90 transition-transform duration-700 hover:scale-105" />
               <img 
                 src={profile.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'} 
                 alt={profile.name} 
                 className="absolute inset-0 w-full h-full object-cover human-img-mask shadow-2xl transition-transform duration-700 hover:scale-[1.02]" 
               />
               <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 lg:bottom-12 lg:right-12 w-14 h-14 md:w-16 md:h-16 bg-[#E2B746] text-[#123040] flex items-center justify-center shadow-xl z-20" style={{ borderRadius: '50% 50% 40% 60% / 60% 40% 60% 40%' }}>
                 <BadgeCheck size={32} strokeWidth={2} />
               </div>
            </div>
          </div>
          
        </section>

        {/* Bio / About */}
        {(profile.bio || profile.headline) && (
          <section className="relative w-full mt-12 md:mt-20 lg:mt-24 z-10 px-4 md:px-8">
            <div className="human-bio-surface absolute inset-0 -mx-4 md:-mx-8 scale-x-[1.02] -rotate-1 shadow-2xl" />
            
            <div className="relative z-10 max-w-6xl mx-auto py-8 md:py-16 flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-12 px-4 md:px-8">
              
              <div className="relative flex-1 text-center lg:text-left mt-6 lg:mt-0">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:-top-16 lg:-left-12 text-[#E2B746] font-serif text-[5rem] md:text-[10rem] leading-none select-none opacity-90">“</div>
                <h3 className="font-serif text-[#1B1D1B] text-2xl sm:text-3xl md:text-5xl lg:text-[4.5rem] leading-[1.05] tracking-tight relative z-10 max-w-3xl">
                  {profile.bio || profile.headline}
                </h3>
              </div>

              <div className="w-full lg:w-[40%] flex flex-col sm:flex-row lg:flex-row items-stretch gap-8 lg:border-l border-[#1B1D1B]/20 lg:pl-10 pt-4 lg:pt-0">
                <p className="font-sans text-[#1B1D1B] text-base md:text-lg leading-relaxed font-medium opacity-80 flex-1">
                  {profile.description || (profile.role && profile.company ? `${profile.role} at ${profile.company}. ` : '') + 'Creating impact and driving innovation across projects and teams.'}
                </p>
                
                <div className="sm:border-l border-[#1B1D1B]/20 sm:pl-8 flex flex-col justify-center sm:justify-end">
                  <div className="flex flex-col text-[#1B1D1B] text-[9px] md:text-[10px] uppercase tracking-[0.25em] font-bold gap-2 opacity-60">
                    <span>People</span>
                    <span>Ideas</span>
                    <span>Places</span>
                    <span>Possibilities</span>
                    <div className="w-6 h-[2px] bg-[#1B1D1B] mt-3"></div>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Metrics */}
        {profile.proofs && profile.proofs.length > 0 && (
          <section className="w-full max-w-5xl mx-auto px-6 mt-12 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">
            {profile.proofs.slice(0,3).map((proof: any, i: number) => {
              const s = [
                { bg: '#E2B746', text: '#1B1D1B', cls: 'human-metric-1', icon: <Users size={32} strokeWidth={1.5} />, dec: 'chart' },
                { bg: '#A5AE89', text: '#1B1D1B', cls: 'human-metric-2', icon: <div className="flex -space-x-3"><div className="w-8 h-8 rounded-full border border-current opacity-60"></div><div className="w-8 h-8 rounded-full border border-current opacity-80"></div><div className="w-8 h-8 rounded-full border border-current"></div></div>, dec: 'dots' },
                { bg: '#BE5B42', text: '#F4EDDC', cls: 'human-metric-3', icon: <Eye size={32} strokeWidth={1.5} />, dec: 'wave' }
              ][i % 3];

              return (
                <div key={i} className={`${s.cls} p-5 md:p-6 flex flex-row items-center justify-between shadow-xl relative overflow-hidden transition-transform duration-300 hover:-translate-y-2`}>
                  <div className="flex flex-col justify-between h-full min-h-[60px] md:min-h-[80px] gap-4 md:gap-6">
                    <div className="opacity-80 scale-90 md:scale-100 origin-left">{s.icon}</div>
                    <div className="opacity-40">
                      {s.dec === 'chart' && (
                        <div className="flex items-end gap-1.5 h-6">
                          <div className="w-1.5 h-3 bg-current rounded-sm"></div>
                          <div className="w-1.5 h-6 bg-current rounded-sm"></div>
                          <div className="w-1.5 h-4 bg-current rounded-sm"></div>
                        </div>
                      )}
                      {s.dec === 'dots' && (
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 bg-current rounded-full"></div>
                          <div className="w-2.5 h-2.5 bg-current rounded-full"></div>
                          <div className="w-2.5 h-2.5 bg-current rounded-full opacity-40"></div>
                        </div>
                      )}
                      {s.dec === 'wave' && (
                        <svg width="32" height="12" viewBox="0 0 32 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6C6 1 10 11 16 6C22 1 26 11 30 6"/></svg>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col text-left items-start ml-4 md:ml-6 flex-1 overflow-hidden">
                    <span className="font-serif text-[2rem] md:text-[2.75rem] font-bold tracking-tight leading-none mb-2 break-all">{proof.value}</span>
                    <span className="font-sans text-xs md:text-sm font-bold tracking-wide capitalize truncate w-full">{proof.title || proof.type}</span>
                    {proof.description && (
                      <span className="font-sans text-[10px] md:text-xs mt-2 opacity-80 max-w-[140px] leading-snug font-medium line-clamp-2">
                        {proof.description}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Social Links */}
        {profile.links && profile.links.length > 0 && (
          <section className="w-full max-w-3xl mx-auto px-6 mt-16 md:mt-24 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 md:mb-10 border-b border-[#AEA997]/20 pb-3 md:pb-5">
              <h4 className="font-serif text-3xl md:text-4xl text-[#F4EDDC] font-bold mb-2 sm:mb-0">Official links</h4>
              <span className="font-sans text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-[#AEA997] font-bold opacity-70">
                Same humans. Different places.
              </span>
            </div>
            
            <div className="flex flex-col gap-4 md:gap-5">
              {profile.links.map((link: any, i: number) => {
                const style = [
                  { bg: '#EFE4CC', text: '#1B1D1B' },
                  { bg: '#C2C8B1', text: '#1B1D1B' },
                  { bg: '#E5C6BD', text: '#1B1D1B' }
                ][i % 3];

                return (
                  <a key={i} href={link.url} target="_blank" rel="noreferrer"
                     className="human-social-link flex items-center justify-between p-2 md:p-3 shadow-lg group"
                     style={{ backgroundColor: style.bg, color: style.text }}>
                    <div className="flex items-center gap-4 md:gap-5">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-white/60 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-[#1B1D1B]">
                        <SocialIcon label={link.label} url={link.url} icon={link.icon} className="w-5 h-5 fill-current" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-sans font-bold text-base md:text-lg tracking-tight">{link.label}</span>
                        <span className="font-sans text-[10px] md:text-xs opacity-70 font-medium truncate max-w-[180px] md:max-w-none mt-0.5">
                          {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                        </span>
                      </div>
                    </div>
                    <div className="pr-3 md:pr-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                      <ArrowRight size={24} strokeWidth={1.5} />
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <RecentActivitySection
        activity={profile.recentActivity}
        variant="human"
        autoScroll={profile.autoScroll}
      />

      {/* Footer / CTAs */}
      <footer className="relative mt-16 md:mt-24 pt-20 md:pt-24 pb-12 overflow-hidden w-full flex items-center min-h-[250px] md:min-h-[300px]">
        {/* Organic layered backgrounds */}
        <div className="absolute bottom-0 right-0 w-[85%] md:w-[70%] h-full bg-[#EFE4CC] human-footer-shape-1 z-0 shadow-2xl" />
        <div className="absolute bottom-0 left-0 w-[70%] md:w-[45%] h-[85%] bg-[#BE5B42] human-footer-shape-2 z-0 shadow-2xl" />
        <div className="absolute -bottom-16 -left-4 md:left-[5%] w-[50%] md:w-[28%] h-[60%] md:h-[50%] bg-[#123040] human-footer-shape-3 z-0 shadow-2xl" />

        <div className="relative z-10 w-full max-w-[1300px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-end gap-8 h-full pb-2">
          
          <div className="flex flex-col text-[9px] uppercase tracking-[0.25em] font-bold text-[#1B1D1B] opacity-50 leading-[2] hidden md:flex pb-2">
            Kinder<br/>People<br/>Braver<br/>Tomorrows<br/>
            <div className="w-8 h-[2px] bg-[#1B1D1B] mt-3"></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full md:w-auto mx-auto md:ml-auto md:mr-8 z-10">
            <a 
              href={profile.email ? `mailto:${profile.email}` : '#'}
              onClick={(e) => {
                if (!profile.email) {
                  e.preventDefault();
                  showToast('Contact email not available.');
                }
              }} 
              className="w-full sm:w-auto px-8 py-4 md:py-5 rounded-full border border-[#1B1D1B]/30 text-[#1B1D1B] font-sans font-bold flex items-center justify-center gap-3 hover:bg-white/10 hover:border-[#1B1D1B] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B1D1B]"
            >
              <Send size={20} strokeWidth={2} />
              Get in touch
            </a>
            <button 
              onClick={downloadVCard} 
              className="w-full sm:w-auto px-8 py-4 md:py-5 rounded-full bg-[#123040] text-[#F4EDDC] font-sans font-bold flex items-center justify-center gap-3 hover:bg-[#1a4358] hover:-translate-y-1 transition-all shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#1B1D1B]"
            >
              <Bookmark size={20} strokeWidth={2} />
              Save contact
            </button>
          </div>

          <div className="hidden lg:flex flex-col items-end gap-3 pb-2">
            <div className="flex gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#123040]"></div>
              <div className="w-6 h-6 rounded-full bg-[#E2B746]"></div>
              <div className="w-6 h-6 rounded-full bg-[#A5AE89]"></div>
              <div className="w-6 h-6 rounded-full bg-[#BE5B42]"></div>
            </div>
            <span className="font-sans text-[9px] uppercase tracking-[0.25em] font-bold text-[#1B1D1B] text-right mt-1">
              Better people<br/>brighter together.
            </span>
          </div>
          
        </div>
      </footer>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#123040]/80 backdrop-blur-sm transition-opacity" onClick={() => setMenuOpen(false)}>
          <div 
            className="w-full max-w-sm bg-[#EFE4CC] h-full shadow-2xl flex flex-col p-8 md:p-12 transform transition-transform duration-300"
            style={{ borderRadius: '40px 0 0 40px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-end mb-16">
              <button 
                onClick={() => setMenuOpen(false)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-[#1B1D1B]/10 text-[#1B1D1B] hover:bg-[#1B1D1B]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B1D1B]"
                aria-label="Close menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <nav className="flex flex-col gap-8 text-[#1B1D1B]">
              <a href="#" onClick={(e) => { e.preventDefault(); handleContact(); setMenuOpen(false); }} className="text-3xl font-serif hover:italic transition-all opacity-90 hover:opacity-100">Contact</a>
              <a href="#" onClick={(e) => { e.preventDefault(); downloadVCard(); setMenuOpen(false); }} className="text-3xl font-serif hover:italic transition-all opacity-90 hover:opacity-100">Save Profile</a>
              {profile.links && profile.links.length > 0 && (
                <div className="mt-12 pt-12 border-t border-[#1B1D1B]/10 flex flex-col gap-5">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">Links</span>
                  {profile.links.map((l: any, i: number) => (
                    <a key={i} href={l.url} target="_blank" rel="noreferrer" className="font-sans font-bold text-lg hover:text-[#BE5B42] transition-colors flex items-center gap-3">
                      <SocialIcon label={l.label} url={l.url} icon={l.icon} className="w-5 h-5 fill-current shrink-0" />
                      <span>{l.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-[#1B1D1B] text-[#F4EDDC] text-sm font-sans font-bold tracking-wide rounded-full shadow-2xl transition-all duration-300 z-50 ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {toastMsg}
      </div>
      </div>
    </div>
  );
}


// --- 03 AGENCY --- //

function MachineTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#FF3366'; 
  const name = profile?.name || "SYS.ADMIN";
  
  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700;900&family=Syne:wght@600;800&display=swap');

    .machine-wrap {
      --m-accent: ${accent};
      --m-text: #1a1a1a;
      font-family: 'Space Grotesk', sans-serif;
      min-height: 100vh;
      width: 100%;
      position: relative;
      overflow-x: hidden;
      /* Very bright, colorful holographic liquid background - NO DARK COLORS */
      background: linear-gradient(-45deg, #FFE5E5, #E5F3FF, #E8FFE5, #FFE5F9);
      background-size: 300% 300%;
      animation: gradientBG 15s ease infinite;
      color: var(--m-text);
    }

    @keyframes gradientBG {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Giant Watermark Name */
    .m-giant-name {
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Syne', sans-serif;
      font-size: clamp(8rem, 20vw, 25rem);
      font-weight: 800;
      color: rgba(0, 0, 0, 0.03);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      letter-spacing: -0.05em;
    }

    /* Asymmetric Canvas */
    .m-canvas {
      position: relative;
      z-index: 10;
      max-width: 1400px;
      margin: 0 auto;
      padding: 100px 5%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: start;
    }

    @media (max-width: 900px) {
      .m-canvas {
        grid-template-columns: 1fr;
        padding: 50px 5%;
        gap: 40px;
      }
    }

    /* --- RIGHT SIDE: FREESTYLE AVATAR & INFO (ORDER 2 ON DESKTOP) --- */
    .m-info-col {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
      order: 2; /* Right side on desktop */
    }
    @media (max-width: 900px) {
      .m-info-col { 
        align-items: center; 
        text-align: center; 
        order: 1; /* Top on mobile */
      }
    }

    .m-conversation-btn {
      display: inline-block;
      margin-top: 30px;
      padding: 16px 36px;
      background: var(--m-text);
      color: #fff;
      font-size: 1.1rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 50px;
      text-decoration: none;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .m-conversation-btn:hover {
      transform: translateY(-5px) scale(1.02);
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      background: var(--m-accent);
      color: #fff;
    }

    .m-avatar-container {
      position: relative;
      margin-bottom: 40px;
    }

    .m-avatar-img {
      width: clamp(200px, 25vw, 320px);
      height: clamp(200px, 25vw, 320px);
      border-radius: 40px;
      object-fit: cover;
      box-shadow: 
        20px 20px 50px rgba(0,0,0,0.1),
        inset 0 0 0 4px rgba(255,255,255,0.8);
      transform: rotate(5deg);
      transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .m-avatar-container:hover .m-avatar-img {
      transform: rotate(0deg) scale(1.02);
    }

    .m-role-badge {
      position: absolute;
      bottom: -20px;
      left: -30px;
      background: var(--m-accent);
      color: #fff;
      font-family: 'Syne', sans-serif;
      padding: 15px 30px;
      border-radius: 100px;
      font-size: 0.9rem;
      font-weight: 800;
      letter-spacing: 2px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.15);
      transform: rotate(-10deg);
      white-space: nowrap;
    }

    .m-bio-panel {
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px);
      border-radius: 30px;
      padding: 40px;
      border: 1px solid rgba(255, 255, 255, 0.9);
      max-width: 500px;
      margin-top: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.05);
    }

    .m-bio-text {
      font-size: 1.1rem;
      line-height: 1.6;
      color: var(--m-text);
      font-weight: 500;
    }


    .m-metrics-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: flex-end;
      margin-top: 40px;
    }
    @media (max-width: 900px) {
      .m-metrics-grid { justify-content: center; }
    }

    .m-metric-item {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      background: rgba(255,255,255,0.5);
      padding: 20px 30px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.8);
      box-shadow: 0 10px 20px rgba(0,0,0,0.04);
    }
    .m-metric-val {
      font-family: 'Syne', sans-serif;
      font-size: 2rem;
      font-weight: 800;
      color: var(--m-text);
      line-height: 1;
      margin-bottom: 5px;
    }
    .m-metric-lbl {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--m-accent);
      font-weight: 700;
    }

    /* --- LEFT SIDE: THE OVERLAPPING DECK (ORDER 1 ON DESKTOP) --- */
    .m-deck-col {
      display: flex;
      flex-direction: column;
      margin-top: 50px;
      order: 1; /* Left side on desktop */
    }
    @media (max-width: 900px) {
      .m-deck-col { order: 2; margin-top: 20px; } /* Bottom on mobile */
    }

    .m-deck-title {
      font-family: 'Syne', sans-serif;
      font-size: 1.2rem;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: var(--m-text);
      margin-bottom: 40px;
      padding-left: 20px;
      border-left: 3px solid var(--m-accent);
      font-weight: 800;
    }

    .m-link-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 2px solid #fff;
      border-radius: 24px;
      padding: 25px 30px;
      text-decoration: none;
      color: var(--m-text);
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      margin-bottom: -15px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.06), inset 0 4px 10px rgba(255,255,255,0.5);
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 1;
    }
    
    .m-link-card:nth-child(odd) {
      transform: rotate(-2deg) translateX(-5px);
    }
    .m-link-card:nth-child(even) {
      transform: rotate(2deg) translateX(5px);
    }

    .m-link-card:hover {
      transform: rotate(0) scale(1.05) translateY(-15px) !important;
      z-index: 10;
      background: rgba(255, 255, 255, 0.95);
      border-color: var(--m-accent);
      box-shadow: 0 30px 60px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,1);
    }

    .m-link-info {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .m-link-title {
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .m-link-sub {
      font-size: 0.8rem;
      color: var(--m-accent);
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 700;
    }
    
    .m-link-arrow {
      width: 45px; height: 45px;
      border-radius: 50%;
      background: var(--m-text);
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.4s;
      color: #fff;
    }
    .m-link-card:hover .m-link-arrow {
      background: var(--m-accent);
      transform: rotate(45deg);
    }
  `;

  return (
    <div className="machine-wrap">
      <style>{customStyles}</style>
      
      {/* Massive Background Typography */}
      <div className="m-giant-name">{name}</div>
      
      <div className="m-canvas">
        
        {/* RIGHT (DOM ORDER 1): FREESTYLE AVATAR & INFO -> Stacks on top in mobile */}
        <div className="m-info-col">
          
          <div className="m-avatar-container">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={name} className="m-avatar-img" />
            ) : (
              <div className="m-avatar-img flex items-center justify-center bg-white text-[var(--m-accent)] text-6xl font-bold">
                {name[0]}
              </div>
            )}
            <div className="m-role-badge">{profile.headline || profile.role || "ENGINEER"}</div>
          </div>

          {profile.bio && (
            <div className="m-bio-panel">
              <div className="m-bio-text">{profile.bio}</div>
            </div>
          )}

          {/* Get in Touch CTA */}
          <a 
            href={profile.email ? `mailto:${profile.email}` : '#'}
            className="m-conversation-btn"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}
          >
            <span>✉</span> Get in Touch
          </a>

          {/* Conversation Button */}
          {(profile.theme as any)?.conversationUrl && (
            <a 
              href={(profile.theme as any).conversationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="m-conversation-btn"
            >
              Start a Conversation
            </a>
          )}

          {/* Proof Points Section */}
          {profile.proofPoints && profile.proofPoints.length > 0 && (
            <div className="m-metrics-grid" style={{ marginTop: '30px' }}>
              {profile.proofPoints.map((point: any, i: number) => {
                const val = point.value || point.subtitle || (typeof point === 'string' ? point : point.title);
                const lbl = point.type || point.label || (point.subtitle ? point.title : 'STATS');
                return (
                  <div key={i} className="m-metric-item">
                    <span className="m-metric-val">{val}</span>
                    <span className="m-metric-lbl">{lbl}</span>
                  </div>
                );
              })}
            </div>
          )}

          {profile.metrics && profile.metrics.length > 0 && (
            <div className="m-metrics-grid">
              {profile.metrics.map((m: any, i: number) => (
                <div key={i} className="m-metric-item">
                  <span className="m-metric-val">{m.value}</span>
                  <span className="m-metric-lbl">{m.label || m.title || m.name}</span>
                </div>
              ))}
            </div>
          )}

          <RecentActivitySection
            activity={profile.recentActivity}
            variant="machine"
            accentColor={accent}
            autoScroll={profile.autoScroll}
          />
        </div>

        {/* LEFT (DOM ORDER 2): STAGGERED DECK -> Stacks on bottom in mobile */}
        <div className="m-deck-col">
          <div className="m-deck-title">Access Modules</div>
          <div className="m-deck-wrapper">
            {profile.links?.map((link: any, i: number) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="m-link-card">
                <div className="m-link-info flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white">
                    <SocialIcon label={link.label} url={link.url} icon={link.icon} className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <span className="m-link-title">{link.label}</span>
                    <span className="m-link-sub">SYS.MOD // {i.toString().padStart(2, '0')}</span>
                  </div>
                </div>
                <div className="m-link-arrow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}


// --- 04 ENTREPRENEUR --- //

function BuilderTemplate({ profile }: any) {
  const name = profile?.name || "";
  const role = profile?.role || profile?.headline || "BUILDER & ARCHITECT";
  const bio = profile?.bio || "I construct systems and experiences that turn abstract possibilities into tangible utility.";
  const email = profile?.email || "";

  const links = profile?.links || [];
  const metrics = profile?.metrics || [];
  const proofs = profile?.proofPoints || profile?.proofs || [];

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap');
    
    .builder-theme {
      background-color: #FAFAFA;
      color: #292226;
      font-family: 'Outfit', sans-serif;
    }
    
    .builder-serif {
      font-family: 'DM Serif Display', serif;
    }

    .builder-container {
      background-color: #E8EEF2;
      box-shadow: 0 20px 40px rgba(52, 38, 50, 0.08);
    }
      
    .builder-blueprint-grid {
      background-image: 
        linear-gradient(rgba(135, 149, 138, 0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(135, 149, 138, 0.15) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    .builder-module-shadow {
      box-shadow: 4px 4px 0px rgba(52, 38, 50, 1);
      transition: all 0.2s ease;
    }
    .builder-module-shadow:hover {
      box-shadow: 2px 2px 0px rgba(52, 38, 50, 1);
      transform: translate(2px, 2px);
    }
  `;

  return (
    <div className="builder-theme min-h-screen w-full flex justify-center py-4 md:py-12 px-4 md:px-8">
      <style>{customStyles}</style>

      {/* Outer Canvas Container */}
      <div className="builder-container w-full max-w-[1200px] rounded-[32px] md:rounded-[40px] border border-[#292226]/10 overflow-hidden flex flex-col relative pb-20">
        
        {/* HEADER */}
        <header className="px-6 md:px-12 py-8 flex justify-between items-center border-b border-[#292226]/10">
          <div className="flex items-center gap-3">
             <div className="w-5 h-5 bg-[#342632] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#C5A86A]" />
             </div>
             <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#342632]">BUILDER // {name ? name.split(' ')[0] : 'ID'}</span>
          </div>
        </header>

        <div className="px-6 md:px-12 pt-16 md:pt-24 max-w-[960px] mx-auto w-full">
          {/* HERO WITHOUT HEADLINE QUOTE */}
          <section className="mb-16 relative">
             {/* BUILDER IDENTITY MODULE */}
             <div className="w-full bg-[#342632] text-[#F3EEE6] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row gap-8 md:gap-16 group builder-module-shadow border border-[#292226]">
                <div className="absolute inset-0 builder-blueprint-grid opacity-30" />
                
                {/* Visual Column */}
                <div className="w-full md:w-[35%] relative min-h-[220px] md:min-h-full flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 md:pr-8">
                   {profile?.avatarUrl ? (
                     <img src={profile.avatarUrl} alt={name} className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-sm border-2 border-[#C5A86A] z-10 relative" />
                   ) : (
                     <div className="w-48 h-48 md:w-56 md:h-56 bg-[#292226] border-2 border-[#C5A86A] flex items-center justify-center text-xs font-bold text-[#C5A86A] z-10 relative">ID</div>
                   )}
                </div>

                {/* Content Column */}
                <div className="flex-1 relative z-10 flex flex-col justify-center">
                   <div className="flex items-center gap-5 mb-6">
                     <h2 className="builder-serif text-4xl md:text-5xl">{name || "[ BUILDER ]"}</h2>
                   </div>
                   
                   <div className="text-[12px] font-bold text-[#C5A86A] mb-3 uppercase tracking-widest">{role}</div>
                   <p className="text-lg text-[#F3EEE6]/80 max-w-sm mb-8 leading-relaxed font-medium">{bio}</p>
                </div>
             </div>
          </section>

          {/* INTRODUCTION ROWS */}
          <section className="mb-24 flex flex-col text-sm font-bold uppercase tracking-widest">
             <div className="flex flex-col md:flex-row md:items-center py-5 border-b border-[#292226]/10 gap-3 md:gap-12 group">
                <span className="text-[#87958A] w-32 shrink-0 group-hover:text-[#A85C4A] transition-colors">POSITION</span>
                <span className="text-[#342632]">{role}</span>
             </div>
             {links.length > 0 && (
               <div className="flex flex-col md:flex-row py-5 border-b border-[#292226]/10 gap-3 md:gap-12 group">
                  <span className="text-[#87958A] w-32 shrink-0 group-hover:text-[#A85C4A] transition-colors pt-1">NETWORK</span>
                  <div className="flex gap-4 flex-wrap">
                     {links.map((link: any, i: number) => {
                        const icon = getAestheteSocialIcon(link.label || link.title, link.url, link.icon);
                        return (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#342632] border border-[#292226]/30 px-4 py-2 hover:border-[#A85C4A] hover:text-[#A85C4A] transition-colors text-[#F3EEE6]">
                             <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">{icon}</svg>
                             <span>{link.label}</span>
                          </a>
                        );
                     })}
                  </div>
               </div>
             )}
          </section>

          {/* METRICS */}
          {metrics && metrics.length > 0 && (
             <section className="mb-24">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#87958A] mb-8 font-bold border-l-2 border-[#A85C4A] pl-3">SYSTEM DIAGNOSTICS</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {metrics.map((m: any, i: number) => (
                      <div key={i} className="bg-[#342632] border border-[#292226]/20 p-6 flex flex-col justify-center items-center text-center hover:border-[#A85C4A] transition-colors group">
                         <div className="builder-serif text-5xl md:text-6xl text-[#F3EEE6] mb-2 group-hover:text-[#A85C4A] transition-colors">{m.value}</div>
                         <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C5A86A]">{m.label || m.title || m.name}</div>
                      </div>
                   ))}
                </div>
             </section>
          )}

          {/* PROOF POINTS */}
          {proofs && proofs.length > 0 && (
             <section className="mb-24">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#87958A] mb-8 font-bold border-l-2 border-[#A85C4A] pl-3">SYSTEM CREDENTIALS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {proofs.filter((p: any) => p.type || p.title || p.label).map((p: any, i: number) => (
                      <div key={i} className="bg-[#FAFAFA] border-2 border-[#292226]/40 p-6 flex flex-col justify-center hover:border-[#A85C4A] transition-colors group relative overflow-hidden builder-module-shadow">
                         <div className="absolute inset-0 builder-blueprint-grid opacity-10 pointer-events-none" />
                         <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#292226]/10 group-hover:bg-[#A85C4A] transition-colors" />
                         <div className="flex items-baseline gap-4 mb-2 pl-4">
                           <div className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#342632] relative z-10">{p.type || p.title || p.label}</div>
                           <div className="builder-serif text-3xl md:text-4xl text-[#A85C4A] relative z-10">{p.value}</div>
                         </div>
                         {p.url && (
                           <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-[#87958A] hover:text-[#A85C4A] border-b border-[#87958A] hover:border-[#A85C4A] w-max mt-4 pl-4 pb-0.5 relative z-10">
                             VERIFY PROOF ↗
                           </a>
                         )}
                      </div>
                   ))}
                </div>
             </section>
          )}

          <RecentActivitySection
            activity={profile.recentActivity}
            variant="builder"
            autoScroll={profile.autoScroll}
          />

          {/* CONTACT CTA */}
          <section className="mt-32 mb-16 bg-[#A85C4A] text-[#F3EEE6] p-8 md:p-16 flex flex-col items-center text-center relative overflow-hidden border border-[#292226] builder-module-shadow">
             <div className="absolute inset-0 builder-blueprint-grid opacity-20 pointer-events-none" />
             <h2 className="builder-serif text-5xl md:text-6xl mb-6 max-w-2xl leading-[1.05] relative z-10 text-[#F3EEE6]">Ready to initialize?</h2>
             <p className="text-xs text-[#F3EEE6]/80 mb-10 max-w-md uppercase tracking-widest font-bold relative z-10">
               Begin sequence transfer.
             </p>
             <a href={email ? `mailto:${email}` : '#'} className="bg-[#342632] text-[#C5A86A] px-8 py-4 text-[12px] uppercase tracking-[0.2em] font-bold flex items-center gap-4 hover:bg-[#292226] transition-colors relative z-10 shadow-[4px_4px_0px_rgba(41,34,38,1)] border border-[#292226]">
                GET IN TOUCH <span className="text-[#F3EEE6]">↗</span>
             </a>
          </section>
          
        </div>
      </div>
    </div>
  );
}

function VisionaryTemplate({ profile, onLinkClick }: any) {
  const name = profile?.name || "Aria Mehta";
  const nameParts = name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  const headline = profile?.headline || profile?.role || "FOUNDER - FUTURE SYSTEMS DESIGNER";
  const bio = profile?.bio || "I build products and systems around ideas that feel slightly ahead of their time — turning emerging technology into experiences people can actually understand and use.";
  const exploring = (profile as any)?.exploring || "AI + HUMAN EXPERIENCE";
  const location = (profile as any)?.location || "BENGALURU, INDIA";

  const question = (profile as any)?.question || "What do you build when the future has not been named yet?";
  const positioning = (profile as any)?.positioning || "I work at the intersection of emerging technology, product thinking, and human behavior — turning uncertain possibilities into useful experiences.";

  const metrics = profile?.metrics || profile?.proofs || profile?.proofPoints || [
    { value: "12+", label: "EXPERIMENTS SHIPPED", description: "BUILD / LAST 3 YEARS" },
    { value: "48K", label: "PEOPLE REACHED", description: "REACH / ACROSS PROJECTS" },
    { value: "07", label: "PRODUCTS & PROTOTYPES", description: "SIGNAL / SELECTED WORK" }
  ];

  const links = profile?.links || [
    { label: "LINKEDIN", url: "https://linkedin.com", description: "PROFESSIONAL / NETWORK", icon: "linkedin" },
    { label: "INSTAGRAM", url: "https://instagram.com", description: "VISUAL / JOURNAL", icon: "instagram" },
    { label: "X / TWITTER", url: "https://x.com", description: "IDEAS / SIGNAL", icon: "x" }
  ];

  const imageUrl = profile?.avatarUrl;
  const email = profile?.email || "";
  const contactLink = email.includes('@') ? `mailto:${email}` : '#';

  const currentYear = new Date().getFullYear();

  const getPlatformIcon = (platform: string, url?: string, icon?: string) => {
    return <SocialIcon label={platform} url={url} icon={icon} className="w-[19px] h-[19px] block fill-current" />;
  };

  return (
    <div className="min-h-screen w-full bg-[#ECEEF5] py-8 sm:py-16 px-4 sm:px-8 flex justify-center items-start text-[#2C2825] font-['Manrope',sans-serif] antialiased">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@300;400;500;600;700&display=swap');
        .visionary-serif { font-family: 'DM Serif Display', serif; }
        .visionary-sans { font-family: 'Manrope', sans-serif; }
        
        .visionary-outer-shell {
          background-color: #FDF2E9;
          background-image: 
            radial-gradient(circle at 50% 0%, rgba(220, 209, 195, 0.15) 0%, transparent 70%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
          box-shadow: 0 20px 40px -10px rgba(44, 40, 37, 0.08), inset 0 0 0 1px rgba(44, 40, 37, 0.05);
        }
        
        @keyframes visionaryFloat {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes visionarySpinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .anim-float { animation: visionaryFloat 12s ease-in-out infinite; }
        .anim-spin-slow { animation: visionarySpinSlow 40s linear infinite; }
        
        @media (prefers-reduced-motion: reduce) {
          .anim-float, .anim-spin-slow { animation: none !important; }
          .transition-all, .transition-colors, .transition-transform, .transition-opacity { transition: none !important; }
        }
      `}} />
      
      <div className="visionary-outer-shell relative w-full max-w-[1040px] rounded-[32px] sm:rounded-[48px] border border-[#2C2825]/10 overflow-hidden">
        
        {/* Registration Marks */}
        <div className="absolute top-6 left-6 w-3 h-3 border-t border-l border-[#2C2825]/30 pointer-events-none" />
        <div className="absolute top-6 right-6 w-3 h-3 border-t border-r border-[#2C2825]/30 pointer-events-none" />
        <div className="absolute bottom-6 left-6 w-3 h-3 border-b border-l border-[#2C2825]/30 pointer-events-none" />
        <div className="absolute bottom-6 right-6 w-3 h-3 border-b border-r border-[#2C2825]/30 pointer-events-none" />

        {/* 1. Top Navigation */}
        <header className="relative pt-8 pb-4 px-8 sm:px-12 flex justify-between items-center text-[9px] tracking-[0.2em] uppercase font-bold text-[#2C2825]">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border border-[#2C2825] flex items-center justify-center p-[2px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2C2825]" />
            </div>
            <span>UNOOL / FIELD NOTE</span>
          </div>
        </header>

        {/* 2. Hero Section */}
        <section className="relative px-8 sm:px-12 pt-12 pb-20 flex flex-col md:flex-row gap-12 md:gap-20 items-center md:items-start border-b border-[#2C2825]/10">
          
          {/* Left: Portrait Instrument */}
          <div className="w-full md:w-[400px] flex flex-col items-center shrink-0">
            <div className="absolute top-16 left-12 w-4 h-4 border-t border-l border-[#2C2825]/20 hidden md:block" />
            <div className="absolute bottom-20 right-[55%] w-4 h-4 border-b border-r border-[#2C2825]/20 hidden md:block" />
            
            <div className="relative w-64 h-72 sm:w-80 sm:h-96 group perspective-1000 mt-4 md:mt-0">
              {/* Orbital Rings */}
              <div className="absolute inset-[-10%] rounded-full border-[0.5px] border-[#A599B5]/30 anim-spin-slow pointer-events-none" />
              <div className="absolute inset-[-5%] rounded-full border-[0.5px] border-[#BA6F61]/20 anim-float pointer-events-none" style={{ animationDelay: '-4s' }} />
              
              <div className="relative w-full h-full rounded-[40%_60%_70%_30%/40%_50%_60%_50%] overflow-hidden border border-[#2C2825]/20 transition-transform duration-700 md:group-hover:-translate-y-2 md:group-hover:rotate-1 bg-[#DCD1C3]/30 flex items-center justify-center shadow-lg">
                {imageUrl ? (
                  <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#704E59]">
                    <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center mb-3">
                      <div className="w-2 h-2 rounded-full bg-current" />
                    </div>
                    <span className="text-[10px] tracking-[0.2em] font-bold">PORTRAIT FIELD</span>
                  </div>
                )}
              </div>
              
              <div className="absolute top-1/2 -left-4 w-2 h-[1px] bg-[#2C2825]/30 pointer-events-none" />
              <div className="absolute top-1/2 -right-4 w-2 h-[1px] bg-[#2C2825]/30 pointer-events-none" />
              <div className="absolute -top-4 left-1/2 h-2 w-[1px] bg-[#2C2825]/30 pointer-events-none" />
              <div className="absolute -bottom-4 left-1/2 h-2 w-[1px] bg-[#2C2825]/30 pointer-events-none" />
              
              <span className="absolute top-[20%] -right-8 text-[8px] tracking-widest text-[#8B958A] rotate-90 origin-left pointer-events-none hidden sm:block">E. 17° 39'</span>
              <span className="absolute bottom-[20%] -left-8 text-[8px] tracking-widest text-[#8B958A] -rotate-90 origin-right pointer-events-none hidden sm:block">N. 41° 21'</span>
            </div>
            
            <div className="mt-10 flex flex-col items-center gap-2 text-[9px] tracking-[0.2em] text-[#8B958A] uppercase">
              <span>OPTICAL FRAME / 38° 18'</span>
            </div>
          </div>

          {/* Right: Hero Identity */}
          <div className="flex-1 w-full flex flex-col relative z-10 pt-4 items-center text-center md:items-start md:text-left">
            
            <div className="absolute top-0 right-0 hidden md:flex flex-col items-end">
               <div className="w-20 h-20 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] border-[0.5px] border-[#704E59]/30 anim-float flex items-center justify-center pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#704E59]/40" />
               </div>
               <span className="text-[8px] tracking-[0.2em] text-[#8B958A] uppercase mt-2">FIELD / 01</span>
            </div>

            <div className="flex items-center mb-6">
              <span className="text-[9px] tracking-[0.2em] text-[#8B958A] uppercase font-bold">
                THE VISIONARY
              </span>
            </div>
            
            <h1 className="relative z-10 visionary-serif text-[clamp(4rem,10vw,6.5rem)] leading-[0.85] text-[#2C2825] mb-8">
              {firstName}
              <br className="hidden md:block" />
              {lastName ? (
                <>
                  <span className="md:hidden"> </span>
                  {lastName}
                </>
              ) : null}
            </h1>
            

            
            <h2 className="text-[11px] sm:text-[13px] tracking-[0.15em] font-bold uppercase text-[#2C2825] mb-6">
              {headline}
            </h2>
            
            <p className="text-sm sm:text-base leading-[1.8] text-[#2C2825]/80 max-w-lg font-medium mb-10">
              {bio}
            </p>
            
            <div className="mb-10 flex flex-col justify-center items-center md:items-start">
              <span className="text-[8px] tracking-[0.2em] text-[#8B958A] uppercase mb-1">CURRENTLY EXPLORING</span>
              <span className="text-[10px] tracking-[0.1em] font-bold uppercase text-[#2C2825]">{exploring}</span>
            </div>
            
            <a 
              href={contactLink}
              className="group inline-flex items-center self-center md:self-start gap-4 pr-6 rounded-full border border-[#2C2825]/20 bg-white/50 hover:bg-white transition-all hover:shadow-[0_8px_20px_rgba(112,78,89,0.1)] md:hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#704E59] focus:ring-offset-2 focus:ring-offset-[#F8F5F0]"
            >
              <div className="w-12 h-12 rounded-full bg-[#704E59] flex items-center justify-center text-white transition-transform group-hover:rotate-45">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"></line><polyline points="12 5 19 5 19 12"></polyline></svg>
              </div>
              <div className="flex flex-col py-2 text-left">
                <span className="text-[8px] tracking-[0.2em] text-[#8B958A] uppercase font-bold">PRIMARY SIGNAL</span>
                <span className="text-[11px] font-bold text-[#2C2825]">Get in Touch</span>
              </div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8B958A] ml-2 group-hover:translate-x-1 transition-transform"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
            
          </div>
        </section>

        {/* 4. Proof Section */}
        {metrics && metrics.length > 0 && (
          <section className="relative px-8 sm:px-12 py-16 border-b border-[#2C2825]/10">
            <div className="text-[9px] tracking-[0.2em] text-[#8B958A] uppercase font-bold mb-8 text-center md:text-left">
              PROOF / SIGNAL / TRACE
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 md:gap-8 mb-12">
              <h3 className="visionary-serif text-4xl sm:text-5xl text-[#2C2825] text-center md:text-left">
                Evidence, <span className="text-[#704E59] italic">in orbit.</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {metrics.slice(0, 3).map((metric: any, idx: number) => {
                const colors = [
                  { bg: 'bg-[#FDFBF7]', border: 'border-[#704E59]/20', accent: 'text-[#704E59]' },
                  { bg: 'bg-[#F2F4F2]', border: 'border-[#8B958A]/30', accent: 'text-[#8B958A]' },
                  { bg: 'bg-[#FDF8F6]', border: 'border-[#BA6F61]/20', accent: 'text-[#BA6F61]' },
                ];
                const theme = colors[idx % 3];
                
                return (
                  <div key={idx} className={`metric-card relative p-6 sm:p-8 rounded-tr-3xl rounded-bl-3xl border ${theme.border} ${theme.bg} transition-all duration-300 md:hover:-translate-y-1 hover:shadow-md group overflow-hidden`}>
                    <span className={`absolute top-6 right-6 text-[8px] font-bold ${theme.accent} z-0`}>0{idx + 1}</span>
                    
                    {idx === 0 && (
                      <div className="absolute top-8 right-16 w-10 h-6 rounded-full border-[0.5px] border-[#704E59]/40 rotate-12 flex items-center justify-end pr-1 pointer-events-none hidden sm:flex z-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#704E59]/60" />
                      </div>
                    )}
                    
                    <div className="relative z-10 pt-2 pb-2">
                      <div className="metric-value visionary-serif text-5xl sm:text-6xl text-[#2C2825] mb-2 md:mb-3 group-hover:scale-105 transition-transform origin-left block">
                        {metric.value}
                      </div>
                      
                      <div className="metric-label text-[10px] sm:text-[11px] tracking-[0.15em] font-bold uppercase text-[#2C2825] block min-h-[16px]">
                        {metric.label || metric.title || metric.name || metric.type || metric.text || metric.metricLabel || '\u00A0'}
                      </div>
                      
                      {metric.description && metric.description !== (metric.label || metric.title || metric.name || metric.type || metric.text) && (
                        <div className="metric-description text-[8px] tracking-[0.1em] text-[#8B958A] uppercase opacity-80 mt-1 block">
                          {metric.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute bottom-6 left-6 w-3 h-3 border-b border-l border-[#2C2825]/20 pointer-events-none z-0" />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <RecentActivitySection
          activity={profile.recentActivity}
          variant="visionary"
          autoScroll={profile.autoScroll}
        />

        {/* 5. Social / Signal Section */}
        {links && links.length > 0 && (
          <section className="relative px-8 sm:px-12 py-16 border-b border-[#2C2825]/10 flex flex-col md:flex-row gap-12 md:gap-20">
            <div className="w-full md:w-1/3 shrink-0 relative text-center md:text-left">
              <div className="text-[9px] tracking-[0.2em] text-[#8B958A] uppercase font-bold mb-6">
                THE INDEX
              </div>
              <h3 className="visionary-serif text-5xl sm:text-6xl text-[#2C2825] leading-[1]">
                Find the <br className="hidden md:block" /> <span className="text-[#A599B5] italic">signal.</span>
              </h3>
              
              <div className="absolute top-12 right-12 md:-right-8 w-16 h-12 rounded-[50%] border-[0.5px] border-[#A599B5]/40 -rotate-12 items-center justify-start pl-2 anim-float pointer-events-none hidden sm:flex">
                <div className="w-1.5 h-1.5 rounded-full bg-[#A599B5]" />
              </div>
              
              <div className="mt-12 md:mt-16 text-[8px] tracking-[0.2em] uppercase text-[#8B958A] border-l-2 border-[#A599B5]/30 pl-3 inline-block text-left">
                SOCIAL FIELD <br/> 0{links.length} SIGNALS
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center border-t border-[#2C2825]/10 pt-8 md:pt-0 md:border-none">
              {links.map((link: any, idx: number) => {
                const accents = ['text-[#704E59]', 'text-[#BA6F61]', 'text-[#8B958A]'];
                const bgAccents = ['bg-[#704E59]', 'bg-[#BA6F61]', 'bg-[#8B958A]'];
                const accentClass = accents[idx % 3];
                const bgClass = bgAccents[idx % 3];
                
                return (
                  <a 
                    key={idx} 
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Visit ${link.label}`}
                    className="group relative flex items-center gap-4 sm:gap-6 py-6 border-b border-[#2C2825]/10 hover:bg-black/[0.02] focus:outline-none focus-visible:bg-black/[0.02] transition-colors -mx-4 px-4 sm:mx-0 sm:px-0"
                  >
                    <div className="absolute left-0 bottom-0 w-0 h-[1px] bg-current transition-all duration-500 group-hover:w-full opacity-30" />
                    
                    <div className={`text-[9px] tracking-[0.2em] font-bold ${accentClass} flex items-center gap-2 w-8 shrink-0`}>
                      <span className="w-1.5 h-[1px] bg-current opacity-0 group-hover:opacity-100 transition-opacity" />
                      0{idx + 1}
                    </div>
                    
                    <div className="w-[44px] h-[44px] shrink-0 rounded-full border border-[#2C2825]/10 flex items-center justify-center text-[#2C2825] bg-white shadow-sm">
                      {getPlatformIcon(link.label || link.platform || '', link.url, link.icon)}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <span className="text-[11px] font-bold uppercase text-[#2C2825] truncate">{link.label}</span>
                    </div>
                    
                    <div className="text-[#2C2825] opacity-30 group-hover:opacity-100 md:group-hover:translate-x-1 transition-transform shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"></line><polyline points="12 5 19 5 19 12"></polyline></svg>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* 6. Footer */}
        <footer className="px-8 sm:px-12 py-8 flex flex-col items-center text-center">
          <p className="visionary-serif text-xl sm:text-2xl text-[#2C2825] italic m-0">
            Tomorrow is easier to build when someone is willing to see it early.
          </p>
        </footer>
      </div>
    </div>
  );
}

function HustlerTemplate({ profile }: any) {
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

  const name = profile?.name || "";
  const role = profile?.role || profile?.headline || "ENTREPRENEUR";
  const bio = profile?.bio || "Building high-leverage products and moving with absolute velocity.";
  const email = profile?.email;
  
  const allLinks = profile?.links || [];
  const validLinks = allLinks.filter((l: any) => l.url && (l.label || l.title));
  
  const metrics = profile?.metrics || [];
  const validMetrics = metrics.filter((m: any) => m.value && (m.label || m.title || m.name));
  
  const proofs = profile?.proofPoints || profile?.proofs || profile?.featured || profile?.milestones || [];
  const validProofs = proofs.filter((p: any) => p.type || p.title || p.label || p.description);

  const handleSave = () => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${name};;;;\nFN:${name}\nORG:${profile?.company || ''}\nTITLE:${role}\nURL:${typeof window !== 'undefined' ? window.location.origin : ''}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_') || 'Contact'}.vcf`;
    a.click();
    showToast('CONTACT SAVED');
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    
    .hustler-theme {
      font-family: 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    
    .hustler-serif {
      font-family: 'Instrument Serif', serif;
    }

    .hustler-mono {
      font-family: 'JetBrains Mono', monospace;
    }

    .hustler-organic {
      border-radius: 4px 32px 4px 16px;
    }
    
    .hustler-organic-sm {
      border-radius: 2px 12px 2px 8px;
    }
  `;

  return (
    <div className="hustler-theme min-h-screen w-full relative overflow-x-hidden bg-[#C4C0B8] selection:bg-[#D64924] selection:text-[#EAE8E3] p-4 sm:p-8 md:p-16 lg:p-24 flex items-center justify-center">
      <style>{customStyles}</style>

      {/* OUTER PREMIUM CONTAINER */}
      <div className="w-full max-w-[860px] bg-[#292724] border-2 border-[#292724] flex flex-col gap-[2px] hustler-organic overflow-hidden shadow-[16px_16px_0px_0px_rgba(41,39,36,0.15)] relative z-10">
         {/* HEADER SECTION */}
         <div className="flex flex-col md:flex-row border-b-2 border-[#EAE8E3]">
            {/* Image Column */}
            <div className="w-full md:w-[40%] border-b-2 md:border-b-0 md:border-r-2 border-[#EAE8E3] p-8 flex items-center justify-center bg-[#D64924] relative overflow-hidden group">
               <div className="absolute inset-0 bg-[#EAE8E3] opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
               <div className="w-[200px] h-[200px] md:w-[280px] md:h-[280px] border-4 border-[#EAE8E3] bg-[#292724] shadow-[8px_8px_0px_0px_#EAE8E3] transform group-hover:-translate-y-2 group-hover:shadow-[12px_12px_0px_0px_#EAE8E3] transition-all duration-300">
                  {profile?.avatarUrl ? (
                     <img src={profile.avatarUrl} className="w-full h-full object-cover" alt={name} />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center font-serif text-8xl text-[#EAE8E3]">{name?.[0] || 'H'}</div>
                  )}
               </div>
            </div>
            
            {/* Identity Column */}
            <div className="w-full md:w-[60%] flex flex-col">
               <div className="p-8 md:p-12 flex-1 flex flex-col justify-center border-b-2 border-[#EAE8E3] bg-[#292724]">
                  <span className="inline-block bg-[#D64924] text-[#EAE8E3] text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] px-4 py-2 mb-6 self-start shadow-[4px_4px_0px_0px_#EAE8E3]">
                     {role}
                  </span>
                  <h1 className="hustler-serif text-6xl sm:text-7xl md:text-[6rem] leading-[0.85] text-[#EAE8E3] uppercase break-words">
                     {name || 'HUSTLER'}
                  </h1>
               </div>
               <div className="p-8 md:p-12 bg-[#EAE8E3]">
                  <p className="text-lg sm:text-xl font-medium leading-relaxed text-[#292724]">
                     {bio}
                  </p>
               </div>
            </div>
         </div>

         {/* NETWORK SECTION */}
         <div className="p-8 md:p-12 border-b-2 border-[#EAE8E3] bg-[#292724]">
            <h3 className="text-[10px] text-[#D64924] uppercase tracking-widest font-bold mb-8">Network & Nodes</h3>
            <div className="flex flex-wrap gap-4">
               {validLinks.length > 0 ? validLinks.map((l: any, i: number) => {
                  const icon = getAestheteSocialIcon(l.label || l.title, l.url, l.icon);
                  return (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 border-2 border-[#EAE8E3] px-6 py-4 bg-[#292724] text-[#EAE8E3] hover:bg-[#EAE8E3] hover:text-[#292724] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#D64924] transition-all">
                       <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">{icon}</svg>
                       <span className="text-xs sm:text-sm uppercase tracking-widest font-bold">{l.label || l.title}</span>
                    </a>
                  )
               }) : (
                  <span className="text-xs uppercase tracking-widest font-bold text-[#7A756D]">NO NODES CONNECTED</span>
               )}
            </div>
         </div>

         {/* PROOF POINTS & METRICS SECTION */}
         <div className="p-8 md:p-12 border-b-2 border-[#EAE8E3] bg-[#EAE8E3]">
            <h3 className="text-[10px] text-[#D64924] uppercase tracking-widest font-bold mb-8">Proof Points & Momentum</h3>
            
            {/* Metrics Sub-grid */}
            {validMetrics.length > 0 && (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  {validMetrics.map((m: any, i: number) => (
                     <div key={i} className="flex flex-col p-6 bg-[#292724] border-2 border-[#292724] text-[#EAE8E3] shadow-[4px_4px_0px_0px_#D64924]">
                        <span className="hustler-serif text-5xl sm:text-6xl text-[#EAE8E3]">{m.value}</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#D64924] mt-2">{m.label || m.title || m.name}</span>
                     </div>
                  ))}
               </div>
            )}

            {/* Proofs Sub-grid */}
            <div className="flex flex-col gap-6">
               {validProofs.length > 0 ? validProofs.map((p: any, i: number) => {
                  const bgColors = ['bg-[#FFD166]', 'bg-[#06D6A0]', 'bg-[#118AB2]', 'bg-[#EF476F]'];
                  const bgColor = bgColors[i % bgColors.length];
                  return (
                  <div key={i} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 border-4 border-[#292724] ${bgColor} hover:-translate-y-1 hover:-translate-x-1 transition-all group shadow-[8px_8px_0px_#292724] mb-4`}>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                        <h4 className="text-xl sm:text-2xl font-black hustler-serif leading-tight text-[#292724] uppercase">{p.type || p.title || p.label}</h4>
                        <span className="text-3xl sm:text-4xl font-black hustler-serif text-[#EAE8E3] drop-shadow-[2px_2px_0px_#292724]">{p.value}</span>
                     </div>
                     {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-6 sm:mt-0 px-6 py-3 border-2 border-[#292724] bg-white text-[#292724] text-xs font-bold uppercase tracking-widest hover:bg-[#292724] hover:text-white transition-colors shadow-[4px_4px_0px_#292724] group-hover:shadow-[2px_2px_0px_#292724]">
                           VIEW PROOF
                        </a>
                     )}
                  </div>
                  );
               }) : (
                  <div className="p-8 border-2 border-dashed border-[#292724] flex items-center justify-center">
                     <span className="text-xs uppercase tracking-widest font-bold text-[#292724]">NO RECORDS FOUND</span>
                  </div>
               )}
            </div>
         </div>

         <RecentActivitySection
           activity={profile.recentActivity}
           variant="hustler"
           autoScroll={profile.autoScroll}
         />

         {/* ACTIONS SECTION */}
         <div className="flex flex-col sm:flex-row">
            <a href={email ? `mailto:${email}` : '#'} className="flex-1 p-8 bg-[#D64924] text-[#EAE8E3] flex items-center justify-between hover:bg-[#EAE8E3] hover:text-[#D64924] transition-colors border-b-2 sm:border-b-0 sm:border-r-2 border-[#EAE8E3] cursor-pointer group">
               <span className="text-sm uppercase tracking-[0.2em] font-bold">Get In Touch</span>
               <span className="text-3xl group-hover:translate-x-4 transition-transform">→</span>
            </a>
            <button onClick={handleSave} className="sm:w-[320px] p-8 bg-[#292724] text-[#EAE8E3] flex items-center justify-center gap-3 hover:bg-[#EAE8E3] hover:text-[#292724] transition-colors group">
               <span className="text-[11px] uppercase tracking-[0.2em] font-bold">Save Contact</span>
               <span className="text-lg opacity-0 -translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all">↓</span>
            </button>
         </div>

      </div>

      {/* Toast Notification */}
      {toastVisible && (
        <div className="fixed bottom-8 right-8 bg-[#292724] border-2 border-[#292724] text-[#EAE8E3] px-6 py-4 shadow-2xl z-50 flex items-center gap-4 text-[10px] font-bold tracking-widest uppercase hustler-organic-sm animate-in fade-in slide-in-from-bottom-4">
          <span className="w-2 h-2 rounded-full bg-[#D64924] animate-pulse" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}


// --- 05 INFLUENCER --- //

const getAestheteSocialIcon = (label?: string, url?: string, icon?: string) => {
  return getSocialSvgPath(label, url, icon);
};

function AestheteTemplate({ profile }: any) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const firstName = profile.name?.split(' ')[0] || "Aesthete";
  const lastName = profile.name?.split(' ').slice(1).join(' ') || "";

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const hasMore = el.scrollHeight - el.clientHeight > 40;
    const isAtTop = el.scrollTop < 30;
    setShowScrollHint(hasMore && isAtTop);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const hasMore = el.scrollHeight - el.clientHeight > 40;
    const isAtTop = el.scrollTop < 30;
    setShowScrollHint(hasMore && isAtTop);
  };
  
  return (
    <div className="w-full min-h-screen bg-[#EAE7E0] flex items-center justify-center p-0 md:p-8 overflow-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,700;1,6..96,400&family=Inter:wght@300;400;500&display=swap');
        
        .font-bodoni {
          font-family: 'Bodoni Moda', serif;
        }
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        .editorial-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .editorial-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .editorial-scroll::-webkit-scrollbar-thumb {
          background: rgba(41, 40, 38, 0.15);
          border-radius: 4px;
        }
        .editorial-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(41, 40, 38, 0.35);
        }
        .editorial-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(41, 40, 38, 0.15) transparent;
        }
        
        .editorial-image {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          transition: clip-path 1.2s cubic-bezier(0.19, 1, 0.22, 1), transform 1.2s ease;
        }
        .editorial-column:hover .editorial-image {
          clip-path: polygon(4% 4%, 96% 4%, 96% 96%, 4% 96%);
          transform: scale(1.02);
        }
        
        .link-item {
          position: relative;
          display: inline-block;
        }
        .link-item::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0%;
          height: 1px;
          background-color: #292826;
          transition: width 0.6s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .link-item-wrapper:hover .link-item::before {
          width: 100%;
        }
      `}</style>

      <div className="w-full max-w-[1600px] md:h-[90vh] bg-[#F5F3EF] md:rounded-[2px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] flex flex-col md:flex-row relative overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center p-5 border-b border-[#292826]/10 bg-[#F5F3EF] z-20">
          <span className="font-inter text-[10px] tracking-[0.25em] uppercase text-[#292826]">The Aesthete</span>
          <span className="font-inter text-[9px] tracking-[0.2em] uppercase text-[#292826]/50">{profile.role || 'Digital Creator'}</span>
        </div>

        {/* Left Column: Visual Canvas */}
        <div className="editorial-column w-full md:w-[50%] h-[50vh] md:h-full relative overflow-hidden bg-[#E2DED5] cursor-crosshair">
          {profile.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              alt={profile.name} 
              className="editorial-image w-full h-full object-cover grayscale-[0.05] contrast-[1.05] object-center"
            />
          ) : (
            <div className="editorial-image w-full h-full flex items-center justify-center bg-[#E2DED5]">
              <span className="font-bodoni italic text-3xl text-[#292826]/20">Canvas</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/5 pointer-events-none transition-opacity duration-1000" />
          
          <div className="hidden md:flex absolute top-8 left-8 flex-col text-[#F5F3EF] mix-blend-difference pointer-events-none z-10">
            <span className="font-inter text-[10px] tracking-[0.3em] uppercase opacity-80">Portfolio</span>
            <span className="w-8 h-px bg-[#F5F3EF] mt-2 opacity-50" />
          </div>
        </div>

        {/* Right Column: Viewport & Unified Scroll Container */}
        <div className="w-full md:w-[50%] h-auto md:h-full relative flex flex-col bg-[#F5F3EF]">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-y-auto editorial-scroll flex flex-col text-[#292826] p-8 md:p-10 lg:p-14"
          >
            {/* Title Section */}
            <div className="mb-10">
              <span className="inline-block px-3 py-1 mb-4 rounded-full border border-[#A39686]/30 text-[#A39686] font-inter text-[9px] tracking-[0.2em] uppercase">
                {profile.role || 'Digital Creator'}
              </span>
              <h1 className="font-bodoni text-5xl sm:text-6xl lg:text-7xl text-[#292826] leading-[0.9] tracking-tight uppercase break-words">
                {firstName} <br />
                <span className="italic normal-case text-[#A39686] font-medium">{lastName}</span>
              </h1>
            </div>

            {/* Headline Block */}
            <div className="pl-6 border-l border-[#A39686]/40 mb-10">
              <h2 className="font-bodoni text-2xl md:text-3xl text-[#292826] leading-[1.2] mb-3">
                {profile.headline || 'My world is my canvas.'}
              </h2>
              <p className="font-inter text-sm md:text-base text-[#73706A] leading-relaxed font-light">
                {profile.bio || 'Fashion, beauty, lifestyle. Elegant, curated, premium. Editorial magazine aesthetic, sophisticated typography.'}
              </p>
            </div>

            {/* The Philosophy */}
            <div className="mb-10 p-6 bg-[#EBE8E3] border border-[#292826]/5 rounded-sm">
               <h3 className="font-inter text-[9px] tracking-[0.2em] uppercase text-[#292826]/40 mb-3 flex items-center gap-2">
                 <span className="w-4 h-px bg-[#292826]/20"></span>
                 Signature Philosophy
               </h3>
               <p className="font-bodoni italic text-[#292826]/80 leading-relaxed text-base">
                 "Curating the space between modern minimalism and timeless elegance. Every detail is an intentional choice towards a beautiful existence."
               </p>
            </div>

            {/* Structured Proof Points */}
            {profile.proofPoints && profile.proofPoints.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
                {profile.proofPoints.map((point: any, i: number) => (
                  <div key={i} className="flex flex-col">
                    <span className="font-bodoni text-3xl text-[#292826] mb-1">{point.value}</span>
                    <span className="font-inter text-[9px] tracking-[0.2em] uppercase text-[#A39686]">{point.type}</span>
                    <div className="w-full h-px bg-[#292826]/5 mt-3" />
                  </div>
                ))}
              </div>
            )}

            {/* Recent Social Activity */}
            <div className="mb-10">
              <RecentActivitySection
                activity={profile.recentActivity}
                variant="aesthete"
                autoScroll={profile.autoScroll}
              />
            </div>

            {/* Link Directory */}
            {profile.links && profile.links.length > 0 && (
              <div className="mb-10 pt-4">
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-inter text-[9px] tracking-[0.2em] uppercase text-[#292826]/40">Featured Directories</span>
                  <div className="flex-1 h-px bg-[#292826]/10" />
                </div>

                <div className="flex flex-col gap-4">
                  {profile.links.map((link: any, i: number) => (
                    <a 
                      key={i} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link-item-wrapper group flex items-center justify-between cursor-pointer py-1"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#292826]/5 flex items-center justify-center text-[#292826]/40 group-hover:bg-[#A39686] group-hover:text-[#F5F3EF] transition-colors duration-500">
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            {getAestheteSocialIcon(link.label, link.url, link.icon)}
                          </svg>
                        </div>
                        <span className="link-item font-inter text-base md:text-lg text-[#292826] tracking-wide">
                          {link.label}
                        </span>
                      </div>
                      <div className="text-[#292826]/20 group-hover:text-[#A39686] transition-colors duration-500">
                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Get in Touch CTA */}
            <div className="my-8">
              <a 
                href={profile.email ? `mailto:${profile.email}` : '#'} 
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#292826] text-[#F5F3EF] font-inter text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-[#A39686] transition-colors duration-300 rounded-sm w-full sm:w-auto"
              >
                <span>Get in Touch</span>
                <span className="text-sm">↗</span>
              </a>
            </div>

            {/* Footer */}
            <div className="pt-8 mt-auto border-t border-[#292826]/10">
               <div className="flex justify-between items-center text-[#292826]/40 font-inter text-[9px] tracking-[0.2em] uppercase">
                  <span>© {new Date().getFullYear()}</span>
                  <span>The Aesthete</span>
               </div>
            </div>
          </div>

          {/* Floating Scroll Indicator - fixed to right column viewport, only visible when more content exists below AND user is at the top */}
          <div className={`hidden md:flex absolute bottom-8 right-8 flex-col items-center gap-3 transition-opacity duration-500 pointer-events-none z-50 ${showScrollHint ? 'opacity-40' : 'opacity-0'}`}>
             <span className="font-inter text-[8px] tracking-[0.3em] uppercase text-[#292826] rotate-90 mb-6">Scroll</span>
             <svg className="w-4 h-4 text-[#292826] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
             </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatorTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#7C3AED';
  const proofs = profile?.proofPoints || profile?.proofs || [];
  
  // Custom chamfered shape string
  const chamferedShape = 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)';
  const avatarShape = 'polygon(30% 0%, 100% 0, 100% 70%, 70% 100%, 0 100%, 0 30%)';

  return (
    <div className="min-h-screen w-full bg-[#EBE4DB] text-[#1E293B] p-6 md:p-12 font-sans flex justify-center selection:bg-purple-200" style={{ background: 'linear-gradient(145deg, #FFF6E5 0%, #F5E6FE 100%)' }}>
      <div className="max-w-4xl w-full pt-16 pb-24 px-8 md:px-16 flex flex-col items-center space-y-10 bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] rounded-[3rem] my-8">
        
        {/* Avatar with unique shape */}
        <div className="relative group">
          <div 
            className="absolute -inset-2 blur-md opacity-40 group-hover:opacity-80 transition duration-1000 group-hover:duration-200 animate-pulse" 
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${accent}, #FF0080)`,
              clipPath: avatarShape 
            }} 
          />
          <img 
            src={profile.avatarUrl} 
            alt={profile.name} 
            className="relative w-48 h-48 md:w-64 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105 bg-white shadow-sm"
            style={{ clipPath: avatarShape }}
          />
          {/* Decorative Corner Borders */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-zinc-300 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-zinc-300 pointer-events-none" />
        </div>
        
        <div className="text-center space-y-3">
           <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase" style={{ textShadow: `2px 2px 0 ${accent}20` }}>
             {profile.name}
           </h1>
           <p className="text-slate-600 font-bold text-xl tracking-widest uppercase">{profile.headline}</p>
           <p className="max-w-xl text-sm md:text-base text-slate-700 mt-6 leading-relaxed mx-auto font-medium border-l-4 pl-6 text-left" style={{ borderColor: accent }}>{profile.bio}</p>
        </div>

        {/* METRICS SECTION WITH CHAMFERED CARDS */}
        {profile.metrics && profile.metrics.length > 0 && (
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {profile.metrics.map((metric: any, i: number) => (
              <div 
                key={i} 
                className="bg-white/60 backdrop-blur-md p-6 flex flex-col items-center text-center hover:bg-white/90 transition-all relative group border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
                style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
              >
                {/* Accent bar */}
                <div className="absolute top-0 left-0 w-full h-1 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: accent }} />
                <span className="text-3xl font-black mb-1 text-slate-900">{metric.value}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{metric.label || metric.title || metric.type || metric.name}</span>
                {metric.description && metric.description !== (metric.label || metric.title || metric.type || metric.name) && (
                  <span className="text-[9px] text-slate-400 mt-2 uppercase">{metric.description}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PROOF POINTS SECTION */}
        {proofs.length > 0 && (
          <div className="w-full mt-12 flex flex-col gap-4">
             <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] tracking-widest uppercase font-bold text-slate-500">Credentials & Milestones</span>
                <div className="flex-1 h-px bg-slate-300/50" />
             </div>
             {proofs.filter((p: any) => p.type || p.title || p.label).map((proof: any, i: number) => (
                <div 
                  key={i} 
                  className="bg-white/50 backdrop-blur-sm hover:bg-white/80 p-6 flex flex-col md:flex-row justify-between items-start md:items-center transition-all group relative border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)]"
                  style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: accent }} />
                  <div className="flex flex-col gap-1 pr-6 pl-2">
                     <div className="flex items-baseline gap-3">
                        <span className="text-xl md:text-2xl font-black text-slate-800">{proof.type || proof.title || proof.label}</span>
                        {proof.value && (
                           <span className="text-lg md:text-xl font-bold" style={{ color: accent }}>{proof.value}</span>
                        )}
                     </div>
                     {proof.description && (
                        <span className="text-sm text-slate-500 font-medium">{proof.description}</span>
                     )}
                  </div>
                  {proof.url && (
                     <a href={proof.url} target="_blank" rel="noopener noreferrer" className="mt-4 md:mt-0 text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-slate-900 transition-colors border-b border-slate-300 hover:border-slate-900 pb-1 shrink-0">
                        View Proof ↗
                     </a>
                  )}
                </div>
             ))}
          </div>
        )}

        <RecentActivitySection
          activity={profile.recentActivity}
          variant="creator"
          accentColor={accent}
          autoScroll={profile.autoScroll}
        />

        {/* LINKS WITH UNIQUE GEOMETRY */}
        <div className="w-full grid gap-4 mt-8 pb-12">
          {profile.links?.map((link: any, i: number) => (
            <a 
              key={i} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="relative w-full h-20 md:h-24 bg-gradient-to-r from-white/60 to-white/90 backdrop-blur-md p-[2px] group shadow-sm"
              style={{ clipPath: chamferedShape }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div 
                className="w-full h-full bg-white/80 relative z-10 flex items-center px-6"
                style={{ clipPath: 'polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)' }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-slate-50/80 to-transparent pointer-events-none" style={{ background: `linear-gradient(to left, ${accent}15, transparent)` }} />
                
                {/* SVG Icon Container with geometric shape */}
                <div 
                  className="bg-white p-3 mr-6 flex items-center justify-center w-12 h-12 group-hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                >
                  <svg className="w-5 h-5 text-slate-700 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                     {getAestheteSocialIcon(link.label, link.url, link.icon)}
                  </svg>
                </div>
                <span className="text-lg md:text-xl font-bold uppercase tracking-wide group-hover:text-slate-900 text-slate-700 transition-colors">{link.label}</span>
                
                {/* Right decorative elements */}
                <div className="absolute right-6 flex items-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                   <span className="text-[10px] tracking-widest uppercase mr-4" style={{ color: accent }}>Execute</span>
                   <div className="w-4 h-px bg-current" style={{ color: accent }}></div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Get in Touch CTA */}
        <div className="w-full my-4">
          <a 
            href={profile.email ? `mailto:${profile.email}` : '#'} 
            className="inline-flex items-center justify-between w-full p-4 px-6 text-white font-bold tracking-wider uppercase text-base transition-all hover:brightness-110 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${accent}, #111)`, clipPath: chamferedShape }}
          >
            <span className="flex items-center gap-2"><span>✉</span> Get in Touch</span>
            <span>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function VoiceTemplate({ profile }: any) {
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => {
      setToastVisible(false);
    }, 2200);
    setToastTimer(timer);
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

    .voice-template {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #2B2321;
      line-height: 1.5;
    }
    
    .voice-template .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }
    
    .voice-template .btn-primary {
      background-color: #DF5B4C;
      color: #FFFAF3;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .voice-template .btn-primary:hover {
      background-color: #B8473D;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(184, 71, 61, 0.2);
    }
    
    .voice-template .btn-secondary {
      background-color: transparent;
      border: 1px solid #8DA396;
      color: #1C2B21;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .voice-template .btn-secondary:hover {
      background-color: #C6D4CB;
      border-color: #1C2B21;
    }

    .voice-template .paper-card {
      background: linear-gradient(135deg, #E2EAE5 0%, #D0DDD5 100%);
      border-radius: 24px;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 
        10px 10px 30px rgba(168, 184, 157, 0.3), 
        -10px -10px 30px rgba(255, 255, 255, 0.8),
        inset 1px 1px 3px rgba(255, 255, 255, 0.6);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }
    .voice-template .paper-card:hover {
      box-shadow: 
        12px 12px 36px rgba(168, 184, 157, 0.4), 
        -12px -12px 36px rgba(255, 255, 255, 1);
      transform: translateY(-2px);
    }

    .voice-template .section-divider {
      height: 1px;
      background-color: rgba(169, 156, 145, 0.3);
      width: 100%;
    }

    .voice-template .arch-image {
      border-top-left-radius: 200px;
      border-top-right-radius: 200px;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
      object-fit: cover;
    }
  `;

  const metrics = profile.metrics || [];
  const links = profile.links || [];
  const proofs = profile.proofs || [];
  const statement = profile.metadata?.statement;
  const statementSub = profile.metadata?.statementSub;

  let sectionCounter = 1;
  const getSectionNumber = () => `0${sectionCounter++}`;

  const getSocialIcon = (url: string, label: string, icon?: string | null) => {
    return <SocialIcon label={label} url={url} icon={icon ?? undefined} className="w-5 h-5 fill-current" />;
  };

  return (
    <div className="voice-template w-full min-h-screen bg-white p-6 md:p-8 lg:p-12 flex justify-center">
      <style>{customStyles}</style>

      {/* Main Card Wrapper */}
      <div className="w-full max-w-[1200px] bg-[#EBF0EC] rounded-[32px] md:rounded-[48px] shadow-2xl relative overflow-hidden flex justify-center py-10 md:py-16 px-6 md:px-12 lg:px-16 border border-[#8DA396]/20">
        
        {/* Main Content Container */}
        <div className="w-full max-w-[960px] mx-auto relative z-10">
          
          {/* Header */}
          <header className="flex justify-between items-center pb-6 mb-8 md:mb-12">
            <div className="flex items-center gap-2">
               <div className="w-4 h-4 bg-[#DF5B4C] rounded-sm transform rotate-45"></div>
               <span className="font-bold tracking-widest text-xs uppercase">The Voice</span>
            </div>
          </header>

          {/* 1. Hero */}
          <section className="flex flex-col-reverse md:flex-row gap-10 md:gap-8 items-center md:items-start mb-16 md:mb-24">
            <div className="w-full md:w-1/2 flex flex-col justify-center mt-2 md:mt-10 text-center md:text-left items-center md:items-start">
              <p className="text-[#8DA396] text-xs font-bold tracking-[0.2em] uppercase mb-4 md:mb-6 flex items-center justify-center md:justify-start gap-4 w-full">
                <span className="w-8 h-px bg-[#8DA396] hidden md:block"></span>
                A voice in progress
              </p>
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] text-[#1C2B21] mb-5 tracking-tight">
                {profile.name?.split(' ')[0] || "Name"} <br className="hidden md:block" />
                <span className="text-[#DF5B4C] italic pr-0 md:pr-4">{profile.name?.split(' ').slice(1).join(' ')}</span>
              </h1>
              {profile.headline && (
                <p className="text-base md:text-lg text-[#5C7464] font-medium mb-5">
                  {profile.headline}
                </p>
              )}
              {profile.bio && (
                <p className="text-sm md:text-base text-[#1C2B21] max-w-sm leading-relaxed mb-8">
                  {profile.bio}
                </p>
              )}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <a href={profile.email ? `mailto:${profile.email}` : '#'} className="btn-primary w-full sm:w-auto justify-center px-6 py-3 rounded-full font-semibold text-sm tracking-wide flex items-center gap-2 group">
                  Get in touch
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </a>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
                    showToast('Profile link copied!');
                  }}
                  className="btn-secondary w-full sm:w-auto justify-center px-6 py-3 rounded-full font-semibold text-sm tracking-wide flex items-center gap-2 group">
                  Share profile
                  <ArrowRight className="w-4 h-4 transform rotate-[-45deg] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 flex justify-center md:justify-end relative mt-4 md:mt-0">
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.name} 
                  className="arch-image w-full max-w-[320px] md:max-w-[380px] h-[380px] md:h-[480px] object-cover shadow-xl relative z-0"
                />
              ) : (
                <div className="arch-image w-full max-w-[320px] md:max-w-[380px] h-[380px] md:h-[480px] bg-[#C6D4CB] flex items-center justify-center shadow-xl relative z-0">
                  <span className="font-serif text-4xl text-[#5C7464] opacity-50">Profile</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 md:bottom-8 md:left-12 text-white text-xs font-bold tracking-widest uppercase z-10 drop-shadow-md">
                {new Date().getFullYear()} / Profile
              </div>
            </div>
          </section>

          {/* 2. Point of View */}
          {statement && (
            <section className="mb-16 md:mb-24 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-[250px] h-[250px] rounded-full bg-[#E5C58A] opacity-30 blur-3xl -z-10 pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-16 relative z-10">
                <div className="relative">
                  <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest block md:absolute md:-left-10 md:top-2 mb-3 md:mb-0">{getSectionNumber()}</span>
                  <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl leading-[1.1] text-[#1C2B21] max-w-2xl relative z-10">
                    <span className="absolute -left-2 md:-left-6 -top-3 md:-top-6 text-5xl md:text-7xl text-[#E5C58A] opacity-60 -z-10 select-none">“</span>
                    {statement}
                  </h2>
                </div>
                {statementSub && (
                  <div className="md:w-1/3 md:pb-2 border-l-2 border-[#8DA396]/40 pl-4 md:border-none md:pl-0">
                    <p className="text-[#5C7464] leading-relaxed text-sm">
                      {statementSub}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 3. Proof */}
          {metrics && metrics.length > 0 && (
            <section className="mb-16 md:mb-24">
              <div className="flex items-center justify-between mb-6 md:mb-10 relative">
                <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest md:absolute md:-left-10">{getSectionNumber()}</span>
                <span className="text-[#8DA396] text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase ml-auto">A little proof</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 pl-0 md:pl-6">
                {metrics.map((metric: any, i: number) => (
                  <div key={i} className="flex flex-col border-t border-[#8DA396]/30 pt-4 md:pt-5">
                    <span className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#D99441] mb-1">{metric.value}</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#5C7464]">{metric.label || metric.title || metric.type || metric.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3.5 Proof Points */}
          {proofs && proofs.length > 0 && (
            <section className="mb-16 md:mb-24 relative">
              <div className="flex items-center justify-between mb-6 md:mb-10 relative">
                  <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest md:absolute md:-left-10">{getSectionNumber()}</span>
                  <span className="text-[#8DA396] text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase ml-auto">Proof Points</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-0 md:pl-6">
                {proofs.map((proof: any, i: number) => (
                  <div key={i} className="paper-card p-4 md:p-6 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      {proof.icon && <span className="text-[#D99441] text-xl">{proof.icon}</span>}
                      <h3 className="font-bold text-[#1C2B21] text-base md:text-lg">{proof.title || proof.type}</h3>
                    </div>
                    {proof.value && (
                       <p className="text-[#D99441] font-serif text-3xl md:text-4xl mt-3">{proof.value}</p>
                    )}
                    {proof.description && (
                       <p className="text-xs md:text-sm text-[#5C7464] mt-1">{proof.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Links */}
          {links && links.length > 0 && (
            <section className="mb-16 md:mb-24 relative">
              <div className="flex items-center justify-between mb-6 md:mb-10 relative">
                  <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest md:absolute md:-left-10">{getSectionNumber()}</span>
                  <span className="text-[#8DA396] text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase ml-auto">Official Links</span>
              </div>
              
              <div className="flex flex-col gap-3 pl-0 md:pl-6">
                {links.map((link: any, i: number) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="paper-card px-6 py-4 md:px-8 md:py-6 flex items-center justify-between group">
                    <div className="flex items-center gap-4 md:gap-6 z-10 relative">
                      <div className="w-12 h-12 rounded-full bg-[#C6D4CB] text-[#DF5B4C] flex items-center justify-center group-hover:bg-[#DF5B4C] group-hover:text-white transition-colors shrink-0 shadow-inner">
                          {getSocialIcon(link.url, link.label, link.icon)}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1C2B21] text-base md:text-lg group-hover:text-[#DF5B4C] transition-colors">{link.label}</h3>
                        <p className="text-sm text-[#5C7464] mt-0.5 truncate max-w-[150px] sm:max-w-[300px] md:max-w-[400px]">
                          {link.url.replace(/^https?:\/\/(www\.)?/, '')}
                        </p>
                      </div>
                    </div>
                    <div className="text-[#8DA396] group-hover:text-[#DF5B4C] transition-colors pl-4 shrink-0">
                      <ArrowRight className="w-5 h-5 transform rotate-[-45deg] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          <RecentActivitySection
            activity={profile.recentActivity}
            variant="voice"
            autoScroll={profile.autoScroll}
          />

          {/* Footer */}
          <section className="relative mt-16 md:mt-24 pt-6 border-t border-[#8DA396]/30">
            <footer className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 text-[9px] font-bold tracking-[0.2em] uppercase text-[#8DA396]">
              <div className="flex items-center gap-2">
                <span className="text-[#1C2B21]">{profile.name?.toUpperCase() || "PROFILE"}</span>
              </div>
              <div className="text-center text-[#5C7464]">
                MATERIAL DRAWING / THE VOICE.
              </div>
              <div>
                &copy; {new Date().getFullYear()}
              </div>
            </footer>
          </section>

        </div>
      </div>
      
      {/* Toast */}
      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1C2B21] text-[#EBF0EC] px-6 py-3 rounded-full text-sm font-medium shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <BadgeCheck className="w-5 h-5 text-[#DF5B4C]" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}

// A dynamic template that adjusts its vibe based on the selected identity template ID.
export function IdentityTemplate(props: TemplateProps & { templateId: string }) {
  const { templateId, profile } = props;
  const openToIntents: string[] = (profile as any).openTo || [];
  const recentActivity = (profile as any).recentActivity ?? null;
  const autoScroll: boolean = (profile as any).autoScroll ?? false;
  const accentColor: string | undefined = (profile as any).theme?.accentColor;

  // Templates with dark backgrounds need light-adjusted badge / activity styling
  const darkTemplates = ['lone', 'rebellion', 'the-builder', 'the-hustler', 'the-visionary', 'the-creator', 'the-studio'];
  const isDark = darkTemplates.includes(templateId);

  let content: React.ReactNode;
  switch (templateId) {
    // Individual
    case 'lover': content = <LoverTemplate {...props} />; break;
    case 'lone': content = <LoneTemplate {...props} />; break;
    case 'energy': content = <EnergyTemplate {...props} />; break;
    // Startup
    case 'rebellion': content = <RebellionTemplate {...props} />; break;
    case 'vision': content = <VisionTemplate {...props} />; break;
    case 'human': content = <HumanTemplate {...props} />; break;
    // Agency
    case 'the-machine': content = <MachineTemplate {...props} />; break;
    case 'the-club': content = <ClubTemplateV2 {...props} />; break;
    case 'the-studio': content = <StudioTemplate {...props} />; break;
    // Entrepreneur
    case 'the-builder': content = <BuilderTemplate {...props} />; break;
    case 'the-visionary': content = <VisionaryTemplate {...props} />; break;
    case 'the-hustler': content = <HustlerTemplate {...props} />; break;
    // Influencer
    case 'the-aesthete': content = <AestheteTemplate {...props} />; break;
    case 'the-creator': content = <CreatorTemplate {...props} />; break;
    case 'the-voice': content = <VoiceTemplate {...props} />; break;
    default: content = <LoneTemplate {...props} />; break;
  }

  if (!openToIntents || openToIntents.length === 0) {
    return <>{content}</>;
  }

  // Render template with floating Open To badges
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {content}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          padding: '8px 14px',
          borderRadius: 20,
          backgroundColor: isDark ? 'rgba(15, 15, 15, 0.85)' : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
          boxShadow: isDark
            ? '0 4px 24px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)'
            : '0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          maxWidth: '90vw',
        }}
      >
        <OpenToBadges intents={openToIntents} compact darkMode={isDark} />
      </div>
    </div>
  );
}

