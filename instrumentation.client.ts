/**
 * Sentry Client Instrumentation
 * This file is loaded on the client side only
 */
import * as Sentry from "@sentry/nextjs";

export function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    require("./sentry.edge.config");
  } else {
    require("./sentry.client.config");
  }

  // Debug: log Sentry initialization
  if (process.env.NODE_ENV === "development") {
    console.log("[Sentry] Client instrumentation loaded");
  }
}