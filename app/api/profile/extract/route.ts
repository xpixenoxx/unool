import { NextRequest } from 'next/server';
import { withWorkspacePlan } from '@/lib/entitlements';
import { handleProfileExtractionRequest } from '@/lib/profile/extractionService';

export const POST = withWorkspacePlan(
  async (request: NextRequest, context) => {
    return handleProfileExtractionRequest(request, context, { deprecated: false });
  },
  { action: 'use_ai' }
);
