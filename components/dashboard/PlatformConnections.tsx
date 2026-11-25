'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Phone, AlertCircle, Unlink2, Link2, Lock, Globe2,
  ArrowRight, Wifi, WifiOff, RefreshCw, ExternalLink, Radio, Plus, X,
  Search, Users, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlatformBrandLogo, PlatformSVGs } from '@/components/dashboard/PlatformLogos';
import { BlueskyConnectDialog } from './BlueskyConnectDialog';
import { MastodonConnectDialog } from './MastodonConnectDialog';
import { SlackConnectDialog } from './SlackConnectDialog';
import { TwitchConnectDialog } from './TwitchConnectDialog';
import { TelegramConnectDialog } from './TelegramConnectDialog';
import { SkoolConnectDialog } from './SkoolConnectDialog';
import { WhopConnectDialog } from './WhopConnectDialog';
import { KickStreamSetupDialog } from './KickStreamSetupDialog';
import { WarpcastConnectDialog } from './WarpcastConnectDialog';
import { MeweConnectDialog } from './MeweConnectDialog';
import { NostrConnectDialog } from './NostrConnectDialog';
import { MediumConnectDialog } from './MediumConnectDialog';
import { LemmyConnectDialog } from './LemmyConnectDialog';
import { ListmonkConnectDialog } from './ListmonkConnectDialog';
import { HashnodeConnectDialog } from './HashnodeConnectDialog';
import { DevtoConnectDialog } from './DevtoConnectDialog';
import { ManualIntegrationDialog } from './ManualIntegrationDialog';

export const SUPPORTED_PLATFORMS = ['linkedin', 'x', 'threads', 'manual', 'facebook', 'instagram', 'youtube', 'pinterest', 'bluesky', 'reddit', 'mastodon', 'slack', 'twitch', 'telegram', 'discord', 'dribbble', 'skool', 'whop', 'kick', 'warpcast', 'mewe', 'nostr', 'medium', 'lemmy', 'listmonk', 'hashnode', 'devto'] as const;
export type Platform = typeof SUPPORTED_PLATFORMS[number];

export interface ConnectedAccountItem {
  id: string;
  platform: Platform;
  platformUserId?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  status: 'connected' | 'expired' | 'not_connected' | 'error';
  connectedAt?: string;
  expiresAt?: string;
  streamConfigured?: boolean;
  needsReconnect?: boolean;
}

interface PlatformConnection {
  platform: Platform;
  status: 'connected' | 'expired' | 'not_connected' | 'error';
  username?: string;
  displayName?: string;
  connectedAt?: string;
  expiresAt?: string;
  streamConfigured?: boolean;
  accounts?: ConnectedAccountItem[];
}

interface PlatformConnectionsProps {
  workspaceId: string;
  userId?: string;
  initialConnectionsProp?: Record<string, { status: string; username?: string; accounts?: ConnectedAccountItem[] }>;
  onConnectionChange?: (connections: Record<string, { status: string; username?: string; accounts?: ConnectedAccountItem[] }>) => void;
  readOnly?: boolean;
  initialConnectPlatform?: string | null;
  onInitialConnectHandled?: () => void;
  refreshNonce?: number;
}

/* ─── Platform display config ──────────────────────────────── */

