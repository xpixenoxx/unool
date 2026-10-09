'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2, Linkedin, Twitter, MessageSquare, Facebook, Instagram,
  Phone, CheckCircle, AlertCircle, Unlink2, Link2, Lock, Globe2,
  ArrowRight, Wifi, WifiOff, RefreshCw, Youtube, Cloud, ExternalLink, Image as ImageIcon,
  MessageCircle, Hash, Twitch
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BlueskyConnectDialog } from './BlueskyConnectDialog';
import { MastodonConnectDialog } from './MastodonConnectDialog';
import { SlackConnectDialog } from './SlackConnectDialog';
import { TwitchConnectDialog } from './TwitchConnectDialog';

const SUPPORTED_PLATFORMS = ['linkedin', 'x', 'threads', 'manual', 'facebook', 'whatsapp', 'instagram', 'youtube', 'pinterest', 'bluesky', 'reddit', 'mastodon', 'slack', 'twitch'] as const;
type Platform = typeof SUPPORTED_PLATFORMS[number];

interface PlatformConnection {
  platform: Platform;
  status: 'connected' | 'expired' | 'not_connected' | 'error';
  username?: string;
  connectedAt?: string;
  expiresAt?: string;
}

interface PlatformConnectionsProps {
  workspaceId: string;
}

/* ─── Platform display config ──────────────────────────────── */

const PLATFORM_CONFIG: Record<
  Platform,
  {
    icon: React.ElementType;
    name: string;
    shortName: string;
    color: string;
    hoverBorder: string;
    description: string;
    audience: string;
    available: boolean;
    customConnect?: boolean; // uses custom form instead of OAuth redirect
  }
> = {
  linkedin: {
    icon: Linkedin,
    name: 'LinkedIn',
    shortName: 'LinkedIn',
    color: 'bg-[#0A66C2]',
    hoverBorder: 'hover:border-[#0A66C2]/30',
    description: 'Professional articles & posts',
    audience: 'Professionals & decision-makers',
    available: true,
  },
  x: {
    icon: Twitter,
    name: 'X (Twitter)',
    shortName: 'X',
    color: 'bg-neutral-900 dark:bg-neutral-100',
    hoverBorder: 'hover:border-neutral-400/40',
    description: 'Posts, threads & media',
    audience: 'Global public audience',
    available: true,
  },
  threads: {
    icon: MessageSquare,
    name: 'Threads',
    shortName: 'Threads',
    color: 'bg-neutral-900 dark:bg-neutral-100',
    hoverBorder: 'hover:border-neutral-400/40',
    description: 'Text-based conversations',
    audience: 'Instagram community',
    available: true,
  },
  facebook: {
    icon: Facebook,
    name: 'Facebook Pages',
    shortName: 'Facebook',
    color: 'bg-[#1877F2]',
    hoverBorder: 'hover:border-[#1877F2]/30',
    description: 'Page posts with rich media',
    audience: 'Wide demographic reach',
    available: true,
  },
  whatsapp: {
    icon: Phone,
    name: 'WhatsApp Status',
    shortName: 'WhatsApp',
    color: 'bg-[#25D366]',
    hoverBorder: 'hover:border-[#25D366]/30',
    description: '24-hour status updates',
    audience: 'Personal network',
    available: true,
  },
  instagram: {
    icon: Instagram,
    name: 'Instagram',
    shortName: 'Instagram',
    color: 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]',
    hoverBorder: 'hover:border-pink-400/30',
    description: 'Feed, Reels & Stories',
    audience: 'Visual-first audience',
    available: true,
  },
  manual: {
    icon: Link2,
    name: 'Manual / Other',
    shortName: 'Other',
    color: 'bg-neutral-500',
    hoverBorder: 'hover:border-neutral-400/30',
    description: 'Copy-paste to any platform',
    audience: 'Any platform',
    available: true,
  },
  youtube: {
    icon: Youtube,
    name: 'YouTube',
    shortName: 'YouTube',
    color: 'bg-[#FF0000]',
    hoverBorder: 'hover:border-red-400/30',
    description: 'Video content & Shorts',
    audience: 'Video consumers',
    available: true,
  },
  pinterest: {
    icon: ImageIcon,
    name: 'Pinterest',
    shortName: 'Pinterest',
    color: 'bg-[#E60023]',
    hoverBorder: 'hover:border-[#E60023]/30',
    description: 'Visual discovery & ideas',
    audience: 'Shoppers & visual planners',
    available: true,
  },
  bluesky: {
    icon: Cloud,
    name: 'Bluesky',
    shortName: 'Bluesky',
    color: 'bg-[#0085ff]',
    hoverBorder: 'hover:border-[#0085ff]/30',
    description: 'Decentralised social posts',
    audience: 'Open web community',
    available: true,
    customConnect: true, // uses handle + app password, not OAuth
  },
  reddit: {
    icon: MessageCircle,
    name: 'Reddit',
    shortName: 'Reddit',
    color: 'bg-[#FF4500]',
    hoverBorder: 'hover:border-[#FF4500]/30',
    description: 'Communities & discussions',
    audience: 'Subreddits & members',
    available: true,
  },
  mastodon: {
    icon: Globe2,
    name: 'Mastodon',
    shortName: 'Mastodon',
    color: 'bg-[#6364FF]',
    hoverBorder: 'hover:border-[#6364FF]/30',
    description: 'Federated social posts',
    audience: 'Fediverse community',
    available: true,
    customConnect: true, // uses handle + PAT, not OAuth
  },
  slack: {
    icon: Hash,
    name: 'Slack',
    shortName: 'Slack',
    color: 'bg-[#4A154B]',
    hoverBorder: 'hover:border-[#4A154B]/30',
    description: 'Channels & team updates',
    audience: 'Internal team & workspace',
    available: true,
    customConnect: true, // uses bot token
  },
  twitch: {
    icon: Twitch,
    name: 'Twitch',
    shortName: 'Twitch',
    color: 'bg-[#9146FF]',
    hoverBorder: 'hover:border-[#9146FF]/30',
    description: 'Chat messages to channel',
    audience: 'Livestream viewers',
    available: true,
    customConnect: true,
  },
};

