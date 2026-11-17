import { NextRequest, NextResponse } from 'next/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { validateSubdomain } from '@/lib/validation/subdomain';
import { logger } from '@/lib/logger';

const profileRepository = new SupabaseProfileRepository();

export async function GET(request: NextRequest) {
  try {
    const rawSubdomain = request.nextUrl.searchParams.get('subdomain');
    if (!rawSubdomain) {
      return NextResponse.json({ available: false, error: 'Subdomain parameter is required' }, { status: 400 });
    }

    const validation = validateSubdomain(rawSubdomain);
    if (!validation.valid) {
      return NextResponse.json({ available: false, error: validation.error }, { status: 400 });
    }

    const existing = await profileRepository.findBySubdomain(validation.normalized);
    if (existing) {
      return NextResponse.json({
        available: false,
        subdomain: validation.normalized,
        error: 'This subdomain is already taken',
      });
    }

    return NextResponse.json({
      available: true,
      subdomain: validation.normalized,
    });
  } catch (error) {
    logger.error('Subdomain availability check failed', { error: String(error) });
    return NextResponse.json({ available: false, error: 'Failed to check availability' }, { status: 500 });
  }
}
