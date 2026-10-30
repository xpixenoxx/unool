import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'analytics');
  if (auth instanceof NextResponse) return auth;

  try {
    const userBreakdown = await adminRepository.getUserPlanDistribution();

    const { data: platformPostsRaw, error: pvErr } = await adminClient
      .from('post_variants')
      .select('platform')
      .eq('status', 'published');

    const postsByPlatform: Record<string, number> = {};
    if (!pvErr && platformPostsRaw) {
      platformPostsRaw.forEach((row: any) => {
        const p = (row.platform || 'unknown').toLowerCase();
        postsByPlatform[p] = (postsByPlatform[p] || 0) + 1;
      });
    }

    const { data: platformConnsRaw } = await adminClient
      .from('platform_connections')
      .select('workspace_id, platform');

    const { data: wmRaw } = await adminClient
      .from('workspace_members')
      .select('workspace_id, user_id');

    const wsToUsers: Record<string, string[]> = {};
    (wmRaw || []).forEach((row: any) => {
      if (!wsToUsers[row.workspace_id]) wsToUsers[row.workspace_id] = [];
      wsToUsers[row.workspace_id].push(row.user_id);
    });

    const userPlatforms: Record<string, Set<string>> = {};
    if (platformConnsRaw) {
      platformConnsRaw.forEach((row: any) => {
        const users = wsToUsers[row.workspace_id] || [];
        users.forEach((uid) => {
          if (!userPlatforms[uid]) userPlatforms[uid] = new Set();
          if (row.platform) userPlatforms[uid].add(row.platform.toLowerCase());
        });
      });
    }

    const platformCountBuckets: Record<number, number> = {};
    const connectedUserIds = new Set(Object.keys(userPlatforms));
    connectedUserIds.forEach((uid) => {
      const count = userPlatforms[uid].size;
      platformCountBuckets[count] = (platformCountBuckets[count] || 0) + 1;
    });
    const usersWithNoPlatforms = Math.max(0, userBreakdown.total - connectedUserIds.size);

    const exclusivePlatformUsers: Record<string, number> = {};
    connectedUserIds.forEach((uid) => {
      const platforms = Array.from(userPlatforms[uid]);
      if (platforms.length === 1) {
        const p = platforms[0];
        exclusivePlatformUsers[p] = (exclusivePlatformUsers[p] || 0) + 1;
      }
    });

    const platformUserCounts: Record<string, number> = {};
    connectedUserIds.forEach((uid) => {
      userPlatforms[uid].forEach((p) => {
        platformUserCounts[p] = (platformUserCounts[p] || 0) + 1;
      });
    });

    const oneChannelUsers = platformCountBuckets[1] || 0;
    const multiChannelUsers = Object.entries(platformCountBuckets)
      .filter(([k]) => parseInt(k) > 1)
      .reduce((acc, [, v]) => acc + v, 0);

    return NextResponse.json({
      userBreakdown,
      postsByPlatform,
      platformStats: {
        usersByPlatformCount: Object.entries(platformCountBuckets)
          .map(([count, users]) => ({ platformCount: parseInt(count), users }))
          .sort((a, b) => a.platformCount - b.platformCount),
        usersWithNoPlatforms,
        oneChannelUsers,
        multiChannelUsers,
        platformUserCounts: Object.entries(platformUserCounts)
          .map(([platform, users]) => ({ platform, users }))
          .sort((a, b) => b.users - a.users),
        exclusivePlatformUsers: Object.entries(exclusivePlatformUsers)
          .map(([platform, users]) => ({ platform, users }))
          .sort((a, b) => b.users - a.users),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get user insights:', error);
    return NextResponse.json({ error: 'Failed to get user insights' }, { status: 500 });
  }
}
