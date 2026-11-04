// Safe JSON body parser for API routes.
// Returns null if body is empty or invalid JSON — never throws.

import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

export async function parseBody<T>(req: NextRequest): Promise<T | null> {
  try {
    const text = await req.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    logger.warn('Failed to parse request body as JSON');
    return null;
  }
}

