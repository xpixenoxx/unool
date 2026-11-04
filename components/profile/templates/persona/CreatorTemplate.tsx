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
import { getAestheteSocialIcon } from './templateUtils';

export function CreatorTemplate({ profile, accentColor }: any) {
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
