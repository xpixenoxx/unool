'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Sparkles,
  Loader2,
  Trash2,
  Palette,
  Link as LinkIcon,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertCircle,
  Trash,
  UploadCloud,
  Copy,
  Check,
  User,
  BadgeCheck,
  Building2,
  Briefcase,
  FileText,
  MessageSquare,
  Sparkle,
  ShieldCheck,
} from 'lucide-react';
import { OpenToSelector, OPEN_TO_INTENTS } from '@/components/profile/OpenToBadges';
import { toast } from 'sonner';
import { TEMPLATE_REGISTRY } from '@/components/profile/templates/registry';
import { TemplateGallery } from '@/components/profile/TemplateGallery';

/* ─── Vibrant Light Editorial Design Tokens (No Dark Colors) ─── */
const T = {
  canvas: '#FAF8F5',           // Luminous Alabaster baseline
  card: '#FFFFFF',             // Crisp White elevated surface
  cardWarm: '#FFFBF7',         // Warm peach/alabaster tint
  cardBorder: '#EAE2D7',       // Refined hairline border
  cardBorderHover: '#DECFC0',
  shadowSm: '0 2px 8px -2px rgba(28, 25, 23, 0.04), 0 1px 3px rgba(28, 25, 23, 0.02)',
  shadow: '0 12px 30px -8px rgba(200, 90, 50, 0.08), 0 4px 14px -3px rgba(99, 102, 241, 0.05)',
  shadowHover: '0 16px 36px -6px rgba(200, 90, 50, 0.12), 0 6px 18px -3px rgba(99, 102, 241, 0.08)',

  // Primary: Warm Terracotta & Sunset Coral
  primary: '#C85A32',
  primaryHover: '#B04A23',
  primaryBg: '#FAF1EC',
  primaryBorder: 'rgba(200, 90, 50, 0.22)',
  coral: '#E14D2A',
  coralBg: '#FFF3EE',

  // Accent 1: Royal Violet / Lavender (Creative & Modern)
  violet: '#7C3AED',
  violetHover: '#6D28D9',
  violetBg: '#F5F3FF',
  violetBorder: 'rgba(124, 58, 237, 0.22)',

  // Accent 2: Sky Azure & Royal Blue (Connectivity & Verified)
  sky: '#0284C7',
  skyBg: '#F0F9FF',
  skyBorder: 'rgba(2, 132, 199, 0.22)',

  // Accent 3: Fresh Emerald / Mint (Growth & Live status)
  emerald: '#059669',
  emeraldBg: '#ECFDF5',
  emeraldBorder: 'rgba(5, 150, 105, 0.22)',

  // Accent 4: Golden Amber (Warmth & Highlights)
  amber: '#D97706',
  amberBg: '#FFFBEB',
  amberBorder: 'rgba(217, 119, 6, 0.22)',

  // Typography
  text: '#1C1917',             // Deep Warm Obsidian
  textMuted: '#78716C',        // Warm Stone
  textSubtle: '#A89F91',       // Soft Sand

  // Status
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  dangerBorder: 'rgba(220, 38, 38, 0.22)',

  // Inputs
  inputBg: '#FFFFFF',
  inputBorder: '#E5DED4',
};

/* ─── Platform Detection Helper ───────────────────────────── */
function getPlatformInfo(label: string, url: string) {
  const query = `${label} ${url}`.toLowerCase();
  if (query.includes('twitter') || query.includes('x.com')) return { name: 'X / Twitter', color: '#1C1917', bg: '#F5F5F4' };
  if (query.includes('github')) return { name: 'GitHub', color: '#181717', bg: '#F5F3FF' };
  if (query.includes('linkedin')) return { name: 'LinkedIn', color: '#0A66C2', bg: '#EFF6FF' };
  if (query.includes('youtube')) return { name: 'YouTube', color: '#DC2626', bg: '#FEF2F2' };
  if (query.includes('instagram')) return { name: 'Instagram', color: '#C026D3', bg: '#FDF4FF' };
  if (query.includes('substack')) return { name: 'Substack', color: '#EA580C', bg: '#FFF7ED' };
  if (query.includes('cal.com') || query.includes('calendly')) return { name: 'Calendar', color: '#059669', bg: '#ECFDF5' };
  if (query.includes('dribbble')) return { name: 'Dribbble', color: '#DB2777', bg: '#FDF2F8' };
  return { name: 'Web Link', color: '#4F46E5', bg: '#EEF2FF' };
}

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
  conversationUrl?: string;
}

interface Profile {
  id?: string;
  name: string;
  headline: string;
  bio: string;
  role: string;
  company: string;
  avatarUrl?: string;
  avatar_url?: string;
  avatar?: string;
  email?: string;
  links: ProfileLink[];
  proofPoints: ProofPoint[];
  theme: ProfileTheme;
  subdomain?: string | null;
  openTo: string[];
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
  userId?: string;
  workspaceId?: string;
}

