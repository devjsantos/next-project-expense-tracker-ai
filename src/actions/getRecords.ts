'use server';
import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { Record } from '@/types/Record';

// Changed to named export
export async function getRecords(): Promise<{
  records?: Record[];
  error?: string;
}> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  try {
    // Note: ensure your prisma schema is "records" and not "record"
    const records = await db.records.findMany({
      where: { userId },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    });

    return { records: records as Record[] };
  } catch (error) {
    console.error('Error fetching records:', error);
    return { error: 'Database error' };
  }
}