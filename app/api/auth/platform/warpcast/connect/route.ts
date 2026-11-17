import { NextRequest, NextResponse } from "next/server";
import { warpcastAdapter } from "@/lib/platforms/WarpcastAdapter";
import { encryptToken } from "@/lib/crypto/encryption";
import { SupabasePlatformRepository } from "@/lib/repositories/supabase/SupabasePlatformRepository";
import { resolvePlatformConnectContext, validateHttpsWebhookUrl } from "@/lib/auth/platform-connect";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const platformRepo = new SupabasePlatformRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, username, workspaceId: bodyWorkspaceId } = body;

    if (!webhookUrl || !username) {
      return NextResponse.json(
        { error: "webhookUrl and username are required" },
        { status: 400 },
      );
    }

    const resolved = await resolvePlatformConnectContext(request, bodyWorkspaceId);
    if ("error" in resolved) return resolved.error;
    const { userId, workspaceId } = resolved.context;

    const webhookCheck = await validateHttpsWebhookUrl(webhookUrl);
    if (!webhookCheck.ok) {
      return NextResponse.json({ error: webhookCheck.error }, { status: 400 });
    }

    const tokenPayload = JSON.stringify({ webhookUrl: webhookCheck.url, username });

    // Validate credentials & fetch profile (simulated for webhooks)
    let profile;
    try {
      profile = await warpcastAdapter.getUserProfile(tokenPayload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn("Warpcast connect: login failed", { errMsg });

      return NextResponse.json(
        {
          error:
            "Could not connect Farcaster account. Please check your details.",
        },
        { status: 400 },
      );
    }

    // Encrypt the token payload for storage
    const encryptedToken = await encryptToken(tokenPayload);

    // Upsert platform connection
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: "warpcast",
      platformUserId: profile.platformUserId,
      username: profile.username,
      accessToken: encryptedToken,
      refreshToken: "", // not used
      expiresAt: undefined, // no expiration
      scopes: [],
    });

    logger.info("Farcaster connected successfully", { workspaceId });

    return NextResponse.json({
      success: true,
      platform: "warpcast",
      username: profile.username,
      displayName: profile.displayName,
    });
  } catch (error) {
    const errorDetails =
      error instanceof Error ? error.message : JSON.stringify(error);
    logger.error("Warpcast connect: unexpected error", { errorDetails });
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${errorDetails}. Please try again.`,
      },
      { status: 500 },
    );
  }
}
