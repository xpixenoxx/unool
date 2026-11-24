import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import crypto from 'crypto';
import { getCurrentAuth } from '@/lib/auth/server';
import { requireWorkspaceRole } from '@/lib/auth/workspaceAccess';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { getPlanContext } from '@/lib/middleware/plan-enforcement-middleware';
import { CustomDomainSchema } from '@/lib/validation/profileSchemas';
import {
  checkCustomDomainCname,
  getCloudflareCustomHostnameStatus,
  provisionCloudflareCustomHostname,
  removeCloudflareCustomHostname,
  verifyCustomDomainTxtRecord,
  type CustomDomainSslStatus,
} from '@/lib/domains/cloudflareCustomDomains';
import { logger } from '@/lib/logger';

const profileRepository = new SupabaseProfileRepository();

function getCnameTarget(): string {
  return (process.env.CUSTOM_DOMAIN_CNAME_TARGET || 'cname.unool.co').trim();
}

function buildTxtRecordValue(token: string): string {
  return `unool-verify=${token}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [profile, planCtx] = await Promise.all([
      profileRepository.findByWorkspaceId(auth.workspaceId),
      getPlanContext(auth.userId, auth.workspaceId).catch(() => null),
    ]);

    const allowed = Boolean(planCtx?.features?.custom_domain);
    const domain = profile?.customDomain || null;
    const token = profile?.customDomainVerificationToken || null;
    const verified = Boolean(domain && profile?.customDomainVerifiedAt);
    const cnameTarget = getCnameTarget();

    let sslStatus: CustomDomainSslStatus = verified ? 'dns_only' : 'unverified';
    if (domain) {
      const cfInfo = await getCloudflareCustomHostnameStatus(domain);
      if (cfInfo) {
        sslStatus = cfInfo.sslStatus;
      }
    }

    return NextResponse.json({
      allowed,
      customDomain: domain,
      verified,
      verifiedAt: profile?.customDomainVerifiedAt || null,
      txtRecordName: domain ? `_unool-challenge.${domain}` : null,
      txtRecordValue: token ? buildTxtRecordValue(token) : null,
      cnameTarget,
      sslStatus,
    });
  } catch (error) {
    logger.error('Failed to read custom domain settings', { error });
    return NextResponse.json({ error: 'Failed to load custom domain settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner', 'admin', 'editor']);
    if (!roleCheck.allowed) {
      return NextResponse.json(
        { error: 'Insufficient workspace permissions to configure custom domains.' },
        { status: 403 }
      );
    }

    const planCtx = await getPlanContext(auth.userId, auth.workspaceId).catch(() => null);
    if (!planCtx?.features?.custom_domain) {
      return NextResponse.json(
        {
          error: 'Custom domains are available on Pro and Studio plans.',
          code: 'PLAN_UPGRADE_REQUIRED',
          upgradeUrl: '/dashboard/billing',
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = CustomDomainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid custom domain' },
        { status: 400 }
      );
    }

    const cleanDomain = parsed.data.domain;
    if (cleanDomain === 'unool.co' || cleanDomain.endsWith('.unool.co')) {
      return NextResponse.json(
        { error: 'Use your own external domain (unool.co subdomains are claimed above).' },
        { status: 400 }
      );
    }

    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);
    if (!profile) {
      return NextResponse.json({ error: 'Create your profile before adding a custom domain' }, { status: 404 });
    }

    // If changing away from a previous custom domain, clean up old Cloudflare hostname best-effort
    if (profile.customDomain && profile.customDomain !== cleanDomain) {
      await removeCloudflareCustomHostname(profile.customDomain).catch(() => false);
    }

    const existingOwner = await profileRepository.findByCustomDomain?.(cleanDomain);
    if (existingOwner && existingOwner.id !== profile.id) {
      return NextResponse.json({ error: 'This domain is already connected to another workspace' }, { status: 409 });
    }

    const token = crypto.randomBytes(12).toString('hex');
    const updated = await profileRepository.update(
      profile.id,
      {
        customDomain: cleanDomain,
        customDomainVerifiedAt: null,
        customDomainVerificationToken: token,
      },
      profile.version
    );

    // Pre-provision Cloudflare for SaaS Custom Hostname so edge TLS cert starts initializing as soon as CNAME resolves
    const cfHostname = await provisionCloudflareCustomHostname(cleanDomain);
    const cnameTarget = getCnameTarget();

    return NextResponse.json({
      success: true,
      customDomain: updated.customDomain,
      verified: false,
      txtRecordName: `_unool-challenge.${cleanDomain}`,
      txtRecordValue: buildTxtRecordValue(token),
      cnameTarget,
      sslStatus: cfHostname?.sslStatus || 'unverified',
    });
  } catch (error) {
    logger.error('Failed to save custom domain', { error });
    return NextResponse.json({ error: 'Failed to save custom domain' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner', 'admin', 'editor']);
    if (!roleCheck.allowed) {
      return NextResponse.json(
        { error: 'Insufficient workspace permissions to verify custom domains.' },
        { status: 403 }
      );
    }

    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);
    if (!profile || !profile.customDomain || !profile.customDomainVerificationToken) {
      return NextResponse.json({ error: 'No custom domain configured for verification' }, { status: 400 });
    }

    const expectedTxt = buildTxtRecordValue(profile.customDomainVerificationToken);
    const challengeHost = `_unool-challenge.${profile.customDomain}`;
    const cnameTarget = getCnameTarget();

    const [txtMatches, cnameVerified] = await Promise.all([
      verifyCustomDomainTxtRecord(profile.customDomain, expectedTxt),
      checkCustomDomainCname(profile.customDomain, cnameTarget),
    ]);

    if (!txtMatches) {
      return NextResponse.json(
        {
          verified: false,
          cnameVerified,
          error: `TXT record "${expectedTxt}" was not found at ${challengeHost}. DNS changes can take a few minutes to propagate.`,
        },
        { status: 422 }
      );
    }

    const cfHostname = await provisionCloudflareCustomHostname(profile.customDomain);
    const verifiedAt = new Date().toISOString();
    const updated = await profileRepository.update(
      profile.id,
      { customDomainVerifiedAt: verifiedAt },
      profile.version
    );

    try {
      if (updated.subdomain) {
        revalidateTag(`profile:${updated.subdomain}`);
        revalidatePath(`/u/${updated.subdomain}`);
      }
    } catch {
      // Safe no-op in tests
    }

    return NextResponse.json({
      success: true,
      verified: true,
      cnameVerified,
      sslStatus: cfHostname?.sslStatus || 'dns_only',
      verifiedAt,
      customDomain: updated.customDomain,
    });
  } catch (error) {
    logger.error('Custom domain DNS verification failed', { error });
    return NextResponse.json({ error: 'Verification check failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner', 'admin', 'editor']);
    if (!roleCheck.allowed) {
      return NextResponse.json(
        { error: 'Insufficient workspace permissions to disconnect custom domains.' },
        { status: 403 }
      );
    }

    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.customDomain) {
      await removeCloudflareCustomHostname(profile.customDomain).catch(() => false);
    }

    await profileRepository.update(
      profile.id,
      {
        customDomain: null,
        customDomainVerifiedAt: null,
        customDomainVerificationToken: null,
      },
      profile.version
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to disconnect custom domain', { error });
    return NextResponse.json({ error: 'Failed to remove custom domain' }, { status: 500 });
  }
}
