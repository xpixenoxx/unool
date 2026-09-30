'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, PenTool, Loader2, Sparkles, Trash2, Palette, Link as LinkIcon, ExternalLink, Plus, CheckCircle, AlertCircle, Trash, ArrowRight, Shield, Activity, CalendarDays, MousePointerClick, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TEMPLATE_REGISTRY } from '@/components/profile/templates/registry';
import { TemplateGallery } from '@/components/profile/TemplateGallery';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/* ─── Biscuit Design System ───────────────────────────────── */
const B = {
  bg: '#F7F3ED',
  card: '#FFFDF9',
  cardAlt: '#FAF7F2',
  cardBorder: '#EDE7DD',
  cardShadow: '0 1px 3px rgba(61,43,31,0.06), 0 4px 12px rgba(61,43,31,0.04)',
  cardShadowHover: '0 2px 8px rgba(61,43,31,0.08), 0 8px 24px rgba(61,43,31,0.06)',
  text: '#3D2B1F',
  textSecondary: '#6B5744',
  textMuted: '#8B7355',
  textLight: '#A69279',
  accent: '#C4A265',
  accentDark: '#A68B52',
  accentBg: '#F5EFE2',
  success: '#4A8C5C',
  successBg: '#EBF5EE',
  danger: '#B85450',
  dangerBg: '#FBEDED',
  border: '#E8E0D4',
  borderLight: '#F0EBE3',
  inputBg: '#FFFDF9',
};

/* ─── Types ────────────────────────────────────────────────── */
type TabValue = 'profile' | 'links' | 'templates';

interface ProfileLink {
  label: string;
  url: string;
  type: string;
  icon?: string;
}

interface ProofPoint {
  type: string;
  value: string;
  url: string;
}

interface ProfileTheme {
  template: string;
}

interface ProfileViewer {
  id: string;
  viewerUserId: string;
  email?: string;
  fullName?: string;
}

interface Profile {
  id?: string;
  name: string;
  headline: string;
  bio: string;
  role: string;
  company: string;
  avatarUrl?: string;
  links: ProfileLink[];
  proofPoints: ProofPoint[];
  theme: ProfileTheme;
  subdomain?: string | null;
  visibility?: 'public' | 'private';
}

interface ExtractedProfile {
  name: string;
  headline: string;
  bio: string;
  role: string;
  company: string;
  links: Array<{ label: string; url: string; type: string }>;
  proofPoints: Array<{ type: string; value: string; url?: string }>;
}

const DEFAULT_TEMPLATE = 'minimalist';

interface PresenceClientProps {
  userId: string;
  workspaceId: string;
}

