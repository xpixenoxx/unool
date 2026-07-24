import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain || subdomain.length < 2) {
      return NextResponse.json({ available: false, error: 'Subdomain too short' }, { status: 400 });
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json({ available: false, error: 'Invalid characters' }, { status: 400 });
    }

    if (subdomain.startsWith('-') || subdomain.endsWith('-') || subdomain.includes('--')) {
      return NextResponse.json({ available: false, error: 'Invalid format' }, { status: 400 });
    }

    // Reserved subdomains
    const reserved = ['www', 'api', 'admin', 'app', 'dashboard', 'settings', 'profile', 'u', 'auth', 'signup', 'login', 'signin', 'logout', 'signout', 'pricing', 'features', 'about', 'contact', 'help', 'docs', 'blog', 'status', 'support', 'legal', 'privacy', 'terms', 'security', 'enterprise', 'pro', 'free', 'trial', 'demo', 'test', 'staging', 'dev', 'local'];
    if (reserved.includes(subdomain)) {
      return NextResponse.json({ available: false, error: 'Reserved subdomain' }, { status: 400 });
    }

    // Check if subdomain is taken - use direct query for reliability
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (error) {
      logger.error('Subdomain check query failed', { error, subdomain });
      return NextResponse.json({ error: 'Failed to check subdomain' }, { status: 500 });
    }

    const available = !data;

    return NextResponse.json({ available });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Subdomain check failed', { error: err });
    return NextResponse.json({ error: 'Failed to check subdomain' }, { status: 500 });
  }
}