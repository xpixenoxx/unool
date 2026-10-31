import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export const dynamic = 'force-dynamic';

export const SECTION_METADATA: Record<string, { name: string; color: string; description: string }> = {
  overview:     { name: 'Overview',     color: '#3b82f6', description: 'Dashboard home & high-level stats' },
  studio:       { name: 'Studio',       color: '#8b5cf6', description: 'AI idea generator & content creation' },
  flightplan:   { name: 'Flight Plan',  color: '#f59e0b', description: 'Plan, schedule & calendar view' },
  signal:       { name: 'Signal',       color: '#ec4899', description: 'Publishing & cross-platform stream' },
  automation:   { name: 'Automation',   color: '#10b981', description: 'Instagram comment automation' },
  'unlock-gates': { name: 'Unlock Gates', color: '#6366f1', description: 'Follow-to-unlock content gates' },
  referrals:    { name: 'Referrals',    color: '#eab308', description: 'Referral ledger & rewards' },
  profile:      { name: 'Profile',      color: '#06b6d4', description: 'Public page builder & templates' },
  billing:      { name: 'Billing',      color: '#14b8a6', description: 'Subscriptions, plans & checkout' },
  settings:     { name: 'Settings',     color: '#64748b', description: 'Account & workspace configuration' },
  composer:     { name: 'Composer',     color: '#f97316', description: 'Post editor & media adapt' },
};

