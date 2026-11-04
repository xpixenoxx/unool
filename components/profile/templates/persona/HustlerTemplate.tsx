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

export function HustlerTemplate({ profile }: any) {
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
