import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * DELETE /api/user/delete
 *
 * GDPR Article 17 — Right to Erasure ("Right to be Forgotten").
 * Deletes all user data in dependency order (children before parents).
 *
 * Requires: valid session (authenticated request).
 * Rate limiting: handled upstream by middleware.
 */
export async function DELETE(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, workspaceId } = auth;

  try {
    // Delete in dependency order — children before parents to avoid FK violations
    await supabaseAdmin.from('platform_connections').delete().eq('user_id', userId);
    await supabaseAdmin.from('posts').delete().eq('workspace_id', workspaceId);
    await supabaseAdmin.from('workspace_members').delete().eq('user_id', userId);
    await supabaseAdmin
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)
      .eq('owner_id', userId); // Only delete workspace if user is the owner

    // Finally delete the auth user — this must be last
    await supabaseAdmin.auth.admin.deleteUser(userId);

    logger.info('User account deleted (GDPR right to erasure)', { userId, workspaceId });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    logger.error('User deletion failed', {
      userId,
      workspaceId,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json(
      { error: 'Deletion failed. Please contact support@unool.co if this persists.' },
      { status: 500 }
    );
  }
}

