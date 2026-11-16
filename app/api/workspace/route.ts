import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAuth } from '@/lib/auth/server';
import {
  listUserWorkspaces,
  normalizeWorkspaceRole,
  requireWorkspaceRole,
} from '@/lib/auth/workspaceAccess';
import { withPlanEnforcement } from '@/lib/middleware/plan-enforcement';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { findUserByEmail } from '@/lib/auth/findUserByEmail';
import { sendWorkspaceInviteEmail } from '@/lib/auth/email';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const renameSchema = z.object({
  name: z.string().trim().min(1, 'Workspace name is required.').max(80, 'Workspace name must be 80 characters or fewer.'),
});

const inviteSchema = z.object({
  email: z.string().trim().email('A valid email address is required.'),
  role: z.enum(['admin', 'editor', 'viewer', 'member']).optional().default('editor'),
});

const patchMemberSchema = z.object({
  memberId: z.string().uuid('Valid memberId is required.'),
  role: z.enum(['admin', 'editor', 'viewer', 'member']),
});

/**
 * GET /api/workspace
 * Returns the active workspace, caller's role, members/pending invites, and accessible workspaces list.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const [{ data: workspace }, roleResult, { data: memberRows }, workspaces] = await Promise.all([
      supabaseAdmin
        .from('workspaces')
        .select('id, name, plan, owner_id, created_at')
        .eq('id', auth.workspaceId)
        .limit(1)
        .maybeSingle(),
      requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner', 'admin', 'editor', 'viewer']),
      supabaseAdmin
        .from('workspace_members')
        .select('id, user_id, email, role, status, invited_at, joined_at')
        .eq('workspace_id', auth.workspaceId)
        .order('joined_at', { ascending: true, nullsFirst: false }),
      listUserWorkspaces(auth.userId),
    ]);

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const memberUserIds = Array.from(
      new Set(
        [
          workspace.owner_id,
          ...((memberRows || []).map((m) => m.user_id).filter(Boolean) as string[]),
        ].filter(Boolean)
      )
    );

    const userMap = new Map<string, { email: string; fullName: string | null }>();
    if (memberUserIds.length > 0) {
      const { data: usersData } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name')
        .in('id', memberUserIds);

      for (const u of usersData || []) {
        userMap.set(u.id, { email: u.email, fullName: u.full_name });
      }
    }

    const members = (memberRows || []).map((m) => {
      const profile = m.user_id ? userMap.get(m.user_id) : undefined;
      return {
        id: m.id,
        userId: m.user_id,
        email: m.email || profile?.email || '',
        fullName: profile?.fullName || null,
        role: m.user_id === workspace.owner_id ? 'owner' : normalizeWorkspaceRole(m.role),
        status: m.status || 'active',
        invitedAt: m.invited_at,
        joinedAt: m.joined_at,
        isOwner: m.user_id === workspace.owner_id,
      };
    });

    // Ensure workspace owner always appears in members list even if workspace_members row wasn't seeded
    if (workspace.owner_id && !members.some((m) => m.userId === workspace.owner_id)) {
      const ownerInfo = userMap.get(workspace.owner_id);
      members.unshift({
        id: `owner:${workspace.owner_id}`,
        userId: workspace.owner_id,
        email: ownerInfo?.email || '',
        fullName: ownerInfo?.fullName || null,
        role: 'owner',
        status: 'active',
        invitedAt: workspace.created_at,
        joinedAt: workspace.created_at,
        isOwner: true,
      });
    }

    const callerRole = roleResult.allowed ? roleResult.membership.role : 'viewer';

    return NextResponse.json(
      {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          plan: workspace.plan,
          ownerId: workspace.owner_id,
        },
        role: callerRole,
        members,
        workspaces,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    logger.error('Get workspace failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to get workspace' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * PUT /api/workspace
 * Renames the active workspace. Restricted strictly to owner and admin roles.
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner', 'admin']);
    if (!roleCheck.allowed) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can update workspace settings.' },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = renameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Workspace name is required.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .update({ name: parsed.data.name, updated_at: new Date().toISOString() })
      .eq('id', auth.workspaceId)
      .select('id, name, plan, owner_id')
      .limit(1)
      .maybeSingle();

    if (error || !workspace) {
      logger.error('Update workspace failed', { error: error?.message, workspaceId: auth.workspaceId });
      return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500, headers: NO_STORE_HEADERS });
    }

    return NextResponse.json({ workspace }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.error('Update workspace failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * POST /api/workspace
 * Invites a collaborator (or adds an existing verified Unool user) and sends an email invite.
 * Enforces owner/admin role, rate limits, and `invite_member` plan seat limits.
 */
