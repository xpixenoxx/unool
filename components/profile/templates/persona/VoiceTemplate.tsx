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

export function VoiceTemplate({ profile }: any) {
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