/* ─── Motion helpers ───────────────────────────────────────── */
const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const transition = { type: 'spring' as const, stiffness: 400, damping: 30 };

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function PresenceClient({ userId, workspaceId }: PresenceClientProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('profile');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claimingSubdomain, setClaimingSubdomain] = useState(false);
  const [deletingSubdomain, setDeletingSubdomain] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [sourceUrl, setSourceUrl] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [claimedSubdomain, setClaimedSubdomain] = useState<string | null>(null);
  const [lastCheckedSubdomain, setLastCheckedSubdomain] = useState<string>('');

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [profile, setProfile] = useState<Profile>({
    name: '', headline: '', bio: '', role: '', company: '', avatarUrl: '',
    links: [], proofPoints: [], theme: { template: DEFAULT_TEMPLATE }, visibility: 'public',
  });

  const [viewers, setViewers] = useState<ProfileViewer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{id: string, email: string, full_name: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        if (data.profile.subdomain && !data.profile.subdomain.startsWith('user-')) {
          setClaimedSubdomain(data.profile.subdomain);
          setSubdomain(data.profile.subdomain);
        }
        if (data.profile.visibility === 'private') loadViewers();
      }
    } catch (error) { console.error('Failed to load profile:', error); }
  };

  const loadViewers = async () => {
    try {
      const res = await fetch('/api/profile/viewers', { credentials: 'include' });
      const data = await res.json();
      if (data.viewers) setViewers(data.viewers);
    } catch (error) { console.error('Failed to load viewers:', error); }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) return setSearchResults([]);
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.users) setSearchResults(data.users);
    } catch (error) { console.error('Search failed', error); }
    finally { setIsSearching(false); }
  };

  const handleAddViewer = async (viewerUserId: string) => {
    try {
      const res = await fetch('/api/profile/viewers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ viewerUserId }) });
      if (res.ok) { toast.success('Viewer added'); setSearchQuery(''); setSearchResults([]); loadViewers(); }
      else toast.error('Failed to add viewer');
    } catch { toast.error('Failed to add viewer'); }
  };

  const handleRemoveViewer = async (viewerUserId: string) => {
    try {
      const res = await fetch(`/api/profile/viewers?viewerUserId=${viewerUserId}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Viewer removed'); loadViewers(); }
      else toast.error('Failed to remove viewer');
    } catch { toast.error('Failed to remove viewer'); }
  };

  const handleGenerate = async () => {
    if (!sourceUrl.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/profile/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ url: sourceUrl }) });
      if (!res.ok) throw new Error('Failed to generate profile');
      const data = await res.json();
      if (data.profile) {
        const ext = data.profile as ExtractedProfile;
        setProfile(prev => ({ ...prev, name: ext.name || prev.name, headline: ext.headline || prev.headline, bio: ext.bio || prev.bio, role: ext.role || prev.role, company: ext.company || prev.company, links: ext.links || prev.links, proofPoints: ext.proofPoints.map(p => ({ type: p.type, value: p.value, url: p.url || '' })) || prev.proofPoints }));
        toast.success('Profile magic autofill complete!');
      }
    } catch { toast.error('Failed to generate profile'); }
    finally { setGenerating(false); }
  };

  const checkSubdomainAvailability = useCallback(async (value: string) => {
    if (!value || value.length < 3) return setSubdomainAvailable(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/subdomains/check?subdomain=${value}`, { credentials: 'include' });
        const data = await res.json();
        setSubdomainAvailable(data.available === true);
        setLastCheckedSubdomain(value);
      } catch { setSubdomainAvailable(null); }
    }, 300);
  }, []);

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(value);
    checkSubdomainAvailability(value);
  };

  const handleClaimSubdomain = async () => {
    if (!subdomain || subdomainAvailable !== true) return;
    setClaimingSubdomain(true);
    try {
      const res = await fetch('/api/subdomains/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ subdomain }) });
      if (!res.ok) throw new Error('Failed to claim');
      setClaimedSubdomain(subdomain);
      toast.success(`Subdomain ${subdomain}.unool.co claimed!`);
    } catch { toast.error('Failed to claim subdomain'); }
    finally { setClaimingSubdomain(false); }
  };

  const handleDeleteSubdomain = async () => {
    if (!claimedSubdomain) return;
    setDeletingSubdomain(true);
    try {
      const res = await fetch(`/api/subdomains/${claimedSubdomain}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete');
      await loadProfile();
      setSubdomain('');
      setClaimedSubdomain(null);
      toast.success('Subdomain deleted');
    } catch (err) { toast.error('Failed to delete subdomain'); }
    finally { setDeletingSubdomain(false); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | null = null;
    
    if ('dataTransfer' in e) {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        file = e.dataTransfer.files[0];
      }
    } else if (e.target.files && e.target.files[0]) {
      file = e.target.files[0];
    }

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await res.json();
      setProfile(prev => ({ ...prev, avatarUrl: data.url }));
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error uploading image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const initialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save effect
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        const res = await fetch('/api/profile', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          credentials: 'include', 
          body: JSON.stringify({ ...profile, subdomain: claimedSubdomain }) 
        });
        if (!res.ok) throw new Error('Failed to auto-save');
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
        }, 2000);
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('error');
      } finally {
        setSaving(false);
      }
    }, 1000); // 1 second debounce

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [profile, claimedSubdomain]);

  const liveUrl = claimedSubdomain ? (process.env.NODE_ENV === 'development' ? `/u/${claimedSubdomain}` : `https://${claimedSubdomain}.unool.co`) : null;

  return (
    <motion.div className="max-w-[1000px] mx-auto space-y-6 pb-20" initial="initial" animate="animate" variants={staggerContainer}>
      
      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} transition={transition} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: B.text }}>Your Public Profile</h1>
          <p className="text-sm mt-1" style={{ color: B.textMuted }}>Manage your one-link presence and portfolio.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Privacy Toggle */}
          <div className="flex items-center p-1 rounded-lg" style={{ backgroundColor: B.cardBorder }}>
            <button
              onClick={() => setProfile({...profile, visibility: 'public'})}
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
              style={{
                backgroundColor: profile.visibility === 'public' ? B.card : 'transparent',
                color: profile.visibility === 'public' ? B.text : B.textMuted,
                boxShadow: profile.visibility === 'public' ? B.cardShadow : 'none'
              }}
            >
              Public
            </button>
            <button
              onClick={() => { setProfile({...profile, visibility: 'private'}); if (viewers.length === 0) loadViewers(); }}
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
              style={{
                backgroundColor: profile.visibility === 'private' ? B.card : 'transparent',
                color: profile.visibility === 'private' ? B.text : B.textMuted,
                boxShadow: profile.visibility === 'private' ? B.cardShadow : 'none'
              }}
            >
              Private
            </button>
          </div>

          {liveUrl && (
            <Link
              href={liveUrl}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-shadow hover:shadow-md"
              style={{ backgroundColor: B.text, color: B.card }}
            >
              View Live <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
          
          {/* Auto-Save Indicator */}
          <div className="flex items-center gap-2 text-sm font-medium pr-2">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 opacity-60" style={{ color: B.textMuted }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5" style={{ color: '#059669' }}>
                <CheckCircle className="w-4 h-4" /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-red-600">
                <AlertCircle className="w-4 h-4" /> Failed
              </span>
            )}
          </div>

          <Link href="/dashboard">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-shadow hover:shadow-md"
              style={{ backgroundColor: B.cardBorder, color: B.text }}
            >
              Done
            </button>
          </Link>
        </div>
      </motion.div>

      {/* ═══ AI GENERATION (MAGIC) ═══ */}
      <motion.div variants={fadeUp} transition={transition} className="rounded-2xl p-5 relative overflow-hidden" style={{ backgroundColor: B.card, border: `1px solid ${B.accentBg}`, boxShadow: B.cardShadow }}>
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: B.accent }} />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 ml-2">
          <div className="p-2.5 rounded-xl flex-shrink-0" style={{ backgroundColor: B.accentBg }}>
            <Sparkles className="h-5 w-5" style={{ color: B.accent }} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold" style={{ color: B.text }}>Magic Autofill</h3>
            <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>Paste your LinkedIn, GitHub, or personal website to instantly extract your details.</p>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <input
              placeholder="https://linkedin.com/in/yourname"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg w-full sm:w-64 focus:outline-none"
              style={{ backgroundColor: B.bg, border: `1px solid ${B.border}`, color: B.text }}
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !sourceUrl.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
              style={{ backgroundColor: B.accentBg, color: B.accentDark }}
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Autofill'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══ SUBDOMAIN CLAIM ═══ */}
      <motion.div variants={fadeUp} transition={transition} className="rounded-2xl p-6" style={{ backgroundColor: B.card, border: `1px solid ${B.cardBorder}`, boxShadow: B.cardShadow }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-lg" style={{ backgroundColor: B.bg }}>
            <Globe className="h-4 w-4" style={{ color: B.text }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: B.text }}>Profile URL (Subdomain)</h3>
            <p className="text-xs" style={{ color: B.textMuted }}>Choose the custom link where your profile will live.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full flex items-center">
            {/* Clean Prefix */}
            <div className="pl-3 pr-1 py-2 text-sm border-y border-l rounded-l-lg flex-shrink-0 select-none" style={{ backgroundColor: B.bg, borderColor: B.border, color: B.textMuted }}>
              https://
            </div>
            <input
              placeholder="yourname"
              value={subdomain}
              onChange={handleSubdomainChange}
              disabled={!!claimedSubdomain || claimingSubdomain}
              className="px-2 py-2 text-sm border-y w-full focus:outline-none min-w-0"
              style={{ backgroundColor: B.inputBg, borderColor: B.border, color: B.text, fontWeight: 500 }}
            />
            <div className="pr-3 pl-1 py-2 text-sm border-y border-r rounded-r-lg flex-shrink-0 select-none" style={{ backgroundColor: B.bg, borderColor: B.border, color: B.textMuted }}>
              .unool.co
            </div>
            
            {/* Availability Indicator */}
            {!claimedSubdomain && subdomainAvailable !== null && lastCheckedSubdomain === subdomain && subdomain.length >= 3 && (
              <div className="absolute -top-6 right-0 flex items-center gap-1 text-xs font-medium">
                {subdomainAvailable ? (
                  <><CheckCircle className="h-3.5 w-3.5" style={{ color: B.success }} /><span style={{ color: B.success }}>Available</span></>
                ) : (
                  <><AlertCircle className="h-3.5 w-3.5" style={{ color: B.danger }} /><span style={{ color: B.danger }}>Taken</span></>
                )}
              </div>
            )}
          </div>

          {!claimedSubdomain ? (
            <button
              onClick={handleClaimSubdomain}
              disabled={!subdomain || subdomainAvailable !== true || claimingSubdomain}
              className="px-5 py-2 w-full sm:w-auto rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ backgroundColor: B.text, color: B.card }}
            >
              {claimingSubdomain ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Claim Link'}
            </button>
          ) : (
            <button
              onClick={handleDeleteSubdomain}
              disabled={deletingSubdomain}
              className="px-4 py-2 w-full sm:w-auto rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: B.dangerBg, color: B.danger }}
            >
              {deletingSubdomain ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash className="h-4 w-4" /> Release Link</>}
            </button>
          )}
        </div>
      </motion.div>

      {/* ═══ MAIN CONTENT TABS ═══ */}
      <motion.div variants={fadeUp} transition={transition}>
        <div className="flex p-1 rounded-xl mb-6 w-full max-w-md" style={{ backgroundColor: B.cardBorder }}>
          {(['profile', 'links', 'templates'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize"
              style={{
                backgroundColor: activeTab === tab ? B.card : 'transparent',
                color: activeTab === tab ? B.text : B.textMuted,
                boxShadow: activeTab === tab ? B.cardShadow : 'none'
              }}
            >
              {tab === 'profile' ? 'Basic Info' : tab === 'links' ? 'Links & Proofs' : 'Templates & Design'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <div className="rounded-2xl p-6 space-y-5" style={{ backgroundColor: B.card, border: `1px solid ${B.cardBorder}`, boxShadow: B.cardShadow }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: B.text }}>Personal Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium ml-1" style={{ color: B.textMuted }}>Full Name</label>
                    <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none" style={{ backgroundColor: B.bg, border: `1px solid ${B.border}`, color: B.text }} placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium ml-1" style={{ color: B.textMuted }}>Headline</label>
                    <input value={profile.headline} onChange={e => setProfile({...profile, headline: e.target.value})} className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none" style={{ backgroundColor: B.bg, border: `1px solid ${B.border}`, color: B.text }} placeholder="Founder @ Startup" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium ml-1" style={{ color: B.textMuted }}>Role</label>
                    <input value={profile.role} onChange={e => setProfile({...profile, role: e.target.value})} className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none" style={{ backgroundColor: B.bg, border: `1px solid ${B.border}`, color: B.text }} placeholder="CEO" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium ml-1" style={{ color: B.textMuted }}>Company</label>
                    <input value={profile.company} onChange={e => setProfile({...profile, company: e.target.value})} className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none" style={{ backgroundColor: B.bg, border: `1px solid ${B.border}`, color: B.text }} placeholder="Acme Corp" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium ml-1" style={{ color: B.textMuted }}>Avatar / Logo Image</label>
                  
                  <div 
                    onDrop={handleImageUpload}
                    onDragOver={handleDragOver}
                    className="relative w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-black/5"
                    style={{ borderColor: B.border, backgroundColor: B.bg }}
                  >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: B.accent }} />
                        <span className="text-sm font-medium text-gray-500">Uploading...</span>
                      </div>
                    ) : profile.avatarUrl ? (
                      <div className="relative group rounded-full overflow-hidden w-24 h-24 shadow-sm border border-black/10">
                        <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                          <UploadCloud className="w-6 h-6 text-white" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                        <button 
                          onClick={(e) => { e.preventDefault(); setProfile(p => ({ ...p, avatarUrl: '' })) }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: B.accentBg, color: B.accentDark }}>
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium" style={{ color: B.text }}>Drag & drop an image here</p>
                          <p className="text-xs mt-1" style={{ color: B.textMuted }}>or click to browse from your device</p>
                        </div>
                        <label className="absolute inset-0 w-full h-full cursor-pointer opacity-0">
                          <input type="file" accept="image/*" className="w-full h-full cursor-pointer" onChange={handleImageUpload} />
                        </label>
                      </>
                    )}
                  </div>
                  <div className="mt-2 text-xs flex justify-between items-center" style={{ color: B.textMuted }}>
                    <span>Optional. Will fall back to initial if not provided.</span>
                    <input 
                      value={profile.avatarUrl || ''} 
                      onChange={e => setProfile({...profile, avatarUrl: e.target.value})} 
                      className="px-2 py-1 bg-transparent border-b outline-none w-48 text-right" 
                      style={{ borderColor: B.border, color: B.text }} 
                      placeholder="Or paste URL here..." 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium ml-1" style={{ color: B.textMuted }}>Bio</label>
                  <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none min-h-[100px] resize-y" style={{ backgroundColor: B.bg, border: `1px solid ${B.border}`, color: B.text }} placeholder="Tell the world about yourself..." />
                </div>
              </div>
            )}

            {/* TAB: LINKS & PROOFS */}
            {activeTab === 'links' && (
              <div className="space-y-6">
                {/* Links Card */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: B.card, border: `1px solid ${B.cardBorder}`, boxShadow: B.cardShadow }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: B.text }}>Social & Custom Links</h3>
                      <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>Add the platforms you want to drive traffic to.</p>
                    </div>
                    <button onClick={() => setProfile(p => ({...p, links: [...p.links, {label:'', url:'', type:'social'}]}))} className="p-2 rounded-lg hover:bg-black/5 transition-colors" style={{ color: B.text }}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {profile.links.length === 0 && <p className="text-sm py-4 text-center" style={{ color: B.textLight }}>No links added yet.</p>}
                    {profile.links.map((link, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: B.bg, borderColor: B.border }}>
                        <input value={link.label} onChange={e => { const l = [...profile.links]; l[idx].label = e.target.value; setProfile({...profile, links: l}); }} placeholder="Platform (e.g. Twitter)" className="w-full sm:w-32 px-3 py-1.5 text-sm rounded-md focus:outline-none" style={{ backgroundColor: B.inputBg, border: `1px solid ${B.border}` }} />
                        <input value={link.url} onChange={e => { const l = [...profile.links]; l[idx].url = e.target.value; setProfile({...profile, links: l}); }} placeholder="https://..." className="w-full flex-1 px-3 py-1.5 text-sm rounded-md focus:outline-none" style={{ backgroundColor: B.inputBg, border: `1px solid ${B.border}` }} />
                        <select value={link.type} onChange={e => { const l = [...profile.links]; l[idx].type = e.target.value; setProfile({...profile, links: l}); }} className="w-full sm:w-28 px-3 py-1.5 text-sm rounded-md focus:outline-none" style={{ backgroundColor: B.inputBg, border: `1px solid ${B.border}` }}>
                          <option value="social">Social</option>
                          <option value="custom">Custom</option>
                        </select>
                        <button onClick={() => setProfile(p => ({...p, links: p.links.filter((_, i) => i !== idx)}))} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 w-full sm:w-auto flex justify-center">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proof Points Card */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: B.card, border: `1px solid ${B.cardBorder}`, boxShadow: B.cardShadow }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: B.text }}>Proof Points & Credentials</h3>
                      <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>Showcase your achievements and metrics.</p>
                    </div>
                    <button onClick={() => setProfile(p => ({...p, proofPoints: [...p.proofPoints, {type:'', value:'', url:''}]}))} className="p-2 rounded-lg hover:bg-black/5 transition-colors" style={{ color: B.text }}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {profile.proofPoints.length === 0 && <p className="text-sm py-4 text-center" style={{ color: B.textLight }}>No proof points added yet.</p>}
                    {profile.proofPoints.map((point, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: B.bg, borderColor: B.border }}>
                        <input value={point.type} onChange={e => { const p = [...profile.proofPoints]; p[idx].type = e.target.value; setProfile({...profile, proofPoints: p}); }} placeholder="Metric (e.g. Followers)" className="w-full sm:w-40 px-3 py-1.5 text-sm rounded-md focus:outline-none" style={{ backgroundColor: B.inputBg, border: `1px solid ${B.border}` }} />
                        <input value={point.value} onChange={e => { const p = [...profile.proofPoints]; p[idx].value = e.target.value; setProfile({...profile, proofPoints: p}); }} placeholder="Value (e.g. 10k+)" className="w-full sm:w-32 px-3 py-1.5 text-sm rounded-md focus:outline-none" style={{ backgroundColor: B.inputBg, border: `1px solid ${B.border}` }} />
                        <input value={point.url || ''} onChange={e => { const p = [...profile.proofPoints]; p[idx].url = e.target.value; setProfile({...profile, proofPoints: p}); }} placeholder="Proof URL (Optional)" className="w-full flex-1 px-3 py-1.5 text-sm rounded-md focus:outline-none" style={{ backgroundColor: B.inputBg, border: `1px solid ${B.border}` }} />
                        <button onClick={() => setProfile(p => ({...p, proofPoints: p.proofPoints.filter((_, i) => i !== idx)}))} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 w-full sm:w-auto flex justify-center">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: TEMPLATES */}
            {activeTab === 'templates' && (
              <div className="rounded-2xl p-6" style={{ backgroundColor: B.card, border: `1px solid ${B.cardBorder}`, boxShadow: B.cardShadow }}>
                <div className="mb-5">
                  <h3 className="text-sm font-semibold" style={{ color: B.text }}>Design Gallery</h3>
                  <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>Select a beautiful theme for your public profile.</p>
                </div>
                
                <TemplateGallery
                  templates={TEMPLATE_REGISTRY}
                  selectedTemplate={profile.theme.template}
                  onSelect={(templateId) => {
                    setProfile(prev => ({ ...prev, theme: { template: templateId } }));
                    toast.success(`Theme updated to ${TEMPLATE_REGISTRY.find(t=>t.id===templateId)?.name}`);
                  }}
                  isOpen={true}
                  profileData={{
                    name: profile.name || 'Your Name',
                    headline: profile.headline || 'Your awesome headline',
                    bio: profile.bio || 'This is a live preview of how your profile will look.',
                    subdomain: claimedSubdomain || 'preview',
                    links: profile.links?.map((l, i) => ({ id: `l${i}`, label: l.label || 'Link', url: l.url, isVisible: true })) || [],
                    proofs: profile.proofPoints?.map((p, i) => ({ id: `p${i}`, title: p.type || 'Metric', value: p.value || '100', icon: undefined })) || [],
                  }}
                  accentColor={B.accent}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

    </motion.div>
  );
}

export default function PresenceClientWrapper({ userId, workspaceId }: PresenceClientProps) {
  return (
    <Suspense fallback={<div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" style={{ color: B.accent }} /></div>}>
      <PresenceClient userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}