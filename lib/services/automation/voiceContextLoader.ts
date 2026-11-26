import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { buildVoiceFingerprintBlock, sanitizeVoiceExcerpt } from '@/lib/ai/studioContext';

export interface AdaptiveAiContext {
  voiceFingerprintBlock: string;
  brandMaterialsFacts: string;
  learnedExemplarsBlock: string;
  combinedPromptBlock: string;
  allowedFactsText: string;
  exemplarCount: number;
}

/**
 * Loads the creator's real adaptive intelligence context for non-generic AI replies:
 * 1. Cloned Voice Fingerprint (stylometry, cadence, casing, emoji discipline, anti-patterns)
 * 2. Published Brand Materials RAG facts (real offers, prices, links, FAQs so AI never hallucinates)
 * 3. Learned Creator Exemplars from `ai_reply_feedback` (creator Triage edits + phone `is_echo` replies)
 *
 * Fully fault-tolerant: gracefully degrades to empty context if any table/column is missing
 * or mocked in tests.
 */
export async function loadAdaptiveAiContext(
  workspaceId: string,
  channel: 'comment' | 'dm'
): Promise<AdaptiveAiContext> {
  let voiceFingerprintBlock = '';
  let brandMaterialsFacts = '';
  let learnedExemplarsBlock = '';
  let exemplarCount = 0;

  try {
    const [profileRes, materialsRes, feedbackRes] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('studio_profile, display_name, bio')
        .eq('workspace_id', workspaceId)
        .limit(1)
        .then((r) => r, () => ({ data: null, error: null })),
      supabaseAdmin
        .from('brand_materials_pages')
        .select('title, headline, bio_summary, primary_cta_label, primary_cta_url, sections, is_published')
        .eq('workspace_id', workspaceId)
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(4)
        .then((r) => r, () => ({ data: null, error: null })),
      supabaseAdmin
        .from('ai_reply_feedback')
        .select('inbound_text, creator_final_reply, action')
        .eq('workspace_id', workspaceId)
        .eq('channel', channel)
        .order('created_at', { ascending: false })
        .limit(12)
        .then((r) => r, () => ({ data: null, error: null })),
    ]);

    // 1. Cloned Voice DNA
    const profileRow = Array.isArray(profileRes?.data) ? profileRes.data[0] : profileRes?.data;
    if (profileRow?.studio_profile?.voiceFingerprint) {
      voiceFingerprintBlock = buildVoiceFingerprintBlock(profileRow.studio_profile.voiceFingerprint);
    }

    // 2. Published Brand Materials RAG grounding facts
    const pages = Array.isArray(materialsRes?.data) ? materialsRes.data : [];
    if (pages.length > 0) {
      const factLines: string[] = [];
      for (const page of pages) {
        const title = typeof page.title === 'string' ? page.title.trim() : '';
        const headline = typeof page.headline === 'string' ? page.headline.trim() : '';
        const summary = typeof page.bio_summary === 'string' ? page.bio_summary.trim() : '';
        const cta =
          typeof page.primary_cta_url === 'string' && page.primary_cta_url.trim()
            ? `${page.primary_cta_label || 'Link'}: ${page.primary_cta_url.trim()}`
            : '';

        const parts = [title, headline, summary, cta].filter(Boolean);
        if (parts.length > 0) {
          factLines.push(`- ${sanitizeVoiceExcerpt(parts.join(' | '), 260)}`);
        }

        // Extract concise structured offer/FAQ items from sections JSONB if present
        if (Array.isArray(page.sections)) {
          for (const sec of page.sections.slice(0, 4)) {
            const secTitle = typeof sec?.title === 'string' ? sec.title.trim() : '';
            const secBody = typeof sec?.description === 'string'
              ? sec.description.trim()
              : typeof sec?.content === 'string'
                ? sec.content.trim()
                : '';
            const price = typeof sec?.price === 'string' || typeof sec?.price === 'number' ? String(sec.price) : '';
            const itemLine = [secTitle, price ? `Price: ${price}` : '', secBody].filter(Boolean).join(' — ');
            if (itemLine) {
              factLines.push(`  • ${sanitizeVoiceExcerpt(itemLine, 180)}`);
            }
          }
        }
      }
      if (factLines.length > 0) {
        brandMaterialsFacts = `VERIFIED BRAND MATERIALS & OFFERS (cite ONLY facts/prices/URLs from here or Knowledge Base — NEVER invent prices or codes):\n${factLines.slice(0, 12).join('\n')}`;
      }
    }

    // 3. Learned Creator Reply Exemplars (self-improving adopt loop)
    const feedbackRows = Array.isArray(feedbackRes?.data) ? feedbackRes.data : [];
    const usableExemplars = feedbackRows
      .filter(
        (row: any) =>
          (row.action === 'edited' || row.action === 'phone_echo' || row.action === 'approved') &&
          typeof row.creator_final_reply === 'string' &&
          row.creator_final_reply.trim().length >= 8
      )
      .slice(0, 6);

    if (usableExemplars.length > 0) {
      exemplarCount = usableExemplars.length;
      const lines = usableExemplars.map((ex: any, i: number) => {
        const inbound = sanitizeVoiceExcerpt(ex.inbound_text || '', 90);
        const reply = sanitizeVoiceExcerpt(ex.creator_final_reply || '', 160);
        return `  ${i + 1}. Follower: "${inbound}" → Creator wrote: "${reply}"`;
      });
      learnedExemplarsBlock = `HOW THIS CREATOR ACTUALLY REPLIES (ADOPT THIS EXACT VOICE, RHYTHM & LENGTH — never copy verbatim):\n${lines.join('\n')}`;
    }
  } catch (err) {
    logger.debug('loadAdaptiveAiContext degraded gracefully', {
      workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const sections = [voiceFingerprintBlock, learnedExemplarsBlock, brandMaterialsFacts].filter(Boolean);
  return {
    voiceFingerprintBlock,
    brandMaterialsFacts,
    learnedExemplarsBlock,
    combinedPromptBlock: sections.join('\n\n'),
    allowedFactsText: brandMaterialsFacts,
    exemplarCount,
  };
}

/**
 * Persists a creator edit, phone reply (`is_echo`), approval, rejection, or AI quality-stop
 * event into `ai_reply_feedback` so future AI generations adapt to the creator's true voice.
 */
export async function recordAiReplyFeedback(params: {
  workspaceId: string;
  channel: 'comment' | 'dm';
  inboundText: string;
  aiDraft?: string | null;
  creatorFinalReply?: string | null;
  action: 'approved' | 'edited' | 'rejected' | 'phone_echo' | 'quality_stopped';
  qualityScore?: number | null;
  stopReason?: string | null;
}): Promise<void> {
  try {
    if (!params.workspaceId || !params.inboundText?.trim()) return;
    await supabaseAdmin.from('ai_reply_feedback').insert({
      workspace_id: params.workspaceId,
      channel: params.channel,
      inbound_text: params.inboundText.trim().slice(0, 500),
      ai_draft: params.aiDraft ? params.aiDraft.trim().slice(0, 800) : null,
      creator_final_reply: params.creatorFinalReply ? params.creatorFinalReply.trim().slice(0, 800) : null,
      action: params.action,
      quality_score: typeof params.qualityScore === 'number' ? Math.round(params.qualityScore) : null,
      stop_reason: params.stopReason ? params.stopReason.slice(0, 300) : null,
    });
  } catch (err) {
    logger.debug('recordAiReplyFeedback skipped cleanly', {
      workspaceId: params.workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
