import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get('month'); // YYYY-MM
  if (!month) return NextResponse.json({ error: 'month required' }, { status: 400 });

  const [year, mon] = month.split('-');
  const monthStart = new Date(Date.UTC(parseInt(year), parseInt(mon) - 1, 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1, 0, 0, 0));

  try {
    const records = await db.records.findMany({ where: { userId, date: { gte: monthStart, lt: monthEnd } }, orderBy: { date: 'desc' } });

    // build CSV
    const headers = ['date', 'amount', 'category', 'description'];
    const rows = records.map(r => ([new Date(r.date).toISOString(), String(r.amount), r.category, (r.text || '').replace(/\r?\n/g, ' ')]));
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="budget-${month}.csv"`,
      },
    });
  } catch (e) {
    console.error('Failed to export CSV', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