export const POST = withPlanEnforcement(
  async (request: NextRequest, context: { userId: string; workspaceId: string }) => {
    try {
      const { userId, workspaceId } = context;

      const roleCheck = await requireWorkspaceRole(userId, workspaceId, ['owner', 'admin']);
      if (!roleCheck.allowed) {
        return NextResponse.json(
          { error: 'Only workspace owners and admins can invite team members.' },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }

      const rate = await checkRateLimit(request, 'accountAction', userId);
      if (!rate.success) {
        return NextResponse.json(
          { error: 'Too many invitations sent. Please try again later.' },
          { status: 429, headers: { ...NO_STORE_HEADERS, ...rateLimitHeaders(rate.remaining, rate.reset) } }
        );
      }

      const body = await request.json().catch(() => null);
      const parsed = inviteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'Valid email and role are required.' },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }

      const email = parsed.data.email.toLowerCase().trim();
      const role = normalizeWorkspaceRole(parsed.data.role);
      if (role === 'owner') {
        return NextResponse.json(
          { error: 'Cannot invite another owner directly. Use ownership transfer instead.' },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }

      const [{ data: workspaceRow }, { data: inviterRow }, existingUser] = await Promise.all([
        supabaseAdmin.from('workspaces').select('name').eq('id', workspaceId).limit(1).maybeSingle(),
        supabaseAdmin.from('users').select('email').eq('id', userId).limit(1).maybeSingle(),
        findUserByEmail(email),
      ]);

      const workspaceName = workspaceRow?.name || 'Workspace';

      if (!existingUser) {
        const { data: existingInvite } = await supabaseAdmin
          .from('workspace_members')
          .select('id, status')
          .eq('workspace_id', workspaceId)
          .eq('email', email)
          .limit(1)
          .maybeSingle();

        if (existingInvite) {
          return NextResponse.json(
            { error: 'An invitation or membership already exists for this email.' },
            { status: 409, headers: NO_STORE_HEADERS }
          );
        }

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
          .limit(1)
          .maybeSingle();

        if (inviteError || !invite) {
          logger.error('Invite failed', { error: inviteError?.message, workspaceId });
          return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500, headers: NO_STORE_HEADERS });
        }

        const mailResult = await sendWorkspaceInviteEmail({
          to: email,
          workspaceName,
          inviterEmail: inviterRow?.email || undefined,
          role,
        });

        return NextResponse.json(
          {
            member: invite,
            emailDelivered: mailResult.delivered,
            message: 'Invitation sent',
          },
          { status: 201, headers: NO_STORE_HEADERS }
        );
      }

      const { data: existingMember } = await supabaseAdmin
        .from('workspace_members')
        .select('id, status')
        .eq('workspace_id', workspaceId)
        .eq('user_id', existingUser.id)
        .limit(1)
        .maybeSingle();

      if (existingMember && (!existingMember.status || existingMember.status === 'active')) {
        return NextResponse.json(
          { error: 'This user is already an active member of this workspace.' },
          { status: 409, headers: NO_STORE_HEADERS }
        );
      }

      const { data: member, error } = await supabaseAdmin
        .from('workspace_members')
        .upsert(
          {
            workspace_id: workspaceId,
            user_id: existingUser.id,
            email: existingUser.email || email,
            role,
            status: 'active',
            invited_by: userId,
            invited_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
          },
          { onConflict: 'workspace_id,user_id' }
        )
        .select()
        .limit(1)
        .maybeSingle();

      if (error || !member) {
        logger.error('Add member failed', { error: error?.message, workspaceId });
        return NextResponse.json({ error: 'Failed to add member' }, { status: 500, headers: NO_STORE_HEADERS });
      }

      await sendWorkspaceInviteEmail({
        to: existingUser.email || email,
        workspaceName,
        inviterEmail: inviterRow?.email || undefined,
        role,
      });

      return NextResponse.json({ member, message: 'Collaborator added to workspace' }, { status: 201, headers: NO_STORE_HEADERS });
    } catch (error) {
      logger.error('Invite member failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json({ error: 'Failed to invite member' }, { status: 500, headers: NO_STORE_HEADERS });
    }
  },
  { action: 'invite_member' }
);