/* ─── Component ────────────────────────────────────────────── */

export function PlatformConnections({ workspaceId }: PlatformConnectionsProps) {
  const connectablePlatforms = useMemo(
    () =>
      SUPPORTED_PLATFORMS.filter(
        (p) => PLATFORM_CONFIG[p]?.available
      ) as Platform[],
    []
  );

  const initialConnections = useMemo(() => {
    const conn: Record<Platform, PlatformConnection> = {} as Record<
      Platform,
      PlatformConnection
    >;
    connectablePlatforms.forEach((p) => {
      conn[p] = { platform: p, status: 'not_connected' };
    });
    return conn;
  }, [connectablePlatforms]);

  const [connections, setConnections] =
    useState<Record<Platform, PlatformConnection>>(initialConnections);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [disconnecting, setDisconnecting] = useState<Platform | null>(null);
  const [blueskyDialogOpen, setBlueskyDialogOpen] = useState(false);
  const [mastodonDialogOpen, setMastodonDialogOpen] = useState(false);
  const [slackDialogOpen, setSlackDialogOpen] = useState(false);
  const [twitchDialogOpen, setTwitchDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const res = await fetch(`/api/platform/connections?_t=${Date.now()}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.connections) {
          setConnections((prev) => ({ ...prev, ...data.connections }));
        }
        // Cache the userId returned from the API so we can pass it during connect
        if (data.userId) setUserId(data.userId);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = useCallback((platform: Platform) => {
    const cfg = PLATFORM_CONFIG[platform];
    if (platform === 'bluesky') {
      setBlueskyDialogOpen(true);
      return;
    }
    if (platform === 'mastodon') {
      setMastodonDialogOpen(true);
      return;
    }
    if (platform === 'slack') {
      setSlackDialogOpen(true);
      return;
    }
    if (platform === 'twitch') {
      setTwitchDialogOpen(true);
      return;
    }
    // Show spinner immediately — gives instant visual feedback before the redirect
    setConnecting(platform);
    const params = new URLSearchParams({ platform, workspaceId });
    if (userId) params.set('userId', userId);
    // Use window.location for the OAuth redirect (router.push doesn't handle external URLs)
    window.location.href = `/api/auth/platform/connect?${params.toString()}`;
  }, [workspaceId, userId]);

  const handleDisconnect = async (platform: Platform) => {
    const cfg = PLATFORM_CONFIG[platform];
    if (!confirm(`Disconnect ${cfg.name}? You can reconnect anytime.`)) return;

    setDisconnecting(platform);
    try {
      const res = await fetch(`/api/platform/connections/${platform}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setConnections((prev) => ({
          ...prev,
          [platform]: { platform, status: 'not_connected' },
        }));
        toast.success(`${cfg.name} disconnected`);
      } else {
        toast.error('Failed to disconnect');
      }
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setDisconnecting(null);
    }
  };

  const connectedCount = connectablePlatforms.filter(
    (p) => connections[p]?.status === 'connected'
  ).length;

  const comingSoonPlatforms = SUPPORTED_PLATFORMS.filter(
    (p) => !connectablePlatforms.includes(p)
  );

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Globe2 className="h-4 w-4 text-primary" />
            </div>
            Publishing Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {connectablePlatforms.map((p) => (
              <div
                key={p}
                className="h-[120px] rounded-xl border border-border/40 bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <BlueskyConnectDialog
        open={blueskyDialogOpen}
        onClose={() => setBlueskyDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          setConnections((prev) => ({
            ...prev,
            bluesky: { platform: 'bluesky', status: 'connected', username },
          }));
          // Reload the dashboard page so the Broadcast Network block updates too
          window.location.reload();
        }}
      />
      <MastodonConnectDialog
        open={mastodonDialogOpen}
        onClose={() => setMastodonDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          setConnections((prev) => ({
            ...prev,
            mastodon: { platform: 'mastodon', status: 'connected', username },
          }));
          // Reload the dashboard page so the Broadcast Network block updates too
          window.location.reload();
        }}
      />
      <SlackConnectDialog
        open={slackDialogOpen}
        onClose={() => setSlackDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          setConnections((prev) => ({
            ...prev,
            slack: { platform: 'slack', status: 'connected', username },
          }));
          window.location.reload();
        }}
      />
      <TwitchConnectDialog
        open={twitchDialogOpen}
        onClose={() => setTwitchDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          setConnections((prev) => ({
            ...prev,
            twitch: { platform: 'twitch', status: 'connected', username },
          }));
          window.location.reload();
        }}
      />

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Globe2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Publishing Network</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connect platforms to publish everywhere at once
                </p>
              </div>
            </div>
            {connectedCount > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Wifi className="h-3 w-3" />
                {connectedCount} connected
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Connected + available platforms */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {connectablePlatforms.map((platform) => {
              const cfg = PLATFORM_CONFIG[platform];
              const connection = connections[platform];
              const Icon = cfg.icon;
              const isConnected = connection.status === 'connected';
              const isExpired = connection.status === 'expired';
              const isError = connection.status === 'error';
              const hasIssue = isExpired || isError;

              return (
                <div
                  key={platform}
                  className={cn(
                    'relative rounded-xl border p-4 transition-all duration-200',
                    cfg.hoverBorder,
                    isConnected
                      ? 'border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : hasIssue
                        ? 'border-amber-200/80 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/20'
                        : 'border-border/50 bg-card hover:bg-accent/30'
                  )}
                >
                  {/* Platform header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg text-white flex-shrink-0',
                        cfg.color
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4',
                          platform === 'x' && 'dark:text-neutral-900',
                          platform === 'threads' && 'dark:text-neutral-900'
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {cfg.name}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {cfg.description}
                      </p>
                    </div>
                  </div>

                  {/* Status + username */}
                  <div className="mb-3">
                    {isConnected ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 truncate">
                          {connection.username
                            ? `@${connection.username}`
                            : 'Connected'}
                        </span>
                      </div>
                    ) : hasIssue ? (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                          {isExpired ? 'Token expired — reconnect' : 'Connection error'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <WifiOff className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          Not connected
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  {isConnected || isExpired ? (
                    <div className="flex gap-2">
                      {isExpired && (
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleConnect(platform)}
                          disabled={connecting === platform}
                        >
                          {connecting === platform ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Reconnect
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-8 text-xs text-muted-foreground',
                          !isExpired && 'flex-1'
                        )}
                        onClick={() => handleDisconnect(platform)}
                        disabled={disconnecting === platform}
                      >
                        {disconnecting === platform ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Unlink2 className="mr-1 h-3 w-3" />
                            Disconnect
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs gap-1.5"
                      onClick={() => handleConnect(platform)}
                      disabled={connecting === platform}
                    >
                      {connecting === platform ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Connecting…
                        </>
                      ) : (
                        <>
                          Connect
                          <ArrowRight className="h-3 w-3" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Coming soon */}
          {comingSoonPlatforms.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Coming Soon
              </p>
              <div className="flex flex-wrap gap-2">
                {comingSoonPlatforms.map((platform) => {
                  const cfg = PLATFORM_CONFIG[platform];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={platform}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/50 bg-muted/20 text-muted-foreground"
                    >
                      <div className={cn('p-1 rounded', cfg.color, 'opacity-50')}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs">{cfg.shortName}</span>
                      <Lock className="h-3 w-3 opacity-40" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
