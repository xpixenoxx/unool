import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookies = request.cookies.getAll();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return NextResponse.json({
    cookies: cookies.map(c => ({ name: c.name, value: c.value.substring(0, 50) })),
    headers: Object.fromEntries(
      Object.entries(headers).filter(([k]) => k.startsWith('x-') || k.startsWith('cookie') || k.startsWith('authorization'))
    ),
    env: {
      supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
      supabaseProjectId: process.env.SUPABASE_PROJECT_ID || 'NOT_SET',
      nodeEnv: process.env.NODE_ENV,
      devAuthBypass: process.env.DEV_AUTH_BYPASS,
    }
  });
}