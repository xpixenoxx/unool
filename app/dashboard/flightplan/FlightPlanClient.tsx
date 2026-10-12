'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Loader2, Sparkles, Send, Calendar, ChevronDown, ChevronUp,
  Trash2, Save, AlertCircle, CheckCircle, ImagePlus, X,
  Linkedin, Twitter, MessageSquare, Facebook, Instagram, Youtube, Cloud,
  Image as ImageIcon, Hash, Twitch, Dribbble, GraduationCap, Store,
  Gamepad2, Video, Zap, FileText, Globe, Mail, BookOpen, Code2,
  CircleCheckBig, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/* ─── Types ─── */

type PlatformType = 'linkedin' | 'x' | 'threads' | 'facebook' | 'instagram' | 'youtube' | 'pinterest' | 'bluesky' | 'mastodon' | 'slack' | 'twitch' | 'telegram' | 'discord' | 'skool' | 'whop' | 'kick' | 'vk' | 'warpcast' | 'mewe' | 'nostr' | 'medium' | 'lemmy' | 'listmonk' | 'hashnode' | 'devto';

const PLATFORM_CONFIG: Record<PlatformType, { icon: React.ElementType; name: string; maxChars: number; color: string }> = {
  linkedin: { icon: Linkedin, name: 'LinkedIn', maxChars: 3000, color: 'bg-blue-600' },
  x: { icon: Twitter, name: 'X (Twitter)', maxChars: 280, color: 'bg-gray-800' },
  threads: { icon: MessageSquare, name: 'Threads', maxChars: 500, color: 'bg-black' },
  facebook: { icon: Facebook, name: 'Facebook', maxChars: 63206, color: 'bg-blue-600' },
  instagram: { icon: Instagram, name: 'Instagram', maxChars: 2200, color: 'bg-pink-600' },
  youtube: { icon: Youtube, name: 'YouTube', maxChars: 5000, color: 'bg-red-600' },
  pinterest: { icon: ImageIcon, name: 'Pinterest', maxChars: 500, color: 'bg-red-600' },
  bluesky: { icon: Cloud, name: 'Bluesky', maxChars: 300, color: 'bg-blue-400' },
  mastodon: { icon: Globe, name: 'Mastodon', maxChars: 500, color: 'bg-purple-600' },
  slack: { icon: Hash, name: 'Slack', maxChars: 40000, color: 'bg-[#4A154B]' },
  twitch: { icon: Twitch, name: 'Twitch', maxChars: 500, color: 'bg-[#9146FF]' },
  telegram: { icon: Send, name: 'Telegram', maxChars: 4096, color: 'bg-[#229ED9]' },
  discord: { icon: Hash, name: 'Discord', maxChars: 2000, color: 'bg-[#5865F2]' },
  skool: { icon: GraduationCap, name: 'Skool', maxChars: 10000, color: 'bg-[#E2AD44]' },
  whop: { icon: Store, name: 'Whop', maxChars: 10000, color: 'bg-[#FF5A00]' },
  kick: { icon: Gamepad2, name: 'Kick', maxChars: 10000, color: 'bg-[#53FC18]' },
  vk: { icon: Video, name: 'VK', maxChars: 4096, color: 'bg-[#0077FF]' },
  warpcast: { icon: Hash, name: 'Warpcast', maxChars: 320, color: 'bg-[#8A63D2]' },
  mewe: { icon: MessageSquare, name: 'MeWe', maxChars: 4000, color: 'bg-[#2F435E]' },
  nostr: { icon: Zap, name: 'Nostr', maxChars: 65535, color: 'bg-[#9B51E0]' },
  dribbble: { icon: Dribbble, name: 'Dribbble', maxChars: 250, color: 'bg-[#EA4C89]' },
  medium: { icon: FileText, name: 'Medium', maxChars: 100000, color: 'bg-black' },
  lemmy: { icon: Globe, name: 'Lemmy', maxChars: 10000, color: 'bg-[#00BC8C]' },
  listmonk: { icon: Mail, name: 'Listmonk', maxChars: 100000, color: 'bg-[#0045ff]' },
  hashnode: { icon: BookOpen, name: 'Hashnode', maxChars: 100000, color: 'bg-[#2962FF]' },
  devto: { icon: Code2, name: 'DEV.to', maxChars: 100000, color: 'bg-neutral-900 dark:bg-neutral-100' },
};

