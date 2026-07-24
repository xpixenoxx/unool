'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, PenTool, Loader2, Sparkles, Trash2, Palette, Link as LinkIcon, ExternalLink, Plus, CheckCircle, AlertCircle, Trash, ArrowRight, Zap, Shield, Globe as GlobeIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flex, Box, Stack, Text, Display, Divider } from '@/components/ui/layout';
import { MotionBox, MotionStack, spring, stagger } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type TabValue = 'profile' | 'links' | 'design';
type Preset = 'minimal' | 'bold' | 'corporate' | 'creative' | 'technical';

interface ProfileLink {
  label: string;
  url: string;
  type: string;
}

interface ProofPoint {
  type: string;
  value: string;
  url: string;
}

interface ProfileTheme {
  template: string;
}

interface Profile {
  id?: string;
  name: string;
  headline: string;
  bio: string;
  role: string;
  company: string;
  links: ProfileLink[];
  proofPoints: ProofPoint[];
  theme: ProfileTheme;
  subdomain?: string | null;
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

const TEMPLATE_CONFIG: Record<string, { name: string; category: string; description: string }> = {
  'essential-minimal': { name: 'Minimal', category: 'Essential', description: 'Clean, whitespace-driven, content-first' },
  'essential-light': { name: 'Light', category: 'Essential', description: 'Airy with subtle accents' },
  'essential-standard': { name: 'Standard', category: 'Essential', description: 'Balanced, professional default' },
  'essential-bold': { name: 'Bold', category: 'Essential', description: 'High contrast, strong hierarchy' },
  'essential-max': { name: 'Max', category: 'Essential', description: 'Dense, feature-rich layout' },
  'professional-minimal': { name: 'Minimal', category: 'Professional', description: 'Reserved, executive presence' },
  'professional-light': { name: 'Light', category: 'Professional', description: 'Approachable authority' },
  'professional-standard': { name: 'Standard', category: 'Professional', description: 'Corporate standard' },
  'professional-bold': { name: 'Bold', category: 'Professional', description: 'Confident leadership' },
  'professional-max': { name: 'Max', category: 'Professional', description: 'Comprehensive executive profile' },
  'creative-minimal': { name: 'Minimal', category: 'Creative', description: 'Artistic restraint' },
  'creative-light': { name: 'Light', category: 'Creative', description: 'Playful whitespace' },
  'creative-standard': { name: 'Standard', category: 'Creative', description: 'Expressive balance' },
  'creative-bold': { name: 'Bold', category: 'Creative', description: 'Vibrant, asymmetric' },
  'creative-max': { name: 'Max', category: 'Creative', description: 'Immersive portfolio' },
  'technical-minimal': { name: 'Minimal', category: 'Technical', description: 'Terminal aesthetic' },
  'technical-light': { name: 'Light', category: 'Technical', description: 'Code-centric light' },
  'technical-standard': { name: 'Standard', category: 'Technical', description: 'Developer default' },
  'technical-bold': { name: 'Bold', category: 'Technical', description: 'High-contrast hacker' },
  'technical-max': { name: 'Max', category: 'Technical', description: 'Full spec sheet' },
  'social-minimal': { name: 'Minimal', category: 'Social', description: 'Link-focused clean' },
  'social-light': { name: 'Light', category: 'Social', description: 'Airy social hub' },
  'social-standard': { name: 'Standard', category: 'Social', description: 'Balanced creator' },
  'social-bold': { name: 'Bold', category: 'Social', description: 'Vibrant personality' },
  'social-max': { name: 'Max', category: 'Social', description: 'All-in-one creator hub' },
};

function PresencePage() {
  const reducedMotion = useReducedMotion();
  const springConfig: Transition = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.standard;

  const [activeTab, setActiveTab] = useState<TabValue>('profile');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claimingSubdomain, setClaimingSubdomain] = useState(false);
  const [deletingSubdomain, setDeletingSubdomain] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [claimedSubdomain, setClaimedSubdomain] = useState<string | null>(null);
  const [lastCheckedSubdomain, setLastCheckedSubdomain] = useState<string>('');

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [profile, setProfile] = useState<Profile>({
    name: '',
    headline: '',
    bio: '',
    role: '',
    company: '',
    links: [],
    proofPoints: [],
    theme: { template: 'essential-standard' },
  });

