import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple instances of Prisma Client in development
  var prisma: PrismaClient | undefined;
}

declare module '@prisma/client' {
  interface PrismaClient {
    // Add custom models if they aren't in your schema yet
    emailReport: {
      create: (args: { 
        data: {
          userId: string;
          email: string;
          subject: string;
          provider?: string | null;
          status: string;
          providerResponse?: string | null;
        } 
      }) => Promise<any>;
    };
  }
}

export {};