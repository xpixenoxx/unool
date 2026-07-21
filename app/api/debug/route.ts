import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookies = request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 50) }));

  // Get headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return NextResponse.json({
    url: request.url,
    cookies,
    headers: {
      'x-debug-supabaseConfigured': headers['x-debug-supabaseconfigured'],
      'x-debug-devAuthEnabled': headers['x-debug-devauthenabled'],
      'x-debug-devBypassCookie': headers['x-debug-devbypasscookie'],
      'x-debug-isProtectedRoute': headers['x-debug-isprotectedroute'],
      'x-debug-nodeEnv': headers['x-debug-nodeenv'],
      'x-debug-devAuthBypassEnv': headers['x-debug-devauthbypassenv'],
      'x-debug-cookies': headers['x-debug-cookies'],
      'x-middleware-run': headers['x-middleware-run'],
      'x-middleware-path': headers['x-middleware-path'],
    }
  });
}