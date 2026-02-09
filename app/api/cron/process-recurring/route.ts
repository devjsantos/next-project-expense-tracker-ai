import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();
    // 1. Get all active rules that are due or have never run
    const dueExpenses = await db.recurringExpense.findMany({
      where: {
        active: true,
        status: 'active',
        OR: [
          { nextDueDate: { lte: today } },
          { nextDueDate: null }
        ]
      }
    });

    let totalCreated = 0;

    for (const expense of dueExpenses) {
      let currentDueDate = expense.nextDueDate || expense.startDate;

      // 2. While loop to handle missed occurrences (Catch-up)
      while (currentDueDate <= today) {
        await db.records.create({
          data: {
            text: `[Auto] ${expense.text}`,
            amount: expense.amount,
            category: expense.category,
            userId: expense.userId,
            recurringId: expense.id,
            date: new Date(currentDueDate),
          },
        });

        totalCreated++;

        // Advance the date based on frequency
        const next = new Date(currentDueDate);
        if (expense.frequency === 'weekly') next.setDate(next.getDate() + 7);
        else if (expense.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
        else if (expense.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);

        currentDueDate = next;
      }

      // 3. Update the rule with the final nextDueDate
      await db.recurringExpense.update({
        where: { id: expense.id },
        data: { nextDueDate: currentDueDate },
      });
    }

    return NextResponse.json({ success: true, recordsCreated: totalCreated });
  } catch (error) {
    console.error('Cron Processing Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}