/* ─── Motion helpers ───────────────────────────────────────── */
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const transition = { type: 'spring' as const, stiffness: 350, damping: 28 };

// In-memory module cache for instant (0ms) revisits across sidebar navigation
let memoryPresenceProfile: Profile | null = null;
let memoryPresenceClaimedSubdomain: string | null = null;

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PresenceClient(_props: PresenceClientProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('profile');
  const [generating, setGenerating] = useState(false);
  const [claimingSubdomain, setClaimingSubdomain] = useState(false);
  const [deletingSubdomain, setDeletingSubdomain] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [sourceUrl, setSourceUrl] = useState('');
  const [subdomain, setSubdomain] = useState(() => memoryPresenceClaimedSubdomain || '');
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [claimedSubdomain, setClaimedSubdomain] = useState<string | null>(() => memoryPresenceClaimedSubdomain);
  const [lastCheckedSubdomain, setLastCheckedSubdomain] = useState<string>('');

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [profile, setProfile] = useState<Profile>(() => memoryPresenceProfile || {
    name: '', headline: '', bio: '', role: '', company: '', avatarUrl: '',
    links: [], proofPoints: [], theme: { template: DEFAULT_TEMPLATE }, openTo: [],
  });

  // Guard: prevent auto-save from firing before initial data is loaded from the server.
  const profileLoaded = useRef(Boolean(memoryPresenceProfile));
  const searchParams = useSearchParams();

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      const data = await res.json();
      if (data.profile) {
        profileLoaded.current = true; // Mark as loaded BEFORE setProfile to avoid race
        memoryPresenceProfile = data.profile;
        setProfile(data.profile);
        if (data.profile.subdomain && !data.profile.subdomain.startsWith('user-')) {
          memoryPresenceClaimedSubdomain = data.profile.subdomain;
          setClaimedSubdomain(data.profile.subdomain);
          setSubdomain(data.profile.subdomain);
        } else {
          try {
            const desired = sessionStorage.getItem('unool_desired_handle');
            if (desired) {
              setSubdomain(desired);
              checkSubdomainAvailability(desired);
              sessionStorage.removeItem('unool_desired_handle');
            }
          } catch {}
        }
      } else {
        // No profile yet — still mark as loaded so user edits can be saved
        profileLoaded.current = true;
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabValue | null;
    const focusParam = searchParams.get('focus') || searchParams.get('step');

    if (tabParam === 'profile' || tabParam === 'links' || tabParam === 'templates') {
      setActiveTab(tabParam);
    } else if (focusParam === 'links' || focusParam === 'proofPoints') {
      setActiveTab('links');
    } else if (focusParam === 'name' || focusParam === 'headline') {
      setActiveTab('profile');
    }

    if (focusParam) {
      const timer = setTimeout(() => {
        let elId = '';
        if (focusParam === 'subdomain') elId = 'subdomain-section';
        else if (focusParam === 'name') elId = 'profile-name-input';
        else if (focusParam === 'headline') elId = 'profile-headline-input';
        else if (focusParam === 'links') elId = 'links-section';
        else if (focusParam === 'proofPoints') elId = 'proofs-section';

        if (elId) {
          const el = document.getElementById(elId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
              el.focus();
            }
          }
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!sourceUrl.trim()) return;
    setGenerating(true);
    let urlToUse = sourceUrl.trim();
    if (!/^https?:\/\//i.test(urlToUse)) {
      urlToUse = `https://${urlToUse}`;
    }

    try {
      let res = await fetch('/api/profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: urlToUse }),
      });

      if (!res.ok) {
        // Fallback to /api/profile/extract
        res = await fetch('/api/profile/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ url: urlToUse }),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.profile) {
        throw new Error(data.error || 'Failed to extract profile information');
      }

      const ext = data.profile as ExtractedProfile;
      setProfile(prev => ({
        ...prev,
        name: ext.name || prev.name,
        headline: ext.headline || prev.headline,
        bio: ext.bio || prev.bio,
        role: ext.role || prev.role,
        company: ext.company || prev.company,
        links: ext.links && ext.links.length > 0 ? ext.links : prev.links,
        proofPoints: ext.proofPoints && ext.proofPoints.length > 0
          ? ext.proofPoints.map(p => ({ type: p.type, value: p.value, url: p.url || '' }))
          : prev.proofPoints,
      }));
      toast.success('Profile autofill complete!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate profile';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
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
    } catch {
      toast.error('Failed to delete subdomain');
    } finally {
      setDeletingSubdomain(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
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
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const initialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save effect
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    // Do not auto-save until the server data has been loaded.
    // This prevents overwriting real data with the empty initial state.
    if (!profileLoaded.current) return;

    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
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
        }, 2200);
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('error');
      }
    }, 1000); // 1 second debounce

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [profile, claimedSubdomain]);

  const liveUrl = claimedSubdomain ? (process.env.NODE_ENV === 'development' ? `/u/${claimedSubdomain}` : `https://${claimedSubdomain}.unool.co`) : null;
  const fullPublicDomain = claimedSubdomain ? `${claimedSubdomain}.unool.co` : null;

  const handleCopyLink = () => {
    if (!fullPublicDomain) return;
    const url = `https://${fullPublicDomain}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Public profile link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="relative min-h-screen">
      {/* ─── Ambient Luminous Aura Background Glows (Light, Non-Dark) ─── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-orange-200/30 via-rose-100/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-48 right-[-10%] w-[550px] h-[550px] bg-gradient-to-bl from-purple-200/25 via-indigo-100/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-[-5%] w-[450px] h-[450px] bg-gradient-to-tr from-emerald-100/30 via-sky-100/20 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        className="max-w-[1020px] mx-auto space-y-6 pb-24 px-4 sm:px-6"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {/* ═══ HEADER ═══ */}
        <motion.div
          variants={fadeUp}
          transition={transition}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3"
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #FFF4EE 0%, #FAF0FF 50%, #EFF6FF 100%)',
                  color: T.coral,
                  border: '1px solid rgba(225, 77, 42, 0.25)',
                }}
              >
                <Sparkle className="w-3.5 h-3.5 fill-current text-orange-500" />
                Public Identity Studio
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: T.text }}>
              Your Public Profile
            </h1>
            <p className="text-sm mt-1" style={{ color: T.textMuted }}>
              Manage your one-link presence and portfolio.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-Save Indicator */}
            <div
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs"
              style={{ backgroundColor: '#FFFFFF', border: `1px solid ${T.cardBorder}` }}
            >
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1.5" style={{ color: T.primary }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1.5" style={{ color: T.emerald }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1.5" style={{ color: T.danger }}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Failed</span>
                </span>
              )}
              {saveStatus === 'idle' && (
                <span className="text-[11px] flex items-center gap-1.5 text-stone-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Auto-saved
                </span>
              )}
            </div>

            {/* Live Link Button (in the position of Done) */}
            {liveUrl && (
              <Link
                href={liveUrl}
                target="_blank"
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF7F2 100%)',
                  color: T.text,
                  border: '1px solid rgba(200, 90, 50, 0.3)',
                }}
              >
                <span>View Live</span>
                <ExternalLink className="h-3.5 w-3.5 text-orange-600 group-hover:text-orange-700 transition-colors" />
              </Link>
            )}
          </div>
        </motion.div>

        {/* ═══ REAL-TIME MINI PROFILE PREVIEW CARD (Interactive Feedback) ═══ */}
        <motion.div
          variants={fadeUp}
          transition={transition}
          className="rounded-2xl p-5 sm:p-6 relative overflow-hidden transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9F5 45%, #F7F5FF 100%)',
            border: '1px solid rgba(228, 218, 205, 0.85)',
            boxShadow: T.shadow,
          }}
        >
          {/* Subtle colorful top gradient hairline accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-rose-400 via-purple-400 to-sky-400" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar or Monogram with gradient ring */}
              <div
                className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-md flex items-center justify-center font-bold text-xl ring-2 ring-orange-300/70 ring-offset-2 ring-offset-white"
                style={{
                  background: 'linear-gradient(135deg, #FFEDD5 0%, #FEE2E2 50%, #EDE9FE 100%)',
                  color: T.primary,
                }}
              >
                {profile.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={profile.avatarUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(profile.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Profile Info Summary */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold truncate tracking-tight" style={{ color: T.text }}>
                    {profile.name || 'Your Name'}
                  </h2>
                  {claimedSubdomain && (
                    <BadgeCheck className="w-4 h-4 flex-shrink-0 text-sky-500 fill-sky-100" />
                  )}
                </div>
                <p className="text-xs truncate max-w-lg mt-0.5" style={{ color: T.textMuted }}>
                  {profile.headline || profile.role ? `${profile.role || ''}${profile.company ? ` @ ${profile.company}` : ''} ${profile.headline ? `· ${profile.headline}` : ''}` : 'Add your role & headline below'}
                </p>

                {/* Badges / Links Pill Row */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  {claimedSubdomain ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors"
                      style={{ backgroundColor: T.skyBg, color: T.sky, border: `1px solid ${T.skyBorder}` }}
                    >
                      <Globe className="w-3 h-3 text-sky-500" />
                      {claimedSubdomain}.unool.co
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200"
                    >
                      Handle not claimed yet
                    </span>
                  )}

                  {profile.links && profile.links.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ backgroundColor: T.violetBg, color: T.violet, border: `1px solid ${T.violetBorder}` }}
                    >
                      <LinkIcon className="w-3 h-3 text-violet-500" />
                      {profile.links.length} {profile.links.length === 1 ? 'link' : 'links'}
                    </span>
                  )}

                  {profile.proofPoints && profile.proofPoints.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ backgroundColor: T.emeraldBg, color: T.emerald, border: `1px solid ${T.emeraldBorder}` }}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {profile.proofPoints.length} proofs
                    </span>
                  )}
                </div>

                {/* Live Selected OpenTo Badges rendered directly in preview */}
                {profile.openTo && profile.openTo.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {profile.openTo.slice(0, 4).map(id => {
                      const intent = OPEN_TO_INTENTS.find(i => i.id === id);
                      if (!intent) return null;
                      const Icon = intent.icon;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs"
                          style={{
                            backgroundColor: intent.bg,
                            color: intent.color,
                            border: `1px solid ${intent.color}40`,
                          }}
                        >
                          <Icon size={11} />
                          {intent.label}
                        </span>
                      );
                    })}
                    {profile.openTo.length > 4 && (
                      <span className="text-[10px] font-semibold text-stone-500">
                        +{profile.openTo.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Live Interactive Tag */}
            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
              <span
                className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs"
                style={{
                  background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
                  border: '1px solid rgba(5, 150, 105, 0.3)',
                  color: T.emerald,
                }}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Interactive
              </span>
            </div>
          </div>
        </motion.div>

        {/* ═══ AI GENERATION (MAGIC) ═══ */}
        <motion.div
          variants={fadeUp}
          transition={transition}
          className="rounded-2xl p-5 relative overflow-hidden transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDF9 50%, #FAF6FF 100%)',
            border: `1px solid ${T.cardBorder}`,
            boxShadow: T.shadowSm,
          }}
        >
          {/* Gradient left accent line */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-500 via-rose-500 to-violet-600" />

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 ml-2">
            <div className="p-3 rounded-2xl flex-shrink-0 bg-gradient-to-br from-orange-500 via-rose-500 to-violet-600 text-white shadow-md shadow-orange-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight" style={{ color: T.text }}>
                  Profile Sync & Autofill
                </h3>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs"
                  style={{
                    background: 'linear-gradient(135deg, #FFF1EC 0%, #F5F3FF 100%)',
                    color: T.violet,
                    border: `1px solid ${T.violetBorder}`,
                  }}
                >
                  AI Instant
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                Paste your LinkedIn, GitHub, or personal website to instantly extract your details.
              </p>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <div className="relative flex-1 sm:w-72">
                <input
                  placeholder="https://linkedin.com/in/yourname"
                  value={sourceUrl}
                  onChange={e => setSourceUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
                  className="px-3.5 py-2.5 text-sm rounded-xl w-full focus:outline-none transition-all duration-200 shadow-inner"
                  style={{
                    backgroundColor: T.inputBg,
                    border: `1px solid ${T.inputBorder}`,
                    color: T.text,
                  }}
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !sourceUrl.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 flex items-center gap-2 flex-shrink-0 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #C85A32 0%, #D9683E 50%, #8B5CF6 100%)',
                }}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Autofill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ═══ OPEN TO — AVAILABILITY INTENTS ═══ */}
        <motion.div
          variants={fadeUp}
          transition={transition}
          className="rounded-2xl p-6 transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDF9 100%)',
            border: `1px solid ${T.cardBorder}`,
            boxShadow: T.shadowSm,
          }}
        >
          <OpenToSelector
            selected={profile.openTo || []}
            onChange={(intents) => setProfile({ ...profile, openTo: intents })}
            colors={{
              bg: '#FFFFFF',
              card: '#FFFFFF',
              border: '#E2D9CC',
              text: T.text,
              textMuted: T.textMuted,
              accent: T.primary,
              accentBg: T.primaryBg,
            }}
          />
        </motion.div>

        {/* ═══ SUBDOMAIN CLAIM ═══ */}
        <motion.div
          id="subdomain-section"
          variants={fadeUp}
          transition={transition}
          className="rounded-2xl p-6 transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF9FE 100%)',
            border: `1px solid ${T.cardBorder}`,
            boxShadow: T.shadowSm,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl flex-shrink-0 shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #E0F2FE 0%, #EDE9FE 100%)',
                  color: T.sky,
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                }}
              >
                <Globe className="h-4 w-4 text-sky-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight" style={{ color: T.text }}>
                  Profile URL (Subdomain)
                </h3>
                <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                  Choose the custom link where your profile will live.
                </p>
              </div>
            </div>

            {claimedSubdomain && (
              <div
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full shadow-xs"
                style={{
                  backgroundColor: T.emeraldBg,
                  color: T.emerald,
                  border: `1px solid ${T.emeraldBorder}`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Claimed & Active</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 flex items-center">
              {/* Clean Prefix */}
              <div
                className="pl-3.5 pr-1.5 py-2.5 text-sm border-y border-l rounded-l-xl flex-shrink-0 select-none font-mono text-xs"
                style={{ backgroundColor: '#F8F6F2', borderColor: T.inputBorder, color: T.textMuted }}
              >
                https://
              </div>
              <input
                placeholder="yourname"
                value={subdomain}
                onChange={handleSubdomainChange}
                disabled={!!claimedSubdomain || claimingSubdomain}
                className="px-2.5 py-2.5 text-sm border-y w-full focus:outline-none min-w-0 font-semibold transition-colors"
                style={{
                  backgroundColor: T.inputBg,
                  borderColor: T.inputBorder,
                  color: T.text,
                }}
              />
              <div
                className="pr-3.5 pl-1.5 py-2.5 text-sm border-y border-r rounded-r-xl flex-shrink-0 select-none font-mono text-xs"
                style={{ backgroundColor: '#F8F6F2', borderColor: T.inputBorder, color: T.textMuted }}
              >
                .unool.co
              </div>

              {/* Availability Indicator */}
              {!claimedSubdomain && subdomainAvailable !== null && lastCheckedSubdomain === subdomain && subdomain.length >= 3 && (
                <div className="absolute -top-6 right-1 flex items-center gap-1.5 text-xs font-semibold">
                  {subdomainAvailable ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertCircle className="h-3 w-3" /> Taken
                    </span>
                  )}
                </div>
              )}
            </div>

            {!claimedSubdomain ? (
              <button
                onClick={handleClaimSubdomain}
                disabled={!subdomain || subdomainAvailable !== true || claimingSubdomain}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-white"
                style={{
                  background: 'linear-gradient(135deg, #C85A32 0%, #E06D44 100%)',
                }}
              >
                {claimingSubdomain ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Claim Link'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 shadow-xs"
                  style={{
                    border: '1px solid #D9D2C7',
                    backgroundColor: '#FFFFFF',
                    color: T.text,
                  }}
                >
                  {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDeleteSubdomain}
                  disabled={deletingSubdomain}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                  style={{
                    backgroundColor: T.dangerBg,
                    color: T.danger,
                    border: `1px solid ${T.dangerBorder}`,
                  }}
                >
                  {deletingSubdomain ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash className="h-4 w-4" />
                      <span>Release Link</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══ MAIN CONTENT TABS ═══ */}
        <motion.div variants={fadeUp} transition={transition} className="space-y-6">
          {/* Animated Segmented Tab Bar */}
          <div
            className="flex p-1.5 rounded-2xl w-full max-w-lg shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #EFEAE2 0%, #EDE7DF 100%)',
              border: `1px solid ${T.cardBorder}`,
            }}
          >
            {(['profile', 'links', 'templates'] as const).map(tab => {
              const isCurrent = activeTab === tab;
              const label = tab === 'profile' ? 'Basic Info' : tab === 'links' ? 'Links & Proofs' : 'Templates & Design';
              const Icon = tab === 'profile' ? User : tab === 'links' ? LinkIcon : Palette;
              const activeColor = tab === 'profile' ? T.coral : tab === 'links' ? T.violet : T.amber;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="relative flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                  style={{
                    color: isCurrent ? T.text : T.textMuted,
                  }}
                >
                  {isCurrent && (
                    <motion.div
                      layoutId="activeTabBadge"
                      className="absolute inset-0 rounded-xl shadow-sm"
                      style={{ backgroundColor: '#FFFFFF', border: `1px solid ${T.cardBorder}` }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-4 h-4" style={{ color: isCurrent ? activeColor : 'inherit' }} />
                    <span>{label}</span>
                    {tab === 'links' && (profile.links?.length > 0 || profile.proofPoints?.length > 0) && (
                      <span
                        className="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: isCurrent ? T.violetBg : '#DFD7CB',
                          color: isCurrent ? T.violet : T.textMuted,
                        }}
                      >
                        {(profile.links?.length || 0) + (profile.proofPoints?.length || 0)}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              {/* ═══ TAB 1: BASIC INFO ═══ */}
              {activeTab === 'profile' && (
                <div
                  className="rounded-2xl p-6 sm:p-7 space-y-6"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDF9 100%)',
                    border: `1px solid ${T.cardBorder}`,
                    boxShadow: T.shadowSm,
                  }}
                >
                  <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.cardBorder }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold tracking-tight" style={{ color: T.text }}>
                          Personal Details
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                          Essential details displayed across your portfolio and bio cards.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Name & Headline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold ml-1 flex items-center gap-1.5" style={{ color: T.text }}>
                        <User className="w-3.5 h-3.5 text-orange-500" />
                        Full Name
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="profile-name-input"
                        value={profile.name}
                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none transition-all duration-200 font-medium"
                        style={{
                          backgroundColor: T.inputBg,
                          border: `1px solid ${T.inputBorder}`,
                          color: T.text,
                        }}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold ml-1 flex items-center gap-1.5" style={{ color: T.text }}>
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        Headline
                      </label>
                      <input
                        id="profile-headline-input"
                        value={profile.headline}
                        onChange={e => setProfile({ ...profile, headline: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none transition-all duration-200 font-medium"
                        style={{
                          backgroundColor: T.inputBg,
                          border: `1px solid ${T.inputBorder}`,
                          color: T.text,
                        }}
                        placeholder="Founder @ Startup"
                      />
                    </div>
                  </div>

                  {/* Role & Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold ml-1 flex items-center gap-1.5" style={{ color: T.text }}>
                        <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                        Role
                      </label>
                      <input
                        value={profile.role}
                        onChange={e => setProfile({ ...profile, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none transition-all duration-200 font-medium"
                        style={{
                          backgroundColor: T.inputBg,
                          border: `1px solid ${T.inputBorder}`,
                          color: T.text,
                        }}
                        placeholder="CEO"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold ml-1 flex items-center gap-1.5" style={{ color: T.text }}>
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        Company
                      </label>
                      <input
                        value={profile.company}
                        onChange={e => setProfile({ ...profile, company: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none transition-all duration-200 font-medium"
                        style={{
                          backgroundColor: T.inputBg,
                          border: `1px solid ${T.inputBorder}`,
                          color: T.text,
                        }}
                        placeholder="Acme Corp"
                      />
                    </div>
                  </div>

                  {/* Avatar / Logo Image */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-xs font-semibold" style={{ color: T.text }}>
                        Avatar / Logo Image
                      </label>
                      <span className="text-[11px]" style={{ color: T.textSubtle }}>
                        PNG, JPG or WebP (Max 5MB)
                      </span>
                    </div>

                    <div
                      onDrop={handleImageUpload}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className="relative w-full border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 transition-all duration-200"
                      style={{
                        borderColor: isDragOver ? T.primary : 'rgba(200, 90, 50, 0.3)',
                        background: isDragOver
                          ? 'linear-gradient(135deg, #FFF3ED 0%, #F5F3FF 100%)'
                          : 'linear-gradient(135deg, #FFFDFB 0%, #FAF8F5 100%)',
                      }}
                    >
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center gap-2.5 py-4">
                          <Loader2 className="w-9 h-9 animate-spin text-orange-600" />
                          <span className="text-sm font-medium" style={{ color: T.textMuted }}>
                            Uploading image...
                          </span>
                        </div>
                      ) : profile.avatarUrl ? (
                        <div className="flex flex-col sm:flex-row items-center gap-5 w-full justify-center">
                          <div className="relative group rounded-full overflow-hidden w-24 h-24 shadow-md ring-4 ring-orange-200/80 ring-offset-2 ring-offset-white flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            <label className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-[2px]">
                              <UploadCloud className="w-6 h-6 text-white" />
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                          </div>
                          <div className="flex flex-col items-center sm:items-start gap-2">
                            <div className="flex items-center gap-2">
                              <label className="px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-sm bg-white border hover:bg-stone-50 hover:border-orange-300" style={{ borderColor: T.cardBorder, color: T.text }}>
                                Change Image
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                              </label>
                              <button
                                onClick={(e) => { e.preventDefault(); setProfile(p => ({ ...p, avatarUrl: '' })); }}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 hover:bg-rose-100"
                                style={{ color: T.danger, border: `1px solid ${T.dangerBorder}`, backgroundColor: T.dangerBg }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            </div>
                            <span className="text-[11px]" style={{ color: T.textMuted }}>
                              Drop another image directly onto this area to replace.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-br from-orange-500 via-rose-500 to-violet-600 text-white"
                          >
                            <UploadCloud className="w-7 h-7" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold" style={{ color: T.text }}>
                              Drag & drop an image here
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                              or <span className="font-semibold underline text-orange-600">browse from your device</span>
                            </p>
                          </div>
                          <label className="absolute inset-0 w-full h-full cursor-pointer opacity-0">
                            <input type="file" accept="image/*" className="w-full h-full cursor-pointer" onChange={handleImageUpload} />
                          </label>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: T.text }}>
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        Bio
                      </label>
                      <span className="text-[11px]" style={{ color: T.textSubtle }}>
                        {profile.bio?.length || 0} characters
                      </span>
                    </div>
                    <textarea
                      value={profile.bio}
                      onChange={e => setProfile({ ...profile, bio: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm rounded-xl focus:outline-none min-h-[110px] resize-y transition-all duration-200 leading-relaxed font-normal"
                      style={{
                        backgroundColor: T.inputBg,
                        border: `1px solid ${T.inputBorder}`,
                        color: T.text,
                      }}
                      placeholder="Tell the world about yourself..."
                    />
                  </div>
                </div>
              )}

              {/* ═══ TAB 2: LINKS & PROOFS ═══ */}
              {activeTab === 'links' && (
                <div className="space-y-6">
                  {/* Links Card */}
                  <div
                    id="links-section"
                    className="rounded-2xl p-6 sm:p-7 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8FF 100%)',
                      border: `1px solid ${T.cardBorder}`,
                      boxShadow: T.shadowSm,
                    }}
                  >
                    <div className="flex items-center justify-between mb-5 pb-3 border-b" style={{ borderColor: T.cardBorder }}>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 shadow-xs">
                          <LinkIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold tracking-tight" style={{ color: T.text }}>
                            Social & Custom Links
                          </h3>
                          <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                            Add the platforms you want to drive traffic to.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setProfile(p => ({ ...p, links: [...p.links, { label: '', url: '', type: 'social' }] }))}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-md hover:shadow-lg text-white"
                        style={{
                          background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Link</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {profile.links.length === 0 && (
                        <div
                          className="py-10 text-center rounded-xl border border-dashed flex flex-col items-center justify-center gap-2"
                          style={{ borderColor: '#D9D0C3', backgroundColor: '#FAF8F5' }}
                        >
                          <LinkIcon className="w-8 h-8 opacity-30 text-purple-600" />
                          <p className="text-sm font-semibold" style={{ color: T.textMuted }}>No links added yet.</p>
                          <p className="text-xs" style={{ color: T.textSubtle }}>Click &quot;Add Link&quot; above to connect your Twitter, LinkedIn, GitHub, etc.</p>
                        </div>
                      )}
                      {profile.links.map((link, idx) => {
                        const platform = getPlatformInfo(link.label, link.url);
                        return (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 hover:shadow-sm"
                            style={{ backgroundColor: '#FFFFFF', borderColor: T.cardBorder }}
                          >
                            {/* Platform Pill Badge */}
                            <div
                              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 text-xs font-bold shadow-xs"
                              style={{ backgroundColor: platform.bg, color: platform.color }}
                              title={platform.name}
                            >
                              <LinkIcon className="w-4 h-4" />
                            </div>

                            <input
                              value={link.label}
                              onChange={e => {
                                const l = [...profile.links];
                                l[idx].label = e.target.value;
                                setProfile({ ...profile, links: l });
                              }}
                              placeholder="Platform (e.g. Twitter)"
                              className="w-full sm:w-40 px-3.5 py-2 text-sm rounded-lg focus:outline-none transition-colors font-medium"
                              style={{ backgroundColor: '#FAF8F5', border: `1px solid ${T.inputBorder}`, color: T.text }}
                            />

                            <input
                              value={link.url}
                              onChange={e => {
                                const l = [...profile.links];
                                l[idx].url = e.target.value;
                                setProfile({ ...profile, links: l });
                              }}
                              placeholder="https://..."
                              className="w-full flex-1 px-3.5 py-2 text-sm rounded-lg focus:outline-none transition-colors"
                              style={{ backgroundColor: '#FAF8F5', border: `1px solid ${T.inputBorder}`, color: T.text }}
                            />

                            <select
                              value={link.type}
                              onChange={e => {
                                const l = [...profile.links];
                                l[idx].type = e.target.value;
                                setProfile({ ...profile, links: l });
                              }}
                              className="w-full sm:w-28 px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors font-medium"
                              style={{ backgroundColor: '#FAF8F5', border: `1px solid ${T.inputBorder}`, color: T.text }}
                            >
                              <option value="social">Social</option>
                              <option value="custom">Custom</option>
                            </select>

                            <button
                              onClick={() => setProfile(p => ({ ...p, links: p.links.filter((_, i) => i !== idx) }))}
                              className="p-2 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors w-full sm:w-auto flex justify-center"
                              title="Delete link"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Proof Points Card */}
                  <div
                    id="proofs-section"
                    className="rounded-2xl p-6 sm:p-7 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #F5FBF7 100%)',
                      border: `1px solid ${T.cardBorder}`,
                      boxShadow: T.shadowSm,
                    }}
                  >
                    <div className="flex items-center justify-between mb-5 pb-3 border-b" style={{ borderColor: T.cardBorder }}>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-xs">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold tracking-tight" style={{ color: T.text }}>
                            Proof Points & Credentials
                          </h3>
                          <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                            Showcase your achievements and metrics.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setProfile(p => ({ ...p, proofPoints: [...p.proofPoints, { type: '', value: '', url: '' }] }))}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-md hover:shadow-lg text-white"
                        style={{
                          background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Proof</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {profile.proofPoints.length === 0 && (
                        <div
                          className="py-10 text-center rounded-xl border border-dashed flex flex-col items-center justify-center gap-2"
                          style={{ borderColor: '#D9D0C3', backgroundColor: '#FAF8F5' }}
                        >
                          <ShieldCheck className="w-8 h-8 opacity-30 text-emerald-600" />
                          <p className="text-sm font-semibold" style={{ color: T.textMuted }}>No proof points added yet.</p>
                          <p className="text-xs" style={{ color: T.textSubtle }}>Add social proof such as &quot;Followers: 25K+&quot; or &quot;Raised: $2M&quot;.</p>
                        </div>
                      )}
                      {profile.proofPoints.map((point, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 hover:shadow-sm"
                          style={{ backgroundColor: '#FFFFFF', borderColor: T.cardBorder }}
                        >
                          <input
                            value={point.type}
                            onChange={e => {
                              const p = [...profile.proofPoints];
                              p[idx].type = e.target.value;
                              setProfile({ ...profile, proofPoints: p });
                            }}
                            placeholder="Metric (e.g. Followers)"
                            className="w-full sm:w-44 px-3.5 py-2 text-sm rounded-lg focus:outline-none font-medium"
                            style={{ backgroundColor: '#FAF8F5', border: `1px solid ${T.inputBorder}`, color: T.text }}
                          />
                          <input
                            value={point.value}
                            onChange={e => {
                              const p = [...profile.proofPoints];
                              p[idx].value = e.target.value;
                              setProfile({ ...profile, proofPoints: p });
                            }}
                            placeholder="Value (e.g. 10k+)"
                            className="w-full sm:w-36 px-3.5 py-2 text-sm rounded-lg focus:outline-none font-bold"
                            style={{
                              backgroundColor: '#ECFDF5',
                              border: '1px solid rgba(5, 150, 105, 0.3)',
                              color: T.emerald,
                            }}
                          />
                          <input
                            value={point.url || ''}
                            onChange={e => {
                              const p = [...profile.proofPoints];
                              p[idx].url = e.target.value;
                              setProfile({ ...profile, proofPoints: p });
                            }}
                            placeholder="Proof URL (Optional)"
                            className="w-full flex-1 px-3.5 py-2 text-sm rounded-lg focus:outline-none"
                            style={{ backgroundColor: '#FAF8F5', border: `1px solid ${T.inputBorder}`, color: T.text }}
                          />
                          <button
                            onClick={() => setProfile(p => ({ ...p, proofPoints: p.proofPoints.filter((_, i) => i !== idx) }))}
                            className="p-2 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors w-full sm:w-auto flex justify-center"
                            title="Delete proof"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conversation Link Card */}
                  <div
                    className="rounded-2xl p-6 sm:p-7 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDF8 100%)',
                      border: `1px solid ${T.cardBorder}`,
                      boxShadow: T.shadowSm,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-xs">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold tracking-tight" style={{ color: T.text }}>
                          Start a Conversation URL
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                          Redirect visitors here when they want to start a conversation with you.
                        </p>
                      </div>
                    </div>

                    <input
                      value={profile.theme.conversationUrl || ''}
                      onChange={e => setProfile({ ...profile, theme: { ...profile.theme, conversationUrl: e.target.value } })}
                      placeholder="https://cal.com/yourname or similar"
                      className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none transition-all duration-200 font-medium"
                      style={{
                        backgroundColor: '#FAF8F5',
                        border: `1px solid ${T.inputBorder}`,
                        color: T.text,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ═══ TAB 3: TEMPLATES & DESIGN ═══ */}
              {activeTab === 'templates' && (
                <div
                  className="rounded-2xl p-6 sm:p-7 transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFBF5 100%)',
                    border: `1px solid ${T.cardBorder}`,
                    boxShadow: T.shadowSm,
                  }}
                >
                  <div className="flex items-center justify-between mb-6 pb-3 border-b" style={{ borderColor: T.cardBorder }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600 border border-orange-200/60 shadow-xs">
                        <Palette className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold tracking-tight" style={{ color: T.text }}>
                          Design Gallery
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                          Select a beautiful theme for your public profile.
                        </p>
                      </div>
                    </div>

                    <span
                      className="text-xs font-bold px-3.5 py-1 rounded-full shadow-xs"
                      style={{
                        background: 'linear-gradient(135deg, #FFF4EE 0%, #FAF0FF 100%)',
                        border: '1px solid rgba(200, 90, 50, 0.25)',
                        color: T.text,
                      }}
                    >
                      Theme: <span className="capitalize text-orange-600">{profile.theme.template}</span>
                    </span>
                  </div>

                  <TemplateGallery
                    templates={TEMPLATE_REGISTRY}
                    selectedTemplate={profile.theme.template}
                    onSelect={(templateId) => {
                      const tMeta = TEMPLATE_REGISTRY.find(t => t.id === templateId);
                      setProfile(prev => ({ ...prev, theme: { ...prev.theme, template: templateId } }));
                      if (tMeta) {
                        toast.success(`${tMeta.name} theme applied`, { duration: 2500 });
                      }
                    }}
                    isOpen={true}
                    profileData={{
                      name: profile.name || 'Your Name',
                      headline: profile.headline || 'Your awesome headline',
                      bio: profile.bio || 'This is a live preview of how your profile will look.',
                      subdomain: claimedSubdomain || 'preview',
                      role: profile.role || '',
                      company: profile.company || '',
                      avatarUrl: profile.avatarUrl || profile.avatar_url || '',
                      avatar_url: profile.avatarUrl || profile.avatar_url || '',
                      avatar: profile.avatarUrl || profile.avatar || '',
                      email: profile.email || '',
                      links: profile.links?.map((l, i) => ({ id: `l${i}`, label: l.label || 'Link', url: l.url, isVisible: true })) || [],
                      proofs: profile.proofPoints?.map((p, i) => ({ id: `p${i}`, title: p.type || 'Metric', value: p.value || '100', icon: undefined })) || [],
                      openTo: profile.openTo || [],
                    }}
                    accentColor={T.primary}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function PresenceClientWrapper({ userId, workspaceId }: PresenceClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      }
    >
      <PresenceClient userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}