'use server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get('month'); // expected YYYY-MM
  if (!month) return NextResponse.json({ error: 'Month required' }, { status: 400 });

  const [year, mon] = month.split('-');
  const monthStart = new Date(Date.UTC(parseInt(year), parseInt(mon) - 1, 1, 0, 0, 0));

  try {
    const budget = await db.budget.findFirst({ where: { userId, monthStart }, include: { allocations: true } });
    if (!budget) return NextResponse.json({ budget: null });
    const mapped = { id: budget.id, monthlyTotal: budget.monthlyTotal, monthStart: budget.monthStart.toISOString(), allocations: budget.allocations.map((a) => ({ category: a.category, amount: a.amount })) };
    return NextResponse.json({ budget: mapped });
  } catch (e) {
    console.error('Error fetching budget by month', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