export const PLATFORM_CONFIG: Record<
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
    icon: PlatformSVGs.linkedin,
    name: 'LinkedIn',
    shortName: 'LinkedIn',
    color: 'bg-[#0A66C2]',
    hoverBorder: 'hover:border-[#0A66C2]/30',
    description: 'Professional articles & posts',
    audience: 'Professionals & decision-makers',
    available: true,
  },
  x: {
    icon: PlatformSVGs.x,
    name: 'X (Twitter)',
    shortName: 'X',
    color: 'bg-neutral-900 dark:bg-neutral-100',
    hoverBorder: 'hover:border-neutral-400/40',
    description: 'Posts, threads & media',
    audience: 'Global public audience',
    available: true,
  },
  threads: {
    icon: PlatformSVGs.threads,
    name: 'Threads',
    shortName: 'Threads',
    color: 'bg-neutral-900 dark:bg-neutral-100',
    hoverBorder: 'hover:border-neutral-400/40',
    description: 'Text-based conversations',
    audience: 'Instagram community',
    available: true,
  },
  facebook: {
    icon: PlatformSVGs.facebook,
    name: 'Facebook Pages',
    shortName: 'Facebook',
    color: 'bg-[#1877F2]',
    hoverBorder: 'hover:border-[#1877F2]/30',
    description: 'Page posts with rich media',
    audience: 'Wide demographic reach',
    available: true,
  },

  instagram: {
    icon: PlatformSVGs.instagram,
    name: 'Instagram',
    shortName: 'Instagram',
    color: 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]',
    hoverBorder: 'hover:border-pink-400/30',
    description: 'Feed, Reels & Stories',
    audience: 'Visual-first audience',
    available: true,
  },
  manual: {
    icon: PlatformSVGs.manual,
    name: 'Manual / Other',
    shortName: 'Other',
    color: 'bg-neutral-500',
    hoverBorder: 'hover:border-neutral-400/30',
    description: 'Copy-paste to any platform',
    audience: 'Any platform',
    available: true,
  },
  youtube: {
    icon: PlatformSVGs.youtube,
    name: 'YouTube',
    shortName: 'YouTube',
    color: 'bg-[#FF0000]',
    hoverBorder: 'hover:border-red-400/30',
    description: 'Video content & Shorts',
    audience: 'Video consumers',
    available: true,
  },
  pinterest: {
    icon: PlatformSVGs.pinterest,
    name: 'Pinterest',
    shortName: 'Pinterest',
    color: 'bg-[#E60023]',
    hoverBorder: 'hover:border-[#E60023]/30',
    description: 'Visual discovery & ideas',
    audience: 'Shoppers & visual planners',
    available: true,
  },
  bluesky: {
    icon: PlatformSVGs.bluesky,
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
    icon: PlatformSVGs.reddit,
    name: 'Reddit',
    shortName: 'Reddit',
    color: 'bg-[#FF4500]',
    hoverBorder: 'hover:border-[#FF4500]/30',
    description: 'Communities & discussions',
    audience: 'Subreddits & members',
    available: true,
  },
  mastodon: {
    icon: PlatformSVGs.mastodon,
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
    icon: PlatformSVGs.slack,
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
    icon: PlatformSVGs.twitch,
    name: 'Twitch',
    shortName: 'Twitch',
    color: 'bg-[#9146FF]',
    hoverBorder: 'hover:border-[#9146FF]/30',
    description: 'Chat messages to channel',
    audience: 'Livestream viewers',
    available: true,
    customConnect: true,
  },
  telegram: {
    icon: PlatformSVGs.telegram,
    name: 'Telegram',
    shortName: 'Telegram',
    color: 'bg-[#229ED9]',
    hoverBorder: 'hover:border-[#229ED9]/30',
    description: 'Broadcast to channels',
    audience: 'Subscribers & groups',
    available: true,
    customConnect: true,
  },
  discord: {
    icon: PlatformSVGs.discord,
    name: 'Discord',
    shortName: 'Discord',
    color: 'bg-[#5865F2]',
    hoverBorder: 'hover:border-[#5865F2]/30',
    description: 'Server channels & messages',
    audience: 'Communities & gamers',
    available: true,
  },
  dribbble: {
    icon: PlatformSVGs.dribbble,
    name: 'Dribbble',
    shortName: 'Dribbble',
    color: 'bg-[#EA4C89]',
    hoverBorder: 'hover:border-[#EA4C89]/30',
    description: 'Design portfolios & projects',
    audience: 'Designers & creatives',
    available: true,
  },
  skool: {
    icon: PlatformSVGs.skool,
    name: 'Skool',
    shortName: 'Skool',
    color: 'bg-[#E2AD44]',
    hoverBorder: 'hover:border-[#E2AD44]/30',
    description: 'Communities & courses',
    audience: 'Students & community members',
    available: true,
    customConnect: true,
  },
  whop: {
    icon: PlatformSVGs.whop,
    name: 'Whop',
    shortName: 'Whop',
    color: 'bg-[#FF5A00]',
    hoverBorder: 'hover:border-[#FF5A00]/30',
    description: 'Communities & digital products',
    audience: 'Creators & buyers',
    available: true,
  },
  kick: {
    icon: PlatformSVGs.kick,
    name: 'Kick',
    shortName: 'Kick',
    color: 'bg-[#53FC18]',
    hoverBorder: 'hover:border-[#53FC18]/30',
    description: 'Streams & communities',
    audience: 'Gamers & viewers',
    available: true,
  },

  warpcast: {
    icon: PlatformSVGs.warpcast,
    name: 'Farcaster',
    shortName: 'Farcaster',
    color: 'bg-[#8A63D2]',
    hoverBorder: 'hover:border-[#8A63D2]/30',
    description: 'Decentralized social protocol',
    audience: 'Farcaster network',
    available: true,
    customConnect: true,
  },
  mewe: {
    icon: PlatformSVGs.mewe,
    name: 'MeWe',
    shortName: 'MeWe',
    color: 'bg-[#2F435E]',
    hoverBorder: 'hover:border-[#2F435E]/30',
    description: 'Privacy-first social network',
    audience: 'Privacy-aware communities',
    available: true,
    customConnect: true,
  },
  nostr: {
    icon: PlatformSVGs.nostr,
    name: 'Nostr',
    shortName: 'Nostr',
    color: 'bg-[#9B51E0]',
    hoverBorder: 'hover:border-[#9B51E0]/30',
    description: 'Decentralized social protocol',
    audience: 'Open & uncensored network',
    available: true,
    customConnect: true,
  },
  medium: {
    icon: PlatformSVGs.medium,
    name: 'Medium',
    shortName: 'Medium',
    color: 'bg-black',
    hoverBorder: 'hover:border-neutral-800/30',
    description: 'Stories and articles',
    audience: 'Readers & writers',
    available: true,
    customConnect: true,
  },
  lemmy: {
    icon: PlatformSVGs.lemmy,
    name: 'Lemmy',
    shortName: 'Lemmy',
    color: 'bg-[#00BC8C]',
    hoverBorder: 'hover:border-[#00BC8C]/30',
    description: 'Federated link aggregator & forum',
    audience: 'Fediverse & Lemmy communities',
    available: true,
    customConnect: true,
  },
  listmonk: {
    icon: PlatformSVGs.listmonk,
    name: 'Listmonk',
    shortName: 'Listmonk',
    color: 'bg-[#0045ff]',
    hoverBorder: 'hover:border-[#0045ff]/30',
    description: 'Self-hosted newsletter & mailing lists',
    audience: 'Newsletter subscribers',
    available: true,
    customConnect: true,
  },
  hashnode: {
    icon: PlatformSVGs.hashnode,
    name: 'Hashnode',
    shortName: 'Hashnode',
    color: 'bg-[#2962FF]',
    hoverBorder: 'hover:border-[#2962FF]/30',
    description: 'Developer blogs & technical articles',
    audience: 'Software engineers & developers',
    available: true,
    customConnect: true,
  },
  devto: {
    icon: PlatformSVGs.devto,
    name: 'DEV Community',
    shortName: 'DEV.to',
    color: 'bg-neutral-900 dark:bg-neutral-100',
    hoverBorder: 'hover:border-neutral-700/30',
    description: 'Developer community articles & tutorials',
    audience: 'Software engineers & tech creators',
    available: true,
    customConnect: true,
  },
};

type PlatformCategory = 'social' | 'developer' | 'communities';
type PlatformFilterTab = 'all' | 'connected' | 'attention' | PlatformCategory;

const PLATFORM_CATEGORY_MAP: Record<Platform, PlatformCategory> = {
  linkedin: 'social',
  x: 'social',
  threads: 'social',
  facebook: 'social',
  instagram: 'social',
  youtube: 'social',
  pinterest: 'social',
  bluesky: 'social',
  mastodon: 'social',
  warpcast: 'social',
  mewe: 'social',
  nostr: 'social',
  dribbble: 'social',
  medium: 'developer',
  hashnode: 'developer',
  devto: 'developer',
  listmonk: 'developer',
  manual: 'developer',
  reddit: 'communities',
  slack: 'communities',
  twitch: 'communities',
  telegram: 'communities',
  discord: 'communities',
  skool: 'communities',
  whop: 'communities',
  kick: 'communities',
  lemmy: 'communities',
};

