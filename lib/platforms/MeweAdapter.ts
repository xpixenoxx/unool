import { logger } from "@/lib/logger";
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from "./adapter";

export class MeweAdapter implements PlatformAdapter {
  readonly platform = "mewe" as const;

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
    throw new Error("Using custom connection for MeWe (Webhook logic)");
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
      platformUserId: username || "mewe_user",
      username: username || "mewe",
      displayName: username || "MeWe User",
      profileUrl: `https://mewe.com/i/${username || ""}`,
      avatarUrl: "",
    };
  }

  async publish(
    tokenData: string,
    input: PublishInput,
  ): Promise<PublishResult> {
    const { webhookUrl, username } = this.parseToken(tokenData);

    if (!webhookUrl) {
      throw new Error("MeWe Webhook URL is required to publish.");
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
        throw new Error(`MeWe webhook request failed: ${res.statusText}`);
      }

      const messageId = `mewe-${Date.now()}`;

      return {
        platformPostId: messageId,
        platformUrl: `https://mewe.com/i/${username || ""}`,
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error("Failed to post to MeWe webhook", {
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw new Error("Failed to post to MeWe webhook");
    }
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    logger.info("MeWe webhook delete requested", { platformPostId });
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
      throw new Error("Invalid MeWe token format");
    }
  }
}

export const meweAdapter = new MeweAdapter();
