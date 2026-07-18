import * as Sentry from '@sentry/nextjs';
import { config } from '@/lib/config/schema';

const SENTRY_DSN = config.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    debug: config.NODE_ENV === 'development',
    environment: config.NODE_ENV,
    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    // integrations: [Sentry.replayIntegration()],
  });
}