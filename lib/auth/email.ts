/**
 * lib/auth/email.ts
 *
 * Sends authentication-related emails (OTP) via Resend.
 *
 * DEV MODE: If RESEND_API_KEY is not set, the OTP is printed to the
 * server console so you can still test the flow locally without an email service.
 */

import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

const FROM_ADDRESS = 'noreply@unool.co';
const APP_NAME     = 'Unool';

export async function sendOtpEmail(opts: {
  to:      string;
  otp:     string;
  purpose: 'signup' | 'signin';
}): Promise<void> {
  const { to, otp, purpose } = opts;

  // ── Dev fallback: no Resend key configured ────────────────────────────────
  if (!config.RESEND_API_KEY) {
    // In development we log the OTP to the terminal so you can still test.
    // NEVER do this in production.
    if (config.NODE_ENV !== 'production') {
      console.log('\n');
      console.log('┌─────────────────────────────────────────┐');
      console.log(`│  [DEV] OTP for ${to.padEnd(26)}│`);
      console.log(`│  Purpose : ${purpose.padEnd(30)}│`);
      console.log(`│  Code    : ${otp.padEnd(30)}│`);
      console.log('└─────────────────────────────────────────┘');
      console.log('\n');
      logger.info('DEV: OTP printed to console (no RESEND_API_KEY set)', { to, purpose });
      return;
    }
    // In production, fail loudly — email MUST be configured.
    throw new Error('RESEND_API_KEY is required in production to send OTP emails.');
  }

  // ── Production: send via Resend ───────────────────────────────────────────
  const subject = purpose === 'signup'
    ? `${APP_NAME} — Verify your email`
    : `${APP_NAME} — Sign in code`;

  const action = purpose === 'signup'
    ? 'complete your registration'
    : 'sign in to your account';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden;">
          <tr>
            <td align="center" style="background:#68d391;padding:28px 32px;">
              <span style="font-size:24px;font-weight:700;color:#fff;letter-spacing:-0.5px;">${APP_NAME}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#2d3748;">Your verification code</p>
              <p style="margin:0 0 32px;font-size:14px;color:#718096;line-height:1.6;">
                Use the code below to ${action}. It expires in <strong>5 minutes</strong>.
              </p>
              <div style="text-align:center;margin-bottom:32px;">
                <span style="display:inline-block;letter-spacing:12px;font-size:40px;font-weight:700;color:#2d3748;
                             background:#f7fafc;border:2px solid #e2e8f0;border-radius:10px;padding:16px 24px 16px 36px;">
                  ${otp}
                </span>
              </div>
              <p style="margin:0;font-size:13px;color:#a0aec0;line-height:1.6;">
                If you did not request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f7fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#a0aec0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(config.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from:    FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      logger.error('Resend email error', { error, to, purpose });
      throw new Error('Failed to send verification email');
    }

    logger.info('OTP email sent via Resend', { to, purpose }); // DO NOT log otp value
  } catch (err) {
    if (config.NODE_ENV !== 'production') {
      console.log('\n⚠️ Resend failed (probably unverified domain). Falling back to console OTP:');
      console.log('┌─────────────────────────────────────────┐');
      console.log(`│  [DEV] OTP for ${to.padEnd(26)}│`);
      console.log(`│  Code    : ${otp.padEnd(30)}│`);
      console.log('└─────────────────────────────────────────┘\n');
      logger.warn('Email send failed. Dev fallback activated instead.', { error: String(err) });
      return;
    }

    logger.error('Email send exception', {
      error: err instanceof Error ? err : new Error(String(err)),
      to,
      purpose,
    });
    throw err;
  }
}
