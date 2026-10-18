'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ExternalLink, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Globe, 
  Share2, 
  Check, 
  Copy, 
  Sparkles, 
  BadgeCheck, 
  AlignLeft,
  Eye,
  X
} from 'lucide-react';

export interface MaterialItem {
  id: string;
  type: 'image' | 'pdf' | 'doc' | 'website' | 'text' | 'page';
  title: string;
  description?: string;
  content?: string; // Rich text / notes / specs
  url?: string;
  thumbnailUrl?: string;
  category?: string;
  size?: string;
  order?: number;
}

export interface BrandMaterialsPageData {
  id?: string;
  slug?: string;
  title: string;
  tagline?: string | null;
  description?: string | null;
  materials: MaterialItem[];
  theme?: {
    accentColor?: string;
    template?: string;
  };
  is_published?: boolean;
}

export interface CreatorProfile {
  name?: string;
  subdomain: string;
  avatarUrl?: string | null;
  role?: string | null;
  company?: string | null;
  bio?: string | null;
}

interface Props {
  subdomain: string;
  slug?: string;
  pageData: BrandMaterialsPageData;
  profile?: CreatorProfile | null;
  appUrl?: string;
  liveTemplate?: string;
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Clean helper for masking Cloudflare URLs
function maskCloudflareUrl(url?: string | null): string {
  if (!url) return '';
  const matchR2Dev = url.match(/https?:\/\/[^/]+\.r2\.dev\/(.+)$/);
  if (matchR2Dev) return `/api/media/${matchR2Dev[1]}`;
  const matchR2Storage = url.match(/https?:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+\/(.+)$/);
  if (matchR2Storage) return `/api/media/${matchR2Storage[1]}`;
  return url;
}

export default function BrandMaterialsPageView({
  subdomain,
  slug,
  pageData,
  profile,
  liveTemplate = 'the-voice',
  searchParams,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [copiedContent, setCopiedContent] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<MaterialItem | null>(null);

  // Template theme detection
  const resolvedTemplate = (liveTemplate || pageData.theme?.template || 'the-voice').toLowerCase();
  const isVoice = resolvedTemplate === 'the-voice' || resolvedTemplate === 'voice';
  const isLone = resolvedTemplate === 'lone' || resolvedTemplate === 'the-lone';
  const isLover = resolvedTemplate === 'lover' || resolvedTemplate === 'the-lover';

  // Accent color tailored to template
  const accent = isVoice 
    ? '#DF5B4C' 
    : isLone 
    ? '#2C3480' 
    : isLover 
    ? '#E11D48' 
    : pageData.theme?.accentColor || '#8B5CF6';

  const materials = useMemo(() => {
    return (pageData.materials || []).map(m => ({
      ...m,
      url: maskCloudflareUrl(m.url),
      thumbnailUrl: m.thumbnailUrl ? maskCloudflareUrl(m.thumbnailUrl) : undefined,
    }));
  }, [pageData.materials]);

  // Read target item parameter without any technical "query string" jargon
  const rawTargetQuery = searchParams?.item || searchParams?.file || searchParams?.product || searchParams?.material || '';
  const targetSlug = String(rawTargetQuery).trim();

  // Selected or primary material to preview directly in the card
  const selectedMaterial = useMemo(() => {
    if (materials.length === 0) return null;
    if (!targetSlug) return materials[0];

    const qLower = targetSlug.toLowerCase();
    const match = materials.find((m) => {
      const slugTitle = m.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      return (
        m.id.toLowerCase() === qLower ||
        slugTitle === qLower ||
        slugTitle.includes(qLower) ||
        qLower.includes(slugTitle) ||
        m.title.toLowerCase().includes(qLower)
      );
    });

    return match || materials[0];
  }, [materials, targetSlug]);

  // Canonical live page URL that redirects directly back to user's live page
  const livePageHref = typeof window !== 'undefined' && window.location.hostname.endsWith('.unool.co')
    ? `https://${subdomain}.unool.co/`
    : `/u/${subdomain}`;
  const profileUrl = livePageHref;

  // Clean canonical page URL for this specific post/brand page
  const effectiveSlug = slug || pageData.slug || '';
  const currentItemParam = selectedMaterial ? encodeURIComponent(selectedMaterial.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_').substring(0, 40)) : '';
  const pageUrl = (effectiveSlug && effectiveSlug !== 'showcase')
    ? `https://${subdomain}.unool.co/${effectiveSlug}`
    : `https://${subdomain}.unool.co/${currentItemParam ? `?item=${currentItemParam}` : ''}`;

  const copyPageLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const copyItemLink = (item: MaterialItem) => {
    const slugified = encodeURIComponent(
      item.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_').substring(0, 40)
    );
    const directUrl = `https://${subdomain}.unool.co/?item=${slugified}`;
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(directUrl);
      setCopiedItemId(item.id);
      setTimeout(() => setCopiedItemId(null), 2000);
    }
  };

  const copyTextContent = (text: string) => {
    if (typeof window !== 'undefined' && text) {
      navigator.clipboard.writeText(text);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" style={{ color: isVoice ? '#DF5B4C' : '#10B981' }} />;
      case 'text':
        return <AlignLeft className="w-5 h-5" style={{ color: isVoice ? '#1D4ED8' : '#3B82F6' }} />;
      case 'pdf':
        return <FileText className="w-5 h-5" style={{ color: isVoice ? '#B8473D' : '#F43F5E' }} />;
      case 'doc':
        return <File className="w-5 h-5" style={{ color: isVoice ? '#B45309' : '#F59E0B' }} />;
      case 'website':
      case 'page':
      default:
        return <Globe className="w-5 h-5" style={{ color: isVoice ? '#1C2B21' : '#3B82F6' }} />;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // THEME 1: THE VOICE TEMPLATE (Matches user's live profile aesthetic)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isVoice) {
    return (
      <div className="voice-template-wrapper w-full min-h-screen bg-[#F7F9F7] text-[#2B2321] selection:bg-[#DF5B4C] selection:text-white antialiased flex flex-col items-center justify-start p-4 sm:p-6 md:p-10 lg:p-14">
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

          .voice-template-wrapper {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #2B2321;
            line-height: 1.5;
          }
          .voice-font-serif {
            font-family: 'Playfair Display', Georgia, serif;
          }
          .voice-btn-primary {
            background-color: #DF5B4C;
            color: #FFFAF3;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .voice-btn-primary:hover {
            background-color: #B8473D;
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(184, 71, 61, 0.25);
          }
          .voice-paper-card {
            background: linear-gradient(135deg, #E2EAE5 0%, #D0DDD5 100%);
            border-radius: 28px;
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 
              10px 10px 30px rgba(168, 184, 157, 0.3), 
              -10px -10px 30px rgba(255, 255, 255, 0.8),
              inset 1px 1px 3px rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.5);
          }
        ` }} />

        {/* Main Card Container */}
        <div className="w-full max-w-[1000px] bg-[#EBF0EC] rounded-[28px] sm:rounded-[36px] md:rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col py-8 md:py-14 px-5 sm:px-8 md:px-14 border border-[#8DA396]/30">
          
          {/* Header */}
          <header className="flex items-center justify-between gap-4 pb-6 mb-8 border-b border-[#8DA396]/20">
            <Link
              href={profileUrl}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/70 border border-[#8DA396]/30 hover:bg-white hover:border-[#1C2B21] transition-all group"
              title="Return to main profile page"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#D0DDD5] border border-white flex items-center justify-center shrink-0">
                {profile?.avatarUrl ? (
                  <img src={maskCloudflareUrl(profile.avatarUrl)} alt={profile.name || subdomain} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#1C2B21]">{(profile?.name || subdomain).charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#1C2B21] font-semibold">
                <ArrowLeft className="w-3.5 h-3.5 text-[#8DA396] group-hover:-translate-x-0.5 transition-transform" />
                <span>@{subdomain} Live Page</span>
                <BadgeCheck className="w-3.5 h-3.5 text-[#DF5B4C] fill-[#DF5B4C]" />
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-3 h-3 bg-[#DF5B4C] rounded-sm transform rotate-45" />
                <span className="font-bold tracking-widest text-xs uppercase text-[#1C2B21]">The Voice • Brand Hub</span>
              </div>
              <button
                onClick={copyPageLink}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/80 border border-[#8DA396]/30 text-[#1C2B21] hover:bg-white hover:border-[#1C2B21] transition-all shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#8DA396]" />}
                <span>{copied ? 'Link Copied!' : 'Share Showcase'}</span>
              </button>
            </div>
          </header>

          {/* Hero Header */}
          <section className="py-2 md:py-4 flex flex-col items-start gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#DF5B4C]/10 border border-[#DF5B4C]/20 text-[#DF5B4C]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Showcase</span>
            </div>

            <h1 className="voice-font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1C2B21] leading-[1.1] max-w-3xl">
              {pageData.title || `${profile?.name || 'Brand'} Showcase`}
            </h1>

            {pageData.tagline && (
              <p className="voice-font-serif text-base sm:text-xl text-[#2B2321]/80 italic max-w-2xl leading-relaxed">
                "{pageData.tagline}"
              </p>
            )}

            {pageData.description && (
              <p className="text-sm text-[#2B2321]/80 max-w-2xl leading-relaxed">
                {pageData.description}
              </p>
            )}
          </section>

          {/* ── Main Showcase Preview Card (Directly Previews Image / Material) ── */}
          {selectedMaterial ? (
            <section className="my-8 voice-paper-card p-6 sm:p-8 relative overflow-hidden">
              <div className="flex flex-col gap-6">
                
                {/* 1. Direct Image Preview right inside the card */}
                {selectedMaterial.type === 'image' && (
                  <div className="w-full rounded-2xl overflow-hidden bg-[#D0DDD5] border border-white/60 shadow-md">
                    <img
                      src={selectedMaterial.url}
                      alt={selectedMaterial.title}
                      className="w-full max-h-[540px] object-contain mx-auto bg-black/5"
                    />
                  </div>
                )}

                {/* 2. Direct Text Content Preview */}
                {selectedMaterial.type === 'text' && (
                  <div className="w-full p-6 sm:p-8 rounded-2xl bg-white/80 border border-[#8DA396]/30 shadow-inner">
                    <div className="text-xs font-bold tracking-wider uppercase text-[#1D4ED8] mb-2 flex items-center gap-2">
                      <AlignLeft size={14} />
                      <span>Document &amp; Text Story</span>
                    </div>
                    <div className="voice-font-serif text-base sm:text-lg text-[#1C2B21] leading-relaxed whitespace-pre-wrap">
                      {selectedMaterial.content || selectedMaterial.description}
                    </div>
                  </div>
                )}

                {/* Header info & Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#8DA396]/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/90 border border-[#8DA396]/30 flex items-center justify-center shrink-0">
                      {getMaterialIcon(selectedMaterial.type)}
                    </div>
                    <div>
                      <h2 className="voice-font-serif text-2xl sm:text-3xl font-bold text-[#1C2B21]">
                        {selectedMaterial.title}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-[#2B2321]/70 mt-1">
                        <span className="font-bold uppercase tracking-wider">{selectedMaterial.type}</span>
                        {selectedMaterial.size && <span>• {selectedMaterial.size}</span>}
                        {selectedMaterial.category && <span>• {selectedMaterial.category}</span>}
                      </div>
                      {selectedMaterial.description && selectedMaterial.type !== 'text' && (
                        <p className="text-xs sm:text-sm text-[#2B2321]/80 mt-2 max-w-xl">
                          {selectedMaterial.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {selectedMaterial.type === 'text' && (
                      <button
                        onClick={() => copyTextContent(selectedMaterial.content || selectedMaterial.description || '')}
                        className="voice-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold"
                        title="Copy text to clipboard"
                      >
                        {copiedContent ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedContent ? 'Copied Text' : 'Copy Text'}</span>
                      </button>
                    )}
                    {selectedMaterial.type === 'image' && (
                      <a
                        href={selectedMaterial.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="voice-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Image</span>
                      </a>
                    )}
                    {selectedMaterial.type === 'pdf' && (
                      <a
                        href={selectedMaterial.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="voice-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </a>
                    )}
                    {(selectedMaterial.type === 'website' || selectedMaterial.type === 'doc') && selectedMaterial.url && (
                      <a
                        href={selectedMaterial.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="voice-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold"
                      >
                        <span>Open Link</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => copyItemLink(selectedMaterial)}
                      className="p-2.5 rounded-full bg-white border border-[#8DA396]/30 text-[#1C2B21] hover:border-[#1C2B21] transition-all shadow-sm"
                      title="Copy link for this item"
                    >
                      {copiedItemId === selectedMaterial.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              </div>
            </section>
          ) : (
            <div className="voice-paper-card py-16 flex flex-col items-center justify-center text-center p-6 my-8">
              <h3 className="voice-font-serif text-xl font-bold text-[#1C2B21]">No materials available</h3>
              <p className="text-xs sm:text-sm text-[#2B2321]/70 max-w-sm mt-1">
                The creator has not placed materials in this hub yet.
              </p>
            </div>
          )}

          {/* ── More materials from this showcase (if multiple exist) ── */}
          {materials.length > 1 && (
            <section className="mt-6 pt-6 border-t border-[#8DA396]/20">
              <h3 className="voice-font-serif text-lg font-bold text-[#1C2B21] mb-4">
                Other Materials from @{subdomain}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {materials.filter(m => m.id !== selectedMaterial?.id).map((item, idx) => (
                  <Link
                    key={item.id || idx}
                    href={`/u/${subdomain}?item=${encodeURIComponent((item.title || 'asset').toLowerCase().replace(/[^a-z0-9_-]/g, '_'))}`}
                    className="p-4 rounded-2xl bg-white/70 border border-[#8DA396]/30 hover:bg-white hover:border-[#1C2B21] transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#E2EAE5] flex items-center justify-center shrink-0">
                      {getMaterialIcon(item.type)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-sm text-[#1C2B21] truncate group-hover:text-[#DF5B4C] transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#2B2321]/60 uppercase tracking-wider">
                        {item.type} {item.size ? `• ${item.size}` : ''}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          {/* ── Redirect to User's Main Live Page Banner ── */}
          <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-white/70 border border-[#8DA396]/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-[#D0DDD5] border-2 border-white flex items-center justify-center shrink-0 shadow-sm">
                {profile?.avatarUrl ? (
                  <img src={maskCloudflareUrl(profile.avatarUrl)} alt={profile.name || subdomain} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-[#1C2B21]">{(profile?.name || subdomain).charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="font-bold text-[#1C2B21] text-sm sm:text-base flex items-center gap-1.5">
                  <span>{profile?.name || `@${subdomain}`}</span>
                  <BadgeCheck className="w-4 h-4 text-[#DF5B4C] fill-[#DF5B4C]" />
                </div>
                <div className="text-xs text-[#2B2321]/70 mt-0.5">
                  Explore full live profile, social links, updates &amp; creations
                </div>
              </div>
            </div>
            <Link
              href={profileUrl}
              className="voice-btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold shrink-0 shadow-sm"
            >
              <span>Visit Live Page</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>

          {/* Footer */}
          <footer className="mt-8 pt-6 border-t border-[#8DA396]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#2B2321]/60">
            <div className="flex items-center gap-2">
              <span>Curated by</span>
              <Link href={profileUrl} className="text-[#1C2B21] font-bold underline underline-offset-4">
                @{subdomain}
              </Link>
              <span>•</span>
              <span>The Voice Theme</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={copyPageLink}
                className="hover:text-[#1C2B21] transition-colors flex items-center gap-1 font-semibold"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
              <span>•</span>
              <span className="voice-font-serif tracking-widest text-[#1C2B21] font-bold">UNOOL</span>
            </div>
          </footer>

        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // THEME 2: DARK / LONE / MODERN TEMPLATE
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#08090C] text-[#F4EFE7] selection:bg-[#8B5CF6] selection:text-white font-sans antialiased relative overflow-x-hidden flex flex-col items-center p-4 sm:p-6 md:p-10">
      {/* Ambient background glows */}
      <div 
        className="pointer-events-none fixed top-[-100px] left-1/2 -translate-x-1/2 w-[900px] h-[550px] blur-[140px] opacity-25 rounded-full"
        style={{ background: `radial-gradient(ellipse at center, ${accent} 0%, rgba(18,61,255,0.4) 60%, transparent 100%)` }}
      />

      <div className="relative z-10 max-w-4xl w-full flex flex-col min-h-screen">
        
        {/* Navigation Bar */}
        <header className="flex items-center justify-between gap-4 pb-8 border-b border-white/10">
          <Link
            href={profileUrl}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all"
            title="Return to main profile page"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              {profile?.avatarUrl ? (
                <img src={maskCloudflareUrl(profile.avatarUrl)} alt={profile.name || subdomain} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white/70">{(profile?.name || subdomain).charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
              <ArrowLeft className="w-3.5 h-3.5 text-white/40 group-hover:-translate-x-0.5 transition-transform" />
              <span>@{subdomain} Live Page</span>
              <BadgeCheck className="w-3.5 h-3.5 text-[#123DFF] fill-[#123DFF]" />
            </div>
          </Link>

          <button
            onClick={copyPageLink}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium bg-white/[0.04] border border-white/10 text-white/80 hover:bg-white/[0.08] hover:text-white transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>
        </header>

        {/* Hero Section */}
        <section className="py-8 flex flex-col items-start gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-white/[0.05] border border-white/10 text-white/70">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Brand &amp; Product Showcase</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1] max-w-3xl">
            {pageData.title || `${profile?.name || 'Brand'} Showcase`}
          </h1>

          {pageData.tagline && (
            <p className="text-lg text-white/70 font-light max-w-2xl leading-relaxed">
              {pageData.tagline}
            </p>
          )}

          {pageData.description && (
            <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
              {pageData.description}
            </p>
          )}
        </section>

        {/* ── Main Showcase Preview Card ── */}
        {selectedMaterial ? (
          <section className="my-6 p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col gap-6">
              
              {/* Image Preview */}
              {selectedMaterial.type === 'image' && (
                <div className="w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                  <img
                    src={selectedMaterial.url}
                    alt={selectedMaterial.title}
                    className="w-full max-h-[500px] object-contain mx-auto"
                  />
                </div>
              )}

              {/* Text Preview */}
              {selectedMaterial.type === 'text' && (
                <div className="w-full p-6 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="text-xs font-bold tracking-wider uppercase text-blue-400 mb-2 flex items-center gap-2">
                    <AlignLeft size={14} />
                    <span>Document &amp; Notes</span>
                  </div>
                  <div className="text-sm sm:text-base text-white/90 leading-relaxed whitespace-pre-wrap">
                    {selectedMaterial.content || selectedMaterial.description}
                  </div>
                </div>
              )}

              {/* Header & Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                    {getMaterialIcon(selectedMaterial.type)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedMaterial.title}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-white/60 mt-1">
                      <span className="font-bold uppercase tracking-wider">{selectedMaterial.type}</span>
                      {selectedMaterial.size && <span>• {selectedMaterial.size}</span>}
                      {selectedMaterial.category && <span>• {selectedMaterial.category}</span>}
                    </div>
                    {selectedMaterial.description && selectedMaterial.type !== 'text' && (
                      <p className="text-xs sm:text-sm text-white/70 mt-2 max-w-xl">
                        {selectedMaterial.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {selectedMaterial.type === 'text' && (
                    <button
                      onClick={() => copyTextContent(selectedMaterial.content || selectedMaterial.description || '')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 transition-all"
                      title="Copy text to clipboard"
                    >
                      {copiedContent ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedContent ? 'Copied Text' : 'Copy Text'}</span>
                    </button>
                  )}
                  {selectedMaterial.type === 'image' && (
                    <a
                      href={selectedMaterial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Image</span>
                    </a>
                  )}
                  {selectedMaterial.type === 'pdf' && (
                    <a
                      href={selectedMaterial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </a>
                  )}
                  {(selectedMaterial.type === 'website' || selectedMaterial.type === 'doc') && selectedMaterial.url && (
                    <a
                      href={selectedMaterial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 transition-all"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => copyItemLink(selectedMaterial)}
                    className="p-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                    title="Copy direct link for this asset"
                  >
                    {copiedItemId === selectedMaterial.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            </div>
          </section>
        ) : (
          <div className="py-16 text-center text-white/40">
            No materials found.
          </div>
        )}

        {/* Other Materials */}
        {materials.length > 1 && (
          <section className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-base font-bold text-white/80 mb-4">
              Other Materials from @{subdomain}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {materials.filter(m => m.id !== selectedMaterial?.id).map((item, idx) => (
                <Link
                  key={item.id || idx}
                  href={`/u/${subdomain}?item=${encodeURIComponent((item.title || 'asset').toLowerCase().replace(/[^a-z0-9_-]/g, '_'))}`}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    {getMaterialIcon(item.type)}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-sm text-white truncate group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-white/50 uppercase tracking-wider">
                      {item.type} {item.size ? `• ${item.size}` : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        {/* ── Redirect to User's Main Live Page Banner ── */}
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              {profile?.avatarUrl ? (
                <img src={maskCloudflareUrl(profile.avatarUrl)} alt={profile.name || subdomain} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white/80">{(profile?.name || subdomain).charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                <span>{profile?.name || `@${subdomain}`}</span>
                <BadgeCheck className="w-4 h-4 text-[#123DFF] fill-[#123DFF]" />
              </div>
              <div className="text-xs text-white/60 mt-0.5">
                Explore full live profile, social links, updates &amp; creations
              </div>
            </div>
          </div>
          <Link
            href={profileUrl}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 transition-all shrink-0"
          >
            <span>Visit Live Page</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-8 pb-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span>Curated by</span>
            <Link href={profileUrl} className="text-white/80 hover:text-white font-medium underline underline-offset-4">
              @{subdomain}
            </Link>
            <span>•</span>
            <span>Brand Showcase</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={copyPageLink}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
            <span>•</span>
            <span className="font-serif tracking-widest text-white/60">UNOOL</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
