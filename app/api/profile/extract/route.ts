import { NextRequest } from 'next/server';
import { withPlanEnforcement } from '@/lib/middleware/plan-enforcement';
import { handleProfileExtractionRequest } from '@/lib/profile/extractionService';

export const POST = withPlanEnforcement(
  async (request: NextRequest, context) => {
    return handleProfileExtractionRequest(request, context, { deprecated: false });
  },
  { action: 'use_ai' }
);
