import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromAddress = process.env.RESEND_FROM || 'Ornave <onboarding@resend.dev>';

/** Sends a real email via Resend when configured; otherwise falls back to a
 * console log so local dev without an API key still works exactly as before. */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.log(`[Email] (no RESEND_API_KEY configured) To: ${to} | Subject: ${subject}`);
    return;
  }

  const { error } = await resend.emails.send({ from: fromAddress, to, subject, html });
  if (error) {
    // Without a verified sending domain, Resend's sandbox only delivers to
    // the account owner's own address and rejects everything else — don't
    // let that failure break the caller's flow (e.g. registration), just
    // surface it in the server log.
    console.error(`[Email] Failed to send "${subject}" to ${to}:`, error);
  }
}
