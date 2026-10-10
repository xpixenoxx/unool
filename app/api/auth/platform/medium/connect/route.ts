import { NextRequest, NextResponse } from "next/server";
import { mediumAdapter } from "@/lib/platforms/MediumAdapter";
import { encryptToken } from "@/lib/crypto/encryption";
import { SupabasePlatformRepository } from "@/lib/repositories/supabase/SupabasePlatformRepository";
import { getAuthContext } from "@/lib/auth/context";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const platformRepo = new SupabasePlatformRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { integrationToken, workspaceId: bodyWorkspaceId } = body;

    if (!integrationToken) {
      return NextResponse.json(
        { error: "Integration Token is required" },
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

    // Validate credentials & fetch profile
    let profile;
    try {
      profile = await mediumAdapter.getUserProfile(integrationToken);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn("Medium connect: login failed", { errMsg });

      return NextResponse.json(
        {
          error:
            "Could not connect Medium account. Please check your token.",
        },
        { status: 400 },
      );
    }

    // Encrypt the token for storage
    const encryptedToken = await encryptToken(integrationToken);

    // Upsert platform connection
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: "medium",
      platformUserId: profile.platformUserId,
      username: profile.username || profile.displayName || "Medium",
      accessToken: encryptedToken,
      refreshToken: "", // not used
      expiresAt: undefined, // no expiration
      scopes: [],
    });

    logger.info("Medium connected successfully", { workspaceId });

    return NextResponse.json({
      success: true,
      platform: "medium",
      username: profile.username || profile.displayName,
      displayName: profile.displayName,
    });
  } catch (error) {
    const errorDetails =
      error instanceof Error ? error.message : JSON.stringify(error);
    logger.error("Medium connect: unexpected error", { errorDetails });
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${errorDetails}. Please try again.`,
      },
      { status: 500 },
    );
  }
}
