import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import {
  InstagramCommentAutomation,
  type MessagingUserProfile,
} from '@/lib/services/InstagramCommentAutomation';
import { classifyMetaError } from '@/lib/services/automation/metaErrors';
import {
  hasRecentCampaignEnrollment,
  pickRotatingPublicReply,
  selectAbVariant,
  type InstagramCampaign,
} from '@/lib/services/automation/campaignMatcher';
import { upsertWorkspaceContact, type LeadCaptureState } from '@/lib/services/automation/leadCapture';
import { createTrackedLink } from '@/lib/services/automation/trackedLinks';
import { computeContactIntentScore } from '@/lib/services/automation/intentScore';
import { dispatchWorkspaceWebhooks } from '@/lib/services/automation/leadSync';
import { recordBudgetedNotification } from '@/lib/services/automation/notificationBudget';
import { queueService } from '@/lib/services/QueueService';

export interface ExecuteCampaignInput {
  workspaceId: string;
  connectionId: string;
  igUserId: string;
  brandUsername: string;
  accessToken: string;
  automation: InstagramCommentAutomation;
  campaign: InstagramCampaign;
  surface: InstagramCampaign['trigger_surface'];
  triggerEventId: string; // commentId or messageId
  mediaId?: string | null;
  platformUserId?: string | null; // commenter IGSID or DM senderId
  username?: string | null;
  inboundText: string;
  recentPublicReplies?: string[];
  vipFollowerThreshold?: number;
  profile?: MessagingUserProfile | null;
}

export interface ExecuteCampaignResult {
  executed: boolean;
  skippedReason?: string;
  publicReplySent: boolean;
  dmSent: boolean;
  dmText?: string;
  publicReplyText?: string;
  enrollmentId?: string;
  abVariant?: 'A' | 'B';
  couponCode?: string | null;
}

