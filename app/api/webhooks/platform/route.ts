import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyWebhookSignature, extractWebhookSignature } from '@/lib/webhooks/verify';
import { Platform } from '@/lib/repositories/interfaces/IPlatformRepository';

export async function POST(request: NextRequest) {
  try {
    const platformParam = request.nextUrl.searchParams.get('platform');
    const body = await request.text();

    if (!platformParam) {
      return NextResponse.json({ error: 'Platform parameter required' }, { status: 400 });
    }

    const platform = platformParam.toLowerCase() as Platform;
    const validPlatforms: Platform[] = ['linkedin', 'x', 'threads'];

    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    // Extract and verify webhook signature
    const signature = extractWebhookSignature(request, platform);
    if (!signature) {
      logger.warn('Missing webhook signature', { platform });
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const isValid = await verifyWebhookSignature(body, signature, platform);
    if (!isValid) {
      logger.warn('Invalid webhook signature', { platform });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(body);
    } catch {
      logger.warn('Invalid webhook payload JSON', { platform });
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Handle different platform webhook payloads
    try {
      switch (platform) {
        case 'linkedin':
          await handleLinkedInWebhook(data);
          break;
        case 'x':
          await handleXWebhook(data);
          break;
        case 'threads':
          await handleThreadsWebhook(data);
          break;
      }
    } catch (handlerError) {
      const err = handlerError instanceof Error ? handlerError : new Error(String(handlerError));
      logger.error('Webhook handler error', { platform, error: err });
      // Still return 200 to avoid webhook retries for handler errors
      // but log the error for investigation
      return NextResponse.json({ success: true, warning: 'Handler error logged' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Webhook processing error', { error: err });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleLinkedInWebhook(data: Record<string, unknown>): Promise<void> {
  // LinkedIn webhook payload format varies
  // Example: { value: { object: 'post', elementId: 'urn:li:share:...', ... } }
  logger.info('LinkedIn webhook received', { data });
  // TODO: Process LinkedIn webhook events (post published, comments, etc.)
}

async function handleXWebhook(data: Record<string, unknown>): Promise<void> {
  // Twitter Account Activity API webhook
  logger.info('X webhook received', { data });
  // TODO: Process X webhook events (tweet create, DM, etc.)
}

async function handleThreadsWebhook(data: Record<string, unknown>): Promise<void> {
  // Threads webhook (via Meta Graph API subscriptions)
  logger.info('Threads webhook received', { data });
  // TODO: Process Threads webhook events (post published, etc.)
}