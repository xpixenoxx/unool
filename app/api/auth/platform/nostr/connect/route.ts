import { NextRequest, NextResponse } from "next/server";
import { nostrAdapter } from "@/lib/platforms/NostrAdapter";
import { encryptToken } from "@/lib/crypto/encryption";
import { SupabasePlatformRepository } from "@/lib/repositories/supabase/SupabasePlatformRepository";
import { resolvePlatformConnectContext, enforceCustomChannelQuota, validateHttpsWebhookUrl } from "@/lib/auth/platform-connect";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const platformRepo = new SupabasePlatformRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, npub, workspaceId: bodyWorkspaceId } = body;

    if (!webhookUrl || !npub) {
      return NextResponse.json(
        { error: "webhookUrl and npub are required" },
        { status: 400 },
      );
    }

    const resolved = await resolvePlatformConnectContext(request, bodyWorkspaceId, { skipQuotaCheck: true });
    if ("error" in resolved) return resolved.error;
    const { userId, workspaceId } = resolved.context;

    const webhookCheck = await validateHttpsWebhookUrl(webhookUrl);
    if (!webhookCheck.ok) {
      return NextResponse.json({ error: webhookCheck.error }, { status: 400 });
    }

    const tokenPayload = JSON.stringify({ webhookUrl: webhookCheck.url, npub });

    // Validate credentials & fetch profile (simulated for webhooks)
    let profile;
    try {
      profile = await nostrAdapter.getUserProfile(tokenPayload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn("Nostr connect: login failed", { errMsg });

      return NextResponse.json(
        {
          error:
            "Could not connect Nostr account. Please check your details.",
        },
        { status: 400 },
      );
    }

    const quotaErr = await enforceCustomChannelQuota(request, resolved.context, "nostr", profile.platformUserId);
    if (quotaErr) return quotaErr;

    // Encrypt the token payload for storage
    const encryptedToken = await encryptToken(tokenPayload);

    // Upsert platform connection
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: "nostr",
      platformUserId: profile.platformUserId,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      accessToken: encryptedToken,
      refreshToken: "", // not used
      expiresAt: undefined, // no expiration
      scopes: [],
    });

    logger.info("Nostr connected successfully", { workspaceId });

    return NextResponse.json({
      success: true,
      platform: "nostr",
      username: profile.username,
      displayName: profile.displayName,
    });
  } catch (error) {
    const errorDetails =
      error instanceof Error ? error.message : JSON.stringify(error);
    logger.error("Nostr connect: unexpected error", { errorDetails });
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${errorDetails}. Please try again.`,
      },
      { status: 500 },
    );
  }
}
