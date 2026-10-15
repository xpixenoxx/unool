import { config } from "@/lib/config/schema";
import { logger } from "@/lib/logger";
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from "./adapter";

export interface MeweCredentials {
  clientId?: string;
  appId: string;
  apiKey: string;
  clientSecret?: string;
  accessToken?: string;
  username?: string;
  webhookUrl?: string; // backwards compatibility fallback
}

const MEWE_API_BASE = "https://mewe.com";

/**
 * MeweAdapter
 *
 * Implements integration with the official MeWe Developer API using
 * Client ID, App ID (X-App-Id header), and API Key / Secret (X-Api-Key / Bearer token).
 * Documentation: https://mewe.com/developer
 */
export class MeweAdapter implements PlatformAdapter {
  readonly platform = "mewe" as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.MEWE_CLIENT_ID || process.env.MEWE_CLIENT_ID || "",
    clientSecret:
      config.MEWE_API_KEY ||
      config.MEWE_CLIENT_SECRET ||
      process.env.MEWE_API_KEY ||
      process.env.MEWE_CLIENT_SECRET ||
      "",
    redirectUri:
      config.MEWE_REDIRECT_URI ||
      `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`,
    scopes: ["post_content", "user_profile"],
  };

  /**
   * Generates OAuth authorize URL if OAuth client credentials are configured.
   * If not configured, returns empty string so that Unool redirects to the custom connect modal.
   */
  getAuthUrl(state: string): string {
    if (!this.authConfig.clientId) {
      return "";
    }
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      response_type: "code",
      scope: this.authConfig.scopes.join(" "),
      state,
    });
    return `${MEWE_API_BASE}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchanges an OAuth authorization code for tokens if using MeWe OAuth.
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    if (!this.authConfig.clientId || !this.authConfig.clientSecret) {
      throw new Error(
        "MeWe OAuth requires MEWE_CLIENT_ID and MEWE_API_KEY/SECRET environment variables",
      );
    }

    const res = await fetch(`${MEWE_API_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-App-Id":
          config.MEWE_APP_ID || process.env.MEWE_APP_ID || this.authConfig.clientId,
        "X-Api-Key": this.authConfig.clientSecret,
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.authConfig.clientId,
        client_secret: this.authConfig.clientSecret,
        redirect_uri: this.authConfig.redirectUri,
        code,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error("MeWe token exchange failed", {
        status: res.status,
        errText,
      });
      throw new Error(`MeWe token exchange failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const tokenPayload: MeweCredentials = {
      clientId: this.authConfig.clientId,
      appId:
        config.MEWE_APP_ID || process.env.MEWE_APP_ID || this.authConfig.clientId,
      apiKey: this.authConfig.clientSecret,
      clientSecret: this.authConfig.clientSecret,
      accessToken: data.access_token || data.apiToken || data.token,
    };

    return {
      accessToken: JSON.stringify(tokenPayload),
      refreshToken: data.refresh_token || "",
      expiresIn: data.expires_in || 0,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: refreshToken,
      expiresIn: 0,
    };
  }

  /**
   * Parses credentials from the encrypted token payload.
   */
  parseToken(tokenData: string): MeweCredentials {
    try {
      const parsed = JSON.parse(tokenData);
      if (typeof parsed === "object" && parsed !== null) {
        const appId =
          parsed.appId ||
          parsed.clientId ||
          config.MEWE_APP_ID ||
          process.env.MEWE_APP_ID ||
          "";
        const apiKey =
          parsed.apiKey ||
          parsed.clientSecret ||
          config.MEWE_API_KEY ||
          process.env.MEWE_API_KEY ||
          "";

        return {
          clientId:
            parsed.clientId ||
            config.MEWE_CLIENT_ID ||
            process.env.MEWE_CLIENT_ID ||
            appId,
          appId,
          apiKey,
          clientSecret: parsed.clientSecret || apiKey,
          accessToken: parsed.accessToken || "",
          username: parsed.username || "",
          webhookUrl: parsed.webhookUrl || "",
        };
      }
    } catch {
      // If a single access token string was provided
      return {
        clientId: config.MEWE_CLIENT_ID || process.env.MEWE_CLIENT_ID || "",
        appId: config.MEWE_APP_ID || process.env.MEWE_APP_ID || "",
        apiKey: config.MEWE_API_KEY || process.env.MEWE_API_KEY || "",
        accessToken: tokenData.trim(),
        username: "",
      };
    }
    throw new Error("Invalid MeWe token format");
  }

  /**
   * Fetches the user profile from MeWe API using developer credentials.
   */
  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const creds = this.parseToken(tokenData);

    // Support legacy webhook format if present without credentials
    if (creds.webhookUrl && !creds.appId && !creds.apiKey && !creds.accessToken) {
      return {
        platformUserId: creds.username || "mewe_user",
        username: creds.username || "mewe",
        displayName: creds.username || "MeWe User",
        profileUrl: `https://mewe.com/i/${creds.username || ""}`,
        avatarUrl: "",
      };
    }

    const appId = creds.appId || creds.clientId;
    const apiKey = creds.apiKey || creds.clientSecret;
    const token = creds.accessToken || apiKey;

    if (!appId && !apiKey && !token) {
      throw new Error(
        "Missing MeWe credentials: App ID and API Key/Secret are required.",
      );
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (appId) headers["X-App-Id"] = appId;
    if (apiKey) headers["X-Api-Key"] = apiKey;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${MEWE_API_BASE}/api/v1/profile`, {
        method: "GET",
        headers,
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data || json.user || json;
        const username =
          data.username || creds.username || data.name || "mewe_user";
        const displayName =
          data.name ||
          [data.firstName, data.lastName].filter(Boolean).join(" ") ||
          username ||
          "MeWe User";

        return {
          platformUserId: String(data.id || data.userId || username),
          username,
          displayName,
          profileUrl:
            data.profileUrl ||
            (username ? `https://mewe.com/i/${username}` : "https://mewe.com"),
          avatarUrl: data.avatarUrl || data.pictureUrl || undefined,
        };
      }

      const errText = await res.text();
      logger.warn("MeWe profile fetch non-200", {
        status: res.status,
        errText,
      });

      // If username was manually supplied, fallback gracefully
      if (creds.username) {
        return {
          platformUserId: creds.username,
          username: creds.username,
          displayName: creds.username,
          profileUrl: `https://mewe.com/i/${creds.username}`,
          avatarUrl: "",
        };
      }

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `MeWe authentication failed (${res.status}). Please check your Client ID, App ID, and API Key/Secret.`,
        );
      }

      throw new Error(
        `MeWe API error (${res.status}): ${errText || res.statusText}`,
      );
    } catch (err) {
      if (creds.username) {
        return {
          platformUserId: creds.username,
          username: creds.username,
          displayName: creds.username,
          profileUrl: `https://mewe.com/i/${creds.username}`,
          avatarUrl: "",
        };
      }
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  /**
   * Publishes content to MeWe using official developer credentials.
   */
  async publish(
    tokenData: string,
    input: PublishInput,
  ): Promise<PublishResult> {
    const creds = this.parseToken(tokenData);

    // 1. Support legacy webhook if configured
    if (creds.webhookUrl && !creds.appId && !creds.apiKey && !creds.accessToken) {
      return this.publishViaWebhook(
        creds.webhookUrl,
        creds.username || "",
        input,
      );
    }

    // 2. Official MeWe REST API posting
    const appId = creds.appId || creds.clientId;
    const apiKey = creds.apiKey || creds.clientSecret;
    const token = creds.accessToken || apiKey;

    if (!appId) {
      throw new Error("MeWe App ID (X-App-Id) is required to publish.");
    }

    if (!input.content || !input.content.trim()) {
      throw new Error("Post content is required to publish to MeWe.");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-App-Id": appId,
    };
    if (apiKey) {
      headers["X-Api-Key"] = apiKey;
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const payload: Record<string, unknown> = {
      content: input.content,
    };

    if (input.mediaUrls && input.mediaUrls.length > 0) {
      payload.mediaUrls = input.mediaUrls;
      payload.attachments = input.mediaUrls.map((url) => ({
        type: "image",
        url,
      }));
    }

    try {
      const res = await fetch(`${MEWE_API_BASE}/api/v1/posts`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        logger.error("MeWe API post failed", { status: res.status, errText });
        throw new Error(
          `MeWe API post failed (${res.status}): ${errText || res.statusText}`,
        );
      }

      const data = await res.json();
      const messageId = String(
        data.id || data.postId || data.data?.id || `mewe-${Date.now()}`,
      );
      const postUrl =
        data.url ||
        data.postUrl ||
        data.data?.url ||
        (creds.username ? `https://mewe.com/i/${creds.username}` : "https://mewe.com");

      return {
        platformPostId: messageId,
        platformUrl: postUrl,
        publishedAt: new Date(),
      };
    } catch (err) {
      // Fallback to webhook if webhookUrl is present
      if (creds.webhookUrl) {
        logger.warn("MeWe REST API failed, trying webhook fallback", {
          error: err instanceof Error ? err.message : String(err),
        });
        return this.publishViaWebhook(
          creds.webhookUrl,
          creds.username || "",
          input,
        );
      }
      logger.error("Failed to post to MeWe", {
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    const creds = this.parseToken(tokenData);
    const appId = creds.appId || creds.clientId;
    const apiKey = creds.apiKey || creds.clientSecret;
    const token = creds.accessToken || apiKey;

    if (appId && token) {
      try {
        const res = await fetch(`${MEWE_API_BASE}/api/v1/posts/${platformPostId}`, {
          method: "DELETE",
          headers: {
            "X-App-Id": appId,
            ...(apiKey ? { "X-Api-Key": apiKey } : {}),
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          logger.warn("MeWe deletePost non-ok", { status: res.status });
        }
      } catch (err) {
        logger.error("MeWe deletePost failed", {
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    } else {
      logger.info("MeWe delete requested", { platformPostId });
    }
  }

  async getEngagement(
    tokenData: string,
    platformPostId: string,
  ): Promise<Record<string, unknown>> {
    const creds = this.parseToken(tokenData);
    const appId = creds.appId || creds.clientId;
    const apiKey = creds.apiKey || creds.clientSecret;
    const token = creds.accessToken || apiKey;

    if (!appId || !token) {
      return {};
    }

    try {
      const res = await fetch(`${MEWE_API_BASE}/api/v1/posts/${platformPostId}`, {
        method: "GET",
        headers: {
          "X-App-Id": appId,
          ...(apiKey ? { "X-Api-Key": apiKey } : {}),
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) return {};

      const data = await res.json();
      const postData = data.data || data;

      return {
        reactions: postData.reactionsCount ?? postData.likesCount ?? 0,
        comments: postData.commentsCount ?? 0,
        shares: postData.sharesCount ?? postData.resharesCount ?? 0,
      };
    } catch {
      return {};
    }
  }

  private async publishViaWebhook(
    webhookUrl: string,
    username: string,
    input: PublishInput,
  ): Promise<PublishResult> {
    const payload: Record<string, unknown> = {
      content: input.content,
      username,
    };

    if (input.mediaUrls && input.mediaUrls.length > 0) {
      payload.mediaUrls = input.mediaUrls;
    }

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
  }
}

export const meweAdapter = new MeweAdapter();
