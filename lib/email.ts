// Use global fetch (Node 18+ / Next.js runtime). If not available, runtime should polyfill.
// Use global fetch; cast to the correct type for TypeScript.
const globalFetch = (globalThis as unknown as { fetch?: typeof fetch }).fetch;

import nodemailer from 'nodemailer';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

async function sendWithResend(payload: EmailPayload) {
  const key = process.env.RESEND_API_KEY || process.env.RESEND_KEY;
  if (!key) throw new Error('Resend API key not configured');

  const res = await (globalFetch ?? fetch)('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'no-reply@example.com',
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text || payload.html.replace(/<[^>]*>/g, ''),
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Resend error: ${res.status} ${txt}`);
  }

  return res.json();
}

export async function sendEmail(payload: EmailPayload) {
  // Prefer Resend if configured
  const key = process.env.RESEND_API_KEY || process.env.RESEND_KEY;
  if (key) {
    return await sendWithResend(payload);
  }

  // If SMTP is configured, use it (self-hosted SMTP)
  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost) {
    // create transport and send
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: (process.env.SMTP_PASS || '').replace(/\s+/g, '') }
        : undefined,
    });

    const from = process.env.SMTP_FROM || process.env.RESEND_FROM || 'no-reply@example.com';

    const info = await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text || payload.html.replace(/<[^>]*>/g, ''),
      html: payload.html,
    });

    return info;
  }

  throw new Error('No email provider configured (set RESEND_API_KEY or SMTP_HOST)');
}

export default sendEmail;
