import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  environment: process.env.NODE_ENV || "development",

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Ignore certain errors
  ignoreErrors: [
    "hydration",
    "hydrat",
    "Hydration",
    "ChunkLoadError",
    "Loading chunk",
    "NetworkError",
    "fetch failed",
    "Failed to fetch",
    "Non-Error promise rejection captured",
    "ResizeObserver",
    "PerformanceObserver",
  ],

  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry] Would send:", event.exception?.values?.[0]?.value);
      return null;
    }
    return event;
  },
});