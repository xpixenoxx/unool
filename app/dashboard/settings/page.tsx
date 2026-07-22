'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, Shield, Bell, Palette, Trash2, User, Lock, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type TabValue = 'account' | 'security' | 'notifications' | 'appearance' | 'danger';

interface Workspace {
  id: string;
  name: string;
  plan: string;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabValue>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [oauthBanner, setOauthBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Handle OAuth callback result from URL params
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const description = searchParams.get('description');

    if (connected) {
      const platformName = connected.charAt(0).toUpperCase() + connected.slice(1);
      setOauthBanner({ type: 'success', message: `${platformName} connected successfully!` });
      toast.success(`${platformName} connected!`);
    } else if (error) {
      const msg = description
        ? decodeURIComponent(description)
        : error === 'redis_unconfigured'
          ? 'Redis (Upstash) is not configured. Platform connections require Redis for OAuth state.'
          : error === 'invalid_state'
            ? 'OAuth session expired. Please try connecting again.'
            : `Connection failed: ${error}`;
      setOauthBanner({ type: 'error', message: msg });
      toast.error('Connection failed', { description: msg });
    }
  }, [searchParams]);

  // Load workspace data on mount
  useEffect(() => {
    loadWorkspace();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWorkspace = async () => {
    try {
      const res = await fetch('/api/workspace', { credentials: 'include' });
      const data = await res.json();
      if (data.workspace) {
        setWorkspace(data.workspace);
        setWorkspaceName(data.workspace.name);
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkspace = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: workspaceName }),
      });
      if (res.ok) {
        toast.success('Workspace name updated');
      } else {
        toast.error('Failed to update workspace');
      }
    } catch {
      toast.error('Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const res = await fetch('/api/auth/signout', { method: 'POST' });
    if (res.ok) {
      window.location.href = '/signup';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <Card>
          <CardContent className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account, workspace, and preferences</p>
      </div>

      {/* OAuth Result Banner */}
      {oauthBanner && (
        <Alert variant={oauthBanner.type === 'error' ? 'destructive' : 'default'} className={oauthBanner.type === 'success' ? 'border-green-500 bg-green-50 text-green-800' : ''}>
          {oauthBanner.type === 'success'
            ? <CheckCircle className="h-4 w-4 text-green-600" />
            : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{oauthBanner.message}</AlertDescription>
        </Alert>
      )}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as TabValue)} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account"><User className="mr-2 h-4 w-4" /> Account</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" /> Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" /> Appearance</TabsTrigger>
          <TabsTrigger value="danger"><Trash2 className="mr-2 h-4 w-4 text-destructive" /> Danger Zone</TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Workspace Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="My Workspace"
                  />
                </div>
                <div>
                  <Label htmlFor="plan-tier">Plan</Label>
                  <Input
                    id="plan-tier"
                    value={workspace?.plan || 'free'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <Button onClick={handleSaveWorkspace} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Workspace Name'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage your API keys for integrating with Unool. Keys are shown only once upon creation.
              </p>
              <div className="flex gap-2">
                <Button variant="outline">Create New Key</Button>
                <Button variant="ghost">View Existing Keys</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                API key management will be available in v1.1. Contact support for enterprise API access.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Password & Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Magic Link Authentication</p>
                  <p className="text-sm text-muted-foreground">Sign in with email links (no passwords)</p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-muted-foreground">Manage your logged-in devices</p>
                </div>
                <Button variant="ghost" size="sm">View Sessions</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage OAuth connections for publishing. Configure in the Platform Connections section on the Dashboard.
              </p>
              <Button variant="outline" asChild>
                <a href="/dashboard">Go to Platform Connections</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose how you want to be notified about activity on your posts and profile.
              </p>
              <div className="space-y-3">
                {[
                  { id: 'publish_success', label: 'Publish Success', description: 'When a post is published successfully' },
                  { id: 'publish_failure', label: 'Publish Failure', description: 'When a post fails to publish' },
                  { id: 'engagement', label: 'Engagement Alerts', description: 'Likes, comments, shares on your posts' },
                  { id: 'profile_views', label: 'Profile Views', description: 'Daily/weekly profile view summaries' },
                  { id: 'webhook_events', label: 'Webhook Events', description: 'Incoming webhook notifications from platforms' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Dashboard Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose your preferred dashboard appearance. This is separate from your public profile theme.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <Button
                    key={theme}
                    variant="outline"
                    className="flex flex-col items-center gap-2 p-4 h-auto"
                  >
                    <div className={`w-12 h-12 rounded-lg border-2 ${theme === 'system' ? 'bg-gradient-to-br from-blue-500 to-purple-500' : theme === 'dark' ? 'bg-gray-900' : 'bg-white' }`} />
                    <span className="capitalize">{theme}</span>
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Theme selection will be saved in v1.1. Currently uses system preference.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Public Profile Theme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Customize how your public profile looks at {workspace?.name || 'yourname'}.unool.co
              </p>
              <Button variant="outline" asChild>
                <a href="/dashboard/presence">Edit in Presence Tab</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="mt-6 space-y-6">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <h4 className="font-medium text-destructive mb-1">Delete Workspace</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete your workspace and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" onClick={() => alert('Workspace deletion not yet implemented')}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Workspace
                </Button>
              </div>

              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <h4 className="font-medium text-destructive mb-1">Sign Out Everywhere</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Invalidate all active sessions and require re-authentication on all devices.
                </p>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out Everywhere
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}