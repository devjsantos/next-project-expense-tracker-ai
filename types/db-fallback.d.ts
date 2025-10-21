declare module '@/lib/db' {
  // Temporary fallback declaration while Prisma client is being generated on Windows.
  // Provide a minimal typed surface used by server actions (emailReport.create).
  // NOTE: Replace with actual generated types after running `npx prisma generate`.
  type EmailReportCreateData = {
    userId: string;
    email: string;
    subject: string;
    provider?: string | null;
    status: string;
    providerResponse?: string | null;
  };

  export const db: {
    emailReport: {
      create: (args: { data: EmailReportCreateData }) => Promise<unknown>;
    };
    // Other db properties are typed as unknown to avoid accidental use
    [key: string]: unknown;
  };
}
declare module '@/lib/db' {
  const db: unknown;
  export { db };
}

export {};
