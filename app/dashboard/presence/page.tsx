'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, PenTool, Loader2, Sparkles, Trash2, Palette, Link as LinkIcon, ExternalLink, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  preset: Preset;
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
  subdomain?: string;
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

export default function PresencePage() {
  const [activeTab, setActiveTab] = useState<TabValue>('profile');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claimingSubdomain, setClaimingSubdomain] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [claimedSubdomain, setClaimedSubdomain] = useState<string | null>(null);
  const [lastCheckedSubdomain, setLastCheckedSubdomain] = useState<string>('');

  // Debounce ref for subdomain check
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [profile, setProfile] = useState<Profile>({
    name: '',
    headline: '',
    bio: '',
    role: '',
    company: '',
    links: [],
    proofPoints: [],
    theme: { preset: 'minimal' },
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
        setProfile({
          id: data.profile.id,
          name: data.profile.name || '',
          headline: data.profile.headline || '',
          bio: data.profile.bio || '',
          role: data.profile.role || '',
          company: data.profile.company || '',
          links: data.profile.links || [],
          proofPoints: data.profile.proofPoints || [],
          theme: data.profile.theme || { preset: 'minimal' },
          subdomain: data.profile.subdomain,
        });
        if (data.profile.subdomain) {
          setClaimedSubdomain(data.profile.subdomain);
          setSubdomain(data.profile.subdomain);
          setSubdomainAvailable(true);
        }
      }
    } catch {
      // Ignore - user might not have a profile yet
    }
  };

  const checkSubdomainAvailability = useCallback(async (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!sanitized || sanitized.length < 2) {
      setSubdomainAvailable(null);
      setLastCheckedSubdomain('');
      return;
    }

    // Skip if already checked this value
    if (sanitized === lastCheckedSubdomain) return;

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce 300ms
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/${sanitized}`, { credentials: 'include' });
        const available = res.status === 404; // 404 = available
        setSubdomainAvailable(available);
        setLastCheckedSubdomain(sanitized);
      } catch {
        setSubdomainAvailable(null);
        setLastCheckedSubdomain('');
      }
    }, 300);
  }, [lastCheckedSubdomain]);

  const handleSubdomainChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(sanitized);
    checkSubdomainAvailability(sanitized);
  };

  const handleGenerate = async () => {
    if (!sourceUrl.trim()) return;
    setGenerating(true);

    try {
      const res = await fetch('/api/profile/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: sourceUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Extraction failed');
      }

      const extracted: ExtractedProfile = data.profile;

      setProfile(prev => ({
        ...prev,
        name: extracted.name || prev.name,
        headline: extracted.headline || prev.headline,
        bio: extracted.bio || prev.bio,
        role: extracted.role || prev.role,
        company: extracted.company || prev.company,
        links: [
          ...prev.links,
          ...(extracted.links || []).map(l => ({ label: l.label, url: l.url, type: l.type })),
        ],
        proofPoints: [
          ...prev.proofPoints,
          ...(extracted.proofPoints || []).map(p => ({ type: p.type, value: p.value, url: p.url || '' })),
        ],
      }));

      toast.success('Profile generated from URL');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate profile');
    } finally {
      setGenerating(false);
    }
  };

  // Separate handler for CLAIM SUBDOMAIN only
  const handleClaimSubdomain = async () => {
    if (!subdomain || subdomainAvailable === false || claimingSubdomain || !!claimedSubdomain) {
      return;
    }

    setClaimingSubdomain(true);

    try {
      // Only update the subdomain field, nothing else
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...profile,
          subdomain: subdomain,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim subdomain');
      }

      setProfile(data.profile);
      setClaimedSubdomain(data.profile.subdomain);
      toast.success(`Subdomain claimed: ${data.profile.subdomain}.unool.co`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to claim subdomain');
    } finally {
      setClaimingSubdomain(false);
    }
  };

  // Handler for SAVE ENTIRE PROFILE
  const handleSaveProfile = async () => {
    if (!profile.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (subdomain && subdomainAvailable === false) {
      toast.error('Subdomain is not available');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...profile,
          subdomain: subdomain || profile.subdomain,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Save failed');
      }

      setProfile(data.profile);
      if (data.profile.subdomain) {
        setClaimedSubdomain(data.profile.subdomain);
      }
      toast.success('Profile saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
  };

  const liveUrl = claimedSubdomain
    ? (process.env.NODE_ENV === 'development'
        ? `/u/${claimedSubdomain}`
        : `https://${claimedSubdomain}.unool.co`)
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Presence (One Link)</h1>
          <p className="text-muted-foreground">Your intelligent public profile page</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {claimedSubdomain && (
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
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
        </div>
      </div>

      {/* AI Generation Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Profile from URL
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <p className="text-sm text-muted-foreground flex-1 self-center">
            Paste your website, LinkedIn, or GitHub URL. Unool extracts your role, company, metrics, links, and proof points automatically.
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Input
              placeholder="https://yourwebsite.com or https://linkedin.com/in/yourname"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleGenerate} disabled={generating || !sourceUrl.trim()}>
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
          </div>
        </CardContent>
      </Card>

      {/* Subdomain Claim */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Claim Your Subdomain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a unique subdomain for your public profile (e.g., yourname.unool.co)
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="yourname"
                value={subdomain}
                onChange={e => handleSubdomainChange(e.target.value)}
                disabled={!!claimedSubdomain}
                className="flex-1"
              />
              <span className="text-muted-foreground">.unool.co</span>
            </div>
            <Button
              onClick={handleClaimSubdomain}
              disabled={
                !subdomain ||
                subdomainAvailable === false ||
                claimingSubdomain ||
                !!claimedSubdomain
              }
              variant={claimedSubdomain ? 'secondary' : 'default'}
            >
              {claimingSubdomain ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : claimedSubdomain ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Claimed
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Claim
                </>
              )}
            </Button>
          </div>
          <p className="text-sm">
            {subdomainAvailable === true && (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Available
              </span>
            )}
            {subdomainAvailable === false && (
              <span className="text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Taken
              </span>
            )}
            {subdomainAvailable === null && subdomain && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking...
              </span>
            )}
            {!subdomain && (
              <span className="text-muted-foreground">Enter a subdomain to check availability</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile"><PenTool className="mr-2 h-4 w-4" /> Profile</TabsTrigger>
          <TabsTrigger value="links"><LinkIcon className="mr-2 h-4 w-4" /> Links</TabsTrigger>
          <TabsTrigger value="design"><Palette className="mr-2 h-4 w-4" /> Design</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    value={profile.headline}
                    onChange={e => setProfile(p => ({ ...p, headline: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profile.role}
                    onChange={e => setProfile(p => ({ ...p, role: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={e => setProfile(p => ({ ...p, company: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Proof Points</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setProfile(p => ({
                ...p,
                proofPoints: [...p.proofPoints, { type: 'metric', value: '', url: '' }]
              }))}>
                <Plus className="mr-1 h-3 w-3" />
                Add Proof Point
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.proofPoints.map((point, i) => (
                  <div key={i} className="flex gap-2 p-3 border rounded-lg">
                    <select
                      value={point.type}
                      onChange={e => setProfile(p => ({
                        ...p,
                        proofPoints: p.proofPoints.map((pt, idx) => idx === i ? { ...pt, type: e.target.value as ProofPoint['type'] } : pt)
                      }))}
                      className="w-32 border rounded px-2 py-1"
                    >
                      <option value="metric">Metric</option>
                      <option value="customer">Customer</option>
                      <option value="team">Team</option>
                      <option value="funding">Funding</option>
                      <option value="press">Press</option>
                      <option value="product">Product</option>
                    </select>
                    <Input
                      value={point.value}
                      onChange={e => setProfile(p => ({
                        ...p,
                        proofPoints: p.proofPoints.map((pt, idx) => idx === i ? { ...pt, value: e.target.value } : pt)
                      }))}
                      placeholder="e.g., $2.4M ARR"
                    />
                    <Input
                      value={point.url}
                      onChange={e => setProfile(p => ({
                        ...p,
                        proofPoints: p.proofPoints.map((pt, idx) => idx === i ? { ...pt, url: e.target.value } : pt)
                      }))}
                      placeholder="Optional URL"
                      className="w-64"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setProfile(p => ({
                      ...p,
                      proofPoints: p.proofPoints.filter((_, idx) => idx !== i)
                    }))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {profile.proofPoints.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No proof points yet. Add metrics, customers, team size, or funding.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Social & Important Links</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setProfile(p => ({
                ...p,
                links: [...p.links, { label: '', url: '', type: 'website' }]
              }))}>
                <Plus className="mr-1 h-3 w-3" />
                Add Link
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.links.map((link, i) => (
                  <div key={i} className="flex gap-2 p-3 border rounded-lg">
                    <select
                      value={link.type}
                      onChange={e => setProfile(p => ({
                        ...p,
                        links: p.links.map((l, idx) => idx === i ? { ...l, type: e.target.value as ProfileLink['type'] } : l)
                      }))}
                      className="w-32 border rounded px-2 py-1"
                    >
                      <option value="website">Website</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="twitter">Twitter/X</option>
                      <option value="github">GitHub</option>
                      <option value="calendly">Calendly</option>
                      <option value="other">Other</option>
                    </select>
                    <Input
                      value={link.label}
                      onChange={e => setProfile(p => ({
                        ...p,
                        links: p.links.map((l, idx) => idx === i ? { ...l, label: e.target.value } : l)
                      }))}
                      placeholder="Label"
                      className="w-32"
                    />
                    <Input
                      value={link.url}
                      onChange={e => setProfile(p => ({
                        ...p,
                        links: p.links.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l)
                      }))}
                      placeholder="https://..."
                    />
                    <Button variant="ghost" size="icon" onClick={() => setProfile(p => ({
                      ...p,
                      links: p.links.filter((_, idx) => idx !== i)
                    }))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {profile.links.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No links yet. Add your website, LinkedIn, GitHub, etc.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a professional theme. Custom domains and advanced customization coming in v1.1.
              </p>
              <div className="grid gap-4 md:grid-cols-5">
                {(['minimal', 'bold', 'corporate', 'creative', 'technical'] as const).map(preset => (
                  <Button
                    key={preset}
                    variant={profile.theme.preset === preset ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 py-4"
                    onClick={() => setProfile(p => ({ ...p, theme: { ...p.theme, preset } }))}
                  >
                    <div className="w-full h-20 border rounded-lg bg-background relative">
                      {preset === 'minimal' && <div className="absolute top-4 left-4 w-12 h-4 bg-primary rounded" />}
                      {preset === 'bold' && <div className="absolute top-4 left-4 w-16 h-5 bg-primary rounded" />}
                      {preset === 'corporate' && <div className="absolute top-4 left-4 w-20 h-4 bg-blue-600 rounded" />}
                      {preset === 'creative' && <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded" />}
                      {preset === 'technical' && <div className="absolute top-4 left-4 w-14 h-3 bg-green-600 rounded" />}
                    </div>
                    <span className="capitalize text-sm">{preset}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Profile Button - saves everything including subdomain */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSaveProfile} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Profile...
            </>
          ) : (
            'Save Profile'
          )}
        </Button>
      </div>
    </div>
  );
}