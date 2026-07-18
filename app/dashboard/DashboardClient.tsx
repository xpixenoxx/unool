'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, PenTool, CheckCircle, Link as LinkIcon, Plus, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PlatformConnections } from '@/components/dashboard/PlatformConnections';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

interface Profile {
  subdomain: string | null;
  name: string | null;
  headline: string | null;
  status: 'published' | 'draft';
  updatedAt: string | null;
  links: Array<{ label: string; url: string; type: string }>;
  proofPoints: Array<{ type: string; value: string }>;
}

interface Post {
  id: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface UsageStats {
  postsThisMonth: number;
  postsLimit: number;
  profileViews: number;
  linkClicks: number;
}

interface DashboardData {
  profile: Profile | null;
  recentPosts: Post[];
  usageStats: UsageStats;
  planTier: 'free' | 'pro' | 'enterprise';
  userId: string;
  workspaceId: string;
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { profile, recentPosts, usageStats, planTier } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your One Link and One Click workflows</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/publish">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${(profile?.subdomain || 'yourname')}.unool.co`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">One Link Status</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={profile?.status === 'published' ? 'default' : 'secondary'}>
                <CheckCircle className="mr-1 h-3 w-3" />
                {profile?.status === 'published' ? 'Live' : 'Draft'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {profile?.subdomain ? `${profile.subdomain}.unool.co` : 'Not claimed'}
              </span>
            </div>
            <p className="text-2xl font-bold">{profile?.name || 'Your Name'}</p>
            <p className="text-sm text-muted-foreground">{profile?.headline || 'Add a headline'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts This Month</CardTitle>
            <PenTool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{usageStats.postsThisMonth}</span>
              <span className="text-sm text-muted-foreground">/ {usageStats.postsLimit} limit ({planTier})</span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, (usageStats.postsThisMonth / usageStats.postsLimit) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{usageStats.profileViews.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">This month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{usageStats.linkClicks.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">Total clicks</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Your Public Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <span className="text-muted-foreground">unool.co/</span>
              <span className="font-mono font-medium">{profile?.subdomain || 'not-claimed'}</span>
              <Badge variant="outline">{profile?.status === 'published' ? 'Live' : 'Draft'}</Badge>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/${(profile?.subdomain || 'yourname')}.unool.co`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/presence">
                  <PenTool className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-blue-500" />
              Write & Publish
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Write once. AI adapts for LinkedIn, X, Threads. You review. One click publishes.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/publish">
                <Plus className="mr-2 h-4 w-4" />
                Create New Post
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Checklist */}
      {data.profile && (
        <OnboardingChecklist
          workspaceId={data.workspaceId}
          userId={data.userId}
        />
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPosts.length > 0 ? (
              recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{post.content}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                      {post.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PenTool className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <p>No posts yet. Create your first post to get started!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Platform Connections */}
      <PlatformConnections workspaceId={data.workspaceId} />
    </div>
  );
}