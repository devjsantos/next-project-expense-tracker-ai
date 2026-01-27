import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET(req: Request) {
  // 1. Security Check (Required for Vercel Cron)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();

    // 2. Find all active expenses where nextDueDate is today or in the past
    const dueExpenses = await db.recurringExpense.findMany({
      where: {
        active: true,
        status: 'active',
        OR: [
          { nextDueDate: { lte: today } },
          { nextDueDate: null } // Handle newly created rules that haven't run yet
        ]
      }
    });

    const results = await Promise.all(
      dueExpenses.map(async (expense) => {
        // Calculate the actual date it was due
        const baseDate = expense.nextDueDate || expense.startDate;

        // 3. Create the Transaction Record
        await db.records.create({
          data: {
            text: `[Auto] ${expense.text}`,
            amount: expense.amount,
            category: expense.category,
            userId: expense.userId,
            recurringId: expense.id,
            date: baseDate, // Log it on the actual due date
          },
        });

        // 4. Calculate Next Due Date based on frequency
        const nextDate = new Date(baseDate);
        if (expense.frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (expense.frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (expense.frequency === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }

        // 5. Update the Rule with the new date
        return db.recurringExpense.update({
          where: { id: expense.id },
          data: { nextDueDate: nextDate },
        });
      })
    );

    return NextResponse.json({ processed: results.length });
  } catch (error) {
    console.error('Cron Processing Error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}