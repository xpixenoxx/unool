import { NextRequest } from 'next/server';
import { withPlanEnforcement } from '@/lib/middleware/plan-enforcement';
import { handleProfileExtractionRequest } from '@/lib/profile/extractionService';

/**
 * Deprecated alias for POST /api/profile/extract.
 * Consolidated onto the shared SSRF-safe extraction pipeline with plan enforcement.
 */
export const POST = withPlanEnforcement(
  async (request: NextRequest, context) => {
    return handleProfileExtractionRequest(request, context, { deprecated: true });
  },
  { action: 'use_ai' }
);
