import { NextRequest, NextResponse } from "next/server";
import { meweAdapter } from "@/lib/platforms/MeweAdapter";
import { encryptToken } from "@/lib/crypto/encryption";
import { SupabasePlatformRepository } from "@/lib/repositories/supabase/SupabasePlatformRepository";
import { getAuthContext } from "@/lib/auth/context";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const platformRepo = new SupabasePlatformRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      appId,
      apiKey,
      clientSecret,
      accessToken,
      username,
      webhookUrl,
      workspaceId: bodyWorkspaceId,
    } = body;

    const resolvedAppId = (appId || clientId || "").trim();
    const resolvedApiKey = (apiKey || clientSecret || "").trim();
    const resolvedClientId = (clientId || appId || "").trim();
    const resolvedAccessToken = (accessToken || "").trim();
    const resolvedUsername = (username || "").trim();
    const resolvedWebhookUrl = (webhookUrl || "").trim();

    // Validate that either official developer credentials or legacy webhookUrl is provided
    if (!resolvedAppId && !resolvedApiKey && !resolvedAccessToken && !resolvedWebhookUrl) {
      return NextResponse.json(
        {
          error:
            "MeWe Developer credentials required: Please provide App ID (X-App-Id) and API Key/Secret.",
        },
        { status: 400 },
      );
    }

    if (!resolvedWebhookUrl && (!resolvedAppId || (!resolvedApiKey && !resolvedAccessToken))) {
      return NextResponse.json(
        {
          error:
            "MeWe connection requires both App ID and an API Key/Secret or Access Token.",
        },
        { status: 400 },
      );
    }

    let workspaceId = bodyWorkspaceId;
    let userId = "";

    const authCtx = await getAuthContext();
    if (authCtx) {
      workspaceId = workspaceId || authCtx.workspaceId;
      userId = authCtx.userId;
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokenPayload = JSON.stringify({
      clientId: resolvedClientId,
      appId: resolvedAppId,
      apiKey: resolvedApiKey,
      clientSecret: resolvedApiKey,
      accessToken: resolvedAccessToken || undefined,
      username: resolvedUsername || undefined,
      webhookUrl: resolvedWebhookUrl || undefined,
    });

    // Validate credentials & fetch profile
    let profile;
    try {
      profile = await meweAdapter.getUserProfile(tokenPayload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn("MeWe connect: credentials verification failed", { errMsg });

      return NextResponse.json(
        {
          error: `Could not verify MeWe credentials: ${errMsg}`,
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
      platform: "mewe",
      platformUserId: profile.platformUserId,
      username: profile.username,
      accessToken: encryptedToken,
      refreshToken: "",
      expiresAt: undefined,
      scopes: ["post_content", "user_profile"],
    });

    logger.info("MeWe connected successfully", {
      workspaceId,
      username: profile.username,
    });

    return NextResponse.json({
      success: true,
      platform: "mewe",
      username: profile.username,
      displayName: profile.displayName,
    });
  } catch (error) {
    const errorDetails =
      error instanceof Error ? error.message : JSON.stringify(error);
    logger.error("MeWe connect: unexpected error", { errorDetails });
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${errorDetails}. Please try again.`,
      },
      { status: 500 },
    );
  }
}
