import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cancelSubscription, getWorkspaceSubscription } from '@/lib/billing/subscription';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';

async function deleteByPrefix(
  s3: any,
  bucket: string,
  prefix: string
): Promise<void> {
  const { ListObjectsV2Command, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  let continuationToken: string | undefined;
  do {
    const listRes = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    const keys = (listRes.Contents || []).map((o: any) => o.Key).filter(Boolean);
    if (keys.length > 0) {
      await Promise.allSettled(
        keys.map((key: string) =>
          s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
        )
      );
    }
    continuationToken = listRes.IsTruncated ? listRes.NextContinuationToken : undefined;
  } while (continuationToken);
}

/**
 * DELETE /api/user/delete
 *
 * GDPR Article 17 & DPDP Act 2023 — Right to Erasure ("Right to be Forgotten").
 * Requires explicit `{ confirmation: "DELETE" }` JSON payload, blocks impersonation,
 * guards multi-member owned workspaces (409), best-effort cancels subscriptions & revokes tokens,
 * cleans both Cloudflare R2 buckets (`avatars` and `post-media`), purges user/workspace tables,
 * and deletes the Supabase Auth user.
 */
export async function DELETE(request: NextRequest) {
  let userId: string | undefined;
  let workspaceId: string | undefined;

  try {
    const auth = await getCurrentAuth(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.isImpersonated) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot delete account while impersonating' },
        { status: 403 }
      );
    }

    userId = auth.userId;
    workspaceId = auth.workspaceId;

    const body = await request.json().catch(() => null);
    if (!body || body.confirmation !== 'DELETE') {
      return NextResponse.json(
        {
          error: 'Explicit confirmation required. Send { "confirmation": "DELETE" } to proceed.',
          code: 'CONFIRMATION_REQUIRED',
        },
        { status: 400 }
      );
    }

    // 1. Identify ONLY workspaces actually owned by this user
    const { data: ownedWorkspaces } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', userId);

    const ownedWorkspaceIds = Array.from(
      new Set((ownedWorkspaces || []).map((w: any) => w.id).filter(Boolean))
    );

    // 1b. Block deletion with 409 if any owned workspace has other active members
    if (ownedWorkspaceIds.length > 0) {
      const { data: workspaceMembers } = await supabaseAdmin
        .from('workspace_members')
        .select('workspace_id, user_id, status')
        .in('workspace_id', ownedWorkspaceIds);

      const otherMembers = Array.isArray(workspaceMembers)
        ? workspaceMembers.filter(
            (m: { user_id?: string | null; status?: string | null }) =>
              Boolean(m?.user_id) &&
              m.user_id !== userId &&
              (!m.status || m.status === 'active')
          )
        : [];

      if (otherMembers.length > 0) {
        return NextResponse.json(
          {
            error:
              'Transfer workspace ownership or remove other active team members before deleting your account.',
            code: 'WORKSPACE_HAS_ACTIVE_MEMBERS',
          },
          { status: 409 }
        );
      }
    }

    // 1c. Best-effort cancel any active paid Cashfree subscription for owned workspaces
    for (const wsId of ownedWorkspaceIds) {
      try {
        const sub = await getWorkspaceSubscription(wsId);
        if (sub && sub.status !== 'cancelled') {
          await cancelSubscription(wsId, true);
        }
      } catch (subErr) {
        logger.warn('Non-fatal subscription cancellation warning during account deletion', {
          error: subErr,
          workspaceId: wsId,
          userId,
        });
      }
    }

    // 2. Best-effort cleanup of R2 media & avatar objects
    const r2AccountId = config.CF_R2_ACCOUNT_ID || process.env.CF_R2_ACCOUNT_ID;
    const r2AccessKeyId = config.CF_R2_ACCESS_KEY_ID || process.env.CF_R2_ACCESS_KEY_ID;
    const r2SecretKey = config.CF_R2_SECRET_ACCESS_KEY || process.env.CF_R2_SECRET_ACCESS_KEY;
    const mediaBucket = process.env.CF_R2_MEDIA_BUCKET_NAME || config.CF_R2_BUCKET_NAME;
    const avatarsBucket = process.env.CF_R2_AVATARS_BUCKET_NAME || config.CF_R2_BUCKET_NAME;

    if (r2AccountId && r2AccessKeyId && r2SecretKey) {
      try {
        const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const s3 = new S3Client({
          region: 'auto',
          endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: r2AccessKeyId,
            secretAccessKey: r2SecretKey,
          },
        });

        if (mediaBucket && ownedWorkspaceIds.length > 0) {
          const { data: mediaRows } = await supabaseAdmin
            .from('media_uploads')
            .select('storage_key, url')
            .in('workspace_id', ownedWorkspaceIds);

          if (mediaRows && mediaRows.length > 0) {
            await Promise.allSettled(
              mediaRows.map(async (row: any) => {
                const key =
                  row.storage_key ||
                  (typeof row.url === 'string' ? row.url.split('/').slice(-2).join('/') : null);
                if (key) {
                  await s3.send(new DeleteObjectCommand({ Bucket: mediaBucket, Key: key }));
                }
              })
            );
          }

          await deleteByPrefix(s3, mediaBucket, `materials/${userId}-`);
          for (const wsId of ownedWorkspaceIds) {
            await deleteByPrefix(s3, mediaBucket, `brand-materials/${wsId}/`);
          }
        }

        if (avatarsBucket) {
          await deleteByPrefix(s3, avatarsBucket, `avatars/${userId}-`);
        }
      } catch (r2Err) {
        logger.warn('Non-fatal R2 cleanup warning during account deletion', { error: r2Err, userId });
      }
    }

    // 3. Try atomic RPC deletion first (if migration is applied)
    for (const targetWsId of ownedWorkspaceIds) {
      try {
        await supabaseAdmin.rpc('delete_workspace_data', {
          target_workspace_id: targetWsId,
          target_user_id: userId,
        });
      } catch {
        // Fallback to explicit table-by-table deletion below
      }
    }

    // 4. Explicit dependency-ordered purge across all owned workspace & user tables
    const workspaceScopedTables = [
      'instagram_comment_logs',
      'instagram_dm_logs',
      'instagram_flagged_comments',
      'instagram_flagged_dms',
      'instagram_outbound_jobs',
      'instagram_reply_velocity',
      'instagram_automation_config',
      'facebook_comment_logs',
      'facebook_dm_logs',
      'facebook_automation_config',
      'threads_comment_logs',
      'threads_automation_config',
      'brand_materials_pages',
      'follow_gate_sessions',
      'follow_gates',
      'analytics_events',
      'workspace_security_events',
      'api_keys',
      'api_calls',
      'ai_usage',
      'content_arcs',
      'media_uploads',
      'posts',
      'platform_connections',
      'profiles',
      'subscriptions',
      'payment_orders',
      'workspace_members',
    ];

    const tableErrors: Array<{ table: string; message: string }> = [];

    if (ownedWorkspaceIds.length > 0) {
      for (const table of workspaceScopedTables) {
        try {
          const { error } = await supabaseAdmin
            .from(table)
            .delete()
            .in('workspace_id', ownedWorkspaceIds);
          if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
            tableErrors.push({ table, message: error.message });
          }
        } catch (err) {
          logger.warn(`Table cleanup warning for ${table}`, { error: err });
        }
      }
    }

    // User-scoped tables (note: referrals column is referrer_user_id in schema; keep safe fallback)
    const userScopedTables: Array<{ table: string; column: string }> = [
      { table: 'platform_connections', column: 'user_id' },
      { table: 'profiles', column: 'user_id' },
      { table: 'onboarding_checklists', column: 'user_id' },
      { table: 'referral_rewards', column: 'user_id' },
      { table: 'user_section_time', column: 'user_id' },
      { table: 'user_preferences', column: 'user_id' },
      { table: 'user_credentials', column: 'user_id' },
      { table: 'referrals', column: 'referrer_user_id' },
      { table: 'referrals', column: 'referred_user_id' },
      { table: 'referral_codes', column: 'user_id' },
      { table: 'subscriptions', column: 'user_id' },
      { table: 'payment_orders', column: 'user_id' },
      { table: 'workspace_members', column: 'user_id' },
      { table: 'users', column: 'id' },
    ];

    for (const { table, column } of userScopedTables) {
      try {
        const { error } = await supabaseAdmin.from(table).delete().eq(column, userId);
        if (error && error.code !== '42P01' && error.code !== 'PGRST205' && error.code !== '42703') {
          tableErrors.push({ table: `${table}.${column}`, message: error.message });
        }
      } catch (err) {
        logger.warn(`User table cleanup warning for ${table}.${column}`, { error: err });
      }
    }

    // Delete owned workspaces
    const { error: wsDeleteErr } = await supabaseAdmin
      .from('workspaces')
      .delete()
      .eq('owner_id', userId);
    if (wsDeleteErr && wsDeleteErr.code !== '42P01') {
      tableErrors.push({ table: 'workspaces', message: wsDeleteErr.message });
    }

    // 5. Delete the Supabase Auth user last
    const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteErr) {
      logger.error('Failed to delete auth user during GDPR erasure', {
        userId,
        workspaceId,
        error: new Error(authDeleteErr.message),
        tableErrors,
      });
      return NextResponse.json(
        { error: 'Failed to complete auth user deletion.', details: authDeleteErr.message },
        { status: 500 }
      );
    }

    logger.info('User account and workspace data completely deleted (GDPR/DPDP erasure)', {
      userId,
      workspaceId,
      purgedWorkspaces: ownedWorkspaceIds.length,
      nonFatalWarnings: tableErrors.length,
    });

    const response = NextResponse.json({
      deleted: true,
      purgedWorkspaces: ownedWorkspaceIds.length,
    });
    for (const cookie of request.cookies.getAll()) {
      if (
        cookie.name.startsWith('sb-') ||
        cookie.name === 'active_workspace_id' ||
        cookie.name === 'impersonating' ||
        cookie.name === 'impersonated_as' ||
        cookie.name === 'admin_session'
      ) {
        response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
      }
    }
    return response;
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

