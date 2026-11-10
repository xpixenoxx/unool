import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/schema';
import { getCurrentUsage, checkLimit, getLimitsForTier, Tier } from '@/lib/limits/freeTier';
import { supabaseAdmin } from '@/lib/supabase/admin';



export type LimitType = 'postsPerMonth' | 'aiTokensPerMonth' | 'connectedAccounts' | 'scheduledPosts' | 'teamMembers' | 'apiCallsPerDay';

export async function enforceLimit(
  request: NextRequest,
  limitType: LimitType,
  action: () => Promise<NextResponse>
): Promise<NextResponse> {
  const workspaceId = request.nextUrl.searchParams.get('workspaceId') || request.headers.get('x-workspace-id');
  const userId = request.headers.get('x-user-id');

  if (!workspaceId || !userId) {
    return NextResponse.json({ error: 'Missing workspace or user ID' }, { status: 401 });
  }

  // Get workspace tier (column in workspaces is 'plan')
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single();

  const rawPlan = (workspace as any)?.plan || (workspace as any)?.plan_tier || 'free';
  const tier: Tier = rawPlan === 'spark' ? 'free' : (rawPlan as Tier);
  const limits = getLimitsForTier(tier);

  // Get current usage
  const usage = await getCurrentUsage(supabaseAdmin, workspaceId, userId);

  // Check limit
  const result = checkLimit(limitType, usage, limits);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Limit exceeded',
        limit: result.limit,
        used: result.used,
        remaining: result.remaining,
        resetAt: result.resetAt.toISOString(),
        tier,
        upgradeUrl: '/dashboard/settings?tab=billing',
      },
      { status: 429 }
    );
  }

  // Proceed with action
  return action();
}

export async function trackApiCall(workspaceId: string, endpoint: string): Promise<void> {
  await supabaseAdmin.from('api_calls').insert({
    workspace_id: workspaceId,
    endpoint,
  });
}

export async function trackAiUsage(
  workspaceId: string,
  userId: string,
  tokensIn: number,
  tokensOut: number,
  capability: string,
  model: string
): Promise<void> {
  const costUsd = (tokensIn + tokensOut) * 0.0000015; // Rough estimate

  await supabaseAdmin.from('ai_usage').insert({
    workspace_id: workspaceId,
    user_id: userId,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    capability,
    model,
    cost_usd: costUsd,
  });
}
