import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  environment: process.env.NODE_ENV || "development",

  // For edge runtime
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  ignoreErrors: [
    "hydration",
    "ChunkLoadError",
    "Loading chunk",
  ],

  beforeSend(event, hint) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry Edge] Would send:", event.exception?.values?.[0]?.value);
      return null;
    }
    return event;
  },
});