interface DayVariant {
  content: string;
  characterCount: number;
  hashtags: string[];
  hookSummary: string;
  angle: string;
  firstCommentHint?: string | null;
}

interface FlightPlanDay {
  dayIndex: number;
  postId: string | null;
  scheduledAt: string | null;
  variants: Record<string, DayVariant>;
  imageUrl: string | null;
  expanded: boolean;
  editingPlatform: string | null;
  dirty: boolean;
  deleted: boolean;
}

type FlightPlanStage = 'input' | 'generating' | 'review';

/* ─── Biscuit Design Tokens ─── */
const B = {
  bg: '#F7F3ED',
  card: '#FFFDF9',
  cardBorder: '#EDE7DD',
  text: '#3D2B1F',
  textSecondary: '#6B5744',
  textMuted: '#8B7355',
  accent: '#C4A265',
  accentDark: '#A68B52',
  accentBg: '#F5EFE2',
  success: '#4A8C5C',
  successBg: '#EBF5EE',
  danger: '#B85450',
  dangerBg: '#FBEDED',
  border: '#E8E0D4',
};

/* ─── Main Component ─── */

function FlightPlanInner({ userId, workspaceId }: { userId: string; workspaceId: string }) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [stage, setStage] = useState<FlightPlanStage>('input');
  const [sourceContent, setSourceContent] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(5);
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformType[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([]);
  const [generating, setGenerating] = useState(false);
  const [days, setDays] = useState<FlightPlanDay[]>([]);
  const [activeDayPlatform, setActiveDayPlatform] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [publishing, setPublishing] = useState(false);
  const [usedImageUrls, setUsedImageUrls] = useState<Set<string>>(new Set());

  // Load connected platforms
  useEffect(() => {
    async function loadConnections() {
      try {
        const res = await fetch('/api/platform/connections', { credentials: 'include' });
        const data = await res.json();
        if (data.connections) {
          const active = Object.values(data.connections)
            .filter((c: any) => c.status === 'connected')
            .map((c: any) => c.platform as PlatformType);
          setConnectedPlatforms(active);
        }
      } catch { /* silent */ }
    }
    loadConnections();
  }, []);

  const togglePlatform = (p: PlatformType) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  // Get the default schedule: starting tomorrow, one post per day
  const getDefaultDates = (count: number) => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i + 1);
      d.setHours(9, 0, 0, 0);
      dates.push(d.toISOString().slice(0, 16)); // YYYY-MM-DDTHH:MM for datetime-local
    }
    return dates;
  };

  /* ─── Generate Flight Plan ─── */
  const handleGenerate = async () => {
    if (!sourceContent.trim()) {
      toast.error('Please enter your content idea');
      return;
    }

    const platforms = selectedPlatforms.length > 0 ? selectedPlatforms : connectedPlatforms;
    if (platforms.length === 0) {
      toast.error('No platforms selected. Connect at least one platform in Settings.');
      return;
    }

    setGenerating(true);
    setStage('generating');

    try {
      const defaultDates = getDefaultDates(numberOfDays);

      const res = await fetch('/api/flightplan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: sourceContent,
          numberOfDays,
          selectedPlatforms: platforms,
          scheduleDates: defaultDates,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate Flight Plan');
      }

      // Build day state from response
      const newDays: FlightPlanDay[] = data.posts.map((post: any, i: number) => ({
        dayIndex: post.dayIndex,
        postId: post.postId,
        scheduledAt: defaultDates[i],
        variants: post.variants,
        imageUrl: null,
        expanded: i === 0,
        editingPlatform: null,
        dirty: false,
        deleted: false,
      }));

      setDays(newDays);

      // Set default active platform per day
      const defaultActive: Record<number, string> = {};
      newDays.forEach((d: FlightPlanDay) => {
        const firstPlatform = Object.keys(d.variants)[0];
        if (firstPlatform) defaultActive[d.dayIndex] = firstPlatform;
      });
      setActiveDayPlatform(defaultActive);

      setStage('review');
      toast.success(`Flight Plan generated — ${newDays.length} posts across ${platforms.length} platform${platforms.length > 1 ? 's' : ''}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      toast.error(msg);
      setStage('input');
    } finally {
      setGenerating(false);
    }
  };

  /* ─── Edit day variant content ─── */
  const updateDayContent = (dayIndex: number, platform: string, content: string) => {
    setDays(prev => prev.map(d => {
      if (d.dayIndex !== dayIndex) return d;
      const variant = d.variants[platform];
      if (!variant) return d;
      return {
        ...d,
        dirty: true,
        variants: {
          ...d.variants,
          [platform]: { ...variant, content, characterCount: content.length },
        },
      };
    }));
  };

  /* ─── Save edits to DB ─── */
  const saveVariant = async (dayIndex: number, platform: string) => {
    const day = days.find(d => d.dayIndex === dayIndex);
    if (!day?.postId) return;

    const variant = day.variants[platform];
    if (!variant) return;

    const key = `${dayIndex}-${platform}`;
    setSaving(prev => ({ ...prev, [key]: true }));

    try {
      // We need to find the variant ID — fetch from the publish API
      const res = await fetch(`/api/publish/${day.postId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch post');

      const data = await res.json();
      const dbVariant = data.variants?.find((v: any) => v.platform === platform);
      if (!dbVariant) throw new Error('Variant not found');

      const updateRes = await fetch(`/api/publish/variants/${dbVariant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: variant.content,
          hashtags: variant.hashtags,
        }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json();
        throw new Error(errData.error || 'Save failed');
      }

      setDays(prev => prev.map(d =>
        d.dayIndex === dayIndex ? { ...d, dirty: false } : d
      ));

      toast.success(`Saved ${PLATFORM_CONFIG[platform as PlatformType]?.name || platform} draft`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  /* ─── Delete a day ─── */
  const deleteDay = (dayIndex: number) => {
    setDays(prev => prev.map(d =>
      d.dayIndex === dayIndex ? { ...d, deleted: true } : d
    ));
    toast.success(`Day ${dayIndex + 1} removed from Flight Plan`);
  };

  const restoreDay = (dayIndex: number) => {
    setDays(prev => prev.map(d =>
      d.dayIndex === dayIndex ? { ...d, deleted: false } : d
    ));
  };

  /* ─── Update schedule date ─── */
  const updateScheduleDate = (dayIndex: number, date: string) => {
    setDays(prev => prev.map(d =>
      d.dayIndex === dayIndex ? { ...d, scheduledAt: date } : d
    ));
  };

  /* ─── Toggle day expand ─── */
  const toggleDayExpand = (dayIndex: number) => {
    setDays(prev => prev.map(d =>
      d.dayIndex === dayIndex ? { ...d, expanded: !d.expanded } : d
    ));
  };

  /* ─── Image upload per day ─── */
  const handleDayImageUpload = async (dayIndex: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only images are supported');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    try {
      const res = await fetch('/api/composer/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const uploadRes = await fetch(data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      // Check for duplicate
      if (usedImageUrls.has(data.url)) {
        toast.warning('This image is already used on another day. Consider using a different image for variety.');
      }

      setDays(prev => prev.map(d =>
        d.dayIndex === dayIndex ? { ...d, imageUrl: data.url } : d
      ));

      setUsedImageUrls(prev => new Set(prev).add(data.url));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  /* ─── Publish All ─── */
  const handlePublishAll = async () => {
    const activeDays = days.filter(d => !d.deleted && d.postId);
    if (activeDays.length === 0) {
      toast.error('No posts to publish');
      return;
    }

    // Check for unsaved changes
    const dirtyDays = activeDays.filter(d => d.dirty);
    if (dirtyDays.length > 0) {
      toast.error(`You have unsaved changes on ${dirtyDays.length} day(s). Save them first.`);
      return;
    }

    setPublishing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const day of activeDays) {
        try {
          const res = await fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ postId: day.postId, workspaceId }),
          });

          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} post${successCount > 1 ? 's' : ''} queued for publishing!`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} post${failCount > 1 ? 's' : ''} failed to queue`);
      }

      // Navigate to Signal to monitor
      if (successCount > 0) {
        router.push('/dashboard/signal');
      }
    } catch (err) {
      toast.error('Publishing failed');
    } finally {
      setPublishing(false);
    }
  };

  /* ─── Render: Input Stage ─── */
  if (stage === 'input' || stage === 'generating') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: B.accentBg }}>
              <Calendar className="w-5 h-5" style={{ color: B.accent }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: B.text }}>Flight Plan</h1>
              <p className="text-sm" style={{ color: B.textMuted }}>
                Transform one idea into a multi-day publishing campaign
              </p>
            </div>
          </div>
        </motion.div>

        {/* Source Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="rounded-2xl border p-6 space-y-4"
          style={{ background: B.card, borderColor: B.cardBorder }}
        >
          <div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: B.text }}>
              Your content idea
            </label>
            <p className="text-xs mb-3" style={{ color: B.textMuted }}>
              Write your main topic, talking points, or a full draft. AI will transform this into a series of unique, platform-optimized posts.
            </p>
            <Textarea
              value={sourceContent}
              onChange={e => setSourceContent(e.target.value)}
              placeholder="e.g. I've been thinking about how most people approach networking wrong. They focus on quantity of connections rather than depth. Here's what I've learned after 10 years of building genuine professional relationships..."
              rows={6}
              className="resize-y"
              style={{ borderColor: B.border, background: B.bg }}
            />
            <p className="text-xs mt-1.5" style={{ color: B.textMuted }}>
              {sourceContent.length} characters
            </p>
          </div>

          {/* Number of days */}
          <div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: B.text }}>
              Number of posts
            </label>
            <div className="flex items-center gap-2">
              {[3, 5, 7, 10, 14].map(n => (
                <button
                  key={n}
                  onClick={() => setNumberOfDays(n)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                    numberOfDays === n
                      ? 'text-white shadow-sm'
                      : 'hover:border-current'
                  )}
                  style={numberOfDays === n
                    ? { background: B.text, borderColor: B.text, color: '#fff' }
                    : { borderColor: B.border, color: B.textSecondary }
                  }
                >
                  {n} days
                </button>
              ))}
            </div>
          </div>

          {/* Platform selector */}
          {connectedPlatforms.length > 0 && (
            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: B.text }}>
                Platforms
                <span className="font-normal ml-1" style={{ color: B.textMuted }}>
                  (leave empty for all connected)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {connectedPlatforms.map(p => {
                  const cfg = PLATFORM_CONFIG[p];
                  const Icon = cfg.icon;
                  const isSelected = selectedPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border',
                        isSelected ? 'shadow-sm' : 'hover:shadow-sm'
                      )}
                      style={isSelected
                        ? { background: B.accentBg, borderColor: B.accent, color: B.text }
                        : { borderColor: B.border, color: B.textMuted }
                      }
                    >
                      <Icon className="w-4 h-4" />
                      {cfg.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Generate button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Button
            onClick={handleGenerate}
            disabled={generating || !sourceContent.trim()}
            size="lg"
            className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg gap-3"
            style={{
              background: generating ? B.textMuted : `linear-gradient(135deg, ${B.text}, ${B.textSecondary})`,
              color: '#fff',
            }}
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating your Flight Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Flight Plan
              </>
            )}
          </Button>

          {generating && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm mt-3"
              style={{ color: B.textMuted }}
            >
              AI is crafting {numberOfDays} unique posts with different angles for each platform. This may take 15-30 seconds...
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  /* ─── Render: Review Stage ─── */
  const activeDays = days.filter(d => !d.deleted);
  const platformList = Object.keys(days[0]?.variants || {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: B.successBg }}>
            <CheckCircle className="w-5 h-5" style={{ color: B.success }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: B.text }}>
              Flight Plan Ready
            </h1>
            <p className="text-sm" style={{ color: B.textMuted }}>
              {activeDays.length} posts · {platformList.length} platform{platformList.length > 1 ? 's' : ''} · Review, edit, and publish
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setStage('input');
              setDays([]);
            }}
            className="gap-2 rounded-xl"
            style={{ borderColor: B.border, color: B.textSecondary }}
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </Button>
          <Button
            onClick={handlePublishAll}
            disabled={publishing || activeDays.length === 0}
            className="gap-2 rounded-xl font-semibold shadow-md"
            style={{
              background: publishing ? B.textMuted : B.text,
              color: '#fff',
            }}
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publish All ({activeDays.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Unsaved changes warning */}
      {days.some(d => d.dirty && !d.deleted) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm"
          style={{ background: '#FFF8E1', borderColor: '#FFD54F', color: '#8D6E00' }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          You have unsaved edits. Save before publishing to keep your changes.
        </motion.div>
      )}

      {/* Day Cards */}
      <AnimatePresence>
        {days.map((day) => {
          if (day.deleted) {
            return (
              <motion.div
                key={day.dayIndex}
                initial={{ opacity: 1, height: 'auto' }}
                animate={{ opacity: 0.5, height: 'auto' }}
                className="rounded-2xl border border-dashed p-4 flex items-center justify-between"
                style={{ borderColor: B.border, background: B.bg }}
              >
                <span className="text-sm" style={{ color: B.textMuted }}>
                  Day {day.dayIndex + 1} — removed
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => restoreDay(day.dayIndex)}
                  className="gap-1 text-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </Button>
              </motion.div>
            );
          }

          const currentPlatform = activeDayPlatform[day.dayIndex] || platformList[0];
          const currentVariant = day.variants[currentPlatform];
          const config = PLATFORM_CONFIG[currentPlatform as PlatformType];
          const isOverLimit = currentVariant && currentVariant.characterCount > (config?.maxChars || 99999);
          const isSaving = saving[`${day.dayIndex}-${currentPlatform}`];

          return (
            <motion.div
              key={day.dayIndex}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ delay: day.dayIndex * 0.03, duration: 0.2 }}
              className="rounded-2xl border overflow-hidden"
              style={{ background: B.card, borderColor: B.cardBorder }}
            >
              {/* Day Header */}
              <button
                onClick={() => toggleDayExpand(day.dayIndex)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-opacity-80 transition-colors"
                style={{ background: day.expanded ? B.accentBg : 'transparent' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: B.text, color: '#fff' }}
                  >
                    {day.dayIndex + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: B.text }}>
                      Day {day.dayIndex + 1}
                      {currentVariant?.angle && (
                        <span className="font-normal ml-2" style={{ color: B.textMuted }}>
                          — {currentVariant.angle}
                        </span>
                      )}
                    </p>
                    {currentVariant?.hookSummary && (
                      <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>
                        Hook: {currentVariant.hookSummary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {day.dirty && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#FFF8E1', color: '#8D6E00' }}>
                      Unsaved
                    </span>
                  )}
                  {day.imageUrl && (
                    <img src={day.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border" style={{ borderColor: B.border }} />
                  )}
                  <div className="flex -space-x-1">
                    {Object.keys(day.variants).slice(0, 4).map(p => {
                      const Icn = PLATFORM_CONFIG[p as PlatformType]?.icon;
                      return Icn ? (
                        <div key={p} className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: B.card, background: B.bg }}>
                          <Icn className="w-3 h-3" style={{ color: B.textMuted }} />
                        </div>
                      ) : null;
                    })}
                  </div>
                  {day.expanded ? (
                    <ChevronUp className="w-4 h-4" style={{ color: B.textMuted }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: B.textMuted }} />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {day.expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: B.border }}>

                      {/* Schedule + Image Row */}
                      <div className="flex flex-wrap gap-4 pt-4">
                        <div className="flex-1 min-w-[200px]">
                          <label className="text-xs font-semibold mb-1 block" style={{ color: B.textMuted }}>
                            Schedule
                          </label>
                          <Input
                            type="datetime-local"
                            value={day.scheduledAt || ''}
                            onChange={e => updateScheduleDate(day.dayIndex, e.target.value)}
                            className="rounded-xl text-sm"
                            style={{ borderColor: B.border }}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block" style={{ color: B.textMuted }}>
                            Day Image
                          </label>
                          <div className="flex items-center gap-2">
                            {day.imageUrl ? (
                              <div className="relative">
                                <img src={day.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover border" style={{ borderColor: B.border }} />
                                <button
                                  onClick={() => setDays(prev => prev.map(d => d.dayIndex === day.dayIndex ? { ...d, imageUrl: null } : d))}
                                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                  style={{ background: B.danger, color: '#fff' }}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => fileInputRefs.current[day.dayIndex]?.click()}
                                className="w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors hover:border-solid"
                                style={{ borderColor: B.border, color: B.textMuted }}
                              >
                                <ImagePlus className="w-5 h-5" />
                              </button>
                            )}
                            <input
                              ref={el => { fileInputRefs.current[day.dayIndex] = el; }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleDayImageUpload(day.dayIndex, f);
                                e.target.value = '';
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDay(day.dayIndex)}
                            className="text-xs gap-1 rounded-xl hover:bg-red-50"
                            style={{ color: B.danger }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove Day
                          </Button>
                        </div>
                      </div>

                      {/* Platform Tabs */}
                      <div className="flex gap-1 p-1 rounded-xl" style={{ background: B.bg }}>
                        {Object.keys(day.variants).map(p => {
                          const pcfg = PLATFORM_CONFIG[p as PlatformType];
                          if (!pcfg) return null;
                          const Icn = pcfg.icon;
                          const isActive = currentPlatform === p;
                          return (
                            <button
                              key={p}
                              onClick={() => setActiveDayPlatform(prev => ({ ...prev, [day.dayIndex]: p }))}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                isActive ? 'shadow-sm' : ''
                              )}
                              style={isActive
                                ? { background: B.card, color: B.text }
                                : { color: B.textMuted }
                              }
                            >
                              <Icn className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{pcfg.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Content Editor */}
                      {currentVariant && (
                        <div className="space-y-3">
                          <Textarea
                            value={currentVariant.content}
                            onChange={e => updateDayContent(day.dayIndex, currentPlatform, e.target.value)}
                            rows={6}
                            className="resize-y rounded-xl text-sm"
                            style={{ borderColor: B.border, background: B.bg }}
                          />

                          {/* Stats bar */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 text-xs" style={{ color: B.textMuted }}>
                              <span className={isOverLimit ? 'text-red-500 font-semibold' : ''}>
                                {currentVariant.characterCount}/{config?.maxChars || '?'} chars
                              </span>
                              {currentVariant.hashtags.length > 0 && (
                                <span>{currentVariant.hashtags.length} hashtags</span>
                              )}
                              {currentVariant.firstCommentHint && (
                                <span className="italic">Has first comment hint</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => saveVariant(day.dayIndex, currentPlatform)}
                                disabled={isSaving || !day.dirty}
                                className="gap-1 text-xs rounded-lg"
                                style={{ borderColor: B.border }}
                              >
                                {isSaving ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Save className="w-3 h-3" />
                                )}
                                Save
                              </Button>
                            </div>
                          </div>

                          {/* Hashtags */}
                          {currentVariant.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {currentVariant.hashtags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-md text-xs font-medium"
                                  style={{ background: B.accentBg, color: B.accentDark }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* First Comment Hint */}
                          {currentVariant.firstCommentHint && (
                            <div className="rounded-xl p-3 border" style={{ background: B.bg, borderColor: B.border }}>
                              <p className="text-xs font-semibold mb-1" style={{ color: B.textMuted }}>
                                💬 Suggested first comment
                              </p>
                              <p className="text-sm" style={{ color: B.textSecondary }}>
                                {currentVariant.firstCommentHint}
                              </p>
                            </div>
                          )}

                          {isOverLimit && (
                            <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2" style={{ background: B.dangerBg, color: B.danger }}>
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              Over limit by {currentVariant.characterCount - (config?.maxChars || 0)} characters
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Bottom publish bar */}
      {activeDays.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 rounded-2xl border p-4 flex items-center justify-between shadow-xl backdrop-blur-sm"
          style={{ background: `${B.card}ee`, borderColor: B.cardBorder }}
        >
          <p className="text-sm font-medium" style={{ color: B.text }}>
            {activeDays.length} post{activeDays.length > 1 ? 's' : ''} ready
            {days.some(d => d.dirty && !d.deleted) && (
              <span className="ml-2 text-xs" style={{ color: '#8D6E00' }}>
                (unsaved edits)
              </span>
            )}
          </p>
          <Button
            onClick={handlePublishAll}
            disabled={publishing || activeDays.length === 0}
            className="gap-2 rounded-xl font-semibold shadow-md"
            style={{ background: B.text, color: '#fff' }}
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Publish All
          </Button>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Wrapper with Suspense ─── */

export default function FlightPlanClient({ userId, workspaceId }: { userId: string; workspaceId: string }) {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: B.textMuted }} />
      </div>
    }>
      <FlightPlanInner userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}