/* ─── In-memory cache for instant 0ms modal opening ────────────────── */
const memoryConnectionsCache = new Map<string, Record<Platform, PlatformConnection>>();

/* ─── Component ────────────────────────────────────────────── */

export function PlatformConnections({
  workspaceId,
  userId: initialUserId,
  initialConnectionsProp,
  onConnectionChange,
  readOnly = false,
  initialConnectPlatform,
  onInitialConnectHandled,
  refreshNonce,
}: PlatformConnectionsProps) {
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
    const cached = memoryConnectionsCache.get(workspaceId);

    connectablePlatforms.forEach((p) => {
      const propStatus = (initialConnectionsProp as any)?.[p]?.status;
      const propUsername = (initialConnectionsProp as any)?.[p]?.username;
      const cachedStatus = cached?.[p]?.status;
      const cachedUsername = cached?.[p]?.username;

      conn[p] = {
        platform: p,
        status: (propStatus as any) || (cachedStatus as any) || 'not_connected',
        username: propUsername || cachedUsername,
      };
    });
    return conn;
  }, [connectablePlatforms, workspaceId, initialConnectionsProp]);

  const [connections, setConnections] =
    useState<Record<Platform, PlatformConnection>>(initialConnections);
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;
  const onConnectionChangeRef = useRef(onConnectionChange);
  onConnectionChangeRef.current = onConnectionChange;

  // Sync state when initialConnectionsProp updates from parent
  useEffect(() => {
    if (initialConnectionsProp && Object.keys(initialConnectionsProp).length > 0) {
      setConnections((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [p, val] of Object.entries(initialConnectionsProp)) {
          const platformKey = p as Platform;
          if (next[platformKey]) {
            if (next[platformKey].status !== val.status || next[platformKey].username !== val.username) {
              next[platformKey] = {
                ...next[platformKey],
                status: (val.status as any) || 'not_connected',
                username: val.username,
              };
              changed = true;
            }
          }
        }
        if (changed) {
          memoryConnectionsCache.set(workspaceId, next);
          return next;
        }
        return prev;
      });
    }
  }, [initialConnectionsProp, workspaceId]);


  // Sort platforms: connected first, then needs-attention (expired/error), then not-connected (manual at end)
  const sortedPlatforms = useMemo(() => {
    const rank = (p: Platform) => {
      const st = connections[p]?.status?.toLowerCase();
      if (st === 'connected') return 0;
      if (st === 'expired' || st === 'error') return 1;
      if (p === 'manual') return 3;
      return 2;
    };

    return [...connectablePlatforms].sort((a, b) => rank(a) - rank(b));
  }, [connectablePlatforms, connections]);

  const router = useRouter();
  const [loading, setLoading] = useState(() => {
    const hasCached = memoryConnectionsCache.has(workspaceId);
    const hasProps = Boolean(initialConnectionsProp && Object.keys(initialConnectionsProp).length > 0);
    return !hasCached && !hasProps;
  });
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [configuredPlatforms, setConfiguredPlatforms] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PlatformFilterTab>('all');
  const [manageAccountsTarget, setManageAccountsTarget] = useState<Platform | null>(null);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [blueskyDialogOpen, setBlueskyDialogOpen] = useState(false);
  const [mastodonDialogOpen, setMastodonDialogOpen] = useState(false);
  const [slackDialogOpen, setSlackDialogOpen] = useState(false);
  const [twitchDialogOpen, setTwitchDialogOpen] = useState(false);
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
  const [skoolDialogOpen, setSkoolDialogOpen] = useState(false);
  const [kickStreamDialogOpen, setKickStreamDialogOpen] = useState(false);
  const [selectedKickConnectionId, setSelectedKickConnectionId] = useState<string | undefined>(undefined);
  const [dependencyCounts, setDependencyCounts] = useState<Record<string, { scheduledPosts: number }>>({});
  const [disconnectTarget, setDisconnectTarget] = useState<{
    platform: Platform;
    connectionId?: string;
    accountLabel?: string;
    scheduledPosts: number;
  } | null>(null);
  const [addAccountTarget, setAddAccountTarget] = useState<Platform | null>(null);
  const [warpcastDialogOpen, setWarpcastDialogOpen] = useState(false);
  const [meweDialogOpen, setMeweDialogOpen] = useState(false);
  const [nostrDialogOpen, setNostrDialogOpen] = useState(false);
  const [mediumDialogOpen, setMediumDialogOpen] = useState(false);
  const [lemmyDialogOpen, setLemmyDialogOpen] = useState(false);
  const [listmonkDialogOpen, setListmonkDialogOpen] = useState(false);
  const [hashnodeDialogOpen, setHashnodeDialogOpen] = useState(false);
  const [devtoDialogOpen, setDevtoDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(initialUserId || null);

  useEffect(() => {
    if (initialUserId) {
      setUserId(initialUserId);
    }
  }, [initialUserId]);

  const loadConnections = useCallback(async (opts?: { fresh?: boolean }) => {
    try {
      const res = await fetch(
        `/api/platform/connections?${opts?.fresh ? 'fresh=1&' : ''}_t=${Date.now()}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data: any = await res.json();
        if (data.configuredPlatforms && typeof data.configuredPlatforms === 'object') {
          setConfiguredPlatforms(data.configuredPlatforms as Record<string, boolean>);
        }
        if (data.connections) {
          const prev = connectionsRef.current;
          let changed = false;
          const next = { ...prev };
          for (const [p, val] of Object.entries(data.connections)) {
            const platformKey = p as Platform;
            if (next[platformKey]) {
              const typedVal = val as {
                status?: string;
                username?: string;
                displayName?: string;
                connectedAt?: string;
                expiresAt?: string;
                streamConfigured?: boolean;
                accounts?: ConnectedAccountItem[];
              };
              const newStatus = (typedVal.status as PlatformConnection['status']) || 'not_connected';
              const newUsername = typedVal.username;
              const newAccounts = Array.isArray(typedVal.accounts) ? typedVal.accounts : [];
              const prevAccounts = next[platformKey].accounts || [];
              const accountsChanged =
                prevAccounts.length !== newAccounts.length ||
                prevAccounts.some(
                  (a, i) =>
                    a.id !== newAccounts[i]?.id ||
                    a.status !== newAccounts[i]?.status ||
                    a.username !== newAccounts[i]?.username ||
                    a.displayName !== newAccounts[i]?.displayName ||
                    a.needsReconnect !== newAccounts[i]?.needsReconnect
                );

              if (
                next[platformKey].status !== newStatus ||
                next[platformKey].username !== newUsername ||
                next[platformKey].displayName !== typedVal.displayName ||
                next[platformKey].streamConfigured !== typedVal.streamConfigured ||
                accountsChanged
              ) {
                next[platformKey] = {
                  ...next[platformKey],
                  status: newStatus,
                  username: newUsername,
                  displayName: typedVal.displayName,
                  connectedAt: typedVal.connectedAt,
                  expiresAt: typedVal.expiresAt,
                  streamConfigured: typedVal.streamConfigured,
                  accounts: newAccounts,
                };
                changed = true;
              }
            }
          }
          if (changed) {
            memoryConnectionsCache.set(workspaceId, next);
            setConnections(next);
            onConnectionChangeRef.current?.(next);
          }
        }
        // Cache dependency counts and userId returned from the API
        if (data.dependencyCounts && typeof data.dependencyCounts === 'object') {
          setDependencyCounts(data.dependencyCounts as Record<string, { scheduledPosts: number }>);
        }
        if (data.userId) setUserId(data.userId);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    if (refreshNonce && refreshNonce > 0) {
      loadConnections({ fresh: true });
    }
  }, [refreshNonce, loadConnections]);

  const handleCustomDialogSuccess = useCallback(
    async (platform: Platform, username?: string) => {
      const cfg = PLATFORM_CONFIG[platform];
      setConnections((prev) => {
        const next = {
          ...prev,
          [platform]: {
            ...prev[platform],
            platform,
            status: 'connected' as const,
            username: username || prev[platform]?.username,
          },
        };
        memoryConnectionsCache.set(workspaceId, next);
        return next;
      });
      await loadConnections({ fresh: true });
      router.refresh();
      toast.success(
        username
          ? `${cfg.name} (@${username.replace(/^@/, '')}) connected`
          : `${cfg.name} connected`
      );
    },
    [workspaceId, loadConnections, router]
  );

  const handleConnect = useCallback((platform: Platform, options?: { addAccount?: boolean; reconnectConnectionId?: string }) => {
    const cfg = PLATFORM_CONFIG[platform];
    if (readOnly) {
      toast.error('View-only members cannot modify workspace channels.');
      return;
    }
    if (platform === 'manual') {
      setManualDialogOpen(true);
      return;
    }
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
    if (platform === 'telegram') {
      setTelegramDialogOpen(true);
      return;
    }
    if (platform === 'skool') {
      setSkoolDialogOpen(true);
      return;
    }
    if (platform === 'warpcast') {
      setWarpcastDialogOpen(true);
      return;
    }
    if (platform === 'mewe') {
      setMeweDialogOpen(true);
      return;
    }
    if (platform === 'nostr') {
      setNostrDialogOpen(true);
      return;
    }
    if (platform === 'medium') {
      setMediumDialogOpen(true);
      return;
    }
    if (platform === 'lemmy') {
      setLemmyDialogOpen(true);
      return;
    }
    if (platform === 'listmonk') {
      setListmonkDialogOpen(true);
      return;
    }
    if (platform === 'hashnode') {
      setHashnodeDialogOpen(true);
      return;
    }
    if (platform === 'devto') {
      setDevtoDialogOpen(true);
      return;
    }
    if (!cfg?.customConnect && configuredPlatforms[platform] === false) {
      toast.error(`${cfg?.name || platform} OAuth is not configured on this environment yet.`);
      return;
    }
    // Show spinner immediately — gives instant visual feedback before the redirect
    setConnecting(platform);
    const effectiveUserId = userId || initialUserId;
    const params = new URLSearchParams({ platform, workspaceId });
    if (effectiveUserId) params.set('userId', effectiveUserId);
    if (options?.addAccount) params.set('addAccount', 'true');
    if (options?.reconnectConnectionId) params.set('reconnectConnectionId', options.reconnectConnectionId);
    if (typeof window !== 'undefined') {
      const currentReturnUrl = `${window.location.pathname || '/dashboard'}${window.location.search || ''}`;
      params.set('returnUrl', currentReturnUrl);
    }
    // Use window.location for the OAuth redirect (router.push doesn't handle external URLs)
    window.location.href = `/api/auth/platform/connect?${params.toString()}`;
  }, [workspaceId, userId, initialUserId, readOnly, configuredPlatforms]);

  useEffect(() => {
    if (!initialConnectPlatform || readOnly) return;
    const normalized = initialConnectPlatform.trim().toLowerCase() as Platform;
    if (
      SUPPORTED_PLATFORMS.includes(normalized) &&
      PLATFORM_CONFIG[normalized]?.available
    ) {
      handleConnect(normalized);
    }
    onInitialConnectHandled?.();
  }, [initialConnectPlatform, readOnly, handleConnect, onInitialConnectHandled]);

  const handleDisconnect = (platform: Platform, connectionId?: string, accountLabel?: string) => {
    if (readOnly) {
      toast.error('View-only members cannot modify workspace channels.');
      return;
    }
    const scheduledPosts = dependencyCounts[platform]?.scheduledPosts || 0;
    setDisconnectTarget({
      platform,
      connectionId,
      accountLabel,
      scheduledPosts,
    });
  };

  const confirmDisconnect = async () => {
    if (!disconnectTarget) return;
    const { platform, connectionId, accountLabel } = disconnectTarget;
    const cfg = PLATFORM_CONFIG[platform];
    const targetLabel = accountLabel ? `@${accountLabel} on ${cfg.name}` : cfg.name;
    const busyKey = connectionId || platform;
    setDisconnecting(busyKey);
    try {
      const url = connectionId
        ? `/api/platform/connections/${platform}?connectionId=${encodeURIComponent(connectionId)}`
        : `/api/platform/connections/${platform}`;
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setDisconnectTarget(null);
        await loadConnections({ fresh: true });
        const afterConn = connectionsRef.current[platform];
        if (
          manageAccountsTarget === platform &&
          (!afterConn || (afterConn.status !== 'connected' && afterConn.status !== 'expired' && afterConn.status !== 'error'))
        ) {
          setManageAccountsTarget(null);
        }
        toast.success(`${targetLabel} disconnected`);
      } else {
        const errBody = await res.json().catch(() => null);
        toast.error(errBody?.error || 'Failed to disconnect');
      }
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setDisconnecting(null);
    }
  };

  const visiblePlatforms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedPlatforms.filter((p) => {
      const conn = connections[p];
      const st = conn?.status?.toLowerCase();
      if (categoryFilter === 'connected' && st !== 'connected') return false;
      if (categoryFilter === 'attention' && st !== 'expired' && st !== 'error') return false;
      if (
        (categoryFilter === 'social' || categoryFilter === 'developer' || categoryFilter === 'communities') &&
        PLATFORM_CATEGORY_MAP[p] !== categoryFilter
      ) {
        return false;
      }
      if (!q) return true;
      const cfg = PLATFORM_CONFIG[p];
      if (
        p.includes(q) ||
        cfg.name.toLowerCase().includes(q) ||
        cfg.shortName.toLowerCase().includes(q) ||
        cfg.description.toLowerCase().includes(q) ||
        (conn?.username && conn.username.toLowerCase().includes(q)) ||
        (conn?.displayName && conn.displayName.toLowerCase().includes(q))
      ) {
        return true;
      }
      return Array.isArray(conn?.accounts)
        ? conn.accounts.some(
            (a) =>
              (a.username && a.username.toLowerCase().includes(q)) ||
              (a.displayName && a.displayName.toLowerCase().includes(q))
          )
        : false;
    });
  }, [sortedPlatforms, connections, categoryFilter, searchQuery]);

  const attentionCount = connectablePlatforms.filter(
    (p) => connections[p]?.status === 'expired' || connections[p]?.status === 'error'
  ).length;

  const connectedCount = connectablePlatforms.filter(
    (p) => connections[p]?.status === 'connected'
  ).length;

  const totalConnectedAccountsCount = connectablePlatforms.reduce((sum, p) => {
    const conn = connections[p];
    if (!conn) return sum;
    if (Array.isArray(conn.accounts) && conn.accounts.length > 0) {
      return sum + conn.accounts.filter((a) => a.status === 'connected').length;
    }
    return sum + (conn.status === 'connected' ? 1 : 0);
  }, 0);

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
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
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
          void handleCustomDialogSuccess('bluesky', username);
        }}
      />
      <MastodonConnectDialog
        open={mastodonDialogOpen}
        onClose={() => setMastodonDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('mastodon', username);
        }}
      />
      <SlackConnectDialog
        open={slackDialogOpen}
        onClose={() => setSlackDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('slack', username);
        }}
      />
      <TwitchConnectDialog
        open={twitchDialogOpen}
        onClose={() => setTwitchDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('twitch', username);
        }}
      />
      <TelegramConnectDialog
        open={telegramDialogOpen}
        onClose={() => setTelegramDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('telegram', username);
        }}
      />
      <SkoolConnectDialog
        open={skoolDialogOpen}
        onClose={() => setSkoolDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('skool', username);
        }}
      />
      <KickStreamSetupDialog
        open={kickStreamDialogOpen}
        onClose={() => {
          setKickStreamDialogOpen(false);
          setSelectedKickConnectionId(undefined);
        }}
        workspaceId={workspaceId}
        connectionId={selectedKickConnectionId}
        onSuccess={() => {
          void loadConnections({ fresh: true });
          router.refresh();
        }}
      />
      <Dialog open={Boolean(addAccountTarget)} onOpenChange={(o) => !o && setAddAccountTarget(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1F1A16] border-[#E4D9C8] dark:border-[#382F27]">
          <DialogHeader>
            <DialogTitle className="text-[#3D2B1F] dark:text-[#F5EFE6]">
              Add another {addAccountTarget ? PLATFORM_CONFIG[addAccountTarget].name : ''} account
            </DialogTitle>
            <DialogDescription className="text-[#6E5A48] dark:text-[#B8A896]">
              You can connect multiple accounts per channel and publish to any of them.
            </DialogDescription>
          </DialogHeader>
          {addAccountTarget && (
            <div className="space-y-3 text-sm text-[#5C4A3A] dark:text-[#CBBBA7]">
              {(connections[addAccountTarget]?.accounts?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-[#E4D9C8] dark:border-[#382F27] px-3 py-2">
                  <p className="text-xs font-medium mb-1">Already connected</p>
                  <ul className="text-xs space-y-0.5">
                    {connections[addAccountTarget]!.accounts!.map((a) => (
                      <li key={a.id} className="truncate">
                        {a.username ? `@${a.username.replace(/^@/, '')}` : a.displayName || 'Account'}
                        {a.status !== 'connected' ? ' — needs reconnect' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs leading-relaxed">
                {PLATFORM_CONFIG[addAccountTarget].customConnect
                  ? `Enter the credentials, handle, or webhook details for the additional ${PLATFORM_CONFIG[addAccountTarget].name} account you want to connect.`
                  : `${PLATFORM_CONFIG[addAccountTarget].name} signs you in with the account that is currently active in this browser. To add a different account, switch to it on ${PLATFORM_CONFIG[addAccountTarget].name} first (or use a private window), then continue. Connecting the same account again refreshes its tokens.`}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddAccountTarget(null)} className="min-h-[44px] sm:min-h-0">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={readOnly}
              onClick={() => {
                const p = addAccountTarget;
                setAddAccountTarget(null);
                if (p) handleConnect(p, { addAccount: true });
              }}
              className="min-h-[44px] sm:min-h-0"
            >
              Continue to {addAccountTarget ? PLATFORM_CONFIG[addAccountTarget].name : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(manageAccountsTarget)} onOpenChange={(o) => !o && setManageAccountsTarget(null)}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-[#1F1A16] border-[#E4D9C8] dark:border-[#382F27]">
          {manageAccountsTarget && (() => {
            const mCfg = PLATFORM_CONFIG[manageAccountsTarget];
            const mConn = connections[manageAccountsTarget];
            const mHasRealIds = Array.isArray(mConn?.accounts) && mConn.accounts.length > 0;
            const mAccounts: ConnectedAccountItem[] = mHasRealIds
              ? mConn.accounts!
              : mConn && (mConn.status === 'connected' || mConn.status === 'expired' || mConn.status === 'error')
                ? [
                    {
                      id: `${manageAccountsTarget}:default`,
                      platform: manageAccountsTarget,
                      username: mConn.username,
                      displayName: mConn.displayName,
                      status: mConn.status,
                      expiresAt: mConn.expiresAt,
                      streamConfigured: mConn.streamConfigured,
                    },
                  ]
                : [];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-[#3D2B1F] dark:text-[#F5EFE6]">
                    <PlatformBrandLogo platform={manageAccountsTarget} size={22} />
                    <span>Manage {mCfg.name} accounts</span>
                  </DialogTitle>
                  <DialogDescription className="text-[#6E5A48] dark:text-[#B8A896]">
                    Add another account, reconnect expired tokens, or disconnect an account individually.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {mAccounts.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No accounts connected for {mCfg.name}.
                    </p>
                  ) : (
                    mAccounts.map((acct) => {
                      const acctActive = acct.status === 'connected' && !acct.needsReconnect;
                      const label = acct.username
                        ? `@${acct.username.replace(/^@/, '')}`
                        : acct.displayName || mCfg.name;
                      const busyId = mHasRealIds ? acct.id : manageAccountsTarget;
                      return (
                        <div
                          key={acct.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[#E4D9C8] dark:border-[#382F27] px-3 py-2.5 bg-[#FAF7F2] dark:bg-[#28211C]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'h-2 w-2 rounded-full flex-shrink-0',
                                  acctActive ? 'bg-emerald-500' : 'bg-amber-500'
                                )}
                              />
                              <span className="text-sm font-medium truncate text-[#3D2B1F] dark:text-[#F5EFE6]">
                                {label}
                              </span>
                              <Badge
                                variant={acctActive ? 'secondary' : 'outline'}
                                className={cn(
                                  'text-[10px] px-1.5 py-0',
                                  acctActive
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                )}
                              >
                                {acctActive ? 'Active' : 'Needs reconnect'}
                              </Badge>
                            </div>
                            {acct.displayName && acct.username && acct.displayName !== acct.username && (
                              <p className="text-xs text-[#6E5A48] dark:text-[#B8A896] truncate pl-4 mt-0.5">
                                {acct.displayName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {manageAccountsTarget === 'kick' && acctActive && mHasRealIds && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={readOnly}
                                onClick={() => {
                                  setSelectedKickConnectionId(acct.id);
                                  setKickStreamDialogOpen(true);
                                }}
                                className="h-8 text-xs px-2.5"
                              >
                                <Radio className="h-3 w-3 mr-1" />
                                RTMP
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant={acctActive ? 'outline' : 'default'}
                              disabled={readOnly || connecting === manageAccountsTarget}
                              onClick={() => {
                                setManageAccountsTarget(null);
                                handleConnect(manageAccountsTarget, {
                                  reconnectConnectionId: mHasRealIds ? acct.id : undefined,
                                });
                              }}
                              className="h-8 text-xs px-2.5"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Reconnect
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={readOnly || disconnecting === busyId || disconnecting === manageAccountsTarget}
                              onClick={() =>
                                handleDisconnect(
                                  manageAccountsTarget,
                                  mHasRealIds ? acct.id : undefined,
                                  acct.username || acct.displayName
                                )
                              }
                              className="h-8 text-xs px-2.5 text-[#9E2A2B] border-[#9E2A2B]/30 hover:bg-[#9E2A2B] hover:text-white"
                            >
                              {disconnecting === busyId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Unlink2 className="h-3 w-3 mr-1" />
                                  Disconnect
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex justify-between items-center gap-2 pt-2 border-t border-[#E4D9C8] dark:border-[#382F27]">
                  <Button
                    type="button"
                    size="sm"
                    disabled={readOnly}
                    onClick={() => {
                      const p = manageAccountsTarget;
                      setManageAccountsTarget(null);
                      setAddAccountTarget(p);
                    }}
                    className="min-h-[40px] sm:min-h-0"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add another account
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setManageAccountsTarget(null)}>
                    Done
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(disconnectTarget)} onOpenChange={(o) => !o && !disconnecting && setDisconnectTarget(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1F1A16] border-[#E4D9C8] dark:border-[#382F27]">
          <DialogHeader>
            <DialogTitle className="text-[#3D2B1F] dark:text-[#F5EFE6]">
              Disconnect {disconnectTarget ? (disconnectTarget.accountLabel ? `@${disconnectTarget.accountLabel}` : PLATFORM_CONFIG[disconnectTarget.platform].name) : 'channel'}?
            </DialogTitle>
            <DialogDescription className="text-[#6E5A48] dark:text-[#B8A896]">
              You can reconnect this channel anytime via OAuth.
            </DialogDescription>
          </DialogHeader>
          {disconnectTarget && disconnectTarget.scheduledPosts > 0 && (
            <div className="rounded-xl border border-[#C4A265]/40 bg-[#F5EFE2] dark:bg-[#2D2419] px-3.5 py-3 text-xs text-[#5C4315] dark:text-[#EAD7B0]">
              <strong>Warning:</strong> You currently have{' '}
              <span className="font-semibold tabular-nums">{disconnectTarget.scheduledPosts}</span> scheduled or queued post
              {disconnectTarget.scheduledPosts === 1 ? '' : 's'} targeting{' '}
              {PLATFORM_CONFIG[disconnectTarget.platform].name}. Disconnecting now will prevent automatic publishing unless reconnected before schedule time.
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisconnectTarget(null)}
              disabled={Boolean(disconnecting)}
              className="min-h-[44px] sm:min-h-0"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDisconnect}
              disabled={Boolean(disconnecting)}
              className="min-h-[44px] sm:min-h-0 bg-[#9E2A2B] hover:bg-[#7F1D1E] text-white"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect Channel'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <WarpcastConnectDialog
        open={warpcastDialogOpen}
        onClose={() => setWarpcastDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('warpcast', username);
        }}
      />
      <MeweConnectDialog
        open={meweDialogOpen}
        onClose={() => setMeweDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('mewe', username);
        }}
      />
      <NostrConnectDialog
        open={nostrDialogOpen}
        onClose={() => setNostrDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('nostr', username);
        }}
      />
      <MediumConnectDialog
        open={mediumDialogOpen}
        onClose={() => setMediumDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('medium', username);
        }}
      />
      <LemmyConnectDialog
        open={lemmyDialogOpen}
        onClose={() => setLemmyDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('lemmy', username);
        }}
      />
      <ListmonkConnectDialog
        open={listmonkDialogOpen}
        onClose={() => setListmonkDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('listmonk', username);
        }}
      />
      <HashnodeConnectDialog
        open={hashnodeDialogOpen}
        onClose={() => setHashnodeDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('hashnode', username);
        }}
      />
      <DevtoConnectDialog
        open={devtoDialogOpen}
        onClose={() => setDevtoDialogOpen(false)}
        workspaceId={workspaceId}
        onSuccess={(username) => {
          void handleCustomDialogSuccess('devto', username);
        }}
      />
      <ManualIntegrationDialog
        open={manualDialogOpen}
        onClose={() => setManualDialogOpen(false)}
        workspaceId={workspaceId}
      />

      <Card className="border-border/60">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
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
            <div className="flex items-center gap-2">
              {readOnly && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Lock className="h-3 w-3" />
                  View-only
                </Badge>
              )}
              {attentionCount > 0 && (
                <Badge variant="outline" className="text-xs gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-3 w-3" />
                  {attentionCount} needs reconnect
                </Badge>
              )}
              {connectedCount > 0 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Wifi className="h-3 w-3" />
                  {totalConnectedAccountsCount > connectedCount
                    ? `${totalConnectedAccountsCount} accounts · ${connectedCount} platforms`
                    : `${connectedCount} connected`}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[260px]">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels or @handles..."
                aria-label="Search channels or handles"
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'connected', label: `Connected (${connectedCount})` },
                  ...(attentionCount > 0
                    ? [{ id: 'attention', label: `Needs attention (${attentionCount})` }]
                    : []),
                  { id: 'social', label: 'Social' },
                  { id: 'developer', label: 'Developer' },
                  { id: 'communities', label: 'Communities' },
                ] as Array<{ id: PlatformFilterTab; label: string }>
              ).map((tab) => {
                const active = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategoryFilter(tab.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border',
                      active
                        ? 'bg-[#3D2B1F] text-white border-[#3D2B1F] dark:bg-[#C4A265] dark:text-[#16120F] dark:border-[#C4A265]'
                        : 'bg-background hover:bg-muted text-muted-foreground border-border/70'
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {visiblePlatforms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-8 text-center space-y-2">
              <p className="text-sm font-medium text-foreground">No channels match your filter</p>
              <p className="text-xs text-muted-foreground">
                Try clearing your search or switching back to All channels.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {visiblePlatforms.map((platform, idx) => {
              const cfg = PLATFORM_CONFIG[platform];
              const connection = connections[platform];
              const isConnected = connection?.status?.toLowerCase() === 'connected';
              const isExpired = connection?.status === 'expired';
              const isError = connection?.status === 'error';
              const hasIssue = isExpired || isError;
              const isBlue = idx % 2 === 0;
              const serverUnconfigured =
                !cfg.customConnect && platform !== 'manual' && configuredPlatforms[platform] === false;
              const hasRealAccountIds =
                Array.isArray(connection?.accounts) && connection.accounts.length > 0;
              const accountRows: ConnectedAccountItem[] =
                isConnected || hasIssue
                  ? hasRealAccountIds
                    ? connection!.accounts!
                    : [
                        {
                          id: `${platform}:default`,
                          platform,
                          username: connection?.username,
                          displayName: connection?.displayName,
                          status: connection?.status || 'not_connected',
                          streamConfigured: connection?.streamConfigured,
                        },
                      ]
                  : [];
              const primaryAcct = accountRows[0];

              return (
                <div
                  key={platform}
                  className={cn(
                    'relative rounded-2xl p-4 transition-colors duration-150 border flex flex-col justify-between',
                    isConnected
                      ? isBlue
                        ? 'bg-gradient-to-br from-[#1d6bf3] to-[#0a3fb5] text-white border-blue-400/40 shadow-md'
                        : 'bg-gradient-to-br from-[#262626] to-[#0e0e0e] text-white border-white/20 shadow-md'
                      : hasIssue
                        ? 'border-amber-200/80 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/20'
                        : 'border-stone-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 hover:bg-white hover:border-stone-400 shadow-2xs'
                  )}
                >
                  <div>
                    {/* Platform header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-sm border border-black/5">
                        <PlatformBrandLogo platform={platform} size={32} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className={cn(
                            'text-sm font-semibold truncate',
                            isConnected ? 'text-white' : 'text-foreground'
                          )}
                        >
                          {cfg.name}
                        </h4>
                        <p
                          className={cn(
                            'text-xs truncate',
                            isConnected
                              ? isBlue
                                ? 'text-blue-100/85'
                                : 'text-zinc-300/85'
                              : 'text-muted-foreground'
                          )}
                        >
                          {cfg.description}
                        </p>
                      </div>
                    </div>

                    {/* Status + connected accounts list */}
                    <div className="mb-3 space-y-1.5">
                      {isConnected || hasIssue ? (
                        accountRows.map((acct) => {
                          const acctConnected = acct.status === 'connected';
                          const acctExpired = acct.status === 'expired' || acct.status === 'error';
                          const label = acct.needsReconnect
                            ? `${acct.username ? `@${acct.username}` : acct.displayName || cfg.name} · reconnect required`
                            : acct.username
                              ? `@${acct.username}`
                              : acct.displayName || (acctConnected ? 'Connected' : 'Reconnect');
                          const busyId = hasRealAccountIds ? acct.id : platform;
                          return (
                            <div
                              key={acct.id}
                              className={cn(
                                'flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg',
                                isConnected
                                  ? 'bg-white/10 border border-white/15'
                                  : 'bg-amber-100/60 dark:bg-amber-900/30 border border-amber-300/60'
                              )}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {acctConnected ? (
                                  <span className="w-2 h-2 rounded-full bg-[#7dffb0] shadow-[0_0_6px_#7dffb0] flex-shrink-0" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                )}
                                <span
                                  className={cn(
                                    'text-xs font-medium truncate',
                                    isConnected ? 'text-white/95' : 'text-amber-700 dark:text-amber-300'
                                  )}
                                  title={acct.displayName || acct.username || ''}
                                >
                                  {label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {platform === 'kick' && !acctExpired && hasRealAccountIds && (
                                  <button
                                    type="button"
                                    disabled={readOnly}
                                    onClick={() => {
                                      setSelectedKickConnectionId(acct.id);
                                      setKickStreamDialogOpen(true);
                                    }}
                                    title="Configure Kick RTMP stream settings"
                                    className="p-1.5 sm:p-1 rounded hover:bg-white/20 transition-colors text-white/85 hover:text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Radio className="h-3 w-3" />
                                  </button>
                                )}
                                {acctExpired && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleConnect(platform, {
                                        reconnectConnectionId: hasRealAccountIds ? acct.id : undefined,
                                      })
                                    }
                                    disabled={readOnly || connecting === platform}
                                    title="Reconnect this account"
                                    className={cn(
                                      'p-1.5 sm:p-1 rounded hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                                      isConnected ? 'text-white/85 hover:text-white' : 'text-amber-700 hover:text-amber-900'
                                    )}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDisconnect(
                                      platform,
                                      hasRealAccountIds ? acct.id : undefined,
                                      acct.username || acct.displayName
                                    )
                                  }
                                  disabled={readOnly || disconnecting === busyId || disconnecting === platform}
                                  title={`Disconnect ${acct.username || cfg.name}`}
                                  aria-label={`Disconnect ${acct.username || cfg.name}`}
                                  className={cn(
                                    'p-1.5 sm:p-1 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                                    isConnected
                                      ? 'text-white/75 hover:text-white hover:bg-white/20'
                                      : 'text-amber-700/80 hover:text-amber-900 hover:bg-amber-200/60'
                                  )}
                                >
                                  {disconnecting === busyId ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <WifiOff className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {serverUnconfigured ? 'OAuth not configured' : 'Not connected'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  {isConnected || hasIssue ? (
                    <div className="space-y-2 mt-auto">
                      {platform === 'kick' && isConnected && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={readOnly}
                          className={cn(
                            'w-full h-8 text-xs font-medium gap-1.5 border-white/30 bg-white/15 text-white hover:bg-white',
                            isBlue ? 'hover:text-blue-900' : 'hover:text-black'
                          )}
                          onClick={() => {
                            const firstKickId = connection.accounts?.[0]?.id;
                            setSelectedKickConnectionId(
                              firstKickId && firstKickId !== 'kick' ? firstKickId : undefined
                            );
                            setKickStreamDialogOpen(true);
                          }}
                        >
                          <Radio className="w-3.5 h-3.5 text-[#7dffb0]" />
                          {connection.streamConfigured
                            ? 'Live Stream Ready'
                            : 'Complete Setup'}
                        </Button>
                      )}
                      {hasIssue && accountRows.length <= 1 && (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={readOnly || connecting === platform || serverUnconfigured}
                          onClick={() =>
                            handleConnect(platform, {
                              reconnectConnectionId: hasRealAccountIds ? primaryAcct?.id : undefined,
                            })
                          }
                          className="w-full h-8 text-xs font-medium gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Reconnect
                        </Button>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {platform !== 'manual' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                              'flex-1 min-w-[92px] h-8 text-xs font-medium gap-1',
                              isConnected &&
                                (isBlue
                                  ? 'border-white/30 bg-white/15 text-white hover:bg-white hover:text-blue-900'
                                  : 'border-white/30 bg-white/15 text-white hover:bg-white hover:text-black')
                            )}
                            onClick={() => setAddAccountTarget(platform)}
                            disabled={readOnly || connecting === platform || serverUnconfigured}
                            title={`Connect another ${cfg.name} account`}
                          >
                            {connecting === platform ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-3 w-3" />
                                Add
                              </>
                            )}
                          </Button>
                        )}
                        {accountRows.length > 1 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={readOnly}
                            className={cn(
                              'flex-1 min-w-[104px] h-8 text-xs font-medium gap-1',
                              isConnected &&
                                (isBlue
                                  ? 'border-white/30 bg-white/10 text-white hover:bg-white hover:text-blue-900'
                                  : 'border-white/30 bg-white/10 text-white hover:bg-white hover:text-black')
                            )}
                            onClick={() => setManageAccountsTarget(platform)}
                          >
                            <Users className="h-3 w-3" />
                            Manage ({accountRows.length})
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              'flex-1 min-w-[100px] h-8 text-xs transition-all font-medium',
                              isConnected
                                ? isBlue
                                  ? 'text-white border border-white/25 bg-white/10 hover:bg-white hover:text-blue-900'
                                  : 'text-white border border-white/25 bg-white/10 hover:bg-white hover:text-black'
                                : 'border border-amber-400/60 text-amber-800 dark:text-amber-200 hover:bg-amber-200/50'
                            )}
                            onClick={() =>
                              handleDisconnect(
                                platform,
                                hasRealAccountIds ? primaryAcct?.id : undefined,
                                primaryAcct?.username || primaryAcct?.displayName
                              )
                            }
                            disabled={
                              readOnly ||
                              disconnecting === platform ||
                              Boolean(hasRealAccountIds && primaryAcct?.id && disconnecting === primaryAcct.id)
                            }
                          >
                            {disconnecting === platform ||
                            Boolean(hasRealAccountIds && primaryAcct?.id && disconnecting === primaryAcct.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Unlink2 className="mr-1 h-3 w-3" />
                                Disconnect
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs gap-1.5 mt-auto"
                      onClick={() => handleConnect(platform)}
                      disabled={readOnly || connecting === platform || serverUnconfigured}
                      title={
                        serverUnconfigured
                          ? `${cfg.name} OAuth credentials are not configured on the server`
                          : undefined
                      }
                    >
                      {serverUnconfigured ? (
                        <>
                          <Lock className="h-3 w-3" />
                          Not configured
                        </>
                      ) : connecting === platform ? (
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
          )}

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
                      <div className="flex items-center justify-center flex-shrink-0">
                        <PlatformBrandLogo platform={platform} size={18} />
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
