'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, PenTool, CheckCircle, Link as LinkIcon, Plus, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  // Mock data - will be replaced with real data from Supabase
  const profile = {
    subdomain: 'founder',
    name: 'Sarah Chen',
    headline: 'Founder & CEO @ DataFlow',
    status: 'published',
    updatedAt: new Date(),
    links: [
      { label: 'Website', url: 'https://dataflow.io', type: 'website' },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/sarahchen', type: 'linkedin' },
      { label: 'Twitter', url: 'https://twitter.com/sarahchen', type: 'twitter' },
    ],
    proofPoints: [
      { type: 'metric', value: '$2.4M ARR' },
      { type: 'customer', value: '500+ companies' },
      { type: 'team', value: '12 people' },
    ],
  };

  const recentPosts = [
    { id: '1', content: 'Just launched v2...', status: 'published', platform: 'linkedin', createdAt: new Date('2024-01-15') },
    { id: '2', content: 'Building in public...', status: 'draft', platform: 'x', createdAt: new Date() },
    { id: '3', content: 'Our Series A...', status: 'published', platform: 'threads', createdAt: new Date('2024-01-10') },
  ];

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
            <Link href={`/${profile.subdomain}.unool.co`} target="_blank">
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
              <Badge variant={profile.status === 'published' ? 'default' : 'secondary'}>
                <CheckCircle className="mr-1 h-3 w-3" />
                {profile.status === 'published' ? 'Live' : 'Draft'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {profile.subdomain}.unool.co
              </span>
            </div>
            <p className="text-2xl font-bold">{profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.headline}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts This Month</CardTitle>
            <PenTool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">3</span>
              <span className="text-sm text-muted-foreground">/ 12 limit (Free)</span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/4" />
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
              <span className="text-3xl font-bold">1,234</span>
              <span className="text-sm text-muted-foreground">+12% vs last month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">89</span>
              <span className="text-sm text-muted-foreground">7.2% CTR</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
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
              <span className="font-mono font-medium">{profile.subdomain}</span>
              <Badge variant="outline">Live</Badge>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/${profile.subdomain}.unool.co`} target="_blank">
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{post.content}</p>
                  <p className="text-sm text-muted-foreground">
                    {post.platform} • {format(post.createdAt, 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                    {post.status}
                  </Badge>
                </div>
              </div>
            ))}
            {recentPosts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <PenTool className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <p>No posts yet. Create your first post to get started!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}