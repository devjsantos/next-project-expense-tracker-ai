'use server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get('month'); // YYYY-MM
  if (!month) return NextResponse.json({ error: 'Month required' }, { status: 400 });

  const [year, mon] = month.split('-');
  const monthStart = new Date(Date.UTC(parseInt(year), parseInt(mon) - 1, 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(parseInt(year), parseInt(mon), 0, 23, 59, 59));

  try {
    const expenses = await db.records.findMany({
      where: {
        userId,
        date: { gte: monthStart, lte: monthEnd },
      },
      select: { amount: true, category: true },
    });

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ totalExpense, byCategory });
  } catch (e) {
    console.error('Error fetching expenses:', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
