// Temporary debug endpoint — DELETE before production
import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const crypto = await import('crypto');
  const pepper = process.env.OTP_PEPPER || process.env.ENCRYPTION_KEY || 'dev-otp-pepper-change-in-prod';

  // Hash a known test OTP so we can verify the pepper is consistent
  const testHash = crypto.createHmac('sha256', pepper).update('123456').digest('hex');

  return NextResponse.json({
    pepper_set:    !!process.env.OTP_PEPPER,
    pepper_length: pepper.length,
    test_hash:     testHash,   // compare this between two calls — must be identical
  });
}
