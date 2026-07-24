import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { withPlanEnforcement } from '@/lib/middleware/plan-enforcement';

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

// Invite member - requires invite_member plan action
export const POST = withPlanEnforcement(async (request: NextRequest, context: { userId: string; workspaceId: string }) => {
  try {
    const { userId, workspaceId } = context;
    const body = await request.json();
    const { email, role = 'member' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check if user exists by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('List users failed:', listError);
      return NextResponse.json({ error: 'Failed to check user' }, { status: 500 });
    }

    const existingUser = users.find(u => u.email === email);

    if (!existingUser) {
      // Check if already invited
      const { data: existing } = await supabaseAdmin
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('email', email)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'User already invited' }, { status: 409 });
      }

      // Create invitation
      const { data: invite, error: inviteError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: null,
          email,
          role,
          invited_at: new Date().toISOString(),
          invited_by: userId,
          status: 'pending',
        })
        .select()
        .single();

      if (inviteError) {
        console.error('Invite failed:', inviteError);
        return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
      }

      // TODO: Send invitation email
      return NextResponse.json({ member: invite, message: 'Invitation sent' }, { status: 201 });
    }

    // User exists - add directly
    const { data: member, error } = await supabaseAdmin
      .from('workspace_members')
      .upsert({
        workspace_id: workspaceId,
        user_id: existingUser.id,
        email: existingUser.email,
        role,
        status: 'active',
        joined_at: new Date().toISOString(),
      }, { onConflict: 'workspace_id,user_id' })
      .select()
      .single();

    if (error) {
      console.error('Add member failed:', error);
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('Invite member failed:', error);
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 });
  }
}, { action: 'invite_member' });