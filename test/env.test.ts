import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('env module', () => {
  it('loads when required env vars are present', async () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test';
    process.env.CLERK_SECRET_KEY = 'sk_test';
    process.env.OPENROUTER_API_KEY = 'or_test';
    process.env.RESEND_API_KEY = 'resend_test';

    const mod = await import('../src/lib/env');
    expect(mod.default).toBeDefined();
    expect(mod.default.DATABASE_URL).toBe(process.env.DATABASE_URL);
  });

  it('throws when required env vars are missing', async () => {
    // Ensure required keys are not set
    delete process.env.DATABASE_URL;
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;

    await expect(import('../src/lib/env')).rejects.toThrow();
  });
});
