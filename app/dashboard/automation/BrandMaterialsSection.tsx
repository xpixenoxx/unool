'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Globe, 
  Plus, 
  Trash2, 
  Eye, 
  Layers, 
  X, 
  Loader2,
  ArrowRight,
  Share2,
  CheckCircle2,
  Link as LinkIcon
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
  tagline?: string;
  description?: string;
  primary_cta_label?: string;
  primary_cta_url?: string;
  materials: MaterialItem[];
  theme?: {
    accentColor?: string;
  };
  is_published?: boolean;
}

interface BrandMaterialsSectionProps {
  workspaceId: string;
  userId: string;
  onLinkCreated?: (url: string) => void;
  currentLinkUrl?: string | null;
}

export default function BrandMaterialsSection({
  workspaceId,
  userId,
  onLinkCreated,
  currentLinkUrl,
}: BrandMaterialsSectionProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Page state
  const [subdomain, setSubdomain] = useState<string>('user');
  const [slug, setSlug] = useState<string>('page');
  const [title, setTitle] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState<string>('Visit Official Store');
  const [primaryCtaUrl, setPrimaryCtaUrl] = useState<string>('');
  const [accentColor, setAccentColor] = useState<string>('#8B5CF6');
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [updateAutomationLink, setUpdateAutomationLink] = useState<boolean>(true);

  // Add material modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [matType, setMatType] = useState<'image' | 'pdf' | 'doc' | 'website'>('image');
  const [matTitle, setMatTitle] = useState('');
  const [matUrl, setMatUrl] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matCategory, setMatCategory] = useState('');
  const [matSize, setMatSize] = useState('');
  const [matThumbnail, setMatThumbnail] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://unool.co';
  const livePageUrl = `${appBaseUrl}/u/${subdomain}/${slug}`;

  // Fetch page data on mount
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/brand-materials?workspaceId=${workspaceId}&slug=page`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setSubdomain(data.subdomain || 'user');
            if (data.page) {
              setSlug(data.page.slug || 'page');
              setTitle(data.page.title || '');
              setTagline(data.page.tagline || '');
              setDescription(data.page.description || '');
              setPrimaryCtaLabel(data.page.primary_cta_label || 'Visit Official Store');
              setPrimaryCtaUrl(data.page.primary_cta_url || '');
              setAccentColor(data.page.theme?.accentColor || '#8B5CF6');
              setMaterials(data.page.materials || []);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load brand materials page:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [workspaceId]);

  // Copy link
  const copyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(livePageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/brand-materials/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMatUrl(data.url);
        if (!matTitle) {
          setMatTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
        setMatSize(data.size || '');
        if (data.type === 'image') {
          setMatThumbnail(data.url);
          setMatType('image');
        } else if (data.type === 'pdf') {
          setMatType('pdf');
        }
      } else {
        alert('File upload failed. You can also paste a direct public URL.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  // Add material item
  const handleAddMaterial = () => {
    if (!matTitle.trim() || !matUrl.trim()) {
      alert('Please provide a title and URL for the material.');
      return;
    }

    const newItem: MaterialItem = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: matType,
      title: matTitle.trim(),
      url: matUrl.trim(),
      description: matDesc.trim() || undefined,
      category: matCategory.trim() || undefined,
      size: matSize.trim() || undefined,
      thumbnailUrl: matThumbnail.trim() || (matType === 'image' ? matUrl.trim() : undefined),
      order: materials.length,
    };

    setMaterials([...materials, newItem]);
    setMatTitle('');
    setMatUrl('');
    setMatDesc('');
    setMatCategory('');
    setMatSize('');
    setMatThumbnail('');
    setAddModalOpen(false);
  };

  // Delete material
  const handleDeleteMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  // Save all & publish page
  const handleSavePage = async () => {
    setSaving(true);
    setSuccessBanner(null);
    try {
      const res = await fetch('/api/brand-materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          slug: slug.trim() || 'page',
          title: title.trim() || 'Brand Materials',
          tagline: tagline.trim(),
          description: description.trim(),
          primaryCtaLabel: primaryCtaLabel.trim(),
          primaryCtaUrl: primaryCtaUrl.trim(),
          accentColor,
          theme: { accentColor },
          materials,
          updateAutomationLink,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessBanner(data.pageUrl || livePageUrl);
        if (onLinkCreated && data.pageUrl) {
          onLinkCreated(data.pageUrl);
        }
      } else {
        alert('Failed to save brand materials page.');
      }
    } catch (err) {
      console.error('Error saving brand page:', err);
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
        <Loader2 className="animate-spin" size={24} style={{ color: '#C4A265' }} />
        <span style={{ color: '#8B7355', fontSize: 14 }}>Loading Brand &amp; Product Hub...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Success Celebration Banner ── */}
      {successBanner && (
        <div style={{
          background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
          border: '1.5px solid #A7F3D0',
          borderRadius: 18,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          boxShadow: '0 4px 16px rgba(16,185,129,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ color: '#065F46', fontWeight: 700, fontSize: 15 }}>Brand Materials Page Published!</div>
              <div style={{ color: '#047857', fontSize: 13, marginTop: 2 }}>
                Live URL: <a href={successBanner} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, textDecoration: 'underline' }}>{successBanner}</a>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={copyLink} className="un-btn" style={{ fontSize: 13, background: '#FFFFFF' }}>
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
            <a href={successBanner} target="_blank" rel="noopener noreferrer" className="un-btn un-btn-primary" style={{ fontSize: 13, background: '#059669', borderColor: '#059669' }}>
              <span>View Live Page</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      {/* ── Live Link Banner Card ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FFFDF9 0%, #FDFBF7 100%)',
        border: '1.5px solid #E8E0D4',
        borderRadius: 20,
        padding: '24px 28px',
        boxShadow: '0 4px 20px rgba(61,43,31,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8B5CF6', background: '#F5F3FF', padding: '3px 10px', borderRadius: 8 }}>
              Subdomain Extension
            </span>
            <span style={{ fontSize: 12, color: '#8B7355', fontWeight: 500 }}>Auto-Dispatched on Instagram DM &amp; Comments</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <h2 className="un-editorial-font" style={{ fontSize: 22, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
              {livePageUrl}
            </h2>
          </div>
          <p style={{ fontSize: 13, color: '#8B7355', margin: '4px 0 0' }}>
            When users comment or DM requesting materials, lookbooks, or product info, this dedicated page is shared directly with them.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={copyLink} className="un-btn" style={{ fontSize: 13 }}>
            {copied ? <Check size={15} style={{ color: '#10B981' }} /> : <Copy size={15} />}
            <span>{copied ? 'Copied' : 'Copy URL'}</span>
          </button>
          <a href={livePageUrl} target="_blank" rel="noopener noreferrer" className="un-btn un-btn-primary" style={{ fontSize: 13 }}>
            <span>Open Page</span>
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* ── 2-Column Config Layout ── */}
      <div className="un-grid-2">
        {/* Left Column: Brand & Showcase Metadata */}
        <div>
          <div className="un-card">
            <div className="un-card-header">
              <div className="un-card-title">
                <div className="un-card-title-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                  <Sparkles size={16} />
                </div>
                <span>Brand &amp; Product Details</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8B7355', background: '#F5EFE2', padding: '2px 8px', borderRadius: 6 }}>
                Hero Setup
              </span>
            </div>

            <div className="un-field">
              <label className="un-label">Brand / Product Showcase Title</label>
              <input
                type="text"
                className="un-input"
                placeholder="e.g. Aura Skincare &amp; Daily Essentials"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="un-field">
              <label className="un-label">Subdomain Extension Slug</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#8B7355', fontSize: 13.5, fontWeight: 600 }}>https://unool.co/u/{subdomain}/</span>
                <input
                  type="text"
                  className="un-input"
                  style={{ flex: 1, fontFamily: 'monospace' }}
                  placeholder="page"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                />
              </div>
            </div>

            <div className="un-field">
              <label className="un-label">Tagline / Subheading</label>
              <input
                type="text"
                className="un-input"
                placeholder="e.g. Official product lookbook, catalogue, and brand guides"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
              />
            </div>

            <div className="un-field">
              <label className="un-label">Brand Story &amp; Product Overview</label>
              <textarea
                className="un-input un-textarea"
                style={{ minHeight: 95 }}
                placeholder="Share context about your brand, mission, product line, and what materials are provided in this hub."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="un-field">
              <label className="un-label">Primary Call to Action (CTA)</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  className="un-input"
                  style={{ width: '45%' }}
                  placeholder="Button Label (e.g. Buy Now)"
                  value={primaryCtaLabel}
                  onChange={e => setPrimaryCtaLabel(e.target.value)}
                />
                <input
                  type="url"
                  className="un-input"
                  style={{ flex: 1 }}
                  placeholder="Destination URL (e.g. https://mystore.com)"
                  value={primaryCtaUrl}
                  onChange={e => setPrimaryCtaUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="un-field" style={{ marginBottom: 0 }}>
              <label className="un-label">Theme Accent Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="color"
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  style={{ width: 44, height: 38, border: '1px solid #E5DFD5', borderRadius: 8, cursor: 'pointer', padding: 2, background: '#FFFDF9' }}
                />
                <span style={{ fontSize: 13, color: '#3D2B1F', fontFamily: 'monospace', fontWeight: 600 }}>{accentColor}</span>
              </div>
            </div>
          </div>

          {/* Sync Switch Card */}
          <div className="un-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ color: '#3D2B1F', fontWeight: 700, fontSize: 14 }}>Instagram Automation Link Sync</div>
                <div style={{ color: '#8B7355', fontSize: 12.5, marginTop: 2 }}>
                  Automatically set this materials page as your canonical resource link for DMs &amp; comment replies.
                </div>
              </div>
              <label className="un-channel-switch">
                <input
                  type="checkbox"
                  checked={updateAutomationLink}
                  onChange={e => setUpdateAutomationLink(e.target.checked)}
                />
                <div className="un-channel-track" />
                <div className="un-channel-thumb">
                  <div className="un-channel-thumb-ridges"><span /><span /><span /></div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Materials Asset Manager */}
        <div>
          <div className="un-card">
            <div className="un-card-header">
              <div className="un-card-title">
                <div className="un-card-title-icon" style={{ background: '#ECFDF5', color: '#047857' }}>
                  <Layers size={16} />
                </div>
                <span>Brand Materials Repository</span>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="un-btn un-btn-primary"
                style={{ fontSize: 12, padding: '6px 14px' }}
              >
                <Plus size={14} />
                <span>Add Material</span>
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#8B7355', margin: '0 0 16px' }}>
              Add images, PDFs, guides, Notion pages, and website links for your brand or product.
            </p>

            {materials.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: '#FAF8F5',
                border: '2px dashed #E5DFD5',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F0EBE3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B7355' }}>
                  <Upload size={20} />
                </div>
                <div>
                  <div style={{ color: '#3D2B1F', fontWeight: 700, fontSize: 14 }}>No Materials Placed Yet</div>
                  <div style={{ color: '#8B7355', fontSize: 12.5, marginTop: 2 }}>
                    Upload product lookbooks, PDF catalogues, Notion specs, or website URLs.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(true)}
                  className="un-btn"
                  style={{ fontSize: 12.5, marginTop: 4, background: '#FFFFFF' }}
                >
                  <Plus size={14} />
                  <span>Add First Asset</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {materials.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 14px',
                      background: '#FFFDF9',
                      border: '1px solid #E8E0D4',
                      borderRadius: 12,
                      boxShadow: '0 1px 3px rgba(61,43,31,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: item.type === 'image' ? '#ECFDF5' : item.type === 'pdf' ? '#FFF1F2' : item.type === 'doc' ? '#FEF3C7' : '#EFF6FF',
                        color: item.type === 'image' ? '#047857' : item.type === 'pdf' ? '#BE123C' : item.type === 'doc' ? '#B45309' : '#1D4ED8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {item.type === 'image' ? <ImageIcon size={18} /> : item.type === 'pdf' ? <FileText size={18} /> : item.type === 'doc' ? <File size={18} /> : <Globe size={18} />}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ color: '#3D2B1F', fontWeight: 600, fontSize: 13.5, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {item.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#8B7355', marginTop: 1 }}>
                          <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{item.type}</span>
                          {item.size && <span>• {item.size}</span>}
                          {item.category && <span>• {item.category}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="un-btn"
                        style={{ padding: '5px 8px', fontSize: 11, background: '#FAF8F5' }}
                        title="Preview Asset"
                      >
                        <ExternalLink size={13} />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteMaterial(item.id)}
                        className="un-btn"
                        style={{ padding: '5px 8px', fontSize: 11, color: '#DC2626', borderColor: '#FECACA' }}
                        title="Delete Asset"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Persistent Save Action Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 28px',
        background: '#FFFDF9',
        border: '1.5px solid #E8E0D4',
        borderRadius: 18,
        boxShadow: '0 2px 10px rgba(61,43,31,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
          <div>
            <div style={{ color: '#3D2B1F', fontWeight: 700, fontSize: 14 }}>Ready to Publish Materials Hub</div>
            <div style={{ color: '#8B7355', fontSize: 12 }}>
              Saves brand details and produces the live link at <span style={{ fontWeight: 600 }}>/u/{subdomain}/{slug}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSavePage}
          disabled={saving}
          className="un-btn un-btn-primary"
          style={{ minWidth: 170, fontSize: 13.5 }}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Publishing Page...</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>Save &amp; Create Page</span>
            </>
          )}
        </button>
      </div>

      {/* ── Modal: Add Material Item ── */}
      {addModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26, 18, 13, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 100
        }}>
          <div style={{
            background: '#FFFDF9',
            border: '1px solid #E8E0D4',
            borderRadius: 20,
            maxWidth: 500,
            width: '100%',
            padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} />
                </div>
                <h3 className="un-editorial-font" style={{ fontSize: 18, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
                  Place Brand / Product Material
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8B7355' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Type selector */}
            <div className="un-field">
              <label className="un-label">Asset Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { id: 'image', label: 'Image', icon: <ImageIcon size={15} /> },
                  { id: 'pdf', label: 'PDF', icon: <FileText size={15} /> },
                  { id: 'doc', label: 'Document', icon: <File size={15} /> },
                  { id: 'website', label: 'Website', icon: <Globe size={15} /> },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMatType(t.id as any)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 4px',
                      borderRadius: 12,
                      border: matType === t.id ? '2px solid #3D2B1F' : '1px solid #E8E0D4',
                      background: matType === t.id ? '#FAF7F2' : '#FFFDF9',
                      color: matType === t.id ? '#3D2B1F' : '#8B7355',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct File Upload (for images & pdfs) */}
            {(matType === 'image' || matType === 'pdf') && (
              <div className="un-field">
                <label className="un-label">File Upload (Optional)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept={matType === 'image' ? 'image/*' : 'application/pdf'}
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="un-btn"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', background: '#FAF7F2', borderStyle: 'dashed' }}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={15} />
                      <span>Uploading Asset...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      <span>Click to Select &amp; Upload {matType.toUpperCase()}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="un-field">
              <label className="un-label">Material Title *</label>
              <input
                type="text"
                className="un-input"
                placeholder="e.g. Spring 2026 Product Lookbook"
                value={matTitle}
                onChange={e => setMatTitle(e.target.value)}
              />
            </div>

            <div className="un-field">
              <label className="un-label">Asset Destination URL *</label>
              <input
                type="url"
                className="un-input"
                placeholder="https://... (or uploaded file link)"
                value={matUrl}
                onChange={e => setMatUrl(e.target.value)}
              />
            </div>

            <div className="un-field">
              <label className="un-label">Brief Description</label>
              <textarea
                className="un-input un-textarea"
                style={{ minHeight: 65 }}
                placeholder="Overview of this asset or instructions for viewer"
                value={matDesc}
                onChange={e => setMatDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div className="un-field" style={{ flex: 1, marginBottom: 0 }}>
                <label className="un-label">Category</label>
                <input
                  type="text"
                  className="un-input"
                  placeholder="e.g. Lookbook, Pricing"
                  value={matCategory}
                  onChange={e => setMatCategory(e.target.value)}
                />
              </div>
              <div className="un-field" style={{ width: '35%', marginBottom: 0 }}>
                <label className="un-label">Size/Format</label>
                <input
                  type="text"
                  className="un-input"
                  placeholder="e.g. 4.2 MB"
                  value={matSize}
                  onChange={e => setMatSize(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 16, borderTop: '1px solid #E8E0D4' }}>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="un-btn"
                style={{ background: '#FFFDF9' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMaterial}
                className="un-btn un-btn-primary"
              >
                <Plus size={14} />
                <span>Place Material</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
