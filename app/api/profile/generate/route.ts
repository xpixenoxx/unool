import { NextRequest } from 'next/server';
import { withWorkspacePlan } from '@/lib/entitlements';
import { handleProfileExtractionRequest } from '@/lib/profile/extractionService';

/**
 * Deprecated alias for POST /api/profile/extract.
 * Consolidated onto the shared SSRF-safe extraction pipeline with plan enforcement.
 */
export const POST = withWorkspacePlan(
  async (request: NextRequest, context) => {
    return handleProfileExtractionRequest(request, context, { deprecated: true });
  },
  { action: 'use_ai' }
);
