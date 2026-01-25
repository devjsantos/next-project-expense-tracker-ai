import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get('month'); // expected YYYY-MM
  const now = new Date();
  let monthStart: Date;
  if (!month) {
    monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  } else {
    const [year, mon] = month.split('-');
    monthStart = new Date(Date.UTC(parseInt(year), parseInt(mon) - 1, 1, 0, 0, 0));
  }

  const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1, 0, 0, 0));

  try {
    const budget = await db.budget.findFirst({ where: { userId, monthStart }, include: { allocations: true } });

    // total spent this month
    const totals = await db.records.aggregate({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    });
    const totalSpent = totals._sum.amount || 0;

    // per-category sums for allocations
    const allocs = (budget?.allocations || []).map((a) => ({ category: a.category, amount: a.amount }));

    const perCategoryPromises = allocs.map(async (a) => {
      const res = await db.records.aggregate({
        where: { userId, category: a.category, date: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      });
      return { category: a.category, allocated: a.amount, spent: res._sum.amount || 0 };
    });

    const perCategory = await Promise.all(perCategoryPromises);

    // compute daily averages and per-category remaining/percent
    const nowUtc = new Date();
    const daysInMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
    const todayUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()));
    let daysPassed = 0;
    if (monthStart.getUTCFullYear() === todayUtc.getUTCFullYear() && monthStart.getUTCMonth() === todayUtc.getUTCMonth()) {
      daysPassed = todayUtc.getUTCDate();
    } else {
      // if requesting other month, consider full month
      daysPassed = daysInMonth;
    }
    const daysLeft = Math.max(0, daysInMonth - daysPassed);

    const perCategoryEnhanced = await Promise.all(perCategory.map(async (pc) => {
      const remaining = Math.max(0, (pc.allocated || 0) - (pc.spent || 0));
      const percentUsed = pc.allocated > 0 ? Math.min(1, (pc.spent || 0) / pc.allocated) : null;
      return { ...pc, remaining, percentUsed };
    }));

    const dailyAverage = daysPassed > 0 ? totalSpent / daysPassed : 0;

    const result = {
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      budget: budget ? { id: budget.id, monthlyTotal: budget.monthlyTotal, budgetAlertThreshold: budget.budgetAlertThreshold ?? 0.8, rolloverEnabled: budget.rolloverEnabled, rolloverAmount: budget.rolloverAmount } : null,
      totalSpent,
      perCategory: perCategoryEnhanced,
      remaining: budget ? Math.max(0, (budget.monthlyTotal || 0) - totalSpent) : null,
      percentUsed: budget && budget.monthlyTotal > 0 ? Math.min(1, totalSpent / budget.monthlyTotal) : null,
      daysInMonth,
      daysPassed,
      daysLeft,
      dailyAverage,
    };

    return NextResponse.json(result);
  } catch (e) {
    console.error('Error computing budget status', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