export function formatSeconds(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'analytics');
  if (auth instanceof NextResponse) return auth;

  try {
    const userBreakdown = await adminRepository.getUserPlanDistribution();

    // ── 1. Posts by platform ──────────────────────────────────────────────────
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

    // ── 2. Platform connections & multi-channel stats ─────────────────────────
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

    // ── 3. Time Spent by Dashboard Section & Overall in Unool ─────────────────
    // Aggregation maps: section -> total seconds & user set
    const sectionTotals: Record<string, number> = {};
    const sectionUsersMap: Record<string, Set<string>> = {};
    const userTotalTimeMap: Record<string, { totalSeconds: number; sections: Record<string, number> }> = {};

    // Initialize all canonical sections
    Object.keys(SECTION_METADATA).forEach((sec) => {
      sectionTotals[sec] = 0;
      sectionUsersMap[sec] = new Set();
    });

    // 3a. Read from user_section_time table if present
    try {
      const { data: dbTimes, error: dbTimeErr } = await adminClient
        .from('user_section_time')
        .select('user_id, section, duration_seconds');

      if (!dbTimeErr && dbTimes && dbTimes.length > 0) {
        dbTimes.forEach((row: any) => {
          const sec = (row.section || '').toLowerCase();
          const duration = Math.max(0, Number(row.duration_seconds) || 0);
          const uid = row.user_id;

          if (duration > 0) {
            sectionTotals[sec] = (sectionTotals[sec] || 0) + duration;
            if (!sectionUsersMap[sec]) sectionUsersMap[sec] = new Set();
            if (uid) sectionUsersMap[sec].add(uid);

            if (uid) {
              if (!userTotalTimeMap[uid]) userTotalTimeMap[uid] = { totalSeconds: 0, sections: {} };
              userTotalTimeMap[uid].sections[sec] = (userTotalTimeMap[uid].sections[sec] || 0) + duration;
              userTotalTimeMap[uid].totalSeconds += duration;
            }
          }
        });
      }
    } catch {
      // Table may not exist yet in all deployment environments
    }

    // 3b. Read from user_metadata in auth.users (covers users before migration)
    try {
      const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (usersData?.users) {
        usersData.users.forEach((u) => {
          const metaTimes = (u as Record<string, any>).user_metadata?.section_time_spent;
          if (metaTimes && typeof metaTimes === 'object') {
            const uid = u.id;
            if (!userTotalTimeMap[uid]) userTotalTimeMap[uid] = { totalSeconds: 0, sections: {} };

            Object.entries(metaTimes).forEach(([sec, val]) => {
              if (sec === 'total' || sec === 'last_active_at') return;
              const duration = Math.max(0, Number(val) || 0);
              if (duration > 0) {
                // If table already had data for this user & section, use the max to prevent double count
                const currentSecUserVal = userTotalTimeMap[uid].sections[sec] || 0;
                if (duration > currentSecUserVal) {
                  const diff = duration - currentSecUserVal;
                  sectionTotals[sec] = (sectionTotals[sec] || 0) + diff;
                  userTotalTimeMap[uid].sections[sec] = duration;
                  userTotalTimeMap[uid].totalSeconds += diff;
                  if (!sectionUsersMap[sec]) sectionUsersMap[sec] = new Set();
                  sectionUsersMap[sec].add(uid);
                }
              }
            });
          }
        });
      }
    } catch {
      // Non-fatal
    }

    // Overall aggregate computation
    const overallSeconds = Object.values(sectionTotals).reduce((a, b) => a + b, 0);
    const trackedUniqueUsers = new Set<string>();
    Object.values(sectionUsersMap).forEach((userSet) => {
      userSet.forEach((uid) => trackedUniqueUsers.add(uid));
    });
    const trackedUsersCount = Math.max(trackedUniqueUsers.size, 1);
    const avgSecondsPerUser = Math.round(overallSeconds / trackedUsersCount);

    // Section breakdown with percentages and formatted strings
    const sectionBreakdown = Object.entries(SECTION_METADATA).map(([secKey, meta]) => {
      const totalSec = sectionTotals[secKey] || 0;
      const pct = overallSeconds > 0 ? ((totalSec / overallSeconds) * 100).toFixed(1) : '0';
      const userCount = sectionUsersMap[secKey]?.size || 0;
      const avgSec = userCount > 0 ? Math.round(totalSec / userCount) : 0;

      return {
        section: secKey,
        name: meta.name,
        color: meta.color,
        description: meta.description,
        totalSeconds: totalSec,
        formattedTotal: formatSeconds(totalSec),
        percentage: parseFloat(pct),
        activeUsersCount: userCount,
        avgSecondsPerUser: avgSec,
        formattedAvg: formatSeconds(avgSec),
      };
    }).sort((a, b) => b.totalSeconds - a.totalSeconds);

    const mostActiveSection = sectionBreakdown.length > 0 && sectionBreakdown[0].totalSeconds > 0
      ? sectionBreakdown[0].name
      : 'Overview';

    // Augment recentUsers with individual time spent if available
    const augmentedRecentUsers = (userBreakdown.recentUsers || []).map((u) => {
      const userTime = userTotalTimeMap[u.id];
      const totalSec = userTime?.totalSeconds || 0;

      let topSecName = 'Overview';
      if (userTime?.sections) {
        let maxSec = '';
        let maxVal = -1;
        Object.entries(userTime.sections).forEach(([s, v]) => {
          if (v > maxVal) {
            maxVal = v;
            maxSec = s;
          }
        });
        if (maxSec && SECTION_METADATA[maxSec]) {
          topSecName = SECTION_METADATA[maxSec].name;
        }
      }

      return {
        ...u,
        totalTimeSeconds: totalSec,
        formattedTimeSpent: formatSeconds(totalSec),
        topSection: topSecName,
      };
    });

    return NextResponse.json({
      userBreakdown: {
        ...userBreakdown,
        recentUsers: augmentedRecentUsers,
      },
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
      timeSpentStats: {
        overallSeconds,
        formattedOverall: formatSeconds(overallSeconds),
        avgSecondsPerUser,
        formattedAvgPerUser: formatSeconds(avgSecondsPerUser),
        trackedUsersCount: trackedUniqueUsers.size,
        mostActiveSection,
        sections: sectionBreakdown,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get user insights:', error);
    return NextResponse.json({ error: 'Failed to get user insights' }, { status: 500 });
  }
}
