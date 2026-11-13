import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';

/**
 * DELETE /api/user/delete
 *
 * GDPR Article 17 & DPDP Act 2023 — Right to Erasure ("Right to be Forgotten").
 * Completely purges all workspace and user records across all 24+ tables,
 * deletes associated Cloudflare R2 media objects, and removes the Supabase Auth user.
 */
export async function DELETE(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, workspaceId } = auth;

  try {
    // 1. Identify all workspaces owned by this user
    const { data: ownedWorkspaces } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', userId);

    const ownedWorkspaceIds = Array.from(
      new Set([
        ...(ownedWorkspaces || []).map((w: any) => w.id),
        ...(workspaceId ? [workspaceId] : []),
      ])
    );

    // 2. Best-effort cleanup of R2 media objects for owned workspaces
    if (
      ownedWorkspaceIds.length > 0 &&
      config.CF_R2_ACCOUNT_ID &&
      config.CF_R2_ACCESS_KEY_ID &&
      config.CF_R2_SECRET_ACCESS_KEY &&
      config.CF_R2_BUCKET_NAME
    ) {
      try {
        const { data: mediaRows } = await supabaseAdmin
          .from('media_uploads')
          .select('storage_key, url')
          .in('workspace_id', ownedWorkspaceIds);

        if (mediaRows && mediaRows.length > 0) {
          const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
          const s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${config.CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId: config.CF_R2_ACCESS_KEY_ID,
              secretAccessKey: config.CF_R2_SECRET_ACCESS_KEY,
            },
          });

          await Promise.allSettled(
            mediaRows.map(async (row: any) => {
              const key = row.storage_key || (typeof row.url === 'string' ? row.url.split('/').slice(-2).join('/') : null);
              if (key) {
                await s3.send(new DeleteObjectCommand({ Bucket: config.CF_R2_BUCKET_NAME!, Key: key }));
              }
            })
          );
        }
      } catch (r2Err) {
        logger.warn('Non-fatal R2 media cleanup warning during account deletion', { error: r2Err, userId });
      }
    }

    // 2b. Best-effort cleanup of R2 brand-materials objects for owned workspaces (B-16)
    if (
      ownedWorkspaceIds.length > 0 &&
      config.CF_R2_ACCOUNT_ID &&
      config.CF_R2_ACCESS_KEY_ID &&
      config.CF_R2_SECRET_ACCESS_KEY &&
      config.CF_R2_BUCKET_NAME
    ) {
      try {
        const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const s3 = new S3Client({
          region: 'auto',
          endpoint: `https://${config.CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: config.CF_R2_ACCESS_KEY_ID,
            secretAccessKey: config.CF_R2_SECRET_ACCESS_KEY,
          },
        });

        for (const wsId of ownedWorkspaceIds) {
          const prefix = `brand-materials/${wsId}/`;
          let continuationToken: string | undefined;
          do {
            const listRes = await s3.send(new ListObjectsV2Command({
              Bucket: config.CF_R2_BUCKET_NAME!,
              Prefix: prefix,
              ContinuationToken: continuationToken,
            }));
            const keys = (listRes.Contents || []).map((o: any) => o.Key).filter(Boolean);
            await Promise.allSettled(
              keys.map((key: string) =>
                s3.send(new DeleteObjectCommand({ Bucket: config.CF_R2_BUCKET_NAME!, Key: key }))
              )
            );
            continuationToken = listRes.IsTruncated ? listRes.NextContinuationToken : undefined;
          } while (continuationToken);
        }
      } catch (r2BmErr) {
        logger.warn('Non-fatal R2 brand-materials cleanup warning during account deletion', { error: r2BmErr, userId });
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

    // 4. Explicit dependency-ordered purge across all workspace & user tables
    const workspaceScopedTables = [
      'instagram_comment_logs',
      'instagram_dm_logs',
      'instagram_flagged_comments',
      'instagram_flagged_dms',
      'instagram_outbound_jobs',
      'instagram_reply_velocity',
      'instagram_automation_config',
      'brand_materials_pages',
      'follow_gate_sessions',
      'follow_gates',
      'analytics_events',
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

    // User-scoped tables
    const userScopedTables: Array<{ table: string; column: string }> = [
      { table: 'platform_connections', column: 'user_id' },
      { table: 'profiles', column: 'user_id' },
      { table: 'onboarding_checklists', column: 'user_id' },
      { table: 'referrals', column: 'referrer_id' },
      { table: 'referrals', column: 'referred_user_id' },
      { table: 'referral_codes', column: 'user_id' },
      { table: 'subscriptions', column: 'user_id' },
      { table: 'payment_orders', column: 'user_id' },
      { table: 'workspace_members', column: 'user_id' },
    ];

    for (const { table, column } of userScopedTables) {
      try {
        const { error } = await supabaseAdmin.from(table).delete().eq(column, userId);
        if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
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

    return NextResponse.json({
      deleted: true,
      purgedWorkspaces: ownedWorkspaceIds.length,
    });
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

