import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/provider';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { logger } from '@/lib/logger';

/**
 * POST /api/linkedin/suggest-replies
 *
 * AI-powered reply suggestion for LinkedIn comments.
 * Requires authenticated session (B-09 fix: was completely unauthenticated).
 * Uses active Groq/Anthropic/OpenAI provider via unified generateWithFallback
 * instead of deprecated llama3-8b-8192 direct Groq call (B model fix).
 */
export async function POST(req: NextRequest) {
  try {
    // B-09 FIX: Require authentication — previously had zero auth check
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { comment, author, post, brandVoice } = await req.json();

    if (!comment || !author || !post) {
      return NextResponse.json({ error: 'Missing required fields: comment, author, post' }, { status: 400 });
    }

    // Input length guard — prevent prompt injection via oversized inputs
    if (comment.length > 2000 || post.length > 5000 || author.length > 200) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 });
    }

    const brandVoiceSection = brandVoice
      ? `\n\nBrand voice / tone guidelines: ${brandVoice}`
      : '';

    // B-model fix: use unified provider (Groq qwen3 → Anthropic → OpenAI fallback)
    // instead of deprecated hardcoded llama3-8b-8192
    const prompt = `You are an expert social media manager managing a LinkedIn account.${brandVoiceSection}

You wrote the following post:
"${post}"

A user named ${author} commented:
"${comment}"

Write 3 short, engaging, and distinct reply suggestions that feel authentic and human.
Return the output EXACTLY as a JSON object with a "replies" array.
Each item in the array must have two string properties:
- "tone": a single word (e.g. "Warm", "Professional", "Curious", "Direct")
- "text": the reply itself (max 200 characters, no hashtags)

Example format:
{"replies": [{"tone": "Warm", "text": "..."}, {"tone": "Professional", "text": "..."}, {"tone": "Curious", "text": "..."}]}`;

    const provider = getAIProvider();
    const result = await provider.generateText(prompt, {
      temperature: 0.75,
      maxTokens: 600,
    });

    if (!result.ok) {
      logger.error('LinkedIn suggest-replies: AI generation failed', { error: result.error.message });
      return NextResponse.json({ error: 'Failed to generate reply suggestions' }, { status: 500 });
    }

    const content = result.value.text;

    // Parse reply array — handle both {replies:[...]} and raw [...] formats
    let parsedReplies: Array<{ tone: string; text: string }>;
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        parsedReplies = parsed;
      } else if (parsed.replies && Array.isArray(parsed.replies)) {
        parsedReplies = parsed.replies;
      } else {
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          parsedReplies = JSON.parse(match[0]);
        } else {
          throw new Error('Could not extract replies array');
        }
      }
    } catch {
      logger.warn('LinkedIn suggest-replies: JSON parse failed, attempting regex extraction', { content: content.slice(0, 200) });
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Validate and sanitize each reply
    const sanitized = parsedReplies
      .filter((r) => r && typeof r.tone === 'string' && typeof r.text === 'string')
      .slice(0, 3)
      .map((r) => ({
        tone: r.tone.slice(0, 50),
        text: ContentGuard.sanitizeOutput(r.text),
      }));

    if (sanitized.length === 0) {
      return NextResponse.json({ error: 'No valid replies generated' }, { status: 500 });
    }

    return NextResponse.json({ replies: sanitized });
  } catch (error) {
    logger.error('LinkedIn suggest-replies: unexpected error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
