import nodemailer from 'nodemailer';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const globalFetch = (globalThis as unknown as { fetch?: typeof fetch }).fetch;

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
  const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_KEY;
  
  // 1. Try Resend First
  if (resendKey) {
    return await sendWithResend(payload);
  }

  // 2. Fallback to SMTP
  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true', // Gmail 465 = true
      pool: true, // Reuse connections
      auth: {
        user: process.env.SMTP_USER,
        pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''), // Strips spaces
      },
      // Increase timeout for slow serverless cold starts
      connectionTimeout: 10000, 
      greetingTimeout: 10000,
    });

    try {
      const from = process.env.SMTP_FROM || 'jojo.santos.dev@gmail.com';
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