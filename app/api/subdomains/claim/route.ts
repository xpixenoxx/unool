import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { logger } from '@/lib/logger';

const profileRepository = new SupabaseProfileRepository();

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain } = await request.json();

    if (!subdomain || subdomain.length < 2) {
      return NextResponse.json({ error: 'Subdomain too short' }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json({ error: 'Invalid characters (a-z, 0-9, - only)' }, { status: 400 });
    }

    if (subdomain.startsWith('-') || subdomain.endsWith('-') || subdomain.includes('--')) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // System reserved paths
    const systemReserved = [
      'www', 'api', 'admin', 'app', 'dashboard', 'settings', 'profile', 'u', 's',
      'auth', 'signup', 'login', 'signin', 'logout', 'signout', 'pricing', 'features',
      'about', 'contact', 'help', 'docs', 'blog', 'status', 'support', 'legal',
      'privacy', 'terms', 'security', 'enterprise', 'pro', 'free', 'trial', 'demo',
      'test', 'staging', 'dev', 'local', 'cdn', 'static', 'assets', 'media',
      'images', 'mail', 'email', 'smtp', 'ftp', 'ssh', 'vpn', 'billing', 'pay',
      'checkout', 'unool', 'pixenox',
    ];

    // Major brand/trademark names — cannot be claimed as subdomains
    const trademarkReserved = [
      // Meta / Social Media
      'meta', 'facebook', 'instagram', 'whatsapp', 'threads', 'messenger',
      // Google
      'google', 'gmail', 'youtube', 'android', 'googlepay', 'gpay',
      // Apple
      'apple', 'iphone', 'icloud', 'appstore', 'itunes',
      // Microsoft
      'microsoft', 'windows', 'xbox', 'outlook', 'bing', 'azure', 'linkedin',
      // Amazon / AWS
      'amazon', 'aws', 'alexa', 'kindle', 'prime',
      // Twitter / X
      'twitter', 'x', 'xcom',
      // Other major tech
      'netflix', 'spotify', 'airbnb', 'uber', 'ola', 'zomato', 'swiggy',
      'paytm', 'phonepe', 'razorpay', 'cashfree', 'stripe', 'paypal',
      'shopify', 'notion', 'slack', 'discord', 'telegram', 'snapchat',
      'tiktok', 'bytedance', 'pinterest', 'reddit', 'quora', 'medium',
      'github', 'gitlab', 'openai', 'chatgpt', 'anthropic', 'gemini',
      // Indian brands
      'reliance', 'tata', 'jio', 'hdfc', 'icici', 'sbi', 'axis', 'kotak',
      'flipkart', 'myntra', 'nykaa', 'meesho', 'zepto', 'blinkit',
      'byju', 'unacademy', 'vedantu',
      // Creator economy platforms
      'linktree', 'beacons', 'later', 'buffer', 'hootsuite', 'manychat',
      'zorcha', 'taplio', 'stan',
    ];

    const reserved = [...systemReserved, ...trademarkReserved];
    if (reserved.includes(subdomain)) {
      return NextResponse.json({ error: 'This name is reserved and cannot be claimed' }, { status: 400 });
    }

    // Check if subdomain is taken
    const existing = await profileRepository.findBySubdomain(subdomain);
    if (existing) {
      return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });
    }

    // Get or create profile for this workspace
    let profile = await profileRepository.findByWorkspaceId(auth.workspaceId);

    if (!profile) {
      // Create minimal profile with subdomain
      profile = await profileRepository.create({
        workspaceId: auth.workspaceId,
        userId: auth.userId,
        subdomain,
      });
    } else {
      // Update existing profile with subdomain
      profile = await profileRepository.update(profile.id, { subdomain }, profile.version);
    }

    return NextResponse.json({ success: true, subdomain: profile.subdomain });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Claim subdomain failed', { error: err });
    if (err.message === 'VERSION_CONFLICT') {
      return NextResponse.json({ error: 'Profile was modified, please refresh and try again' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to claim subdomain' }, { status: 500 });
  }
}