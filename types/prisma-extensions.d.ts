import { PrismaClient } from '@prisma/client';

declare module '@prisma/client' {
  interface PrismaClient {
  // add EmailReport model typing placeholder until prisma generate runs successfully
  emailReport: unknown;
  }
}

// Also augment the global db export if needed (lib/db.ts exports `db`)
declare global {
  var prisma: PrismaClient | undefined;
}

export {};
