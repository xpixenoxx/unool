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
  Search, 
  Eye, 
  X,
  Layers,
  ArrowRight,
  Pin
} from 'lucide-react';

export interface MaterialItem {
  id: string;
  type: 'image' | 'pdf' | 'doc' | 'website' | 'page';
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  category?: string;
  size?: string;
  order?: number;
}

export interface BrandMaterialsPageData {
  id?: string;
  slug: string;
  title: string;
  tagline?: string | null;
  description?: string | null;
  primary_cta_label?: string | null;
  primary_cta_url?: string | null;
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
  slug: string;
  pageData: BrandMaterialsPageData;
  profile?: CreatorProfile | null;
  appUrl?: string;
  liveTemplate?: string;
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Ensure Cloudflare R2 domains are completely masked
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
  appUrl = 'https://unool.co',
  liveTemplate = 'the-voice',
  searchParams,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
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

  // Read query parameters (?file=... or ?item=... or ?media=...)
  const rawFileQuery = searchParams?.file ? String(searchParams.file).trim() : '';
  const rawItemQuery = searchParams?.item ? String(searchParams.item).trim() : '';
  const rawMediaQuery = searchParams?.media ? String(searchParams.media).trim() : '';
  const spotlightQuery = rawFileQuery || rawItemQuery || rawMediaQuery;

  // Find targeted/spotlighted material if requested via query string
  const spotlightItem = useMemo(() => {
    if (!spotlightQuery || materials.length === 0) return null;
    const qLower = spotlightQuery.toLowerCase();
    return materials.find((m) => {
      const slugTitle = m.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      return (
        m.id.toLowerCase() === qLower ||
        slugTitle.includes(qLower) ||
        qLower.includes(slugTitle) ||
        m.title.toLowerCase().includes(qLower) ||
        (m.url && m.url.toLowerCase().includes(qLower))
      );
    }) || null;
  }, [materials, spotlightQuery]);

  // Canonical page URL on *.unool.co
  const pageUrl = `https://${subdomain}.unool.co/${slug}${spotlightQuery ? `?${rawFileQuery ? `file=${rawFileQuery}` : rawItemQuery ? `item=${rawItemQuery}` : `media=${rawMediaQuery}`}` : ''}`;
  const profileUrl = `/u/${subdomain}`;

  // Category counts
  const counts = useMemo(() => {
    const c = { all: materials.length, image: 0, pdf: 0, doc: 0, website: 0 };
    materials.forEach((m) => {
      if (m.type === 'image') c.image++;
      else if (m.type === 'pdf') c.pdf++;
      else if (m.type === 'doc') c.doc++;
      else if (m.type === 'website' || m.type === 'page') c.website++;
    });
    return c;
  }, [materials]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'image' && m.type === 'image') ||
        (selectedCategory === 'pdf' && m.type === 'pdf') ||
        (selectedCategory === 'doc' && m.type === 'doc') ||
        (selectedCategory === 'website' && (m.type === 'website' || m.type === 'page'));

