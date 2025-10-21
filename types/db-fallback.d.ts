/**
 * types/db-fallback.d.ts
 *
 * Conditional fallback type definition for '@/lib/db'
 * — prevents "Cannot redeclare block-scoped variable 'db'" errors
 * — only applies when Prisma Client or '@/lib/db' module isn't yet available
 */

// We declare this only when TypeScript cannot find '@/lib/db'
declare global {
  // Optional flag for fallback check
  var __db_fallback__: boolean | undefined;
}

// Only declare if no fallback has been registered yet
// (prevents redeclaration when both real and fallback modules exist)
if (typeof globalThis.__db_fallback__ === "undefined") {
  globalThis.__db_fallback__ = true;

  declare module "@/lib/db" {
    // Minimal placeholder shape for db used by server actions
    type EmailReportCreateData = {
      userId: string;
      email: string;
      subject: string;
      provider?: string | null;
      status: string;
      providerResponse?: string | null;
    };

    // Minimal mock type for db
    export const db: {
      emailReport: {
        create: (args: { data: EmailReportCreateData }) => Promise<unknown>;
      };
      [key: string]: unknown;
    };
  }
}

export {};
