'use server';

import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function syncRecurringExpenses() {
  const { userId } = await auth();
  if (!userId) return { error: 'Unauthorized' };

  try {
    // 1. Fetch all active recurring rules for the user
    const rules = await db.recurringExpense.findMany({
      where: { userId, active: true },
      include: { records: { orderBy: { date: 'desc' }, take: 1 } }
    });

    const now = new Date();
    let createdCount = 0;

    for (const rule of rules) {
      // Find the last time this rule generated a record
      const lastRecord = rule.records[0];
      const lastProcessedDate = lastRecord ? new Date(lastRecord.date) : new Date(rule.startDate);

      // Determine if a new record is due
      let nextDueDate = new Date(lastProcessedDate);
      if (rule.frequency === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      else if (rule.frequency === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
      else if (rule.frequency === 'yearly') nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);

      // If today is past the next due date, create the record
      if (now >= nextDueDate) {
        await db.records.create({
          data: {
            userId: rule.userId,
            text: `[Auto] ${rule.text}`,
            amount: rule.amount,
            category: rule.category,
            date: nextDueDate, // Backdate to the actual due date
            recurringId: rule.id,
          }
        });
        createdCount++;
      }
    }

    return { success: true, createdCount };
  } catch (error) {
    console.error('Sync Error:', error);
    return { error: 'Failed to sync recurring expenses' };
  }
}