      const matchesSearch =
        !searchQuery.trim() ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.category && m.category.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [materials, selectedCategory, searchQuery]);

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
    const param = item.type === 'image' || item.type === 'pdf' || item.type === 'doc' ? `file=${slugified}` : `item=${slugified}`;
    const directUrl = `https://${subdomain}.unool.co/${slug}?${param}`;
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(directUrl);
      setCopiedItemId(item.id);
      setTimeout(() => setCopiedItemId(null), 2000);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" style={{ color: isVoice ? '#DF5B4C' : '#10B981' }} />;
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'image': return 'Image / Media';
      case 'pdf': return 'PDF Document';
      case 'doc': return 'Guide / Doc';
      case 'website': return 'Official Website';
      case 'page': return 'Web Page';
      default: return 'Resource';
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // THEME 1: THE VOICE TEMPLATE (Matches user's live profile aesthetic)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isVoice) {
    return (
      <div className="voice-template-wrapper w-full min-h-screen bg-[#F7F9F7] text-[#2B2321] selection:bg-[#DF5B4C] selection:text-white antialiased flex flex-col items-center justify-start p-4 sm:p-6 md:p-10 lg:p-14">
        {/* Playfair Display & Plus Jakarta Sans fonts matching VoiceTemplate */}
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
            border-radius: 24px;
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 
              10px 10px 30px rgba(168, 184, 157, 0.3), 
              -10px -10px 30px rgba(255, 255, 255, 0.8),
              inset 1px 1px 3px rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.5);
          }
          .voice-paper-card:hover {
            box-shadow: 
              12px 12px 36px rgba(168, 184, 157, 0.4), 
              -12px -12px 36px rgba(255, 255, 255, 1);
            transform: translateY(-2px);
          }
        ` }} />

        {/* Main Card Container matching VoiceTemplate */}
        <div className="w-full max-w-[1200px] bg-[#EBF0EC] rounded-[28px] sm:rounded-[36px] md:rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col py-8 md:py-14 px-5 sm:px-8 md:px-14 border border-[#8DA396]/30">
          
          {/* Header */}
          <header className="flex items-center justify-between gap-4 pb-6 mb-8 border-b border-[#8DA396]/20">
            <Link
              href={profileUrl}
              className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/70 border border-[#8DA396]/30 hover:bg-white hover:border-[#1C2B21] transition-all"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#D0DDD5] border border-white flex items-center justify-center shrink-0">
                {profile?.avatarUrl ? (
                  <img src={maskCloudflareUrl(profile.avatarUrl)} alt={profile.name || subdomain} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#1C2B21]">{(profile?.name || subdomain).charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#1C2B21] font-semibold">
                <span>@{subdomain}</span>
                <BadgeCheck className="w-3.5 h-3.5 text-[#DF5B4C] fill-[#DF5B4C]" />
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-[#8DA396]" />
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
                <span>{copied ? 'Link Copied!' : 'Share Hub'}</span>
              </button>
            </div>
          </header>

          {/* Hero Section */}
          <section className="py-4 md:py-8 flex flex-col items-start gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#DF5B4C]/10 border border-[#DF5B4C]/20 text-[#DF5B4C]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Materials &amp; Lookbooks</span>
            </div>

            <h1 className="voice-font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#1C2B21] leading-[1.1] max-w-3xl">
              {pageData.title || `${profile?.name || 'Brand'} Materials Hub`}
            </h1>

            {pageData.tagline && (
              <p className="voice-font-serif text-lg sm:text-2xl text-[#2B2321]/80 italic max-w-2xl leading-relaxed">
                "{pageData.tagline}"
              </p>
            )}

            {pageData.description && (
              <div className="voice-paper-card p-6 max-w-2xl text-sm sm:text-base text-[#2B2321]/90 leading-relaxed mt-2">
                <p>{pageData.description}</p>
              </div>
            )}

            {/* Primary CTA */}
            {pageData.primary_cta_url && (
              <div className="pt-2">
                <a
                  href={pageData.primary_cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="voice-btn-primary inline-flex items-center gap-3 px-8 py-3.5 rounded-full font-bold text-sm sm:text-base shadow-lg"
                >
                  <span>{pageData.primary_cta_label || 'Visit Official Store'}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </section>

          {/* ── Query String Spotlight / Requested File Banner ── */}
          {spotlightItem && (
            <section className="my-6 p-6 rounded-3xl bg-white/90 border-2 border-[#DF5B4C] shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#DF5B4C] mb-3">
                <Pin className="w-4 h-4" />
                <span>Requested Resource • Query String Match</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#E2EAE5] border border-[#8DA396]/30 flex items-center justify-center shrink-0">
                    {getMaterialIcon(spotlightItem.type)}
                  </div>
                  <div>
                    <h3 className="voice-font-serif text-xl sm:text-2xl font-bold text-[#1C2B21]">
                      {spotlightItem.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[#2B2321]/70 mt-1">
                      <span className="font-bold uppercase tracking-wider">{spotlightItem.type}</span>
                      {spotlightItem.size && <span>• {spotlightItem.size}</span>}
                      {spotlightItem.category && <span>• {spotlightItem.category}</span>}
                    </div>
                    {spotlightItem.description && (
                      <p className="text-xs sm:text-sm text-[#2B2321]/80 mt-2 max-w-xl">
                        {spotlightItem.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {spotlightItem.type === 'image' ? (
                    <button
                      onClick={() => setLightboxImage(spotlightItem)}
                      className="voice-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Full Image</span>
                    </button>
                  ) : spotlightItem.type === 'pdf' ? (
                    <a
                      href={spotlightItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="voice-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </a>
                  ) : (
                    <a
                      href={spotlightItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="voice-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => copyItemLink(spotlightItem)}
                    className="p-2.5 rounded-full bg-white border border-[#8DA396]/30 text-[#1C2B21] hover:border-[#1C2B21] transition-all"
                    title="Copy Direct URL for this resource"
                  >
                    {copiedItemId === spotlightItem.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Filter Pills & Search */}
          <section className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-[#8DA396]/20">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'All', count: counts.all },
                { id: 'image', label: 'Images & Lookbooks', count: counts.image },
                { id: 'pdf', label: 'PDFs & Catalogues', count: counts.pdf },
                { id: 'doc', label: 'Docs & Notion', count: counts.doc },
                { id: 'website', label: 'Websites & Stores', count: counts.website },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#1C2B21] text-[#FFFAF3] shadow-md'
                      : 'bg-white/60 text-[#2B2321] hover:bg-white border border-[#8DA396]/30'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-[#1C2B21]/10 text-[#1C2B21]'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-[#8DA396] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search materials..."
                className="w-full pl-10 pr-4 py-2 rounded-full text-xs bg-white/70 border border-[#8DA396]/30 text-[#2B2321] placeholder-[#8DA396] focus:outline-none focus:bg-white focus:border-[#1C2B21] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8DA396] hover:text-[#1C2B21]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </section>

          {/* Materials Grid */}
          <section className="py-4 flex-1">
            {filteredMaterials.length === 0 ? (
              <div className="voice-paper-card py-16 flex flex-col items-center justify-center text-center p-6">
                <Layers className="w-12 h-12 text-[#8DA396] mb-3" />
                <h3 className="voice-font-serif text-xl font-bold text-[#1C2B21]">No materials found</h3>
                <p className="text-xs sm:text-sm text-[#2B2321]/70 max-w-sm mt-1">
                  {materials.length === 0
                    ? 'The creator has not placed materials in this hub yet.'
                    : 'Try selecting another category or clearing your search filter.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-1.5 rounded-full text-xs font-bold bg-[#1C2B21] text-white"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaterials.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="voice-paper-card group relative flex flex-col justify-between overflow-hidden"
                  >
                    {/* Image Lookbook Showcase */}
                    {item.type === 'image' && (
                      <div
                        className="relative w-full aspect-[4/3] bg-[#D0DDD5] overflow-hidden cursor-pointer"
                        onClick={() => setLightboxImage(item)}
                      >
                        <img
                          src={item.thumbnailUrl || item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/90 text-[#1C2B21] shadow-sm">
                            Image Lookbook
                          </span>
                          <div className="w-7 h-7 rounded-full bg-white/90 text-[#1C2B21] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Non-image header badge */}
                    {item.type !== 'image' && (
                      <div className="p-5 pb-0 flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/80 border border-[#8DA396]/30 flex items-center justify-center shrink-0">
                          {getMaterialIcon(item.type)}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/80 text-[#1C2B21] border border-[#8DA396]/30">
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <h3 className="voice-font-serif font-bold text-lg text-[#1C2B21] leading-snug">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-[#2B2321]/80 mt-1.5 leading-relaxed line-clamp-3">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Card Action Bar */}
                      <div className="pt-3 border-t border-[#8DA396]/20 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#8DA396] font-mono">
                          {item.size || item.category || 'Asset'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyItemLink(item)}
                            className="p-1.5 rounded-lg bg-white/80 border border-[#8DA396]/30 text-[#1C2B21] hover:border-[#1C2B21] transition-all"
                            title="Copy query link for this file"
                          >
                            {copiedItemId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                          </button>

                          {item.type === 'image' ? (
                            <button
                              onClick={() => setLightboxImage(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold voice-btn-primary"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Full</span>
                            </button>
                          ) : item.type === 'pdf' ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold voice-btn-primary"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </a>
                          ) : (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold voice-btn-primary"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="mt-8 pt-8 border-t border-[#8DA396]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#2B2321]/60">
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
                <span>{copied ? 'Link Copied!' : 'Copy Page URL'}</span>
              </button>
              <span>•</span>
              <span className="voice-font-serif tracking-widest text-[#1C2B21] font-bold">UNOOL</span>
            </div>
          </footer>

        </div>

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl max-h-[75vh]">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-full mt-4 flex items-center justify-between text-white">
                <div>
                  <h4 className="font-bold text-base">{lightboxImage.title}</h4>
                  {lightboxImage.description && (
                    <p className="text-xs text-white/70">{lightboxImage.description}</p>
                  )}
                </div>
                <a
                  href={lightboxImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[#DF5B4C] text-[#FFFAF3] hover:bg-[#B8473D] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // THEME 2: DARK / LONE / CREATOR TEMPLATE (For dark mode or non-Voice templates)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#08090C] text-[#F4EFE7] selection:bg-[#8B5CF6] selection:text-white font-sans antialiased relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div 
        className="pointer-events-none fixed top-[-100px] left-1/2 -translate-x-1/2 w-[900px] h-[550px] blur-[140px] opacity-25 rounded-full"
        style={{ background: `radial-gradient(ellipse at center, ${accent} 0%, rgba(18,61,255,0.4) 60%, transparent 100%)` }}
      />
      <div 
        className="pointer-events-none fixed bottom-[-150px] right-[-100px] w-[600px] h-[600px] blur-[150px] opacity-15 rounded-full bg-blue-600"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14 flex flex-col min-h-screen">
        
        {/* Navigation Bar */}
        <header className="flex items-center justify-between gap-4 pb-8 border-b border-white/10">
          <Link
            href={profileUrl}
            className="group flex items-center gap-3 px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              {profile?.avatarUrl ? (
                <img src={maskCloudflareUrl(profile.avatarUrl)} alt={profile.name || subdomain} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white/70">{(profile?.name || subdomain).charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
              <span>@{subdomain}</span>
              <BadgeCheck className="w-3.5 h-3.5 text-[#123DFF] fill-[#123DFF]" />
            </div>
            <ArrowLeft className="w-3.5 h-3.5 text-white/40 group-hover:-translate-x-0.5 transition-transform" />
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              onClick={copyPageLink}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium bg-white/[0.04] border border-white/10 text-white/80 hover:bg-white/[0.08] hover:text-white transition-all"
              title="Copy Page Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Verified Materials
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-10 md:py-16 flex flex-col items-start gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-white/[0.05] border border-white/10 text-white/70">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Brand &amp; Product Material Showcase</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1] max-w-3xl">
            {pageData.title || `${profile?.name || 'Brand'} Materials Hub`}
          </h1>

          {pageData.tagline && (
            <p className="text-lg sm:text-xl text-white/70 font-light max-w-2xl leading-relaxed">
              {pageData.tagline}
            </p>
          )}

          {pageData.description && (
            <div className="text-sm sm:text-base text-white/60 max-w-2xl leading-relaxed bg-white/[0.02] border border-white/5 rounded-2xl p-5 backdrop-blur-md">
              <p>{pageData.description}</p>
            </div>
          )}

          {/* Primary CTA Button */}
          {pageData.primary_cta_url && (
            <div className="pt-2">
              <a
                href={pageData.primary_cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full font-semibold text-sm sm:text-base text-white shadow-xl hover:scale-[1.02] transition-all"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, #123DFF 100%)`,
                  boxShadow: `0 8px 30px ${accent}40`,
                }}
              >
                <span>{pageData.primary_cta_label || 'Visit Website'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          )}
        </section>

        {/* Spotlight Query Match Card */}
        {spotlightItem && (
          <section className="mb-8 p-6 rounded-3xl bg-white/[0.05] border-2 border-indigo-500/60 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
              <Pin className="w-4 h-4" />
              <span>Requested Resource • Query String Match</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  {getMaterialIcon(spotlightItem.type)}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    {spotlightItem.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-white/60 mt-1">
                    <span className="font-bold uppercase tracking-wider">{spotlightItem.type}</span>
                    {spotlightItem.size && <span>• {spotlightItem.size}</span>}
                    {spotlightItem.category && <span>• {spotlightItem.category}</span>}
                  </div>
                  {spotlightItem.description && (
                    <p className="text-xs sm:text-sm text-white/70 mt-2 max-w-xl">
                      {spotlightItem.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {spotlightItem.type === 'image' ? (
                  <button
                    onClick={() => setLightboxImage(spotlightItem)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Full Image</span>
                  </button>
                ) : spotlightItem.type === 'pdf' ? (
                  <a
                    href={spotlightItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </a>
                ) : (
                  <a
                    href={spotlightItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 transition-all"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => copyItemLink(spotlightItem)}
                  className="p-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                  title="Copy Direct URL for this resource"
                >
                  {copiedItemId === spotlightItem.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Category Filter Pills & Search */}
        <section className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'image', label: 'Images & Lookbooks', count: counts.image },
              { id: 'pdf', label: 'PDFs & Catalogues', count: counts.pdf },
              { id: 'doc', label: 'Docs & Notion', count: counts.doc },
              { id: 'website', label: 'Websites & Stores', count: counts.website },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white border border-white/5'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedCategory === cat.id ? 'bg-black/10 text-black font-bold' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials..."
              className="w-full pl-10 pr-4 py-2 rounded-full text-xs bg-white/[0.04] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* Materials Grid */}
        <section className="py-6 flex-1">
          {filteredMaterials.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center rounded-3xl bg-white/[0.02] border border-white/5">
              <Layers className="w-12 h-12 text-white/20 mb-3" />
              <h3 className="text-lg font-bold text-white/80">No materials found</h3>
              <p className="text-sm text-white/40 max-w-sm mt-1">
                {materials.length === 0
                  ? 'The brand owner has not published materials to this hub yet.'
                  : 'Try selecting another category or clearing your search filter.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMaterials.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.05] transition-all shadow-lg"
                >
                  {/* Image Type Showcase */}
                  {item.type === 'image' && (
                    <div
                      className="relative w-full aspect-[4/3] bg-black/40 overflow-hidden cursor-pointer"
                      onClick={() => setLightboxImage(item)}
                    >
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                          Image Lookbook
                        </span>
                        <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Header info for non-image items */}
                  {item.type !== 'image' && (
                    <div className="p-5 pb-0 flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                        {getMaterialIcon(item.type)}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/[0.06] text-white/60 border border-white/10">
                        {getTypeLabel(item.type)}
                      </span>
                    </div>
                  )}

                  {/* Content Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-white transition-colors">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-white/60 mt-1.5 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-white/40 font-mono">
                        {item.size || item.category || 'Asset'}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyItemLink(item)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                          title="Copy query link for this file"
                        >
                          {copiedItemId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                        </button>

                        {item.type === 'image' ? (
                          <button
                            onClick={() => setLightboxImage(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full</span>
                          </button>
                        ) : item.type === 'pdf' ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        ) : (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all"
                          >
                            <span>Open Link</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Lightbox Modal for Images */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl max-h-[75vh]">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-full mt-4 flex items-center justify-between text-white">
                <div>
                  <h4 className="font-bold text-base">{lightboxImage.title}</h4>
                  {lightboxImage.description && (
                    <p className="text-xs text-white/60">{lightboxImage.description}</p>
                  )}
                </div>
                <a
                  href={lightboxImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-white/90 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-12 pb-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
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
              <span>{copied ? 'Link Copied!' : 'Copy Page URL'}</span>
            </button>
            <span>•</span>
            <span className="font-serif tracking-widest text-white/60">UNOOL</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
