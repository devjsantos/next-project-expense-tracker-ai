'use server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

async function getUserRecord(): Promise<{
  record?: number;
  daysWithRecords?: number;
  error?: string;
}> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  try {
    // Aggregate total spent
    const totals = await db.records.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const record = totals._sum.amount || 0;

    // Count distinct days with records
    const daysResult = await db.records.groupBy({
      by: ['date'],
      where: { userId },
    });
    const daysWithRecords = daysResult.length;

    return { record, daysWithRecords };
  } catch (error) {
    console.error('Error fetching user record:', error); // Log the error
    return { error: 'Database error' };
  }
}

export default getUserRecord;