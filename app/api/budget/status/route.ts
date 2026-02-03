import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Prevent Next.js from caching the budget status

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get('month'); 
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
    // 1. Fetch Budget
    const budget = await db.budget.findFirst({ 
      where: { userId, monthStart }, 
      include: { allocations: true } 
    });

    // 2. Fetch Total Spent
    const totals = await db.records.aggregate({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    });
    const totalSpent = totals._sum.amount || 0;

    // 3. Process Categories
    const allocs = budget?.allocations || [];
    const perCategory = await Promise.all(allocs.map(async (a) => {
      const res = await db.records.aggregate({
        where: { userId, category: a.category, date: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      });
      
      const spent = res._sum.amount || 0;
      return { 
        category: a.category, 
        allocated: a.amount, 
        spent: spent,
        remaining: Math.max(0, a.amount - spent),
        percentUsed: a.amount > 0 ? (spent / a.amount) : 0 // Removed Math.min(1) to see true overage if needed
      };
    }));

    // 4. Timing Calculations
    const nowUtc = new Date();
    const daysInMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
    const todayUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()));
    
    let daysPassed = (monthStart.getUTCMonth() === todayUtc.getUTCMonth()) 
      ? todayUtc.getUTCDate() 
      : daysInMonth;

    const result = {
      monthStart: monthStart.toISOString(),
      budget: budget ? { 
        id: budget.id, 
        monthlyTotal: budget.monthlyTotal 
      } : null,
      totalSpent,
      perCategory,
      remaining: budget ? Math.max(0, budget.monthlyTotal - totalSpent) : 0,
      percentUsed: budget && budget.monthlyTotal > 0 ? (totalSpent / budget.monthlyTotal) : 0,
      daysLeft: Math.max(0, daysInMonth - daysPassed),
      dailyAverage: daysPassed > 0 ? totalSpent / daysPassed : 0,
    };

    return NextResponse.json(result);
  } catch (e) {
    console.error('Budget Status Error:', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}