function interpolateTemplate(
  template: string,
  vars: Record<string, string | null | undefined>
): string {
  let out = template || '';
  for (const [k, v] of Object.entries(vars)) {
    const val = (v ?? '').trim();
    out = out.replace(new RegExp(`\\{\\{?${k}\\}?\\}`, 'gi'), val);
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

async function claimUniqueCoupon(
  campaignId: string,
  contactId: string | null,
  workspaceId: string
): Promise<string | null> {
  if (!contactId) return null;
  try {
    if (typeof (supabaseAdmin as any).rpc === 'function') {
      const { data, error } = await (supabaseAdmin as any).rpc('claim_campaign_coupon', {
        p_campaign_id: campaignId,
        p_contact_id: contactId,
        p_workspace_id: workspaceId,
      });
      if (!error && typeof data === 'string' && data.trim()) {
        return data.trim();
      }
    }
  } catch (err) {
    logger.debug('claimUniqueCoupon skipped', {
      campaignId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return null;
}

/**
 * Executes a matched deterministic SignalDM campaign across Comments, Live Comments,
 * Story Replies, Story Mentions, Reel Shares, Ad Referrals, or DM Keywords.
 */
export async function executeMatchedCampaign(
  input: ExecuteCampaignInput
): Promise<ExecuteCampaignResult> {
  const {
    workspaceId,
    connectionId,
    igUserId,
    brandUsername,
    accessToken,
    automation,
    campaign,
    surface,
    triggerEventId,
    mediaId,
    platformUserId,
    username,
    inboundText,
    recentPublicReplies = [],
    vipFollowerThreshold = 10000,
  } = input;

  const userKey = platformUserId || username || triggerEventId;

  // 1. Per-user-per-post deduplication
  if (campaign.dedup_user_post_hours > 0 && platformUserId) {
    const alreadyEnrolled = await hasRecentCampaignEnrollment(
      workspaceId,
      campaign.id,
      platformUserId,
      mediaId,
      campaign.dedup_user_post_hours
    );
    if (alreadyEnrolled) {
      return {
        executed: false,
        skippedReason: 'dedup_window_active',
        publicReplySent: false,
        dmSent: false,
      };
    }
  }

  // 2. Fetch consented messaging profile if we have a DM-surface IGSID
  const isDmSurface =
    surface === 'story_reply' ||
    surface === 'story_mention' ||
    surface === 'dm_keyword' ||
    surface === 'ad_referral' ||
    surface === 'reel_share';

  let profile = input.profile || null;
  if (!profile && isDmSurface && platformUserId) {
    profile = await automation.fetchMessagingUserProfile(accessToken, platformUserId);
  }

  // 3. Upsert Audience Vault contact + compute intent score
  const resolvedUsername = profile?.username || username || undefined;
  const intent = computeContactIntentScore({
    leadScoreLegacy: 2,
    classification: 'link_request',
    isFollowing: profile?.isUserFollowBusiness,
    isVip: Boolean(
      profile?.isVerifiedUser ||
        (typeof profile?.followerCount === 'number' && profile.followerCount >= vipFollowerThreshold)
    ),
    inboundText,
    lastInteractionAt: new Date().toISOString(),
  });

  const contact = platformUserId
    ? await upsertWorkspaceContact({
        workspaceId,
        platform: 'instagram',
        platformUserId,
        username: resolvedUsername,
        profile,
        incrementComments: !isDmSurface,
        incrementDms: isDmSurface,
        intentScore: intent.score,
        lastCampaignId: campaign.id,
        addTags: [campaign.name.slice(0, 32)],
        vipFollowerThreshold,
      })
    : null;

  if (contact?.opted_out) {
    return {
      executed: false,
      skippedReason: 'contact_opted_out',
      publicReplySent: false,
      dmSent: false,
    };
  }

  // VIP real-time ping (respecting Notification Budget with VIP bypass)
  if (contact?.is_vip) {
    void recordBudgetedNotification({
      workspaceId,
      type: 'vip_dm',
      title: `VIP @${resolvedUsername || 'creator'} triggered "${campaign.name}"`,
      body: inboundText.slice(0, 200),
      dedupKey: `vip:${campaign.id}:${userKey}`,
    });
  }

  // 4. Select A/B Variant & create enrollment record
  const abVariant = selectAbVariant(campaign, userKey);
  const rawDmTemplate =
    abVariant === 'B' && campaign.ab_variant_b_dm?.trim()
      ? campaign.ab_variant_b_dm
      : campaign.dm_message;
  const rawCtaUrl =
    abVariant === 'B' && campaign.ab_variant_b_cta_url?.trim()
      ? campaign.ab_variant_b_cta_url
      : campaign.dm_cta_url;

  let enrollmentId: string | undefined;
  try {
    const { data: enrollRow } = await supabaseAdmin
      .from('campaign_enrollments')
      .insert({
        workspace_id: workspaceId,
        campaign_id: campaign.id,
        contact_id: contact?.id || null,
        platform_user_id: userKey,
        media_id: mediaId || null,
        trigger_event_id: triggerEventId,
        ab_variant: abVariant,
        stage: 'triggered',
        follow_verified: Boolean(profile?.isUserFollowBusiness),
      })
      .select('id')
      .maybeSingle();
    enrollmentId = enrollRow?.id;
  } catch {
    // Non-fatal
  }

  // 5. Claim atomic unique coupon if needed
  const needsCoupon =
    rawDmTemplate.includes('{{coupon}}') || rawDmTemplate.includes('{coupon}');
  const couponCode = needsCoupon
    ? await claimUniqueCoupon(campaign.id, contact?.id || null, workspaceId)
    : null;

  // 6. Generate tracked link (/go/[code]) for CTR & nudge cancellation
  const tracked = rawCtaUrl
    ? await createTrackedLink({
        workspaceId,
        destinationUrl: rawCtaUrl,
        campaignId: campaign.id,
        enrollmentId: enrollmentId || null,
        contactId: contact?.id || null,
        postId: campaign.post_id || null,
        abVariant,
      })
    : { shortUrl: '', code: null };

  const cleanBrand = brandUsername.startsWith('@') ? brandUsername : `@${brandUsername}`;
  const finalDmMessage = interpolateTemplate(rawDmTemplate, {
    username: resolvedUsername ? `@${resolvedUsername}` : 'there',
    brand: cleanBrand,
    link: tracked.shortUrl || rawCtaUrl || '',
    coupon: couponCode || '',
  });

  const finalDmWithLink =
    tracked.shortUrl && !finalDmMessage.includes(tracked.shortUrl) && !campaign.dm_card_title
      ? `${finalDmMessage}\n\n${tracked.shortUrl}`
      : finalDmMessage;

  let publicReplySent = false;
  let publicReplyText: string | undefined;
  let dmSent = false;

  // ── COMMENT / LIVE COMMENT EXECUTION PATH ─────────────────────────────────
  if (!isDmSurface) {
    // Post rotating public reply if configured
    const chosenPublic = pickRotatingPublicReply(campaign.public_replies || [], recentPublicReplies);
    if (chosenPublic && surface === 'comment') {
      const formattedPublic = interpolateTemplate(chosenPublic, {
        username: resolvedUsername ? `@${resolvedUsername}` : 'there',
        brand: cleanBrand,
      });
      const pubRes = await automation.postPublicReply(
        accessToken,
        mediaId || '',
        triggerEventId,
        formattedPublic,
        resolvedUsername
      );
      if (pubRes) {
        publicReplySent = true;
        publicReplyText = formattedPublic;
      }
    }

    // Send Opening DM Postback Button OR Direct Private Reply (Card or Text)
    if (campaign.dm_opening_enabled) {
      const openPrompt = interpolateTemplate(
        campaign.dm_opening_text || 'Hey! Tap below and I will send it right over 👇',
        { username: resolvedUsername ? `@${resolvedUsername}` : 'there', brand: cleanBrand }
      );
      const openRes = await automation.sendOpeningDmButton(
        accessToken,
        igUserId,
        triggerEventId,
        openPrompt,
        campaign.dm_opening_button_title || 'Send it to me',
        `OPEN_CAMPAIGN:${campaign.id}:${enrollmentId || ''}`
      );
      dmSent = Boolean(openRes);
      if (dmSent && enrollmentId) {
        await supabaseAdmin
          .from('campaign_enrollments')
          .update({ stage: 'opening_sent', dm_sent_at: new Date().toISOString() })
          .eq('id', enrollmentId);
      }
    } else if (finalDmWithLink) {
      let dmRes: { messageId: string } | null = null;
      if (campaign.dm_card_title && (tracked.shortUrl || rawCtaUrl)) {
        dmRes = await automation.sendGenericTemplateCard(
          accessToken,
          igUserId,
          { commentId: triggerEventId },
          [
            {
              title: campaign.dm_card_title,
              subtitle: campaign.dm_card_subtitle || finalDmMessage.slice(0, 80),
              image_url: campaign.dm_card_image_url || undefined,
              buttons: [
                {
                  type: 'web_url',
                  title: campaign.dm_cta_title || 'Open Link',
                  url: tracked.shortUrl || rawCtaUrl!,
                },
              ],
            },
          ],
          finalDmWithLink
        );
      } else {
        dmRes = await automation.sendDmForComment(
          accessToken,
          igUserId,
          triggerEventId,
          platformUserId || undefined,
          finalDmWithLink
        );
      }
      dmSent = Boolean(dmRes);

      // Closed-DM Public Fallback if Private Reply failed and fallback is configured
      if (!dmSent && !publicReplySent && campaign.closed_dm_public_fallback?.trim() && surface === 'comment') {
        const fallbackPub = interpolateTemplate(campaign.closed_dm_public_fallback, {
          username: resolvedUsername ? `@${resolvedUsername}` : 'there',
          brand: cleanBrand,
          link: tracked.shortUrl || rawCtaUrl || '',
        });
        const fbRes = await automation.postPublicReply(
          accessToken,
          mediaId || '',
          triggerEventId,
          fallbackPub,
          resolvedUsername
        );
        if (fbRes) {
          publicReplySent = true;
          publicReplyText = fallbackPub;
        }
      }
    }
  } else if (platformUserId) {
    // ── 24H DM SURFACE PATH (Story Reply / Story Mention / DM Keyword / Ad / Reel Share) ──
    await automation.sendSenderAction(accessToken, igUserId, platformUserId, 'mark_seen');
    await automation.sendSenderAction(accessToken, igUserId, platformUserId, 'typing_on');

    // Step A: Follow-Gate check inside DM campaign
    if (campaign.require_follow && profile?.isUserFollowBusiness === false) {
      const askText = interpolateTemplate(
        campaign.follow_ask_text ||
          `Hey {username}! 👋 Follow ${cleanBrand} first and tap "I Followed! ✅" below to unlock your link 👇`,
        { username: resolvedUsername ? `@${resolvedUsername}` : 'there', brand: cleanBrand }
      );
      const gateRes = await automation.sendQuickReplyMessage(
        accessToken,
        igUserId,
        platformUserId,
        askText,
        [{ title: 'I Followed! ✅', payload: `CONFIRM_CAMPAIGN_FOLLOW:${campaign.id}:${enrollmentId || ''}` }]
      );
      dmSent = Boolean(gateRes);
      if (enrollmentId) {
        await supabaseAdmin
          .from('campaign_enrollments')
          .update({ stage: 'follow_gate_pending', dm_sent_at: new Date().toISOString() })
          .eq('id', enrollmentId);
      }
      return {
        executed: true,
        publicReplySent: false,
        dmSent,
        dmText: askText,
        enrollmentId,
        abVariant,
        couponCode,
      };
    }

    // Step B: Conversational Lead Capture (Email / Phone) before final delivery
    const needsEmail = campaign.capture_email && !(campaign.skip_if_already_captured && contact?.email);
    const needsPhone =
      !needsEmail && campaign.capture_phone && !(campaign.skip_if_already_captured && contact?.phone);

    if (needsEmail || needsPhone) {
      const promptText = interpolateTemplate(
        campaign.capture_prompt ||
          (needsEmail
            ? 'Drop your best email below and I will send your access right over 👇'
            : 'Drop your WhatsApp / phone number below so I can send your access right over 👇'),
        { username: resolvedUsername ? `@${resolvedUsername}` : 'there', brand: cleanBrand }
      );
      const nextCaptureState: LeadCaptureState = {
        campaignId: campaign.id,
        awaiting: needsEmail ? 'email' : 'phone',
        deliveryMessage: finalDmMessage,
        ctaUrl: tracked.shortUrl || rawCtaUrl || null,
        ctaTitle: campaign.dm_cta_title || null,
        sendEmailDelivery: campaign.send_email_delivery,
        emailSubject: campaign.email_subject || null,
        emailBody: campaign.email_body || null,
        confirmText: campaign.capture_confirm_text || null,
        attempts: 0,
        startedAt: new Date().toISOString(),
      };
      await upsertWorkspaceContact({
        workspaceId,
        platform: 'instagram',
        platformUserId,
        leadCaptureState: nextCaptureState,
      });
      const askLeadRes = await automation.sendPrivateMessage(
        accessToken,
        igUserId,
        platformUserId,
        promptText
      );
      dmSent = Boolean(askLeadRes);
      if (enrollmentId) {
        await supabaseAdmin
          .from('campaign_enrollments')
          .update({ stage: 'lead_capture_pending', dm_sent_at: new Date().toISOString() })
          .eq('id', enrollmentId);
      }
      return {
        executed: true,
        publicReplySent: false,
        dmSent,
        dmText: promptText,
        enrollmentId,
        abVariant,
        couponCode,
      };
    }

    // Step C: Direct DM Delivery (Rich Card or Text + Extra Multi-Bubbles)
    if (campaign.dm_card_title && (tracked.shortUrl || rawCtaUrl)) {
      const cardRes = await automation.sendGenericTemplateCard(
        accessToken,
        igUserId,
        { id: platformUserId },
        [
          {
            title: campaign.dm_card_title,
            subtitle: campaign.dm_card_subtitle || finalDmMessage.slice(0, 80),
            image_url: campaign.dm_card_image_url || undefined,
            buttons: [
              {
                type: 'web_url',
                title: campaign.dm_cta_title || 'Open Link',
                url: tracked.shortUrl || rawCtaUrl!,
              },
            ],
          },
        ],
        finalDmWithLink
      );
      dmSent = Boolean(cardRes);
    } else if (finalDmWithLink) {
      const msgRes = await automation.sendPrivateMessage(
        accessToken,
        igUserId,
        platformUserId,
        finalDmWithLink
      );
      dmSent = Boolean(msgRes);
    }

    // Extra multi-bubble pacing messages
    if (dmSent && Array.isArray(campaign.dm_extra_bubbles) && campaign.dm_extra_bubbles.length > 0) {
      for (const extraRaw of campaign.dm_extra_bubbles.slice(0, 2)) {
        const extra = interpolateTemplate(extraRaw, {
          username: resolvedUsername ? `@${resolvedUsername}` : 'there',
          brand: cleanBrand,
          link: tracked.shortUrl || rawCtaUrl || '',
          coupon: couponCode || '',
        });
        if (extra) {
          await automation.sendPrivateMessage(accessToken, igUserId, platformUserId, extra);
        }
      }
    }

    // Schedule unclicked follow-up nudge via QStash (cancelled automatically when /go/[code] is clicked!)
    if (
      dmSent &&
      campaign.nudge_enabled &&
      campaign.nudge_text?.trim() &&
      enrollmentId &&
      queueService.isAvailable()
    ) {
      const delaySec = Math.max(300, Math.min(22 * 3600, (campaign.nudge_delay_minutes || 180) * 60));
      const nudgeMsgId = await queueService.enqueueInstagramOutboundTask({
        jobId: `nudge_${enrollmentId}`,
        jobType: 'campaign_nudge',
        workspaceId,
        connectionId,
        messageId: `nudge_${enrollmentId}`,
        senderId: platformUserId,
        senderUsername: resolvedUsername,
        dmText: interpolateTemplate(campaign.nudge_text, {
          username: resolvedUsername ? `@${resolvedUsername}` : 'there',
          brand: cleanBrand,
          link: tracked.shortUrl || rawCtaUrl || '',
        }),
        enrollmentId,
        campaignId: campaign.id,
        delaySeconds: delaySec,
      });
      if (nudgeMsgId) {
        await supabaseAdmin
          .from('campaign_enrollments')
          .update({ nudge_qstash_id: nudgeMsgId })
          .eq('id', enrollmentId);
      }
    }
  }

  // 7. Update campaign send counters & enrollment completion
  if (dmSent || publicReplySent) {
    try {
      await Promise.allSettled([
        supabaseAdmin
          .from('instagram_campaigns')
          .update({
            total_sends: (campaign.total_sends || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaign.id),
        enrollmentId
          ? supabaseAdmin
              .from('campaign_enrollments')
              .update({
                stage: dmSent ? 'delivered' : 'triggered',
                dm_sent_at: dmSent ? new Date().toISOString() : null,
                coupon_code: couponCode || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', enrollmentId)
          : Promise.resolve(),
      ]);
      void dispatchWorkspaceWebhooks(workspaceId, 'campaign.triggered', {
        campaignId: campaign.id,
        campaignName: campaign.name,
        surface,
        username: resolvedUsername || null,
        abVariant,
        couponCode,
        dmSent,
        publicReplySent,
      });
    } catch {
      // Non-fatal
    }
  }

  return {
    executed: true,
    publicReplySent,
    dmSent,
    dmText: finalDmWithLink,
    publicReplyText,
    enrollmentId,
    abVariant,
    couponCode,
  };
}

export { classifyMetaError };
