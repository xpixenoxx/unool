import { logger } from "@/lib/logger";
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from "./adapter";

export class NostrAdapter implements PlatformAdapter {
  readonly platform = "nostr" as const;

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
    throw new Error("Using custom connection for Nostr (Webhook logic)");
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: _refreshToken,
      expiresIn: 0,
    };
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const { webhookUrl, npub, username } = this.parseToken(tokenData);
    
    // Nostr usually uses npub to identify users
    const identifier = npub || username || "nostr_user";

    return {
      platformUserId: identifier,
      username: identifier,
      displayName: identifier,
      profileUrl: `https://njump.me/${identifier}`,
      avatarUrl: "",
    };
  }

  async publish(
    tokenData: string,
    input: PublishInput,
  ): Promise<PublishResult> {
    const { webhookUrl, npub, username } = this.parseToken(tokenData);

    if (!webhookUrl) {
      throw new Error("Nostr Webhook/Relay Gateway URL is required to publish.");
    }
    
    const identifier = npub || username;

    const payload: Record<string, unknown> = {
      content: input.content,
      npub: identifier,
      username: identifier, // fallback for consistency
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
        throw new Error(`Nostr webhook request failed: ${res.statusText}`);
      }

      const messageId = `nostr-${Date.now()}`;

      return {
        platformPostId: messageId,
        platformUrl: `https://njump.me/${messageId}`,
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error("Failed to post to Nostr webhook", {
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw new Error("Failed to post to Nostr webhook");
    }
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    logger.info("Nostr webhook delete requested", { platformPostId });
  }

  async getEngagement(
    _tokenData: string,
    _platformPostId: string,
  ): Promise<Record<string, unknown>> {
    return {};
  }

  private parseToken(tokenData: string): {
    webhookUrl: string;
    npub?: string;
    username?: string;
  } {
    try {
      return JSON.parse(tokenData);
    } catch {
      throw new Error("Invalid Nostr token format");
    }
  }
}

export const nostrAdapter = new NostrAdapter();
