'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Github, Linkedin, Twitter, Calendar, Globe, Sparkles, ArrowUpRight } from 'lucide-react';

type Preset = 'minimal' | 'bold' | 'corporate' | 'creative' | 'technical';

interface ProfileLink {
  label: string;
  url: string;
  type: 'website' | 'linkedin' | 'github' | 'twitter' | 'calendly' | 'other';
}

interface ProofPoint {
  type: 'metric' | 'customer' | 'press' | 'product' | 'team' | 'funding';
  value: string;
  url?: string;
}

interface ProfileTheme {
  preset: Preset;
  primaryColor?: string;
  font?: string;
}

interface Profile {
  id: string;
  workspaceId: string;
  userId: string;
  subdomain: string;
  name: string | null;
  headline: string | null;
  bio: string | null;
  role: string | null;
  company: string | null;
  links: ProfileLink[];
  proofPoints: ProofPoint[];
  theme: ProfileTheme;
  sourceUrl: string | null;
  extractionPromptVersion: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const themeStyles: Record<Preset, { container: string; accent: string; text: string }> = {
  minimal: { container: 'bg-white dark:bg-gray-950', accent: 'text-primary', text: 'text-gray-900 dark:text-gray-100' },
  bold: { container: 'bg-gray-950 dark:bg-black', accent: 'text-primary', text: 'text-white' },
  corporate: { container: 'bg-blue-50 dark:bg-blue-950/20', accent: 'text-blue-600 dark:text-blue-400', text: 'text-gray-800 dark:text-gray-200' },
  creative: { container: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20', accent: 'text-purple-600 dark:text-pink-400', text: 'text-gray-800 dark:text-gray-200' },
  technical: { container: 'bg-green-50 dark:bg-green-950/20', accent: 'text-green-600 dark:text-green-400', text: 'text-gray-800 dark:text-gray-200' },
};

function getLinkIcon(type: ProfileLink['type']) {
  switch (type) {
    case 'linkedin': return <Linkedin className="h-4 w-4" />;
    case 'twitter': return <Twitter className="h-4 w-4" />;
    case 'github': return <Github className="h-4 w-4" />;
    case 'calendly': return <Calendar className="h-4 w-4" />;
    case 'website': return <Globe className="h-4 w-4" />;
    default: return <ExternalLink className="h-4 w-4" />;
  }
}

function getProofIcon(type: ProofPoint['type']) {
  switch (type) {
    case 'metric': return <ArrowUpRight className="h-4 w-4" />;
    case 'customer': return <Sparkles className="h-4 w-4" />;
    case 'team': return <Github className="h-4 w-4" />;
    case 'funding': return <ArrowUpRight className="h-4 w-4" />;
    default: return <Sparkles className="h-4 w-4" />;
  }
}

function sanitizePlainText(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

export default function PublicProfilePage({ params }: { params: Promise<{ subdomain: string }> }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      const { subdomain } = await params;
      console.log('[PublicProfile] Fetching profile for:', subdomain);
      try {
        const response = await fetch(`/api/profile/${subdomain}`, {
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('[PublicProfile] Response status:', response.status);
        if (!response.ok) {
          if (response.status === 404) {
            if (!cancelled) setError('Profile not found');
          } else {
            const text = await response.text();
            console.error('[PublicProfile] Error response:', text);
            if (!cancelled) setError('Failed to load profile');
          }
          return;
        }
        const data = await response.json();
        console.log('[PublicProfile] Profile data received:', { subdomain: data.subdomain, name: data.name });
        if (!cancelled) setProfile(data);
      } catch (err) {
        console.error('[PublicProfile] Fetch error:', err);
        if (!cancelled) setError('Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <Card className="max-w-md w-full text-center p-8">
          <CardContent className="space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Profile Not Found</h1>
            <p className="text-muted-foreground">
              {error === 'Profile not found'
                ? 'This profile doesn\'t exist yet. Check the URL or create your own profile.'
                : 'Unable to load profile. Please try again later.'}
            </p>
            <Button asChild className="w-full">
              <Link href="/signup">Create Your Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { name, headline, bio, role, company, links, proofPoints, theme, subdomain } = profile;
  const styles = themeStyles[theme.preset];

  return (
    <div className={`min-h-screen ${styles.container} transition-colors duration-300`}>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Globe className="h-3 w-3" />
            <span>{subdomain}.unool.co</span>
          </div>
          <h1 className={`text-4xl sm:text-5xl font-bold ${styles.text}`}>{name || 'Your Name'}</h1>
          <p className={`mt-3 text-xl ${styles.text} opacity-80`}>{headline || 'Add a headline to introduce yourself'}</p>
        </header>

        {/* Bio */}
        {bio && (
          <div className={`prose prose-sm dark:prose-invert max-w-none mb-10 ${styles.text}`}>
            <p>{sanitizePlainText(bio)}</p>
          </div>
        )}

        {/* Role & Company */}
        {(role || company) && (
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 text-muted-foreground text-sm">
            {role && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full">
                <Badge variant="outline" className="h-auto px-2 py-0.5">{role}</Badge>
              </span>
            )}
            {company && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full">
                <Badge variant="outline" className="h-auto px-2 py-0.5">{company}</Badge>
              </span>
            )}
          </div>
        )}

        {/* Proof Points */}
        {proofPoints.length > 0 && (
          <section className="mb-10">
            <h2 className={`text-lg font-semibold mb-6 ${styles.text}`}>Proof Points</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {proofPoints.map((point, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${styles.accent} bg-primary/10`}>
                      {getProofIcon(point.type)}
                    </div>
                    <div>
                      <p className={`font-medium ${styles.text}`}>{point.value}</p>
                      <p className="text-xs text-muted-foreground capitalize">{point.type}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Links */}
        {links.length > 0 && (
          <section className="mb-10">
            <h2 className={`text-lg font-semibold mb-6 ${styles.text}`}>Connect</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all hover:shadow-md ${
                    styles.accent
                  } border-primary/20 bg-primary/5 hover:bg-primary/10`}
                >
                  <span className="text-sm font-medium">{getLinkIcon(link.type)}</span>
                  <span className="text-sm font-medium">{link.label}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-sm text-muted-foreground">
            Built with <span className="text-primary">♥</span> on Unool — One Link + One Click
          </p>
        </footer>
      </div>
    </div>
  );
}