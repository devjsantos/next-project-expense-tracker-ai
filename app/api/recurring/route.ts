import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  try {
    const items = await db.recurringExpense.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ items });
  } catch (e) {
    console.error('Error fetching recurring expenses', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  try {
    const body = await req.json();
    const { text, amount, category, startDate, frequency, active } = body;
    if (!text || typeof amount !== 'number' || !startDate || !frequency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const created = await db.recurringExpense.create({
      data: {
        userId,
        text,
        amount,
        category: category || 'Other',
        startDate: new Date(startDate),
        frequency,
        active: !!active,
      },
    });

    return NextResponse.json({ item: created });
  } catch (e) {
    console.error('Error creating recurring expense', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  try {
    const body = await req.json();
    const { id, text, amount, category, startDate, frequency, active } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const existing = await db.recurringExpense.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await db.recurringExpense.update({ where: { id }, data: {
      text: text ?? existing.text,
      amount: typeof amount === 'number' ? amount : existing.amount,
      category: category ?? existing.category,
      startDate: startDate ? new Date(startDate) : existing.startDate,
      frequency: frequency ?? existing.frequency,
      active: typeof active === 'boolean' ? active : existing.active,
    } });

    return NextResponse.json({ item: updated });
  } catch (e) {
    console.error('Error updating recurring expense', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await db.recurringExpense.deleteMany({ where: { id, userId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Error deleting recurring expense', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
