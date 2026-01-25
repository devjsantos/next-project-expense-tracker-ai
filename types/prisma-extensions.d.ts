import { PrismaClient } from '@prisma/client';

declare module '@prisma/client' {
  interface PrismaClient {
  emailReport: unknown;
  }
}

declare global {
  var prisma: PrismaClient | undefined;
}

export {};
