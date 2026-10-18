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
  ArrowRight
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
}

export default function BrandMaterialsPageView({
  subdomain,
  slug,
  pageData,
  profile,
  appUrl = 'https://unool.co',
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<MaterialItem | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const accent = pageData.theme?.accentColor || '#8B5CF6';
  const pageUrl = `${appUrl}/u/${subdomain}/${slug}`;
  const profileUrl = `/u/${subdomain}`;

  const materials = pageData.materials || [];

  // Compute category counts
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

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-400" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-400" />;
      case 'doc':
        return <File className="w-5 h-5 text-amber-400" />;
      case 'website':
      case 'page':
      default:
        return <Globe className="w-5 h-5 text-indigo-400" />;
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
                <img src={profile.avatarUrl} alt={profile.name || subdomain} className="w-full h-full object-cover" />
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

        {/* Category Filter Pills & Search */}
        <section className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-white/10">
          {/* Filter Pills */}
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

          {/* Search Box */}
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
