import { logger } from "@/lib/logger";
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from "./adapter";

export class WarpcastAdapter implements PlatformAdapter {
  readonly platform = "warpcast" as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: "",
    clientSecret: "",
    redirectUri: "",
    scopes: [],
  };

  getAuthUrl(_state: string): string {
    return "";
  }

  async exchangeCodeForToken(_code: string): Promise<TokenResponse> {
    throw new Error("Using custom connection for Farcaster (Webhook logic)");
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: _refreshToken,
      expiresIn: 0,
    };
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const { webhookUrl, username } = this.parseToken(tokenData);

    return {
      platformUserId: username || "warpcast_user",
      username: username || "warpcast",
      displayName: username || "Farcaster User",
      profileUrl: `https://warpcast.com/${username || ""}`,
      avatarUrl: "",
    };
  }

  async publish(
    tokenData: string,
    input: PublishInput,
  ): Promise<PublishResult> {
    const { webhookUrl, username } = this.parseToken(tokenData);

    if (!webhookUrl) {
      throw new Error("Farcaster Webhook URL is required to publish.");
    }

    const payload: Record<string, unknown> = {
      content: input.content,
      username,
    };

    if (input.mediaUrls && input.mediaUrls.length > 0) {
      payload.mediaUrls = input.mediaUrls;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Farcaster webhook request failed: ${res.statusText}`);
      }

      const messageId = `warpcast-${Date.now()}`;

      return {
        platformPostId: messageId,
        platformUrl: `https://warpcast.com/${username || ""}`,
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error("Failed to post to Farcaster webhook", {
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw new Error("Failed to post to Farcaster webhook");
    }
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    logger.info("Farcaster webhook delete requested", { platformPostId });
  }

  async getEngagement(
    _tokenData: string,
    _platformPostId: string,
  ): Promise<Record<string, unknown>> {
    return {};
  }

  private parseToken(tokenData: string): {
    webhookUrl: string;
    username: string;
  } {
    try {
      return JSON.parse(tokenData);
    } catch {
      throw new Error("Invalid Farcaster token format");
    }
  }
}

export const warpcastAdapter = new WarpcastAdapter();
