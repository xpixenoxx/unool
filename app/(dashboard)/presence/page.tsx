'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, PenTool, Loader2, Sparkles, Trash2, Palette, Link as LinkIcon, ExternalLink, Plus } from 'lucide-react';

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
  name: string;
  headline: string;
  bio: string;
  role: string;
  company: string;
  links: ProfileLink[];
  proofPoints: ProofPoint[];
  theme: ProfileTheme;
}

export default function PresencePage() {
  const [activeTab, setActiveTab] = useState<TabValue>('profile');
  const [generating, setGenerating] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');

  // Mock profile data
  const [profile, setProfile] = useState<Profile>({
    name: 'Sarah Chen',
    headline: 'Founder & CEO @ DataFlow',
    bio: 'Building the future of data infrastructure. Previously VP Eng at ScaleAI. Stanford CS. Angel investor.',
    role: 'Founder & CEO',
    company: 'DataFlow',
    links: [
      { label: 'Website', url: 'https://dataflow.io', type: 'website' },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/sarahchen', type: 'linkedin' },
      { label: 'Twitter', url: 'https://twitter.com/sarahchen', type: 'twitter' },
    ],
    proofPoints: [
      { type: 'metric', value: '$2.4M ARR', url: '' },
      { type: 'customer', value: '500+ companies', url: '' },
      { type: 'team', value: '12 people', url: '' },
    ],
    theme: { preset: 'minimal' },
  });

  const handleGenerate = async () => {
    if (!sourceUrl) return;
    setGenerating(true);
    // Simulate AI generation
    await new Promise(r => setTimeout(r, 2000));
    setProfile(prev => ({
      ...prev,
      name: 'Sarah Chen',
      headline: 'Founder & CEO @ DataFlow',
      bio: 'Building the future of data infrastructure. Previously VP Eng at ScaleAI. Stanford CS. Angel investor.',
      role: 'Founder & CEO',
      company: 'DataFlow',
    }));
    setGenerating(false);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Presence (One Link)</h1>
          <p className="text-muted-foreground">Your intelligent public profile page</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Globe className="h-3 w-3" />
            sarah.unool.co
          </Badge>
          <Button variant="outline" asChild>
            <Link href="/sarah.unool.co" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Live
            </Link>
          </Button>
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
            <Button onClick={handleGenerate} disabled={generating || !sourceUrl}>
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
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <Input id="headline" value={profile.headline} onChange={e => setProfile(p => ({ ...p, headline: e.target.value }))} />
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
                  <Input id="role" value={profile.role} onChange={e => setProfile(p => ({ ...p, role: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Proof Points</CardTitle>
              <Button variant="outline" size="sm">
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
                    </select>
                    <Input
                      value={point.value}
                      onChange={e => setProfile(p => ({
                        ...p,
                        proofPoints: p.proofPoints.map((pt, idx) => idx === i ? { ...pt, value: e.target.value } : pt)
                      }))}
                      placeholder="e.g., $2.4M ARR"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setProfile(p => ({
                      ...p,
                      proofPoints: p.proofPoints.filter((_, idx) => idx !== i)
                    }))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Social & Important Links</CardTitle>
              <Button variant="outline" size="sm">
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
    </div>
  );
}