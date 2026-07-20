import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id, name, plan')
      .eq('id', auth.workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Get workspace failed:', error);
    return NextResponse.json({ error: 'Failed to get workspace' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .update({ name: name.trim() })
      .eq('id', auth.workspaceId)
      .select('id, name, plan')
      .single();

    if (error) {
      console.error('Update workspace failed:', error);
      return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Update workspace failed:', error);
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}