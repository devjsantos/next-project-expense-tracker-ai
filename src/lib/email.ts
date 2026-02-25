import nodemailer from 'nodemailer';
import env from '@/lib/env';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const globalFetch = (globalThis as unknown as { fetch?: typeof fetch }).fetch;

async function sendWithResend(payload: EmailPayload) {
  const key = env.RESEND_API_KEY || env.RESEND_KEY;
  if (!key) throw new Error('Resend API key not configured');

  const res = await (globalFetch ?? fetch)('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM || 'no-reply@example.com',
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
  const resendKey = env.RESEND_API_KEY || env.RESEND_KEY;
  
  // 1. Try Resend First
  if (resendKey) {
    return await sendWithResend(payload);
  }

  // 2. Fallback to SMTP
  const smtpHost = env.SMTP_HOST;
  if (smtpHost) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(env.SMTP_PORT) || 465,
      secure: (env.SMTP_SECURE || 'true') === 'true', // Gmail 465 = true
      pool: true, // Reuse connections
      auth: {
        user: env.SMTP_USER,
        pass: (env.SMTP_PASS || '').replace(/\s+/g, ''), // Strips spaces
      },
      // Increase timeout for slow serverless cold starts
      connectionTimeout: 10000, 
      greetingTimeout: 10000,
    });

    try {
      const from = env.SMTP_FROM || 'jojo.santos.dev@gmail.com';
      const info = await transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text || payload.html.replace(/<[^>]*>/g, ''),
        html: payload.html,
      });
      return info;
    } catch (smtpError: any) {
      console.error('Detailed SMTP Error:', smtpError.message);
      throw new Error(`SMTP Transport Failed: ${smtpError.message}`);
    }
  }

  throw new Error('No email provider configured (set RESEND_API_KEY or SMTP_HOST)');
}

export default sendEmail;