/**
 * PATCH /api/workspace
 * Changes a collaborator's role (`admin`, `editor`, `viewer`).
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner', 'admin']);
    if (!roleCheck.allowed) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can change member roles.' },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = patchMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Valid memberId and role are required.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const nextRole = normalizeWorkspaceRole(parsed.data.role);
    if (nextRole === 'owner') {
      return NextResponse.json(
        { error: 'Use ownership transfer to assign the owner role.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { data: targetRow } = await supabaseAdmin
      .from('workspace_members')
      .select('id, user_id, role')
      .eq('id', parsed.data.memberId)
      .eq('workspace_id', auth.workspaceId)
      .limit(1)
      .maybeSingle();

    if (!targetRow) {
      return NextResponse.json({ error: 'Workspace member not found.' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const targetRole = normalizeWorkspaceRole(targetRow.role);
    if (targetRole === 'owner') {
      return NextResponse.json(
        { error: 'Workspace owner role cannot be modified here.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (roleCheck.membership.role === 'admin' && (targetRole === 'admin' || nextRole === 'admin')) {
      return NextResponse.json(
        { error: 'Only the workspace owner can promote or demote admins.' },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('workspace_members')
      .update({ role: nextRole })
      .eq('id', targetRow.id)
      .eq('workspace_id', auth.workspaceId)
      .select()
      .limit(1)
      .maybeSingle();

    if (updateErr || !updated) {
      return NextResponse.json({ error: 'Failed to update member role.' }, { status: 500, headers: NO_STORE_HEADERS });
    }

    return NextResponse.json({ member: updated }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.error('PATCH /api/workspace failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to update member role.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * DELETE /api/workspace?memberId=<uuid>
 * Removes a workspace member or revokes a pending invitation.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const memberId = request.nextUrl.searchParams.get('memberId')?.trim();
    if (!memberId) {
      return NextResponse.json({ error: 'memberId query parameter is required.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const { data: targetRow } = await supabaseAdmin
      .from('workspace_members')
      .select('id, user_id, role')
      .eq('id', memberId)
      .eq('workspace_id', auth.workspaceId)
      .limit(1)
      .maybeSingle();

    if (!targetRow) {
      return NextResponse.json({ error: 'Workspace member not found.' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const targetRole = normalizeWorkspaceRole(targetRow.role);
    if (targetRole === 'owner') {
      return NextResponse.json(
        { error: 'Workspace owner cannot be removed. Transfer ownership first.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const isSelfLeave = targetRow.user_id && targetRow.user_id === auth.userId;
    if (!isSelfLeave) {
      const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner', 'admin']);
      if (!roleCheck.allowed) {
        return NextResponse.json(
          { error: 'Only workspace owners and admins can remove collaborators.' },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }
      if (roleCheck.membership.role === 'admin' && targetRole === 'admin') {
        return NextResponse.json(
          { error: 'Only the workspace owner can remove another admin.' },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }
    }

    const { error: delErr } = await supabaseAdmin
      .from('workspace_members')
      .delete()
      .eq('id', memberId)
      .eq('workspace_id', auth.workspaceId);

    if (delErr) {
      return NextResponse.json({ error: 'Failed to remove workspace member.' }, { status: 500, headers: NO_STORE_HEADERS });
    }

    return NextResponse.json({ success: true, removedMemberId: memberId }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.error('DELETE /api/workspace failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to remove workspace member.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
