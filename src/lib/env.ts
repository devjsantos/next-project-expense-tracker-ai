type EnvConfig = {
  DATABASE_URL: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  OPENROUTER_API_KEY?: string;
  OPENAI_API_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_KEY?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  NEXT_PUBLIC_APP_URL?: string;
  RESEND_FROM?: string;
  CRON_SECRET?: string;
  NODE_ENV?: string;
};

function requireVar(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  return v;
}

function atLeastOne(keys: string[], desc?: string): void {
  const ok = keys.some(k => !!process.env[k]);
  if (!ok) throw new Error(`Missing one of: ${keys.join(' | ')}${desc ? ` (${desc})` : ''}`);
}

// Validate required vars
const config: EnvConfig = {
  DATABASE_URL: requireVar('DATABASE_URL'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: requireVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  CLERK_SECRET_KEY: requireVar('CLERK_SECRET_KEY'),
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_KEY: process.env.RESEND_KEY,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  RESEND_FROM: process.env.RESEND_FROM,
  CRON_SECRET: process.env.CRON_SECRET,
  NODE_ENV: process.env.NODE_ENV,
};

// At least one AI key
atLeastOne(['OPENROUTER_API_KEY', 'OPENAI_API_KEY'], 'AI provider key');

// At least one email provider config
atLeastOne(['RESEND_API_KEY', 'RESEND_KEY', 'SMTP_HOST'], 'Email provider (Resend or SMTP)');

export default config;
