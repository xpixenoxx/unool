import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { type ThreadsOutboundJobParams } from '@/lib/services/QueueService';
import { processThreadsOutboundJob } from '@/lib/services/automation/threadsOutbound';

export const maxDuration = 60;

function getReceiver(): Receiver | null {
  if (!config.QSTASH_CURRENT_SIGNING_KEY || !config.QSTASH_NEXT_SIGNING_KEY) return null;
  return new Receiver({
    currentSigningKey: config.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: config.QSTASH_NEXT_SIGNING_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const receiver = getReceiver();
    let body: ThreadsOutboundJobParams;

    if (receiver) {
      const signature = request.headers.get('upstash-signature');
      if (!signature) {
        logger.warn('QStash threads-outbound: missing signature header');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      const rawBody = await request.text();
      const configuredUrl = `${config.NEXT_PUBLIC_APP_URL}/api/webhooks/qstash/threads-outbound`;
      let isValid = false;
      try {
        isValid = await receiver.verify({ signature, body: rawBody, url: configuredUrl, clockTolerance: 300 });
      } catch { isValid = false; }

      if (!isValid && request.url && request.url !== configuredUrl) {
        try {
          isValid = await receiver.verify({ signature, body: rawBody, url: request.url, clockTolerance: 300 });
        } catch { isValid = false; }
      }

      if (!isValid) {
        logger.warn('QStash threads-outbound: invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      body = JSON.parse(rawBody);
    } else {
      body = await request.json();
    }

    return await processThreadsOutboundJob(body);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('QStash threads-outbound handler error', { error: err });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
