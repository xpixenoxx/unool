'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
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
  Layers,
  X,
  Loader2,
  Share2,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Clipboard,
  PenTool,
  Type,
  Eye,
  ArrowRight,
  Link as LinkIcon,
  Database,
  Package,
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
  tagline?: string;
  description?: string;
  materials: MaterialItem[];
  theme?: {
    accentColor?: string;
    template?: string;
  };
  is_published?: boolean;
}

interface BrandMaterialsSectionProps {
  workspaceId: string;
  userId: string;
  onLinkCreated?: (url: string) => void;
  currentLinkUrl?: string | null;
}

// Clean helper for masking Cloudflare URLs
export function maskCloudflareUrl(url?: string | null): string {
  if (!url) return '';
  const matchR2Dev = url.match(/https?:\/\/[^/]+\.r2\.dev\/(.+)$/);
  if (matchR2Dev) return `/api/media/${matchR2Dev[1]}`;
  const matchR2Storage = url.match(/https?:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+\/(.+)$/);
  if (matchR2Storage) return `/api/media/${matchR2Storage[1]}`;
  return url;
}

// Clean query string generator for an item (without mentioning query string in UI)
export function getItemQueryParam(item?: MaterialItem | null): string {
  if (!item) return '';
  const clean = encodeURIComponent(
    (item.title || 'asset')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 40)
  );
  return `item=${clean}`;
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
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [copiedContentId, setCopiedContentId] = useState<string | null>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Multi-page state
  const [pages, setPages] = useState<BrandMaterialsPageData[]>([]);
  const [activePageSlug, setActivePageSlug] = useState<string>('showcase');
  const [isCreatingNewPage, setIsCreatingNewPage] = useState<boolean>(false);

  // Page state
  const [subdomain, setSubdomain] = useState<string>('user');
  const [internalSlug, setInternalSlug] = useState<string>('showcase');
  const [title, setTitle] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  // Inline Add Material Box (replaces modal popup)
  const [addBoxOpen, setAddBoxOpen] = useState(false);
  const [matType, setMatType] = useState<'image' | 'text' | 'pdf' | 'doc' | 'website'>('image');
  const [matTitle, setMatTitle] = useState('');
  const [matUrl, setMatUrl] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matContent, setMatContent] = useState('');
  const [matCategory, setMatCategory] = useState('');
  const [matSize, setMatSize] = useState('');
  const [matThumbnail, setMatThumbnail] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Clean canonical live URL based on user's first uploaded file/item
  const firstMaterial = materials.length > 0 ? materials[0] : null;
  const activeItemQuery = getItemQueryParam(firstMaterial);
  const livePageUrl = `https://${subdomain}.unool.co/${internalSlug && internalSlug !== 'showcase' ? internalSlug : (activeItemQuery ? `?${activeItemQuery}` : '')}`;

  // Fetch page data on mount
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/brand-materials?workspaceId=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setSubdomain(data.subdomain || 'user');
            if (data.pages) {
              setPages(data.pages);
            }
            if (data.page) {
              setActivePageSlug(data.page.slug || 'showcase');
              setInternalSlug(data.page.slug || 'showcase');
              setTitle(data.page.title || '');
              setTagline(data.page.tagline || '');
              setDescription(data.page.description || '');
              const sanitized = (data.page.materials || []).map((m: any) => ({
                ...m,
                url: maskCloudflareUrl(m.url),
                thumbnailUrl: m.thumbnailUrl ? maskCloudflareUrl(m.thumbnailUrl) : undefined,
              }));
              setMaterials(sanitized);
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

  // Read URL search params for quick entry from post composer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('newPostPage') === 'true') {
        const postTitle = sp.get('postTitle') || '';
        startNewPostPage(postTitle);
      }
    }
  }, []);

  // Select an existing page to edit
  const selectPage = (p: BrandMaterialsPageData) => {
    setIsCreatingNewPage(false);
    setActivePageSlug(p.slug || 'showcase');
    setInternalSlug(p.slug || 'showcase');
    setTitle(p.title || '');
    setTagline(p.tagline || '');
    setDescription(p.description || '');
    const sanitized = (p.materials || []).map((m: any) => ({
      ...m,
      url: maskCloudflareUrl(m.url),
      thumbnailUrl: m.thumbnailUrl ? maskCloudflareUrl(m.thumbnailUrl) : undefined,
    }));
    setMaterials(sanitized);
    setSuccessBanner(null);
  };

  // Start drafting a new brand page for a new post
  const startNewPostPage = (initialTitle?: string) => {
    setIsCreatingNewPage(true);
    const cleanSlug = initialTitle
      ? initialTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
      : `post-${Date.now().toString(36)}`;
    const newSlug = cleanSlug || `post-${Date.now().toString(36)}`;
    setActivePageSlug(newSlug);
    setInternalSlug(newSlug);
    setTitle(initialTitle || '');
    setTagline('Exclusive resources & materials for this post');
    setDescription('');
    setMaterials([]);
    setSuccessBanner(null);
    setAddBoxOpen(false);
  };

  // Delete a brand page
  const handleDeletePage = async (slugToDelete: string) => {
    if (!confirm('Are you sure you want to delete this brand page? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/brand-materials?workspaceId=${workspaceId}&slug=${slugToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        const remaining = data.pages || pages.filter(p => p.slug !== slugToDelete);
        setPages(remaining);
        if (activePageSlug === slugToDelete) {
          if (remaining.length > 0) {
            selectPage(remaining[0]);
          } else {
            startNewPostPage();
          }
        }
      } else {
        alert('Failed to delete page.');
      }
    } catch (err) {
      console.error('Delete page error:', err);
      alert('Error deleting page.');
    }
  };

  // Copy link
  const copyLink = (urlToCopy?: string | React.MouseEvent<HTMLButtonElement>) => {
    const targetUrl = typeof urlToCopy === 'string' ? urlToCopy : livePageUrl;
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // Copy specific asset link
  const copyAssetLink = (item: MaterialItem) => {
    const itemParam = getItemQueryParam(item);
    const itemUrl = `https://${subdomain}.unool.co/?${itemParam}`;
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(itemUrl);
      setCopiedItemId(item.id);
      setTimeout(() => setCopiedItemId(null), 2000);
    }
  };

  // Process dropped or selected file
  const processUploadedFile = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      // If it's a plain text file, we can also extract its text
      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const text = await file.text();
        setMatContent(text);
        if (!matTitle) setMatTitle(file.name.replace(/\.[^/.]+$/, ''));
        setMatType('text');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/brand-materials/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const cleanUrl = maskCloudflareUrl(data.url);
        setMatUrl(cleanUrl);
        if (!matTitle) {
          setMatTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
        setMatSize(data.size || '');
        if (data.type === 'image') {
          setMatThumbnail(cleanUrl);
          setMatType('image');
        } else if (data.type === 'pdf') {
          setMatType('pdf');
        } else {
          setMatType('doc');
        }
      } else {
        alert('File upload failed. You can also paste an asset link.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  // File input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  // Drag and drop handlers for spacious dropzone
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  // Helper to intelligently derive a title from pasted plain text
  const deriveTitleFromText = (rawText: string) => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const firstLine = lines[0].replace(/^[#*\-•\d.]+\s*/, '');
      return firstLine.length > 50 ? firstLine.slice(0, 47) + '...' : firstLine;
    }
    return 'Brand Story & Notes';
  };

  // Direct paste handler (Ctrl+V) for text or screenshots
  const handleContainerPaste = async (e: React.ClipboardEvent) => {
    const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea') {
      return;
    }

    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      setAddBoxOpen(true);
      await processUploadedFile(files[0]);
      setPasteNotice('✓ Screenshot / image uploaded from clipboard!');
      setTimeout(() => setPasteNotice(null), 3500);
      return;
    }

    const text = e.clipboardData?.getData('text');
    if (text && text.trim()) {
      e.preventDefault();
      setMatType('text');
      setMatContent(text);
      if (!matTitle) {
        setMatTitle(deriveTitleFromText(text));
      }
      setAddBoxOpen(true);
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      setPasteNotice(`✓ Pasted ${words} words directly! Review or edit below.`);
      setTimeout(() => setPasteNotice(null), 3500);
    }
  };

  // Quick action: switch directly to text note / write mode
  const handleOpenTextMode = () => {
    setMatType('text');
    setAddBoxOpen(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 80);
  };

  // Insert formatting markup into textarea
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) {
      setMatContent(prev => prev + prefix + suffix);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selected = matContent.substring(start, end);
    const replacement = prefix + selected + suffix;
    const newContent = matContent.substring(0, start) + replacement + matContent.substring(end);
    setMatContent(newContent);
    setTimeout(() => {
      el.focus();
      const newCursor = start + prefix.length + selected.length;
      el.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  // Direct one-click paste from clipboard inside text mode
  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setMatContent(text);
          if (!matTitle) {
            setMatTitle(deriveTitleFromText(text));
          }
          const words = text.trim().split(/\s+/).filter(Boolean).length;
          setPasteNotice(`✓ Pasted ${words} words from clipboard!`);
          setTimeout(() => setPasteNotice(null), 3500);
        } else {
          alert('Clipboard is empty or does not contain plain text.');
        }
      } else {
        alert('Please press Ctrl+V directly into the text area below.');
      }
    } catch {
      alert('Could not read clipboard automatically. Please press Ctrl+V inside the text box.');
    }
  };

  // Copy item text content back to clipboard
  const copyItemContent = (item: MaterialItem) => {
    const textToCopy = item.content || item.description || '';
    if (!textToCopy) return;
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(textToCopy);
      setCopiedContentId(item.id);
      setTimeout(() => setCopiedContentId(null), 2000);
    }
  };

  // Add material item to local state
  const handleAddMaterial = () => {
    let effectiveTitle = matTitle.trim();
    if (!effectiveTitle) {
      if (matType === 'text' && matContent.trim()) {
        effectiveTitle = deriveTitleFromText(matContent.trim());
      } else {
        alert('Please provide a title for this material.');
        return;
      }
    }

    if (matType === 'text') {
      if (!matContent.trim()) {
        alert('Please enter or type text content for this material.');
        return;
      }
    } else {
      if (!matUrl.trim()) {
        alert('Please upload a file or provide a destination link.');
        return;
      }
    }

    const cleanUrl = maskCloudflareUrl(matUrl.trim());
    const cleanThumb = matThumbnail.trim() ? maskCloudflareUrl(matThumbnail.trim()) : (matType === 'image' ? cleanUrl : undefined);

    const newItem: MaterialItem = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: matType,
      title: effectiveTitle,
      url: cleanUrl || undefined,
      content: matType === 'text' ? matContent.trim() : undefined,
      description: matDesc.trim() || undefined,
      category: matCategory.trim() || undefined,
      size: matSize.trim() || (matType === 'text' ? `${matContent.trim().split(/\s+/).filter(Boolean).length} words` : undefined),
      thumbnailUrl: cleanThumb,
      order: materials.length,
    };

    setMaterials([newItem, ...materials]);
    
    // Reset form
    setMatTitle('');
    setMatUrl('');
    setMatDesc('');
    setMatContent('');
    setMatCategory('');
    setMatSize('');
    setMatThumbnail('');
    setAddBoxOpen(false);
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
      const slugToUse = isCreatingNewPage
        ? (title.trim()
            ? title.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
            : `post-${Date.now().toString(36)}`)
        : (internalSlug || 'showcase');

      const res = await fetch('/api/brand-materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          slug: slugToUse,
          title: title.trim() || 'Brand Materials',
          tagline: tagline.trim(),
          description: description.trim(),
          materials,
          updateAutomationLink: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const publishedUrl = data.pageUrl || livePageUrl;
        setSuccessBanner(publishedUrl);
        setIsCreatingNewPage(false);
        setInternalSlug(data.slug);
        setActivePageSlug(data.slug);
        if (data.pages) {
          setPages(data.pages);
        }
        if (onLinkCreated) {
          onLinkCreated(publishedUrl);
        }
        // Automatically open the created page in a new window so user sees it right away!
        try {
          if (typeof window !== 'undefined') {
            window.open(publishedUrl, '_blank');
          }
        } catch {
          // If popup is blocked by browser, user clicks View Created Page
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
          padding: '22px 26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          boxShadow: '0 6px 20px rgba(16,185,129,0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="w-5 h-5 bg-white/30 rounded-full" style={{ width: 14, height: 14 }} />
            </div>
            <div>
              <div style={{ color: '#065F46', fontWeight: 800, fontSize: 16 }}>
                Page Created &amp; Live!
              </div>
              <div style={{ color: '#047857', fontSize: 13, marginTop: 3 }}>
                Your dedicated page for this post is now active at:{' '}
                <a href={successBanner} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, textDecoration: 'underline' }}>
                  {successBanner}
                </a>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => copyLink(successBanner)} className="un-btn" style={{ fontSize: 13, background: '#FFFFFF' }}>
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Page Link'}</span>
            </button>
            <a
              href={successBanner}
              target="_blank"
              rel="noopener noreferrer"
              className="un-btn un-btn-primary"
              style={{ fontSize: 13, background: '#059669', borderColor: '#059669', padding: '8px 18px', fontWeight: 700 }}
            >
              <span>View Created Page</span>
              <ExternalLink size={14} />
            </a>
            <button
              type="button"
              onClick={startNewPostPage}
              className="un-btn"
              style={{ fontSize: 13, background: '#F0FDF4', borderColor: '#A7F3D0', color: '#065F46' }}
            >
              <Plus size={14} />
              <span>Create Another Post Page</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Page Switcher & New Post Page Creator Bar ── */}
      <div style={{
        background: '#FFFDF9',
        border: '1.5px solid #E8E0D4',
        borderRadius: 18,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8B7355', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Layers size={14} style={{ color: '#DF5B4C' }} />
            <span>Brand &amp; Post Pages:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {pages.map((p, idx) => {
              const isSelected = (!isCreatingNewPage && (internalSlug === p.slug || activePageSlug === p.slug));
              return (
                <button
                  key={p.slug || idx}
                  type="button"
                  onClick={() => selectPage(p)}
                  className="un-btn"
                  style={{
                    padding: '5px 12px',
                    fontSize: 12,
                    borderRadius: 20,
                    background: isSelected ? '#3D2B1F' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#3D2B1F',
                    borderColor: isSelected ? '#3D2B1F' : '#E8E0D4',
                    fontWeight: 600,
                  }}
                >
                  <span>{p.title || p.slug || 'Showcase'}</span>
                  <span style={{ fontSize: 10.5, opacity: 0.75 }}>({p.materials?.length || 0})</span>
                </button>
              );
            })}

            {isCreatingNewPage && (
              <span style={{
                padding: '5px 12px',
                fontSize: 12,
                borderRadius: 20,
                background: '#ECFDF5',
                color: '#065F46',
                border: '1.5px dashed #10B981',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <Package size={12} />
                <span>New Post Page (Draft)</span>
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={startNewPostPage}
          className="un-btn un-btn-primary"
          style={{ fontSize: 12, padding: '7px 16px', background: '#DF5B4C', borderColor: '#DF5B4C', borderRadius: 20 }}
          title="Create a dedicated materials page for a new post"
        >
          <Plus size={14} />
          <span>+ Create Page for New Post</span>
        </button>
      </div>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#DF5B4C', background: '#FDF2F0', padding: '3px 10px', borderRadius: 8 }}>
              Brand &amp; Product Showcase
            </span>
            <span style={{ fontSize: 12, color: '#8B7355', fontWeight: 500 }}>Auto-Dispatched on Instagram DM &amp; Comments</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <h2 className="un-editorial-font" style={{ fontSize: 21, fontWeight: 700, color: '#3D2B1F', margin: 0, wordBreak: 'break-all' }}>
              {livePageUrl}
            </h2>
          </div>
          <p style={{ fontSize: 13, color: '#8B7355', margin: '4px 0 0' }}>
            When audience members comment or DM requesting materials, lookbooks, or product info, this dedicated page is shared directly with them.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => copyLink(livePageUrl)} className="un-btn" style={{ fontSize: 13 }}>
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
                  <Package size={16} />
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
              <label className="un-label">Tagline / Subheading</label>
              <input
                type="text"
                className="un-input"
                placeholder="e.g. Official product lookbook, catalogue, and brand guides"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
              />
            </div>

            <div className="un-field" style={{ marginBottom: 0 }}>
              <label className="un-label">Brand Story &amp; Product Overview</label>
              <textarea
                className="un-input un-textarea"
                style={{ minHeight: 120 }}
                placeholder="Share context about your brand, mission, product line, and what materials are provided in this hub."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Materials Asset Manager & Dropzone */}
        <div>
          <div className="un-card">
            <div className="un-card-header">
              <div className="un-card-title">
                <div className="un-card-title-icon" style={{ background: '#ECFDF5', color: '#047857' }}>
                  <Database size={16} />
                </div>
                <span>Brand Materials Repository</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleOpenTextMode}
                  className="un-btn"
                  style={{ fontSize: 12, padding: '6px 12px', background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                  title="Type a note or guide directly"
                >
                  <PenTool size={13} />
                  <span>Write Note</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddBoxOpen(!addBoxOpen)}
                  className="un-btn un-btn-primary"
                  style={{ fontSize: 12, padding: '6px 14px' }}
                >
                  {addBoxOpen ? <ChevronUp size={14} /> : <Plus size={14} />}
                  <span>{addBoxOpen ? 'Close Form' : 'Add Material'}</span>
                </button>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#8B7355', margin: '0 0 16px' }}>
              Add images, direct text stories, PDFs, guides, and website links for your brand or product.
            </p>

            {/* ── Spacious Drag & Drop Upload Zone + Direct Paste ── */}
            <div
              tabIndex={0}
              onPaste={handleContainerPaste}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                minHeight: 170,
                padding: '24px 20px',
                textAlign: 'center',
                background: isDraggingOver ? '#FEF3C7' : '#FAF8F5',
                border: isDraggingOver ? '2px dashed #D97706' : '2px dashed #E5DFD5',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                transition: 'all 0.2s ease',
                marginBottom: 16,
                outline: 'none',
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,application/pdf,text/*,.doc,.docx"
                onChange={handleFileInputChange}
              />
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: isDraggingOver ? '#FDE68A' : '#F0EBE3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B7355',
                transition: 'transform 0.2s ease',
                transform: isDraggingOver ? 'scale(1.1)' : 'scale(1)',
              }}>
                {uploading ? <Loader2 className="animate-spin" size={22} /> : <Upload size={22} />}
              </div>
              <div>
                <div style={{ color: '#3D2B1F', fontWeight: 700, fontSize: 14 }}>
                  {uploading ? 'Uploading Asset to R2...' : isDraggingOver ? 'Drop files here!' : 'Drop files, write notes directly, or paste text / stories'}
                </div>
                <div style={{ color: '#8B7355', fontSize: 12, marginTop: 4 }}>
                  Type notes directly, write guides, or press <kbd style={{ padding: '2px 6px', background: '#F0EBE3', borderRadius: 4, border: '1px solid #D6CEBE', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}>Ctrl+V</kbd> to paste text &amp; screenshots — no files needed!
                </div>
              </div>

              {/* Action buttons inside dropzone */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="un-btn"
                  style={{ fontSize: 12, padding: '7px 14px', background: '#FFFFFF', color: '#3D2B1F' }}
                >
                  <Upload size={14} />
                  <span>Browse Files</span>
                </button>
                <span style={{ fontSize: 12, color: '#A89987', fontWeight: 600 }}>or</span>
                <button
                  type="button"
                  onClick={handleOpenTextMode}
                  className="un-btn"
                  style={{ fontSize: 12, padding: '7px 14px', background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                >
                  <PenTool size={13} />
                  <span>Write Note Directly</span>
                </button>
              </div>
            </div>

            {/* Notification alert when text or screenshot is pasted */}
            {pasteNotice && (
              <div style={{
                background: '#ECFDF5',
                border: '1px solid #6EE7B7',
                borderRadius: 12,
                padding: '10px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#065F46',
                fontSize: 12.5,
                fontWeight: 600,
              }}>
                <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block flex-shrink-0" />
                <span>{pasteNotice}</span>
              </div>
            )}

            {/* ── Expandable Inline Add Material Box (No Popup Dialog) ── */}
            {addBoxOpen && (
              <div style={{
                background: '#FFFDF9',
                border: '1.5px solid #E8E0D4',
                borderRadius: 16,
                padding: '20px',
                marginBottom: 16,
                boxShadow: '0 4px 16px rgba(61,43,31,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#3D2B1F' }}>
                    Add New Showcase Material
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddBoxOpen(false)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8B7355' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Type selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {[
                    { id: 'image', label: 'Image', icon: <ImageIcon size={14} /> },
                    { id: 'text', label: 'Write Note', icon: <PenTool size={14} /> },
                    { id: 'pdf', label: 'PDF', icon: <FileText size={14} /> },
                    { id: 'doc', label: 'Doc', icon: <File size={14} /> },
                    { id: 'website', label: 'Link', icon: <Globe size={14} /> },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMatType(t.id as any)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: '8px 4px',
                        borderRadius: 10,
                        border: matType === t.id ? '2px solid #3D2B1F' : '1px solid #E8E0D4',
                        background: matType === t.id ? '#FAF7F2' : '#FFFDF9',
                        color: matType === t.id ? '#3D2B1F' : '#8B7355',
                        fontWeight: 600,
                        fontSize: 11.5,
                        cursor: 'pointer'
                      }}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="un-field" style={{ marginBottom: 0 }}>
                  <label className="un-label">Title / Heading *</label>
                  <input
                    type="text"
                    className="un-input"
                    placeholder="e.g. Care Instructions, Brand Story, or Size Guide"
                    value={matTitle}
                    onChange={e => setMatTitle(e.target.value)}
                  />
                </div>

                {/* Text Type Content */}
                {matType === 'text' ? (
                  <div className="un-field" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                      <label className="un-label" style={{ marginBottom: 0 }}>
                        Note Content / Story / Guide *
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {/* Quick markdown formatting tools */}
                        <button
                          type="button"
                          onClick={() => insertFormatting('# ')}
                          className="un-btn"
                          style={{ padding: '2px 8px', fontSize: 11, background: '#FAF7F2', fontWeight: 700 }}
                          title="Insert Heading"
                        >
                          H1
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('## ')}
                          className="un-btn"
                          style={{ padding: '2px 8px', fontSize: 11, background: '#FAF7F2', fontWeight: 700 }}
                          title="Insert Subheading"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('• ')}
                          className="un-btn"
                          style={{ padding: '2px 8px', fontSize: 11, background: '#FAF7F2' }}
                          title="Insert Bullet Point"
                        >
                          • Bullet
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('**', '**')}
                          className="un-btn"
                          style={{ padding: '2px 8px', fontSize: 11, background: '#FAF7F2', fontWeight: 700 }}
                          title="Bold Text"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={handlePasteFromClipboard}
                          className="un-btn"
                          style={{ padding: '2px 9px', fontSize: 11, background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                          title="Paste from clipboard"
                        >
                          <ClipboardPaste size={12} />
                          <span>Paste</span>
                        </button>
                        {matContent && (
                          <button
                            type="button"
                            onClick={() => setMatContent('')}
                            style={{ background: 'transparent', border: 'none', color: '#8B7355', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      ref={textareaRef}
                      className="un-input un-textarea"
                      style={{ minHeight: 150, fontFamily: 'inherit', lineHeight: 1.6 }}
                      placeholder="Type your notes, product details, craft guide, FAQ, or brand story directly here...&#10;&#10;Supports headings (#), bullet lists (- or •), bold (**text**), or simple paragraphs."
                      value={matContent}
                      onChange={e => setMatContent(e.target.value)}
                      onBlur={() => {
                        if (!matTitle.trim() && matContent.trim()) {
                          setMatTitle(deriveTitleFromText(matContent));
                        }
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: 11, color: '#8B7355' }}>
                      <span>
                        {matContent.trim() ? (
                          <>
                            <strong>{matContent.trim().split(/\s+/).filter(Boolean).length}</strong> words • <strong>{matContent.length}</strong> chars • <strong>{matContent.split('\n').length}</strong> lines
                          </>
                        ) : (
                          'Type directly or paste from clipboard — no .txt or .md files needed'
                        )}
                      </span>
                      <span>Markdown &amp; plain text supported</span>
                    </div>
                  </div>
                ) : (
                  <div className="un-field" style={{ marginBottom: 0 }}>
                    <label className="un-label">Asset URL or Uploaded Link *</label>
                    <input
                      type="text"
                      className="un-input"
                      placeholder="https://... (or use the dropzone above)"
                      value={matUrl}
                      onChange={e => setMatUrl(maskCloudflareUrl(e.target.value))}
                    />
                  </div>
                )}

                <div className="un-field" style={{ marginBottom: 0 }}>
                  <label className="un-label">Brief Description</label>
                  <input
                    type="text"
                    className="un-input"
                    placeholder="Short summary for viewers"
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
                      placeholder="e.g. Toys, Lookbook"
                      value={matCategory}
                      onChange={e => setMatCategory(e.target.value)}
                    />
                  </div>
                  {matType !== 'text' && (
                    <div className="un-field" style={{ width: '35%', marginBottom: 0 }}>
                      <label className="un-label">Size / Format</label>
                      <input
                        type="text"
                        className="un-input"
                        placeholder="e.g. 20 KB"
                        value={matSize}
                        onChange={e => setMatSize(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setAddBoxOpen(false)}
                    className="un-btn"
                    style={{ fontSize: 12 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="un-btn un-btn-primary"
                    style={{ fontSize: 12 }}
                  >
                    <Plus size={14} />
                    <span>Add to Showcase</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Materials List ── */}
            {materials.length === 0 ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                background: '#FAF8F5',
                border: '1px solid #E5DFD5',
                borderRadius: 14,
                color: '#8B7355',
                fontSize: 13,
              }}>
                No materials placed yet. Drag files into the box above or click "+ Add Material".
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
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: item.type === 'image' ? '#ECFDF5' : item.type === 'text' ? '#EFF6FF' : item.type === 'pdf' ? '#FFF1F2' : item.type === 'doc' ? '#FEF3C7' : '#F5F3FF',
                        color: item.type === 'image' ? '#047857' : item.type === 'text' ? '#1D4ED8' : item.type === 'pdf' ? '#BE123C' : item.type === 'doc' ? '#B45309' : '#7C3AED',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}>
                        {item.type === 'image' && item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : item.type === 'image' ? (
                          <ImageIcon size={18} />
                        ) : item.type === 'text' ? (
                          <AlignLeft size={18} />
                        ) : item.type === 'pdf' ? (
                          <FileText size={18} />
                        ) : item.type === 'doc' ? (
                          <File size={18} />
                        ) : (
                          <Globe size={18} />
                        )}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ color: '#3D2B1F', fontWeight: 600, fontSize: 13.5, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {item.title}
                        </div>
                        {item.type === 'text' && (item.content || item.description) && (
                          <div style={{
                            color: '#6B5E51',
                            fontSize: 12,
                            marginTop: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 340,
                          }}>
                            {item.content || item.description}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#8B7355', marginTop: 2 }}>
                          <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{item.type}</span>
                          {item.size && <span>• {item.size}</span>}
                          {item.category && <span>• {item.category}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {item.type === 'text' && (
                        <button
                          type="button"
                          onClick={() => copyItemContent(item)}
                          className="un-btn"
                          style={{ padding: '5px 8px', fontSize: 11, background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                          title="Copy pasted text to clipboard"
                        >
                          {copiedContentId === item.id ? <Check size={13} style={{ color: '#10B981' }} /> : <Copy size={13} />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => copyAssetLink(item)}
                        className="un-btn"
                        style={{ padding: '5px 8px', fontSize: 11, background: '#FAF8F5' }}
                        title="Copy direct showcase link for this asset"
                      >
                        {copiedItemId === item.id ? <Check size={13} style={{ color: '#10B981' }} /> : <Share2 size={13} />}
                      </button>
                      {item.url && (
                        <a
                          href={maskCloudflareUrl(item.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="un-btn"
                          style={{ padding: '5px 8px', fontSize: 11, background: '#FAF8F5' }}
                          title="Preview Asset"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
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

      {/* ── All Created Brand & Post Pages Gallery ── */}
      <div className="un-card">
        <div className="un-card-header">
          <div className="un-card-title">
            <div className="un-card-title-icon" style={{ background: '#F5EFE2', color: '#8B7355' }}>
              <Layers size={16} />
            </div>
            <span>Your Brand &amp; Post Pages ({pages.length})</span>
          </div>
          <button
            type="button"
            onClick={startNewPostPage}
            className="un-btn un-btn-primary"
            style={{ fontSize: 12, padding: '6px 14px' }}
          >
            <Plus size={14} />
            <span>Create Page for New Post</span>
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#8B7355', margin: '0 0 16px' }}>
          Every post, product drop, or lookbook can have its own dedicated page. Audience members who interact with your Instagram posts will automatically receive the matching link via SignalDM.
        </p>

        {pages.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#FAF8F5', borderRadius: 14, color: '#8B7355', fontSize: 13 }}>
            No pages created yet. Fill out the details above and click &quot;Save &amp; Create Page&quot;.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
            {pages.map((p, idx) => {
              const pFirstMat = (p.materials && p.materials.length > 0) ? p.materials[0] : null;
              const pItemQuery = getItemQueryParam(pFirstMat);
              const pUrl = `https://${subdomain}.unool.co/${p.slug !== 'showcase' ? p.slug : (pItemQuery ? `?${pItemQuery}` : '')}`;
              const isCurrent = activePageSlug === p.slug;

              return (
                <div
                  key={p.id || p.slug || idx}
                  style={{
                    background: isCurrent ? '#FFFDF9' : '#FFFFFF',
                    border: isCurrent ? '2px solid #3D2B1F' : '1.5px solid #E8E0D4',
                    borderRadius: 16,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                    boxShadow: isCurrent ? '0 4px 16px rgba(61,43,31,0.08)' : '0 1px 4px rgba(61,43,31,0.02)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isCurrent ? '#DF5B4C' : '#8B7355', background: isCurrent ? '#FDF2F0' : '#F5EFE2', padding: '2px 8px', borderRadius: 6 }}>
                        {p.slug === 'showcase' ? 'Default Showcase' : `/${p.slug}`}
                      </span>
                      {isCurrent && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Check size={12} /> Active in Editor
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#3D2B1F', marginBottom: 4 }}>
                      {p.title || 'Untitled Page'}
                    </div>
                    {p.tagline && (
                      <div style={{ fontSize: 12, color: '#8B7355', marginBottom: 8, lineHeight: 1.4 }}>
                        {p.tagline}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11, color: '#6B5E51' }}>
                      <span style={{ fontWeight: 600 }}>{p.materials?.length || 0} materials</span>
                      <span>•</span>
                      <a href={pUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#8B7355', textDecoration: 'underline', maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pUrl}
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #F0EAE1', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <a
                        href={pUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="un-btn"
                        style={{ padding: '5px 10px', fontSize: 11.5, background: '#FAF8F5' }}
                        title="View live page"
                      >
                        <ExternalLink size={13} />
                        <span>Open</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyLink(pUrl)}
                        className="un-btn"
                        style={{ padding: '5px 8px', fontSize: 11.5, background: '#FAF8F5' }}
                        title="Copy page URL"
                      >
                        <Copy size={13} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => selectPage(p)}
                          className="un-btn un-btn-primary"
                          style={{ padding: '5px 12px', fontSize: 11.5 }}
                        >
                          Edit
                        </button>
                      )}
                      {pages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeletePage(p.slug || '')}
                          className="un-btn"
                          style={{ padding: '5px 8px', fontSize: 11.5, color: '#DC2626', borderColor: '#FECACA' }}
                          title="Delete this page"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
            <div style={{ color: '#3D2B1F', fontWeight: 700, fontSize: 14 }}>
              {isCreatingNewPage ? 'Ready to Create New Post Brand Page' : 'Ready to Publish Materials Hub'}
            </div>
            <div style={{ color: '#8B7355', fontSize: 12 }}>
              {isCreatingNewPage
                ? `Creates and immediately opens dedicated page at ${subdomain}.unool.co/${internalSlug || 'post'}`
                : `Saves brand details and updates your live showcase link on ${subdomain}.unool.co`}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSavePage}
          disabled={saving}
          className="un-btn un-btn-primary"
          style={{ minWidth: 170, fontSize: 13.5, background: isCreatingNewPage ? '#DF5B4C' : undefined, borderColor: isCreatingNewPage ? '#DF5B4C' : undefined }}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>{isCreatingNewPage ? 'Creating Page...' : 'Publishing Hub...'}</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>{isCreatingNewPage ? 'Save & Create Brand Page' : 'Save & Update Showcase'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
