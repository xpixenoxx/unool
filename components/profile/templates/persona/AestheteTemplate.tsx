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

export function AestheteTemplate({ profile }: any) {
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
