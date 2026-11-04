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

export function VisionaryTemplate({ profile, onLinkClick }: any) {
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