  // Load existing profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        if (data.profile.subdomain) {
          setClaimedSubdomain(data.profile.subdomain);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleGenerate = async () => {
    if (!sourceUrl.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: sourceUrl }),
      });
      if (!res.ok) throw new Error('Failed to generate profile');
      const data = await res.json();
      if (data.profile) {
        const extracted = data.profile as ExtractedProfile;
        setProfile(prev => ({
          ...prev,
          name: extracted.name || prev.name,
          headline: extracted.headline || prev.headline,
          bio: extracted.bio || prev.bio,
          role: extracted.role || prev.role,
          company: extracted.company || prev.company,
          links: extracted.links || prev.links,
          proofPoints: extracted.proofPoints.map(p => ({ type: p.type, value: p.value, url: p.url || '' })) || prev.proofPoints,
        }));
        toast.success('Profile generated from URL');
      }
    } catch (error) {
      toast.error('Failed to generate profile');
    } finally {
      setGenerating(false);
    }
  };

  const checkSubdomainAvailability = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setSubdomainAvailable(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/subdomains/check?subdomain=${value}`, { credentials: 'include' });
        const data = await res.json();
        setSubdomainAvailable(data.available === true);
        setLastCheckedSubdomain(value);
      } catch {
        setSubdomainAvailable(null);
      }
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
      const res = await fetch('/api/subdomains/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subdomain }),
      });
      if (!res.ok) throw new Error('Failed to claim subdomain');
      setClaimedSubdomain(subdomain);
      toast.success(`Subdomain ${subdomain}.unool.co claimed!`);
    } catch {
      toast.error('Failed to claim subdomain');
    } finally {
      setClaimingSubdomain(false);
    }
  };

  const handleDeleteSubdomain = async () => {
    if (!claimedSubdomain) return;
    setDeletingSubdomain(true);
    try {
      const res = await fetch(`/api/subdomains/${claimedSubdomain}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete subdomain');
      // Reload profile to get updated subdomain
      await loadProfile();
      toast.success('Subdomain deleted');
    } catch {
      toast.error('Failed to delete subdomain');
    } finally {
      setDeletingSubdomain(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...profile,
          subdomain: claimedSubdomain,
        }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      toast.success('Profile saved');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkAdd = (type: string) => {
    const newLink: ProfileLink = { label: '', url: '', type };
    setProfile(prev => ({ ...prev, links: [...prev.links, newLink] }));
  };

  const handleLinkUpdate = (index: number, field: 'label' | 'url' | 'type', value: string) => {
    setProfile(prev => {
      const newLinks = [...prev.links];
      if (newLinks[index]) {
        newLinks[index] = { ...newLinks[index], [field]: value };
      }
      return { ...prev, links: newLinks };
    });
  };

  const handleLinkRemove = (index: number) => {
    setProfile(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  };

  const handleProofPointAdd = () => {
    const newPoint: ProofPoint = { type: '', value: '', url: '' };
    setProfile(prev => ({ ...prev, proofPoints: [...prev.proofPoints, newPoint] }));
  };

  const handleProofPointUpdate = (index: number, field: 'type' | 'value' | 'url', value: string) => {
    setProfile(prev => {
      const newPoints = [...prev.proofPoints];
      if (newPoints[index]) {
        newPoints[index] = { ...newPoints[index], [field]: value };
      }
      return { ...prev, proofPoints: newPoints };
    });
  };

  const handleProofPointRemove = (index: number) => {
    setProfile(prev => ({ ...prev, proofPoints: prev.proofPoints.filter((_, i) => i !== index) }));
  };

  const liveUrl = claimedSubdomain
    ? (process.env.NODE_ENV === 'development'
        ? `/u/${claimedSubdomain}`
        : `https://${claimedSubdomain}.unool.co`)
    : null;

  const handleTemplateSelect = (templateId: string) => {
    setProfile(prev => ({ ...prev, theme: { template: templateId } }));
    toast.success(`Template set to ${TEMPLATE_CONFIG[templateId]?.name || templateId}`);
  };

  return (
    <Box className="space-y-8 max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <Flex between wrap gap={4}>
        <Box>
          <Display size="xl" weight="bold">Presence (One Link)</Display>
          <Text size="lg" color="muted">Your intelligent public profile page</Text>
        </Box>
        <Flex wrap gap={2}>
          {claimedSubdomain && (
            <Badge variant="outline" className="gap-1">
              <GlobeIcon className="h-3 w-3" />
              {process.env.NODE_ENV === 'development'
                ? `/u/${claimedSubdomain}`
                : `${claimedSubdomain}.unool.co`}
            </Badge>
          )}
          {claimedSubdomain && liveUrl && (
            <Button variant="outline" asChild>
              <Link href={liveUrl} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </Link>
            </Button>
          )}
        </Flex>
      </Flex>

      {/* AI Generation Card */}
      <MotionBox variant="slide-up" delay={0.05}>
        <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Profile from URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Flex column gap={4} className="sm:flex-row">
              <Text size="sm" color="muted" className="flex-1 self-center sm:self-start">
                Paste your website, LinkedIn, or GitHub URL. Unool extracts your role, company, metrics, links, and proof points automatically.
              </Text>
              <Flex gap={2} className="w-full sm:w-auto">
                <Input
                  placeholder="https://yourwebsite.com or https://linkedin.com/in/yourname"
                  value={sourceUrl}
                  onChange={e => setSourceUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleGenerate} disabled={generating || !sourceUrl.trim()} size="lg">
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </Flex>
            </Flex>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Subdomain Claim */}
      <MotionBox variant="slide-up" delay={0.1}>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Claim Your Subdomain
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Flex column gap={2} className="sm:flex-row">
              <Box className="relative flex-1">
                <Input
                  placeholder="yourname"
                  value={subdomain}
                  onChange={handleSubdomainChange}
                  disabled={!!claimedSubdomain || claimingSubdomain}
                  className="pl-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">unool.co/</span>
                {subdomainAvailable !== null && lastCheckedSubdomain === subdomain && subdomain.length >= 3 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm">
                    {subdomainAvailable ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">Available</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">Taken</span>
                      </>
                    )}
                  </span>
                )}
              </Box>
              <Button onClick={handleClaimSubdomain} disabled={!subdomain || subdomainAvailable !== true || claimingSubdomain} size="lg">
                {claimingSubdomain ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Claim
                  </>
                )}
              </Button>
              {claimedSubdomain && (
                <Button variant="destructive" onClick={handleDeleteSubdomain} disabled={deletingSubdomain} size="lg">
                  {deletingSubdomain ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Subdomain
                    </>
                  )}
                </Button>
              )}
            </Flex>
            {claimedSubdomain && (
              <Text size="sm" color="muted">
                Your profile will be live at:{' '}
                <a href={liveUrl ?? '#'} target="_blank" className="underline text-primary hover:text-primary/80">
                  {liveUrl}
                </a>
              </Text>
            )}
          </CardContent>
        </Card>
      </MotionBox>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as TabValue)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-4 space-y-6">
          <MotionBox variant="slide-up">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Stack space={4}>
                  <Box className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Your Name"
                    />
                  </Box>
                  <Box className="space-y-2">
                    <Label htmlFor="headline">Headline</Label>
                    <Input
                      id="headline"
                      value={profile.headline}
                      onChange={e => setProfile({ ...profile, headline: e.target.value })}
                      placeholder="Founder @ Company"
                    />
                  </Box>
                  <Box className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      value={profile.bio}
                      onChange={e => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell the world about yourself"
                      className="w-full min-h-[100px] p-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={4}
                    />
                  </Box>
                  <Flex gap={4} wrap>
                    <Box className="space-y-2 flex-1 min-w-[200px]">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={profile.role}
                        onChange={e => setProfile({ ...profile, role: e.target.value })}
                        placeholder="CEO, Founder, Developer"
                      />
                    </Box>
                    <Box className="space-y-2 flex-1 min-w-[200px]">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profile.company}
                        onChange={e => setProfile({ ...profile, company: e.target.value })}
                        placeholder="Company Name"
                      />
                    </Box>
                  </Flex>
                </Stack>
              </CardContent>
            </Card>
          </MotionBox>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="mt-4 space-y-6">
          <MotionBox variant="slide-up">
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Links</CardTitle>
                <Flex gap={2}>
                  <Button variant="outline" size="sm" onClick={() => handleLinkAdd('social')}>
                    <Plus className="mr-1 h-3 w-3" />
                    Social
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleLinkAdd('custom')}>
                    <Plus className="mr-1 h-3 w-3" />
                    Custom
                  </Button>
                </Flex>
              </CardHeader>
              <CardContent>
                {profile.links.length === 0 ? (
                  <Text color="muted" className="py-8 text-center">No links added yet. Add your social profiles and custom links.</Text>
                ) : (
                  <Stack space={3}>
                    {profile.links.map((link, index) => (
                      <motion.div
                        key={index}
                        className="flex gap-2 p-3 border rounded-lg bg-background"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={springConfig}
                      >
                        <Box className="w-20">
                          <Label className="text-xs text-muted-foreground">Label</Label>
                          <Input
                            value={link.label}
                            onChange={e => handleLinkUpdate(index, 'label', e.target.value)}
                            placeholder="Twitter"
                            className="h-8 text-sm"
                          />
                        </Box>
                        <Box className="flex-1">
                          <Label className="text-xs text-muted-foreground">URL</Label>
                          <Input
                            value={link.url}
                            onChange={e => handleLinkUpdate(index, 'url', e.target.value)}
                            placeholder="https://twitter.com/username"
                            className="h-8 text-sm"
                          />
                        </Box>
                        <Box className="w-24">
                          <Label className="text-xs text-muted-foreground">Type</Label>
                          <select
                            value={link.type}
                            onChange={e => handleLinkUpdate(index, 'type', e.target.value)}
                            className="w-full h-8 text-sm border rounded bg-background"
                          >
                            <option value="social">Social</option>
                            <option value="custom">Custom</option>
                            <option value="primary">Primary CTA</option>
                          </select>
                        </Box>
                        <Button variant="ghost" size="icon" onClick={() => handleLinkRemove(index)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </MotionBox>

          {/* Proof Points */}
          <MotionBox variant="slide-up" delay={0.05}>
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Proof Points</CardTitle>
                <Button variant="outline" size="sm" onClick={handleProofPointAdd}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Proof Point
                </Button>
              </CardHeader>
              <CardContent>
                {profile.proofPoints.length === 0 ? (
                  <Text color="muted" className="py-8 text-center">No proof points added. Showcase your achievements, metrics, and credentials.</Text>
                ) : (
                  <Stack space={3}>
                    {profile.proofPoints.map((point, index) => (
                      <motion.div
                        key={index}
                        className="flex gap-2 p-3 border rounded-lg bg-background"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={springConfig}
                      >
                        <Box className="w-40">
                          <Label className="text-xs text-muted-foreground">Type</Label>
                          <Input
                            value={point.type}
                            onChange={e => handleProofPointUpdate(index, 'type', e.target.value)}
                            placeholder="Revenue"
                            className="h-8 text-sm"
                          />
                        </Box>
                        <Box className="flex-1">
                          <Label className="text-xs text-muted-foreground">Value</Label>
                          <Input
                            value={point.value}
                            onChange={e => handleProofPointUpdate(index, 'value', e.target.value)}
                            placeholder="$10M ARR"
                            className="h-8 text-sm"
                          />
                        </Box>
                        <Box className="w-48">
                          <Label className="text-xs text-muted-foreground">URL (optional)</Label>
                          <Input
                            value={point.url}
                            onChange={e => handleProofPointUpdate(index, 'url', e.target.value)}
                            placeholder="https://..."
                            className="h-8 text-sm"
                          />
                        </Box>
                        <Button variant="ghost" size="icon" onClick={() => handleProofPointRemove(index)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </MotionBox>
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design" className="mt-4 space-y-6">
          <MotionBox variant="slide-up">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Design Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Text size="sm" color="muted" className="mb-4">Choose a design template for your public profile page. 25 templates across 5 categories.</Text>
                <MotionGrid cols={{ base: 1, sm: 2, lg: 3, xl: 5 }} gap={4} stagger={stagger.normal}>
                  {Object.entries(TEMPLATE_CONFIG).map(([templateId, config]) => (
                    <motion.button
                      key={templateId}
                      onClick={() => handleTemplateSelect(templateId)}
                      className={cn(
                        'relative aspect-[4/3] border-2 rounded-lg overflow-hidden transition-all',
                        profile.theme.template === templateId
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-muted/50 hover:border-primary/50'
                      )}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={springConfig}
                      style={{ cursor: 'pointer' }}
                    >
                      <Box className="absolute inset-0 bg-muted/50" />
                      <Box className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                      <Box className="relative h-full w-full flex items-center justify-center">
                        <Display size="sm" weight="bold" className="text-center px-2" style={{ color: 'var(--primary)' }}>
                          {config.category[0]}
                        </Display>
                      </Box>
                      <Box className="absolute bottom-2 left-2 right-2 text-white text-sm font-medium">
                        {config.name}
                      </Box>
                      <Box className="absolute top-2 right-2 text-xs text-muted-foreground/80 bg-background/80 px-1.5 py-0.5 rounded">
                        {config.category}
                      </Box>
                      {profile.theme.template === templateId && (
                        <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary bg-primary/10 rounded-full" />
                      )}
                    </motion.button>
                  ))}
                </MotionGrid>
              </CardContent>
            </Card>
          </MotionBox>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <MotionBox variant="slide-up" delay={0.2}>
        <Flex end>
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </Flex>
      </MotionBox>
    </Box>
  );
}

function TemplateSelectorDemo() {
  return null;
}

export default function PresencePageWrapper() {
  return (
    <Suspense fallback={
      <Box className="space-y-8 max-w-4xl mx-auto px-4 py-8">
        <Flex between wrap gap={4}>
          <Box>
            <Display size="xl" weight="bold">Presence (One Link)</Display>
            <Text size="lg" color="muted">Your intelligent public profile page</Text>
          </Box>
        </Flex>
        <Card>
          <CardContent className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </Box>
    }>
      <PresencePage />
    </Suspense>
  );
}

// Helper component for responsive grid
function MotionGrid({ children, cols = { base: 1, sm: 2, lg: 3, xl: 5 }, gap = 4, stagger: staggerDelay = 0.06, ...props }: any) {
  const childArray = Array.isArray(children) ? children : [children];
  const reducedMotion = useReducedMotion();
  const springConfig: Transition = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.standard;

  return (
    <motion.div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${cols.lg || 3}, 1fr)`,
        gap: typeof gap === 'number' ? `${gap}px` : gap,
      }}
      variants={{}}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {childArray.map((child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              key: index,
              variants: { initial: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: springConfig } },
            })
          : child
      )}
    </motion.div>
  );
}

