'use server';
import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

async function getBestWorstExpense(): Promise<{
  bestExpense?: number;
  worstExpense?: number;
  error?: string;
}> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'User not found' };
  }

  try {
    // Use DB aggregation to compute max and min directly
    const agg = await db.records.aggregate({
      where: { userId },
      _max: { amount: true },
      _min: { amount: true },
    });

    const bestExpense = agg._max.amount ?? 0;
    const worstExpense = agg._min.amount ?? 0;

    return { bestExpense, worstExpense };
  } catch (error) {
    console.error('Error fetching expense amounts:', error); // Log the error
    return { error: 'Database error' };
  }
}

export default getBestWorstExpense;