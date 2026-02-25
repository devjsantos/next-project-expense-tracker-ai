import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import env from '@/lib/env';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();
    // Calculate first day of current month and last month
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const lastMonthEnd = new Date(currentMonthStart);

    // 1. Find all budgets from last month that have rollover enabled
    const lastBudgets = await db.budget.findMany({
      where: { monthStart: lastMonthStart, rolloverEnabled: true },
    });

    for (const budget of lastBudgets) {
      // 2. Calculate how much was spent last month
      const totalSpent = await db.records.aggregate({
        where: {
          userId: budget.userId,
          date: { gte: lastMonthStart, lt: lastMonthEnd }
        },
        _sum: { amount: true }
      });

      const spentAmount = totalSpent._sum.amount || 0;
      const leftover = (budget.monthlyTotal + budget.rolloverAmount) - spentAmount;

      if (leftover > 0) {
        // 3. Move leftover to current month's budget
        await db.budget.updateMany({
          where: { userId: budget.userId, monthStart: currentMonthStart },
          data: { rolloverAmount: leftover }
        });
      }
    }

    return NextResponse.json({ success: true, processed: lastBudgets.length });
  } catch (error) {
    console.error('Rollover Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}