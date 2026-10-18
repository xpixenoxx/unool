'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Trash2,
  Upload,
  FileText,
  Image as ImageIcon,
  File,
  Globe,
  AlignLeft,
  Loader2,
  CheckCircle2,
  X,
  ChevronDown,
  Link as LinkIcon
} from 'lucide-react';

export interface MaterialItem {
  id: string;
  type: 'image' | 'pdf' | 'doc' | 'website' | 'text' | 'page';
  title: string;
  description?: string;
  content?: string;
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
  tagline?: string;
  description?: string;
  materials: MaterialItem[];
  linked_posts?: any[];
  theme?: {
    accentColor?: string;
    template?: string;
    linked_posts?: any[];
  };
  is_published?: boolean;
}

interface PostBrandMaterialsCardProps {
  workspaceId: string;
  subdomain?: string;
  postContent?: string;
  attachedSlug?: string | null;
  onAttachPage?: (slug: string | null, pageUrl: string | null) => void;
  onInsertLinkIntoDraft?: (url: string) => void;
}

export default function PostBrandMaterialsCard({
  workspaceId,
  subdomain: initialSubdomain,
  postContent = '',
  attachedSlug = null,
  onAttachPage,
  onInsertLinkIntoDraft,
}: PostBrandMaterialsCardProps) {
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<BrandMaterialsPageData[]>([]);
  const [subdomain, setSubdomain] = useState<string>(initialSubdomain || 'user');
  const [activeSlug, setActiveSlug] = useState<string | null>(attachedSlug || null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [insertedDraft, setInsertedDraft] = useState(false);

  // Dialog state for creating a new post page
  const [modalOpen, setModalOpen] = useState(false);
  const [pagesListOpen, setPagesListOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [pageTitle, setPageTitle] = useState('');
  const [pageTagline, setPageTagline] = useState('Exclusive resources & materials for this post');
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  // Fast item entry in modal
  const [entryType, setEntryType] = useState<'upload' | 'text' | 'link'>('upload');
  const [itemTitle, setItemTitle] = useState('');
  const [itemTextContent, setItemTextContent] = useState('');
  const [itemLinkUrl, setItemLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch workspace brand pages
  const loadPages = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/brand-materials?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.subdomain) setSubdomain(data.subdomain);
        if (data.pages) setPages(data.pages);
      }
    } catch (err) {
      console.error('Failed to load brand pages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, [workspaceId]);

  useEffect(() => {
    if (attachedSlug) {
      setActiveSlug(attachedSlug);
    }
  }, [attachedSlug]);

  // Derived attached page
  const attachedPage = pages.find(p => p.slug === activeSlug) || null;
  const attachedPageUrl = activeSlug
    ? (activeSlug === 'showcase' ? `https://${subdomain}.unool.co/` : `https://${subdomain}.unool.co/${activeSlug}`)
    : null;

  // Open modal with prefilled title from post content
  const handleOpenCreateModal = () => {
    let derivedTitle = '';
    if (postContent.trim()) {
      const firstLine = postContent.trim().split('\n')[0].replace(/^[#*\-•\d.]+\s*/, '').trim();
      derivedTitle = firstLine.length > 40 ? firstLine.slice(0, 37) + '...' : firstLine;
    }
    setPageTitle(derivedTitle ? `${derivedTitle} • Materials` : 'New Post Resources');
    setPageTagline('Exclusive lookbooks, downloads & resources for this post');
    setMaterials([]);
    setItemTitle('');
    setItemTextContent('');
    setItemLinkUrl('');
    setEntryType('upload');
    setModalOpen(true);
  };

  // Upload file for modal
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
        const detectedType: MaterialItem['type'] = file.type.startsWith('image/')
          ? 'image'
          : file.type === 'application/pdf'
          ? 'pdf'
          : 'doc';

        const newItem: MaterialItem = {
          id: `mat-${Date.now().toString(36)}`,
          title: itemTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
          type: detectedType,
          url: data.url,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        };

        setMaterials(prev => [...prev, newItem]);
        setItemTitle('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        alert('File upload failed. Please try again.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  // Add text or link material
  const handleAddTextOrLink = () => {
    if (entryType === 'text') {
      if (!itemTextContent.trim()) {
        alert('Please write or paste your notes/text.');
        return;
      }
      const title = itemTitle.trim() || (itemTextContent.trim().split('\n')[0].slice(0, 30) || 'Notes');
      const newItem: MaterialItem = {
        id: `mat-${Date.now().toString(36)}`,
        title,
        type: 'text',
        content: itemTextContent.trim(),
        size: `${itemTextContent.trim().split(/\s+/).filter(Boolean).length} words`,
      };
      setMaterials(prev => [...prev, newItem]);
      setItemTitle('');
      setItemTextContent('');
    } else if (entryType === 'link') {
      if (!itemLinkUrl.trim()) {
        alert('Please provide a URL.');
        return;
      }
      let formattedUrl = itemLinkUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      const newItem: MaterialItem = {
        id: `mat-${Date.now().toString(36)}`,
        title: itemTitle.trim() || 'Official Resource Link',
        type: 'website',
        url: formattedUrl,
      };
      setMaterials(prev => [...prev, newItem]);
      setItemTitle('');
      setItemLinkUrl('');
    }
  };

  // Save the new post brand page
  const handleSaveNewPage = async () => {
    const effectiveTitle = pageTitle.trim() || 'Post Materials Page';
    const autoSlug = effectiveTitle
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30) || `post-${Date.now().toString(36)}`;

    setSaving(true);
    try {
      const res = await fetch('/api/brand-materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          slug: autoSlug,
          title: effectiveTitle,
          tagline: pageTagline.trim(),
          materials,
          updateAutomationLink: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const createdUrl = data.pageUrl || `https://${subdomain}.unool.co/${data.slug}`;
        if (data.pages) setPages(data.pages);
        setActiveSlug(data.slug);
        if (onAttachPage) {
          onAttachPage(data.slug, createdUrl);
        }
        setModalOpen(false);

        // Open newly created page in a new window immediately
        try {
          if (typeof window !== 'undefined') {
            window.open(createdUrl, '_blank');
          }
        } catch {
          // ignore popup blocker
        }
      } else {
        alert('Failed to create post brand page.');
      }
    } catch (err) {
      console.error('Error saving post brand page:', err);
      alert('Error saving brand page.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleInsertLink = (url: string) => {
    if (onInsertLinkIntoDraft) {
      onInsertLinkIntoDraft(url);
      setInsertedDraft(true);
      setTimeout(() => setInsertedDraft(false), 2000);
    }
  };

  const handleDetach = () => {
    setActiveSlug(null);
    if (onAttachPage) onAttachPage(null, null);
  };

  const handleSelectExisting = (p: BrandMaterialsPageData) => {
    const slug = p.slug || 'showcase';
    const url = slug === 'showcase' ? `https://${subdomain}.unool.co/` : `https://${subdomain}.unool.co/${slug}`;
    setActiveSlug(slug);
    if (onAttachPage) onAttachPage(slug, url);
    setPagesListOpen(false);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF6EE 100%)',
        border: '1.5px solid #E8E0D4',
        borderRadius: 16,
        padding: '16px 18px',
        boxShadow: '0 2px 8px rgba(61,43,31,0.03)',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #DF5B4C 0%, #C44537 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(223,91,76,0.3)',
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#3D2B1F' }}>
                Brand Materials Page for this Post
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: '#DF5B4C',
                  background: 'rgba(223,91,76,0.1)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  border: '1px solid rgba(223,91,76,0.25)',
                }}
              >
                DM Automation Hub
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#8B7355', marginTop: 2 }}>
              Dedicated page auto-delivered when followers comment on this post
            </div>
          </div>
        </div>

        {/* View all pages counter link */}
        {pages.length > 0 && (
          <button
            type="button"
            onClick={() => setPagesListOpen(!pagesListOpen)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E0D4',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 11.5,
              fontWeight: 600,
              color: '#5D4330',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span>Your Pages ({pages.length})</span>
            <ChevronDown size={13} style={{ transform: pagesListOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        )}
      </div>

      {/* ── View All Pages Dropdown ── */}
      {pagesListOpen && pages.length > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E8E0D4',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Choose an existing brand page or view:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            {pages.map((p, idx) => {
              const slug = p.slug || 'showcase';
              const pUrl = slug === 'showcase' ? `https://${subdomain}.unool.co/` : `https://${subdomain}.unool.co/${slug}`;
              const isAttached = activeSlug === slug;

              return (
                <div
                  key={slug || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: isAttached ? '#FEF2F2' : '#FAF8F5',
                    border: isAttached ? '1px solid #FECACA' : '1px solid #EAE3D6',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#3D2B1F', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span>{p.title || slug}</span>
                      <span style={{ fontSize: 10.5, color: '#8B7355', fontWeight: 500 }}>
                        ({p.materials?.length || 0} items)
                      </span>
                      {((p.linked_posts?.length || p.theme?.linked_posts?.length || 0) > 0) && (
                        <span style={{ fontSize: 10, color: '#E1306C', fontWeight: 600 }}>
                          • 📸 {(p.linked_posts?.length || p.theme?.linked_posts?.length)} post(s) linked
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#8B7355', fontFamily: 'monospace' }}>
                      {pUrl}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <a
                      href={pUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        borderRadius: 6,
                        border: '1px solid #D5C9B8',
                        background: '#FFFFFF',
                        color: '#5D4330',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                      title="Open page in new window"
                    >
                      <ExternalLink size={11} />
                      <span>View</span>
                    </a>
                    {!isAttached ? (
                      <button
                        type="button"
                        onClick={() => handleSelectExisting(p)}
                        style={{
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 6,
                          background: '#DF5B4C',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Attach
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>
                        ✓ Attached
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Active Attached Page Banner ── */}
      {attachedPageUrl ? (
        <div
          style={{
            marginTop: 14,
            padding: '12px 16px',
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1.5px solid #10B981',
            boxShadow: '0 2px 10px rgba(16,185,129,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span>{attachedPage?.title || 'Brand Materials Page'}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#047857', background: '#ECFDF5', padding: '1px 6px', borderRadius: 8 }}>
                  {attachedPage?.materials?.length || 0} materials attached
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#059669', textDecoration: 'underline', marginTop: 2, wordBreak: 'break-all' }}>
                <a href={attachedPageUrl} target="_blank" rel="noopener noreferrer">
                  {attachedPageUrl}
                </a>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <a
              href={attachedPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: '#065F46',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 8,
                padding: '5px 10px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Open your live brand page"
            >
              <span>View Page</span>
              <ExternalLink size={12} />
            </a>

            <button
              type="button"
              onClick={() => handleCopyUrl(attachedPageUrl)}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: '#3D2B1F',
                background: '#FAF8F5',
                border: '1px solid #E8E0D4',
                borderRadius: 8,
                padding: '5px 10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {copiedUrl ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
            </button>

            {onInsertLinkIntoDraft && (
              <button
                type="button"
                onClick={() => handleInsertLink(attachedPageUrl)}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#DF5B4C',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '5px 10px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Append page link into your post caption"
              >
                <LinkIcon size={12} />
                <span>{insertedDraft ? 'Link Inserted!' : '+ Insert in Post'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDetach}
              style={{
                fontSize: 11.5,
                color: '#8B7355',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
              }}
              title="Detach page from post"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* ── Action Buttons to Create or Attach ── */
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            style={{
              background: 'linear-gradient(135deg, #DF5B4C 0%, #C44537 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(223,91,76,0.25)',
            }}
          >
            <Plus size={14} />
            <span>+ Create Brand Page for this Post</span>
          </button>

          {pages.length > 0 && (
            <button
              type="button"
              onClick={() => setPagesListOpen(!pagesListOpen)}
              style={{
                background: '#FFFFFF',
                color: '#5D4330',
                border: '1px solid #D5C9B8',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Layers size={14} />
              <span>Attach Existing Page ({pages.length})</span>
            </button>
          )}

          <a
            href="/dashboard/automation?tab=materials"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#8B7355',
              textDecoration: 'none',
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>Open Brand Studio</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* ── Modal Dialog: Create Brand Page for this Post ── */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#FFFDF9',
              borderRadius: 20,
              border: '1.5px solid #E8E0D4',
              maxWidth: 620,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #F0EAE1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#DF5B4C',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Layers size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#3D2B1F' }}>
                    Create Brand Page for this Post
                  </div>
                  <div style={{ fontSize: 12, color: '#8B7355' }}>
                    Will be published at <span style={{ fontFamily: 'monospace' }}>https://{subdomain}.unool.co/[slug]</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8B7355' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Page Title */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5D4330', marginBottom: 6 }}>
                  Page Title *
                </label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="e.g. Summer Lookbook Drop or Free Notion Template"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #E8E0D4',
                    background: '#FFFFFF',
                    fontSize: 13.5,
                    color: '#3D2B1F',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Tagline */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5D4330', marginBottom: 6 }}>
                  Tagline / Description for Followers
                </label>
                <input
                  type="text"
                  value={pageTagline}
                  onChange={(e) => setPageTagline(e.target.value)}
                  placeholder="e.g. Official lookbook, links & high-res resources for this drop"
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #E8E0D4',
                    background: '#FFFFFF',
                    fontSize: 13,
                    color: '#3D2B1F',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Add Materials Sub-section */}
              <div style={{ background: '#FAF7F2', borderRadius: 14, border: '1px solid #E8E0D4', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#5D4330', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Add Post Materials ({materials.length})
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => setEntryType('upload')}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        borderRadius: 6,
                        border: '1px solid',
                        borderColor: entryType === 'upload' ? '#DF5B4C' : '#D5C9B8',
                        background: entryType === 'upload' ? '#DF5B4C' : '#FFFFFF',
                        color: entryType === 'upload' ? '#FFFFFF' : '#5D4330',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryType('text')}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        borderRadius: 6,
                        border: '1px solid',
                        borderColor: entryType === 'text' ? '#DF5B4C' : '#D5C9B8',
                        background: entryType === 'text' ? '#DF5B4C' : '#FFFFFF',
                        color: entryType === 'text' ? '#FFFFFF' : '#5D4330',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Write / Note
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryType('link')}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        borderRadius: 6,
                        border: '1px solid',
                        borderColor: entryType === 'link' ? '#DF5B4C' : '#D5C9B8',
                        background: entryType === 'link' ? '#DF5B4C' : '#FFFFFF',
                        color: entryType === 'link' ? '#FFFFFF' : '#5D4330',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Link
                    </button>
                  </div>
                </div>

                {/* Entry Form depending on mode */}
                {entryType === 'upload' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      accept="image/*,application/pdf,.doc,.docx"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '2px dashed #D5C9B8',
                        borderRadius: 12,
                        padding: '24px 16px',
                        textAlign: 'center',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      {uploading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#DF5B4C' }}>
                          <Loader2 size={20} className="animate-spin" />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>Uploading media to storage...</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <Upload size={24} style={{ color: '#DF5B4C' }} />
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#3D2B1F' }}>
                            Click to upload image, PDF guide, or catalogue
                          </div>
                          <div style={{ fontSize: 11.5, color: '#8B7355' }}>
                            Supports PNG, JPG, WEBP, PDF up to 25MB
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {entryType === 'text' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      type="text"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      placeholder="Note Title (e.g. Exclusive Promo Codes or Sizing Guide)"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #D5C9B8',
                        background: '#FFFFFF',
                        fontSize: 12.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <textarea
                      value={itemTextContent}
                      onChange={(e) => setItemTextContent(e.target.value)}
                      rows={4}
                      placeholder="Type or paste your notes, instructions, specs or discount codes directly here..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #D5C9B8',
                        background: '#FFFFFF',
                        fontSize: 12.5,
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTextOrLink}
                      style={{
                        alignSelf: 'flex-end',
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: 8,
                        background: '#3D2B1F',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Add Note
                    </button>
                  </div>
                )}

                {entryType === 'link' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      type="text"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      placeholder="Link Title (e.g. Official Figma File or Notion Template)"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #D5C9B8',
                        background: '#FFFFFF',
                        fontSize: 12.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="url"
                      value={itemLinkUrl}
                      onChange={(e) => setItemLinkUrl(e.target.value)}
                      placeholder="https://..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #D5C9B8',
                        background: '#FFFFFF',
                        fontSize: 12.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTextOrLink}
                      style={{
                        alignSelf: 'flex-end',
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: 8,
                        background: '#3D2B1F',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Add Link
                    </button>
                  </div>
                )}

                {/* List of added materials */}
                {materials.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {materials.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: '#FFFFFF',
                          borderRadius: 8,
                          border: '1px solid #EAE3D6',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          {m.type === 'image' && <ImageIcon size={15} style={{ color: '#DF5B4C', shrink: 0 }} />}
                          {m.type === 'pdf' && <FileText size={15} style={{ color: '#B8473D', shrink: 0 }} />}
                          {m.type === 'text' && <AlignLeft size={15} style={{ color: '#1D4ED8', shrink: 0 }} />}
                          {m.type === 'website' && <Globe size={15} style={{ color: '#1C2B21', shrink: 0 }} />}
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#3D2B1F', truncate: true }}>
                            {m.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMaterials(materials.filter(item => item.id !== m.id))}
                          style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 2 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #F0EAE1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #D5C9B8',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#5D4330',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveNewPage}
                disabled={saving}
                style={{
                  background: 'linear-gradient(135deg, #DF5B4C 0%, #C44537 100%)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(223,91,76,0.3)',
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Creating &amp; Opening Page...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Create Page &amp; Open Live</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
