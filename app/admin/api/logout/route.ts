import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Clear cookie from both root and /admin paths
  response.cookies.set('admin_session', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
  });
  response.cookies.set('admin_session', '', {
    path: '/admin',
    maxAge: 0,
    httpOnly: true,
  });
  return response;
}
