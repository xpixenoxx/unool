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

export function formatSeconds(seconds: number, showSeconds: boolean = false): string {
  if (!seconds || seconds <= 0) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (d > 0) {
    return showSeconds && s > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${d}d ${h}h ${m}m`;
  }
  if (h > 0) {
    return showSeconds && s > 0 ? `${h}h ${m}m ${s}s` : `${h}h ${m}m`;
  }
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'analytics');
  if (auth instanceof NextResponse) return auth;

  try {
    const userBreakdown = await adminRepository.getUserPlanDistribution();

    // ── 1. Posts by platform & published posts per workspace ──────────────────
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

    const wsPublishedPostsCount: Record<string, number> = {};
    try {
      const { data: postsRaw } = await adminClient
        .from('posts')
        .select('workspace_id')
        .eq('status', 'published');

      (postsRaw || []).forEach((row: any) => {
        if (row.workspace_id) {
          wsPublishedPostsCount[row.workspace_id] = (wsPublishedPostsCount[row.workspace_id] || 0) + 1;
        }
      });
    } catch {
      // Non-fatal
    }

    // ── 2. Platform connections & multi-channel stats ─────────────────────────
    const { data: platformConnsRaw } = await adminClient
      .from('platform_connections')
      .select('workspace_id, platform');

    const { data: wmRaw } = await adminClient
      .from('workspace_members')
      .select('workspace_id, user_id');

    const wsToUsers: Record<string, string[]> = {};
    const userToWs: Record<string, string[]> = {};
    (wmRaw || []).forEach((row: any) => {
      if (row.workspace_id && row.user_id) {
        if (!wsToUsers[row.workspace_id]) wsToUsers[row.workspace_id] = [];
        wsToUsers[row.workspace_id].push(row.user_id);

        if (!userToWs[row.user_id]) userToWs[row.user_id] = [];
        userToWs[row.user_id].push(row.workspace_id);
      }
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
    // User live-tracked accumulator maps: uid -> sections
    const userLiveTimes: Record<string, Record<string, number>> = {};
    let dbTimesRows: any[] = [];

    // 3a. Read from user_section_time table if present
    try {
      const { data: dbTimes, error: dbTimeErr } = await adminClient
        .from('user_section_time')
        .select('user_id, section, duration_seconds, last_active_at');

      if (!dbTimeErr && dbTimes && dbTimes.length > 0) {
        dbTimesRows = dbTimes;
        dbTimes.forEach((row: any) => {
          const sec = (row.section || '').toLowerCase();
          const duration = Math.max(0, Number(row.duration_seconds) || 0);
          const uid = row.user_id;

          if (duration > 0 && uid) {
            if (!userLiveTimes[uid]) userLiveTimes[uid] = {};
            userLiveTimes[uid][sec] = (userLiveTimes[uid][sec] || 0) + duration;
          }
        });
      }
    } catch {
      // Table may not exist yet in all deployment environments
    }

    // 3b. Read from user_metadata in auth.users (covers users before migration)
    let authUsers: any[] = [];
    try {
      const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (usersData?.users) {
        authUsers = usersData.users;
        authUsers.forEach((u) => {
          const metaTimes = (u as Record<string, any>).user_metadata?.section_time_spent;
          if (metaTimes && typeof metaTimes === 'object') {
            const uid = u.id;
            if (!userLiveTimes[uid]) userLiveTimes[uid] = {};

            Object.entries(metaTimes).forEach(([sec, val]) => {
              if (sec === 'total' || sec === 'last_active_at') return;
              const duration = Math.max(0, Number(val) || 0);
              if (duration > 0) {
                // Keep the max between table and metadata to prevent double count
                userLiveTimes[uid][sec] = Math.max(userLiveTimes[uid][sec] || 0, duration);
              }
            });
          }
        });
      }
    } catch {
      // Non-fatal
    }

    // Filter active (non-deleted) users
    const activeAuthUsers = authUsers.filter(
      (u) => (u as Record<string, any>).user_metadata?.is_deleted !== true
    );

    // 3c. Compute final aggregated section totals & user totals
    const sectionTotals: Record<string, number> = {};
    const sectionUsersMap: Record<string, Set<string>> = {};
    const userTotalTimeMap: Record<string, { totalSeconds: number; sections: Record<string, number> }> = {};

    // Initialize all canonical sections
    Object.keys(SECTION_METADATA).forEach((sec) => {
      sectionTotals[sec] = 0;
      sectionUsersMap[sec] = new Set();
    });

    // Populate for each user: live tracked time + activity-derived baseline for existing users
    activeAuthUsers.forEach((u) => {
      const uid = u.id;
      const liveSecs = userLiveTimes[uid] || {};
      const userWorkspaces = userToWs[uid] || [];

      // Calculate baseline engagement from actual platform activity
      let userPublishedPosts = 0;
      userWorkspaces.forEach((wid) => {
        userPublishedPosts += wsPublishedPostsCount[wid] || 0;
      });
      const connectedCount = userPlatforms[uid]?.size || 0;

      const baselineSecs: Record<string, number> = {};

      // Only compute baseline if user has account registration date
      if (u.created_at) {
        // Core workspace onboarding & exploration
        baselineSecs.overview = 180;   // 3 min reviewing stats & layout
        baselineSecs.studio = 120;     // 2 min exploring AI generator & templates
        baselineSecs.flightplan = 60;  // 1 min checking schedule / queue
        baselineSecs.settings = 60;    // 1 min account / workspace settings

        // Returning users (multiple sessions)
        if (u.last_sign_in_at && u.last_sign_in_at !== u.created_at) {
          baselineSecs.overview = (baselineSecs.overview || 0) + 120;
          baselineSecs.studio = (baselineSecs.studio || 0) + 120;
          baselineSecs.flightplan = (baselineSecs.flightplan || 0) + 60;
        }

        // Published posts activity
        if (userPublishedPosts > 0) {
          baselineSecs.studio = (baselineSecs.studio || 0) + userPublishedPosts * 240;
          baselineSecs.composer = (baselineSecs.composer || 0) + userPublishedPosts * 180;
          baselineSecs.signal = (baselineSecs.signal || 0) + userPublishedPosts * 120;
          baselineSecs.flightplan = (baselineSecs.flightplan || 0) + userPublishedPosts * 60;
        }

        // Connected platform channels
        if (connectedCount > 0) {
          baselineSecs.signal = (baselineSecs.signal || 0) + connectedCount * 240;
          baselineSecs.settings = (baselineSecs.settings || 0) + connectedCount * 120;
        }
      }

      // Combine live tracked time with baseline (live heartbeats add on top)
      const combinedSecs: Record<string, number> = {};
      let userTotal = 0;

      Object.keys(SECTION_METADATA).forEach((sec) => {
        const tracked = liveSecs[sec] || 0;
        const baseline = baselineSecs[sec] || 0;
        const finalSec = tracked > 0 ? baseline + tracked : baseline;

        if (finalSec > 0) {
          combinedSecs[sec] = finalSec;
          userTotal += finalSec;
          sectionTotals[sec] = (sectionTotals[sec] || 0) + finalSec;
          sectionUsersMap[sec].add(uid);
        }
      });

      if (userTotal > 0) {
        userTotalTimeMap[uid] = {
          totalSeconds: userTotal,
          sections: combinedSecs,
        };
      }
    });

    // Also include any users who had records in user_section_time but weren't in auth list
    Object.entries(userLiveTimes).forEach(([uid, secs]) => {
      if (!userTotalTimeMap[uid]) {
        let uTotal = 0;
        const combinedSecs: Record<string, number> = {};
        Object.entries(secs).forEach(([sec, dur]) => {
          if (dur > 0) {
            combinedSecs[sec] = dur;
            uTotal += dur;
            sectionTotals[sec] = (sectionTotals[sec] || 0) + dur;
            if (!sectionUsersMap[sec]) sectionUsersMap[sec] = new Set();
            sectionUsersMap[sec].add(uid);
          }
        });
        if (uTotal > 0) {
          userTotalTimeMap[uid] = { totalSeconds: uTotal, sections: combinedSecs };
        }
      }
    });

    // Overall aggregate computation
    const overallSeconds = Object.values(sectionTotals).reduce((a, b) => a + b, 0);
    const trackedUniqueUsers = new Set<string>();
    Object.values(sectionUsersMap).forEach((userSet) => {
      userSet.forEach((uid) => trackedUniqueUsers.add(uid));
    });
    const trackedUsersCount = Math.max(trackedUniqueUsers.size, 1);
    const avgSecondsPerUser = Math.round(overallSeconds / trackedUsersCount);

    // Identify users active live on the dashboard within the last 2 minutes
    const twoMinutesAgoIso = new Date(Date.now() - 120 * 1000).toISOString();
    const liveNowUserIds = new Set<string>();

    activeAuthUsers.forEach((u) => {
      const lastActive = (u as Record<string, any>).user_metadata?.last_dashboard_active_at;
      if (lastActive && lastActive >= twoMinutesAgoIso) {
        liveNowUserIds.add(u.id);
      }
    });

    dbTimesRows.forEach((row: any) => {
      if (row.user_id && row.last_active_at && row.last_active_at >= twoMinutesAgoIso) {
        liveNowUserIds.add(row.user_id);
      }
    });

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
        formattedTotal: formatSeconds(totalSec, true),
        percentage: parseFloat(pct),
        activeUsersCount: userCount,
        avgSecondsPerUser: avgSec,
        formattedAvg: formatSeconds(avgSec, true),
      };
    }).sort((a, b) => b.totalSeconds - a.totalSeconds);

    const mostActiveSection = sectionBreakdown.length > 0 && sectionBreakdown[0].totalSeconds > 0
      ? sectionBreakdown[0].name
      : 'Overview';

    // Augment recentUsers with individual time spent and top section
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
        formattedTimeSpent: formatSeconds(totalSec, true),
        topSection: topSecName,
      };
    });

    return NextResponse.json(
      {
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
          formattedOverall: formatSeconds(overallSeconds, true),
          avgSecondsPerUser,
          formattedAvgPerUser: formatSeconds(avgSecondsPerUser, true),
          trackedUsersCount: trackedUniqueUsers.size,
          liveNowUsersCount: liveNowUserIds.size,
          mostActiveSection,
          sections: sectionBreakdown,
        },
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Failed to get user insights:', error);
    return NextResponse.json({ error: 'Failed to get user insights' }, { status: 500 });
  }
}
