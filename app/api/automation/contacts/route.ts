import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { upsertWorkspaceContact } from '@/lib/services/automation/leadCapture';
import { computeContactIntentScore } from '@/lib/services/automation/intentScore';

export const dynamic = 'force-dynamic';

function csvSafeCell(val: unknown): string {
  const s = val == null ? '' : String(val);
  // Neutralize CSV formula injection (=, +, -, @, tab, CR)
  const neutralized = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

// GET /api/automation/contacts?workspaceId=xxx&search=&platform=all&filter=all|leads|vip|hot|paused&format=json|csv
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const workspaceId = sp.get('workspaceId') || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const search = (sp.get('search') || '').trim().toLowerCase();
    const platform = sp.get('platform') || 'all';
    const filter = sp.get('filter') || 'all';
    const format = sp.get('format') || 'json';

    let query = supabaseAdmin
      .from('workspace_contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('intent_score', { ascending: false })
      .order('last_interaction_at', { ascending: false })
      .limit(1000);

    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;
    if (error) {
      logger.warn('GET /api/automation/contacts error', { error: error.message });
      return NextResponse.json({ contacts: [], stats: { total: 0, withEmail: 0, withPhone: 0, vip: 0, hot: 0 } });
    }

    const allContacts = (data || []) as any[];
    const nowMs = Date.now();

    const filtered = allContacts.filter((c) => {
      if (filter === 'leads' && !c.email && !c.phone) return false;
      if (filter === 'vip' && !c.is_vip) return false;
      if (filter === 'hot' && Number(c.intent_score || 0) < 60) return false;
      if (filter === 'paused' && (!c.ai_paused_until || Date.parse(c.ai_paused_until) <= nowMs)) return false;
      if (search) {
        const hay = [
          c.username,
          c.full_name,
          c.email,
          c.phone,
          ...(Array.isArray(c.tags) ? c.tags : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    if (format === 'csv') {
      const headers = [
        'platform',
        'username',
        'full_name',
        'email',
        'phone',
        'intent_score',
        'is_vip',
        'follower_count',
        'is_following',
        'tags',
        'consent_at',
        'consent_source',
        'opted_out',
        'total_comments',
        'total_dms',
        'total_clicks',
        'last_interaction_at',
      ];
      const rows = filtered.map((c) =>
        [
          c.platform,
          c.username || '',
          c.full_name || '',
          c.email || '',
          c.phone || '',
          c.intent_score ?? 0,
          c.is_vip ? 'true' : 'false',
          c.follower_count ?? '',
          c.is_following_business === true ? 'true' : c.is_following_business === false ? 'false' : '',
          Array.isArray(c.tags) ? c.tags.join('; ') : '',
          c.consent_at || '',
          c.consent_source || '',
          c.opted_out ? 'true' : 'false',
          c.total_comments ?? 0,
          c.total_dms ?? 0,
          c.total_clicks ?? 0,
          c.last_interaction_at || '',
        ]
          .map(csvSafeCell)
          .join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="unool-audience-vault-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const stats = {
      total: allContacts.length,
      withEmail: allContacts.filter((c) => Boolean(c.email)).length,
      withPhone: allContacts.filter((c) => Boolean(c.phone)).length,
      vip: allContacts.filter((c) => Boolean(c.is_vip)).length,
      hot: allContacts.filter((c) => Number(c.intent_score || 0) >= 60).length,
      optedOut: allContacts.filter((c) => Boolean(c.opted_out)).length,
    };

    return NextResponse.json({ contacts: filtered, stats });
  } catch (error) {
    logger.error('GET /api/automation/contacts error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/automation/contacts — Add or enrich a consented contact manually
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const workspaceId = body.workspaceId || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const username = String(body.username || '').replace(/^@/, '').trim();
    const platformUserId = String(body.platform_user_id || username || body.email || '').trim();
    if (!platformUserId) {
      return NextResponse.json({ error: 'username or email required' }, { status: 400 });
    }

    const intent = computeContactIntentScore({
      hasEmail: Boolean(body.email),
      hasPhone: Boolean(body.phone),
      isVip: Boolean(body.is_vip),
      lastInteractionAt: new Date().toISOString(),
    });

    const contact = await upsertWorkspaceContact({
      workspaceId,
      platform: body.platform || 'instagram',
      platformUserId,
      username: username || null,
      fullName: body.full_name || null,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      consentSource: 'manual_crm_entry',
      addTags: Array.isArray(body.tags) ? body.tags : [],
      intentScore: intent.score,
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    logger.error('POST /api/automation/contacts error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
